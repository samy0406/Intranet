// app/api/master-up/route.ts
import { NextRequest, NextResponse } from "next/server";
import { checkMasterHin, copyMasterHin, saveMasterUpRequest, assertActiveEmployeeMail } from "@/lib/db";
import { BusinessError } from "@/lib/errors";
import { MASTER_UP_MAX_ITEMS, MASTER_UP_ITEM_CODE_MAX_LENGTH, parseItemCodes } from "@/lib/constants";
import { notifyMasterUpFailure } from "@/lib/masterUpMail";

/** OracleエラーオブジェクトからエラーコードをORA-XXXXX形式で取り出す */
function extractOraCode(err: unknown): string | null {
  if (err && typeof err === "object" && "code" in err) {
    return String((err as { code: unknown }).code); // 例: "ORA-00054"
  }
  return null;
}

/** エラーオブジェクトから生のエラーメッセージを取り出す（履歴のERROR_MSG用） */
function extractErrMessage(err: unknown): string {
  return err instanceof Error ? err.message : String(err);
}

/** 1品目ぶんの処理結果（画面に返す形） */
type MasterUpResult = {
  itemCode: string;
  ok: boolean;
  itemName?: string;
  message?: string;
  oraCode?: string | null;
};

/** コピーまでの処理結果（履歴に書くための詳細も持つ） */
type CopyOutcome = MasterUpResult & {
  detail?: string; // 履歴に残す詳しいエラー内容（ORAのメッセージ原文など）
};

/**
 * 1品目を「存在チェック → コピー」まで処理する。
 * 例外は投げずに、成功・失敗を CopyOutcome として返す
 * （1件失敗しても残りの品目の処理を続けるため）
 */
async function copyOneItem(code: string): Promise<CopyOutcome> {
  // ── ① 品目コードの存在チェック ──
  let item;
  try {
    item = await checkMasterHin(code);
  } catch (err) {
    return {
      itemCode: code,
      ok: false,
      message: "品目コードの確認中にエラーが発生しました。",
      oraCode: extractOraCode(err),
      detail: extractErrMessage(err),
    };
  }
  if (!item) {
    return { itemCode: code, ok: false, message: "マスタ登録環境に存在しません。品目コードをご確認ください。" };
  }

  // ── ② マスタコピー実行（copyMasterHin内でwriteErrorLog済み・品目ごとに1トランザクション） ──
  try {
    await copyMasterHin(code);
  } catch (err) {
    return {
      itemCode: code,
      ok: false,
      itemName: item.itemName,
      message: "マスタのコピー中にエラーが発生しました。",
      oraCode: extractOraCode(err),
      detail: extractErrMessage(err),
    };
  }

  return { itemCode: code, ok: true, itemName: item.itemName };
}

/**
 * 1品目を処理して、結果を成功・失敗どちらでも履歴テーブルに書く
 */
async function processOneItem(code: string, address: string): Promise<MasterUpResult> {
  const { detail, ...outcome } = await copyOneItem(code);

  // ── ③ 申請履歴の保存（成功・失敗どちらも） ──
  try {
    await saveMasterUpRequest({
      itemCode: code,
      mail: address,
      result: outcome.ok ? "OK" : "NG",
      // 画面用の説明文 + ORAの原文 をつなげて保存（失敗時のみ）
      errorMsg: outcome.ok ? undefined : [outcome.message, detail].filter(Boolean).join(" / "),
      oraCode: outcome.oraCode,
    });
  } catch (err) {
    // 履歴が書けなかった場合（saveMasterUpRequest内でwriteErrorLog済み）
    if (outcome.ok) {
      // コピー自体は完了しているので、その旨が分かるメッセージにする
      return { ...outcome, ok: false, message: "コピーは完了しましたが、申請履歴の保存に失敗しました。", oraCode: extractOraCode(err) };
    }
    // もともと失敗していた場合は、元のエラー内容をそのまま返す
  }

  return outcome;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { itemCodes, mail } = body as { itemCodes?: unknown; mail?: string };

    // ── サーバー側バリデーション ────────────────────
    // 画面を通さず直接APIを叩かれる場合に備えて、サーバー側でも整形し直す
    const codes = Array.isArray(itemCodes) ? parseItemCodes(itemCodes.map(String).join("\n")) : [];
    if (codes.length === 0) {
      return NextResponse.json({ message: "品目コードは必須です" }, { status: 400 });
    }
    if (codes.length > MASTER_UP_MAX_ITEMS) {
      return NextResponse.json({ message: `一度に申請できるのは${MASTER_UP_MAX_ITEMS}件までです` }, { status: 400 });
    }
    const tooLong = codes.filter((c) => c.length > MASTER_UP_ITEM_CODE_MAX_LENGTH);
    if (tooLong.length > 0) {
      return NextResponse.json({ message: `${MASTER_UP_ITEM_CODE_MAX_LENGTH}文字を超える品目コードがあります：${tooLong.join(", ")}` }, { status: 400 });
    }
    if (!mail || mail.trim() === "") {
      return NextResponse.json({ message: "メールアドレスは必須です" }, { status: 400 });
    }

    const address = mail.trim();

    // ── 社員マスタに在籍中のメールアドレスか確認（全品目共通なので最初に1回だけ） ──
    await assertActiveEmployeeMail(address);

    // ── 品目を1件ずつ順番に処理 ──
    // Promise.all で並列にせず for...of + await にしているのは、
    // 同じテーブルへの DELETE/INSERT が同時に走ってロック競合するのを避けるため
    const results: MasterUpResult[] = [];
    for (const code of codes) {
      results.push(await processOneItem(code, address));
    }

    const successCount = results.filter((r) => r.ok).length;

    // ── 失敗があれば申請者にメール通知 ──
    // awaitしない＝メール送信の完了を待たずに画面へ結果を返す（Teams通知と同じ考え方）
    void notifyMasterUpFailure({
      mail: address,
      totalCount: codes.length,
      successCount,
      failedItems: results.filter((r) => !r.ok),
    });

    return NextResponse.json({
      message: `${codes.length}件中${successCount}件のマスタコピーが完了しました`,
      results,
    });
  } catch (err) {
    // 業務エラー（メールアドレス未登録など）は、そのメッセージとステータスで返す
    if (err instanceof BusinessError) {
      return NextResponse.json({ message: err.message }, { status: err.status });
    }

    console.error("POST /api/master-up エラー:", err);
    return NextResponse.json({ message: "サーバーエラーが発生しました。", oraCode: extractOraCode(err) }, { status: 500 });
  }
}

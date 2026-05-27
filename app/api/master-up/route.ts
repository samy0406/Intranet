// app/api/master-up/route.ts
import { NextRequest, NextResponse } from "next/server";
import { checkMasterHin, copyMasterHin, saveMasterUpRequest } from "@/lib/db";

/** OracleエラーオブジェクトからエラーコードをORA-XXXXX形式で取り出す */
function extractOraCode(err: unknown): string | null {
  if (err && typeof err === "object" && "code" in err) {
    return String((err as { code: unknown }).code); // 例: "ORA-00054"
  }
  return null;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { itemCode, mail } = body as { itemCode?: string; mail?: string };

    // ── サーバー側バリデーション ────────────────────
    if (!itemCode || itemCode.trim() === "") {
      return NextResponse.json({ message: "品目コードは必須です" }, { status: 400 });
    }
    if (!mail || mail.trim() === "") {
      return NextResponse.json({ message: "メールアドレスは必須です" }, { status: 400 });
    }

    const code = itemCode.trim();
    const address = mail.trim();

    // ── ① 品目コードの存在チェック ──
    let item;
    try {
      item = await checkMasterHin(code);
    } catch (err) {
      // エラーコードをクライアントに返す（管理者への連絡時に使用）
      return NextResponse.json({ message: "品目コードの確認中にエラーが発生しました。", oraCode: extractOraCode(err) }, { status: 500 });
    }

    if (!item) {
      return NextResponse.json({ message: `品目コード「${code}」はマスタ登録環境に存在しません。品目コードをご確認ください。` }, { status: 404 });
    }

    // ── ② マスタコピー実行（copyMasterHin内でwriteErrorLog済み） ──
    try {
      await copyMasterHin(code);
    } catch (err) {
      // エラーコードをクライアントに返す（管理者への連絡時に使用）
      return NextResponse.json({ message: "マスタのコピー中にエラーが発生しました。", oraCode: extractOraCode(err) }, { status: 500 });
    }

    // ── ③ 申請ログ保存 ──
    try {
      await saveMasterUpRequest(code, address);
    } catch (err) {
      // エラーコードをクライアントに返す（管理者への連絡時に使用）
      return NextResponse.json({ message: "申請ログの保存中にエラーが発生しました。", oraCode: extractOraCode(err) }, { status: 500 });
    }

    return NextResponse.json({
      message: "マスタコピーが完了しました",
      itemName: item.itemName,
    });
  } catch (err) {
    console.error("POST /api/master-up エラー:", err);
    return NextResponse.json({ message: "サーバーエラーが発生しました。", oraCode: extractOraCode(err) }, { status: 500 });
  }
}

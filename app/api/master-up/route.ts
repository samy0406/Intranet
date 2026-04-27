// app/api/master-up/route.ts
import { NextRequest, NextResponse } from "next/server";
import { checkMasterHin, copyMasterHin, saveMasterUpRequest } from "@/lib/db";

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

    // ── ① 品目コードの存在チェック（CHECK_MASTER_HIN.SQL相当） ──
    const item = await checkMasterHin(code);
    if (!item) {
      return NextResponse.json({ message: `品目コード「${code}」はマスタ登録環境に存在しません。品目コードをご確認ください。` }, { status: 404 });
    }

    // ── ② マスタコピー実行（COPY_MASTER_HIN.SQL相当） ──────────
    await copyMasterHin(code);

    // ── ③ 申請ログ保存（W_TBL_MASTER_UP_REQ） ───────────────────
    await saveMasterUpRequest(code, address);

    return NextResponse.json({
      message: "マスタコピーが完了しました",
      itemName: item.itemName, // 完了画面で品名を表示するために返す
    });
  } catch (err) {
    console.error("POST /api/master-up エラー:", err);
    return NextResponse.json({ message: "サーバーエラーが発生しました。管理者に連絡してください。" }, { status: 500 });
  }
}

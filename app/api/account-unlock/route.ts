// account-unlock/route.ts
import { NextRequest, NextResponse } from "next/server";
import { findAccountUnlock, deleteAccountUnlock, insertUnlockRecord, assertActiveEmployeeMail } from "@/lib/db";
import { BusinessError } from "@/lib/errors";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    // await = データが届くまで待つ
    const body = await request.json(); // ① JSONとして読む
    const mail = body.mail as string; // ② 「mail」を取り出す
    const accountCode = body.accountCode as string; // ③ 「accountCode」を取り出す
    if (!mail || !accountCode) {
      return NextResponse.json({ status: "error", message: "必須項目を入力してください" }, { status: 400 });
    }

    // 存在確認
    const exists = await findAccountUnlock(accountCode);

    if (!exists) {
      // T_LOGIN にない = 現在ログインされていない
      return NextResponse.json({ status: "error", message: "現在ログインされていません" }, { status: 400 });
    }

    await assertActiveEmployeeMail(mail);

    // T_LOGIN から削除（ロック解除）
    await deleteAccountUnlock(accountCode);
    // W_TBL_UNLOCK に記録を追加
    await insertUnlockRecord(accountCode, mail);

    return NextResponse.json({ status: "ok", message: "解除しました" });
  } catch (error) {
    // 業務エラー（メールアドレス未登録など）は、そのメッセージとステータスで返す
    if (error instanceof BusinessError) {
      return NextResponse.json({ status: "error", message: error.message }, { status: error.status });
    }
    // それ以外は想定外のエラー
    console.error("DB error:", error);
    return NextResponse.json({ status: "error", message: "サーバーエラーが発生しました" }, { status: 500 });
  }
}

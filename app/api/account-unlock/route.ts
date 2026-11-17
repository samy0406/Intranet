// account-unlock/route.ts
import { NextRequest, NextResponse } from "next/server";
import { findAccountUnlock, unlockAccount, assertActiveEmployeeMail } from "@/lib/db";
import { BusinessError } from "@/lib/errors";
import { isAccountType } from "@/lib/constants";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    // await = データが届くまで待つ
    const body = await request.json(); // ① JSONとして読む
    const mail = body.mail as string; // ② 「mail」を取り出す
    const accountCode = body.accountCode as string; // ③ 「accountCode」を取り出す
    const accountType: unknown = body.accountType;

    if (!mail || !accountCode || !accountType) {
      return NextResponse.json({ status: "error", message: "必須項目を入力してください" }, { status: 400 });
    }

    // 定義済みの種類以外は、ここで弾く
    if (!isAccountType(accountType)) {
      return NextResponse.json({ status: "error", message: "アカウントの種類が正しくありません" }, { status: 400 });
    }

    // 存在確認
    const exists = await findAccountUnlock(accountType, accountCode);

    if (!exists) {
      // T_LOGIN にない = 現在ログインされていない
      return NextResponse.json({ status: "error", message: "現在ログインされていません" }, { status: 400 });
    }

    await assertActiveEmployeeMail(mail);

    // 記録の追加とロック解除をまとめて実行
    await unlockAccount(accountType, accountCode, mail);

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

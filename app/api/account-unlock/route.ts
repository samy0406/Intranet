import { NextRequest, NextResponse } from "next/server";
import { findAccountUnlock, deleteAccountUnlock } from "@/lib/db-account-unlock";

export async function POST(request: NextRequest) {
  try {
    // await = データが届くまで待つ
    const data = await request.formData();
    const department = data.get("department") as string;
    const name = data.get("name") as string;
    const mail = data.get("mail") as string;
    const accountCode = data.get("accountCode") as string;

    if (!department || !name || !mail || !accountCode) {
      return NextResponse.json({ status: "error", message: "必須項目を入力してください" }, { status: 400 });
    }

    // 存在確認
    const exists = await findAccountUnlock(accountCode);

    if (!exists) {
      // T_LOGIN にない = 現在ログインされていない
      return NextResponse.json({ status: "error", message: "現在ログインされていません" }, { status: 400 });
    }

    // T_LOGIN から削除（ロック解除）
    await deleteAccountUnlock(accountCode);

    return NextResponse.json({ status: "ok", message: "解除しました" });
  } catch (error) {
    console.error("DB error:", error);
    return NextResponse.json({ status: "error", message: "サーバーエラーが発生しました" }, { status: 500 });
  }
}

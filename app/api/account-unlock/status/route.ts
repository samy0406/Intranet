import { NextRequest, NextResponse } from "next/server";
import { findAccountUnlock } from "@/lib/db-account-unlock";

// GETリクエスト：アカウントコードで検索
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const accountCode = searchParams.get("accountCode");

    if (!accountCode) {
      return NextResponse.json({ found: false, message: "アカウントコードを入力してください" }, { status: 400 });
    }

    // DBから検索
    const found = await findAccountUnlock(accountCode);
    return NextResponse.json({ found });
  } catch (error) {
    console.error("DB error:", error);
    return NextResponse.json({ found: false, message: "サーバーエラーが発生しました" }, { status: 500 });
  }
}

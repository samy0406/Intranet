import { NextRequest, NextResponse } from "next/server";
import { findAccountUnlock } from "@/lib/db";
import { isAccountType } from "@/lib/constants";

// GETリクエスト:アカウントの種類とコードで検索
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const accountType = searchParams.get("accountType");
    const accountCode = searchParams.get("accountCode");

    if (!accountType || !accountCode) {
      return NextResponse.json({ found: false, message: "アカウントの種類とコードを入力してください" }, { status: 400 });
    }

    // 定義済みの種類以外は、ここで弾く
    if (!isAccountType(accountType)) {
      return NextResponse.json({ found: false, message: "アカウントの種類が正しくありません" }, { status: 400 });
    }

    // 選択された種類のDB・テーブルから検索
    const found = await findAccountUnlock(accountType, accountCode);
    return NextResponse.json({ found });
  } catch (error) {
    console.error("DB error:", error);
    return NextResponse.json({ found: false, message: "サーバーエラーが発生しました" }, { status: 500 });
  }
}

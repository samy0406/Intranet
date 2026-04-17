import { NextRequest, NextResponse } from "next/server";
import { getJudgmentStatusForCheck } from "@/lib/db";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const itemCode = searchParams.get("itemCode");
  const lotNo = searchParams.get("lotNo");

  if (!itemCode || !lotNo) {
    return NextResponse.json({ status: "error", message: "パラメータが不足しています" }, { status: 400 });
  }

  try {
    const item = await getJudgmentStatusForCheck(itemCode, lotNo);
    return NextResponse.json({ items: item ? [{ itemCode, lotNo, ...item }] : [] });
  } catch {
    return NextResponse.json({ status: "error", message: "サーバーエラーが発生しました" }, { status: 500 });
  }
}

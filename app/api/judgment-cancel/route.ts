import { NextRequest, NextResponse } from "next/server";
import { cancelJudgment } from "@/lib/db";

export async function POST(request: NextRequest) {
  const data = await request.formData();
  const mail = data.get("mail") as string;
  const itemCode = data.get("itemCode") as string;
  const lotNo = data.get("lotNo") as string;

  if (!mail || !itemCode || !lotNo) {
    return NextResponse.json({ status: "error", message: "必須項目を入力してください" }, { status: 400 });
  }

  try {
    await cancelJudgment(itemCode, lotNo, mail);
    return NextResponse.json({ status: "ok", message: "申請を受け付けました" });
  } catch (err) {
    const message = err instanceof Error ? err.message : "サーバーエラーが発生しました";
    return NextResponse.json({ status: "error", message }, { status: 500 });
  }
}

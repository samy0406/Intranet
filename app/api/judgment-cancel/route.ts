import { NextResponse } from "next/server";
import { cancelJudgment } from "@/lib/db";
import { BusinessError } from "@/lib/errors";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { mail, itemCode, lotNo } = body;

    if (!mail || !itemCode || !lotNo) {
      return NextResponse.json({ status: "error", message: "必須項目を入力してください" }, { status: 400 });
    }

    await cancelJudgment(itemCode, lotNo, mail);

    return NextResponse.json({ status: "ok", message: "申請を受け付けました" });
  } catch (err) {
    console.error("エラー:", err);

    if (err instanceof BusinessError) {
      return NextResponse.json({ status: "error", message: err.message }, { status: err.status });
    }

    return NextResponse.json({ status: "error", message: "サーバーエラーが発生しました" }, { status: 500 });
  }
}

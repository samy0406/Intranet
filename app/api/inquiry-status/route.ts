import { NextRequest, NextResponse } from "next/server";
import { getInquiriesByEmail } from "@/lib/db";

// GET /api/inquiry-status?mail=xxx
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const mail = searchParams.get("mail")?.trim() ?? "";

  if (!mail) {
    return NextResponse.json({ status: "error", message: "メールアドレスを入力してください" }, { status: 400 });
  }

  try {
    const data = await getInquiriesByEmail(mail);
    return NextResponse.json({ status: "ok", data });
  } catch (err) {
    console.error("getInquiriesByEmail エラー:", err);
    return NextResponse.json({ status: "error", message: "データ取得に失敗しました" }, { status: 500 });
  }
}

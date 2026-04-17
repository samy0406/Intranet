// app/api/storage-extension/route.ts
import { NextRequest, NextResponse } from "next/server";
import { updateHokanKigen } from "@/lib/db";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { mail, itemCode, lotNo, expiryDate } = body;

    if (!mail || !itemCode || !lotNo || !expiryDate) {
      return NextResponse.json({ status: "error", message: "必須項目を入力してください" }, { status: 400 });
    }

    await updateHokanKigen(itemCode, lotNo, expiryDate, mail);

    return NextResponse.json({ status: "ok", message: "申請を受け付けました" });
  } catch {
    return NextResponse.json({ status: "error", message: "サーバーエラーが発生しました" }, { status: 500 });
  }
}

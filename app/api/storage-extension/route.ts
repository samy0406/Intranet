import { NextRequest, NextResponse } from "next/server";
import { updateHokanKigen } from "@/lib/db";

export async function POST(request: NextRequest) {
  try {
    // 品目配列を含むためJSONで受け取る
    const body = await request.json();
    const { department, name, mail, items } = body;

    if (!department || !name || !mail || !items?.length) {
      return NextResponse.json({ status: "error", message: "必須項目を入力してください" }, { status: 400 });
    }

    // items を順番に処理（1件でも失敗すると throw してロールバック）
    for (const item of items as { itemCode: string; lotNo: string; expiryDate: string }[]) {
      await updateHokanKigen(item.itemCode, item.lotNo, item.expiryDate);
    }

    return NextResponse.json({ status: "ok", message: "申請を受け付けました" });
  } catch {
    return NextResponse.json({ status: "error", message: "サーバーエラーが発生しました" }, { status: 500 });
  }
}

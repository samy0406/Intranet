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
  } catch (err) {
    // 重複申請（ORA-00001由来）などdb.tsが投げた日本語メッセージは画面にそのまま返す
    const message = err instanceof Error ? err.message : "サーバーエラーが発生しました";
    return NextResponse.json({ status: "error", message }, { status: 500 });
  }
}

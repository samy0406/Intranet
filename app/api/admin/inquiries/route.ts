// app/api/admin/inquiries/route.ts
import { NextResponse } from "next/server";
import { getAllInquiries } from "@/lib/db";

export async function GET() {
  try {
    // lib/db.ts の getAllInquiries() でOracle DBから全件取得
    // SQL内でステータスは CASE WHEN CLOSED_DATE IS NOT NULL THEN '完了' ELSE '未対応' で判定済み
    const inquiries = await getAllInquiries();
    return NextResponse.json(inquiries);
  } catch (error) {
    const msg = error instanceof Error ? error.message : "サーバーエラー";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

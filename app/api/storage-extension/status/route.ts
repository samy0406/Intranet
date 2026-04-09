import { NextRequest, NextResponse } from "next/server";
import { getHokanKigen } from "@/lib/db";

// GET /api/storage-extension/status?itemCode=ITM-001&lotNo=LOT-2024001
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const itemCode = searchParams.get("itemCode");
    const lotNo = searchParams.get("lotNo");

    if (!itemCode || !lotNo) {
      return NextResponse.json({ items: [], message: "品目コードとロットNOを入力してください" }, { status: 400 });
    }

    const row = await getHokanKigen(itemCode.trim(), lotNo.trim());

    if (!row) {
      return NextResponse.json({ items: [] });
    }

    return NextResponse.json({
      items: [
        {
          itemCode: row.itemCode,
          lotNo: row.lotNo,
          expiryDate: row.expiryDate, // "YYYY/MM/DD" 形式
          itemName: row.itemName, // 品名（任意で使える）
          makerExpiry: row.makerExpiry, // メーカ期限（任意で使える）
        },
      ],
    });
  } catch {
    return NextResponse.json({ items: [], message: "サーバーエラーが発生しました" }, { status: 500 });
  }
}

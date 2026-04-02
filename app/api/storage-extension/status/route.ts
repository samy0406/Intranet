import { NextRequest, NextResponse } from "next/server";
import { readFile } from "fs/promises";
import { existsSync } from "fs";
import path from "path";

const DATA_FILE = path.join(process.cwd(), "uploads", "storage_extension.json");

// 保存データの型
type SavedRecord = {
  id: number;
  department: string;
  name: string;
  items: {
    id: number;
    itemCode: string;
    lotNo: string;
    expiryDate: string;
  }[];
  createdAt: string;
};

// GET /api/storage-extension/status?itemCode=ITM-001&lotNo=LOT-2024001
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const itemCode = searchParams.get("itemCode");
    const lotNo    = searchParams.get("lotNo");

    if (!itemCode || !lotNo) {
      return NextResponse.json(
        { items: [], message: "品目コードとロットNOを入力してください" },
        { status: 400 }
      );
    }

    // ── DB未準備のためJSONファイルで代替 ──────────────
    // DB接続後はここをDBクエリに置き換える
    // 例：
    // SELECT item_code, lot_no, expiry_date
    // FROM storage_extension_items
    // WHERE item_code = :itemCode AND lot_no = :lotNo
    if (!existsSync(DATA_FILE)) {
      return NextResponse.json({ items: [] });
    }

    const raw     = await readFile(DATA_FILE, "utf-8");
    const records = JSON.parse(raw) as SavedRecord[];

    // 全レコードのitemsをフラットに展開して一致するものを探す
    // flatMap = 配列の配列を1次元に展開しながらmapする
    const matched = records
      .flatMap((record) => record.items)
      .filter(
        (item) =>
          item.itemCode.toLowerCase() === itemCode.toLowerCase() &&
          item.lotNo.toLowerCase()    === lotNo.toLowerCase()
      )
      .map((item) => ({
        itemCode:   item.itemCode,
        lotNo:      item.lotNo,
        expiryDate: item.expiryDate,
      }));

    return NextResponse.json({ items: matched });

  } catch {
    return NextResponse.json(
      { items: [], message: "サーバーエラーが発生しました" },
      { status: 500 }
    );
  }
}

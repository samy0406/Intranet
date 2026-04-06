// ============================================================
// 申請一覧取得 API Route
// 場所: app/api/admin/inquiries/route.ts
//
// GET /api/admin/inquiries
//  → uploads/inquiries.json を読み込んで全件返す
//  → statusフィールドがなければデフォルト "未対応" を補完する
// ============================================================

import { NextResponse } from "next/server";
import { readFile } from "fs/promises";
import { existsSync } from "fs";
import path from "path";

// inquiries.json のパス（app/api/submit/route.ts と同じパスを参照）
const TEXT_DATA_FILE = path.join(process.cwd(), "uploads", "inquiries.json");

export async function GET() {
  try {
    // ファイルが存在しない場合は空配列を返す
    if (!existsSync(TEXT_DATA_FILE)) {
      return NextResponse.json([]);
    }

    // ファイルを読み込んでJSONパース
    const raw = await readFile(TEXT_DATA_FILE, "utf-8");
    const inquiries: Record<string, unknown>[] = JSON.parse(raw);

    // statusフィールドを持っていない古いレコードに "未対応" を補完
    // ?? "未対応" = nullまたはundefinedのときだけ右辺を使う
    const normalized = inquiries.map((item) => ({
      ...item,
      status:       item.status       ?? "未対応",
      mail:         item.mail         ?? "",
      handler:      item.handler      ?? "",  // 対応者（未記入なら空文字）
      completedAt:  item.completedAt  ?? "",  // 完了日付（未記入なら空文字）
      responseNote: item.responseNote ?? "",  // 対応内容（未記入なら空文字）
    }));

    // 新しい順（createdAt降順）に並び替えて返す
    // sort() = 配列を並び替える。返り値が負なら a が前、正なら b が前
    normalized.sort((a, b) => {
      const aTime = new Date(a.createdAt as string).getTime();
      const bTime = new Date(b.createdAt as string).getTime();
      return bTime - aTime; // 新しい順
    });

    return NextResponse.json(normalized);
  } catch (error) {
    const msg = error instanceof Error ? error.message : "サーバーエラー";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

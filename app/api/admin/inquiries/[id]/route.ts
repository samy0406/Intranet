// ============================================================
// 申請詳細取得 & ステータス更新 API Route
// 場所: app/api/admin/inquiries/[id]/route.ts
//
// GET  /api/admin/inquiries/[id]  → 1件取得
// PATCH /api/admin/inquiries/[id] → ステータスを更新
// ============================================================

import { NextRequest, NextResponse } from "next/server";
import { readFile, writeFile } from "fs/promises";
import { existsSync } from "fs";
import path from "path";

// inquiries.json のパス
const TEXT_DATA_FILE = path.join(process.cwd(), "uploads", "inquiries.json");

// ── ファイル読み込みユーティリティ ────────────────────────
// Record<string, unknown>[] = 「キーが文字列、値が何でもよいオブジェクト」の配列
async function readInquiries(): Promise<Record<string, unknown>[]> {
  if (!existsSync(TEXT_DATA_FILE)) return [];
  const raw = await readFile(TEXT_DATA_FILE, "utf-8");
  return JSON.parse(raw);
}

// ── GET: 1件取得 ──────────────────────────────────────────
export async function GET(
  _request: NextRequest,
  // context.params.id = URLの [id] 部分（例: "/api/admin/inquiries/123" → "123"）
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const inquiries = await readInquiries();

    // Number(id) = 文字列 "123" を数値 123 に変換
    const target = inquiries.find((item) => item.id === Number(id));

    if (!target) {
      // 見つからなければ404を返す
      return NextResponse.json({ error: "見つかりません" }, { status: 404 });
    }

    // statusが未設定の古いデータに補完
    return NextResponse.json({
      ...target,
      status: target.status ?? "未対応",
      mail:   target.mail   ?? "",
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "サーバーエラー";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

// ── PATCH: フィールド更新 ─────────────────────────────────
// status / handler / completedAt / responseNote を個別に更新できる
export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const body   = await request.json(); // リクエストボディをJSONで受け取る

    // 更新を許可するフィールド名の一覧
    // ← これ以外のフィールドは上書きできないようにセキュリティ対策
    const ALLOWED_FIELDS = ["status", "handler", "completedAt", "responseNote"] as const;
    type AllowedField = typeof ALLOWED_FIELDS[number];

    // ステータスの値チェック（statusが含まれている場合のみ）
    if ("status" in body) {
      const VALID_STATUSES = ["未対応", "対応中", "完了"];
      if (!VALID_STATUSES.includes(body.status)) {
        return NextResponse.json({ error: "無効なステータス値です" }, { status: 400 });
      }
    }

    // bodyから許可フィールドだけを取り出す
    // reduce() = 配列を1つのオブジェクトに畳み込む
    const patch = ALLOWED_FIELDS.reduce<Partial<Record<AllowedField, string>>>(
      (acc, key) => {
        if (key in body) acc[key] = body[key]; // bodyにそのキーがあれば採用
        return acc;
      },
      {}
    );

    if (Object.keys(patch).length === 0) {
      return NextResponse.json({ error: "更新するフィールドがありません" }, { status: 400 });
    }

    const inquiries = await readInquiries();

    // 対象レコードを見つけて、patchの内容だけ上書きする
    let found = false;
    const updated = inquiries.map((item) => {
      if (item.id === Number(id)) {
        found = true;
        return { ...item, ...patch }; // スプレッド構文でpatchのキーだけ上書き
      }
      return item;
    });

    if (!found) {
      return NextResponse.json({ error: "見つかりません" }, { status: 404 });
    }

    // 更新した配列をファイルに書き戻す
    await writeFile(TEXT_DATA_FILE, JSON.stringify(updated, null, 2), "utf-8");

    return NextResponse.json({ status: "ok" });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "サーバーエラー";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

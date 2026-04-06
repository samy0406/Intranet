// app/api/admin/inquiries/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getInquiryById, closeInquiry, updateInquiryField } from "@/lib/db";

// ── GET: 1件取得 ──────────────────────────────────────────
export async function GET(_request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    const inquiry = await getInquiryById(Number(id));

    if (!inquiry) {
      return NextResponse.json({ error: "見つかりません" }, { status: 404 });
    }
    return NextResponse.json(inquiry);
  } catch (error) {
    const msg = error instanceof Error ? error.message : "サーバーエラー";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

// ── PATCH: フィールド更新 or 完了処理 ────────────────────
// 2パターンのリクエストを受け付ける：
//
// パターンA（自動保存）: { field: "closedName" | "responseDetail", value: "..." }
//   → onBlur時に1フィールドだけ保存
//
// パターンB（完了処理）: { action: "close", closedName: "...", responseDetail: "..." }
//   → CLOSED_DATE=SYSDATE をセットして完了にする
export async function PATCH(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    const body = await request.json();

    // ── パターンB: 完了処理 ──────────────────────────────
    if (body.action === "close") {
      if (!body.closedName) {
        return NextResponse.json({ error: "対応者名（closedName）は必須です" }, { status: 400 });
      }
      await closeInquiry(Number(id), body.closedName, body.responseDetail ?? "");
      return NextResponse.json({ status: "ok" });
    }

    // ── パターンA: 個別フィールド自動保存 ───────────────
    const FIELD_MAP = {
      closedName: "CLOSED_NAME",
      responseDetail: "RESPONSE_DETAIL",
    } as const;

    const column = FIELD_MAP[body.field as keyof typeof FIELD_MAP];
    if (!column) {
      return NextResponse.json({ error: "無効なフィールド名です" }, { status: 400 });
    }

    await updateInquiryField(Number(id), column, body.value ?? "");
    return NextResponse.json({ status: "ok" });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "サーバーエラー";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

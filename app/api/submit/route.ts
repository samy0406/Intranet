import { NextRequest, NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import { saveInquiry } from "@/lib/db"; // ← コメントアウトを解除
import { ApiResponse } from "@/types/inquiry";

const ALLOWED_EXTENSIONS = [".pdf", ".doc", ".docx", ".xls", ".xlsx", ".png", ".jpg", ".jpeg"];
const MAX_SIZE = 10 * 1024 * 1024; // 10MB
const UPLOAD_DIR = path.join(process.cwd(), "uploads");

// ── ファイル保存ユーティリティ（DBテーブルにカラムがないためディスクのみ） ──
async function saveFile(file: File, prefix: string): Promise<string | null> {
  if (!file || file.size === 0) return null;
  const ext = path.extname(file.name).toLowerCase();
  if (!ALLOWED_EXTENSIONS.includes(ext)) throw new Error(`許可されていないファイル形式です: ${ext}`);
  if (file.size > MAX_SIZE) throw new Error("ファイルサイズは10MB以下にしてください");
  await mkdir(UPLOAD_DIR, { recursive: true });
  const filename = `${prefix}_${Date.now()}${ext}`;
  await writeFile(path.join(UPLOAD_DIR, filename), Buffer.from(await file.arrayBuffer()));
  return filename;
}

export async function POST(request: NextRequest): Promise<NextResponse<ApiResponse>> {
  try {
    const data = await request.formData();

    // ── フォームから値を取り出す ──────────────────────
    // data.get("キー名") でフォームの各フィールドを取得
    const name = data.get("name") as string;
    const department = data.get("department") as string;
    const title = data.get("title") as string;
    const urgency = data.get("urgency") as string;
    const screenPath = data.get("screenPath") as string;
    const message = data.get("message") as string; // 経緯 → BACKGROUND
    const resolution = data.get("resolution") as string; // 対応希望内容 → REQ_ACTON
    const mail = data.get("mail") as string;
    const reason = data.get("reason") as string; // 至急の理由 → URGENT_REASON
    const approver = data.get("approver") as string; // 承認者 → URGENT_APPROVAL
    const file = data.get("file") as File | null;
    const screenshot = data.get("screenshot") as File | null;

    // ── バリデーション ─────────────────────────────────
    if (!name || !title || !urgency || !message || !resolution) {
      return NextResponse.json({ status: "error", message: "必須項目を入力してください" }, { status: 400 });
    }

    // ── ファイル・スクリーンショットをディスクに保存 ──
    // ※ DBテーブルにカラムがないためファイル名はDBに登録しない
    await saveFile(file as File, "file");
    await saveFile(screenshot as File, "screenshot");

    // ── Oracle DB に保存 ──────────────────────────────
    // フォームのキー名 → DBカラム名に対応させて渡す
    await saveInquiry({
      inquiry_name: name,
      busyo: department,
      mailaddress: mail,
      title: title,
      urgency: urgency,
      urgentReason: reason, // フォーム: reason     → DB: URGENT_REASON
      urgentApproval: approver, // フォーム: approver   → DB: URGENT_APPROVAL
      howtoOpenScreen: screenPath, // フォーム: screenPath → DB: HOWTO_OPEN_SCREEN
      background: message, // フォーム: message    → DB: BACKGROUND
      reqAction: resolution, // フォーム: resolution → DB: REQ_ACTION
    });

    return NextResponse.json({ status: "ok", message: "送信完了しました" });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "サーバーエラーが発生しました";
    return NextResponse.json({ status: "error", message: msg }, { status: 500 });
  }
}

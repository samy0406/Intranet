import { NextRequest, NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import { saveInquiry } from "@/lib/db"; // ← コメントアウトを解除
import { ApiResponse } from "@/types/inquiry";

// ── Boxにフォルダを作成してファイルをアップロード ──
async function sendFilesToBox(
  files: { buffer: Buffer; filename: string; mimetype: string }[],
  parentFolderId: string, // 親フォルダID（.env.localのBOX_FOLDER_ID）
  token: string,
  inquiryId: string, // 申請ID（フォルダ名に使う）
) {
  if (files.length === 0) return;

  // ── Step1: 新しいフォルダを作成 ──────────────────
  // フォルダ名：ID_日付（例：1744123456789_20260408）
  const today = new Date()
    .toLocaleDateString("ja-JP", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    })
    .replace(/\//g, ""); // "2026/04/08" → "20260408"

  const folderName = `${inquiryId}_${today}`;

  // Box API でフォルダ作成
  const folderRes = await fetch("https://api.box.com/2.0/folders", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      name: folderName,
      parent: { id: parentFolderId }, // どの親フォルダの下に作るか
    }),
  });

  if (!folderRes.ok) {
    const err = await folderRes.json();
    console.error("[Boxフォルダ作成エラー]", err);
    return;
  }

  // 作成したフォルダのIDを取得（ファイルアップロード先として使う）
  const folderData = await folderRes.json();
  const newFolderId = folderData.id; // ← 新しく作ったフォルダのID

  // ── Step2: 作成したフォルダにファイルをアップロード ──
  for (const f of files) {
    const form = new FormData();
    form.append(
      "attributes",
      JSON.stringify({
        name: f.filename,
        parent: { id: newFolderId }, // 新しく作ったフォルダに入れる
      }),
    );
    form.append("file", new Blob([f.buffer], { type: f.mimetype }), f.filename);

    const res = await fetch("https://upload.box.com/api/2.0/files/content", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: form,
    });

    if (!res.ok) {
      const err = await res.json();
      console.error("[Boxアップロードエラー]", err);
    }
  }
}

const UPLOAD_DIR = path.join(process.cwd(), "uploads");

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

    // ── ファイルのバリデーション ──
    const ALLOWED_EXTENSIONS = [".pdf", ".doc", ".docx", ".xls", ".xlsx", ".png", ".jpg", ".jpeg"];
    const MAX_SIZE = 10 * 1024 * 1024; // 10MB

    if (file && file.size > 0) {
      const ext = path.extname(file.name).toLowerCase();
      if (!ALLOWED_EXTENSIONS.includes(ext)) {
        return NextResponse.json({ status: "error", message: `許可されていないファイル形式です: ${ext}` }, { status: 400 });
      }
      if (file.size > MAX_SIZE) {
        return NextResponse.json({ status: "error", message: "ファイルサイズは10MB以下にしてください" }, { status: 400 });
      }
    }

    // ── 先にBufferとして読み込む（arrayBufferは1回しか読めないため） ──
    const fileBuffer = file && file.size > 0 ? Buffer.from(await file.arrayBuffer()) : null;
    const screenshotBuffer = screenshot && screenshot.size > 0 ? Buffer.from(await screenshot.arrayBuffer()) : null;

    // ── ディスクに保存 ──
    if (fileBuffer && file) {
      const ext = path.extname(file.name).toLowerCase();
      await mkdir(UPLOAD_DIR, { recursive: true });
      await writeFile(path.join(UPLOAD_DIR, `file_${Date.now()}${ext}`), fileBuffer);
    }
    if (screenshotBuffer) {
      await mkdir(UPLOAD_DIR, { recursive: true });
      await writeFile(path.join(UPLOAD_DIR, `screenshot_${Date.now()}.png`), screenshotBuffer);
    }

    // ── Box送信用の配列を組み立て ──
    const filesToSend: { buffer: Buffer; filename: string; mimetype: string }[] = [];

    if (fileBuffer && file) {
      filesToSend.push({
        buffer: fileBuffer,
        filename: `${Date.now()}_${file.name}`,
        mimetype: file.type || "application/octet-stream",
      });
    }
    if (screenshotBuffer && screenshot) {
      filesToSend.push({
        buffer: screenshotBuffer,
        filename: `${Date.now()}_screenshot.png`,
        mimetype: screenshot.type || "image/png",
      });
    }

    // ── Oracle DB に保存 ──────────────────────────────
    // フォームのキー名 → DBカラム名に対応させて渡す
    const savedId = await saveInquiry({
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

    // ── Box へファイルを送信 ──────────────────────────
    if (filesToSend.length > 0) {
      const token = process.env.BOX_DEV_TOKEN!;
      const folderId = process.env.BOX_FOLDER_ID!;
      const inquiryId = savedId.toString(); // ← DBのIDを使う

      sendFilesToBox(filesToSend, folderId, token, inquiryId).catch((err) => {
        console.error("[Box送信エラー]", err);
      });
    }

    return NextResponse.json({ status: "ok", message: "送信完了しました" });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "サーバーエラーが発生しました";
    return NextResponse.json({ status: "error", message: msg }, { status: 500 });
  }
}

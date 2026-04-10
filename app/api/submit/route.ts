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
  title: string,
) {
  if (files.length === 0) return;

  // ── Step1: 新しいフォルダを作成 ──────────────────
  const folderName = `${inquiryId}_${title}`; // フォルダ名に申請IDとタイトルを入れる（例: "123_プリンタが動かない"）

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
    form.append("file", new File([new Uint8Array(f.buffer)], f.filename, { type: f.mimetype }));

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
    const files = data.getAll("files") as File[]; // 単一ファイルも複数ファイルも両方対応
    const screenshots = data.getAll("screenshots") as File[];

    // ── バリデーション ─────────────────────────────────
    if (!name || !title || !urgency || !message || !resolution) {
      return NextResponse.json({ status: "error", message: "必須項目を入力してください" }, { status: 400 });
    }

    // ── ファイルのバリデーション ──
    const ALLOWED_EXTENSIONS = [".pdf", ".doc", ".docx", ".xls", ".xlsx", ".png", ".jpg", ".jpeg"];
    const MAX_SIZE = 100 * 1024 * 1024; // 100MB

    for (const f of files) {
      const ext = path.extname(f.name).toLowerCase();
      if (!ALLOWED_EXTENSIONS.includes(ext)) {
        return NextResponse.json({ status: "error", message: `許可されていないファイル形式です: ${ext}` }, { status: 400 });
      }
      if (f.size > MAX_SIZE) {
        return NextResponse.json({ status: "error", message: "ファイルサイズは100MB以下にしてください" }, { status: 400 });
      }
    }

    const fileBuffers = await Promise.all(
      files
        .filter((f) => f.size > 0)
        .map(async (f) => ({
          buffer: Buffer.from(await f.arrayBuffer()),
          filename: f.name,
          mimetype: f.type || "application/octet-stream",
        })),
    );

    const screenshotBuffers = await Promise.all(
      screenshots
        .filter((s) => s.size > 0)
        .map(async (s) => ({
          buffer: Buffer.from(await s.arrayBuffer()),
          mimetype: s.type || "image/png",
        })),
    );

    for (const s of screenshotBuffers) {
      await mkdir(UPLOAD_DIR, { recursive: true });
      await writeFile(path.join(UPLOAD_DIR, `screenshot_${Date.now()}.png`), s.buffer);
    }

    // ── Box送信用の配列を組み立て ──
    const filesToSend: { buffer: Buffer; filename: string; mimetype: string }[] = [];

    fileBuffers.forEach((f) => {
      filesToSend.push({
        buffer: f.buffer,
        filename: `${Date.now()}_${f.filename}`,
        mimetype: f.mimetype,
      });
    });
    screenshotBuffers.forEach((s, i) => {
      filesToSend.push({
        buffer: s.buffer,
        filename: `${Date.now()}_screenshot_${i + 1}.png`,
        mimetype: s.mimetype,
      });
    });

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

      sendFilesToBox(filesToSend, folderId, token, inquiryId, title).catch((err) => {
        console.error("[Box送信エラー]", err);
      });
    }

    return NextResponse.json({ status: "ok", message: "送信完了しました" });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "サーバーエラーが発生しました";
    return NextResponse.json({ status: "error", message: msg }, { status: 500 });
  }
}

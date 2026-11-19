// lib/masterUpMail.ts
import { writeErrorLog } from "@/lib/logger";

// 通知に必要な1品目ぶんの情報（失敗したものだけ渡す）
export type MasterUpFailedItem = {
  itemCode: string;
  itemName?: string;
  message?: string;
  oraCode?: string | null;
};

export type MasterUpFailNotice = {
  mail: string; // 申請者のメールアドレス（宛先）
  totalCount: number; // 申請した件数
  successCount: number; // 成功した件数
  failedItems: MasterUpFailedItem[];
};

/**
 * HTMLに埋め込む文字をエスケープする
 * 品名などに < や & が入っているとメールの表示が崩れるため
 */
function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;") // & は最初に置き換える（後の &lt; などを壊さないため）
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/** メール本文（HTML）を組み立てる */
function buildBody(notice: MasterUpFailNotice, requestedAt: string): string {
  const rows = notice.failedItems
    .map(
      (item) => `
      <tr>
        <td style="border:1px solid #ccc;padding:4px 8px;font-family:monospace">${escapeHtml(item.itemCode)}</td>
        <td style="border:1px solid #ccc;padding:4px 8px">${escapeHtml(item.itemName ?? "")}</td>
        <td style="border:1px solid #ccc;padding:4px 8px">${escapeHtml(item.message ?? "")}</td>
        <td style="border:1px solid #ccc;padding:4px 8px;font-family:monospace">${escapeHtml(item.oraCode ?? "")}</td>
      </tr>`,
    )
    .join("");

  return `
<p>マスタup申請のうち、以下の品目コードの処理に失敗しました。</p>
<p>
  申請日時：${escapeHtml(requestedAt)}<br>
  申請件数：${notice.totalCount}件（成功 ${notice.successCount}件 ／ 失敗 ${notice.failedItems.length}件）
</p>
<table style="border-collapse:collapse;font-size:13px">
  <tr style="background:#f0f0f0">
    <th style="border:1px solid #ccc;padding:4px 8px">品目コード</th>
    <th style="border:1px solid #ccc;padding:4px 8px">品名</th>
    <th style="border:1px solid #ccc;padding:4px 8px">内容</th>
    <th style="border:1px solid #ccc;padding:4px 8px">エラーコード</th>
  </tr>${rows}
</table>
<p>
  「マスタ登録環境に存在しません」の品目は、品目コードをご確認のうえ再度申請してください。<br>
  エラーコードが表示されている品目は、エラーコードを添えて情報システム部までご連絡ください。
</p>
<p style="color:#888;font-size:12px">※このメールは MC Systems Desk から自動送信されています。返信はできません。</p>`;
}

/**
 * マスタupで失敗した品目を、申請者にメールで通知する（Power Automate 経由）。
 * 通知に失敗しても例外は投げない（申請処理自体の結果には影響させないため）。
 */
export async function notifyMasterUpFailure(notice: MasterUpFailNotice): Promise<void> {
  const webhookUrl = process.env.MASTER_UP_MAIL_WEBHOOK_URL;
  if (!webhookUrl) return; // 未設定の環境（開発PCなど）では何もしない
  if (notice.failedItems.length === 0) return; // 全件成功なら送らない

  // サーバーのタイムゾーン設定に関係なく日本時間で表示する
  const requestedAt = new Date().toLocaleString("ja-JP", { timeZone: "Asia/Tokyo" });

  // Power Automate の「JSON の解析」で受け取る形（フロー側のスキーマと一致させる）
  const payload = {
    to: notice.mail,
    cc: process.env.MASTER_UP_MAIL_CC ?? "", // 管理者にも届けたい場合に設定（複数はセミコロン区切り）
    subject: `【MC Systems Desk】マスタup 失敗のお知らせ（${notice.failedItems.length}件）`,
    body: buildBody(notice, requestedAt),
  };

  try {
    const res = await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(10000), // 10秒で打ち切り
    });

    // fetchはHTTPエラーでもthrowしないので、自分でokを確認する
    if (!res.ok) {
      throw new Error(`マスタup失敗メール通知失敗: HTTP ${res.status} ${await res.text()}`);
    }
  } catch (err) {
    writeErrorLog({ func: "notifyMasterUpFailure", err });
  }
}

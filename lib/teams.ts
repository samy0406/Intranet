// lib/teams.ts
import { writeErrorLog } from "@/lib/logger";

// 通知に必要な項目だけを受け取る型
export type TeamsInquiryNotice = {
  id: number;
  title: string;
  name: string;
  department: string;
  urgency: string;
  message: string;
};

/**
 * 問い合わせ受付をTeamsチャネルに通知する。
 * 通知に失敗しても例外は投げない（問い合わせ自体は成功扱いにするため）。
 */
export async function notifyTeamsInquiry(inquiry: TeamsInquiryNotice): Promise<void> {
  const webhookUrl = process.env.TEAMS_WEBHOOK_URL;
  if (!webhookUrl) return; // 未設定の環境（開発PCなど）では何もしない

  const isUrgent = inquiry.urgency === "至急";
  const detailUrl = `${process.env.APP_BASE_URL ?? ""}/admin/inquiries/${inquiry.id}`;

  // 本文が長いとカードが見づらいので先頭200文字に切る
  const summary = inquiry.message.length > 200 ? `${inquiry.message.slice(0, 200)}…` : inquiry.message;

  // ワークフローが受け取れる形式（Adaptive Card）
  const payload = {
    type: "message",
    attachments: [
      {
        contentType: "application/vnd.microsoft.card.adaptive",
        contentUrl: null,
        content: {
          $schema: "http://adaptivecards.io/schemas/adaptive-card.json",
          type: "AdaptiveCard",
          version: "1.4",
          body: [
            {
              type: "TextBlock",
              text: isUrgent ? "🚨【至急】新しい問い合わせ" : "📩 新しい問い合わせ",
              weight: "Bolder",
              size: "Medium",
              color: isUrgent ? "Attention" : "Default",
            },
            { type: "TextBlock", text: inquiry.title, wrap: true, weight: "Bolder" },
            {
              type: "FactSet",
              facts: [
                { title: "受付ID", value: String(inquiry.id) },
                { title: "緊急度", value: inquiry.urgency },
                { title: "依頼者", value: `${inquiry.department} ${inquiry.name}` },
              ],
            },
            { type: "TextBlock", text: summary, wrap: true },
          ],
          actions: [{ type: "Action.OpenUrl", title: "管理画面で開く", url: detailUrl }],
        },
      },
    ],
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
      throw new Error(`Teams通知失敗: HTTP ${res.status} ${await res.text()}`);
    }
  } catch (err) {
    writeErrorLog({ func: "notifyTeamsInquiry", err });
  }
}

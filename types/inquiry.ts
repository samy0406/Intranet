// ================================================
// 型定義ファイル（TypeScriptの「設計図」）
// ================================================

// 緊急度の選択肢
export const URGENCY_OPTIONS = ["至急", "高", "中", "低"] as const;
// as const = この配列の値を変更不可にする（型の精度が上がる）
export type UrgencyOption = (typeof URGENCY_OPTIONS)[number];
// → '至急' | '高' | '中' | '低' という型になる

// 問い合わせフォームの入力データの型
export type InquiryFormData = {
  name: string; // お名前
  department: string; // 部署
  mail: string; // メールアドレス
  title: string; // 表題
  urgency: string; // 緊急度
  screenPath: string; // 画面の開き方
  message: string; // 問い合わせ経緯
  resolution: string; // 対応希望内容
  reason: string; // 緊急の理由
  approver: string; // 承認者
  handler: string; // 対応者
  completedAt: string; // 完了日付
  responseNote: string; // 対応内容
};

//･エラーの型
export type InquiryFormErrors = {
  name?: string;
  department?: string;
  mail?: string;
  title?: string;
  urgency?: string;
  screenPath?: string;
  message?: string;
  screenshot?: string;
  resolution?: string;
  reason?: string;
  approver?: string;
};

// DBに保存されている問い合わせデータの型
export type Inquiry = InquiryFormData & {
  id: number;
  filename: string | null;
  screenshot: string | null;
  createdAt: string;
};

// APIのレスポンス型
export type ApiResponse = { status: "ok"; message: string } | { status: "error"; message: string };

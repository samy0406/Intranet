// lib/constants.ts 値が固定の定数をまとめるファイル

import type { InquiryStatus, UrgencyLevel } from "@/types/inquiry";

// ── 問い合わせカテゴリ ────────────────────────────────────────
export const INQUIRY_CATEGORIES = ["データ修正", "操作方法・使い方", "システム障害・エラー", "帳票・出力", "マスタ設定", "外部連携", "仕様確認", "その他"] as const;
// as const = この配列の値を変更不可にする（型の精度が上がる）

// 緊急度の選択肢
export const URGENCY_OPTIONS = ["至急", "高", "中", "低"] as const;
export type UrgencyOption = (typeof URGENCY_OPTIONS)[number];
// → '至急' | '高' | '中' | '低' という型になる

// ── スタイル定数 ────────────────────────────────────────
export const STATUS_STYLE: Record<InquiryStatus, string> = {
  未対応: "bg-red-100    text-red-700    border border-red-200",
  対応中: "bg-blue-100   text-blue-700   border border-blue-200",
  intec対応: "bg-purple-100 text-purple-700 border border-purple-200",
  完了: "bg-emerald-100 text-emerald-700 border border-emerald-200",
};

export const URGENCY_STYLE: Record<UrgencyLevel, string> = {
  至急: "bg-red-100 text-red-700",
  高: "bg-orange-100 text-orange-700",
  中: "bg-yellow-100 text-yellow-700",
  低: "bg-slate-100 text-slate-500",
};

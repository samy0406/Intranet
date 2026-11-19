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

// ── アカウントロック解除:アカウントの種類
export const ACCOUNT_TYPES = [
  { value: "aka", label: "赤hoyu(リリース前テスト環境)" },
  { value: "kuro", label: "黒hoyu" },
] as const;

// 型を、上の配列から自動で作る
export type AccountType = (typeof ACCOUNT_TYPES)[number]["value"];

// 受け取った値が、定義済みの種類かどうかを判定する
export function isAccountType(value: unknown): value is AccountType {
  return ACCOUNT_TYPES.some((t) => t.value === value);
}

// ── マスタup:複数品目コード
// 1回の申請で処理できる品目コードの上限(処理時間・DB負荷の歯止め)
export const MASTER_UP_MAX_ITEMS = 50;
// 品目コードの最大文字数（W_TBL_MASTER_UP_REQ.HINMO_CD が VARCHAR2(40) のため）
export const MASTER_UP_ITEM_CODE_MAX_LENGTH = 40;

/**
 * テキストエリアの入力を品目コードの配列に変換する。
 * - 改行・カンマ・スペース・タブ区切りに対応(Excelからの貼り付けもOK)
 * - 前後の空白を除去し、空行は捨てる
 * - 重複は1つにまとめる(入力順は維持)
 * 画面(hook)とAPI(route.ts)の両方から使う
 */
export function parseItemCodes(text: string): string[] {
  const codes = text
    .split(/[\s,、]+/) // 改行・空白・タブ・カンマ・読点のどれでも区切る
    .map((c) => c.trim())
    .filter((c) => c !== "");
  return [...new Set(codes)]; // Set で重複を除去 → 配列に戻す
}

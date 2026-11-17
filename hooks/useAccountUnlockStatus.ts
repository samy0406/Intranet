// hooks\useAccountUnlockStatus.ts
"use client";
import { useState, ChangeEvent, FormEvent } from "react";
import type { AccountType } from "@/lib/constants";

// ── 型定義 ──────────────────────────────────────────
export type SearchResult = "pending" | "available" | null;
// pending   = 申請データが見つかった → まだ処理中
// available = 申請データがない     → ログイン可能
// null      = まだ検索していない

export type Status = "idle" | "loading";

export function useAccountUnlockStatus() {
  // "" は「まだ選んでいない」状態
  const [accountType, setAccountType] = useState<AccountType | "">("");
  const [accountCode, setAccountCode] = useState<string>("");
  const [result, setResult] = useState<SearchResult>(null);
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState<string>("");

  // プルダウン(種類)が変わったとき
  const handleTypeChange = (e: ChangeEvent<HTMLSelectElement>) => {
    setAccountType(e.target.value as AccountType | "");
    setResult(null);
    setError("");
  };

  // 入力欄(コード)が変わったとき
  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    setAccountCode(e.target.value);
    setResult(null);
    setError("");
  };

  const handleSearch = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    setResult(null);

    if (!accountType) {
      setError("アカウントの種類を選択してください");
      return;
    }
    if (!accountCode.trim()) {
      setError("アカウントコードを入力してください");
      return;
    }

    setStatus("loading");
    try {
      const params = new URLSearchParams({ accountType, accountCode });
      const res = await fetch(`/api/account-unlock/status?${params.toString()}`);
      const json = await res.json();

      if (!res.ok) {
        setError(json.message ?? "エラーが発生しました");
        return;
      }

      setResult(json.found ? "pending" : "available");
    } catch {
      setError("通信エラーが発生しました");
    } finally {
      setStatus("idle");
    }
  };

  return { accountType, accountCode, result, status, error, handleTypeChange, handleChange, handleSearch };
}

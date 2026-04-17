import { useState, ChangeEvent, FormEvent } from "react";

// ── 型定義 ──────────────────────────────────────────
export type SearchResult = "pending" | "available" | null;
// pending   = 申請データが見つかった → まだ処理中
// available = 申請データがない     → ログイン可能
// null      = まだ検索していない

export type Status = "idle" | "loading";

export function useAccountUnlockStatus() {
  const [accountCode, setAccountCode] = useState<string>("");
  const [result, setResult] = useState<SearchResult>(null);
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState<string>("");

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    setAccountCode(e.target.value);
    setResult(null);
    setError("");
  };

  const handleSearch = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    setResult(null);

    if (!accountCode.trim()) {
      setError("アカウントコードを入力してください");
      return;
    }

    setStatus("loading");
    try {
      const res = await fetch(`/api/account-unlock/status?accountCode=${encodeURIComponent(accountCode)}`);
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

  return { accountCode, result, status, error, handleChange, handleSearch };
}

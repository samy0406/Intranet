"use client";

import { useState, FormEvent, ChangeEvent } from "react";
import { BackToHomeButton } from "@/components/BackToHomeButton";

// 検索結果の状態
type SearchResult = "pending" | "available" | null;
// pending   = 申請データが見つかった → まだ処理中
// available = 申請データがない     → ログイン可能
// null      = まだ検索していない

type Status = "idle" | "loading";

export default function AccountUnlockStatusPage() {
  const [accountCode, setAccountCode] = useState<string>("");
  const [result, setResult] = useState<SearchResult>(null);
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState<string>("");

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
        setStatus("idle");
        return;
      }

      // APIから found: true/false で結果を受け取る
      setResult(json.found ? "pending" : "available");
    } catch {
      setError("通信エラーが発生しました");
    } finally {
      setStatus("idle");
    }
  };

  return (
    <main className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* 戻るボタン */}
        <div className="mb-6">
          <BackToHomeButton />
        </div>

        {/* カード */}
        <div className="bg-slate-800 border border-slate-700 rounded-2xl p-8">
          {/* ヘッダー */}
          <div className="flex items-center gap-3 mb-8">
            <div className="w-10 h-10 bg-amber-500/20 rounded-xl flex items-center justify-center">
              <span className="text-xl">📋</span>
            </div>
            <div>
              <h1 className="text-white font-bold text-xl leading-tight">処理状況の確認</h1>
              <p className="text-slate-400 text-xs mt-0.5">アカウントロック解除の進捗確認</p>
            </div>
          </div>

          {/* 検索フォーム */}
          <form onSubmit={handleSearch} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1.5">アカウントコード</label>
              <input
                type="text"
                value={accountCode}
                onChange={(e: ChangeEvent<HTMLInputElement>) => {
                  setAccountCode(e.target.value);
                  setResult(null); // 入力が変わったら結果をリセット
                  setError("");
                }}
                placeholder="例：SET12"
                className={`${inputClass} font-mono tracking-wider`}
              />
              {error && <p className="text-rose-400 text-xs mt-1">⚠ {error}</p>}
            </div>

            <button
              type="submit"
              disabled={status === "loading"}
              className="w-full py-3 rounded-xl bg-amber-500 hover:bg-amber-400
                text-white font-bold text-sm transition-all active:scale-95
                disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {status === "loading" ? "検索中..." : "確認する →"}
            </button>
          </form>

          {/* 検索結果 */}
          {result !== null && (
            <div
              className={`mt-6 rounded-xl p-5 border ${
                result === "pending"
                  ? "bg-amber-500/10 border-amber-500/30" // 処理中 → 黄色
                  : "bg-emerald-500/10 border-emerald-500/30" // ログイン可能 → 緑
              }`}
            >
              <div className="flex items-start gap-3">
                <span className="text-2xl mt-0.5">{result === "pending" ? "⏳" : "✅"}</span>
                <div>
                  <p className={`font-bold text-sm mb-1 ${result === "pending" ? "text-amber-400" : "text-emerald-400"}`}>{result === "pending" ? "処理中" : "ログイン可能"}</p>
                  <p className="text-slate-300 text-sm leading-relaxed">{result === "pending" ? "まだ処理は終わっていません。情報システム部に直接ご連絡下さい。" : "現在ログイン可能な状態です。"}</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}

const inputClass = `
  w-full px-4 py-2.5 rounded-xl bg-slate-700 border border-slate-600
  text-white placeholder-slate-500 text-sm
  focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent transition
`;

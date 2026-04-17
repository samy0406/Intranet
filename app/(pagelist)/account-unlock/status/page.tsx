"use client";

import { BackToHomeButton } from "@/components/BackToHomeButton";
import { useAccountUnlockStatus } from "@/hooks/useAccountUnlockStatus";

export default function AccountUnlockStatusPage() {
  const { accountCode, result, status, error, handleChange, handleSearch } = useAccountUnlockStatus();

  return (
    <main className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="mb-6">
          <BackToHomeButton />
        </div>

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
              <label className={labelClass}>アカウントコード</label>
              <input type="text" value={accountCode} onChange={handleChange} placeholder="例：SET12" className={`${inputClass} font-mono tracking-wider`} />
              {error && <p className={errClass}>⚠ {error}</p>}
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
            <div className={`mt-6 rounded-xl p-5 border ${result === "pending" ? "bg-amber-500/10 border-amber-500/30" : "bg-emerald-500/10 border-emerald-500/30"}`}>
              <div className="flex items-start gap-3">
                <span className="text-2xl mt-0.5">{result === "pending" ? "⏳" : "✅"}</span>
                <div>
                  <p className={`font-bold text-sm mb-1 ${result === "pending" ? "text-amber-400" : "text-emerald-400"}`}>{result === "pending" ? "処理中" : "ログイン可能"}</p>
                  <p className="text-slate-300 text-sm leading-relaxed">{result === "pending" ? "現在ログインできない状態です。" : "現在ログイン可能な状態です。"}</p>
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
const labelClass = "block text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1.5";
const errClass = "text-rose-400 text-xs mt-1";

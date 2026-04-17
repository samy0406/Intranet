"use client";

import { BackToHomeButton } from "@/components/BackToHomeButton";
import { useJudgmentCancelStatus } from "@/hooks/useJudgmentCancelStatus";

// ── 試験区分コードを日本語に変換 ──────────────────────
function formatShiken(code: string): string {
  const map: Record<string, string> = { "9": "判定済", "5": "記録確認" };
  return map[code] ?? code;
}

export default function JudgmentCancelStatusPage() {
  const { form, errors, status, results, handleChange, handleSearch } = useJudgmentCancelStatus();

  return (
    <main className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-xl">
        <div className="mb-6">
          <BackToHomeButton />
        </div>

        <div className="bg-slate-800 border border-slate-700 rounded-2xl p-8">
          {/* ヘッダー */}
          <div className="flex items-center gap-3 mb-8">
            <div className="w-10 h-10 bg-rose-500/20 rounded-xl flex items-center justify-center">
              <span className="text-xl">📋</span>
            </div>
            <div>
              <h1 className="text-white font-bold text-xl">処理状況の確認</h1>
              <p className="text-slate-400 text-xs mt-0.5">総合判定取消の処理状況を確認</p>
            </div>
          </div>

          {/* 検索フォーム */}
          <form onSubmit={handleSearch} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>品目コード</label>
                <input type="text" name="itemCode" value={form.itemCode} onChange={handleChange} className={`${inputClass} font-mono`} />
                {errors.itemCode && <p className={errClass}>⚠ {errors.itemCode}</p>}
              </div>
              <div>
                <label className={labelClass}>ロットNO</label>
                <input type="text" name="lotNo" value={form.lotNo} onChange={handleChange} className={`${inputClass} font-mono`} />
                {errors.lotNo && <p className={errClass}>⚠ {errors.lotNo}</p>}
              </div>
            </div>

            <button
              type="submit"
              disabled={status === "loading"}
              className="w-full py-3 rounded-xl bg-rose-500 hover:bg-rose-400
                text-white font-bold text-sm transition-all active:scale-95
                disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {status === "loading" ? "検索中..." : "確認する →"}
            </button>
          </form>

          {/* 検索結果 */}
          {results !== null && (
            <div className="mt-6">
              {results.length > 0 ? (
                <div>
                  <p className="text-rose-400 font-semibold text-sm mb-3">✅ 現在の試験区分です。</p>

                  <div className="rounded-xl overflow-hidden border border-slate-600">
                    {/* テーブルヘッダー */}
                    <div className="grid grid-cols-4 bg-slate-700 px-4 py-2.5">
                      <span className={thClass}>品目コード</span>
                      <span className={thClass}>ロットNO</span>
                      <span className={thClass}>試験区分</span>
                      <span className={thClass}>判定日</span>
                    </div>

                    {/* テーブルボディ */}
                    <div className="divide-y divide-slate-700">
                      {results.map((item, index) => (
                        <div key={index} className="grid grid-cols-4 px-4 py-3 hover:bg-slate-700/30 transition-colors">
                          <span className="text-slate-300 text-sm font-mono">{item.itemCode}</span>
                          <span className="text-slate-300 text-sm font-mono">{item.lotNo}</span>
                          <span className="text-slate-300 text-sm">{formatShiken(item.shiken)}</span>
                          <span className="text-slate-300 text-sm">{item.judgmentDate}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="bg-slate-700/50 border border-slate-600 rounded-xl p-5 text-center">
                  <p className="text-slate-400 text-sm">該当なし</p>
                  <p className="text-slate-500 text-xs mt-1">入力した品目コード・ロットNOのデータは見つかりませんでした</p>
                </div>
              )}
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
  focus:outline-none focus:ring-2 focus:ring-rose-400 focus:border-transparent transition
`;
const labelClass = "block text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1.5";
const errClass = "text-rose-400 text-xs mt-1";
const thClass = "text-xs font-semibold text-slate-400 uppercase tracking-wide";

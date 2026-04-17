"use client";

import { BackToHomeButton } from "@/components/BackToHomeButton";
import { useInquiryStatus } from "@/hooks/useInquiryStatus";

// ── ステータス表示変換 ────────────────────────────────
const toUserStatus = (status: string): { label: string; color: string } => {
  if (status === "完了") return { label: "完了", color: "bg-emerald-100 text-emerald-700 border-emerald-200" };
  return { label: "対応中", color: "bg-amber-100 text-amber-700 border-amber-200" };
};

export default function InquiryStatusPage() {
  const { mail, mailError, results, phase, loading, apiError, page, totalPages, currentItems, handleChange, handleSubmit, handleReset, setPage } = useInquiryStatus();

  return (
    <main className="min-h-screen bg-slate-50 flex items-center justify-center p-3 sm:p-6">
      <div className="w-full max-w-2xl">
        <div className="mb-4">
          <BackToHomeButton hasInput={false} />
        </div>

        <div className="mb-8">
          <div className="flex items-center gap-2 mb-2">
            <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />
            <span className="text-xs font-bold tracking-widest text-indigo-500 uppercase">Status Check</span>
          </div>
          <h1 className="text-3xl font-bold text-slate-800 tracking-tight">処理状況の確認</h1>
          <p className="text-slate-400 text-sm mt-1">メールアドレスを入力して申請状況を確認できます</p>
        </div>

        {/* ━━ フェーズ① 入力フォーム ━━━━━━━━━━━━━━━━━━ */}
        {phase === "input" && (
          <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 sm:p-8 space-y-6">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                メールアドレス <span className="text-red-500">*</span>
              </label>
              <input type="email" name="mail" value={mail} onChange={handleChange} placeholder="例：taro_yamada@hoyu.co.jp" className={inputClass} autoComplete="email" />
              {mailError && <p className="mt-1.5 text-xs text-red-500">{mailError}</p>}
            </div>

            {apiError && <p className="text-sm text-red-500 bg-red-50 border border-red-200 rounded-xl px-4 py-3">{apiError}</p>}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl bg-indigo-600 text-white font-semibold text-sm
                hover:bg-indigo-700 active:scale-[0.98] transition-all disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loading ? "検索中..." : "申請状況を確認する →"}
            </button>
          </form>
        )}

        {/* ━━ フェーズ② 結果表示 ━━━━━━━━━━━━━━━━━━━━━ */}
        {phase === "result" && (
          <div className="space-y-4">
            {/* 検索条件バー */}
            <div className="flex items-center justify-between bg-white rounded-2xl shadow-sm border border-slate-100 px-5 py-3">
              <p className="text-sm text-slate-600">
                <span className="font-semibold text-slate-800">{mail}</span>
                <span className="ml-2 text-slate-400">の申請 {results.length} 件</span>
              </p>
              <button onClick={handleReset} className="text-xs text-indigo-500 hover:text-indigo-700 font-semibold transition-colors">
                ← 再検索
              </button>
            </div>

            {/* 0件 */}
            {results.length === 0 && (
              <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-10 text-center">
                <p className="text-4xl mb-3">📭</p>
                <p className="text-slate-500 font-semibold">申請が見つかりませんでした</p>
                <p className="text-slate-400 text-sm mt-1">メールアドレスをご確認のうえ再検索してください</p>
              </div>
            )}

            {/* 結果カード一覧 */}
            {currentItems.map((item) => {
              const userStatus = toUserStatus(item.status);
              return (
                <div key={item.id} className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 space-y-5">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-xs text-slate-400 mb-1">{new Date(item.date).toLocaleDateString("ja-JP", { year: "numeric", month: "2-digit", day: "2-digit" })}</p>
                      <h2 className="text-base font-bold text-slate-800 leading-snug">{item.title}</h2>
                    </div>
                    <span className={`shrink-0 text-xs font-bold px-3 py-1 rounded-full border ${userStatus.color}`}>{userStatus.label}</span>
                  </div>

                  <hr className="border-slate-100" />

                  <div>
                    <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">申請者</p>
                    <p className="text-sm text-slate-700">{item.name}</p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">問い合わせ経緯</p>
                    <p className="text-sm text-slate-700 whitespace-pre-wrap">{item.message}</p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">対応希望内容</p>
                    <p className="text-sm text-slate-700 whitespace-pre-wrap">{item.resolution}</p>
                  </div>
                </div>
              );
            })}

            {/* ページネーション */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 pt-2">
                <button
                  onClick={() => setPage((p) => p - 1)}
                  disabled={page === 0}
                  className="px-4 py-2 rounded-xl text-sm font-semibold border border-slate-200 bg-white text-slate-600
                    hover:border-indigo-300 hover:text-indigo-600 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                >
                  ← 前へ
                </button>

                {Array.from({ length: totalPages }, (_, i) => (
                  <button
                    key={i}
                    onClick={() => setPage(i)}
                    className={`w-9 h-9 rounded-xl text-sm font-bold transition-all
                      ${page === i ? "bg-indigo-600 text-white shadow-sm" : "bg-white border border-slate-200 text-slate-500 hover:border-indigo-300 hover:text-indigo-600"}`}
                  >
                    {i + 1}
                  </button>
                ))}

                <button
                  onClick={() => setPage((p) => p + 1)}
                  disabled={page === totalPages - 1}
                  className="px-4 py-2 rounded-xl text-sm font-semibold border border-slate-200 bg-white text-slate-600
                    hover:border-indigo-300 hover:text-indigo-600 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                >
                  次へ →
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </main>
  );
}

const inputClass = `
  w-full px-4 py-3 rounded-xl border border-slate-200 text-slate-800 text-base bg-white
  focus:outline-none focus:ring-2 focus:ring-indigo-300 focus:border-transparent transition
`;

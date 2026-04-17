"use client";

import { BackToHomeButton } from "@/components/BackToHomeButton";
import { useJudgmentCancel } from "@/hooks/useJudgmentCancel";

// ── 試験区分コードを日本語に変換 ──────────────────────
function formatShiken(code: string): string {
  const map: Record<string, string> = { "9": "判定済", "5": "記録確認" };
  return map[code] ?? code;
}

export default function JudgmentCancelPage() {
  const { form, errors, status, searchResult, searching, showConfirm, hasInput, handleChange, handleSearch, handleConfirmOpen, handleSubmit, setShowConfirm, router } = useJudgmentCancel();

  // ── 送信完了画面 ──────────────────────────────────
  if (status === "done") {
    return (
      <main className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
        <div className="bg-slate-800 border border-slate-700 rounded-2xl p-10 text-center max-w-sm w-full">
          <div className="w-14 h-14 bg-rose-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl">↩️</span>
          </div>
          <h2 className="text-white font-bold text-lg mb-2">申請を受け付けました</h2>
          <p className="text-slate-400 text-sm mb-2">MCで反映されているか確認してください。</p>
          <div className="bg-slate-700 rounded-xl p-3 text-xs text-left space-y-1 mb-8">
            <p className="text-slate-400">
              品目コード：<span className="text-white font-mono ml-1">{form.itemCode}</span>
            </p>
            <p className="text-slate-400">
              ロットNO：<span className="text-white font-mono ml-1">{form.lotNo}</span>
            </p>
          </div>
          <button
            onClick={() => router.push("/")}
            className="w-full py-2.5 rounded-xl bg-rose-500 hover:bg-rose-400
              text-white font-semibold text-sm transition-all active:scale-95"
          >
            ホームに戻る
          </button>
        </div>
      </main>
    );
  }

  return (
    <>
      {/* ── 確認モーダル ── */}
      {showConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-slate-800 border border-slate-700 rounded-2xl p-6 w-full max-w-sm shadow-xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-9 h-9 bg-rose-500/20 rounded-xl flex items-center justify-center">
                <span className="text-lg">↩️</span>
              </div>
              <h2 className="text-white font-bold text-base">申請内容の確認</h2>
            </div>

            <div className="bg-slate-700 rounded-xl p-3 mb-3 text-xs space-y-1">
              <p className="text-slate-400">
                メール：<span className="text-white ml-1">{form.mail}</span>
              </p>
            </div>

            <div className="bg-slate-700 rounded-xl p-3 mb-4 text-xs space-y-1">
              <p className="text-slate-400">
                品目コード：<span className="text-white font-mono ml-1">{form.itemCode}</span>
              </p>
              <p className="text-slate-400">
                ロットNO：<span className="text-white font-mono ml-1">{form.lotNo}</span>
              </p>
              <p className="text-slate-400">
                現在の試験区分：<span className="text-white font-mono ml-1">{searchResult ? formatShiken(searchResult.shiken) : "—"}</span>
              </p>
              <p className="text-slate-400">
                判定日：<span className="text-white font-mono ml-1">{searchResult?.judgmentDate ?? "—"}</span>
              </p>
            </div>

            <p className="text-slate-400 text-xs mb-5 text-center">上記の内容で取消申請します。よろしいですか？</p>

            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setShowConfirm(false)}
                className="py-2.5 rounded-xl border border-slate-600 text-slate-300
                  hover:bg-slate-700 text-sm font-semibold transition-all"
              >
                戻る
              </button>
              <button
                type="button"
                onClick={handleSubmit}
                className="py-2.5 rounded-xl bg-rose-500 hover:bg-rose-400
                  text-white text-sm font-bold transition-all active:scale-95"
              >
                確定する
              </button>
            </div>
          </div>
        </div>
      )}

      <main className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
        <div className="w-full max-w-lg">
          <div className="mb-6">
            <BackToHomeButton hasInput={hasInput} />
          </div>

          <div className="bg-slate-800 border border-slate-700 rounded-2xl p-8">
            <div className="flex items-center gap-3 mb-8">
              <div className="w-10 h-10 bg-rose-500/20 rounded-xl flex items-center justify-center">
                <span className="text-xl">↩️</span>
              </div>
              <div>
                <h1 className="text-white font-bold text-xl">総合判定取消</h1>
                <p className="text-slate-400 text-xs mt-0.5">申請内容を入力してください</p>
              </div>
            </div>

            <form onSubmit={handleConfirmOpen} className="space-y-5">
              {/* ── メールアドレス ── */}
              <div id="field-mail" tabIndex={-1} className="scroll-mt-6">
                <label className={labelClass}>
                  メールアドレス <span className="text-rose-400">*</span>
                </label>
                <input type="email" name="mail" value={form.mail} onChange={handleChange} placeholder="例：taro_yamada@hoyu.co.jp" className={inputClass} />
                {errors.mail && <p className={errClass}>⚠ {errors.mail}</p>}
              </div>

              <hr className="border-slate-700" />

              {/* ── 品目情報 ── */}
              <div className="border border-slate-600 rounded-xl p-4" style={{ backgroundColor: "rgb(30 41 59)" }}>
                <span className="text-xs font-semibold text-rose-400 uppercase tracking-wide block mb-3">品目情報</span>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div id="field-itemCode" tabIndex={-1} className="scroll-mt-6">
                    <label className={labelClass}>
                      品目コード <span className="text-rose-400">*</span>
                    </label>
                    <input type="text" name="itemCode" value={form.itemCode} onChange={handleChange} className={`${inputClass} font-mono`} />
                    {errors.itemCode && <p className={errClass}>⚠ {errors.itemCode}</p>}
                  </div>
                  <div id="field-lotNo" tabIndex={-1} className="scroll-mt-6">
                    <label className={labelClass}>
                      ロットNO <span className="text-rose-400">*</span>
                    </label>
                    <input type="text" name="lotNo" value={form.lotNo} onChange={handleChange} className={`${inputClass} font-mono`} />
                    {errors.lotNo && <p className={errClass}>⚠ {errors.lotNo}</p>}
                  </div>
                  <div className="flex items-end">
                    <button
                      type="button"
                      onClick={handleSearch}
                      disabled={!form.itemCode.trim() || !form.lotNo.trim() || searching}
                      className="w-full py-2.5 rounded-xl bg-slate-600 hover:bg-slate-500
                        text-white text-sm font-semibold transition-all active:scale-95
                        disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      {searching ? "検索中…" : "🔍 現在値を検索"}
                    </button>
                  </div>
                </div>

                {/* 検索結果 */}
                {searchResult && (
                  <div className="mt-3 p-3 rounded-lg bg-slate-700 border border-slate-600 text-xs space-y-1">
                    <p className="text-slate-300">
                      現在の試験区分：<span className="text-white font-mono ml-1">{formatShiken(searchResult.shiken)}</span>
                    </p>
                    <p className="text-slate-300">
                      判定日：<span className="text-white font-mono ml-1">{searchResult.judgmentDate}</span>
                    </p>
                  </div>
                )}
              </div>

              {/* ── 送信ボタン ── */}
              <button
                type="submit"
                disabled={status === "loading"}
                className="w-full py-3 rounded-xl bg-rose-500 hover:bg-rose-400
                  text-white font-bold text-sm transition-all active:scale-95
                  disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {status === "loading" ? "送信中..." : "申請する →"}
              </button>
            </form>
          </div>
        </div>
      </main>
    </>
  );
}

const inputClass = `
  w-full px-3 py-2.5 rounded-xl bg-slate-700 border border-slate-600
  text-white placeholder-slate-500 text-sm
  focus:outline-none focus:ring-2 focus:ring-rose-400 focus:border-transparent transition
`;
const labelClass = "block text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1.5";
const errClass = "text-rose-400 text-xs mt-1";

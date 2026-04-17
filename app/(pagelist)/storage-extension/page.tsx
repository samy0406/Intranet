"use client";

import { BackToHomeButton } from "@/components/BackToHomeButton";
import { useStorageExtension } from "@/hooks/useStorageExtension";

export default function StorageExtensionPage() {
  const { base, item, baseErrors, itemErrors, status, searchResult, searching, showConfirm, hasInput, handleBaseChange, handleItemChange, handleSearch, handleConfirmOpen, handleSubmit, handleContinue, setShowConfirm, router } = useStorageExtension();

  // ── 完了画面 ──────────────────────────────────────
  if (status === "done") {
    return (
      <main className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
        <div className="bg-slate-800 border border-slate-700 rounded-2xl p-10 text-center max-w-sm w-full">
          <div className="w-14 h-14 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl">📦</span>
          </div>
          <h2 className="text-white font-bold text-lg mb-2">申請を受け付けました</h2>
          <p className="text-slate-400 text-sm mb-2">MCで反映されているか確認してください。</p>
          <div className="bg-slate-700 rounded-xl p-3 text-xs text-left space-y-1 mb-8">
            <p className="text-slate-400">
              品目コード：<span className="text-white font-mono ml-1">{item.itemCode}</span>
            </p>
            <p className="text-slate-400">
              ロットNO：<span className="text-white font-mono ml-1">{item.lotNo}</span>
            </p>
            <p className="text-slate-400">
              新保管期限：<span className="text-white font-mono ml-1">{item.expiryDate.replace(/-/g, "/")}</span>
            </p>
          </div>
          <div className="space-y-3">
            <button
              onClick={handleContinue}
              className="w-full py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400
                text-white font-semibold text-sm transition-all active:scale-95"
            >
              続けて入力する
            </button>
            <button
              onClick={() => router.push("/")}
              className="w-full py-2.5 rounded-xl border border-slate-600 text-slate-300
                hover:bg-slate-700 font-semibold text-sm transition-all"
            >
              ホームに戻る
            </button>
          </div>
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
              <div className="w-9 h-9 bg-emerald-500/20 rounded-xl flex items-center justify-center">
                <span className="text-lg">📦</span>
              </div>
              <h2 className="text-white font-bold text-base">申請内容の確認</h2>
            </div>

            <div className="bg-slate-700 rounded-xl p-3 mb-3 text-xs space-y-1">
              <p className="text-slate-400">
                メール：<span className="text-white ml-1">{base.mail}</span>
              </p>
            </div>

            <div className="bg-slate-700 rounded-xl p-3 mb-4 text-xs space-y-1">
              <p className="text-slate-400">
                品名：<span className="text-white ml-1">{searchResult?.itemName ?? "—"}</span>
              </p>
              <p className="text-slate-400">
                品目コード：<span className="text-white font-mono ml-1">{item.itemCode}</span>
              </p>
              <p className="text-slate-400">
                ロットNO：<span className="text-white font-mono ml-1">{item.lotNo}</span>
              </p>
              <p className="text-slate-400">
                現在の保管期限：<span className="text-white font-mono ml-1">{searchResult?.expiryDate ?? "—"}</span>
              </p>
              <p className="text-slate-400">
                新保管期限：<span className="text-white font-mono ml-1">{item.expiryDate.replace(/-/g, "/")}</span>
              </p>
            </div>

            <p className="text-slate-400 text-xs mb-5 text-center">上記の内容で更新します。よろしいですか？</p>

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
                className="py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400
                  text-white text-sm font-bold transition-all active:scale-95"
              >
                確定する
              </button>
            </div>
          </div>
        </div>
      )}

      <main className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
        <div className="w-full max-w-2xl">
          <div className="mb-6">
            <BackToHomeButton hasInput={hasInput} />
          </div>

          <div className="bg-slate-800 border border-slate-700 rounded-2xl p-8">
            <div className="flex items-center gap-3 mb-8">
              <div className="w-10 h-10 bg-emerald-500/20 rounded-xl flex items-center justify-center">
                <span className="text-xl">📦</span>
              </div>
              <div>
                <h1 className="text-white font-bold text-xl">保管期限延長</h1>
                <p className="text-slate-400 text-xs mt-0.5">申請内容を入力してください</p>
              </div>
            </div>

            <form onSubmit={handleConfirmOpen} className="space-y-5">
              {/* メールアドレス */}
              <div id="field-mail" tabIndex={-1} className="scroll-mt-6">
                <label className={labelClass}>
                  メールアドレス <span className="text-rose-400">*</span>
                </label>
                <input type="email" name="mail" value={base.mail} onChange={handleBaseChange} placeholder="例：taro_yamada@hoyu.co.jp" className={inputClass} />
                {baseErrors.mail && <p className={errClass}>⚠ {baseErrors.mail}</p>}
              </div>

              <hr className="border-slate-700" />

              {/* 品目情報 */}
              <div className="border border-slate-600 rounded-xl p-4" style={{ backgroundColor: "rgb(30 41 59)" }}>
                <span className="text-xs font-semibold text-emerald-400 uppercase tracking-wide block mb-3">品目情報</span>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className={labelClass}>
                      品目コード <span className="text-rose-400">*</span>
                    </label>
                    <input type="text" value={item.itemCode} onChange={(e) => handleItemChange("itemCode", e.target.value)} className={`${inputClass} font-mono`} />
                    {itemErrors.itemCode && <p className={errClass}>{itemErrors.itemCode}</p>}
                  </div>
                  <div>
                    <label className={labelClass}>
                      ロットNO <span className="text-rose-400">*</span>
                    </label>
                    <input type="text" value={item.lotNo} onChange={(e) => handleItemChange("lotNo", e.target.value)} className={`${inputClass} font-mono`} />
                    {itemErrors.lotNo && <p className={errClass}>{itemErrors.lotNo}</p>}
                  </div>
                  <div className="flex items-end">
                    <button
                      type="button"
                      onClick={handleSearch}
                      disabled={!item.itemCode.trim() || !item.lotNo.trim() || searching}
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
                    <p className="text-emerald-400 font-semibold">{searchResult.itemName}</p>
                    <p className="text-slate-300">
                      現在の保管期限：<span className="text-white font-mono ml-1">{searchResult.expiryDate}</span>
                    </p>
                    <p className="text-slate-300">
                      メーカ期限：<span className="text-white font-mono ml-1">{searchResult.makerExpiry ?? "—"}</span>
                    </p>
                  </div>
                )}

                {/* 新保管期限 */}
                <div className="mt-3">
                  <label className={labelClass}>
                    新保管期限 <span className="text-rose-400">*</span>
                  </label>
                  <input type="date" value={item.expiryDate} onChange={(e) => handleItemChange("expiryDate", e.target.value)} className={inputClass} />
                  {itemErrors.expiryDate && <p className={errClass}>{itemErrors.expiryDate}</p>}
                </div>
              </div>

              {/* 送信ボタン */}
              <button
                type="submit"
                disabled={status === "loading"}
                className="w-full py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400
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
  focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-transparent transition
`;
const labelClass = "block text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1.5";
const errClass = "text-rose-400 text-xs mt-1";

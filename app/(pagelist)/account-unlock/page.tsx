"use client";

import { BackToHomeButton } from "@/components/BackToHomeButton";
import { useAccountUnlock } from "@/hooks/useAccountUnlock";

export default function AccountUnlockPage() {
  const { form, errors, status, hasInput, handleChange, handleSubmit, router } = useAccountUnlock();

  // ── 送信完了画面 ──────────────────────────────────
  if (status === "done") {
    return (
      <main className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
        <div className="bg-slate-800 border border-slate-700 rounded-2xl p-10 text-center max-w-sm w-full">
          <div className="w-14 h-14 bg-amber-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl">🔓</span>
          </div>
          <h2 className="text-white font-bold text-lg mb-2">ロックを解除しました</h2>
          <p className="text-slate-400 text-sm mb-8">ログインをお試しください。</p>
          <p className="text-slate-400 text-sm mb-8">こちらの処理でログインできなかった場合、情報システム部にご連絡ください。</p>
          <button
            onClick={() => router.push("/")}
            className="w-full py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400
              text-white font-semibold text-sm transition-all active:scale-95"
          >
            ホームに戻る
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="mb-6">
          <BackToHomeButton hasInput={hasInput} />
        </div>

        <div className="bg-slate-800 border border-slate-700 rounded-2xl p-8">
          {/* ヘッダー */}
          <div className="flex items-center gap-3 mb-8">
            <div className="w-10 h-10 bg-amber-500/20 rounded-xl flex items-center justify-center">
              <span className="text-xl">🔓</span>
            </div>
            <div>
              <h1 className="text-white font-bold text-xl leading-tight">アカウントロック解除</h1>
              <p className="text-slate-400 text-xs mt-0.5">申請内容を入力してください</p>
            </div>
          </div>

          {/* フォーム */}
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* メールアドレス */}
            <div id="field-mail" tabIndex={-1} className="scroll-mt-6">
              <label className={labelClass}>
                メールアドレス <span className="text-rose-400">*</span>
              </label>
              <input type="email" name="mail" value={form.mail} onChange={handleChange} placeholder="例：taro_yamada@hoyu.co.jp" className={inputClass} />
              {errors.mail && <p className={errClass}>⚠ {errors.mail}</p>}
            </div>

            {/* アカウントコード */}
            <div id="field-accountCode" tabIndex={-1} className="scroll-mt-6">
              <label className={labelClass}>
                アカウントコード <span className="text-rose-400">*</span>
              </label>
              <input type="text" name="accountCode" value={form.accountCode} onChange={handleChange} placeholder="例：SET12" className={`${inputClass} font-mono tracking-wider`} />
              {errors.accountCode && <p className={errClass}>⚠ {errors.accountCode}</p>}
            </div>

            {/* 送信ボタン */}
            <button
              type="submit"
              disabled={status === "loading"}
              className="w-full py-3 rounded-xl bg-amber-500 hover:bg-amber-400
                text-white font-bold text-sm transition-all active:scale-95
                disabled:opacity-60 disabled:cursor-not-allowed mt-2"
            >
              {status === "loading" ? "送信中..." : "申請する →"}
            </button>
          </form>
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

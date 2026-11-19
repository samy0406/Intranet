// app\(pagelist)\master-up\page.tsx

"use client";

import { BackToHomeButton } from "@/components/BackToHomeButton";
import { useMasterUp } from "@/hooks/useMasterUp";
import { MASTER_UP_MAX_ITEMS } from "@/lib/constants";

export default function MasterUpPage() {
  const { form, errors, apiError, oraCode, results, itemCount, status, hasInput, handleChange, handleSubmit, router } = useMasterUp();

  // ── 送信完了画面（品目ごとの結果一覧） ──────────────────
  if (status === "done") {
    const successCount = results.filter((r) => r.ok).length;
    const failCount = results.length - successCount;

    return (
      <main className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
        <div className="bg-slate-800 border border-slate-700 rounded-2xl p-8 max-w-lg w-full">
          <div className="text-center mb-6">
            <div className="w-14 h-14 bg-amber-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">{failCount === 0 ? "✏️" : "⚠️"}</span>
            </div>
            <h2 className="text-white font-bold text-lg mb-1">マスタupの処理が終わりました</h2>
            <p className="text-slate-400 text-sm">
              成功 <span className="text-emerald-400 font-bold">{successCount}</span> 件 ／ 失敗 <span className={failCount > 0 ? "text-rose-400 font-bold" : "text-slate-400"}>{failCount}</span> 件
            </p>
          </div>

          {/* 品目ごとの結果 */}
          <ul className="max-h-80 overflow-y-auto space-y-2 mb-6">
            {results.map((r) => (
              <li key={r.itemCode} className={`px-4 py-2.5 rounded-xl border text-sm ${r.ok ? "bg-emerald-500/10 border-emerald-500/30" : "bg-rose-500/10 border-rose-500/30"}`}>
                <div className="flex items-center gap-2">
                  <span>{r.ok ? "✅" : "❌"}</span>
                  <span className="font-mono text-white">{r.itemCode}</span>
                  {r.itemName && <span className="text-slate-300 truncate">{r.itemName}</span>}
                </div>
                {!r.ok && (
                  <div className="mt-1 ml-6 text-xs space-y-0.5">
                    <p className="text-rose-300">{r.message}</p>
                    {r.oraCode && <p className="text-rose-300 font-mono">エラーコード：{r.oraCode}</p>}
                  </div>
                )}
              </li>
            ))}
          </ul>

          <p className="text-slate-400 text-sm text-center mb-1">成功した品目は、MCで正しく表示されるかご確認ください。</p>
          {failCount > 0 && <p className="text-slate-400 text-xs text-center mb-6">失敗した品目は、エラーコードを添えて管理者にご連絡ください。</p>}

          <button
            onClick={() => router.push("/")}
            className="w-full py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400
              text-white font-semibold text-sm transition-all active:scale-95 mt-4"
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
              <h1 className="text-white font-bold text-xl leading-tight">マスタup登録</h1>
              <p className="text-slate-400 text-xs mt-0.5">登録内容を入力してください</p>
            </div>
          </div>

          {/* エラー表示（メール不正・通信エラーなど全体のエラー） */}
          {apiError && (
            <div className="mb-5 px-4 py-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-sm space-y-1">
              <p>⚠ {apiError}</p>
              {oraCode && (
                <>
                  <p className="text-xs text-rose-300 font-mono">エラーコード：{oraCode}</p>
                  <p className="text-xs text-slate-400">管理者に連絡する際は上記のエラーコードをお伝えください。</p>
                </>
              )}
            </div>
          )}

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

            {/* 品目コード（複数行） */}
            <div id="field-itemCodes" tabIndex={-1} className="scroll-mt-6">
              <div className="flex items-end justify-between mb-1.5">
                <label className={`${labelClass} mb-0`}>
                  品目コード <span className="text-rose-400">*</span>
                </label>
                <span className={`text-xs ${itemCount > MASTER_UP_MAX_ITEMS ? "text-rose-400" : "text-slate-400"}`}>
                  {itemCount} / {MASTER_UP_MAX_ITEMS} 件
                </span>
              </div>
              <textarea name="itemCodes" value={form.itemCodes} onChange={handleChange} rows={6} placeholder={"1行に1つずつ入力してください\n例：\nA0001\nA0002"} className={`${inputClass} font-mono tracking-wider resize-y`} />
              <p className="text-slate-500 text-xs mt-1">Excelからの貼り付けもできます。重複した品目コードは1件にまとめて処理します。</p>
              {errors.itemCodes && <p className={errClass}>⚠ {errors.itemCodes}</p>}
            </div>

            {/* 送信ボタン */}
            <button
              type="submit"
              disabled={status === "loading"}
              className="w-full py-3 rounded-xl bg-amber-500 hover:bg-amber-400
                text-white font-bold text-sm transition-all active:scale-95
                disabled:opacity-60 disabled:cursor-not-allowed mt-2"
            >
              {status === "loading" ? `処理中...（${itemCount}件）` : "申請する →"}
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

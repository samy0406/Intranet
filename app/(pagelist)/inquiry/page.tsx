"use client";

import { InquiryFormErrors, URGENCY_OPTIONS } from "@/types/inquiry";
import { Field } from "@/components/Field";
import { ScreenshotInput } from "@/components/ScreenshotInput";
import { FileUpload } from "@/components/FileUpload";
import { BackToHomeButton } from "@/components/BackToHomeButton";
import { useInquiry } from "@/hooks/useInquiry";

const URGENCY_COLOR: Record<string, string> = {
  至急: "bg-red-100 text-red-700",
  高: "bg-orange-100 text-orange-700",
  中: "bg-yellow-100 text-yellow-700",
  低: "bg-slate-100 text-slate-500",
};

export default function HomePage() {
  const { form, files, screenshotUrls, status, isDragging, errors, hasInput, handleChange, handleFileChange, handleDragOver, handleDragLeave, handleDrop, handlePaste, clearScreenshot, handleSubmit, handleReset, formatSize, setForm } = useInquiry();

  // ── 送信完了画面 ──────────────────────────────────
  if (status === "done") {
    return (
      <main className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-10 text-center max-w-sm w-full">
          <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-slate-800 mb-2">送信完了しました</h2>
          <p className="text-slate-500 text-sm mb-8">担当者より折り返しご連絡します。</p>
          <BackToHomeButton />
          <button
            onClick={handleReset}
            className="w-full inline-block py-2.5 rounded-xl bg-indigo-600 text-white font-medium
              text-sm hover:bg-indigo-700 transition-colors text-center"
          >
            新しい問い合わせをする
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50 flex items-center justify-center p-3 sm:p-6">
      <div className="w-full max-w-5xl">
        <div className="mb-4">
          <BackToHomeButton hasInput={hasInput} />
        </div>
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-2">
            <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />
            <span className="text-xs font-bold tracking-widest text-indigo-500 uppercase">Internal Portal</span>
          </div>
          <h1 className="text-3xl font-bold text-slate-800 tracking-tight">お問い合わせ</h1>
          <p className="text-slate-400 text-sm mt-1">MCの問い合わせはこちら</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5 sm:p-8 space-y-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="名前" required error={errors.name} id="field-name">
              <input type="text" name="name" value={form.name} onChange={handleChange} onBlur={(e) => setForm((prev) => ({ ...prev, name: e.target.value.replace(/[\s　]/g, "") }))} placeholder="例：山田太郎" className={inputClass} />
            </Field>
            <Field label="部署" required error={errors.department} id="field-department">
              <input type="text" name="department" value={form.department} onChange={handleChange} placeholder="例：包装課" className={inputClass} />
            </Field>
          </div>

          <Field label="メールアドレス" required error={errors.mail} id="field-mail">
            <input type="email" name="mail" value={form.mail} onChange={handleChange} placeholder="例：taro_yamada@hoyu.co.jp" className={inputClass} />
          </Field>

          <Field label="表題" required error={errors.title} id="field-title">
            <input type="text" name="title" value={form.title} onChange={handleChange} placeholder="〇〇の依頼" className={inputClass} />
          </Field>

          <Field label="緊急度" required error={errors.urgency} id="field-urgency">
            <div className="relative">
              <select name="urgency" value={form.urgency} onChange={handleChange} className={`${inputClass} appearance-none pr-10 cursor-pointer`}>
                <option value="" disabled>
                  選択してください
                </option>
                {URGENCY_OPTIONS.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-3 flex items-center">
                <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>
            {form.urgency && <span className={`inline-block mt-2 text-xs font-semibold px-2.5 py-1 rounded-full ${URGENCY_COLOR[form.urgency]}`}>{form.urgency}</span>}
          </Field>

          {form.urgency === "至急" && (
            <div className="border border-red-200 bg-red-50 rounded-xl p-4 space-y-4">
              <p className="text-red-600 text-xs font-semibold">至急の対応が必要な場合は、以下の内容もご記入ください。</p>
              <Field label="理由" required error={errors.reason} id="field-reason">
                <textarea name="reason" value={form.reason} onChange={handleChange} rows={3} required className={`${inputClass} resize-none`} />
              </Field>
              <Field label="承認者" required error={errors.approver} id="field-approver">
                <input type="text" name="approver" value={form.approver} onChange={handleChange} onBlur={(e) => setForm((prev) => ({ ...prev, approver: e.target.value.replace(/[\s　]/g, "") }))} />
              </Field>
            </div>
          )}

          <Field label="画面の開き方（経路）">
            <textarea name="screenPath" value={form.screenPath} onChange={handleChange} rows={5} placeholder="例：MCFRAME実運用⇒４製造管理⇒製造計画⇒指図済/着手中にチェック⇒検索(F1)" className={`${inputClass} resize-none`} />
          </Field>

          <Field label="問い合わせ経緯" required error={errors.message} id="field-message">
            <textarea name="message" value={form.message} onChange={handleChange} rows={6} placeholder="例：○○の作業をしていたところ、○○の処理をしてうまくいかなかった。" className={`${inputClass} resize-none`} />
          </Field>

          <ScreenshotInput screenshotUrls={screenshotUrls} error={errors.screenshot} onPaste={handlePaste} onClear={clearScreenshot} />

          <Field label="対応希望内容（最終的にどうなれば解決か）" required hint="データ修正の場合、どの項目をどう修正すればいいかなるべく詳細に" error={errors.resolution} id="field-resolution">
            <textarea name="resolution" value={form.resolution} onChange={handleChange} rows={6} placeholder="例：〇〇画面の△△項目を「×××」から「○○○」に修正していただきたい。" className={`${inputClass} resize-none`} />
          </Field>

          <FileUpload files={files} isDragging={isDragging} onFileChange={handleFileChange} onDragOver={handleDragOver} onDragLeave={handleDragLeave} onDrop={handleDrop} onClear={(index) => setFiles((prev) => prev.filter((_, i) => i !== index))} formatSize={formatSize} />

          <button
            type="submit"
            disabled={status === "loading"}
            className="w-full py-3 rounded-xl bg-indigo-600 text-white font-semibold text-sm
              hover:bg-indigo-700 active:scale-[0.98] transition-all disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {status === "loading" ? "送信中..." : "送信する →"}
          </button>
        </form>
      </div>
    </main>
  );
}

const inputClass = `
  w-full px-4 py-3 rounded-xl border border-slate-200 text-slate-800 text-base bg-white
  focus:outline-none focus:ring-2 focus:ring-indigo-300 focus:border-transparent transition
`;

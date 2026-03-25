"use client";

import { useState, useRef, DragEvent, ChangeEvent, FormEvent, ClipboardEvent } from "react";
import { useRouter } from "next/navigation";
import { InquiryFormData, InquiryFormErrors, ApiResponse, URGENCY_OPTIONS } from "@/types/inquiry";
import { validateInquiryForm } from "@/lib/validate";
import { error } from "console";

type Status = "idle" | "loading";

// 緊急度ごとのバッジ色
const URGENCY_COLOR: Record<string, string> = {
  至急: "bg-red-100 text-red-700",
  高: "bg-orange-100 text-orange-700",
  中: "bg-yellow-100 text-yellow-700",
  低: "bg-slate-100 text-slate-500",
};

export default function HomePage() {
  const [form, setForm] = useState<InquiryFormData>({
    name: "",
    department: "",
    title: "",
    urgency: "",
    screenPath: "",
    message: "",
    resolution: "",
  });
  const [file, setFile] = useState<File | null>(null);
  const [screenshot, setScreenshot] = useState<File | null>(null); // Ctrl+V 貼り付け画像
  const [screenshotUrl, setScreenshotUrl] = useState<string | null>(null); // プレビュー用URL
  const [status, setStatus] = useState<Status>("idle");
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [errors, setErrors] = useState<InquiryFormErrors>({});
  const fileInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  // ── テキスト入力の変更 ────────────────────────────
  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  // ── ファイル選択 ──────────────────────────────────
  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    setFile(e.target.files?.[0] ?? null);
  };

  // ── ドラッグ&ドロップ ─────────────────────────────
  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };
  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  };
  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    const dropped = e.dataTransfer.files[0];
    if (dropped) setFile(dropped);
  };

  // ── Ctrl+V でスクリーンショット貼り付け ─────────
  // ClipboardEvent = クリップボード操作（コピー/貼り付け）のイベント型
  const handlePaste = (e: ClipboardEvent<HTMLDivElement>) => {
    const items = Array.from(e.clipboardData.items);
    // クリップボードの中から画像だけを探す
    const imageItem = items.find((item) => item.type.startsWith("image/"));
    if (!imageItem) return;

    const blob = imageItem.getAsFile(); // クリップボードの画像をFileオブジェクトに変換
    if (!blob) return;

    // 貼り付けた画像に timestamp でファイル名を付ける
    const pastedFile = new File([blob], `screenshot_${Date.now()}.png`, { type: blob.type });
    setScreenshot(pastedFile);

    // プレビュー表示用のURL生成（ブラウザのメモリ上に一時的に作る）
    // URL.createObjectURL = ファイルをブラウザ内だけで使えるURLに変換する
    if (screenshotUrl) URL.revokeObjectURL(screenshotUrl); // 古いURLを解放してメモリ節約
    setScreenshotUrl(URL.createObjectURL(pastedFile));
  };

  // ── スクリーンショットを削除 ──────────────────────
  const clearScreenshot = () => {
    if (screenshotUrl) URL.revokeObjectURL(screenshotUrl);
    setScreenshot(null);
    setScreenshotUrl(null);
  };

  // ── フォーム送信 ──────────────────────────────────
  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    // バリデーションを一括実行（スクリーンショットも含む）
    const newErrors = validateInquiryForm(form, screenshot);
    setErrors(newErrors);

    // エラーがあれば止める
    if (Object.keys(newErrors).length > 0) return;

    // ここまで来たら全項目OK → 送信開始
    setStatus("loading");

    const data = new FormData();
    Object.entries(form).forEach(([key, val]) => data.append(key, val));
    // Object.entries = オブジェクトを [key, value] のペア配列に変換してループ
    if (file) data.append("file", file);
    if (screenshot) data.append("screenshot", screenshot);

    try {
      const res = await fetch("/api/submit", { method: "POST", body: data });
      const json: ApiResponse = await res.json();
      if (json.status === "ok") {
        router.push("/done");
      } else {
        setErrors({ resolution: json.message });
      }
    } catch {
      setErrors({ resolution: "通信エラーが発生しました" });
    }
  };

  const formatSize = (bytes: number) => (bytes < 1024 * 1024 ? `${(bytes / 1024).toFixed(1)} KB` : `${(bytes / (1024 * 1024)).toFixed(1)} MB`);

  return (
    <main className="min-h-screen bg-slate-50 flex items-center justify-center p-3 sm:p-6">
      <div className="w-full max-w-5xl">
        {/* ヘッダー */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-2">
            <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />
            <span className="text-xs font-bold tracking-widest text-indigo-500 uppercase">Internal Portal</span>
          </div>
          <h1 className="text-3xl font-bold text-slate-800 tracking-tight">お問い合わせ</h1>
          <p className="text-slate-400 text-sm mt-1">MCの問い合わせはこちら</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5 sm:p-8 space-y-8">
          {/* ── 名前・部署 ── */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="お名前" required error={errors.name}>
              <input type="text" name="name" value={form.name} onChange={handleChange} placeholder="山田 太郎" required className={inputClass} />
            </Field>
            <Field label="部署" required error={errors.department}>
              <input type="text" name="department" value={form.department} onChange={handleChange} placeholder="例：包装課" className={inputClass} />
            </Field>
          </div>

          {/* ── 区切り線 ── */}
          <hr className="border-slate-100" />

          {/* ── 表題 ── */}
          <Field label="表題" required error={errors.title}>
            <input type="text" name="title" value={form.title} onChange={handleChange} placeholder="〇〇の依頼" required className={inputClass} />
          </Field>

          {/* ── 緊急度 ── */}
          <Field label="緊急度" required>
            {/* セレクトボックス（プルダウン） */}
            <div className="relative">
              <select name="urgency" value={form.urgency} onChange={handleChange} required className={`${inputClass} appearance-none pr-10 cursor-pointer`}>
                <option value="" disabled>
                  選択してください
                </option>
                {/* URGENCY_OPTIONS をループして option タグを生成 */}
                {URGENCY_OPTIONS.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>
              {/* カスタム矢印アイコン */}
              <div className="pointer-events-none absolute inset-y-0 right-3 flex items-center">
                <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>
            {/* 選択中の緊急度をバッジで表示 */}
            {form.urgency && <span className={`inline-block mt-2 text-xs font-semibold px-2.5 py-1 rounded-full ${URGENCY_COLOR[form.urgency]}`}>{form.urgency}</span>}
          </Field>

          {/* ── 画面の開き方 ── */}
          <Field label="画面の開き方（経路）">
            <textarea name="screenPath" value={form.screenPath} onChange={handleChange} rows={5} placeholder="例：MCFRAME実運用⇒４製造管理⇒製造計画⇒指図済/着手中にチェック⇒検索(F1)" className={`${inputClass} resize-none`} />
          </Field>

          {/* ── 問い合わせ経緯 ── */}
          <Field label="問い合わせ経緯" required error={errors.message}>
            <textarea name="message" value={form.message} onChange={handleChange} rows={6} required placeholder="例：○○の作業をしていたところ、○○の処理をしてうまくいかなかった。" className={`${inputClass} resize-none`} />
          </Field>

          {/* ── スクリーンショット（Ctrl+V） ── */}
          <Field label="スクリーンショット" required hint="Ctrl + V で貼り付け" error={errors.screenshot}>
            <div
              onPaste={handlePaste}
              tabIndex={0} // tabIndex=0 でキーボードフォーカスを受け取れるようにする（Ctrl+Vに必要）
              className="border-2 border-dashed border-slate-200 rounded-xl p-5 text-center
                cursor-text focus:outline-none focus:border-indigo-300 focus:bg-indigo-50 transition-colors"
            >
              {screenshotUrl ? (
                <div className="relative">
                  {/* 貼り付けた画像のプレビュー */}
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={screenshotUrl} alt="スクリーンショット" className="max-h-48 mx-auto rounded-lg shadow-sm" />
                  <button type="button" onClick={clearScreenshot} className="mt-3 text-xs text-rose-400 hover:text-rose-600 transition-colors">
                    ✕ 削除する
                  </button>
                </div>
              ) : (
                <div>
                  <p className="text-slate-400 text-sm">
                    ここをクリックして <kbd className="bg-slate-100 px-1.5 py-0.5 rounded text-xs font-mono">Ctrl</kbd> + <kbd className="bg-slate-100 px-1.5 py-0.5 rounded text-xs font-mono">V</kbd> で貼り付け
                  </p>
                  <p className="text-slate-300 text-xs mt-1">PrintScreen や Snipping Tool でコピーした画像に対応</p>
                </div>
              )}
            </div>
          </Field>

          {/* ── 対応希望内容 ── */}
          <Field label="対応希望内容（最終的にどうなれば解決か）" required hint="データ修正の場合、どの項目をどう修正すればいいかなるべく詳細に" error={errors.resolution}>
            <textarea name="resolution" value={form.resolution} onChange={handleChange} rows={6} required placeholder="例：〇〇画面の△△項目を「×××」から「○○○」に修正していただきたい。" className={`${inputClass} resize-none`} />
          </Field>

          {/* ── ファイル添付 ── */}
          <Field label="ファイル添付">
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-xl p-5 text-center cursor-pointer transition-colors
                ${isDragging ? "border-indigo-400 bg-indigo-50" : "border-slate-200 hover:border-indigo-300 hover:bg-indigo-50"}`}
            >
              {file ? (
                <div className="flex items-center justify-between bg-indigo-50 rounded-lg px-4 py-2.5">
                  <div className="text-left">
                    <p className="text-indigo-700 text-sm font-medium truncate max-w-xs">📎 {file.name}</p>
                    <p className="text-indigo-400 text-xs mt-0.5">{formatSize(file.size)}</p>
                  </div>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setFile(null);
                    }}
                    className="text-slate-400 hover:text-rose-500 transition-colors ml-3 text-lg leading-none"
                  >
                    ×
                  </button>
                </div>
              ) : (
                <div>
                  <p className="text-slate-500 text-sm">クリックまたはドラッグ&ドロップ</p>
                  <p className="text-slate-300 text-xs mt-1">PDF / Word / Excel / 画像（最大10MB）</p>
                </div>
              )}
              <input ref={fileInputRef} type="file" style={{ display: "none" }} accept=".pdf,.doc,.docx,.xls,.xlsx,.png,.jpg,.jpeg" onChange={handleFileChange} />
            </div>
          </Field>

          {/* ── 送信ボタン ── */}
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

// ── 共通スタイル ──────────────────────────────────
const inputClass = `
  w-full px-4 py-3 rounded-xl border border-slate-200 text-slate-800 text-base bg-white
  focus:outline-none focus:ring-2 focus:ring-indigo-300 focus:border-transparent transition
`;

// ── Fieldコンポーネント（ラベル + ヒント + 入力欄） ──
type FieldProps = {
  label: string;
  required?: boolean;
  hint?: string; // 注釈テキスト（グレーの小さい文字）
  error?: string; // エラーメッセージ
  children: React.ReactNode;
};
function Field({ label, required, hint, error, children }: FieldProps) {
  return (
    <div>
      <div className="flex items-baseline gap-2 mb-1.5">
        <label className="text-sm font-semibold text-slate-400 uppercase tracking-wide">
          {label} {required && <span className="text-rose-400">*</span>}
        </label>
        {/* hint = 注釈（グレーの小さい文字で表示） */}
        {hint && <span className="text-sm text-slate-300 truncate">{hint}</span>}
      </div>
      {children}
      {error && <p className="text-rose-500 text-xs mt-1">{error}</p>}
    </div>
  );
}

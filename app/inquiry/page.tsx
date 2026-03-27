"use client";

import { useState, DragEvent, ChangeEvent, FormEvent, ClipboardEvent } from "react";
import { useRouter } from "next/navigation";
import { InquiryFormData, InquiryFormErrors, ApiResponse, URGENCY_OPTIONS } from "@/types/inquiry";
import { validateInquiryForm } from "@/lib/validate";
import { Field } from "@/components/Field";
import { ScreenshotInput } from "@/components/ScreenshotInput";
import { FileUpload } from "@/components/FileUpload";

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
    if (Object.keys(newErrors).length > 0) {
      // エラーのキーの順番（画面の上から順に定義）
      const fieldOrder: (keyof InquiryFormErrors)[] = ["name", "department", "title", "urgency", "message", "screenshot", "resolution"];

      // 最初にエラーがある項目を探す
      const firstErrorKey = fieldOrder.find((key) => newErrors[key]);

      if (firstErrorKey) {
        setTimeout(() => {
          // id="field-xxx" の要素を探してスクロール＋フォーカス
          const el = document.getElementById(`field-${firstErrorKey}`);
          el?.scrollIntoView({ behavior: "smooth", block: "center" });
          el?.focus();
        }, 0);
      }
      return;
    }

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
        setStatus("idle");
      }
    } catch {
      setErrors({ resolution: "通信エラーが発生しました" });
      setStatus("idle");
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
            <Field label="お名前" required error={errors.name} id="field-name">
              <input type="text" name="name" value={form.name} onChange={handleChange} placeholder="山田 太郎" className={inputClass} />
            </Field>
            <Field label="部署" required error={errors.department} id="field-department">
              <input type="text" name="department" value={form.department} onChange={handleChange} placeholder="例：包装課" className={inputClass} />
            </Field>
          </div>

          {/* ── 区切り線 ── */}
          <hr className="border-slate-100" />

          {/* ── 表題 ── */}
          <Field label="表題" required error={errors.title} id="field-title">
            <input type="text" name="title" value={form.title} onChange={handleChange} placeholder="〇〇の依頼" className={inputClass} />
          </Field>

          {/* ── 緊急度 ── */}
          <Field label="緊急度" required error={errors.urgency} id="field-urgency">
            {/* セレクトボックス（プルダウン） */}
            <div className="relative">
              <select name="urgency" value={form.urgency} onChange={handleChange} className={`${inputClass} appearance-none pr-10 cursor-pointer`}>
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
          <Field label="問い合わせ経緯" required error={errors.message} id="field-message">
            <textarea name="message" value={form.message} onChange={handleChange} rows={6} placeholder="例：○○の作業をしていたところ、○○の処理をしてうまくいかなかった。" className={`${inputClass} resize-none`} />
          </Field>

          <ScreenshotInput screenshotUrl={screenshotUrl} error={errors.screenshot} onPaste={handlePaste} onClear={clearScreenshot} />

          {/* ── 対応希望内容 ── */}
          <Field label="対応希望内容（最終的にどうなれば解決か）" required hint="データ修正の場合、どの項目をどう修正すればいいかなるべく詳細に" error={errors.resolution} id="field-resolution">
            <textarea name="resolution" value={form.resolution} onChange={handleChange} rows={6} placeholder="例：〇〇画面の△△項目を「×××」から「○○○」に修正していただきたい。" className={`${inputClass} resize-none`} />
          </Field>

          <FileUpload file={file} isDragging={isDragging} onFileChange={handleFileChange} onDragOver={handleDragOver} onDragLeave={handleDragLeave} onDrop={handleDrop} onClear={() => setFile(null)} formatSize={formatSize} />

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

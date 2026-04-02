"use client";

import { useState, FormEvent, ChangeEvent, ClipboardEvent } from "react";
import { useRouter } from "next/navigation";
import { BackToHomeButton } from "@/components/BackToHomeButton";
import { ScreenshotInput } from "@/components/ScreenshotInput";

// ── 型定義 ──────────────────────────────────────────
type FormData = {
  department: string;
  name: string;
  mail: string;
  itemCode: string;
  lotNo: string;
};

type Errors = {
  department?: string;
  name?: string;
  mail?: string;
  screenshot?: string;
  itemCode?: string;
  lotNo?: string;
};

type Status = "idle" | "loading" | "done";

// ── バリデーション ────────────────────────────────────
function validate(form: FormData, screenshot: File | null): Errors {
  const errors: Errors = {};
  if (!form.department.trim()) errors.department = "部署を入力してください";
  if (!form.name.trim()) errors.name = "名前を入力してください";
  if (!form.mail.trim()) {
    errors.mail = "メールアドレスを入力してください";
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.mail)) {
    errors.mail = "正しい形式で入力してください";
  }
  if (!screenshot) errors.screenshot = "スクリーンショットを貼り付けてください";
  if (!form.itemCode.trim()) errors.itemCode = "品目コードを入力してください";
  if (!form.lotNo.trim()) errors.lotNo = "ロットNOを入力してください";
  return errors;
}

export default function JudgmentCancelPage() {
  const [form, setForm] = useState<FormData>({ department: "", name: "", mail: "", itemCode: "", lotNo: "" });
  const [screenshot, setScreenshot] = useState<File | null>(null);
  const [screenshotUrl, setScreenshotUrl] = useState<string | null>(null);
  const [errors, setErrors] = useState<Errors>({});
  const [status, setStatus] = useState<Status>("idle");
  const router = useRouter();

  const hasInput = Object.values(form).some((v) => v !== "") || screenshot !== null;

  // ── テキスト入力 ──────────────────────────────────
  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  // ── Ctrl+V 貼り付け ───────────────────────────────
  const handlePaste = (e: ClipboardEvent<HTMLDivElement>) => {
    const items = Array.from(e.clipboardData.items);
    const imageItem = items.find((item) => item.type.startsWith("image/"));
    if (!imageItem) return;
    const blob = imageItem.getAsFile();
    if (!blob) return;
    const pastedFile = new File([blob], `screenshot_${Date.now()}.png`, { type: blob.type });
    setScreenshot(pastedFile);
    if (screenshotUrl) URL.revokeObjectURL(screenshotUrl);
    setScreenshotUrl(URL.createObjectURL(pastedFile));
  };

  // ── スクリーンショット削除 ────────────────────────
  const clearScreenshot = () => {
    if (screenshotUrl) URL.revokeObjectURL(screenshotUrl);
    setScreenshot(null);
    setScreenshotUrl(null);
  };

  // ── フォーム送信 ──────────────────────────────────
  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const newErrors = validate(form, screenshot);
    setErrors(newErrors);

    if (Object.keys(newErrors).length > 0) {
      const fieldOrder: (keyof Errors)[] = ["department", "name", "mail", "screenshot", "itemCode", "lotNo"];
      const firstKey = fieldOrder.find((k) => newErrors[k]);
      if (firstKey) {
        setTimeout(() => {
          const el = document.getElementById(`field-${firstKey}`);
          el?.scrollIntoView({ behavior: "smooth", block: "center" });
          el?.focus();
        }, 0);
      }
      return;
    }

    setStatus("loading");
    try {
      const data = new FormData();
      Object.entries(form).forEach(([k, v]) => data.append(k, v));
      if (screenshot) data.append("screenshot", screenshot);

      const res = await fetch("/api/judgment-cancel", { method: "POST", body: data });
      const json = await res.json();
      if (json.status === "ok") setStatus("done");
      else {
        setErrors({ lotNo: json.message });
        setStatus("idle");
      }
    } catch {
      setErrors({ lotNo: "通信エラーが発生しました" });
      setStatus("idle");
    }
  };

  // ── 送信完了画面 ──────────────────────────────────
  if (status === "done") {
    return (
      <main className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
        <div className="bg-slate-800 border border-slate-700 rounded-2xl p-10 text-center max-w-sm w-full">
          <div className="w-14 h-14 bg-rose-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl">↩️</span>
          </div>
          <h2 className="text-white font-bold text-lg mb-2">申請を受け付けました</h2>
          <p className="text-slate-400 text-sm mb-8">担当者より折り返しご連絡します。</p>
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
    <main className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-lg">
        {/* 戻るボタン */}
        <div className="mb-6">
          <BackToHomeButton hasInput={hasInput} />
        </div>

        <div className="bg-slate-800 border border-slate-700 rounded-2xl p-8">
          {/* ヘッダー */}
          <div className="flex items-center gap-3 mb-8">
            <div className="w-10 h-10 bg-rose-500/20 rounded-xl flex items-center justify-center">
              <span className="text-xl">↩️</span>
            </div>
            <div>
              <h1 className="text-white font-bold text-xl">総合判定取消</h1>
              <p className="text-slate-400 text-xs mt-0.5">申請内容を入力してください</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* ── 部署・名前 横並び ── */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div id="field-department" tabIndex={-1} className="scroll-mt-6">
                <label className={labelClass}>
                  部署 <span className="text-rose-400">*</span>
                </label>
                <input type="text" name="department" value={form.department} onChange={handleChange} placeholder="例：包装課" className={inputClass} />
                {errors.department && <p className={errClass}>⚠ {errors.department}</p>}
              </div>
              <div id="field-name" tabIndex={-1} className="scroll-mt-6">
                <label className={labelClass}>
                  名前 <span className="text-rose-400">*</span>
                </label>
                <input type="text" name="name" value={form.name} onChange={handleChange} placeholder="例：山田 太郎" className={inputClass} />
                {errors.name && <p className={errClass}>⚠ {errors.name}</p>}
              </div>
            </div>

            {/* ── メールアドレス ── */}
            <div id="field-mail" tabIndex={-1} className="scroll-mt-6">
              <label className={labelClass}>
                メールアドレス <span className="text-rose-400">*</span>
              </label>
              <input type="email" name="mail" value={form.mail} onChange={handleChange} placeholder="例：taro_yamada@hoyu.co.jp" className={inputClass} />
              {errors.mail && <p className={errClass}>⚠ {errors.mail}</p>}
            </div>

            {/* ── スクリーンショット ── */}
            {/*
              ScreenshotInput コンポーネントはもともと白背景用に作られているため
              ダークテーマに合わせてラッパーでスタイルを上書きしている
            */}
            <div id="field-screenshot" tabIndex={-1} className="scroll-mt-6">
              <label className={labelClass}>
                スクリーンショット <span className="text-rose-400">*</span>
                <span className="text-slate-500 normal-case font-normal ml-2">Ctrl + V で貼り付け</span>
              </label>
              <div
                onPaste={handlePaste}
                tabIndex={0}
                className="border-2 border-dashed border-slate-600 rounded-xl p-5 text-center
                  cursor-text focus:outline-none focus:border-rose-400 focus:bg-slate-700/50 transition-colors"
              >
                {screenshotUrl ? (
                  <div>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={screenshotUrl} alt="スクリーンショット" className="max-h-48 mx-auto rounded-lg shadow-sm" />
                    <button type="button" onClick={clearScreenshot} className="mt-3 text-xs text-slate-400 hover:text-rose-400 transition-colors">
                      ✕ 削除する
                    </button>
                  </div>
                ) : (
                  <div>
                    <p className="text-slate-400 text-sm">
                      ここをクリックして <kbd className="bg-slate-700 px-1.5 py-0.5 rounded text-xs font-mono text-slate-300">Ctrl</kbd> + <kbd className="bg-slate-700 px-1.5 py-0.5 rounded text-xs font-mono text-slate-300">V</kbd> で貼り付け
                    </p>
                    <p className="text-slate-600 text-xs mt-1">PrintScreen や Snipping Tool でコピーした画像に対応</p>
                  </div>
                )}
              </div>
              {errors.screenshot && <p className={errClass}>⚠ {errors.screenshot}</p>}
            </div>

            {/* ── 品目コード・ロットNO 横並び ── */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
  );
}

const inputClass = `
  w-full px-4 py-2.5 rounded-xl bg-slate-700 border border-slate-600
  text-white placeholder-slate-500 text-sm
  focus:outline-none focus:ring-2 focus:ring-rose-400 focus:border-transparent transition
`;
const labelClass = "block text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1.5";
const errClass = "text-rose-400 text-xs mt-1";

"use client";

import { ClipboardEvent } from "react";

// ── このコンポーネントが受け取るProps の型 ────────────
type ScreenshotInputProps = {
  screenshotUrl: string | null; // プレビュー表示用URL（nullなら未添付）
  error?: string; // バリデーションエラーメッセージ
  onPaste: (e: ClipboardEvent<HTMLDivElement>) => void; // 貼り付けイベント
  onClear: () => void; // 削除ボタンを押したとき
};

export function ScreenshotInput({ screenshotUrl, error, onPaste, onClear }: ScreenshotInputProps) {
  return (
    <div id="field-screenshot" tabIndex={-1} className="scroll-mt-6">
      {/* ラベル */}
      <div className="flex items-baseline gap-2 mb-1.5">
        <label className="text-sm font-semibold text-slate-400 uppercase tracking-wide">
          スクリーンショット <span className="text-rose-400">*</span>
        </label>
        <span className="text-sm text-slate-300">Ctrl + V で貼り付け</span>
      </div>

      {/* 貼り付けエリア */}
      <div
        onPaste={onPaste}
        tabIndex={0}
        className="border-2 border-dashed border-slate-200 rounded-xl p-5 text-center
          cursor-text focus:outline-none focus:border-indigo-300 focus:bg-indigo-50 transition-colors"
      >
        {screenshotUrl ? (
          // 画像が貼り付けられている状態
          <div className="relative">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={screenshotUrl} alt="スクリーンショット" className="max-h-48 mx-auto rounded-lg shadow-sm" />
            <button type="button" onClick={onClear} className="mt-3 text-xs text-rose-400 hover:text-rose-600 transition-colors">
              ✕ 削除する
            </button>
          </div>
        ) : (
          // 未添付の状態
          <div>
            <p className="text-slate-400 text-sm">
              ここをクリックして <kbd className="bg-slate-100 px-1.5 py-0.5 rounded text-xs font-mono">Ctrl</kbd> + <kbd className="bg-slate-100 px-1.5 py-0.5 rounded text-xs font-mono">V</kbd> で貼り付け
            </p>
            <p className="text-slate-300 text-xs mt-1">PrintScreen や Snipping Tool でコピーした画像に対応</p>
          </div>
        )}
      </div>

      {/* エラーメッセージ */}
      {error && <p className="text-rose-500 text-sm mt-1">⚠ {error}</p>}
    </div>
  );
}

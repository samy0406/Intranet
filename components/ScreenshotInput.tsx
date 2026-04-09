"use client";

import { ClipboardEvent } from "react";

// ── Props の型 ────────────────────────────────────
type ScreenshotInputProps = {
  screenshotUrls: string[]; // 複数のプレビューURL
  error?: string;
  onPaste: (e: ClipboardEvent<HTMLDivElement>) => void;
  onClear: (index: number) => void; // 削除するindexを受け取る
};

export function ScreenshotInput({ screenshotUrls, error, onPaste, onClear }: ScreenshotInputProps) {
  return (
    <div id="field-screenshot" tabIndex={-1} className="scroll-mt-6">
      {/* ラベル */}
      <div className="flex items-baseline gap-2 mb-1.5">
        <label className="text-sm font-semibold text-slate-400 uppercase tracking-wide">
          スクリーンショット <span className="text-rose-400">*</span>
        </label>
        <span className="text-sm text-slate-300">Ctrl + V で複数貼り付け可</span>
      </div>

      {/* 貼り付けエリア */}
      <div
        onPaste={onPaste}
        tabIndex={0}
        className="border-2 border-dashed border-slate-200 rounded-xl p-5 text-center
          cursor-text focus:outline-none focus:border-indigo-300 focus:bg-indigo-50 transition-colors"
      >
        {screenshotUrls.length > 0 ? (
          // 画像が1枚以上貼り付けられている状態
          <div className="space-y-4">
            {screenshotUrls.map((url, index) => (
              <div key={url} className="relative">
                {/* 枚数バッジ */}
                <span className="absolute top-1 left-1 bg-indigo-500 text-white text-xs px-2 py-0.5 rounded-full">{index + 1}枚目</span>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={url} alt={`スクリーンショット${index + 1}`} className="max-h-48 mx-auto rounded-lg shadow-sm" />
                {/* 個別削除ボタン */}
                <button type="button" onClick={() => onClear(index)} className="mt-2 text-xs text-rose-400 hover:text-rose-600 transition-colors">
                  ✕ {index + 1}枚目を削除
                </button>
              </div>
            ))}
            {/* 追加を促すメッセージ */}
            <p className="text-slate-300 text-xs mt-2">
              続けて <kbd className="bg-slate-100 px-1.5 py-0.5 rounded text-xs font-mono">Ctrl</kbd> + <kbd className="bg-slate-100 px-1.5 py-0.5 rounded text-xs font-mono">V</kbd> で追加できます
            </p>
          </div>
        ) : (
          // 未添付の状態
          <div>
            <p className="text-slate-400 text-sm">
              ここをクリックして <kbd className="bg-slate-100 px-1.5 py-0.5 rounded text-xs font-mono">Ctrl</kbd> + <kbd className="bg-slate-100 px-1.5 py-0.5 rounded text-xs font-mono">V</kbd> で貼り付け
            </p>
            <p className="text-slate-300 text-xs mt-1">複数枚貼り付け可能です</p>
          </div>
        )}
      </div>

      {/* エラーメッセージ */}
      {error && <p className="text-rose-500 text-sm mt-1">⚠ {error}</p>}
    </div>
  );
}

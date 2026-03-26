"use client";

import { DragEvent, ChangeEvent, useRef } from "react";

// ── このコンポーネントが受け取るProps の型 ────────────
type FileUploadProps = {
  file: File | null; // 選択中のファイル
  isDragging: boolean; // ドラッグ中かどうか
  error?: string; // エラーメッセージ
  onFileChange: (e: ChangeEvent<HTMLInputElement>) => void; // ファイル選択時
  onDragOver: (e: DragEvent<HTMLDivElement>) => void; // ドラッグ中
  onDragLeave: (e: DragEvent<HTMLDivElement>) => void; // ドラッグが離れた
  onDrop: (e: DragEvent<HTMLDivElement>) => void; // ドロップ時
  onClear: () => void; // ファイル削除時
  formatSize: (bytes: number) => string; // ファイルサイズ整形
};

export function FileUpload({ file, isDragging, error, onFileChange, onDragOver, onDragLeave, onDrop, onClear, formatSize }: FileUploadProps) {
  // fileInputRef はこのコンポーネント内で完結するのでここで定義
  const fileInputRef = useRef<HTMLInputElement>(null);

  return (
    <div id="field-file" tabIndex={-1} className="scroll-mt-6">
      {/* ラベル */}
      <div className="flex items-baseline gap-2 mb-1.5">
        <label className="text-sm font-semibold text-slate-400 uppercase tracking-wide">ファイル添付</label>
      </div>

      {/* ドラッグ&ドロップエリア */}
      <div
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`border-2 border-dashed rounded-xl p-5 text-center cursor-pointer transition-colors
          ${isDragging ? "border-indigo-400 bg-indigo-50" : "border-slate-200 hover:border-indigo-300 hover:bg-indigo-50"}`}
      >
        {file ? (
          // ファイル選択済みの状態
          <div className="flex items-center justify-between bg-indigo-50 rounded-lg px-4 py-2.5">
            <div className="text-left">
              <p className="text-indigo-700 text-sm font-medium truncate max-w-xs">📎 {file.name}</p>
              <p className="text-indigo-400 text-xs mt-0.5">{formatSize(file.size)}</p>
            </div>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation(); // ← クリックがドロップエリアに伝わらないようにする
                onClear();
              }}
              className="text-slate-400 hover:text-rose-500 transition-colors ml-3 text-lg leading-none"
            >
              ×
            </button>
          </div>
        ) : (
          // ファイル未選択の状態
          <div>
            <p className="text-slate-500 text-sm">クリックまたはドラッグ&ドロップ</p>
            <p className="text-slate-300 text-xs mt-1">PDF / Word / Excel / 画像（最大10MB）</p>
          </div>
        )}

        {/* 非表示のinput（クリック時に開く） */}
        <input ref={fileInputRef} type="file" style={{ display: "none" }} accept=".pdf,.doc,.docx,.xls,.xlsx,.png,.jpg,.jpeg" onChange={onFileChange} />
      </div>

      {/* エラーメッセージ */}
      {error && <p className="text-rose-500 text-sm mt-1">⚠ {error}</p>}
    </div>
  );
}

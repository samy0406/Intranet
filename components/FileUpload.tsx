"use client";

import { DragEvent, ChangeEvent, useRef } from "react";

type FileUploadProps = {
  files: File[]; // 複数対応
  isDragging: boolean;
  error?: string;
  onFileChange: (e: ChangeEvent<HTMLInputElement>) => void;
  onDragOver: (e: DragEvent<HTMLDivElement>) => void;
  onDragLeave: (e: DragEvent<HTMLDivElement>) => void;
  onDrop: (e: DragEvent<HTMLDivElement>) => void;
  onClear: (index: number) => void; // indexで個別削除
  formatSize: (bytes: number) => string;
};

export function FileUpload({ files, isDragging, error, onFileChange, onDragOver, onDragLeave, onDrop, onClear, formatSize }: FileUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  return (
    <div id="field-file" tabIndex={-1} className="scroll-mt-6">
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
        {files.length > 0 ? (
          <div className="space-y-2">
            {files.map((f, index) => (
              <div key={index} className="flex items-center justify-between bg-indigo-50 rounded-lg px-4 py-2.5">
                <div className="text-left">
                  <p className="text-indigo-700 text-sm font-medium truncate max-w-xs">📎 {f.name}</p>
                  <p className="text-indigo-400 text-xs mt-0.5">{formatSize(f.size)}</p>
                </div>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onClear(index);
                  }}
                  className="text-slate-400 hover:text-rose-500 transition-colors ml-3 text-lg leading-none"
                >
                  ×
                </button>
              </div>
            ))}
            {/* 追加を促すメッセージ */}
            <p className="text-slate-300 text-xs mt-2">クリックまたはドラッグ&ドロップでさらに追加</p>
          </div>
        ) : (
          <div>
            <p className="text-slate-500 text-sm">クリックまたはドラッグ&ドロップ</p>
            <p className="text-slate-300 text-xs mt-1">PDF / Word / Excel / 画像（最大100MB）</p>
          </div>
        )}

        <input
          ref={fileInputRef}
          type="file"
          style={{ display: "none" }}
          accept=".pdf,.doc,.docx,.xls,.xlsx,.png,.jpg,.jpeg"
          multiple // 複数選択を許可
          onChange={onFileChange}
        />
      </div>

      {error && <p className="text-rose-500 text-sm mt-1">⚠ {error}</p>}
    </div>
  );
}

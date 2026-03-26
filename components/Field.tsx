// ── Fieldコンポーネント（ラベル + ヒント + 入力欄） ──
type FieldProps = {
  label: string;
  required?: boolean;
  hint?: string; // 注釈テキスト（グレーの小さい文字）
  error?: string; // エラーメッセージ
  id?: string; // フォーカス用ID
  children: React.ReactNode;
};

export function Field({ label, required, hint, error, id, children }: FieldProps) {
  return (
    <div id={id} tabIndex={-1} className="scroll-mt-6">
      <div className="flex items-baseline gap-2 mb-1.5">
        <label className="text-sm font-semibold text-slate-400 uppercase tracking-wide">
          {label} {required && <span className="text-rose-400">*</span>}
        </label>
        {/* hint = 注釈（グレーの小さい文字で表示） */}
        {hint && <span className="text-sm text-slate-300 truncate">{hint}</span>}
      </div>
      {children}
      {error && <p className="text-rose-500 text-sm mt-1">{error}</p>}
    </div>
  );
}

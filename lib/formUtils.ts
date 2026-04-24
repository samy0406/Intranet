// lib/formUtils.ts

/**
 * メールアドレスのバリデーション。
 * エラーがあればメッセージ文字列を、問題なければ undefined を返す。
 *
 * 使い方：
 *   const mailError = validateMail(form.mail);
 *   if (mailError) errors.mail = mailError;
 */
export function validateMail(mail: string): string | undefined {
  const trimmed = mail.trim();
  if (!trimmed) return "メールアドレスを入力してください";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) return "正しい形式で入力してください";
  return undefined;
}

/**
 * バリデーションエラーが発生した最初のフィールドへ
 * スクロール＆フォーカスを移動するユーティリティ。
 *
 * 使い方：
 *   focusFirstError(["mail", "itemCode"], errors);
 *
 * page.tsx 側で各フィールドに id="field-{フィールド名}" を付けておく必要があります。
 * 例： <input id="field-mail" ... />
 */
export function focusFirstError(keys: readonly string[], errors: Record<string, unknown>): void {
  const first = keys.find((k) => errors[k]);
  if (!first) return;

  setTimeout(() => {
    const el = document.getElementById(`field-${first}`);
    el?.scrollIntoView({ behavior: "smooth", block: "center" });
    el?.focus();
  }, 0);
}

// ================================================
// バリデーション関数
// ================================================
import { InquiryFormData, InquiryFormErrors } from "@/types/inquiry";

export function validateInquiryForm(form: InquiryFormData, screenshot: File | null): InquiryFormErrors {
  // エラーを入れるオブジェクト（最初は空）
  const errors: InquiryFormErrors = {};

  // ── 各項目のチェック ──────────────────────────
  if (!form.name.trim()) {
    errors.name = "お名前を入力してください";
  }

  if (!form.department.trim()) {
    errors.department = "部署を入力してください";
  }

  if (!form.title.trim()) {
    errors.title = "表題を入力してください";
  }

  if (!form.urgency) {
    errors.urgency = "緊急度を選択してください";
  }

  if (!form.message.trim()) {
    errors.message = "問い合わせ経緯を入力してください";
  } else if (form.message.length > 1000) {
    errors.message = "1000文字以内で入力してください";
  }

  if (!form.resolution.trim()) {
    errors.resolution = "対応希望内容を入力してください";
  } else if (form.resolution.length > 1000) {
    errors.resolution = "1000文字以内で入力してください";
  }

  if (!screenshot) {
    errors.screenshot = "スクリーンショットを貼り付けてください";
  }

  return errors;
}

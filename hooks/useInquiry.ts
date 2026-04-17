import { useState, DragEvent, ChangeEvent, FormEvent, ClipboardEvent } from "react";
import { InquiryFormData, InquiryFormErrors, ApiResponse } from "@/types/inquiry";
import { validateInquiryForm } from "@/lib/validate";

// ── 型定義 ──────────────────────────────────────────
export type Status = "idle" | "loading" | "done";

// ── フォームの初期値 ──────────────────────────────────
export const INITIAL_FORM: InquiryFormData = {
  name: "",
  department: "",
  mail: "",
  title: "",
  urgency: "",
  screenPath: "",
  message: "",
  resolution: "",
  reason: "",
  approver: "",
};

export function useInquiry() {
  const [form, setForm] = useState<InquiryFormData>(INITIAL_FORM);
  const [files, setFiles] = useState<File[]>([]);
  const [screenshots, setScreenshots] = useState<File[]>([]);
  const [screenshotUrls, setScreenshotUrls] = useState<string[]>([]);
  const [status, setStatus] = useState<Status>("idle");
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [errors, setErrors] = useState<InquiryFormErrors>({});

  // ── テキスト入力 ──────────────────────────────────
  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    const noSpaceFields = ["name", "approver"];
    const sanitized = noSpaceFields.includes(name) ? value.replace(/[\s　]/g, "") : value;
    setForm((prev) => ({ ...prev, [name]: sanitized }));
  };

  // ── ファイル添付 ──────────────────────────────────
  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const selected = Array.from(e.target.files ?? []);
    setFiles((prev) => [...prev, ...selected]);
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
    const dropped = Array.from(e.dataTransfer.files);
    if (dropped.length > 0) setFiles((prev) => [...prev, ...dropped]);
  };

  // ── スクリーンショット貼り付け ────────────────────
  const handlePaste = (e: ClipboardEvent<HTMLDivElement>) => {
    const items = Array.from(e.clipboardData.items);
    const imageItem = items.find((item) => item.type.startsWith("image/"));
    if (!imageItem) return;
    const blob = imageItem.getAsFile();
    if (!blob) return;
    const pastedFile = new File([blob], `screenshot_${Date.now()}.png`, { type: blob.type });
    setScreenshots((prev) => [...prev, pastedFile]);
    setScreenshotUrls((prev) => [...prev, URL.createObjectURL(pastedFile)]);
  };

  // ── スクリーンショット削除 ────────────────────────
  const clearScreenshot = (index: number) => {
    URL.revokeObjectURL(screenshotUrls[index]);
    setScreenshots((prev) => prev.filter((_, i) => i !== index));
    setScreenshotUrls((prev) => prev.filter((_, i) => i !== index));
  };

  // ── フォーム送信 ──────────────────────────────────
  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const newErrors = validateInquiryForm(form, screenshots[0] ?? null);
    setErrors(newErrors);

    if (Object.keys(newErrors).length > 0) {
      const fieldOrder: (keyof InquiryFormErrors)[] = ["name", "department", "mail", "title", "urgency", "reason", "approver", "message", "screenshot", "resolution"];
      const firstErrorKey = fieldOrder.find((key) => newErrors[key]);
      if (firstErrorKey) {
        setTimeout(() => {
          const el = document.getElementById(`field-${firstErrorKey}`);
          el?.scrollIntoView({ behavior: "smooth", block: "center" });
          el?.focus();
        }, 0);
      }
      return;
    }

    setStatus("loading");
    const data = new FormData();
    Object.entries(form).forEach(([key, val]) => data.append(key, val));
    files.forEach((f) => data.append("files", f));
    screenshots.forEach((s) => data.append("screenshots", s));

    try {
      const res = await fetch("/api/submit", { method: "POST", body: data });
      const json: ApiResponse = await res.json();
      if (json.status === "ok") {
        setStatus("done");
      } else {
        setErrors({ resolution: json.message });
        setStatus("idle");
      }
    } catch {
      setErrors({ resolution: "通信エラーが発生しました" });
      setStatus("idle");
    }
  };

  // ── リセット ──────────────────────────────────────
  const handleReset = () => {
    setForm(INITIAL_FORM);
    setFiles([]);
    setScreenshots([]);
    setScreenshotUrls([]);
    setErrors({});
    setStatus("idle");
  };

  const formatSize = (bytes: number) => (bytes < 1024 * 1024 ? `${(bytes / 1024).toFixed(1)} KB` : `${(bytes / (1024 * 1024)).toFixed(1)} MB`);

  const hasInput = Object.values(form).some((v) => v !== "") || screenshots.length > 0 || files.length > 0;

  return {
    form,
    files,
    screenshots,
    screenshotUrls,
    status,
    isDragging,
    errors,
    hasInput,
    handleChange,
    handleFileChange,
    handleDragOver,
    handleDragLeave,
    handleDrop,
    handlePaste,
    clearScreenshot,
    handleSubmit,
    handleReset,
    formatSize,
    setForm,
  };
}

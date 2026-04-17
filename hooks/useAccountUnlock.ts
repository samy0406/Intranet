import { useState, ChangeEvent, FormEvent } from "react";
import { useRouter } from "next/navigation";

// ── 型定義 ──────────────────────────────────────────
export type FormData = { mail: string; accountCode: string };
export type Errors = { mail?: string; accountCode?: string };
export type Status = "idle" | "loading" | "done";

// ── バリデーション ────────────────────────────────────
function validate(form: FormData): Errors {
  const errors: Errors = {};
  if (!form.mail.trim()) errors.mail = "メールアドレスを入力してください";
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.mail)) errors.mail = "正しい形式で入力してください";
  if (!form.accountCode.trim()) errors.accountCode = "アカウントコードを入力してください";
  return errors;
}

export function useAccountUnlock() {
  const [form, setForm] = useState<FormData>({ mail: "", accountCode: "" });
  const [errors, setErrors] = useState<Errors>({});
  const [status, setStatus] = useState<Status>("idle");
  const router = useRouter();

  const hasInput = Object.values(form).some((v) => v !== "");

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const newErrors = validate(form);
    setErrors(newErrors);

    if (Object.keys(newErrors).length > 0) {
      const fieldOrder = ["mail", "accountCode"] as const;
      const first = fieldOrder.find((k) => newErrors[k]);
      if (first) {
        setTimeout(() => {
          const el = document.getElementById(`field-${first}`);
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
      const res = await fetch("/api/account-unlock", { method: "POST", body: data });
      const json = await res.json();
      if (json.status === "ok") {
        setStatus("done");
      } else {
        setErrors({ accountCode: json.message });
        setStatus("idle");
      }
    } catch {
      setErrors({ accountCode: "通信エラーが発生しました" });
      setStatus("idle");
    }
  };

  return { form, errors, status, hasInput, handleChange, handleSubmit, router };
}

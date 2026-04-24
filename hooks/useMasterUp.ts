import { useState, ChangeEvent, FormEvent } from "react";
import { validateMail, focusFirstError } from "@/lib/formUtils";
import { useRouter } from "next/navigation";

// ── 型定義 ──────────────────────────────────────────
export type MasterUpForm = { mail: string; itemCode: string };
export type MasterUpErrors = { mail?: string; itemCode?: string };
export type Status = "idle" | "loading" | "done";

// ── バリデーション（純粋関数） ────────────────────────
function validate(form: MasterUpForm): MasterUpErrors {
  const errors: MasterUpErrors = {};
  const mailError = validateMail(form.mail);
  if (mailError) errors.mail = mailError;
  if (!form.itemCode.trim()) errors.itemCode = "品目コードを入力してください";
  return errors;
}

export function useMasterUp() {
  const [form, setForm] = useState<MasterUpForm>({ mail: "", itemCode: "" });
  const [errors, setErrors] = useState<MasterUpErrors>({});
  const [apiError, setApiError] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const router = useRouter();

  const hasInput = Object.values(form).some((v) => v !== "");

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const newErrors = validate(form);
    setErrors(newErrors);

    if (Object.keys(newErrors).length > 0) {
      focusFirstError(["mail", "itemCode"], newErrors);
      return;
    }

    setStatus("loading");
    setApiError("");
    try {
      const res = await fetch("/api/master", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const json = await res.json();
      if (json.status === "ok") {
        setStatus("done");
      } else {
        setApiError(json.message ?? "エラーが発生しました");
        setStatus("idle");
      }
    } catch {
      setApiError("通信エラーが発生しました");
      setStatus("idle");
    }
  };

  return { form, errors, apiError, status, hasInput, handleChange, handleSubmit, router };
}

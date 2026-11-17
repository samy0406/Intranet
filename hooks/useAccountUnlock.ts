// hooks/useAccountUnlock.ts
"use client";

import { useState, ChangeEvent, FormEvent } from "react";
import { validateMail, focusFirstError } from "@/lib/formUtils";
import { useRouter } from "next/navigation";
import type { AccountType } from "@/lib/constants";

// ── 型定義 ──────────────────────────────────────────
// accountType の "" は「まだ選んでいない」状態
export type AccountUnlockForm = { mail: string; accountType: AccountType | ""; accountCode: string };
export type AccountUnlockErrors = { mail?: string; accountType?: string; accountCode?: string };
export type Status = "idle" | "loading" | "done";

function validate(form: AccountUnlockForm): AccountUnlockErrors {
  const errors: AccountUnlockErrors = {};
  const mailError = validateMail(form.mail);
  if (mailError) errors.mail = mailError;
  if (!form.accountType) errors.accountType = "アカウントの種類を選択してください";
  if (!form.accountCode.trim()) errors.accountCode = "アカウントコードを入力してください";
  return errors;
}

export function useAccountUnlock() {
  const [form, setForm] = useState<AccountUnlockForm>({ mail: "", accountType: "", accountCode: "" });
  const [errors, setErrors] = useState<AccountUnlockErrors>({});
  const [apiError, setApiError] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const router = useRouter();

  const hasInput = Object.values(form).some((v) => v !== "");

  // <input> と <select> の両方で使えるようにする
  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const newErrors = validate(form);
    setErrors(newErrors);

    if (Object.keys(newErrors).length > 0) {
      focusFirstError(["mail", "accountType", "accountCode"], newErrors);
      return;
    }

    setStatus("loading");
    setApiError("");
    try {
      const res = await fetch("/api/account-unlock", {
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

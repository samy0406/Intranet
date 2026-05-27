// hooks/useMasterUp.ts
"use client";

import { useState, ChangeEvent, FormEvent } from "react";
import { validateMail, focusFirstError } from "@/lib/formUtils";
import { useRouter } from "next/navigation";

export type MasterUpForm = { mail: string; itemCode: string };
export type MasterUpErrors = { mail?: string; itemCode?: string };
export type Status = "idle" | "loading" | "done";

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
  const [oraCode, setOraCode] = useState(""); // ORAエラーコード
  const [itemName, setItemName] = useState("");
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
    setOraCode("");
    try {
      const res = await fetch("/api/master-up", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const json = await res.json();
      if (res.ok) {
        setItemName(json.itemName ?? "");
        setStatus("done");
      } else {
        setApiError(json.message ?? "エラーが発生しました");
        setOraCode(json.oraCode ?? ""); // ORAエラーコードを保存
        setStatus("idle");
      }
    } catch {
      setApiError("通信エラーが発生しました");
      setStatus("idle");
    }
  };

  return { form, errors, apiError, oraCode, itemName, status, hasInput, handleChange, handleSubmit, router };
}

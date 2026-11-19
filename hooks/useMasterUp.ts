// hooks/useMasterUp.ts
"use client";

import { useState, ChangeEvent, FormEvent } from "react";
import { validateMail, focusFirstError } from "@/lib/formUtils";
import { MASTER_UP_MAX_ITEMS, MASTER_UP_ITEM_CODE_MAX_LENGTH, parseItemCodes } from "@/lib/constants";
import { useRouter } from "next/navigation";

// itemCodes はテキストエリアの生の文字列（改行区切り）
export type MasterUpForm = { mail: string; itemCodes: string };
export type MasterUpErrors = { mail?: string; itemCodes?: string };
export type Status = "idle" | "loading" | "done";

// API から返ってくる1品目ぶんの処理結果
export type MasterUpResult = {
  itemCode: string;
  ok: boolean;
  itemName?: string;
  message?: string;
  oraCode?: string | null;
};

function validate(form: MasterUpForm): MasterUpErrors {
  const errors: MasterUpErrors = {};
  const mailError = validateMail(form.mail);
  if (mailError) errors.mail = mailError;

  const codes = parseItemCodes(form.itemCodes);
  if (codes.length === 0) {
    errors.itemCodes = "品目コードを入力してください";
  } else if (codes.length > MASTER_UP_MAX_ITEMS) {
    errors.itemCodes = `一度に申請できるのは${MASTER_UP_MAX_ITEMS}件までです（現在${codes.length}件）`;
  } else {
    // 長すぎる品目コードがあれば、どれが長いかを表示する
    const tooLong = codes.filter((c) => c.length > MASTER_UP_ITEM_CODE_MAX_LENGTH);
    if (tooLong.length > 0) {
      errors.itemCodes = `${MASTER_UP_ITEM_CODE_MAX_LENGTH}文字を超える品目コードがあります：${tooLong.join(", ")}`;
    }
  }
  return errors;
}

export function useMasterUp() {
  const [form, setForm] = useState<MasterUpForm>({ mail: "", itemCodes: "" });
  const [errors, setErrors] = useState<MasterUpErrors>({});
  const [apiError, setApiError] = useState("");
  const [oraCode, setOraCode] = useState(""); // ORAエラーコード（全体エラー用）
  const [results, setResults] = useState<MasterUpResult[]>([]);
  const [status, setStatus] = useState<Status>("idle");
  const router = useRouter();

  const hasInput = Object.values(form).some((v) => v !== "");

  // 入力中の件数（画面に「◯件」と表示する用）
  const itemCount = parseItemCodes(form.itemCodes).length;

  // input と textarea の両方で使えるように型を広げる
  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const newErrors = validate(form);
    setErrors(newErrors);

    if (Object.keys(newErrors).length > 0) {
      focusFirstError(["mail", "itemCodes"], newErrors);
      return;
    }

    setStatus("loading");
    setApiError("");
    setOraCode("");
    try {
      const res = await fetch("/api/master-up", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        // 文字列のままではなく、整形済みの配列にして送る
        body: JSON.stringify({ mail: form.mail, itemCodes: parseItemCodes(form.itemCodes) }),
      });
      const json = await res.json();
      if (res.ok) {
        setResults(json.results ?? []);
        setStatus("done");
      } else {
        setApiError(json.message ?? "エラーが発生しました");
        setOraCode(json.oraCode ?? "");
        setStatus("idle");
      }
    } catch {
      setApiError("通信エラーが発生しました");
      setStatus("idle");
    }
  };

  return { form, errors, apiError, oraCode, results, itemCount, status, hasInput, handleChange, handleSubmit, router };
}

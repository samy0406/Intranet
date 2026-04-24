import { useState, ChangeEvent, FormEvent } from "react";
import { validateMail, focusFirstError } from "@/lib/formUtils";
import { useRouter } from "next/navigation";

// ── 型定義 ──────────────────────────────────────────
export type JudgmentCancelForm = { mail: string; itemCode: string; lotNo: string };
export type JudgmentCancelErrors = Partial<Record<keyof JudgmentCancelForm, string>>;
export type SearchResult = { shiken: string; judgmentDate: string; expiryDate: string };
export type Status = "idle" | "loading" | "done";

function validate(form: JudgmentCancelForm): JudgmentCancelErrors {
  const errors: JudgmentCancelErrors = {};
  const mailError = validateMail(form.mail);
  if (mailError) errors.mail = mailError;
  if (!form.itemCode.trim()) errors.itemCode = "品目コードを入力してください";
  if (!form.lotNo.trim()) errors.lotNo = "ロットNOを入力してください";
  return errors;
}

export function useJudgmentCancel() {
  const [form, setForm] = useState<JudgmentCancelForm>({ mail: "", itemCode: "", lotNo: "" });
  const [errors, setErrors] = useState<JudgmentCancelErrors>({});
  const [apiError, setApiError] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [searchResult, setSearchResult] = useState<SearchResult | null>(null);
  const [searching, setSearching] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const router = useRouter();

  const hasInput = Object.values(form).some((v) => v !== "");

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));

  const fetchStatus = async (): Promise<SearchResult | null> => {
    const res = await fetch(`/api/judgment-cancel/status?itemCode=${encodeURIComponent(form.itemCode)}&lotNo=${encodeURIComponent(form.lotNo)}`);
    const json = await res.json();
    return json.items?.[0] ?? null;
  };

  const handleSearch = async () => {
    if (!form.itemCode.trim() || !form.lotNo.trim()) return;
    setSearching(true);
    setSearchResult(null);
    setApiError("");
    try {
      const result = await fetchStatus();
      if (result) setSearchResult(result);
      else setErrors((prev) => ({ ...prev, itemCode: "該当データが見つかりません" }));
    } catch {
      setApiError("通信エラーが発生しました");
    } finally {
      setSearching(false);
    }
  };

  const handleConfirmOpen = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setApiError("");
    const newErrors = validate(form);
    setErrors(newErrors);

    if (Object.keys(newErrors).length > 0) {
      focusFirstError(["mail", "itemCode", "lotNo"], newErrors);
      return;
    }
    let result = searchResult;
    if (!result) {
      setSearching(true);
      try {
        result = await fetchStatus();
        if (result) setSearchResult(result);
        else {
          setErrors((prev) => ({ ...prev, itemCode: "該当データが見つかりません" }));
          return;
        }
      } catch {
        setApiError("通信エラーが発生しました"); // ✅ 分離
        return;
      } finally {
        setSearching(false);
      }
    }
    setShowConfirm(true);
  };

  const handleSubmit = async () => {
    setShowConfirm(false);
    setStatus("loading");
    setApiError("");
    try {
      const res = await fetch("/api/judgment-cancel", {
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

  return {
    form,
    errors,
    apiError,
    status,
    searchResult,
    searching,
    showConfirm,
    hasInput,
    handleChange,
    handleSearch,
    handleConfirmOpen,
    handleSubmit,
    setShowConfirm,
    router,
  };
}

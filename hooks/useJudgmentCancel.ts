import { useState, ChangeEvent, FormEvent } from "react";
import { useRouter } from "next/navigation";

// ── 型定義 ──────────────────────────────────────────
export type FormData = { mail: string; itemCode: string; lotNo: string };
export type Errors = Partial<Record<keyof FormData, string>>;
export type SearchResult = { shiken: string; judgmentDate: string; expiryDate: string };
export type Status = "idle" | "loading" | "done";

// ── バリデーション ────────────────────────────────────
function validate(form: FormData): Errors {
  const errors: Errors = {};
  if (!form.mail.trim()) errors.mail = "メールアドレスを入力してください";
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.mail)) errors.mail = "正しい形式で入力してください";
  if (!form.itemCode.trim()) errors.itemCode = "品目コードを入力してください";
  if (!form.lotNo.trim()) errors.lotNo = "ロットNOを入力してください";
  return errors;
}

export function useJudgmentCancel() {
  const [form, setForm] = useState<FormData>({ mail: "", itemCode: "", lotNo: "" });
  const [errors, setErrors] = useState<Errors>({});
  const [status, setStatus] = useState<Status>("idle");
  const [searchResult, setSearchResult] = useState<SearchResult | null>(null);
  const [searching, setSearching] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const router = useRouter();

  const hasInput = Object.values(form).some((v) => v !== "");

  // ── テキスト入力 ──────────────────────────────────
  const handleChange = (e: ChangeEvent<HTMLInputElement>) => setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));

  // ── 現在値検索（共通） ────────────────────────────
  const fetchStatus = async (): Promise<SearchResult | null> => {
    const res = await fetch(`/api/judgment-cancel/status?itemCode=${encodeURIComponent(form.itemCode)}&lotNo=${encodeURIComponent(form.lotNo)}`);
    const json = await res.json();
    return json.items?.[0] ?? null;
  };

  // ── 検索ボタン ────────────────────────────────────
  const handleSearch = async () => {
    if (!form.itemCode.trim() || !form.lotNo.trim()) return;
    setSearching(true);
    setSearchResult(null);
    try {
      const result = await fetchStatus();
      if (result) setSearchResult(result);
      else setErrors((prev) => ({ ...prev, itemCode: "該当データが見つかりません" }));
    } catch {
      setErrors((prev) => ({ ...prev, itemCode: "通信エラーが発生しました" }));
    } finally {
      setSearching(false);
    }
  };

  // ── 確認モーダルを開く ────────────────────────────
  const handleConfirmOpen = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const newErrors = validate(form);
    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) return;

    let result = searchResult;
    if (!result) {
      setSearching(true);
      try {
        result = await fetchStatus();
        if (result) {
          setSearchResult(result);
        } else {
          setErrors((prev) => ({ ...prev, itemCode: "該当データが見つかりません" }));
          return;
        }
      } catch {
        setErrors((prev) => ({ ...prev, itemCode: "通信エラーが発生しました" }));
        return;
      } finally {
        setSearching(false);
      }
    }
    setShowConfirm(true);
  };

  // ── 確定：送信 ────────────────────────────────────
  const handleSubmit = async () => {
    setShowConfirm(false);
    setStatus("loading");
    try {
      const data = new FormData();
      Object.entries(form).forEach(([k, v]) => data.append(k, v));
      const res = await fetch("/api/judgment-cancel", { method: "POST", body: data });
      const json = await res.json();
      if (json.status === "ok") {
        setStatus("done");
      } else {
        setErrors({ lotNo: json.message });
        setStatus("idle");
      }
    } catch {
      setErrors({ lotNo: "通信エラーが発生しました" });
      setStatus("idle");
    }
  };

  return {
    form,
    errors,
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

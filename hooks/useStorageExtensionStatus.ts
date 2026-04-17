import { useState, ChangeEvent, FormEvent } from "react";

// ── 型定義 ──────────────────────────────────────────
export type SearchForm = { itemCode: string; lotNo: string };
export type MatchedItem = { itemCode: string; lotNo: string; expiryDate: string };
export type SearchErrors = { itemCode?: string; lotNo?: string };
export type Status = "idle" | "loading";

export function useStorageExtensionStatus() {
  const [form, setForm] = useState<SearchForm>({ itemCode: "", lotNo: "" });
  const [errors, setErrors] = useState<SearchErrors>({});
  const [status, setStatus] = useState<Status>("idle");
  const [results, setResults] = useState<MatchedItem[] | null>(null);
  // null = まだ検索していない
  // []   = 検索したが該当なし
  // [...] = 該当あり

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    setResults(null);
    setErrors({});
  };

  const handleSearch = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const newErrors: SearchErrors = {};
    if (!form.itemCode.trim()) newErrors.itemCode = "品目コードを入力してください";
    if (!form.lotNo.trim()) newErrors.lotNo = "ロットNOを入力してください";
    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) return;

    setStatus("loading");
    try {
      const params = new URLSearchParams({ itemCode: form.itemCode, lotNo: form.lotNo });
      const res = await fetch(`/api/storage-extension/status?${params}`);
      const json = await res.json();

      if (!res.ok) {
        setErrors({ lotNo: json.message ?? "エラーが発生しました" });
        return;
      }

      setResults(json.items);
    } catch {
      setErrors({ lotNo: "通信エラーが発生しました" });
    } finally {
      setStatus("idle");
    }
  };

  return { form, errors, status, results, handleChange, handleSearch };
}

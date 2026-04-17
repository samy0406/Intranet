import { useState, ChangeEvent, FormEvent } from "react";

// ── 型定義 ──────────────────────────────────────────
export type InquiryResult = {
  id: string;
  date: string;
  title: string;
  name: string;
  message: string;
  resolution: string;
  status: string;
};

export type Phase = "input" | "result";

// ── 1ページに表示する件数 ──────────────────────────────
export const PAGE_SIZE = 3;

export function useInquiryStatus() {
  const [mail, setMail] = useState("");
  const [mailError, setMailError] = useState("");
  const [results, setResults] = useState<InquiryResult[]>([]);
  const [phase, setPhase] = useState<Phase>("input");
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState("");
  const [page, setPage] = useState(0);

  // ── 入力変更 ──────────────────────────────────────
  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    setMail(e.target.value.replace(/[\s　]/g, ""));
  };

  // ── 検索実行 ──────────────────────────────────────
  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!mail) {
      setMailError("メールアドレスを入力してください");
      return;
    }
    if (!mail.includes("@")) {
      setMailError("正しいメールアドレスを入力してください");
      return;
    }
    setMailError("");
    setLoading(true);
    setApiError("");

    try {
      const params = new URLSearchParams({ mail });
      const res = await fetch(`/api/inquiry-status?${params}`);
      const json = await res.json();

      if (json.status === "ok") {
        setResults(json.data);
        setPage(0);
        setPhase("result");
      } else {
        setApiError(json.message ?? "エラーが発生しました");
      }
    } catch {
      setApiError("通信エラーが発生しました");
    } finally {
      setLoading(false);
    }
  };

  // ── 再検索 ────────────────────────────────────────
  const handleReset = () => {
    setPhase("input");
    setResults([]);
    setApiError("");
    setPage(0);
    // メールアドレスはクリアせず残しておく
  };

  // ── ページネーション計算 ──────────────────────────
  const totalPages = Math.ceil(results.length / PAGE_SIZE);
  const currentItems = results.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  return {
    mail,
    mailError,
    results,
    phase,
    loading,
    apiError,
    page,
    totalPages,
    currentItems,
    handleChange,
    handleSubmit,
    handleReset,
    setPage,
  };
}

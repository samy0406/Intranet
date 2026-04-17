import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

// ── 型定義 ──────────────────────────────────────────
export type InquiryStatus = "未対応" | "対応中" | "intec対応" | "完了";

export type Inquiry = {
  id: number;
  MC_INQUIRY_NO: number;
  date: string;
  name: string;
  department: string;
  email: string;
  title: string;
  urgency: string;
  status: InquiryStatus;
  inquiryCategory: string;
};

export type SortKey = "id" | "date" | "urgency" | "status";

// ── カテゴリ選択肢 ────────────────────────────────────
export const INQUIRY_CATEGORIES = ["データ修正", "操作方法・使い方", "システム障害・エラー", "帳票・出力", "マスタ設定", "権限・アクセス", "外部連携", "仕様確認", "その他"];

const URGENCY_ORDER: Record<string, number> = { 至急: 0, 高: 1, 中: 2, 低: 3 };
const STATUS_ORDER: Record<string, number> = { 未対応: 0, 対応中: 1, intec対応: 2, 完了: 3 };

export function useAdminInquiries() {
  const [inquiries, setInquiries] = useState<Inquiry[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [sortKey, setSortKey] = useState<SortKey>("date");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [filterUrgency, setFilterUrgency] = useState<string>("");
  const [filterStatuses, setFilterStatuses] = useState<string[]>([]);
  const [filterCategory, setFilterCategory] = useState<string>("");
  const [filterDateFrom, setFilterDateFrom] = useState<string>("");
  const [filterDateTo, setFilterDateTo] = useState<string>("");
  const [openStatusId, setOpenStatusId] = useState<number | null>(null);
  const router = useRouter();

  // ── 初回データ取得 ──────────────────────────────────
  useEffect(() => {
    fetch("/api/admin/inquiries")
      .then((res) => {
        if (!res.ok) throw new Error("データの取得に失敗しました");
        return res.json();
      })
      .then((data: Inquiry[]) => setInquiries(data))
      .catch((err: Error) => setError(err.message));
  }, []);

  // ── ドロップダウンを外クリックで閉じる ─────────────
  useEffect(() => {
    if (openStatusId === null) return;
    const close = () => setOpenStatusId(null);
    document.addEventListener("click", close);
    return () => document.removeEventListener("click", close);
  }, [openStatusId]);

  // ── ステータス変更 ────────────────────────────────
  const handleStatusChange = async (itemId: number, newStatus: InquiryStatus) => {
    const prevInquiries = inquiries;
    setInquiries((prev) => (prev ?? []).map((i) => (i.id === itemId ? { ...i, status: newStatus } : i)));
    setOpenStatusId(null);

    try {
      const res = await fetch(`/api/admin/inquiries/${itemId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ field: "status", value: newStatus }),
      });
      if (!res.ok) throw new Error("保存失敗");
    } catch {
      setInquiries(prevInquiries);
      alert("ステータスの更新に失敗しました。再度お試しください。");
    }
  };

  // ── フィルタートグル ──────────────────────────────
  const toggleStatus = (s: string) => {
    setFilterStatuses((prev) => (prev.includes(s) ? prev.filter((v) => v !== s) : [...prev, s]));
  };

  const resetFilters = () => {
    setFilterUrgency("");
    setFilterStatuses([]);
    setFilterCategory("");
    setFilterDateFrom("");
    setFilterDateTo("");
  };

  // ── ソート ────────────────────────────────────────
  const handleSort = (key: SortKey) => {
    if (sortKey === key) setSortOrder((prev) => (prev === "asc" ? "desc" : "asc"));
    else {
      setSortKey(key);
      setSortOrder("asc");
    }
  };

  // ── フィルター＆ソート済みデータ ──────────────────
  const displayedInquiries = (inquiries ?? [])
    .filter((item) => (filterUrgency ? item.urgency === filterUrgency : true))
    .filter((item) => filterStatuses.length === 0 || filterStatuses.includes(item.status ?? "未対応"))
    .filter((item) => (filterCategory ? item.inquiryCategory === filterCategory : true))
    .filter((item) => {
      const itemDate = item.date.replace(/\//g, "-");
      if (filterDateFrom && itemDate < filterDateFrom) return false;
      if (filterDateTo && itemDate > filterDateTo) return false;
      return true;
    })
    .sort((a, b) => {
      let result = 0;
      if (sortKey === "id") result = a.id - b.id;
      if (sortKey === "date") result = a.date.localeCompare(b.date);
      if (sortKey === "urgency") result = (URGENCY_ORDER[a.urgency] ?? 9) - (URGENCY_ORDER[b.urgency] ?? 9);
      if (sortKey === "status") result = (STATUS_ORDER[a.status ?? "未対応"] ?? 9) - (STATUS_ORDER[b.status ?? "未対応"] ?? 9);
      return sortOrder === "asc" ? result : -result;
    });

  const hasFilter = filterUrgency || filterStatuses.length > 0 || filterCategory || filterDateFrom || filterDateTo;

  return {
    inquiries,
    error,
    sortKey,
    sortOrder,
    displayedInquiries,
    hasFilter,
    filterUrgency,
    filterStatuses,
    filterCategory,
    filterDateFrom,
    filterDateTo,
    openStatusId,
    setFilterUrgency,
    setFilterCategory,
    setFilterDateFrom,
    setFilterDateTo,
    toggleStatus,
    resetFilters,
    handleSort,
    handleStatusChange,
    setOpenStatusId,
    router,
  };
}

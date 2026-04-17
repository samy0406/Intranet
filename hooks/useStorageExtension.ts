import { useState, ChangeEvent, FormEvent } from "react";
import { useRouter } from "next/navigation";

// ── 型定義 ──────────────────────────────────────────
export type BaseFormData = { mail: string };
export type ItemData = { itemCode: string; lotNo: string; expiryDate: string };
export type BaseErrors = { mail?: string };
export type ItemErrors = Partial<Record<keyof ItemData, string>>;
export type SearchResult = { itemName: string; expiryDate: string; makerExpiry: string };
export type Status = "idle" | "loading" | "done";

const createEmptyItem = (): ItemData => ({ itemCode: "", lotNo: "", expiryDate: "" });

// ── バリデーション ────────────────────────────────────
function validate(base: BaseFormData, item: ItemData): { baseErrors: BaseErrors; itemErrors: ItemErrors; valid: boolean } {
  const baseErrors: BaseErrors = {};
  const itemErrors: ItemErrors = {};

  if (!base.mail.trim()) baseErrors.mail = "メールアドレスを入力してください";
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(base.mail)) baseErrors.mail = "正しい形式で入力してください";

  if (!item.itemCode.trim()) itemErrors.itemCode = "品目コードを入力してください";
  if (!item.lotNo.trim()) itemErrors.lotNo = "ロットNOを入力してください";
  if (!item.expiryDate.trim()) itemErrors.expiryDate = "保管期限を入力してください";

  const valid = Object.keys(baseErrors).length === 0 && Object.keys(itemErrors).length === 0;
  return { baseErrors, itemErrors, valid };
}

export function useStorageExtension() {
  const [base, setBase] = useState<BaseFormData>({ mail: "" });
  const [item, setItem] = useState<ItemData>(createEmptyItem());
  const [baseErrors, setBaseErrors] = useState<BaseErrors>({});
  const [itemErrors, setItemErrors] = useState<ItemErrors>({});
  const [status, setStatus] = useState<Status>("idle");
  const [searchResult, setSearchResult] = useState<SearchResult | null>(null);
  const [searching, setSearching] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const router = useRouter();

  const hasInput = base.mail !== "" || item.itemCode !== "" || item.lotNo !== "" || item.expiryDate !== "";

  // ── 基本情報の変更 ────────────────────────────────
  const handleBaseChange = (e: ChangeEvent<HTMLInputElement>) => setBase((prev) => ({ ...prev, [e.target.name]: e.target.value }));

  // ── 品目フィールドの変更 ──────────────────────────
  const handleItemChange = (field: keyof ItemData, value: string) => setItem((prev) => ({ ...prev, [field]: value }));

  // ── 現在値検索 ────────────────────────────────────
  const handleSearch = async () => {
    if (!item.itemCode.trim() || !item.lotNo.trim()) return;
    setSearching(true);
    setSearchResult(null);
    try {
      const res = await fetch(`/api/storage-extension/status?itemCode=${encodeURIComponent(item.itemCode)}&lotNo=${encodeURIComponent(item.lotNo)}`);
      const json = await res.json();
      if (json.items && json.items.length > 0) {
        setSearchResult(json.items[0]);
      } else {
        setItemErrors((prev) => ({ ...prev, itemCode: json.message ?? "該当データが見つかりません" }));
      }
    } catch {
      setItemErrors((prev) => ({ ...prev, itemCode: "通信エラーが発生しました" }));
    } finally {
      setSearching(false);
    }
  };

  // ── 確認モーダルを開く ────────────────────────────
  const handleConfirmOpen = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const { baseErrors: bErr, itemErrors: iErr, valid } = validate(base, item);
    setBaseErrors(bErr);
    setItemErrors(iErr);
    if (!valid) return;

    if (!searchResult) {
      setSearching(true);
      try {
        const res = await fetch(`/api/storage-extension/status?itemCode=${encodeURIComponent(item.itemCode)}&lotNo=${encodeURIComponent(item.lotNo)}`);
        const json = await res.json();
        if (json.items && json.items.length > 0) {
          setSearchResult(json.items[0]);
        } else {
          setItemErrors((prev) => ({ ...prev, itemCode: json.message ?? "該当データが見つかりません" }));
          return;
        }
      } catch {
        setItemErrors((prev) => ({ ...prev, itemCode: "通信エラーが発生しました" }));
        return;
      } finally {
        setSearching(false);
      }
    }
    setShowConfirm(true);
  };

  // ── 確定：DB更新を実行 ────────────────────────────
  const handleSubmit = async () => {
    setShowConfirm(false);
    setStatus("loading");
    try {
      const res = await fetch("/api/storage-extension", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mail: base.mail, itemCode: item.itemCode, lotNo: item.lotNo, expiryDate: item.expiryDate }),
      });
      const json = await res.json();
      if (json.status === "ok") {
        setStatus("done");
      } else {
        setBaseErrors({ mail: json.message });
        setStatus("idle");
      }
    } catch {
      setBaseErrors({ mail: "通信エラーが発生しました" });
      setStatus("idle");
    }
  };

  // ── 続けて入力：品目フィールドだけリセット ────────
  const handleContinue = () => {
    setItem(createEmptyItem());
    setSearchResult(null);
    setBaseErrors({});
    setItemErrors({});
    setStatus("idle");
  };

  return {
    base,
    item,
    baseErrors,
    itemErrors,
    status,
    searchResult,
    searching,
    showConfirm,
    hasInput,
    handleBaseChange,
    handleItemChange,
    handleSearch,
    handleConfirmOpen,
    handleSubmit,
    handleContinue,
    setShowConfirm,
    router,
  };
}

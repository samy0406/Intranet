// hooks/useStorageExtension.ts
import { useState, ChangeEvent, FormEvent } from "react";
import { useRouter } from "next/navigation";
import { validateMail, focusFirstError } from "@/lib/formUtils";

// ── 型定義 ──────────────────────────────────────────
export type StorageBaseForm = { mail: string };
export type StorageItemForm = { itemCode: string; lotNo: string; expiryDate: string };
export type StorageBaseErrors = { mail?: string };
export type StorageItemErrors = Partial<Record<keyof StorageItemForm, string>>;
export type SearchResult = { itemName: string; expiryDate: string; makerExpiry: string };
export type Status = "idle" | "loading" | "done";

const createEmptyItem = (): StorageItemForm => ({ itemCode: "", lotNo: "", expiryDate: "" });

// ── バリデーション ────────────────────────────────────
function validate(base: StorageBaseForm, item: StorageItemForm): { baseErrors: StorageBaseErrors; itemErrors: StorageItemErrors; valid: boolean } {
  const baseErrors: StorageBaseErrors = {};
  const itemErrors: StorageItemErrors = {};

  const mailError = validateMail(base.mail);
  if (mailError) baseErrors.mail = mailError;

  if (!item.itemCode.trim()) itemErrors.itemCode = "品目コードを入力してください";
  if (!item.lotNo.trim()) itemErrors.lotNo = "ロットNOを入力してください";
  if (!item.expiryDate.trim()) itemErrors.expiryDate = "保管期限を入力してください";

  const valid = Object.keys(baseErrors).length === 0 && Object.keys(itemErrors).length === 0;
  return { baseErrors, itemErrors, valid };
}

export function useStorageExtension() {
  const [base, setBase] = useState<StorageBaseForm>({ mail: "" });
  const [item, setItem] = useState<StorageItemForm>(createEmptyItem());
  const [baseErrors, setBaseErrors] = useState<StorageBaseErrors>({});
  const [itemErrors, setItemErrors] = useState<StorageItemErrors>({});
  const [apiError, setApiError] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [searchResult, setSearchResult] = useState<SearchResult | null>(null);
  const [searching, setSearching] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const router = useRouter();

  const hasInput = [...Object.values(base), ...Object.values(item)].some((v) => v !== "");

  const handleBaseChange = (e: ChangeEvent<HTMLInputElement>) => setBase((prev) => ({ ...prev, [e.target.name]: e.target.value }));

  const handleItemChange = (field: keyof StorageItemForm, value: string) => setItem((prev) => ({ ...prev, [field]: value }));

  // ── 検索ボタン ────────────────────────────────────
  const handleSearch = async () => {
    if (!item.itemCode.trim() || !item.lotNo.trim()) return;
    setSearching(true);
    setSearchResult(null);
    setApiError("");
    try {
      const res = await fetch(`/api/storage-extension/status?itemCode=${encodeURIComponent(item.itemCode)}&lotNo=${encodeURIComponent(item.lotNo)}`);
      const json = await res.json();
      if (json.items?.length > 0) {
        setSearchResult(json.items[0]);
      } else {
        setItemErrors((prev) => ({ ...prev, itemCode: json.message ?? "該当データが見つかりません" }));
      }
    } catch {
      setApiError("通信エラーが発生しました");
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

    if (!valid) {
      focusFirstError(["mail", "itemCode", "lotNo", "expiryDate"], { ...bErr, ...iErr });
      return;
    }

    if (!searchResult) {
      setSearching(true);
      try {
        const res = await fetch(`/api/storage-extension/status?itemCode=${encodeURIComponent(item.itemCode)}&lotNo=${encodeURIComponent(item.lotNo)}`);
        const json = await res.json();
        if (json.items?.length > 0) {
          setSearchResult(json.items[0]);
        } else {
          setItemErrors((prev) => ({ ...prev, itemCode: json.message ?? "該当データが見つかりません" }));
          return;
        }
      } catch {
        setApiError("通信エラーが発生しました");
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
    setApiError("");
    try {
      const res = await fetch("/api/storage-extension", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mail: base.mail, ...item }),
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

  // ── 続けて入力 ────────────────────────────────────
  const handleContinue = () => {
    setItem(createEmptyItem());
    setSearchResult(null);
    setBaseErrors({});
    setItemErrors({});
    setApiError("");
    setStatus("idle");
  };

  return {
    base,
    item,
    baseErrors,
    itemErrors,
    apiError,
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

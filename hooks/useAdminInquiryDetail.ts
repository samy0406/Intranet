// hooks/useAdminInquiryDetail.ts
import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";

// ── 型定義 ──────────────────────────────────────────
export type Inquiry = {
  id: number;
  name: string;
  department: string;
  email: string;
  title: string;
  urgency: string;
  screenPath: string;
  background: string;
  reqAction: string;
  urgentReason: string;
  urgentApproval: string;
  createdAt: string;
  status: "未対応" | "対応中" | "intec対応" | "完了";
  personInCharge: string;
  closedDate: string;
  responseDetail: string;
  inquiryCategory: string;
};

export type AdminFields = {
  personInCharge: string;
  responseDetail: string;
  inquiryCategory: string;
};

// ── 問い合わせカテゴリの選択肢 ────────────────────────
export function useAdminInquiryDetail() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id;

  const [inquiry, setInquiry] = useState<Inquiry | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string>("");
  const [adminFields, setAdminFields] = useState<AdminFields>({
    personInCharge: "",
    responseDetail: "",
    inquiryCategory: "",
  });
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved">("idle");
  const [isClosing, setIsClosing] = useState(false);

  // ── データ取得 ────────────────────────────────────
  useEffect(() => {
    if (!id) return;
    fetch(`/api/admin/inquiries/${id}`)
      .then((res) => {
        if (res.status === 404) throw new Error("該当する問い合わせが見つかりません");
        if (!res.ok) throw new Error("データの取得に失敗しました");
        return res.json();
      })
      .then((data: Inquiry) => {
        setInquiry(data);
        setAdminFields({
          personInCharge: data.personInCharge ?? "",
          responseDetail: data.responseDetail ?? "",
          inquiryCategory: data.inquiryCategory ?? "",
        });
      })
      .catch((err: Error) => setError(err.message));
  }, [id]);

  // ── 個別フィールド自動保存（onBlur用） ────────────
  const handleSave = async (fieldName: keyof AdminFields, value: string) => {
    setSaveStatus("saving");
    setSaveError("");
    setAdminFields((prev) => ({ ...prev, [fieldName]: value }));
    try {
      const res = await fetch(`/api/admin/inquiries/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ field: fieldName, value }),
      });
      if (!res.ok) throw new Error("保存に失敗しました");
      setSaveStatus("saved");
      setTimeout(() => setSaveStatus("idle"), 2000);
    } catch {
      setSaveStatus("idle");
      setSaveError("保存に失敗しました。再度お試しください。");
    }
  };

  // ── 完了処理 ──────────────────────────────────────
  const handleClose = async () => {
    setSaveError("");
    if (!adminFields.personInCharge) {
      setSaveError("対応者名を入力してください");
      return;
    }
    if (!confirm("この問い合わせを完了にしますか？")) return;

    setIsClosing(true);
    try {
      const res = await fetch(`/api/admin/inquiries/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "close",
          personInCharge: adminFields.personInCharge,
          responseDetail: adminFields.responseDetail,
          inquiryCategory: adminFields.inquiryCategory,
        }),
      });
      if (!res.ok) throw new Error("完了処理に失敗しました");

      const updated = await fetch(`/api/admin/inquiries/${id}`).then((r) => r.json());
      setInquiry(updated);
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : "エラーが発生しました");
    } finally {
      setIsClosing(false);
    }
  };

  const isClosed = inquiry?.status === "完了";

  return {
    id,
    inquiry,
    error,
    saveError,
    adminFields,
    saveStatus,
    isClosing,
    isClosed,
    setAdminFields,
    handleSave,
    handleClose,
    router,
  };
}

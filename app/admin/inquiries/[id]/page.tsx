"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";

// ── 型定義 ──────────────────────────────────────────────────
// DBカラムの AS alias 名と合わせる
type Inquiry = {
  id: number;
  name: string;
  department: string; // BUSYO
  email: string; // MAILADDRESS（旧: mail）
  title: string;
  urgency: string;
  screenPath: string; // HOWTO_OPEN_SCREEN
  background: string; // BACKGROUND（旧: message）
  reqAction: string; // REQ_ACTION（旧: resolution）
  urgentReason: string; // URGENT_REASON（旧: reason）
  urgentApproval: string; // URGENT_APPROVAL（旧: approver）
  createdAt: string;
  status: "未対応" | "完了"; // 対応中は廃止
  closedName: string; // CLOSED_NAME（旧: handler）
  closedDate: string; // CLOSED_DATE（旧: completedAt ※DB自動セット）
  responseDetail: string; // RESPONSE_DETAIL（旧: responseNote）
};

// 管理者が記入する項目（完了日付はDB自動のため除外）
type AdminFields = {
  closedName: string;
  responseDetail: string;
};

// ── スタイル定数 ────────────────────────────────────────────
const URGENCY_STYLE: Record<string, string> = {
  至急: "bg-red-100 text-red-700",
  高: "bg-orange-100 text-orange-700",
  中: "bg-yellow-100 text-yellow-700",
  低: "bg-slate-100 text-slate-500",
};

const STATUS_STYLE: Record<string, string> = {
  未対応: "bg-red-100 text-red-700",
  完了: "bg-emerald-100 text-emerald-700",
};

const inputClass = `
  w-full px-4 py-3 rounded-xl border border-slate-200 text-slate-800 text-sm bg-white
  focus:outline-none focus:ring-2 focus:ring-indigo-300 focus:border-transparent transition
`;

// ── ラベル＋値の表示コンポーネント ─────────────────────────
function InfoRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-[160px_1fr] gap-4 py-4 border-b border-slate-100 last:border-0">
      <dt className="text-sm font-semibold text-slate-500 pt-0.5">{label}</dt>
      <dd className="text-sm text-slate-800">{children}</dd>
    </div>
  );
}

// ── メインコンポーネント ────────────────────────────────────
export default function InquiryDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id;

  const [inquiry, setInquiry] = useState<Inquiry | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [adminFields, setAdminFields] = useState<AdminFields>({
    closedName: "",
    responseDetail: "",
  });
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved">("idle");
  const [isClosing, setIsClosing] = useState(false);

  // ── データ取得 ────────────────────────────────────────────
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
          closedName: data.closedName ?? "",
          responseDetail: data.responseDetail ?? "",
        });
      })
      .catch((err: Error) => setError(err.message));
  }, [id]);

  // ── 個別フィールド自動保存（onBlur用） ───────────────────
  // { field: フィールド名, value: 値 } をPATCHで送る（パターンA）
  const handleSave = async (fieldName: keyof AdminFields, value: string) => {
    setSaveStatus("saving");
    setAdminFields((prev) => ({ ...prev, [fieldName]: value }));
    try {
      const res = await fetch(`/api/admin/inquiries/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ field: fieldName, value }),
      });
      if (!res.ok) throw new Error("保存失敗");
      setSaveStatus("saved");
      setTimeout(() => setSaveStatus("idle"), 2000);
    } catch {
      setSaveStatus("idle");
      alert("保存に失敗しました");
    }
  };

  // ── 完了処理（「完了にする」ボタン用） ────────────────────
  // { action: "close", closedName, responseDetail } をPATCHで送る（パターンB）
  // → DBで CLOSED_DATE=SYSDATE が自動セットされる
  const handleClose = async () => {
    if (!adminFields.closedName) {
      alert("対応者名を入力してください");
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
          closedName: adminFields.closedName,
          responseDetail: adminFields.responseDetail,
        }),
      });
      if (!res.ok) throw new Error("完了処理に失敗しました");

      // 画面を再取得してステータスを更新
      const updated = await fetch(`/api/admin/inquiries/${id}`).then((r) => r.json());
      setInquiry(updated);
    } catch (err) {
      alert(err instanceof Error ? err.message : "エラーが発生しました");
    } finally {
      setIsClosing(false);
    }
  };

  // ── ローディング ──────────────────────────────────────────
  if (!inquiry && !error) {
    return (
      <main className="min-h-screen bg-slate-50 flex items-center justify-center">
        <p className="text-slate-400 text-sm animate-pulse">読み込み中...</p>
      </main>
    );
  }

  // ── エラー ────────────────────────────────────────────────
  if (error) {
    return (
      <main className="min-h-screen bg-slate-50 flex items-center justify-center flex-col gap-4">
        <p className="text-red-500 text-sm">⚠ {error}</p>
        <button onClick={() => router.back()} className="text-sm text-indigo-500 hover:underline">
          ← 一覧に戻る
        </button>
      </main>
    );
  }

  const isClosed = inquiry!.status === "完了";

  return (
    <main className="min-h-screen bg-slate-50 p-6 sm:p-10">
      <div className="max-w-3xl mx-auto">
        {/* 戻るボタン */}
        <div className="mb-6">
          <Link href="/admin/inquiries" className="inline-flex items-center gap-1 text-sm text-slate-400 hover:text-slate-600 transition-colors">
            ← 申請一覧に戻る
          </Link>
        </div>

        {/* ヘッダー */}
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-2">
            <span className="w-2 h-2 rounded-full bg-indigo-500" />
            <span className="text-xs font-bold tracking-widest text-indigo-500 uppercase">問い合わせ詳細</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-800 tracking-tight">{inquiry!.title}</h1>
          <div className="flex items-center gap-2 mt-3">
            <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${URGENCY_STYLE[inquiry!.urgency] ?? "bg-slate-100 text-slate-500"}`}>{inquiry!.urgency}</span>
            <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${STATUS_STYLE[inquiry!.status ?? "未対応"]}`}>{inquiry!.status ?? "未対応"}</span>
          </div>
        </div>

        {/* 申請内容（読み取り専用） */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 sm:p-8 mb-6">
          <h2 className="text-sm font-bold text-slate-500 uppercase tracking-widest mb-4">申請内容</h2>
          <dl>
            <InfoRow label="受付日時">{inquiry!.createdAt}</InfoRow>
            <InfoRow label="お名前">
              {inquiry!.name}
              {inquiry!.department && <span className="ml-2 text-xs text-slate-400">({inquiry!.department})</span>}
            </InfoRow>
            <InfoRow label="メールアドレス">
              {inquiry!.email ? (
                <a href={`mailto:${inquiry!.email}?subject=【お問い合わせ】${encodeURIComponent(inquiry!.title)}`} className="text-indigo-600 hover:underline">
                  {inquiry!.email}
                </a>
              ) : (
                <span className="text-slate-300">—</span>
              )}
            </InfoRow>

            {/* 至急のときだけ表示 */}
            {inquiry!.urgency === "至急" && (
              <>
                <InfoRow label="緊急の理由">
                  <p className="whitespace-pre-wrap leading-relaxed">{inquiry!.urgentReason || "—"}</p>
                </InfoRow>
                <InfoRow label="承認者">{inquiry!.urgentApproval || "—"}</InfoRow>
              </>
            )}

            <InfoRow label="画面の開き方">
              <p className="whitespace-pre-wrap leading-relaxed">{inquiry!.screenPath || "—"}</p>
            </InfoRow>
            <InfoRow label="問い合わせ経緯">
              <p className="whitespace-pre-wrap leading-relaxed">{inquiry!.background}</p>
            </InfoRow>
            <InfoRow label="対応希望内容">
              <p className="whitespace-pre-wrap leading-relaxed">{inquiry!.reqAction}</p>
            </InfoRow>
            <InfoRow label="添付ファイル">
              <a href={`https://app.box.com/folder/${process.env.NEXT_PUBLIC_BOX_FOLDER_ID}`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-indigo-600 hover:underline">
                📁 Boxフォルダを開く
              </a>
            </InfoRow>
          </dl>
        </div>

        {/* 対応記録（管理者が記入する欄） */}
        <div className="bg-white rounded-2xl border border-indigo-100 shadow-sm p-6 sm:p-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-sm font-bold text-indigo-600 uppercase tracking-widest">対応記録</h2>
            {saveStatus === "saving" && <span className="text-xs text-slate-400 animate-pulse">保存中...</span>}
            {saveStatus === "saved" && <span className="text-xs text-emerald-500">✓ 保存しました</span>}
          </div>

          <div className="space-y-6">
            {/* 対応者 */}
            <div>
              <label className="block text-sm font-semibold text-slate-600 mb-1.5">対応者</label>
              <input type="text" value={adminFields.closedName} onChange={(e) => setAdminFields((prev) => ({ ...prev, closedName: e.target.value }))} onBlur={(e) => handleSave("closedName", e.target.value)} placeholder="例：山田太郎" disabled={isClosed} className={inputClass} />
            </div>

            {/* 完了日付（DBが自動セット → 読み取り専用で表示） */}
            {isClosed && (
              <div>
                <label className="block text-sm font-semibold text-slate-600 mb-1.5">完了日付</label>
                <p className="text-sm text-slate-700 px-4 py-3 bg-slate-50 rounded-xl border border-slate-200">{inquiry!.closedDate || "—"}</p>
              </div>
            )}

            {/* 対応内容 */}
            <div>
              <label className="block text-sm font-semibold text-slate-600 mb-1.5">対応内容</label>
              <textarea value={adminFields.responseDetail} onChange={(e) => setAdminFields((prev) => ({ ...prev, responseDetail: e.target.value }))} onBlur={(e) => handleSave("responseDetail", e.target.value)} placeholder="実施した対応内容を記入してください..." rows={6} disabled={isClosed} className={`${inputClass} resize-none`} />
              {!isClosed && <p className="text-xs text-slate-400 mt-1">※ 入力欄からカーソルが外れると自動保存されます</p>}
            </div>

            {/* 完了にするボタン（未対応のときだけ表示） */}
            {!isClosed && (
              <button
                onClick={handleClose}
                disabled={isClosing}
                className="w-full py-3 rounded-xl bg-emerald-600 text-white text-sm font-semibold
                           hover:bg-emerald-700 transition-colors disabled:opacity-50"
              >
                {isClosing ? "処理中..." : "✓ 完了にする"}
              </button>
            )}
          </div>
        </div>

        {/* Outlookで返信ボタン */}
        {inquiry!.email && (
          <div className="mt-4">
            <a
              href={`mailto:${inquiry!.email}?subject=【RE: お問い合わせ】${encodeURIComponent(inquiry!.title)}`}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 text-white
                         text-sm font-semibold hover:bg-indigo-700 transition-colors"
            >
              ✉ Outlookで返信する
            </a>
          </div>
        )}
      </div>
    </main>
  );
}

"use client";

import Link from "next/link";
import { useAdminInquiryDetail, INQUIRY_CATEGORIES, AdminFields } from "@/hooks/useAdminInquiryDetail";

// ── スタイル定数 ────────────────────────────────────────
const URGENCY_STYLE: Record<string, string> = {
  至急: "bg-red-100 text-red-700",
  高:   "bg-orange-100 text-orange-700",
  中:   "bg-yellow-100 text-yellow-700",
  低:   "bg-slate-100 text-slate-500",
};

const STATUS_STYLE: Record<string, string> = {
  未対応:    "bg-red-100    text-red-700",
  対応中:    "bg-blue-100   text-blue-700",
  intec対応: "bg-purple-100 text-purple-700",
  完了:      "bg-emerald-100 text-emerald-700",
};

const inputClass = `
  w-full px-4 py-3 rounded-xl border border-slate-200 text-slate-800 text-sm bg-white
  focus:outline-none focus:ring-2 focus:ring-indigo-300 focus:border-transparent transition
`;

// ── ラベル＋値の表示コンポーネント ──────────────────────
function InfoRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-[160px_1fr] gap-4 py-4 border-b border-slate-100 last:border-0">
      <dt className="text-sm font-semibold text-slate-500 pt-0.5">{label}</dt>
      <dd className="text-sm text-slate-800">{children}</dd>
    </div>
  );
}

export default function InquiryDetailPage() {
  const {
    inquiry, error, adminFields, saveStatus, isClosing, isClosed,
    setAdminFields, handleSave, handleClose, router,
  } = useAdminInquiryDetail();

  // ── ローディング ──────────────────────────────────
  if (!inquiry && !error) {
    return (
      <main className="min-h-screen bg-slate-50 flex items-center justify-center">
        <p className="text-slate-400 text-sm animate-pulse">読み込み中...</p>
      </main>
    );
  }

  // ── エラー ────────────────────────────────────────
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

        {/* 対応記録 */}
        <div className="bg-white rounded-2xl border border-indigo-100 shadow-sm p-6 sm:p-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-sm font-bold text-indigo-600 uppercase tracking-widest">対応記録</h2>
            {saveStatus === "saving" && <span className="text-xs text-slate-400 animate-pulse">保存中...</span>}
            {saveStatus === "saved" && <span className="text-xs text-emerald-500">✓ 保存しました</span>}
          </div>

          <div className="space-y-6">
            {/* 問い合わせカテゴリ */}
            <div>
              <label className="block text-sm font-semibold text-slate-600 mb-2">問い合わせカテゴリ</label>
              <div className="flex flex-wrap gap-2">
                {INQUIRY_CATEGORIES.map((cat) => {
                  const isSelected = adminFields.inquiryCategory === cat;
                  return (
                    <button
                      key={cat}
                      type="button"
                      disabled={isClosed}
                      onClick={() => {
                        const val = isSelected ? "" : cat;
                        setAdminFields((prev) => ({ ...prev, inquiryCategory: val }));
                        handleSave("inquiryCategory", val);
                      }}
                      className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-all
                        ${isSelected ? "bg-indigo-600 text-white border-indigo-600 shadow-sm" : "bg-white text-slate-500 border-slate-200 hover:border-indigo-300 hover:text-indigo-500"}
                        disabled:opacity-50 disabled:cursor-not-allowed`}
                    >
                      {isSelected && <span className="mr-1">✓</span>}
                      {cat}
                    </button>
                  );
                })}
              </div>
              {adminFields.inquiryCategory && (
                <p className="text-xs text-indigo-500 mt-2">
                  選択中：<span className="font-semibold">{adminFields.inquiryCategory}</span>
                </p>
              )}
            </div>

            {/* 対応者 */}
            <div>
              <label className="block text-sm font-semibold text-slate-600 mb-1.5">対応者</label>
              <input
                type="text"
                value={adminFields.personInCharge}
                onChange={(e) => setAdminFields((prev) => ({ ...prev, personInCharge: e.target.value }))}
                onBlur={(e) => handleSave("personInCharge", e.target.value)}
                placeholder="例：山田太郎"
                disabled={isClosed}
                className={inputClass}
              />
            </div>

            {/* 完了日付 */}
            {isClosed && (
              <div>
                <label className="block text-sm font-semibold text-slate-600 mb-1.5">完了日付</label>
                <p className="text-sm text-slate-700 px-4 py-3 bg-slate-50 rounded-xl border border-slate-200">{inquiry!.closedDate || "—"}</p>
              </div>
            )}

            {/* 対応内容 */}
            <div>
              <label className="block text-sm font-semibold text-slate-600 mb-1.5">対応内容</label>
              <textarea
                value={adminFields.responseDetail}
                onChange={(e) => setAdminFields((prev) => ({ ...prev, responseDetail: e.target.value }))}
                onBlur={(e) => handleSave("responseDetail", e.target.value)}
                placeholder="実施した対応内容を記入してください..."
                rows={6}
                disabled={isClosed}
                className={`${inputClass} resize-none`}
              />
              {!isClosed && <p className="text-xs text-slate-400 mt-1">※ 入力欄からカーソルが外れると自動保存されます</p>}
            </div>

            {/* 完了にするボタン */}
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

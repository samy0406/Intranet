"use client";

// ============================================================
// 申請詳細ページ
// 場所: app/admin/inquiries/[id]/page.tsx
//
// 申請内容を表示しつつ、管理者が以下を記入できる：
//  - 対応者
//  - 完了日付
//  - 対応内容
// 入力欄からフォーカスが外れたタイミングで自動保存する（onBlur）
// ============================================================

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";

// ── 型定義 ──────────────────────────────────────────────────
type Inquiry = {
  id: number;
  name: string;
  department: string;
  mail: string;
  title: string;
  urgency: string;
  screenPath: string;
  message: string;
  resolution: string;
  reason: string;
  approver: string;
  filename: string | null;
  screenshot: string | null;
  createdAt: string;
  status: "未対応" | "対応中" | "完了";
  handler: string;       // 対応者
  completedAt: string;   // 完了日付
  responseNote: string;  // 対応内容
};

// 管理者が記入する3フィールドの型（部分型）
type AdminFields = {
  handler: string;
  completedAt: string;
  responseNote: string;
};

// ── スタイル定数 ────────────────────────────────────────────
const URGENCY_STYLE: Record<string, string> = {
  至急: "bg-red-100 text-red-700",
  高:   "bg-orange-100 text-orange-700",
  中:   "bg-yellow-100 text-yellow-700",
  低:   "bg-slate-100 text-slate-500",
};

const STATUS_STYLE: Record<string, string> = {
  未対応: "bg-red-100 text-red-700",
  対応中: "bg-yellow-100 text-yellow-700",
  完了:   "bg-emerald-100 text-emerald-700",
};

// 入力欄の共通スタイル
const inputClass = `
  w-full px-4 py-3 rounded-xl border border-slate-200 text-slate-800 text-sm bg-white
  focus:outline-none focus:ring-2 focus:ring-indigo-300 focus:border-transparent transition
`;

// ============================================================
// ラベル＋値を1行で表示するコンポーネント（申請内容の表示用）
// ============================================================
function InfoRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-[160px_1fr] gap-4 py-4 border-b border-slate-100 last:border-0">
      <dt className="text-sm font-semibold text-slate-500 pt-0.5">{label}</dt>
      <dd className="text-sm text-slate-800">{children}</dd>
    </div>
  );
}

// ============================================================
// メインコンポーネント
// ============================================================
export default function InquiryDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id     = params?.id;  // URLの [id] 部分（例: "123"）

  const [inquiry, setInquiry]   = useState<Inquiry | null>(null);
  const [error, setError]       = useState<string | null>(null);
  // 管理者が記入する3フィールドを別stateで管理
  // → 申請内容（inquiry）とは独立して入力できるようにするため
  const [adminFields, setAdminFields] = useState<AdminFields>({
    handler:      "",
    completedAt:  "",
    responseNote: "",
  });
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved">("idle");

  // ── データ取得 ──────────────────────────────────────────
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
        // 取得したデータで管理者フィールドを初期化
        setAdminFields({
          handler:      data.handler      ?? "",
          completedAt:  data.completedAt  ?? "",
          responseNote: data.responseNote ?? "",
        });
      })
      .catch((err: Error) => setError(err.message));
  }, [id]);

  // ── 管理者フィールドの保存（onBlurで呼ばれる） ─────────
  // fieldName: どのフィールドを保存するか
  // value    : 保存する値
  const handleSave = async (
    fieldName: keyof AdminFields,
    value: string
  ) => {
    setSaveStatus("saving");

    // stateを更新（画面にすぐ反映）
    setAdminFields((prev) => ({ ...prev, [fieldName]: value }));

    try {
      const res = await fetch(`/api/admin/inquiries/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        // { [fieldName]: value } = 例: { handler: "山田" }
        body: JSON.stringify({ [fieldName]: value }),
      });
      if (!res.ok) throw new Error("保存失敗");
      setSaveStatus("saved");
      // 2秒後に「保存済み」表示を消す
      setTimeout(() => setSaveStatus("idle"), 2000);
    } catch {
      setSaveStatus("idle");
      alert("保存に失敗しました");
    }
  };

  // ── ローディング ────────────────────────────────────────
  if (!inquiry && !error) {
    return (
      <main className="min-h-screen bg-slate-50 flex items-center justify-center">
        <p className="text-slate-400 text-sm animate-pulse">読み込み中...</p>
      </main>
    );
  }

  // ── エラー ──────────────────────────────────────────────
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

  // ── メイン表示 ──────────────────────────────────────────
  return (
    <main className="min-h-screen bg-slate-50 p-6 sm:p-10">
      <div className="max-w-3xl mx-auto">

        {/* 戻るボタン */}
        <div className="mb-6">
          <Link
            href="/admin/inquiries"
            className="inline-flex items-center gap-1 text-sm text-slate-400 hover:text-slate-600 transition-colors"
          >
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
            <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${URGENCY_STYLE[inquiry!.urgency] ?? "bg-slate-100 text-slate-500"}`}>
              {inquiry!.urgency}
            </span>
            <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${STATUS_STYLE[inquiry!.status ?? "未対応"]}`}>
              {inquiry!.status ?? "未対応"}
            </span>
          </div>
        </div>

        {/* ════════════════════════════════════════
            申請内容（読み取り専用）
        ════════════════════════════════════════ */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 sm:p-8 mb-6">
          <h2 className="text-sm font-bold text-slate-500 uppercase tracking-widest mb-4">申請内容</h2>
          <dl>
            <InfoRow label="受付日時">{inquiry!.createdAt}</InfoRow>

            <InfoRow label="お名前">
              {inquiry!.name}
              {inquiry!.department && (
                <span className="ml-2 text-xs text-slate-400">({inquiry!.department})</span>
              )}
            </InfoRow>

            <InfoRow label="メールアドレス">
              {inquiry!.mail ? (
                <a
                  href={`mailto:${inquiry!.mail}?subject=【お問い合わせ】${encodeURIComponent(inquiry!.title)}`}
                  className="text-indigo-600 hover:underline"
                >
                  {inquiry!.mail}
                </a>
              ) : (
                <span className="text-slate-300">—</span>
              )}
            </InfoRow>

            {/* 至急のときだけ表示 */}
            {inquiry!.urgency === "至急" && (
              <>
                <InfoRow label="緊急の理由">
                  <p className="whitespace-pre-wrap leading-relaxed">{inquiry!.reason || "—"}</p>
                </InfoRow>
                <InfoRow label="承認者">{inquiry!.approver || "—"}</InfoRow>
              </>
            )}

            <InfoRow label="画面の開き方">
              <p className="whitespace-pre-wrap leading-relaxed">{inquiry!.screenPath || "—"}</p>
            </InfoRow>

            <InfoRow label="問い合わせ経緯">
              {/* whitespace-pre-wrap = 改行をそのまま表示 */}
              <p className="whitespace-pre-wrap leading-relaxed">{inquiry!.message}</p>
            </InfoRow>

            <InfoRow label="対応希望内容">
              <p className="whitespace-pre-wrap leading-relaxed">{inquiry!.resolution}</p>
            </InfoRow>

            {inquiry!.filename && (
              <InfoRow label="添付ファイル">
                <a
                  href={`/uploads/${inquiry!.filename}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-indigo-600 hover:underline text-sm"
                >
                  📎 {inquiry!.filename}
                </a>
              </InfoRow>
            )}

            {inquiry!.screenshot && (
              <InfoRow label="スクリーンショット">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={`/uploads/${inquiry!.screenshot}`}
                  alt="スクリーンショット"
                  className="max-w-full rounded-lg border border-slate-200 mt-1"
                />
              </InfoRow>
            )}
          </dl>
        </div>

        {/* ════════════════════════════════════════
            対応記録（管理者が記入する欄）
        ════════════════════════════════════════ */}
        <div className="bg-white rounded-2xl border border-indigo-100 shadow-sm p-6 sm:p-8">

          {/* セクションヘッダー＋保存状態表示 */}
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-sm font-bold text-indigo-600 uppercase tracking-widest">対応記録</h2>
            {/* saveStatus に応じてメッセージを切り替え */}
            {saveStatus === "saving" && (
              <span className="text-xs text-slate-400 animate-pulse">保存中...</span>
            )}
            {saveStatus === "saved" && (
              <span className="text-xs text-emerald-500">✓ 保存しました</span>
            )}
          </div>

          <div className="space-y-6">

            {/* 対応者 */}
            <div>
              <label className="block text-sm font-semibold text-slate-600 mb-1.5">
                対応者
              </label>
              <input
                type="text"
                value={adminFields.handler}
                onChange={(e) =>
                  // 入力中はstateだけ更新（まだ保存しない）
                  setAdminFields((prev) => ({ ...prev, handler: e.target.value }))
                }
                onBlur={(e) =>
                  // フォーカスが外れたら保存
                  handleSave("handler", e.target.value)
                }
                placeholder="例：山田 太郎"
                className={inputClass}
              />
            </div>

            {/* 完了日付 */}
            <div>
              <label className="block text-sm font-semibold text-slate-600 mb-1.5">
                完了日付
              </label>
              <input
                type="date"
                value={adminFields.completedAt}
                onChange={(e) =>
                  setAdminFields((prev) => ({ ...prev, completedAt: e.target.value }))
                }
                onBlur={(e) =>
                  handleSave("completedAt", e.target.value)
                }
                className={inputClass}
              />
            </div>

            {/* 対応内容 */}
            <div>
              <label className="block text-sm font-semibold text-slate-600 mb-1.5">
                対応内容
              </label>
              <textarea
                value={adminFields.responseNote}
                onChange={(e) =>
                  setAdminFields((prev) => ({ ...prev, responseNote: e.target.value }))
                }
                onBlur={(e) =>
                  handleSave("responseNote", e.target.value)
                }
                placeholder="実施した対応内容を記入してください..."
                rows={6}
                className={`${inputClass} resize-none`}
              />
              <p className="text-xs text-slate-400 mt-1">
                ※ 入力欄からカーソルが外れると自動保存されます
              </p>
            </div>

          </div>
        </div>

        {/* Outlookで返信ボタン */}
        {inquiry!.mail && (
          <div className="mt-4">
            <a
              href={`mailto:${inquiry!.mail}?subject=【RE: お問い合わせ】${encodeURIComponent(inquiry!.title)}`}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-700 transition-colors"
            >
              ✉ Outlookで返信する
            </a>
          </div>
        )}

      </div>
    </main>
  );
}

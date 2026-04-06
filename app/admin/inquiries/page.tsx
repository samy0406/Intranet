"use client";

// ============================================================
// 申請一覧ページ
// 場所: app/admin/inquiries/page.tsx
//
// 列構成: 日付・表題・緊急度・ステータス・メール・対応者・完了日付・対応内容
//
// ・ステータス    → このページでトグル変更できる
// ・対応者        → 詳細ページ（[id]/page.tsx）で入力した値を読み取り専用で表示
// ・完了日付      → 同上
// ・対応内容      → 同上（長い場合は2行まで省略表示）
// ・行クリック    → 詳細ページへ遷移
// ============================================================

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

// ── 型定義 ──────────────────────────────────────────────────
type InquiryStatus = "未対応" | "対応中" | "完了";

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
  status: InquiryStatus;
  handler: string; // 対応者（詳細ページで入力）
  completedAt: string; // 完了日付（詳細ページで入力）
  responseNote: string; // 対応内容（詳細ページで入力）
};

// ── スタイル定数 ────────────────────────────────────────────
const STATUS_STYLE: Record<InquiryStatus, string> = {
  未対応: "bg-red-100 text-red-700 border border-red-200",
  対応中: "bg-yellow-100 text-yellow-700 border border-yellow-200",
  完了: "bg-emerald-100 text-emerald-700 border border-emerald-200",
};

// 未対応→対応中→完了→未対応 とループ
const NEXT_STATUS: Record<InquiryStatus, InquiryStatus> = {
  未対応: "対応中",
  対応中: "完了",
  完了: "未対応",
};

const URGENCY_STYLE: Record<string, string> = {
  至急: "bg-red-100 text-red-700",
  高: "bg-orange-100 text-orange-700",
  中: "bg-yellow-100 text-yellow-700",
  低: "bg-slate-100 text-slate-500",
};

// ============================================================
// メインコンポーネント
// ============================================================
export default function InquiriesPage() {
  const [inquiries, setInquiries] = useState<Inquiry[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  // ── 初回データ取得 ──────────────────────────────────────
  useEffect(() => {
    fetch("/api/admin/inquiries")
      .then((res) => {
        if (!res.ok) throw new Error("データの取得に失敗しました");
        return res.json();
      })
      .then((data: Inquiry[]) => setInquiries(data))
      .catch((err: Error) => setError(err.message));
  }, []); // [] = マウント時（初回表示時）だけ実行

  // ── ステータスのトグル処理 ──────────────────────────────
  const handleStatusToggle = async (e: React.MouseEvent, inquiry: Inquiry) => {
    // stopPropagation = 行クリック（詳細遷移）に伝播させない
    e.stopPropagation();

    const nextStatus = NEXT_STATUS[inquiry.status ?? "未対応"];

    // 楽観的UI更新：APIの応答を待たずに画面を先に変える
    setInquiries((prev) => prev?.map((item) => (item.id === inquiry.id ? { ...item, status: nextStatus } : item)) ?? null);

    try {
      const res = await fetch(`/api/admin/inquiries/${inquiry.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: nextStatus }),
      });
      if (!res.ok) throw new Error("更新失敗");
    } catch {
      // 失敗したら元のステータスに戻す（ロールバック）
      setInquiries((prev) => prev?.map((item) => (item.id === inquiry.id ? { ...item, status: inquiry.status } : item)) ?? null);
      alert("ステータスの更新に失敗しました");
    }
  };

  // ── ローディング ────────────────────────────────────────
  if (inquiries === null && !error) {
    return (
      <main className="min-h-screen bg-slate-50 flex items-center justify-center">
        <p className="text-slate-400 text-sm animate-pulse">読み込み中...</p>
      </main>
    );
  }

  // ── エラー ──────────────────────────────────────────────
  if (error) {
    return (
      <main className="min-h-screen bg-slate-50 flex items-center justify-center">
        <p className="text-red-500 text-sm">⚠ {error}</p>
      </main>
    );
  }

  // ── メイン表示 ──────────────────────────────────────────
  return (
    <main className="min-h-screen bg-slate-50 p-6 sm:p-10">
      <div className="max-w-7xl mx-auto">
        {/* ヘッダー */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-2">
            <span className="w-2 h-2 rounded-full bg-indigo-500" />
            <span className="text-xs font-bold tracking-widest text-indigo-500 uppercase">Admin</span>
          </div>
          <h1 className="text-3xl font-bold text-slate-800 tracking-tight">申請一覧</h1>
          <p className="text-slate-400 text-sm mt-1">
            全 <span className="font-semibold text-slate-600">{inquiries?.length ?? 0}</span> 件<span className="ml-3 text-xs">（行クリックで詳細・対応記録の入力ができます）</span>
          </p>
        </div>

        {/* 0件のとき */}
        {inquiries?.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-100 p-12 text-center text-slate-400">まだ問い合わせはありません</div>
        ) : (
          // overflow-x-auto = 列が多くて横幅が足りないときにスクロールできる
          <div className="overflow-x-auto rounded-2xl border border-slate-200 shadow-sm">
            <table className="w-full text-sm bg-white">
              {/* ── テーブルヘッダー ── */}
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3 text-left font-semibold text-slate-600 whitespace-nowrap">日付</th>
                  <th className="px-4 py-3 text-left font-semibold text-slate-600 whitespace-nowrap">表題</th>
                  <th className="px-4 py-3 text-left font-semibold text-slate-600 whitespace-nowrap">緊急度</th>
                  <th className="px-4 py-3 text-left font-semibold text-slate-600 whitespace-nowrap">ステータス</th>
                  <th className="px-4 py-3 text-left font-semibold text-slate-600 whitespace-nowrap">メールアドレス</th>
                  <th className="px-4 py-3 text-left font-semibold text-slate-600 whitespace-nowrap">対応者</th>
                  <th className="px-4 py-3 text-left font-semibold text-slate-600 whitespace-nowrap">完了日付</th>
                </tr>
              </thead>

              {/* ── テーブルボディ ── */}
              <tbody className="divide-y divide-slate-100">
                {inquiries?.map((item) => (
                  // 行クリック → 詳細ページへ遷移
                  <tr key={item.id} onClick={() => router.push(`/admin/inquiries/${item.id}`)} className="hover:bg-slate-50 cursor-pointer transition-colors">
                    {/* 日付 */}
                    <td className="px-4 py-3 text-slate-500 whitespace-nowrap text-xs">{item.createdAt}</td>

                    {/* 表題 */}
                    <td className="px-4 py-3 text-slate-700 max-w-[180px] truncate font-medium">{item.title}</td>

                    {/* 緊急度バッジ */}
                    <td className="px-4 py-3">
                      <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-bold ${URGENCY_STYLE[item.urgency] ?? "bg-slate-100 text-slate-500"}`}>{item.urgency}</span>
                    </td>

                    {/* ステータス（クリックでトグル） */}
                    <td className="px-4 py-3">
                      <button
                        onClick={(e) => handleStatusToggle(e, item)}
                        title="クリックでステータスを変更"
                        className={`
                          px-3 py-1 rounded-full text-xs font-bold transition-all
                          hover:opacity-80 active:scale-95 cursor-pointer whitespace-nowrap
                          ${STATUS_STYLE[item.status ?? "未対応"]}
                        `}
                      >
                        {item.status ?? "未対応"}
                      </button>
                    </td>

                    {/* メールアドレス（クリックでOutlook起動） */}
                    <td className="px-4 py-3">
                      {item.mail ? (
                        // e.stopPropagation() = メールリンクのクリックが行遷移に伝わらないようにする
                        <a href={`mailto:${item.mail}?subject=【お問い合わせ】${encodeURIComponent(item.title)}`} onClick={(e) => e.stopPropagation()} className="text-indigo-600 hover:underline hover:text-indigo-800 transition-colors text-xs">
                          {item.mail}
                        </a>
                      ) : (
                        <span className="text-slate-300">—</span>
                      )}
                    </td>

                    {/* 対応者（詳細ページで入力した値を表示） */}
                    <td className="px-4 py-3 whitespace-nowrap">{item.handler ? <span className="text-slate-700 text-xs">{item.handler}</span> : <span className="text-slate-300">—</span>}</td>

                    {/* 完了日付（詳細ページで入力した値を表示） */}
                    <td className="px-4 py-3 whitespace-nowrap">{item.completedAt ? <span className="text-slate-500 text-xs">{item.completedAt}</span> : <span className="text-slate-300">—</span>}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* ホームに戻るリンク */}
        <div className="mt-6">
          <Link href="/" className="text-sm text-slate-400 hover:text-slate-600 transition-colors">
            ← ホームに戻る
          </Link>
        </div>
      </div>
    </main>
  );
}

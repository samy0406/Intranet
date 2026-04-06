"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

// ── 型定義（DBのAS alias名と合わせる） ──────────────────
// 対応中は廃止、未対応・完了の2種のみ
type InquiryStatus = "未対応" | "完了";

type Inquiry = {
  id: number;
  date: string;       // TO_CHAR(INQUIRY_DATE) → "date"
  name: string;       // INQUIRY_NAME
  department: string; // BUSYO
  email: string;      // MAILADDRESS
  title: string;      // TITLE
  urgency: string;    // URGENCY
  status: InquiryStatus;
};

// ── スタイル定数 ────────────────────────────────────────
const STATUS_STYLE: Record<InquiryStatus, string> = {
  未対応: "bg-red-100 text-red-700 border border-red-200",
  完了: "bg-emerald-100 text-emerald-700 border border-emerald-200",
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

  // ── 初回データ取得 ──────────────────────────────────
  useEffect(() => {
    fetch("/api/admin/inquiries")
      .then((res) => {
        if (!res.ok) throw new Error("データの取得に失敗しました");
        return res.json();
      })
      .then((data: Inquiry[]) => setInquiries(data))
      .catch((err: Error) => setError(err.message));
  }, []); // [] = マウント時（初回表示時）だけ実行

  // ── ローディング ────────────────────────────────────
  if (inquiries === null && !error) {
    return (
      <main className="min-h-screen bg-slate-50 flex items-center justify-center">
        <p className="text-slate-400 text-sm animate-pulse">読み込み中...</p>
      </main>
    );
  }

  // ── エラー ──────────────────────────────────────────
  if (error) {
    return (
      <main className="min-h-screen bg-slate-50 flex items-center justify-center">
        <p className="text-red-500 text-sm">⚠ {error}</p>
      </main>
    );
  }

  // ── メイン表示 ──────────────────────────────────────
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
            全{" "}
            <span className="font-semibold text-slate-600">{inquiries?.length ?? 0}</span>{" "}
            件
            <span className="ml-3 text-xs">
              （行クリックで詳細・対応記録の入力ができます）
            </span>
          </p>
        </div>

        {/* 0件のとき */}
        {inquiries?.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-100 p-12 text-center text-slate-400">
            まだ問い合わせはありません
          </div>
        ) : (
          // overflow-x-auto = 列が多くて横幅が足りないときにスクロールできる
          <div className="overflow-x-auto rounded-2xl border border-slate-200 shadow-sm">
            <table className="w-full text-sm bg-white">

              {/* テーブルヘッダー */}
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3 text-left font-semibold text-slate-600 whitespace-nowrap">日付</th>
                  <th className="px-4 py-3 text-left font-semibold text-slate-600 whitespace-nowrap">表題</th>
                  <th className="px-4 py-3 text-left font-semibold text-slate-600 whitespace-nowrap">お名前</th>
                  <th className="px-4 py-3 text-left font-semibold text-slate-600 whitespace-nowrap">緊急度</th>
                  <th className="px-4 py-3 text-left font-semibold text-slate-600 whitespace-nowrap">ステータス</th>
                  <th className="px-4 py-3 text-left font-semibold text-slate-600 whitespace-nowrap">メールアドレス</th>
                </tr>
              </thead>

              {/* テーブルボディ */}
              <tbody className="divide-y divide-slate-100">
                {inquiries?.map((item) => (
                  // 行クリック → 詳細ページへ遷移
                  <tr
                    key={item.id}
                    onClick={() => router.push(`/admin/inquiries/${item.id}`)}
                    className="hover:bg-slate-50 cursor-pointer transition-colors"
                  >

                    {/* 日付 */}
                    <td className="px-4 py-3 text-slate-500 whitespace-nowrap text-xs">
                      {item.date}
                    </td>

                    {/* 表題 */}
                    <td className="px-4 py-3 text-slate-700 max-w-[180px] truncate font-medium">
                      {item.title}
                    </td>

                    {/* お名前 + 部署 */}
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className="text-slate-700 text-xs">{item.name}</span>
                      {item.department && (
                        <span className="ml-1 text-xs text-slate-400">
                          {item.department}
                        </span>
                      )}
                    </td>

                    {/* 緊急度バッジ */}
                    <td className="px-4 py-3">
                      <span
                        className={`inline-block px-2 py-0.5 rounded-full text-xs font-bold ${
                          URGENCY_STYLE[item.urgency] ?? "bg-slate-100 text-slate-500"
                        }`}
                      >
                        {item.urgency}
                      </span>
                    </td>

                    {/* ステータス（読み取り専用。変更は詳細画面の「完了にする」ボタンで） */}
                    <td className="px-4 py-3">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-bold whitespace-nowrap ${
                          STATUS_STYLE[item.status ?? "未対応"]
                        }`}
                      >
                        {item.status ?? "未対応"}
                      </span>
                    </td>

                    {/* メールアドレス（クリックでOutlook起動） */}
                    <td className="px-4 py-3">
                      {item.email ? (
                        // e.stopPropagation() = メールリンクのクリックが行遷移に伝わらないようにする
                        <a
                          href={`mailto:${item.email}?subject=【お問い合わせ】${encodeURIComponent(item.title)}`}
                          onClick={(e) => e.stopPropagation()}
                          className="text-indigo-600 hover:underline hover:text-indigo-800 transition-colors text-xs"
                        >
                          {item.email}
                        </a>
                      ) : (
                        <span className="text-slate-300">—</span>
                      )}
                    </td>

                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* ホームに戻るリンク */}
        <div className="mt-6">
          <Link
            href="/"
            className="text-sm text-slate-400 hover:text-slate-600 transition-colors"
          >
            ← ホームに戻る
          </Link>
        </div>

      </div>
    </main>
  );
}

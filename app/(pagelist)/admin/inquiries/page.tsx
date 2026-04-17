"use client";

import Link from "next/link";
import { useAdminInquiries, InquiryStatus, INQUIRY_CATEGORIES, SortKey } from "@/hooks/useAdminInquiries";

// ── スタイル定数 ────────────────────────────────────────
export const STATUS_STYLE: Record<InquiryStatus, string> = {
  未対応: "bg-red-100    text-red-700    border border-red-200",
  対応中: "bg-blue-100   text-blue-700   border border-blue-200",
  intec対応: "bg-purple-100 text-purple-700 border border-purple-200",
  完了: "bg-emerald-100 text-emerald-700 border border-emerald-200",
};

const URGENCY_STYLE: Record<string, string> = {
  至急: "bg-red-100 text-red-700",
  高: "bg-orange-100 text-orange-700",
  中: "bg-yellow-100 text-yellow-700",
  低: "bg-slate-100 text-slate-500",
};

// ── ソートアイコン ────────────────────────────────────
const SortIcon = ({ k, sortKey, sortOrder }: { k: SortKey; sortKey: SortKey; sortOrder: "asc" | "desc" }) => {
  if (sortKey !== k) return <span className="text-slate-300 ml-1">↕</span>;
  return <span className="text-indigo-500 ml-1">{sortOrder === "asc" ? "↑" : "↓"}</span>;
};

export default function InquiriesPage() {
  const { inquiries, error, sortKey, sortOrder, displayedInquiries, hasFilter, filterUrgency, filterStatuses, filterCategory, filterDateFrom, filterDateTo, openStatusId, setFilterUrgency, setFilterCategory, setFilterDateFrom, setFilterDateTo, toggleStatus, resetFilters, handleSort, handleStatusChange, setOpenStatusId, router } = useAdminInquiries();

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

        {/* フィルター */}
        <div className="flex flex-wrap gap-3 mb-4">
          {/* 緊急度 */}
          <select
            value={filterUrgency}
            onChange={(e) => setFilterUrgency(e.target.value)}
            className="text-sm border border-slate-200 rounded-lg px-3 py-1.5 bg-white text-slate-600
              focus:outline-none focus:ring-2 focus:ring-indigo-300"
          >
            <option value="">緊急度：すべて</option>
            <option value="至急">至急</option>
            <option value="高">高</option>
            <option value="中">中</option>
            <option value="低">低</option>
          </select>

          {/* カテゴリ */}
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="text-sm border border-slate-200 rounded-lg px-3 py-1.5 bg-white text-slate-600
              focus:outline-none focus:ring-2 focus:ring-indigo-300"
          >
            <option value="">カテゴリ：すべて</option>
            {INQUIRY_CATEGORIES.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>

          {/* ステータス */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-xs text-slate-500 whitespace-nowrap">ステータス：</span>
            {(["未対応", "対応中", "intec対応", "完了"] as InquiryStatus[]).map((s) => {
              const isActive = filterStatuses.includes(s);
              return (
                <button
                  key={s}
                  onClick={() => toggleStatus(s)}
                  className={`px-3 py-1 rounded-full text-xs font-bold border transition-all
                    ${isActive ? STATUS_STYLE[s] : "bg-white text-slate-400 border-slate-200 hover:border-slate-400"}`}
                >
                  {s}
                </button>
              );
            })}
          </div>

          {/* 日付 */}
          <div className="flex items-center gap-2 text-sm text-slate-600">
            <label className="whitespace-nowrap text-slate-500 text-xs">日付：</label>
            <input
              type="date"
              value={filterDateFrom}
              onChange={(e) => setFilterDateFrom(e.target.value)}
              className="border border-slate-200 rounded-lg px-2 py-1.5 bg-white text-slate-600 text-xs
                focus:outline-none focus:ring-2 focus:ring-indigo-300"
            />
            <span className="text-slate-400 text-xs">〜</span>
            <input
              type="date"
              value={filterDateTo}
              onChange={(e) => setFilterDateTo(e.target.value)}
              className="border border-slate-200 rounded-lg px-2 py-1.5 bg-white text-slate-600 text-xs
                focus:outline-none focus:ring-2 focus:ring-indigo-300"
            />
          </div>

          {/* リセット */}
          {hasFilter && (
            <button onClick={resetFilters} className="text-xs text-slate-400 hover:text-rose-400 transition-colors">
              ✕ リセット
            </button>
          )}

          <span className="text-xs text-slate-400 self-center ml-auto">{displayedInquiries.length} 件表示</span>
        </div>

        {/* 0件のとき */}
        {inquiries?.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-100 p-12 text-center text-slate-400">まだ問い合わせはありません</div>
        ) : (
          <div className="overflow-x-auto rounded-2xl border border-slate-200 shadow-sm">
            <table className="w-full text-sm bg-white">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th onClick={() => handleSort("id")} className="px-4 py-3 text-left font-semibold text-slate-600 whitespace-nowrap cursor-pointer hover:text-indigo-600">
                    ID <SortIcon k="id" sortKey={sortKey} sortOrder={sortOrder} />
                  </th>
                  <th onClick={() => handleSort("date")} className="px-4 py-3 text-left font-semibold text-slate-600 whitespace-nowrap cursor-pointer hover:text-indigo-600">
                    日付 <SortIcon k="date" sortKey={sortKey} sortOrder={sortOrder} />
                  </th>
                  <th className="px-4 py-3 text-left font-semibold text-slate-600 whitespace-nowrap">表題</th>
                  <th className="px-4 py-3 text-left font-semibold text-slate-600 whitespace-nowrap">お名前</th>
                  <th onClick={() => handleSort("urgency")} className="px-4 py-3 text-left font-semibold text-slate-600 whitespace-nowrap cursor-pointer hover:text-indigo-600">
                    緊急度 <SortIcon k="urgency" sortKey={sortKey} sortOrder={sortOrder} />
                  </th>
                  <th onClick={() => handleSort("status")} className="px-4 py-3 text-left font-semibold text-slate-600 whitespace-nowrap cursor-pointer hover:text-indigo-600">
                    ステータス <SortIcon k="status" sortKey={sortKey} sortOrder={sortOrder} />
                  </th>
                  <th className="px-4 py-3 text-left font-semibold text-slate-600 whitespace-nowrap">カテゴリ</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100">
                {displayedInquiries.map((item) => (
                  <tr key={item.id} onClick={() => router.push(`/admin/inquiries/${item.id}`)} className="hover:bg-slate-50 cursor-pointer transition-colors">
                    <td className="px-4 py-3 text-slate-500 whitespace-nowrap text-xs font-mono">{item.id}</td>
                    <td className="px-4 py-3 text-slate-500 whitespace-nowrap text-xs">{item.date}</td>
                    <td className="px-4 py-3 text-slate-700 max-w-[320px] truncate font-medium">{item.title}</td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className="text-slate-700 text-xs">{item.name}</span>
                      {item.department && <span className="ml-1 text-xs text-slate-400">{item.department}</span>}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-bold ${URGENCY_STYLE[item.urgency] ?? "bg-slate-100 text-slate-500"}`}>{item.urgency}</span>
                    </td>

                    {/* ステータス */}
                    <td className="px-4 py-3 relative">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setOpenStatusId((prev) => (prev === item.id ? null : item.id));
                        }}
                        className={`px-3 py-1 rounded-full text-xs font-bold whitespace-nowrap
                          hover:opacity-70 transition-opacity ${STATUS_STYLE[item.status ?? "未対応"]}`}
                      >
                        {item.status ?? "未対応"} ▾
                      </button>

                      {openStatusId === item.id && (
                        <div
                          className="absolute z-10 left-2 mt-1 w-32 bg-white border border-slate-200
                            rounded-xl shadow-lg overflow-hidden"
                          onClick={(e) => e.stopPropagation()}
                        >
                          {(["未対応", "対応中", "intec対応", "完了"] as InquiryStatus[]).map((s) => (
                            <button
                              key={s}
                              onClick={(e) => {
                                e.stopPropagation();
                                handleStatusChange(item.id, s);
                              }}
                              className={`w-full text-left px-3 py-2 text-xs font-bold
                                hover:bg-slate-50 transition-colors
                                ${item.status === s ? STATUS_STYLE[s] : "text-slate-600"}`}
                            >
                              {s}
                            </button>
                          ))}
                        </div>
                      )}
                    </td>

                    {/* カテゴリ */}
                    <td className="px-4 py-3">{item.inquiryCategory ? <span className="inline-block px-2 py-0.5 rounded-md text-xs font-medium bg-slate-100 text-slate-600 whitespace-nowrap">{item.inquiryCategory}</span> : <span className="text-slate-300 text-xs">—</span>}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div className="mt-6">
          <Link href="/" className="text-sm text-slate-400 hover:text-slate-600 transition-colors">
            ← ホームに戻る
          </Link>
        </div>
      </div>
    </main>
  );
}

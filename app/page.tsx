import Link from "next/link";

// ── メニュー項目の定義 ──────────────────────────────
// 追加・変更がしやすいように配列で管理
const MENU_ITEMS = [
  {
    href: "/inquiry",
    statusHref: "/inquiry/status",
    label: "問い合わせフォーム",
    description: "MCの修正依頼や質問はこちらから",
    icon: "📩",
    color: "from-indigo-500 to-indigo-600",
    available: true,
  },
  {
    href: "/account-unlock",
    statusHref: "/account-unlock/status",
    label: "アカウントロック解除",
    description: "ログインできない場合の解除申請はこちらから",
    icon: "🔓",
    color: "from-amber-500 to-amber-600",
    available: true, // 未実装（グレーアウト表示）
  },
  {
    href: "/storage-extension",
    statusHref: "/storage-extension/status",
    label: "保管期限延長",
    description: "保管期限延長申請はこちらから",
    icon: "📦",
    color: "from-emerald-500 to-emerald-600",
    available: true,
  },
  {
    href: "/judgment-cancel",
    statusHref: "/judgment-cancel/status",
    label: "総合判定取消",
    description: "総合判定の取消申請はこちらから",
    icon: "↩️",
    color: "from-rose-500 to-rose-600",
    available: true,
  },
] as const;

export default function TopPage() {
  return (
    <main className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-6">
      {/* ── ヘッダー ── */}
      <div className="text-center mb-16">
        {/*バッジ*/}
        <div className="inline-flex items-center gap-2      bg-slat-800 border border-slate-700 rounded-full px-4 py-1.5 mb-6">
          <span className="w-1.5 h1.5 rounded-full bg-indigo-400 animate-pulse" />
          <span className="text-xs font-semibold tracking-widest text-slate-400 uppercase">Internal System</span>
        </div>

        {/* タイトル */}
        <h1 className="text-5x1 sm:text-6x1 font-black text-white tracking-tight leading-none mb-3">
          MC <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-cyan-400">Systems</span> Desk
        </h1>
        <p className="text-slate-400 text-base mt-4">瀬戸情報システム部 MC担当窓口</p>
      </div>

      {/* ── メニューカード ── */}
      <div className="flex flex-col gap-4 w-full max-w-3xl">
        {MENU_ITEMS.map((item) => (
          <div
            key={item.href}
            className="bg-slate-800 border border-slate-700 rounded-2xl overflow-hidden
              hover:border-slate-600 transition-all duration-200"
          >
            <div className="flex flex-col sm:flex-row">
              <Link
                href={item.available ? item.href : "#"}
                className={`flex-1 flex items-center gap-4 p-6 group transition-all duration-200
                  ${item.available ? "hover:bg-slate-700/50" : "opacity-40 cursor-not-allowed pointer-events-none"}`}
              >
                <div
                  className={`w-12 h-12 rounded-xl bg-gradient-to-br ${item.color}
                  flex items-center justify-center text-2xl shrink-0 shadow-lg`}
                >
                  {item.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <h2 className="text-white font-bold text-base group-hover:text-indigo-300 transition-colors truncate">{item.label}</h2>
                  <p className="text-slate-400 text-sm mt-0.5">{item.description}</p>
                  <p className="text-indigo-400 text-xs font-semibold mt-2">申請する →</p>
                </div>
              </Link>

              {/* 区切り線（PC：縦、スマホ：横） */}
              <div className="hidden sm:block w-px bg-slate-700 my-4" />
              <div className="sm:hidden h-px bg-slate-700 mx-6" />

              {/* 右側：処理状況を確認 */}
              <Link
                href={item.available ? item.statusHref : "#"}
                className={`sm:w-52 flex items-center gap-3 p-6 group transition-all duration-200
                  ${item.available ? "hover:bg-slate-700/50" : "opacity-40 cursor-not-allowed pointer-events-none"}`}
              >
                <div
                  className="w-10 h-10 rounded-xl bg-slate-700 group-hover:bg-slate-600
                  flex items-center justify-center shrink-0 transition-colors"
                >
                  <svg className="w-5 h-5 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                </div>
                <div>
                  <p className="text-slate-300 font-semibold text-sm group-hover:text-white transition-colors">処理状況を確認</p>
                  <p className="text-slate-500 text-xs mt-0.5">申請の進捗を見る</p>
                </div>
              </Link>
            </div>
          </div>
        ))}
      </div>

      {/* ── 管理者専用 ── */}
      <div className="mt-6 w-full max-w-3xl flex justify-end">
        <Link
          href="/admin/inquiries"
          className="flex items-center gap-2 px-4 py-2 rounded-xl
      bg-slate-800 border border-slate-700 hover:border-slate-500
      text-slate-400 hover:text-white text-xs font-semibold
      transition-all duration-200"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
          管理者ページ
        </Link>
      </div>

      {/* ── フッター ── */}
      <p className="text-slate-600 text-xs mt-16">© MC 情報システム部</p>
    </main>
  );
}

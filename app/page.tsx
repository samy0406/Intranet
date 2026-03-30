import Link from "next/link";

// ── メニュー項目の定義 ──────────────────────────────
// 追加・変更がしやすいように配列で管理
const MENU_ITEMS = [
  {
    href: "/inquiry",
    label: "問い合わせフォーム",
    description: "MCの修正依頼や質問はこちらから",
    icon: "📩",
    color: "from-indigo-500 to-indigo-600",
    available: true,
  },
  {
    href: "/account-unlock",
    label: "アカウントロック解除",
    description: "ログインできない場合の解除申請",
    icon: "🔓",
    color: "from-amber-500 to-amber-600",
    available: true, // 未実装（グレーアウト表示）
  },
  {
    href: "/storage-extension",
    label: "保管期限延長",
    description: "保管期限延長申請はこちらから",
    icon: "📦",
    color: "from-emerald-500 to-emerald-600",
    available: true,
  },
  {
    href: "/judgment-cancel",
    label: "総合判定取消",
    description: "総合判定の取消申請はこちらから",
    icon: "↩️",
    color: "from-rose-500 to-rose-600",
    available: true,
  },
] as const;

export default function TopPage() {
  return (
    <main className="min-h-screen bg-slate-900 flex flex-col item-center justify-center p-6">
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
      <div className="grid grid-cols-1 gap-4 w-full max-w-2x1">
        {MENU_ITEMS.map((item) =>
          item.available ? (
            // 実装済み → リンクとして動作
            <Link
              key={item.href}
              href={item.href}
              className="group relative bg-slate-800 border border-slate-700 rounded-2x1 p-6
                hover:border-indigo-500 hover:bg-slate-750 transition-all duration-200
                hover:shadow-lg hover:shadow-indigo-500/10 hover:-translate-y-0.5"
            >
              <CardContent item={item} />
            </Link>
          ) : (
            // 未実装 → クリック不可のグレーアウト
            <div
              key={item.href}
              className="relative bg-slate-800/50 border border-slate-800 rounded-2x1 p-6
                opacity-50 cursor-not-allowed"
            >
              <CardContent item={item} />
              {/* 準備中バッジ */}
              <span
                className="absolute top-4 right-4 text-xs bg-slate-700 text-slate-400
                px-2 py-0.5 rounded-full"
              >
                準備中
              </span>
            </div>
          ),
        )}
      </div>

      {/* ── フッター ── */}
      <p className="text-slate-600 text-xs mt-16">© MC 情報システム部</p>
    </main>
  );
}

// ── カードの中身（共通部品） ──────────────────────
// Link版とdiv版で同じ中身を使い回すためコンポーネントに切り出す
type MenuItem = (typeof MENU_ITEMS)[number];

function CardContent({ item }: { item: MenuItem }) {
  return (
    <>
      {/* アイコン */}
      <div
        className={`w-12 h-12 rounded-xl bg-gradient-to-br ${item.color}
        flex-item-center justify-center text2x1 mb-4 shadow-lg`}
      >
        {item.icon}
      </div>

      {/* テキスト */}
      <h2 className="text-white font-bold text-lg mb-1 group-hover:text-indigo-300 transition-colors">{item.label}</h2>
      <p className="text-slate-400 text-sm leading-relaxed">{item.description}</p>

      {/* 矢印アイコン（リンク版のみ） */}
      {"available" in item && item.available && (
        <div
          className="mt-4 flex items-center gap-1 text-indigo-400 text-xs font-semibold
          group-hover:gap-2 transition-all"
        >
          開く
          <span>→</span>
        </div>
      )}
    </>
  );
}

import Link from "next/link";
import { BackToHomeButton } from "@/components/BackToHomeButton";

// このページはサーバーコンポーネント（'use client' が不要）
// 状態管理が不要なシンプルな表示だけのページ
export default function DonePage() {
  return (
    <main className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-10 text-center max-w-sm w-full">
        {/* チェックマークアイコン */}
        <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>

        <h2 className="text-xl font-bold text-slate-800 mb-2">送信完了しました</h2>
        <p className="text-slate-500 text-sm mb-8">担当者より折り返しご連絡します。</p>

        <BackToHomeButton />

        {/* Link = Next.jsのページ遷移コンポーネント（<a>タグより高速） */}
        <Link
          href="/"
          className="w-full inline-block py-2.5 rounded-xl bg-indigo-600 text-white font-medium
            text-sm hover:bg-indigo-700 transition-colors text-center"
        >
          新しい問い合わせをする
        </Link>
      </div>
    </main>
  );
}

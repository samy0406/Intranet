// 管理者ページ：問い合わせ一覧
// import { getAllInquiries } from '@/lib/db'  // DB申請後に有効化
import { Inquiry } from '@/types/inquiry'

export default async function AdminPage() {
  // DB申請後に有効化
  // const inquiries: Inquiry[] = await getAllInquiries()
  const inquiries: Inquiry[] = []  // 暫定：空配列

  return (
    <main className="min-h-screen bg-slate-50 p-8">
      <div className="max-w-4xl mx-auto">

        <div className="mb-8">
          <span className="text-xs font-bold tracking-widest text-indigo-500 uppercase">Admin</span>
          <h1 className="text-3xl font-bold text-slate-800 mt-1">問い合わせ一覧</h1>
          <p className="text-slate-400 text-sm mt-1">
            全 <span className="font-semibold text-slate-600">{inquiries.length}</span> 件
          </p>
        </div>

        {inquiries.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-100 p-12 text-center text-slate-400">
            まだ問い合わせはありません
          </div>
        ) : (
          <div className="space-y-3">
            {/* inquiries配列をmap()でループして1件ずつカードを表示 */}
            {inquiries.map((item: Inquiry) => (
              <div key={item.id}
                className="bg-white rounded-2xl border border-slate-100 p-6 hover:shadow-sm transition-shadow"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-semibold text-slate-800">{item.name}</span>
                      {item.department && (
                        <span className="text-xs bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full">
                          {item.department}
                        </span>
                      )}
                    </div>
                    <p className="text-slate-600 text-sm leading-relaxed">{item.message}</p>
                    {item.filename && (
                      <p className="text-indigo-500 text-xs mt-2">📎 {item.filename}</p>
                    )}
                  </div>
                  <time className="text-xs text-slate-300 whitespace-nowrap shrink-0">
                    {/* ISO文字列を読みやすい日付に変換 */}
                    {new Date(item.createdAt).toLocaleString('ja-JP')}
                  </time>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  )
}

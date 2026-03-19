// ================================================
// instrumentation.ts
// Next.js がサーバー起動時に1回だけ実行するファイル
// テーブルの初期化をここで行う
// ================================================
export async function register() {
  // DB申請後に有効化
  // if (process.env.NEXT_RUNTIME === 'nodejs') {
  //   const { initDb } = await import('@/lib/db')
  //   await initDb()
  //   console.log('✅ Oracle DB 初期化完了')
  // }
}

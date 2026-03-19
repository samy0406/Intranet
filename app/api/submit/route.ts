import { NextRequest, NextResponse } from 'next/server'
import { writeFile, mkdir, readFile } from 'fs/promises'
import { existsSync } from 'fs'
import path from 'path'
// import { saveInquiry } from '@/lib/db'  // DB申請後に有効化
import { ApiResponse } from '@/types/inquiry'

const ALLOWED_EXTENSIONS = ['.pdf', '.doc', '.docx', '.xls', '.xlsx', '.png', '.jpg', '.jpeg']
const MAX_SIZE = 10 * 1024 * 1024  // 10MB
const UPLOAD_DIR = path.join(process.cwd(), 'uploads')
// テキストデータの保存先（DB代わり）
const TEXT_DATA_FILE = path.join(process.cwd(), 'uploads', 'inquiries.json')

// ── ファイル保存ユーティリティ ────────────────────
async function saveFile(file: File, prefix: string): Promise<string | null> {
  if (!file || file.size === 0) return null
  const ext = path.extname(file.name).toLowerCase()
  if (!ALLOWED_EXTENSIONS.includes(ext)) throw new Error(`許可されていないファイル形式です: ${ext}`)
  if (file.size > MAX_SIZE) throw new Error('ファイルサイズは10MB以下にしてください')
  await mkdir(UPLOAD_DIR, { recursive: true })
  const filename = `${prefix}_${Date.now()}${ext}`
  await writeFile(path.join(UPLOAD_DIR, filename), Buffer.from(await file.arrayBuffer()))
  return filename
}

// ── テキストデータを inquiries.json に追記 ────────
// DBが使えるまでの暫定保存先
async function saveTextData(record: Record<string, unknown>): Promise<void> {
  await mkdir(UPLOAD_DIR, { recursive: true })

  // 既存データを読み込む（なければ空配列）
  let existing: unknown[] = []
  if (existsSync(TEXT_DATA_FILE)) {
    const raw = await readFile(TEXT_DATA_FILE, 'utf-8')
    existing = JSON.parse(raw)
    // JSON.parse = JSON文字列 → JavaScriptオブジェクトに変換
  }

  // 新しいレコードを追加して書き出す
  existing.push(record)
  await writeFile(TEXT_DATA_FILE, JSON.stringify(existing, null, 2), 'utf-8')
  // JSON.stringify(data, null, 2) = オブジェクト → 見やすいJSON文字列に変換（2スペースインデント）
}

export async function POST(request: NextRequest): Promise<NextResponse<ApiResponse>> {
  try {
    const data = await request.formData()

    const name       = data.get('name')       as string
    const department = data.get('department') as string
    const title      = data.get('title')      as string
    const urgency    = data.get('urgency')    as string
    const screenPath = data.get('screenPath') as string
    const message    = data.get('message')    as string
    const resolution = data.get('resolution') as string
    const file       = data.get('file')       as File | null
    const screenshot = data.get('screenshot') as File | null

    if (!name || !title || !urgency || !message || !resolution) {
      return NextResponse.json(
        { status: 'error', message: '必須項目を入力してください' },
        { status: 400 }
      )
    }

    // ファイル・スクリーンショットを保存
    const filename           = file       ? await saveFile(file, 'file')             : null
    const screenshotFilename = screenshot ? await saveFile(screenshot, 'screenshot') : null

    // ── テキストデータを JSON ファイルに保存（DB代わり）──
    await saveTextData({
      id:         Date.now(),           // 仮のID（タイムスタンプ）
      name, department, title, urgency, screenPath, message, resolution,
      filename, screenshot: screenshotFilename,
      createdAt:  new Date().toLocaleString('ja-JP'),  // 日本時間で保存
    })

    // DB申請後はこちらに切り替え：
    // saveInquiry({ name, department, title, urgency, screenPath, message, resolution, filename, screenshot: screenshotFilename })

    return NextResponse.json({ status: 'ok', message: '送信完了しました' })

  } catch (error) {
    const msg = error instanceof Error ? error.message : 'サーバーエラーが発生しました'
    return NextResponse.json({ status: 'error', message: msg }, { status: 500 })
  }
}

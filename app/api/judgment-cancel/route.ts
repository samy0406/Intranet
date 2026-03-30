import { NextRequest, NextResponse } from 'next/server'
import { writeFile, mkdir, readFile } from 'fs/promises'
import { existsSync } from 'fs'
import path from 'path'

const ALLOWED_EXTENSIONS = ['.png', '.jpg', '.jpeg', '.gif', '.webp']
const MAX_SIZE = 10 * 1024 * 1024
const DATA_FILE  = path.join(process.cwd(), 'uploads', 'judgment_cancel.json')
const UPLOAD_DIR = path.join(process.cwd(), 'uploads')

export async function POST(request: NextRequest) {
  try {
    const data        = await request.formData()
    const department  = data.get('department')  as string
    const name        = data.get('name')        as string
    const itemCode    = data.get('itemCode')    as string
    const lotNo       = data.get('lotNo')       as string
    const screenshot  = data.get('screenshot') as File | null

    if (!department || !name || !itemCode || !lotNo) {
      return NextResponse.json({ status: 'error', message: '必須項目を入力してください' }, { status: 400 })
    }

    await mkdir(UPLOAD_DIR, { recursive: true })

    // スクリーンショットを保存
    let screenshotFilename: string | null = null
    if (screenshot && screenshot.size > 0) {
      const ext = path.extname(screenshot.name).toLowerCase() || '.png'
      if (!ALLOWED_EXTENSIONS.includes(ext)) {
        return NextResponse.json({ status: 'error', message: '画像ファイルを貼り付けてください' }, { status: 400 })
      }
      if (screenshot.size > MAX_SIZE) {
        return NextResponse.json({ status: 'error', message: 'ファイルサイズは10MB以下にしてください' }, { status: 400 })
      }
      screenshotFilename = `judgment_screenshot_${Date.now()}${ext}`
      await writeFile(path.join(UPLOAD_DIR, screenshotFilename), Buffer.from(await screenshot.arrayBuffer()))
    }

    // JSONに保存
    let existing: unknown[] = []
    if (existsSync(DATA_FILE)) {
      existing = JSON.parse(await readFile(DATA_FILE, 'utf-8'))
    }
    existing.push({
      id: Date.now(), department, name, itemCode, lotNo,
      screenshot: screenshotFilename,
      createdAt: new Date().toLocaleString('ja-JP'),
    })
    await writeFile(DATA_FILE, JSON.stringify(existing, null, 2), 'utf-8')

    return NextResponse.json({ status: 'ok', message: '申請を受け付けました' })
  } catch {
    return NextResponse.json({ status: 'error', message: 'サーバーエラーが発生しました' }, { status: 500 })
  }
}

import { NextRequest, NextResponse } from 'next/server'
import { writeFile, mkdir, readFile } from 'fs/promises'
import { existsSync } from 'fs'
import path from 'path'

const DATA_FILE = path.join(process.cwd(), 'uploads', 'storage_extension.json')

export async function POST(request: NextRequest) {
  try {
    // 品目配列を含むためJSONで受け取る
    const body = await request.json()
    const { department, name, items } = body

    if (!department || !name || !items?.length) {
      return NextResponse.json({ status: 'error', message: '必須項目を入力してください' }, { status: 400 })
    }

    await mkdir(path.join(process.cwd(), 'uploads'), { recursive: true })
    let existing: unknown[] = []
    if (existsSync(DATA_FILE)) {
      existing = JSON.parse(await readFile(DATA_FILE, 'utf-8'))
    }
    existing.push({
      id: Date.now(),
      department, name, items,
      createdAt: new Date().toLocaleString('ja-JP'),
    })
    await writeFile(DATA_FILE, JSON.stringify(existing, null, 2), 'utf-8')

    return NextResponse.json({ status: 'ok', message: '申請を受け付けました' })
  } catch {
    return NextResponse.json({ status: 'error', message: 'サーバーエラーが発生しました' }, { status: 500 })
  }
}

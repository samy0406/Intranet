// ================================================
// データベース操作ユーティリティ（Oracle版）
// oracledb = Node.js公式 Oracle ドライバー
// ================================================
import oracledb from 'oracledb'
import { Inquiry } from '@/types/inquiry'

// ── 接続設定（.env.local から読み込む） ──────────────
// process.env.XXX = 環境変数（パスワードをコードに直書きしないための仕組み）
const DB_CONFIG: oracledb.ConnectionAttributes = {
  user:             process.env.ORACLE_USER,       // Oracleのユーザー名
  password:         process.env.ORACLE_PASSWORD,   // パスワード
  connectString:    process.env.ORACLE_CONN_STRING, // 例: "192.168.1.1:1521/ORCL"
}

// ── 接続を取得するヘルパー関数 ──────────────────────
// 毎回 getConnection → 処理 → connection.close() のパターンを使う
async function getConnection(): Promise<oracledb.Connection> {
  return await oracledb.getConnection(DB_CONFIG)
}

// ── テーブルが無ければ作成する（初回のみ実行） ──────
export async function initDb(): Promise<void> {
  const conn = await getConnection()
  try {
    // Oracle の自動採番: GENERATED ALWAYS AS IDENTITY（SQLiteの AUTOINCREMENT に相当）
    // VARCHAR2(n): Oracleの文字列型（nはバイト数上限）
    // TIMESTAMP: OracleのDateTime型
    await conn.execute(`
      CREATE TABLE inquiries (
        id          NUMBER         GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
        name        VARCHAR2(100)  NOT NULL,
        department  VARCHAR2(100),
        message     CLOB           NOT NULL,
        filename    VARCHAR2(255),
        created_at  TIMESTAMP      DEFAULT CURRENT_TIMESTAMP
      )
    `)
    await conn.commit()
  } catch (err: unknown) {
    // ORA-00955 = テーブルがすでに存在する → 正常なのでスキップ
    if ((err as { errorNum?: number }).errorNum !== 955) {
      throw err // それ以外のエラーは再スロー
    }
  } finally {
    // finally = 成功・失敗どちらでも必ず実行（接続を閉じ忘れ防止）
    await conn.close()
  }
}

// ── 問い合わせを1件保存する ────────────────────────────
export async function saveInquiry(
  data: Omit<Inquiry, 'id' | 'createdAt'>
): Promise<void> {
  const conn = await getConnection()
  try {
    // Oracle のプレースホルダーは :変数名 形式（SQLiteの ? とは違う）
    await conn.execute(
      `INSERT INTO inquiries (name, department, message, filename)
       VALUES (:name, :department, :message, :filename)`,
      {
        name:       data.name,
        department: data.department,
        message:    data.message,
        filename:   data.filename,  // null でも渡せる
      }
    )
    await conn.commit() // Oracleは明示的にcommitが必要
  } finally {
    await conn.close()
  }
}

// ── 問い合わせを全件取得する ───────────────────────────
export async function getAllInquiries(): Promise<Inquiry[]> {
  const conn = await getConnection()
  try {
    // outFormat: OBJECT = 結果を { カラム名: 値 } のオブジェクト形式で返す
    // （デフォルトは配列形式なので指定が必要）
    const result = await conn.execute<Inquiry>(
      `SELECT id, name, department, message, filename,
              TO_CHAR(created_at, 'YYYY-MM-DD HH24:MI:SS') AS "createdAt"
       FROM inquiries
       ORDER BY created_at DESC`,
      {},
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    )
    // rows が undefined のときは空配列を返す
    return (result.rows ?? []) as Inquiry[]
  } finally {
    await conn.close()
  }
}

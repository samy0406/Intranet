// lib/db.ts
import oracledb from "oracledb";

oracledb.initOracleClient({
  libDir: process.env.ORACLE_CLIENT_PATH,
});

const DB_CONFIG: oracledb.ConnectionAttributes = {
  user: process.env.ORACLE_USER,
  password: process.env.ORACLE_PASSWORD,
  connectString: process.env.ORACLE_CONN_STRING,
};

async function getConnection(): Promise<oracledb.Connection> {
  return await oracledb.getConnection(DB_CONFIG);
}

// ── 問い合わせを1件保存する ────────────────────────
export async function saveInquiry(data: { inquiry_name: string; busyo?: string; mailaddress?: string; title?: string; urgency?: string; urgentReason?: string; urgentApproval?: string; howtoOpenScreen?: string; background?: string; reqAction?: string }): Promise<void> {
  const conn = await getConnection();
  try {
    // MC_INQUIRY_NO はシーケンスから自動採番
    // ★ シーケンス名が違う場合はここを修正してください
    await conn.execute(
      `INSERT INTO MCTEST1.W_TBL_INQUIRY_RECORD
        (MC_INQUIRY_NO, INQUIRY_NAME, BUSYO, MAILADDRESS, TITLE,
         URGENCY, URGENT_REASON, URGENT_APPROVAL,
         HOWTO_OPEN_SCREEN, BACKGROUND, REQ_ACTION)
       VALUES
        (MCTEST1.MC_INQUIRY_NO.NEXTVAL,
         :inquiry_name, :busyo, :mailaddress, :title,
         :urgency, :urgentReason, :urgentApproval,
         :howtoOpenScreen, :background, :reqAction)`,
      {
        inquiry_name: data.inquiry_name,
        busyo: data.busyo ?? null,
        mailaddress: data.mailaddress ?? null,
        title: data.title ?? null,
        urgency: data.urgency ?? null,
        urgentReason: data.urgentReason ?? null,
        urgentApproval: data.urgentApproval ?? null,
        howtoOpenScreen: data.howtoOpenScreen ?? null,
        background: data.background ?? null,
        reqAction: data.reqAction ?? null,
      },
    );
    await conn.commit();
  } finally {
    await conn.close();
  }
}

// ── 問い合わせを全件取得する（一覧表示用） ─────────
export async function getAllInquiries() {
  const conn = await getConnection();
  try {
    const result = await conn.execute(
      `SELECT
         MC_INQUIRY_NO                              AS "id",
         TO_CHAR(INQUIRY_DATE, 'YYYY/MM/DD')        AS "date",
         INQUIRY_NAME                                       AS "name",
         BUSYO                                      AS "department",
         TITLE                                      AS "title",
         URGENCY                                    AS "urgency",
         MAILADDRESS                                AS "email",
         -- CLOSED_DATE が入っていれば完了、なければ未対応
         CASE WHEN CLOSED_DATE IS NOT NULL THEN '完了' ELSE '未対応' END AS "status"
       FROM MCTEST1.W_TBL_INQUIRY_RECORD
       ORDER BY INQUIRY_DATE DESC`,
      {},
      { outFormat: oracledb.OUT_FORMAT_OBJECT },
    );
    return result.rows ?? [];
  } finally {
    await conn.close();
  }
}

// ── 問い合わせを1件取得する（詳細表示用） ──────────
export async function getInquiryById(id: number) {
  const conn = await getConnection();
  try {
    const result = await conn.execute(
      `SELECT
         MC_INQUIRY_NO                              AS "id",
         INQUIRY_NAME                                       AS "name",
         BUSYO                                      AS "department",
         MAILADDRESS                                AS "email",
         TITLE                                      AS "title",
         URGENCY                                    AS "urgency",
         URGENT_REASON                              AS "urgentReason",
         URGENT_APPROVAL                            AS "urgentApproval",
         HOWTO_OPEN_SCREEN                          AS "screenPath",
         BACKGROUND                                 AS "background",
         REQ_ACTION                                  AS "reqAction",
         RESPONSE_DETAIL                            AS "responseDetail",
         CLOSED_NAME                                AS "closedName",
         TO_CHAR(CLOSED_DATE, 'YYYY/MM/DD')         AS "closedDate",
         TO_CHAR(INQUIRY_DATE, 'YYYY/MM/DD HH24:MI') AS "createdAt",
         CASE WHEN CLOSED_DATE IS NOT NULL THEN '完了' ELSE '未対応' END AS "status"
       FROM MCTEST1.W_TBL_INQUIRY_RECORD
       WHERE MC_INQUIRY_NO = :id`,
      { id },
      { outFormat: oracledb.OUT_FORMAT_OBJECT },
    );
    const rows = result.rows ?? [];
    return rows.length > 0 ? rows[0] : null;
  } finally {
    await conn.close();
  }
}

// ── 対応完了にする（admin画面用） ───────────────────
// STATUS カラムがないため、CLOSED_DATE と CLOSED_NAME で完了を記録する
export async function closeInquiry(
  id: number,
  closedName: string, // 対応者名（admin画面で入力）
  responseDetail: string,
): Promise<void> {
  const conn = await getConnection();
  try {
    await conn.execute(
      `UPDATE MCTEST1.W_TBL_INQUIRY_RECORD
       SET CLOSED_DATE = SYSDATE,
           CLOSED_NAME = :closedName,
           RESPONSE_DETAIL  = :responseDetail
       WHERE MC_INQUIRY_NO = :id`,
      { closedName, responseDetail, id },
    );
    await conn.commit();
  } catch (err) {
    console.error("Error occurred while closing inquiry:", err);
    throw err;
  } finally {
    await conn.close();
  }
}

// ── フィールドを個別に更新する（自動保存用） ────────
// onBlur（フォーカスが外れた）タイミングで1項目だけ保存するための関数
// column は 'CLOSED_NAME' か 'RESPONSE_DETAIL' に限定（セキュリティ対策）
export async function updateInquiryField(id: number, column: "CLOSED_NAME" | "RESPONSE_DETAIL", value: string): Promise<void> {
  const conn = await getConnection();
  try {
    // column は TypeScript側で安全な値に限定しているのでテンプレートリテラルOK
    await conn.execute(
      `UPDATE MCTEST1.W_TBL_INQUIRY_RECORD
       SET ${column} = :value
       WHERE MC_INQUIRY_NO = :id`,
      { value, id },
    );
    await conn.commit();
  } finally {
    await conn.close();
  }
}

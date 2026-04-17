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
export async function saveInquiry(data: { inquiry_name: string; busyo?: string; mailaddress?: string; title?: string; urgency?: string; urgentReason?: string; urgentApproval?: string; howtoOpenScreen?: string; background?: string; reqAction?: string }): Promise<number> {
  const conn = await getConnection();
  try {
    const result = await conn.execute(
      `INSERT INTO MCTEST1.W_TBL_INQUIRY_RECORD
        (MC_INQUIRY_NO, INQUIRY_NAME, BUSYO, MAILADDRESS, TITLE,
         URGENCY, URGENT_REASON, URGENT_APPROVAL,
         HOWTO_OPEN_SCREEN, BACKGROUND, REQ_ACTION,
         STATUS)
       VALUES
        (MCTEST1.MC_INQUIRY_NO.NEXTVAL,
         :inquiry_name, :busyo, :mailaddress, :title,
         :urgency, :urgentReason, :urgentApproval,
         :howtoOpenScreen, :background, :reqAction,
         '未対応')
       RETURNING MC_INQUIRY_NO INTO :insertedId`,
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
        insertedId: { dir: oracledb.BIND_OUT, type: oracledb.NUMBER },
      },
    );
    await conn.commit();
    const outBinds = result.outBinds as { insertedId: number[] };
    return outBinds.insertedId[0];
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
         INQUIRY_NAME                               AS "name",
         BUSYO                                      AS "department",
         TITLE                                      AS "title",
         URGENCY                                    AS "urgency",
         MAILADDRESS                                AS "email",
         INQUIRY_CATEGORY                           AS "inquiryCategory",
         STATUS                                     AS "status"
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
         MC_INQUIRY_NO                               AS "id",
         INQUIRY_NAME                                AS "name",
         BUSYO                                       AS "department",
         MAILADDRESS                                 AS "email",
         TITLE                                       AS "title",
         URGENCY                                     AS "urgency",
         URGENT_REASON                               AS "urgentReason",
         URGENT_APPROVAL                             AS "urgentApproval",
         HOWTO_OPEN_SCREEN                           AS "screenPath",
         BACKGROUND                                  AS "background",
         REQ_ACTION                                  AS "reqAction",
         RESPONSE_DETAIL                             AS "responseDetail",
         PERSON_IN_CHARGE                            AS "personInCharge",
         INQUIRY_CATEGORY                            AS "inquiryCategory",
         TO_CHAR(CLOSED_DATE, 'YYYY/MM/DD')          AS "closedDate",
         TO_CHAR(INQUIRY_DATE, 'YYYY/MM/DD HH24:MI') AS "createdAt",
         STATUS                                      AS "status"
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
export async function closeInquiry(id: number, personInCharge: string, responseDetail: string, inquiryCategory: string): Promise<void> {
  const conn = await getConnection();
  try {
    await conn.execute(
      `UPDATE MCTEST1.W_TBL_INQUIRY_RECORD
       SET CLOSED_DATE       = SYSDATE,
           PERSON_IN_CHARGE  = :personInCharge,
           RESPONSE_DETAIL   = :responseDetail,
           INQUIRY_CATEGORY  = :inquiryCategory,
           STATUS            = '完了'
       WHERE MC_INQUIRY_NO = :id`,
      { personInCharge, responseDetail, inquiryCategory, id },
    );
    await conn.commit();
  } catch (err) {
    console.error("Error occurred while closing inquiry:", err);
    throw err;
  } finally {
    await conn.close();
  }
}

// ── フィールドを個別に更新する（自動保存・ステータス変更用） ────────
export async function updateInquiryField(id: number, column: "PERSON_IN_CHARGE" | "RESPONSE_DETAIL" | "INQUIRY_CATEGORY" | "STATUS", value: string): Promise<void> {
  const conn = await getConnection();
  try {
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

// ── メールアドレスで問い合わせを検索する（処理状況確認用） ──
export async function getInquiriesByEmail(mail: string) {
  const conn = await getConnection();
  try {
    const result = await conn.execute(
      `SELECT
         MC_INQUIRY_NO                               AS "id",
         TO_CHAR(INQUIRY_DATE, 'YYYY/MM/DD HH24:MI') AS "date",
         TITLE                                        AS "title",
         INQUIRY_NAME                                 AS "name",
         BACKGROUND                                   AS "message",
         REQ_ACTION                                   AS "resolution",
         STATUS                                       AS "status"
       FROM MCTEST1.W_TBL_INQUIRY_RECORD
       WHERE MAILADDRESS = :mail
       ORDER BY INQUIRY_DATE DESC`,
      { mail },
      { outFormat: oracledb.OUT_FORMAT_OBJECT },
    );
    return result.rows ?? [];
  } finally {
    await conn.close();
  }
}

// ════════════════════════════════════════════════════
// アカウントロック解除
// ════════════════════════════════════════════════════

export async function findAccountUnlock(accountCode: string): Promise<boolean> {
  const conn = await getConnection();
  try {
    const result = await conn.execute(`SELECT COUNT(*) AS ULOGIN FROM T_LOGIN WHERE USER_ID = :accountCode`, { accountCode }, { outFormat: oracledb.OUT_FORMAT_OBJECT });
    const rows = result.rows as { ULOGIN: number }[];
    return rows[0].ULOGIN > 0;
  } finally {
    await conn.close();
  }
}

// 解除申請用：対象のレコードを削除する
export async function deleteAccountUnlock(accountCode: string): Promise<void> {
  const conn = await getConnection();
  try {
    await conn.execute(`DELETE FROM T_LOGIN WHERE USER_ID = :accountCode`, { accountCode });
    await conn.commit();
  } finally {
    await conn.close();
  }
}

// W_TBL_UNLOCK にロック解除記録をINSERTする
export async function insertUnlockRecord(accountCode: string, mailaddress: string): Promise<void> {
  const conn = await getConnection();
  try {
    await conn.execute(
      `INSERT INTO MCTEST1.W_TBL_UNLOCK (UNLOCK_DATE, USER_ID, MAILADDRESS)
       VALUES (SYSDATE, :accountCode, :mailaddress)`,
      { accountCode, mailaddress },
    );
    await conn.commit();
  } finally {
    await conn.close();
  }
}

// ════════════════════════════════════════════════════
// 保管期限延長
// ════════════════════════════════════════════════════

// ── 保管期限を検索する（SELECT_HOKAN_KIGEN.sql に相当） ──
export async function getHokanKigen(itemCode: string, lotNo: string) {
  const conn = await getConnection();
  try {
    const result = await conn.execute(
      `SELECT
         T1.品目コード        AS "itemCode",
         T2.品名              AS "itemName",
         T1.ロットＮＯ        AS "lotNo",
         T1.試験回数          AS "testCount",
         TO_CHAR(T1.保管期限, 'YYYY/MM/DD') AS "expiryDate",
         TO_CHAR(T1.メーカ期限,'YYYY/MM/DD') AS "makerExpiry"
       FROM T_SHIKENPLUS T1, M_HINMO T2
       WHERE T1.品目コード = T2.品目コード (+)
         AND T1.品目コード = :itemCode
         AND T1.ロットＮＯ   = :lotNo
         AND T1.試験回数 = (
               SELECT MAX(T2.試験回数)
               FROM   T_SHIKENPLUS T2
               WHERE  T2.品目コード = :itemCode
                 AND  T2.ロットＮＯ = :lotNo
             )`,
      { itemCode, lotNo },
      { outFormat: oracledb.OUT_FORMAT_OBJECT },
    );
    const rows = result.rows ?? [];
    return rows.length > 0 ? (rows[0] as Record<string, string>) : null;
  } finally {
    await conn.close();
  }
}

// ── 保管期限を更新する（UPDATE_HOKAN_KIGEN.sql に相当） ──
export async function updateHokanKigen(itemCode: string, lotNo: string, newDate: string, mailaddress: string): Promise<void> {
  const conn = await getConnection();
  try {
    const oldResult = await conn.execute(
      `SELECT TO_CHAR(保管期限, 'YYYY-MM-DD') AS "oldDate"
       FROM T_SHIKENPLUS
       WHERE 品目コード = :itemCode
         AND ロットＮＯ  = :lotNo
         AND 試験回数 = (
               SELECT MAX(T2.試験回数)
               FROM   T_SHIKENPLUS T2
               WHERE  T2.品目コード = :itemCode
                 AND  T2.ロットＮＯ = :lotNo
             )`,
      { itemCode, lotNo },
      { outFormat: oracledb.OUT_FORMAT_OBJECT },
    );
    const oldRows = (oldResult.rows as Record<string, string>[]) ?? [];
    const oldDate = oldRows.length > 0 ? oldRows[0]["oldDate"] : null;

    await conn.execute(
      `UPDATE T_SHIKEN
       SET    保管期限 = TO_DATE(:newDate, 'YYYY-MM-DD')
       WHERE  品目コード = :itemCode
         AND  ロットＮＯ  = :lotNo
         AND  試験回数 = (
                SELECT MAX(T2.試験回数)
                FROM   T_SHIKEN T2
                WHERE  T2.品目コード = :itemCode
                  AND  T2.ロットＮＯ = :lotNo
              )`,
      { itemCode, lotNo, newDate },
    );

    await conn.execute(
      `INSERT INTO T_SHIKENR (
         品目コード,ロットＮＯ,試験回数,場所コード,良品区分,数量,業者ロットＮＯ,
         試験区分,指図区分,試験指図ＮＯ,指図承認日,指図承認者コード,指図承認者部門コード,
         指図承認者正副フラグ,一覧発行日,抜取数,抜取日,抜取者コード,抜取者部門コード,
         試験判定日,確認者コード,確認者部門コード,試験開始日,試験終了日,試験者コード,
         試験者部門コード,総合判定日,判定者コード,判定者部門コード,判定者正副フラグ,
         判定結果区分,保証期限,保管期限,コメント,伝票ＮＯ,再試験不要フラグ,試験規格フラグ,
         必須試験パターンフラグ,通常試験パターンフラグ,特別試験パターンフラグ,
         登録日時,登録担当者コード,更新カウンタ,更新日時,更新担当者コード,
         情報ＩＤ,履歴生成日時,履歴ＮＯ,履歴シーケンス,履歴画面ＩＤ,変更区分,変更担当者コード
       )
       SELECT
         品目コード,ロットＮＯ,試験回数,場所コード,良品区分,数量,業者ロットＮＯ,
         試験区分,指図区分,試験指図ＮＯ,指図承認日,指図承認者コード,指図承認者部門コード,
         指図承認者正副フラグ,一覧発行日,抜取数,抜取日,抜取者コード,抜取者部門コード,
         試験判定日,確認者コード,確認者部門コード,試験開始日,試験終了日,試験者コード,
         試験者部門コード,総合判定日,判定者コード,判定者部門コード,判定者正副フラグ,
         判定結果区分,保証期限,保管期限,コメント,伝票ＮＯ,再試験不要フラグ,試験規格フラグ,
         必須試験パターンフラグ,通常試験パターンフラグ,特別試験パターンフラグ,
         登録日時,登録担当者コード,更新カウンタ,更新日時,更新担当者コード,
         'T_SHIKEN', SYSDATE, 試験指図ＮＯ, '0', 'Tool', 'U', 'Tool'
       FROM T_SHIKEN
       WHERE 品目コード = :itemCode
         AND ロットＮＯ  = :lotNo
         AND 試験回数 = (
               SELECT MAX(T2.試験回数)
               FROM   T_SHIKEN T2
               WHERE  T2.品目コード = :itemCode
                 AND  T2.ロットＮＯ = :lotNo
             )`,
      { itemCode, lotNo },
    );

    await conn.execute(
      `UPDATE T_SHIKENPLUS
       SET    保管期限 = TO_DATE(:newDate, 'YYYY-MM-DD')
       WHERE  品目コード = :itemCode
         AND  ロットＮＯ  = :lotNo
         AND  試験回数 = (
                SELECT MAX(T2.試験回数)
                FROM   T_SHIKENPLUS T2
                WHERE  T2.品目コード = :itemCode
                  AND  T2.ロットＮＯ = :lotNo
              )`,
      { itemCode, lotNo, newDate },
    );

    await conn.execute(
      `INSERT INTO T_SHIKENPLUSR (
        品目コード,ロットＮＯ,試験回数,メーカコード,メーカ期限,使用期限,保管期限,
        現品含量,予定数量,登録日時,登録担当者コード,更新カウンタ,更新日時,更新担当者コード,
        情報ＩＤ,履歴生成日時,履歴ＮＯ,履歴シーケンス,履歴画面ＩＤ,変更区分,変更担当者コード
      )
      SELECT
        品目コード,ロットＮＯ,試験回数,メーカコード,メーカ期限,使用期限,保管期限,
        現品含量,予定数量,登録日時,登録担当者コード,更新カウンタ,更新日時,更新担当者コード,
        'T_SHIKENPLUS', SYSDATE,
        NVL((SELECT MAX(履歴ＮＯ) FROM T_SHIKENPLUSR
              WHERE 品目コード = :itemCode AND ロットＮＯ = :lotNo), 0) + 1,
        '0', 'Tool', 'U', 'Tool'
      FROM T_SHIKENPLUS
      WHERE 品目コード = :itemCode
        AND ロットＮＯ  = :lotNo
        AND 試験回数 = (
              SELECT MAX(T2.試験回数)
              FROM   T_SHIKENPLUS T2
              WHERE  T2.品目コード = :itemCode
                AND  T2.ロットＮＯ = :lotNo
            )`,
      { itemCode, lotNo },
    );

    await conn.execute(
      `UPDATE T_SHIKENPLUS
       SET    メーカ期限 = TO_DATE(:newDate, 'YYYY-MM-DD')
       WHERE  品目コード = :itemCode
         AND  ロットＮＯ  = :lotNo
         AND  メーカ期限 IS NOT NULL
         AND  試験回数 = (
                SELECT MAX(T2.試験回数)
                FROM   T_SHIKENPLUS T2
                WHERE  T2.品目コード = :itemCode
                  AND  T2.ロットＮＯ = :lotNo
              )`,
      { itemCode, lotNo, newDate },
    );

    await conn.execute(
      `INSERT INTO MCTEST1.W_TBL_UPDATE_HOKANKIGEN
         (UPDATE_DATE, MAILADDRESS, HINMO_CD, LOT_NO, OLD_HOKANKIGEN, NEW_HOKANKIGEN)
       VALUES
         (SYSDATE,
          :mailaddress,
          :itemCode,
          :lotNo,
          TO_DATE(:oldDate, 'YYYY-MM-DD'),
          TO_DATE(:newDate, 'YYYY-MM-DD'))`,
      { mailaddress, itemCode, lotNo, oldDate, newDate },
    );

    await conn.commit();
  } catch (err) {
    await conn.rollback();
    console.error("updateHokanKigen エラー:", err);
    throw err;
  } finally {
    await conn.close();
  }
}

// ════════════════════════════════════════════════════
// 総合判定取消
// ════════════════════════════════════════════════════

// ── 取消前の現在値を取得（確認モーダル・処理状況確認用） ──────
export async function getJudgmentStatus(itemCode: string, lotNo: string): Promise<{ shiken: string; judgmentDate: string; expiryDate: string } | null> {
  const conn = await getConnection();
  try {
    const result = await conn.execute(
      `SELECT
         試験区分,
         TO_CHAR(総合判定日, 'YYYY/MM/DD') AS 総合判定日,
         TO_CHAR(保管期限,   'YYYY/MM/DD') AS 保管期限
       FROM MCTEST1.T_SHIKEN
       WHERE 品目コード = :itemCode
         AND ロットＮＯ   = :lotNo
         AND 試験区分     = '9'
         AND 試験回数     = (
           SELECT MAX(T2.試験回数)
           FROM MCTEST1.T_SHIKEN T2
           WHERE T2.品目コード = :itemCode
             AND T2.ロットＮＯ = :lotNo
             AND T2.試験区分   = '9'
         )`,
      { itemCode, lotNo },
      { outFormat: oracledb.OUT_FORMAT_OBJECT },
    );

    const rows = result.rows as Record<string, unknown>[];
    if (!rows || rows.length === 0) return null;

    const row = rows[0];
    return {
      shiken: String(row["試験区分"] ?? "—"),
      judgmentDate: String(row["総合判定日"] ?? "—"),
      expiryDate: String(row["保管期限"] ?? "—"),
    };
  } finally {
    await conn.close();
  }
}

// ── 総合判定取消を実行 ────────────────────────────
export async function cancelJudgment(itemCode: string, lotNo: string, mail: string): Promise<void> {
  const conn = await getConnection();
  try {
    // ① 更新前に総合判定日を取得（ログ用）
    const selectResult = await conn.execute(
      `SELECT 総合判定日
       FROM MCTEST1.T_SHIKEN
       WHERE 品目コード = :itemCode
         AND ロットＮＯ   = :lotNo
         AND 試験区分     = '9'
         AND 試験回数     = (
           SELECT MAX(T2.試験回数)
           FROM MCTEST1.T_SHIKEN T2
           WHERE T2.品目コード = :itemCode
             AND T2.ロットＮＯ = :lotNo
             AND T2.試験区分   = '9'
         )`,
      { itemCode, lotNo },
      { outFormat: oracledb.OUT_FORMAT_OBJECT },
    );

    const rows = selectResult.rows as Record<string, unknown>[];
    if (!rows || rows.length === 0) {
      throw new Error("該当データが見つかりません");
    }
    const shanteiDate = rows[0]["総合判定日"] ?? null;

    // ② T_SHIKEN 更新
    await conn.execute(
      `UPDATE MCTEST1.T_SHIKEN SET
         試験区分         = '5',
         総合判定日       = NULL,
         判定者コード     = NULL,
         判定者部門コード = NULL,
         判定者正副フラグ = NULL,
         判定結果区分     = NULL,
         保証期限         = NULL,
         保管期限         = NULL
       WHERE 品目コード = :itemCode
         AND ロットＮＯ   = :lotNo
         AND 試験区分     = '9'
         AND 試験回数     = (
           SELECT MAX(T2.試験回数)
           FROM MCTEST1.T_SHIKEN T2
           WHERE T2.品目コード = :itemCode
             AND T2.ロットＮＯ = :lotNo
             AND T2.試験区分   = '9'
         )`,
      { itemCode, lotNo },
    );

    // ③ 取消ログ挿入
    await conn.execute(
      `INSERT INTO MCTEST1.W_TBL_CANCEL_SHANTEI
         (HINMO_CD, LOT_NO, SHANTEI_DATE, MAILADDRESS, CANCEL_DATE)
       VALUES
         (:itemCode, :lotNo, :shanteiDate, :mail, SYSDATE)`,
      { itemCode, lotNo, shanteiDate, mail },
    );

    await conn.commit();
  } catch (err) {
    await conn.rollback();
    console.error("cancelJudgment エラー:", err);
    throw err;
  } finally {
    await conn.close();
  }
}

// ── 試験区分を取得（処理状況確認用・取消後も検索できるよう試験区分の絞り込みなし） ──
export async function getJudgmentStatusForCheck(itemCode: string, lotNo: string): Promise<{ shiken: string; judgmentDate: string } | null> {
  const conn = await getConnection();
  try {
    const result = await conn.execute(
      `SELECT
         試験区分,
         TO_CHAR(総合判定日, 'YYYY/MM/DD') AS 総合判定日
       FROM MCTEST1.T_SHIKEN
       WHERE 品目コード = :itemCode
         AND ロットＮＯ   = :lotNo
         AND 試験回数     = (
           SELECT MAX(T2.試験回数)
           FROM MCTEST1.T_SHIKEN T2
           WHERE T2.品目コード = :itemCode
             AND T2.ロットＮＯ = :lotNo
         )`,
      { itemCode, lotNo },
      { outFormat: oracledb.OUT_FORMAT_OBJECT },
    );

    const rows = result.rows as Record<string, unknown>[];
    if (!rows || rows.length === 0) return null;

    const row = rows[0];
    return {
      shiken: String(row["試験区分"] ?? "—"),
      judgmentDate: String(row["総合判定日"] ?? "—"),
    };
  } finally {
    await conn.close();
  }
}

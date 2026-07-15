// lib/db.ts
import oracledb from "oracledb";
import { writeErrorLog } from "@/lib/logger";

oracledb.initOracleClient({
  libDir: process.env.ORACLE_CLIENT_PATH,
});

const DB_CONFIG: oracledb.ConnectionAttributes = {
  user: process.env.ORACLE_USER,
  password: process.env.ORACLE_PASSWORD,
  connectString: process.env.ORACLE_CONN_STRING,
};

// コピー元（マスタ登録環境）とコピー先（本番環境）のスキーマ
const SRC_SCHEMA = process.env.ORACLE_SRC_SCHEMA ?? "MCFP"; // CHECK_MASTER_HIN / DEL_INS_HIN のコピー元
const DST_SCHEMA = process.env.ORACLE_DST_SCHEMA ?? "MCFR"; // DEL_INS_HIN のコピー先

export async function getConnection(): Promise<oracledb.Connection> {
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
export async function deleteAccountUnlock(accountCode: string, conn?: oracledb.Connection): Promise<void> {
  const connection = conn ?? (await getConnection());
  try {
    await connection.execute(`DELETE FROM T_LOGIN WHERE USER_ID = :accountCode`, { accountCode });
    if (!conn) {
      await connection.commit();
    }
  } finally {
    if (!conn) {
      await connection.close();
    }
  }
}

// W_TBL_UNLOCK にロック解除記録をINSERTする
export async function insertUnlockRecord(accountCode: string, mailaddress: string, conn?: oracledb.Connection): Promise<void> {
  const connection = conn ?? (await getConnection());
  try {
    await connection.execute(
      `INSERT INTO MCTEST1.W_TBL_UNLOCK (UNLOCK_DATE, USER_ID, MAILADDRESS)
       VALUES (SYSDATE, :accountCode, :mailaddress)`,
      { accountCode, mailaddress },
    );
    if (!conn) {
      await connection.commit();
    }
  } finally {
    if (!conn) {
      await connection.close();
    }
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
         T1.試験回数          AS "inspectCnt",
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
      `SELECT TO_CHAR(保管期限, 'YYYY-MM-DD') AS "oldDate",
            試験回数 AS "inspectCnt"
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
    const oldRows = (oldResult.rows as { oldDate: string | null; inspectCnt: number }[]) ?? [];
    console.log("① SELECT結果:", oldRows);
    if (oldRows.length === 0) {
      throw new Error("指定された品目コードとロットＮＯに該当するデータが見つかりません");
    }
    const oldDate = oldRows[0].oldDate;
    const inspectCnt = Number(oldRows[0].inspectCnt);

    if (Number.isNaN(inspectCnt)) {
      throw new Error("試験回数の取得に失敗しました（SELECT結果にinspectCntが含まれていません）");
    }

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

    try {
      await conn.execute(
        `INSERT INTO MCTEST1.W_TBL_UPDATE_HOKANKIGEN
          (HINMO_CD, LOT_NO, INSPECT_CNT, NEW_HOKANKIGEN, OLD_HOKANKIGEN, UPDATE_DATE, MAILADDRESS)
        VALUES
          (:itemCode,
            :lotNo,
            :inspectCnt,
            TO_DATE(:newDate, 'YYYY-MM-DD'),
            TO_DATE(:oldDate, 'YYYY-MM-DD'),
            SYSDATE,
            :mailaddress)`,
        { itemCode, lotNo, inspectCnt, newDate, oldDate, mailaddress },
      );
    } catch (err) {
      // 主キーが (HINMO_CD, LOT_NO, INSPECT_CNT, NEW_HOKANKIGEN) のため、
      // まったく同じ内容の申請が2回目に来ると ORA-00001 になる
      if ((err as { errorNum?: number }).errorNum === 1) {
        throw new Error("同じ品目・ロット・試験回数・新保管期限の更新記録が既に存在します（重複申請）");
      }
      throw err;
    }

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

// ════════════════════════════════════════════════════
// マスタアップ申請
// ════════════════════════════════════════════════════

export async function checkMasterHin(itemCode: string): Promise<{ itemCode: string; itemName: string } | null> {
  const conn = await getConnection();
  const sql = `SELECT 品目コード AS "itemCode", 品名 AS "itemName"
  FROM ${SRC_SCHEMA}.M_HINMO
  WHERE 品目コード = :itemCode
  FOR UPDATE NOWAIT`;
  try {
    const result = await conn.execute(sql, { itemCode }, { outFormat: oracledb.OUT_FORMAT_OBJECT });
    const rows = result.rows as { itemCode: string; itemName: string }[];
    return rows.length > 0 ? rows[0] : null;
  } catch (err) {
    writeErrorLog({ func: "checkMasterHin", itemCode, sql, err });
    throw err;
  } finally {
    await conn.close();
  }
}

/**
 * COPY_MASTER_HIN.SQL + DEL_INS_HIN.SQL / DEL_INS_HIN_OYA.SQL 相当
 * マスタ登録環境(SRC_SCHEMA)から本番環境(DST_SCHEMA)へ
 * 品目系マスタを全テーブル一括コピーする（1トランザクション）
 */
export async function copyMasterHin(itemCode: string): Promise<void> {
  const conn = await getConnection();

  // DEL_INS_HIN.SQL 相当テーブル（品目コード列で絞り込み）
  const hinTables = [
    "AM_HINBAN",
    "AM_HINBANZK",
    "AM_HINMOSKT",
    "AM_HSYUKOTB",
    "AM_HSYUKOTBR",
    "IM_FILENAME",
    "M_HINMO",
    "M_HINMOHB",
    "M_HINMOHK",
    "M_HINMOHKR",
    "M_HINMOK",
    "M_HINMOKB",
    "M_HINMOKBR",
    "M_HINMOKR",
    "M_HINMOR",
    "M_HINMOS",
    "M_HINMOSK",
    "M_HINMOSKR",
    "M_HINMOSR",
    "M_HINMOYKJ",
    "M_HINMOYKJR",
    "M_HINMOZK",
    "M_HINMOZKR",
    "M_HMAKER",
    "M_HMAKERR",
    "M_HTANKA",
    "M_NEBIKI",
    "M_ROUTE",
    "M_ROUTER",
    "M_SKTANKA",
    "M_STANKA",
    "M_TOKUIH",
  ];

  // DEL_INS_HIN_OYA.SQL 相当テーブル（BOM親テーブル）
  const oyaTables = ["AM_GBOM", "AM_GBOMR", "M_BOM", "M_BOMR"];

  try {
    // 通常テーブル: DST_SCHEMAの既存レコードを削除→SRC_SCHEMAからコピー
    for (const table of hinTables) {
      // 実行するSQL文を変数に入れてからexecute・ログ両方で使い回す
      const deleteSql = `DELETE FROM ${DST_SCHEMA}.${table} WHERE 品目コード = :itemCode`;
      const insertSql = `INSERT INTO ${DST_SCHEMA}.${table} SELECT * FROM ${SRC_SCHEMA}.${table} WHERE 品目コード = :itemCode`;

      try {
        await conn.execute(deleteSql, { itemCode });
      } catch (err) {
        writeErrorLog({ func: "copyMasterHin", table, itemCode, sql: deleteSql, err });
        throw err;
      }

      try {
        await conn.execute(insertSql, { itemCode });
      } catch (err) {
        writeErrorLog({ func: "copyMasterHin", table, itemCode, sql: insertSql, err });
        throw err;
      }
    }

    // BOM親テーブル: 同上
    for (const table of oyaTables) {
      // 実行するSQL文を変数に入れてからexecute・ログ両方で使い回す
      const deleteSql = `DELETE FROM ${DST_SCHEMA}.${table} WHERE 親品目コード = :itemCode`;
      const insertSql = `INSERT INTO ${DST_SCHEMA}.${table} SELECT * FROM ${SRC_SCHEMA}.${table} WHERE 親品目コード = :itemCode`;

      try {
        await conn.execute(deleteSql, { itemCode });
      } catch (err) {
        writeErrorLog({ func: "copyMasterHin", table, itemCode, sql: deleteSql, err });
        throw err;
      }

      try {
        await conn.execute(insertSql, { itemCode });
      } catch (err) {
        writeErrorLog({ func: "copyMasterHin", table, itemCode, sql: insertSql, err });
        throw err;
      }
    }

    // 全テーブルの処理が成功してから1回だけコミット
    await conn.commit();
  } catch (err) {
    // ❌ どこかで失敗したら全テーブルの変更を巻き戻す
    await conn.rollback();
    writeErrorLog({ func: "copyMasterHin", itemCode, err });
    throw err;
  } finally {
    // 成功・失敗どちらでも必ずDB接続を閉じる
    await conn.close();
  }
}

/** 申請ログをW_TBL_MASTER_UP_REQに保存する */
export async function saveMasterUpRequest(itemCd: string, mailaddress: string): Promise<void> {
  const conn = await getConnection();
  const sql = `INSERT INTO MCTEST1.W_TBL_MASTER_UP_REQ (HINMO_CD, MAILADDRESS) VALUES (:itemCd, :mailaddress)`;
  try {
    await conn.execute(sql, { itemCd, mailaddress });
    await conn.commit();
  } catch (err) {
    await conn.rollback();
    writeErrorLog({ func: "saveMasterUpRequest", itemCode: itemCd, sql, err });
    throw err;
  } finally {
    await conn.close();
  }
}

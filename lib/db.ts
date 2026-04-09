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
    // MC_INQUIRY_NO はシーケンスから自動採番
    // ★ シーケンス名が違う場合はここを修正してください
    // RETURNING でINSERT後に採番されたIDを取得する
    const result = await conn.execute(
      `INSERT INTO MCTEST1.W_TBL_INQUIRY_RECORD
        (MC_INQUIRY_NO, INQUIRY_NAME, BUSYO, MAILADDRESS, TITLE,
         URGENCY, URGENT_REASON, URGENT_APPROVAL,
         HOWTO_OPEN_SCREEN, BACKGROUND, REQ_ACTION)
       VALUES
        (MCTEST1.MC_INQUIRY_NO.NEXTVAL,
         :inquiry_name, :busyo, :mailaddress, :title,
         :urgency, :urgentReason, :urgentApproval,
         :howtoOpenScreen, :background, :reqAction)
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
        // RETURNING で受け取る変数（出力専用）
        insertedId: { dir: oracledb.BIND_OUT, type: oracledb.NUMBER },
      },
    );
    await conn.commit();

    // 採番されたIDを返す
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
         CASE WHEN CLOSED_DATE IS NOT NULL
              THEN '完了' ELSE '未対応'
         END                                          AS "status"
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

// ── 保管期限を検索する（SELECT_HOKAN_KIGEN.sql に相当） ──
export async function getHokanKigen(itemCode: string, lotNo: string) {
  const conn = await getConnection();
  try {
    const result = await conn.execute(
      // ポイント: SQL*Plusの &1 &2 → oracledbでは :変数名 に変換
      // 同じ変数名を複数箇所で使ってもOK（バインド値は1つ渡すだけ）
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
    // 見つからなければ null を返す
    return rows.length > 0 ? (rows[0] as Record<string, string>) : null;
  } finally {
    await conn.close();
  }
}

// ── 保管期限を更新する（UPDATE_HOKAN_KIGEN.sql に相当） ──
export async function updateHokanKigen(
  itemCode: string,
  lotNo: string,
  newDate: string, // "YYYY-MM-DD" 形式で受け取る
): Promise<void> {
  const conn = await getConnection();
  try {
    // ① T_SHIKEN の保管期限を更新
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

    // ② T_SHIKENR に履歴INSERT（更新レコードをそのままコピー）
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

    // ③ T_SHIKENPLUS の保管期限を更新
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

    // ④ T_SHIKENPLUSR に履歴INSERT
    await conn.execute(
      `INSERT INTO T_SHIKENPLUSR (
         品目コード,ロットＮＯ,試験回数,メーカコード,メーカ期限,使用期限,保管期限,
         現品含量,予定数量,登録日時,登録担当者コード,更新カウンタ,更新日時,更新担当者コード,
         情報ＩＤ,履歴生成日時,履歴ＮＯ,履歴シーケンス,履歴画面ＩＤ,変更区分,変更担当者コード
       )
       SELECT
         品目コード,ロットＮＯ,試験回数,メーカコード,メーカ期限,使用期限,保管期限,
         現品含量,予定数量,登録日時,登録担当者コード,更新カウンタ,更新日時,更新担当者コード,
         'T_SHIKENPLUS', SYSDATE, '0', '0', 'Tool', 'U', 'Tool'
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

    // ⑤ メーカ期限も更新（NULLでない行だけ）
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

    // 全ステートメント成功したらまとめてCOMMIT
    await conn.commit();
  } catch (err) {
    // 1つでも失敗したらROLLBACK（元の状態に戻す）
    await conn.rollback();
    throw err;
  } finally {
    await conn.close();
  }
}

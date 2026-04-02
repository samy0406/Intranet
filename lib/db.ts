// ================================================
// データベース操作ユーティリティ（Oracle版）
// ※ TODO コメントの箇所を実際のテーブル名・カラム名に変更してください
// ================================================
import oracledb from "oracledb";

// ── Thick モード（Oracle Instant Client）の初期化 ──
oracledb.initOracleClient({
  libDir: process.env.ORACLE_CLIENT_PATH,
});

// ── 接続設定 ──────────────────────────────────────
const DB_CONFIG: oracledb.ConnectionAttributes = {
  user:          process.env.ORACLE_USER,
  password:      process.env.ORACLE_PASSWORD,
  connectString: process.env.ORACLE_CONN_STRING,
};

async function getConnection(): Promise<oracledb.Connection> {
  return await oracledb.getConnection(DB_CONFIG);
}

// ================================================
// 問い合わせ
// ================================================

const TABLE_INQUIRY = "INQUIRIES"; // TODO: テーブル名を変更

export type InquiryRecord = {
  name:          string;
  department:    string;
  mail:          string;
  title:         string;
  urgency:       string;
  urgencyReason: string;
  approver:      string;
  screenPath:    string;
  message:       string;
  resolution:    string;
  filename:      string | null;
  screenshot:    string | null;
};

export async function saveInquiry(data: InquiryRecord): Promise<void> {
  const conn = await getConnection();
  try {
    await conn.execute(
      // TODO: カラム名を変更
      `INSERT INTO ${TABLE_INQUIRY} (
        NAME, DEPARTMENT, MAIL, TITLE, URGENCY,
        URGENCY_REASON, APPROVER, SCREEN_PATH,
        MESSAGE, RESOLUTION, FILENAME, SCREENSHOT
      ) VALUES (
        :name, :department, :mail, :title, :urgency,
        :urgencyReason, :approver, :screenPath,
        :message, :resolution, :filename, :screenshot
      )`,
      {
        name:          data.name,
        department:    data.department,
        mail:          data.mail,
        title:         data.title,
        urgency:       data.urgency,
        urgencyReason: data.urgencyReason,
        approver:      data.approver,
        screenPath:    data.screenPath,
        message:       data.message,
        resolution:    data.resolution,
        filename:      data.filename,
        screenshot:    data.screenshot,
      }
    );
    await conn.commit();
  } finally {
    await conn.close();
  }
}

// ================================================
// アカウントロック解除
// ================================================

const TABLE_ACCOUNT_UNLOCK = "ACCOUNT_UNLOCK"; // TODO: テーブル名を変更

export type AccountUnlockRecord = {
  department:  string;
  name:        string;
  mail:        string;
  accountCode: string;
};

export async function saveAccountUnlock(data: AccountUnlockRecord): Promise<void> {
  const conn = await getConnection();
  try {
    await conn.execute(
      // TODO: カラム名を変更
      `INSERT INTO ${TABLE_ACCOUNT_UNLOCK} (
        DEPARTMENT, NAME, MAIL, ACCOUNT_CODE
      ) VALUES (
        :department, :name, :mail, :accountCode
      )`,
      {
        department:  data.department,
        name:        data.name,
        mail:        data.mail,
        accountCode: data.accountCode,
      }
    );
    await conn.commit();
  } finally {
    await conn.close();
  }
}

// アカウントコードで検索（処理状況確認用）
// true = 申請レコードあり（処理中）、false = なし（ログイン可能）
export async function findAccountUnlock(accountCode: string): Promise<boolean> {
  const conn = await getConnection();
  try {
    const result = await conn.execute(
      // TODO: カラム名を変更
      `SELECT COUNT(*) AS CNT
       FROM ${TABLE_ACCOUNT_UNLOCK}
       WHERE ACCOUNT_CODE = :accountCode`,
      { accountCode },
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );
    const rows = result.rows as { CNT: number }[];
    return rows[0].CNT > 0;
  } finally {
    await conn.close();
  }
}

// ================================================
// 保管期限延長
// ================================================

const TABLE_STORAGE_HEADER = "STORAGE_EXTENSION";       // TODO: テーブル名を変更
const TABLE_STORAGE_ITEMS  = "STORAGE_EXTENSION_ITEMS"; // TODO: テーブル名を変更

export type StorageExtensionRecord = {
  department: string;
  name:       string;
  items: {
    itemCode:   string;
    lotNo:      string;
    expiryDate: string;
  }[];
};

export async function saveStorageExtension(data: StorageExtensionRecord): Promise<void> {
  const conn = await getConnection();
  try {
    // ── 親レコード（ヘッダー）を保存してIDを取得 ──
    // TODO: カラム名を変更
    const headerResult = await conn.execute(
      `INSERT INTO ${TABLE_STORAGE_HEADER} (DEPARTMENT, NAME)
       VALUES (:department, :name)
       RETURNING ID INTO :id`,
      {
        department: data.department,
        name:       data.name,
        id:         { dir: oracledb.BIND_OUT, type: oracledb.NUMBER },
      }
    );
    const headerId = (headerResult.outBinds as { id: number[] }).id[0];

    // ── 品目を1行ずつ保存 ──────────────────────────
    for (const item of data.items) {
      // TODO: カラム名を変更
      await conn.execute(
        `INSERT INTO ${TABLE_STORAGE_ITEMS} (
          HEADER_ID, ITEM_CODE, LOT_NO, EXPIRY_DATE
        ) VALUES (
          :headerId, :itemCode, :lotNo, :expiryDate
        )`,
        {
          headerId:   headerId,
          itemCode:   item.itemCode,
          lotNo:      item.lotNo,
          expiryDate: item.expiryDate,
        }
      );
    }
    await conn.commit();
  } finally {
    await conn.close();
  }
}

// 品目コード・ロットNOで検索（処理状況確認用）
export type StorageItemResult = {
  itemCode:   string;
  lotNo:      string;
  expiryDate: string;
};

export async function findStorageItems(
  itemCode: string,
  lotNo:    string
): Promise<StorageItemResult[]> {
  const conn = await getConnection();
  try {
    // TODO: カラム名・テーブル名を変更
    const result = await conn.execute(
      `SELECT ITEM_CODE, LOT_NO, EXPIRY_DATE
       FROM ${TABLE_STORAGE_ITEMS}
       WHERE ITEM_CODE = :itemCode
         AND LOT_NO    = :lotNo`,
      { itemCode, lotNo },
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );
    const rows = result.rows as { ITEM_CODE: string; LOT_NO: string; EXPIRY_DATE: string }[];
    return rows.map((row) => ({
      itemCode:   row.ITEM_CODE,
      lotNo:      row.LOT_NO,
      expiryDate: row.EXPIRY_DATE,
    }));
  } finally {
    await conn.close();
  }
}

// ================================================
// 総合判定取消
// ================================================

const TABLE_JUDGMENT_CANCEL = "JUDGMENT_CANCEL"; // TODO: テーブル名を変更

export type JudgmentCancelRecord = {
  department: string;
  name:       string;
  mail:       string;
  itemCode:   string;
  lotNo:      string;
  screenshot: string | null;
};

export async function saveJudgmentCancel(data: JudgmentCancelRecord): Promise<void> {
  const conn = await getConnection();
  try {
    // TODO: カラム名を変更
    await conn.execute(
      `INSERT INTO ${TABLE_JUDGMENT_CANCEL} (
        DEPARTMENT, NAME, MAIL, ITEM_CODE, LOT_NO, SCREENSHOT
      ) VALUES (
        :department, :name, :mail, :itemCode, :lotNo, :screenshot
      )`,
      {
        department: data.department,
        name:       data.name,
        mail:       data.mail,
        itemCode:   data.itemCode,
        lotNo:      data.lotNo,
        screenshot: data.screenshot,
      }
    );
    await conn.commit();
  } finally {
    await conn.close();
  }
}

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

// 処理状況確認用：コードが存在するかチェック
// true  = T_LOGIN に存在する（ロック中・ログイン不可）
// false = T_LOGIN に存在しない（ログイン可能）
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

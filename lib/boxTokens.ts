import oracledb from "oracledb";
import { getConnection } from "@/lib/db";

interface TokenData {
  access_token: string;
  refresh_token: string;
  expires_at: number;
}

// ① DBにトークンを保存
export async function saveTokensToDB(tokens: TokenData): Promise<void> {
  const conn = await getConnection();
  try {
    await conn.execute(
      `UPDATE BOX_TOKENS_SAVE SET
        ACCESS_TOKEN  = :access_token,
        REFRESH_TOKEN = :refresh_token,
        EXPIRES_AT    = :expires_at,
        UPDATED_AT    = SYSTIMESTAMP
       WHERE BOX_TID = 1`,
      {
        access_token: tokens.access_token,
        refresh_token: tokens.refresh_token,
        expires_at: tokens.expires_at,
      },
    );
    await conn.commit();
  } finally {
    await conn.close();
  }
}

// ② 有効なAccess Tokenを取得（期限切れなら自動更新）
export async function getValidAccessToken(): Promise<string> {
  const conn = await getConnection();
  try {
    // SELECT FOR UPDATE で排他ロック取得
    const result = await conn.execute(
      `SELECT ACCESS_TOKEN, REFRESH_TOKEN, EXPIRES_AT
       FROM BOX_TOKENS_SAVE
       WHERE BOX_TID = 1
       FOR UPDATE`,
      {},
      { outFormat: oracledb.OUT_FORMAT_OBJECT },
    );

    const row = (result.rows as any[])[0];
    const fiveMinutes = 5 * 60 * 1000;
    const isExpiringSoon = Date.now() > row.EXPIRES_AT - fiveMinutes;

    if (!isExpiringSoon) {
      // まだ有効なのでそのまま返す
      await conn.commit(); // ロック解放
      return row.ACCESS_TOKEN;
    }

    // 期限切れ間近 → Refresh Tokenで更新
    const response = await fetch("https://api.box.com/oauth2/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        grant_type: "refresh_token",
        refresh_token: row.REFRESH_TOKEN,
        client_id: process.env.BOX_CLIENT_ID!,
        client_secret: process.env.BOX_CLIENT_SECRET!,
      }),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      throw new Error(`Boxトークン更新失敗: ${errorBody}`);
    }

    const data = await response.json();

    // 新しいトークンをDBに上書き保存
    await conn.execute(
      `UPDATE BOX_TOKENS_SAVE SET
        ACCESS_TOKEN  = :access_token,
        REFRESH_TOKEN = :refresh_token,
        EXPIRES_AT    = :expires_at,
        UPDATED_AT    = SYSTIMESTAMP
       WHERE BOX_TID = 1`,
      {
        access_token: data.access_token,
        refresh_token: data.refresh_token,
        expires_at: Date.now() + data.expires_in * 1000,
      },
    );
    await conn.commit(); // ロック解放 + 保存確定

    return data.access_token;
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    await conn.close();
  }
}

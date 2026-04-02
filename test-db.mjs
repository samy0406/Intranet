// test-db.mjs
import oracledb from "oracledb";
import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

// ── Thick モードを有効化 ──────────────────────────
// Oracle Instant Client のパスを指定
oracledb.initOracleClient({
  libDir: "C:/Oracle/instantclient_21_9/bin", // ← フォルダのパス
});

try {
  const conn = await oracledb.getConnection({
    user: process.env.ORACLE_USER,
    password: process.env.ORACLE_PASSWORD,
    connectString: process.env.ORACLE_CONN_STRING,
  });
  console.log("✅ DB接続成功！");
  await conn.close();
} catch (err) {
  console.error("❌ DB接続失敗:", err.message);
}

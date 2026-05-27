// lib/logger.ts
import fs from "fs";
import path from "path";

const LOG_DIR = process.env.LOG_DIR ?? "logs";

/**
 * エラーログをファイルに追記する
 * 出力形式:
 * [2024/01/23 12:34:56] [ERROR] copyMasterHin | テーブル: M_HINMO | 品目コード: 12345
 *   ORA-00942: table or view does not exist
 */
export function writeErrorLog(params: {
  func: string; // どの関数でエラーが起きたか
  table?: string; // どのテーブルでエラーが起きたか
  itemCode?: string; // 対象の品目コード
  sql?: string; // 実行したSQL
  err: unknown; // エラーオブジェクト
}): void {
  try {
    // ログフォルダがなければ自動作成
    if (!fs.existsSync(LOG_DIR)) {
      fs.mkdirSync(LOG_DIR, { recursive: true });
    }

    const now = new Date();
    const timestamp = now
      .toLocaleString("ja-JP", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: false,
      })
      .replace(/\//g, "/");

    // ログファイル名は日付単位（例: 2024-01-23.log）
    const fileName = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}.log`;
    const filePath = path.join(LOG_DIR, fileName);

    // ログ本文の組み立て
    const tableInfo = params.table ? ` | テーブル: ${params.table}` : "";
    const codeInfo = params.itemCode ? ` | 品目コード: ${params.itemCode}` : "";
    const errMsg = params.err instanceof Error ? params.err.message : String(params.err);

    const sqlInfo = params.sql ? `\n  SQL: ${params.sql.trim().replace(/\n/g, "\n       ")}` : "";

    const line = `[${timestamp}] [ERROR] ${params.func}${tableInfo}${codeInfo}\n  エラー: ${errMsg}${sqlInfo}\n`;

    // ファイルに追記（なければ新規作成）
    fs.appendFileSync(filePath, line, "utf-8");
  } catch (logErr) {
    // ログ出力自体が失敗してもアプリを止めない
    console.error("ログ出力に失敗しました:", logErr);
  }
}

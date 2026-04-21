import { NextResponse } from "next/server";

export async function GET() {
  // BoxのログインURLを組み立てる
  const authUrl = `https://account.box.com/api/oauth2/authorize` + `?client_id=${process.env.BOX_CLIENT_ID}` + `&redirect_uri=${process.env.BOX_REDIRECT_URI}` + `&response_type=code`;

  // Boxのログイン画面にリダイレクト
  return NextResponse.redirect(authUrl);
}

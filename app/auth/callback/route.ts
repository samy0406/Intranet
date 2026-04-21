// app\auth\callback\route.ts
import { NextRequest, NextResponse } from "next/server";
import { saveTokensToDB } from "@/lib/boxTokens";

export async function GET(req: NextRequest) {
  try {
    // ① URLから認可コードを取り出す
    // 例：http://localhost:3000/auth/callback?code=abc123
    const code = req.nextUrl.searchParams.get("code");

    if (!code) {
      return NextResponse.json({ error: "認可コードがありません" }, { status: 400 });
    }

    // ② 認可コードをAccess Token + Refresh Tokenに交換
    const response = await fetch("https://api.box.com/oauth2/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        grant_type: "authorization_code",
        code: code,
        client_id: process.env.BOX_CLIENT_ID!,
        client_secret: process.env.BOX_CLIENT_SECRET!,
        redirect_uri: process.env.BOX_REDIRECT_URI!,
      }),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      console.error("Boxトークン取得エラー：", errorBody);
      return NextResponse.json({ error: "トークン取得に失敗しました" }, { status: 500 });
    }

    const data = await response.json();

    // ③ 取得したトークンをDBに保存
    await saveTokensToDB({
      access_token: data.access_token,
      refresh_token: data.refresh_token,
      expires_at: Date.now() + data.expires_in * 1000,
    });

    return NextResponse.json({ message: "認証完了！トークンを保存しました" });
  } catch (err) {
    console.error("認証エラー：", err);
    return NextResponse.json({ error: "認証に失敗しました" }, { status: 500 });
  }
}

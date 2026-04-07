import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  const { password } = await request.json();

  if (password !== process.env.ADMIN_PASSWORD) {
    return NextResponse.json({ message: "パスワードが違います" }, { status: 401 });
  }

  const res = NextResponse.json({ status: "ok" });

  // Cookie にセッションを保存（有効期限8時間）
  res.cookies.set("admin_session", process.env.SESSION_SECRET!, {
    httpOnly: true, // JavaScriptからアクセス不可（セキュリティ対策）
    maxAge: 60 * 60 * 8, // 8時間
    path: "/",
    sameSite: "lax",
  });

  return res;
}

import { NextRequest, NextResponse } from "next/server";

export function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;

  // ログインページ自体は認証不要
  if (path === "/admin/login") {
    return NextResponse.next();
  }

  // /admin 以下だけ認証をかける
  if (path.startsWith("/admin")) {
    const session = request.cookies.get("admin_session")?.value;

    // Cookie が正しくなければログインページへ
    if (session !== process.env.SESSION_SECRET) {
      return NextResponse.redirect(new URL("/admin/login", request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*"],
};

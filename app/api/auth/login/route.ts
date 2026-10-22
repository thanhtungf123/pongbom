import { NextResponse } from "next/server";
import { checkCredentials, sessionToken, SESSION_COOKIE } from "@/lib/auth";

export async function POST(req: Request) {
  const { username, password } = await req.json().catch(() => ({}));
  if (!checkCredentials(username, password)) {
    return NextResponse.json(
      { ok: false, error: "Sai tài khoản hoặc mật khẩu" },
      { status: 401 }
    );
  }
  const res = NextResponse.json({ ok: true });
  res.cookies.set(SESSION_COOKIE, sessionToken(), {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });
  return res;
}

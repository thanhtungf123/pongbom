import { cookies } from "next/headers";

export const SESSION_COOKIE = "pb_session";

const ADMIN_USER = process.env.ADMIN_USER || "admin";
const ADMIN_PASS = process.env.ADMIN_PASS || "admin123";
const SECRET = process.env.ADMIN_SECRET || "pongbom-admin-session-token";

export function checkCredentials(username: string, password: string): boolean {
  return username === ADMIN_USER && password === ADMIN_PASS;
}

export function sessionToken(): string {
  return SECRET;
}

/** Kiểm tra request hiện tại có phải admin đã đăng nhập. */
export async function isAuthed(): Promise<boolean> {
  const store = await cookies();
  return store.get(SESSION_COOKIE)?.value === SECRET;
}

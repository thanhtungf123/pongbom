import { NextResponse } from "next/server";
import { isAuthed } from "@/lib/auth";
import { getStats } from "@/lib/store";

export async function GET() {
  if (!(await isAuthed()))
    return NextResponse.json({ error: "Chưa đăng nhập" }, { status: 401 });
  return NextResponse.json({ stats: await getStats() });
}

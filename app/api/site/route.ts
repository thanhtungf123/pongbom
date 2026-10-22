import { NextResponse } from "next/server";
import { isAuthed } from "@/lib/auth";
import { getSite, saveSite } from "@/lib/store";
import type { SiteSettings } from "@/lib/types";

export async function GET() {
  return NextResponse.json({ site: await getSite() });
}

export async function PUT(req: Request) {
  if (!(await isAuthed()))
    return NextResponse.json({ error: "Chưa đăng nhập" }, { status: 401 });
  const site = (await req.json()) as SiteSettings;
  await saveSite(site);
  return NextResponse.json({ ok: true });
}

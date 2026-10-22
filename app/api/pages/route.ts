import { NextResponse } from "next/server";
import { isAuthed } from "@/lib/auth";
import { getPages, getPage, upsertPage, reorderPages } from "@/lib/store";
import type { Page } from "@/lib/types";

export async function GET() {
  return NextResponse.json({ pages: await getPages() });
}

export async function POST(req: Request) {
  if (!(await isAuthed()))
    return NextResponse.json({ error: "Chưa đăng nhập" }, { status: 401 });
  const body = await req.json();

  // Cập nhật thứ tự hàng loạt: { reorder: [slug1, slug2, ...] }
  if (Array.isArray(body?.reorder)) {
    await reorderPages(body.reorder);
    return NextResponse.json({ ok: true });
  }

  const page = body as Page;
  if (!page.slug)
    return NextResponse.json({ error: "Thiếu slug" }, { status: 400 });
  if (await getPage(page.slug))
    return NextResponse.json({ error: "Slug đã tồn tại" }, { status: 409 });
  await upsertPage(page);
  return NextResponse.json({ ok: true, page });
}

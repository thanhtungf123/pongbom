import { NextResponse } from "next/server";
import { isAuthed } from "@/lib/auth";
import { deletePage, getPage, upsertPage } from "@/lib/store";
import type { Page } from "@/lib/types";

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  if (!(await isAuthed()))
    return NextResponse.json({ error: "Chưa đăng nhập" }, { status: 401 });
  const { slug } = await params;
  if (!(await getPage(slug)))
    return NextResponse.json({ error: "Không tìm thấy trang" }, { status: 404 });
  const page = (await req.json()) as Page;
  const newSlug = page.slug?.trim();
  if (newSlug && newSlug !== slug) {
    if (await getPage(newSlug))
      return NextResponse.json({ error: "Slug mới đã tồn tại" }, { status: 409 });
    await upsertPage({ ...page, slug: newSlug });
    await deletePage(slug);
  } else {
    await upsertPage({ ...page, slug });
  }
  return NextResponse.json({ ok: true });
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  if (!(await isAuthed()))
    return NextResponse.json({ error: "Chưa đăng nhập" }, { status: 401 });
  const { slug } = await params;
  await deletePage(slug);
  return NextResponse.json({ ok: true });
}

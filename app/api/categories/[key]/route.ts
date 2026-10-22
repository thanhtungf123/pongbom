import { NextResponse } from "next/server";
import { isAuthed } from "@/lib/auth";
import { deleteCategory, upsertCategory } from "@/lib/store";
import type { Category } from "@/lib/types";

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ key: string }> }
) {
  if (!(await isAuthed()))
    return NextResponse.json({ error: "Chưa đăng nhập" }, { status: 401 });
  const { key } = await params;
  const cat = (await req.json()) as Category;
  await upsertCategory({ ...cat, key });
  return NextResponse.json({ ok: true });
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ key: string }> }
) {
  if (!(await isAuthed()))
    return NextResponse.json({ error: "Chưa đăng nhập" }, { status: 401 });
  const { key } = await params;
  await deleteCategory(key);
  return NextResponse.json({ ok: true });
}

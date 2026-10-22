import { NextResponse } from "next/server";
import { isAuthed } from "@/lib/auth";
import { getCategories, upsertCategory, reorderCategories } from "@/lib/store";
import type { Category } from "@/lib/types";

export async function GET() {
  return NextResponse.json({ categories: await getCategories() });
}

export async function POST(req: Request) {
  if (!(await isAuthed()))
    return NextResponse.json({ error: "Chưa đăng nhập" }, { status: 401 });
  const body = await req.json();
  if (Array.isArray(body?.reorder)) {
    await reorderCategories(body.reorder);
    return NextResponse.json({ ok: true });
  }
  const cat = body as Category;
  if (!cat.key || !cat.label)
    return NextResponse.json({ error: "Thiếu tên category" }, { status: 400 });
  await upsertCategory(cat);
  return NextResponse.json({ ok: true });
}

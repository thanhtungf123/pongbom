import { NextResponse } from "next/server";
import { isAuthed } from "@/lib/auth";
import { deleteGame, getGame, upsertGame } from "@/lib/store";
import type { Game } from "@/lib/types";

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  if (!(await isAuthed()))
    return NextResponse.json({ error: "Chưa đăng nhập" }, { status: 401 });
  const { slug } = await params;
  if (!(await getGame(slug)))
    return NextResponse.json({ error: "Không tìm thấy game" }, { status: 404 });
  const game = (await req.json()) as Game;
  const newSlug = game.slug?.trim();
  // Cho phép ĐỔI slug: kiểm tra trùng, tạo bản ghi slug mới, xóa slug cũ.
  if (newSlug && newSlug !== slug) {
    if (await getGame(newSlug))
      return NextResponse.json({ error: "Slug mới đã tồn tại" }, { status: 409 });
    await upsertGame({ ...game, slug: newSlug });
    await deleteGame(slug);
  } else {
    await upsertGame({ ...game, slug });
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
  await deleteGame(slug);
  return NextResponse.json({ ok: true });
}

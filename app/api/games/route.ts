import { NextResponse } from "next/server";
import { isAuthed } from "@/lib/auth";
import { getGames, getGame, upsertGame } from "@/lib/store";
import type { Game } from "@/lib/types";

export async function GET() {
  return NextResponse.json({ games: await getGames() });
}

export async function POST(req: Request) {
  if (!(await isAuthed()))
    return NextResponse.json({ error: "Chưa đăng nhập" }, { status: 401 });
  const game = (await req.json()) as Game;
  if (!game.slug)
    return NextResponse.json({ error: "Thiếu slug" }, { status: 400 });
  if (await getGame(game.slug))
    return NextResponse.json({ error: "Slug đã tồn tại" }, { status: 409 });
  await upsertGame(game);
  return NextResponse.json({ ok: true, game });
}

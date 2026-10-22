import { NextResponse } from "next/server";
import { rateGame } from "@/lib/store";

// Public: người dùng chấm điểm game (1–5 sao). Không cần đăng nhập.
export async function POST(
  req: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  let value = 0;
  try {
    value = Number((await req.json())?.value);
  } catch {
    value = 0;
  }
  if (!Number.isFinite(value) || value < 1 || value > 5)
    return NextResponse.json({ error: "Điểm không hợp lệ" }, { status: 400 });

  const res = await rateGame(slug, value);
  if (!res)
    return NextResponse.json({ error: "Không tìm thấy game" }, { status: 404 });
  return NextResponse.json({ ok: true, ...res });
}

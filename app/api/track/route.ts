import { NextResponse } from "next/server";
import { trackEvent } from "@/lib/store";

// Public: ghi nhận lượt xem / lượt chơi.
export async function POST(req: Request) {
  try {
    const { type, slug } = await req.json();
    if (type !== "view" && type !== "play")
      return NextResponse.json({ ok: false }, { status: 400 });
    await trackEvent(type, typeof slug === "string" ? slug : undefined);
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: false }, { status: 200 });
  }
}

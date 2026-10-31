import { NextResponse } from "next/server";
import { getExistingSlugs } from "@/lib/store";

// Trả về các slug CÒN tồn tại trong hệ thống (trong số slug client gửi lên).
// Dùng để "Game của tôi" / "Lịch sử" tự dọn game đã bị xoá. Tham số: ?slugs=a,b,c
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const slugs = (searchParams.get("slugs") || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  const existing = await getExistingSlugs(slugs);
  return NextResponse.json({ existing });
}

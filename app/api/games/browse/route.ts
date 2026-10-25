import { NextResponse } from "next/server";
import {
  getSite,
  getVisibleGamesPaged,
  getGamesByCategoryPaged,
  searchGames,
} from "@/lib/store";

const PAGE_SIZE = 21;

// Danh sách game công khai, phân trang — dùng cho nút "Xem thêm" (load more).
// Tham số: ?page=&category=&q=
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10) || 1);
  const q = (searchParams.get("q") || "").trim();
  const category = (searchParams.get("category") || "").trim();

  let result;
  if (q) {
    result = await searchGames(q, page, PAGE_SIZE);
  } else if (category) {
    const site = await getSite();
    result = await getGamesByCategoryPaged(
      category,
      page,
      PAGE_SIZE,
      site.priorityCategories || []
    );
  } else {
    result = await getVisibleGamesPaged(page, PAGE_SIZE);
  }
  return NextResponse.json(result);
}

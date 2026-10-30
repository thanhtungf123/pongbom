import { NextResponse } from "next/server";
import {
  getSite,
  getVisibleGamesPaged,
  getGamesByCategoryPaged,
  searchGames,
} from "@/lib/store";

const PAGE_SIZE = 21;
const MAX_LIMIT = 2000; // chặn limit quá lớn (mobile nạp theo bội số 96)

// Danh sách game công khai, phân trang — dùng cho nút "load more".
// Tham số: ?page=&limit=&category=&q=
//  - PC/mặc định: limit = 21 (page-based).
//  - Mobile: page=1 + limit=96/192/... (lấy N game đầu rồi thay cả lưới).
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10) || 1);
  const limit = Math.min(
    MAX_LIMIT,
    Math.max(1, parseInt(searchParams.get("limit") || "", 10) || PAGE_SIZE)
  );
  const q = (searchParams.get("q") || "").trim();
  const category = (searchParams.get("category") || "").trim();

  let result;
  if (q) {
    result = await searchGames(q, page, limit);
  } else if (category) {
    const site = await getSite();
    result = await getGamesByCategoryPaged(
      category,
      page,
      limit,
      site.priorityCategories || []
    );
  } else {
    result = await getVisibleGamesPaged(page, limit);
  }
  return NextResponse.json(result);
}

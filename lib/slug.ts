// Tiện ích slug dùng chung (client + server). Không import fs/db ở đây.

export function slugify(s: string): string {
  return s
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/**
 * Đường dẫn trang danh mục lưu trữ — giống twoplayergames.org:
 *   "Action"   -> "/action"
 *   "2 Player" -> "/2-player"
 *   "1 Player" -> "/1-player"
 */
export function categoryPath(label: string): string {
  return `/${slugify(label)}`;
}

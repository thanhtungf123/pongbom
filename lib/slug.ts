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

/** Slug thực tế của 1 category: dùng slug tùy chỉnh nếu có, không thì suy từ tên. */
export function categorySlug(cat: { slug?: string; label: string }): string {
  return cat.slug && cat.slug.trim() ? cat.slug.trim() : slugify(cat.label);
}

/** Đường dẫn URL của 1 category: /{slug}. */
export function categoryHref(cat: { slug?: string; label: string }): string {
  return `/${categorySlug(cat)}`;
}

import Link from "next/link";

/**
 * Phân trang cho các trang danh sách game (server-rendered, dùng query ?page=).
 * basePath = đường dẫn gốc (vd "/racing" hoặc "/"). Trang 1 không gắn ?page.
 */
export default function Pagination({
  page,
  totalPages,
  basePath,
}: {
  page: number;
  totalPages: number;
  basePath: string;
}) {
  if (totalPages <= 1) return null;

  const href = (p: number) => (p <= 1 ? basePath : `${basePath}?page=${p}`);

  // Dải số trang gọn: luôn có 1 và cuối, cùng ±1 quanh trang hiện tại.
  const nums: (number | "…")[] = [];
  const push = (n: number) => {
    if (n >= 1 && n <= totalPages && !nums.includes(n)) nums.push(n);
  };
  push(1);
  if (page - 1 > 2) nums.push("…");
  push(page - 1);
  push(page);
  push(page + 1);
  if (page + 1 < totalPages - 1) nums.push("…");
  push(totalPages);

  return (
    <nav className="pagination" aria-label="Pagination">
      {page > 1 ? (
        <Link className="page-btn page-nav" href={href(page - 1)} rel="prev">
          <span className="cat-icon monochrome-chevron-left" />
        </Link>
      ) : (
        <span className="page-btn page-nav disabled">
          <span className="cat-icon monochrome-chevron-left" />
        </span>
      )}

      {nums.map((n, i) =>
        n === "…" ? (
          <span key={`e${i}`} className="page-ellipsis">
            …
          </span>
        ) : n === page ? (
          <span key={n} className="page-btn active" aria-current="page">
            {n}
          </span>
        ) : (
          <Link key={n} className="page-btn" href={href(n)}>
            {n}
          </Link>
        )
      )}

      {page < totalPages ? (
        <Link className="page-btn page-nav" href={href(page + 1)} rel="next">
          <span className="cat-icon monochrome-chevron-right" />
        </Link>
      ) : (
        <span className="page-btn page-nav disabled">
          <span className="cat-icon monochrome-chevron-right" />
        </span>
      )}
    </nav>
  );
}

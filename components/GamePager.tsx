"use client";

import { useState } from "react";
import type { Game } from "@/lib/types";
import GameCard from "@/components/GameCard";

/**
 * Phân trang phía client cho 1 mảng game có sẵn (dùng ở trang 404 — nơi không
 * có query ổn định). Mỗi trang pageSize game, tối đa maxPages trang.
 */
export default function GamePager({
  games,
  pageSize = 21,
  maxPages = 5,
}: {
  games: Game[];
  pageSize?: number;
  maxPages?: number;
}) {
  const [page, setPage] = useState(1);
  if (!games.length) return null;

  const capped = games.slice(0, pageSize * maxPages);
  const totalPages = Math.ceil(capped.length / pageSize);
  const start = (page - 1) * pageSize;
  const view = capped.slice(start, start + pageSize);

  return (
    <>
      <ul className="game-list">
        {view.map((g) => (
          <GameCard key={g.slug} game={g} />
        ))}
      </ul>

      {totalPages > 1 && (
        <nav className="pagination" aria-label="Phân trang">
          <button
            className="page-btn page-nav"
            disabled={page <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
          >
            <span className="cat-icon monochrome-chevron-left" />
          </button>
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((n) => (
            <button
              key={n}
              className={`page-btn${n === page ? " active" : ""}`}
              onClick={() => setPage(n)}
            >
              {n}
            </button>
          ))}
          <button
            className="page-btn page-nav"
            disabled={page >= totalPages}
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
          >
            <span className="cat-icon monochrome-chevron-right" />
          </button>
        </nav>
      )}
    </>
  );
}

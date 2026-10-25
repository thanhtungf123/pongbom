"use client";

import { useState } from "react";
import GameCard from "@/components/GameCard";
import Pagination from "@/components/Pagination";
import type { Game } from "@/lib/types";

/**
 * Lưới game: SSR trang đầu + 2 cách xem tiếp:
 *  - PC: phân trang (Pagination, link ?page=) — SEO tốt.
 *  - Mobile: nút "Xem thêm" (load more) nạp thêm game qua API và chèn vào lưới,
 *    kèm animation xuất hiện.
 */
export default function GameGrid({
  initial,
  total,
  page,
  pageSize,
  basePath,
  query = {},
  source = {},
}: {
  initial: Game[];
  total: number;
  page: number;
  pageSize: number;
  basePath: string;
  query?: Record<string, string>;
  source?: Record<string, string>; // tham số gọi API (category / q)
}) {
  const [games, setGames] = useState<Game[]>(initial);
  const [nextPage, setNextPage] = useState(page + 1);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState(false);

  const loadMore = async () => {
    setLoading(true);
    setErr(false);
    try {
      const sp = new URLSearchParams({ ...source, page: String(nextPage) });
      const r = await fetch(`/api/games/browse?${sp.toString()}`);
      const d = (await r.json()) as { games: Game[] };
      setGames((g) => [...g, ...(d.games || [])]);
      setNextPage((p) => p + 1);
    } catch {
      setErr(true);
    } finally {
      setLoading(false);
    }
  };

  const hasMore = games.length < total;
  const totalPages = Math.ceil(total / pageSize);

  return (
    <>
      <ul className="game-list">
        {games.map((g, i) => (
          <GameCard key={g.slug} game={g} animate={i >= initial.length} />
        ))}
      </ul>

      {hasMore && (
        <div className="load-more-wrap">
          <button
            type="button"
            className="load-more"
            onClick={loadMore}
            disabled={loading}
          >
            {loading ? (
              <>
                <span className="load-more-spinner" /> Đang tải…
              </>
            ) : (
              "Xem thêm game"
            )}
          </button>
          {err && <span className="load-more-err">Lỗi tải, thử lại nhé.</span>}
        </div>
      )}

      {/* Phân trang chỉ dành cho PC */}
      <div className="grid-pagination">
        <Pagination
          page={page}
          totalPages={totalPages}
          basePath={basePath}
          query={query}
        />
      </div>
    </>
  );
}

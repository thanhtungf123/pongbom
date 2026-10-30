"use client";

import { useEffect, useRef, useState } from "react";
import GameCard from "@/components/GameCard";
import LoadMoreTile from "@/components/LoadMoreTile";
import Pagination from "@/components/Pagination";
import type { Game } from "@/lib/types";

/**
 * Lưới game: SSR trang đầu + 2 cách xem tiếp:
 *  - PC: phân trang (Pagination, link ?page=) — SEO tốt, GIỮ giới hạn mỗi trang.
 *  - MOBILE: KHÔNG bị giới hạn như PC. Luôn hiển thị ~96 game TRƯỚC (kể cả trang
 *    category dù SSR trả nhiều hơn), còn game thì có ô "Xem thêm" (nằm trong lưới)
 *    để lộ thêm 96 game nữa (giống m.twoplayergames.org). Thiếu thì nạp qua API.
 */
const MOBILE_BATCH = 96; // số game mỗi "đợt" trên mobile

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
  const [shown, setShown] = useState(MOBILE_BATCH); // số game hiển thị trên mobile
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  // Số game SSR ban đầu -> biết card nào là "mới nạp" để chạy animation.
  const baseCount = useRef(initial.length);

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 820px)");
    const update = () => setIsMobile(mq.matches);
    update();
    mq.addEventListener?.("change", update);
    return () => mq.removeEventListener?.("change", update);
  }, []);

  // Nạp ĐÚNG `want` game đầu tiên (page=1, limit=want) rồi thay cả danh sách.
  // Thứ tự game ổn định nên phần đầu không đổi -> React (key=slug) chỉ thêm
  // các card mới vào cuối, không nhấp nháy.
  const fetchFirst = async (want: number) => {
    setLoading(true);
    setErr(false);
    try {
      const sp = new URLSearchParams({
        ...source,
        page: "1",
        limit: String(want),
      });
      const r = await fetch(`/api/games/browse?${sp.toString()}`);
      const d = (await r.json()) as { games: Game[] };
      if (d.games?.length) setGames(d.games);
    } catch {
      setErr(true);
    } finally {
      setLoading(false);
    }
  };

  // Vào mobile lần đầu: nếu game đã có < 96 và còn game -> nạp cho đủ 96.
  useEffect(() => {
    if (isMobile && games.length < MOBILE_BATCH && games.length < total) {
      void fetchFirst(MOBILE_BATCH);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isMobile]);

  const loadMore = async () => {
    const next = shown + MOBILE_BATCH;
    // Chưa đủ game trong bộ nhớ cho đợt tới -> nạp thêm trước khi lộ.
    if (games.length < next && games.length < total) await fetchFirst(next);
    setShown(next);
  };

  // Mobile chỉ hiển thị `shown` game; PC hiển thị trọn trang SSR.
  const visible = isMobile ? games.slice(0, shown) : games;
  const hasMore = visible.length < total;
  const totalPages = Math.ceil(total / pageSize);

  return (
    <>
      <ul className="game-list">
        {visible.map((g, i) => (
          <GameCard
            key={g.slug}
            game={g}
            animate={isMobile && i >= baseCount.current}
          />
        ))}
        {/* Ô "Xem thêm" trong lưới — chỉ hiện trên mobile (CSS) */}
        {hasMore && (
          <LoadMoreTile onClick={loadMore} loading={loading} error={err} />
        )}
      </ul>

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

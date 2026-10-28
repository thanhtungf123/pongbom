"use client";

import { useEffect, useState } from "react";
import GameCard from "./GameCard";
import type { Game } from "@/lib/types";

// Hiển thị 1 KHỐI game trang chủ.
//  - DESKTOP: carousel trượt ngang giống twoplayergames
//    (.trending-slider > .slide-list > .slide(×N) > ul.game-list), mỗi slide
//    `perSlide` game (mặc định 21 = 3 hàng × 7). Điều khiển ‹ + chấm tròn + ›.
//  - MOBILE: lưới 3 cột, hiện `MOBILE_BATCH` (96) game, còn game thì có nút
//    "Xem thêm" lộ thêm 96 game nữa (giống m.twoplayergames).
const MOBILE_BATCH = 96;

export default function HomeSlider({
  games,
  perSlide = 21,
}: {
  games: Game[];
  perSlide?: number;
}) {
  const [page, setPage] = useState(0);
  const [isMobile, setIsMobile] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [shown, setShown] = useState(MOBILE_BATCH);

  useEffect(() => {
    setMounted(true);
    const mq = window.matchMedia("(max-width: 820px)");
    const update = () => setIsMobile(mq.matches);
    update();
    mq.addEventListener?.("change", update);
    return () => mq.removeEventListener?.("change", update);
  }, []);

  /* ----------------------------- MOBILE ----------------------------- */
  // Lưới 3 cột: hiện 96 game, còn game thì nút "Xem thêm" lộ thêm 96.
  if (mounted && isMobile) {
    return (
      <>
        <ul className="game-list">
          {games.slice(0, shown).map((g) => (
            <GameCard key={g.slug} game={g} />
          ))}
        </ul>
        {shown < games.length && (
          <div className="load-more-wrap">
            <button
              type="button"
              className="load-more"
              onClick={() => setShown((s) => s + MOBILE_BATCH)}
            >
              Xem thêm game
            </button>
          </div>
        )}
      </>
    );
  }

  /* ----------------------------- DESKTOP ---------------------------- */
  const size = Math.max(1, Math.floor(perSlide) || 21);
  const pages: Game[][] = [];
  for (let i = 0; i < games.length; i += size)
    pages.push(games.slice(i, i + size));
  const total = pages.length;

  // <= 1 trang: không cần carousel -> lưới thường.
  if (total <= 1) {
    return (
      <ul className="game-list">
        {games.map((g) => (
          <GameCard key={g.slug} game={g} />
        ))}
      </ul>
    );
  }

  const go = (p: number) => setPage(Math.max(0, Math.min(total - 1, p)));

  return (
    <>
      <div className="trending-games">
        <div className="trending-slider">
          <div
            className="slide-list"
            style={{ transform: `translateX(-${page * 100}%)` }}
          >
            {pages.map((pg, i) => (
              <div className="slide" key={i} aria-hidden={i !== page}>
                <ul className="game-list">
                  {pg.map((g) => (
                    <GameCard key={g.slug} game={g} />
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="slider-controls">
        <a
          className={`slider-control-prev${page === 0 ? " inactive" : ""}`}
          role="button"
          tabIndex={0}
          aria-label="Trang trước"
          onClick={() => go(page - 1)}
        >
          <span className="monochrome-chevron-left" />
        </a>
        <div className="slider-pagination">
          {pages.map((_, i) => (
            <a
              key={i}
              className={i === page ? "active" : ""}
              role="button"
              tabIndex={0}
              aria-label={`Trang ${i + 1}`}
              aria-current={i === page ? "true" : undefined}
              onClick={() => go(i)}
            />
          ))}
        </div>
        <a
          className={`slider-control-next${page === total - 1 ? " inactive" : ""}`}
          role="button"
          tabIndex={0}
          aria-label="Trang sau"
          onClick={() => go(page + 1)}
        >
          <span className="monochrome-chevron-right" />
        </a>
      </div>
    </>
  );
}

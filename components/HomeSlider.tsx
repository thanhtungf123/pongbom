"use client";

import { useState } from "react";
import GameCard from "./GameCard";
import type { Game } from "@/lib/types";

// Carousel phân trang cho 1 KHỐI trang chủ — bố cục/markup giống twoplayergames:
//   .trending-slider > .slide-list > .slide(×N) > ul.game-list
// Mỗi "slide" = `perSlide` game (số game MỖI TRANG, mặc định 21 = 3 hàng × 7 cột).
// Nếu category có nhiều game hơn perSlide -> tự phân trang (‹ + chấm tròn + ›).
// Trên mobile (responsive.css) slide xếp dọc thành danh sách phẳng, ẩn điều khiển.
export default function HomeSlider({
  games,
  perSlide = 21,
}: {
  games: Game[];
  perSlide?: number;
}) {
  const [page, setPage] = useState(0);

  // Chia danh sách thành các trang `perSlide` game.
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

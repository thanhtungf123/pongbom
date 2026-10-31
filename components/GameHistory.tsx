"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  getHistory,
  STORE_EVENT,
  syncRemovedGamesOnce,
  type SavedGame,
} from "@/lib/clientStore";

/**
 * Lịch sử game đã chơi (localStorage, không cần đăng nhập). Hiển thị trong ô
 * `.game-history` ở cạnh tiêu đề section (chỉ PC — đã ẩn ở mobile).
 * Bấm icon để xổ danh sách game vừa chơi gần đây.
 */
export default function GameHistory() {
  const [items, setItems] = useState<SavedGame[]>([]);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const sync = () => setItems(getHistory());
    sync();
    void syncRemovedGamesOnce(); // dọn game đã bị xoá khỏi hệ thống
    window.addEventListener(STORE_EVENT, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(STORE_EVENT, sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  useEffect(() => {
    if (!open) return;
    const h = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, [open]);

  return (
    <div className="game-history gh" ref={ref}>
      <button
        type="button"
        className="gh-btn"
        aria-label="Lịch sử game đã chơi"
        title="Game đã chơi gần đây"
        onClick={() => setOpen((o) => !o)}
      >
        <span className="icon monochrome-history" />
        {/* xem nhanh vài thumbnail game gần nhất cạnh icon */}
        <span className="gh-peek">
          {items.slice(0, 3).map((g) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img key={g.slug} src={g.thumbnail} alt="" width={26} height={26} />
          ))}
        </span>
      </button>

      {open && (
        <div className="gh-panel">
          <div className="gh-head">Game đã chơi gần đây</div>
          {items.length === 0 ? (
            <div className="gh-empty">Chưa có lịch sử. Hãy chơi một game!</div>
          ) : (
            <ul className="gh-list">
              {items.map((g) => (
                <li key={g.slug}>
                  <Link
                    href={`/game/${g.slug}`}
                    className="gh-item"
                    onClick={() => setOpen(false)}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={g.thumbnail} alt="" width={40} height={40} />
                    <span className="gh-title">{g.title}</span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}

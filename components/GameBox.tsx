"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  getGameBox,
  removeGameBox,
  STORE_EVENT,
  type SavedGame,
} from "@/lib/clientStore";

/**
 * "My Game Box" trên header (chỉ PC — `.top-game-box` đã ẩn ở mobile).
 * Bấm để xổ danh sách game đã lưu (localStorage). Có badge số lượng.
 */
export default function GameBox() {
  const [items, setItems] = useState<SavedGame[]>([]);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const sync = () => setItems(getGameBox());
    sync();
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
    <div className="game-box" ref={ref}>
      <a
        href="#"
        className="game-box-btn"
        draggable={false}
        onClick={(e) => {
          e.preventDefault();
          setOpen((o) => !o);
        }}
      >
        My Game Box
        <i className="con monochrome-inbox" />
        {items.length > 0 && <span className="game-box-badge">{items.length}</span>}
      </a>

      {open && (
        <div className="game-box-panel">
          {items.length === 0 ? (
            <div className="game-box-empty">
              Chưa có game nào. Mở 1 game rồi bấm “Lưu vào My Game Box”.
            </div>
          ) : (
            <ul className="game-box-list">
              {items.map((g) => (
                <li key={g.slug}>
                  <Link
                    href={`/game/${g.slug}`}
                    className="game-box-item"
                    onClick={() => setOpen(false)}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={g.thumbnail} alt="" width={44} height={44} />
                    <span className="game-box-title">{g.title}</span>
                  </Link>
                  <button
                    type="button"
                    className="game-box-remove"
                    aria-label="Bỏ khỏi My Game Box"
                    onClick={() => removeGameBox(g.slug)}
                  >
                    ✕
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}

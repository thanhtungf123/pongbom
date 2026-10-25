"use client";

import { useEffect, useState } from "react";
import type { Game } from "@/lib/types";
import { inGameBox, toggleGameBox, STORE_EVENT } from "@/lib/clientStore";

/**
 * Nút lưu game vào "My Game Box" (localStorage, không cần đăng nhập).
 * Chỉ hiển thị trên web PC (ẩn ở mobile qua class pc-only).
 */
export default function GameBoxButton({ game }: { game: Game }) {
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const sync = () => setSaved(inGameBox(game.slug));
    sync();
    window.addEventListener(STORE_EVENT, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(STORE_EVENT, sync);
      window.removeEventListener("storage", sync);
    };
  }, [game.slug]);

  return (
    <button
      type="button"
      className={`gamebox-save pc-only${saved ? " saved" : ""}`}
      onClick={() =>
        toggleGameBox({
          slug: game.slug,
          title: game.title,
          thumbnail: game.thumbnail,
        })
      }
      title={saved ? "Bỏ khỏi My Game Box" : "Lưu vào My Game Box"}
    >
      <i className={`con monochrome-inbox${saved ? "-in" : ""}`} />
      <span>{saved ? "Đã lưu" : "Lưu vào My Game Box"}</span>
    </button>
  );
}

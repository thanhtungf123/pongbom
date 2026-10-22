"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { Game } from "@/lib/types";
import { IFRAME_ALLOW } from "@/lib/types";

export default function GamePlayer({ game }: { game: Game }) {
  const wrapperRef = useRef<HTMLDivElement>(null); // #game-container
  const [isFs, setIsFs] = useState(false);

  // Bỏ "fullscreen" khỏi quyền iframe để game không tự vào fullscreen riêng.
  const iframeAllow = IFRAME_ALLOW.replace(/fullscreen;\s*/i, "");

  const nativeFsSupported = useCallback(() => {
    if (typeof document === "undefined") return false;
    const el = wrapperRef.current as (HTMLDivElement & {
      webkitRequestFullscreen?: () => Promise<void>;
    }) | null;
    return Boolean(
      (document.fullscreenEnabled ||
        (document as Document & { webkitFullscreenEnabled?: boolean })
          .webkitFullscreenEnabled) &&
        el &&
        (el.requestFullscreen || el.webkitRequestFullscreen)
    );
  }, []);

  const lockScroll = (lock: boolean) => {
    document.body.style.overflow = lock ? "hidden" : "";
  };

  const enterFullscreen = useCallback(async () => {
    const el = wrapperRef.current as (HTMLDivElement & {
      webkitRequestFullscreen?: () => Promise<void>;
    }) | null;
    if (!el) return;
    lockScroll(true);
    setIsFs(true); // effect bên dưới sẽ đồng bộ kích thước theo viewport thật
    if (nativeFsSupported()) {
      try {
        if (el.requestFullscreen) await el.requestFullscreen();
        else if (el.webkitRequestFullscreen) await el.webkitRequestFullscreen();
        try {
          await (
            screen.orientation as ScreenOrientation & {
              lock?: (o: string) => Promise<void>;
            }
          )?.lock?.("landscape");
        } catch {
          /* trình duyệt không cho khóa xoay */
        }
      } catch {
        /* fullscreen thật lỗi -> vẫn dùng pseudo (đã setIsFs) */
      }
    }
  }, [nativeFsSupported]);

  const exitFullscreen = useCallback(async () => {
    const doc = document as Document & {
      webkitExitFullscreen?: () => Promise<void>;
      webkitFullscreenElement?: Element;
    };
    try {
      if (doc.fullscreenElement && doc.exitFullscreen) await doc.exitFullscreen();
      else if (doc.webkitFullscreenElement && doc.webkitExitFullscreen)
        await doc.webkitExitFullscreen();
    } catch {
      /* ignore */
    }
    try {
      (screen.orientation as ScreenOrientation & { unlock?: () => void })?.unlock?.();
    } catch {
      /* ignore */
    }
    lockScroll(false);
    setIsFs(false);
  }, []);

  const toggleFullscreen = () => (isFs ? exitFullscreen() : enterFullscreen());

  // Thoát fullscreen thật bằng back/Esc/cử chỉ
  useEffect(() => {
    const onFsChange = () => {
      const doc = document as Document & { webkitFullscreenElement?: Element };
      const active = Boolean(doc.fullscreenElement || doc.webkitFullscreenElement);
      if (!active && nativeFsSupported()) {
        lockScroll(false);
        setIsFs(false);
      }
    };
    document.addEventListener("fullscreenchange", onFsChange);
    document.addEventListener("webkitfullscreenchange", onFsChange);
    return () => {
      document.removeEventListener("fullscreenchange", onFsChange);
      document.removeEventListener("webkitfullscreenchange", onFsChange);
    };
  }, [nativeFsSupported]);

  /*
    QUAN TRỌNG (fix iOS): khi fullscreen, đồng bộ kích thước khung game THEO
    visualViewport thật (px) thay vì 100dvh/100vw. Trên iOS, khi xoay ngang,
    dvh/vw không cập nhật đúng -> vùng chạm của iframe lệch khỏi phần nhìn thấy,
    nên chạm "Click to keep playing" không ăn. Đồng bộ lại mỗi lần resize/xoay
    (kèm delay vì iOS báo innerHeight sai ngay sau orientationchange) khắc phục.
  */
  useEffect(() => {
    const el = wrapperRef.current;
    if (!isFs || !el) return;

    const sync = () => {
      const vv = window.visualViewport;
      const w = Math.round(vv?.width ?? window.innerWidth);
      const h = Math.round(vv?.height ?? window.innerHeight);
      el.style.width = `${w}px`;
      el.style.height = `${h}px`;
      el.style.top = `${Math.round(vv?.offsetTop ?? 0)}px`;
      el.style.left = `${Math.round(vv?.offsetLeft ?? 0)}px`;
      // ép reflow để iOS giao lại sự kiện chạm cho iframe sau khi xoay
      void el.offsetHeight;
    };

    sync();
    // iOS trả kích thước sai ngay sau khi xoay -> đồng bộ lại sau vài nhịp
    const timers = [
      setTimeout(sync, 100),
      setTimeout(sync, 350),
      setTimeout(sync, 700),
    ];
    window.addEventListener("resize", sync);
    window.addEventListener("orientationchange", sync);
    window.visualViewport?.addEventListener("resize", sync);
    window.visualViewport?.addEventListener("scroll", sync);

    return () => {
      timers.forEach(clearTimeout);
      window.removeEventListener("resize", sync);
      window.removeEventListener("orientationchange", sync);
      window.visualViewport?.removeEventListener("resize", sync);
      window.visualViewport?.removeEventListener("scroll", sync);
      // xóa style inline khi thoát fullscreen
      el.style.width = "";
      el.style.height = "";
      el.style.top = "";
      el.style.left = "";
    };
  }, [isFs]);

  useEffect(() => () => {
    document.body.style.overflow = "";
  }, []);

  useEffect(() => {
    if (!isFs) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") exitFullscreen();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isFs, exitFullscreen]);

  return (
    <div className="game">
      <div
        id="game-container"
        ref={wrapperRef}
        className={isFs ? "is-fs" : undefined}
      >
        {/* .game-screen: hộp tỉ lệ bằng padding-bottom (KHÔNG dùng aspect-ratio
            để tránh bug lệch vùng chạm iframe trên iOS) */}
        <div className="game-screen">
          <iframe
            id="game-frame"
            src={game.iframeUrl}
            title={game.title}
            allow={iframeAllow}
          />

          {isFs && (
            <button className="fs-exit" onClick={exitFullscreen} aria-label="Exit fullscreen">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4">
                <path d="M6 6l12 12M18 6L6 18" strokeLinecap="round" />
              </svg>
              Exit
            </button>
          )}
        </div>

        <div className="game-bottom-bar">
          <div className="game-details">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              className="image"
              src={game.thumbnail}
              height={38}
              width={50}
              alt={game.title}
              title={game.title}
            />
            <div className="title">{game.title}</div>
          </div>
          <div className="game-tools">
            <a className="lights-on-off" aria-label="Turn on/off the lights">
              <span className="monochrome-lightbulb" />
            </a>
            <a
              className="game-full-screen"
              aria-label="Switch to full-screen"
              onClick={toggleFullscreen}
              role="button"
              tabIndex={0}
            >
              <span className="monochrome-fullscreen" />
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

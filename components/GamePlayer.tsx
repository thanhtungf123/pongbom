"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { Game } from "@/lib/types";
import { IFRAME_ALLOW } from "@/lib/types";

/**
 * Luồng chơi game:
 *  - Mặc định hiện POSTER: thumbnail + nút "Let's Play!" (game CHƯA nạp).
 *  - Bấm "Let's Play!":
 *      + PC (chuột, pointer fine): nạp game CHƠI NGAY TẠI KHUNG (in-page, hộp
 *        16:9). KHÔNG tự ép fullscreen. Người dùng tự bấm nút fullscreen nếu muốn.
 *      + Mobile/tablet (cảm ứng): vào IMMERSIVE (fullscreen) + xử lý hướng xoay
 *        như cũ (Android lock orientation, iPhone xoay khung 90° bằng CSS).
 *  - Thoát fullscreen: PC quay về chơi in-page; mobile quay về poster.
 */
export default function GamePlayer({ game }: { game: Game }) {
  const wrapperRef = useRef<HTMLDivElement>(null); // #game-container
  const screenRef = useRef<HTMLDivElement>(null); // .game-screen (phần được xoay)
  const trackedRef = useRef(false); // đã ghi nhận lượt chơi chưa (1 lần/trang)
  const [playing, setPlaying] = useState(false); // game đã nạp (iframe) hay poster
  const [immersive, setImmersive] = useState(false); // phủ kín màn hình (fullscreen)
  const [lightsOff, setLightsOff] = useState(false); // "tắt đèn" làm tối trang

  // PC = có chuột (pointer fine + hover). Phone/tablet cảm ứng -> không phải PC.
  const isDesktopRef = useRef(false);
  useEffect(() => {
    const mq = window.matchMedia("(hover: hover) and (pointer: fine)");
    const update = () => (isDesktopRef.current = mq.matches);
    update();
    mq.addEventListener?.("change", update);
    return () => mq.removeEventListener?.("change", update);
  }, []);

  // Bỏ "fullscreen" khỏi quyền iframe để game không tự vào fullscreen riêng.
  const iframeAllow = IFRAME_ALLOW.replace(/fullscreen;\s*/i, "");
  const orientation = game.orientation || "auto";

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

  // Nạp game vào khung (không fullscreen). Ghi nhận lượt chơi 1 lần/trang.
  const loadGame = useCallback(() => {
    setPlaying(true);
    setLightsOff(false);
    if (!trackedRef.current) {
      trackedRef.current = true;
      fetch("/api/track", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "play", slug: game.slug }),
      }).catch(() => {});
    }
  }, [game.slug]);

  // Vào immersive (fullscreen). PHẢI gọi trong cử chỉ bấm của người dùng.
  const enterImmersive = useCallback(() => {
    setImmersive(true);
    lockScroll(true);

    const el = wrapperRef.current as (HTMLDivElement & {
      webkitRequestFullscreen?: () => Promise<void>;
    }) | null;
    if (!el || !nativeFsSupported()) return; // iPhone: chỉ giả-fullscreen bằng CSS

    const req = el.requestFullscreen
      ? el.requestFullscreen()
      : el.webkitRequestFullscreen
        ? el.webkitRequestFullscreen()
        : null;
    Promise.resolve(req)
      .then(() => {
        if (orientation === "auto") return;
        return (
          screen.orientation as ScreenOrientation & {
            lock?: (o: string) => Promise<void>;
          }
        )?.lock?.(orientation);
      })
      .catch(() => {
        /* không khóa xoay được -> bỏ qua, vẫn immersive */
      });
  }, [nativeFsSupported, orientation]);

  // Bấm "Let's Play!" (poster): PC chơi in-page, mobile vào immersive.
  const startPlay = useCallback(() => {
    loadGame();
    if (!isDesktopRef.current) enterImmersive();
  }, [loadGame, enterImmersive]);

  // Bấm nút fullscreen (thanh dưới): luôn vào fullscreen (cả PC lẫn mobile).
  const playFullscreen = useCallback(() => {
    if (!playing) loadGame();
    enterImmersive();
  }, [playing, loadGame, enterImmersive]);

  // Thoát immersive: PC -> về chơi in-page; mobile -> về poster.
  const exitImmersive = useCallback(() => {
    const doc = document as Document & {
      webkitExitFullscreen?: () => Promise<void>;
      webkitFullscreenElement?: Element;
    };
    try {
      if (doc.fullscreenElement && doc.exitFullscreen) doc.exitFullscreen();
      else if (doc.webkitFullscreenElement && doc.webkitExitFullscreen)
        doc.webkitExitFullscreen();
    } catch {
      /* ignore */
    }
    try {
      (screen.orientation as ScreenOrientation & { unlock?: () => void })?.unlock?.();
    } catch {
      /* ignore */
    }
    lockScroll(false);
    setImmersive(false);
    if (!isDesktopRef.current) setPlaying(false); // mobile: quay về poster
  }, []);

  // Thoát fullscreen thật (nút back/Esc) -> đồng bộ trạng thái.
  useEffect(() => {
    const onFsChange = () => {
      const doc = document as Document & { webkitFullscreenElement?: Element };
      const active = Boolean(doc.fullscreenElement || doc.webkitFullscreenElement);
      if (!active && nativeFsSupported()) {
        try {
          (screen.orientation as ScreenOrientation & { unlock?: () => void })?.unlock?.();
        } catch {
          /* ignore */
        }
        lockScroll(false);
        setImmersive(false);
        if (!isDesktopRef.current) setPlaying(false);
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
    iOS (giả-fullscreen): đồng bộ kích thước khung THEO visualViewport thật (px).
    Chỉ chạy khi IMMERSIVE (không áp cho lúc chơi in-page trên PC).
  */
  useEffect(() => {
    const s = screenRef.current;
    if (!immersive || !s) return;

    const canNativeLock = nativeFsSupported();

    const sync = () => {
      const vv = window.visualViewport;
      const w = Math.round(vv?.width ?? window.innerWidth);
      const h = Math.round(vv?.height ?? window.innerHeight);
      const deviceLandscape = w >= h;
      const needRotate =
        !canNativeLock &&
        ((orientation === "landscape" && !deviceLandscape) ||
          (orientation === "portrait" && deviceLandscape));

      s.style.position = "absolute";
      s.style.transformOrigin = "top left";
      s.style.right = "auto";
      s.style.bottom = "auto";

      if (needRotate) {
        s.style.top = "0px";
        s.style.left = "0px";
        s.style.width = `${h}px`;
        s.style.height = `${w}px`;
        s.style.transform = `rotate(90deg) translateY(-${w}px)`;
      } else {
        s.style.top = `${Math.round(vv?.offsetTop ?? 0)}px`;
        s.style.left = `${Math.round(vv?.offsetLeft ?? 0)}px`;
        s.style.width = `${w}px`;
        s.style.height = `${h}px`;
        s.style.transform = "";
      }
      void s.offsetHeight;
    };

    sync();
    const timers = [setTimeout(sync, 100), setTimeout(sync, 350), setTimeout(sync, 700)];
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
      s.style.width = "";
      s.style.height = "";
      s.style.top = "";
      s.style.left = "";
      s.style.right = "";
      s.style.bottom = "";
      s.style.transform = "";
      s.style.transformOrigin = "";
      s.style.position = "";
    };
  }, [immersive, orientation, nativeFsSupported]);

  useEffect(() => () => {
    document.body.style.overflow = "";
  }, []);

  // Esc -> thoát immersive (nếu đang immersive).
  useEffect(() => {
    if (!immersive) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") exitImmersive();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [immersive, exitImmersive]);

  return (
    <div className={`game${lightsOff ? " lights-dim" : ""}`}>
      {lightsOff && (
        <div
          className="lights-overlay"
          onClick={() => setLightsOff(false)}
          aria-hidden="true"
        />
      )}
      <div
        id="game-container"
        ref={wrapperRef}
        className={immersive ? "is-fs" : undefined}
      >
        <div className="game-screen" ref={screenRef}>
          {playing ? (
            <iframe
              id="game-frame"
              src={game.iframeUrl}
              title={game.title}
              allow={iframeAllow}
            />
          ) : (
            <button
              type="button"
              className="play-poster"
              onClick={startPlay}
              aria-label={`Chơi ${game.title}`}
              style={
                game.thumbnail
                  ? { backgroundImage: `url(${game.thumbnail})` }
                  : undefined
              }
            >
              <span className="play-poster-btn">
                <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                  <path d="M8 5v14l11-7z" />
                </svg>
                Let&apos;s Play!
              </span>
            </button>
          )}
        </div>

        {/* Thanh dưới hiện ở poster VÀ khi chơi in-page (PC). Ẩn khi immersive. */}
        {!immersive && (
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
              <a
                className={`lights-on-off${lightsOff ? " lights-off-active" : ""}`}
                aria-label="Turn on/off the lights"
                onClick={() => setLightsOff((v) => !v)}
                role="button"
                tabIndex={0}
              >
                <span className="monochrome-lightbulb" />
              </a>
              <a
                className="game-full-screen"
                aria-label="Chơi toàn màn hình"
                onClick={playFullscreen}
                role="button"
                tabIndex={0}
              >
                <span className="monochrome-fullscreen" />
              </a>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

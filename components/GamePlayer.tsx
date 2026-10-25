"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { Game } from "@/lib/types";
import { IFRAME_ALLOW } from "@/lib/types";

/**
 * Luồng chơi game (theo yêu cầu):
 *  - Mặc định hiện POSTER: thumbnail + nút "Let's Play!" (game CHƯA nạp).
 *  - Bấm "Let's Play!" -> nạp iframe + vào IMMERSIVE (fullscreen).
 *      + Android/iPad/desktop: fullscreen thật + khóa xoay hệ thống theo game.
 *      + iPhone Safari: giả-fullscreen + XOAY khung game 90° (CSS) để game ra
 *        đúng hướng ngay; người dùng xoay máy theo, khi khớp thì bỏ xoay.
 *  - KHÔNG có nút thoát. Thoát fullscreen (nút back hệ thống) hoặc reload trang
 *    -> quay về poster. Nhờ immersive, người dùng không chạm nhầm vùng ngoài
 *    nên hạn chế tối đa việc game bị pause.
 */
export default function GamePlayer({ game }: { game: Game }) {
  const wrapperRef = useRef<HTMLDivElement>(null); // #game-container (phủ kín viewport)
  const screenRef = useRef<HTMLDivElement>(null); // .game-screen (phần được xoay)
  const trackedRef = useRef(false); // đã ghi nhận lượt chơi chưa (1 lần/trang)
  const [playing, setPlaying] = useState(false); // đang chơi (immersive) hay poster
  const [lightsOff, setLightsOff] = useState(false); // "tắt đèn" làm tối trang

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

  // Bấm "Let's Play!": nạp game + vào immersive. PHẢI gọi requestFullscreen
  // ngay trong cử chỉ bấm (không await trước đó) thì trình duyệt mới cho phép.
  const startPlay = useCallback(() => {
    setPlaying(true);
    setLightsOff(false);
    lockScroll(true);

    // Ghi nhận lượt chơi THẬT (chỉ khi bấm Let's Play), 1 lần mỗi lần mở trang.
    if (!trackedRef.current) {
      trackedRef.current = true;
      fetch("/api/track", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "play", slug: game.slug }),
      }).catch(() => {});
    }

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
  }, [nativeFsSupported, orientation, game.slug]);

  const stopPlay = useCallback(() => {
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
    setPlaying(false);
  }, []);

  // Thoát fullscreen thật (nút back/Esc) -> quay về poster.
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
        setPlaying(false);
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
    iOS (giả-fullscreen): đồng bộ kích thước khung THEO visualViewport thật (px)
    thay vì 100dvh/100vw, vì iOS báo dvh/vw sai khi xoay -> vùng chạm iframe lệch.
  */
  useEffect(() => {
    const s = screenRef.current;
    if (!playing || !s) return;

    // Chỉ xoay bằng CSS khi KHÔNG khóa xoay hệ thống được (iOS). Android dùng
    // screen.orientation.lock -> máy tự xoay, không cần CSS rotate.
    // #game-container đã phủ kín viewport (CSS inset:0, nền đen); ở đây chỉ chỉnh
    // riêng .game-screen (phủ hết container hoặc xoay 90°).
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
        // Game XOAY 90° phủ KÍN màn hình để đúng hướng ngay; người dùng xoay theo.
        s.style.top = "0px";
        s.style.left = "0px";
        s.style.width = `${h}px`;
        s.style.height = `${w}px`;
        s.style.transform = `rotate(90deg) translateY(-${w}px)`;
      } else {
        // Phủ kín theo visualViewport (không xoay).
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
  }, [playing, orientation, nativeFsSupported]);

  useEffect(() => () => {
    document.body.style.overflow = "";
  }, []);

  // Esc -> thoát (desktop)
  useEffect(() => {
    if (!playing) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") stopPlay();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [playing, stopPlay]);

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
        className={playing ? "is-fs" : undefined}
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

        {/* Thanh dưới chỉ hiện ở poster (khi chơi là immersive, không có thanh) */}
        {!playing && (
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
                onClick={startPlay}
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

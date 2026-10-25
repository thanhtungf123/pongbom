"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";

const VIEWPORT_MOBILE = "width=device-width, initial-scale=1";
const KEY = "pongbom-view";
// Bề rộng để DÒ layout desktop (>820 để thoát media mobile, < bề rộng thật để
// content tràn ra -> đo được bề rộng thật qua scrollWidth).
const PROBE_WIDTH = 840;

/**
 * Nút chuyển PC/Mobile (chỉ trên thiết bị cảm ứng).
 *  - pref=mobile  -> viewport device-width, nút hiện "Go to Desktop".
 *  - pref=desktop -> viewport 980 (bản PC co vừa màn hình), nút "Go to Mobile".
 * Viewport được áp LẠI sau mỗi lần điều hướng (usePathname) nên bấm vào game
 * KHÔNG còn bị nhảy về mobile — chỉ đổi khi người dùng bấm nút.
 */
export default function ViewToggle() {
  const pathname = usePathname();
  const [pref, setPref] = useState<"mobile" | "desktop">("mobile");
  const [touch, setTouch] = useState(false);
  // Cache nội dung viewport desktop đã tính (để đổi trang không phải dò lại).
  const fitRef = useRef<string | null>(null);

  const metaEl = () =>
    document.querySelector('meta[name="viewport"]') as HTMLMetaElement | null;

  // Dò bề rộng thật của layout desktop rồi đặt initial-scale để co VỪA màn hình.
  const probeDesktop = useCallback(() => {
    const meta = metaEl();
    if (!meta) return;
    meta.setAttribute("content", `width=${PROBE_WIDTH}`);
    // Chờ trình duyệt reflow theo viewport mới rồi mới đo bề rộng thật.
    setTimeout(() => {
      const left = document.querySelector(".site-left") as HTMLElement | null;
      const content = Math.max(
        left?.scrollWidth || 0,
        document.documentElement.scrollWidth,
        980
      );
      const screenW = window.screen?.width || window.innerWidth || content;
      const scale = Math.min(1, screenW / content);
      const v = `width=${content}, initial-scale=${scale}, maximum-scale=5`;
      fitRef.current = v;
      meta.setAttribute("content", v);
    }, 80);
  }, []);

  const applyViewport = useCallback(
    (p: "mobile" | "desktop") => {
      const meta = metaEl();
      if (!meta) return;
      if (p === "desktop") {
        // Đổi trang: dùng lại giá trị đã dò (không nháy); lần đầu thì dò.
        if (fitRef.current) meta.setAttribute("content", fitRef.current);
        else probeDesktop();
      } else {
        meta.setAttribute("content", VIEWPORT_MOBILE);
      }
    },
    [probeDesktop]
  );

  // Thiết bị cảm ứng (phone/tablet) mới cần nút toggle. PC thật: ẩn.
  useEffect(() => {
    try {
      setTouch(window.matchMedia("(pointer: coarse)").matches);
    } catch {
      setTouch(false);
    }
  }, []);

  // Đọc lựa chọn đã lưu khi mount.
  useEffect(() => {
    try {
      if (localStorage.getItem(KEY) === "desktop") setPref("desktop");
    } catch {
      /* ignore */
    }
  }, []);

  // Áp viewport theo pref — chạy lại mỗi khi đổi trang hoặc đổi pref.
  useEffect(() => {
    applyViewport(pref);
  }, [pref, pathname, applyViewport]);

  // Xoay máy khi đang ở desktop -> dò lại để co vừa chiều mới.
  useEffect(() => {
    if (pref !== "desktop") return;
    const onRotate = () => {
      fitRef.current = null;
      probeDesktop();
    };
    window.addEventListener("orientationchange", onRotate);
    return () => window.removeEventListener("orientationchange", onRotate);
  }, [pref, probeDesktop]);

  const setView = (v: "mobile" | "desktop") => {
    try {
      localStorage.setItem(KEY, v);
    } catch {
      /* ignore */
    }
    if (v === "desktop") fitRef.current = null; // bấm chủ động -> dò mới
    setPref(v);
    // Lên đầu trang cho gọn khi đổi chế độ.
    window.scrollTo(0, 0);
  };

  if (!touch) return null;

  const isDesktop = pref === "desktop";
  return (
    <button
      type="button"
      className={`go-desktop${isDesktop ? " view-toggle-float" : ""}`}
      onClick={() => setView(isDesktop ? "mobile" : "desktop")}
    >
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        {isDesktop ? (
          <>
            <rect x="5" y="2" width="14" height="20" rx="2" />
            <path d="M12 18h.01" />
          </>
        ) : (
          <>
            <path d="M14 3h7v7" />
            <path d="M21 3l-9 9" />
            <path d="M21 14v5a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5" />
          </>
        )}
      </svg>
      <span>
        Xem bản
        <br />
        {isDesktop ? "Điện thoại" : "Máy tính"}
      </span>
    </button>
  );
}

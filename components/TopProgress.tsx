"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";

/**
 * Thanh loading mảnh ở TRÊN CÙNG (kiểu NProgress như twoplayergames): khi chuyển
 * trang, NỘI DUNG hiện tại VẪN GIỮ NGUYÊN, chỉ có thanh này chạy ở đỉnh trang.
 * Bắt đầu khi bấm link nội bộ / back-forward; chạy dần tới ~90%; hoàn tất khi
 * route mới render xong (pathname/searchParams đổi).
 */
export default function TopProgress() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [width, setWidth] = useState(0);
  const [active, setActive] = useState(false);
  const [overlay, setOverlay] = useState(false); // lớp phủ + spinner giữa màn hình
  const activeRef = useRef(false);
  const creepRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const doneRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const overlayRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearCreep = () => {
    if (creepRef.current) {
      clearInterval(creepRef.current);
      creepRef.current = null;
    }
  };

  const start = () => {
    if (activeRef.current) return;
    activeRef.current = true;
    if (doneRef.current) {
      clearTimeout(doneRef.current);
      doneRef.current = null;
    }
    setActive(true);
    setWidth(8);
    clearCreep();
    creepRef.current = setInterval(() => {
      setWidth((w) => {
        if (w >= 90) return w;
        const inc = w < 50 ? 9 : w < 75 ? 4 : 1.5;
        return Math.min(90, w + inc);
      });
    }, 240);
    // Chỉ hiện lớp phủ + spinner nếu chuyển trang lâu (>180ms) -> tránh nháy.
    if (overlayRef.current) clearTimeout(overlayRef.current);
    overlayRef.current = setTimeout(() => setOverlay(true), 180);
  };

  const done = () => {
    if (!activeRef.current) return;
    activeRef.current = false;
    clearCreep();
    if (overlayRef.current) {
      clearTimeout(overlayRef.current);
      overlayRef.current = null;
    }
    setOverlay(false);
    setWidth(100);
    doneRef.current = setTimeout(() => {
      setActive(false);
      setWidth(0);
    }, 300);
  };

  // Bắt đầu khi điều hướng nội bộ (click link / nút back-forward).
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (
        e.defaultPrevented ||
        e.button !== 0 ||
        e.metaKey ||
        e.ctrlKey ||
        e.shiftKey ||
        e.altKey
      )
        return;
      const a = (e.target as Element | null)?.closest?.("a");
      if (!a) return;
      const href = a.getAttribute("href");
      const target = a.getAttribute("target");
      if (
        !href ||
        target === "_blank" ||
        href.startsWith("#") ||
        href.startsWith("mailto:") ||
        href.startsWith("tel:")
      )
        return;
      try {
        const url = new URL(href, location.href);
        if (url.origin !== location.origin) return; // link ngoài
        if (url.pathname === location.pathname && url.search === location.search)
          return; // cùng trang
      } catch {
        return;
      }
      start();
    };
    const onPop = () => start();
    document.addEventListener("click", onClick);
    window.addEventListener("popstate", onPop);
    return () => {
      document.removeEventListener("click", onClick);
      window.removeEventListener("popstate", onPop);
    };
  }, []);

  // Hoàn tất khi route mới đã render.
  useEffect(() => {
    done();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname, searchParams]);

  // Dọn timer khi unmount.
  useEffect(
    () => () => {
      clearCreep();
      if (doneRef.current) clearTimeout(doneRef.current);
      if (overlayRef.current) clearTimeout(overlayRef.current);
    },
    []
  );

  return (
    <>
      {(active || width > 0) && (
        <div className="top-progress" aria-hidden="true">
          <div
            className="top-progress-bar"
            style={{ width: `${width}%`, opacity: active ? 1 : 0 }}
          />
        </div>
      )}
      {overlay && (
        <div className="nav-loading" role="status" aria-live="polite">
          <span className="nav-loading-spinner" />
        </div>
      )}
    </>
  );
}

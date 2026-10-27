"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";

/**
 * Loading khi chuyển trang (kiểu NProgress): NỘI DUNG hiện tại VẪN GIỮ NGUYÊN,
 * hiện NGAY thanh mảnh ở đỉnh + lớp phủ mờ + spinner giữa màn hình.
 *
 * - Bắt đầu khi bấm 1 link NỘI BỘ (forward). KHÔNG bắt đầu khi bấm Back/Forward
 *   của trình duyệt (back thường lấy từ cache -> hiện loading sẽ gây kẹt/ảo).
 * - Hoàn tất khi route mới đã render (pathname/searchParams đổi).
 * - Có safety timeout để KHÔNG BAO GIỜ kẹt loading.
 */
export default function TopProgress() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [width, setWidth] = useState(0);
  const [active, setActive] = useState(false);
  const [overlay, setOverlay] = useState(false);
  const activeRef = useRef(false);
  const creepRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const doneRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const safetyRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const overlayRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearTimers = () => {
    if (creepRef.current) clearInterval(creepRef.current);
    if (safetyRef.current) clearTimeout(safetyRef.current);
    if (overlayRef.current) clearTimeout(overlayRef.current);
    creepRef.current = null;
    safetyRef.current = null;
    overlayRef.current = null;
  };

  const start = () => {
    if (activeRef.current) return;
    activeRef.current = true;
    if (doneRef.current) {
      clearTimeout(doneRef.current);
      doneRef.current = null;
    }
    setActive(true);
    // Nhảy NGAY lên ~35% để cảm giác tải nhanh ngay từ đầu (NProgress-style).
    setWidth(35);
    clearTimers();
    // Lớp phủ mờ + spinner CHỈ hiện khi tải LÂU (>450ms). Nav nhanh chỉ thấy
    // thanh đỏ trên cùng -> cảm giác tức thì, không nháy overlay nặng nề.
    overlayRef.current = setTimeout(() => setOverlay(true), 450);
    // Thanh chạy NHANH ở đầu rồi chậm dần về cuối (bước lớn + nhịp ngắn).
    creepRef.current = setInterval(() => {
      setWidth((w) => {
        if (w >= 92) return w;
        const inc = w < 55 ? 22 : w < 78 ? 10 : 3;
        return Math.min(92, w + inc);
      });
    }, 140);
    // An toàn: tự hoàn tất sau 15s nếu vì lý do nào đó không nhận tín hiệu xong.
    safetyRef.current = setTimeout(() => done(), 15000);
  };

  const done = () => {
    if (!activeRef.current) return;
    activeRef.current = false;
    clearTimers();
    setOverlay(false);
    setWidth(100);
    doneRef.current = setTimeout(() => {
      setActive(false);
      setWidth(0);
    }, 200);
  };

  // Bắt đầu khi bấm link nội bộ (forward). KHÔNG bắt vào Back/Forward.
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      // Lưu ý: nghe ở CAPTURE phase để chạy TRƯỚC khi <Link> của React gọi
      // preventDefault() (nếu check e.defaultPrevented ở bubble sẽ luôn bị bỏ qua).
      if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey)
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
    document.addEventListener("click", onClick, true); // capture phase
    return () => document.removeEventListener("click", onClick, true);
  }, []);

  // Hoàn tất khi route mới đã render.
  useEffect(() => {
    done();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname, searchParams]);

  // Cho phép kích hoạt loading thủ công (vd bấm logo khi ĐANG ở trang chủ ->
  // router.refresh không đổi route nên không có tín hiệu từ pathname).
  useEffect(() => {
    const onStart = () => start();
    const onDone = () => done();
    window.addEventListener("pongbom:nav-start", onStart);
    window.addEventListener("pongbom:nav-done", onDone);
    return () => {
      window.removeEventListener("pongbom:nav-start", onStart);
      window.removeEventListener("pongbom:nav-done", onDone);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Dọn timer khi unmount.
  useEffect(
    () => () => {
      clearTimers();
      if (doneRef.current) clearTimeout(doneRef.current);
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

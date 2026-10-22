"use client";

import { useEffect } from "react";

const VIEWPORT_DESKTOP = "width=980";
const VIEWPORT_MOBILE = "width=device-width, initial-scale=1";

/**
 * Nút "Go to Desktop" (chỉ hiện trên mobile) — giống m.twoplayergames.org.
 * Chuyển viewport sang 980px để hiển thị bản desktop, lưu lựa chọn lại.
 */
export default function GoToDesktop() {
  useEffect(() => {
    try {
      if (localStorage.getItem("pongbom-view") === "desktop") {
        document
          .querySelector('meta[name="viewport"]')
          ?.setAttribute("content", VIEWPORT_DESKTOP);
      }
    } catch {
      /* ignore */
    }
  }, []);

  const goDesktop = () => {
    try {
      localStorage.setItem("pongbom-view", "desktop");
    } catch {
      /* ignore */
    }
    document
      .querySelector('meta[name="viewport"]')
      ?.setAttribute("content", VIEWPORT_DESKTOP);
  };

  return (
    <button type="button" className="go-desktop" onClick={goDesktop}>
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14 3h7v7" />
        <path d="M21 3l-9 9" />
        <path d="M21 14v5a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5" />
      </svg>
      <span>
        Go to
        <br />
        Desktop
      </span>
    </button>
  );
}

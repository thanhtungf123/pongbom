"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Widget chia sẻ / nhúng game.
 *  - PC (>820px): nút "</> Embed" (be, nhỏ gọn) như twoplayergames.org; bấm ->
 *    dropdown NỔI (nền sáng mờ, có mũi nhọn) gồm 2 tab EMBED / SHARE + ô input
 *    1 dòng + nút Copy.
 *  - MOBILE (<=820px): 1 nút "Share" (cam) + bảng inline nền mờ nhẹ (giữ nguyên).
 * CSS tự ẩn/hiện nút theo viewport (globals.css + responsive.css).
 */
export default function GameActions({
  slug,
}: {
  slug: string;
  title?: string; // (không dùng — đã bỏ nút X Post)
}) {
  const [origin, setOrigin] = useState("");
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState<"share" | "embed">("share");
  const [copied, setCopied] = useState<"" | "share" | "embed">("");
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setOrigin(window.location.origin);
  }, []);

  // Đóng khi bấm ra ngoài / nhấn Esc.
  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node))
        setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const pageUrl = origin ? `${origin}/game/${slug}` : "";
  const embedUrl = origin ? `${origin}/embed/${slug}` : "";

  const copy = async (which: "share" | "embed") => {
    const text = which === "embed" ? embedUrl : pageUrl;
    try {
      await navigator.clipboard.writeText(text);
      setCopied(which);
      setTimeout(() => setCopied(""), 1600);
    } catch {
      /* clipboard bị chặn -> người dùng tự bôi đen (ô đã select sẵn) */
    }
  };

  // Bấm nút trigger: mở (và chọn tab tương ứng); bấm lại đúng tab đang mở -> đóng.
  const openTab = (e: React.MouseEvent, t: "share" | "embed") => {
    e.preventDefault();
    if (open && tab === t) setOpen(false);
    else {
      setTab(t);
      setOpen(true);
    }
  };

  return (
    <div className="game-page-share-embed" ref={wrapRef}>
      {/* PC: Embed + X Post | Mobile: Share — ẩn/hiện bằng CSS theo viewport */}
      <a
        href="#"
        className={`se-trigger se-trigger-embed${open ? " open" : ""}`}
        onClick={(e) => openTab(e, "embed")}
        aria-expanded={open}
      >
        <span className="monochrome-embed-close" /> Embed
      </a>
      <a
        href="#"
        className={`se-trigger se-trigger-share${open ? " open" : ""}`}
        onClick={(e) => openTab(e, "share")}
        aria-expanded={open}
      >
        <span className="monochrome-share" /> Share
      </a>

      {open && (
        <div className="se-box">
          <div className="se-panel">
            <ul className="se-tabs">
              <li
                className={`se-tab se-tab-share${
                  tab === "share" ? " se-active" : ""
                }`}
                onClick={() => setTab("share")}
              >
                <span className="monochrome-share" /> Share
              </li>
              <li
                className={`se-tab se-tab-embed${
                  tab === "embed" ? " se-active" : ""
                }`}
                onClick={() => setTab("embed")}
              >
                <span className="monochrome-embed-close" /> Embed
              </li>
            </ul>

            <div className={`se-tabc${tab === "share" ? " se-active" : ""}`}>
              <input
                type="text"
                className="se-input"
                readOnly
                value={pageUrl}
                onFocus={(e) => e.currentTarget.select()}
              />
              <button
                type="button"
                className="se-copy"
                onClick={() => copy("share")}
              >
                <span className="monochrome-copy" />{" "}
                {copied === "share" ? "Copied" : "Copy"}
              </button>
            </div>

            <div className={`se-tabc${tab === "embed" ? " se-active" : ""}`}>
              <input
                type="text"
                className="se-input"
                readOnly
                value={embedUrl}
                onFocus={(e) => e.currentTarget.select()}
              />
              <button
                type="button"
                className="se-copy"
                onClick={() => copy("embed")}
              >
                <span className="monochrome-copy" />{" "}
                {copied === "embed" ? "Copied" : "Copy"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

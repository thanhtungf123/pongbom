"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Nút "Share" (cam) ở khung game — theo widget twoplayergames.org:
 * bấm "Share" -> xổ xuống 1 BẢNG (nền mờ nhẹ, có mũi nhọn nhô lên) gồm 2 tab
 * "Share" / "Embed"; mỗi tab là 1 ô input 1 dòng (link game / link nhúng) + Copy.
 */
export default function GameActions({
  slug,
}: {
  slug: string;
  title?: string; // (không dùng — bỏ nút X Post)
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

  const toggle = (e: React.MouseEvent) => {
    e.preventDefault();
    setOpen((o) => !o);
  };

  return (
    <div className="game-page-share-embed" ref={wrapRef}>
      <a
        href="#"
        className={`se-trigger${open ? " open" : ""}`}
        onClick={toggle}
        aria-expanded={open}
      >
        <span className="monochrome-share" /> Share
      </a>

      {open && (
        <div className="se-box">
          <div className="se-panel">
            <ul className="se-tabs">
              <li
                className={`se-tab${tab === "share" ? " se-active" : ""}`}
                onClick={() => setTab("share")}
              >
                <span className="monochrome-share" /> Share
              </li>
              <li
                className={`se-tab${tab === "embed" ? " se-active" : ""}`}
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

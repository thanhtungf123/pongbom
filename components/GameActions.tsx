"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Nút "Chia sẻ" + bảng Chia sẻ/Nhúng — dựng LẠI đúng theo widget gốc của
 * twoplayergames.org (shareEmbed): bấm nút -> hiện DROPDOWN dạng bong bóng
 * (có mũi nhọn) với 2 tab "Chia sẻ" / "Nhúng"; mỗi tab là 1 ô input 1 dòng
 * (link game hoặc mã nhúng iframe) + nút Copy. KHÔNG dùng modal/textarea.
 */
export default function GameActions({
  slug,
}: {
  slug: string;
  title?: string; // (không dùng — widget chỉ cần link/mã nhúng theo slug)
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
  const embedCode = origin
    ? `<iframe src="${origin}/embed/${slug}" width="800" height="600" style="max-width:100%;border:0;" frameborder="0" scrolling="no" allow="autoplay; fullscreen; gamepad" allowfullscreen></iframe>`
    : "";

  const copy = async (which: "share" | "embed") => {
    const text = which === "embed" ? embedCode : pageUrl;
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
        <span className="monochrome-share" /> Chia sẻ
      </a>

      {open && (
        <div className="se-box">
          <div className="se-panel">
            <ul className="se-tabs">
              <li
                className={`se-tab${tab === "share" ? " se-active" : ""}`}
                onClick={() => setTab("share")}
              >
                <span className="monochrome-share" /> Chia sẻ
              </li>
              <li
                className={`se-tab${tab === "embed" ? " se-active" : ""}`}
                onClick={() => setTab("embed")}
              >
                <span className="monochrome-embed-close" /> Nhúng
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
                {copied === "share" ? "Đã copy" : "Copy"}
              </button>
            </div>

            <div className={`se-tabc${tab === "embed" ? " se-active" : ""}`}>
              <input
                type="text"
                className="se-input"
                readOnly
                value={embedCode}
                onFocus={(e) => e.currentTarget.select()}
              />
              <button
                type="button"
                className="se-copy"
                onClick={() => copy("embed")}
              >
                <span className="monochrome-copy" />{" "}
                {copied === "embed" ? "Đã copy" : "Copy"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

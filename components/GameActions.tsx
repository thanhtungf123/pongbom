"use client";

import { useEffect, useState } from "react";

/**
 * Các nút chia sẻ ở khung trò chơi:
 *  - PC: nút "Nhúng" mở bảng lấy mã nhúng; nút "Chia sẻ" dùng chia sẻ hệ thống
 *    (Web Share) hoặc copy link.
 *  - MOBILE: nút "Chia sẻ" mở BẢNG như m.twoplayergames.org — có 2 tab
 *    "Chia sẻ" (copy link game) và "</> Nhúng" (copy mã nhúng), mỗi tab có ô
 *    nội dung + nút Copy.
 */
export default function GameActions({
  slug,
  title,
}: {
  slug: string;
  title: string;
}) {
  const [origin, setOrigin] = useState("");
  const [isMobile, setIsMobile] = useState(false);
  const [panel, setPanel] = useState<null | "share" | "embed">(null);
  const [copied, setCopied] = useState(false);
  const [toast, setToast] = useState("");

  useEffect(() => {
    setOrigin(window.location.origin);
    const mq = window.matchMedia("(max-width: 820px)");
    const update = () => setIsMobile(mq.matches);
    update();
    mq.addEventListener?.("change", update);
    return () => mq.removeEventListener?.("change", update);
  }, []);

  const pageUrl = origin ? `${origin}/game/${slug}` : "";
  const embedCode = `<iframe src="${origin}/embed/${slug}" width="800" height="600" style="max-width:100%;border:0;" frameborder="0" scrolling="no" allow="autoplay; fullscreen; gamepad" allowfullscreen></iframe>`;

  const flash = (m: string) => {
    setToast(m);
    setTimeout(() => setToast(""), 1800);
  };

  const openPanel = (which: "share" | "embed") => {
    setPanel(which);
    setCopied(false);
  };
  const closePanel = () => {
    setPanel(null);
    setCopied(false);
  };

  // Copy nội dung của tab đang mở.
  const copyActive = async () => {
    const text = panel === "embed" ? embedCode : pageUrl;
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      flash("Không copy được — hãy bôi đen và copy thủ công.");
    }
  };

  // Nút "Chia sẻ": mobile -> mở bảng (link + nhúng); PC -> chia sẻ hệ thống/copy.
  const onShare = async () => {
    if (isMobile) {
      openPanel("share");
      return;
    }
    const nav = navigator as Navigator & {
      share?: (d: { title?: string; url?: string }) => Promise<void>;
    };
    if (nav.share) {
      try {
        await nav.share({ title, url: pageUrl });
      } catch {
        /* người dùng hủy */
      }
    } else {
      try {
        await navigator.clipboard.writeText(pageUrl);
        flash("Đã copy link game!");
      } catch {
        flash(pageUrl);
      }
    }
  };

  return (
    <>
      <button
        type="button"
        className="gp-embed-btn"
        onClick={() => openPanel("embed")}
      >
        &lt;/&gt; Nhúng
      </button>
      <button type="button" className="gp-share-btn" onClick={onShare}>
        ↗ Chia sẻ
      </button>

      {panel && (
        <div className="share-sheet-overlay" onClick={closePanel}>
          <div className="share-sheet" onClick={(e) => e.stopPropagation()}>
            <div className="share-sheet-head">
              <div className="share-tabs">
                <button
                  type="button"
                  className={`share-tab${panel === "share" ? " active" : ""}`}
                  onClick={() => openPanel("share")}
                >
                  ↗ Chia sẻ
                </button>
                <button
                  type="button"
                  className={`share-tab${panel === "embed" ? " active" : ""}`}
                  onClick={() => openPanel("embed")}
                >
                  &lt;/&gt; Nhúng
                </button>
              </div>
              <button
                type="button"
                className="share-sheet-close"
                onClick={closePanel}
                aria-label="Đóng"
              >
                ×
              </button>
            </div>

            {panel === "share" ? (
              <>
                <p className="share-sheet-desc">
                  Sao chép link để chia sẻ game này:
                </p>
                <div className="share-copy-row">
                  <input
                    className="share-link"
                    readOnly
                    value={pageUrl}
                    onFocus={(e) => e.currentTarget.select()}
                  />
                  <button type="button" className="btn-copy" onClick={copyActive}>
                    {copied ? "✓ Đã copy" : "Copy"}
                  </button>
                </div>
              </>
            ) : (
              <>
                <p className="share-sheet-desc">
                  Sao chép mã nhúng dưới đây và dán vào website của bạn:
                </p>
                <textarea
                  className="embed-code"
                  readOnly
                  rows={4}
                  value={embedCode}
                  onFocus={(e) => e.currentTarget.select()}
                />
                <div className="share-copy-row share-copy-row-right">
                  <button type="button" className="btn-copy" onClick={copyActive}>
                    {copied ? "✓ Đã copy" : "Copy mã"}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {toast && <div className="share-toast">{toast}</div>}
    </>
  );
}

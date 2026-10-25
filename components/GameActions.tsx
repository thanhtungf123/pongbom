"use client";

import { useEffect, useState } from "react";

/**
 * Các nút chia sẻ ở khung trò chơi: Embed (lấy mã nhúng), X Post (đăng lên X),
 * Share (chia sẻ trên mobile). Trước đây chỉ là nút tĩnh — nay hoạt động thật.
 */
export default function GameActions({
  slug,
  title,
}: {
  slug: string;
  title: string;
}) {
  const [origin, setOrigin] = useState("");
  const [showEmbed, setShowEmbed] = useState(false);
  const [copied, setCopied] = useState(false);
  const [toast, setToast] = useState("");

  useEffect(() => {
    setOrigin(window.location.origin);
  }, []);

  const pageUrl = origin ? `${origin}/game/${slug}` : "";
  const embedCode = `<iframe src="${origin}/embed/${slug}" width="800" height="600" style="max-width:100%;border:0;" frameborder="0" scrolling="no" allow="autoplay; fullscreen; gamepad" allowfullscreen></iframe>`;

  const flash = (m: string) => {
    setToast(m);
    setTimeout(() => setToast(""), 1800);
  };

  const copyEmbed = async () => {
    try {
      await navigator.clipboard.writeText(embedCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      flash("Không copy được — hãy bôi đen và copy thủ công.");
    }
  };

  const share = async () => {
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
      <button type="button" className="gp-embed-btn" onClick={() => setShowEmbed(true)}>
        &lt;/&gt; Nhúng
      </button>
      <button type="button" className="gp-share-btn" onClick={share}>
        ↗ Chia sẻ
      </button>

      {showEmbed && (
        <div className="embed-modal-overlay" onClick={() => setShowEmbed(false)}>
          <div className="embed-modal" onClick={(e) => e.stopPropagation()}>
            <div className="embed-modal-head">
              <h3>Nhúng game này vào website</h3>
              <button
                type="button"
                className="embed-modal-close"
                onClick={() => setShowEmbed(false)}
                aria-label="Đóng"
              >
                ×
              </button>
            </div>
            <p className="embed-modal-desc">
              Sao chép đoạn mã dưới đây và dán vào trang web của bạn:
            </p>
            <textarea
              className="embed-code"
              readOnly
              value={embedCode}
              rows={4}
              onFocus={(e) => e.currentTarget.select()}
            />
            <div className="embed-modal-actions">
              <button type="button" className="btn-copy" onClick={copyEmbed}>
                {copied ? "✓ Đã copy" : "Copy mã"}
              </button>
            </div>
          </div>
        </div>
      )}

      {toast && <div className="share-toast">{toast}</div>}
    </>
  );
}

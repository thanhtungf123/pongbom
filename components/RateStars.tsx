"use client";

import { useEffect, useState } from "react";

/**
 * Sao đánh giá do NGƯỜI DÙNG chấm (1–5). Hiển thị điểm trung bình hiện tại
 * bằng thanh sao lấp (giống bản tĩnh cũ), đồng thời cho bấm để chấm.
 * Mỗi trình duyệt chỉ chấm 1 lần (chặn bằng localStorage).
 */
export default function RateStars({
  slug,
  rating,
  count,
}: {
  slug: string;
  rating: number;
  count: number;
}) {
  const [avg, setAvg] = useState(rating);
  const [cnt, setCnt] = useState(count);
  const [hover, setHover] = useState(0);
  const [rated, setRated] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    try {
      if (localStorage.getItem(`rated:${slug}`)) setRated(true);
    } catch {
      /* ignore */
    }
  }, [slug]);

  const pct = ((hover || avg) / 5) * 100;

  const submit = async (v: number) => {
    if (rated || busy) return;
    setBusy(true);
    try {
      const r = await fetch(`/api/games/${slug}/rate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ value: v }),
      });
      const j = await r.json();
      if (r.ok) {
        setAvg(j.rating);
        setCnt(j.ratingCount);
        setRated(true);
        try {
          localStorage.setItem(`rated:${slug}`, String(v));
        } catch {
          /* ignore */
        }
      }
    } catch {
      /* ignore */
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="rate-box">
      <div className="game-star-rating-wrapper">
        <div
          className={`stars rate-stars${rated ? " rated" : ""}`}
          aria-label="Chấm điểm game"
          onMouseLeave={() => setHover(0)}
        >
          <span className="stars-fill" style={{ width: `${pct}%` }} />
          {!rated &&
            [1, 2, 3, 4, 5].map((v) => (
              <button
                key={v}
                type="button"
                className="star-hit"
                aria-label={`${v} sao`}
                onMouseEnter={() => setHover(v)}
                onClick={() => submit(v)}
                disabled={busy}
              />
            ))}
        </div>
        <div className="game-score">
          <span id="rating">{avg.toFixed(1)}</span>
        </div>
      </div>
      <div className="rate-note">
        {rated ? "Cảm ơn bạn đã chấm điểm!" : "Bấm vào sao để chấm điểm"}
        {cnt > 0 && ` · ${cnt.toLocaleString()} lượt`}
      </div>
    </div>
  );
}

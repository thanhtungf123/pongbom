"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import type { Game } from "@/lib/types";

// Ô game — markup y hệt mirror: <li><a><div.image><img></div><div.title></a></li>
// Nếu game có thumbnailVideo: rê chuột vào (PC) sẽ phát video xem trước.
export default function GameCard({ game }: { game: Game }) {
  const hasVideo = !!game.thumbnailVideo;
  const videoRef = useRef<HTMLVideoElement>(null);
  const [showVideo, setShowVideo] = useState(false);

  const onEnter = () => {
    if (!hasVideo) return;
    setShowVideo(true);
    const v = videoRef.current;
    if (v) {
      // Nạp src trễ: chỉ gán khi cần để không tải video cho mọi ô.
      if (!v.src) v.src = game.thumbnailVideo as string;
      v.currentTime = 0;
      v.play().catch(() => {});
    }
  };

  const onLeave = () => {
    if (!hasVideo) return;
    setShowVideo(false);
    videoRef.current?.pause();
  };

  return (
    <li onMouseEnter={onEnter} onMouseLeave={onLeave}>
      <Link href={`/game/${game.slug}`} title={game.title}>
        {game.isNew && <span className="new-band">new</span>}
        <div className="image">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={game.thumbnail}
            width={100}
            height={75}
            alt={game.title}
            draggable={false}
          />
          {hasVideo && (
            <video
              ref={videoRef}
              className={`card-video${showVideo ? " show" : ""}`}
              muted
              loop
              playsInline
              preload="none"
              aria-hidden="true"
            />
          )}
        </div>
        <div className="title">{game.title}</div>
      </Link>
    </li>
  );
}

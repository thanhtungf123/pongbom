"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import type { Game } from "@/lib/types";

// Ô game — markup y hệt mirror: <li><a><div.image><img></div><div.title></a></li>
// Video xem trước CHỈ bật trên thiết bị có hover thật (PC). Trên mobile không
// hover nên bỏ hẳn video (tránh nạp video khi chạm -> gây lag lúc mở game).
export default function GameCard({
  game,
  animate,
}: {
  game: Game;
  animate?: boolean;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [canHover, setCanHover] = useState(false);
  const [showVideo, setShowVideo] = useState(false);

  useEffect(() => {
    try {
      setCanHover(
        window.matchMedia("(hover: hover) and (pointer: fine)").matches
      );
    } catch {
      setCanHover(false);
    }
  }, []);

  const hasVideo = !!game.thumbnailVideo && canHover;

  const onEnter = () => {
    setShowVideo(true);
    const v = videoRef.current;
    if (v) {
      if (!v.src) v.src = game.thumbnailVideo as string; // nạp trễ
      v.currentTime = 0;
      v.play().catch(() => {});
    }
  };

  const onLeave = () => {
    setShowVideo(false);
    videoRef.current?.pause();
  };

  return (
    <li
      className={animate ? "card-animate-in" : undefined}
      onMouseEnter={hasVideo ? onEnter : undefined}
      onMouseLeave={hasVideo ? onLeave : undefined}
    >
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

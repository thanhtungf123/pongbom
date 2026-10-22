import Link from "next/link";
import type { Game } from "@/lib/types";

// Ô game — markup y hệt mirror: <li><a><div.image><img></div><div.title></a></li>
export default function GameCard({ game }: { game: Game }) {
  return (
    <li>
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
        </div>
        <div className="title">{game.title}</div>
      </Link>
    </li>
  );
}

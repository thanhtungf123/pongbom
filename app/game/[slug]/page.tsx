import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import GamePlayer from "@/components/GamePlayer";
import Track from "@/components/Track";
import RateStars from "@/components/RateStars";
import { getGame } from "@/lib/store";

export const dynamic = "force-dynamic";

type Params = { slug: string };

const CAT_EMOJI: Record<string, string> = {
  "2 Player": "🎮",
  Arcade: "👾",
  Ball: "⚽",
  Skill: "🎯",
};

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>;
}): Promise<Metadata> {
  const { slug } = await params;
  const game = await getGame(slug);
  if (!game) return { title: "Game not found" };
  return {
    title: game.titleTag || game.title,
    description: game.metaDescription || game.shortDescription,
    robots: {
      index: game.robotsIndex !== false,
      follow: game.robotsFollow !== false,
    },
    openGraph: {
      title: game.title,
      description: game.metaDescription || game.shortDescription,
      images: [game.thumbnail],
      type: "website",
    },
  };
}

export default async function GamePage({
  params,
}: {
  params: Promise<Params>;
}) {
  const { slug } = await params;
  const game = await getGame(slug);
  if (!game || game.visible === false) notFound();

  return (
    <>
      <Track type="play" slug={game.slug} />
      {/* Khung game */}
      <div className="game-page-top">
        <div className="game-page-top-left">
          <GamePlayer game={game} />
        </div>
      </div>

      {/* Bảng thông tin game */}
      <div className="game-page-bottom">
        <div className="game-page-bottom-top">
          <div className="game-page-title">
            <h1>{game.h1 || game.title}</h1>
          </div>
          <div className="game-page-title-img">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              className="game-page-img"
              src={game.thumbnail}
              height={50}
              width={65}
              alt={game.title}
              title={game.title}
            />
          </div>
          <div className="game-page-rate">
            <RateStars
              slug={game.slug}
              rating={game.rating}
              count={game.ratingCount || 0}
            />
          </div>
          <div className="game-page-social">
            <button type="button" className="gp-embed-btn">
              &lt;/&gt; Embed
            </button>
            <button type="button" className="gp-post-btn">
              𝕏 Post
            </button>
            <button type="button" className="gp-share-btn">
              ↗ Share
            </button>
          </div>
        </div>

        <div className="game-page-description">
          {game.descriptionHtml ? (
            <div
              className="game-page-description-content"
              dangerouslySetInnerHTML={{ __html: game.descriptionHtml }}
            />
          ) : (
            <div className="game-page-description-content">
              <p>{game.shortDescription}</p>
            </div>
          )}
        </div>

        <div className="gp-categories">
          <ul className="gp-category-items">
            {game.categories.map((c) => (
              <li key={c}>
                <Link href={`/?category=${encodeURIComponent(c)}`} title={`${c} Games`}>
                  <span className="icon">{CAT_EMOJI[c] ?? "🎲"}</span>
                  <span>{c}</span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </>
  );
}

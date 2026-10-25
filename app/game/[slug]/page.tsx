import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import GamePlayer from "@/components/GamePlayer";
import RateStars from "@/components/RateStars";
import GameActions from "@/components/GameActions";
import GameCard from "@/components/GameCard";
import {
  getGame,
  getRelatedGames,
  getVisibleCategories,
} from "@/lib/store";
import { categoryPath } from "@/lib/slug";

export const dynamic = "force-dynamic";

type Params = { slug: string };

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

  // Icon category thật (lấy từ danh sách category admin quản lý).
  const categories = await getVisibleCategories();
  const iconOf = new Map(categories.map((c) => [c.label, c.icon]));

  // Game liên quan (cùng category, random tối đa 21 — chỉ hiện trên PC).
  const related = await getRelatedGames(game.categories || [], game.slug, 21);

  return (
    <>
      {/* Lượt chơi được đếm khi người dùng bấm "Let's Play!" (trong GamePlayer),
          không đếm lúc mở trang. */}
      {/* Khung game */}
      <div className="game-page-top">
        <div className="game-page-top-left">
          <GamePlayer game={game} />
        </div>
      </div>

      {/* Game liên quan — ngay dưới khung game, trên phần tên + mô tả.
          Chỉ hiển thị trên PC (ẩn ở mobile qua responsive.css). */}
      {related.length > 0 && (
        <section className="related-games">
          <div className="module-heading space-between">
            <div className="trending-title">
              <h2>
                <span className="icon monochrome-gamepad" /> You may also like
              </h2>
            </div>
          </div>
          <ul className="game-list">
            {related.map((g) => (
              <GameCard key={g.slug} game={g} />
            ))}
          </ul>
        </section>
      )}

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
            <GameActions slug={game.slug} title={game.title} />
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
            {game.categories.map((c) => {
              const icon = iconOf.get(c);
              return (
                <li key={c}>
                  <Link href={categoryPath(c)} title={`${c} Games`}>
                    {icon && icon.startsWith("monochrome-") ? (
                      <span className={`cat-icon ${icon}`} />
                    ) : (
                      <span className="cat-icon cat-icon-emoji">
                        {icon || "🎲"}
                      </span>
                    )}
                    <span>{c}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      </div>
    </>
  );
}

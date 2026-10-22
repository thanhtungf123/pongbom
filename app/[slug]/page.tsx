import { notFound } from "next/navigation";
import type { Metadata } from "next";
import GameCard from "@/components/GameCard";
import {
  getCategoryBySlug,
  getGamesByCategory,
  getPage,
} from "@/lib/store";

export const dynamic = "force-dynamic";

type Params = { slug: string };

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>;
}): Promise<Metadata> {
  const { slug } = await params;

  // Ưu tiên: trang danh mục lưu trữ (/{category})
  const cat = await getCategoryBySlug(slug);
  if (cat) {
    return {
      title: `${cat.label} Games - chơi miễn phí`,
      description: `Tổng hợp các game ${cat.label} chơi trực tiếp trên trình duyệt.`,
    };
  }

  const page = await getPage(slug);
  if (!page) return { title: "Not found" };
  return {
    title: page.titleTag || page.h1,
    description: page.metaDescription,
    robots: {
      index: page.robotsIndex !== false,
      follow: page.robotsFollow !== false,
    },
  };
}

export default async function DynamicPage({
  params,
}: {
  params: Promise<Params>;
}) {
  const { slug } = await params;

  // 1) Trang danh mục lưu trữ: /{category} (vd /2-player, /action)
  const cat = await getCategoryBySlug(slug);
  if (cat) {
    const games = await getGamesByCategory(cat.label);
    return (
      <>
        <div className="module-heading space-between">
          <div className="trending-title">
            <h1>
              {cat.icon && cat.icon.startsWith("monochrome-") ? (
                <span className={`icon ${cat.icon}`} />
              ) : (
                <span className="icon">{cat.icon || "🎲"}</span>
              )}{" "}
              {cat.label} Games
            </h1>
          </div>
          <div className="game-history" />
        </div>

        {games.length > 0 ? (
          <ul className="game-list">
            {games.map((g) => (
              <GameCard key={g.slug} game={g} />
            ))}
          </ul>
        ) : (
          <p className="home-section-empty">
            Chưa có game nào trong danh mục {cat.label}.
          </p>
        )}
      </>
    );
  }

  // 2) Trang tĩnh do admin tạo: /{slug}
  const page = await getPage(slug);
  if (!page || page.visible === false) notFound();

  return (
    <article className="static-page">
      <h1>{page.h1}</h1>
      <div dangerouslySetInnerHTML={{ __html: page.contentHtml }} />
    </article>
  );
}

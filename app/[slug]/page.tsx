import { notFound } from "next/navigation";
import type { Metadata } from "next";
import GameCard from "@/components/GameCard";
import Pagination from "@/components/Pagination";
import {
  getCategoryBySlug,
  getGamesByCategoryPaged,
  getPage,
  getSite,
} from "@/lib/store";
import { categoryPath } from "@/lib/slug";

export const dynamic = "force-dynamic";

const PAGE_SIZE = 21; // 3 hàng × 7 game

type Params = { slug: string };
type Search = { page?: string };

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
      title: `${cat.label} Games`,
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
  searchParams,
}: {
  params: Promise<Params>;
  searchParams: Promise<Search>;
}) {
  const { slug } = await params;
  const { page: pageParam } = await searchParams;
  const pageNum = Math.max(1, parseInt(pageParam || "1", 10) || 1);

  // 1) Trang danh mục lưu trữ: /{category} (vd /2-player, /action)
  const cat = await getCategoryBySlug(slug);
  if (cat) {
    const site = await getSite();
    const { games, total } = await getGamesByCategoryPaged(
      cat.label,
      pageNum,
      PAGE_SIZE,
      site.priorityCategories || []
    );
    const totalPages = Math.ceil(total / PAGE_SIZE);
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
          <>
            <ul className="game-list">
              {games.map((g) => (
                <GameCard key={g.slug} game={g} />
              ))}
            </ul>
            <Pagination
              page={pageNum}
              totalPages={totalPages}
              basePath={categoryPath(cat.label)}
            />
          </>
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

import type { Metadata } from "next";
import GameGrid from "@/components/GameGrid";
import GameHistory from "@/components/GameHistory";
import { searchGames } from "@/lib/store";

export const dynamic = "force-dynamic";

const PAGE_SIZE = 21; // 3 hàng × 7 game

type Search = { q?: string; page?: string };

export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<Search>;
}): Promise<Metadata> {
  const { q } = await searchParams;
  const term = (q || "").trim();
  return {
    title: term ? `Tìm kiếm: ${term}` : "Tìm kiếm",
    alternates: { canonical: "/search" },
    robots: { index: false, follow: true },
  };
}

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<Search>;
}) {
  const { q, page: pageParam } = await searchParams;
  const term = (q || "").trim();
  const page = Math.max(1, parseInt(pageParam || "1", 10) || 1);

  const { games, total } = term
    ? await searchGames(term, page, PAGE_SIZE)
    : { games: [], total: 0 };

  return (
    <>
      <div className="module-heading space-between">
        <div className="trending-title">
          <h1>
            <span className="icon monochrome-search" />{" "}
            {term ? (
              <>
                Kết quả cho “{term}” ({total})
              </>
            ) : (
              "Tìm kiếm game"
            )}
          </h1>
        </div>
        <GameHistory />
      </div>

      {!term ? (
        <p className="home-section-empty">Nhập từ khóa để tìm game.</p>
      ) : games.length > 0 ? (
        <GameGrid
          initial={games}
          total={total}
          page={page}
          pageSize={PAGE_SIZE}
          basePath="/search"
          query={{ q: term }}
          source={{ q: term }}
        />
      ) : (
        <p className="home-section-empty">
          Không tìm thấy game nào khớp “{term}”. Thử từ khóa khác nhé.
        </p>
      )}
    </>
  );
}

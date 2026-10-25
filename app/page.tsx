import GameCard from "@/components/GameCard";
import GameGrid from "@/components/GameGrid";
import GameHistory from "@/components/GameHistory";
import { getSite, getSectionGames, getVisibleGamesPaged } from "@/lib/store";

export const dynamic = "force-dynamic";

const PAGE_SIZE = 21; // 3 hàng × 7 game

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const site = await getSite();
  const sections = site.homeSections || [];
  const { page: pageParam } = await searchParams;
  const page = Math.max(1, parseInt(pageParam || "1", 10) || 1);

  // Chưa cấu hình khối nào -> hiển thị mặc định "Top Games" như trước.
  if (sections.length === 0) {
    const { games, total } = await getVisibleGamesPaged(page, PAGE_SIZE);
    return (
      <>
        <div className="module-heading space-between">
          <div className="trending-title">
            <h1>
              <span className="icon monochrome-hot" /> Game nổi bật
            </h1>
          </div>
          <GameHistory />
        </div>
        <GameGrid
          initial={games}
          total={total}
          page={page}
          pageSize={PAGE_SIZE}
          basePath="/"
        />

        {site.homeContentHtml && (
          <div
            className="home-content"
            dangerouslySetInnerHTML={{ __html: site.homeContentHtml }}
          />
        )}
      </>
    );
  }

  // Lấy game cho từng khối (song song).
  const lists = await Promise.all(
    sections.map((s) =>
      getSectionGames(
        s.category || "",
        s.mode === "new" ? "new" : "top",
        s.limit || 14
      )
    )
  );

  return (
    <>
      {sections.map((s, i) => (
        <section className="home-section" key={i}>
          <div className="module-heading space-between">
            <div className="trending-title">
              {i === 0 ? (
                <h1>
                  <span
                    className={`icon ${
                      s.mode === "new" ? "monochrome-history" : "monochrome-hot"
                    }`}
                  />{" "}
                  {s.title}
                </h1>
              ) : (
                <h2>
                  <span
                    className={`icon ${
                      s.mode === "new" ? "monochrome-history" : "monochrome-hot"
                    }`}
                  />{" "}
                  {s.title}
                </h2>
              )}
            </div>
            {i === 0 && <GameHistory />}
          </div>
          <ul className="game-list">
            {lists[i].length > 0 ? (
              lists[i].map((g) => <GameCard key={g.slug} game={g} />)
            ) : (
              <li className="home-section-empty">Chưa có game trong mục này.</li>
            )}
          </ul>
        </section>
      ))}

      {site.homeContentHtml && (
        <div
          className="home-content"
          dangerouslySetInnerHTML={{ __html: site.homeContentHtml }}
        />
      )}
    </>
  );
}

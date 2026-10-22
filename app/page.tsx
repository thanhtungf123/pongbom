import GameCard from "@/components/GameCard";
import PlaceholderCard from "@/components/PlaceholderCard";
import { getSite, getSectionGames, getVisibleGames } from "@/lib/store";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const site = await getSite();
  const sections = site.homeSections || [];

  // Chưa cấu hình khối nào -> hiển thị mặc định "Top Games" như trước.
  if (sections.length === 0) {
    const games = await getVisibleGames(60);
    const placeholders = Array.from({ length: 23 });
    return (
      <>
        <div className="module-heading space-between">
          <div className="trending-title">
            <h1>
              <span className="icon monochrome-hot" /> Top Games
            </h1>
          </div>
          <div className="game-history" />
        </div>
        <ul className="game-list">
          {games.map((game) => (
            <GameCard key={game.slug} game={game} />
          ))}
          {placeholders.map((_, i) => (
            <PlaceholderCard key={i} seed={i} />
          ))}
        </ul>
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

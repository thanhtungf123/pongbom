import Link from "next/link";
import ViewToggle from "@/components/ViewToggle";
import GameBox from "@/components/GameBox";
import TopMenu from "@/components/TopMenu";
import { getSite, getVisibleCategories } from "@/lib/store";

export default async function Header() {
  const [site, categories] = await Promise.all([
    getSite(),
    getVisibleCategories(),
  ]);

  return (
    <>
      <div className="top-space">
        {/* Logo: ảnh nếu admin đặt, không thì chữ nhiều màu mặc định */}
        <div className="logo">
          <Link href="/" title={site.siteName}>
            {site.logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={site.logoUrl}
                alt={site.siteName}
                style={{ maxHeight: 78, width: "auto" }}
              />
            ) : (
              <>
                <span className="brand-faces">👦👧</span>
                <span className="brand-word">
                  <span className="brand-pong">PONG</span>
                  <span className="brand-bom">BOM</span>
                  <span className="brand-dot">.fun</span>
                </span>
              </>
            )}
          </Link>
        </div>

        <div className="top-game-box">
          <GameBox />
        </div>

        <div className="top-search">
          <form action="/search">
            <div className="top-search-input-container">
              <input
                name="q"
                className="search-input"
                type="text"
                title="Game search"
                placeholder="Search..."
              />
              <button className="search-button" type="submit" aria-label="Search">
                <span className="monochrome-search" />
              </button>
            </div>
          </form>
        </div>

        <ViewToggle />
      </div>

      <div className="site-top-container">
        <div className="site-top-left" />
        <div className="site-top">
          <TopMenu categories={categories} />
        </div>
        <div className="site-top-right" />
      </div>
    </>
  );
}

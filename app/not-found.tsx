import Link from "next/link";
import GamePager from "@/components/GamePager";
import { getNewestGames } from "@/lib/store";

export const dynamic = "force-dynamic";

export default async function NotFound() {
  // Gợi ý game mới nhất: tối đa 5 trang × 21 game.
  const games = await getNewestGames(105);

  return (
    <>
      <section className="notfound">
        <div className="notfound-code">404</div>
        <h1 className="notfound-title">Rất tiếc, không tìm thấy trang này</h1>
        <p className="notfound-text">
          Trang bạn tìm có thể đã bị xóa, đổi đường dẫn hoặc chưa từng tồn tại.
        </p>
        <Link href="/" className="notfound-home">
          <span className="cat-icon monochrome-home" /> Về trang chủ
        </Link>
      </section>

      {games.length > 0 && (
        <section className="notfound-suggest">
          <div className="module-heading space-between">
            <div className="trending-title">
              <h2>
                <span className="icon monochrome-history" /> Trải nghiệm các game
                mới dưới đây
              </h2>
            </div>
          </div>
          <GamePager games={games} pageSize={21} maxPages={5} />
        </section>
      )}
    </>
  );
}

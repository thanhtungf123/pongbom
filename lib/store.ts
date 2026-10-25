// Tầng service: toàn bộ truy cập dữ liệu đi qua đây (MongoDB Atlas).
// API routes + trang chỉ gọi các hàm này — dễ bảo trì, dễ scale.
import { dbConnect } from "./db/connect";
import {
  GameModel,
  PageModel,
  SiteModel,
  CategoryModel,
  CounterModel,
  CLEAN,
} from "./db/models";
import type { PipelineStage } from "mongoose";
import type { Category, Game, Page, SiteSettings, StatsSummary } from "./types";
import { slugify } from "./slug";

/* ===================== GAMES ===================== */

export async function getGames(): Promise<Game[]> {
  await dbConnect();
  return GameModel.find({}, CLEAN).sort({ order: 1 }).lean() as unknown as Game[];
}

/**
 * Tập slug các game được coi là "mới" (hiện nhãn NEW tự động).
 * Quy tắc: game thêm trong vòng `newBadgeDays` ngày VÀ nằm trong `newBadgeCount`
 * game mới nhất. Vượt 1 trong 2 ngưỡng -> tự mất nhãn. Cấu hình ở Site settings.
 */
export async function getNewSlugs(): Promise<Set<string>> {
  await dbConnect();
  const site = await getSite();
  const days = site.newBadgeDays ?? 30;
  const count = site.newBadgeCount ?? 12;
  if (days <= 0 || count <= 0) return new Set();
  const cutoff = new Date(Date.now() - days * 86400000);
  const rows = (await GameModel.find(
    { visible: { $ne: false }, createdAt: { $gte: cutoff } },
    { slug: 1, _id: 0 }
  )
    .sort({ createdAt: -1 })
    .limit(count)
    .lean()) as unknown as { slug: string }[];
  return new Set(rows.map((r) => r.slug));
}

/** Gắn nhãn NEW tự động vào danh sách game (giữ cả nhãn "ghim" thủ công). */
async function markNew(games: Game[]): Promise<Game[]> {
  if (!games.length) return games;
  const set = await getNewSlugs();
  return games.map((g) => ({
    ...g,
    isNew: Boolean(g.isNew) || set.has(g.slug),
  }));
}

/** Game hiển thị công khai (visible !== false), có thể giới hạn số lượng. */
export async function getVisibleGames(limit?: number): Promise<Game[]> {
  await dbConnect();
  const q = GameModel.find({ visible: { $ne: false } }, CLEAN).sort({ order: 1 });
  if (limit) q.limit(limit);
  return q.lean() as unknown as Game[];
}

/** Game hiển thị công khai, phân trang. Trả về danh sách + tổng số. */
export async function getVisibleGamesPaged(
  page: number,
  pageSize: number
): Promise<{ games: Game[]; total: number }> {
  await dbConnect();
  const p = Math.max(1, Math.floor(page) || 1);
  const filter = { visible: { $ne: false } };
  const [games, total] = await Promise.all([
    GameModel.find(filter, CLEAN)
      .sort({ order: 1 })
      .skip((p - 1) * pageSize)
      .limit(pageSize)
      .lean() as unknown as Promise<Game[]>,
    GameModel.countDocuments(filter),
  ]);
  return { games: await markNew(games), total };
}

/**
 * Tìm game theo từ khóa (title / mô tả ngắn / category), phân trang.
 * Khớp không phân biệt hoa thường; sắp theo lượt chơi (phổ biến lên trước).
 */
export async function searchGames(
  q: string,
  page: number,
  pageSize: number
): Promise<{ games: Game[]; total: number }> {
  await dbConnect();
  const term = (q || "").trim();
  if (!term) return { games: [], total: 0 };
  const safe = term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"); // escape regex
  const rx = new RegExp(safe, "i");
  const filter = {
    visible: { $ne: false },
    $or: [{ title: rx }, { shortDescription: rx }, { categories: rx }],
  };
  const p = Math.max(1, Math.floor(page) || 1);
  const [games, total] = await Promise.all([
    GameModel.find(filter, CLEAN)
      .sort({ plays: -1 })
      .skip((p - 1) * pageSize)
      .limit(pageSize)
      .lean() as unknown as Promise<Game[]>,
    GameModel.countDocuments(filter),
  ]);
  return { games: await markNew(games), total };
}

/** Game mới nhất (theo thời điểm tạo) — dùng cho trang 404. */
export async function getNewestGames(limit = 105): Promise<Game[]> {
  await dbConnect();
  const games = (await GameModel.find({ visible: { $ne: false } }, CLEAN)
    .sort({ createdAt: -1 })
    .limit(limit)
    .lean()) as unknown as Game[];
  return markNew(games);
}

/**
 * Game liên quan: cùng ít nhất 1 category với game đang xem, lấy ngẫu nhiên.
 * Dùng dưới khung game (chỉ hiển thị trên PC).
 */
export async function getRelatedGames(
  categories: string[],
  excludeSlug: string,
  limit = 21
): Promise<Game[]> {
  await dbConnect();
  if (!categories || categories.length === 0) return [];
  const rows = (await GameModel.aggregate([
    {
      $match: {
        visible: { $ne: false },
        slug: { $ne: excludeSlug },
        categories: { $in: categories },
      },
    },
    { $sample: { size: limit } },
    { $project: { _id: 0, __v: 0, createdAt: 0, updatedAt: 0 } },
  ])) as unknown as Game[];
  return markNew(rows);
}

export async function getGame(slug: string): Promise<Game | null> {
  await dbConnect();
  return GameModel.findOne({ slug }, CLEAN).lean() as unknown as Game | null;
}

/**
 * Lấy game cho 1 khối trang chủ.
 *  - category rỗng = tất cả game hiển thị.
 *  - mode "top" = nhiều lượt chơi nhất; "new" = mới thêm gần đây nhất.
 */
export async function getSectionGames(
  category: string,
  mode: "top" | "new",
  limit: number
): Promise<Game[]> {
  await dbConnect();
  const filter: Record<string, unknown> = { visible: { $ne: false } };
  if (category) filter.categories = category;
  const sort: Record<string, -1 | 1> =
    mode === "new" ? { createdAt: -1 } : { plays: -1 };
  const games = (await GameModel.find(filter, CLEAN)
    .sort(sort)
    .limit(limit > 0 ? limit : 14)
    .lean()) as unknown as Game[];
  return markNew(games);
}

export async function upsertGame(game: Game): Promise<void> {
  await dbConnect();
  const existing = await GameModel.findOne({ slug: game.slug }).lean();
  const order =
    game.order ??
    ((existing as { order?: number } | null)?.order ??
      (await GameModel.countDocuments()));
  await GameModel.updateOne(
    { slug: game.slug },
    { $set: { ...game, order } },
    { upsert: true }
  );
}

export async function deleteGame(slug: string): Promise<void> {
  await dbConnect();
  await GameModel.deleteOne({ slug });
}

/**
 * Người dùng chấm điểm 1 game (1–5 sao). Cộng dồn tổng điểm + số lượt rồi tính
 * lại điểm trung bình. Trả về điểm mới và số lượt chấm.
 */
export async function rateGame(
  slug: string,
  value: number
): Promise<{ rating: number; ratingCount: number } | null> {
  await dbConnect();
  const v = Math.max(1, Math.min(5, Math.round(value)));
  const doc = (await GameModel.findOneAndUpdate(
    { slug },
    { $inc: { ratingSum: v, ratingCount: 1 } },
    { new: true }
  ).lean()) as unknown as
    | { ratingSum?: number; ratingCount?: number }
    | null;
  if (!doc) return null;
  const sum = doc.ratingSum || 0;
  const count = doc.ratingCount || 0;
  const rating = count ? Math.round((sum / count) * 10) / 10 : 0;
  await GameModel.updateOne({ slug }, { $set: { rating } });
  return { rating, ratingCount: count };
}

export async function getAllCategories(): Promise<string[]> {
  const games = await getVisibleGames();
  const set = new Set<string>();
  games.forEach((g) => (g.categories || []).forEach((c) => set.add(c)));
  return Array.from(set).sort();
}

/* ===================== PAGES ===================== */

export async function getPages(): Promise<Page[]> {
  await dbConnect();
  return PageModel.find({}, CLEAN).sort({ order: 1 }).lean() as unknown as Page[];
}

export async function getVisiblePages(): Promise<Page[]> {
  await dbConnect();
  return PageModel.find({ visible: { $ne: false } }, CLEAN)
    .sort({ order: 1 })
    .lean() as unknown as Page[];
}

/** Trang đã "public" để hiển thị ở footer (visible && showInHeader). */
export async function getFooterPages(): Promise<Page[]> {
  await dbConnect();
  return PageModel.find({ visible: { $ne: false }, showInHeader: true }, CLEAN)
    .sort({ order: 1 })
    .lean() as unknown as Page[];
}

export async function getPage(slug: string): Promise<Page | null> {
  await dbConnect();
  return PageModel.findOne({ slug }, CLEAN).lean() as unknown as Page | null;
}

export async function upsertPage(page: Page): Promise<void> {
  await dbConnect();
  const existing = await PageModel.findOne({ slug: page.slug }).lean();
  const order =
    page.order ??
    ((existing as { order?: number } | null)?.order ??
      (await PageModel.countDocuments()));
  await PageModel.updateOne(
    { slug: page.slug },
    { $set: { ...page, order } },
    { upsert: true }
  );
}

export async function deletePage(slug: string): Promise<void> {
  await dbConnect();
  await PageModel.deleteOne({ slug });
}

/** Cập nhật thứ tự trang theo mảng slug. */
export async function reorderPages(slugs: string[]): Promise<void> {
  await dbConnect();
  await PageModel.bulkWrite(
    slugs.map((slug, i) => ({
      updateOne: { filter: { slug }, update: { $set: { order: i } } },
    }))
  );
}

/* ===================== SITE ===================== */

const DEFAULT_SITE: SiteSettings = {
  siteName: "PongBom",
  brandText: "PONGBOM.fun",
  footerText: "© PongBom — All games are property of their respective owners.",
  // Mặc định không có link tĩnh: Home được thêm cố định, còn lại lấy từ các
  // trang admin đã "public lên footer". Mục này chỉ dùng cho link ngoài tùy chọn.
  footerLinks: [],
  priorityCategories: [],
  newBadgeDays: 30,
  newBadgeCount: 12,
};

export async function getSite(): Promise<SiteSettings> {
  await dbConnect();
  const doc = (await SiteModel.findOne({ key: "main" }, CLEAN).lean()) as
    | Partial<SiteSettings>
    | null;
  return { ...DEFAULT_SITE, ...(doc || {}) };
}

export async function saveSite(site: SiteSettings): Promise<void> {
  await dbConnect();
  await SiteModel.updateOne(
    { key: "main" },
    { $set: { ...site, key: "main" } },
    { upsert: true }
  );
}

/* ===================== CATEGORIES ===================== */

// Bộ category mặc định (dùng khi DB chưa có) — đúng icon font gốc.
export const DEFAULT_CATEGORIES: Category[] = [
  { key: "action", label: "Action", href: "/?category=Action", icon: "monochrome-category-6", visible: true, order: 0 },
  { key: "adventure", label: "Adventure", href: "/?category=Adventure", icon: "monochrome-category-1", visible: true, order: 1 },
  { key: "classic", label: "Classic", href: "/?category=Classic", icon: "monochrome-category-2", visible: true, order: 2 },
  { key: "fighting", label: "Fighting", href: "/?category=Fighting", icon: "monochrome-category-4", visible: true, order: 3 },
  { key: "kids", label: "Kids", href: "/?category=Kids", icon: "monochrome-category-7", visible: true, order: 4 },
  { key: "racing", label: "Racing", href: "/?category=Racing", icon: "monochrome-category-3", visible: true, order: 5 },
  { key: "sport", label: "Sport", href: "/?category=Sport", icon: "monochrome-category-5", visible: true, order: 6 },
  { key: "two-player", label: "2 Player", href: "/?category=2 Player", icon: "monochrome-category-10", visible: true, order: 7 },
  { key: "one-player", label: "1 Player", href: "/?category=1 Player", icon: "monochrome-category-9", visible: true, order: 8 },
];

// Category cần giữ field `key` (CLEAN loại bỏ key cho Site nên không dùng ở đây).
const CLEAN_CAT = { _id: 0, __v: 0, createdAt: 0, updatedAt: 0 } as const;

export async function getCategories(): Promise<Category[]> {
  await dbConnect();
  const rows = (await CategoryModel.find({}, CLEAN_CAT)
    .sort({ order: 1 })
    .lean()) as unknown as Category[];
  return rows.length ? rows : DEFAULT_CATEGORIES;
}

export async function getVisibleCategories(): Promise<Category[]> {
  return (await getCategories()).filter((c) => c.visible !== false);
}

/** Tìm category hiển thị theo slug URL (vd "2-player" khớp label "2 Player"). */
export async function getCategoryBySlug(slug: string): Promise<Category | null> {
  const cats = await getVisibleCategories();
  return cats.find((c) => slugify(c.label) === slug) || null;
}

/** Tất cả game hiển thị thuộc 1 category (lọc theo label), sắp theo thứ tự. */
export async function getGamesByCategory(label: string): Promise<Game[]> {
  await dbConnect();
  const games = (await GameModel.find(
    { visible: { $ne: false }, categories: label },
    CLEAN
  )
    .sort({ order: 1 })
    .lean()) as unknown as Game[];
  return markNew(games);
}

/**
 * Game trong 1 category, phân trang, có ưu tiên: game nào gắn thêm 1 trong các
 * category "ưu tiên" (priorityCats, theo label) sẽ nổi lên đầu; còn lại giữ
 * thứ tự order. Trả về danh sách trang hiện tại + tổng số game của category.
 */
export async function getGamesByCategoryPaged(
  label: string,
  page: number,
  pageSize: number,
  priorityCats: string[] = []
): Promise<{ games: Game[]; total: number }> {
  await dbConnect();
  const p = Math.max(1, Math.floor(page) || 1);
  const match = { visible: { $ne: false }, categories: label };
  const priority = (priorityCats || []).filter((c) => c && c !== label);

  const pipeline: PipelineStage[] = [{ $match: match }];
  if (priority.length) {
    pipeline.push({
      $addFields: {
        isPriority: {
          $gt: [
            { $size: { $setIntersection: ["$categories", priority] } },
            0,
          ],
        },
      },
    });
    pipeline.push({ $sort: { isPriority: -1, order: 1 } });
  } else {
    pipeline.push({ $sort: { order: 1 } });
  }
  pipeline.push({ $skip: (p - 1) * pageSize });
  pipeline.push({ $limit: pageSize });
  pipeline.push({
    $project: { _id: 0, __v: 0, createdAt: 0, updatedAt: 0, isPriority: 0 },
  });

  const [games, total] = await Promise.all([
    GameModel.aggregate(pipeline) as unknown as Promise<Game[]>,
    GameModel.countDocuments(match),
  ]);
  return { games: await markNew(games), total };
}

export async function upsertCategory(cat: Category): Promise<void> {
  await dbConnect();
  const existing = await CategoryModel.findOne({ key: cat.key }).lean();
  const order =
    cat.order ??
    ((existing as { order?: number } | null)?.order ??
      (await CategoryModel.countDocuments()));
  await CategoryModel.updateOne(
    { key: cat.key },
    { $set: { ...cat, order } },
    { upsert: true }
  );
}

export async function deleteCategory(key: string): Promise<void> {
  await dbConnect();
  await CategoryModel.deleteOne({ key });
}

export async function reorderCategories(keys: string[]): Promise<void> {
  await dbConnect();
  await CategoryModel.bulkWrite(
    keys.map((key, i) => ({
      updateOne: { filter: { key }, update: { $set: { order: i } } },
    }))
  );
}

/* ===================== STATS / ANALYTICS ===================== */

function todayKey(): string {
  return new Date().toISOString().slice(0, 10); // YYYY-MM-DD
}

/** Ghi nhận 1 lượt: type = 'view' | 'play'. */
export async function trackEvent(
  type: "view" | "play",
  slug?: string
): Promise<void> {
  await dbConnect();
  const field = type === "play" ? "plays" : "views";
  const inc = { $inc: { [field]: 1 } };
  const ops = [
    CounterModel.updateOne({ scope: "total", key: "all" }, inc, { upsert: true }),
    CounterModel.updateOne({ scope: "daily", key: todayKey() }, inc, {
      upsert: true,
    }),
  ];
  if (slug) {
    ops.push(
      CounterModel.updateOne({ scope: "game", key: slug }, inc, { upsert: true })
    );
    // Lượt chơi hiển thị (game.plays) chạy theo người dùng thật, không do admin đặt.
    if (type === "play")
      ops.push(GameModel.updateOne({ slug }, { $inc: { plays: 1 } }));
  }
  await Promise.all(ops);
}

export async function getStats(): Promise<StatsSummary> {
  await dbConnect();
  const [total, daily, games, topRaw] = await Promise.all([
    CounterModel.findOne({ scope: "total", key: "all" }).lean(),
    CounterModel.find({ scope: "daily" }).sort({ key: -1 }).limit(14).lean(),
    GameModel.find({}, { slug: 1, title: 1, _id: 0 }).lean(),
    CounterModel.find({ scope: "game" }).sort({ plays: -1 }).limit(10).lean(),
  ]);
  const t = (total as unknown as { views?: number; plays?: number } | null) || {};
  const gameRows = games as unknown as { slug: string; title: string }[];
  const dailyRows = daily as unknown as {
    key: string;
    views?: number;
    plays?: number;
  }[];
  const titleOf = new Map(gameRows.map((g) => [g.slug, g.title]));
  const today = dailyRows.find((d) => d.key === todayKey());
  return {
    totalViews: t.views || 0,
    totalPlays: t.plays || 0,
    today: { views: today?.views || 0, plays: today?.plays || 0 },
    daily: dailyRows
      .map((d) => ({ date: d.key, views: d.views || 0, plays: d.plays || 0 }))
      .reverse(),
    topGames: (topRaw as unknown as { key: string; plays?: number; views?: number }[]).map(
      (g) => ({
        slug: g.key,
        title: titleOf.get(g.key) || g.key,
        plays: g.plays || 0,
        views: g.views || 0,
      })
    ),
  };
}

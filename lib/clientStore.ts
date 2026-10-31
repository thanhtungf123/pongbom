// Lưu trữ phía client (localStorage) — KHÔNG cần đăng nhập, theo từng trình duyệt.
// Dùng cho "My Game Box" (game đã lưu) và "Lịch sử" (game đã chơi gần đây).
// Giống cách twoplayergames.org làm (localStorage key gameBox / gameHistory).

export type SavedGame = { slug: string; title: string; thumbnail: string };

const BOX_KEY = "pongbom-gamebox";
const HISTORY_KEY = "pongbom-history";
const HISTORY_MAX = 12;

// Sự kiện báo dữ liệu đổi để các component (header…) cập nhật ngay.
export const STORE_EVENT = "pongbom-store";

function read(key: string): SavedGame[] {
  try {
    const raw = localStorage.getItem(key);
    const arr = raw ? JSON.parse(raw) : [];
    return Array.isArray(arr) ? (arr as SavedGame[]) : [];
  } catch {
    return [];
  }
}

function write(key: string, list: SavedGame[]) {
  try {
    localStorage.setItem(key, JSON.stringify(list));
    window.dispatchEvent(new Event(STORE_EVENT));
  } catch {
    /* ignore (private mode / quota) */
  }
}

/* ===================== MY GAME BOX ===================== */

export function getGameBox(): SavedGame[] {
  return read(BOX_KEY);
}

export function inGameBox(slug: string): boolean {
  return getGameBox().some((g) => g.slug === slug);
}

export function removeGameBox(slug: string) {
  write(
    BOX_KEY,
    getGameBox().filter((g) => g.slug !== slug)
  );
}

/** Thêm/bỏ game khỏi box. Trả về true nếu sau thao tác game ĐANG được lưu. */
export function toggleGameBox(game: SavedGame): boolean {
  const list = getGameBox();
  if (list.some((g) => g.slug === game.slug)) {
    write(BOX_KEY, list.filter((g) => g.slug !== game.slug));
    return false;
  }
  write(BOX_KEY, [{ slug: game.slug, title: game.title, thumbnail: game.thumbnail }, ...list]);
  return true;
}

/* ===================== LỊCH SỬ ===================== */

export function getHistory(): SavedGame[] {
  return read(HISTORY_KEY);
}

/** Thêm game vào đầu lịch sử (bỏ trùng, giới hạn HISTORY_MAX). */
export function pushHistory(game: SavedGame) {
  const item = { slug: game.slug, title: game.title, thumbnail: game.thumbnail };
  const list = getHistory().filter((g) => g.slug !== item.slug);
  list.unshift(item);
  write(HISTORY_KEY, list.slice(0, HISTORY_MAX));
}

/* ============ TỰ DỌN GAME ĐÃ BỊ XOÁ KHỎI HỆ THỐNG ============ */

// Chỉ chạy 1 lần mỗi lần tải trang (tránh gọi API trùng từ nhiều component).
let syncStarted = false;

/**
 * Hỏi server slug nào còn tồn tại rồi bỏ các game đã bị xoá khỏi
 * "Game của tôi" + "Lịch sử". write() tự phát STORE_EVENT -> component cập nhật.
 */
export async function syncRemovedGamesOnce(): Promise<void> {
  if (syncStarted) return;
  syncStarted = true;

  const box = getGameBox();
  const hist = getHistory();
  const slugs = Array.from(new Set([...box, ...hist].map((g) => g.slug)));
  if (slugs.length === 0) return;

  try {
    const r = await fetch(
      `/api/games/exist?slugs=${encodeURIComponent(slugs.join(","))}`
    );
    if (!r.ok) return;
    const d = (await r.json()) as { existing?: string[] };
    const keep = new Set(d.existing || []);

    const newBox = box.filter((g) => keep.has(g.slug));
    const newHist = hist.filter((g) => keep.has(g.slug));
    if (newBox.length !== box.length) write(BOX_KEY, newBox);
    if (newHist.length !== hist.length) write(HISTORY_KEY, newHist);
  } catch {
    /* lỗi mạng -> giữ nguyên, thử lại lần tải sau */
    syncStarted = false;
  }
}

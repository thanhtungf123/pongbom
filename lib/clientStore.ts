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

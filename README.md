# PongBom — Game Portal (MVP)

Web nhúng game theo phong cách [twoplayergames.org](https://www.twoplayergames.org/).
Giai đoạn 1 chỉ nhúng 1 game (**Bomb Pong Online** — Playgama), nhưng kiến trúc
đã sẵn sàng mở rộng nhiều game.

## Công nghệ
- Next.js 15 (App Router) + TypeScript
- Tailwind CSS
- SSG cho từng trang game (chuẩn SEO)

## Chạy dev
```bash
npm install
npm run dev
```
Mở http://localhost:3000

## Build production
```bash
npm run build && npm run start
```

## Thêm game mới
Chỉ cần thêm 1 object vào [`data/games.json`](data/games.json). Không phải sửa code:

```json
{
  "slug": "ten-game",
  "title": "Tên Game",
  "shortDescription": "...",
  "description": "...",
  "iframeUrl": "https://playgama.com/export/game/....?clid=...",
  "thumbnail": "/thumbnails/ten-game.svg",
  "width": 800,
  "height": 450,
  "categories": ["Arcade"],
  "controls": [{ "label": "Move", "keys": "Arrows" }],
  "rating": 4.5,
  "plays": 1000
}
```
> Lưu ý: giữ nguyên tham số `clid=...` trong `iframeUrl` (mã affiliate của đối tác).

## Cấu trúc
```
app/
  layout.tsx          # khung chung: Header + CategoryBar + Footer
  page.tsx            # trang chủ: hero + lưới game
  game/[slug]/page.tsx# trang chơi game: iframe + mô tả + game liên quan
components/
  GamePlayer.tsx      # iframe responsive 16:9 + fullscreen + click-to-play
  GameCard.tsx, Header.tsx, CategoryBar.tsx, Footer.tsx
lib/games.ts          # đọc dữ liệu + hằng số IFRAME_ALLOW
data/games.json       # danh sách game (nguồn dữ liệu duy nhất)
public/thumbnails/    # ảnh thumbnail
```

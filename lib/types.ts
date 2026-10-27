// Types + hằng số dùng chung (client-safe — KHÔNG import fs ở đây)

export type GameControl = { label: string; keys: string };

export type Game = {
  slug: string;
  title: string; // tên hiển thị
  titleTag?: string; // thẻ <title> / SEO
  headerLabel?: string; // nhãn ngắn trên header
  metaDescription?: string;
  h1?: string; // tiêu đề H1 hiển thị
  shortDescription: string;
  descriptionHtml?: string; // nội dung (rich text)
  iframeUrl: string;
  thumbnail: string;
  thumbnailVideo?: string; // video xem trước khi rê chuột (mp4/webm)
  categories: string[];
  controls?: GameControl[];
  rating: number; // điểm trung bình (tự động theo người dùng chấm)
  ratingSum?: number; // tổng điểm người dùng đã chấm
  ratingCount?: number; // số lượt chấm
  plays: number;
  orientation?: "auto" | "landscape" | "portrait"; // hướng ép khi chơi fullscreen
  isNew?: boolean;
  featured?: boolean;
  visible?: boolean; // cho phép hiển thị
  showInHeader?: boolean;
  robotsIndex?: boolean;
  robotsFollow?: boolean;
  order?: number;
};

export type Page = {
  slug: string;
  titleTag: string;
  headerLabel?: string;
  metaDescription?: string;
  h1: string;
  contentHtml: string;
  robotsIndex: boolean;
  robotsFollow: boolean;
  showInHeader: boolean;
  visible: boolean;
  order: number;
};

export type FooterLink = { label: string; url: string };

// Liên kết mạng xã hội ở footer. icon = key nền tảng (facebook, youtube…) hoặc URL ảnh.
export type SocialLink = { url: string; icon: string };

// Một khối (section) trên trang chủ do admin tự cấu hình.
export type HomeSection = {
  title: string; // tiêu đề admin tự nhập, vd "Top 2 Player Games"
  category: string; // label category để lọc game (rỗng = tất cả game)
  mode: "top" | "new"; // top = nhiều lượt chơi nhất, new = mới thêm nhất
  limit: number; // số game hiển thị trong khối
};

export type SiteSettings = {
  siteName: string; // tên chung của site (mặc định khi homeTitle/titleSuffix để trống)
  homeTitle?: string; // thẻ <title> RIÊNG cho trang chủ (có thể để dài cho SEO)
  homeMetaDescription?: string; // meta description cho trang chủ
  titleSuffix?: string; // đuôi title ở trang game & danh mục: "{tên} - {titleSuffix}"
  brandText?: string; // chữ logo nếu không dùng ảnh
  logoUrl?: string; // ảnh logo (Cloudinary)
  logoWidth?: number; // px — admin tùy chỉnh (để trống = auto)
  logoHeight?: number; // px — admin tùy chỉnh (để trống = auto, mặc định cao 78)
  faviconUrl?: string;
  footerHtml?: string; // (cũ, tương thích)
  footerText?: string;
  footerLinks?: FooterLink[]; // (cũ) link tùy chỉnh — giữ để tương thích
  menuLinks?: FooterLink[]; // MENU các trang hiển thị gần footer (admin quản lý)
  socialLinks?: SocialLink[]; // liên kết mạng xã hội (icon), hiển thị dưới menu footer
  homeSections?: HomeSection[]; // các khối category trên trang chủ
  homeContentHtml?: string; // nội dung (rich text) cuối trang chủ
  priorityCategories?: string[]; // label các category được ưu tiên nổi đầu mọi trang danh mục
  newBadgeDays?: number; // số ngày 1 game giữ nhãn NEW (mặc định 30)
  newBadgeCount?: number; // chỉ N game mới nhất được gắn NEW (mặc định 12)
};

export type Category = {
  key: string;
  label: string;
  href: string;
  slug?: string; // đường dẫn URL tùy chỉnh (/{slug}); để trống -> suy từ label
  icon?: string; // class icon font hoặc emoji
  titleTag?: string; // thẻ <title> / SEO (để trống -> "Game {label}")
  metaDescription?: string; // meta description SEO
  visible: boolean;
  order: number;
};

export type StatsSummary = {
  totalViews: number;
  totalPlays: number;
  today: { views: number; plays: number };
  daily: { date: string; views: number; plays: number }[];
  topGames: { slug: string; title: string; plays: number; views: number }[];
};

/**
 * Danh sách permission cho iframe nhúng (giữ đúng theo đối tác Playgama).
 * `fullscreen` được tách riêng, không nằm ở đây.
 */
export const IFRAME_ALLOW =
  "accelerometer; camera; clipboard-read; clipboard-write; " +
  "screen-wake-lock; speaker-selection; web-share; geolocation; gyroscope; " +
  "microphone; xr-spatial-tracking; autoplay; encrypted-media; " +
  "picture-in-picture; payment; publickey-credentials-get; " +
  "publickey-credentials-create; storage-access; attribution-reporting; " +
  "browsing-topics";

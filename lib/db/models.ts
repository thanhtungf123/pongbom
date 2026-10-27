import mongoose, { Schema } from "mongoose";

/* ----------------------------- Game ----------------------------- */
const GameSchema = new Schema(
  {
    slug: { type: String, required: true, unique: true, index: true },
    title: String,
    titleTag: String,
    headerLabel: String,
    metaDescription: String,
    h1: String,
    shortDescription: String,
    descriptionHtml: String,
    iframeUrl: String,
    thumbnail: String,
    thumbnailVideo: String,
    categories: { type: [String], default: [], index: true },
    controls: [{ label: String, keys: String, _id: false }],
    rating: { type: Number, default: 0 }, // điểm trung bình = ratingSum / ratingCount
    ratingSum: { type: Number, default: 0 }, // tổng điểm người dùng đã chấm
    ratingCount: { type: Number, default: 0 }, // số lượt chấm
    plays: { type: Number, default: 0 },
    orientation: { type: String, default: "auto" }, // auto | landscape | portrait

    isNew: Boolean,
    featured: Boolean,
    visible: { type: Boolean, default: true, index: true },
    showInHeader: Boolean,
    robotsIndex: { type: Boolean, default: true },
    robotsFollow: { type: Boolean, default: true },
    order: { type: Number, default: 0, index: true },
  },
  { timestamps: true }
);
GameSchema.index({ visible: 1, order: 1 }); // danh sách game hiển thị, sắp xếp

/* ----------------------------- Page ----------------------------- */
const PageSchema = new Schema(
  {
    slug: { type: String, required: true, unique: true, index: true },
    titleTag: String,
    headerLabel: String,
    metaDescription: String,
    h1: String,
    contentHtml: String,
    robotsIndex: { type: Boolean, default: true },
    robotsFollow: { type: Boolean, default: true },
    showInHeader: { type: Boolean, default: false, index: true },
    visible: { type: Boolean, default: true },
    order: { type: Number, default: 0, index: true },
  },
  { timestamps: true }
);

/* ----------------------------- Site ----------------------------- */
const SiteSchema = new Schema(
  {
    key: { type: String, default: "main", unique: true },
    siteName: String,
    homeTitle: String,
    homeMetaDescription: String,
    titleSuffix: String,
    brandText: String,
    logoUrl: String,
    logoWidth: Number,
    logoHeight: Number,
    faviconUrl: String,
    footerHtml: String, // (giữ để tương thích cũ)
    footerText: String,
    footerLinks: [{ label: String, url: String, _id: false }],
    // Menu các trang (hiển thị gần footer) — admin quản lý riêng
    menuLinks: [{ label: String, url: String, _id: false }],
    // Liên kết mạng xã hội (icon) — hiển thị dưới menu footer
    socialLinks: [{ url: String, icon: String, _id: false }],
    // Trang chủ do admin cấu hình
    homeSections: [
      {
        title: String,
        category: String,
        mode: { type: String, default: "top" }, // "top" | "new"
        limit: { type: Number, default: 14 },
        _id: false,
      },
    ],
    homeContentHtml: String,
    // Các category được ưu tiên nổi lên đầu mọi trang danh mục (lưu theo label)
    priorityCategories: { type: [String], default: [] },
    // Nhãn NEW tự động
    newBadgeDays: { type: Number, default: 30 },
    newBadgeCount: { type: Number, default: 12 },
  },
  { timestamps: true }
);

/* --------------------------- Category --------------------------- */
const CategorySchema = new Schema(
  {
    key: { type: String, required: true, unique: true, index: true },
    label: String,
    href: String,
    slug: String, // đường dẫn URL tùy chỉnh (admin sửa được)
    icon: String, // class icon font (vd monochrome-category-6) hoặc emoji
    titleTag: String,
    metaDescription: String,
    visible: { type: Boolean, default: true },
    order: { type: Number, default: 0, index: true },
  },
  { timestamps: true }
);

/* ---------------- Counter (thống kê truy cập) ---------------- */
const CounterSchema = new Schema({
  scope: { type: String, required: true }, // 'total' | 'daily' | 'game'
  key: { type: String, required: true }, // 'all' | 'YYYY-MM-DD' | slug game
  views: { type: Number, default: 0 },
  plays: { type: Number, default: 0 },
});
CounterSchema.index({ scope: 1, key: 1 }, { unique: true });
CounterSchema.index({ scope: 1, plays: -1 });

// Tránh biên dịch lại model khi hot-reload
export const GameModel =
  mongoose.models.Game || mongoose.model("Game", GameSchema);
export const PageModel =
  mongoose.models.Page || mongoose.model("Page", PageSchema);
export const SiteModel =
  mongoose.models.Site || mongoose.model("Site", SiteSchema);
export const CategoryModel =
  mongoose.models.Category || mongoose.model("Category", CategorySchema);
export const CounterModel =
  mongoose.models.Counter || mongoose.model("Counter", CounterSchema);

/** Projection bỏ các field nội bộ của Mongo khi trả về client. */
export const CLEAN = { _id: 0, __v: 0, createdAt: 0, updatedAt: 0, key: 0 } as const;

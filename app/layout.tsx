import type { Metadata, Viewport } from "next";
import { Suspense } from "react";
import "./globals.css";
import "./ui/site.css"; // CSS giao diện gốc (mirror) — nạp sau để thắng Tailwind
import "./ui/custom.css"; // CSS tính năng mới (video hover, related, phân trang, 404)
import "./ui/responsive.css"; // Responsive mobile tự viết — nạp sau cùng để đè desktop
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import Track from "@/components/Track";
import TopProgress from "@/components/TopProgress";
import { getSite } from "@/lib/store";

export const dynamic = "force-dynamic";

// URL gốc của site (cho canonical + ảnh OG tuyệt đối). Đặt NEXT_PUBLIC_SITE_URL
// trong .env khi deploy; mặc định dùng domain chính.
const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL || "https://trochoi2nguoi.org";

export async function generateMetadata(): Promise<Metadata> {
  const site = await getSite();
  return {
    metadataBase: new URL(SITE_URL),
    title: {
      // Trang chủ: tiêu đề riêng (có thể dài). Để trống -> dùng Tên website.
      default: site.homeTitle || site.siteName,
      // Trang game/danh mục: "{tiêu đề} - {đuôi}". Đuôi để trống -> dùng Tên website.
      template: `%s - ${site.titleSuffix || site.siteName}`,
    },
    description:
      "Chơi game online miễn phí ngay trên trình duyệt — không cần tải, không cần cài đặt.",
    keywords: ["game online", "game miễn phí", "game trình duyệt", "game 2 người", "trò chơi"],
    alternates: { canonical: "/" },
    icons: site.faviconUrl ? { icon: site.faviconUrl } : undefined,
  };
}

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#d6f7ff",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="vi">
      <body>
        <Suspense fallback={null}>
          <TopProgress />
        </Suspense>
        <Track type="view" />
        <div className="site-body">
          <div className="site-left">
            <Header />
            <div className="site-main pt-10">{children}</div>
            <Footer />
          </div>
        </div>
      </body>
    </html>
  );
}

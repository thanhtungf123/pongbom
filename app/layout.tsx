import type { Metadata, Viewport } from "next";
import "./globals.css";
import "./ui/site.css"; // CSS giao diện gốc (mirror) — nạp sau để thắng Tailwind
import "./ui/responsive.css"; // Responsive mobile tự viết — nạp sau cùng để đè desktop
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import Track from "@/components/Track";
import { getSite } from "@/lib/store";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const site = await getSite();
  return {
    metadataBase: new URL("http://localhost:3000"),
    title: {
      default: `${site.siteName} — Play Free Online Games`,
      template: `%s - ${site.siteName}`,
    },
    description:
      "Play free online games directly in your browser — no download, no install.",
    keywords: ["free online games", "browser games", "2 player games", "arcade"],
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
    <html lang="en">
      <body>
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

import Link from "next/link";
import { getSite, getFooterPages } from "@/lib/store";

export default async function Footer() {
  const [site, pages] = await Promise.all([getSite(), getFooterPages()]);

  // Gộp các mục footer từ nhiều nguồn và KHỬ TRÙNG theo URL:
  //  1) Home cố định (trang chủ "/")
  //  2) các trang admin đã bật "public lên footer"
  //  3) link tùy chỉnh trong Site settings (cho link ngoài, nếu có)
  // Nhờ vậy nếu footerLinks cũ còn "About" trùng trang About thì chỉ hiện 1 lần.
  const seen = new Set<string>();
  const items: { label: string; url: string }[] = [];
  const add = (label: string, url: string) => {
    const key = (url || "").replace(/\/+$/, "") || "/";
    if (!label || seen.has(key)) return;
    seen.add(key);
    items.push({ label, url });
  };

  add("Home", "/");
  pages.forEach((p) => add(p.headerLabel || p.h1, `/${p.slug}`));
  (site.footerLinks || []).forEach((l) => add(l.label, l.url));

  return (
    <footer>
      {items.length > 0 || site.footerText ? (
        <>
          {items.length > 0 && (
            <div className="footer-links">
              {items.map((it, i) => (
                <a key={i} href={it.url}>
                  {it.label}
                </a>
              ))}
            </div>
          )}
          {site.footerText && <div className="footer-text">{site.footerText}</div>}
        </>
      ) : (
        // tương thích dữ liệu cũ (footerHtml)
        <div dangerouslySetInnerHTML={{ __html: site.footerHtml || "" }} />
      )}
      <div className="footer-admin">
        <Link href="/admin">Admin</Link>
      </div>
    </footer>
  );
}

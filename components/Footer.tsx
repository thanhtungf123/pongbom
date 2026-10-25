import { getSite, getFooterPages } from "@/lib/store";
import SocialIcon from "@/components/SocialIcon";
import { SOCIAL_ICONS } from "@/lib/socialIcons";

export default async function Footer() {
  const [site, pages] = await Promise.all([getSite(), getFooterPages()]);

  // MENU footer: nếu admin đã cấu hình ở tab "Menu" thì dùng đúng danh sách đó.
  // Nếu chưa cấu hình (chưa từng lưu) -> fallback logic cũ để không mất Home/trang.
  let items: { label: string; url: string }[] = [];
  if (Array.isArray(site.menuLinks) && site.menuLinks.length > 0) {
    items = site.menuLinks.filter((l) => l.label && l.url);
  } else {
    const seen = new Set<string>();
    const add = (label: string, url: string) => {
      const key = (url || "").replace(/\/+$/, "") || "/";
      if (!label || seen.has(key)) return;
      seen.add(key);
      items.push({ label, url });
    };
    add("Home", "/");
    pages.forEach((p) => add(p.headerLabel || p.h1, `/${p.slug}`));
    (site.footerLinks || []).forEach((l) => add(l.label, l.url));
  }

  const socials = (site.socialLinks || []).filter((s) => s.url && s.icon);

  return (
    <footer>
      {items.length > 0 || site.footerText || socials.length > 0 ? (
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
          {socials.length > 0 && (
            <div className="footer-social">
              {socials.map((s, i) => (
                <a
                  key={i}
                  href={s.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={SOCIAL_ICONS[s.icon]?.label || "Liên kết"}
                  title={SOCIAL_ICONS[s.icon]?.label || s.url}
                >
                  <SocialIcon icon={s.icon} />
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
    </footer>
  );
}

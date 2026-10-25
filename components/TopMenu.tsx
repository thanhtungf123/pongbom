"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import type { Category } from "@/lib/types";
import { categoryPath } from "@/lib/slug";

/**
 * Thanh menu category như bản gốc twoplayergames.
 *
 * CSS (app/ui/site.css) dựng grid 11 cột; `li:first-child` được ghim vào cột
 * 11 — đó là nút "More". Thanh chỉ cao 1 hàng (height 75px, overflow hidden),
 * category vượt quá hàng đầu nằm ở các hàng ẩn bên dưới.
 *
 * Bấm "More": giãn chiều cao để xổ hết category (dropdown), icon "+" xoay 45°
 * thành "×", chữ đổi thành "Close". Bấm lại hoặc click ra ngoài thì đóng.
 * (Tái hiện lại logic open()/hide() trong bundle gốc của twoplayergames.)
 */
export default function TopMenu({ categories }: { categories: Category[] }) {
  const [open, setOpen] = useState(false);
  const [height, setHeight] = useState<number | undefined>(undefined);
  const menuRef = useRef<HTMLDivElement>(null);
  const ulRef = useRef<HTMLUListElement>(null);

  // Số cột = số item (category + nút More), tối đa 11. Nhờ vậy không có cột
  // trống (items dàn đều), "More" luôn nằm ở cột cuối. Nếu > 11 thì giữ 11 cột
  // và phần dư rơi vào dropdown "More".
  const cols = Math.min(categories.length + 1, 11);

  const openMenu = () => {
    const ul = ulRef.current;
    if (ul) setHeight(ul.scrollHeight + 15); // expandableHeight = list + 15
    setOpen(true);
  };

  const hideMenu = () => {
    setHeight(undefined); // trả về mặc định (75px từ CSS)
    setOpen(false);
  };

  // Nâng z-index của .site-top khi mở để dropdown phủ lên nội dung bên dưới,
  // và đóng menu khi click ra ngoài — giống bản gốc.
  useEffect(() => {
    const siteTop = menuRef.current?.closest(".site-top") as HTMLElement | null;
    if (siteTop) siteTop.style.zIndex = open ? "102" : "";
    if (!open) return;

    const onDocClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        hideMenu();
      }
    };
    document.addEventListener("click", onDocClick);
    return () => document.removeEventListener("click", onDocClick);
  }, [open]);

  return (
    <div
      ref={menuRef}
      className="top-menu with-transition"
      data-text-close="Đóng"
      style={height ? { height } : undefined}
    >
      <ul
        ref={ulRef}
        className={open ? "filter-blur" : undefined}
        style={{ ["--menu-cols" as string]: String(cols) } as React.CSSProperties}
      >
        {/* Nút More: luôn là li đầu tiên -> CSS ghim vào cột 11 (bên phải) */}
        <li>
          <a
            href="#"
            className={`menu-toggle${open ? " top-menu-active" : ""}`}
            title=""
            onClick={(e) => {
              e.preventDefault();
              if (open) hideMenu();
              else openMenu();
            }}
          >
            <span
              className={`cat-icon monochrome-plus-sign${open ? " open" : ""}`}
            />
            <span className="cat-title">{open ? "Đóng" : "Thêm"}</span>
          </a>
        </li>

        {/* Category do admin quản lý */}
        {categories.map((cat) => (
          <li key={cat.key}>
            <Link href={categoryPath(cat.label)} title={cat.label}>
              {cat.icon && cat.icon.startsWith("monochrome-") ? (
                <span className={`cat-icon ${cat.icon}`} />
              ) : (
                <span className="cat-icon cat-icon-emoji">
                  {cat.icon || "🎲"}
                </span>
              )}
              <span className="cat-title">{cat.label}</span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

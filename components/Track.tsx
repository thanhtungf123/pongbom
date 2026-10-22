"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

/** Ghi nhận lượt xem/chơi mỗi khi đổi trang. */
export default function Track({
  type,
  slug,
}: {
  type: "view" | "play";
  slug?: string;
}) {
  const pathname = usePathname();
  useEffect(() => {
    fetch("/api/track", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type, slug }),
    }).catch(() => {});
  }, [pathname, type, slug]);
  return null;
}

"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState, useTransition } from "react";

/**
 * Logo link về trang chủ.
 *  - Đang ở trang khác: bấm -> điều hướng về "/" như Link thường.
 *  - Đang Ở TRANG CHỦ: Next.js vốn không làm gì (cùng route). Ở đây ta cuộn lên
 *    đầu trang + tải lại dữ liệu (router.refresh) VÀ hiện thanh loading/overlay
 *    (TopProgress) để bấm logo luôn có phản hồi thấy rõ. Vì refresh không đổi
 *    route (không có tín hiệu pathname), ta tự bật/tắt loading qua sự kiện
 *    "pongbom:nav-start" / "pongbom:nav-done" — đảm bảo hiện tối thiểu 600ms.
 */
export default function LogoLink({
  title,
  children,
}: {
  title?: string;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [refreshing, setRefreshing] = useState(false);
  const startAt = useRef(0);

  const onClick = (e: React.MouseEvent) => {
    if (pathname !== "/") return; // trang khác: để Link điều hướng bình thường
    e.preventDefault();
    window.scrollTo({ top: 0, behavior: "smooth" });
    startAt.current = Date.now();
    setRefreshing(true);
    window.dispatchEvent(new Event("pongbom:nav-start"));
    startTransition(() => router.refresh());
  };

  // Refresh xong (isPending false) -> tắt loading, giữ hiện tối thiểu 300ms cho đủ thấy.
  useEffect(() => {
    if (!refreshing || isPending) return;
    const wait = Math.max(0, 300 - (Date.now() - startAt.current));
    const t = setTimeout(() => {
      window.dispatchEvent(new Event("pongbom:nav-done"));
      setRefreshing(false);
    }, wait);
    return () => clearTimeout(t);
  }, [isPending, refreshing]);

  return (
    <Link href="/" title={title} onClick={onClick}>
      {children}
    </Link>
  );
}

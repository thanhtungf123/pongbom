"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

/**
 * Logo link về trang chủ.
 *  - Đang ở trang khác: bấm -> điều hướng về "/" như Link thường.
 *  - Đang Ở TRANG CHỦ: Next.js vốn không làm gì (cùng route). Ở đây ta cuộn lên
 *    đầu trang + tải lại dữ liệu (router.refresh) để bấm logo luôn có phản hồi.
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

  const onClick = (e: React.MouseEvent) => {
    if (pathname === "/") {
      e.preventDefault();
      window.scrollTo({ top: 0, behavior: "smooth" });
      router.refresh();
    }
  };

  return (
    <Link href="/" title={title} onClick={onClick}>
      {children}
    </Link>
  );
}

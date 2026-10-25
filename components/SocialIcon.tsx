import { SOCIAL_ICONS } from "@/lib/socialIcons";

/**
 * Icon cho 1 social link. `icon` là key nền tảng (vd "facebook") hoặc URL ảnh.
 * Component thuần (không hook) -> dùng được ở cả server lẫn client.
 */
export default function SocialIcon({
  icon,
  className,
}: {
  icon: string;
  className?: string;
}) {
  const isUrl = /^https?:\/\//i.test(icon);
  if (isUrl) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img className={className} src={icon} alt="" width={22} height={22} />;
  }
  const def = SOCIAL_ICONS[icon];
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
      width={22}
      height={22}
    >
      {def ? (
        <path d={def.path} />
      ) : (
        // fallback: icon link chung
        <path d="M10.59 13.41a1 1 0 0 0 1.42 0l6-6a3 3 0 1 0-4.24-4.24l-1.3 1.3 1.42 1.42 1.3-1.3a1 1 0 1 1 1.41 1.41l-6 6a1 1 0 0 0 0 1.41zm2.82-2.82a1 1 0 0 0-1.42 0l-6 6a3 3 0 1 0 4.24 4.24l1.3-1.3-1.42-1.42-1.3 1.3a1 1 0 1 1-1.41-1.41l6-6a1 1 0 0 0 0-1.41z" />
      )}
    </svg>
  );
}

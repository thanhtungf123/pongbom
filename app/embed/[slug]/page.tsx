import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getGame } from "@/lib/store";
import { IFRAME_ALLOW } from "@/lib/types";

export const revalidate = 60; // ISR: trang nhúng cache được (không searchParams)

type Params = { slug: string };

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>;
}): Promise<Metadata> {
  const { slug } = await params;
  const game = await getGame(slug);
  return {
    title: game ? `${game.title} - Embed` : "Embed",
    robots: { index: false, follow: false }, // trang nhúng không cần index
  };
}

export default async function EmbedPage({
  params,
}: {
  params: Promise<Params>;
}) {
  const { slug } = await params;
  const game = await getGame(slug);
  if (!game || game.visible === false) notFound();

  // Phủ kín viewport (đè lên header/footer của layout) -> chỉ còn game.
  return (
    <div className="embed-root">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <iframe
        className="embed-frame"
        src={game.iframeUrl}
        title={game.title}
        allow={`${IFRAME_ALLOW} fullscreen`}
        allowFullScreen
      />
    </div>
  );
}

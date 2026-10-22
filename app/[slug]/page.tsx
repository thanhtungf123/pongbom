import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getPage } from "@/lib/store";

export const dynamic = "force-dynamic";

type Params = { slug: string };

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>;
}): Promise<Metadata> {
  const { slug } = await params;
  const page = await getPage(slug);
  if (!page) return { title: "Not found" };
  return {
    title: page.titleTag || page.h1,
    description: page.metaDescription,
    robots: { index: page.robotsIndex !== false, follow: page.robotsFollow !== false },
  };
}

export default async function DynamicPage({
  params,
}: {
  params: Promise<Params>;
}) {
  const { slug } = await params;
  const page = await getPage(slug);
  if (!page || page.visible === false) notFound();

  return (
    <article className="static-page">
      <h1>{page.h1}</h1>
      <div dangerouslySetInnerHTML={{ __html: page.contentHtml }} />
    </article>
  );
}

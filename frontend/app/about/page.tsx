import type { Metadata } from "next";
import { copy } from "@/data/copy";
import { StaticPage } from "@/components/layout/StaticPage";

export const metadata: Metadata = { title: copy.pages.about.title };

export default function AboutPage() {
  return (
    <StaticPage
      title={copy.pages.about.title}
      paragraphs={copy.pages.about.body}
    />
  );
}

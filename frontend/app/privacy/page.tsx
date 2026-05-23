import type { Metadata } from "next";
import { copy } from "@/data/copy";
import { StaticPage } from "@/components/layout/StaticPage";

export const metadata: Metadata = { title: copy.pages.privacy.title };

export default function PrivacyPage() {
  return (
    <StaticPage
      title={copy.pages.privacy.title}
      paragraphs={copy.pages.privacy.body}
    />
  );
}

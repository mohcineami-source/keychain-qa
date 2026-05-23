import type { Metadata } from "next";
import { copy } from "@/data/copy";
import { StaticPage } from "@/components/layout/StaticPage";

export const metadata: Metadata = { title: copy.pages.delivery.title };

export default function DeliveryPage() {
  return (
    <StaticPage
      title={copy.pages.delivery.title}
      paragraphs={copy.pages.delivery.body}
    />
  );
}

import type { Metadata } from "next";
import { MessageCircle } from "lucide-react";
import { copy } from "@/data/copy";
import { config } from "@/lib/config";
import { whatsappSupportUrl } from "@/lib/whatsapp";
import { StaticPage } from "@/components/layout/StaticPage";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = { title: copy.pages.contact.title };

export default function ContactPage() {
  const displayNumber = `+${config.whatsappNumber}`;

  return (
    <StaticPage
      title={copy.pages.contact.title}
      paragraphs={copy.pages.contact.body}
    >
      <div className="space-y-4 rounded-lg border border-warmgray bg-white p-6 shadow-card">
        <div className="flex items-center justify-between">
          <span className="text-sm font-semibold text-muted">
            {copy.pages.contact.numberLabel}
          </span>
          <span dir="ltr" className="font-extrabold text-charcoal">
            {displayNumber}
          </span>
        </div>
        <a
          href={whatsappSupportUrl()}
          target="_blank"
          rel="noopener noreferrer"
          className="block"
        >
          <Button size="full" className="bg-success hover:bg-success/90">
            <MessageCircle className="h-5 w-5" />
            {copy.pages.contact.whatsappCta}
          </Button>
        </a>
      </div>
    </StaticPage>
  );
}

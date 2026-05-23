import Link from "next/link";
import { copy } from "@/data/copy";
import { config } from "@/lib/config";
import { whatsappSupportUrl } from "@/lib/whatsapp";

export function Footer() {
  const year = new Date().getFullYear();
  const displayNumber = `+${config.whatsappNumber}`;

  return (
    <footer className="mt-16 border-t border-warmgray/70 bg-white">
      <div className="container-wide grid gap-8 py-10 sm:grid-cols-2 lg:grid-cols-3">
        <div className="space-y-3">
          <div className="text-lg font-extrabold text-charcoal">
            {copy.brand.nameAr}
          </div>
          <p className="text-sm leading-7 text-muted">{copy.footer.tagline}</p>
        </div>

        <div className="space-y-3">
          <div className="text-sm font-bold text-charcoal">روابط</div>
          <ul className="space-y-2 text-sm text-muted">
            <li>
              <Link href="/about" className="hover:text-maroon">
                {copy.footer.links.about}
              </Link>
            </li>
            <li>
              <Link href="/delivery" className="hover:text-maroon">
                {copy.footer.links.delivery}
              </Link>
            </li>
            <li>
              <Link href="/privacy" className="hover:text-maroon">
                {copy.footer.links.privacy}
              </Link>
            </li>
            <li>
              <Link href="/terms" className="hover:text-maroon">
                {copy.footer.links.terms}
              </Link>
            </li>
            <li>
              <Link href="/contact" className="hover:text-maroon">
                {copy.footer.links.contact}
              </Link>
            </li>
          </ul>
        </div>

        <div className="space-y-3">
          <div className="text-sm font-bold text-charcoal">
            {copy.footer.whatsappLabel}
          </div>
          <a
            href={whatsappSupportUrl()}
            target="_blank"
            rel="noopener noreferrer"
            dir="ltr"
            className="inline-flex items-center gap-2 text-sm font-semibold text-maroon hover:text-maroon-deep"
          >
            {displayNumber}
          </a>
        </div>
      </div>

      <div className="border-t border-warmgray/70 py-4">
        <div className="container-wide text-center text-xs text-muted">
          © {year} {copy.brand.nameAr} — {copy.footer.rights}
        </div>
      </div>
    </footer>
  );
}

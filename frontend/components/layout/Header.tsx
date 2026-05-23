import Link from "next/link";
import { copy } from "@/data/copy";

export function Header() {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-warmgray/70 bg-white/85 backdrop-blur-md">
      <div className="container-wide flex h-16 items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-maroon text-sm font-semibold text-white">
            ر
          </span>
          <span className="text-base font-semibold text-charcoal">
            {copy.brand.nameAr}
          </span>
        </Link>

        <nav className="hidden items-center gap-6 text-sm font-medium text-muted sm:flex">
          <Link href="/" className="transition-colors hover:text-maroon">
            {copy.header.nav.home}
          </Link>
          <Link href="/about" className="transition-colors hover:text-maroon">
            {copy.header.nav.about}
          </Link>
          <Link href="/delivery" className="transition-colors hover:text-maroon">
            {copy.header.nav.delivery}
          </Link>
          <Link href="/contact" className="transition-colors hover:text-maroon">
            {copy.header.nav.contact}
          </Link>
        </nav>
      </div>
    </header>
  );
}

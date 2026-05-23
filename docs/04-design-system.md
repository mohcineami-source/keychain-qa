# 04 — Design System

## Direction

Light premium **Apple-style** base + **Qatari heritage** accents. Mobile-first, minimal motion, generous spacing, white cards on a soft warm background, subtle borders, elegant rounded corners. Everything is **RTL** (`dir="rtl"` global).

## Color palette

| Token | Hex | Use |
|-------|-----|-----|
| Qatari maroon | `#8A1538` | Primary accent: CTAs, active states, highlights |
| Deep maroon | `#5C0E26` | Hover/pressed accent, deep emphasis |
| White | `#FFFFFF` | Cards, surfaces |
| Soft background | `#F7F5F3` | Page background |
| Warm gray | `#E8E2DD` | Borders, dividers, subtle fills |
| Text charcoal | `#171717` | Primary text |
| Muted text | `#6B625F` | Secondary text, labels, hints |
| Success green | `#16A34A` | Confirmations, thank-you, sync OK |

Suggested Tailwind theme extension (conceptual):

```ts
colors: {
  maroon: { DEFAULT: "#8A1538", deep: "#5C0E26" },
  surface: "#FFFFFF",
  bg: "#F7F5F3",
  hairline: "#E8E2DD",
  ink: "#171717",
  muted: "#6B625F",
  success: "#16A34A",
}
```

## Typography

- **Arabic-first.** Pick **one** clean Arabic font and use it consistently: IBM Plex Sans Arabic, Noto Kufi Arabic, or Tajawal.
- Numerals: keep consistent; Arabic-Indic or Western digits chosen once and applied everywhere.
- Hierarchy: large confident hero headline, calm body, clear labels. Avoid many weights — 2–3 max.
- Line length and spacing tuned for RTL Arabic readability.

## Layout & spacing

- Mobile-first; single-column funnel that scales gracefully to desktop (centered, max-width container).
- Generous padding inside cards; comfortable gaps between elements.
- Rounded corners (e.g., `rounded-2xl` for cards, `rounded-xl` for inputs/buttons).
- Hairline borders (`#E8E2DD`) instead of heavy shadows; light, soft shadows only where depth helps.

## Components (shadcn/ui based)

- **Buttons:** primary = maroon fill, white text, gentle hover to deep maroon; secondary = outline/ghost. Large tap targets for mobile.
- **Cards:** white surface, hairline border, rounded; plate-style cards show a placeholder image, Arabic title beneath, and a clear selected state (maroon border + check mark).
- **Inputs:** RTL-aligned, clear labels above, focus ring in maroon, validation messages in Arabic.
- **Progress stepper:** minimal, numbers + Arabic labels (`1 العرض → 2 اختيار اللوحة → 3 الإضافات → 4 بيانات الطلب`).
- **Live order summary:** compact, shows only عدد الميداليات + الإجمالي.
- **Dropdown** (letter Q/T/R): elegant, label `حرف اللوحة`, default Q.

## Motion

Apple-like and minimal only:
- soft fade
- subtle slide between steps
- gentle button state transitions

No flashy effects, no bouncing, no parallax. Framer Motion only if it stays minimal.

## RTL requirements

- `dir="rtl"` on `<html>`.
- All paddings/margins, icons, sliders, and form alignment must read naturally right-to-left.
- Sliders/carousels advance in the RTL direction.
- Test every input, button, card, and the stepper specifically in RTL.

## Header & footer

- **Header:** brand text "ميدالية رقم السيارة" (no heavy logo at launch).
- **Footer:** WhatsApp only (+97433423421), links to standard pages (About/Contact/Privacy/Terms/Delivery). No email.

## Floating WhatsApp button

- Present site-wide.
- Arabic label: `تحتاج مساعدة؟`.
- Opens `wa.me/97433423421`.
- Positioned for thumb reach on mobile; does not obstruct the primary CTA.

## Imagery

- Premium, clean product look. Qatari maroon / white / soft gray world.
- Placeholders ship by default and must look intentional, not broken (see `docs/11-visual-assets-and-higgsfield-prompts.md`).
- No fake official/government plate marks. No misleading exact replicas. No AI-looking broken text on images.

## Accessibility & quality bar

- Sufficient contrast (charcoal on light, white on maroon).
- Visible focus states.
- Tap targets ≥ 44px on mobile.
- Loading and error states designed (not raw spinners/alerts).

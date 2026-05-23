# 11 — Visual Assets & Higgsfield Prompts

The site must look complete **before** real product photography exists, using premium placeholder cards/images. If real images are added later, drop them into the same paths.

## Visual direction

- Palette: **Qatari maroon** (`#8A1538`), white, soft gray (`#F7F5F3`).
- Premium acrylic keychain look; clean product-photography feel.
- No fake official/government plate marks. No exact replica that creates legal/design risk.
- Avoid text on images that looks wrong or AI-generated.
- Placeholders may be abstract/minimal product mockups — they should look intentional, not broken.

## Product slider placeholders (4)

- Size: **1600 × 1200 px**
- Ratio: **4:3**
- Format: PNG/JPG
- Paths:
  - `frontend/public/placeholders/hero-keychain-01.png`
  - `frontend/public/placeholders/hero-keychain-02.png`
  - `frontend/public/placeholders/hero-keychain-03.png`
  - `frontend/public/placeholders/hero-keychain-04.png`

## Plate style placeholders (5)

- Size: **1200 × 800 px**
- Ratio: **3:2**
- Format: PNG/JPG
- Keep the plate/keychain centered with margin; consistent background across all five.
- Paths:
  - `frontend/public/placeholders/plate-new-2026.png`
  - `frontend/public/placeholders/plate-private.png`
  - `frontend/public/placeholders/plate-classic.png`
  - `frontend/public/placeholders/plate-motorcycle.png`
  - `frontend/public/placeholders/plate-custom.png`

## Higgsfield MCP usage (optional)

If the Higgsfield MCP is available, it may be used to generate optional placeholder visuals from the prompts below. **Do not let image generation block the build.** If generated images look wrong, keep the designed placeholder cards and save these prompts for later manual generation.

### Prompt — hero keychain (slider 01–04)

> Premium product photograph of a custom acrylic car-plate keychain, glossy clear acrylic with a clean Qatar-style number plate design, maroon (#8A1538) and white accents, soft neutral light-gray studio background (#F7F5F3), gentle soft shadow, centered with generous margin, minimal Apple-style product photography, high detail, no text artifacts, no logos, no government emblems. 4:3, 1600x1200.

Vary across the four: (01) straight-on hero, (02) slight three-quarter angle, (03) close-up macro of the acrylic edge and keyring, (04) lifestyle hint with a soft blurred car key beside it — all same palette and lighting.

### Prompt — plate style: new_2026

> Minimal premium mockup of an acrylic keychain representing a new 2026-style Qatar car plate, single bold letter placeholder and number area, maroon and white accents, clean light-gray background, centered with margin, no real government marks, no readable fake text, elegant studio look. 3:2, 1200x800.

### Prompt — plate style: private

> Minimal premium acrylic keychain mockup representing a private-style car plate, refined maroon/white palette, clean light-gray studio background, centered, no official emblems, no realistic fake plate text. 3:2, 1200x800.

### Prompt — plate style: classic

> Minimal premium acrylic keychain mockup representing a classic-style car plate, timeless clean design, maroon/white accents, soft gray background, centered with margin, no government marks. 3:2, 1200x800.

### Prompt — plate style: motorcycle

> Minimal premium acrylic keychain mockup representing a motorcycle-style plate (smaller, taller proportion), maroon/white palette, clean light-gray background, centered, no official emblems, no fake text. 3:2, 1200x800.

### Prompt — plate style: custom_choice

> Minimal abstract premium acrylic keychain mockup symbolizing a custom/personalized choice (clean blank acrylic with a subtle maroon outline and a small customization spark/asterisk motif), light-gray studio background, centered, elegant and simple, no text. 3:2, 1200x800.

## Designed-placeholder fallback (no AI needed)

If no images are generated, render elegant CSS/SVG placeholder cards:
- White card, hairline border (`#E8E2DD`), rounded corners.
- A maroon accent shape or thin frame suggesting a plate.
- The plate style's Arabic title shown beneath the card.
- Consistent aspect ratios (4:3 slider, 3:2 plate cards) so layout never shifts when real images arrive.

## Replacement workflow

When real assets are ready, replace the files at the exact paths above (same dimensions/ratios). No code change is required if filenames match.

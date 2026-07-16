# -*- coding: utf-8 -*-
"""
نَدى — build Snapchat image ads (1080x1920) from the Higgsfield base renders.

Arabic overlay rules (learned the hard way, see memory):
  - reshape -> bidi -> draw the WHOLE line in ONE draw.text call (never per-char,
    it breaks the joins).
  - font MUST render the lam-alef ligature (لا). Cairo/Tajawal LOOK fine by cmap
    count but render tofu -> IBM Plex Sans Arabic only.
Text colour per ad is chosen from the actual luminance of the headline band, so
copy stays legible whatever the render did up there.
"""
import os
from PIL import Image, ImageDraw, ImageFont
import arabic_reshaper
from bidi.algorithm import get_display

HERE = os.path.dirname(os.path.abspath(__file__))
BASE = os.path.join(HERE, "base")
OUT = os.path.join(HERE, "final")
FONTS = r"C:\Users\user\Desktop\kstm-ad-projects\waad\fonts"

F_BOLD = os.path.join(FONTS, "IBMPlexSansArabic-Bold.ttf")
F_SEMI = os.path.join(FONTS, "IBMPlexSansArabic-SemiBold.ttf")
F_MED = os.path.join(FONTS, "IBMPlexSansArabic-Medium.ttf")

W, H = 1080, 1920

# Brand palette (matches the landing page)
TERRACOTTA = (194, 98, 46)
CREAM = (250, 246, 242)
CHARCOAL = (38, 28, 22)
WHITE = (255, 255, 255)

PRICE = "175 ريال · شامل التوصيل"
CTA = "اطلبها الحين"
COD = "الدفع عند الاستلام"
BRAND = "نَدى"

ADS = [
    dict(src="1-hotel.png", out="ad-1-hotel.jpg",
         headline="سافر وملابسك تنشف معاك",
         sub="علّقها بخزانة الفندق، وملابسك جاهزة الصبح"),
    dict(src="2-suitcase.png", out="ad-2-suitcase.jpg",
         headline="تنطوي مسطّحة بشنطتك",
         sub="وزنها 1.55 كجم بس، ما تاخذ مكان"),
    dict(src="3-hero.png", out="ad-3-hero.jpg",
         headline="نشّافة نَدى المحمولة",
         sub="ملابسك تنشف بأي فندق أو سكن"),
    dict(src="4-dorm.png", out="ad-4-dorm.jpg",
         headline="سكنك ما فيه نشّافة؟",
         sub="علّقها بغرفتك، وملابسك تنشف بهدوء"),
    dict(src="5-control.png", out="ad-5-control.jpg",
         headline="شغّلها وارتاح",
         sub="شاشة رقمية وريموت تحكّم"),
]


def ar(text):
    """Logical Arabic -> renderable visual string.

    Harakat stay stripped (reshaper default): PIL has no libraqm here, so there is
    no GPOS mark positioning and kept harakat land on the wrong letter -- نَدى
    renders as ثدى. Unvocalised is standard for ad copy anyway.
    """
    return get_display(arabic_reshaper.reshape(text))


def measure(draw, text, font):
    box = draw.textbbox((0, 0), text, font=font)
    return box[2] - box[0], box[3] - box[1]


def wrap(draw, text, font, max_w):
    """Greedy wrap on LOGICAL words, measuring the reshaped form."""
    words = text.split()
    lines, cur = [], []
    for word in words:
        trial = cur + [word]
        w, _ = measure(draw, ar(" ".join(trial)), font)
        if w <= max_w or not cur:
            cur = trial
        else:
            lines.append(" ".join(cur))
            cur = [word]
    if cur:
        lines.append(" ".join(cur))
    return lines


def fit_headline(draw, text, max_w, hi=84, lo=64):
    """Prefer one strong line: shrink a little before allowing an orphaned word."""
    for size in range(hi, lo - 1, -2):
        font = ImageFont.truetype(F_BOLD, size)
        w, _ = measure(draw, ar(text), font)
        if w <= max_w:
            return font, [text]
    font = ImageFont.truetype(F_BOLD, 76)
    return font, wrap(draw, text, font, max_w)


def scrim(size, color, a_top, a_bottom):
    """Vertical alpha gradient block."""
    w, h = size
    grad = Image.new("L", (1, h))
    for y in range(h):
        t = y / max(1, h - 1)
        grad.putpixel((0, y), int(round(a_top + (a_bottom - a_top) * t)))
    alpha = grad.resize((w, h))
    block = Image.new("RGBA", (w, h), color + (0,))
    block.putalpha(alpha)
    return block


def band_luminance(img, y0, y1):
    crop = img.crop((0, y0, img.width, y1)).convert("RGB").resize((32, 16))
    px = list(crop.getdata())
    return sum(0.2126 * r + 0.7152 * g + 0.0722 * b for r, g, b in px) / len(px)


def fit(img):
    """Resize + centre-crop the 9:16-ish render to exactly 1080x1920."""
    scale = W / img.width
    img = img.resize((W, int(round(img.height * scale))), Image.LANCZOS)
    if img.height > H:
        top = (img.height - H) // 2
        img = img.crop((0, top, W, top + H))
    elif img.height < H:
        canvas = Image.new("RGB", (W, H), CREAM)
        canvas.paste(img, (0, (H - img.height) // 2))
        img = canvas
    return img


def text_c(draw, xy, text, font, fill, shadow=None, anchor="mm"):
    """Draw a reshaped line, optional soft shadow for legibility."""
    vis = ar(text)
    if shadow:
        draw.text((xy[0] + 2, xy[1] + 3), vis, font=font, fill=shadow, anchor=anchor)
    draw.text(xy, vis, font=font, fill=fill, anchor=anchor)


def build(ad):
    img = fit(Image.open(os.path.join(BASE, ad["src"])).convert("RGB")).convert("RGBA")

    # Decide text colour from the real pixels behind the headline.
    lum = band_luminance(img, 150, 620)
    light_bg = lum > 150
    fg = CHARCOAL if light_bg else WHITE
    shadow = (255, 255, 255, 90) if light_bg else (0, 0, 0, 110)

    # Scrims: lift contrast without flattening the photo.
    top = scrim((W, 760), WHITE if light_bg else (0, 0, 0), 150 if light_bg else 130, 0)
    img.alpha_composite(top, (0, 0))
    bot = scrim((W, 620), (0, 0, 0), 0, 165)
    img.alpha_composite(bot, (0, H - 620))

    draw = ImageDraw.Draw(img)
    f_brand = ImageFont.truetype(F_BOLD, 40)
    f_sub = ImageFont.truetype(F_MED, 42)
    f_price = ImageFont.truetype(F_SEMI, 44)
    f_cta = ImageFont.truetype(F_BOLD, 48)
    f_cod = ImageFont.truetype(F_MED, 32)

    cx = W // 2

    # --- brand (top, inside Snapchat's safe zone) ---
    text_c(draw, (cx, 205), BRAND, f_brand, TERRACOTTA if light_bg else WHITE, shadow)

    # --- headline ---
    f_head, head_lines = fit_headline(draw, ad["headline"], 950)
    y = 300
    for line in head_lines:
        text_c(draw, (cx, y), line, f_head, fg, shadow)
        y += 108

    # --- sub ---
    y += 6
    for line in wrap(draw, ad["sub"], f_sub, 880):
        text_c(draw, (cx, y), line, f_sub,
               (90, 74, 64) if light_bg else (240, 232, 226), shadow)
        y += 58

    # --- price ---
    text_c(draw, (cx, 1468), PRICE, f_price, WHITE, (0, 0, 0, 120))

    # --- CTA pill ---
    tw, _ = measure(draw, ar(CTA), f_cta)
    pw, ph = tw + 130, 104
    x0, y0 = cx - pw // 2, 1528
    draw.rounded_rectangle([x0, y0, x0 + pw, y0 + ph], radius=ph // 2, fill=TERRACOTTA)
    text_c(draw, (cx, y0 + ph // 2 - 4), CTA, f_cta, WHITE)

    # --- COD reassurance ---
    text_c(draw, (cx, 1690), COD, f_cod, (238, 230, 224), (0, 0, 0, 120))

    os.makedirs(OUT, exist_ok=True)
    img.convert("RGB").save(os.path.join(OUT, ad["out"]), "JPEG", quality=92, optimize=True)
    return ad["out"], round(lum, 1), "dark-text" if light_bg else "white-text"


if __name__ == "__main__":
    # Fail loudly if the font can't do lam-alef — the whole point of IBM Plex here.
    probe = Image.new("RGB", (400, 120), "white")
    d = ImageDraw.Draw(probe)
    d.text((10, 10), ar("لا الأجمل"), font=ImageFont.truetype(F_BOLD, 60), fill="black")
    if len(set(probe.getdata())) < 3:
        raise SystemExit("Font failed the lam-alef probe")

    for ad in ADS:
        print("built %s  (lum %s -> %s)" % build(ad))

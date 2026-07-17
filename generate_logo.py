"""Generate CyberTech-Family logo JPG: ring emblem, bold C, t-cut, bold F."""

from __future__ import annotations

import os

from PIL import Image, ImageDraw, ImageFont, ImageFilter, ImageEnhance

W, H = 1600, 1000

# New hue: deep indigo night + ice silver ring + electric violet accent
BG = (12, 10, 28)  # deep indigo
BG_SOFT = (18, 14, 38)
ACCENT = (168, 120, 255)  # electric violet
ACCENT_HOT = (210, 170, 255)
WHITE = (252, 252, 255)
MUTED = (168, 162, 196)
RING = (244, 242, 250)
C_FILL = (252, 252, 255)
F_FILL = (196, 150, 255)


def load_font(size: int, heavy: bool = False) -> ImageFont.FreeTypeFont | ImageFont.ImageFont:
    # Prefer Impact / black weights for monogram letters
    candidates = (
        [
            r"C:\Windows\Fonts\impact.ttf",
            r"C:\Windows\Fonts\ariblk.ttf",
            r"C:\Windows\Fonts\arialbd.ttf",
            r"C:\Windows\Fonts\segoeuib.ttf",
        ]
        if heavy
        else [
            r"C:\Windows\Fonts\arialbd.ttf",
            r"C:\Windows\Fonts\segoeuib.ttf",
            r"C:\Windows\Fonts\arial.ttf",
        ]
    )
    for path in candidates:
        if os.path.exists(path):
            return ImageFont.truetype(path, size)
    return ImageFont.load_default()


def main() -> None:
    img = Image.new("RGB", (W, H), BG)

    # Soft violet glow (new hue family)
    glow = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    gdraw = ImageDraw.Draw(glow)
    cx, cy = 520, 390
    for i, r in enumerate(range(380, 90, -10)):
        alpha = max(0, 30 - i)
        gdraw.ellipse([cx - r, cy - r, cx + r, cy + r], fill=(120, 80, 220, alpha))
    glow = glow.filter(ImageFilter.GaussianBlur(34))
    img = Image.alpha_composite(img.convert("RGBA"), glow).convert("RGB")
    draw = ImageDraw.Draw(img)

    # Larger ring + larger center cut-out
    outer_r = 265
    inner_r = 152  # bigger round cut

    # Ring body only — no colored border strokes
    draw.ellipse([cx - outer_r, cy - outer_r, cx + outer_r, cy + outer_r], fill=RING)
    draw.ellipse([cx - inner_r, cy - inner_r, cx + inner_r, cy + inner_r], fill=BG)

    # Wider, taller dash cut through the right side (t crossbar) — no teal edges
    dash_h = 56
    dash_y0 = cy - dash_h // 2
    dash_y1 = cy + dash_h // 2
    dash_x0 = cx + inner_r - 10
    dash_x1 = cx + outer_r + 100
    draw.rectangle([dash_x0, dash_y0, dash_x1, dash_y1], fill=BG)

    # Soft rounded tip on bar (same BG, no colored border)
    tip_r = dash_h // 2 + 2
    draw.ellipse(
        [dash_x1 - tip_r - 4, cy - tip_r, dash_x1 + tip_r - 10, cy + tip_r],
        fill=BG,
    )

    # Extra-bold oversized C in the middle
    font_c = load_font(310, heavy=True)
    c_text = "C"
    cb = draw.textbbox((0, 0), c_text, font=font_c)
    cw, ch = cb[2] - cb[0], cb[3] - cb[1]
    c_x = cx - cw // 2 - cb[0]
    c_y = cy - ch // 2 - cb[1] - 6
    # Heavy shadow for weight
    draw.text((c_x + 4, c_y + 5), c_text, font=font_c, fill=(0, 0, 0))
    draw.text((c_x + 1, c_y + 1), c_text, font=font_c, fill=(0, 0, 0))
    draw.text((c_x, c_y), c_text, font=font_c, fill=C_FILL)

    # Draw a second slightly offset C pass for optical boldness
    # (Impact/Arial Black already heavy; double-stamp micro offset)
    draw.text((c_x - 1, c_y), c_text, font=font_c, fill=C_FILL)
    draw.text((c_x + 1, c_y), c_text, font=font_c, fill=C_FILL)

    # Bigger, bolder F on the right
    font_f = load_font(400, heavy=True)
    f_text = "F"
    fb = draw.textbbox((0, 0), f_text, font=font_f)
    fw, fh = fb[2] - fb[0], fb[3] - fb[1]
    f_x = cx + outer_r + 105
    f_y = cy - fh // 2 - fb[1] - 8
    draw.text((f_x + 4, f_y + 5), f_text, font=font_f, fill=(0, 0, 0))
    draw.text((f_x - 1, f_y), f_text, font=font_f, fill=F_FILL)
    draw.text((f_x + 1, f_y), f_text, font=font_f, fill=F_FILL)
    draw.text((f_x, f_y), f_text, font=font_f, fill=F_FILL)

    # Brand wordmark — same new hue family, no teal
    font_brand = load_font(64)
    brand = "CYBERTECH-FAMILY"
    bb = draw.textbbox((0, 0), brand, font=font_brand)
    bw = bb[2] - bb[0]
    brand_x = (W - bw) // 2
    brand_y = 800
    draw.rounded_rectangle(
        [W // 2 - 64, brand_y - 42, W // 2 + 64, brand_y - 36],
        radius=2,
        fill=ACCENT,
    )
    draw.text((brand_x, brand_y), brand, font=font_brand, fill=WHITE)

    font_tag = load_font(26)
    tag = "SECURITY OPERATIONS"
    tb = draw.textbbox((0, 0), tag, font=font_tag)
    tw = tb[2] - tb[0]
    draw.text(((W - tw) // 2, brand_y + 78), tag, font=font_tag, fill=MUTED)

    out = os.path.join(os.path.dirname(os.path.abspath(__file__)), "logo-cybertech-family.jpg")
    img.save(out, "JPEG", quality=96, optimize=True)
    print(f"Saved {out} ({W}x{H})")
    print("Hue: deep indigo + electric violet (teal removed)")


if __name__ == "__main__":
    main()

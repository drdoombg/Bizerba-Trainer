#!/usr/bin/env python3
"""Generate assets/ icons from one shape definition.

    python -m pip install pillow
    python tools/make_icons.py

Writes favicon.svg, favicon.ico, icon-192/512, icon-maskable-512,
apple-touch-icon and og-image. Rerun after changing the geometry below.
"""
import pathlib
import struct
import sys

try:
    from PIL import Image, ImageDraw
except ImportError:
    sys.exit('Pillow is required:  python -m pip install pillow')

ROOT = pathlib.Path(__file__).resolve().parent.parent
OUT = ROOT / 'assets'

INK = '#1b2128'      # bezel / page ink
PAPER = '#ffffff'    # label stock
BAR = '#101418'      # printed bars
AMBER = '#f2b705'    # terminal highlight

S = 512              # design grid
SS = 4               # supersample factor
PAD = 56             # bezel inset
RAD = 108            # bezel corner radius
# label stock inside the bezel
LX0, LY0, LX1, LY1 = 112, 150, 400, 398
LRAD = 14
BARS = [(0, 10), (16, 6), (28, 14), (48, 6), (60, 10), (76, 18), (100, 6), (112, 10),
        (128, 6), (140, 16), (162, 6), (174, 10), (190, 6), (202, 14), (222, 6), (234, 10),
        (250, 18), (274, 6)]      # (offset from label left + 18, width) in design units
BAR_Y0, BAR_Y1 = 268, 356


def rounded(d, box, r, fill):
    d.rounded_rectangle([c * SS for c in box], radius=r * SS, fill=fill)


def render(size, bg=INK, pad=PAD, radius=RAD, bleed=False):
    """Draw the icon at `size` px. bleed=True fills the whole square (maskable)."""
    img = Image.new('RGBA', (S * SS, S * SS), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    if bleed:
        d.rectangle([0, 0, S * SS, S * SS], fill=bg)
    else:
        rounded(d, (pad, pad, S - pad, S - pad), radius, bg)
    # label stock
    rounded(d, (LX0, LY0, LX1, LY1), LRAD, PAPER)
    # amber header strip: the weight/price line on a GLM label
    rounded(d, (LX0 + 18, LY0 + 20, LX1 - 18, LY0 + 52), 6, AMBER)
    # product text line
    rounded(d, (LX0 + 18, LY0 + 70, LX1 - 72, LY0 + 92), 5, '#9aa3ab')
    # barcode
    for off, w in BARS:
        x = LX0 + 18 + off
        if x + w > LX1 - 18:
            break
        d.rectangle([x * SS, BAR_Y0 * SS, (x + w) * SS, BAR_Y1 * SS], fill=BAR)
    return img.resize((size, size), Image.LANCZOS)


def ico(path, sizes=(16, 32, 48, 64)):
    """ICO with PNG-compressed entries (every browser since Vista reads these)."""
    pngs = []
    for s in sizes:
        import io
        b = io.BytesIO()
        render(s).save(b, format='PNG')
        pngs.append(b.getvalue())
    head = struct.pack('<HHH', 0, 1, len(sizes))
    offset = 6 + 16 * len(sizes)
    entries, blobs = b'', b''
    for s, data in zip(sizes, pngs):
        entries += struct.pack('<BBBBHHII', s if s < 256 else 0, s if s < 256 else 0,
                               0, 0, 1, 32, len(data), offset)
        offset += len(data)
        blobs += data
    path.write_bytes(head + entries + blobs)


SVG = f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {S} {S}" role="img" aria-label="Labeller Line Trainer">
  <rect x="{PAD}" y="{PAD}" width="{S - 2 * PAD}" height="{S - 2 * PAD}" rx="{RAD}" fill="{INK}"/>
  <rect x="{LX0}" y="{LY0}" width="{LX1 - LX0}" height="{LY1 - LY0}" rx="{LRAD}" fill="{PAPER}"/>
  <rect x="{LX0 + 18}" y="{LY0 + 20}" width="{LX1 - LX0 - 36}" height="32" rx="6" fill="{AMBER}"/>
  <rect x="{LX0 + 18}" y="{LY0 + 70}" width="{LX1 - LX0 - 90}" height="22" rx="5" fill="#9aa3ab"/>
  <g fill="{BAR}">
{chr(10).join(f'    <rect x="{LX0 + 18 + o}" y="{BAR_Y0}" width="{w}" height="{BAR_Y1 - BAR_Y0}"/>' for o, w in BARS if LX0 + 18 + o + w <= LX1 - 18)}
  </g>
</svg>
'''


def font(size, bold=False):
    """First sans face that exists on this machine; None falls back to Pillow's bitmap."""
    from PIL import ImageFont
    names = (['arialbd.ttf', 'seguisb.ttf', 'DejaVuSans-Bold.ttf', 'LiberationSans-Bold.ttf']
             if bold else
             ['arial.ttf', 'segoeui.ttf', 'DejaVuSans.ttf', 'LiberationSans-Regular.ttf'])
    for n in names:
        try:
            return ImageFont.truetype(n, size)
        except OSError:
            continue
    return ImageFont.load_default(size)


def og():
    """1200x630 social card."""
    W, H = 1200, 630
    img = Image.new('RGB', (W, H), '#eef0f2')
    d = ImageDraw.Draw(img)
    d.rectangle([0, 0, W, 10], fill='#1f5c94')
    mark = render(300)
    img.paste(mark, (84, (H - 300) // 2), mark)
    x = 452
    d.text((x, 212), 'Labeller Line Trainer', font=font(62, True), fill=INK)
    d.text((x, 292), 'Bizerba GLM-I weigh-price labeller', font=font(34), fill='#5b6670')
    d.text((x, 338), 'Terminal, hardware and fault drills', font=font(34), fill='#5b6670')
    d.rounded_rectangle([x, 404, x + 232, 450], radius=8, fill='#1f5c94')
    d.text((x + 22, 414), 'Runs offline', font=font(26, True), fill='#ffffff')
    return img


def main():
    OUT.mkdir(parents=True, exist_ok=True)
    (OUT / 'favicon.svg').write_text(SVG, encoding='utf-8', newline='\n')
    ico(OUT / 'favicon.ico')
    for name, size, kw in [('icon-192.png', 192, {}),
                           ('icon-512.png', 512, {}),
                           ('apple-touch-icon.png', 180, {'pad': 0, 'radius': 0}),
                           ('icon-maskable-512.png', 512, {'bleed': True})]:
        render(size, **kw).save(OUT / name, optimize=True)
    og().save(OUT / 'og-image.png', optimize=True)
    for f in sorted(OUT.iterdir()):
        print(f'{f.name:26} {f.stat().st_size:>7,} bytes')


if __name__ == '__main__':
    main()

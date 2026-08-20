from pathlib import Path
from PIL import Image, ImageDraw, ImageFont

out = Path(r'c:\Users\MFC\Documents\simply-life\frontend\public')
CANVAS = (30, 28, 24)
CREAM = (237, 231, 221)
COPPER = (232, 115, 74)
MUTED = (163, 155, 144)

def make_icon(size: int, pad_ratio: float = 0.0) -> Image.Image:
    img = Image.new('RGBA', (size, size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)
    inset = int(size * pad_ratio)
    inner = size - inset * 2
    radius = int(inner * 0.22)
    box = [inset, inset, inset + inner - 1, inset + inner - 1]
    draw.rounded_rectangle(box, radius=radius, fill=CANVAS)
    font_size = int(inner * 0.38)
    try:
        font = ImageFont.truetype(r'C:\Windows\Fonts\segoeuib.ttf', font_size)
    except OSError:
        font = ImageFont.truetype(r'C:\Windows\Fonts\arialbd.ttf', font_size)
    cx = inset + inner / 2
    cy = inset + inner * 0.46
    draw.text((cx, cy), 'SL', font=font, fill=CREAM, anchor='mm')
    smile_w = inner * 0.42
    smile_y = inset + inner * 0.70
    stroke = max(2, int(inner * 0.055))
    draw.arc(
        [cx - smile_w / 2, smile_y - inner * 0.02, cx + smile_w / 2, smile_y + inner * 0.14],
        start=20,
        end=160,
        fill=COPPER,
        width=stroke,
    )
    return img

def main() -> None:
    specs = [
        (192, 'pwa-192x192.png', 0.0),
        (512, 'pwa-512x512.png', 0.0),
        (512, 'pwa-maskable-512.png', 0.12),
    ]
    for size, name, pad in specs:
        make_icon(size, pad).save(out / name, 'PNG')
        print('wrote', name)

    # Chromium guarda .ico antigo — gera 16/32/48 a partir da marca SL
    ico_sizes = [16, 32, 48]
    ico_imgs = [make_icon(s).convert('RGBA') for s in ico_sizes]
    ico_imgs[0].save(
        out / 'favicon.ico',
        format='ICO',
        sizes=[(s, s) for s in ico_sizes],
        append_images=ico_imgs[1:],
    )
    print('wrote favicon.ico')

    og = Image.new('RGB', (1200, 630), CANVAS)
    draw = ImageDraw.Draw(og)
    icon = make_icon(280)
    og.paste(icon, (120, 175), icon)
    try:
        title_font = ImageFont.truetype(r'C:\Windows\Fonts\segoeuib.ttf', 64)
        sub_font = ImageFont.truetype(r'C:\Windows\Fonts\segoeui.ttf', 28)
    except OSError:
        title_font = ImageFont.truetype(r'C:\Windows\Fonts\arialbd.ttf', 64)
        sub_font = ImageFont.truetype(r'C:\Windows\Fonts\arial.ttf', 28)
    draw.text((440, 250), 'Simply-Life', font=title_font, fill=CREAM)
    draw.text((440, 330), 'Seu sistema operacional pessoal', font=sub_font, fill=MUTED)
    og.save(out / 'og-image.png', 'PNG')
    print('wrote og-image.png')

if __name__ == '__main__':
    main()

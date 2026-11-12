"""DejaVuSans-Bold icin FreeType'in (PIL'in kullandigi) piksel olculerini cikarir.

Kullanim: python -I make_metrics.py <DejaVuSans-Bold.ttf> <cikti.json>
"""
import json
import random
import sys

from PIL import Image, ImageDraw, ImageFont

font_path, out_path = sys.argv[1], sys.argv[2]

CHARS = [chr(c) for c in list(range(32, 127)) + list(range(0xA0, 0x180))]
SIZES = list(range(11, 41))
draw = ImageDraw.Draw(Image.new("L", (10, 10)))

table = {}
for size in SIZES:
    font = ImageFont.truetype(font_path, size)
    rows = {}
    for ch in CHARS:
        left, top, right, bottom = font.getbbox(ch)
        rows[ch] = [font.getlength(ch), left, top, right, bottom]
    table[size] = rows

# Yerlesim kuralini dogrula: metnin kutusu, harf olculerinden yeniden kurulabiliyor mu?
def predict(text, rows):
    pen = 0.0
    left = 0.0
    right = 0.0
    top = None
    bottom = None
    for ch in text:
        adv, l, t, r, b = rows[ch]
        if r > l and b > t:
            top = t if top is None else min(top, t)
            bottom = b if bottom is None else max(bottom, b)
            right = max(right, pen + r)
            left = min(left, pen + l)
        pen += adv
        right = max(right, pen)
    return [left, top, right, bottom]

random.seed(3)
samples = ["Ultrason 4K", "Prof. Dr. Eray Caliskan  |  neobreedai.com", "Ayşe", "Gülşah Çağlayan Yıldız", "İpek Öztürk", "AV To Wa", "jgy"]
for _ in range(300):
    samples.append("".join(random.choice(CHARS[:95] + list("çğıöşüÇĞİÖŞÜ")) for _ in range(random.randint(1, 30))).strip() or "a")

bad = 0
kerning = 0
for size in SIZES:
    font = ImageFont.truetype(font_path, size)
    for text in samples:
        real = list(draw.textbbox((0, 0), text, font=font))
        guess = predict(text, table[size])
        if real != guess:
            bad += 1
            if bad <= 8:
                print("MISMATCH", size, ascii(text), real, guess)
        if abs(font.getlength(text) - sum(table[size][c][0] for c in text)) > 1e-6:
            kerning += 1
print("checked", len(SIZES) * len(samples), "bad", bad, "strings where advance sum differs (kerning)", kerning)
print("fractional advances:", any(abs(v[0] - round(v[0])) > 1e-9 for rows in table.values() for v in rows.values()))

compact = {"chars": "".join(CHARS), "sizes": {}}
for size, rows in table.items():
    compact["sizes"][size] = [[int(round(rows[ch][0]))] + rows[ch][1:] for ch in CHARS]
with open(out_path, "w", encoding="utf-8") as fh:
    json.dump(compact, fh, ensure_ascii=False, separators=(",", ":"))

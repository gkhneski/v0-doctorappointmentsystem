"""Eski NeoBreed kodunu OLDUGU GIBI calistirip referans ciktilar uretir.

Kullanim: python -I make_reference.py <nbreeda/backend> <DejaVuSans-Bold.ttf> <cikti klasoru>
"""
import base64
import importlib.util
import io
import json
import sys
import types

backend, font_path, out_dir = sys.argv[1], sys.argv[2], sys.argv[3]

# dotenv kurulu olmayabilir; eski kod yalnizca load_dotenv() cagiriyor.
dotenv = types.ModuleType("dotenv")
dotenv.load_dotenv = lambda *a, **k: None
sys.modules["dotenv"] = dotenv


def load(name):
    spec = importlib.util.spec_from_file_location(name, f"{backend}/generation/{name}.py")
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


analyzer = load("biometric_analyzer")
u4k = load("ultrasound_4k")
scan = load("scan_line_filter")
frame = load("polaroid_frame")

# Eski sunucu Linux'tu ve DejaVuSans-Bold kullaniyordu; ayni yazi tipini burada da yukle.
from PIL import ImageFont  # noqa: E402

frame._load_font_bold = lambda size: ImageFont.truetype(font_path, size)

CASES = [
    {"name": "bos", "bio": {}, "week": 24, "gender": "female"},
    {"name": "yalniz-bpd", "bio": {"bpd": 60}, "week": 19, "gender": "male"},
    {
        "name": "tam-kagit",
        "bio": {
            "bpd": 63.7, "hc": 235.1, "ac": 210.4, "fl": 46.2, "ofd": 81.3, "fromen": 21.5,
            "nasal_bone": 8.4, "iod": 17.9, "eye_diameter": 9.6, "bioc_cap": 41.2,
            "mouth_diameter": 14.3, "upper_lip": 4.1, "chin": 6.8,
        },
        "week": 26, "gender": "female",
    },
    {
        "name": "uzun-bas",
        "bio": {"bpd": 70, "ofd": 100, "hc": 270, "ac": 250, "fl": 55, "fromen": 30, "chin": 9},
        "week": 30, "gender": "male",
    },
    {
        "name": "yuvarlak-bas",
        "bio": {"bpd": 88, "ofd": 104, "hc": 310, "ac": 320, "fl": 68, "nasal_bone": 11, "iod": 22, "bioc_cap": 55},
        "week": 36, "gender": "female",
    },
    {
        "name": "tam-ortada-yuvarlama",
        "bio": {"bpd": 64, "ofd": 80, "fromen": 8, "chin": 4.25, "nasal_bone": 4.75, "iod": 8.25, "eye_diameter": 6.25,
                "bioc_cap": 40, "mouth_diameter": 8.75, "upper_lip": 2.25},
        "week": 34, "gender": "male",
    },
    {"name": "ofd-var-bpd-yok", "bio": {"ofd": 80, "hc": 200, "ac": 180, "fl": 40, "nasal_bone": 7}, "week": 22, "gender": "female"},
    {"name": "metin-degerler", "bio": {"bpd": "58.25", "hc": "212.5", "ac": "", "fl": None, "iod": "16.05"}, "week": 27, "gender": "male"},
    {"name": "hafta-18", "bio": {"bpd": 41.5, "hc": 152.3, "ac": 128.9, "fl": 27.4}, "week": 18, "gender": "female"},
    {"name": "hafta-40", "bio": {"bpd": 95.5, "hc": 341.5, "ac": 352.5, "fl": 74.5, "ofd": 117.5}, "week": 40, "gender": "male"},
]

prompts = []
for case in CASES:
    analysis = analyzer.analyze_biometrics(case["bio"])
    params = analyzer.generate_ai_parameters(analysis, case["week"], case["gender"])
    prompts.append({
        "name": case["name"],
        "bio": case["bio"],
        "week": case["week"],
        "gender": case["gender"],
        "analysis": analysis,
        "prompt": u4k.build_scientific_prompt(params, {}, "frontal"),
    })

with open(f"{out_dir}/prompts.json", "w", encoding="utf-8") as fh:
    json.dump(prompts, fh, ensure_ascii=False, indent=1)

# ---- Goruntu referanslari ----
import numpy as np  # noqa: E402
from PIL import Image  # noqa: E402


def data_uri(img):
    buf = io.BytesIO()
    img.save(buf, format="PNG")
    return "data:image/png;base64," + base64.b64encode(buf.getvalue()).decode()


def save_uri(uri, path):
    with open(path, "wb") as fh:
        fh.write(base64.b64decode(uri.split(",", 1)[1]))


def synthetic(width, height, seed, noise=True):
    rng = np.random.default_rng(seed)
    yy, xx = np.mgrid[0:height, 0:width].astype(np.float32)
    cx, cy = width / 2, height / 2
    r = np.sqrt(((xx - cx) / (width * 0.35)) ** 2 + ((yy - cy) / (height * 0.42)) ** 2)
    face = np.clip(1.15 - r, 0, 1)
    img = np.zeros((height, width, 3), dtype=np.float32)
    img[..., 0] = 235 * face
    img[..., 1] = 150 * face ** 1.3
    img[..., 2] = 70 * face ** 2
    if noise:
        img += rng.normal(0, 3, img.shape).astype(np.float32)
    # Yatay cizgi bozulmalari: bazi satirlar belirgin sekilde parlak/koyu.
    for row in (rng.choice(np.arange(2, height - 2), size=max(4, height // 14), replace=False) if noise else []):
        img[row] += rng.choice([-38, 34])
    return Image.fromarray(np.clip(img, 0, 255).astype(np.uint8))


scan_input = synthetic(200, 160, 7)
scan_input.save(f"{out_dir}/scan-input.png")
save_uri(scan.remove_scan_lines(data_uri(scan_input)), f"{out_dir}/scan-output.png")

frames = []
for name, (w, h), baby in [
    ("kucuk", (320, 240), ""),
    ("kare", (1024, 1024), "Ayşe"),
    ("dikey", (896, 1152), "Gülşah Çağlayan Yıldız"),
]:
    source = synthetic(w, h, 11, noise=False)
    source.save(f"{out_dir}/frame-{name}-input.png")
    out = frame.add_polaroid_frame(data_uri(source), baby_name=baby)
    save_uri(out, f"{out_dir}/frame-{name}-output.png")
    # Yerlesimi sinamak icin: yazi olculeri.
    from PIL import ImageDraw
    d = ImageDraw.Draw(Image.new("RGBA", (10, 10)))
    bb = int(h * 0.13)
    texts = {
        "label": ("Ultrason 4K", max(11, int(bb * 0.16))),
        "baby": (baby, max(11, int(bb * 0.15))),
        "right": ("Prof. Dr. Eray Caliskan  |  neobreedai.com", max(11, int(bb * 0.14))),
    }
    boxes = {k: list(d.textbbox((0, 0), t, font=ImageFont.truetype(font_path, s))) if t else None for k, (t, s) in texts.items()}
    frames.append({"name": name, "width": w, "height": h, "baby": baby, "boxes": boxes})

with open(f"{out_dir}/frames.json", "w", encoding="utf-8") as fh:
    json.dump(frames, fh, ensure_ascii=False, indent=1)

import PIL  # noqa: E402
print("ok", len(prompts), "prompts; Pillow", PIL.__version__, "numpy", np.__version__)

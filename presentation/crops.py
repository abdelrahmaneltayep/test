from PIL import Image
import json, os, math

D = "/tmp/claude-0/-home-user-test/d071304f-3298-5cba-8f5f-704a2bf6e28d/scratchpad"
OUT = D + "/crops"; os.makedirs(OUT, exist_ok=True)
ASPECT = 2.74          # matches the image slot: what is left after the text fits
OUT_W  = 760

def fit(img, box, aspect=ASPECT):
    """Expand a region of interest to the target aspect, clamped to the image."""
    W, H = img.size
    x1, y1, x2, y2 = box
    w, h = x2 - x1, y2 - y1
    if w / h < aspect:                       # too tall -> widen
        nw = min(W, h * aspect); nh = nw / aspect
    else:                                    # too wide -> heighten
        nh = min(H, w / aspect); nw = nh * aspect
    cx, cy = (x1 + x2) / 2, (y1 + y2) / 2
    nx1 = max(0, min(W - nw, cx - nw / 2))
    ny1 = max(0, min(H - nh, cy - nh / 2))
    return img.crop((round(nx1), round(ny1), round(nx1 + nw), round(ny1 + nh)))

def save(name, img):
    img = img.convert("RGB")
    img = img.resize((OUT_W, round(OUT_W / ASPECT)), Image.LANCZOS)
    p = f"{OUT}/{name}.jpg"
    img.save(p, "JPEG", quality=78, optimize=True, progressive=True)
    return os.path.getsize(p)

# ---------- BEFORE: regions of the recorded walkthrough ----------
BEFORE = {
  # name              frame                     x1   y1    x2    y2
  "b_cart_flat":     ("dense/d005.jpg",         30, 225, 1085,  665),
  "b_cart_moq":      ("dense/d073.jpg",        128, 235,  848,  450),
  "b_cart_summary":  ("dense/d073.jpg",        845, 236, 1080,  336),
  "b_cart_stock":    ("dense/d073.jpg",        130, 240,  475,  385),
  "b_cart_units":    ("dense/d005.jpg",        128, 235,  580,  430),
  "b_review_costs":  ("frames/f005.jpg",        45, 255,  840,  510),
  "b_verify_top":    ("frames/f020.jpg",       150, 180,  960,  520),
  "b_docs":          ("frames/f017.jpg",       160, 215,  945,  520),
  "b_giant":         ("dense/d057.jpg",          5,  95, 1100,  650),
  "b_pin":           ("dense/d020.jpg",        160, 290,  950,  470),
  "b_pay":           ("dense/d079.jpg",        340, 105,  990,  380),
  "b_attach":        ("dense/d079.jpg",        340, 370,  990,  645),
}

sizes = {}
for name, (frame, x1, y1, x2, y2) in BEFORE.items():
    im = Image.open(f"{D}/{frame}")
    sizes[name] = save(name, fit(im, (x1, y1, x2, y2)))

# ---------- AFTER: same treatment, from measured prototype regions ----------
# maxw clips a full-width band to the part that carries the content, so the crop
# is not downscaled into illegibility. mode picks which slice of a tall region
# to keep, since widening a narrow rail would just drag in the page behind it.
TUNE = {
  "a_cart_group":   {"maxw": 660}, "a_cart_moq":     {"maxw": 660},
  "a_cart_stock":   {"maxw": 720}, "a_cart_units":   {"maxw": 720},
  "a_cart_toolbar": {"maxw": 660}, "a_cart_chips":   {"maxw": 720},
  "a_co_cta":       {"maxw": 420},
  "a_co_steps":     {"maxw": 720}, "a_co_verify":    {"maxw": 720},
  "a_co_addr":      {"maxw": 660}, "a_co_window":    {"maxw": 660},
  "a_co_purchase":  {"maxw": 660}, "a_cf_drop":      {"maxw": 660},
  "a_cf_timeline":  {"maxw": 580}, "a_cf_countdown": {"maxw": 660},
  "a_cf_pay":       {"maxw": 660}, "a_doc_row":      {"maxw": 660},
}

meta = json.load(open(D + "/after/boxes.json"))
scale = meta["scale"]
cache = {}
for name, rec in meta["boxes"].items():
    if rec["img"] not in cache:
        cache[rec["img"]] = Image.open(f"{D}/after/{rec['img']}.png")
    im = cache[rec["img"]]
    t = TUNE.get(name, {})
    x1, y1, x2, y2 = [v * scale for v in rec["box"]]
    pad = 14 * scale
    x1, y1 = max(0, x1 - pad), max(0, y1 - pad)
    x2, y2 = min(im.size[0], x2 + pad), min(im.size[1], y2 + pad)
    if t.get("maxw"):
        x2 = min(x2, x1 + t["maxw"] * scale)
    mode = t.get("mode")
    if mode in ("top", "bottom"):
        h = (x2 - x1) / ASPECT
        if mode == "top":
            y2 = min(y2, y1 + h)
        else:
            y1 = max(y1, y2 - h)
    sizes[name] = save(name, fit(im, (x1, y1, x2, y2)))

total = sum(sizes.values())
print(f"{len(sizes)} crops, {total/1024:.0f} KB total, avg {total/len(sizes)/1024:.0f} KB")
print("largest:", sorted(sizes.items(), key=lambda kv: -kv[1])[:4])

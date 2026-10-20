"""Build the dev test app in dev/ from the main app files.

The dev app lives at /training-week/dev/ and is fully separate from the main app on the phone:
its own saved data (keys start with "twdev." instead of "tw."), its own offline cache and
service worker, its own home-screen name and an orange icon. A DEV bar at the top can copy
the main app's data into the dev app (the main app's data is only read, never changed).

Normal flow: build new features in dev/index.html and test them there. When approved, copy
the changes to the root index.html. Run this script to reset dev/ from the main app.
"""
import json, os, re, shutil
from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DEV = os.path.join(ROOT, "dev")
os.makedirs(os.path.join(DEV, "icons"), exist_ok=True)

# --- page
s = open(os.path.join(ROOT, "index.html"), encoding="utf-8").read()
s = s.replace('"tw.', '"twdev.')                                   # separate saved data
s = s.replace("<title>Training Week</title>", "<title>Training Week DEV</title>")
s = s.replace('content="Training">', 'content="TW Dev">')
s = s.replace("training-week-backup-", "training-week-DEV-backup-")
bar_css = """<style>
.devbar{position:sticky;top:0;z-index:20;margin:0 -16px;padding:calc(6px + env(safe-area-inset-top,0px)) 16px 6px;background:#b4410f;color:#fff;display:flex;align-items:center;gap:10px;font-size:13px;font-weight:600}
.devbar b{font-family:var(--display);font-size:16px;letter-spacing:.06em}
.devbar button{margin-left:auto;border:1px solid rgba(255,255,255,.7);background:transparent;color:#fff;border-radius:8px;padding:6px 10px;font-size:13px;font-weight:600;min-height:36px}
header.top{padding-top:12px!important}
</style>
</head>"""
s = s.replace("</head>", bar_css, 1)
bar = """<body>
<div class="devbar" role="note"><b>DEV</b><span>Test app · your plan is safe</span><button type="button" id="devcopy">Copy my data</button></div>
<script>
document.getElementById("devcopy").addEventListener("click", e => {
  const b = e.currentTarget;
  if (!b.dataset.armed) { b.dataset.armed = "1"; b.textContent = "Tap again to replace dev data"; setTimeout(() => { delete b.dataset.armed; b.textContent = "Copy my data"; }, 4000); return; }
  try {
    for (const k of ["program", "logs", "body"]) { const v = localStorage.getItem("tw." + k); if (v !== null) localStorage.setItem("twdev." + k, v); }
    location.reload();
  } catch { b.textContent = "Couldn't copy"; }
});
</script>"""
assert s.count("<body>") == 1
s = s.replace("<body>", bar, 1)
open(os.path.join(DEV, "index.html"), "w", encoding="utf-8").write(s)

# --- service worker: own cache, only cleans up its own old caches
w = open(os.path.join(ROOT, "sw.js"), encoding="utf-8").read()
w = re.sub(r'const CACHE = "training-week-v\d+";', 'const CACHE = "training-week-dev-v1";', w)
w = w.replace('k.startsWith("training-week-v")', 'k.startsWith("training-week-dev-")')
w = w.replace('  if (url.origin === location.origin && url.pathname.includes("/dev/")) return; // the dev app has its own service worker\n', '')
open(os.path.join(DEV, "sw.js"), "w", encoding="utf-8").write(w)

# --- manifest
m = json.load(open(os.path.join(ROOT, "manifest.webmanifest"), encoding="utf-8"))
m.update({"name": "Training Week DEV", "short_name": "TW Dev", "theme_color": "#b4410f",
          "description": "Test version of Training Week – separate data from the main app."})
json.dump(m, open(os.path.join(DEV, "manifest.webmanifest"), "w", encoding="utf-8"), indent=1)

# --- icons: same icon, orange instead of blue
for f in os.listdir(os.path.join(ROOT, "icons")):
    im = Image.open(os.path.join(ROOT, "icons", f)).convert("RGBA")
    px = im.load()
    for y in range(im.height):
        for x in range(im.width):
            r, g, b, a = px[x, y]
            if b > r + 40 and b > g:                                # blue-ish → orange
                t = (b - r) / 255
                px[x, y] = (int(r + (180 - r) * min(1, t * 2)), int(g * 0.55 + 65 * t), int(15 + r * 0.1), a)
    im.save(os.path.join(DEV, "icons", f))
print("dev/ built")

"""Bundle the approved exercise library (review-page sources) into one script for the app.

Sources: tools/library-src/ – the shared 3D engine (engine.js, helpers.js, homelib.js, layout.js) and one
folder per approved review page (samples.js = animations + cards, guides.js = guides, page.html = its CSS).
Output: <target>/library.js which defines one global, TWLIB:
  TWLIB.cards   – [{id, title, fam, wave, section, keys: [[label, key], ...]}]
  TWLIB.guide(card) – {steps, avoid, levels?, knee?, tip?, talk?}
  TWLIB.frame(key, u) – SVG markup for one moment of the movement (0..1)
  TWLIB.anim(key)   – {cap, dur, loop}
  TWLIB.find(name)  – best card for an exercise name, or null
Everything else stays private, so it can't clash with the app's own (older) animation code.
CSS for the drawings is injected once, scoped under .lib.

Usage: python3 tools/build_library.py dev
"""
import os, re, sys, json

HERE = os.path.dirname(os.path.abspath(__file__))
SRC = os.path.join(HERE, "library-src")
ROOT = os.path.dirname(HERE)
target = os.path.join(ROOT, sys.argv[1] if len(sys.argv) > 1 else "dev")

# order = later waves win when two cards share a title (newest approved version)
WAVES = [
    ("wave1", "W1", "Gym basics"), ("wave2", "W2a", "Lower body and hip machines"), ("wave2b", "W2b", "Core and static holds"),
    ("wave2c", "W2c", "Upper body and carries"), ("wave3", "W3", "Balance"), ("wave4", "W4", "Mobility and cardio"),
    ("wave5a", "W5a", "Home – body weight, towel, backpack"), ("wave5b", "W5b", "Home – dumbbells on the floor"),
    ("wave5c", "W5c", "Home – bands and suspension trainer"), ("pistol", "P", "Pistol squat ladder"),
    ("addons", "A", "Strength add-ons"), ("cardioadd", "K", "Cardio add-ons"),
]

def read(*p):
    return open(os.path.join(SRC, *p), encoding="utf-8").read()

# ---------- CSS: every .an*/svg.anim rule from the review pages, later pages win, scoped under .lib
rules = {}
for folder, _, _ in WAVES:
    page = read(folder, "page.html")
    for sel, body in re.findall(r'((?:svg\.anim|\.an[\w-]*)[^{}]*)\{([^{}]*)\}', page):
        for one in sel.split(","):
            one = one.strip()
            if one.startswith(".an") or one.startswith("svg.anim"):
                rules[one] = body
css = "".join(f".lib {s}{{{b}}}" for s, b in rules.items())
css += ".lib svg.anim{width:100%;max-width:320px;height:auto;display:block;margin:0 auto}"

# ---------- JS
parts = ["const TWLIB = (() => {", "'use strict';", read("engine.js"), read("helpers.js"), read("homelib.js")]
parts.append("const SAMPLES = {}, GUIDES = {}, CARDS = [];")
parts.append("""function addWave(tag, label, f) {
  const r = f(); let section = label;
  const cards = (r.CARDS && r.CARDS !== CARDS) ? r.CARDS : Object.keys(r.SAMPLES).map(k => ({ title: k.charAt(0).toUpperCase() + k.slice(1), fam: r.SAMPLES[k].fam || "", keys: [[k, k]], gkey: k }));
  for (const k in r.SAMPLES) SAMPLES[tag + ":" + k] = r.SAMPLES[k];
  for (const c of cards) {
    if (c.section) { section = c.section; continue; }
    const g = r.GUIDES[c.title] || r.GUIDES[c.gkey] || r.GUIDES[c.keys[0][1]] || null;
    const card = { id: tag + ":" + c.keys[0][1], title: c.title, fam: c.fam || "", wave: tag, waveLabel: label, section,
      keys: c.keys.map(([l, k]) => [l, tag + ":" + k]) };
    const old = CARDS.findIndex(x => x.title.toLowerCase() === card.title.toLowerCase());
    if (old >= 0) CARDS.splice(old, 1);
    CARDS.push(card); if (g) GUIDES[card.id] = g;
  }
}""")
for folder, tag, label in WAVES:
    parts.append(f"addWave({json.dumps(tag)}, {json.dumps(label)}, () => {{\n{read(folder, 'samples.js')}\n{read(folder, 'guides.js')}\n"
                 f"return {{ SAMPLES, GUIDES, CARDS: typeof CARDS === 'undefined' ? null : CARDS }};\n}});")
parts.append(read("layout.js").replace(
    "if (document.fonts && document.fonts.ready)", "if (typeof document !== 'undefined' && document.fonts && document.fonts.ready)"))
parts.append("""const norm = s => (s || "").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
function find(name) {
  const n = norm(name); if (!n) return null;
  let c = CARDS.find(x => norm(x.title) === n); if (c) return c;
  for (const x of CARDS) for (const [l] of x.keys) if (norm(l) === n) return x;
  return null;
}
if (typeof document !== 'undefined') { const st = document.createElement('style'); st.textContent = %s; document.head.appendChild(st); }
return {
  cards: CARDS,
  guide: c => GUIDES[c.id] || null,
  frame: (k, u) => sampleFrame(k, u),
  anim: k => { const a = SAMPLES[k]; return a ? { cap: a.cap || ["", ""], dur: a.dur || 3000, loop: !!a.loop } : null; },
  phaseAt, find
};
})();""" % json.dumps(css))
out = "\n".join(parts)
open(os.path.join(target, "library.js"), "w", encoding="utf-8").write(out)
print(f"library.js: {len(out)//1024} KB")

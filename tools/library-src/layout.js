// ---- Cue labels find their own open space.
// For each exercise: draw every frame of the movement into a coarse occupancy grid (figure = expensive,
// equipment = cheaper, floor lines = almost free), then put each label where it covers the least,
// as close to its body part as possible, without crossing other labels or drawing its arrow through the body.
const NO_ARROWS = true;
const CELL = 2, GW = 120, GH = 113, LINEH = 14;
let measureCtx = null;
function textW(t) {                       // real width in the font the page is using (falls back to an estimate)
  try { measureCtx = measureCtx || document.createElement("canvas").getContext("2d"); measureCtx.font = '700 12px Barlow, system-ui, sans-serif'; return measureCtx.measureText(t).width + 2; }
  catch (e) { return t.length * 7.2; }
}
function splitTwo(t) {                     // best two-line break: the space closest to the middle
  const sp = [...t.matchAll(/ /g)].map(m => m.index);
  if (!sp.length) return null;
  const k = sp.reduce((a, b) => Math.abs(b - t.length / 2) < Math.abs(a - t.length / 2) ? b : a);
  return [t.slice(0, k), t.slice(k + 1)];
}
const LAYOUT = {};
function occGrid(a, us) {
  const g = new Float32Array(GW * GH);
  const put = (cx, cy, w) => { if (cx >= 0 && cy >= 0 && cx < GW && cy < GH) { const i = cy * GW + cx; if (g[i] < w) g[i] = w; } };
  const disc = (x, y, r, w) => { for (let cy = Math.floor((y - r) / CELL); cy <= Math.floor((y + r) / CELL); cy++) for (let cx = Math.floor((x - r) / CELL); cx <= Math.floor((x + r) / CELL); cx++) put(cx, cy, w); };
  for (const u of us) {
    if (a.overlay && a.reserve) for (const [x, y, r] of a.reserve(a.frame(u).J, a.cam)) disc(x, y, r, 30);   // keep labels off the head marks
    for (const it of a.frame(u).items) {
      const pts = it.pts.map(a.cam), c = it.cls || "", fig = c === "an3" || c === "an3 far" || c === "an3h";
      const w = fig ? 30 : c === "an3eq" ? 0.5 : 5;
      if (it.type === "dot") disc(pts[0][0], pts[0][1], it.r + 3, w);
      else if (it.type === "line") {
        const r = fig || c === "an3col" || c === "an3pad" ? 6 : 3, [p, q] = pts, n = Math.ceil(Math.hypot(q[0] - p[0], q[1] - p[1]) / 1.5) + 1;
        for (let k = 0; k <= n; k++) disc(p[0] + (q[0] - p[0]) * k / n, p[1] + (q[1] - p[1]) * k / n, r, w);
      } else {
        const xs = pts.map(p => p[0]), ys = pts.map(p => p[1]);
        for (let cy = Math.floor(Math.min(...ys) / CELL); cy <= Math.ceil(Math.max(...ys) / CELL); cy++)
          for (let cx = Math.floor(Math.min(...xs) / CELL); cx <= Math.ceil(Math.max(...xs) / CELL); cx++) {
            const x = cx * CELL + 1, y = cy * CELL + 1; let inside = false;
            for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) {
              const [xi, yi] = pts[i], [xj, yj] = pts[j];
              if ((yi > y) !== (yj > y) && x < (xj - xi) * (y - yi) / (yj - yi) + xi) inside = !inside;
            }
            if (inside) put(cx, cy, c === "an3plate" ? 5 : 3);
          }
      }
    }
  }
  const S = new Float32Array((GW + 1) * (GH + 1));            // prefix sums for fast rectangle cost
  for (let y = 0; y < GH; y++) for (let x = 0; x < GW; x++) S[(y + 1) * (GW + 1) + x + 1] = g[y * GW + x] + S[y * (GW + 1) + x + 1] + S[(y + 1) * (GW + 1) + x] - S[y * (GW + 1) + x];
  const rect = (x0, y0, x1, y1) => {
    const a0 = Math.max(0, Math.floor(x0 / CELL)), b0 = Math.max(0, Math.floor(y0 / CELL)), a1 = Math.min(GW, Math.ceil(x1 / CELL)), b1 = Math.min(GH, Math.ceil(y1 / CELL));
    if (a1 <= a0 || b1 <= b0) return 0;
    return S[b1 * (GW + 1) + a1] - S[b0 * (GW + 1) + a1] - S[b1 * (GW + 1) + a0] + S[b0 * (GW + 1) + a0];
  };
  const at = (x, y) => { const cx = Math.floor(x / CELL), cy = Math.floor(y / CELL); return cx >= 0 && cy >= 0 && cx < GW && cy < GH ? g[cy * GW + cx] : 0; };
  return { rect, at };
}
const PHASE = { A: [0, .1, .2, .3, .4], B: [.6, .7, .8, .9, 1], all: [0, .1, .2, .3, .4, .5, .6, .7, .8, .9, 1] };
const REP = { A: 0, B: 1, all: .5 };
const clash = (a, b) => a === "all" || b === "all" || a === b;
const rectDist = (r, p) => Math.hypot(Math.max(r[0] - p[0], 0, p[0] - r[2]), Math.max(r[1] - p[1], 0, p[1] - r[3]));
function layoutFor(key) {
  if (LAYOUT[key]) return LAYOUT[key];
  const a = SAMPLES[key], grids = {}, placed = [];
  const grid = w => grids[w] || (grids[w] = occGrid(a, PHASE[w]));
  const order = (a.cues || []).map((c, i) => i).sort((i, j) => (a.cues[i].when === "all" ? 0 : 1) - (a.cues[j].when === "all" ? 0 : 1));
  const out = [];
  for (const ci of order) {
    const c = a.cues[ci], G = grid(c.when), two = splitTwo(c.text);
    const variants = [[c.text]].concat(two && c.text.length > 12 ? [two] : []);
    const tgt = a.cam(c.pt(a.frame(REP[c.when]).J));
    const tracks = PHASE[c.when].map(u => a.cam(c.pt(a.frame(u).J)));
    let best = null;
    for (const lines of variants) {
    const w = Math.max(...lines.map(textW)), hh = (lines.length - 1) * LINEH;
    for (let ly = 16; ly <= 220 - hh; ly += 3) for (let lx = w / 2 + 3; lx <= 237 - w / 2; lx += 3) {
      const r = [lx - w / 2 - 3, ly - 12, lx + w / 2 + 3, ly + 4 + hh];
      let cost = G.rect(...r) + (lines.length > 1 ? 8 : 0);
      for (const p of placed) if (clash(p.when, c.when)) {
        if (!(r[2] < p.r[0] || r[0] > p.r[2] || r[3] < p.r[1] || r[1] > p.r[3])) cost += 5000;
        for (const q of p.path) if (q[0] > r[0] && q[0] < r[2] && q[1] > r[1] && q[1] < r[3]) cost += 150;   // don't sit on another label's arrow
      }
      const d = rectDist(r, tgt);
      cost += d * 2.5 + (d < 3 ? 40 : 0);                   // no arrows: sit right beside the part
      if (NO_ARROWS) {} else if (d > 12) {                                          // the arrow should not cut through the body
        const fx = Math.min(Math.max(tgt[0], lx - w / 2 + 6), lx + w / 2 - 6), fy = tgt[1] < ly ? ly - 13 : ly + 5 + hh;
        const L = Math.hypot(tgt[0] - fx, tgt[1] - fy), n = Math.floor(L / 2);
        for (let k = 0; k < n; k++) {
          const t = k / n, x = fx + (tgt[0] - fx) * t, y = fy + (tgt[1] - fy) * t;
          for (const p of placed) if (clash(p.when, c.when) && x > p.r[0] && x < p.r[2] && y > p.r[1] && y < p.r[3]) cost += 150;   // don't cross another label
          if (L * (1 - t) < 10) break; cost += G.at(x, y) * 1.2;
        }
      }
      if (!best || cost < best.cost) best = { cost, lx, ly, r, w, hh, lines };
    }
    }
    const arrow = !NO_ARROWS && tracks.some(p => rectDist(best.r, p) > 10);
    const path = [];
    if (arrow) {
      const fx = Math.min(Math.max(tgt[0], best.lx - best.w / 2 + 6), best.lx + best.w / 2 - 6), fy = tgt[1] < best.ly ? best.ly - 13 : best.ly + 5 + best.hh;
      for (let k = 0; k <= 20; k++) path.push([fx + (tgt[0] - fx) * k / 20, fy + (tgt[1] - fy) * k / 20]);
    }
    placed.push({ when: c.when, r: best.r, path });
    out[ci] = { lx: +best.lx.toFixed(1), ly: best.ly, w: best.w, hh: best.hh, lines: best.lines, arrow };
  }
  return (LAYOUT[key] = out);
}
function sampleFrame(key, u) {
  const a = SAMPLES[key], { items, J } = a.frame(u), cam = a.cam, L = layoutFor(key), f = n => n.toFixed(1);
  const cues = (a.cues || []).map((c, i) => {
    const o = c.when === "B" ? clamp01((u - .55) / .3) : c.when === "A" ? clamp01((.45 - u) / .3) : 1;
    if (o <= 0) return "";
    const p = cam(c.pt(J)), l = L[i];
    const text = `<text x="${l.lx}" y="${l.ly}" text-anchor="middle">${l.lines.map((t, k) => `<tspan x="${l.lx}" dy="${k ? LINEH : 0}">${t}</tspan>`).join("")}</text>`;
    let arrow = "";
    if (l.arrow) {
      const fx = Math.min(Math.max(p[0], l.lx - l.w / 2 + 6), l.lx + l.w / 2 - 6), fy = p[1] < l.ly ? l.ly - 13 : l.ly + 5 + l.hh;
      const ang = Math.atan2(p[1] - fy, p[0] - fx), tip = [p[0] - Math.cos(ang) * 3, p[1] - Math.sin(ang) * 3];
      const h1 = [tip[0] - Math.cos(ang - .45) * 8, tip[1] - Math.sin(ang - .45) * 8], h2 = [tip[0] - Math.cos(ang + .45) * 8, tip[1] - Math.sin(ang + .45) * 8];
      arrow = `<line x1="${f(fx)}" y1="${f(fy)}" x2="${f(tip[0])}" y2="${f(tip[1])}"/><path d="M${f(tip[0])} ${f(tip[1])}L${f(h1[0])} ${f(h1[1])}L${f(h2[0])} ${f(h2[1])}Z"/>`;
    }
    return `<g class="an-cue" opacity="${o.toFixed(2)}">${arrow}${text}</g>`;
  }).join("");
  return draw3(items, cam) + (a.overlay ? a.overlay(J, cam, u) : "") + cues;
}
// once the app font has loaded, measure again so labels fit the real text
if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => { for (const k in LAYOUT) delete LAYOUT[k]; });

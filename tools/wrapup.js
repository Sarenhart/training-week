// ===== 12-week wrap-up + "Start new programme" (Christian 2026-11-03 design, 2026-11-13 decisions)
// Five story cards (tap through, numbers count up) → summary page. The summary numbers of each programme are kept on the phone
// in HIST_KEY (not the workouts themselves). Lifetime totals for badges = this programme's logs + every other programme's summary.
const HIST_KEY = "twdev.history";
const WU_COL = { blue: "#6693ff", orange: "#ff8a4c", pink: "#ff4fa3" }, WU_GREEN = "#43cf7f";
const progKey = P => (P = P || S.program) ? P.pid || (P.start + "|" + P.title) : "";
function histList() { const h = jget(HIST_KEY); return Array.isArray(h.programmes) ? h.programmes.filter(p => p && typeof p === "object") : []; }
function histSave(list) { jset(HIST_KEY, { programmes: list }); }
function histUpsert(sum) { const list = histList().filter(p => p.key !== sum.key); list.push(sum); list.sort((a, b) => (a.start || "").localeCompare(b.start || "")); histSave(list); }
// totals of every programme except the one running now (so a wrapped-up programme that's still on the phone isn't counted twice)
function histPast() {
  const cur = progKey(), t = { programmes: [], kg: 0, workouts: 0, cardioMin: 0, extras: 0, balBlocks: 0, holdSec: 0 };
  for (const p of histList()) { if (p.key === cur) continue; t.programmes.push(p.key); for (const k of ["kg", "workouts", "cardioMin", "extras", "balBlocks", "holdSec"]) t[k] += +p[k] || 0; }
  return t;
}
const nsp = n => Math.round(n).toLocaleString("en").replace(/,/g, " ");

// ---- the numbers of the programme on the phone now
function wrapSummary() {
  const P = S.program, tw = totalWeeks(), full = w => REQ.every(k => isDone(w, k)), bl = badgeList(), here = bl.here || {};
  const logs = Object.values(S.logs), fin = logs.filter(l => l.finished);
  const workouts = fin.filter(l => l.workout !== "c").length, extras = fin.filter(l => l.workout === "c").length;
  let sets = 0, kg = 0; for (const l of logs) { const st = stats(l); sets += st.done; kg += st.vol; }
  const grid = Array.from({ length: tw }, (_, i) => full(i + 1) ? 2 : REQ.some(k => isDone(i + 1, k)) ? 1 : 0);
  // stronger: first real weight (after a "find your weight" session) → last weight, per exercise with at least 3 sessions
  const lifts = [];
  for (const [n, a] of Object.entries(sessionsByExercise())) {
    let i = 0; while (i < a.length - 1 && a[i].finding) i++;
    const first = a[i]?.finding && i + 1 < a.length ? a[i + 1] : a[i], last = a[a.length - 1];
    if (!first || a.length < 3 || first === last) continue;
    if (first.kg < 0 && /pull-up|chin-up|dip/i.test(n)) { if (last.kg > first.kg) lifts.push({ n, a: first.kg, b: last.kg, help: true, pct: 0 }); continue; }
    if (first.kg > 0 && last.kg > first.kg) lifts.push({ n, a: first.kg, b: last.kg, pct: Math.round((last.kg - first.kg) / first.kg * 100) });
  }
  // main lifts first (the first loaded exercise of each workout – bench press, RDL …), then the rest
  const main = new Set(); P.phases.forEach(ph => Object.values(ph.workouts || {}).forEach(w => { const e = (w.exercises || []).find(x => x.inc && !x.bw && !/^Warm-up/.test(x.name)); if (e) main.add(e.name); }));
  lifts.forEach(l => l.main = main.has(l.n));
  lifts.sort((x, y) => (x.help - y.help) || (y.main - x.main) || y.pct - x.pct || y.b - x.b);
  const top = lifts.filter(l => !l.help).slice(0, 4).concat(lifts.filter(l => l.help).slice(0, 1));
  // body: the entry nearest before the start (else the first after it) → the latest one
  const bd = Object.values(S.body || {}).filter(b => b && b.date).sort((a, b) => a.date.localeCompare(b.date));
  const b0 = bd.filter(b => b.date <= P.start).pop() || bd[0], b1 = bd[bd.length - 1], body = [];
  if (b0 && b1 && b0 !== b1) for (const m of METRICS) { const x = +b0[m.k], y = +b1[m.k]; if (x && y && Math.abs(y - x) >= 0.1) body.push({ k: m.k, n: m.n, u: m.u, a: x, b: y }); }
  const saved = jget(BADGE_KEY), mine = Object.entries(saved).filter(([, d]) => d >= P.start).sort((a, b) => b[1].localeCompare(a[1])), badges = mine.length;
  const wk = Array.from({ length: tw }, (_, i) => { const w = i + 1; let kgw = 0, nw = 0;
    for (const k of WK) { const l = S.logs[logId(w, k)]; if (!l) continue; kgw += stats(l).vol; if (l.finished) nw++; }
    return { kg: Math.round(kgw), n: nw, min: typeof weekMinutes === "function" ? weekMinutes(w) : 0 }; });
  const dates = fin.map(l => (l.finishedAt || "").slice(0, 10) || l.date).filter(Boolean).sort();
  return { key: progKey(), title: P.title || "Programme", goal: loadProfile()?.answers?.goal || null, start: P.start, end: dates[dates.length - 1] || today(),
    weeks: tw, planned: tw * REQ.length, workouts, extras, extraPlanned: WK.includes("c") ? tw : 0, sets, kg: Math.round(kg),
    pbs: bl.pbs || 0, best: bl.best || 0, grid, cardioMin: here.cmin || 0, balBlocks: here.balBlocks || 0, holdSec: here.holdSec || 0,
    lifts: top, body, badges, badgeIds: mine.map(([id]) => id), wk, stopped: null, reason: null };
}
// Wrap-up is due after the last planned workout of the last week – or a week after that week was started, if it's never completed
function wrapDue() {
  if (!S.program) return false; const tw = totalWeeks();
  if (REQ.every(k => isDone(tw, k))) return true;
  const d = REQ.map(k => S.logs[logId(tw, k)]).filter(l => l && l.finished).map(l => (l.finishedAt || "").slice(0, 10) || l.date).sort()[0];
  return !!d && (new Date(today()) - new Date(d)) / 864e5 >= 7;
}
// on opening the app and after a workout: show it once by itself (the Programme and Workout tabs keep a way back to it)
function wrapCheck() {
  if (!wrapDue() || S.program.wrapShown || S.ob || S.weekDone || S.wrap) return false;
  if (inWorkout()) return false;
  wrapOpen(false); return true;
}
function wrapOpen(preview, sum, startAt) {
  sum = sum || wrapSummary();
  if (!preview && sum.key === progKey()) { histUpsert(sum); if (!S.program.wrapShown) { S.program.wrapShown = today(); saveProgram(); } }
  S.wrap = { sum, i: startAt || 0, preview: !!preview, current: sum.key === progKey() };
  wrapRender(true);
}
function wrapClose() { clearTimeout(S.wrap?.timer); S.wrap = null; wrapRender(); render(); }

// ---- story cards
function wuColours(goal) {
  const order = ["blue", "orange", "pink"], c = (S.wrap?.current && typeof accentNow === "function") ? accentNow() : (GOAL_COLOUR[goal] || "blue");
  const rest = order.filter(x => x !== c); return [WU_COL[c], WU_COL[rest[0]], WU_COL[rest[1]]];
}
function wuCompare(kg) {
  const L = [[1500, "a family car", "family cars", "kg1500"], [6000, "an elephant", "elephants", "kg6k"], [40000, "a loaded truck", "loaded trucks", "kg40k"],
    [150000, "a blue whale", "blue whales", "kg150k"], [400000, "a jumbo jet", "jumbo jets", "kg400k"]];
  let pick = L[0]; for (const o of L) if (kg >= o[0] * 0.8) pick = o;
  const r = kg / pick[0], txt = r < 1 ? `Almost ${pick[1]}.` : r < 1.15 ? `As heavy as ${pick[1]}.` : r < 2 ? `More than ${pick[1]}.` : `As heavy as ${Math.floor(r)} ${pick[2]}.`;
  return { txt, art: pick[3] };
}
// Christian 2026-11-13 (round 2): every card gets its own moment instead of the same count-up –
// 1 a weight counts up and drops with a thud, cracks and the "as heavy as" shadow · 2 "Wow!" + swooshing bars
// 3 the 12-week calendar glimmers box by box + best weeks · 4 a line spirals in to the journey figure · 5 trophy + newest badges
const WU_TROPHY = `<path d="M7 3h10v3a5 5 0 0 1-10 0zM4.5 4H7v2.4A2.6 2.6 0 0 1 4.5 4zm15 0H17v2.4A2.6 2.6 0 0 0 19.5 4zM11 11.5h2v4h3.5v3.5h-9v-3.5H11z"/>`;
const WU_BCOL = { streak: "#ff8a4c", pb: "#ffd75e", mile: "#43cf7f", gift: "#c98a52" };
function wuCards(s) {
  const [P, O, O2] = wuColours(s.goal), cards = [], cols = [P, O, O2, WU_GREEN, "#fff", "#ffd75e"];
  const chip = (t, c) => `<span class="wuchip" style="color:${c}">${t}</span>`;
  const glow = c => `<div class="wuglow" style="background:${c}"></div>`;
  const later = (W, ms, f) => setTimeout(() => { if (S.wrap === W) f(); }, ms);
  // 1 · kg lifted: the weight counts up, drops all the way to the floor (thud, shake) and breaks it (dark 3D cracks); the shadow figure rises behind
  const t = s.kg >= 10000, cmp = wuCompare(s.kg);
  cards.push({ c: P, dur: 8200, h: `${glow(P)}<div class="wuk" style="color:${P}">Your ${s.weeks} weeks</div>
    <div class="wustage"><div class="wusub wuafter">${nsp(s.kg)} kg lifted.<br><b>${esc(cmp.txt)}</b></div>
      <svg class="wushadow" viewBox="0 0 24 24" fill="currentColor" style="color:${P}">${BADGE_ART[cmp.art] || ""}</svg>
      ${wuFloor(P)}
      <div class="wuwt"><i class="wuhandle"></i><div class="wubody" style="--c:${P}"><span data-hero="1" data-count="${t ? Math.round(s.kg / 1000) : s.kg}">0</span><small>${t ? "t" : "kg"}</small></div></div></div>`,
    run(ph, W) {
      wuCount(ph, 1700, () => { ph.querySelector(".wuwt").classList.add("drop"); wuSfx("fall");
        later(W, 520, () => { wuSfx("thud"); wuBuzz([110, 40, 60]); ph.classList.add("shake"); ph.querySelector(".wustage").classList.add("hit");
          wuBurst(ph.querySelector(".wuimpact"), ["#9aa0b0", "#c9ccd6", "#6b7080"], 18, true); });
        later(W, 1100, () => ph.querySelector(".wustage").classList.add("ghost"));
        later(W, 1600, () => ph.querySelector(".wuafter").classList.add("on")); });
    } });
  // 2 · stronger: the bars swoosh in first, "Wow!" lands last
  const w = s.lifts.filter(l => !l.help), maxp = Math.max(1, ...w.map(l => l.pct));
  const word = w.length ? (w[0].pct >= 15 ? "Wow!" : "Nice!") : "Solid!";
  const R0 = 700, RS = 480, wowAt = R0 + s.lifts.length * RS + 450;
  const row = (l, i) => { const r = l.help ? `−${fmt(l.b - l.a)} kg help` : `+${l.pct} %`, wd = l.help ? Math.min(100, Math.round((1 - l.b / l.a) * 100)) : Math.round(l.pct / maxp * 90);
    return `<div class="wurow" style="--d:${R0 + i * RS}ms"><div><span>${esc(l.help ? l.n.replace(/^Assisted /, "") + " help" : l.n)}</span><b style="color:${WU_GREEN}">${r}</b></div><i><span style="width:${Math.max(6, wd)}%;background:${WU_GREEN};box-shadow:0 0 10px ${WU_GREEN}"></span></i></div>`; };
  cards.push({ c: WU_GREEN, dur: wowAt + 3600, h: `${glow(WU_GREEN)}<div class="wuk" style="color:${WU_GREEN}">Stronger</div>
    <div class="wurows">${s.lifts.map(row).join("")}</div>
    <div class="wuwowbox" style="--wd:${wowAt}ms"><div class="wuwow" style="color:${WU_GREEN};text-shadow:0 0 28px ${WU_GREEN}aa">${[...word].map((ch, i) => `<span style="--i:${i}">${esc(ch)}</span>`).join("")}</div><div class="wuamaze">You're amazing!</div>
    ${w.length ? `<div class="wusub">${esc(w[0].n)} <b>${fmt(w[0].a)} → ${fmt(w[0].b)} kg</b></div>` : `<div class="wusub"><b>${nsp(s.sets)} sets</b> done – every one of them counts.</div>`}</div>
    <div class="wubot">${s.pbs ? chip(`${s.pbs} personal best${s.pbs > 1 ? "s" : ""}`, WU_GREEN) : ""}${chip(`${nsp(s.sets)} sets`, WU_GREEN)}</div>`,
    run(ph, W) {
      ph.querySelectorAll(".wurow").forEach(r => later(W, parseInt(r.style.getPropertyValue("--d")), () => wuSfx("swoosh")));
      later(W, wowAt + 150, () => { wuSfx("land"); wuBuzz([20, 40, 30]); wuBurst(ph.querySelector(".wuwow"), [WU_GREEN, "#fff", "#ffd75e"], 24); });
    } });
  // 3 · showing up: the calendar glimmers, then the best weeks
  const circ = 2 * Math.PI * 50, frac = s.weeks ? s.best / s.weeks : 0, per = 3;
  const lit = []; s.grid.forEach((g, i) => { if (g === 2) lit.push(i); });
  const GL = 1000, GS = 240, bestAt = GL + lit.length * GS + 300;
  const best = (s.wk || []).map((x, i) => ({ ...x, w: i + 1 })).filter(x => x.n).sort((a, b) => isCardioGoal(s) ? b.min - a.min : (b.kg - a.kg) || (b.n - a.n)).slice(0, 3);
  let cal = ""; for (let r = 0; r * per < s.grid.length; r++) cal += `<div class="wucrow"><span>Phase ${r + 1}</span>${s.grid.slice(r * per, r * per + per).map((g, j) => `<i class="g${g}" data-w="${r * per + j}" style="--o:${O}">${r * per + j + 1}</i>`).join("")}</div>`;
  cards.push({ c: O, dur: Math.max(7500, bestAt + 4200), h: `${glow(O)}<div class="wuk" style="color:${O}">Showing up</div>
    <div class="wustreak"><svg class="wuring sm" viewBox="0 0 120 120"><circle cx="60" cy="60" r="50" fill="none" stroke="#232734" stroke-width="12"/><circle class="wuarc2" cx="60" cy="60" r="50" fill="none" stroke="${O}" stroke-width="12" stroke-linecap="round" stroke-dasharray="0 400" transform="rotate(-90 60 60)" style="filter:drop-shadow(0 0 6px ${O})"/><text class="wuringn" x="60" y="74" text-anchor="middle" font-size="46" font-weight="900" fill="#fff">0</text></svg>
      <div><b>${s.best >= s.weeks ? `All ${s.weeks} weeks` : `${s.best} week${s.best === 1 ? "" : "s"}`} in a row</b><span>${s.workouts}/${s.planned} workouts${s.extras ? ` · +${s.extras} extra${s.extras > 1 ? "s" : ""}` : ""}</span></div></div>
    <div class="wucal">${cal}</div>
    ${best.length ? `<div class="wubest"><div class="wusec2">Best weeks</div>${best.map((x, i) => `<div class="wubw" style="--d:${i * 160}ms"><b style="color:${O}">${i + 1}</b><span>Week ${x.w}</span><small>${x.n} workout${x.n > 1 ? "s" : ""}${isCardioGoal(s) ? ` · ${x.min} min` : x.kg ? ` · ${nsp(x.kg)} kg` : ""}</small></div>`).join("")}</div>` : ""}`,
    run(ph, W) {
      const arc = ph.querySelector(".wuarc2"), num = ph.querySelector(".wuringn");
      lit.forEach((wi, k) => later(W, GL + k * GS, () => { const box = ph.querySelector(`.wucal i[data-w="${wi}"]`); if (!box) return; box.classList.add("lit"); wuSfx("glim", k); wuBurst(box, [O, "#fff", "#ffd75e"], 7, false, 34);
        const f = (k + 1) / lit.length; arc.setAttribute("stroke-dasharray", `${(circ * frac * f).toFixed(1)} 400`); num.textContent = Math.round(s.best * f); }));
      later(W, bestAt, () => { ph.querySelector(".wubest")?.classList.add("on"); if (best.length) wuSfx("pop"); });
    } });
  // 4 · on the move: a line spirals in to the figure while the hours add up
  if (s.cardioMin >= 30) {
    const life = s.cardioMin + (s.key === progKey() ? histPast().cardioMin : 0), J = journeyBadges(life), got = J.filter(j => j[4]), next = J.find(j => !j[4]);
    const hrs = s.cardioMin / 60, nh = next ? Math.round(parseFloat(next[3].replace(/[ ,]/g, ""))) : 0, fig = got[got.length - 1] || J[0];
    cards.push({ c: P, dur: 8000, h: `${glow(P)}<div class="wuk" style="color:${P}">On the move</div>${hrs >= 1 ? `<div class="wubig" style="color:${P};text-shadow:0 0 24px ${P}88"><span data-hero="1" data-count="${Math.round(hrs)}">0</span><span class="wuu"> h</span></div>` : `<div class="wubig" style="color:${P};text-shadow:0 0 24px ${P}88"><span data-hero="1" data-count="${s.cardioMin}">0</span><span class="wuu"> min</span></div>`}
      <div class="wusub">of cardio${got.length ? ` – you've made it <b>${esc(fig[2])}</b>.` : "."}</div>
      ${wuGps(P, BADGE_ART[fig[5] || fig[0]] || BADGE_ICON.mile)}
      ${next ? `<div class="wubot"><div class="wunext">Next stop · ${esc(next[2])} · ${Math.max(1, Math.ceil(nh - life / 60))} h</div><i class="wubar"><span style="width:${Math.min(100, Math.round(life / 60 / nh * 100))}%;background:${P};box-shadow:0 0 10px ${P}"></span></i></div>` : ""}`,
      run(ph, W) { wuGpsRun(ph, W, 2300); wuCount(ph, 2300, () => { const f = ph.querySelector(".wufig"); f.classList.add("on"); wuSfx("land"); wuBuzz(18); wuBurst(f, cols, 22); }); } });
  }
  // 5 · finale: trophy, workouts, body, newest badges
  const bchips = s.body.filter(b => ["weight", "waist", "arm", "chest", "thigh"].includes(b.k)).slice(0, 3).map((b, i) => {
    const dd = Math.round((b.b - b.a) * 10) / 10, nm = b.k === "weight" ? "" : b.n.replace(" (flexed)", "") + " ";
    return chip(`${esc(nm)}${dd > 0 ? "+" : "−"}${fmt(Math.abs(dd))} ${b.u}`, [P, WU_GREEN, O][i]); }).join("");
  const BL = {}; try { badgeList().list.forEach(b => BL[b.id] = b); } catch {}
  const nb = (s.badgeIds || []).map(id => BL[id]).filter(Boolean).slice(0, 6);
  const bico = b => { const c = b.icon === "phase" ? P : WU_BCOL[b.icon] || WU_GREEN; return `<div class="wubdg" style="--bc:${c}"><span><svg viewBox="0 0 24 24" fill="currentColor">${BADGE_ART[b.art || b.id] || BADGE_ICON[b.icon] || ""}</svg></span><small>${esc(b.title)}</small></div>`; };
  cards.push({ c: O, fin: true, h: `${glow(O)}<div class="wuk c" style="color:${P}">Programme complete</div>
    <div class="wutrophywrap sm"><div class="wurays" style="--rc:${O}"></div><svg class="wutrophy" viewBox="0 0 24 24" fill="${O}" style="filter:drop-shadow(0 0 18px ${O})">${WU_TROPHY}
      <path class="wurim" pathLength="1" d="M7.2 3.1H16.8" fill="none" stroke="#fff" stroke-width=".7" stroke-linecap="round"/>
      <g class="wuflare"><circle cx="16.8" cy="3.1" r="4.2" fill="url(#wufg)"/><path d="M16.8 -7 17.3 2.6 27 3.1 17.3 3.6 16.8 13.2 16.3 3.6 6.6 3.1 16.3 2.6z" fill="#fff"/><path d="M16.8 3.1 19.6 .3M16.8 3.1 14 5.9M16.8 3.1 19.6 5.9M16.8 3.1 14 .3" stroke="#fff" stroke-width=".35" stroke-linecap="round"/><defs><radialGradient id="wufg"><stop offset="0" stop-color="#fff"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></radialGradient></defs></g></svg></div>
    <div class="wufin">${s.workouts}<span class="dim">/${s.planned}</span></div>
    <div class="wusub c">workouts${s.extras ? ` · +${s.extras} extra${s.extras > 1 ? "s" : ""}` : ""}</div>
    <div class="wuchips">${bchips}</div>
    ${nb.length ? `<div class="wubadges"><div class="wusec2 c">Newest badges · ${s.badges} earned</div><div class="wubgrid">${nb.map(bico).join("")}</div></div>` : ""}
    <div class="wubot"><button type="button" class="wucta" data-act="wusum" style="background:${P};box-shadow:0 0 20px ${P}88">See your summary →</button></div>`,
    run(ph, W) {
      later(W, 650, () => { wuSfx("fanfare"); wuBuzz([40, 60, 40, 60, 120]); });
      later(W, 1300, () => ph.querySelector(".wutrophywrap").classList.add("shine"));
      later(W, 1950, () => { wuSfx("shing"); wuBuzz(25); });
      ph.querySelectorAll(".wubdg").forEach((el, i) => later(W, 2600 + i * 260, () => { el.classList.add("on"); wuSfx("glim", i + 2); wuBurst(el, [el.style.getPropertyValue("--bc"), "#fff"], 8, false, 40); }));
    } });
  return cards;
}
const isCardioGoal = s => s.goal === "Cardio";
// card 1 floor: a perspective slab, a dent and dark cracks with a lit upper edge (fake depth); fixed pattern so it looks the same each time
function wuFloor(P) {
  let seed = 7; const rnd = () => (seed = (seed * 9301 + 49297) % 233280) / 233280, ox = 150, oy = 18, cracks = [];
  for (let b = 0; b < 9; b++) {
    let a = (b / 9) * Math.PI * 2 + rnd() * 0.5, x = ox, y = oy, w = 7.5; const L = [], R = [], E = [];
    for (let k = 0; k < 7; k++) { a += (rnd() - 0.5) * 0.9; const st = 14 + rnd() * 18, nx = x + Math.cos(a) * st, ny = Math.max(4, y + Math.sin(a) * st * 0.32);
      const px = -Math.sin(a), py = Math.cos(a) * 0.32; L.push([x + px * w, y + py * w]); R.unshift([x - px * w, y - py * w]); E.push([x, y]); x = nx; y = ny; w *= 0.74; }
    L.push([x, y]); cracks.push({ poly: L.concat(R), edge: E.concat([[x, y]]) });
  }
  const pts = p => p.map(q => q[0].toFixed(1) + "," + q[1].toFixed(1)).join(" ");
  return `<svg class="wufloorsvg" viewBox="0 0 300 90" preserveAspectRatio="none"><defs><linearGradient id="wuslab" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#1d2130"/><stop offset="1" stop-color="#0b0d12"/></linearGradient>
    <radialGradient id="wudent"><stop offset="0" stop-color="#000" stop-opacity=".85"/><stop offset=".6" stop-color="#000" stop-opacity=".45"/><stop offset="1" stop-color="#000" stop-opacity="0"/></radialGradient></defs>
    <polygon points="34,0 266,0 300,90 0,90" fill="url(#wuslab)"/><line x1="34" y1="0" x2="266" y2="0" stroke="${P}" stroke-opacity=".55" stroke-width="1.2"/>
    <g class="wucr"><ellipse cx="${ox}" cy="${oy}" rx="92" ry="11" fill="url(#wudent)"/>
    ${cracks.map(c => `<polyline points="${pts(c.edge.map(q => [q[0], q[1] - 1.3]))}" fill="none" stroke="#5a6278" stroke-opacity=".7" stroke-width="1.1" stroke-linejoin="round"/><polygon points="${pts(c.poly)}" fill="#020203"/><polyline points="${pts(c.edge.map(q => [q[0], q[1] + 1.1]))}" fill="none" stroke="#000" stroke-opacity=".6" stroke-width="1.4"/>`).join("")}</g>
    <circle class="wuimpact" cx="${ox}" cy="${oy}" r="1" fill="none"/></svg>`;
}
// card 4: a GPS-style route on a ground plane, drawn from the bottom of the screen into the distance; the figure is the end point
function wuGps(P, art) {
  return `<svg class="wugps" viewBox="0 0 300 330" style="--p:${P}"><defs><linearGradient id="wuhz" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${P}" stop-opacity=".45"/><stop offset="1" stop-color="${P}" stop-opacity="0"/></linearGradient>
    <linearGradient id="wufadeg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#000"/><stop offset=".25" stop-color="#fff"/></linearGradient><mask id="wufade"><rect width="300" height="330" fill="url(#wufadeg)"/></mask></defs>
    <rect x="0" y="22" width="300" height="50" fill="url(#wuhz)" opacity=".55"/>
    <g mask="url(#wufade)"><g class="wugrid2" stroke="${P}" stroke-opacity=".2" stroke-width="1"></g>
    <polygon class="wuroutep" fill="${P}" style="filter:drop-shadow(0 0 6px ${P})"/><polyline class="wuroutec" fill="none" stroke="#fff" stroke-opacity=".8" stroke-width="1.4"/></g>
    <g class="wufigm" style="color:${P}"><g class="wufig"><circle cx="0" cy="-34" r="34" fill="#0b0d12" stroke="${P}" stroke-width="2.5" style="filter:drop-shadow(0 0 10px ${P})"/>
      <path d="M-9 -4L0 6L9 -4z" fill="${P}"/><svg x="-24" y="-58" width="48" height="48" viewBox="0 0 24 24" fill="currentColor">${art}</svg></g></g>
    <g class="wuself"><circle cx="150" cy="306" r="16" fill="${P}" opacity=".25" class="wuselfp"/><circle cx="150" cy="306" r="8" fill="#fff" style="filter:drop-shadow(0 0 8px ${P})"/><path d="M150 292l6 10h-12z" fill="#fff"/></g></svg>`;
}
const wuRouteX = z => 0.55 * Math.sin(z * 7.5 + 0.4) * (1 - z * 0.5) + 0.1 * Math.sin(z * 19);
// first person: you are the dot at the bottom; the world moves towards you along the route until the figure (the end point) is close
function wuGpsRun(ph, W, D) {
  const poly = ph.querySelector(".wuroutep"), cen = ph.querySelector(".wuroutec"), grid = ph.querySelector(".wugrid2"), fig = ph.querySelector(".wufigm"); if (!poly) return;
  const K = 5, HY = 40, BY = 306, END = 0.9, t0 = performance.now();
  const proj = (x, z) => { const sc = 1 / (1 + z * K); return [150 + x * 170 * sc, HY + (BY - HY) * sc, sc]; };
  const f = q => q.map(v => v[0].toFixed(1) + "," + v[1].toFixed(1)).join(" ");
  const frame = c => {
    const cx = wuRouteX(c), pts = [];
    for (let i = 0; i <= 90; i++) { const z = c + (1 - c) * i / 90; pts.push(proj(wuRouteX(z) - cx, z - c)); }
    poly.setAttribute("points", f(pts.map(([x, y, sc]) => [x - 10 * sc, y]).concat(pts.map(([x, y, sc]) => [x + 10 * sc, y]).reverse())));
    cen.setAttribute("points", f(pts));
    let g = ""; const off = (c * 10) % 1;                     // cross lines rush towards you, side lines follow the road
    for (let i = 0; i < 12; i++) { const z = (i + 1 - off) / 10; if (z <= 0) continue; const [, y] = proj(0, z); g += `<line x1="0" y1="${y.toFixed(1)}" x2="300" y2="${y.toFixed(1)}"/>`; }
    for (let i = -5; i <= 5; i++) { const a = proj(i * 0.45 - cx * 0.6, 0), b2 = proj(i * 0.45 - cx * 0.6, 3); g += `<line x1="${a[0].toFixed(1)}" y1="${a[1].toFixed(1)}" x2="${b2[0].toFixed(1)}" y2="${b2[1].toFixed(1)}"/>`; }
    grid.innerHTML = g;
    const [fx, fy, fs] = proj(wuRouteX(1) - cx, 1 - c); fig.setAttribute("transform", `translate(${fx.toFixed(1)} ${fy.toFixed(1)}) scale(${(0.35 + 1.4 * fs).toFixed(3)})`);
  };
  frame(0);
  const step = t => { if (S.wrap !== W) return; const p = Math.min(1, (t - t0) / D), e = p < 0.5 ? 2 * p * p : 1 - Math.pow(-2 * p + 2, 2) / 2;
    frame(e * END); if (p < 1) requestAnimationFrame(step); };
  requestAnimationFrame(step);
}

// ---- summary page (also what's opened from "Your programmes" on Progress)
function wuSummaryHtml(s) {
  const [P, O] = wuColours(s.goal), d = iso => iso ? shortDate(iso) : "";
  const cnt = (v, pre, post) => `${pre || ""}<span data-count="${v}">${nsp(v)}</span>${post || ""}`;
  const tile = (v, l, c) => `<div class="wutile"><b style="color:${c}">${v}</b><span>${l}</span></div>`;
  const cmin = s.cardioMin || 0, cardio = cmin >= 60 ? Math.round(cmin / 60) + " h" : cmin + " min";
  const tiles = [tile(cnt(s.workouts, "", "/" + s.planned), "Workouts", P), tile(cnt(s.extras || 0, "+"), "Extras", P), tile(s.kg >= 10000 ? cnt(Math.round(s.kg / 1000), "", " t") : cnt(s.kg, "", " kg"), "Lifted", WU_GREEN),
    tile(cnt(s.pbs || 0), "Personal bests", WU_GREEN), tile(cnt(s.best, "", " wk"), "Best streak", O), cmin ? tile(cmin >= 60 ? cnt(Math.round(cmin / 60), "", " h") : cnt(cmin, "", " min"), "Cardio", WU_GREEN) : tile(cnt(s.sets || 0), "Sets", WU_GREEN)];
  const rows = (arr, f) => arr.map(f).join("");
  const lift = l => `<div class="wuline"><span>${esc(l.help ? l.n.replace(/^Assisted /, "") + " help" : l.n)}</span><span>${l.help ? `${fmt(-l.a)} → ${fmt(-l.b)}` : `${fmt(l.a)} → ${fmt(l.b)}`} <b style="color:${WU_GREEN}">${l.help ? `−${fmt(l.b - l.a)} kg` : `+${l.pct} %`}</b></span></div>`;
  const bod = b => { const dd = Math.round((b.b - b.a) * 10) / 10; return `<div class="wuline"><span>${esc(b.n)}</span><span>${fmt(b.a)} → ${fmt(b.b)} <b style="color:${WU_GREEN}">${dd > 0 ? "+" : "−"}${fmt(Math.abs(dd))} ${b.u}</b></span></div>`; };
  const stopped = s.stopped != null;
  return `<div class="wusum"><div class="wusumtop">${`<div class="wuglow" style="background:${P};top:-160px;left:-10px"></div>`}
    <div class="wumedal" data-medal="1" style="border-color:${P};box-shadow:0 0 30px ${P}88,inset 0 0 20px ${P}55;color:${P}"><b>${stopped ? s.stopped : s.weeks}</b><small>${stopped ? "WEEKS" : "WEEKS"}</small></div>
    <h2>${stopped ? "Stopped in week " + s.stopped : "You did it!"}</h2><div class="wudim">${esc(s.title)} · ${d(s.start)} – ${d(s.end)}</div></div>
    <div class="wutiles">${tiles.join("")}</div>
    ${s.lifts?.length ? `<div class="wusec">Stronger</div>${rows(s.lifts, lift)}` : ""}
    ${s.body?.length ? `<div class="wusec">Your body</div>${rows(s.body, bod)}` : ""}
    ${s.badges ? `<div class="wusec">Badges</div><div class="wuline"><span>Earned during the programme</span><b>${s.badges}</b></div>` : ""}
    <div class="wubtns">${S.wrap?.current ? `<button type="button" class="wucta" data-act="npstart" style="background:${P};box-shadow:0 0 20px ${P}88">Start your next programme →</button>` : ""}
    ${S.wrap?.preview ? `<div class="wudim c">DEV preview – the wrap-up isn't saved, but the button really starts a new programme in DEV.</div>` : ""}
    <button type="button" class="wughost" data-act="wuclose">Close</button></div></div>`;
}
// ---- render + the "dopamine" layer (Christian 2026-11-13): cards slide in and build up piece by piece, the big number pops
// with a sparkle burst, ding and buzz; streak squares light one by one; the finale gets rays, fanfare and confetti.
// Cards move on by themselves (bar fills) – tap to skip, hold to pause. Sound can be turned off (speaker, top right).
const WU_DUR = 6500, WU_SND = "twdev.wusound";
const wuQuiet = () => { try { return localStorage.getItem(WU_SND) === "off"; } catch { return false; } };
const wuCalm = () => { try { return matchMedia("(prefers-reduced-motion: reduce)").matches; } catch { return false; } };
function wuAudio() {
  if (wuQuiet()) return null;
  if (!S.audio) { try { S.audio = new (window.AudioContext || window.webkitAudioContext)(); } catch { return null; } }
  if (S.audio.state === "suspended") S.audio.resume().catch(() => {});
  return S.audio;
}
function wuTone(f, at, dur, vol, type, f2) {
  const ctx = wuAudio(); if (!ctx) return; const t = ctx.currentTime + at;
  const o = ctx.createOscillator(), g = ctx.createGain(); o.type = type || "sine"; o.frequency.setValueAtTime(f, t); if (f2) o.frequency.exponentialRampToValueAtTime(f2, t + dur);
  g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vol, t + 0.012); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  o.connect(g).connect(ctx.destination); o.start(t); o.stop(t + dur + 0.02);
}
function wuNoise(dur, vol, f1, f2) {                         // filtered noise: swoosh (rising) or the crunch of a thud (falling)
  const ctx = wuAudio(); if (!ctx) return; const n = Math.floor(ctx.sampleRate * dur), buf = ctx.createBuffer(1, n, ctx.sampleRate), d = buf.getChannelData(0);
  for (let i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1) * Math.sin(Math.PI * i / n);
  const src = ctx.createBufferSource(), bp = ctx.createBiquadFilter(), g = ctx.createGain(), t = ctx.currentTime; src.buffer = buf; bp.type = "bandpass"; bp.Q.value = 1.2;
  bp.frequency.setValueAtTime(f1, t); bp.frequency.exponentialRampToValueAtTime(f2, t + dur); g.gain.value = vol; src.connect(bp).connect(g).connect(ctx.destination); src.start(t);
}
function wuSfx(kind, arg) {
  if (kind === "tick") wuTone(1900, 0, 0.03, 0.035, "square");
  else if (kind === "whoosh") wuTone(520, 0, 0.18, 0.05, "sine", 180);
  else if (kind === "pop") { wuTone(660, 0, 0.09, 0.08, "triangle", 990); }
  else if (kind === "land") { wuTone(1046.5, 0, 0.35, 0.12, "sine"); wuTone(1568, 0.07, 0.45, 0.1, "sine"); wuTone(2093, 0.14, 0.5, 0.05, "triangle"); }
  else if (kind === "thud") { wuTone(80, 0, 0.8, 0.6, "sine", 28); wuTone(52, 0, 0.9, 0.4, "triangle", 24); wuNoise(0.45, 0.45, 1400, 90); setTimeout(() => wuNoise(0.3, 0.12, 2500, 600), 90); }
  else if (kind === "fall") wuTone(900, 0, 0.5, 0.05, "sine", 160);
  else if (kind === "shing") { wuTone(2637, 0, 0.9, 0.07, "sine"); wuTone(3951, 0.03, 0.8, 0.05, "sine"); wuTone(5274, 0.06, 0.6, 0.03, "triangle"); wuNoise(0.25, 0.05, 6000, 9000); }
  else if (kind === "swoosh") wuNoise(0.38, 0.16, 500, 3200);
  else if (kind === "glim") { const N = [1568, 1760, 2093, 2349, 2637, 3136, 3520, 4186], f = N[Math.min(N.length - 1, arg || 0)]; wuTone(f, 0, 0.5, 0.06, "sine"); wuTone(f * 1.5, 0.04, 0.35, 0.025, "sine"); wuTone(f * 2, 0.08, 0.25, 0.015, "triangle"); }
  else if (kind === "sparkle") for (let i = 0; i < 5; i++) wuTone(2200 + Math.random() * 1600, i * 0.05, 0.12, 0.03, "sine");
  else if (kind === "fanfare") { [523.3, 659.3, 784, 1046.5].forEach((f, i) => wuTone(f, i * 0.11, 0.3, 0.1, "triangle"));
    [523.3, 659.3, 784, 1046.5].forEach(f => wuTone(f, 0.48, 1.1, 0.06, "sine")); wuSfx2(); }
}
function wuSfx2() { setTimeout(() => wuSfx("sparkle"), 600); }
const wuBuzz = p => { try { if (!wuQuiet() && navigator.vibrate) navigator.vibrate(p); } catch {} };
function wuBurst(el, cols, n, dust, spread) {                             // star sparkles flying out of an element
  if (!el || wuCalm()) return; const ph = el.closest(".wuph") || document.getElementById("wuov"); if (!ph) return;
  const r = el.getBoundingClientRect(), pr = ph.getBoundingClientRect(), cx = r.left + r.width / 2 - pr.left + (ph.scrollLeft || 0), cy = r.top + r.height / 2 - pr.top + (ph.scrollTop || 0);
  for (let i = 0; i < (n || 18); i++) { const sp = document.createElement("i"), a = dust ? Math.PI + Math.random() * Math.PI : Math.random() * Math.PI * 2, d = (spread || 50) + Math.random() * (spread ? spread : 110), z = dust ? 8 + Math.random() * 12 : 6 + Math.random() * 9;
    sp.className = dust ? "wusp wudust" : "wusp"; sp.style.cssText = `left:${cx}px;top:${cy}px;width:${z}px;height:${z}px;background:${cols[i % cols.length]};--dx:${Math.cos(a) * d}px;--dy:${Math.sin(a) * d}px;animation-delay:${Math.random() * 0.12}s`;
    ph.appendChild(sp); setTimeout(() => sp.remove(), 1300); }
}
function wuTwinkle(ph, c) {                                 // small stars twinkling in the background
  if (wuCalm()) return;
  for (let i = 0; i < 16; i++) { const t = document.createElement("i"); t.className = "wutw";
    t.style.cssText = `left:${Math.random() * 100}%;top:${Math.random() * 100}%;animation-delay:${(Math.random() * 3).toFixed(2)}s;animation-duration:${(2 + Math.random() * 2.5).toFixed(2)}s;${i % 3 ? "" : `background:${c}`}`;
    ph.insertBefore(t, ph.firstChild); }
}
const WU_SPK = `<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 9v6h4l5 4V5L8 9z" fill="currentColor"/>`;
const wuSpkBtn = () => `<button type="button" class="wusnd" data-act="wusnd" aria-label="${wuQuiet() ? "Sound on" : "Sound off"}">${WU_SPK}${wuQuiet() ? `<path d="M17 9l5 6M22 9l-5 6"/>` : `<path d="M16.5 8.5a5 5 0 0 1 0 7M19 6a8.5 8.5 0 0 1 0 12"/>`}</svg></button>`;
function wrapRender(first, dir) {
  const ov = document.getElementById("wuov"), W = S.wrap; if (!ov) return;
  clearTimeout(W?.timer); if (W) W.timer = null;
  if (!W) { ov.hidden = true; ov.innerHTML = ""; document.body.classList.remove("wuopen"); return; }
  const cards = wuCards(W.sum), n = cards.length, sum = W.i >= n, [P, O, O2] = wuColours(W.sum.goal), cols = [P, O, O2, WU_GREEN, "#fff", "#ffd75e"];
  document.body.classList.add("wuopen"); ov.hidden = false;
  if (sum) {
    ov.innerHTML = `<div class="wuph wuscroll wuin">${wuSpkBtn()}${wuSummaryHtml(W.sum)}</div>`; ov.scrollTop = 0;
    const ph = ov.firstChild; [...ph.querySelectorAll(".wutile,.wusec,.wuline,.wubtns")].forEach((el, i) => { el.classList.add("wust"); el.style.setProperty("--d", 500 + i * 70 + "ms"); });
    if (first || W.justSum) { confetti(); setTimeout(confetti, 700); wuSfx("fanfare"); wuBuzz([30, 50, 30, 50, 80]); setTimeout(() => wuBurst(ph.querySelector("[data-medal]"), cols, 26), 450); }
    W.justSum = false; setTimeout(() => wuCount(ph, 1200), 500); return;
  }
  const c = cards[W.i], auto = !c.fin;
  ov.innerHTML = `<div class="wuph wuin ${dir < 0 ? "wuback" : ""}" data-act="wutap" style="--dur:${c.dur || WU_DUR}ms"><div class="wubars">${cards.map((x, i) => `<i>${i < W.i ? `<b style="width:100%;background:${c.c}"></b>` : i === W.i ? `<b class="${auto ? "fill" : ""}" style="background:${c.c};${auto ? "" : "width:100%"}"></b>` : ""}</i>`).join("")}</div>
    ${wuSpkBtn()}<button type="button" class="wux" data-act="wuclose" aria-label="Close">✕</button>${c.h}</div>`;
  const ph = ov.firstChild; wuTwinkle(ph, c.c);
  [...ph.children].filter(el => !el.matches(".wubars,.wux,.wusnd,.wuglow,.wutw")).forEach((el, i) => { el.classList.add("wust"); el.style.setProperty("--d", 120 + i * 140 + "ms"); });
  ph.querySelectorAll(".wuchip").forEach((el, i) => { el.classList.add("wust"); el.style.setProperty("--d", 700 + i * 160 + "ms"); });
  if (dir || first) wuSfx(first ? "pop" : "whoosh");
  setTimeout(() => { if (S.wrap === W) c.run ? c.run(ph, W) : wuCount(ph, 1100); }, 350);
  W.left = c.dur || WU_DUR; W.t0 = performance.now(); if (auto) W.timer = setTimeout(() => wuNext(1), W.left);
}
function wuCount(root, D, onLand) {                                   // numbers count up; the hero number lands with a pop, sparkles, ding and buzz
  const W = S.wrap, els = [...root.querySelectorAll("[data-count]")], t0 = performance.now(); D = D || 1000;
  els.forEach(el => { el.dataset.to = el.dataset.count; el.textContent = "0"; });
  const hero = els.find(el => el.dataset.hero), cols = (() => { const [P, O, O2] = wuColours(W?.sum?.goal); return [P, O, O2, WU_GREEN, "#fff", "#ffd75e"]; })();
  let lastTick = 0, landed = false;
  const step = t => { if (S.wrap !== W) return; const p = Math.min(1, (t - t0) / D), e = 1 - Math.pow(1 - p, 3);
    els.forEach(el => { const to = +el.dataset.to, dec = +el.dataset.dec || 0, v = to * e; el.textContent = dec ? fmt(Math.round(v * 10 ** dec) / 10 ** dec) : nsp(v); });
    if (hero && p < 1 && t - lastTick > 75) { lastTick = t; wuSfx("tick"); }
    if (p < 1) requestAnimationFrame(step);
    else if (hero && !landed && onLand) { landed = true; onLand(); }
    else if (hero && !landed) { landed = true; const box = hero.closest(".wubig,.wufin,svg") || hero; box.classList.remove("land"); void box.getBoundingClientRect(); box.classList.add("land");
      wuSfx("land"); wuBuzz(18); wuBurst(hero.closest(".wubig,.wufin") || box, cols, 22); }
  };
  requestAnimationFrame(step);
}
function wuNext(dir) {
  const W = S.wrap; if (!W) return; const n = wuCards(W.sum).length;
  if (dir < 0) { if (W.i > 0) W.i--; else return wrapRender(false, -1); } else { W.i++; if (W.i >= n) W.justSum = true; }
  wrapRender(false, dir);
}
function wrapTap(ev) {
  const W = S.wrap; if (!W) return;
  if (W.held) { W.held = false; return; }                   // releasing a hold doesn't skip
  wuNext(ev.clientX / window.innerWidth < 0.3 ? -1 : 1);
}
function wuPause(on) {                                       // hold to pause (story style)
  const W = S.wrap, ph = document.querySelector("#wuov .wuph:not(.wuscroll)"); if (!W || !ph || wuCards(W.sum)[W.i]?.fin) return;
  if (on) { clearTimeout(W.timer); W.timer = null; W.left -= performance.now() - W.t0; ph.classList.add("paused"); }
  else if (!W.timer) { ph.classList.remove("paused"); W.t0 = performance.now(); W.timer = setTimeout(() => wuNext(1), Math.max(300, W.left)); }
}
document.addEventListener("pointerdown", ev => { const W = S.wrap; if (!W || !ev.target.closest('.wuph[data-act="wutap"]') || ev.target.closest("button")) return;
  clearTimeout(W.holdT); W.holdT = setTimeout(() => { W.held = true; wuPause(true); }, 230); });
document.addEventListener("pointerup", () => { const W = S.wrap; if (!W) return; clearTimeout(W.holdT); if (W.held) wuPause(false); });
document.addEventListener("pointercancel", () => { const W = S.wrap; if (!W) return; clearTimeout(W.holdT); if (W.held) { W.held = false; wuPause(false); } });

// ---- Start new programme
const NP_REASONS = ["Too hard", "Too easy", "Pain or injury", "New goal", "Less time to train", "Changed gym or training at home", "Want something new"];
function npOpen() {
  if (wrapDue()) { npSetup(null); return; }                   // after the last week: straight to the questions
  S.np = { reasons: [], other: "", otherOn: false }; npRender();
}
function npRender() {
  const ov = document.getElementById("wuov"), N = S.np; if (!ov) return;
  if (!N) { if (!S.wrap) { ov.hidden = true; ov.innerHTML = ""; document.body.classList.remove("wuopen"); } return; }
  const cw = currentWeek(), ok = N.reasons.length || (N.otherOn && N.other.trim());
  ov.hidden = false;
  ov.innerHTML = `<div class="npsheet" role="dialog" aria-labelledby="np-title"><div class="eyebrow">Week ${cw} of ${totalWeeks()}</div><h2 id="np-title">Start a new programme?</h2>
    <p class="muted">Why do you want to change? Pick one or more.</p>
    <div class="obchips">${NP_REASONS.map(r => `<button type="button" class="obchip" data-act="npreason" data-v="${esc(r)}" aria-pressed="${N.reasons.includes(r)}">${esc(r)}</button>`).join("")}
      <button type="button" class="obchip" data-act="npother" aria-pressed="${N.otherOn}">Other</button></div>
    ${N.otherOn ? `<label class="f">Your reason<input type="text" id="np-other" data-np="other" value="${esc(N.other)}" maxlength="200" placeholder="Tell us in your own words"></label>` : ""}
    <div class="note">This programme is saved in your history as <b>Stopped in week ${cw}</b>. Your badges and totals so far are kept, and your weights carry over.</div>
    <div class="wdbtns"><button type="button" class="btn" data-act="npgo" ${ok ? "" : "disabled"}>Continue</button><button type="button" class="btn ghost" data-act="npcancel">Keep my programme</button></div></div>`;
}
function npSetup(reason) {
  S.np = null; S.wrap = null; wrapRender();
  const goal = loadProfile()?.answers?.goal || null;
  obStart(true); S.ob.newProg = { stopped: wrapDue() ? null : currentWeek(), reason, goal }; render();
}
// the old programme's last weights, 10 % lighter (Christian 2026-11-13: app logic only, no message) – the normal rules take it back up
function carryWeights() {
  const out = {};
  for (const n of Object.keys(sessionsByExercise())) { const l = prevBest(n, "w99"); if (l) out[n.toLowerCase()] = l.finding ? l.lastKg : l.kg; }
  return out;
}
function carryApply(P, carry) {
  const bw = bodyWeightOn(today()); let n = 0;
  P.phases.forEach(ph => Object.values(ph.workouts || {}).forEach(w => (w.exercises || []).forEach(e => {
    if (!e.inc || /^Warm-up sets/.test(e.name)) return; const kg = carry[e.name.toLowerCase()]; if (kg == null) return;
    let v;
    if (e.bw) v = bw ? Math.max(-80, Math.round((kg - 0.1 * (bw + kg)) / e.inc) * e.inc) : kg;    // assisted: 10 % less of the load you lift = a little more help
    else v = Math.max(0, snapKg(e, kg * 0.9));
    e.kg = Math.round(v * 100) / 100; e.carried = true; n++; })));
  return n;
}
function npBuild(a) {                                       // called from obFinish when the setup was opened for a new programme
  const np = S.ob.newProg; badgesCheck();
  const sum = wrapSummary(); sum.goal = np.goal; if (np.stopped) { sum.stopped = np.stopped; sum.reason = np.reason; } histUpsert(sum);
  const carry = carryWeights(), P = generatePlan(a); P.pid = "p" + Date.now().toString(36);
  if (carryApply(P, carry)) P.carried = true;
  S.program = P; S.logs = {}; syncKeys(); S.week = null; S.wk = null; S.guides = new Set();
  for (const k of [WD_KEY, PC_KEY, BB_KEY]) try { localStorage.removeItem(k); } catch {}
  const bo = jget(BONUS_KEY); jset(BONUS_KEY, bo.off ? { off: true } : {});
  try { saveLocal(); } catch {}
  toast("Your new programme is ready. Week 1 starts now.");
}
// cards on the Workout and Programme tabs
function wrapCard(where) {
  if (!S.program || !wrapDue()) return "";
  return `<div class="card wucard"><div class="eyebrow">Programme complete</div><h2>Your ${totalWeeks()} weeks are done</h2>
    <div class="row" style="gap:8px;flex-wrap:wrap"><button type="button" class="btn" data-act="npstart">Start your next programme</button><button type="button" class="btn ghost" data-act="wuopen">See your wrap-up</button></div></div>`;
}
function npLink() { return S.program && !wrapDue() ? `<div class="nplink"><button type="button" class="linkbtn" data-act="npstart">Start a new programme</button></div>` : ""; }
function histHtml() {
  const list = histList().filter(p => p.key !== progKey() || p.stopped != null).slice().reverse(); if (!list.length) return "";
  return `<h2 class="sec">Your programmes</h2>` + list.map(p => `<button type="button" class="hist histp" data-act="wuhist" data-k="${esc(p.key)}"><div><div class="d">${shortDate(p.start)} – ${shortDate(p.end)}</div><div class="t">${esc(p.title)}</div></div>
    <div class="v num">${p.stopped != null ? `Stopped wk ${p.stopped}` : `${p.weeks} weeks`}<small>${p.workouts}/${p.planned} workouts · ${p.kg >= 10000 ? Math.round(p.kg / 1000) + " t" : nsp(p.kg) + " kg"}</small></div></button>`).join("");
}
function wrapClick(a, b, ev) {
  switch (a) {
    case "wutap": if (ev.target.closest("button")) return true; wrapTap(ev); return true;
    case "wusum": S.wrap.i = 99; S.wrap.justSum = true; wrapRender(false); return true;
    case "wusnd": { try { localStorage.setItem(WU_SND, wuQuiet() ? "on" : "off"); } catch {} b.outerHTML = wuSpkBtn(); if (!wuQuiet()) wuSfx("pop"); return true; }
    case "wuclose": wrapClose(); return true;
    case "wuopen": wrapOpen(false); return true;
    case "wuhist": { const s = histList().find(p => p.key === b.dataset.k); if (s) { S.wrap = { sum: s, i: 99, preview: false, current: false }; wrapRender(true); } return true; }
    case "npstart": npOpen(); return true;
    case "npreason": { const v = b.dataset.v, R = S.np.reasons; S.np.reasons = R.includes(v) ? R.filter(x => x !== v) : R.concat(v); npRender(); return true; }
    case "npother": S.np.otherOn = !S.np.otherOn; npRender(); if (S.np.otherOn) document.getElementById("np-other")?.focus(); return true;
    case "npcancel": S.np = null; npRender(); return true;
    case "npgo": { const N = S.np; npSetup({ list: N.reasons.slice(), other: N.otherOn ? N.other.trim() : "" }); return true; }
  }
  return false;
}
document.addEventListener("input", ev => {                 // typing the own reason must not redraw (keeps the phone keyboard)
  const t = ev.target; if (!S.np || t.dataset.np !== "other") return;
  S.np.other = t.value; const go = document.querySelector('[data-act="npgo"]'); if (go) go.disabled = !(S.np.reasons.length || S.np.other.trim());
});
window.addEventListener("twdev:wrappop", () => { if (!S.program || S.ob) return; S.np = null; wrapOpen(true); });   // DEV preview

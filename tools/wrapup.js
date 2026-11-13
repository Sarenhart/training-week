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
  const saved = jget(BADGE_KEY), badges = Object.values(saved).filter(d => d >= P.start).length;
  const dates = fin.map(l => (l.finishedAt || "").slice(0, 10) || l.date).filter(Boolean).sort();
  return { key: progKey(), title: P.title || "Programme", goal: loadProfile()?.answers?.goal || null, start: P.start, end: dates[dates.length - 1] || today(),
    weeks: tw, planned: tw * REQ.length, workouts, extras, extraPlanned: WK.includes("c") ? tw : 0, sets, kg: Math.round(kg),
    pbs: bl.pbs || 0, best: bl.best || 0, grid, cardioMin: here.cmin || 0, balBlocks: here.balBlocks || 0, holdSec: here.holdSec || 0,
    lifts: top, body, badges, stopped: null, reason: null };
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
function wrapClose() { S.wrap = null; wrapRender(); render(); }

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
function wuCards(s) {
  const [P, O, O2] = wuColours(s.goal), cards = [];
  const big = (v, u, c, dec) => `<div class="wubig" style="color:${c};text-shadow:0 0 24px ${c}88"><span data-count="${v}" data-dec="${dec || 0}">${dec ? String(v).replace(".", ",") : nsp(v)}</span><span class="wuu">${u}</span></div>`;
  const chip = (t, c) => `<span class="wuchip" style="color:${c}">${t}</span>`;
  const glow = c => `<div class="wuglow" style="background:${c}"></div>`;
  // 1 · kg lifted
  const t = s.kg >= 10000, cmp = wuCompare(s.kg);
  cards.push({ c: P, h: `${glow(P)}<div class="wuk" style="color:${P}">Your ${s.weeks} weeks</div>${t ? big(Math.round(s.kg / 1000), " t", P) : big(s.kg, " kg", P)}
    <div class="wusub">${nsp(s.kg)} kg lifted.<br><b>${esc(cmp.txt)}</b></div>
    <svg class="wuart" viewBox="0 0 24 24" fill="currentColor" style="color:${P};filter:drop-shadow(0 0 12px ${P}88)">${BADGE_ART[cmp.art] || ""}</svg>` });
  // 2 · stronger
  const w = s.lifts.filter(l => !l.help), maxp = Math.max(1, ...w.map(l => l.pct)), row = (l) => {
    const r = l.help ? `−${fmt(l.b - l.a)} kg help` : `+${l.pct} %`, wd = l.help ? Math.min(100, Math.round((1 - l.b / l.a) * 100)) : Math.round(l.pct / maxp * 90);
    return `<div class="wurow"><div><span>${esc(l.help ? l.n.replace(/^Assisted /, "") + " help" : l.n)}</span><b style="color:${WU_GREEN}">${r}</b></div><i><span style="width:${Math.max(6, wd)}%;background:${WU_GREEN};box-shadow:0 0 10px ${WU_GREEN}"></span></i></div>`; };
  cards.push({ c: WU_GREEN, h: `${glow(WU_GREEN)}<div class="wuk" style="color:${WU_GREEN}">Stronger</div>` + (w.length
    ? `${big(w[0].pct, "%", WU_GREEN).replace('class="wubig"', 'class="wubig plus"')}<div class="wusub">${esc(w[0].n)} <b>${fmt(w[0].a)} → ${fmt(w[0].b)} kg</b></div><div class="wurows">${s.lifts.map(row).join("")}</div>`
    : `${big(s.sets, "", WU_GREEN)}<div class="wusub">sets done – <b>every one of them counts.</b></div>`) +
    `<div class="wubot">${s.pbs ? chip(`${s.pbs} personal best${s.pbs > 1 ? "s" : ""}`, WU_GREEN) : ""}${chip(`${nsp(s.sets)} sets`, WU_GREEN)}</div>` });
  // 3 · showing up
  const circ = 2 * Math.PI * 50, frac = s.weeks ? s.best / s.weeks : 0;
  cards.push({ c: O, h: `${glow(O)}<div class="wuk" style="color:${O}">Showing up</div>
    <svg class="wuring" viewBox="0 0 120 120"><circle cx="60" cy="60" r="50" fill="none" stroke="#232734" stroke-width="12"/><circle class="wuarc" cx="60" cy="60" r="50" fill="none" stroke="${O}" stroke-width="12" stroke-linecap="round" stroke-dasharray="${(circ * frac).toFixed(1)} 400" transform="rotate(-90 60 60)" style="filter:drop-shadow(0 0 6px ${O})"/>
    <text x="60" y="66" text-anchor="middle" font-size="44" font-weight="900" fill="#fff" data-count="${s.best}">${s.best}</text><text x="60" y="82" text-anchor="middle" font-size="7" font-weight="700" fill="#9aa0b0" letter-spacing=".6">WEEK${s.best === 1 ? "" : "S"} IN A ROW</text></svg>
    <div class="wusub c">${s.best >= s.weeks ? `Every planned workout, <b>all ${s.weeks} weeks.</b>` : s.best > 1 ? `Every planned workout, <b>${s.best} weeks straight.</b>` : s.best === 1 ? `<b>A full week</b> of every planned workout.` : `<b>${s.workouts} workouts</b> done.`}</div>
    <div class="wugrid">${s.grid.map(g => `<i class="g${g}" style="${g === 2 ? `background:${O};box-shadow:0 0 8px ${O}` : ""}"></i>`).join("")}</div>
    <div class="wubot">${chip(`${s.workouts}/${s.planned} workouts`, O)}${s.extras ? chip(`+${s.extras} extra${s.extras > 1 ? "s" : ""}`, O) : ""}</div>` });
  // 4 · on the move (only with some cardio) – the journey uses lifetime minutes, like the badges
  if (s.cardioMin >= 30) {
    const life = s.cardioMin + (s.key === progKey() ? histPast().cardioMin : 0), J = journeyBadges(life), got = J.filter(j => j[4]), next = J.find(j => !j[4]);
    const hrs = s.cardioMin / 60, nh = next ? Math.round(parseFloat(next[3].replace(/[ ,]/g, ""))) : 0;
    cards.push({ c: P, h: `${glow(P)}<div class="wuk" style="color:${P}">On the move</div>${hrs >= 1 ? big(Math.round(hrs), " h", P) : big(s.cardioMin, " min", P)}
      <div class="wusub">of cardio${got.length ? ` – you've made it <b>${esc(got[got.length - 1][2])}</b>.` : "."}</div>
      <svg class="wuart sm" viewBox="0 0 24 24" fill="currentColor" style="color:${P};filter:drop-shadow(0 0 10px ${P}88)">${BADGE_ART[(got[got.length - 1] || J[0])[5] || (got[got.length - 1] || J[0])[0]] || BADGE_ICON.mile}</svg>
      ${next ? `<div class="wubot"><div class="wunext">Next stop · ${esc(next[2])} · ${Math.max(1, Math.ceil(nh - life / 60))} h</div><i class="wubar"><span style="width:${Math.min(100, Math.round(life / 60 / nh * 100))}%;background:${P};box-shadow:0 0 10px ${P}"></span></i></div>` : ""}` });
  }
  // 5 · finale
  const bchips = s.body.filter(b => ["weight", "waist", "arm", "chest", "thigh"].includes(b.k)).slice(0, 3).map((b, i) => {
    const d = Math.round((b.b - b.a) * 10) / 10, nm = b.k === "weight" ? "" : b.n.replace(" (flexed)", "") + " ";
    return chip(`${esc(nm)}${d > 0 ? "+" : "−"}${fmt(Math.abs(d))} ${b.u}`, [P, WU_GREEN, O][i]); }).join("");
  cards.push({ c: O, h: `${glow(O)}<div class="wuk c" style="color:${P}">Programme complete</div>
    <svg class="wutrophy" viewBox="0 0 24 24" fill="${O}" style="filter:drop-shadow(0 0 18px ${O})"><path d="M7 3h10v3a5 5 0 0 1-10 0zM4.5 4H7v2.4A2.6 2.6 0 0 1 4.5 4zm15 0H17v2.4A2.6 2.6 0 0 0 19.5 4zM11 11.5h2v4h3.5v3.5h-9v-3.5H11z"/></svg>
    <div class="wufin"><span data-count="${s.workouts}">${s.workouts}</span><span class="dim">/${s.planned}</span></div>
    <div class="wusub c">workouts${s.extras ? ` · +${s.extras} extra${s.extras > 1 ? "s" : ""}` : ""} · ${s.badges} badge${s.badges === 1 ? "" : "s"}</div>
    <div class="wuchips">${bchips}</div>
    <div class="wubot"><button type="button" class="wucta" data-act="wusum" style="background:${P};box-shadow:0 0 20px ${P}88">See your summary →</button></div>` });
  return cards;
}
// ---- summary page (also what's opened from "Your programmes" on Progress)
function wuSummaryHtml(s) {
  const [P, O] = wuColours(s.goal), d = iso => iso ? shortDate(iso) : "";
  const tile = (v, l, c) => `<div class="wutile"><b style="color:${c}">${v}</b><span>${l}</span></div>`;
  const cmin = s.cardioMin || 0, cardio = cmin >= 60 ? Math.round(cmin / 60) + " h" : cmin + " min";
  const tiles = [tile(`${s.workouts}/${s.planned}`, "Workouts", P), tile(`+${s.extras || 0}`, "Extras", P), tile(s.kg >= 10000 ? Math.round(s.kg / 1000) + " t" : nsp(s.kg) + " kg", "Lifted", WU_GREEN),
    tile(s.pbs || 0, "Personal bests", WU_GREEN), tile(`${s.best} wk`, "Best streak", O), cmin ? tile(cardio, "Cardio", WU_GREEN) : tile(nsp(s.sets || 0), "Sets", WU_GREEN)];
  const rows = (arr, f) => arr.map(f).join("");
  const lift = l => `<div class="wuline"><span>${esc(l.help ? l.n.replace(/^Assisted /, "") + " help" : l.n)}</span><span>${l.help ? `${fmt(-l.a)} → ${fmt(-l.b)}` : `${fmt(l.a)} → ${fmt(l.b)}`} <b style="color:${WU_GREEN}">${l.help ? `−${fmt(l.b - l.a)} kg` : `+${l.pct} %`}</b></span></div>`;
  const bod = b => { const dd = Math.round((b.b - b.a) * 10) / 10; return `<div class="wuline"><span>${esc(b.n)}</span><span>${fmt(b.a)} → ${fmt(b.b)} <b style="color:${WU_GREEN}">${dd > 0 ? "+" : "−"}${fmt(Math.abs(dd))} ${b.u}</b></span></div>`; };
  const stopped = s.stopped != null;
  return `<div class="wusum"><div class="wusumtop">${`<div class="wuglow" style="background:${P};top:-160px;left:-10px"></div>`}
    <div class="wumedal" style="border-color:${P};box-shadow:0 0 30px ${P}88,inset 0 0 20px ${P}55;color:${P}"><b>${stopped ? s.stopped : s.weeks}</b><small>${stopped ? "WEEKS" : "WEEKS"}</small></div>
    <h2>${stopped ? "Stopped in week " + s.stopped : "You did it!"}</h2><div class="wudim">${esc(s.title)} · ${d(s.start)} – ${d(s.end)}</div></div>
    <div class="wutiles">${tiles.join("")}</div>
    ${s.lifts?.length ? `<div class="wusec">Stronger</div>${rows(s.lifts, lift)}` : ""}
    ${s.body?.length ? `<div class="wusec">Your body</div>${rows(s.body, bod)}` : ""}
    ${s.badges ? `<div class="wusec">Badges</div><div class="wuline"><span>Earned during the programme</span><b>${s.badges}</b></div>` : ""}
    <div class="wubtns">${S.wrap?.current && !S.wrap.preview ? `<button type="button" class="wucta" data-act="npstart" style="background:${P};box-shadow:0 0 20px ${P}88">Start your next programme →</button>` : ""}
    ${S.wrap?.preview ? `<div class="wudim c">DEV preview – nothing saved.</div>` : ""}
    <button type="button" class="wughost" data-act="wuclose">Close</button></div></div>`;
}
function wrapRender(first) {
  const ov = document.getElementById("wuov"), W = S.wrap; if (!ov) return;
  if (!W) { ov.hidden = true; ov.innerHTML = ""; document.body.classList.remove("wuopen"); return; }
  const cards = wuCards(W.sum), n = cards.length, sum = W.i >= n;
  document.body.classList.add("wuopen"); ov.hidden = false;
  if (sum) { ov.innerHTML = `<div class="wuph wuscroll">${wuSummaryHtml(W.sum)}</div>`; ov.scrollTop = 0; if (first || W.justSum) confetti(); W.justSum = false; return; }
  const c = cards[W.i];
  ov.innerHTML = `<div class="wuph" data-act="wutap"><div class="wubars">${cards.map((x, i) => `<i style="background:${i <= W.i ? c.c : "#2a2e3a"}"></i>`).join("")}</div>
    <button type="button" class="wux" data-act="wuclose" aria-label="Close">✕</button>${c.h}</div>`;
  wuCount(ov);
}
function wuCount(root) {                                      // numbers count up
  const els = root.querySelectorAll("[data-count]"), t0 = performance.now(), D = 900;
  els.forEach(el => { el.dataset.to = el.dataset.count; el.textContent = "0"; });
  const step = t => { const p = Math.min(1, (t - t0) / D), e = 1 - Math.pow(1 - p, 3);
    els.forEach(el => { const to = +el.dataset.to, dec = +el.dataset.dec || 0, v = to * e; el.textContent = dec ? fmt(Math.round(v * 10 ** dec) / 10 ** dec) : nsp(v); });
    if (p < 1 && S.wrap) requestAnimationFrame(step); };
  requestAnimationFrame(step);
}
function wrapTap(ev) {
  const W = S.wrap; if (!W) return; const n = wuCards(W.sum).length;
  const x = ev.clientX / window.innerWidth;
  if (x < 0.3) { if (W.i > 0) W.i--; } else { W.i++; if (W.i >= n) W.justSum = true; }
  wrapRender(false);
}

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

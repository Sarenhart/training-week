// ===== Onboarding (round 2) – first-run setup: welcome → about you → goal → body type → your week → home kit → focus → your plan
// Answers are saved as one profile on the phone (PROFILE_KEY). Round 3 turns them into a plan; until then the current programme is kept.
const PROFILE_KEY = "twdev.profile";
const OB_STEPS = ["welcome", "about", "goal", "shape", "week", "home", "focus", "plan"];
const MUSCLES = [["chest", "Chest", true], ["back", "Upper back", true], ["shoulders", "Shoulders"], ["arms", "Arms"], ["glutes", "Glutes", true], ["thighs", "Thighs", true], ["calves", "Calves"], ["core", "Core"]];
const KIT = [
  ["Weights", ["Dumbbells", "Kettlebell", "Barbell & plates", "Weight vest"]],
  ["Bands & bars", ["Long resistance band", "Mini band (loop)", "Pull-up bar", "Suspension trainer"]],
  ["Furniture & space", ["Weight bench", "Sturdy chair", "Stairs or a sturdy step", "Heavy table (for rows)", "Space to lunge"]],
  ["Floor", ["Smooth floor (for sliding)", "Stability ball"]],
  ["Cardio", ["Exercise bike", "Treadmill", "Rower", "Cross-trainer", "Jump rope", "Outdoors nearby (walk, run, cycle)"]]
];
const DIRECTIONS = {
  "Build muscle, more volume": "Moderate weights for 6–12 reps, extra sets for your focus muscles, longer rests. Cardio optional.",
  "Build muscle": "Moderate weights for 6–12 reps, 3–4 sets, 90–120 s rest. Cardio optional.",
  "Get stronger, trim fat": "Heavier main lifts for 6–10 reps, supersets from phase 3 and a short conditioning finisher. Cardio optional.",
  "Stay lean, get stronger": "Main lifts for 6–10 reps with 2 min rest, 3 sets. Cardio optional.",
  "Reshape": "8–12 reps, supersets from phase 2 to keep the pace up and a short finisher.",
  "Lose fat, build some muscle": "8–12 reps in supersets from day one, short rests and an 8 min finisher. Cardio recommended.",
  "Lean out a little": "10–15 reps in circuits, short rests and an 8 min finisher. Cardio recommended.",
  "Lose fat": "10–15 reps in circuits, short rests and a 10 min finisher. Cardio recommended.",
  "Lose fat, joint-friendly": "10–15 reps in supersets, joint-friendly choices (bike, walking, no jumping) and a 10 min low-impact finisher. Cardio recommended."
};
const WEEK_NAMES = {
  Strength: { 2: ["Full body · Push", "Full body · Pull"], 3: ["Push", "Pull", "Full body"], 4: ["Push", "Pull", "Lower", "Full body"] },
  Balance: { 2: ["Lower & balance", "Upper & core"], 3: ["Lower & balance", "Upper & core", "Full body & control"], 4: ["Lower & balance", "Upper & core", "Full body & control", "Mobility & core"] },
  Cardio: { 2: ["Strength + intervals", "Strength + steady"], 3: ["Strength + intervals", "Steady endurance", "Strength + tempo"], 4: ["Strength + intervals", "Steady endurance", "Strength + tempo", "Long & easy"] }
};
const EXTRA_TEXT = { Strength: "Optional – walk or bike, then the sets that didn't fit", Balance: "Recommended – home balance and mobility", Cardio: "Planned easy session · counts toward 150 min a week" };

function loadProfile() { try { return JSON.parse(localStorage.getItem(PROFILE_KEY)) || null; } catch { return null; } }
function saveProfile(p) { try { localStorage.setItem(PROFILE_KEY, JSON.stringify(p)); } catch {} }
function defaultAnswers() {
  const reg = (navigator.language || "").split("-")[1] || "";
  return { units: ["US", "LR", "MM"].includes(reg.toUpperCase()) ? "imperial" : "metric", weight: "", height: "", ft: "", inch: "", sex: null, year: "",
    meas: {}, goal: null, shape: null, level: null, days: null, time: null, where: null, easy: [], kit: [], machine: null, dbMax: 10, anchor: null, focus: [] };
}
const num = v => { const n = parseFloat(String(v ?? "").replace(",", ".")); return isNaN(n) ? null : n; };
// stored in metric; imperial only for display/entry
function obMetric(a) {
  const imp = a.units === "imperial";
  const kg = num(a.weight) != null ? (imp ? num(a.weight) * 0.4536 : num(a.weight)) : null;
  const cm = imp ? ((num(a.ft) || 0) * 30.48 + (num(a.inch) || 0) * 2.54) || null : num(a.height);
  const waist = num(a.meas.waist) != null ? (imp ? num(a.meas.waist) * 2.54 : num(a.meas.waist)) : null;
  return { kg, cm, waist };
}
function obAge(a) { const y = parseInt(a.year, 10); return y > 1900 ? new Date().getFullYear() - y : null; }
function startingPoint(a) {
  const { kg, cm, waist } = obMetric(a);
  if (!kg || !cm) return null;
  if (waist) { const r = waist / cm; return r < 0.42 ? "lighter" : r < 0.50 ? "average" : r < 0.58 ? "heavier" : "much heavier"; }
  const bmi = kg / Math.pow(cm / 100, 2);
  return bmi < 18.5 ? "lighter" : bmi < 25 ? "average" : bmi < 30 ? "heavier" : "much heavier";
}
function directionOf(a) {
  const sp = startingPoint(a); if (!sp || !a.shape) return null;
  const T = {
    Slim: { lighter: "Stay lean, get stronger", average: "Lean out a little", heavier: "Lose fat", "much heavier": "Lose fat, joint-friendly" },
    Toned: { lighter: "Build muscle", average: "Reshape", heavier: "Lose fat, build some muscle", "much heavier": "Lose fat, build some muscle" },
    Built: { lighter: "Build muscle, more volume", average: "Build muscle", heavier: "Get stronger, trim fat", "much heavier": "Get stronger, trim fat" }
  };
  return T[a.shape][sp];
}
function doctorNote(a) {
  const { kg, cm } = obMetric(a), bmi = kg && cm ? kg / Math.pow(cm / 100, 2) : null, age = obAge(a);
  return (bmi && (bmi >= 35 || bmi < 17.5)) || (age && age >= 65);
}
function focusMax(a) { return a.goal === "Cardio" ? 1 : ({ 2: 1, 3: 2, 4: 3 })[a.days] || 1; }
// time-fit note (programme-rules B). Round 3 replaces this rule of thumb with the plan's real weekly sets.
function timeFit(a) {
  const big = a.focus.filter(f => MUSCLES.find(m => m[0] === f)?.[2]);
  const t = parseInt(a.time, 10) || 45;
  if (t >= 60 || big.length < 2 || a.goal === "Cardio") return null;
  const short = (a.days === 3 && t <= 45) || t <= 30 || (a.days === 4 && big.length >= 3 && t <= 45);
  if (!short) return null;
  const nm = f => MUSCLES.find(m => m[0] === f)[1].toLowerCase();
  const names = big.map(nm), lst = names.length > 2 ? names.slice(0, -1).join(", ") + " and " + names.at(-1) : names.join(" and ");
  const others = ["back", "shoulders", "thighs", "core"].filter(x => !a.focus.includes(x)).slice(0, 2).map(x => x === "shoulders" ? "side shoulders" : x === "back" ? "upper back" : nm(x));
  return `${lst.charAt(0).toUpperCase() + lst.slice(1)} ${names.length > 2 ? "all" : "both"} need a lot of sets. At ${t} minutes, ${others.join(" and ")} get a little less. 60 minutes is recommended for this combination.`;
}
function obVisibleSteps(a) { return OB_STEPS.filter(s => s !== "home" || a.where === "Home"); }
function obCanGo(step, a) {
  if (step === "about") { const { kg, cm } = obMetric(a), age = obAge(a); return !!(kg && cm && a.sex && age && age >= 18 && age < 110); }
  if (step === "goal") return !!a.goal;
  if (step === "shape") return !!a.shape;
  if (step === "week") return !!(a.level && a.days && a.time && a.where && (a.goal !== "Cardio" || a.machine));
  if (step === "home") return a.kit.length === 0 || !needsAnchor(a) || a.anchor !== null;
  return true;
}
const needsAnchor = a => a.kit.includes("Long resistance band") || a.kit.includes("Suspension trainer");
const chipB = (on, act, val, label, extra = "") => `<button type="button" class="obchip" data-act="${act}" data-v="${esc(val)}" aria-pressed="${on}"${extra}>${on && act !== "obone" && act !== "obunits" ? "✓ " : ""}${esc(label)}</button>`;

function obView() {
  const o = S.ob, a = o.a, steps = obVisibleSteps(a), step = steps[o.i], n = steps.length - 2;   // welcome and plan aren't counted
  const nr = steps.indexOf(step);
  const stepTag = step !== "welcome" && step !== "plan" ? `<div class="eyebrow">Step ${nr} of ${n}</div>` : "";
  const nav = (label = "Continue") => `<div class="obnav">${o.i > 0 ? `<button type="button" class="btn ghost" data-act="obback">Back</button>` : "<span></span>"}
    <button type="button" class="btn" data-act="obnext" ${obCanGo(step, a) ? "" : "disabled"}>${label}</button></div>`;
  const imp = a.units === "imperial";
  let h = `<div class="ob">`;
  if (step === "welcome") {
    h += `<header class="top"><div><div class="eyebrow">Welcome</div><h1>Your 12-week plan, built around you</h1></div></header>
      <p class="obp">Answer a few quick questions and the app sets up your workouts, starting weights and weekly schedule.</p>
      <ol class="obsteps"><li><b>About you</b><span>Weight, height and optional measurements</span></li><li><b>Your goal and body type</b><span>What you want to train for and look like</span></li><li><b>Your week</b><span>Days, time, focus areas and anything to go easy on</span></li></ol>
      <button type="button" class="btn wide" data-act="obnext">Get started</button>
      <p class="muted obsmall">About 2 minutes. Everything stays on your phone.</p>
      ${o.edit ? `<button type="button" class="btn ghost wide" data-act="obcancel">Cancel – keep my answers</button>` : `<button type="button" class="linkbtn" data-act="obskip">DEV: skip setup and keep my current programme</button>`}`;
  } else if (step === "about") {
    h += `<header class="top"><div>${stepTag}<h1>About you</h1></div><button type="button" class="infobtn" data-act="obinfo" aria-expanded="${!!o.info}" aria-label="Privacy">i</button></header>
      <p class="obp">Used to set sensible starting weights and as your baseline in the Body tab.</p>
      ${o.info ? `<div class="note">Your answers stay on this phone. We do not collect information provided on this page nor do we have access to it. They are only used to set up your plan and are saved on your phone. You can change or delete them at any time in Settings.</div>` : ""}
      <div class="obrow"><span class="oblbl">Units</span><div class="seg">${chipB(!imp, "obunits", "metric", "kg · cm", ' data-seg="1"')}${chipB(imp, "obunits", "imperial", "lb · ft", ' data-seg="1"')}</div></div>
      <div class="obgrid2"><label class="f">Weight<span class="inu"><input type="text" inputmode="decimal" id="ob-weight" data-ob="weight" value="${esc(a.weight)}"><i>${imp ? "lb" : "kg"}</i></span></label>
      ${imp ? `<label class="f">Height<span class="inu2"><span class="inu"><input type="text" inputmode="numeric" id="ob-ft" data-ob="ft" value="${esc(a.ft)}"><i>ft</i></span><span class="inu"><input type="text" inputmode="numeric" id="ob-in" data-ob="inch" value="${esc(a.inch)}"><i>in</i></span></span></label>`
        : `<label class="f">Height<span class="inu"><input type="text" inputmode="numeric" id="ob-height" data-ob="height" value="${esc(a.height)}"><i>cm</i></span></label>`}</div>
      <div class="obrow col"><span class="oblbl">Sex</span><div class="obchips">${["Female", "Male", "Prefer not to say"].map(v => chipB(a.sex === v, "obone", v, v, ' data-k="sex"')).join("")}</div></div>
      <label class="f">Year of birth<input type="text" inputmode="numeric" id="ob-year" data-ob="year" value="${esc(a.year)}" placeholder="e.g. 1985"></label>
      ${obAge(a) !== null && obAge(a) < 18 ? `<p class="obwarn">Training Week is made for adults. You need to be 18 or older to use the app.</p>` : ""}
      <button type="button" class="obmore" data-act="obmeas" aria-expanded="${!!o.meas}"><span>More measurements <span class="muted">· optional</span></span><span class="chev">›</span></button>
      ${o.meas ? `<div class="obgrid2">${[["waist", "Waist"], ["chest", "Chest"], ["arm", "Upper arm"], ["shoulder", "Shoulders"], ["thigh", "Thigh"], ["fat", "Body fat"]].map(([k, l]) =>
        `<label class="f">${l}<span class="inu"><input type="text" inputmode="decimal" id="ob-m-${k}" data-obm="${k}" value="${esc(a.meas[k] ?? "")}"><i>${k === "fat" ? "%" : imp ? "in" : "cm"}</i></span></label>`).join("")}</div>
        <p class="muted obsmall">Skip any you don't know. You can add them later in the Body tab.</p>` : ""}
      ${nav()}`;
  } else if (step === "goal") {
    const G = [["Strength", "Lift heavier. Fewer reps, longer rests, steady weight increases."], ["Balance", "Stability, core and mobility. One-sided work and control."], ["Cardio", "Better fitness. Circuits, intervals and more time moving."]];
    h += `<header class="top"><div>${stepTag}<h1>What are you training for?</h1></div></header><p class="obp">Pick your main focus. Every plan still has a bit of everything.</p>
      <div class="obcards">${G.map(([g, t]) => `<button type="button" class="obcard" data-act="obone" data-k="goal" data-v="${g}" aria-pressed="${a.goal === g}"><b>${g}</b><span>${t}</span></button>`).join("")}</div>${nav()}`;
  } else if (step === "shape") {
    const d = directionOf(a), sp = startingPoint(a);
    h += `<header class="top"><div>${stepTag}<h1>What look are you aiming for?</h1></div></header><p class="obp">This sets your reps, sets and how much conditioning goes into each week.</p>
      <div class="obshape">${["Slim", "Toned", "Built"].map(v => `<button type="button" class="obcard sh" data-act="obone" data-k="shape" data-v="${v}" aria-pressed="${a.shape === v}">${shapeIcon(v)}<b>${v}</b></button>`).join("")}</div>
      ${d ? `<div class="card obdir"><div class="eyebrow">Your direction, from your measurements</div><h2>${esc(d)}</h2><p>${esc(DIRECTIONS[d])}</p>
        ${a.shape === "Slim" && sp === "lighter" ? `<p class="muted obsmall">You're already lean – Toned may suit you better if you want to add some muscle.</p>` : ""}</div>` : ""}${nav()}`;
  } else if (step === "week") {
    const one = (k, label, hint, vals) => `<div class="obrow col"><span class="oblbl">${label}${hint ? ` <span class="muted">· ${hint}</span>` : ""}</span><div class="obchips">${vals.map(v => chipB(String(a[k]) === String(v), "obone", v, String(v), ` data-k="${k}"`)).join("")}</div></div>`;
    h += `<header class="top"><div>${stepTag}<h1>Your training week</h1></div></header>
      ${one("level", "Experience", "sets your starting weights", ["New", "Some", "Experienced"])}
      ${one("days", "Workouts per week", "plus an extra session", [2, 3, 4])}
      ${one("time", "Time per workout", "", ["30 min", "45 min", "60 min"])}
      ${one("where", "Where you train", "home: tick your equipment next", ["Gym", "Home"])}
      ${a.goal === "Cardio" ? one("machine", "Preferred cardio machine", "the rower, air bike, ski machine and running open up in later phases", ["Bike", "Cross-trainer", "Incline treadmill walk", "Stair climber", "Air bike", "Ski machine", "Rower", "Running"]) : ""}
      <div class="obrow col"><span class="oblbl">Go easy on <span class="muted">· pick any</span></span><div class="obchips">${["Knees", "Back", "Shoulders", "Wrists"].map(v => chipB(a.easy.includes(v), "obeasy", v, v)).join("")}${chipB(a.easy.length === 0, "obeasy", "", "Nothing")}</div></div>
      ${nav()}`;
  } else if (step === "home") {
    const has = x => a.kit.includes(x);
    h += `<header class="top"><div><div class="eyebrow">Step ${nr} of ${n} · Training at home</div><h1>What do you have at home?</h1></div></header>
      <p class="obp">Tick everything you have. Your plan only uses what you tick – you can change it later.</p>
      <button type="button" class="obnone" data-act="obnokit" aria-pressed="${a.kit.length === 0}"><b>Nothing – body weight only</b><span>a floor and a little space</span></button>
      ${KIT.map(([g, items]) => `<div class="obrow col"><span class="oblbl">${g}</span><div class="obchips">${items.map(i => chipB(has(i), "obkit", i, i)).join("")}</div>
        ${g === "Weights" && has("Dumbbells") ? `<div class="kgrow"><span>Heaviest dumbbell (per hand)</span><button class="step" data-act="obdb" data-d="-0.5" aria-label="Lighter">−</button><span class="kg">${fmt(a.dbMax)} kg</span><button class="step" data-act="obdb" data-d="0.5" aria-label="Heavier">+</button></div>` : ""}
        ${g === "Bands & bars" && needsAnchor(a) ? `<div class="obanchor"><b>Can you anchor to a door?</b><p>You need a sturdy door that closes fully, where you can stand on the side it opens away from – so pulling presses it shut – plus a door anchor for the band or the strap anchor for the suspension trainer.</p>
          <div class="obchips">${chipB(a.anchor === true, "obanchor", "yes", "Yes")}${chipB(a.anchor === false, "obanchor", "no", "No")}</div></div>` : ""}</div>`).join("")}
      <div class="note">${esc(kitSummary(a))}</div>${nav()}`;
  } else if (step === "focus") {
    const max = focusMax(a), tf = timeFit(a);
    h += `<header class="top"><div>${stepTag}<h1>Your focus</h1></div></header>
      <p class="obp">Pick up to ${max} ${max === 1 ? "area" : "areas"}${a.goal === "Cardio" ? " – Cardio plans have two short strength days" : ` – you train ${a.days} days a week`}. The plan stays full body and adds extra sets for these. You can also skip this.</p>
      <div class="obgrid2 tight">${MUSCLES.map(([k, l]) => { const on = a.focus.includes(k), full = !on && a.focus.length >= max;
        return `<button type="button" class="obchip big" data-act="obfocus" data-v="${k}" aria-pressed="${on}" ${full ? "disabled" : ""}>${on ? "✓ " : ""}${l}</button>`; }).join("")}</div>
      ${tf ? `<div class="obfit" role="note"><p>${esc(tf)}</p>${a.time !== "60 min" ? `<button type="button" class="btn small" data-act="obone" data-k="time" data-v="60 min">Switch to 60 min</button>` : ""}</div>` : ""}
      ${nav()}`;
  } else if (step === "plan") {
    const d = directionOf(a), names = WEEK_NAMES[a.goal][a.days], fl = a.focus.map(f => MUSCLES.find(m => m[0] === f)[1]);
    const chips = [a.goal, a.shape, a.days + " workouts a week", a.time, a.where, a.level + " experience"].concat(a.easy.map(e => "Easy on " + e.toLowerCase())).concat(fl.map(f => "Focus: " + f));
    h += `<header class="top"><div><div class="eyebrow">Plan ready</div><h1>Your 12-week plan</h1></div></header>
      <div class="obchips static">${chips.map(c => `<span class="pill">${esc(c)}</span>`).join("")}</div>
      ${d ? `<div class="card obdir"><div class="eyebrow">Your direction</div><h2>${esc(d)}</h2><p>${esc(DIRECTIONS[d])}</p></div>` : ""}
      ${doctorNote(a) ? `<div class="obwarn">We recommend consulting with a doctor before starting a new training plan.</div>` : ""}
      <div class="card"><div class="eyebrow">Each week</div><ol class="obweek">${names.map((nm, i) => `<li><b>Workout ${i + 1}</b><span>${esc(nm)}</span></li>`).join("")}<li><b>Extra</b><span>${esc(EXTRA_TEXT[a.goal])}</span></li></ol></div>
      <div class="card"><div class="eyebrow">Four phases</div><ol class="obweek"><li><b>Phase 1</b><span>Weeks 1–3 · learn the movements, find your weights</span></li><li><b>Phase 2</b><span>Weeks 4–6 · more sets, new variations</span></li><li><b>Phase 3</b><span>Weeks 7–9 · heavier main lifts</span></li><li><b>Phase 4</b><span>Weeks 10–12 · build strength</span></li></ol></div>
      <div class="note">${typeof genSupported === "function" && genSupported(a) ? "DEV: \"Start week 1\" builds this plan and clears the workouts logged in DEV. Your main app is not touched." : "DEV: plans for " + (a.where === "Home" ? "home training" : a.goal) + " come in the next part of round 3. Until then your current programme is kept – your answers are saved."}</div>
      <div class="obnav"><button type="button" class="btn ghost" data-act="obback">Change my answers</button><button type="button" class="btn" data-act="obdone">Start week 1</button></div>`;
  }
  return h + `</div>`;
}
function kitSummary(a) {
  const has = x => a.kit.includes(x), parts = [];
  if (!a.kit.length) parts.push("Body-weight plan with exercise ladders.");
  else if (has("Dumbbells")) parts.push(`Dumbbell plan up to ${fmt(a.dbMax)} kg per hand, then ladders.`);
  else parts.push("Body-weight plan with exercise ladders, plus what you ticked.");
  const anchored = needsAnchor(a) && a.anchor === true;
  const rows = has("Pull-up bar") || (has("Suspension trainer") && anchored) || has("Heavy table (for rows)") || has("Dumbbells") || has("Kettlebell") || has("Barbell & plates") || has("Long resistance band");
  parts.push(rows ? "Back exercises: rows included" + (has("Long resistance band") && anchored ? ", plus band pulldowns." : ".") : "Back exercises: floor raises (Y-T-W) and towel pulldowns.");
  const cardio = KIT[4][1].filter(has).map(c => c.replace(" (walk, run, cycle)", ""));
  parts.push(cardio.length ? "Cardio: " + cardio.join(", ").toLowerCase() + "." : "Cardio: body-weight circuits.");
  return parts.join(" ");
}
function shapeIcon(v) {
  const w = { Slim: [7, 6, 5], Toned: [9, 7, 6], Built: [12, 8, 8] }[v];
  return `<svg width="40" height="64" viewBox="0 0 40 64" aria-hidden="true" fill="currentColor"><circle cx="20" cy="8" r="6"/><path d="M${20 - w[0]} 17h${2 * w[0]}l-${w[0] - w[1]} 22h-${2 * w[1]}z"/><rect x="${20 - w[2]}" y="40" width="${w[2] - 1}" height="22" rx="3"/><rect x="21" y="40" width="${w[2] - 1}" height="22" rx="3"/></svg>`;
}
function obStart(edit) {
  const p = loadProfile();
  S.ob = { i: 0, a: p && p.answers ? JSON.parse(JSON.stringify(p.answers)) : defaultAnswers(), edit: !!edit, info: false, meas: false };
  render();
}
function obFinish(skipped) {
  const a = S.ob.a, m = obMetric(a);
  const p = skipped ? { skipped: true, at: today() } : { answers: a, at: today(), direction: directionOf(a), metric: m };
  saveProfile(p);
  if (!skipped && m.kg && !S.ob.edit) {                 // first set of measurements becomes the Body baseline
    const d = today(), b = S.body[d] || { date: d };
    b.weight = Math.round(m.kg * 10) / 10;
    const imp = a.units === "imperial";
    for (const k of ["waist", "chest", "arm", "shoulder", "thigh", "fat"]) { const v = num(a.meas[k]); if (v != null) b[k] = k === "fat" || !imp ? v : Math.round(v * 2.54 * 10) / 10; }
    S.body[d] = b; try { saveLocal(); } catch {}
  }
  if (!skipped && typeof genSupported === "function" && genSupported(a)) {      // round 3: build the plan from the answers
    S.program = generatePlan(a); S.logs = {}; syncKeys(); S.week = null; S.wk = null; S.guides = new Set();
    try { saveLocal(); } catch {}
  }
  S.ob = null; S.tab = "today"; window.scrollTo(0, 0); render();
}
function obClick(a, b) {
  const o = S.ob; if (!o) return false;
  const A = o.a, steps = obVisibleSteps(A);
  switch (a) {
    case "obnext": if (obCanGo(steps[o.i], A)) { o.i = Math.min(o.i + 1, steps.length - 1); window.scrollTo(0, 0); } break;
    case "obback": o.i = Math.max(0, o.i - 1); window.scrollTo(0, 0); break;
    case "obskip": obFinish(true); return true;
    case "obcancel": S.ob = null; break;
    case "obdone": obFinish(false); return true;
    case "obinfo": o.info = !o.info; break;
    case "obmeas": o.meas = !o.meas; break;
    case "obunits": A.units = b.dataset.v; break;
    case "obone": { const k = b.dataset.k, v = b.dataset.v; A[k] = k === "days" ? +v : v;
      if (k === "days" || k === "goal") A.focus = A.focus.slice(0, focusMax(A)); break; }
    case "obeasy": { const v = b.dataset.v; A.easy = !v ? [] : A.easy.includes(v) ? A.easy.filter(x => x !== v) : A.easy.concat(v); break; }
    case "obkit": { const v = b.dataset.v; A.kit = A.kit.includes(v) ? A.kit.filter(x => x !== v) : A.kit.concat(v); if (!needsAnchor(A)) A.anchor = null; break; }
    case "obnokit": A.kit = []; A.anchor = null; break;
    case "obanchor": A.anchor = b.dataset.v === "yes"; break;
    case "obdb": A.dbMax = Math.max(1, Math.min(60, A.dbMax + parseFloat(b.dataset.d))); break;
    case "obfocus": { const v = b.dataset.v; A.focus = A.focus.includes(v) ? A.focus.filter(x => x !== v) : A.focus.length < focusMax(A) ? A.focus.concat(v) : A.focus; break; }
    default: return false;
  }
  render(); return true;
}
function obInput(t) {
  if (!S.ob) return false;
  if (t.dataset.ob) { S.ob.a[t.dataset.ob] = t.value; render(); return true; }
  if (t.dataset.obm) { S.ob.a.meas[t.dataset.obm] = t.value; render(); return true; }
  return false;
}

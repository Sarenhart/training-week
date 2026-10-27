// ===== Plan generator (round 3a: Strength goal, gym) – turns the onboarding answers into a 12-week programme.
// Source of truth: the approved plan docs (strength-workouts.md, strength-2day.md, strength-4day.md) + programme-rules.md
// + goal-focus-review.md + priority-exercises.md. Templates are the approved plans; rules below adapt them to the user.

// ---------- exercise catalogue: primary muscle, equipment, starting-weight ratio (D1), weight step, library title
// m: chest back shoulders rear arms(bi/tri as biceps/triceps) glutes thighs ham calves core cardio
// eq: db bb cable machine bw · floor: done on the floor · knee: knee-heavy · ratio: × body weight (per hand for dumbbells) · lower: uses the lower-body sex factor
const EX = {
  "Dumbbell bench press": { m: "chest", eq: "db", ratio: .10, inc: 2 },
  "Incline dumbbell press": { m: "chest", eq: "db", ratio: .09, inc: 2 },
  "Machine chest press": { m: "chest", eq: "machine", ratio: .45, inc: 2.5 },
  "Cable fly (low-to-high)": { m: "chest", eq: "cable", ratio: .08, inc: 2.5 },
  "Cable fly (mid)": { m: "chest", eq: "cable", ratio: .08, inc: 2.5 },
  "Cable fly (high-to-low)": { m: "chest", eq: "cable", ratio: .08, inc: 2.5 },
  "Incline dumbbell fly": { m: "chest", eq: "db", ratio: .05, inc: 2 },
  "Incline push-up": { m: "chest", eq: "bw", bw: true },
  "Deficit push-up": { m: "chest", eq: "bw", bw: true, floor: true },
  "Decline push-up": { m: "chest", eq: "bw", bw: true, floor: true },
  "Dumbbell pullover": { m: "back", eq: "db", ratio: .12, inc: 2 },
  "Lat pulldown": { m: "back", eq: "cable", ratio: .45, inc: 2.5 },
  "Pull-up": { m: "back", eq: "bw", bw: true, inc: 0.25, assist: true },
  "One-arm dumbbell row": { m: "back", eq: "db", ratio: .16, inc: 2 },
  "Chest-supported dumbbell row": { m: "back", eq: "db", ratio: .12, inc: 2 },
  "Seated cable row": { m: "back", eq: "cable", ratio: .45, inc: 2.5 },
  "Machine row": { m: "back", eq: "machine", ratio: .5, inc: 2.5 },
  "Incline Y-raise": { m: "rear", eq: "db", ratio: .02, inc: 1, lib: "Incline y-raise" },
  "Face pull": { m: "rear", eq: "cable", ratio: .15, inc: 2.5 },
  "Rear-delt dumbbell fly": { m: "rear", eq: "db", ratio: .04, inc: 1 },
  "Cable rear-delt fly": { m: "rear", eq: "cable", ratio: .06, inc: 2.5 },
  "Dumbbell lateral raise": { m: "shoulders", eq: "db", ratio: .04, inc: 1 },
  "Lean-away lateral raise": { m: "shoulders", eq: "db", ratio: .04, inc: 1 },
  "Side-lying lateral raise": { m: "shoulders", eq: "db", ratio: .03, inc: 1 },
  "Cable lateral raise": { m: "shoulders", eq: "cable", ratio: .04, inc: 2.5, note: "Behind the back – cable runs behind you." },
  "Seated dumbbell shoulder press": { m: "shoulders", eq: "db", ratio: .07, inc: 2 },
  "Rope overhead triceps extension": { m: "triceps", eq: "cable", ratio: .12, inc: 2.5 },
  "Overhead dumbbell triceps extension": { m: "triceps", eq: "db", ratio: .12, inc: 2 },
  "Rope pushdown": { m: "triceps", eq: "cable", ratio: .15, inc: 2.5 },
  "Dumbbell skull crusher": { m: "triceps", eq: "db", ratio: .06, inc: 2 },
  "Close-grip push-up": { m: "triceps", eq: "bw", bw: true, floor: true },
  "Incline dumbbell curl": { m: "biceps", eq: "db", ratio: .06, inc: 2 },
  "Preacher curl": { m: "biceps", eq: "db", ratio: .07, inc: 2 },
  "Cable curl": { m: "biceps", eq: "cable", ratio: .12, inc: 2.5 },
  "Face-away cable curl": { m: "biceps", eq: "cable", ratio: .06, inc: 2.5 },
  "Spider curl": { m: "biceps", eq: "db", ratio: .06, inc: 2 },
  "Dumbbell hammer curl": { m: "biceps", eq: "db", ratio: .08, inc: 2 },
  "Barbell hip thrust": { m: "glutes", eq: "bb", ratio: .5, inc: 2.5, lower: true },
  "Dumbbell hip thrust": { m: "glutes", eq: "db", ratio: .25, inc: 2, lower: true, note: "One dumbbell on the hips." },
  "Single-leg hip thrust": { m: "glutes", eq: "bw", bw: true },
  "Glute bridge": { m: "glutes", eq: "bw", bw: true, floor: true },
  "Cable pull-through": { m: "glutes", eq: "cable", ratio: .3, inc: 2.5, lower: true },
  "Hip abduction machine": { m: "glutes", eq: "machine", ratio: .35, inc: 2.5, lower: true },
  "Romanian deadlift": { m: "ham", eq: "db", ratio: .15, inc: 2, lower: true, lib: "Dumbbell romanian deadlift", note: "Dumbbells, kg per hand." },
  "B-stance Romanian deadlift": { m: "ham", eq: "db", ratio: .12, inc: 2, lower: true },
  "Lying hamstring curl": { m: "ham", eq: "machine", ratio: .25, inc: 1, lower: true },
  "Seated hamstring curl": { m: "ham", eq: "machine", ratio: .25, inc: 1, lower: true },
  "Back extension": { m: "glutes", eq: "bw", bw: true, lib: "Back extension (45°)" },
  "Goblet squat": { m: "thighs", eq: "db", ratio: .15, inc: 2, lower: true, knee: true, note: "One dumbbell held at the chest." },
  "Barbell back squat": { m: "thighs", eq: "bb", ratio: 0, fixed: 20, inc: 2.5, lower: true, knee: true, back: true },
  "Leg press": { m: "thighs", eq: "machine", ratio: .8, inc: 2.5, lower: true },
  "Single-leg leg press": { m: "thighs", eq: "machine", ratio: .35, inc: 2.5, lower: true },
  "Bulgarian split squat": { m: "glutes", eq: "db", ratio: .06, inc: 2, lower: true, knee: true, lib: "Rear-foot-elevated split squat", note: "Rear foot on a bench, go deep." },
  "Step-up": { m: "thighs", eq: "db", ratio: .06, inc: 2, lower: true, knee: true },
  "Single-leg calf raise": { m: "calves", eq: "db", ratio: .1, inc: 2, lower: true, lib: "Single-leg dumbbell calf raise", note: "Holding a dumbbell." },
  "Standing calf raise": { m: "calves", eq: "machine", ratio: .4, inc: 2.5, lower: true },
  "Seated calf raise": { m: "calves", eq: "machine", ratio: .3, inc: 2.5, lower: true },
  "Calf raise on the leg press": { m: "calves", eq: "machine", ratio: .6, inc: 2.5, lower: true },
  "Dead bug": { m: "core", eq: "bw", floor: true, nokg: true },
  "Bird dog": { m: "core", eq: "bw", floor: true, nokg: true },
  "Side plank": { m: "core", eq: "bw", floor: true, nokg: true, unit: "sec", reps: 30 },
  "Reverse crunch": { m: "core", eq: "bw", floor: true, nokg: true },
  "Stability-ball crunch": { m: "core", eq: "bw", floor: true, nokg: true },
  "Hanging knee raise": { m: "core", eq: "bw", nokg: true },
  "Ab crunch machine": { m: "core", eq: "machine", ratio: .3, inc: 2.5 },
  "Seated knee lift": { m: "core", eq: "bw", nokg: true },
  "Incline plank": { m: "core", eq: "bw", nokg: true, unit: "sec", reps: 30 },
  "Pallof press": { m: "core", eq: "cable", ratio: .12, inc: 2.5, note: "Reps per side." },
  "Suitcase hold": { m: "core", eq: "db", ratio: .25, inc: 2, unit: "sec", reps: 30, lib: "Suitcase hold & carry", note: "Seconds per side." },
  "Bike or brisk walk": { m: "cardio", eq: "cardio", unit: "min", reps: 35, nokg: true, lib: "Bike" },
  "Bike": { m: "cardio", eq: "cardio", unit: "min", reps: 10, nokg: true }
};

// ---------- approved templates. Workout: "Name|group|group…", group = "spot: Exercise sets + Exercise sets" (spot optional)
const T = (w) => w.map(s => { const [name, ...groups] = s.split("|"); return { name, groups: groups.map(g => {
  const m = g.match(/^([^:]+):\s(.+)$/), spot = m ? m[1].trim() : "", body = m ? m[2] : g;
  return { spot, ex: body.split(" + ").map(x => { const mm = x.trim().match(/^(.*?)\s(\d+)$/); return { name: mm[1], sets: +mm[2] }; }) }; }) }; });
const STRENGTH = {
  3: [
    T(["Push|Dumbbell bench press 3|incline bench ~30°: Incline dumbbell press 3 + Chest-supported dumbbell row 3 + Incline Y-raise 3|dumbbell rack: Dumbbell lateral raise 3 + Romanian deadlift 3 + Single-leg calf raise 2",
       "Pull|Lat pulldown 3|flat bench: One-arm dumbbell row 3 + Incline push-up 3|seated cable row + mat: Seated cable row 3 + Dead bug 3|back-extension bench + mat: Back extension 3 + Bird dog 3",
       "Full body|Barbell hip thrust 3|upright bench + mat: Seated dumbbell shoulder press 3 + Side plank 2|cable crossover: Cable fly (low-to-high) 3 + Cable lateral raise 3|Lying hamstring curl 2|Standing calf raise 2",
       "Extra|Bike or brisk walk 1"]),
    T(["Push|Dumbbell bench press 4|incline bench ~45°: Incline dumbbell press 3 + Chest-supported dumbbell row 3 + Side-lying lateral raise 4|dumbbell rack: Lean-away lateral raise 4 + B-stance Romanian deadlift 3",
       "Pull|Lat pulldown 4|row machine + mat: Machine row 3 + Reverse crunch 3|flat bench: Dumbbell pullover 3 + Deficit push-up 3|back-extension bench + mat: Back extension 3 + Side plank 2",
       "Full body|Barbell hip thrust 3|cable crossover: Cable fly (mid) 3 + Cable lateral raise 3|low cable: Cable pull-through 3 + Pallof press 3|Seated hamstring curl 2|Calf raise on the leg press 4",
       "Extra|cable tower, rope: Face pull 3 + Rope overhead triceps extension 3|incline bench: Incline dumbbell curl 3 + Rear-delt dumbbell fly 2|dumbbell rack: Dumbbell hammer curl 2 + Single-leg calf raise 2|Bike 1"]),
    T(["Push|Dumbbell bench press 4|incline bench ~30°: Incline dumbbell fly 3 + Chest-supported dumbbell row 3 + Incline Y-raise 3|dumbbell rack: Dumbbell lateral raise 4 + Romanian deadlift 3 + Overhead dumbbell triceps extension 3",
       "Pull|Lat pulldown 4|flat bench: One-arm dumbbell row 3 + Decline push-up 3|seated cable row: Seated cable row 3 + Cable curl 2 + Dead bug 3|back-extension bench + mat: Back extension 3 + Bird dog 3",
       "Full body|Barbell hip thrust 4|upright bench: Seated dumbbell shoulder press 3 + Single-leg calf raise 2 + Side plank 2|cable crossover: Cable fly (high-to-low) 3 + Cable lateral raise 3 + Face pull 2|Lying hamstring curl 2|Standing calf raise 2",
       "Extra|cable crossover: Rope pushdown 3 + Cable rear-delt fly 3|incline bench: Incline dumbbell curl 3 + Dumbbell skull crusher 3|dumbbell rack: Dumbbell hammer curl 2 + Lean-away lateral raise 2|Bike 1"]),
    T(["Push|Dumbbell bench press 4|incline bench ~45°: Incline dumbbell press 3 + Chest-supported dumbbell row 4 + Side-lying lateral raise 4|dumbbell rack: Lean-away lateral raise 4 + B-stance Romanian deadlift 3 + Suitcase hold 2",
       "Pull|Lat pulldown 4|row machine + mat: Machine row 4 + Reverse crunch 3|flat bench: Dumbbell pullover 3 + Deficit push-up 3|back-extension bench + mat: Back extension 3 + Bird dog 2",
       "Full body|Barbell hip thrust 4|cable crossover: Cable fly (low-to-high) 3 + Cable lateral raise 4 + Face pull 2|low cable: Cable pull-through 3 + Pallof press 2|Seated hamstring curl 2|Calf raise on the leg press 4",
       "Extra|cable tower: Rope overhead triceps extension 4 + Cable curl 3|incline bench, face down: Spider curl 3 + Rear-delt dumbbell fly 3|Overhead dumbbell triceps extension 4|Bike 1"])
  ],
  2: [
    T(["Full body · Push|Dumbbell bench press 3|Goblet squat 3|incline bench ~30°, face down: Chest-supported dumbbell row 3 + Incline Y-raise 2|dumbbell rack + mat: Dumbbell lateral raise 3 + Dead bug 3",
       "Full body · Pull|One-arm dumbbell row 3|Romanian deadlift 3|flat bench: Incline push-up 3 + Dumbbell hip thrust 3|upright bench + mat: Seated dumbbell shoulder press 3 + Side plank 2|Single-leg calf raise 2",
       "Extra|Bike or brisk walk 1"]),
    T(["Full body · Push|Dumbbell bench press 3|Goblet squat 3|cable crossover: Cable fly (low-to-high) 3 + Cable lateral raise 3 + Cable pull-through 3|lat pulldown + mat: Lat pulldown 3 + Dead bug 3",
       "Full body · Pull|One-arm dumbbell row 3|Romanian deadlift 3|seated cable row + mat: Seated cable row 3 + Side plank 2|upright bench: Seated dumbbell shoulder press 3 + Dumbbell lateral raise 3 + Single-leg calf raise 2|Dumbbell hip thrust 3",
       "Extra|leg press + mat: Leg press 3 + Reverse crunch 2|incline bench, face down: Chest-supported dumbbell row 3 + Incline Y-raise 2|cable tower, rope: Face pull 3 + Rope pushdown 2|Dumbbell hammer curl 2"]),
    T(["Full body · Push|Dumbbell bench press 3|Goblet squat 3|incline bench ~30°: Incline dumbbell press 3 + Chest-supported dumbbell row 3|Cable lateral raise 3|back-extension bench + mat: Back extension 3 + Dead bug 3",
       "Full body · Pull|One-arm dumbbell row 3|Romanian deadlift 3|lat pulldown + mat: Lat pulldown 3 + Side plank 2|flat bench: Dumbbell hip thrust 3 + Incline push-up 2|dumbbell rack: Lean-away lateral raise 3 + Overhead dumbbell triceps extension 2 + Single-leg calf raise 2",
       "Extra|one cable: Cable pull-through 3 + Cable curl 2 + Face pull 2|seated cable row + mat: Seated cable row 3 + Reverse crunch 2|Leg press 3|Dumbbell lateral raise 3"]),
    T(["Full body · Push|Dumbbell bench press 3|Goblet squat 3|cable crossover: Cable fly (low-to-high) 3 + Cable lateral raise 3|lat pulldown + mat: Lat pulldown 3 + Dead bug 3|Back extension 3",
       "Full body · Pull|One-arm dumbbell row 3|Romanian deadlift 3|seated cable row + mat: Seated cable row 3 + Reverse crunch 3|upright bench: Seated dumbbell shoulder press 3 + Dumbbell lateral raise 3 + Single-leg calf raise 2|Dumbbell hip thrust 3",
       "Extra|incline bench: Chest-supported dumbbell row 3 + Incline Y-raise 3 + Incline dumbbell curl 2|cable tower, rope: Face pull 3 + Rope overhead triceps extension 2|leg press: Leg press 3 + Calf raise on the leg press 2"])
  ],
  4: [
    T(["Push|Dumbbell bench press 3|incline bench ~30°: Incline dumbbell press 3 + Chest-supported dumbbell row 3 + Incline Y-raise 3|dumbbell rack: Dumbbell lateral raise 3 + Single-leg calf raise 2",
       "Pull|Lat pulldown 3|flat bench + floor: One-arm dumbbell row 3 + Deficit push-up 3|seated cable row + mat: Seated cable row 3 + Dead bug 3|cable tower: Cable lateral raise 3 + Pallof press 2",
       "Lower|Goblet squat 3|dumbbell rack + bench: Romanian deadlift 3 + Bulgarian split squat 2|lying hamstring curl + mat: Lying hamstring curl 2 + Side plank 2|Seated calf raise 2|back-extension bench + mat: Back extension 3 + Bird dog 2",
       "Full body|Barbell hip thrust 3|upright bench: Seated dumbbell shoulder press 3 + Lean-away lateral raise 3|chest-press machine + mat: Machine chest press 3 + Reverse crunch 2|Machine row 3",
       "Extra|Bike or brisk walk 1"]),
    T(["Push|Dumbbell bench press 4|incline bench ~45°: Incline dumbbell press 3 + Chest-supported dumbbell row 3 + Side-lying lateral raise 4|dumbbell rack: Overhead dumbbell triceps extension 2 + Single-leg calf raise 2",
       "Pull|Lat pulldown 4|flat bench: Dumbbell pullover 3 + Decline push-up 3|seated cable row + mat: Seated cable row 3 + Reverse crunch 3|cable tower: Cable lateral raise 4 + Face pull 2",
       "Lower|Barbell back squat 4|B-stance Romanian deadlift 3|seated hamstring curl + mat: Seated hamstring curl 2 + Side plank 2|Standing calf raise 2|back-extension bench + mat: Back extension 3 + Dead bug 2",
       "Full body|Barbell hip thrust 4|upright bench: Seated dumbbell shoulder press 3 + Dumbbell lateral raise 4|cable crossover: Cable fly (mid) 3 + Pallof press 2|Machine row 3",
       "Extra|cable tower, rope: Rope overhead triceps extension 3 + Cable curl 2|incline bench: Incline dumbbell curl 3 + Rear-delt dumbbell fly 3|Bike 1"]),
    T(["Push|Dumbbell bench press 4|incline bench ~30°: Incline dumbbell fly 3 + Chest-supported dumbbell row 3 + Incline Y-raise 3|dumbbell rack: Dumbbell lateral raise 3 + Overhead dumbbell triceps extension 3 + Single-leg calf raise 2",
       "Pull|Lat pulldown 4|flat bench + floor: One-arm dumbbell row 3 + Deficit push-up 3|seated cable row station: Seated cable row 3 + Cable curl 2 + Dead bug 2|cable tower: Cable lateral raise 3 + Face pull 2",
       "Lower|Barbell back squat 4|dumbbell rack + bench: Romanian deadlift 3 + Bulgarian split squat 2|lying hamstring curl + mat: Lying hamstring curl 2 + Side plank 2|Seated calf raise 2|back-extension bench + mat: Back extension 3 + Bird dog 2",
       "Full body|Barbell hip thrust 4|upright bench: Seated dumbbell shoulder press 3 + Lean-away lateral raise 3|chest-press machine + mat: Machine chest press 3 + Reverse crunch 2|Machine row 3",
       "Extra|cable crossover: Rope pushdown 3 + Cable rear-delt fly 3|incline bench, face up: Incline dumbbell curl 3 + Dumbbell skull crusher 3|Dumbbell hammer curl 2|Bike 1"]),
    T(["Push|Dumbbell bench press 4|incline bench ~45°: Incline dumbbell press 3 + Chest-supported dumbbell row 3 + Side-lying lateral raise 4|dumbbell rack: Overhead dumbbell triceps extension 3 + Single-leg calf raise 2",
       "Pull|Lat pulldown 4|flat bench + floor: One-arm dumbbell row 3 + Deficit push-up 3|seated cable row + mat: Seated cable row 3 + Reverse crunch 3|cable tower: Cable lateral raise 4 + Face pull 2",
       "Lower|Barbell back squat 4|dumbbell rack + bench: Romanian deadlift 3 + Bulgarian split squat 3|seated hamstring curl + mat: Seated hamstring curl 2 + Side plank 2|Standing calf raise 2|back-extension bench + mat: Back extension 3 + Dead bug 2",
       "Full body|Barbell hip thrust 4|upright bench: Seated dumbbell shoulder press 3 + Dumbbell lateral raise 3|cable crossover: Cable fly (low-to-high) 3 + Pallof press 2|Machine row 3",
       "Extra|cable tower: Rope overhead triceps extension 3 + Cable curl 3|incline bench, face down: Spider curl 3 + Rear-delt dumbbell fly 3|Bike 1"])
  ]
};
const BAL_ABOUT = [
  "Static balance first: find your level on each balance exercise, next to a support. Strength with steady, controlled reps.",
  "Eyes closed, head turns and the first dynamic balance work. Main lifts get heavier.",
  "Balance pad and step-and-hold; jumps come in for those ready for them. Keep 1–3 reps in the tank.",
  "Build strength and reactive balance: catching, hopping and the hardest combinations you've earned."
];
const PHASE_NAMES = ["Foundation", "Build", "Strength", "Build strength"];
const PHASE_ABOUT = [
  "Learn the movements and find your working weights. Stop each set with 1–3 reps left.",
  "More sets and new variations. Add weight when you get every rep.",
  "Heavier main lifts once earned. Keep 1–3 reps in the tank.",
  "Build strength: main lifts at their heaviest range, best variations from earlier phases."
];
// main-lift reps per phase (programme-rules 2) and dose per direction
const DOSE = {
  "Build muscle, more volume": { main: [12, 10, 8, 8], acc: 12, rest: 120, fin: 0, sets3: false },
  "Build muscle": { main: [12, 10, 8, 8], acc: 12, rest: 105, fin: 0, sets3: false },
  "Get stronger, trim fat": { main: [10, 8, 8, 8], acc: 12, rest: 150, fin: 5, sets3: false },
  "Stay lean, get stronger": { main: [10, 8, 8, 8], acc: 12, rest: 120, fin: 0, sets3: true },
  "Reshape": { main: [12, 10, 8, 8], acc: 12, rest: 75, fin: 5, sets3: false },
  "Lose fat, build some muscle": { main: [12, 10, 10, 10], acc: 15, rest: 60, fin: 8, sets3: true },
  "Lean out a little": { main: [15, 12, 12, 12], acc: 15, rest: 50, fin: 8, sets3: true },
  "Lose fat": { main: [15, 12, 12, 12], acc: 15, rest: 50, fin: 10, sets3: true },
  "Lose fat, joint-friendly": { main: [15, 12, 12, 12], acc: 15, rest: 75, fin: 10, sets3: true }
};
const MUSCLE_OF_FOCUS = { chest: ["chest"], back: ["back"], shoulders: ["shoulders", "rear"], arms: ["biceps", "triceps"], glutes: ["glutes"], thighs: ["thighs", "ham"], calves: ["calves"], core: ["core"] };
// exercise added for a focus area when its weekly sets are still short (priority exercises, priority-exercises.md)
const FOCUS_ADD = { chest: ["Incline dumbbell press", "Cable fly (low-to-high)"], back: ["Lat pulldown", "Seated cable row"], shoulders: ["Cable lateral raise", "Dumbbell lateral raise"],
  arms: ["Preacher curl", "Rope overhead triceps extension"], glutes: ["Bulgarian split squat", "Hip abduction machine"], thighs: ["Goblet squat", "Seated hamstring curl"],
  calves: ["Standing calf raise", "Single-leg calf raise"], core: ["Hanging knee raise", "Pallof press"] };

function generatePlan(a) {
  const days = a.days || 3, dir = directionOf(a) || "Build muscle", D = DOSE[dir], lvl = a.level || "Some";
  const age = obAge(a) || 30, old = age >= 65, easy = new Set(a.easy || []);
  const time = parseInt(a.time, 10) || 45;
  const m = obMetric(a), bwKg = Math.max(50, Math.min(100, m.kg || 75));
  const sexF = a.sex === "Female" ? [0.6, 0.8] : a.sex === "Male" ? [1, 1] : [0.8, 0.9];
  const expF = { New: 0.6, Some: 1, Experienced: 1.6 }[lvl], ageF = age >= 65 ? 0.8 : age >= 50 ? 0.9 : 1;
  const minReps = old ? 8 : lvl === "New" ? 8 : age >= 50 ? 6 : age >= 40 ? 5 : 6;
  const bal = a.goal === "Balance", C = { lvl, old, easy };
  const warm = age >= 50 ? 10 : age >= 40 ? 8 : 5;                         // H1 (2026-10-26): warm-up in every workout, inside the chosen time
  const tpl = (bal ? BALANCE : STRENGTH)[days] || (bal ? BALANCE : STRENGTH)[3];
  const phases = tpl.map((W, pi) => {
    const used = new Set();                                      // no repeats within the week
    const plan = W.map(w => ({ name: w.name, groups: w.groups.map(g => ({ spot: g.spot, ex: g.ex.map(x => ({ ...x })) })) }));
    const all = () => plan.flatMap(w => w.groups.flatMap(g => g.ex));
    all().forEach(x => used.add(x.name));
    const swap = (x, options) => { for (const o of options) if (!used.has(o) || o === x.name) { used.delete(x.name); used.add(o); x.name = o; return true; } return false; };
    for (const w of plan) for (const g of w.groups) for (const x of g.ex) {
      const n = x.name;
      // review decisions (goal-focus-review.md) and priority exercises
      if (n === "Incline dumbbell fly") swap(x, ["Cable fly (low-to-high)", "Cable fly (mid)", "Incline dumbbell fly"]);
      if (n === "Reverse crunch" && pi === 1) swap(x, ["Stability-ball crunch", "Reverse crunch"]);
      if (n === "Reverse crunch" && pi >= 2 && lvl !== "New" && !old) swap(x, ["Hanging knee raise", "Ab crunch machine", "Reverse crunch"]);
      if (n === "Lying hamstring curl" && pi === 0) swap(x, ["Seated hamstring curl", "Lying hamstring curl"]);
      if (n === "Incline dumbbell curl" && pi === 1) swap(x, ["Preacher curl", "Incline dumbbell curl"]);
      if (n === "Cable curl" && pi === 3) swap(x, ["Face-away cable curl", "Cable curl"]);
      // pull-ups (S-02): Experienced from phase 2, Some in phase 4 – as the Pull main lift
      if (n === "Lat pulldown" && g === w.groups[0] && ((lvl === "Experienced" && pi >= 1) || (lvl === "Some" && pi === 3)) && !old && !easy.has("Shoulders")) swap(x, ["Pull-up"]);
      // New: no barbell in phase 1 (programme-rules D3); barbell squat only via the barbell question → goblet squat
      if (lvl === "New" && pi === 0 && EX[x.name]?.eq === "bb") swap(x, x.name === "Barbell hip thrust" ? ["Dumbbell hip thrust"] : ["Goblet squat", "Leg press"]);
      if (lvl === "New" && x.name === "Barbell back squat") swap(x, ["Goblet squat", "Leg press"]);
      // go easy on (programme-rules 5)
      const e = EX[x.name] || {};
      if (easy.has("Knees") && e.knee) swap(x, /goblet squat|back squat/i.test(x.name) ? ["Leg press", "Single-leg leg press"] : ["Single-leg leg press", "Leg press", "Dumbbell hip thrust", "Cable pull-through", "Seated hamstring curl"]);
      if (easy.has("Back") && (x.name === "Barbell back squat")) swap(x, ["Leg press"]);
      if (easy.has("Back") && /Romanian deadlift/.test(x.name)) swap(x, ["Cable pull-through", "Dumbbell hip thrust", "Glute bridge", "Back extension"]);
      if (easy.has("Shoulders") && /push-up|pullover/i.test(x.name)) swap(x, ["Machine chest press", "Cable fly (mid)", "Incline dumbbell press"]);
      if (easy.has("Wrists") && /push-up/i.test(x.name)) x.note = "Push-ups on handles or fists, wrists straight.";
      // 65+: machines first, no floor exercises in the gym (Part 1)
      if (old && EX[x.name]?.floor) {
        const core = EX[x.name].m === "core";
        swap(x, core ? ["Seated knee lift", "Pallof press", "Incline plank", "Ab crunch machine", "Suitcase hold"] : ["Machine chest press", "Incline push-up", "Dumbbell hip thrust"]);
      }
      // Balance, New: the static holds and the machines arrive in phase 4 (H9a) – 65+ keep machines from phase 1 (I3)
      if (bal && lvl === "New" && pi < 3 && !old && EX[x.name]?.eq === "machine") swap(x, { "Hip abduction machine": ["Side-lying leg raise", "Glute bridge"], "Hip adduction machine": ["Glute bridge", "Side-lying leg raise"],
        "Single-leg leg press": ["Reverse lunge", "Step-up"], "Calf raise on the leg press": ["Single-leg calf raise"], "Seated calf raise": ["Single-leg calf raise"], "Leg press": ["Goblet squat"] }[x.name] || []);
      // Balance B-06: standing cable hip abduction replaces the side-lying hip raise for Some / Experienced
      if (bal && lvl !== "New" && x.name === "Side-lying leg raise" && pi === 1) swap(x, ["Standing cable hip abduction"]);
      if (bal && lvl === "Experienced" && x.name === "Cable woodchop") x.note = "Standing version.";
      // phase 4: every exercise must be loadable (priority-exercises.md)
      if (pi === 3 && EX[x.name] && (EX[x.name].nokg) && EX[x.name].m === "core") swap(x, ["Ab crunch machine", "Pallof press", "Suitcase hold", "Hanging knee raise"]);
    }
    if (bal && lvl === "New" && pi < 3) plan.forEach(w => { w.groups = w.groups.filter(g => g.spot !== "static holds"); });
    if (bal && lvl !== "Experienced") plan.forEach(w => { if (w.name === "Mobility & core") { const x = w.groups[0].ex[0]; x.name = used.has("Suitcase carry") ? "Farmer carry" : "Suitcase carry"; x.sets = 3; } });
    // thighs at least Build for Strength (programme-rules B) – the 3-day template was written for "go easy on knees"
    if (!bal && days === 3 && !easy.has("Knees")) {
      const fb = plan[2]; const add = [pi % 2 === 0 ? "Goblet squat" : "Bulgarian split squat"].filter(n => !used.has(n));
      if (add.length && !(lvl === "New" && add[0] === "Bulgarian split squat" && pi < 3)) { fb.groups.splice(1, 0, { spot: "", ex: [{ name: add[0], sets: 3 }] }); used.add(add[0]); }
    }
    // focus areas: raise weekly sets for each focus muscle towards 12 (Focus level)
    const main = plan.filter(w => w.name !== "Extra");
    const setsOf = ms => main.flatMap(w => w.groups.flatMap(g => g.ex)).filter(x => ms.includes(EX[x.name]?.m)).reduce((s, x) => s + x.sets, 0);
    for (const f of a.focus || []) {
      const ms = MUSCLE_OF_FOCUS[f]; let guard = 0, goal = focusClash(a, f) ? 8 : 12;      // focus + "go easy" on the same area: go easy wins (Christian 2026-10-27)
      while (setsOf(ms) < goal && guard++ < 12) {
        const xs = main.flatMap(w => w.groups.flatMap(g => g.ex)).filter(x => ms.includes(EX[x.name]?.m) && x.sets < 4);
        if (xs.length) { xs.sort((p, q) => p.sets - q.sets)[0].sets++; continue; }
        const cand = FOCUS_ADD[f].find(n => !used.has(n) && !(old && EX[n]?.floor) && !(easy.has("Knees") && EX[n]?.knee) && !(easy.has("Shoulders") && /press|push-up|dip/i.test(n)));
        if (!cand) break;
        const target = main.reduce((b, w) => (w.groups.reduce((s, g) => s + g.ex.reduce((t, x) => t + x.sets, 0), 0) < b.n ? { w, n: w.groups.reduce((s, g) => s + g.ex.reduce((t, x) => t + x.sets, 0), 0) } : b), { w: main[0], n: 1e9 }).w;
        target.groups.push({ spot: "", ex: [{ name: cand, sets: 3 }] }); used.add(cand);
      }
    }
    // M6 (2026-10-26): Balance plans – one lower-body/core pair per workout becomes a push + pull pair (upper body was light)
    if (bal) main.forEach(w => {
      if (/Upper/.test(w.name) || w.name === "Mobility & core") return;
      const LOW = ["glutes", "thighs", "ham", "calves", "core"];
      const gi = w.groups.findIndex((g, i) => i > 0 && g.spot !== "static holds" && g.ex.length === 2 && g.ex.every(x => LOW.includes(EX[x.name]?.m) && !(a.focus || []).flatMap(f => MUSCLE_OF_FOCUS[f]).includes(EX[x.name]?.m)));
      if (gi < 0) return;
      const pk = l => l.find(n => !used.has(n) && !(old && EX[n]?.floor) && !(easy.has("Shoulders") && /push-up/i.test(n)));
      const push = pk(["Incline dumbbell press", "Dumbbell bench press", "Machine chest press", "Incline push-up"]), pull = pk(["One-arm dumbbell row", "Seated cable row", "Chest-supported dumbbell row", "Lat pulldown", "Machine row"]);
      if (!push || !pull) return;
      w.groups[gi].ex.forEach(x => used.delete(x.name));
      w.groups[gi] = { spot: "bench", ex: [{ name: push, sets: 2 }, { name: pull, sets: 2 }] }; used.add(push); used.add(pull);
    });
    // time: 30 min keeps the main lift + two groups (max 3 sets); 60 min adds a set to focus exercises
    const focusMs = (a.focus || []).flatMap(f => MUSCLE_OF_FOCUS[f]);
    if (time <= 30) main.forEach(w => { w.groups = w.groups.slice(0, 3); w.groups.forEach(g => g.ex.forEach(x => x.sets = Math.min(x.sets, 3))); });
    if (time >= 60) main.forEach(w => w.groups.slice(1).forEach(g => g.ex.forEach(x => { if (focusMs.includes(EX[x.name]?.m) && x.sets < 4) x.sets++; })));
    // keep each workout inside its time: ~14 sets at 30 min, ~22 at 45, ~28 at 60 (supersets). Trim the least important first.
    const cap = (bal ? (time <= 30 ? 9 : time >= 60 ? 21 : 15) + 2 : time <= 30 ? 14 : time >= 60 ? 28 : 22) - Math.floor(warm / 2) - (age >= 50 && !bal ? 1 : 0);   // warm-up and the 50+ balance exercise fit inside the chosen time; the finisher is an optional extra after it (Christian 2026-10-26)
    const ORDER = ["calves", "rear", "triceps", "biceps", "core", "shoulders", "ham", "thighs", "back", "chest", "glutes"];
    const rank = x => focusMs.includes(EX[x.name]?.m) ? 99 : Math.max(0, ORDER.indexOf(EX[x.name]?.m));
    for (const w of main) {
      const total = () => w.groups.reduce((t, g) => t + g.ex.reduce((u, x) => u + x.sets, 0), 0);
      let guard = 0;
      while (total() > cap && guard++ < 60) {
        const acc = w.groups.slice(1).flatMap(g => g.ex).filter(x => rank(x) < 99);
        const cut = acc.filter(x => x.sets > 2).sort((p, q) => rank(p) - rank(q) || q.sets - p.sets)[0];
        if (cut) { cut.sets--; continue; }
        const drop = acc.sort((p, q) => rank(p) - rank(q))[0];
        if (!drop) break;
        for (const g of w.groups) g.ex = g.ex.filter(x => x !== drop);
        w.groups = w.groups.filter(g => g.ex.length); used.delete(drop.name);
      }
    }
    if (D.sets3) main.forEach(w => { const x = w.groups[0].ex[0]; x.sets = Math.min(x.sets, 3); });
    // M1 (2026-10-26): 60 min gets more than 45 – sets for muscles below their target first, then the extra workout's groups
    if (!bal && time >= 60) {
      const extra = plan.find(w => w.name === "Extra");
      const wk = () => weeklySets(main.flatMap(w => w.groups.flatMap(g => g.ex)));
      for (const w of main) {
        const total = () => w.groups.reduce((t, g) => t + g.ex.reduce((u, x) => u + x.sets, 0), 0);
        let guard = 0;
        while (total() < cap && guard++ < 40) {
          const ws = wk(), need = grp => targetLow(a, grp, pi) - ws[grp];
          const acc = w.groups.slice(1).flatMap(g => g.ex).filter(x => x.sets < 4 && GROUP_OF[EX[x.name]?.m] && need(GROUP_OF[EX[x.name].m]) > 0)
            .sort((p, q) => need(GROUP_OF[EX[q.name].m]) - need(GROUP_OF[EX[p.name].m]));
          if (acc.length) { acc[0].sets++; continue; }
          const gi = extra ? extra.groups.findIndex(g => g.ex.every(x => EX[x.name]?.m !== "cardio") && total() + g.ex.reduce((u, x) => u + x.sets, 0) <= cap) : -1;
          if (gi < 0) break;
          w.groups.push(extra.groups.splice(gi, 1)[0]);
        }
      }
    }
    // build the app's workout format
    const workouts = {};
    plan.forEach((w, wi) => {
      const key = w.name === "Extra" ? "c" : String(wi + 1);
      const exs = []; let letter = 0;
      const push = (b, extra = {}) => exs.push({ name: b.name, sets: b.sets || 2, reps: b.reps, kg: 0, rest: 0, inc: 0, unit: b.unit, lib: b.lib, id: `g${pi + 1}${key}-${b.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").slice(0, 28)}`, ...extra });
      if (key !== "c") {
        if (w.name === "Mobility & core") push({ name: "Warm-up", reps: 3, unit: "min", sets: 1 }, { note: "3 min easy bike or walk – the mobility flow that follows is the rest of the warm-up." });
        else push({ name: "Warm-up", reps: warm - 2, unit: "min", sets: 1 }, { note: a.where === "Home" ? "Brisk walking or marching in place – easy, full sentences." : "Easy bike or walk – full sentences." });
        if (!bal && age >= 50) push(balanceOne(pi, C, a), { note: "Per leg, next to a support. Feather = steady, kettlebell = wobbly or touched down." });
      }
      if (bal && key !== "c") {                                                // warm-up / balance block first (H3, H9)
        const legDay = /Lower|Full body/.test(w.name);
        if (legDay) push(easy.has("Knees") ? { name: "Ankle rocks", lib: "Ankle rocks", reps: 30, unit: "sec", sets: 2 } : { name: "Deep squat hold", lib: "Deep squat hold", reps: 30, unit: "sec", sets: 2 },
          { note: easy.has("Knees") ? "Holding the rack: knee gently forward over the toes, heel down. Seconds per side." : "Holding the rack. Heels down, chest up" + (old ? ", only as deep as feels fine." : ".") });
        if (w.name === "Mobility & core") ["Half-kneeling hip-flexor stretch", "90/90 hip switches", "Ankle rocks", "Open-book upper-back rotation", "Deep squat hold"].forEach((n, i) => push({ name: n, lib: n, reps: time <= 45 ? 60 : 120, unit: "sec", sets: 1 }, { note: i === 0 ? `Mobility flow – follow along, about ${time <= 45 ? 5 : 10} min.` : undefined }));
        const blk = balanceBlock(w.name === "Mobility & core" ? 3 : wi, pi, C); letter = 1;
        blk.forEach((b, i) => push({ ...b, sets: 2 }, { ss: "A" + (i + 1), rest: i === blk.length - 1 ? 30 : 0, note: i === 0 ? "Balance block – 2 rounds. Feather = easy, kettlebell = wobbly or touched down." : undefined }));
      }
      w.groups.forEach((g, gi) => {
        const ss = g.ex.length > 1 ? String.fromCharCode(65 + letter++) : null;
        g.ex.forEach((x, xi) => {
          const e = EX[x.name] || { m: "", eq: "db", ratio: .05, inc: 2 }, isMain = key !== "c" && gi === 0;
          // M3 (2026-10-26): Strength goal – main lift at least 12 → 10 → 8 → 8 whatever the direction
          const reps = e.reps || (isMain ? Math.max(minReps, a.goal === "Strength" ? Math.min(D.main[pi], [12, 10, 8, 8][pi]) : D.main[pi]) : D.acc);
          const mainRest = (a.goal === "Strength" ? Math.max(D.rest, 105) : D.rest) + (old ? 30 : 0);   // 65+: +30 s (Part 1)
          let kg = 0;
          if (e.fixed) kg = e.fixed;
          else if (e.ratio) { const sx = e.lower ? sexF[1] : sexF[0], raw = e.ratio * bwKg * expF * sx * ageF, step = e.eq === "db" ? 2 : 2.5; kg = Math.max(e.eq === "db" ? 2 : 5, Math.floor(raw / step) * step); }
          if (e.assist) kg = -Math.round(bwKg * 0.3 / 2.5) * 2.5;           // assisted pull-up: start with plenty of help
          const last = xi === g.ex.length - 1;
          const notes = [];
          if (ss && !last) notes.push("Go straight to " + ss + (xi + 2) + ".");
          if (g.spot && xi === 0 && ss) notes.push("Superset at the " + g.spot + ".");
          if (e.note) notes.push(e.note);
          if (x.note) notes.push(x.note);
          exs.push({ name: x.name, sets: x.sets, reps, kg, rest: ss && !last ? 0 : isMain ? mainRest : 60, inc: e.inc || 0, unit: e.unit || "reps",
            ...(e.bw ? { bw: true } : {}), ...(ss ? { ss: ss + (xi + 1) } : {}), ...(e.lib ? { lib: e.lib } : {}), ...(notes.length ? { note: notes.join(" ") } : {}),
            id: `g${pi + 1}${key}-${x.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").slice(0, 28)}` });
        });
      });
      if (bal && w.name === "Upper & core") push(easy.has("Knees") ? { name: "Calf stretch", lib: "Calf stretch", reps: 45, unit: "sec", sets: 1 } : { name: "Deep squat hold", lib: "Deep squat hold", reps: 45, unit: "sec", sets: 1 }, { note: "Cool-down, holding the rack." });
      const fin = D.fin;                                                          // optional extra after the workout, not part of the chosen time
      if (!bal && key !== "c" && fin) exs.push({ name: "Finisher: bike or rower", sets: 1, reps: fin, kg: 0, rest: 0, inc: 0, unit: "min", optional: true, note: `Optional, +${fin} min if you have time – not part of your ${time} minutes. Hard but steady – you can only say a few words.`, lib: "Bike", id: `g${pi + 1}${key}-finisher` });
      if (key === "c" && pi === 0 && !bal) exs.forEach(x => { x.reps = 35; x.note = "Easy pace, you can still talk."; });
      workouts[key] = { name: key === "c" ? (bal ? (days === 2 ? "Home balance and mobility (recommended twice a week)" : "Home balance and mobility (recommended)") : pi === 0 ? "Walk or bike (optional)" : "Extra – the sets that didn't fit") : w.name, exercises: exs };
    });
    return { name: PHASE_NAMES[pi], weeks: [pi * 3 + 1, pi * 3 + 2, pi * 3 + 3], about: (bal ? BAL_ABOUT : PHASE_ABOUT)[pi], workouts };
  });
  const title = `${a.goal} · ${a.shape} · ${days} days · ${a.time}`;
  return { title, start: today(), mig: 2, generated: true, direction: dir, phases };
}

// ===== Balance goal (balance-plan-update.md H9 – overrides balance-workouts.md / balance-2day-4day.md where they differ)
Object.assign(EX, {
  "Single-leg Romanian deadlift": { m: "ham", eq: "db", ratio: .08, inc: 2, lower: true, lib: "Single-leg Romanian deadlift reach", note: "Dumbbell in the opposite hand." },
  "Hip adduction machine": { m: "thighs", eq: "machine", ratio: .3, inc: 2.5, lower: true },
  "Single-arm cable row": { m: "back", eq: "cable", ratio: .15, inc: 2.5, lib: "Single-arm cable row, split stance", note: "Split stance, reps per side." },
  "Half-kneeling Pallof press": { m: "core", eq: "cable", ratio: .12, inc: 2.5, lib: "Kneeling Pallof press", note: "Reps per side." },
  "Tall-kneeling Pallof press": { m: "core", eq: "cable", ratio: .12, inc: 2.5, lib: "Kneeling Pallof press", note: "Reps per side." },
  "Wall sit": { m: "thighs", eq: "bw", nokg: true, unit: "sec", reps: 30 },
  "Front plank": { m: "core", eq: "bw", nokg: true, floor: true, unit: "sec", reps: 30 },
  "Glute bridge hold": { m: "glutes", eq: "bw", nokg: true, floor: true, unit: "sec", reps: 30 },
  "Hollow hold": { m: "core", eq: "bw", nokg: true, floor: true, unit: "sec", reps: 20 },
  "Copenhagen side plank": { m: "thighs", eq: "bw", nokg: true, floor: true, unit: "sec", reps: 15, note: "Short lever: knee on the bench. Seconds per side." },
  "Side-lying leg raise": { m: "glutes", eq: "bw", nokg: true, floor: true, note: "Reps per side." },
  "Standing cable hip abduction": { m: "glutes", eq: "cable", ratio: .05, inc: 2.5, lower: true, note: "Reps per side." },
  "Suitcase carry": { m: "core", eq: "db", ratio: .25, inc: 2, unit: "m", reps: 20, lib: "Suitcase hold & carry", note: "Metres per side." },
  "Farmer carry": { m: "core", eq: "db", ratio: .3, inc: 2, unit: "m", reps: 20, lib: "Farmer carry & march" },
  "Farmer march": { m: "core", eq: "db", ratio: .2, inc: 2, unit: "m", reps: 20, lib: "Farmer carry & march", note: "Lift one knee, pause 1 s each step." },
  "Overhead carry": { m: "shoulders", eq: "db", ratio: .1, inc: 2, unit: "m", reps: 20 },
  "Turkish get-up": { m: "core", eq: "db", ratio: .06, inc: 2, reps: 2, note: "Reps per side, slow." },
  "Sit-to-stand": { m: "thighs", eq: "db", ratio: .1, inc: 2, lower: true, note: "To a bench, dumbbell at the chest." },
  "Cable woodchop": { m: "core", eq: "cable", ratio: .1, inc: 2.5, note: "Half-kneeling, turn from the upper back. Reps per side." },
  "Single-leg Pallof press": { m: "core", eq: "cable", ratio: .08, inc: 2.5 },
  "Reverse lunge": { m: "thighs", eq: "db", ratio: .06, inc: 2, lower: true, knee: true, note: "Reps per leg." },
  "Home balance and mobility": { m: "cardio", eq: "cardio", unit: "min", reps: 15, nokg: true, lib: "Single-leg stand", note: "At home next to a kitchen counter: balance block at your level + 5 min mobility." }
});
const BALANCE = {
  3: [
    T(["Lower & balance|Step-up 3|rack + mat: Single-leg Romanian deadlift 3 + Dead bug 2|hip machine: Hip abduction machine 3 + Hip adduction machine 2|Seated calf raise 2",
       "Upper & core|One-arm dumbbell row 3|incline bench: Incline dumbbell press 3 + Incline Y-raise 3|cable tower: Pallof press 2 + Single-arm cable row 2|static holds: Wall sit 2 + Front plank 2",
       "Full body & control|Goblet squat 3|lat pulldown + mat: Lat pulldown 3 + Bird dog 2|rack: Suitcase carry 2 + Dumbbell lateral raise 3|flat bench: Incline push-up 2 + Dumbbell hip thrust 3",
       "Extra|Home balance and mobility 1"]),
    T(["Lower & balance|Step-up 4|rack + mat: B-stance Romanian deadlift 3 + Side plank 2|leg press: Single-leg leg press 3 + Calf raise on the leg press 2",
       "Upper & core|One-arm dumbbell row 4|incline bench ~45°: Incline dumbbell press 3 + Side-lying lateral raise 3|cable tower: Half-kneeling Pallof press 2 + Face pull 2|static holds: Wall sit 2 + Glute bridge hold 2",
       "Full body & control|Goblet squat 4|lat pulldown + mat: Lat pulldown 3 + Reverse crunch 2|rack: Farmer carry 2 + Lean-away lateral raise 2|flat bench + mat: Incline push-up 2 + Side-lying leg raise 2",
       "Extra|Home balance and mobility 1"]),
    T(["Lower & balance|Step-up 4|rack + bench: Bulgarian split squat 3 + Dead bug 2|Single-leg Romanian deadlift 3|Seated calf raise 2",
       "Upper & core|One-arm dumbbell row 4|incline bench ~30°: Incline dumbbell press 3 + Incline Y-raise 3|cable tower: Tall-kneeling Pallof press 2 + Single-arm cable row 2|static holds: Hollow hold 2 + Side plank 2",
       "Full body & control|Goblet squat 4|lat pulldown + mat: Lat pulldown 3 + Bird dog 2|cable tower: Cable woodchop 2 + Cable lateral raise 3|Hip abduction machine 3",
       "Extra|Home balance and mobility 1"]),
    T(["Lower & balance|Step-up 4|rack + mat: Single-leg Romanian deadlift 3 + Side plank 2|hip machine: Hip abduction machine 3 + Hip adduction machine 2",
       "Upper & core|One-arm dumbbell row 4|incline bench ~45°: Incline dumbbell press 3 + Side-lying lateral raise 3|cable tower: Half-kneeling Pallof press 2 + Face pull 2|static holds: Wall sit 2 + Front plank 2",
       "Full body & control|Goblet squat 4|lat pulldown + mat: Lat pulldown 3 + Dead bug 2|rack: Suitcase carry 2 + Lean-away lateral raise 2|flat bench + mat: Incline push-up 2 + Dumbbell hip thrust 3",
       "Extra|Home balance and mobility 1"])
  ],
  2: [
    T(["Lower & balance|Sit-to-stand 3|bench: Step-up 2 + Incline plank 2|leg press: Leg press 3 + Calf raise on the leg press 3",
       "Upper & core|Chest-supported dumbbell row 3|incline bench: Incline dumbbell press 3 + Incline Y-raise 2|dumbbell rack: Suitcase hold 2 + Dumbbell lateral raise 2|Seated knee lift 2",
       "Extra|Home balance and mobility 1"]),
    T(["Lower & balance|Sit-to-stand 4|bench: Step-up 3 + Incline plank 2|leg press: Leg press 3 + Calf raise on the leg press 2",
       "Upper & core|Chest-supported dumbbell row 4|incline bench: Incline dumbbell press 3 + Incline Y-raise 2|cable tower: Pallof press 2 + Single-arm cable row 2 + Face pull 2",
       "Extra|Home balance and mobility 1"]),
    T(["Lower & balance|Sit-to-stand 4|bench: Step-up 3 + Incline plank 2|leg press: Single-leg leg press 3 + Calf raise on the leg press 2",
       "Upper & core|Chest-supported dumbbell row 4|incline bench ~45°: Incline dumbbell press 3 + Side-lying lateral raise 2|cable tower: Pallof press 2 + Single-arm cable row 2|Seated knee lift 2",
       "Extra|Home balance and mobility 1"]),
    T(["Lower & balance|Sit-to-stand 4|leg press: Leg press 3 + Calf raise on the leg press 2|hip machine: Hip abduction machine 2 + Hip adduction machine 2",
       "Upper & core|Chest-supported dumbbell row 4|incline bench: Incline dumbbell press 3 + Incline Y-raise 2|cable tower: Pallof press 2 + Face pull 2|Ab crunch machine 2|static holds: Wall sit 2 + Incline plank 2",
       "Extra|Home balance and mobility 1"])
  ]
};
const MOBILITY_DAY = [
  "Mobility & core|Turkish get-up 3|mat: Hollow hold 2 + Copenhagen side plank 2|dumbbell rack: Farmer march 2 + Overhead carry 2",
  "Mobility & core|Turkish get-up 4|mat: Front plank 2 + Copenhagen side plank 2|cable tower: Single-leg Pallof press 2 + Cable woodchop 2",
  "Mobility & core|Turkish get-up 4|mat: Hollow hold 2 + Copenhagen side plank 2|dumbbell rack: Overhead carry 2 + Farmer march 2",
  "Mobility & core|Turkish get-up 4|mat: Hollow hold 2 + Copenhagen side plank 2|dumbbell rack: Farmer march 2 + Overhead carry 2"
];
BALANCE[4] = BALANCE[3].map((W, pi) => { const t = T([MOBILITY_DAY[pi]])[0]; return [...W.slice(0, 3), t, W[3]]; });
// balance blocks: [name, library card, reps, unit] – static, static, third = dynamic slot (H9b)
const BS = (name, lib, reps = 30, unit = "sec") => ({ name, lib, reps, unit });
const BLOCKS = [
  [[BS("Single-leg stand", "Single-leg stand"), BS("Tandem stand", "Tandem stand & heel-to-toe walk"), BS("Calf-raise hold", "Toe stand & calf-raise hold")],
   [BS("Single-leg stand", "Single-leg stand"), BS("Heel-to-toe walk", "Tandem stand & heel-to-toe walk"), BS("Toe stand", "Toe stand & calf-raise hold")],
   [BS("Single-leg stand holding a light dumbbell", "Single-leg stand with a weight"), BS("Split-stance hold", "Split-stance hold"), BS("Tandem stand", "Tandem stand & heel-to-toe walk")],
   [BS("Single-leg stand", "Single-leg stand"), BS("Single-leg star reach", "Single-leg star reach", 5, "reps"), BS("Tandem walk, eyes up", "Tandem stand & heel-to-toe walk")]],
  [[BS("Single-leg stand with head turns", "Single-leg stand"), BS("Single-leg star reach", "Single-leg star reach", 5, "reps")],
   [BS("Single-leg stand, eyes closed (hand by the support)", "Single-leg stand"), BS("Heel-to-toe walk with head turns", "Tandem stand & heel-to-toe walk")],
   [BS("Single-leg stand passing a dumbbell hand to hand", "Single-leg stand with a weight"), BS("Split-stance hold, eyes closed", "Split-stance hold")],
   [BS("Single-leg stand with head turns", "Single-leg stand"), BS("Single-leg star reach", "Single-leg star reach", 5, "reps")]],
  [[BS("Single-leg stand on the pad", "Single-leg stand"), BS("Step-up and hold", "Step and hold", 5, "reps")],
   [BS("Tandem stand on the pad", "Tandem stand & heel-to-toe walk"), BS("Single-leg stand, eyes closed", "Single-leg stand")],
   [BS("Single-leg stand on the pad with head turns", "Single-leg stand"), BS("Split-stance hold on the pad", "Split-stance hold")],
   [BS("Single-leg stand on the pad", "Single-leg stand"), BS("Split-stance hold, eyes closed", "Split-stance hold")]],
  [[BS("Single-leg stand on the pad catching a ball", "Ball toss to a wall"), BS("Forward and back step and hold", "Step and hold", 5, "reps")],
   [BS("Single-leg stand passing a weight around the body", "Single-leg stand with a weight"), BS("Heel-to-toe walk on a line, eyes up", "Tandem stand & heel-to-toe walk")],
   [BS("Single-leg stand, ball toss to the wall", "Ball toss to a wall"), BS("Split-stance hold on the pad, eyes closed", "Split-stance hold")],
   [BS("Single-leg stand passing a weight around the body", "Single-leg stand with a weight"), BS("Tandem walk on the pad", "Tandem stand & heel-to-toe walk")]]
];
const DYN = {
  rlkd: BS("Reverse lunge to knee drive, hold 3 s", "Reverse lunge to knee drive", 5, "reps"), switch: BS("Step switch", "Jump lunge", 20), march: BS("March in place", "March or skip in place"),
  rdl: BS("Single-leg RDL reach", "Single-leg Romanian deadlift reach", 6, "reps"), jlunge: BS("Jump lunge", "Jump lunge", 20), skip: BS("Skipping in place", "March or skip in place"),
  spallof: BS("Single-leg Pallof press", "Single-leg Pallof press", 8, "reps"), pistol: BS("Pistol squat ladder", "Pistol squat ladder", 4, "reps"), hop: BS("Small hop and stick", "Small hop and stick", 5, "reps"),
  skater: BS("Skater bound and stick", "Skater bound and stick", 5, "reps"), lateral: BS("Lateral step and hold", "Lateral step and hold", 5, "reps"), weight: BS("Single-leg stand passing a weight", "Single-leg stand with a weight"),
  highmarch: BS("March with high knees", "March or skip in place"), shallow: BS("Step switch, shallow, hand on the support", "Jump lunge", 20)
};
// dynamic slot per phase × workout (Lower, Upper, Full, Mobility)
const DYN_SOME = [[null, null, null, null], ["rlkd", "switch", "rdl", "lateral"], ["jlunge", "skip", "spallof", "hop"], ["pistol", "skip", "hop", "skater"]];
const DYN_EXP = [["rlkd", "weight", "rdl", "rdl"], ["jlunge", "skip", "spallof", "lateral"], ["pistol", "skip", "skater", "hop"], ["pistol", "jlunge", "hop", "skater"]];
const DYN_NEW = [null, "march", "switch", "skip"];
function balanceBlock(wi, pi, C) {
  const base = (BLOCKS[pi][wi] || BLOCKS[pi][0]).slice(0, 3).map(b => ({ ...b }));
  let dyn = C.lvl === "Experienced" ? DYN_EXP[pi][wi] : C.lvl === "Some" ? DYN_SOME[pi][wi] : DYN_NEW[pi];
  const jumpy = ["jlunge", "skip", "hop", "skater", "pistol"];
  if (C.old) dyn = { jlunge: "shallow", skip: "highmarch", hop: "lateral", skater: "lateral", pistol: "lateral", switch: "shallow", march: "march" }[dyn] || dyn;
  if (C.easy.has("Knees") && jumpy.concat(["rlkd", "switch"]).includes(dyn)) dyn = { jlunge: "switch", skip: "march", rlkd: "lateral", switch: "march" }[dyn] || "lateral";
  if (C.easy.has("Knees") && dyn === "switch") dyn = "march";
  if (dyn) base[2] = { ...DYN[dyn] }; else if (base.length < 3) base.push(BS("Single-leg stand", "Single-leg stand"));
  if (dyn === "pistol") base[2].name = C.lvl === "Experienced" ? "Pistol squat ladder" : "Pistol squat ladder (steps 1–3, box)";
  if (C.old) base.forEach(b => { if (!/support/.test(b.name)) b.name += " – support in reach"; });
  return base;
}
function genSupported(a) { return a && (a.goal === "Strength" || a.goal === "Balance") && a.where === "Gym"; }

// ===== Cardio goal (cardio-workouts.md J3–J10, cardio-2day-4day.md, goal-focus-review C-01…C-08)
const MACHINES = { "Bike": { lib: "Bike", p: [0, 0] }, "Cross-trainer": { lib: "Cross-trainer", p: [0, 0] }, "Incline treadmill walk": { lib: "Incline treadmill walk", p: [0, 0] },
  "Stair climber": { lib: "Stair climber", p: [0, 0] }, "Rower": { lib: "Rower", p: [2, 1] }, "Air bike": { lib: "Air bike", p: [1, 0] }, "Ski machine": { lib: "Ski machine", p: [1, 0] },
  "Running": { lib: "Walk–run", p: [1, 0], run: true } };                   // p = first phase index for [New, Some/Experienced]
const CARDIO_STR = [   // [Strength + intervals, Strength + tempo/steady] – main lifts stay, the superset changes each phase (J9)
  ["Goblet squat 3|flat bench: Dumbbell bench press 2 + One-arm dumbbell row 2", "Romanian deadlift 3|lat pulldown + mat: Lat pulldown 2 + Dead bug 2"],
  ["Goblet squat 3|incline bench: Incline dumbbell press 2 + Chest-supported dumbbell row 2", "Romanian deadlift 3|seated cable row + mat: Seated cable row 2 + Reverse crunch 2"],
  ["Goblet squat 3|flat bench: Dumbbell bench press 2 + One-arm dumbbell row 2", "Romanian deadlift 3|lat pulldown + mat: Lat pulldown 2 + Side plank 2"],
  ["Goblet squat 3|incline bench: Incline dumbbell press 2 + Chest-supported dumbbell row 2", "Romanian deadlift 3|seated cable row + mat: Seated cable row 2 + Reverse crunch 2"]
];
const INTERVALS = ["8 × 30 s Hard / 90 s Easy", "8 × 45 s Hard / 75 s Easy", "4 × 3 min Hard / 2 min Easy", "5 × 2 min Hard / 2 min Easy"];
const TEMPO = ["2 × 7 min Steady, 2 min Easy between", "2 × 8 min Steady, 2 min Easy between", "3 × 5 min Steady, 1 min Easy between", "2 × 8 min Steady + 2 min Hard finish"];
const INTERVALS15 = ["6 × 30 s Hard / 90 s Easy", "6 × 45 s Hard / 75 s Easy", "2 × 3 min Hard / 2 min Easy", "3 × 2 min Hard / 2 min Easy"];
const INTERVALS25 = ["10 × 30 s Hard / 90 s Easy", "10 × 45 s Hard / 75 s Easy", "4 × 3 min Hard / 2 min Easy", "5 × 2 min Hard / 2 min Easy"];
const TEMPO15 = ["2 × 5 min Steady, 2 min Easy between", "2 × 5 min Steady, 2 min Easy between", "2 × 5 min Steady, 1 min Easy between", "2 × 5 min Steady + 1 min Hard finish"];
const TEMPO25 = ["3 × 6 min Steady, 1 min Easy between", "3 × 6 min Steady, 1 min Easy between", "4 × 5 min Steady, 1 min Easy between", "3 × 6 min Steady + 2 min Hard finish"];
// WHO counting: a Hard minute counts double – the extra minutes in a block's note
function hardMinutes(note) { let h = 0; const m = (note || "").match(/(\d+) × (\d+) (s|min) Hard/); if (m) h += (+m[1]) * (+m[2]) / (m[3] === "s" ? 60 : 1); const f = (note || "").match(/\+ (\d+) min Hard/); if (f) h += +f[1]; return h; }
const CORE_MOB = [["Bird dog", "Side plank", "Half-kneeling hip-flexor stretch"], ["Dead bug", "Side plank", "Half-kneeling hip-flexor stretch"], ["Bird dog", "Glute-bridge march", "90/90 hip switches"], ["Dead bug", "Side plank", "Ankle rocks"]];
function generateCardio(a) {
  const days = a.days || 3, lvl = a.level || "Some", dir = directionOf(a) || "Reshape", D = DOSE[dir];
  const age = obAge(a) || 30, old = age >= 65, easy = new Set(a.easy || []), C = { lvl, old, easy };
  const m = obMetric(a), bwKg = Math.max(50, Math.min(100, m.kg || 75));
  const sexF = a.sex === "Female" ? [0.6, 0.8] : a.sex === "Male" ? [1, 1] : [0.8, 0.9];
  const expF = { New: 0.6, Some: 1, Experienced: 1.6 }[lvl], ageF = age >= 65 ? 0.8 : age >= 50 ? 0.9 : 1;
  const time = parseInt(a.time, 10) || 45, short = time <= 30, long = time >= 60;          // H4 (2026-10-26): Cardio follows the chosen time
  const warm = short ? 5 : age >= 50 ? 10 : age >= 40 ? 8 : 5;
  const blockMin = short ? 15 : long ? 25 : 20;
  const pref = a.machine || "Bike";
  const kg = e => { if (!e.ratio) return 0; const sx = e.lower ? sexF[1] : sexF[0], raw = e.ratio * bwKg * expF * sx * ageF, st = e.eq === "db" ? 2 : 2.5; return Math.max(e.eq === "db" ? 2 : 5, Math.floor(raw / st) * st); };
  const slug = s => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").slice(0, 28);
  const phases = [0, 1, 2, 3].map(pi => {
    const unlocked = n => { const M = MACHINES[n]; if (!M) return false; if (M.run && (easy.has("Knees") || old)) return false; return pi >= M.p[lvl === "New" ? 0 : 1]; };
    const mach = unlocked(pref) ? pref : "Bike";
    const run = MACHINES[mach].run, newP1 = lvl === "New" && pi === 0;
    const block = (title, minutes, detail, extra = {}) => ({ name: title, sets: 1, reps: minutes, kg: 0, rest: 0, inc: 0, unit: "min", lib: MACHINES[mach].lib, note: detail, ...extra });
    const strength = (spec, pkey) => {
      const [mainS, ...groups] = spec.split("|"); const out = [];
      const parse = s => { const mm = s.trim().match(/^(.*?)\s(\d+)$/); return { name: mm[1], sets: +mm[2] }; };
      const swapEasy = n => {
        if (easy.has("Knees") && EX[n]?.knee) return "Leg press";
        if (easy.has("Back") && /Romanian deadlift/.test(n)) return "Cable pull-through";
        if (old && EX[n]?.floor) return EX[n].m === "core" ? (n === "Dead bug" ? "Seated knee lift" : n === "Side plank" ? "Incline plank" : "Pallof press") : "Machine chest press";
        return n;
      };
      const mx = parse(mainS); mx.name = swapEasy(mx.name); if (short) mx.sets = 2;
      if (long) groups.push(pkey === "1" ? (old ? "cable tower: Pallof press 2 + Face pull 2" : "cable tower: Pallof press 2 + Face pull 2") : "dumbbell rack: Dumbbell lateral raise 2 + Single-leg calf raise 2");
      const e0 = EX[mx.name] || {};
      out.push({ name: mx.name, sets: mx.sets, reps: Math.max(old || lvl === "New" ? 8 : 6, D.main[pi]), kg: kg(e0), rest: old ? 120 : 90, inc: e0.inc || 2, unit: "reps", ...(e0.lib ? { lib: e0.lib } : {}), ...(e0.note ? { note: e0.note } : {}), id: `c${pi + 1}${pkey}-${slug(mx.name)}` });
      for (const g of groups) {
        const mm = g.match(/^([^:]+):\s(.+)$/); let ex = (mm ? mm[2] : g).split(" + ").map(parse);
        // C-07: single-leg RDL + standing cable hip abduction rotate in (Some/Experienced phase 2, New phase 3) on the tempo/steady day
        if (pkey !== "1" && g === groups[0] && ((lvl !== "New" && pi === 1) || (lvl === "New" && pi === 2))) ex = [{ name: easy.has("Back") ? "Glute bridge" : "Single-leg Romanian deadlift", sets: 2 }, { name: "Standing cable hip abduction", sets: 2 }];
        ex.forEach((x, xi) => { x.name = swapEasy(x.name); const e = EX[x.name] || {};
          out.push({ name: x.name, sets: x.sets, reps: e.reps || 15, kg: e.nokg || e.bw ? 0 : kg(e), rest: xi < ex.length - 1 ? 0 : 60, inc: e.inc || 0, unit: e.unit || "reps", ss: "A" + (xi + 1),
            ...(e.bw ? { bw: true } : {}), ...(e.lib ? { lib: e.lib } : {}), note: [xi < ex.length - 1 ? "Go straight to A" + (xi + 2) + "." : "", e.note || ""].filter(Boolean).join(" ") || undefined, id: `c${pi + 1}${pkey}-${slug(x.name)}` }); });
      }
      return out;
    };
    const warmup = { ...block("Warm-up", warm, "Easy – full sentences."), id: `c${pi + 1}-warm` };
    const IV = short ? INTERVALS15 : long ? INTERVALS25 : INTERVALS, TP = short ? TEMPO15 : long ? TEMPO25 : TEMPO;
    const ivl = newP1 ? IV[0].replace("Hard", "Steady") + " (no Hard yet)" : IV[pi];
    const intervalsBlock = { ...block(mach + " – intervals", blockMin, "3 min Easy · " + ivl + " · Easy to finish. Hard = only a few words."), id: `c${pi + 1}-int` };
    const tempoBlock = { ...block(mach + " – tempo", blockMin, "2 min Easy · " + TP[pi] + " · Easy to finish. Steady = short sentences."), id: `c${pi + 1}-tempo` };
    const steadyMin = Math.max(15, time - warm - 5 - (lvl === "New" && pi === 0 ? 5 : 0));          // warm-up + steady + ~5 min core & mobility = chosen time
    const walkRun = run && lvl === "New" ? (pi === 1 ? "Walk–run: 10 × (1 min jog / 2 min walk), then Easy." : pi === 2 ? "Walk–run: 8 × (2 min jog / 1 min walk), then Easy." : "Easy continuous running if you've reached it, otherwise walk–run.") : "";
    const steadyBlock = { ...block(mach + " – steady", steadyMin, walkRun || "Steady – short sentences the whole way."), id: `c${pi + 1}-steady` };
    const cool = { ...block("Cool-down", 2, "Easy."), id: `c${pi + 1}-cool` }, coolL = short ? [] : [cool];
    const coreMob = CORE_MOB[pi].map((n, i) => { let nm = n; if (old && EX[n]?.floor) nm = n === "Dead bug" ? "Seated knee lift" : n === "Side plank" ? "Incline plank" : n === "Bird dog" ? "Pallof press" : n === "Glute-bridge march" ? "Standing cable hip abduction" : nm;
      const mob = /stretch|90\/90|rocks/i.test(nm); const e = EX[nm] || {};
      return { name: nm, sets: 1, reps: mob ? 60 : e.reps || (nm === "Glute-bridge march" ? 8 : 10), kg: 0, rest: 0, inc: 0, unit: mob ? "sec" : e.unit || "reps", lib: e.lib || nm, ...(i === 0 ? { note: "Core & mobility, about 5 min." } : {}), id: `c${pi + 1}-cm${i}` }; });
    const W = {};
    W["1"] = { name: "Strength + intervals", exercises: [warmup, ...strength(CARDIO_STR[pi][0], "1"), intervalsBlock, ...coolL].map(x => ({ ...x, id: x.id + "-1" })) };
    if (days === 2) W["2"] = { name: "Strength + steady", exercises: [warmup, ...strength(CARDIO_STR[pi][1], "2"), { ...block(mach + " – steady", blockMin, "Steady – short sentences."), id: `c${pi + 1}-st20` }, ...coolL].map(x => ({ ...x, id: x.id + "-2" })) };
    else {
      W["2"] = { name: "Steady endurance", exercises: [warmup, steadyBlock, ...coreMob].map(x => ({ ...x, id: x.id + "-2" })) };
      W["3"] = { name: "Strength + tempo", exercises: [warmup, ...strength(CARDIO_STR[pi][1], "3"), tempoBlock, ...coolL].map(x => ({ ...x, id: x.id + "-3" })) };
      if (days === 4) W["4"] = { name: "Long & easy", exercises: [{ ...block("Long & easy – any machine or outdoors", time - 5, "Easy – full sentences."), lib: "Incline treadmill walk", id: `c${pi + 1}-long-4` },
        ...CORE_MOB[(pi + 2) % 4].slice(2).concat(["Calf stretch", "Open-book upper-back rotation"]).map((n, i) => ({ name: n, sets: 1, reps: 60, kg: 0, rest: 0, inc: 0, unit: "sec", lib: n, ...(i === 0 ? { note: "Mobility, about 5 min." } : {}), id: `c${pi + 1}-lm${i}-4` }))] };
    }
    const counted = Object.values(W).reduce((t, w) => t + w.exercises.reduce((u, x) => u + (x.unit === "min" ? x.reps * x.sets + hardMinutes(x.note) : 0), 0), 0);
    const goalMin = lvl === "New" ? [120, 130, 140, 150][pi] : 150, nEasy = days === 2 || goalMin - counted > 60 ? 2 : 1;   // short workouts: two easy sessions rather than one very long one
    const easyMin = Math.min(60, Math.max(lvl === "New" ? [30, 35, 40, 45][pi] : 45, Math.ceil((goalMin - counted) / nEasy / 5) * 5));
    W.c = { name: nEasy === 2 ? "Planned easy session (do it twice this week)" : "Planned easy session", exercises: [{ name: "Easy cardio – walk, bike, swim…", sets: 1, reps: easyMin, kg: 0, rest: 0, inc: 0, unit: "min", lib: "Incline treadmill walk", note: "Your choice of activity. Easy – full sentences. Counts toward your 150 minutes.", id: `c${pi + 1}-extra` }] };
    return { name: PHASE_NAMES[pi], weeks: [pi * 3 + 1, pi * 3 + 2, pi * 3 + 3], about: CARDIO_ABOUT[pi] + (mach === pref ? "" : MACHINES[pref]?.run && (easy.has("Knees") || old) ? " (No running with knees on \"go easy\" or 65+ – bike instead.)" : ` (${pref} opens up in a later phase – ${mach} until then.)`), workouts: W };
  });
  return { title: `${a.goal} · ${a.shape} · ${days} days · ${a.time}`, start: today(), mig: 2, generated: true, direction: dir, machine: pref, phases };
}
const CARDIO_ABOUT = [
  "Find your level: talk test Easy (full sentences), Steady (short sentences), Hard (only a few words). Strength stays twice a week.",
  "Hard intervals start (New: walk–run if you chose running). New strength variations.",
  "Longer intervals; the rower opens for New. Keep strength reps controlled.",
  "Build capacity and strength: hardest intervals you've reached, main lifts at their heaviest range."
];
Object.assign(EX, { "Glute-bridge march": { m: "glutes", eq: "bw", nokg: true, floor: true, note: "Steps per leg." } });
function genSupported(a) { return a && (a.goal === "Strength" || a.goal === "Balance" || a.goal === "Cardio") && a.where === "Gym"; }
const _genStrengthBalance = generatePlan;
generatePlan = function (a) { return a.goal === "Cardio" ? generateCardio(a) : _genStrengthBalance(a); };

// ===== Home plans (home-versions.md M2–M5): swap each gym exercise for the best home version the ticked kit allows
const H = (name, needs = [], extra = {}) => ({ name, needs, ...extra });
const HOME = {};
const homeSet = (names, list) => names.forEach(n => HOME[n] = list);
homeSet(["Dumbbell bench press", "Machine chest press"], [H("Dumbbell bench press", ["Dumbbells", "Weight bench"]), H("Dumbbell floor press", ["Dumbbells"]), H("Band chest press", ["band+anchor"], { lib: "Band chest press and fly" }), H("Suspension push-up", ["susp"]), H("Push-up ladder", [], { bw: true })]);
homeSet(["Incline dumbbell press"], [H("Incline dumbbell press", ["Dumbbells", "Weight bench"]), H("Dumbbell floor press", ["Dumbbells"]), H("Suspension push-up", ["susp"]), H("Push-up ladder", [], { bw: true, note: "Feet raised on a chair when you can." }), H("Band chest press", ["band+anchor"], { lib: "Band chest press and fly" })]);
homeSet(["Cable fly (low-to-high)", "Cable fly (mid)", "Cable fly (high-to-low)", "Incline dumbbell fly"], [H("Dumbbell floor fly", ["Dumbbells"]), H("Band chest fly", ["band+anchor"], { lib: "Band chest press and fly" }), H("Suspension push-up", ["susp"]), H("Push-up ladder", [], { bw: true, note: "Slow, hands wide." })]);
homeSet(["Seated dumbbell shoulder press"], [H("Seated dumbbell shoulder press", ["Dumbbells"]), H("Band overhead press", ["Long resistance band"]), H("Pike push-up", [], { bw: true })]);
homeSet(["Dumbbell lateral raise", "Lean-away lateral raise", "Side-lying lateral raise", "Cable lateral raise"], [H("SAME", ["Dumbbells"]), H("Dumbbell lateral raise", ["Dumbbells"]), H("Lean-away lateral raise", ["Dumbbells"]), H("Band lateral raise", ["Long resistance band"]), H("Wall slide", [])]);
homeSet(["Lat pulldown", "Pull-up"], [H("Pull-up", ["Pull-up bar"], { bw: true, assist: true, note: "Use a band for help, or slow negatives." }), H("Band pulldown", ["band+anchor"]), H("Suspension row", ["susp"]), H("Table row", ["Heavy table (for rows)"]), H("Dumbbell pullover", ["Dumbbells"]), H("Prone towel pulldown", [])]);
homeSet(["Seated cable row", "Machine row", "Single-arm cable row", "One-arm dumbbell row", "Chest-supported dumbbell row"], [H("SAME", ["Dumbbells", "Weight bench"]), H("One-arm dumbbell row", ["Dumbbells"], { note: "Hand on a sturdy chair." }), H("Band row", ["band+anchor"]), H("Suspension row", ["susp"]), H("Table row", ["Heavy table (for rows)"]), H("Backpack row", [])]);
homeSet(["Dumbbell pullover"], [H("Dumbbell pullover", ["Dumbbells"]), H("Band pulldown", ["band+anchor"]), H("Prone towel pulldown", [])]);
homeSet(["Face pull", "Rear-delt dumbbell fly", "Cable rear-delt fly", "Incline Y-raise"], [H("SAME", ["Dumbbells", "Weight bench"]), H("Rear-delt dumbbell fly", ["Dumbbells"]), H("Band face pull", ["band+anchor"]), H("Prone Y-T-W raises", [])]);
homeSet(["Cable curl", "Face-away cable curl", "Preacher curl", "Incline dumbbell curl", "Spider curl", "Dumbbell hammer curl"], [H("SAME", ["Dumbbells", "Weight bench"]), H("Preacher curl", ["Dumbbells", "Weight bench"], { note: "Incline-bench version." }), H("Dumbbell hammer curl", ["Dumbbells"]), H("Band curl", ["Long resistance band"]), H("Backpack curl", [], { lib: "Backpack curl and RDL" }), H("Towel isometric curl", [])]);
homeSet(["Rope overhead triceps extension", "Rope pushdown", "Overhead dumbbell triceps extension", "Dumbbell skull crusher"], [H("Overhead dumbbell triceps extension", ["Dumbbells"]), H("Dumbbell skull crusher", ["Dumbbells"]), H("Band pushdown", ["band+anchor"]), H("Close-grip push-up", [], { bw: true }), H("Chair dip", ["Sturdy chair", "!Shoulders"])]);
homeSet(["Goblet squat", "Barbell back squat", "Leg press", "Single-leg leg press", "Sit-to-stand"], [H("Goblet squat", ["Dumbbells"]), H("Squat ladder", [], { note: "To a chair → full → pause → split squat, one step at a time." }), H("Sit-to-stand", ["Sturdy chair"])]);
homeSet(["Bulgarian split squat", "Reverse lunge"], [H("SAME", ["Dumbbells"]), H("Bulgarian split squat", ["Sturdy chair"], { lib: "Squat ladder", note: "Back foot on a chair, body weight." }), H("Squat ladder", [], { note: "Split squat step." })]);
homeSet(["Step-up"], [H("Step-up", ["Stairs or a sturdy step"]), H("Reverse lunge", [])]);
homeSet(["Romanian deadlift", "B-stance Romanian deadlift", "Single-leg Romanian deadlift"], [H("SAME", ["Dumbbells"]), H("Romanian deadlift", ["Dumbbells"]), H("Band good-morning", ["Long resistance band"]), H("Backpack Romanian deadlift", [], { lib: "Backpack curl and RDL" }), H("Single-leg RDL reach", [], { lib: "Single-leg Romanian deadlift reach" })]);
homeSet(["Barbell hip thrust", "Dumbbell hip thrust"], [H("Dumbbell hip thrust at home", ["Dumbbells"], { note: "Upper back on a sofa that can't slide, or on the floor." }), H("Band glute bridge", ["Long resistance band"]), H("Single-leg glute bridge", [])]);
homeSet(["Cable pull-through"], [H("Band good-morning", ["Long resistance band"]), H("Single-leg Romanian deadlift", ["Dumbbells"]), H("Glute bridge", [])]);
homeSet(["Hip abduction machine", "Standing cable hip abduction"], [H("Mini-band lateral walk", ["Mini band (loop)"], { lib: "Mini-band glute moves" }), H("Side-lying leg raise", [])]);
homeSet(["Hip adduction machine"], [H("Copenhagen side plank", [])]);
homeSet(["Lying hamstring curl", "Seated hamstring curl"], [H("Lying dumbbell hamstring curl", ["Dumbbells"]), H("Band leg curl", ["band+anchor"]), H("Sliding leg curl", ["Smooth floor (for sliding)"]), H("Stability-ball leg curl", ["Stability ball"]), H("Single-leg glute bridge", [])]);
homeSet(["Back extension"], [H("Prone superman", []), H("Reverse hyper on a bed", [])]);
homeSet(["Standing calf raise", "Seated calf raise", "Calf raise on the leg press", "Single-leg calf raise"], [H("Single-leg calf raise", ["Dumbbells"], { note: "On a stair, holding a dumbbell." }), H("Single-leg calf raise on a stair", [], { lib: "Single-leg dumbbell calf raise" })]);
homeSet(["Pallof press", "Half-kneeling Pallof press", "Tall-kneeling Pallof press", "Single-leg Pallof press"], [H("Band Pallof press", ["band+anchor"]), H("Suitcase hold", ["Dumbbells"]), H("Side plank", [])]);
homeSet(["Cable woodchop"], [H("Band Pallof press", ["band+anchor"]), H("Front plank", [])]);
homeSet(["Ab crunch machine"], [H("Stability-ball crunch", ["Stability ball"]), H("Reverse crunch", [])]);
homeSet(["Stability-ball crunch"], [H("SAME", ["Stability ball"]), H("Reverse crunch", [])]);                  // M5
homeSet(["Hanging knee raise"], [H("Hanging knee raise", ["Pull-up bar"]), H("Reverse crunch", []), H("Seated knee lift", [])]);
homeSet(["Suitcase carry", "Farmer carry", "Farmer march", "Overhead carry", "Suitcase hold", "Turkish get-up"], [H("SAME", ["Dumbbells"]), H("SAME", ["Kettlebell"]), H("Front plank", []), H("Hollow hold", [])]);
homeSet(["Incline push-up", "Deficit push-up", "Decline push-up", "Close-grip push-up"], [H("SAME", ["Sturdy chair"]), H("Push-up ladder", [], { bw: true })]);
const HOME_EXTRA = { "Dumbbell floor press": { m: "chest", eq: "db", ratio: .1, inc: 2 }, "Dumbbell floor fly": { m: "chest", eq: "db", ratio: .05, inc: 2 }, "Lying dumbbell hamstring curl": { m: "ham", eq: "db", ratio: .05, inc: 2, lower: true },
  "Dumbbell hip thrust at home": { m: "glutes", eq: "db", ratio: .25, inc: 2, lower: true } };
Object.assign(EX, HOME_EXTRA);
function homeify(P, a) {
  const kit = new Set(a.kit || []), easy = new Set(a.easy || []), anchor = a.anchor === true;
  const have = n => n === "band+anchor" ? kit.has("Long resistance band") && anchor : n === "susp" ? kit.has("Suspension trainer") && anchor : n.startsWith("!") ? !easy.has(n.slice(1)) : kit.has(n);
  const dbMax = a.dbMax || 10;
  const oldOrKnees = (obAge(a) || 30) >= 65 || easy.has("Knees");                       // H2/H3: no jumping or running
  const cardioKit = [["Exercise bike", "Bike"], ["Cross-trainer", "Cross-trainer"], ["Treadmill", "Incline treadmill walk"], ["Rower", "Rower"], ["Jump rope", "Jump rope"], ["Outdoors nearby (walk, run, cycle)", oldOrKnees ? "Outdoors walk or bike" : "Outdoors walk, jog or bike"]]
    .filter(([k, v]) => kit.has(k) && !(oldOrKnees && v === "Jump rope"));
  const homeMach = (pref => { const lib = { "Bike": "Exercise bike", "Rower": "Rower", "Cross-trainer": "Cross-trainer", "Incline treadmill walk": "Treadmill", "Running": "Treadmill" }[pref]; const own = cardioKit.find(([k]) => k === lib); return own ? own[1] : cardioKit.length ? cardioKit[0][1] : "Body-weight cardio circuit"; })(a.machine || "Bike");
  const m = obMetric(a), bwKg = Math.max(50, Math.min(100, m.kg || 75)), age = obAge(a) || 30;
  const sx = a.sex === "Female" ? [0.6, 0.8] : a.sex === "Male" ? [1, 1] : [0.8, 0.9], expF = { New: 0.6, Some: 1, Experienced: 1.6 }[a.level || "Some"], ageF = age >= 65 ? 0.8 : age >= 50 ? 0.9 : 1;
  const dbKg = e => e && e.ratio ? Math.min(dbMax, Math.max(1, Math.floor(e.ratio * bwKg * expF * (e.lower ? sx[1] : sx[0]) * ageF / 0.5) * 0.5)) : Math.min(dbMax, 2);
  P.phases.forEach((ph, pi) => {
    const used = new Set();
    Object.values(ph.workouts).forEach(w => { const inW = new Set(); w.exercises.forEach(x => {
      if (/ – (intervals|steady|tempo)$|^Warm-up$|^Cool-down$|^Long & easy/.test(x.name) || x.unit === "min") {           // cardio blocks
        if (/ – (intervals|steady|tempo)$/.test(x.name)) { x.name = x.name.replace(/^.* – /, homeMach + " – "); }
        if (/^Finisher/.test(x.name)) x.name = "Finisher: " + homeMach.toLowerCase();
        if (/^Bike( or brisk walk)?$/.test(x.name)) x.name = cardioKit.length ? homeMach : "Brisk walk or body-weight circuit";
        x.lib = homeMach === "Body-weight cardio circuit" ? "Body-weight cardio circuit" : /^Outdoors/.test(homeMach) ? "Walk–run" : homeMach === "Jump rope" ? "Jump rope" : homeMach;
        if (homeMach === "Body-weight cardio circuit" && /intervals/.test(x.name)) x.note = (x.note || "") + (oldOrKnees ? " Circuit stations rotate: step jack, march with high knees, standing knee-to-elbow, ball toss to the wall (step versions, no jumping, no squats)." : " Circuit stations rotate: step jack, air squat, mountain climber, ball toss to the wall, skater hop.");
        return;
      }
      x.name = x.name.replace(/on the pad/g, "on a folded towel");
      if (!kit.has("Dumbbells") && !kit.has("Kettlebell") && /^Single-leg stand .*(dumbbell|a weight)/.test(x.name))   // M5: no dumbbells → water bottle
        x.name = x.name.replace(/a light dumbbell|a dumbbell|a weight/, "a filled water bottle");
      if (x.note) x.note = x.note.replace(/ Superset at the [^.]+\./, "").replace("holding the rack", "holding a door frame or a sturdy chair").trim() || undefined;
      const opts = HOME[x.name]; if (!opts) { used.add(x.name); inW.add(x.name); return; }
      const sameOk = ["db", "bw"].includes(EX[x.name]?.eq);
      const cands = opts.filter(o => o.name !== "SAME" || sameOk).map(o => ({ ...o, name: o.name === "SAME" ? x.name : o.name })).filter(o => o.needs.every(have));
      const pick = cands.find(o => !used.has(o.name)) || cands.find(o => !inW.has(o.name));
      if (!pick) { x._drop = true; return; }
      used.add(pick.name); inW.add(pick.name);
      const e = EX[pick.name] || {}, isDb = pick.needs.includes("Dumbbells") || pick.needs.includes("Kettlebell");
      x.name = pick.name; x.lib = pick.lib || e.lib || pick.name;
      if (pick.note) x.note = [x.note, pick.note].filter(Boolean).join(" ");
      const oldUnit = x.unit; x.unit = e.unit || "reps"; if (x.unit !== oldUnit) x.reps = e.reps || (x.unit === "sec" ? 30 : 15);
      if (!isDb) { x.kg = 0; x.inc = pick.assist ? 0.25 : 0; if (pick.bw) x.bw = true; else delete x.bw; if (x.unit === "reps" && !/ladder/i.test(x.name) && !pick.assist) x.reps = Math.max(x.reps, 15); }
      else { x.kg = dbKg(e); x.inc = 0.5; delete x.bw; }
      if (pick.assist) {                                                                   // M4: home pull-up ladder
        const exp = a.level === "Experienced", st = exp ? 2 : [0, 1, 2, 2][pi];
        x.reps = [4, 6, 5][st]; x.inc = 0; x.kg = 0;
        x.note = ["Ladder step 1 – slow negatives: step up to the top, lower in 3–5 s. 3–5 reps.", "Ladder step 2 – band-assisted pull-ups, 5–8 reps.", "Ladder step 3 – full pull-ups, 3–8 reps. Top of the range easy → add reps or a slower lowering."][st];
      }
      x.id = x.id.replace(/-[^-]+$/, "") + "-" + pick.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").slice(0, 20);
    }); w.exercises = w.exercises.filter(x => !x._drop); });
  });
  P.title = P.title.replace(/$/, " · home");
  return P;
}
function genSupported(a) { return a && ["Strength", "Balance", "Cardio"].includes(a.goal); }
const _genGym = generatePlan;
generatePlan = function (a) { const P = _genGym(a); return a.where === "Home" ? homeify(P, a) : P; };

// ===== Plan test fixes (plan-test-report.md, approved by Christian 2026-10-26) – helpers + one final check on every plan
// weekly sets per muscle group (direct sets; the extra workout not counted) and the app's own targets (programme-rules B)
const GROUP_OF = { chest: "chest", back: "back", shoulders: "shoulders", rear: "shoulders", biceps: "arms", triceps: "arms", glutes: "glutes", thighs: "thighs", ham: "thighs", calves: "calves", core: "core" };
function weeklySets(exs) { const s = { chest: 0, back: 0, shoulders: 0, arms: 0, glutes: 0, thighs: 0, calves: 0, core: 0 }; for (const x of exs) { const g = GROUP_OF[EX[x.name]?.m]; if (g) s[g] += x.sets; } return s; }
const LEVEL_TABLE = { chest: ["B", "B", "F"], back: ["F", "F", "F"], shoulders: ["B", "F", "F"], arms: ["M", "B", "F"], glutes: ["F", "F", "B"], thighs: ["B", "B", "B"], calves: ["M", "M", "M"], core: ["F", "B", "B"] };
function targetLow(a, g, pi) {
  const R = { M: 0, B: 1, F: 2 }, up = { M: "B", B: "F", F: "F" }, low = { M: 4, B: 8, F: 12 };
  let t = LEVEL_TABLE[g][["Slim", "Toned", "Built"].indexOf(a.shape) < 0 ? 1 : ["Slim", "Toned", "Built"].indexOf(a.shape)];
  if (a.goal === "Strength" && ["chest", "back", "thighs"].includes(g) && R[t] < 1) t = "B";
  if ((a.focus || []).includes(g)) t = "F";
  else if (g === "arms" || g === "calves") { let s = "M"; for (let i = 0; i < pi; i++) s = up[s]; if (R[s] < R[t]) t = s; }   // small muscles step up per phase
  if ((g === "thighs" && (a.easy || []).includes("Knees")) || (g === "shoulders" && (a.easy || []).includes("Shoulders"))) t = (a.focus || []).includes(g) ? "B" : "M";   // go easy wins over focus
  return low[t];
}
// focus on an area the user also wants to go easy on (focus shoulders + go easy shoulders, focus thighs + go easy knees)
function focusClash(a, f) { const e = a.easy || []; return (f === "shoulders" && e.includes("Shoulders")) || (f === "thighs" && e.includes("Knees")); }
// time-fit from the real plan (programme-rules B): at 45 min in the gym, big muscles that end up short in most phases → recommend 60
function planTimeFit(a) {
  if (!a || a.goal !== "Strength" || a.where !== "Gym" || a.days < 3 || parseInt(a.time, 10) !== 45 || typeof generatePlan !== "function") return null;   // 2 days: the plan-short note covers it
  const P = generatePlan(a), short = {}, NAME = { chest: "chest", back: "upper back", shoulders: "side shoulders", glutes: "glutes", thighs: "thighs" };
  P.phases.forEach((ph, pi) => { const ws = weeklySets(Object.entries(ph.workouts).filter(([k]) => k !== "c").flatMap(([, w]) => w.exercises));
    for (const g of Object.keys(NAME)) if (ws[g] < targetLow(a, g, pi) - 1) short[g] = (short[g] || 0) + 1; });
  const names = Object.keys(short).filter(g => short[g] >= 2).map(g => NAME[g]);
  if (!names.length) return null;
  const list = names.length > 1 ? names.slice(0, -1).join(", ") + " and " + names.at(-1) : names[0];
  return `At 45 minutes, ${list} get a little less than they need. 60 minutes is recommended.`;
}
// M2: the plan can't reach a visible change (big muscles well under Build in most phases) → setup note
function planShort(a) {
  if (!a || a.goal !== "Strength" || typeof generatePlan !== "function" || !(a.days === 2 || (parseInt(a.time, 10) || 45) <= 30)) return false;
  const P = generatePlan(a); let shortPhases = 0;
  P.phases.forEach(ph => { const ws = weeklySets(Object.entries(ph.workouts).filter(([k]) => k !== "c").flatMap(([, w]) => w.exercises));
    if (["chest", "back", "glutes", "thighs"].filter(g => ws[g] < 6).length >= 2) shortPhases++; });
  return shortPhases >= 2;
}
// H1: warm-up aimed at the day's muscles – general part, mobility for the muscles trained, light sets of the first lift
function warmNote(w, a, C) {
  const first = w.groups[0]?.ex[0]?.name || "", ms = new Set(w.groups.flatMap(g => g.ex).map(x => EX[x.name]?.m));
  const focusMs = new Set((a.focus || []).flatMap(f => MUSCLE_OF_FOCUS[f]));
  const day = [EX[first]?.m, ...[...ms].filter(m => focusMs.has(m))].filter(Boolean);
  const moves = []; const add = t => { if (!moves.includes(t)) moves.push(t); };
  for (const m of day.concat([...ms])) {
    if (["chest", "triceps", "shoulders"].includes(m)) add("arm circles and band pull-aparts (or wall slides)");
    else if (["back", "biceps", "rear"].includes(m)) add("cat-cow and upper-back rotations");
    else if (["glutes", "ham"].includes(m)) add("hip circles and leg swings");
    else if (m === "thighs") add(C.easy.has("Knees") ? "leg swings and 10 sit-to-stands to a high chair" : "leg swings and 10 slow body-weight squats");
    if (moves.length >= 2) break;
  }
  const general = a.where === "Home" ? "2–3 min brisk walking or marching in place" : "2–3 min easy bike or walk";
  const e = EX[first] || {}, light = e.bw || e.nokg || !e.ratio ? `1 easy set of ${first.toLowerCase()}, a few reps` : `1–2 light sets of ${first.toLowerCase()}: about half your working weight × 8`;
  return `${general}, then ${moves.join(", then ") || "joint circles"}, then ${light}.`;
}
// H2: 50+ – one balance exercise in every workout, whatever the goal (progresses by phase)
function balanceOne(pi, C, a) {
  const L = ["Single-leg stand", "Single-leg stand with head turns", a.where === "Home" ? "Single-leg stand on a folded towel" : "Single-leg stand on the pad", "Single-leg stand, eyes closed (hand by the support)"];
  return { name: L[pi] + (C.old && pi < 3 ? " – support in reach" : ""), lib: "Single-leg stand", reps: 30, unit: "sec", sets: 2 };
}
function finalizePlan(P, a) {
  const easy = new Set(a.easy || []), age = obAge(a) || 30, old = age >= 65, home = a.where === "Home", kit = new Set(a.kit || []);
  const anchor = a.anchor === true, have = n => n === "band+anchor" ? kit.has("Long resistance band") && anchor : kit.has(n);
  const isCardioBlock = x => x.unit === "min" || /^Warm-up$|^Cool-down$|^Finisher/.test(x.name);
  const isBalanceItem = x => /stand|Tandem|Heel-to-toe|step and hold|star reach|Step switch|March|hop and stick|Skater|RDL reach|Toe stand|Calf-raise hold|Split-stance|knee drive|Skipping|Jump lunge|Pistol|Single-leg Pallof/.test(x.name) && !EX[x.name];
  // alternatives: [name, needs (home)] – first one not used this week (or at least not in this workout) wins
  const ALT = {
    kneesLegs: home ? [["Wall sit", []], ["Dumbbell hip thrust at home", ["Dumbbells"]], ["Band glute bridge", ["Long resistance band"]], ["Glute bridge", []], ["Single-leg glute bridge", []], ["Sliding leg curl", ["Smooth floor (for sliding)"]], ["Stability-ball leg curl", ["Stability ball"]]]
      : [["Leg press", []], ["Single-leg leg press", []], ["Wall sit", []], ["Dumbbell hip thrust", []], ["Seated hamstring curl", []], ["Cable pull-through", []]],
    back: home ? [["Band glute bridge", ["Long resistance band"]], ["Glute bridge", []], ["Single-leg glute bridge", []], ["Bird dog", []]] : [["Dumbbell hip thrust", []], ["Cable pull-through", []], ["Glute bridge", []], ["Bird dog", []]],
    pull: home ? [["Band pulldown", ["band+anchor"]], ["Table row", ["Heavy table (for rows)"]], ["One-arm dumbbell row", ["Dumbbells"]], ["Backpack row", []], ["Prone towel pulldown", []], ["Prone Y-T-W raises", []]] : [["Lat pulldown", []], ["Seated cable row", []], ["Machine row", []]],
    dup: home ? { core: [["Side plank", []], ["Reverse crunch", []], ["Seated knee lift", []], ["Bird dog", []], ["Front plank", []]], glutes: [["Glute bridge", []], ["Single-leg glute bridge", []], ["Side-lying leg raise", []]],
      thighs: [["Wall sit", []]], ham: [["Single-leg glute bridge", []]], chest: [["Push-up ladder", []]], back: [["Backpack row", []], ["Prone towel pulldown", []]] } : null,
    shoulders: home ? [["Dumbbell lateral raise", ["Dumbbells"]], ["Band lateral raise", ["Long resistance band"]], ["Wall slide", []], ["Prone Y-T-W raises", []], ["Push-up ladder", []]] : [["Incline dumbbell press", []], ["Machine chest press", []], ["Cable lateral raise", []], ["Dumbbell lateral raise", []], ["Lean-away lateral raise", []], ["Cable fly (mid)", []]],
    floor: { core: [["Pallof press", []], ["Seated knee lift", []], ["Incline plank", []], ["Ab crunch machine", []], ["Suitcase hold", []]], thighs: [["Hip adduction machine", []], ["Wall sit", []], ["Leg press", []]],
      glutes: [["Standing cable hip abduction", []], ["Hip abduction machine", []], ["Dumbbell hip thrust", []]], chest: [["Machine chest press", []], ["Incline push-up", []]], triceps: [["Rope pushdown", []]], back: [["Seated cable row", []]] }
  };
  const KNEE_BAD = /squat|lunge|^Step-up$|Jump|\bhops?\b|Skater|Skipping|Pistol|Bulgarian|Running|Jump rope/i;
  P.phases.forEach((ph, pi) => {
    const usedWeek = new Set(Object.values(ph.workouts).flatMap(w => w.exercises.map(x => x.name)));
    const ladderCount = {};
    Object.entries(ph.workouts).forEach(([key, w]) => {
      const inW = () => new Set(w.exercises.map(x => x.name));
      const pickAlt = list => { const ok = list.filter(([n, needs]) => !home || needs.every(have)).map(([n]) => n); const iw = inW(); return ok.find(n => !usedWeek.has(n) && !iw.has(n)) || ok.find(n => !iw.has(n)); };
      const swapTo = (x, n, note) => { if (!n) return false; const e = EX[n] || {}; x.name = n; x.lib = e.lib || n; usedWeek.add(n);
        x.unit = e.unit || "reps"; x.reps = e.reps || (x.unit === "sec" ? 30 : 12); if (e.bw || e.nokg) { x.kg = 0; if (e.bw) x.bw = true; } else delete x.bw;
        x.inc = e.inc || 0; x.kg = 0; x.note = [e.note, note].filter(Boolean).join(" ") || undefined; return true; };
      for (const x of w.exercises) {
        if (isCardioBlock(x)) continue;
        const n = x.name, m = EX[n]?.m;
        // H3 knees (after the home swap and in Balance), L9 deep squat hold
        if (easy.has("Knees")) {
          if (n === "Deep squat hold") swapTo(x, "Ankle rocks", "Holding on: knee gently over the toes, heel down. Seconds per side.");
          else if (isBalanceItem(x) && KNEE_BAD.test(n)) { x.name = "Lateral step and hold" + (old ? " – support in reach" : ""); x.lib = "Lateral step and hold"; x.unit = "reps"; x.reps = 5; }
          else if (/^Step-up and hold/.test(n)) { x.name = n.replace("Step-up and hold", "Lateral step and hold"); x.lib = "Lateral step and hold"; }
          else if (KNEE_BAD.test(n) && n !== "Wall sit") swapTo(x, pickAlt(ALT.kneesLegs));
        }
        // H3 back: no good-mornings or loaded hinges
        if (easy.has("Back") && /good-morning|Romanian deadlift/i.test(x.name)) swapTo(x, pickAlt(ALT.back));
        if (easy.has("Shoulders") && x.name === "Pull-up") swapTo(x, pickAlt(ALT.pull));
        // L8 shoulders: no overhead pressing or dips
        if (easy.has("Shoulders") && /shoulder press|overhead press|Pike push-up|Overhead carry|Chair dip|\bdips?\b/i.test(x.name)) swapTo(x, pickAlt(ALT.shoulders), /lateral raise/i.test(pickAlt(ALT.shoulders) || "") ? "Light – stop if it pinches." : undefined);
        // H3 wrists: note on every push-up
        if (easy.has("Wrists") && /push-up/i.test(x.name) && !/handles or fists/.test(x.note || "")) x.note = [x.note, "Push-ups on handles or fists, wrists straight."].filter(Boolean).join(" ");
        // H2 65+: no jumps anywhere; no floor exercises in the gym
        if (old && /Jump|\bhops?\b|Skater|Skipping|Pistol/i.test(x.name)) { x.name = "Lateral step and hold – support in reach"; x.lib = "Lateral step and hold"; x.unit = "reps"; x.reps = 5; }
        if (old && !home && EX[x.name]?.floor) swapTo(x, pickAlt(ALT.floor[EX[x.name].m] || ALT.floor.core));
      }
      // H2: 50+ balance exercise in Cardio workouts too (Strength gets it in the builder, Balance has its block)
      if (a.goal === "Cardio" && age >= 50 && key !== "c" && !w.exercises.some(isBalanceItem)) {
        const b = balanceOne(pi, { old }, a), i = w.exercises.findIndex(x => x.name === "Warm-up") + 1;
        w.exercises.splice(i, 0, { ...b, kg: 0, rest: 0, inc: 0, note: "Per leg, next to a support. Feather = steady, kettlebell = wobbly or touched down.", id: `f${pi + 1}${key}-balance` });
      }
      // L2 / same exercise twice in one workout: replace the second one, or drop it
      const seen = new Set();
      w.exercises = w.exercises.filter(x => { if (isCardioBlock(x) || !seen.has(x.name)) { seen.add(x.name); return true; }
        const D = ALT.dup || ALT.floor, alt = pickAlt((D[EX[x.name]?.m] || []).concat(D.core)); if (alt && !seen.has(alt)) { swapTo(x, alt); seen.add(alt); return true; } return false; });
      // H1 (Christian 2026-10-26): warm up the muscles of the first lift with light sets of that lift – shown like a normal exercise
      if (a.goal !== "Cardio" && key !== "c" && w.exercises.some(x => x.name === "Warm-up")) {
        const i = w.exercises.findIndex(x => !isCardioBlock(x) && !isBalanceItem(x) && EX[x.name] && !/hold$|Ankle rocks|stretch|90\/90|rotation/.test(x.name) && w.exercises.indexOf(x) > 0);
        const x = w.exercises[i];
        if (x && !w.exercises.some(y => /^Warm-up sets/.test(y.name))) {
          const e = EX[x.name] || {}, step = e.eq === "db" ? 2 : 2.5, half = Math.max(e.eq === "db" ? 2 : 5, Math.floor((x.kg || 0) / 2 / step) * step);
          const bw = e.bw || e.nokg || x.bw || !x.kg, light = bw || half >= x.kg;              // already at the lightest weight → one easy set
          w.exercises.splice(i, 0, { name: "Warm-up sets: " + x.name, sets: light ? 1 : 2, reps: light ? 6 : 8, kg: bw ? 0 : light ? x.kg : half, rest: 30, inc: x.inc || 0, unit: "reps",
            lib: x.lib || e.lib || x.name, ...(x.bw ? { bw: true } : {}), warmup: true,
            note: (light ? "One easy set, a few slow reps." : "Light – about half your working weight. Not work sets: easy, smooth reps.") + (easy.has("Wrists") && /push-up/i.test(x.name) ? " Push-ups on handles or fists, wrists straight." : ""), id: x.id + "-warm" });
        }
      }
      // L4: starting weight for loaded exercises that ended up at 0 kg; body weight at home
      for (const x of w.exercises) {
        const e = EX[x.name]; if (!e || isCardioBlock(x) || x.kg || e.nokg || e.bw || x.bw) continue;
        if (e.ratio && !(home && !(kit.has("Dumbbells") || kit.has("Kettlebell")) && e.eq === "db") && !(home && e.eq !== "db")) x.kg = startKg(a, e);
        else if (home && e.unit !== "sec") x.bw = true;
      }
      // L2 home ladders on several days: a different step each time
      if (home && key !== "c") for (const x of w.exercises) if (/ladder$/i.test(x.name) && !/Pull-up/.test(x.name)) {
        const c = ladderCount[x.name] = (ladderCount[x.name] || 0) + 1;
        if (c === 2) x.note = [x.note, "Second time this week: one step easier than your current step, more reps."].filter(Boolean).join(" ");
        if (c >= 3) x.note = [x.note, "Third time this week: your current step with a slow 3-second lowering."].filter(Boolean).join(" ");
      }
      // L1: renumber supersets after all swaps and drops; a "superset" of one becomes a normal exercise
      const runs = []; for (const x of w.exercises) { const L = x.ss ? x.ss[0] : null; const r = runs[runs.length - 1]; if (L && r && r.L === L) r.xs.push(x); else runs.push({ L, xs: [x] }); }
      let letter = 0;
      for (const r of runs) {
        if (!r.L) continue;
        const strip = x => { if (x.note) x.note = x.note.replace(/ ?Go straight to [A-Z]\d\.?/g, "").trim() || undefined; };
        if (r.xs.length === 1) { const x = r.xs[0]; delete x.ss; strip(x); if (!x.rest) x.rest = 60; continue; }
        const L = String.fromCharCode(65 + letter++);
        r.xs.forEach((x, i) => { strip(x); x.ss = L + (i + 1); const last = i === r.xs.length - 1;
          if (!last) { x.rest = 0; x.note = ["Go straight to " + L + (i + 2) + ".", x.note].filter(Boolean).join(" "); } else if (!x.rest) x.rest = 60; });
      }
    });
  });
  return P;
}
function startKg(a, e) {
  const age = obAge(a) || 30, m = obMetric(a), bwKg = Math.max(50, Math.min(100, m.kg || 75));
  const sx = a.sex === "Female" ? [0.6, 0.8] : a.sex === "Male" ? [1, 1] : [0.8, 0.9], expF = { New: 0.6, Some: 1, Experienced: 1.6 }[a.level || "Some"], ageF = age >= 65 ? 0.8 : age >= 50 ? 0.9 : 1;
  const raw = e.ratio * bwKg * expF * (e.lower ? sx[1] : sx[0]) * ageF, step = e.eq === "db" ? 2 : 2.5;
  let kg = Math.max(e.eq === "db" ? 2 : 5, Math.floor(raw / step) * step);
  if (a.where === "Home" && e.eq === "db") kg = Math.min(a.dbMax || 10, kg);
  return kg;
}
const _genBeforeFinal = generatePlan;
generatePlan = function (a) { return finalizePlan(_genBeforeFinal(a), a); };

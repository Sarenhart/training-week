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

function genSupported(a) { return a && a.goal === "Strength" && a.where === "Gym"; }
function generatePlan(a) {
  const days = a.days || 3, dir = directionOf(a) || "Build muscle", D = DOSE[dir], lvl = a.level || "Some";
  const age = obAge(a) || 30, old = age >= 65, easy = new Set(a.easy || []);
  const time = parseInt(a.time, 10) || 45;
  const m = obMetric(a), bwKg = Math.max(50, Math.min(100, m.kg || 75));
  const sexF = a.sex === "Female" ? [0.6, 0.8] : a.sex === "Male" ? [1, 1] : [0.8, 0.9];
  const expF = { New: 0.6, Some: 1, Experienced: 1.4 }[lvl], ageF = age >= 65 ? 0.8 : age >= 50 ? 0.9 : 1;
  const minReps = old ? 8 : lvl === "New" ? 8 : age >= 50 ? 6 : age >= 40 ? 5 : 6;
  const tpl = STRENGTH[days] || STRENGTH[3];
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
      // phase 4: every exercise must be loadable (priority-exercises.md)
      if (pi === 3 && EX[x.name] && (EX[x.name].nokg) && EX[x.name].m === "core") swap(x, ["Ab crunch machine", "Pallof press", "Suitcase hold", "Hanging knee raise"]);
    }
    // thighs at least Build for Strength (programme-rules B) – the 3-day template was written for "go easy on knees"
    if (days === 3 && !easy.has("Knees")) {
      const fb = plan[2]; const add = [pi % 2 === 0 ? "Goblet squat" : "Bulgarian split squat"].filter(n => !used.has(n));
      if (add.length && !(lvl === "New" && add[0] === "Bulgarian split squat" && pi < 3)) { fb.groups.splice(1, 0, { spot: "", ex: [{ name: add[0], sets: 3 }] }); used.add(add[0]); }
    }
    // focus areas: raise weekly sets for each focus muscle towards 12 (Focus level)
    const main = plan.filter(w => w.name !== "Extra");
    const setsOf = ms => main.flatMap(w => w.groups.flatMap(g => g.ex)).filter(x => ms.includes(EX[x.name]?.m)).reduce((s, x) => s + x.sets, 0);
    for (const f of a.focus || []) {
      const ms = MUSCLE_OF_FOCUS[f]; let guard = 0;
      while (setsOf(ms) < 12 && guard++ < 12) {
        const xs = main.flatMap(w => w.groups.flatMap(g => g.ex)).filter(x => ms.includes(EX[x.name]?.m) && x.sets < 4);
        if (xs.length) { xs.sort((p, q) => p.sets - q.sets)[0].sets++; continue; }
        const cand = FOCUS_ADD[f].find(n => !used.has(n) && !(old && EX[n]?.floor) && !(easy.has("Knees") && EX[n]?.knee));
        if (!cand) break;
        const target = main.reduce((b, w) => (w.groups.reduce((s, g) => s + g.ex.reduce((t, x) => t + x.sets, 0), 0) < b.n ? { w, n: w.groups.reduce((s, g) => s + g.ex.reduce((t, x) => t + x.sets, 0), 0) } : b), { w: main[0], n: 1e9 }).w;
        target.groups.push({ spot: "", ex: [{ name: cand, sets: 3 }] }); used.add(cand);
      }
    }
    // time: 30 min keeps the main lift + two groups (max 3 sets); 60 min adds a set to focus exercises
    const focusMs = (a.focus || []).flatMap(f => MUSCLE_OF_FOCUS[f]);
    if (time <= 30) main.forEach(w => { w.groups = w.groups.slice(0, 3); w.groups.forEach(g => g.ex.forEach(x => x.sets = Math.min(x.sets, 3))); });
    if (time >= 60) main.forEach(w => w.groups.slice(1).forEach(g => g.ex.forEach(x => { if (focusMs.includes(EX[x.name]?.m) && x.sets < 4) x.sets++; })));
    // keep each workout inside its time: ~14 sets at 30 min, ~22 at 45, ~28 at 60 (supersets). Trim the least important first.
    const cap = time <= 30 ? 14 : time >= 60 ? 28 : 22;
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
    // build the app's workout format
    const workouts = {};
    plan.forEach((w, wi) => {
      const key = w.name === "Extra" ? "c" : String(wi + 1);
      const exs = []; let letter = 0;
      w.groups.forEach((g, gi) => {
        const ss = g.ex.length > 1 ? String.fromCharCode(65 + letter++) : null;
        g.ex.forEach((x, xi) => {
          const e = EX[x.name] || { m: "", eq: "db", ratio: .05, inc: 2 }, isMain = key !== "c" && gi === 0;
          const reps = e.reps || (isMain ? Math.max(minReps, D.main[pi]) : D.acc);
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
          exs.push({ name: x.name, sets: x.sets, reps, kg, rest: ss && !last ? 0 : isMain ? D.rest : 60, inc: e.inc || 0, unit: e.unit || "reps",
            ...(e.bw ? { bw: true } : {}), ...(ss ? { ss: ss + (xi + 1) } : {}), ...(e.lib ? { lib: e.lib } : {}), ...(notes.length ? { note: notes.join(" ") } : {}),
            id: `g${pi + 1}${key}-${x.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").slice(0, 28)}` });
        });
      });
      if (key !== "c" && D.fin) exs.push({ name: "Finisher: bike or rower", sets: 1, reps: D.fin, kg: 0, rest: 0, inc: 0, unit: "min", note: "Hard but steady – you can only say a few words.", lib: "Bike", id: `g${pi + 1}${key}-finisher` });
      if (key === "c" && pi === 0) exs.forEach(x => { x.reps = 35; x.note = "Easy pace, you can still talk."; });
      workouts[key] = { name: key === "c" ? (pi === 0 ? "Walk or bike (optional)" : "Arms & rear shoulders (optional)") : w.name, exercises: exs };
    });
    return { name: PHASE_NAMES[pi], weeks: [pi * 3 + 1, pi * 3 + 2, pi * 3 + 3], about: PHASE_ABOUT[pi], workouts };
  });
  const title = `${a.goal} · ${a.shape} · ${days} days · ${a.time}`;
  return { title, start: today(), mig: 2, generated: true, direction: dir, phases };
}

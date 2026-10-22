// ---- Pistol squat ladder (H9f): standing on the right leg (near side), left leg reaches forward.
// Levels 1–3 sit lightly to a box behind (50 / 40 / 30 cm); 4 = full depth holding the rack; 5 = full pistol, free.
const BOXH = { 1: 50, 2: 40, 3: 30 };
function pistol(u, lvl) {
  const J = {}, box = BOXH[lvl], full = !box, hold = lvl <= 2 || lvl === 4, goblet = lvl === 6;
  const bot = full ? [-14, 24, 0] : [-22, box + 7, 0];
  const t = sm(u), pelvis = V.lerp([0, 86, 0], bot, t);
  const lean = lerpN(3, full ? 42 : 30, t);
  trunk(J, pelvis, sag(lean), [0, 0, 1], sag(lean - 30));
  // standing leg: heel down, knee forward over the toes
  leg(J, "R", [8, 1, 10], [1, 0, 0.15], [12, 0, 1]);
  // free leg: hovers just in front at the top, reaches straight forward at the bottom
  const fwd = V.norm(V.lerp([0.35, -1, 0], [1, full ? 0.08 : -0.12, 0], t));
  leg(J, "L", V.add(J.hipL, V.mul(fwd, 84)), [0.2, 1, 0], V.lerp([10, -3, 0], [3, 10, 0], t));
  const items = [...floor3(-70, 120, 46)];
  if (box) items.push(box3(-52, -12, box, 18), { type: "poly", pts: [[-12, 0, -18], [-12, box, -18], [-12, box, 18], [-12, 0, 18]], cls: "an3bench", z: -998 });
  if (goblet) {                                                            // dumbbell held upright at the chest, both hands
    const g = V.add(J.chest, V.add(V.mul(sag(lean + 90), 12), V.mul(sag(lean), -10)));
    for (const [sd, zz] of SIDES) arm(J, sd, V.add(g, [0, 4, 5 * zz]), [-0.2, -1, 0.6 * zz]);
    items.push(...db3(g, V.norm(sag(lean)), 9));
    return { items: [...items, ...body(J)], J };
  }
  if (hold) {
    items.push(L3([16, 0, -42], [16, 190, -42], "an3col"));
    arm(J, "L", [16, J.chest[1] - 30, -38], [-0.2, -1, -0.4]);
  } else arm(J, "L", V.add(J.shoL, V.mul(V.norm(V.lerp([0.1, -1, -0.1], [1, 0.05, 0.12], t)), 58)), [-0.3, -1, -0.3]);
  arm(J, "R", V.add(J.shoR, V.mul(V.norm(V.lerp([0.1, -1, 0.1], [1, 0.05, -0.12], t)), 58)), [-0.3, -1, 0.3]);
  return { items: [...items, ...body(J)], J };
}
const PCAM = camera(-30, 10, 108, 208, 0.84);
const SAMPLES = {};
const CAPS = {
  1: ["High box (~50 cm), hand on the rack", "Sit back lightly, stand up on one leg"],
  2: ["Lower box (~40 cm), hand on the rack", "Sit back lightly, stand up on one leg"],
  3: ["Low box (~30 cm), hands free", "Arms forward, touch the box, stand up"],
  4: ["Full depth, hand on the rack", "All the way down, stand up on one leg"],
  5: ["Full pistol, hands free", "All the way down, free leg off the floor"],
  6: ["Weighted pistol – dumbbell at the chest", "All the way down, stand up on one leg"]
};
for (const l of [1, 2, 3, 4, 5, 6]) SAMPLES["p" + l] = { cap: CAPS[l], cam: PCAM, dur: 3400, frame: u => pistol(u, l),
  cues: [{ when: "all", pt: J => J.ankR, text: "Heel stays down" }, { when: "B", pt: J => J.ankL, text: "Free leg forward" }] };

const CARDS = [
  { title: "Pistol squat ladder", fam: "Balance · dynamic · Some phase 4 (steps 1–3), Experienced phase 3", keys: [["1 · High box", "p1"], ["2 · Lower box", "p2"], ["3 · Low box", "p3"], ["4 · Assisted", "p4"], ["5 · Pistol", "p5"], ["6 · Weighted", "p6"]] }
];

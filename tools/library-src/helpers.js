// ---- Wave 2a samples: lower body and hip machines. Same rig and helpers as the app and Waves 1/3.
const sm = t => t * t * (3 - 2 * t);
const seg = (u, a, b) => sm(clamp01((u - a) / (b - a)));
const TAU = Math.PI * 2;
const body = J => body3(J, "R");
function armTarget(J, sd, zz, mode) {
  const s = J["sho" + sd];
  if (mode === "cross") return [V.add(J.chest, [9, -7, -7 * zz]), [0.2, -1, 0.8 * zz]];
  if (mode === "db") return [V.add(s, [2, -60, 4 * zz]), [-1, 0, 0.1 * zz]];
  return [V.add(s, [3, -58, 8 * zz]), [-1, -0.1, 0.2 * zz]];
}
const arms = (J, mode) => { for (const [sd, zz] of SIDES) { const t = armTarget(J, sd, zz, mode); arm(J, sd, t[0], t[1]); } };
const dbs = J => [...db3(J.wriL, [1, 0, 0]), ...db3(J.wriR, [1, 0, 0])];
function floorArm(J, sd, dx, dz) {
  const s = J["sho" + sd], h = [s[0] + dx, 3, s[2] + dz], e = V.lerp(s, h, 32 / 62);
  J["elb" + sd] = e; J["wri" + sd] = h;
}
function stack(x, z, lift) {
  const y0 = 2 + Math.max(0, lift);
  return { top: [x, y0 + 26, z], items: [L3([x - 9, 0, z], [x - 9, 120, z], "an3eq"), L3([x + 9, 0, z], [x + 9, 120, z], "an3eq"),
    { type: "poly", pts: [[x - 7, y0, z], [x + 7, y0, z], [x + 7, y0 + 26, z], [x - 7, y0 + 26, z]], cls: "an3plate" }] };
}
const SLED = [Math.cos(rad(40)), Math.sin(rad(40)), 0], SPERP = [-Math.sin(rad(40)), Math.cos(rad(40)), 0];
function pressSeat(J) {
  const lean = -50, d = sag(lean);
  trunk(J, [0, 40, 0], d, [0, 0, 1], sag(-20));
  for (const [sd, zz] of SIDES) arm(J, sd, [8, 38, 26 * zz], [0, -1, 0.4 * zz]);
  const nb = sag(lean - 90), p1 = V.add(J.pelvis, V.mul(nb, 7)), p2 = V.add(V.add(J.pelvis, V.mul(d, 60)), V.mul(nb, 7));
  return [...floor3(-70, 120, 44), box3(-22, 18, 34, 16), ...benchLegs([-14, 10], 34),
    { type: "poly", pts: [[p1[0], p1[1], -14], [p2[0], p2[1], -14], [p2[0], p2[1], 14], [p1[0], p1[1], 14]], cls: "an3bench", z: -998 },
    L3([18, 6, 0], [104, 78, 0], "an3eq"), L3([104, 0, 0], [104, 78, 0], "an3eq")];
}
function sledPlate(c) {
  const a = V.sub(c, V.mul(SPERP, 8)), b = V.add(c, V.mul(SPERP, 26));
  return { type: "poly", pts: [[a[0], a[1], -26], [b[0], b[1], -26], [b[0], b[1], 26], [a[0], a[1], 26]], cls: "an3bench", z: -997 };
}
const BENCH = (x0, x1, y = 40, w = 14) => [box3(x0, x1, y, w), ...benchLegs([x0 + 6, x1 - 6], y)];

// ---- squat patterns

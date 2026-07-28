// Belief-state / blindspot geometry engine (pitch coords in meters, 105 x 68)
export const PITCH_W = 105;
export const PITCH_H = 68;

const GEOMETRIC_FOV = 190; // physically possible peripheral span
const MAX_SIGHT = 45; // meters

export function normAngle(deg) {
  let a = ((deg + 180) % 360 + 360) % 360 - 180;
  return a;
}

export function relativeAngle(observer, target) {
  const dx = target.x - observer.x;
  const dy = target.y - observer.y;
  const bearing = (Math.atan2(dy, dx) * 180) / Math.PI;
  return normAngle(bearing - observer.facing);
}

export function distance(a, b) {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

// Effective FOV shrinks as the head goes down (scan_quality 0..1)
export function effectiveFov(scanQuality) {
  const q = Math.min(1, Math.max(0, scanQuality ?? 0.5));
  return 30 + q * 160;
}

export function severityOf(dist, angle) {
  const closeness = Math.max(0, 1 - dist / MAX_SIGHT);
  const behindness = Math.min(1, Math.abs(angle) / 180);
  return Math.round(Math.min(1, 0.35 * closeness + 0.65 * (closeness * 0.6 + behindness * 0.7)) * 100) / 100;
}

export function feedbackFor(observer, target, angle, dist) {
  const abs = Math.abs(angle);
  if (abs > 110) {
    return `Player ${observer.number}: Check your shoulder — Player ${target.number} is running in behind you (${dist.toFixed(1)}m).`;
  }
  if (abs > 60) {
    return `Player ${observer.number}: Widen your scan — Player ${target.number} is sitting in your peripheral vision.`;
  }
  return `Player ${observer.number}: Head up — Player ${target.number} is open in front of you (${dist.toFixed(1)}m).`;
}

// Returns per-player belief states + the blindspots they are missing
export function computeBeliefStates(players, ball) {
  return players.map((observer) => {
    const geometric = [];
    const perceived = [];
    const blindspots = [];
    const fov = effectiveFov(observer.scan_quality);

    players.forEach((target) => {
      if (target.id === observer.id) return;
      const dist = distance(observer, target);
      if (dist > MAX_SIGHT) return;
      const angle = relativeAngle(observer, target);
      const inGeometric = Math.abs(angle) <= GEOMETRIC_FOV / 2;
      const inPerceived = Math.abs(angle) <= fov / 2;
      if (!inGeometric) return;
      geometric.push(target.id);
      if (inPerceived) {
        perceived.push(target.id);
      } else {
        blindspots.push({
          observerId: observer.id,
          targetId: target.id,
          angle,
          distance: dist,
          severity: severityOf(dist, angle),
          feedback: feedbackFor(observer, target, angle, dist),
        });
      }
    });

    const ballAngle = ball ? relativeAngle(observer, ball) : null;
    const ballVisible = ball
      ? distance(observer, ball) <= MAX_SIGHT && Math.abs(ballAngle) <= fov / 2
      : false;

    return { observer, fov, geometric, perceived, blindspots, ballVisible };
  });
}

export function allBlindspots(beliefStates) {
  return beliefStates
    .flatMap((b) => b.blindspots)
    .sort((a, b) => b.severity - a.severity);
}

export function defaultFormation() {
  const home = [
    [8, 34, 0, 0.8, 1],
    [22, 14, 10, 0.6, 2],
    [20, 27, 5, 0.35, 3],
    [20, 41, -5, 0.5, 4],
    [22, 54, -10, 0.6, 5],
    [44, 20, 0, 0.7, 6],
    [42, 34, 15, 0.3, 8],
    [44, 48, -15, 0.65, 7],
    [66, 16, 5, 0.8, 11],
    [70, 34, 0, 0.45, 9],
    [66, 52, -5, 0.75, 10],
  ];
  const away = [
    [97, 34, 180, 0.8, 1],
    [80, 52, 170, 0.5, 2],
    [82, 41, 175, 0.4, 3],
    [82, 27, -175, 0.55, 4],
    [80, 16, -170, 0.6, 5],
    [62, 48, 175, 0.45, 6],
    [60, 34, 190, 0.3, 8],
    [62, 20, -175, 0.6, 7],
    [40, 52, 170, 0.7, 11],
    [36, 34, 180, 0.5, 9],
    [40, 16, -170, 0.65, 10],
  ];
  const build = (rows, team) =>
    rows.map(([x, y, facing, scan_quality, number], i) => ({
      id: `${team}-${i}`,
      team,
      number,
      x,
      y,
      facing,
      scan_quality,
    }));
  return [...build(home, "home"), ...build(away, "away")];
}
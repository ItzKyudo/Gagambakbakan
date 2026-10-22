export interface AttackPose {
  /** Anticipation / coil weight (0 -> 1 during windup, then blends to 0 as strike launches) */
  wind: number;
  /** Active strike / extension weight (0 -> ~1.1 at impact peak, then eases to 0 in recovery) */
  strike: number;
  /** Mid-swing parabolic lift (0 -> 1 -> 0 during the whip from windup to strike) */
  arc: number;
  /** Normalized progress (0 -> 1) across the active slash window */
  swing: number;
  /** Post-impact follow-through / recoil settle (0 -> 1 -> 0 during recovery) */
  follow: number;
  /** Telegraph glint intensity near the end of windup (0 -> 1 -> 0) */
  glint: number;
}

export interface SkillBurst {
  active: boolean;
  progress: number;
  pulse: number;
}

export function smoothMotion(value: number): number {
  const p = Math.max(0, Math.min(1, value));
  return p * p * (3 - 2 * p);
}

export function skillBurst(elapsed: number, duration = .4): SkillBurst {
  if (elapsed <= 0 || elapsed >= duration || duration <= 0) {
    return { active: false, progress: 0, pulse: 0 };
  }
  const progress = Math.max(0, Math.min(1, elapsed / duration));
  const pulse = Math.sin(progress * Math.PI);
  return { active: true, progress, pulse };
}

export function attackMotion(time: number): number {
  if (time <= 0 || time >= .46) return 0;
  if (time < .16) return -smoothMotion(time / .16);
  if (time < .26) return -1 + 2 * smoothMotion((time - .16) / .1);
  return 1 - smoothMotion((time - .26) / .2);
}

export function attackPose(time: number): AttackPose {
  if (time <= 0 || time >= .46) {
    return { wind: 0, strike: 0, arc: 0, swing: 0, follow: 0, glint: 0 };
  }

  const glint = time > .05 && time < .16
    ? Math.sin(((time - .05) / .11) * Math.PI)
    : 0;

  const swing = time > .13 && time < .35
    ? Math.max(0, Math.min(1, (time - .13) / .22))
    : 0;

  if (time < .15) {
    const p = time / .15;
    const wind = smoothMotion(p);
    return { wind, strike: 0, arc: 0, swing, follow: 0, glint };
  }

  if (time < .25) {
    const u = Math.max(0, Math.min(1, (time - .15) / .1));
    const snap = 1 - Math.pow(1 - u, 3);
    const overshoot = Math.sin(u * Math.PI) * .1;
    const wind = 1 - snap;
    const strike = snap + overshoot;
    const arc = Math.sin(u * Math.PI);
    return { wind, strike, arc, swing, follow: 0, glint };
  }

  const r = Math.max(0, Math.min(1, (time - .25) / .21));
  const easeOut = smoothMotion(r);
  const strike = 1 - easeOut;
  const follow = Math.sin(r * Math.PI);
  return { wind: 0, strike, arc: 0, swing, follow, glint: 0 };
}

export function gaitMotion(phase: number): { reach: number; lift: number } {
  const cycle = ((phase % 1) + 1) % 1;
  if (cycle < .58) return { reach: 1 - 2 * cycle / .58, lift: 0 };
  const swing = (cycle - .58) / .42;
  return { reach: -1 + 2 * smoothMotion(swing), lift: Math.sin(swing * Math.PI) };
}

export const LEARN_DEMO_PHASES = [
  { id: 'move', duration: 2.4 },
  { id: 'strike', duration: 1.5 },
  { id: 'block', duration: 1.5 },
  { id: 'climb', duration: 4 }
] as const;

export function learnDemoFrame(elapsed: number) {
  const total = LEARN_DEMO_PHASES.reduce((sum, phase) => sum + phase.duration, 0);
  const cycle = Math.floor(Math.max(0, elapsed) / total);
  let time = ((elapsed % total) + total) % total;
  for (let index = 0; index < LEARN_DEMO_PHASES.length; index++) {
    const phase = LEARN_DEMO_PHASES[index];
    if (time < phase.duration) return { phase: phase.id, index, time, cycle };
    time -= phase.duration;
  }
  return { phase: LEARN_DEMO_PHASES[0].id, index: 0, time: 0, cycle };
}

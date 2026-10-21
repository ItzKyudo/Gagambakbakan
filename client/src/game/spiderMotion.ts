export function smoothMotion(value: number): number {
  const p = Math.max(0, Math.min(1, value));
  return p * p * (3 - 2 * p);
}

export function attackMotion(time: number): number {
  if (time <= 0 || time >= .46) return 0;
  if (time < .16) return -smoothMotion(time / .16);
  if (time < .26) return -1 + 2 * smoothMotion((time - .16) / .1);
  return 1 - smoothMotion((time - .26) / .2);
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

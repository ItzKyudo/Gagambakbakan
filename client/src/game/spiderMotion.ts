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

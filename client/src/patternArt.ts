export interface PatternStroke {
  color: string;
  points: Array<[number, number]>;
}

export const MAX_PATTERN_STROKES = 8;
export const MAX_PATTERN_POINTS = 40;
export const MAX_PATTERN_LENGTH = 1400;

const COLOR = /^#[0-9a-f]{6}$/i;

export function encodePatternArt(strokes: PatternStroke[]): string {
  return strokes.slice(-MAX_PATTERN_STROKES).flatMap(stroke => {
    if (!COLOR.test(stroke.color) || !stroke.points.length) return [];
    const points = stroke.points.slice(0, MAX_PATTERN_POINTS).map(([x, y]) => {
      const px = Math.round(Math.max(0, Math.min(1, x)) * 100);
      const py = Math.round(Math.max(0, Math.min(1, y)) * 100);
      return px.toString(16).padStart(2, '0') + py.toString(16).padStart(2, '0');
    }).join('');
    return `${stroke.color.slice(1).toLowerCase()}:${points}`;
  }).join('|').slice(0, MAX_PATTERN_LENGTH);
}

export function decodePatternArt(value: unknown): PatternStroke[] {
  if (typeof value !== 'string' || !value || value.length > MAX_PATTERN_LENGTH) return [];
  const result: PatternStroke[] = [];
  for (const encoded of value.split('|')) {
    const [color, points, extra] = encoded.split(':');
    if (extra !== undefined || !/^[0-9a-f]{6}$/i.test(color) || !/^[0-9a-f]+$/i.test(points) || points.length % 4 || points.length > MAX_PATTERN_POINTS * 4) return [];
    const stroke: PatternStroke = { color: `#${color.toLowerCase()}`, points: [] };
    for (let i = 0; i < points.length; i += 4) {
      const x = parseInt(points.slice(i, i + 2), 16);
      const y = parseInt(points.slice(i + 2, i + 4), 16);
      if (x > 100 || y > 100) return [];
      stroke.points.push([x / 100, y / 100]);
    }
    result.push(stroke);
    if (result.length > MAX_PATTERN_STROKES) return [];
  }
  return result;
}

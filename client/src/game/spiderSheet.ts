import sheetUrl from '../assets/spider-sheet.png';
import sheetData from './spider-sheet.json';
import { accessorySVG, getColor, type SpiderLook } from '../gb';
import { decodePatternArt } from '../patternArt';

export type SpiderClip = keyof typeof sheetData.clips;
type Look = Pick<SpiderLook, 'color' | 'pattern' | 'acc' | 'customPattern'>;
type Colors = { main: string; dark: string; light: string };

const sheet = new Image();
sheet.src = sheetUrl;
const frameCache = new Map<string, HTMLCanvasElement>();
const accessoryCache = new Map<string, HTMLImageElement>();

if (Object.values(sheetData.clips).some(clip => !clip.frames.length || clip.frames.some(rect => rect[2] !== 288 || rect[3] !== 224))) {
  throw new Error('Spider sheet frame metadata is invalid');
}

export function spiderCanvasHtml(look: Look): string {
  return `<canvas class="spider-art" width="288" height="224" data-color="${look.color}" data-pattern="${look.pattern}" data-acc="${look.acc}" data-custom-pattern="${look.customPattern}"></canvas>`;
}

function rgb(hex: string): [number, number, number] {
  return [1, 3, 5].map(i => parseInt(hex.slice(i, i + 2), 16)) as [number, number, number];
}

function tintedFrame(rect: number[], colors: Colors): HTMLCanvasElement {
  const key = `${rect[0]}:${rect[1]}:${colors.main}:${colors.dark}:${colors.light}`;
  const cached = frameCache.get(key);
  if (cached) return cached;
  const canvas = document.createElement('canvas');
  canvas.width = rect[2];
  canvas.height = rect[3];
  const ctx = canvas.getContext('2d', { willReadFrequently: true })!;
  ctx.drawImage(sheet, rect[0], rect[1], rect[2], rect[3], 0, 0, rect[2], rect[3]);
  if (colors.main.toLowerCase() !== '#f2a33a' || colors.dark.toLowerCase() !== '#8f4f14' || colors.light.toLowerCase() !== '#ffd694') {
    const data = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const dark = rgb(colors.dark), main = rgb(colors.main), light = rgb(colors.light);
    for (let i = 0; i < data.data.length; i += 4) {
      const r = data.data[i], g = data.data[i + 1], b = data.data[i + 2];
      if (data.data[i + 3] && r > 60 && r > g * 1.12 && g > b * 1.18) {
        const low = g < 163;
        const from = low ? dark : main, to = low ? main : light;
        const t = Math.max(0, Math.min(1, (g - (low ? 79 : 163)) / (low ? 84 : 51)));
        for (let c = 0; c < 3; c++) data.data[i + c] = Math.round(from[c] + (to[c] - from[c]) * t);
      }
    }
    ctx.putImageData(data, 0, 0);
  }
  frameCache.set(key, canvas);
  return canvas;
}

function drawPattern(ctx: CanvasRenderingContext2D, look: Look, colors: Colors): void {
  if (look.pattern === 'stripes') return;
  ctx.save();
  ctx.beginPath();
  ctx.ellipse(-15, -29, 22, 19, 0, 0, Math.PI * 2);
  ctx.clip();
  ctx.fillStyle = colors.main;
  ctx.fillRect(-40, -52, 50, 46);
  ctx.strokeStyle = colors.dark;
  ctx.fillStyle = colors.dark;
  ctx.lineWidth = 2.5;
  if (look.pattern === 'custom') {
    for (const stroke of decodePatternArt(look.customPattern)) {
      ctx.beginPath();
      stroke.points.forEach(([x, y], i) => i ? ctx.lineTo(-39 + x * 48, -50 + y * 42) : ctx.moveTo(-39 + x * 48, -50 + y * 42));
      ctx.strokeStyle = stroke.color;
      ctx.lineWidth = 2.2;
      ctx.stroke();
    }
  } else if (look.pattern === 'dots' || look.pattern === 'rings') {
    for (const [x, y] of [[-28, -37], [-12, -42], [-3, -30], [-24, -21], [-10, -17]]) {
      ctx.beginPath();
      ctx.arc(x, y, look.pattern === 'rings' ? 4 : 3, 0, Math.PI * 2);
      look.pattern === 'rings' ? ctx.stroke() : ctx.fill();
    }
  } else if (look.pattern !== 'plain') {
    for (const x of [-29, -17, -5]) {
      ctx.beginPath();
      if (look.pattern === 'chevron' || look.pattern === 'diamonds') {
        ctx.moveTo(x - 5, -43); ctx.lineTo(x + 5, -29); ctx.lineTo(x - 5, -15);
        if (look.pattern === 'diamonds') ctx.closePath();
      } else if (look.pattern === 'cross') {
        ctx.moveTo(x - 6, -40); ctx.lineTo(x + 6, -18); ctx.moveTo(x + 6, -40); ctx.lineTo(x - 6, -18);
      } else if (look.pattern === 'split') {
        ctx.fillRect(x, -50, 5, 42);
      } else {
        ctx.moveTo(x, -48); ctx.quadraticCurveTo(x + 10, -29, x, -10);
      }
      ctx.stroke();
    }
  }
  ctx.restore();
}

function drawAccessory(ctx: CanvasRenderingContext2D, acc: string): void {
  if (acc === 'none') return;
  let image = accessoryCache.get(acc);
  if (!image) {
    image = new Image();
    image.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(accessorySVG(acc))}`;
    accessoryCache.set(acc, image);
  }
  if (image.complete && image.naturalWidth) ctx.drawImage(image, -10, -60, 45, 44);
}

export function drawSpiderSheet(
  ctx: CanvasRenderingContext2D, clip: SpiderClip, frame: number, x: number, y: number,
  face: number, look: Look, colors: Colors, withAccessory = false
): boolean {
  if (!sheet.complete || !sheet.naturalWidth) return false;
  const frames = sheetData.clips[clip].frames;
  const rect = frames[Math.max(0, Math.min(frames.length - 1, frame))];
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(face < 0 ? -1 : 1, 1);
  ctx.drawImage(tintedFrame(rect, colors), -64, -80, 144, 112);
  drawPattern(ctx, look, colors);
  if (withAccessory) drawAccessory(ctx, look.acc);
  ctx.restore();
  return true;
}

export function paintSpiderCanvases(root: ParentNode, frame = 0): void {
  root.querySelectorAll<HTMLCanvasElement>('canvas.spider-art').forEach(canvas => {
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const look = {
      color: canvas.dataset.color || 'amber', pattern: canvas.dataset.pattern || 'stripes',
      acc: canvas.dataset.acc || 'none', customPattern: canvas.dataset.customPattern || ''
    };
    const color = getColor(look.color);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.save();
    ctx.scale(2, 2);
    drawSpiderSheet(ctx, 'idle', frame, 64, 80, 1, look, color, true);
    ctx.restore();
  });
}

import Phaser from 'phaser';
import {
  STICK, POND_Y, BODY_H, BODY_Y, MAXDROP, REACH,
  CANVAS_WIDTH, CANVAS_HEIGHT, COLORS, clamp, lerp
} from './constants';
import { keyLabel, getKeys } from '../gb';
import { decodePatternArt } from '../patternArt';
import { attackPose, gaitMotion, skillBurst, smoothMotion, type SkillBurst } from './spiderMotion';

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  max: number;
  sz: number;
  col: string;
  g: number;
  streak?: boolean;
}

interface ImpactRing {
  x: number;
  y: number;
  r: number;
  maxR: number;
  col: string;
  life: number;
  max: number;
}

interface FloatingText {
  x: number;
  y: number;
  text: string;
  col: string;
  life: number;
}

export class GagambakbakanScene extends Phaser.Scene {
  public gameState: any = null;
  public myPlayerId: number = 0; // 0 = Amber, 1 = Jade
  public isOnline: boolean = false;
  public shakeAmount: number = 0;
  public transparentBg: boolean = false;
  public quality: 'low' | 'medium' | 'high' = 'medium';

  private dpr: number = 1;
  private bgCanvas!: HTMLCanvasElement;
  private stickCanvas!: HTMLCanvasElement;
  private pondGradient!: CanvasGradient;
  private flies: Array<{ x: number; y: number; ph: number; sp: number }> = [];
  private grain: Array<{ x: number; y: number; len: number }> = [];
  private particles: Particle[] = [];
  private impactRings: ImpactRing[] = [];
  private floatingTexts: FloatingText[] = [];
  private powerTrailUntil: [number, number] = [0, 0];
  private leechTrailUntil: [number, number] = [0, 0];

  private renderCanvas!: HTMLCanvasElement;
  private renderCtx!: CanvasRenderingContext2D;
  private displayImage!: Phaser.GameObjects.Image;

  constructor() {
    super({ key: 'GagambakbakanScene' });
  }

  private getDpr(): number {
    // Low and Medium quality use 1x DPR to drastically reduce canvas memory bandwidth & fill-rate
    if (this.quality === 'low' || this.quality === 'medium') {
      return 1;
    }
    return Math.min(2, window.devicePixelRatio || 1);
  }

  create() {
    this.dpr = this.getDpr();
    this.createBackgroundCache();
    this.createWoodGrain();
    this.createStickCache();
    this.createFlies();

    // Create rendering surface sized to optimized DPR
    this.renderCanvas = document.createElement('canvas');
    this.renderCanvas.width = CANVAS_WIDTH * this.dpr;
    this.renderCanvas.height = CANVAS_HEIGHT * this.dpr;
    this.renderCtx = this.renderCanvas.getContext('2d', { alpha: this.transparentBg })!;

    // Pre-create and cache static pond water gradient
    this.pondGradient = this.renderCtx.createLinearGradient(0, POND_Y, 0, CANVAS_HEIGHT);
    this.pondGradient.addColorStop(0, 'rgba(46,129,144,.8)');
    this.pondGradient.addColorStop(1, 'rgba(14,56,68,.96)');

    // Register canvas texture in Phaser
    if (this.textures.exists('brawlCanvas')) {
      this.textures.remove('brawlCanvas');
    }
    this.textures.addCanvas('brawlCanvas', this.renderCanvas);
    this.displayImage = this.add.image(CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2, 'brawlCanvas');
    this.displayImage.setDisplaySize(CANVAS_WIDTH, CANVAS_HEIGHT);
  }

  private createStickCache() {
    this.stickCanvas = document.createElement('canvas');
    this.stickCanvas.width = CANVAS_WIDTH;
    this.stickCanvas.height = CANVAS_HEIGHT;
    const sCtx = this.stickCanvas.getContext('2d')!;
    this.drawStickToContext(sCtx);
  }

  private createFlies() {
    this.flies = [];
    const count = this.quality === 'low' ? 0 : (this.quality === 'medium' ? 8 : 22);
    for (let i = 0; i < count; i++) {
      this.flies.push({
        x: Math.random() * CANVAS_WIDTH,
        y: 120 + Math.random() * 330,
        ph: Math.random() * 6,
        sp: 0.3 + Math.random() * 0.5
      });
    }
  }

  private createWoodGrain() {
    this.grain = [];
    let s = 3;
    const r = () => { s = (s * 16807) % 2147483647; return s / 2147483647; };
    for (let i = 0; i < 100; i++) {
      this.grain.push({
        x: STICK.l - 10 + r() * (STICK.r - STICK.l + 20),
        y: STICK.y + 4 + r() * (STICK.th - 8),
        len: 10 + r() * 30
      });
    }
  }

  private createBackgroundCache() {
    this.bgCanvas = document.createElement('canvas');
    this.bgCanvas.width = CANVAS_WIDTH;
    this.bgCanvas.height = CANVAS_HEIGHT;
    const b = this.bgCanvas.getContext('2d')!;

    let seed = 7;
    const r = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };

    // Sky gradient
    const g = b.createLinearGradient(0, 0, 0, POND_Y + 20);
    g.addColorStop(0, '#15262d');
    g.addColorStop(0.55, '#2a4849');
    g.addColorStop(1, '#4a6f62');
    b.fillStyle = g;
    b.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // Stars
    for (let i = 0; i < 46; i++) {
      b.fillStyle = `rgba(233,239,216,${(0.15 + r() * 0.5).toFixed(2)})`;
      b.fillRect(r() * CANVAS_WIDTH, r() * 230, 1.6, 1.6);
    }

    // Moon glow & disc
    const moonX = CANVAS_WIDTH - 210;
    const mg = b.createRadialGradient(moonX, 105, 10, moonX, 105, 160);
    mg.addColorStop(0, 'rgba(233,239,216,.5)');
    mg.addColorStop(1, 'rgba(233,239,216,0)');
    b.fillStyle = mg;
    b.beginPath();
    b.arc(moonX, 105, 160, 0, Math.PI * 2);
    b.fill();

    b.fillStyle = '#e9efd8';
    b.beginPath();
    b.arc(moonX, 105, 40, 0, Math.PI * 2);
    b.fill();

    // Moon craters
    b.fillStyle = 'rgba(120,130,110,.18)';
    [[moonX - 12, 98, 9], [moonX + 12, 116, 6], [moonX, 90, 4]].forEach(([cx, cy, cr]) => {
      b.beginPath();
      b.arc(cx, cy, cr, 0, Math.PI * 2);
      b.fill();
    });

    // Dark background hills
    const hills = (y0: number, amp: number, col: string, ph: number) => {
      b.fillStyle = col;
      b.beginPath();
      b.moveTo(0, CANVAS_HEIGHT);
      for (let x = 0; x <= CANVAS_WIDTH; x += 16) {
        b.lineTo(x, y0 + Math.sin(x * 0.008 + ph) * amp + Math.sin(x * 0.021 + ph * 2) * amp * 0.4);
      }
      b.lineTo(CANVAS_WIDTH, CANVAS_HEIGHT);
      b.closePath();
      b.fill();
    };

    hills(335, 34, '#1d3836', 1);
    hills(385, 26, '#152b2a', 3);

    // Distant tree canopies
    b.fillStyle = '#0e1e1d';
    for (let k = 0; k < 14; k++) {
      b.beginPath();
      b.arc(r() * 210 - 20, r() * 150 - 10, 24 + r() * 40, 0, Math.PI * 2);
      b.fill();
    }
    for (let m = 0; m < 14; m++) {
      b.beginPath();
      b.arc(CANVAS_WIDTH - r() * 210 + 20, r() * 150 - 10, 24 + r() * 40, 0, Math.PI * 2);
      b.fill();
    }

    // Reeds & cattails
    b.lineCap = 'round';
    for (let q = 0; q < 34; q++) {
      const rx = q < 17 ? r() * 150 + 10 : CANVAS_WIDTH - r() * 150 - 10;
      const hh = 50 + r() * 80;
      const lean = (r() - 0.5) * 30;
      b.strokeStyle = '#10272a';
      b.lineWidth = 2.2;
      b.beginPath();
      b.moveTo(rx, POND_Y + 6);
      b.quadraticCurveTo(rx + lean * 0.3, POND_Y - hh * 0.6, rx + lean, POND_Y - hh);
      b.stroke();
      if (q % 3 === 0) {
        b.fillStyle = '#3a2a1e';
        b.beginPath();
        b.ellipse(rx + lean, POND_Y - hh - 7, 3.2, 9, lean * 0.02, 0, Math.PI * 2);
        b.fill();
      }
    }
  }

  public addFx(fx: any) {
    const isLow = this.quality === 'low';
    if (fx.type === 'spark') {
      const sp = fx.sp || 200;
      const baseCount = fx.count || 8;
      const count = isLow ? Math.max(3, Math.floor(baseCount * 0.5)) : baseCount;
      for (let i = 0; i < count; i++) {
        const angle = (i / count) * Math.PI * 2 + (Math.random() - 0.5) * 0.5;
        const speed = sp * (0.55 + Math.random() * 0.65);
        this.particles.push({
          x: fx.x,
          y: fx.y,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed - 65,
          life: 0.26 + Math.random() * 0.34,
          max: 0.6,
          sz: 1.9 + Math.random() * 2.2,
          col: fx.col,
          g: 520,
          streak: sp >= 170
        });
      }
      if (sp >= 170 && !isLow) {
        this.impactRings.push({
          x: fx.x,
          y: fx.y,
          r: 6,
          maxR: sp >= 250 ? 40 : 28,
          col: fx.col || '#ffffff',
          life: 0.2,
          max: 0.2
        });
      }
    } else if (fx.type === 'dust') {
      const count = isLow ? 3 : (fx.count || 6);
      for (let i = 0; i < count; i++) {
        this.particles.push({
          x: fx.x + (Math.random() - 0.5) * 28,
          y: fx.y,
          vx: (Math.random() - 0.5) * 100,
          vy: -10 - Math.random() * 50,
          life: 0.3 + Math.random() * 0.3,
          max: 0.6,
          sz: 2 + Math.random() * 2.5,
          col: '#d8c7a0',
          g: 40
        });
      }
    } else if (fx.type === 'splash') {
      const count = isLow ? 16 : 34;
      for (let i = 0; i < count; i++) {
        this.particles.push({
          x: fx.x + (Math.random() - 0.5) * 20,
          y: fx.y,
          vx: (Math.random() - 0.5) * 340,
          vy: -120 - Math.random() * 310,
          life: 0.5 + Math.random() * 0.5,
          max: 1,
          sz: 2 + Math.random() * 3,
          col: '#c4eef2',
          g: 900
        });
      }
    } else if (fx.type === 'txt') {
      this.floatingTexts.push({
        x: fx.x,
        y: fx.y,
        text: fx.text,
        col: fx.col,
        life: 1
      });
    }
  }

  public addShake(amount: number) {
    this.shakeAmount = Math.max(this.shakeAmount, amount);
  }

  update(time: number, delta: number) {
    const dt = Math.min(0.033, delta / 1000);
    this.shakeAmount *= Math.exp(-10 * dt);

    // Update particles (O(1) swap-and-pop avoids expensive array shifts)
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.life -= dt;
      p.vy += p.g * dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      if (p.life <= 0) {
        this.particles[i] = this.particles[this.particles.length - 1];
        this.particles.pop();
      }
    }

    // Update impact rings (O(1) swap-and-pop)
    for (let r = this.impactRings.length - 1; r >= 0; r--) {
      const ring = this.impactRings[r];
      ring.life -= dt;
      if (ring.life <= 0) {
        this.impactRings[r] = this.impactRings[this.impactRings.length - 1];
        this.impactRings.pop();
      }
    }

    // Update floating texts (O(1) swap-and-pop)
    for (let j = this.floatingTexts.length - 1; j >= 0; j--) {
      const f = this.floatingTexts[j];
      f.life -= dt * 0.9;
      f.y -= 34 * dt;
      if (f.life <= 0) {
        this.floatingTexts[j] = this.floatingTexts[this.floatingTexts.length - 1];
        this.floatingTexts.pop();
      }
    }

    this.render(time / 1000);

    // Update Phaser Texture
    const texture = this.textures.get('brawlCanvas') as Phaser.Textures.CanvasTexture;
    if (texture) {
      texture.refresh();
    }
  }

  private render(t: number) {
    const ctx = this.renderCtx;
    ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // Camera screen shake
    const sx = (Math.random() - 0.5) * this.shakeAmount;
    const sy = (Math.random() - 0.5) * this.shakeAmount;
    ctx.save();
    ctx.translate(sx, sy);

    // Draw background
    if (!this.transparentBg) {
      ctx.drawImage(this.bgCanvas, 0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

      // Fireflies (skipped on low quality, reduced on medium)
      if (this.flies.length > 0) {
        this.flies.forEach((fl) => {
          const x = fl.x + Math.sin(t * fl.sp + fl.ph) * 40;
          const y = fl.y + Math.cos(t * fl.sp * 1.3 + fl.ph) * 24;
          const a = 0.4 + 0.6 * Math.max(0, Math.sin(t * 1.6 + fl.ph * 3));
          ctx.fillStyle = `rgba(232,245,138,${(0.14 * a).toFixed(3)})`;
          ctx.beginPath();
          ctx.arc(x, y, 8, 0, Math.PI * 2);
          ctx.fill();

          ctx.fillStyle = `rgba(240,250,160,${a.toFixed(3)})`;
          ctx.beginPath();
          ctx.arc(x, y, 1.6, 0, Math.PI * 2);
          ctx.fill();
        });
      }
    }

    const isDrafting = this.gameState && this.gameState.status === 'draft';

    if (!isDrafting) {
      // Twig
      this.drawStick(ctx);

      // Earthquake tremors
      this.drawQuakes(ctx, t);
    }

    if (!isDrafting && this.gameState && this.gameState.p1 && this.gameState.p2) {
      const p1 = this.gameState.p1;
      const p2 = this.gameState.p2;

      // Order spiders so a dangling/rising spider overlaps correctly, or attacker renders in front
      const order = p1.hang && !p2.hang
        ? [p2, p1]
        : (!p1.hang && p2.hang
          ? [p1, p2]
          : (p1.atkT > 0 && p2.atkT <= 0 ? [p2, p1] : [p1, p2]));
      order.forEach((s) => this.drawSpider(ctx, s, t));
      order.forEach((s) => this.drawSpiderName(ctx, s));

      // Draw Webs & Projectiles
      const webs = this.gameState.webs || [];
      webs.forEach((w: any) => {
        const sg = Math.sign(w.vx) || 1;
        if (w.k === 'spit') {
          ctx.save();
          ctx.translate(w.x, w.y);

          // Undulating toxic vapor wake & dripping venom globules
          ctx.fillStyle = 'rgba(156, 240, 106, 0.28)';
          ctx.beginPath();
          ctx.ellipse(-sg * 16, Math.sin(t * 28) * 1.5, 18, 4.5, 0, 0, Math.PI * 2);
          ctx.fill();

          for (let d = 1; d <= 3; d++) {
            const dx = -sg * (8 + d * 8);
            const dy = Math.sin(t * 24 + d * 1.8) * (1.5 + d * 0.8);
            ctx.fillStyle = d === 1 ? 'rgba(216, 255, 156, 0.85)' : 'rgba(156, 240, 106, 0.55)';
            ctx.beginPath();
            ctx.arc(dx, dy, 3.8 - d * 0.7, 0, Math.PI * 2);
            ctx.fill();
          }

          // Outer venom sac
          ctx.fillStyle = '#7ed957';
          ctx.strokeStyle = 'rgba(8,16,15,.85)';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.ellipse(0, 0, 11, 6.5, 0, 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();

          // Glowing acid core
          ctx.fillStyle = '#e2ffab';
          ctx.beginPath();
          ctx.ellipse(sg * 2.5, -1.2, 5.5, 2.8, 0, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
          return;
        }

        if (w.k === 'hook') {
          const owner = w.owner === 0 ? p1 : p2;
          const ox = owner.x + owner.face * 20;
          const age = Math.max(0, 1 - (w.life || 0));
          const whipAmp = Math.max(0, 1 - age * 4) * 6;
          ctx.save();

          // Taut braided silk cable with launch whip-wave oscillation
          ctx.strokeStyle = 'rgba(20, 32, 30, 0.65)';
          ctx.lineWidth = 3.6;
          ctx.beginPath();
          ctx.moveTo(ox, w.y);
          for (let step = 1; step <= 8; step++) {
            const u = step / 8;
            const lx = lerp(ox, w.x, u);
            const ly = w.y + Math.sin(u * Math.PI * 3 + t * 35) * whipAmp * Math.sin(u * Math.PI);
            ctx.lineTo(lx, ly);
          }
          ctx.stroke();

          ctx.strokeStyle = 'rgba(244,248,238,.95)';
          ctx.lineWidth = 2;
          ctx.stroke();

          // Speed-cone ring behind harpoon head
          ctx.strokeStyle = 'rgba(207, 233, 255, 0.55)';
          ctx.lineWidth = 1.6;
          ctx.beginPath();
          ctx.ellipse(w.x - sg * 8, w.y, 3.5, 8.5, 0, 0, Math.PI * 2);
          ctx.stroke();

          // Multi-barbed chitin harpoon head
          ctx.fillStyle = '#ffffff';
          ctx.strokeStyle = COLORS.outline;
          ctx.lineWidth = 1.6;
          ctx.lineJoin = 'round';
          ctx.beginPath();
          ctx.moveTo(w.x + sg * 12, w.y);
          ctx.lineTo(w.x - sg * 6, w.y - 8);
          ctx.lineTo(w.x - sg * 2, w.y - 2);
          ctx.lineTo(w.x - sg * 9, w.y);
          ctx.lineTo(w.x - sg * 2, w.y + 2);
          ctx.lineTo(w.x - sg * 6, w.y + 8);
          ctx.closePath();
          ctx.fill();
          ctx.stroke();
          ctx.restore();
          return;
        }

        // Standard Web Disc with trailing gossamer ribbons & dew nodes
        ctx.save();
        ctx.translate(w.x, w.y);

        // Trailing gossamer silk streamers
        ctx.strokeStyle = 'rgba(244, 248, 238, 0.42)';
        ctx.lineWidth = 1.4;
        ctx.lineCap = 'round';
        [-5, 0, 5].forEach((offY, idx) => {
          ctx.beginPath();
          ctx.moveTo(-sg * 6, offY);
          ctx.quadraticCurveTo(
            -sg * 18,
            offY + Math.sin(t * 22 + idx * 2) * 4,
            -sg * (28 + idx * 4),
            offY + Math.cos(t * 20 + idx) * 3
          );
          ctx.stroke();
        });

        ctx.rotate(w.x * 0.06);
        ctx.strokeStyle = 'rgba(244,248,238,.95)';
        ctx.lineWidth = 1.6;
        for (let q = 0; q < 6; q++) {
          const an = q * Math.PI / 3;
          ctx.beginPath();
          ctx.moveTo(0, 0);
          ctx.lineTo(Math.cos(an) * 12.5, Math.sin(an) * 12.5);
          ctx.stroke();
        }
        ctx.beginPath();
        ctx.arc(0, 0, 6, 0, Math.PI * 2);
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(0, 0, 11.5, 0, Math.PI * 2);
        ctx.stroke();

        // Dew-drop highlights on outer web spokes
        ctx.fillStyle = '#ffffff';
        for (let q = 0; q < 6; q += 2) {
          const an = q * Math.PI / 3;
          ctx.beginPath();
          ctx.arc(Math.cos(an) * 11.5, Math.sin(an) * 11.5, 1.5, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.restore();
      });
    }

    // Pond water
    this.drawPond(ctx, t);

    // Particles & combat text
    this.drawParticles(ctx);


    // Dangling pace gauges & prompt overlays
    if (this.gameState && this.gameState.p1 && this.gameState.p2) {
      const spiders = [this.gameState.p1, this.gameState.p2];
      spiders.forEach((s, i) => {
        const isHuman = this.isOnline ? (i === this.myPlayerId) : true;
        if (s.hang && !s.ko && this.gameState.status === 'fight' && isHuman) {
          const left = Math.max(1, Math.ceil(s.drop / (s.tapLift || 8)));
          const kBindings = getKeys();
          const climbCode = i === 1 ? kBindings.p2.climb : kBindings.p1.climb;
          const keyTxt = keyLabel(climbCode).toUpperCase();
          const label = `TAP ${keyTxt} ×${left}`;
          const lx = clamp(s.x, 100, CANVAS_WIDTH - 100);
          const ly = Math.min(BODY_Y + s.drop + 26 + 48, CANVAS_HEIGHT - 52) + Math.sin(t * 9) * 3;

          ctx.save();
          ctx.textAlign = 'center';
          ctx.font = '700 24px "Barlow Condensed", sans-serif';
          ctx.lineWidth = 6;
          ctx.lineJoin = 'round';
          ctx.strokeStyle = 'rgba(8,16,15,.9)';
          ctx.strokeText(`▲ ${label} ▲`, lx, ly);
          ctx.fillStyle = s.colorLight || (i === 0 ? COLORS.amberLight : COLORS.jadeLight);
          ctx.fillText(`▲ ${label} ▲`, lx, ly);

          // Pace gauge
          const bw = 120, bxl = lx - bw / 2, byl = ly + 8;
          const maxR = 10;
          const needed = s.hold || 1;
          const okPace = (s.rate || 0) >= needed;
          ctx.fillStyle = 'rgba(8,16,15,.85)';
          ctx.fillRect(bxl - 1, byl - 1, bw + 2, 10);
          ctx.fillStyle = okPace ? (s.color || (i === 0 ? COLORS.amber : COLORS.jade)) : COLORS.danger;
          ctx.fillRect(bxl, byl, bw * Math.min(1, (s.rate || 0) / maxR), 8);
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(bxl + bw * Math.min(1, needed / maxR) - 1, byl - 3, 2, 14);

          let ly2 = ly + 34;
          const timeLeft = Math.max(0, 10 - (s.hangT || 0));
          const urgent = timeLeft <= 3.0;
          const t3 = `${timeLeft.toFixed(1)}s LEFT · NEED ${Math.round(needed)}/S` + (s.falls > 1 ? ` (FALL ${s.falls})` : '');
          ctx.font = '700 16px "Barlow Condensed", sans-serif';
          ctx.lineWidth = 4;
          ctx.strokeStyle = 'rgba(8,16,15,.9)';
          ctx.strokeText(t3, lx, ly2);
          ctx.fillStyle = urgent ? COLORS.danger : (s.falls > 1 ? '#ffa38b' : '#ffffff');
          ctx.fillText(t3, lx, ly2);
          ly2 += 20;

          // Check if surge is ready
          const hasSurge1 = s.skill1 === 'surge' && s.cd1 <= 0;
          const hasSurge2 = s.skill2 === 'surge' && s.cd2 <= 0;
          if (hasSurge1 || hasSurge2) {
            const surgeKey = hasSurge1
              ? keyLabel(i === 1 ? kBindings.p2.s1 : kBindings.p1.s1).toUpperCase()
              : keyLabel(i === 1 ? kBindings.p2.s2 : kBindings.p1.s2).toUpperCase();
            const t2 = `SURGE READY · ${surgeKey}`;
            ctx.font = '600 16px "Barlow Condensed", sans-serif';
            ctx.lineWidth = 4;
            ctx.strokeStyle = 'rgba(8,16,15,.9)';
            ctx.strokeText(t2, lx, ly2);
            ctx.fillStyle = '#ffffff';
            ctx.fillText(t2, lx, ly2);
          }
          ctx.restore();
        }
      });
    }

    // Match / Round announcements
    if (this.gameState) {
      if (this.gameState.status === 'ready') {
        if (this.gameState.stateT < 0.85) {
          this.drawBigText(ctx, `ROUND ${this.gameState.round}`, 190, 58, COLORS.fg, this.gameState.stateT);
        } else {
          this.drawBigText(ctx, 'FIGHT!', 190, 72, '#ffd694', this.gameState.stateT - 0.85);
        }
      } else if (this.gameState.status === 'roundEnd' && this.gameState.stateT > 0.4) {
        const p1Ko = !!(this.gameState.p1 && this.gameState.p1.ko);
        const p2Ko = !!(this.gameState.p2 && this.gameState.p2.ko);
        if (p1Ko || p2Ko) {
          const wId = p1Ko ? 1 : 0;
          const winner = wId === 0 ? this.gameState.p1 : this.gameState.p2;
          const wName = (winner?.name || (wId === 0 ? 'AMBER' : 'JADE')).toUpperCase();
          const wCol = winner?.color || (wId === 0 ? COLORS.amber : COLORS.jade);
          this.drawBigText(ctx, `${wName} TAKES IT`, 190, 44, wCol, this.gameState.stateT - 0.4);
        } else {
          this.drawBigText(ctx, 'ROUND TIE!', 190, 52, '#ffd694', this.gameState.stateT - 0.4);
        }
      }
    }

    ctx.restore();
  }

  private drawStick(ctx: CanvasRenderingContext2D) {
    if (this.stickCanvas) {
      ctx.drawImage(this.stickCanvas, 0, 0);
    } else {
      this.drawStickToContext(ctx);
    }
  }

  private drawStickToContext(ctx: CanvasRenderingContext2D) {
    const l = STICK.l, r = STICK.r, y = STICK.y, th = STICK.th, x0 = l - 16, x1 = r + 16;
    ctx.lineCap = 'round';

    // Shoots with leaves
    [[270, -14, 30], [540, -12, 28], [880, 12, 34]].forEach(([tx, dx, dy]) => {
      ctx.strokeStyle = COLORS.barkDark;
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(tx, y + 3);
      ctx.lineTo(tx + dx, y - dy);
      ctx.stroke();

      ctx.fillStyle = 'rgba(80,128,84,.9)';
      for (let i = 0; i < 3; i++) {
        ctx.beginPath();
        ctx.ellipse(tx + dx + (i - 1) * 9, y - dy - 6 - (i % 2) * 4, 5, 11, (i - 1) * 0.7, 0, Math.PI * 2);
        ctx.fill();
      }
    });

    // Twig main bark gradient
    const g = ctx.createLinearGradient(0, y, 0, y + th);
    g.addColorStop(0, COLORS.barkLight);
    g.addColorStop(0.35, COLORS.bark);
    g.addColorStop(1, COLORS.barkDark);
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.roundRect(x0, y, x1 - x0, th, 10);
    ctx.fill();

    // Wood grain lines
    ctx.strokeStyle = 'rgba(40,25,15,.38)';
    ctx.lineWidth = 1.4;
    this.grain.forEach((gr) => {
      ctx.beginPath();
      ctx.moveTo(gr.x, gr.y);
      ctx.lineTo(gr.x + gr.len, gr.y + 0.6);
      ctx.stroke();
    });

    // Highlight ridge
    ctx.strokeStyle = 'rgba(255,230,190,.3)';
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.moveTo(x0 + 8, y + 1.5);
    ctx.lineTo(x1 - 8, y + 1.5);
    ctx.stroke();

    // Bark knots
    [[240, 13, 5], [460, 9, 4], [740, 14, 6], [960, 11, 5]].forEach(([kx, ky, kr]) => {
      ctx.fillStyle = 'rgba(40,25,15,.55)';
      ctx.beginPath();
      ctx.ellipse(kx, y + ky, kr + 3, kr, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = 'rgba(40,25,15,.4)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.ellipse(kx, y + ky, kr + 6, kr + 3, 0, 0, Math.PI * 2);
      ctx.stroke();
    });

    // Cut twig ends
    [x0 + 2, x1 - 2].forEach((ex) => {
      ctx.fillStyle = '#c9a276';
      ctx.strokeStyle = COLORS.barkDark;
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.ellipse(ex, y + th / 2, 6, th / 2, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.strokeStyle = 'rgba(74,53,36,.6)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.ellipse(ex, y + th / 2, 3, th / 2 - 5, 0, 0, Math.PI * 2);
      ctx.stroke();
    });
  }

  private drawQuakes(ctx: CanvasRenderingContext2D, t: number) {
    if (!this.gameState) return;
    const spiders = [this.gameState.p1, this.gameState.p2].filter(Boolean);
    spiders.forEach((s) => {
      if (s.quake && s.quake > 0) {
        const k = 1 - s.quake / 0.5;
        const colLight = s.colorLight || (s.id === 0 ? COLORS.amberLight : COLORS.jadeLight);
        const baseY = STICK.y + STICK.th + 4;
        ctx.save();
        ctx.lineCap = 'round';

        // Outer & inner concentric seismic rings
        [1, 0.65].forEach((scale, idx) => {
          const radiusX = k * 280 * scale;
          const radiusY = (10 + k * 10) * scale;
          ctx.globalAlpha = (1 - k) * (idx === 0 ? 0.9 : 0.65);
          ctx.strokeStyle = idx === 0 ? '#e8d9b0' : colLight;
          ctx.lineWidth = idx === 0 ? 4 : 2.5;
          ctx.beginPath();
          ctx.ellipse(s.x, baseY + 2, radiusX, radiusY, 0, 0, Math.PI * 2);
          ctx.stroke();
        });

        // Traveling seismic fault spikes rippling outward along the twig (±260px range)
        const waveDist = k * 260;
        [-1, 1].forEach((dir) => {
          const wx = clamp(s.x + dir * waveDist, STICK.l, STICK.r);
          ctx.globalAlpha = (1 - k) * 0.85;
          ctx.strokeStyle = '#fff3d1';
          ctx.lineWidth = 2.6;
          ctx.beginPath();
          for (let j = -2; j <= 2; j++) {
            const sx = wx + j * 10;
            const amp = (1 - Math.abs(j) * 0.28) * (1 - k) * 16;
            ctx.moveTo(sx, STICK.y + STICK.th);
            ctx.lineTo(sx + dir * 4, STICK.y + STICK.th + amp);
          }
          ctx.stroke();
        });

        // Vibrating bark splinters kicking off the branch
        ctx.fillStyle = '#d8c7a0';
        ctx.globalAlpha = (1 - k) * 0.85;
        for (let sp = 0; sp < 6; sp++) {
          const side = sp % 2 === 0 ? 1 : -1;
          const dist = (25 + sp * 34) * k;
          const py = baseY + Math.sin(k * Math.PI) * (12 + (sp % 3) * 7) + Math.sin(t * 20 + sp) * 2;
          ctx.beginPath();
          ctx.arc(s.x + side * dist, py, 2.2, 0, Math.PI * 2);
          ctx.fill();
        }

        ctx.restore();
      }
    });
  }

  private legStroke(
    ctx: CanvasRenderingContext2D,
    a: { x: number; y: number },
    k: { x: number; y: number },
    f: { x: number; y: number },
    w: number,
    col: string,
    clawTipCol?: string
  ) {
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.beginPath();
    ctx.moveTo(a.x, a.y);
    ctx.lineTo(k.x, k.y);
    ctx.lineTo(f.x, f.y);
    ctx.strokeStyle = COLORS.outline;
    ctx.lineWidth = w + 2.4;
    ctx.stroke();
    ctx.strokeStyle = col;
    ctx.lineWidth = w;
    ctx.stroke();

    // Articulated sharp tarsal claw tip on foreground/striking legs
    if (clawTipCol) {
      const dx = f.x - k.x;
      const dy = f.y - k.y;
      const len = Math.hypot(dx, dy) || 1;
      const ux = dx / len;
      const uy = dy / len;
      const nx = -uy;
      const ny = ux;

      ctx.fillStyle = clawTipCol;
      ctx.strokeStyle = COLORS.outline;
      ctx.lineWidth = 1.1;
      ctx.beginPath();
      ctx.moveTo(f.x - ux * 2 + nx * (w * 0.48), f.y - uy * 2 + ny * (w * 0.48));
      ctx.lineTo(f.x + ux * 6.5, f.y + uy * 6.5);
      ctx.lineTo(f.x - ux * 2 - nx * (w * 0.48), f.y - uy * 2 - ny * (w * 0.48));
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    }
  }

  private skillCast(s: any, id: string, duration = 0.4): SkillBurst {
    const c1 = s.skill1 === id && s.cd1max > 0 && s.cd1 > 0 ? s.cd1max - s.cd1 : 999;
    const c2 = s.skill2 === id && s.cd2max > 0 && s.cd2 > 0 ? s.cd2max - s.cd2 : 999;
    return skillBurst(Math.min(c1, c2), duration);
  }

  private projectileCastInfo(s: any): { amount: number; kind: 'web' | 'spit' | 'hook' | null } {
    const starts: Record<string, number> = { web: 1.6, spit: 1.2, hook: 1 };
    const shot = Array.from((this.gameState?.webs || []) as any[]).find(
      (w: any) => w.owner === s.id && starts[w.k] - w.life < .32
    ) as any;
    if (!shot) return { amount: 0, kind: null };
    const progress = Math.max(0, Math.min(1, (starts[shot.k] - shot.life) / .32));
    return { amount: Math.sin(progress * Math.PI), kind: shot.k };
  }

  private sweepCast(s: any): number {
    return this.skillCast(s, 'sweep', 0.34).progress;
  }

  private drawCrescentSlash(
    ctx: CanvasRenderingContext2D,
    x0: number,
    y0: number,
    cx: number,
    cy: number,
    x1: number,
    y1: number,
    tStart: number,
    tEnd: number,
    maxHalfWidth: number,
    colEdge: string,
    colCore: string,
    alpha: number
  ) {
    if (alpha <= 0.01 || tEnd - tStart <= 0.02) return;
    const steps = 14;
    const outerPts: Array<{ x: number; y: number }> = [];
    const innerPts: Array<{ x: number; y: number }> = [];

    for (let i = 0; i <= steps; i++) {
      const s = i / steps;
      const t = lerp(tStart, tEnd, s);
      const mt = 1 - t;
      const px = mt * mt * x0 + 2 * mt * t * cx + t * t * x1;
      const py = mt * mt * y0 + 2 * mt * t * cy + t * t * y1;

      const tx = 2 * mt * (cx - x0) + 2 * t * (x1 - cx);
      const ty = 2 * mt * (cy - y0) + 2 * t * (y1 - cy);
      const tLen = Math.hypot(tx, ty) || 1;
      const nx = -ty / tLen;
      const ny = tx / tLen;

      // Taper sharply at tail (s=0) and tip (s=1), biased toward the leading head
      const profile = Math.sin(Math.pow(s, 0.75) * Math.PI) * maxHalfWidth;
      outerPts.push({ x: px + nx * profile, y: py + ny * profile });
      innerPts.push({ x: px - nx * profile * 0.55, y: py - ny * profile * 0.55 });
    }

    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.fillStyle = colEdge;
    ctx.beginPath();
    outerPts.forEach((pt, idx) => {
      if (idx === 0) ctx.moveTo(pt.x, pt.y);
      else ctx.lineTo(pt.x, pt.y);
    });
    for (let i = innerPts.length - 1; i >= 0; i--) {
      ctx.lineTo(innerPts[i].x, innerPts[i].y);
    }
    ctx.closePath();
    ctx.fill();

    // Bright razor core along the outer leading edge
    ctx.globalAlpha = Math.min(1, alpha * 1.15);
    ctx.strokeStyle = colCore;
    ctx.lineCap = 'round';
    ctx.lineWidth = Math.max(1.4, maxHalfWidth * 0.52);
    ctx.beginPath();
    outerPts.forEach((pt, idx) => {
      if (idx === 0) ctx.moveTo(pt.x, pt.y);
      else ctx.lineTo(pt.x, pt.y);
    });
    ctx.stroke();
    ctx.restore();
  }

  private drawLegs(
    ctx: CanvasRenderingContext2D,
    s: any,
    bx: number,
    by: number,
    far: boolean,
    colMain: string,
    colDark: string,
    colLight: string
  ) {
    const f = s.face;
    const hb = s.hb || 0;
    const isHeavy = !!s.isHeavy;
    const t = this.time.now / 1000;
    const sweep = this.sweepCast(s);
    const sweepArc = sweep > 0 ? Math.sin(sweep * Math.PI) : 0;
    const powerBurst = this.skillCast(s, 'power', 0.4).pulse;
    const mendBurst = this.skillCast(s, 'mend', 0.5).pulse;
    const carapaceBurst = this.skillCast(s, 'carapace', 0.5).pulse;
    const leechBurst = this.skillCast(s, 'leech', 0.4).pulse;
    const surgeBurst = this.skillCast(s, 'surge', 0.45);
    const isRealStun = s.stun > 0 && !s.hang && sweep <= 0 && (s.stun > 0.26 || s.hitFlash > 0 || s.gLock);
    const proj = this.projectileCastInfo(s);
    const cast = proj.amount;

    for (let i = 0; i < 4; i++) {
      const ax = bx + f * (15 - i * 8) + (far ? f * 2 : 0);
      const ay = by + 5;
      const gait = gaitMotion((s.walkPhase || 0) + (i === 1 || i === 2 ? .5 : 0) + (far ? .5 : 0));
      const moving = Math.min(1, Math.abs(s.move || 0));
      const pace = s.hasteT > 0 ? 1.24 : 1;

      const baseFx = bx + f * (42 - i * 27) + (far ? f * 10 : 0) + f * gait.reach * 9 * moving * pace;
      const baseFy = STICK.y - 1 - gait.lift * (s.hasteT > 0 ? 11 : 8) * moving;
      const baseKx = (ax + baseFx) / 2 + f * (i < 2 ? 6 : -6);
      const baseKy = Math.min(ay, baseFy) - 24 - gait.lift * 2 * moving;

      let fx = baseFx;
      let fy = baseFy;
      let kx = baseKx;
      let ky = baseKy;
      let clawCol: string | undefined;

      if (!s.hang) {
        const isAttackingLeg = isHeavy ? (i === 0) : (!far && i === 0);

        if (s.atkT > 0 && isAttackingLeg) {
          const atkType = (s.atkType !== undefined ? s.atkType : (s.atkId || 0)) % 3;
          // Stagger far arm slightly in heavy attack for articulated depth
          const delay = (isHeavy && far) ? 0.010 : 0;
          const shiftedT = s.atkT > delay ? s.atkT - delay : s.atkT * 0.4;
          const lp = attackPose(shiftedT, isHeavy);

          let wFx = baseFx, wFy = baseFy, wKx = baseKx, wKy = baseKy;
          let sFx = baseFx, sFy = baseFy, sKx = baseKx, sKy = baseKy;
          let arcDx = 0, arcDy = 0, arcKx = 0, arcKy = 0;
          let folDx = 0, folDy = 0;

          if (isHeavy) {
            // Heavy 2-arm Attack: Dual Claw Crushing Guillotine
            const depthOff = far ? 10 : 0;
            wFx = bx + f * ((far ? 20 : 14) + depthOff);
            wFy = by - 68 - (far ? 4 : 0);
            wKx = bx + f * ((far ? 12 : 8) + depthOff * 0.5);
            wKy = by - 78;

            arcDx = f * 36;
            arcDy = -26;
            arcKx = f * 18;
            arcKy = -18;

            sFx = bx + f * (104 + depthOff);
            sFy = by + 12 + (far ? -3 : 2);
            sKx = bx + f * (54 + depthOff * 0.5);
            sKy = by - 16;

            folDx = -f * 10;
            folDy = 6;
          } else if (atkType === 0) {
            // Light Attack Variant 0: Quick Snap Jab (Straight Piercing Thrust)
            wFx = bx + f * 10;
            wFy = by - 16;
            wKx = bx - f * 4;
            wKy = by - 38;

            arcDx = f * 16;
            arcDy = -4;
            arcKx = f * 8;
            arcKy = -6;

            sFx = bx + f * 96;
            sFy = by - 10;
            sKx = bx + f * 48;
            sKy = by - 22;

            folDx = -f * 8;
            folDy = 2;
          } else if (atkType === 1) {
            // Light Attack Variant 1: Overhead Claw Chop (Single Hammer Cleave)
            wFx = bx + f * 18;
            wFy = by - 54;
            wKx = bx + f * 12;
            wKy = by - 62;

            arcDx = f * 28;
            arcDy = -22;
            arcKx = f * 14;
            arcKy = -16;

            sFx = bx + f * 92;
            sFy = by + 8;
            sKx = bx + f * 46;
            sKy = by - 16;

            folDx = -f * 6;
            folDy = 4;
          } else {
            // Light Attack Variant 2: Rising Scythe Uppercut (Outward Crescent Hook)
            wFx = bx + f * 14;
            wFy = STICK.y + 4;
            wKx = bx + f * 8;
            wKy = by - 10;

            arcDx = f * 30;
            arcDy = 12;
            arcKx = f * 16;
            arcKy = 6;

            sFx = bx + f * 90;
            sFy = by - 48;
            sKx = bx + f * 44;
            sKy = by - 58;

            folDx = -f * 6;
            folDy = -5;
          }

          fx = baseFx + lp.wind * (wFx - baseFx) + lp.strike * (sFx - baseFx) + lp.arc * arcDx + lp.follow * folDx;
          fy = baseFy + lp.wind * (wFy - baseFy) + lp.strike * (sFy - baseFy) + lp.arc * arcDy + lp.follow * folDy;
          kx = baseKx + lp.wind * (wKx - baseKx) + lp.strike * (sKx - baseKx) + lp.arc * arcKx;
          ky = baseKy + lp.wind * (wKy - baseKy) + lp.strike * (sKy - baseKy) + lp.arc * arcKy;
          clawCol = s.power > 0 ? '#ffeaa7' : (s.leech > 0 ? '#ff6b81' : (isHeavy ? '#ff9f43' : colLight));
        } else if (s.atkT > 0 && i < 2) {
          // Non-attacking front legs:
          // In light attack: far lead leg (far && i === 0) and secondary legs (i === 1) stay grounded on the stick
          // In heavy attack: secondary legs (i === 1) plant with deep knee bend to support the 2-arm smash
          const bp = attackPose(s.atkT, isHeavy);
          fx = baseFx - f * (isHeavy ? (4 + bp.strike * 4) : 2);
          fy = STICK.y - 1;
          kx = (ax + fx) / 2 + f * (far ? 2 : 5);
          ky = Math.min(ay, fy) - (isHeavy ? (20 + bp.wind * 4 - bp.strike * 3) : 22);
        } else if (s.atkT > 0 && i >= 2) {
          // Rear legs (i = 2, 3) brace firmly on the twig during windup and drive/extend during the lunge
          const bp = attackPose(s.atkT, isHeavy);
          const bodyShiftX = bx - s.x;
          fx = baseFx - bodyShiftX * 0.75 - f * (bp.strike * (isHeavy ? 9 : 6) - bp.wind * (isHeavy ? 6 : 4));
          fy = STICK.y - 1;
          kx = (ax + fx) / 2 - f * (6 + bp.wind * 5 - bp.strike * 4);
          ky = Math.min(ay, fy) - 24 - bp.wind * 6 + bp.strike * 5;
        } else if (s.blocking && i >= 2) {
          // Rear legs plant deep and crouch back into the twig bark to brace against impact
          fx = baseFx - f * (6 + (i - 2) * 5);
          fy = STICK.y - 1;
          kx = baseKx - f * 6;
          ky = baseKy + 4;
        } else if (sweep > 0 && i < 2) {
          // Low 360-style spinning scythe sweep
          const reachSweep = Math.sin(sweep * Math.PI);
          const sweepPhase = sweep * Math.PI * 1.35 - (i * 0.35) - (far ? 0.2 : 0);
          fx = bx + f * (24 + Math.sin(sweepPhase) * (i === 0 ? 74 : 58));
          fy = lerp(STICK.y - 1, STICK.y + 3 - reachSweep * 10, reachSweep);
          kx = (ax + fx) / 2 + f * 8;
          ky = by - 12 - reachSweep * 8;
          clawCol = colLight;
        } else if (s.dashT > 0) {
          const burst = smoothMotion(Math.min(1, s.dashT / .16));
          if (i < 2) {
            fx = bx + f * (48 + (1 - i) * 20 + (far ? 6 : 0)) * (s.pounce ? 1.24 : 1);
            fy = by - 14 - (1 - i) * 10 - burst * (s.pounce ? 22 : 7);
            kx = bx + f * (22 + (1 - i) * 8);
            ky = by - 32 - burst * (s.pounce ? 16 : 8);
            clawCol = s.pounce ? '#ffd694' : colLight;
          } else {
            // Hind legs trail stretched behind during dash/pounce
            fx = bx - f * (28 + (i - 1) * 22) - f * burst * (s.pounce ? 20 : 12);
            fy = s.pounce ? STICK.y - 4 - burst * 9 : STICK.y - 1;
            kx = (ax + fx) / 2 - f * 8;
            ky = Math.min(ay, fy) - 18;
          }
        } else if (s.quake > 0) {
          // Dynamic slam-and-rebound over the 0.5s tremor duration
          const qProgress = 1 - s.quake / 0.5;
          const slam = qProgress < 0.22
            ? smoothMotion(qProgress / 0.22)
            : Math.max(0, 1 - smoothMotion((qProgress - 0.22) / 0.78));
          if (i < 2) {
            fx = bx + f * (44 + (1 - i) * 20);
            fy = STICK.y - 1 + slam * 3.5;
            kx = bx + f * (19 + (1 - i) * 8);
            ky = by - 10 - i * 3 + slam * 10;
          } else {
            fx = baseFx - f * slam * 8;
            fy = STICK.y - 1;
            kx = baseKx - f * slam * 4;
            ky = baseKy + slam * 6;
          }
        } else if (cast > 0 && i < 2) {
          if (proj.kind === 'hook') {
            // Harpoon launch brace: lead legs shoot straight out like a rail-launcher
            fx = bx + f * (48 + (1 - i) * 22 + cast * 24);
            fy = by - 10 - i * 6;
            kx = bx + f * (24 + (1 - i) * 10);
            ky = by - 28 - cast * 6;
            clawCol = '#ffffff';
          } else if (proj.kind === 'spit') {
            // Venom spit: front legs flare wide beside the fangs
            fx = bx + f * (34 + (1 - i) * 14 - cast * 6);
            fy = by - 26 - (1 - i) * 10 - cast * 10;
            kx = bx + f * (16 + (1 - i) * 6);
            ky = by - 44 - cast * 8;
            clawCol = '#9cf06a';
          } else {
            // Web cast: wide net-flinging arc
            fx = bx + f * (45 + (1 - i) * 18 + cast * 18);
            fy = by - 20 - (1 - i) * 12 - cast * 6;
            kx = bx + f * (20 + (1 - i) * 8);
            ky = by - 40 - cast * 6;
            clawCol = '#f3f7ee';
          }
        } else if ((powerBurst > 0 || leechBurst > 0) && i < 2) {
          // Battle-cry threat pose when activating Power Strike or Leech Fang
          const b = Math.max(powerBurst, leechBurst);
          fx = lerp(baseFx, bx + f * (26 + (1 - i) * 14 + (far ? 5 : 0)), b);
          fy = lerp(baseFy, by - (i === 0 ? 46 : 34), b);
          kx = lerp(baseKx, bx + f * (16 + (1 - i) * 6), b);
          ky = lerp(baseKy, by - (i === 0 ? 54 : 42), b);
          clawCol = powerBurst >= leechBurst ? '#ffb347' : '#ff4d6d';
        } else if (mendBurst > 0) {
          // Mend: spider presses and weaves silk onto the twig under its feet
          const press = Math.sin(mendBurst * Math.PI * 2 + i) * 4 * mendBurst;
          fx = baseFx + f * press;
          fy = STICK.y - 1;
          ky = baseKy + mendBurst * 5;
        } else if (carapaceBurst > 0 && i < 2) {
          // Carapace: armored shell guard brace
          fx = lerp(baseFx, bx + f * (28 + i * 10), carapaceBurst);
          fy = lerp(baseFy, by - 22 - i * 8, carapaceBurst);
          kx = lerp(baseKx, bx + f * (14 + i * 6), carapaceBurst);
          ky = lerp(baseKy, by - 42, carapaceBurst);
          clawCol = '#d4ecff';
        } else if ((s.blocking || s.shield > 0) && i < 2) {
          const isParryStance = s.parryT > 0 || (s.blockT !== undefined && s.blockT <= 0.08);
          const guardTension = Math.sin(t * 32) * (s.gLock ? 2.5 : 0.8);

          if (i === 0) {
            // Primary blocking forearms: raised high and crossed defensively in front of face & fangs
            if (!far) {
              // Foreground arm: raises high, elbow forward, claw angled down across chest
              fx = bx + f * 44;
              fy = by - 6 + guardTension;
              kx = bx + f * 26 + guardTension;
              ky = by - 52;
            } else {
              // Far arm: crosses behind/over the front arm to complete the defensive X-guard
              fx = bx + f * 42;
              fy = by - 16 - guardTension;
              kx = bx + f * 22 - guardTension;
              ky = by - 56;
            }
            clawCol = isParryStance ? '#ffffff' : colLight;
          } else {
            // Secondary arms: tucked in tight behind/underneath the primary guard arms
            fx = bx + f * (far ? 28 : 34);
            fy = STICK.y - 2;
            kx = bx + f * (far ? 14 : 18);
            ky = by - 36;
          }
        } else if (s.riposte > 0 && i < 2) {
          // Crossed X-blade counter guard
          fx = bx + f * (i === 0 ? 58 : 42);
          fy = by + (i === 0 ? 6 : -34);
          kx = bx + f * (24 + i * 6);
          ky = by - (i === 0 ? 32 : 18);
          clawCol = '#ffffff';
        } else if (s.cheer && i < 2) {
          fx = bx + f * (26 + i * 12) + Math.sin(t * 11 + i) * 5;
          fy = by - 44 + Math.cos(t * 9 + i) * 6;
          kx = bx + f * (18 + i * 6);
          ky = by - 54;
        }
      }

      if (isRealStun) {
        fx += Math.sin(t * 45 + i * 2) * 3;
        fy -= Math.abs(Math.sin(t * 40 + i)) * 4;
      }

      if (hb > 0.01) {
        const surgePull = surgeBurst.active ? surgeBurst.pulse : 0;
        const anchorBrace = s.anchorT > 0 ? Math.min(1, s.anchorT * 3) : 0;
        const climbRate = Math.max(2.4, (s.rate || 0) * 1.6 + (s.falling ? 1.0 : 0) + (s.pump || 0) * 2.2);
        const climbPhase = t * climbRate * Math.PI * 2 + (far ? Math.PI : 0);
        const reach = Math.sin(climbPhase);
        const lift = Math.max(0, Math.cos(climbPhase));
        const pumpLift = (s.pump || 0) * 6;

        let hx = baseFx;
        let hy = baseFy;
        let hkx = baseKx;
        let hky = baseKy;

        if (i === 0) {
          // Primary climbing arms (lead claws): reach high up along the vertical silk thread
          hx = bx + f * (46 + reach * 16 + pumpLift);
          hy = by + (far ? -5 : 5) - (far ? 1 : -1) * lift * 6;
          hkx = bx + f * (24 + reach * 8);
          hky = by + (far ? -26 : 26) - (far ? 1 : -1) * lift * 8;
          clawCol = colLight;
        } else if (i === 1) {
          // Secondary climbing arms: alternate with 90° phase shift
          const phase1 = climbPhase + Math.PI * 0.5;
          const reach1 = Math.sin(phase1);
          const lift1 = Math.max(0, Math.cos(phase1));
          hx = bx + f * (34 + reach1 * 12 + pumpLift * 0.6);
          hy = by + (far ? -7 : 7) - (far ? 1 : -1) * lift1 * 5;
          hkx = bx + f * (16 + reach1 * 6);
          hky = by + (far ? -32 : 32) - (far ? 1 : -1) * lift1 * 6;
          clawCol = colLight;
        } else if (i === 2) {
          // Middle stabilizer legs: grasp & guide thread beside the body
          const phase2 = climbPhase + Math.PI;
          const reach2 = Math.sin(phase2 * 0.8);
          hx = bx - f * (6 + reach2 * 8);
          hy = by + (far ? -22 : 22);
          hkx = bx - f * 8;
          hky = by + (far ? -36 : 36);
        } else {
          // Hind trailing legs: trail beneath the abdomen
          hx = bx - f * (38 + Math.sin(t * 5 + (far ? 2 : 0)) * 6);
          hy = by + (far ? -14 : 14) + Math.cos(t * 4 + i) * 3;
          hkx = bx - f * 20;
          hky = by + (far ? -26 : 26);
        }

        // Surge skill: front legs reach ultra-high and yank downward together
        if (surgePull > 0 && i < 2) {
          hx = bx + f * (58 + surgeBurst.progress * 10);
          hy = by + (far ? -4 : 4) * (1 - surgePull);
          hkx = bx + f * 28;
          hky = by + (far ? -18 : 18);
          clawCol = '#ffffff';
        } else if (anchorBrace > 0 && (i === 1 || i === 2)) {
          // Anchor Line: middle legs lock wide onto the silk line
          hx = bx + f * (i === 1 ? 16 : -16);
          hy = by + (far ? -36 : 36);
          hkx = bx + f * (i === 1 ? 6 : -6);
          hky = by + (far ? -44 : 44);
        }

        fx = lerp(fx, hx, hb);
        fy = lerp(fy, hy, hb);
        kx = lerp(kx, hkx, hb);
        ky = lerp(ky, hky, hb);
      }

      // Haste footwork blur arc on moving legs
      if (!far && s.hasteT > 0 && moving > 0.2 && !s.hang) {
        ctx.save();
        ctx.globalAlpha = 0.35;
        ctx.strokeStyle = '#70d6ff';
        ctx.lineWidth = 2.2;
        ctx.beginPath();
        ctx.arc(fx - f * 6, fy - 2, 7, Math.PI * 0.15, Math.PI * 0.85);
        ctx.stroke();
        ctx.restore();
      }

      const isArmBlocking = s.blocking && i === 0;
      const legWidth = far
        ? (isArmBlocking ? 3.8 : 3.2)
        : (i < 2 && (s.atkT > 0 || sweepArc > 0 || isArmBlocking) ? 4.8 : 4);
      const showClawTip = (!far || isArmBlocking) ? clawCol : undefined;

      this.legStroke(
        ctx,
        { x: ax, y: ay },
        { x: kx, y: ky },
        { x: fx, y: fy },
        legWidth,
        far ? colDark : colMain,
        showClawTip
      );

      // Lead claw windup telegraph glint star
      const isGlintClaw = isHeavy ? (i === 0) : (!far && i === 0);
      if (isGlintClaw && s.atkT > 0 && !s.hang) {
        const glint = attackPose(s.atkT, isHeavy).glint;
        if (glint > 0.15) {
          ctx.save();
          ctx.globalAlpha = glint * 0.9;
          ctx.strokeStyle = s.power > 0 ? '#ffeaa7' : (isHeavy ? '#ff9f43' : '#ffffff');
          ctx.lineWidth = isHeavy ? 2.4 : 1.8;
          const r = (isHeavy ? 6 : 4) + glint * (isHeavy ? 6 : 4);
          ctx.beginPath();
          ctx.moveTo(fx - r, fy);
          ctx.lineTo(fx + r, fy);
          ctx.moveTo(fx, fy - r);
          ctx.lineTo(fx, fy + r);
          ctx.stroke();
          ctx.restore();
        }
      }
    }
  }

  private drawSpider(ctx: CanvasRenderingContext2D, s: any, t: number) {
    const isAmber = s.id === 0;
    const colMain = s.color || (isAmber ? COLORS.amber : COLORS.jade);
    const colDark = s.colorDark || (isAmber ? COLORS.amberDark : COLORS.jadeDark);
    const colLight = s.colorLight || (isAmber ? COLORS.amberLight : COLORS.jadeLight);
    const pattern = s.pattern || 'stripes';
    const acc = s.acc || 'none';

    // Track recent power/leech buffs so active strikes keep their empowered visual trail even after hit consumption
    const slot = s.id === 1 ? 1 : 0;
    if (s.power > 0) this.powerTrailUntil[slot] = t + 0.36;
    if (s.leech > 0) this.leechTrailUntil[slot] = t + 0.36;
    const empoweredPower = s.power > 0 || t < this.powerTrailUntil[slot];
    const empoweredLeech = s.leech > 0 || t < this.leechTrailUntil[slot];

    const f = s.face;
    const hb = s.hb || 0;
    const isHeavy = !!s.isHeavy;
    const pose = s.atkT > 0 ? attackPose(s.atkT, isHeavy) : { wind: 0, strike: 0, arc: 0, swing: 0, follow: 0, glint: 0 };
    const sweep = this.sweepCast(s);
    const sweepArc = sweep > 0 ? Math.sin(sweep * Math.PI) : 0;
    const powerBurst = this.skillCast(s, 'power', 0.42);
    const shieldBurst = this.skillCast(s, 'shield', 0.42);
    const mendBurst = this.skillCast(s, 'mend', 0.55);
    const carapaceBurst = this.skillCast(s, 'carapace', 0.62);
    const leechBurst = this.skillCast(s, 'leech', 0.42);
    const hasteBurst = this.skillCast(s, 'haste', 0.4);
    const surgeBurst = this.skillCast(s, 'surge', 0.45);
    const anchorBurst = this.skillCast(s, 'anchor', 0.45);

    const atkType = (s.atkType !== undefined ? s.atkType : (s.atkId || 0)) % 3;
    const moving = Math.min(1, Math.abs(s.move || 0));
    const gait = gaitMotion(s.walkPhase || 0);
    const proj = this.projectileCastInfo(s);
    const cast = proj.amount;

    let atkXOffset = 0;
    let atkYOffset = 0;
    let abdomenTilt = 0;
    let abdomenScaleX = 1;
    let abdomenScaleY = 1;
    let headOffsetX = 0;
    let headOffsetY = 0;

    if (s.atkT > 0) {
      if (isHeavy) {
        // Heavy 2-arm Attack: massive rear-back on windup, powerful forward lunge on strike
        atkXOffset = -pose.wind * 14 + pose.strike * 20 + pose.arc * 5;
        atkYOffset = -pose.wind * 10 + pose.strike * 6 - pose.arc * 5;
        abdomenTilt = f * (pose.wind * 0.35 - pose.strike * 0.26);
        abdomenScaleX = 1 - pose.wind * 0.08 + pose.strike * 0.12;
        abdomenScaleY = 1 + pose.wind * 0.08 - pose.strike * 0.08;
        headOffsetX = f * (-pose.wind * 4 + pose.strike * 8);
        headOffsetY = -pose.wind * 6 + pose.strike * 4;
      } else if (atkType === 0) {
        // Light Attack Variant 0 (Snap Jab): sharp linear recoil and punch
        atkXOffset = -pose.wind * 8 + pose.strike * 15 + pose.arc * 3;
        atkYOffset = pose.wind * 1 - pose.strike * 1;
        abdomenTilt = f * (-pose.wind * 0.10 + pose.strike * 0.08);
        abdomenScaleX = 1 - pose.wind * 0.06 + pose.strike * 0.08;
        abdomenScaleY = 1 + pose.wind * 0.05 - pose.strike * 0.06;
        headOffsetX = f * (-pose.wind * 2 + pose.strike * 5);
        headOffsetY = -pose.strike * 1.5;
      } else if (atkType === 1) {
        // Light Attack Variant 1 (Overhead Chop): slight rear up and chop down
        atkXOffset = -pose.wind * 6 + pose.strike * 12 + pose.arc * 3;
        atkYOffset = -pose.wind * 6 + pose.strike * 3 - pose.arc * 3;
        abdomenTilt = f * (pose.wind * 0.20 - pose.strike * 0.14);
        abdomenScaleX = 1 - pose.wind * 0.05 + pose.strike * 0.06;
        abdomenScaleY = 1 + pose.wind * 0.05 - pose.strike * 0.05;
        headOffsetX = f * (-pose.wind * 2 + pose.strike * 4);
        headOffsetY = -pose.wind * 4 + pose.strike * 3;
      } else {
        // Light Attack Variant 2 (Rising Scythe Uppercut): low crouch against twig and scoop up
        atkXOffset = -pose.wind * 5 + pose.strike * 12 + pose.arc * 4;
        atkYOffset = pose.wind * 4 - pose.strike * 8 + pose.arc * 2;
        abdomenTilt = f * (-pose.wind * 0.16 + pose.strike * 0.20);
        abdomenScaleX = 1 + pose.wind * 0.04 + pose.strike * 0.05;
        abdomenScaleY = 1 - pose.wind * 0.05 - pose.strike * 0.04;
        headOffsetX = f * (pose.strike * 4);
        headOffsetY = pose.wind * 2.5 - pose.strike * 5;
      }
    } else if (sweepArc > 0) {
      atkXOffset = sweepArc * 11;
      atkYOffset = sweepArc * 3;
      abdomenTilt = -f * sweepArc * 0.18;
      abdomenScaleX = 1 + sweepArc * 0.08;
      headOffsetX = f * sweepArc * 4;
    } else if (s.dashT > 0) {
      const dashArc = Math.sin(Math.min(1, s.dashT / (s.pounce ? 0.14 : 0.16)) * Math.PI);
      atkYOffset = s.pounce ? -dashArc * 14 : -dashArc * 4;
      abdomenTilt = f * dashArc * (s.pounce ? 0.22 : -0.1);
      abdomenScaleX = 1 + dashArc * 0.09;
      abdomenScaleY = 1 - dashArc * 0.06;
      headOffsetY = s.pounce ? -dashArc * 5 : 0;
    } else if (cast > 0) {
      if (proj.kind === 'web') {
        abdomenTilt = f * cast * 0.24;
        abdomenScaleX = 1 + cast * 0.08;
      } else if (proj.kind === 'spit') {
        headOffsetX = f * cast * 5;
        headOffsetY = -cast * 3;
        abdomenTilt = -f * cast * 0.12;
      } else if (proj.kind === 'hook') {
        atkXOffset = -cast * 3;
        headOffsetX = f * cast * 6;
      }
    } else if (powerBurst.active || leechBurst.active) {
      const b = Math.max(powerBurst.pulse, leechBurst.pulse);
      atkYOffset = -b * 5;
      abdomenTilt = f * b * 0.18;
      headOffsetY = -b * 4;
    } else if (s.hasteT > 0 && moving > 0.1) {
      abdomenTilt = -f * 0.12 * moving;
      headOffsetX = f * 2.5 * moving;
    }

    if (s.blocking) {
      atkXOffset -= 2;
      headOffsetY += 3;
      abdomenTilt -= f * 0.14;
    }
    const bx = s.x + f * atkXOffset - (s.blocking ? f * 5 : 0) - f * cast * 4;
    let by = STICK.y - BODY_H + (s.blocking ? 5 : 0) + atkYOffset;
    by += Math.sin(t * 2.1 + s.id * 1.7) * .55 * (1 - moving) * (1 - hb);
    by -= gait.lift * 1.4 * moving;
    by -= cast * 2;
    const isRealStun = s.stun > 0 && !s.hang && sweep <= 0 && (s.stun > 0.26 || s.hitFlash > 0 || s.gLock);
    if (isRealStun) by += 3;

    const byW = BODY_Y + (s.drop || 0) + 26 * hb;
    let flip = lerp(-1, 1, hb);
    if (Math.abs(flip) < 0.06) flip = flip < 0 ? -0.06 : 0.06;

    ctx.save();
    if (s.inv > 0 && Math.floor(t * 18) % 2) ctx.globalAlpha = 0.55;

    // Silk thread & Hang Skill VFX (Surge & Anchor Line)
    if (hb > 0.04) {
      const tx = lerp(bx - f * 8, bx, hb);
      const ty = lerp(byW - 16, byW - 22, hb);
      const ax0 = clamp(s.x, STICK.l, STICK.r);
      const ay0 = STICK.y + STICK.th - 2;
      const anchored = s.anchorT > 0;
      const sway = anchored ? 0 : Math.sin(t * 2.2 + s.id) * Math.min(10, (s.drop || 0) * 0.08);
      const midX = ax0 + sway;
      const midY = (ay0 + ty) / 2;

      if (anchored) {
        // Anchor Line: reinforced glowing golden-cyan braided cable & twig lock clamp
        ctx.save();
        ctx.strokeStyle = 'rgba(90, 195, 255, 0.45)';
        ctx.lineWidth = 6;
        ctx.beginPath();
        ctx.moveTo(ax0, ay0);
        ctx.lineTo(tx, ty);
        ctx.stroke();

        ctx.strokeStyle = '#d4f1ff';
        ctx.lineWidth = 2.4;
        ctx.beginPath();
        ctx.moveTo(ax0, ay0);
        ctx.lineTo(tx, ty);
        ctx.stroke();

        // Cross-anchor grappling clamp on the twig bark
        ctx.strokeStyle = '#5aa9f0';
        ctx.fillStyle = '#e6f7ff';
        ctx.lineWidth = 2.2;
        ctx.beginPath();
        ctx.moveTo(ax0 - 14, ay0 - 2);
        ctx.lineTo(ax0 + 14, ay0 - 2);
        ctx.moveTo(ax0 - 9, ay0 + 5);
        ctx.lineTo(ax0, ay0 - 5);
        ctx.lineTo(ax0 + 9, ay0 + 5);
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(ax0, ay0, 3.8, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        // Horizontal silk stabilizer bar & lock ring near the spider
        const barY = byW - 20;
        const pulseA = 0.65 + 0.25 * Math.sin(t * 10);
        ctx.globalAlpha = pulseA;
        ctx.strokeStyle = '#70d6ff';
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.moveTo(bx - 36, barY);
        ctx.lineTo(bx + 36, barY);
        ctx.stroke();
        ctx.beginPath();
        ctx.ellipse(tx, barY, 16 + (anchorBurst.active ? anchorBurst.pulse * 12 : 0), 5, 0, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
      } else {
        ctx.strokeStyle = 'rgba(238,244,232,.85)';
        ctx.lineWidth = 1.6;
        ctx.beginPath();
        ctx.moveTo(ax0, ay0);
        ctx.quadraticCurveTo(midX, midY, tx, ty);
        ctx.stroke();
      }

      // Surge VFX: rising wind-vortex rings & upward tension streaks along silk thread
      if (surgeBurst.active) {
        ctx.save();
        const p = surgeBurst.progress;
        const pulse = surgeBurst.pulse;
        ctx.strokeStyle = '#70d6ff';
        ctx.lineWidth = 2.4;
        for (let r = 0; r < 3; r++) {
          const ringP = ((p * 1.4 + r * 0.28) % 1);
          const ry = lerp(byW + 18, ay0 + 12, ringP);
          const rx = lerp(tx, ax0, ringP);
          ctx.globalAlpha = (1 - ringP) * pulse * 0.9;
          ctx.beginPath();
          ctx.ellipse(rx, ry, 18 + (1 - ringP) * 14, 5, 0, 0, Math.PI * 2);
          ctx.stroke();
        }
        // Vertical lift speed lines around the rising spider
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2;
        [-28, -14, 14, 28].forEach((ox, idx) => {
          ctx.globalAlpha = pulse * 0.8;
          const sy = byW - 10 + ((idx % 2) * 12) + p * 28;
          ctx.beginPath();
          ctx.moveTo(bx + ox, sy);
          ctx.lineTo(bx + ox, sy + 26);
          ctx.stroke();
        });
        ctx.restore();
      }
    }

    ctx.translate(0, byW);
    ctx.scale(1, flip);
    ctx.translate(0, -(STICK.y - BODY_H));
    if (hb > 0.001) {
      const climbAngle = -f * (Math.PI / 2) * hb;
      ctx.translate(bx, by);
      ctx.rotate(climbAngle);
      ctx.translate(-bx, -by);
    }

    // Dash / Pounce translucent afterimage ghosts
    if (s.dashT > 0) {
      const dashDir = s.dashDir || f;
      const ghosts = s.pounce ? 3 : 2;
      for (let gIdx = ghosts; gIdx >= 1; gIdx--) {
        const gx = bx - dashDir * gIdx * (s.pounce ? 22 : 17);
        const gy = by + (s.pounce ? gIdx * 3.5 : 0);
        ctx.save();
        ctx.globalAlpha = (0.24 / gIdx) * Math.min(1, s.dashT / 0.12);
        ctx.fillStyle = s.pounce ? '#ffb347' : colLight;
        ctx.beginPath();
        ctx.ellipse(gx - f * 21, gy - 1, 21, 15, 0, 0, Math.PI * 2);
        ctx.ellipse(gx + f * 11, gy, 14, 13, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }
    }

    // Far legs
    this.drawLegs(ctx, s, bx, by, true, colMain, colDark, colLight);

    // Abdomen (with attack/skill pitch & squash/stretch)
    const cx = bx - f * 21 - f * (pose.strike * 2 - pose.wind * 1.5);
    const cy = by - 1 - pose.wind * 2 + pose.strike * 1.5;
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(abdomenTilt);
    ctx.scale(abdomenScaleX, abdomenScaleY);
    ctx.translate(-cx, -cy);

    ctx.save();
    ctx.beginPath();
    ctx.ellipse(cx, cy, 22, 17, 0, 0, Math.PI * 2);
    ctx.clip();
    const g = ctx.createRadialGradient(cx - f * 6, cy - 8, 2, cx, cy, 24);
    g.addColorStop(0, colLight);
    g.addColorStop(0.5, colMain);
    g.addColorStop(1, colDark);
    ctx.fillStyle = g;
    ctx.fillRect(cx - 30, cy - 24, 60, 48);

    // Pattern
    ctx.fillStyle = colDark;
    ctx.strokeStyle = colDark;
    if (pattern !== 'custom') ctx.globalAlpha *= .68;
    if (pattern === 'custom') {
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.lineWidth = 3.8;
      decodePatternArt(s.customPattern).forEach(stroke => {
        ctx.strokeStyle = stroke.color;
        ctx.fillStyle = stroke.color;
        ctx.beginPath();
        stroke.points.forEach(([x, y], index) => {
          const px = cx + f * (x - .5) * 44;
          const py = cy + (y - .5) * 34;
          if (index) ctx.lineTo(px, py); else ctx.moveTo(px, py);
        });
        if (stroke.points.length === 1) {
          ctx.arc(cx + f * (stroke.points[0][0] - .5) * 44, cy + (stroke.points[0][1] - .5) * 34, 2, 0, Math.PI * 2);
          ctx.fill();
        } else ctx.stroke();
      });
    } else if (pattern === 'dots') {
      // Leopard / Ladybug rosettes with light halo rings and varied sizes
      [
        [0, 0, 4.2],
        [-11, -6, 3.1], [-11, 6, 3.1],
        [10, -7, 3.2], [10, 6, 3.2],
        [-1, -12, 2.5], [-1, 12, 2.5],
        [-18, 0, 2.3]
      ].forEach(([dx, dy, r]) => {
        const px = cx + f * dx;
        const py = cy + dy;
        ctx.fillStyle = colLight;
        ctx.globalAlpha *= 0.55;
        ctx.beginPath();
        ctx.arc(px, py, r + 1.2, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha /= 0.55;

        ctx.fillStyle = colDark;
        ctx.beginPath();
        ctx.arc(px, py, r, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = colLight;
        ctx.globalAlpha *= 0.7;
        ctx.beginPath();
        ctx.arc(px - f * r * 0.28, py - r * 0.28, Math.max(0.8, r * 0.26), 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha /= 0.7;
      });
    } else if (pattern === 'chevron') {
      // Interlocking armored viper chevrons with light edge piping
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      [-13, -4, 5, 13].forEach((k, idx) => {
        const span = idx === 3 ? 9 : 13;
        ctx.strokeStyle = colLight;
        ctx.lineWidth = 5.2;
        ctx.globalAlpha *= 0.45;
        ctx.beginPath();
        ctx.moveTo(cx + f * (k - 6), cy - span);
        ctx.lineTo(cx + f * (k + 2), cy);
        ctx.lineTo(cx + f * (k - 6), cy + span);
        ctx.stroke();
        ctx.globalAlpha /= 0.45;

        ctx.strokeStyle = colDark;
        ctx.lineWidth = 3.6;
        ctx.beginPath();
        ctx.moveTo(cx + f * (k - 6), cy - span);
        ctx.lineTo(cx + f * (k + 2), cy);
        ctx.lineTo(cx + f * (k - 6), cy + span);
        ctx.stroke();
      });
    } else if (pattern === 'rings') {
      // Ocellus target bullseye with alternating dark & light rings
      ctx.strokeStyle = colDark;
      ctx.lineWidth = 3;
      [17.5, 10.5].forEach((r) => {
        ctx.beginPath();
        ctx.ellipse(cx, cy, r, r * 0.75, 0, 0, Math.PI * 2);
        ctx.stroke();
      });
      ctx.strokeStyle = colLight;
      ctx.lineWidth = 1.6;
      ctx.globalAlpha *= 0.65;
      ctx.beginPath();
      ctx.ellipse(cx, cy, 14, 10.5, 0, 0, Math.PI * 2);
      ctx.stroke();
      ctx.globalAlpha /= 0.65;

      ctx.fillStyle = colDark;
      ctx.strokeStyle = colLight;
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      ctx.ellipse(cx, cy, 5.5, 4.2, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = colLight;
      ctx.beginPath();
      ctx.arc(cx - f * 1.2, cy - 1, 1.5, 0, Math.PI * 2);
      ctx.fill();
    } else if (pattern === 'cross') {
      // Ornate Argiope St. Andrew's cross with central diamond medallion
      ctx.fillStyle = colDark;
      ctx.strokeStyle = colLight;
      ctx.lineWidth = 1.2;
      ctx.fillRect(cx - 3.5, cy - 18, 7, 36);
      ctx.fillRect(cx - 17, cy - 3.5, 34, 7);
      ctx.strokeRect(cx - 3.5, cy - 18, 7, 36);
      ctx.strokeRect(cx - 17, cy - 3.5, 34, 7);

      ctx.fillStyle = colLight;
      ctx.beginPath();
      ctx.moveTo(cx, cy - 7);
      ctx.lineTo(cx + 7, cy);
      ctx.lineTo(cx, cy + 7);
      ctx.lineTo(cx - 7, cy);
      ctx.closePath();
      ctx.fill();

      ctx.fillStyle = colDark;
      ctx.beginPath();
      ctx.moveTo(cx, cy - 4.2);
      ctx.lineTo(cx + 4.2, cy);
      ctx.lineTo(cx, cy + 4.2);
      ctx.lineTo(cx - 4.2, cy);
      ctx.closePath();
      ctx.fill();
    } else if (pattern === 'split') {
      // Harlequin dual-tone split with central crest & counter-dots
      ctx.fillStyle = colDark;
      ctx.fillRect(cx - 30, cy - 24, 60, 24);
      ctx.strokeStyle = colLight;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(cx - 24, cy - 0.5);
      ctx.lineTo(cx + 24, cy - 0.5);
      ctx.stroke();
      ctx.strokeStyle = colDark;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(cx - 24, cy + 1.5);
      ctx.lineTo(cx + 24, cy + 1.5);
      ctx.stroke();

      ctx.fillStyle = colLight;
      [-9, 9].forEach((dx) => {
        ctx.beginPath();
        ctx.arc(cx + dx, cy - 8, 2.3, 0, Math.PI * 2);
        ctx.fill();
      });
      ctx.fillStyle = colDark;
      [-9, 9].forEach((dx) => {
        ctx.beginPath();
        ctx.arc(cx + dx, cy + 8, 2.4, 0, Math.PI * 2);
        ctx.fill();
      });
    } else if (pattern === 'webmark') {
      // Scalloped radial orb-web lattice with dew-drop center
      ctx.strokeStyle = colDark;
      ctx.lineWidth = 1.8;
      for (let a = 0; a < 8; a++) {
        const rad = a * Math.PI / 4;
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.lineTo(cx + Math.cos(rad) * 26, cy + Math.sin(rad) * 20);
        ctx.stroke();
      }
      [6.5, 13, 19.5].forEach((r) => {
        ctx.beginPath();
        for (let a = 0; a <= 8; a++) {
          const rad = a * Math.PI / 4;
          const px = cx + Math.cos(rad) * r;
          const py = cy + Math.sin(rad) * (r * 0.76);
          if (a === 0) {
            ctx.moveTo(px, py);
          } else {
            const midRad = (a - 0.5) * Math.PI / 4;
            const qx = cx + Math.cos(midRad) * (r * 0.85);
            const qy = cy + Math.sin(midRad) * (r * 0.76 * 0.85);
            ctx.quadraticCurveTo(qx, qy, px, py);
          }
        }
        ctx.stroke();
      });
      ctx.fillStyle = colLight;
      ctx.beginPath();
      ctx.arc(cx, cy, 2.2, 0, Math.PI * 2);
      ctx.fill();
    } else if (pattern === 'diamonds') {
      // Royal Argyle diamond chain with inner light cores
      [-12, 0, 12].forEach((dx, idx) => {
        const h = idx === 1 ? 11.5 : 9.5;
        const w = idx === 1 ? 6.2 : 5;
        ctx.fillStyle = colDark;
        ctx.strokeStyle = colLight;
        ctx.lineWidth = 1.1;
        ctx.beginPath();
        ctx.moveTo(cx + dx, cy - h);
        ctx.lineTo(cx + dx + w, cy);
        ctx.lineTo(cx + dx, cy + h);
        ctx.lineTo(cx + dx - w, cy);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = colLight;
        ctx.globalAlpha *= 0.65;
        ctx.beginPath();
        ctx.moveTo(cx + dx, cy - h * 0.42);
        ctx.lineTo(cx + dx + w * 0.42, cy);
        ctx.lineTo(cx + dx, cy + h * 0.42);
        ctx.lineTo(cx + dx - w * 0.42, cy);
        ctx.closePath();
        ctx.fill();
        ctx.globalAlpha /= 0.65;
      });
    } else if (pattern !== 'plain') {
      // Tapered tiger stripes with dorsal spine & light contour rim
      ctx.strokeStyle = colDark;
      ctx.lineWidth = 2;
      ctx.globalAlpha *= 0.55;
      ctx.beginPath();
      ctx.moveTo(cx - 20, cy);
      ctx.lineTo(cx + 20, cy);
      ctx.stroke();
      ctx.globalAlpha /= 0.55;

      [-12, -4, 4, 11].forEach((k, idx) => {
        const w = idx === 1 || idx === 2 ? 3.8 : 2.8;
        const x0 = cx + f * k;
        ctx.strokeStyle = colLight;
        ctx.lineWidth = w + 1.4;
        ctx.globalAlpha *= 0.4;
        ctx.beginPath();
        ctx.moveTo(x0 + f * 2, cy - 18);
        ctx.quadraticCurveTo(x0 - f * 4, cy, x0 + f * 2, cy + 18);
        ctx.stroke();
        ctx.globalAlpha /= 0.4;

        ctx.strokeStyle = colDark;
        ctx.lineWidth = w;
        ctx.beginPath();
        ctx.moveTo(x0 + f * 2, cy - 18);
        ctx.quadraticCurveTo(x0 - f * 4, cy, x0 + f * 2, cy + 18);
        ctx.stroke();
      });
    }
    ctx.restore();

    ctx.beginPath();
    ctx.ellipse(cx, cy, 22, 17, 0, 0, Math.PI * 2);
    ctx.strokeStyle = COLORS.outline;
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.strokeStyle = colLight;
    ctx.globalAlpha *= .28;
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.ellipse(cx - f * 3, cy - 3, 16, 10, -.2 * f, Math.PI * 1.08, Math.PI * 1.72);
    ctx.stroke();
    ctx.globalAlpha /= .28;

    if (s.hitFlash > 0) {
      ctx.fillStyle = `rgba(255,255,255,${(s.hitFlash / 0.2 * 0.7).toFixed(2)})`;
      ctx.beginPath();
      ctx.ellipse(cx, cy, 22, 17, 0, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();

    // Cephalothorax (head/chest) with attack lunge & pitch
    const hx2 = bx + f * 11 + headOffsetX;
    const hy2 = by + headOffsetY;
    const g2 = ctx.createRadialGradient(hx2 - f * 4, hy2 - 6, 1, hx2, hy2, 17);
    g2.addColorStop(0, colMain);
    g2.addColorStop(1, colDark);
    ctx.fillStyle = g2;
    ctx.strokeStyle = COLORS.outline;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.ellipse(hx2, hy2, 15 + pose.strike * 1.2, 14 - pose.strike * 0.6, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    if (s.hitFlash > 0) {
      ctx.fillStyle = `rgba(255,255,255,${(s.hitFlash / 0.2 * 0.7).toFixed(2)})`;
      ctx.beginPath();
      ctx.ellipse(hx2, hy2, 15, 14, 0, 0, Math.PI * 2);
      ctx.fill();
    }

    // Carapace Skill Overlay: Crystalline metallic chitin armor plates & hexagon flash
    if (carapaceBurst.active) {
      ctx.save();
      const cp = carapaceBurst.pulse;
      ctx.globalAlpha = cp * 0.85;
      ctx.strokeStyle = '#d4ecff';
      ctx.fillStyle = 'rgba(143, 183, 214, 0.35)';
      ctx.lineWidth = 2.4;

      // Armored shell plates over abdomen and cephalothorax
      ctx.beginPath();
      ctx.ellipse(cx, cy, 24.5, 19, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.beginPath();
      ctx.ellipse(hx2, hy2, 17, 15.5, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // Interlocking chevron armor ribs on abdomen
      [-10, 0, 10].forEach((ox) => {
        ctx.beginPath();
        ctx.moveTo(cx + ox - f * 5, cy - 14);
        ctx.lineTo(cx + ox + f * 4, cy);
        ctx.lineTo(cx + ox - f * 5, cy + 14);
        ctx.stroke();
      });

      // Expanding hexagonal bulwark ring
      const hexR = 26 + carapaceBurst.progress * 34;
      ctx.globalAlpha = (1 - carapaceBurst.progress) * 0.9;
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      for (let h = 0; h <= 6; h++) {
        const ang = (h * Math.PI) / 3;
        const px = bx - f * 4 + Math.cos(ang) * hexR;
        const py = by + Math.sin(ang) * (hexR * 0.75);
        if (h === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.stroke();
      ctx.restore();
    }

    // Near legs
    this.drawLegs(ctx, s, bx, by, false, colMain, colDark, colLight);

    // Eyes
    const dazed = isRealStun || s.ko;
    const eyes: Array<[number, number, number]> = [
      [0, -3, 2.5], [9, -2.5, 2.3], [-7, -2, 1.35], [14, 1, 1.3],
      [-6, -10, 1.05], [0, -12, 1.1], [7, -11, 1.05], [13, -7, 1]
    ];
    eyes.forEach(([ex0, ey0, er]) => {
      const ex = hx2 + f * ex0;
      const ey = hy2 + ey0;
      if (dazed) {
        ctx.strokeStyle = '#10201f';
        ctx.lineWidth = 1.6;
        ctx.beginPath();
        ctx.moveTo(ex - 2, ey - 2);
        ctx.lineTo(ex + 2, ey + 2);
        ctx.moveTo(ex + 2, ey - 2);
        ctx.lineTo(ex - 2, ey + 2);
        ctx.stroke();
      } else {
        ctx.fillStyle = '#07100f';
        ctx.strokeStyle = empoweredPower ? '#ffd34d' : (empoweredLeech ? '#ff6b81' : colLight);
        ctx.lineWidth = .7;
        ctx.beginPath();
        ctx.arc(ex, ey, er, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        ctx.fillStyle = '#f4f7ee';
        ctx.beginPath();
        ctx.arc(ex - f * er * .28, ey - er * .28, Math.max(.28, er * .24), 0, Math.PI * 2);
        ctx.fill();
      }
    });

    // Accessories
    if (acc === 'band') {
      // Martial Headband with fluttering tails & metallic brow plate
      const tailLag = pose.strike * 6 - pose.wind * 3 + (s.hasteT > 0 ? 5 : 0);
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      // Ribbon tails
      ctx.strokeStyle = COLORS.outline;
      ctx.lineWidth = 4.6;
      ctx.beginPath();
      ctx.moveTo(hx2 - f * 9, hy2 - 10);
      ctx.lineTo(hx2 - f * (23 + tailLag), hy2 - 13 + Math.sin(t * 8) * 3);
      ctx.moveTo(hx2 - f * 9, hy2 - 9);
      ctx.lineTo(hx2 - f * (22 + tailLag), hy2 - 3 + Math.sin(t * 8 + 1.2) * 3);
      ctx.stroke();

      ctx.strokeStyle = '#e84118';
      ctx.lineWidth = 2.8;
      ctx.stroke();

      // Main headband wrap
      ctx.strokeStyle = COLORS.outline;
      ctx.lineWidth = 6.8;
      ctx.beginPath();
      ctx.moveTo(hx2 - f * 10, hy2 - 10);
      ctx.quadraticCurveTo(hx2 + f * 3, hy2 - 15, hx2 + f * 14, hy2 - 9);
      ctx.stroke();

      ctx.strokeStyle = '#e84118';
      ctx.lineWidth = 4.6;
      ctx.stroke();

      // Metallic forehead plate
      ctx.fillStyle = '#dfe6e9';
      ctx.strokeStyle = COLORS.outline;
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.roundRect(hx2 + f * 2 - 5, hy2 - 14.5, 10, 4.5, 1.5);
      ctx.fill();
      ctx.stroke();
    } else if (acc === 'crown') {
      // Royal Jewelled Crown with crimson velvet base, spires, pearls & gems
      const cb = hy2 - 11;
      ctx.fillStyle = '#ffd34d';
      ctx.strokeStyle = COLORS.outline;
      ctx.lineWidth = 1.6;
      ctx.lineJoin = 'round';
      ctx.beginPath();
      ctx.moveTo(hx2 - 10, cb);
      ctx.lineTo(hx2 - 11, cb - 11);
      ctx.lineTo(hx2 - 5, cb - 5);
      ctx.lineTo(hx2, cb - 14);
      ctx.lineTo(hx2 + 5, cb - 5);
      ctx.lineTo(hx2 + 11, cb - 11);
      ctx.lineTo(hx2 + 10, cb);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Velvet base band
      ctx.fillStyle = '#c23616';
      ctx.beginPath();
      ctx.roundRect(hx2 - 10.5, cb - 2.5, 21, 3.2, 1.2);
      ctx.fill();
      ctx.stroke();

      // Spire pearls & center ruby
      ctx.fillStyle = '#fff9d2';
      [[-11, -11.5, 1.5], [0, -14.8, 1.8], [11, -11.5, 1.5]].forEach(([ox, oy, r]) => {
        ctx.beginPath();
        ctx.arc(hx2 + ox, cb + oy, r, 0, Math.PI * 2);
        ctx.fill();
      });
      ctx.fillStyle = '#e84118';
      ctx.beginPath();
      ctx.arc(hx2, cb - 5.5, 1.6, 0, Math.PI * 2);
      ctx.fill();
    } else if (acc === 'horns') {
      // Curved segmented demon/oni horns with brow sockets
      const hb0 = hy2 - 10;
      ctx.fillStyle = '#f4efe0';
      ctx.strokeStyle = COLORS.outline;
      ctx.lineWidth = 1.5;
      ctx.lineJoin = 'round';
      [-1, 1].forEach((sg) => {
        ctx.beginPath();
        ctx.moveTo(hx2 + sg * 12, hb0 + 2);
        ctx.quadraticCurveTo(hx2 + sg * 15, hb0 - 8, hx2 + sg * 8, hb0 - 15);
        ctx.quadraticCurveTo(hx2 + sg * 7, hb0 - 6, hx2 + sg * 3, hb0);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // Horn ridge rings
        ctx.strokeStyle = '#b8ad94';
        ctx.lineWidth = 1.1;
        ctx.beginPath();
        ctx.moveTo(hx2 + sg * 11, hb0 - 3);
        ctx.lineTo(hx2 + sg * 6, hb0 - 4);
        ctx.moveTo(hx2 + sg * 11, hb0 - 7);
        ctx.lineTo(hx2 + sg * 7, hb0 - 8);
        ctx.stroke();
        ctx.strokeStyle = COLORS.outline;
        ctx.lineWidth = 1.5;
      });
    } else if (acc === 'goggles') {
      // Steampunk Aviator Goggles with leather strap, brass rims & lens glints
      const gb = hy2 - 6;
      ctx.strokeStyle = COLORS.outline;
      ctx.lineWidth = 4.2;
      ctx.beginPath();
      ctx.moveTo(hx2 - f * 13, gb);
      ctx.quadraticCurveTo(hx2, gb - 5, hx2 + f * 15, gb);
      ctx.stroke();
      ctx.strokeStyle = '#6d4c41';
      ctx.lineWidth = 2.6;
      ctx.stroke();

      const drawLens = (lx: number, ly: number, r: number) => {
        ctx.fillStyle = '#d4af37';
        ctx.strokeStyle = COLORS.outline;
        ctx.lineWidth = 1.4;
        ctx.beginPath();
        ctx.arc(lx, ly, r, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        ctx.fillStyle = '#00cec9';
        ctx.beginPath();
        ctx.arc(lx, ly, r * 0.72, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1.3;
        ctx.beginPath();
        ctx.moveTo(lx - 2, ly - 1.5);
        ctx.lineTo(lx + 1, ly - 2.5);
        ctx.stroke();
      };

      const gx1 = hx2 - f * 2;
      const gy1 = gb - 1;
      const gx2 = hx2 + f * 7.5;
      const gy2 = gb + 1;
      drawLens(gx1, gy1, 5.2);
      drawLens(gx2, gy2, 5.4);

      ctx.strokeStyle = '#d4af37';
      ctx.lineWidth = 2.2;
      ctx.beginPath();
      ctx.moveTo(gx1 + f * 4, gy1);
      ctx.lineTo(gx2 - f * 4, gy2);
      ctx.stroke();
    } else if (acc === 'halo') {
      // Radiant Celestial Halo with outer glow & star-sparks
      const hly = hy2 - 19 + Math.sin(t * 3.5) * 1.5;
      ctx.save();
      ctx.strokeStyle = 'rgba(243, 156, 18, 0.4)';
      ctx.lineWidth = 5;
      ctx.beginPath();
      ctx.ellipse(hx2, hly, 14, 4.5, 0, 0, Math.PI * 2);
      ctx.stroke();

      ctx.strokeStyle = '#ffeaa7';
      ctx.lineWidth = 2.8;
      ctx.beginPath();
      ctx.ellipse(hx2, hly, 13, 4, 0, 0, Math.PI * 2);
      ctx.stroke();

      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.ellipse(hx2, hly, 11.5, 3, 0, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    } else if (acc === 'mohawk') {
      // Punk-Rock Mohawk with dark scalp strip & vibrant spikes
      const mb = hy2 - 10;
      ctx.strokeStyle = '#2d3436';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(hx2 - f * 10, mb + 1);
      ctx.quadraticCurveTo(hx2, mb - 3, hx2 + f * 11, mb + 2);
      ctx.stroke();

      ctx.strokeStyle = COLORS.outline;
      ctx.lineWidth = 1.4;
      ctx.lineJoin = 'round';
      const colors = ['#ff2d55', '#ff793f', '#ffd34d', '#ff2d55', '#ff793f'];
      [
        { dx: -9, dy: -10, w: 4 },
        { dx: -4, dy: -15, w: 4.8 },
        { dx: 1.5, dy: -14, w: 4.8 },
        { dx: 6.5, dy: -10, w: 4.2 },
        { dx: 10.5, dy: -6, w: 3.4 }
      ].forEach((spike, idx) => {
        ctx.fillStyle = colors[idx];
        ctx.beginPath();
        ctx.moveTo(hx2 + f * (spike.dx - spike.w / 2), mb);
        ctx.lineTo(hx2 + f * spike.dx, mb + spike.dy);
        ctx.lineTo(hx2 + f * (spike.dx + spike.w / 2), mb);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
      });
    } else if (acc === 'mask') {
      // Shinobi Ninja Faceplate with metallic bridge & crimson clan stripes
      ctx.fillStyle = '#1e272e';
      ctx.strokeStyle = COLORS.outline;
      ctx.lineWidth = 1.5;
      ctx.lineJoin = 'round';
      ctx.beginPath();
      ctx.moveTo(hx2 - f * 5, hy2 - 1);
      ctx.lineTo(hx2 + f * 15, hy2 - 1);
      ctx.lineTo(hx2 + f * 17, hy2 + 9.5);
      ctx.lineTo(hx2 + f * 1, hy2 + 9.5);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      ctx.strokeStyle = '#57606f';
      ctx.lineWidth = 1.3;
      ctx.beginPath();
      ctx.moveTo(hx2 - f * 3, hy2 + 0.5);
      ctx.lineTo(hx2 + f * 14, hy2 + 0.5);
      ctx.stroke();

      ctx.strokeStyle = '#ff4757';
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      ctx.moveTo(hx2 + f * 2, hy2 + 4);
      ctx.lineTo(hx2 + f * 14, hy2 + 4.5);
      ctx.moveTo(hx2 + f * 1, hy2 + 7);
      ctx.lineTo(hx2 + f * 13, hy2 + 7.5);
      ctx.stroke();
    } else if (acc === 'tophat') {
      // Gentleman's Stovepipe Top Hat with crimson ribbon & gold buckle
      const ty = hy2 - 11;
      ctx.fillStyle = '#1e272e';
      ctx.strokeStyle = COLORS.outline;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.ellipse(hx2, ty, 13.5, 3.5, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = '#2f3542';
      ctx.fillRect(hx2 - 7.5, ty - 15, 15, 15);
      ctx.strokeRect(hx2 - 7.5, ty - 15, 15, 15);

      ctx.fillStyle = '#e84118';
      ctx.fillRect(hx2 - 7.5, ty - 4.5, 15, 3.5);

      ctx.strokeStyle = '#ffd34d';
      ctx.lineWidth = 1.2;
      ctx.strokeRect(hx2 - 2, ty - 4.8, 4, 4);

      ctx.fillStyle = '#1e272e';
      ctx.strokeStyle = COLORS.outline;
      ctx.beginPath();
      ctx.ellipse(hx2, ty - 15, 7.5, 2, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    } else if (acc === 'samurai') {
      // Japanese Samurai Kabuto Helm with golden crescent Maedate crest
      const ky = hy2 - 9;
      ctx.fillStyle = '#c23616';
      ctx.strokeStyle = COLORS.outline;
      ctx.lineWidth = 1.4;
      ctx.lineJoin = 'round';
      [-1, 1].forEach((sg) => {
        ctx.beginPath();
        ctx.moveTo(hx2 + sg * 12, ky);
        ctx.lineTo(hx2 + sg * 16, ky + 6);
        ctx.lineTo(hx2 + sg * 9, ky + 4);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
      });

      ctx.fillStyle = '#2f3542';
      ctx.beginPath();
      ctx.arc(hx2, ky, 13.5, Math.PI, 0);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      ctx.strokeStyle = '#ffd34d';
      ctx.lineWidth = 2.2;
      ctx.beginPath();
      ctx.moveTo(hx2 - 14.5, ky);
      ctx.quadraticCurveTo(hx2, ky - 3.5, hx2 + 14.5, ky);
      ctx.stroke();

      // Golden crescent crest
      ctx.fillStyle = '#ffd34d';
      ctx.strokeStyle = COLORS.outline;
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.arc(hx2 + f * 2, ky - 11, 7.5, 0.15 * Math.PI, 0.85 * Math.PI, true);
      ctx.quadraticCurveTo(hx2 + f * 2, ky - 9, hx2 + f * 2 - 7, ky - 14);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    } else if (acc === 'wizard') {
      // Arcane Wizard Hat with wide brim, bent cone & golden starband
      const wy = hy2 - 10;
      ctx.fillStyle = '#341f97';
      ctx.strokeStyle = COLORS.outline;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.ellipse(hx2, wy, 15.5, 3.8, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = '#5f27cd';
      ctx.lineJoin = 'round';
      ctx.beginPath();
      ctx.moveTo(hx2 - 10, wy - 1);
      ctx.quadraticCurveTo(hx2 - 6, wy - 14, hx2 - f * 8, wy - 20);
      ctx.quadraticCurveTo(hx2 + 3, wy - 12, hx2 + 10, wy - 1);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      ctx.strokeStyle = '#ffd34d';
      ctx.lineWidth = 2.4;
      ctx.beginPath();
      ctx.moveTo(hx2 - 9.5, wy - 2.5);
      ctx.quadraticCurveTo(hx2, wy - 5, hx2 + 9.5, wy - 2.5);
      ctx.stroke();

      ctx.fillStyle = '#ffeaa7';
      ctx.beginPath();
      ctx.arc(hx2 - f * 1.5, wy - 9, 1.5, 0, Math.PI * 2);
      ctx.arc(hx2 + f * 2.5, wy - 13, 1.1, 0, Math.PI * 2);
      ctx.fill();
    } else if (acc === 'pirate') {
      // Swashbuckling Pirate Tricorne with crimson bandana & skull emblem
      const py = hy2 - 10;
      ctx.strokeStyle = '#e84118';
      ctx.lineWidth = 3.5;
      ctx.beginPath();
      ctx.moveTo(hx2 - 12, py + 1.5);
      ctx.quadraticCurveTo(hx2, py - 2, hx2 + 12, py + 1.5);
      ctx.stroke();

      ctx.fillStyle = '#1e272e';
      ctx.strokeStyle = COLORS.outline;
      ctx.lineWidth = 1.5;
      ctx.lineJoin = 'round';
      ctx.beginPath();
      ctx.moveTo(hx2 - 16, py);
      ctx.quadraticCurveTo(hx2 - 8, py - 13, hx2, py - 14);
      ctx.quadraticCurveTo(hx2 + 8, py - 13, hx2 + 16, py);
      ctx.quadraticCurveTo(hx2, py - 4, hx2 - 16, py);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      ctx.strokeStyle = '#ffd34d';
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.moveTo(hx2 - 15, py - 0.5);
      ctx.quadraticCurveTo(hx2 - 8, py - 12, hx2, py - 13);
      ctx.quadraticCurveTo(hx2 + 8, py - 12, hx2 + 15, py - 0.5);
      ctx.stroke();

      ctx.fillStyle = '#f5f6fa';
      ctx.beginPath();
      ctx.arc(hx2, py - 6.5, 2.4, 0, Math.PI * 2);
      ctx.fill();
    } else if (acc === 'visor') {
      // Cyberpunk Neon Wraparound Visor with HUD scanline glint
      const vy = hy2 - 3;
      ctx.fillStyle = '#00cec9';
      ctx.strokeStyle = COLORS.outline;
      ctx.lineWidth = 1.5;
      ctx.lineJoin = 'round';
      ctx.beginPath();
      ctx.moveTo(hx2 - f * 10, vy - 2);
      ctx.quadraticCurveTo(hx2 + f * 3, vy - 7, hx2 + f * 15, vy - 1);
      ctx.lineTo(hx2 + f * 13.5, vy + 4.5);
      ctx.quadraticCurveTo(hx2 + f * 2, vy, hx2 - f * 9, vy + 3);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      ctx.strokeStyle = '#dfe6e9';
      ctx.lineWidth = 1.8;
      ctx.beginPath();
      ctx.moveTo(hx2 - f * 11, vy - 2.5);
      ctx.quadraticCurveTo(hx2 + f * 3, vy - 7.5, hx2 + f * 15.5, vy - 1.5);
      ctx.stroke();

      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1.3;
      ctx.beginPath();
      ctx.moveTo(hx2 - f * 3, vy - 1);
      ctx.lineTo(hx2 + f * 9, vy - 1.5);
      ctx.stroke();
    } else if (acc === 'strawhat') {
      // Ronin Woven Conical Bamboo Hat (Salakot) with red top-knot
      const sy = hy2 - 10;
      ctx.fillStyle = '#e1b12c';
      ctx.strokeStyle = COLORS.outline;
      ctx.lineWidth = 1.5;
      ctx.lineJoin = 'round';
      ctx.beginPath();
      ctx.moveTo(hx2 - 18, sy);
      ctx.lineTo(hx2, sy - 15);
      ctx.lineTo(hx2 + 18, sy);
      ctx.quadraticCurveTo(hx2, sy - 3.5, hx2 - 18, sy);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      ctx.strokeStyle = '#b5830a';
      ctx.lineWidth = 1.1;
      [-9, 0, 9].forEach((ox) => {
        ctx.beginPath();
        ctx.moveTo(hx2, sy - 14.5);
        ctx.lineTo(hx2 + ox, sy - 1);
        ctx.stroke();
      });

      ctx.fillStyle = '#c23616';
      ctx.strokeStyle = COLORS.outline;
      ctx.beginPath();
      ctx.ellipse(hx2, sy - 15, 2.6, 1.3, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    } else if (acc === 'headphones') {
      // Pro Gaming Headset with cushioned arch & neon earcups
      ctx.strokeStyle = COLORS.outline;
      ctx.lineWidth = 4.4;
      ctx.beginPath();
      ctx.arc(hx2, hy2 - 1, 13.5, Math.PI * 1.05, Math.PI * 1.95);
      ctx.stroke();

      ctx.strokeStyle = '#2f3542';
      ctx.lineWidth = 2.6;
      ctx.stroke();

      ctx.strokeStyle = '#00cec9';
      ctx.lineWidth = 1.8;
      ctx.beginPath();
      ctx.arc(hx2, hy2 - 1, 13.5, Math.PI * 1.35, Math.PI * 1.65);
      ctx.stroke();

      [-13, 13].forEach((ox) => {
        ctx.fillStyle = '#1e272e';
        ctx.strokeStyle = COLORS.outline;
        ctx.lineWidth = 1.4;
        ctx.beginPath();
        ctx.ellipse(hx2 + ox, hy2, 3.4, 5.4, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = '#00cec9';
        ctx.beginPath();
        ctx.ellipse(hx2 + ox, hy2, 1.8, 3.4, 0, 0, Math.PI * 2);
        ctx.fill();
      });
    }

    // Articulated Pedipalps & Dual Curved Fangs (Chelicerae)
    const fangOpen = pose.wind * 5 - pose.strike * 2.5 + cast * 3.5 + (powerBurst.active ? powerBurst.pulse * 4 : 0) + (leechBurst.active ? leechBurst.pulse * 4.5 : 0);
    const fangReach = pose.strike * 7 - pose.wind * 2 + cast * 4 + (s.power > 0 ? 2 : 0) + (s.leech > 0 ? 2 : 0);
    const fangTipCol = empoweredPower ? '#ffd34d' : (empoweredLeech ? '#ff4d6d' : '#e9efd8');

    // Far fang (slightly behind)
    ctx.fillStyle = '#0b1716';
    ctx.strokeStyle = COLORS.outline;
    ctx.lineWidth = 1.1;
    ctx.beginPath();
    ctx.moveTo(hx2 + f * 12, hy2 - 1);
    ctx.quadraticCurveTo(
      hx2 + f * (19 + fangReach * 0.7),
      hy2 - 4 - fangOpen * 0.8,
      hx2 + f * (23 + fangReach * 0.9),
      hy2 + 2 - fangOpen * 0.5
    );
    ctx.lineTo(hx2 + f * 14, hy2 + 4);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Near primary curved fang
    let nearFangTipY = hy2 + 7 + fangOpen * 0.4;
    if (s.atkT > 0) {
      if (isHeavy) nearFangTipY = hy2 + 10 - pose.wind * 9 + pose.strike * 6;
      else if (atkType === 0) nearFangTipY = hy2 + 4 - pose.wind * 3 + pose.strike * 1;
      else if (atkType === 1) nearFangTipY = hy2 + 9 - pose.wind * 7 + pose.strike * 4;
      else nearFangTipY = hy2 + 8 + pose.wind * 3 - pose.strike * 9;
    }
    const nearFangTipX = hx2 + f * (21 + fangReach);

    ctx.fillStyle = '#152826';
    ctx.strokeStyle = COLORS.outline;
    ctx.lineWidth = 1.3;
    ctx.beginPath();
    ctx.moveTo(hx2 + f * 11, hy2 + 2);
    ctx.quadraticCurveTo(
      hx2 + f * (18 + fangReach * 0.6),
      hy2 + 1 - fangOpen * 0.5,
      nearFangTipX,
      nearFangTipY
    );
    ctx.quadraticCurveTo(
      hx2 + f * (15 + fangReach * 0.3),
      hy2 + 9,
      hx2 + f * 11,
      hy2 + 7
    );
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Razor fang tip highlight
    ctx.strokeStyle = fangTipCol;
    ctx.lineCap = 'round';
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.moveTo(hx2 + f * (16 + fangReach * 0.5), (hy2 + 3 + nearFangTipY) * 0.5);
    ctx.lineTo(nearFangTipX, nearFangTipY);
    ctx.stroke();

    // Projectile Launch Muzzle Bursts (Venom Spit spray, Web burst, Hook flash)
    if (cast > 0.1) {
      ctx.save();
      const mx = hx2 + f * 22;
      const my = hy2 + 2;
      ctx.globalAlpha = cast * 0.85;
      if (proj.kind === 'spit') {
        // Toxic green fang-spray cone & droplets
        ctx.fillStyle = 'rgba(156, 240, 106, 0.45)';
        ctx.beginPath();
        ctx.moveTo(mx, my);
        ctx.lineTo(mx + f * 26, my - 12);
        ctx.lineTo(mx + f * 26, my + 12);
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = '#d8ff9c';
        [-6, 0, 6].forEach((oy, idx) => {
          ctx.beginPath();
          ctx.arc(mx + f * (12 + idx * 5), my + oy, 2.2, 0, Math.PI * 2);
          ctx.fill();
        });
      } else if (proj.kind === 'web') {
        // Silk net launch cone
        ctx.strokeStyle = '#f3f7ee';
        ctx.lineWidth = 1.6;
        [-10, 0, 10].forEach((oy) => {
          ctx.beginPath();
          ctx.moveTo(mx, my);
          ctx.lineTo(mx + f * 24, my + oy);
          ctx.stroke();
        });
      } else if (proj.kind === 'hook') {
        // Harpoon launch ring flash
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2.2;
        ctx.beginPath();
        ctx.ellipse(mx + f * 8, my, 4, 12 * cast, 0, 0, Math.PI * 2);
        ctx.stroke();
      }
      ctx.restore();
    }

    // Progressive Attack Slash Ribbons & Impact VFX
    if (pose.swing > 0) {
      const sw = pose.swing;
      const alpha = Math.sin(sw * Math.PI);
      const colAccent = empoweredPower ? '#ffb347' : (empoweredLeech ? '#ff4d6d' : colLight);
      const colCore = empoweredPower ? '#fff6cc' : '#ffffff';
      const powerBoost = empoweredPower ? 1.32 : 1;

      ctx.save();
      ctx.lineCap = 'round';

      if (isHeavy) {
        // Heavy 2-arm Sunder: Twin crushing crescent slashes with ground shockwave
        const t0 = Math.max(0, sw * 1.35 - 0.58);
        const t1 = Math.min(1, sw * 1.35 + 0.12);
        const heavyCol = empoweredPower ? '#ffb347' : '#ff9f43';

        // Near primary crescent slash
        this.drawCrescentSlash(
          ctx,
          bx + f * 18, by - 62,
          bx + f * 86, by - 50,
          bx + f * (REACH + 16), by + 12,
          t0, t1,
          10 * powerBoost,
          heavyCol,
          colCore,
          alpha * 0.95
        );

        // Far secondary crescent slash (twin slash)
        const st0 = Math.max(0, (sw - 0.05) * 1.35 - 0.54);
        const st1 = Math.min(1, (sw - 0.05) * 1.35 + 0.1);
        if (st1 > st0 + 0.04) {
          this.drawCrescentSlash(
            ctx,
            bx + f * 24, by - 54,
            bx + f * 76, by - 42,
            bx + f * (REACH + 6), by + 16,
            st0, st1,
            6.5 * powerBoost,
            colMain,
            heavyCol,
            alpha * 0.78
          );
        }

        // Heavy ground impact shockwave ring on the stick
        if (sw > 0.28 && sw < 0.92) {
          const imp = Math.sin(((sw - 0.28) / 0.64) * Math.PI);
          const impX = bx + f * (REACH + 6);
          const impY = by + 10;
          ctx.globalAlpha = imp * 0.9;
          ctx.strokeStyle = colCore;
          ctx.lineWidth = 3.2 * powerBoost;
          ctx.beginPath();
          ctx.ellipse(impX, impY, (14 + (sw - 0.28) * 36) * powerBoost, 6 + (sw - 0.28) * 12, f * 0.2, 0, Math.PI * 2);
          ctx.stroke();

          ctx.strokeStyle = heavyCol;
          ctx.lineWidth = 1.8;
          ctx.beginPath();
          ctx.ellipse(impX, impY, (8 + (sw - 0.28) * 22) * powerBoost, 4 + (sw - 0.28) * 7, f * 0.2, 0, Math.PI * 2);
          ctx.stroke();
        }
      } else if (atkType === 0) {
        // Light Attack Variant 0: Piercing Snap Jab
        const extend = Math.min(1, sw * 1.55);
        const tail = Math.max(0, (sw - 0.28) * 1.35);
        const startX = bx + f * lerp(18, 56, tail);
        const reachX = bx + f * lerp(32, REACH + 16, extend);

        ctx.globalAlpha = alpha * 0.92;
        ctx.fillStyle = colAccent;
        ctx.beginPath();
        ctx.moveTo(startX, by - 11 - 4.5 * powerBoost * (1 - tail * 0.6));
        ctx.lineTo(reachX + f * 6, by - 11);
        ctx.lineTo(startX, by - 11 + 4.5 * powerBoost * (1 - tail * 0.6));
        ctx.closePath();
        ctx.fill();

        ctx.globalAlpha = alpha;
        ctx.strokeStyle = colCore;
        ctx.lineWidth = 3.2 * powerBoost;
        ctx.beginPath();
        ctx.moveTo(startX + f * 6, by - 11);
        ctx.lineTo(reachX + f * 4, by - 11);
        ctx.stroke();

        const reachX2 = bx + f * lerp(26, REACH + 6, Math.max(0, extend - 0.08));
        ctx.globalAlpha = alpha * 0.78;
        ctx.fillStyle = colMain;
        ctx.beginPath();
        ctx.moveTo(startX - f * 4, by - 2 - 3.2 * powerBoost);
        ctx.lineTo(reachX2, by - 2);
        ctx.lineTo(startX - f * 4, by - 2 + 3.2 * powerBoost);
        ctx.closePath();
        ctx.fill();

        ctx.strokeStyle = colCore;
        ctx.lineWidth = 2.2 * powerBoost;
        ctx.beginPath();
        ctx.moveTo(startX, by - 2);
        ctx.lineTo(reachX2 - f * 2, by - 2);
        ctx.stroke();

        [0.35, 0.65].forEach((pos, idx) => {
          const rx = lerp(bx + f * 30, reachX - f * 10, pos);
          const ry = by - 7;
          const ringR = (8 + idx * 4 + sw * 9) * powerBoost;
          ctx.globalAlpha = alpha * (0.65 - idx * 0.18);
          ctx.strokeStyle = idx === 0 ? colCore : colAccent;
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.ellipse(rx, ry, 4.5, ringR, 0, 0, Math.PI * 2);
          ctx.stroke();
        });

        if (sw > 0.18 && sw < 0.85) {
          const starA = Math.sin(((sw - 0.18) / 0.67) * Math.PI);
          const tipX = reachX + f * 4;
          const tipY = by - 11;
          const sr = (11 + starA * 6) * powerBoost;
          ctx.globalAlpha = starA * 0.95;
          ctx.strokeStyle = colCore;
          ctx.lineWidth = 2.4;
          ctx.beginPath();
          ctx.moveTo(tipX - sr, tipY); ctx.lineTo(tipX + sr, tipY);
          ctx.moveTo(tipX, tipY - sr * 0.85); ctx.lineTo(tipX, tipY + sr * 0.85);
          ctx.moveTo(tipX - sr * 0.5, tipY - sr * 0.5); ctx.lineTo(tipX + sr * 0.5, tipY + sr * 0.5);
          ctx.moveTo(tipX - sr * 0.5, tipY + sr * 0.5); ctx.lineTo(tipX + sr * 0.5, tipY - sr * 0.5);
          ctx.stroke();

          ctx.fillStyle = colAccent;
          ctx.beginPath();
          ctx.arc(tipX, tipY, 3.6 * powerBoost, 0, Math.PI * 2);
          ctx.fill();
        }
      } else if (atkType === 1) {
        // Light Attack Variant 1: Overhead Claw Chop
        const t0 = Math.max(0, sw * 1.35 - 0.58);
        const t1 = Math.min(1, sw * 1.35 + 0.12);

        this.drawCrescentSlash(
          ctx,
          bx + f * 16, by - 46,
          bx + f * 78, by - 44,
          bx + f * (REACH + 12), by + 10,
          t0, t1,
          7.5 * powerBoost,
          colAccent,
          colCore,
          alpha * 0.92
        );

        const st0 = Math.max(0, (sw - 0.08) * 1.35 - 0.52);
        const st1 = Math.min(1, (sw - 0.08) * 1.35 + 0.1);
        if (st1 > st0 + 0.04) {
          this.drawCrescentSlash(
            ctx,
            bx + f * 12, by - 34,
            bx + f * 64, by - 32,
            bx + f * (REACH + 2), by + 14,
            st0, st1,
            4.5 * powerBoost,
            colMain,
            colAccent,
            alpha * 0.68
          );
        }

        if (sw > 0.32 && sw < 0.88) {
          const imp = Math.sin(((sw - 0.32) / 0.56) * Math.PI);
          const impX = bx + f * (REACH + 6);
          const impY = by + 8;
          ctx.globalAlpha = imp * 0.8;
          ctx.strokeStyle = colCore;
          ctx.lineWidth = 2.4 * powerBoost;
          ctx.beginPath();
          ctx.ellipse(impX, impY, (10 + (sw - 0.32) * 26) * powerBoost, 5 + (sw - 0.32) * 8, f * 0.25, 0, Math.PI * 2);
          ctx.stroke();
        }
      } else {
        // Light Attack Variant 2: Rising Scythe Uppercut
        const t0 = Math.max(0, sw * 1.35 - 0.58);
        const t1 = Math.min(1, sw * 1.35 + 0.12);

        this.drawCrescentSlash(
          ctx,
          bx + f * 18, STICK.y + 4,
          bx + f * 74, by + 12,
          bx + f * (REACH + 10), by - 50,
          t0, t1,
          7.8 * powerBoost,
          colAccent,
          colCore,
          alpha * 0.92
        );

        const st0 = Math.max(0, (sw - 0.08) * 1.35 - 0.52);
        const st1 = Math.min(1, (sw - 0.08) * 1.35 + 0.1);
        if (st1 > st0 + 0.04) {
          this.drawCrescentSlash(
            ctx,
            bx + f * 26, STICK.y + 2,
            bx + f * 66, by + 4,
            bx + f * (REACH - 2), by - 40,
            st0, st1,
            4.5 * powerBoost,
            colMain,
            colAccent,
            alpha * 0.68
          );
        }

        for (let k = 0; k < 3; k++) {
          const streakSw = clamp((sw - k * 0.08) * 1.4, 0, 1);
          if (streakSw > 0 && streakSw < 1) {
            const sx0 = bx + f * (30 + k * 18 + streakSw * 24);
            const sy0 = STICK.y + 2 - streakSw * (22 + k * 10);
            ctx.globalAlpha = Math.sin(streakSw * Math.PI) * 0.7;
            ctx.strokeStyle = k === 0 ? colCore : colAccent;
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(sx0, sy0);
            ctx.lineTo(sx0 + f * 14, sy0 - 12);
            ctx.stroke();
          }
        }
      }

      ctx.restore();
    }

    // Spinning Low Sweep Skill Crescent & Bark-Dust Wave
    if (sweep > 0) {
      const alpha = Math.sin(sweep * Math.PI);
      const t0 = Math.max(0, sweep * 1.3 - 0.5);
      const t1 = Math.min(1, sweep * 1.3 + 0.15);
      this.drawCrescentSlash(
        ctx,
        bx - f * 22, STICK.y + 3,
        bx + f * 52, by + 20,
        bx + f * (REACH + 28), STICK.y - 6,
        t0, t1,
        9,
        colLight,
        '#ffffff',
        alpha * 0.94
      );
      this.drawCrescentSlash(
        ctx,
        bx - f * 10, STICK.y - 1,
        bx + f * 44, by + 8,
        bx + f * (REACH + 14), STICK.y - 14,
        Math.max(0, t0 - 0.08), Math.min(1, t1 - 0.05),
        5,
        colMain,
        colLight,
        alpha * 0.65
      );
      // Bark-dust rotational ring
      ctx.save();
      ctx.globalAlpha = alpha * 0.55;
      ctx.strokeStyle = '#e8d9b0';
      ctx.lineWidth = 2.2;
      ctx.beginPath();
      ctx.ellipse(bx + f * (24 + sweep * 46), STICK.y - 1, 22 + sweep * 32, 6, 0, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }

    // Dash & Pounce Air-Streaks and Leap Arcs
    if (s.dashT > 0) {
      const burst = Math.min(1, s.dashT / .16);
      const dashDir = s.dashDir || f;
      ctx.save();
      if (s.pounce) {
        // Predatory Pounce: curved golden-white claw trajectories & kickoff shock-ring
        this.drawCrescentSlash(
          ctx,
          bx - dashDir * 64, STICK.y - 2,
          bx - dashDir * 16, by - 36,
          bx + dashDir * 36, by - 12,
          0.1, 0.95,
          5.5,
          '#ffb347',
          '#ffffff',
          0.55 + burst * 0.35
        );
      }
      ctx.globalAlpha = .26 + burst * .4;
      ctx.strokeStyle = s.pounce ? '#ffd694' : colLight;
      ctx.lineCap = 'round';
      for (let line = 0; line < 3; line++) {
        ctx.lineWidth = (s.pounce ? 2.4 : 1.7) + line * .5;
        ctx.beginPath();
        ctx.moveTo(bx - dashDir * (26 + line * 8), by - 12 + line * 11);
        ctx.lineTo(bx - dashDir * (72 + line * 15), by - 12 + line * 11);
        ctx.stroke();
      }
      ctx.restore();
    }

    // Mend Skill VFX: Emerald silk-stitching anchor lines to the twig & rising vitality motes
    if (mendBurst.active) {
      ctx.save();
      const mp = mendBurst.pulse;
      const prog = mendBurst.progress;

      // Glowing silk anchor stitches binding the spider to the twig
      ctx.strokeStyle = '#9cf0a8';
      ctx.lineWidth = 2;
      ctx.globalAlpha = mp * 0.85;
      [-28, -10, 10, 28].forEach((ox, idx) => {
        ctx.beginPath();
        ctx.moveTo(bx + ox, STICK.y + 2);
        ctx.quadraticCurveTo(bx + ox * 0.6, by - 14 - Math.sin(prog * Math.PI + idx) * 8, bx + ox * 0.4, by);
        ctx.stroke();
      });

      // Expanding emerald vitality wave
      ctx.strokeStyle = '#d4ffda';
      ctx.lineWidth = 2.6;
      ctx.globalAlpha = (1 - prog) * 0.85;
      ctx.beginPath();
      ctx.ellipse(bx - f * 4, by - prog * 18, 28 + prog * 24, 10 + prog * 8, 0, 0, Math.PI * 2);
      ctx.stroke();

      // Rising healing cross-sparks
      ctx.strokeStyle = '#9cf0a8';
      ctx.lineWidth = 2;
      [-20, 0, 18].forEach((ox, idx) => {
        const hy = by + 8 - prog * (34 + idx * 8);
        const hx = bx - f * 4 + ox;
        const r = 4;
        ctx.globalAlpha = mp * 0.95;
        ctx.beginPath();
        ctx.moveTo(hx - r, hy); ctx.lineTo(hx + r, hy);
        ctx.moveTo(hx, hy - r); ctx.lineTo(hx, hy + r);
        ctx.stroke();
      });
      ctx.restore();
    }

    // Arm-Guard Chitin Block Shield (wrapping right on the crossed blocking forearms)
    if (s.blocking) {
      const sx = bx + f * 40;
      const sy = by - 14;
      const isParryStance = s.parryT > 0 || (s.blockT !== undefined && s.blockT <= 0.08);
      ctx.save();
      // Arm-guard aura glow
      ctx.globalAlpha = 0.38 + 0.14 * Math.sin(t * 14) + (isParryStance ? 0.35 : 0);
      ctx.strokeStyle = isParryStance ? '#ffffff' : colLight;
      ctx.lineWidth = isParryStance ? 5 : 3.5;
      ctx.lineCap = 'round';
      ctx.beginPath();
      // Curved defensive shell hugging the crossed arms
      if (f > 0) ctx.arc(sx, sy, 32, -0.9, 0.9);
      else ctx.arc(sx, sy, 32, Math.PI - 0.9, Math.PI + 0.9);
      ctx.stroke();

      // Dual-forearm deflect cross-sparks along the arm intersection
      ctx.strokeStyle = isParryStance ? '#ffeaa7' : '#ffffff';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(sx - f * 4, sy - 14);
      ctx.lineTo(sx + f * 4, sy + 14);
      ctx.moveTo(sx + f * 4, sy - 14);
      ctx.lineTo(sx - f * 4, sy + 14);
      ctx.stroke();

      ctx.restore();
    }

    // Parry shockwave
    if (s.parryT > 0) {
      const k = 1 - s.parryT / 0.25;
      ctx.save();
      ctx.globalAlpha = 1 - k;
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 5;
      ctx.beginPath();
      ctx.arc(bx + f * 20, by - 4, 30 + k * 50, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }

    // Web tangle (Snare) with sticky twig-anchor strands
    if (s.snare > 0) {
      ctx.save();
      ctx.globalAlpha = Math.min(1, s.snare * 2) * 0.85;
      ctx.strokeStyle = '#f3f7ee';
      ctx.lineWidth = 1.5;
      const wx = bx - f * 4, wy = by;

      // Sticky silk tethers pinning the spider directly to the twig bark
      [-32, -14, 8, 28].forEach((ox) => {
        ctx.beginPath();
        ctx.moveTo(wx + ox * 0.7, wy + 4);
        ctx.lineTo(wx + ox, STICK.y + 2);
        ctx.stroke();
      });

      for (let q = 0; q < 6; q++) {
        const an = q * Math.PI / 3 + 0.3 + Math.sin(t * 14) * 0.04;
        ctx.beginPath();
        ctx.moveTo(wx, wy);
        ctx.lineTo(wx + Math.cos(an) * 38, wy + Math.sin(an) * 32);
        ctx.stroke();
      }
      ctx.beginPath();
      ctx.ellipse(wx, wy, 22, 18, 0, 0, Math.PI * 2);
      ctx.stroke();
      ctx.beginPath();
      ctx.ellipse(wx, wy, 36, 30, 0, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }

    // Venom poison: rising toxic bubbles while grip drains over time
    if (s.venom > 0 && !s.hang) {
      ctx.save();
      ctx.globalAlpha = Math.min(1, s.venom * 2) * 0.8;
      ctx.fillStyle = '#9cf06a';
      for (let q = 0; q < 5; q++) {
        const ph = (t * 1.6 + q * 0.21) % 1;
        const vx = bx + Math.sin(q * 2.3 + t * 3) * 18;
        const vy = by + 8 - ph * 38;
        ctx.globalAlpha = (1 - ph) * 0.8 * Math.min(1, s.venom * 2);
        ctx.beginPath();
        ctx.arc(vx, vy, 2.6 - ph * 1.2, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    }

    // Iron Silk (Shield) Geodesic Web-Lattice Dome
    if (s.shield > 0) {
      ctx.save();
      const shx = bx - f * 6;
      const shy = by;
      const baseAlpha = Math.min(1, s.shield * 1.5) * (0.65 + 0.15 * Math.sin(t * 10));
      const weaveScale = shieldBurst.active ? 0.75 + 0.25 * smoothMotion(shieldBurst.progress) : 1;
      const rx = 46 * weaveScale;
      const ry = 38 * weaveScale;

      ctx.globalAlpha = baseAlpha;
      ctx.fillStyle = 'rgba(160, 215, 255, 0.16)';
      ctx.strokeStyle = '#cfe9ff';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.ellipse(shx, shy, rx, ry, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // Internal silk-lattice meridians & equators
      ctx.globalAlpha = baseAlpha * 0.55;
      ctx.lineWidth = 1.3;
      const spin = t * 1.4;
      for (let m = 0; m < 3; m++) {
        const ang = spin + (m * Math.PI) / 3;
        ctx.beginPath();
        ctx.ellipse(shx, shy, Math.abs(Math.cos(ang)) * rx, ry, 0, 0, Math.PI * 2);
        ctx.stroke();
      }
      ctx.beginPath();
      ctx.ellipse(shx, shy, rx * 0.7, ry * 0.65, 0, 0, Math.PI * 2);
      ctx.stroke();

      // Pearlescent specular highlight arc
      ctx.globalAlpha = Math.min(1, baseAlpha * 1.2);
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2.2;
      ctx.beginPath();
      ctx.ellipse(shx, shy, rx - 4, ry - 4, 0, Math.PI * 1.15, Math.PI * 1.65);
      ctx.stroke();
      ctx.restore();
    }

    // Power Strike Blazing Golden Aura & Ignited Mandibles
    if (s.power > 0) {
      ctx.save();
      const pulse = 0.65 + 0.3 * Math.sin(t * 15);
      const px = bx - f * 4;
      const py = by;

      // Activation shockwave burst
      if (powerBurst.active) {
        ctx.globalAlpha = (1 - powerBurst.progress) * 0.9;
        ctx.strokeStyle = '#ffeaa7';
        ctx.lineWidth = 3.5;
        ctx.beginPath();
        ctx.ellipse(px, py, 24 + powerBurst.progress * 38, 18 + powerBurst.progress * 28, 0, 0, Math.PI * 2);
        ctx.stroke();
      }

      // Outer golden energy corona
      ctx.globalAlpha = pulse;
      ctx.strokeStyle = '#ffb347';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.ellipse(px, py, 41, 33, 0, 0, Math.PI * 2);
      ctx.stroke();

      // Rising flame/lightning tongues around the body & foreclaws
      ctx.strokeStyle = '#ffeaa7';
      ctx.lineWidth = 2.2;
      ctx.lineCap = 'round';
      for (let fl = 0; fl < 5; fl++) {
        const phase = (t * 3.2 + fl * 0.2) % 1;
        const fx0 = px + (fl - 2) * 14 + f * 6;
        const fy0 = py + 12 - phase * 36;
        ctx.globalAlpha = Math.sin(phase * Math.PI) * 0.85;
        ctx.beginPath();
        ctx.moveTo(fx0, fy0 + 9);
        ctx.quadraticCurveTo(fx0 + f * 5, fy0 + 4, fx0, fy0);
        ctx.stroke();
      }
      ctx.restore();
    }

    // Riposte Counter Stance: Curved Silver Cross-Blades & Rotating Lens Star
    if (s.riposte > 0) {
      ctx.save();
      const rpAlpha = Math.min(1, s.riposte * 2.5) * 0.95;
      const rx = bx + f * 26;
      const ry = by - 11;

      this.drawCrescentSlash(
        ctx,
        rx - f * 22, ry - 22,
        rx + f * 4, ry,
        rx + f * 24, ry + 22,
        0, 1,
        4.2,
        '#cfe9ff',
        '#ffffff',
        rpAlpha
      );
      this.drawCrescentSlash(
        ctx,
        rx + f * 24, ry - 22,
        rx + f * 4, ry,
        rx - f * 22, ry + 22,
        0, 1,
        4.2,
        '#cfe9ff',
        '#ffffff',
        rpAlpha
      );

      // Central rotating counter-star glint
      const starR = 10 + Math.sin(t * 24) * 3;
      ctx.globalAlpha = rpAlpha;
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2.2;
      ctx.beginPath();
      ctx.moveTo(rx - starR, ry); ctx.lineTo(rx + starR, ry);
      ctx.moveTo(rx, ry - starR); ctx.lineTo(rx, ry + starR);
      ctx.stroke();
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(rx, ry, 3.2, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    // Leech Fang Vampiric Siphon Aura & Orbiting Crimson Motes
    if (s.leech > 0) {
      ctx.save();
      const lx = bx - f * 4;
      const ly = by;
      const lAlpha = 0.55 + 0.25 * Math.sin(t * 11);

      if (leechBurst.active) {
        // Vampiric fang-bite sigil flash on cast
        const bp = leechBurst.pulse;
        ctx.globalAlpha = bp * 0.95;
        ctx.fillStyle = '#ff4d6d';
        [-8, 8].forEach((ox) => {
          ctx.beginPath();
          ctx.moveTo(hx2 + f * 18 + ox * 0.4, hy2 - 18);
          ctx.lineTo(hx2 + f * 22 + ox, hy2 - 4);
          ctx.lineTo(hx2 + f * 15 + ox * 0.4, hy2 - 14);
          ctx.closePath();
          ctx.fill();
        });
      }

      ctx.globalAlpha = lAlpha;
      ctx.strokeStyle = '#d24a5a';
      ctx.lineWidth = 2.8;
      ctx.beginPath();
      ctx.ellipse(lx, ly, 37, 29, 0, 0, Math.PI * 2);
      ctx.stroke();

      // Swirling crimson siphon orbs spiraling inward toward the fangs
      for (let m = 0; m < 4; m++) {
        const cyc = (t * 1.8 + m * 0.25) % 1;
        const ang = t * 5 + m * (Math.PI / 2);
        const rad = (1 - cyc) * 34 + 6;
        const ox = hx2 + f * 14 + Math.cos(ang) * rad;
        const oy = hy2 + 2 + Math.sin(ang) * (rad * 0.7);
        ctx.globalAlpha = Math.sin(cyc * Math.PI) * 0.9;
        ctx.fillStyle = m % 2 === 0 ? '#ff4d6d' : '#ffb3c1';
        ctx.beginPath();
        ctx.arc(ox, oy, 2.5, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    }

    // Haste Slipstream Chevrons & Wind Trails
    if (s.hasteT > 0) {
      ctx.save();
      if (hasteBurst.active) {
        ctx.globalAlpha = (1 - hasteBurst.progress) * 0.85;
        ctx.strokeStyle = '#70d6ff';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.ellipse(bx, by, 24 + hasteBurst.progress * 38, 16 + hasteBurst.progress * 20, 0, 0, Math.PI * 2);
        ctx.stroke();
      }

      // Aerodynamic wind chevrons & speed lines behind the spider
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      for (let hk = 0; hk < 3; hk++) {
        const flow = ((t * 4.5 + hk * 0.33) % 1);
        const cx0 = bx - f * (32 + flow * 42);
        const cy0 = by - 13 + hk * 13;
        ctx.globalAlpha = Math.sin(flow * Math.PI) * 0.75;
        ctx.strokeStyle = hk === 1 ? '#ffffff' : '#70d6ff';
        ctx.lineWidth = 2.2;
        ctx.beginPath();
        ctx.moveTo(cx0, cy0 - 5);
        ctx.lineTo(cx0 + f * 7, cy0);
        ctx.lineTo(cx0, cy0 + 5);
        ctx.stroke();

        ctx.lineWidth = 1.8;
        ctx.beginPath();
        ctx.moveTo(cx0 - f * 4, cy0);
        ctx.lineTo(cx0 - f * 22, cy0);
        ctx.stroke();
      }
      ctx.restore();
    }


    ctx.restore();
  }

  private drawSpiderName(ctx: CanvasRenderingContext2D, s: any) {
    if (!s.name) return;
    const isAmber = s.id === 0;
    const colLight = s.colorLight || (isAmber ? COLORS.amberLight : COLORS.jadeLight);

    const isHanging = s.hang && (s.drop || 0) > 12;
    const x = s.x;
    const y = isHanging ? (BODY_Y + (s.drop || 0) + 40) : (STICK.y - 48);

    ctx.save();
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = '800 16px "Nunito", "Arial Black", system-ui, sans-serif';

    // Thick dark shadow stroke so it is easily readable without a container box
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.95)';
    ctx.lineWidth = 4.5;
    ctx.lineJoin = 'round';
    ctx.strokeText(s.name, x, y);

    // Bright, crisp filled text matching the spider color
    ctx.fillStyle = colLight;
    ctx.fillText(s.name, x, y);

    ctx.restore();
  }

  private drawPond(ctx: CanvasRenderingContext2D, t: number) {
    if (this.transparentBg) return;
    let dang = 0;
    if (this.gameState && this.gameState.p1 && this.gameState.p2) {
      const spiders = [this.gameState.p1, this.gameState.p2];
      spiders.forEach((s) => {
        if (s.hang && !s.ko) dang = Math.max(dang, (s.drop || 0) / MAXDROP);
      });
    }

    ctx.fillStyle = this.pondGradient || 'rgba(14,56,68,.96)';
    ctx.beginPath();
    ctx.moveTo(0, CANVAS_HEIGHT);
    for (let x = 0; x <= CANVAS_WIDTH; x += 12) {
      ctx.lineTo(x, POND_Y + Math.sin(x * 0.035 + t * 1.8) * 2.2);
    }
    ctx.lineTo(CANVAS_WIDTH, CANVAS_HEIGHT);
    ctx.closePath();
    ctx.fill();

    // Red danger glow when close to water
    if (dang > 0.35) {
      ctx.fillStyle = `rgba(232,89,63,${((dang - 0.35) * 0.45).toFixed(3)})`;
      ctx.fillRect(0, POND_Y - 6, CANVAS_WIDTH, CANVAS_HEIGHT - POND_Y + 6);
    }

    // Pond rim highlight
    ctx.strokeStyle = 'rgba(190,235,240,.45)';
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    for (let x2 = 0; x2 <= CANVAS_WIDTH; x2 += 12) {
      const yy = POND_Y + Math.sin(x2 * 0.035 + t * 1.8) * 2.2;
      if (x2) ctx.lineTo(x2, yy); else ctx.moveTo(x2, yy);
    }
    ctx.stroke();

    // Water surface ripples
    ctx.strokeStyle = 'rgba(190,235,240,.18)';
    ctx.lineWidth = 1;
    for (let r = 0; r < 7; r++) {
      const rx = (r * 185 + 90) % CANVAS_WIDTH;
      const ph = (t * 0.4 + r * 0.37) % 1;
      ctx.beginPath();
      ctx.ellipse(rx, POND_Y + 26 + r * 9, 10 + ph * 34, 2 + ph * 5, 0, 0, Math.PI * 2);
      ctx.globalAlpha = 1 - ph;
      ctx.stroke();
      ctx.globalAlpha = 1;
    }

    // Lily pads
    ctx.fillStyle = 'rgba(52,104,64,.95)';
    [[180, 0], [480, 1.4], [780, 2.6], [1040, 0.8]].forEach(([px, offset]) => {
      ctx.beginPath();
      ctx.ellipse(px, POND_Y + 14 + Math.sin(t * 1.2 + offset) * 1.2, 26, 6, 0, 0, Math.PI * 2);
      ctx.fill();
    });
  }

  private drawParticles(ctx: CanvasRenderingContext2D) {
    // Expanding impact shock-rings
    this.impactRings.forEach((ring) => {
      const p = 1 - Math.max(0, ring.life / ring.max);
      const radius = lerp(ring.r, ring.maxR, 1 - Math.pow(1 - p, 2));
      ctx.save();
      ctx.globalAlpha = (1 - p) * 0.75;
      ctx.strokeStyle = ring.col;
      ctx.lineWidth = 3 * (1 - p * 0.6);
      ctx.beginPath();
      ctx.arc(ring.x, ring.y, radius, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    });

    ctx.lineCap = 'round';
    const isLow = this.quality === 'low';
    this.particles.forEach((p) => {
      const alpha = Math.max(0, p.life / p.max);
      ctx.globalAlpha = alpha;
      if (p.streak) {
        ctx.strokeStyle = p.col;
        ctx.lineWidth = p.sz * 1.1;
        ctx.beginPath();
        ctx.moveTo(p.x, p.y);
        ctx.lineTo(p.x - p.vx * 0.028, p.y - p.vy * 0.028);
        ctx.stroke();
      }
      ctx.fillStyle = p.col;
      if (isLow || p.sz <= 2.2) {
        ctx.fillRect(p.x - p.sz, p.y - p.sz, p.sz * 2, p.sz * 2);
      } else {
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.sz, 0, Math.PI * 2);
        ctx.fill();
      }
    });
    ctx.globalAlpha = 1;

    ctx.textAlign = 'center';
    ctx.lineJoin = 'round';
    this.floatingTexts.forEach((f) => {
      ctx.globalAlpha = Math.min(1, f.life * 1.6);
      ctx.font = '700 24px "Barlow Condensed", sans-serif';
      ctx.lineWidth = 5;
      ctx.strokeStyle = 'rgba(8,16,15,.85)';
      ctx.strokeText(f.text, clamp(f.x, 70, CANVAS_WIDTH - 70), f.y);
      ctx.fillStyle = f.col;
      ctx.fillText(f.text, clamp(f.x, 70, CANVAS_WIDTH - 70), f.y);
    });
    ctx.globalAlpha = 1;
  }

  private drawBigText(ctx: CanvasRenderingContext2D, text: string, y: number, size: number, col: string, pop: number) {
    ctx.save();
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.lineJoin = 'round';
    const sc = 1 + Math.max(0, 0.35 - pop * 1.6);
    ctx.translate(CANVAS_WIDTH / 2, y);
    ctx.scale(sc, sc);
    ctx.font = `400 ${size}px "Bowlby One", "Arial Black", sans-serif`;
    ctx.lineWidth = 10;
    ctx.strokeStyle = 'rgba(8,16,15,.9)';
    ctx.strokeText(text, 0, 0);
    ctx.fillStyle = col;
    ctx.fillText(text, 0, 0);
    ctx.restore();
  }
}

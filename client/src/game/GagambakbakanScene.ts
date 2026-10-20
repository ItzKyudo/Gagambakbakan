import Phaser from 'phaser';
import {
  STICK, POND_Y, BODY_H, BODY_Y, MAXDROP, REACH,
  CANVAS_WIDTH, CANVAS_HEIGHT, COLORS, clamp, lerp
} from './constants';
import { keyLabel, getKeys } from '../gb';

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

  private bgCanvas!: HTMLCanvasElement;
  private flies: Array<{ x: number; y: number; ph: number; sp: number }> = [];
  private grain: Array<{ x: number; y: number; len: number }> = [];
  private particles: Particle[] = [];
  private floatingTexts: FloatingText[] = [];

  private renderCanvas!: HTMLCanvasElement;
  private renderCtx!: CanvasRenderingContext2D;
  private displayImage!: Phaser.GameObjects.Image;

  constructor() {
    super({ key: 'GagambakbakanScene' });
  }

  create() {
    this.createBackgroundCache();
    this.createWoodGrain();
    this.createFlies();

    // Create high-res offscreen rendering surface
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    this.renderCanvas = document.createElement('canvas');
    this.renderCanvas.width = CANVAS_WIDTH * dpr;
    this.renderCanvas.height = CANVAS_HEIGHT * dpr;
    this.renderCtx = this.renderCanvas.getContext('2d')!;

    // Register canvas texture in Phaser
    if (this.textures.exists('brawlCanvas')) {
      this.textures.remove('brawlCanvas');
    }
    this.textures.addCanvas('brawlCanvas', this.renderCanvas);
    this.displayImage = this.add.image(CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2, 'brawlCanvas');
    this.displayImage.setDisplaySize(CANVAS_WIDTH, CANVAS_HEIGHT);
  }

  private createFlies() {
    this.flies = [];
    for (let i = 0; i < 18; i++) {
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
    for (let i = 0; i < 70; i++) {
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
    const mg = b.createRadialGradient(770, 105, 10, 770, 105, 160);
    mg.addColorStop(0, 'rgba(233,239,216,.5)');
    mg.addColorStop(1, 'rgba(233,239,216,0)');
    b.fillStyle = mg;
    b.beginPath();
    b.arc(770, 105, 160, 0, Math.PI * 2);
    b.fill();

    b.fillStyle = '#e9efd8';
    b.beginPath();
    b.arc(770, 105, 40, 0, Math.PI * 2);
    b.fill();

    // Moon craters
    b.fillStyle = 'rgba(120,130,110,.18)';
    [[758, 98, 9], [782, 116, 6], [770, 90, 4]].forEach(([cx, cy, cr]) => {
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
    if (fx.type === 'spark') {
      const sp = fx.sp || 200;
      for (let i = 0; i < (fx.count || 8); i++) {
        this.particles.push({
          x: fx.x,
          y: fx.y,
          vx: (Math.random() - 0.5) * sp * 2,
          vy: (Math.random() - 0.85) * sp,
          life: 0.3 + Math.random() * 0.4,
          max: 0.7,
          sz: 1.8 + Math.random() * 2.2,
          col: fx.col,
          g: 520
        });
      }
    } else if (fx.type === 'dust') {
      for (let i = 0; i < (fx.count || 6); i++) {
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
      for (let i = 0; i < 34; i++) {
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

    // Update particles
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.life -= dt;
      p.vy += p.g * dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      if (p.life <= 0) this.particles.splice(i, 1);
    }

    // Update floating texts
    for (let j = this.floatingTexts.length - 1; j >= 0; j--) {
      const f = this.floatingTexts[j];
      f.life -= dt * 0.9;
      f.y -= 34 * dt;
      if (f.life <= 0) this.floatingTexts.splice(j, 1);
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
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // Camera screen shake
    const sx = (Math.random() - 0.5) * this.shakeAmount;
    const sy = (Math.random() - 0.5) * this.shakeAmount;
    ctx.save();
    ctx.translate(sx, sy);

    // Draw background
    ctx.drawImage(this.bgCanvas, 0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // Fireflies
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

    // Twig
    this.drawStick(ctx);

    // Earthquake tremors
    this.drawQuakes(ctx);

    if (this.gameState && this.gameState.p1 && this.gameState.p2) {
      const p1 = this.gameState.p1;
      const p2 = this.gameState.p2;

      // Order spiders so a dangling/rising spider overlaps correctly
      const order = p1.hang && !p2.hang ? [p2, p1] : [p1, p2];
      order.forEach((s) => this.drawSpider(ctx, s, t));

      // Draw Webs & Projectiles
      const webs = this.gameState.webs || [];
      webs.forEach((w: any) => {
        if (w.k === 'spit') {
          ctx.save();
          ctx.translate(w.x, w.y);
          ctx.fillStyle = 'rgba(156,240,106,.4)';
          ctx.beginPath();
          ctx.ellipse(-w.vx * 0.02, 0, 14, 3, 0, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = '#9cf06a';
          ctx.strokeStyle = 'rgba(8,16,15,.8)';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.ellipse(0, 0, 10, 6, 0, 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();
          ctx.restore();
          return;
        }

        if (w.k === 'hook') {
          const owner = w.owner === 0 ? p1 : p2;
          const ox = owner.x + owner.face * 20;
          const sg2 = Math.sign(w.vx);
          ctx.save();
          ctx.strokeStyle = 'rgba(244,248,238,.85)';
          ctx.lineWidth = 1.6;
          ctx.beginPath();
          ctx.moveTo(ox, w.y);
          ctx.lineTo(w.x, w.y);
          ctx.stroke();
          ctx.strokeStyle = '#ffffff';
          ctx.lineWidth = 3;
          ctx.lineCap = 'round';
          ctx.beginPath();
          ctx.moveTo(w.x - sg2 * 8, w.y - 6);
          ctx.quadraticCurveTo(w.x + sg2 * 9, w.y - 6, w.x + sg2 * 6, w.y + 7);
          ctx.stroke();
          ctx.restore();
          return;
        }

        // Standard Web Disc
        ctx.save();
        ctx.translate(w.x, w.y);
        ctx.rotate(w.x * 0.05);
        ctx.strokeStyle = 'rgba(244,248,238,.95)';
        ctx.lineWidth = 1.6;
        for (let q = 0; q < 6; q++) {
          const an = q * Math.PI / 3;
          ctx.beginPath();
          ctx.moveTo(0, 0);
          ctx.lineTo(Math.cos(an) * 11, Math.sin(an) * 11);
          ctx.stroke();
        }
        ctx.beginPath();
        ctx.arc(0, 0, 6, 0, Math.PI * 2);
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(0, 0, 11, 0, Math.PI * 2);
        ctx.stroke();
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
          const maxR = 1 / 0.14; // ~7.1 taps/s max
          const okPace = (s.rate || 0) >= (s.hold || 2.1);
          ctx.fillStyle = 'rgba(8,16,15,.85)';
          ctx.fillRect(bxl - 1, byl - 1, bw + 2, 10);
          ctx.fillStyle = okPace ? (s.color || (i === 0 ? COLORS.amber : COLORS.jade)) : COLORS.danger;
          ctx.fillRect(bxl, byl, bw * Math.min(1, (s.rate || 0) / maxR), 8);
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(bxl + bw * Math.min(1, (s.hold || 2.1) / maxR) - 1, byl - 3, 2, 14);

          let ly2 = ly + 34;
          const t3 = (s.falls > 1 ? `FALL ${s.falls} · ` : '') + `NEED ${(s.hold || 2.1).toFixed(1)} TAPS/S`;
          ctx.font = '600 16px "Barlow Condensed", sans-serif';
          ctx.lineWidth = 4;
          ctx.strokeStyle = 'rgba(8,16,15,.9)';
          ctx.strokeText(t3, lx, ly2);
          ctx.fillStyle = s.falls > 1 ? COLORS.danger : '#ffffff';
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
      } else if (this.gameState.status === 'roundEnd' && this.gameState.stateT > 0.5) {
        const wId = (this.gameState.p1 && this.gameState.p1.ko) ? 1 : 0;
        const winner = wId === 0 ? this.gameState.p1 : this.gameState.p2;
        const wName = (winner?.name || (wId === 0 ? 'AMBER' : 'JADE')).toUpperCase();
        const wCol = winner?.color || (wId === 0 ? COLORS.amber : COLORS.jade);
        this.drawBigText(ctx, `${wName} TAKES IT`, 190, 44, wCol, this.gameState.stateT - 0.5);
      }
    }

    ctx.restore();
  }

  private drawStick(ctx: CanvasRenderingContext2D) {
    const l = STICK.l, r = STICK.r, y = STICK.y, th = STICK.th, x0 = l - 16, x1 = r + 16;
    ctx.lineCap = 'round';

    // Shoots with leaves
    [[290, -14, 30], [660, 12, 34]].forEach(([tx, dx, dy]) => {
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
    [[360, 13, 5], [560, 9, 4], [740, 14, 6]].forEach(([kx, ky, kr]) => {
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

  private drawQuakes(ctx: CanvasRenderingContext2D) {
    if (!this.gameState) return;
    const spiders = [this.gameState.p1, this.gameState.p2].filter(Boolean);
    spiders.forEach((s) => {
      if (s.quake && s.quake > 0) {
        const k = 1 - s.quake / 0.5;
        ctx.save();
        ctx.globalAlpha = 1 - k;
        ctx.strokeStyle = '#e8d9b0';
        ctx.lineWidth = 4;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.ellipse(s.x, STICK.y + STICK.th + 6, k * 260, 10 + k * 8, 0, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
      }
    });
  }

  private legStroke(ctx: CanvasRenderingContext2D, a: { x: number; y: number }, k: { x: number; y: number }, f: { x: number; y: number }, w: number, col: string) {
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
  }

  private drawLegs(ctx: CanvasRenderingContext2D, s: any, bx: number, by: number, far: boolean, colMain: string, colDark: string) {
    const f = s.face;
    const hb = s.hb || 0;
    const t = (this.time.now / 1000);
    const u = s.atkT > 0 ? this.atkProgress(s.atkT) : 0;
    const shaky = (s.stun > 0 && !s.hang) ? 1 : 0;

    for (let i = 0; i < 4; i++) {
      const ax = bx + f * (15 - i * 8) + (far ? f * 2 : 0);
      const ay = by + 5;
      const ph = (s.walkPhase || 0) * Math.PI * 2 + i * Math.PI / 2 + (far ? Math.PI : 0);
      let fx = bx + f * (42 - i * 27) + (far ? f * 10 : 0) + Math.sin(ph) * 9 * (s.move || 0);
      let fy = STICK.y - 1 - Math.max(0, Math.cos(ph)) * 6 * (s.move || 0);
      let kx = (ax + fx) / 2 + f * (i < 2 ? 6 : -6);
      let ky = Math.min(ay, fy) - 24;

      if (i < 2 && !s.hang) {
        if (s.atkT > 0) {
          const atkType = (s.atkType !== undefined ? s.atkType : (s.atkId || 0)) % 3;
          if (atkType === 0) {
            // Animation 0: Overhead Claw Cleave (Downward Slash)
            const lead = i === 0 ? 1 : 0.65;
            if (u < 0) {
              const p = -u; // windup 0 -> 1
              fx = bx + f * (32 - p * (i === 0 ? 10 : 6));
              fy = lerp(STICK.y - 1, by - (i === 0 ? 44 : 34), p);
              kx = (ax + fx) / 2 + f * (i === 0 ? 4 : 0);
              ky = Math.min(ay, fy) - (i === 0 ? 20 : 16);
            } else {
              fx = bx + f * (38 + u * 52 * lead);
              fy = lerp(STICK.y - 1, by + (i === 0 ? 3 : 1), u);
              kx = (ax + fx) / 2;
              ky = Math.min(ay, fy) - 15;
            }
          } else if (atkType === 1) {
            // Animation 1: Piercing Spear Thrust (Horizontal Dual Puncture)
            const lead = i === 0 ? 1 : 0.85;
            if (u < 0) {
              const p = -u; // coil back tightly
              fx = bx + f * (22 - p * (i === 0 ? 12 : 9));
              fy = by - (i === 0 ? 10 : 4) - p * 3;
              kx = bx + f * (i === 0 ? 12 : 8);
              ky = by - (i === 0 ? 38 : 32);
            } else {
              fx = bx + f * (28 + u * 62 * lead);
              fy = by - (i === 0 ? 8 : 2) - u * 2;
              kx = (ax + fx) / 2 + f * 2;
              ky = by - (i === 0 ? 18 : 14);
            }
          } else {
            // Animation 2: Rising Uppercut (Low-to-High Scoop)
            const lead = i === 0 ? 1 : 0.75;
            if (u < 0) {
              const p = -u; // drop low scraping stick
              fx = bx + f * (32 - p * (i === 0 ? 12 : 8));
              fy = lerp(STICK.y - 1, STICK.y + 3, p);
              kx = (ax + fx) / 2 + f * 2;
              ky = by - 8;
            } else {
              fx = bx + f * (34 + u * 48 * lead);
              fy = lerp(STICK.y + 3, by - (i === 0 ? 48 : 36), u);
              kx = (ax + fx) / 2 + f * (i === 0 ? 3 : 1);
              ky = by - (i === 0 ? 60 : 48);
            }
          }
        } else if (s.blocking) {
          fx = bx + f * (30 + i * 10);
          fy = by - 30 - i * 6;
          kx = bx + f * (16 + i * 6);
          ky = by - 50;
        } else if (s.cheer) {
          fx = bx + f * (26 + i * 12) + Math.sin(t * 11 + i) * 5;
          fy = by - 44 + Math.cos(t * 9 + i) * 6;
          kx = bx + f * (18 + i * 6);
          ky = by - 54;
        }
      }

      if (shaky) {
        fx += Math.sin(t * 45 + i * 2) * 3;
        fy -= Math.abs(Math.sin(t * 40 + i)) * 4;
      }

      if (hb > 0.01) {
        const hx = bx + f * (-34 + i * 24) * (far ? 1.12 : 1) + Math.sin(t * 8 + i * 1.7) * (5 + (s.pump || 0) * 8);
        const hy = by - 38 - 8 * Math.sin(t * 6 + i) - (s.pump || 0) * 16;
        const hkx = (ax + hx) / 2 + f * (i < 2 ? 12 : -12);
        const hky = Math.min(ay, hy) - 6;
        fx = lerp(fx, hx, hb);
        fy = lerp(fy, hy, hb);
        kx = lerp(kx, hkx, hb);
        ky = lerp(ky, hky, hb);
      }

      this.legStroke(ctx, { x: ax, y: ay }, { x: kx, y: ky }, { x: fx, y: fy }, far ? 3.2 : 4, far ? colDark : colMain);
    }
  }

  private atkProgress(t: number): number {
    if (t < 0.16) return -Math.min(1, t / 0.16);
    if (t < 0.26) return -1 + 2 * (t - 0.16) / (0.26 - 0.16);
    return 1 - (t - 0.26) / (0.46 - 0.26);
  }

  private drawSpider(ctx: CanvasRenderingContext2D, s: any, t: number) {
    const isAmber = s.id === 0;
    const colMain = s.color || (isAmber ? COLORS.amber : COLORS.jade);
    const colDark = s.colorDark || (isAmber ? COLORS.amberDark : COLORS.jadeDark);
    const colLight = s.colorLight || (isAmber ? COLORS.amberLight : COLORS.jadeLight);
    const pattern = s.pattern || 'stripes';
    const acc = s.acc || 'none';

    const f = s.face;
    const hb = s.hb || 0;
    const u = s.atkT > 0 ? this.atkProgress(s.atkT) : 0;
    const atkType = (s.atkType !== undefined ? s.atkType : (s.atkId || 0)) % 3;

    let atkXOffset = 0;
    let atkYOffset = 0;
    if (s.atkT > 0) {
      if (atkType === 0) {
        // Overhead slash: lunges forward on strike, body rears slightly on windup
        atkXOffset = u * 8;
        atkYOffset = u < 0 ? -u * 3 : u * 2;
      } else if (atkType === 1) {
        // Spear thrust: pulls back on windup, deep thrust surge on strike
        atkXOffset = u < 0 ? u * 5 : u * 12;
        atkYOffset = 0;
      } else {
        // Rising uppercut: ducks low on windup, scoops up on strike
        atkXOffset = u * 9;
        atkYOffset = u < 0 ? -u * 4 : -u * 7;
      }
    }

    const bx = s.x + f * atkXOffset - (s.blocking ? f * 3 : 0);
    let by = STICK.y - BODY_H + (s.blocking ? 6 : 0) + atkYOffset;
    by += Math.sin(t * 3 + s.id * 2) * 1.1 * (1 - hb);
    by -= Math.abs(Math.sin((s.walkPhase || 0) * Math.PI * 2)) * 2.2 * (s.move || 0);
    if (s.stun > 0 && !s.hang) by += 3;

    const byW = BODY_Y + (s.drop || 0) + 26 * hb;
    let flip = lerp(-1, 1, hb);
    if (Math.abs(flip) < 0.06) flip = flip < 0 ? -0.06 : 0.06;

    ctx.save();
    if (s.inv > 0 && Math.floor(t * 18) % 2) ctx.globalAlpha = 0.55;

    // Silk thread
    if (hb > 0.04) {
      const tx = bx - f * 8;
      const ty = byW - 16;
      const ax0 = clamp(s.x, STICK.l, STICK.r);
      const ay0 = STICK.y + STICK.th - 2;
      const sway = Math.sin(t * 2.2 + s.id) * Math.min(10, (s.drop || 0) * 0.08);
      ctx.strokeStyle = 'rgba(238,244,232,.85)';
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.moveTo(ax0, ay0);
      ctx.quadraticCurveTo(ax0 + sway, (ay0 + ty) / 2, tx, ty);
      ctx.stroke();
    }

    ctx.translate(0, byW);
    ctx.scale(1, flip);
    ctx.translate(0, -(STICK.y - BODY_H));

    // Far legs
    this.drawLegs(ctx, s, bx, by, true, colMain, colDark);

    // Abdomen
    const cx = bx - f * 21;
    const cy = by - 1;
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
    ctx.fillStyle = 'rgba(20,12,6,.36)';
    if (pattern === 'dots') {
      [[-12, -5], [-4, 7], [5, -6], [-1, -11], [11, 6], [-14, 8]].forEach(([dx, dy]) => {
        ctx.beginPath();
        ctx.arc(cx + dx, cy + dy, 3.4, 0, Math.PI * 2);
        ctx.fill();
      });
    } else if (pattern === 'chevron') {
      ctx.strokeStyle = 'rgba(20,12,6,.36)';
      ctx.lineWidth = 4.5;
      ctx.lineJoin = 'round';
      [-12, -3, 6].forEach((k) => {
        ctx.beginPath();
        ctx.moveTo(cx + k - f * 6, cy - 13);
        ctx.lineTo(cx + k, cy);
        ctx.lineTo(cx + k - f * 6, cy + 13);
        ctx.stroke();
      });
    } else if (pattern === 'rings') {
      ctx.strokeStyle = 'rgba(20,12,6,.36)';
      ctx.lineWidth = 3.2;
      [6, 12, 17].forEach((r) => {
        ctx.beginPath();
        ctx.ellipse(cx, cy, r, r * 0.75, 0, 0, Math.PI * 2);
        ctx.stroke();
      });
      ctx.fillStyle = 'rgba(20,12,6,.36)';
      ctx.beginPath();
      ctx.arc(cx, cy, 2.5, 0, Math.PI * 2);
      ctx.fill();
    } else if (pattern === 'cross') {
      ctx.fillStyle = 'rgba(20,12,6,.36)';
      ctx.fillRect(cx - 3.5, cy - 18, 7, 36);
      ctx.fillRect(cx - 15, cy - 3.5, 30, 7);
      ctx.beginPath();
      ctx.arc(cx, cy, 6, 0, Math.PI * 2);
      ctx.fill();
    } else if (pattern === 'split') {
      ctx.fillStyle = 'rgba(20,12,6,.36)';
      ctx.fillRect(cx - 30, cy - 24, 60, 24);
      ctx.strokeStyle = 'rgba(20,12,6,.5)';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(cx - 24, cy);
      ctx.lineTo(cx + 24, cy);
      ctx.stroke();
    } else if (pattern === 'webmark') {
      ctx.strokeStyle = 'rgba(20,12,6,.36)';
      ctx.lineWidth = 2;
      for (let a = 0; a < 8; a++) {
        const rad = a * Math.PI / 4;
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.lineTo(cx + Math.cos(rad) * 26, cy + Math.sin(rad) * 20);
        ctx.stroke();
      }
      [7, 14, 21].forEach((r) => {
        ctx.beginPath();
        for (let a = 0; a <= 8; a++) {
          const rad = a * Math.PI / 4;
          const px = cx + Math.cos(rad) * r;
          const py = cy + Math.sin(rad) * (r * 0.75);
          if (a === 0) ctx.moveTo(px, py);
          else ctx.lineTo(px, py);
        }
        ctx.stroke();
      });
    } else if (pattern === 'diamonds') {
      ctx.fillStyle = 'rgba(20,12,6,.36)';
      [-12, 0, 12].forEach((dx) => {
        ctx.beginPath();
        ctx.moveTo(cx + dx, cy - 11);
        ctx.lineTo(cx + dx + 5.5, cy);
        ctx.lineTo(cx + dx, cy + 11);
        ctx.lineTo(cx + dx - 5.5, cy);
        ctx.closePath();
        ctx.fill();
      });
    } else if (pattern !== 'plain') {
      // Stripes
      [-12, -3, 6].forEach((k) => {
        ctx.fillRect(cx + k - 2, cy - 24, 4.5, 48);
      });
    }
    ctx.restore();

    ctx.beginPath();
    ctx.ellipse(cx, cy, 22, 17, 0, 0, Math.PI * 2);
    ctx.strokeStyle = COLORS.outline;
    ctx.lineWidth = 2;
    ctx.stroke();

    // Cephalothorax (head/chest)
    const hx2 = bx + f * 11;
    const hy2 = by;
    const g2 = ctx.createRadialGradient(hx2 - f * 4, hy2 - 6, 1, hx2, hy2, 17);
    g2.addColorStop(0, colMain);
    g2.addColorStop(1, colDark);
    ctx.fillStyle = g2;
    ctx.beginPath();
    ctx.ellipse(hx2, hy2, 16, 13, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    if (s.hitFlash > 0) {
      ctx.fillStyle = `rgba(255,255,255,${(s.hitFlash / 0.2 * 0.7).toFixed(2)})`;
      ctx.beginPath();
      ctx.ellipse(cx, cy, 22, 17, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.ellipse(hx2, hy2, 16, 13, 0, 0, Math.PI * 2);
      ctx.fill();
    }

    // Near legs
    this.drawLegs(ctx, s, bx, by, false, colMain, colDark);

    // Eyes
    const dazed = (s.stun > 0 && !s.hang) || s.ko;
    const eyes: Array<[number, number, number]> = [[18, -6, 3.2], [13, -8.5, 2.6], [23, -3, 2.3]];
    eyes.forEach(([ex0, ey0, er]) => {
      const ex = bx + f * ex0;
      const ey = by + ey0;
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
        ctx.fillStyle = '#f4f7ee';
        ctx.beginPath();
        ctx.arc(ex, ey, er, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#10201f';
        ctx.beginPath();
        ctx.arc(ex + f * 0.9, ey + 0.4, er * 0.5, 0, Math.PI * 2);
        ctx.fill();
      }
    });

    // Accessories
    if (acc === 'band') {
      ctx.lineCap = 'round';
      ctx.strokeStyle = '#e8593f';
      ctx.lineWidth = 5;
      ctx.beginPath();
      ctx.moveTo(hx2 - f * 8, hy2 - 10);
      ctx.quadraticCurveTo(hx2 + f * 4, hy2 - 14, hx2 + f * 14, hy2 - 8);
      ctx.stroke();
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(hx2 - f * 8, hy2 - 10);
      ctx.lineTo(hx2 - f * 22, hy2 - 12 + Math.sin(t * 8) * 3);
      ctx.moveTo(hx2 - f * 8, hy2 - 10);
      ctx.lineTo(hx2 - f * 21, hy2 - 3 + Math.sin(t * 8 + 1) * 3);
      ctx.stroke();
    } else if (acc === 'crown') {
      const cb = hy2 - 11;
      ctx.fillStyle = '#ffd34d';
      ctx.strokeStyle = COLORS.outline;
      ctx.lineWidth = 1.6;
      ctx.lineJoin = 'round';
      ctx.beginPath();
      ctx.moveTo(hx2 - 9, cb);
      ctx.lineTo(hx2 - 9, cb - 10);
      ctx.lineTo(hx2 - 4.5, cb - 5);
      ctx.lineTo(hx2, cb - 13);
      ctx.lineTo(hx2 + 4.5, cb - 5);
      ctx.lineTo(hx2 + 9, cb - 10);
      ctx.lineTo(hx2 + 9, cb);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    } else if (acc === 'horns') {
      const hb0 = hy2 - 10;
      ctx.fillStyle = '#f4efe0';
      ctx.strokeStyle = COLORS.outline;
      ctx.lineWidth = 1.5;
      ctx.lineJoin = 'round';
      [-1, 1].forEach((sg) => {
        ctx.beginPath();
        ctx.moveTo(hx2 + sg * 11, hb0 + 3);
        ctx.lineTo(hx2 + sg * 8, hb0 - 14);
        ctx.lineTo(hx2 + sg * 2, hb0);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
      });
    } else if (acc === 'goggles') {
      const gb = hy2 - 6;
      ctx.strokeStyle = '#5d4037';
      ctx.lineWidth = 2.8;
      ctx.beginPath();
      ctx.moveTo(hx2 - f * 12, gb);
      ctx.quadraticCurveTo(hx2, gb - 4, hx2 + f * 14, gb);
      ctx.stroke();

      const gx1 = hx2 - f * 2;
      const gy1 = gb - 1;
      ctx.fillStyle = '#c0a060';
      ctx.strokeStyle = COLORS.outline;
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      ctx.arc(gx1, gy1, 5, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = '#00cec9';
      ctx.beginPath();
      ctx.arc(gx1, gy1, 3.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(gx1 - 1, gy1 - 1, 1.2, 0, Math.PI * 2);
      ctx.fill();

      const gx2 = hx2 + f * 7;
      const gy2 = gb + 1;
      ctx.fillStyle = '#c0a060';
      ctx.beginPath();
      ctx.arc(gx2, gy2, 5.2, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = '#00cec9';
      ctx.beginPath();
      ctx.arc(gx2, gy2, 3.6, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(gx2 - 1, gy2 - 1, 1.3, 0, Math.PI * 2);
      ctx.fill();

      ctx.strokeStyle = '#c0a060';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(gx1 + f * 4, gy1);
      ctx.lineTo(gx2 - f * 4, gy2);
      ctx.stroke();
    } else if (acc === 'halo') {
      const hly = hy2 - 19 + Math.sin(t * 3.5) * 1.5;
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
    } else if (acc === 'mohawk') {
      const mb = hy2 - 10;
      ctx.strokeStyle = COLORS.outline;
      ctx.lineWidth = 1.4;
      ctx.lineJoin = 'round';
      [
        { dx: -7, dy: -9, w: 4 },
        { dx: -2, dy: -14, w: 5 },
        { dx: 4, dy: -11, w: 4.5 },
        { dx: 9, dy: -6, w: 3.5 }
      ].forEach((spike, idx) => {
        ctx.fillStyle = idx % 2 === 0 ? '#ff2d55' : '#ff793f';
        ctx.beginPath();
        ctx.moveTo(hx2 + f * (spike.dx - spike.w / 2), mb);
        ctx.lineTo(hx2 + f * spike.dx, mb + spike.dy);
        ctx.lineTo(hx2 + f * (spike.dx + spike.w / 2), mb);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
      });
    } else if (acc === 'mask') {
      ctx.fillStyle = '#2c3e50';
      ctx.strokeStyle = COLORS.outline;
      ctx.lineWidth = 1.5;
      ctx.lineJoin = 'round';
      ctx.beginPath();
      ctx.moveTo(hx2 - f * 4, hy2);
      ctx.lineTo(hx2 + f * 14, hy2 - 1);
      ctx.lineTo(hx2 + f * 17, hy2 + 9);
      ctx.lineTo(hx2 + f * 2, hy2 + 9);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      ctx.strokeStyle = '#e74c3c';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(hx2 + f * 3, hy2 + 4);
      ctx.lineTo(hx2 + f * 14, hy2 + 4);
      ctx.stroke();
    } else if (acc === 'tophat') {
      const ty = hy2 - 11;
      ctx.fillStyle = '#1e272e';
      ctx.strokeStyle = COLORS.outline;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.ellipse(hx2, ty, 13, 3.5, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = '#2f3542';
      ctx.fillRect(hx2 - 7, ty - 14, 14, 14);
      ctx.strokeRect(hx2 - 7, ty - 14, 14, 14);

      ctx.fillStyle = '#e84118';
      ctx.fillRect(hx2 - 7, ty - 4, 14, 3);

      ctx.fillStyle = '#1e272e';
      ctx.beginPath();
      ctx.ellipse(hx2, ty - 14, 7, 2, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    }

    // Fangs (chelicerae)
    ctx.fillStyle = '#10201f';
    ctx.beginPath();
    ctx.moveTo(bx + f * 24, by + 3);
    let fangY = 6;
    let fangX = 30;
    if (s.atkT > 0) {
      if (atkType === 0) {
        fangY = u > 0 ? 10 : 5;
        fangX = 30;
      } else if (atkType === 1) {
        fangY = 5;
        fangX = u > 0 ? 34 : 29;
      } else {
        fangY = u > 0 ? 2 : 7;
        fangX = 31;
      }
    }
    ctx.lineTo(bx + f * fangX, by + fangY);
    ctx.lineTo(bx + f * 25, by + 8);
    ctx.closePath();
    ctx.fill();

    // Attack visual effects for each randomized animation
    if (s.atkT > 0.16 && s.atkT < 0.35) {
      const sw = (s.atkT - 0.16) / (0.35 - 0.16);
      const alpha = Math.sin(sw * Math.PI);
      ctx.save();
      ctx.lineCap = 'round';

      if (atkType === 0) {
        // Animation 0: Overhead Claw Cleave (Downward Curved Slash)
        ctx.globalAlpha = alpha * 0.85;
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.9)';
        ctx.lineWidth = 5;
        ctx.beginPath();
        ctx.moveTo(bx + f * 20, by - 36);
        ctx.quadraticCurveTo(bx + f * 72, by - 40, bx + f * (REACH + 8), by + 3);
        ctx.stroke();

        ctx.globalAlpha = alpha * 0.95;
        ctx.strokeStyle = colLight;
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.moveTo(bx + f * 24, by - 32);
        ctx.quadraticCurveTo(bx + f * 70, by - 36, bx + f * (REACH + 4), by);
        ctx.stroke();

        ctx.globalAlpha = alpha * 0.35;
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(bx + f * 16, by - 26);
        ctx.quadraticCurveTo(bx + f * 58, by - 30, bx + f * (REACH - 4), by + 6);
        ctx.stroke();

      } else if (atkType === 1) {
        // Animation 1: Piercing Spear Thrust (Horizontal Dual Puncture + Impact Star)
        const reachX = bx + f * (REACH + 10);

        ctx.globalAlpha = alpha * 0.95;
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.moveTo(bx + f * 24, by - 11);
        ctx.lineTo(reachX, by - 11);
        ctx.stroke();

        ctx.strokeStyle = colLight;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(bx + f * 34, by - 11);
        ctx.lineTo(reachX + f * 2, by - 11);
        ctx.stroke();

        ctx.globalAlpha = alpha * 0.85;
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.85)';
        ctx.lineWidth = 3.5;
        ctx.beginPath();
        ctx.moveTo(bx + f * 22, by - 3);
        ctx.lineTo(reachX - f * 4, by - 3);
        ctx.stroke();

        ctx.globalAlpha = alpha * 0.9;
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(reachX - 8, by - 11); ctx.lineTo(reachX + 8, by - 11);
        ctx.moveTo(reachX, by - 19); ctx.lineTo(reachX, by - 3);
        ctx.stroke();
        ctx.fillStyle = colLight;
        ctx.beginPath();
        ctx.arc(reachX, by - 11, 3, 0, Math.PI * 2);
        ctx.fill();

      } else {
        // Animation 2: Rising Uppercut (Low-to-High Crescent Scoop)
        ctx.globalAlpha = alpha * 0.85;
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.9)';
        ctx.lineWidth = 5;
        ctx.beginPath();
        ctx.moveTo(bx + f * 22, by + 8);
        ctx.quadraticCurveTo(bx + f * 64, by + 12, bx + f * (REACH + 6), by - 42);
        ctx.stroke();

        ctx.globalAlpha = alpha * 0.95;
        ctx.strokeStyle = colLight;
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.moveTo(bx + f * 26, by + 6);
        ctx.quadraticCurveTo(bx + f * 62, by + 8, bx + f * (REACH + 2), by - 38);
        ctx.stroke();

        ctx.globalAlpha = alpha * 0.4;
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.6)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(bx + f * 34, by + 4);
        ctx.quadraticCurveTo(bx + f * 70, by - 2, bx + f * (REACH - 4), by - 48);
        ctx.stroke();
      }

      ctx.restore();
    }

    // Block energy shield
    if (s.blocking) {
      const sx = bx + f * 16;
      const sy = by - 4;
      ctx.globalAlpha = 0.5 + 0.15 * Math.sin(t * 20);
      ctx.strokeStyle = colLight;
      ctx.lineWidth = 4;
      ctx.beginPath();
      if (f > 0) ctx.arc(sx, sy, 46, -1, 1);
      else ctx.arc(sx, sy, 46, Math.PI - 1, Math.PI + 1);
      ctx.stroke();
    }

    // Parry shockwave
    if (s.parryT > 0) {
      const k = 1 - s.parryT / 0.25;
      ctx.globalAlpha = 1 - k;
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 5;
      ctx.beginPath();
      ctx.arc(bx + f * 20, by - 4, 30 + k * 50, 0, Math.PI * 2);
      ctx.stroke();
    }

    // Web tangle
    if (s.snare > 0) {
      ctx.globalAlpha = Math.min(1, s.snare * 2) * 0.8;
      ctx.strokeStyle = '#f3f7ee';
      ctx.lineWidth = 1.4;
      const wx = bx - f * 4, wy = by;
      for (let q = 0; q < 6; q++) {
        const an = q * Math.PI / 3 + 0.3;
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
    }

    // Iron Silk (Shield) bubble
    if (s.shield > 0) {
      ctx.globalAlpha = Math.min(1, s.shield) * (0.6 + 0.15 * Math.sin(t * 12));
      ctx.strokeStyle = '#cfe9ff';
      ctx.fillStyle = 'rgba(160,210,255,.16)';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.ellipse(bx - f * 6, by, 46, 38, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    }

    // Power Strike glowing aura
    if (s.power > 0) {
      ctx.globalAlpha = 0.6 + 0.3 * Math.sin(t * 14);
      ctx.strokeStyle = '#ffb347';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.ellipse(bx - f * 4, by, 40, 32, 0, 0, Math.PI * 2);
      ctx.stroke();
    }

    // Riposte counter stance
    if (s.riposte > 0) {
      ctx.globalAlpha = Math.min(1, s.riposte * 2) * 0.9;
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(bx + f * 4, by - 30);
      ctx.lineTo(bx + f * 48, by + 8);
      ctx.moveTo(bx + f * 48, by - 30);
      ctx.lineTo(bx + f * 4, by + 8);
      ctx.stroke();
    }

    // Leech Fang aura
    if (s.leech > 0) {
      ctx.globalAlpha = 0.5 + 0.2 * Math.sin(t * 10);
      ctx.strokeStyle = '#d24a5a';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.ellipse(bx - f * 4, by, 36, 28, 0, 0, Math.PI * 2);
      ctx.stroke();
    }

    // Haste speed lines
    if (s.hasteT > 0) {
      ctx.globalAlpha = 0.5;
      ctx.strokeStyle = colLight;
      ctx.lineWidth = 2;
      for (let hk = 0; hk < 3; hk++) {
        ctx.beginPath();
        ctx.moveTo(bx - f * (40 + hk * 10), by - 14 + hk * 14);
        ctx.lineTo(bx - f * (70 + hk * 14 + (t * 60) % 12), by - 14 + hk * 14);
        ctx.stroke();
      }
    }

    ctx.restore();
  }

  private drawPond(ctx: CanvasRenderingContext2D, t: number) {
    let dang = 0;
    if (this.gameState && this.gameState.p1 && this.gameState.p2) {
      const spiders = [this.gameState.p1, this.gameState.p2];
      spiders.forEach((s) => {
        if (s.hang && !s.ko) dang = Math.max(dang, (s.drop || 0) / MAXDROP);
      });
    }

    const g = ctx.createLinearGradient(0, POND_Y, 0, CANVAS_HEIGHT);
    g.addColorStop(0, 'rgba(46,129,144,.8)');
    g.addColorStop(1, 'rgba(14,56,68,.96)');
    ctx.fillStyle = g;
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
    for (let r = 0; r < 5; r++) {
      const rx = (r * 211 + 90) % CANVAS_WIDTH;
      const ph = (t * 0.4 + r * 0.37) % 1;
      ctx.beginPath();
      ctx.ellipse(rx, POND_Y + 26 + r * 9, 10 + ph * 34, 2 + ph * 5, 0, 0, Math.PI * 2);
      ctx.globalAlpha = 1 - ph;
      ctx.stroke();
      ctx.globalAlpha = 1;
    }

    // Lily pads
    ctx.fillStyle = 'rgba(52,104,64,.95)';
    [[170, 0], [470, 1.4], [800, 2.6]].forEach(([px, offset]) => {
      ctx.beginPath();
      ctx.ellipse(px, POND_Y + 14 + Math.sin(t * 1.2 + offset) * 1.2, 26, 6, 0, 0, Math.PI * 2);
      ctx.fill();
    });
  }

  private drawParticles(ctx: CanvasRenderingContext2D) {
    this.particles.forEach((p) => {
      ctx.globalAlpha = Math.max(0, p.life / p.max);
      ctx.fillStyle = p.col;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.sz, 0, Math.PI * 2);
      ctx.fill();
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

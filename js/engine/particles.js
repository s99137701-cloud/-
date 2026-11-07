/**
 * Particle System, Seasonal Weather, Dash Afterimages & Ultimate Cutscene FX
 */
window.SF = window.SF || {};

class Particle {
  constructor(x, y, vx, vy, color, size, life, shape = 'circle', alphaDecay = true) {
    this.x = x;
    this.y = y;
    this.vx = vx;
    this.vy = vy;
    this.color = color;
    this.size = size;
    this.maxLife = life;
    this.life = life;
    this.shape = shape; // 'circle', 'spark', 'ink_drop', 'petal', 'maple', 'snow', 'firefly', 'flame'
    this.alphaDecay = alphaDecay;
    this.rotation = Math.random() * Math.PI * 2;
    this.vRot = (Math.random() - 0.5) * 0.15;
    this.oscillation = Math.random() * Math.PI * 2;
  }

  update() {
    this.oscillation += 0.05;
    this.x += this.vx;
    this.y += this.vy;
    this.rotation += this.vRot;

    // Seasonal Weather drifting physics
    if (this.shape === 'petal') {
      // Fluttering Cherry Blossom (벚꽃)
      this.x += Math.sin(this.oscillation) * 1.5;
      this.vy = 1.2 + Math.cos(this.oscillation) * 0.4;
    } else if (this.shape === 'maple') {
      // Swirling Maple Leaf (단풍)
      this.x += Math.cos(this.oscillation) * 2.2 + 0.8;
      this.vy = 1.6 + Math.sin(this.oscillation) * 0.5;
    } else if (this.shape === 'snow') {
      // Gentle Snow Flurry (함박눈)
      this.x += Math.sin(this.oscillation) * 1.2 - 0.5;
      this.vy = 1.5 + Math.random() * 0.5;
    } else if (this.shape === 'firefly') {
      // Summer Firefly hovering
      this.x += Math.sin(this.oscillation) * 1.2;
      this.y += Math.cos(this.oscillation * 1.3) * 1.2;
    } else if (this.shape === 'ink_drop') {
      this.vy += 0.25;
      this.vx *= 0.96;
    }

    this.life--;
    return this.life > 0;
  }

  draw(ctx) {
    const progress = this.life / this.maxLife;
    const alpha = this.alphaDecay ? Math.max(0, progress) : 1;

    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.fillStyle = this.color;
    ctx.strokeStyle = this.color;
    ctx.shadowBlur = ['spark', 'firefly', 'flame'].includes(this.shape) ? 10 : 0;
    ctx.shadowColor = this.color;

    ctx.translate(this.x, this.y);
    ctx.rotate(this.rotation);

    if (this.shape === 'circle') {
      ctx.beginPath();
      ctx.arc(0, 0, this.size * progress, 0, Math.PI * 2);
      ctx.fill();
    } else if (this.shape === 'spark') {
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(-this.size * 2, 0);
      ctx.lineTo(this.size * 2, 0);
      ctx.stroke();
    } else if (this.shape === 'ink_drop') {
      ctx.beginPath();
      ctx.ellipse(0, 0, this.size * progress, this.size * 1.5 * progress, 0, 0, Math.PI * 2);
      ctx.fill();
    } else if (this.shape === 'petal') {
      // Pink Cherry Blossom Petal
      ctx.beginPath();
      ctx.moveTo(0, -this.size * 1.2);
      ctx.quadraticCurveTo(this.size * 0.9, -this.size * 0.4, 0, this.size * 1.2);
      ctx.quadraticCurveTo(-this.size * 0.9, -this.size * 0.4, 0, -this.size * 1.2);
      ctx.fill();
    } else if (this.shape === 'maple') {
      // Red/Golden Maple Leaf
      ctx.beginPath();
      ctx.moveTo(0, -this.size * 1.4);
      ctx.lineTo(this.size * 0.8, -this.size * 0.6);
      ctx.lineTo(this.size * 1.4, 0);
      ctx.lineTo(this.size * 0.4, this.size * 0.8);
      ctx.lineTo(0, this.size * 1.2);
      ctx.lineTo(-this.size * 0.4, this.size * 0.8);
      ctx.lineTo(-this.size * 1.4, 0);
      ctx.lineTo(-this.size * 0.8, -this.size * 0.6);
      ctx.closePath();
      ctx.fill();
    } else if (this.shape === 'snow') {
      // White Snowflake
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(0, 0, this.size, 0, Math.PI * 2);
      ctx.fill();
    } else if (this.shape === 'firefly') {
      // Golden glowing firefly
      const pulse = 0.5 + Math.sin(this.oscillation * 3) * 0.5;
      ctx.globalAlpha = alpha * pulse;
      ctx.beginPath();
      ctx.arc(0, 0, this.size, 0, Math.PI * 2);
      ctx.fill();
    } else if (this.shape === 'flame') {
      ctx.beginPath();
      ctx.arc(0, 0, this.size * (0.5 + progress * 0.5), 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
  }
}

class BrushSlashRibbon {
  constructor(x, y, facing, color, radius = 55, arcSpan = Math.PI * 0.8) {
    this.x = x;
    this.y = y;
    this.facing = facing;
    this.color = color;
    this.radius = radius;
    this.arcSpan = arcSpan;
    this.life = 14;
    this.maxLife = 14;
  }

  update() {
    this.life--;
    return this.life > 0;
  }

  draw(ctx) {
    const progress = this.life / this.maxLife;
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.scale(this.facing, 1);

    ctx.globalAlpha = progress * 0.9;
    ctx.strokeStyle = this.color;
    ctx.shadowBlur = 15;
    ctx.shadowColor = this.color;
    ctx.lineWidth = 12 * progress;
    ctx.lineCap = 'round';

    ctx.beginPath();
    ctx.arc(0, 0, this.radius, -this.arcSpan * 0.5, this.arcSpan * 0.5);
    ctx.stroke();

    ctx.globalAlpha = progress * 0.95;
    ctx.strokeStyle = '#05070a';
    ctx.shadowBlur = 0;
    ctx.lineWidth = 6 * progress;
    ctx.beginPath();
    ctx.arc(0, 0, this.radius + 1, -this.arcSpan * 0.45, this.arcSpan * 0.45);
    ctx.stroke();

    ctx.restore();
  }
}

// Afterimage for Martial Dash (잔상 대시)
class DashAfterimage {
  constructor(x, y, facing, joints, charConfig) {
    this.x = x;
    this.y = y;
    this.facing = facing;
    this.joints = JSON.parse(JSON.stringify(joints));
    this.char = charConfig;
    this.life = 12;
    this.maxLife = 12;
  }

  update() {
    this.life--;
    return this.life > 0;
  }

  draw(ctx) {
    const progress = this.life / this.maxLife;
    ctx.save();
    ctx.globalAlpha = progress * 0.35;
    ctx.translate(this.x, this.y);
    ctx.scale(this.facing, 1);
    ctx.strokeStyle = this.char.color;
    ctx.fillStyle = this.char.color;
    ctx.lineWidth = 3;
    ctx.shadowBlur = 12;
    ctx.shadowColor = this.char.color;

    // Draw silhouette skeleton
    const j = this.joints;
    ctx.beginPath();
    ctx.arc(j.head.x, j.head.y, 11, 0, Math.PI * 2);
    ctx.fill();

    ctx.beginPath();
    ctx.moveTo(j.neck.x, j.neck.y);
    ctx.lineTo(j.hip.x, j.hip.y);
    ctx.moveTo(j.hip.x, j.hip.y);
    ctx.lineTo(j.kneeL.x, j.kneeL.y);
    ctx.lineTo(j.footL.x, j.footL.y);
    ctx.moveTo(j.hip.x, j.hip.y);
    ctx.lineTo(j.kneeR.x, j.kneeR.y);
    ctx.lineTo(j.footR.x, j.footR.y);
    ctx.stroke();

    ctx.restore();
  }
}

class ParticleManager {
  constructor() {
    this.particles = [];
    this.weatherParticles = [];
    this.slashes = [];
    this.afterimages = [];
    this.shakeIntensity = 0;
    this.shakeDecay = 0.9;
    this.shakeOffset = { x: 0, y: 0 };
    this.hitstopFrames = 0;

    // Ultimate Zoom-in Cutscene FX
    this.ultCutscene = {
      active: false,
      timer: 0,
      charName: '',
      color: '',
      zoomScale: 1.0
    };
  }

  reset() {
    this.particles = [];
    this.weatherParticles = [];
    this.slashes = [];
    this.afterimages = [];
    this.shakeIntensity = 0;
    this.shakeOffset = { x: 0, y: 0 };
    this.hitstopFrames = 0;
    this.ultCutscene.active = false;
  }

  addShake(amount) {
    this.shakeIntensity = Math.min(this.shakeIntensity + amount, 34);
  }

  triggerHitstop(frames) {
    this.hitstopFrames = Math.max(this.hitstopFrames, frames);
  }

  isHitstopActive() {
    if (this.hitstopFrames > 0) {
      this.hitstopFrames--;
      return true;
    }
    return false;
  }

  // Trigger Ultimate Cutscene (궁극기 줌인 연출)
  triggerUltimateCutscene(charName, color) {
    this.ultCutscene.active = true;
    this.ultCutscene.timer = 50;
    this.ultCutscene.charName = charName;
    this.ultCutscene.color = color;
    this.ultCutscene.zoomScale = 1.15;
    this.addShake(18);
  }

  addDashAfterimage(x, y, facing, joints, charConfig) {
    this.afterimages.push(new DashAfterimage(x, y, facing, joints, charConfig));
  }

  addBrushSlash(x, y, facing, color, radius = 60) {
    this.slashes.push(new BrushSlashRibbon(x, y, facing, color, radius));
  }

  createHitSparks(x, y, color, count = 16) {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 3 + Math.random() * 8;
      this.particles.push(new Particle(x, y, Math.cos(angle) * speed, Math.sin(angle) * speed - 1.5, '#0a0d14', 3.5 + Math.random() * 4, 18 + Math.floor(Math.random() * 12), 'ink_drop'));
    }

    for (let i = 0; i < count * 0.75; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 4 + Math.random() * 9;
      this.particles.push(new Particle(x, y, Math.cos(angle) * speed, Math.sin(angle) * speed, color, 2 + Math.random() * 3, 12 + Math.floor(Math.random() * 10), 'spark'));
    }
  }

  createGuardSparks(x, y) {
    for (let i = 0; i < 10; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 2.5 + Math.random() * 6;
      this.particles.push(new Particle(x, y, Math.cos(angle) * speed, Math.sin(angle) * speed, '#ffffff', 2.5, 9, 'spark'));
      this.particles.push(new Particle(x, y, Math.cos(angle) * speed * 0.7, Math.sin(angle) * speed * 0.7, '#151a24', 3, 12, 'ink_drop'));
    }
  }

  createGroundDust(x, y, dir = 0) {
    for (let i = 0; i < 7; i++) {
      const vx = (Math.random() - 0.5) * 3 - dir * 2.5;
      const vy = -Math.random() * 2 - 0.5;
      this.particles.push(new Particle(x, y, vx, vy, 'rgba(30, 36, 50, 0.45)', 3.5 + Math.random() * 4.5, 18 + Math.floor(Math.random() * 8), 'circle'));
    }
  }

  createAura(x, y, color, type = 'flame') {
    const vx = (Math.random() - 0.5) * 1.5;
    const vy = -1 - Math.random() * 2.5;
    this.particles.push(new Particle(x, y, vx, vy, color, 3.5 + Math.random() * 3.5, 18 + Math.floor(Math.random() * 10), type));
  }

  // Spawn Weather Particle for current Season
  spawnSeasonalWeather(seasonId) {
    if (this.weatherParticles.length >= 75) return;

    const x = Math.random() * (SF.CONSTANTS.CANVAS_WIDTH + 100) - 50;
    const y = -10;

    if (seasonId === 'SPRING') {
      // 벚꽃잎
      this.weatherParticles.push(new Particle(x, y, 0.5, 1.2, '#ffb7c5', 5 + Math.random() * 3, 400, 'petal', false));
    } else if (seasonId === 'SUMMER') {
      // 반딧불이 / 푸른 잎
      const flyX = Math.random() * SF.CONSTANTS.CANVAS_WIDTH;
      const flyY = 200 + Math.random() * 350;
      this.weatherParticles.push(new Particle(flyX, flyY, 0, 0, '#80cbc4', 3 + Math.random() * 2.5, 300, 'firefly', true));
    } else if (seasonId === 'AUTUMN') {
      // 단풍잎
      const colors = ['#e64a19', '#ff7043', '#ffb300'];
      const color = colors[Math.floor(Math.random() * colors.length)];
      this.weatherParticles.push(new Particle(x, y, 1.0, 1.6, color, 6 + Math.random() * 3, 350, 'maple', false));
    } else if (seasonId === 'WINTER') {
      // 함박눈
      this.weatherParticles.push(new Particle(x, y, -0.4, 1.8, '#ffffff', 2 + Math.random() * 3.5, 380, 'snow', false));
    }
  }

  update() {
    if (this.shakeIntensity > 0.5) {
      this.shakeOffset.x = (Math.random() * 2 - 1) * this.shakeIntensity;
      this.shakeOffset.y = (Math.random() * 2 - 1) * this.shakeIntensity;
      this.shakeIntensity *= this.shakeDecay;
    } else {
      this.shakeIntensity = 0;
      this.shakeOffset.x = 0;
      this.shakeOffset.y = 0;
    }

    // Ultimate Cutscene Timer
    if (this.ultCutscene.active) {
      this.ultCutscene.timer--;
      if (this.ultCutscene.timer <= 0) {
        this.ultCutscene.active = false;
        this.ultCutscene.zoomScale = 1.0;
      }
    }

    // Weather Particles
    for (let i = this.weatherParticles.length - 1; i >= 0; i--) {
      const wp = this.weatherParticles[i];
      if (!wp.update() || wp.y > SF.CONSTANTS.CANVAS_HEIGHT + 20) {
        this.weatherParticles.splice(i, 1);
      }
    }

    // Dash Afterimages
    for (let i = this.afterimages.length - 1; i >= 0; i--) {
      if (!this.afterimages[i].update()) {
        this.afterimages.splice(i, 1);
      }
    }

    // Brush Slashes
    for (let i = this.slashes.length - 1; i >= 0; i--) {
      if (!this.slashes[i].update()) {
        this.slashes.splice(i, 1);
      }
    }

    // Combat Particles
    for (let i = this.particles.length - 1; i >= 0; i--) {
      if (!this.particles[i].update()) {
        this.particles.splice(i, 1);
      }
    }
  }

  draw(ctx) {
    // 1. Dash Afterimages
    for (const a of this.afterimages) {
      a.draw(ctx);
    }

    // 2. Brush Slashes
    for (const s of this.slashes) {
      s.draw(ctx);
    }

    // 3. Combat Particles
    for (const p of this.particles) {
      p.draw(ctx);
    }

    // 4. Weather Particles
    for (const wp of this.weatherParticles) {
      wp.draw(ctx);
    }

    // 5. Ultimate Cutscene Overlay Banner
    if (this.ultCutscene.active) {
      this.drawUltimateBanner(ctx);
    }
  }

  drawUltimateBanner(ctx) {
    ctx.save();
    // Dramatic Letterbox Darkening
    ctx.fillStyle = 'rgba(0, 0, 0, 0.65)';
    ctx.fillRect(0, 0, SF.CONSTANTS.CANVAS_WIDTH, 120);
    ctx.fillRect(0, SF.CONSTANTS.CANVAS_HEIGHT - 120, SF.CONSTANTS.CANVAS_WIDTH, 120);

    // Calligraphy Cutscene Ribbon
    ctx.fillStyle = 'rgba(10, 14, 24, 0.85)';
    ctx.fillRect(0, SF.CONSTANTS.CANVAS_HEIGHT / 2 - 45, SF.CONSTANTS.CANVAS_WIDTH, 90);

    ctx.strokeStyle = this.ultCutscene.color;
    ctx.lineWidth = 3;
    ctx.shadowBlur = 20;
    ctx.shadowColor = this.ultCutscene.color;
    ctx.beginPath();
    ctx.moveTo(0, SF.CONSTANTS.CANVAS_HEIGHT / 2 - 45);
    ctx.lineTo(SF.CONSTANTS.CANVAS_WIDTH, SF.CONSTANTS.CANVAS_HEIGHT / 2 - 45);
    ctx.moveTo(0, SF.CONSTANTS.CANVAS_HEIGHT / 2 + 45);
    ctx.lineTo(SF.CONSTANTS.CANVAS_WIDTH, SF.CONSTANTS.CANVAS_HEIGHT / 2 + 45);
    ctx.stroke();

    // Text
    ctx.font = '900 48px "Noto Serif KR", serif';
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(`사방신 오의 (四方神 奧義) - ${this.ultCutscene.charName}`, SF.CONSTANTS.CANVAS_WIDTH / 2, SF.CONSTANTS.CANVAS_HEIGHT / 2);
    ctx.restore();
  }
}

SF.FX = new ParticleManager();

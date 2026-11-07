/**
 * Projectiles & Hazard Zones for Skills
 */
window.SF = window.SF || {};

class Projectile {
  constructor(owner, x, y, vx, vy, config) {
    this.owner = owner; // Fighter instance
    this.x = x;
    this.y = y;
    this.vx = vx;
    this.vy = vy;
    this.config = config; // { type, damage, width, height, life, color, hitstun, knockback, isHazard }
    this.life = config.life || 60;
    this.maxLife = this.life;
    this.active = true;
    this.trailTimer = 0;
  }

  update() {
    this.x += this.vx;
    this.y += this.vy;
    this.life--;

    // Gravity / ground check for special projectiles
    if (this.config.type === 'FIRE_ORB') {
      this.vy += 0.3; // Slight arc
      if (this.y >= SF.CONSTANTS.PHYSICS.FLOOR_Y) {
        this.y = SF.CONSTANTS.PHYSICS.FLOOR_Y;
        this.vx = 0;
        this.vy = 0;
        this.config.isHazard = true; // Transforms into burning flame puddle
      }
    }

    // Aura particles
    this.trailTimer++;
    if (this.trailTimer % 2 === 0) {
      SF.FX.createAura(this.x, this.y, this.config.color, 'flame');
    }

    if (this.life <= 0 || this.x < 0 || this.x > SF.CONSTANTS.CANVAS_WIDTH) {
      this.active = false;
    }
  }

  getHitbox() {
    return {
      x: this.x - this.config.width / 2,
      y: this.y - this.config.height / 2,
      w: this.config.width,
      h: this.config.height
    };
  }

  draw(ctx) {
    ctx.save();
    ctx.fillStyle = this.config.color;
    ctx.strokeStyle = '#ffffff';
    ctx.shadowBlur = 15;
    ctx.shadowColor = this.config.color;

    if (this.config.type === 'WIND_CUTTER') {
      // Crescent Wind Blade
      ctx.translate(this.x, this.y);
      ctx.rotate(this.vx > 0 ? 0 : Math.PI);
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(0, 0, 24, -Math.PI / 3, Math.PI / 3);
      ctx.quadraticCurveTo(-10, 0, 0, -Math.PI / 3);
      ctx.fill();
      ctx.stroke();
    } else if (this.config.type === 'FIRE_ORB') {
      if (this.config.isHazard) {
        // Fire patch on ground
        ctx.beginPath();
        ctx.ellipse(this.x, this.y, 40, 10, 0, 0, Math.PI * 2);
        ctx.fill();
      } else {
        // Flying fire ball
        ctx.beginPath();
        ctx.arc(this.x, this.y, 14, 0, Math.PI * 2);
        ctx.fill();
      }
    } else if (this.config.type === 'TIGER_WAVE') {
      // Ground shockwave
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(this.x, SF.CONSTANTS.PHYSICS.FLOOR_Y);
      ctx.lineTo(this.x + 15, SF.CONSTANTS.PHYSICS.FLOOR_Y - 45);
      ctx.lineTo(this.x + 30, SF.CONSTANTS.PHYSICS.FLOOR_Y);
      ctx.stroke();
    } else if (this.config.type === 'CHAIN_SICKLE') {
      // Sickle blade + chain connecting to owner
      ctx.lineWidth = 2;
      ctx.strokeStyle = '#aaaaaa';
      ctx.beginPath();
      ctx.moveTo(this.owner.x, this.owner.y - 45);
      ctx.lineTo(this.x, this.y);
      ctx.stroke();

      ctx.fillStyle = this.config.color;
      ctx.beginPath();
      ctx.arc(this.x, this.y, 10, 0, Math.PI * 2);
      ctx.fill();
    } else {
      // Generic circular blast
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.config.width / 2, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
  }
}

SF.Projectile = Projectile;

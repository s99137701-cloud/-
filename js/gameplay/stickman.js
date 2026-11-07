/**
 * 사방신 무림전 - 2D 수묵화 무림 고수 (Sumi-e Wuxia Master) 렌더러 & 물리 상태 머신
 */
window.SF = window.SF || {};

class StickmanFighter {
  constructor(charConfig, isP1 = true, isAI = false) {
    this.char = charConfig;
    this.isP1 = isP1;
    this.isAI = isAI;

    // Position & Physics
    this.x = isP1 ? 360 : 920;
    this.y = SF.CONSTANTS.PHYSICS.FLOOR_Y;
    this.vx = 0;
    this.vy = 0;
    this.facing = isP1 ? 1 : -1;

    // Combat Stats
    this.maxHp = charConfig.maxHp;
    this.hp = this.maxHp;
    this.sp = 0;
    this.isDead = false;

    // Movement & Double Jump
    this.isGrounded = true;
    this.jumpCount = 0;
    this.maxJumps = charConfig.canDoubleJump ? 2 : 1;

    // State Machine
    this.state = 'IDLE';
    this.stateTimer = 0;
    this.stateDuration = 0;

    // Guard / Defense
    this.isGuarding = false;
    this.isParrying = false;
    this.cooldowns = { special: 0 };

    // Attack state data
    this.currentAttack = null;
    this.hasHitEnemy = false;

    // Animation internal ticker & Robe Physics
    this.animTick = 0;
    this.robeLag = 0; // Physics drag for flowing robe
    this.hairLag = 0;

    // Opponent reference
    this.opponent = null;
  }

  reset(x, facing) {
    this.x = x;
    this.y = SF.CONSTANTS.PHYSICS.FLOOR_Y;
    this.vx = 0;
    this.vy = 0;
    this.facing = facing;
    this.hp = this.maxHp;
    this.sp = 0;
    this.isDead = false;
    this.isGrounded = true;
    this.jumpCount = 0;
    this.state = 'IDLE';
    this.stateTimer = 0;
    this.stateDuration = 0;
    this.currentAttack = null;
    this.hasHitEnemy = false;
    this.cooldowns.special = 0;
  }

  update() {
    this.animTick++;

    // Robe cloth drag simulation
    const targetRobeLag = -this.vx * 3.5 - (this.vy < 0 ? 8 : -4);
    this.robeLag += (targetRobeLag - this.robeLag) * 0.18;
    this.hairLag += (-this.vx * 2.5 - this.hairLag) * 0.15;

    // Decrement cooldowns
    if (this.cooldowns.special > 0) this.cooldowns.special--;

    // Update state timer
    if (this.stateDuration > 0) {
      this.stateTimer++;
      if (this.stateTimer >= this.stateDuration) {
        this.onStateEnd();
      }
    }

    // Apply Physics
    this.applyPhysics();

    // Auto-face opponent if in neutral states
    if (this.opponent && ['IDLE', 'WALK', 'JUMP', 'FALL', 'CROUCH'].includes(this.state)) {
      this.facing = this.x < this.opponent.x ? 1 : -1;
    }
  }

  applyPhysics() {
    if (!this.isGrounded) {
      this.vy += SF.CONSTANTS.PHYSICS.GRAVITY;
      if (this.vy > SF.CONSTANTS.PHYSICS.MAX_FALL_SPEED) {
        this.vy = SF.CONSTANTS.PHYSICS.MAX_FALL_SPEED;
      }
    }

    this.x += this.vx;
    this.y += this.vy;

    if (this.isGrounded) {
      this.vx *= SF.CONSTANTS.PHYSICS.GROUND_FRICTION;
      if (Math.abs(this.vx) < 0.2) this.vx = 0;
    } else {
      this.vx *= SF.CONSTANTS.PHYSICS.AIR_FRICTION;
    }

    // Floor collision
    if (this.y >= SF.CONSTANTS.PHYSICS.FLOOR_Y) {
      this.y = SF.CONSTANTS.PHYSICS.FLOOR_Y;
      this.vy = 0;
      if (!this.isGrounded) {
        this.isGrounded = true;
        this.jumpCount = 0;
        SF.FX.createGroundDust(this.x, this.y, this.facing);
        if (['JUMP', 'FALL'].includes(this.state)) {
          this.setState('IDLE');
        }
      }
    } else {
      this.isGrounded = false;
    }

    // Arena bounds
    if (this.x < SF.CONSTANTS.PHYSICS.ARENA_LEFT) {
      this.x = SF.CONSTANTS.PHYSICS.ARENA_LEFT;
      this.vx = 0;
    } else if (this.x > SF.CONSTANTS.PHYSICS.ARENA_RIGHT) {
      this.x = SF.CONSTANTS.PHYSICS.ARENA_RIGHT;
      this.vx = 0;
    }
  }

  setState(newState, duration = 0) {
    this.state = newState;
    this.stateTimer = 0;
    this.stateDuration = duration;
    this.hasHitEnemy = false;
    this.isGuarding = false;
    this.isParrying = false;
  }

  onStateEnd() {
    if (this.state === 'DEAD') return;
    this.setState(this.isGrounded ? 'IDLE' : 'FALL');
    this.currentAttack = null;
  }

  move(dir) {
    if (!['IDLE', 'WALK', 'JUMP', 'FALL'].includes(this.state)) return;
    this.vx = dir * this.char.speed;
    if (this.isGrounded && this.state !== 'WALK') {
      this.setState('WALK');
    }

    // High speed dash afterimage
    if (Math.abs(this.vx) > 5.5 && this.animTick % 3 === 0) {
      SF.FX.addDashAfterimage(this.x, this.y, this.facing, this.computeJoints(), this.char);
    }
  }

  stopMove() {
    if (this.state === 'WALK') {
      this.setState('IDLE');
    }
  }

  jump() {
    if (!['IDLE', 'WALK', 'JUMP', 'FALL'].includes(this.state)) return;
    if (this.jumpCount < this.maxJumps) {
      this.vy = this.char.jumpForce;
      this.isGrounded = false;
      this.jumpCount++;
      this.setState('JUMP');
      SF.Sound.playJump();
      SF.FX.createGroundDust(this.x, this.y, 0);
      if (this.jumpCount === 2) {
        SF.FX.createAura(this.x, this.y, this.char.color, 'spark');
      }
    }
  }

  crouch(isGuarding = true) {
    if (!['IDLE', 'WALK'].includes(this.state)) return;
    this.setState('CROUCH');
    this.isGuarding = isGuarding;
    this.vx = 0;
  }

  standUp() {
    if (this.state === 'CROUCH') {
      this.setState('IDLE');
      this.isGuarding = false;
    }
  }

  // Light Attack (Z)
  attackLight() {
    if (!['IDLE', 'WALK'].includes(this.state)) return;
    const atk = this.char.skills.light;
    this.currentAttack = { ...atk, type: 'LIGHT' };
    this.setState('ATTACK_LIGHT', atk.duration);
    this.vx = this.facing * 3;

    // Calligraphic Brush Slash Ribbon
    SF.FX.addBrushSlash(this.x + this.facing * 35, this.y - 45, this.facing, this.char.color, 55);

    if (atk.sound === 'slash') SF.Sound.playSlash();
    else SF.Sound.playHitLight();
  }

  // Heavy Attack (X)
  attackHeavy() {
    if (!['IDLE', 'WALK'].includes(this.state)) return;
    const atk = this.char.skills.heavy;
    this.currentAttack = { ...atk, type: 'HEAVY' };
    this.setState('ATTACK_HEAVY', atk.duration);
    if (atk.dashSpeed) {
      this.vx = this.facing * atk.dashSpeed;
    }

    // Calligraphic Heavy Brush Arc
    SF.FX.addBrushSlash(this.x + this.facing * 45, this.y - 50, this.facing, this.char.color, 75);

    if (atk.sound === 'hitHeavy') SF.Sound.playHitHeavy();
    else if (atk.sound === 'slash') SF.Sound.playSlash();
    else SF.Sound.playFireBlast();
  }

  // Special Skill (C)
  useSpecial(projectilesList) {
    if (!['IDLE', 'WALK', 'JUMP', 'FALL'].includes(this.state)) return;
    const skill = this.char.skills.special;
    if (this.cooldowns.special > 0 || this.sp < skill.spCost) return;

    this.sp = Math.max(0, this.sp - skill.spCost);
    this.cooldowns.special = skill.cooldown;
    this.setState('SKILL', 24);

    if (this.char.id === 'BLUE_DRAGON') {
      // 청룡파: 풍압 검기 사출
      SF.Sound.playSlash();
      SF.FX.addBrushSlash(this.x + this.facing * 35, this.y - 45, this.facing, this.char.color, 65);
      projectilesList.push(new SF.Projectile(this, this.x + this.facing * 42, this.y - 48, this.facing * 14.5, 0, {
        type: 'WIND_CUTTER',
        damage: 65,
        width: 50,
        height: 26,
        color: this.char.color,
        life: 55,
        hitstun: 20,
        knockback: { x: 6, y: -3 }
      }));
    } else if (this.char.id === 'WHITE_TIGER') {
      // 백호 맹돌: 패기 돌진 + 대지 지진파
      this.vx = this.facing * 12.5;
      SF.Sound.playHitHeavy();
      SF.FX.addShake(9);
      SF.FX.addBrushSlash(this.x + this.facing * 40, this.y - 30, this.facing, this.char.color, 85);
      projectilesList.push(new SF.Projectile(this, this.x + this.facing * 30, SF.CONSTANTS.PHYSICS.FLOOR_Y - 20, this.facing * 9, 0, {
        type: 'TIGER_WAVE',
        damage: 80,
        width: 40,
        height: 55,
        color: this.char.color,
        life: 45,
        hitstun: 25,
        knockback: { x: 7, y: -6 }
      }));
    } else if (this.char.id === 'VERMILION_BIRD') {
      // 주작 업화탄: 철선에서 뿜어지는 화염 부채질
      SF.Sound.playFireBlast();
      SF.FX.addBrushSlash(this.x + this.facing * 30, this.y - 45, this.facing, this.char.color, 65);
      projectilesList.push(new SF.Projectile(this, this.x + this.facing * 35, this.y - 50, this.facing * 10.5, -3, {
        type: 'FIRE_ORB',
        damage: 70,
        width: 30,
        height: 30,
        color: this.char.color,
        life: 140,
        hitstun: 18,
        knockback: { x: 4, y: -2 }
      }));
    } else if (this.char.id === 'BLACK_TORTOISE') {
      // 현무 수경 반격: 결계 stance
      this.isParrying = true;
      this.stateDuration = 35;
      SF.Sound.playGuard();
      SF.FX.createAura(this.x, this.y - 40, this.char.color, 'flame');
    }
  }

  // Ultimate (L key, 100 SP)
  useUltimate(projectilesList) {
    if (!['IDLE', 'WALK'].includes(this.state)) return;
    if (this.sp < 100) return;

    this.sp = 0;
    this.setState('ULTIMATE', 65);
    SF.Sound.playUltimate();
    SF.FX.addShake(20);
    SF.FX.triggerHitstop(SF.CONSTANTS.COMBAT.HITSTOP_ULT);

    // Cinematic Zoom-in Cutscene Banner
    SF.FX.triggerUltimateCutscene(this.char.nameKr, this.char.color);

    // Calligraphy brush explosion
    for (let i = 0; i < 30; i++) {
      SF.FX.createAura(this.x, this.y - 40, this.char.color, 'flame');
    }

    if (this.char.id === 'BLUE_DRAGON') {
      // 청룡참: 초고속 십자 검기 난무
      for (let i = 0; i < 5; i++) {
        setTimeout(() => {
          if (this.isDead) return;
          SF.Sound.playSlash();
          SF.FX.addShake(7);
          SF.FX.addBrushSlash(this.x + this.facing * (30 + i * 30), this.y - 70 + (i % 3) * 25, this.facing, this.char.color, 90);
          projectilesList.push(new SF.Projectile(this, this.x + this.facing * (30 + i * 25), this.y - 70 + (i % 3) * 25, this.facing * 18, (i - 2) * 1.5, {
            type: 'WIND_CUTTER',
            damage: 60,
            width: 65,
            height: 32,
            color: this.char.color,
            life: 50,
            hitstun: 28,
            knockback: { x: 9.5, y: -5 }
          }));
        }, i * 110);
      }
    } else if (this.char.id === 'WHITE_TIGER') {
      // 백호포효쇄: 대지 분쇄
      setTimeout(() => {
        if (this.isDead) return;
        SF.Sound.playHitHeavy();
        SF.FX.addShake(24);
        SF.FX.addBrushSlash(this.x + this.facing * 60, SF.CONSTANTS.PHYSICS.FLOOR_Y - 50, this.facing, this.char.color, 120);
        projectilesList.push(new SF.Projectile(this, this.x + this.facing * 60, SF.CONSTANTS.PHYSICS.FLOOR_Y - 45, this.facing * 5, 0, {
          type: 'TIGER_WAVE',
          damage: 280,
          width: 150,
          height: 130,
          color: this.char.color,
          life: 38,
          hitstun: 40,
          knockback: { x: 13, y: -12 }
        }));
      }, 350);
    } else if (this.char.id === 'VERMILION_BIRD') {
      // 주작천상진: 성화폭격
      this.vy = -14.5;
      for (let i = 0; i < 6; i++) {
        setTimeout(() => {
          if (this.isDead) return;
          SF.Sound.playFireBlast();
          SF.FX.addShake(6);
          const targetX = this.opponent ? this.opponent.x + (Math.random() - 0.5) * 120 : this.x + this.facing * 200;
          projectilesList.push(new SF.Projectile(this, targetX, 0, 0, 16, {
            type: 'FIRE_ORB',
            damage: 55,
            width: 38,
            height: 38,
            color: this.char.color,
            life: 60,
            hitstun: 20,
            knockback: { x: 5, y: -4 }
          }));
        }, i * 100);
      }
    } else if (this.char.id === 'BLACK_TORTOISE') {
      // 현무수진각: 묵류 소용돌이
      setTimeout(() => {
        if (this.isDead) return;
        SF.Sound.playFireBlast();
        SF.FX.addShake(16);
        projectilesList.push(new SF.Projectile(this, this.opponent ? this.opponent.x : this.x + this.facing * 100, SF.CONSTANTS.PHYSICS.FLOOR_Y - 50, 0, 0, {
          type: 'WHIRLPOOL',
          damage: 260,
          width: 190,
          height: 150,
          color: this.char.color,
          life: 45,
          hitstun: 45,
          knockback: { x: 0, y: -10 }
        }));
      }, 300);
    }
  }

  getHurtbox() {
    const isCrouching = this.state === 'CROUCH';
    const height = isCrouching ? 58 : 98;
    return {
      x: this.x - 26,
      y: this.y - height,
      w: 52,
      h: height
    };
  }

  getCurrentHitbox() {
    if (!['ATTACK_LIGHT', 'ATTACK_HEAVY'].includes(this.state)) return null;
    if (this.hasHitEnemy || !this.currentAttack) return null;

    const activeStart = Math.floor(this.stateDuration * 0.25);
    const activeEnd = Math.floor(this.stateDuration * 0.75);
    if (this.stateTimer < activeStart || this.stateTimer > activeEnd) return null;

    const baseBox = this.currentAttack.hitbox;
    const boxX = this.facing === 1 ? this.x + baseBox.x : this.x - baseBox.x - baseBox.w;
    return {
      x: boxX,
      y: this.y + baseBox.y,
      w: baseBox.w,
      h: baseBox.h,
      damage: this.currentAttack.damage,
      hitstun: this.currentAttack.hitstun,
      knockback: this.currentAttack.knockback,
      guardBreak: this.currentAttack.guardBreak || false,
      type: this.currentAttack.type
    };
  }

  takeDamage(amount, hitstun, knockback, isGuardBreak = false) {
    if (this.isDead) return false;

    // Counter Parry (Black Tortoise Special)
    if (this.isParrying) {
      SF.Sound.playGuard();
      SF.FX.createGuardSparks(this.x, this.y - 45);
      SF.FX.addShake(12);
      if (this.opponent) {
        this.opponent.takeDamage(95, 30, { x: 10, y: -6 }, true);
      }
      this.isParrying = false;
      this.setState('IDLE');
      return false;
    }

    // Check Guard
    if (this.isGuarding && !isGuardBreak) {
      const reduced = Math.floor(amount * SF.CONSTANTS.COMBAT.GUARD_DAMAGE_RATIO);
      this.hp = Math.max(0, this.hp - reduced);
      this.sp = Math.min(SF.CONSTANTS.COMBAT.MAX_SP, this.sp + 4);
      this.vx = -this.facing * (knockback.x * 0.35);
      SF.Sound.playGuard();
      SF.FX.createGuardSparks(this.x, this.y - 45);
      SF.FX.triggerHitstop(SF.CONSTANTS.COMBAT.HITSTOP_LIGHT);
      return false;
    }

    // Full Hit
    const finalDamage = Math.floor(amount * this.char.defense);
    this.hp = Math.max(0, this.hp - finalDamage);
    this.sp = Math.min(SF.CONSTANTS.COMBAT.MAX_SP, this.sp + SF.CONSTANTS.COMBAT.SP_GAIN_DAMAGE);

    this.vx = -this.facing * knockback.x;
    this.vy = knockback.y;

    if (this.hp <= 0) {
      this.hp = 0;
      this.isDead = true;
      this.setState('DEAD');
      SF.FX.addShake(22);
      SF.FX.triggerHitstop(SF.CONSTANTS.COMBAT.HITSTOP_HEAVY);
    } else {
      this.setState(knockback.y < -3 ? 'KNOCKBACK' : 'HURT', hitstun);
      SF.FX.addShake(knockback.x > 7 ? 12 : 6);
      SF.FX.triggerHitstop(knockback.x > 7 ? SF.CONSTANTS.COMBAT.HITSTOP_HEAVY : SF.CONSTANTS.COMBAT.HITSTOP_LIGHT);
    }

    SF.FX.createHitSparks(this.x, this.y - 45, this.char.color, 16);
    return true;
  }

  // ==========================================
  // SUMI-E WUXIA MASTER 2D PROCEDURAL RENDERER
  // ==========================================
  draw(ctx) {
    ctx.save();

    // Floor Shadow with Sumi-e Ink Blot (먹물 번짐 그림자)
    const distFromGround = SF.CONSTANTS.PHYSICS.FLOOR_Y - this.y;
    const shadowScale = Math.max(0.3, 1 - distFromGround / 300);
    ctx.fillStyle = 'rgba(10, 14, 22, 0.6)';
    ctx.beginPath();
    ctx.ellipse(this.x, SF.CONSTANTS.PHYSICS.FLOOR_Y + 4, 38 * shadowScale, 9 * shadowScale, 0, 0, Math.PI * 2);
    ctx.fill();

    // Martial Aura & Ink Stroke Outline Settings
    ctx.shadowBlur = 10;
    ctx.shadowColor = this.char.glowColor;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    // Orient facing
    ctx.translate(this.x, this.y);
    ctx.scale(this.facing, 1);

    const joints = this.computeJoints();

    // 1. Draw Flowing Hair Ribbons (뒤로 휘날리는 댕기/머리끈)
    this.drawHairRibbons(ctx, joints.head);

    // 2. Draw Back Robe Flap (뒤쪽 도포 자락)
    this.drawRobeTail(ctx, joints.hip, -1);

    // 3. Draw Legs & Martial Trousers (하의 & 각반)
    this.drawMartialLeg(ctx, joints.hip, joints.kneeL, joints.footL, '#1a1f2c', false);
    this.drawMartialLeg(ctx, joints.hip, joints.kneeR, joints.footR, '#283044', true);

    // 4. Draw Flowing Front Robe Flap (앞쪽 도포 자락)
    this.drawRobeTail(ctx, joints.hip, 1);

    // 5. Draw Martial Robe Torso (도포 상의 & 요대/복대)
    this.drawMartialTorso(ctx, joints.neck, joints.hip);

    // 6. Draw Back Arm & Wide Sleeve (뒤쪽 팔과 도포 소매)
    this.drawMartialArm(ctx, joints.neck, joints.elbowL, joints.handL, false);

    // 7. Draw Master Head (상투, 관, 영안)
    this.drawMasterHead(ctx, joints.head);

    // 8. Draw Front Arm & Wide Sleeve (앞쪽 팔과 도포 소매)
    this.drawMartialArm(ctx, joints.neck, joints.elbowR, joints.handR, true);

    // 9. Draw Dedicated Wuxia Weapon (보구: 청룡검, 백호대도, 주작철선, 현무사슬낫)
    this.drawWeapon(ctx, joints.handR, joints.elbowR);

    // 10. Guard Seal (수경/결계 방벽)
    if (this.isGuarding) {
      ctx.strokeStyle = this.char.color;
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.arc(18, -48, 44, -Math.PI / 2.5, Math.PI / 2.5);
      ctx.stroke();

      // Ink wave arc
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(22, -48, 38, -Math.PI / 3, Math.PI / 3);
      ctx.stroke();
    }

    ctx.restore();
  }

  // Draw Hair & Trailing Ribbon
  drawHairRibbons(ctx, head) {
    ctx.save();
    ctx.strokeStyle = '#05070a';
    ctx.fillStyle = '#05070a';
    ctx.lineWidth = 3;

    // Topknot (상투)
    ctx.beginPath();
    ctx.ellipse(head.x - 2, head.y - 12, 6, 8, -0.2, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Flowing Ribbon (머리끈 자락)
    ctx.strokeStyle = this.char.sashColor;
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(head.x - 6, head.y - 10);
    const dragX = -18 + this.hairLag;
    ctx.quadraticCurveTo(head.x + dragX * 0.6, head.y - 6, head.x + dragX, head.y - 2);
    ctx.stroke();
    ctx.restore();
  }

  // Draw Martial Legs with Fabric Trousers
  drawMartialLeg(ctx, hip, knee, foot, color, isFront) {
    ctx.save();
    // Trousers Fill (무복 바지)
    ctx.strokeStyle = color;
    ctx.lineWidth = isFront ? 9 : 7;
    ctx.beginPath();
    ctx.moveTo(hip.x, hip.y);
    ctx.lineTo(knee.x, knee.y);
    ctx.lineTo(foot.x, foot.y);
    ctx.stroke();

    // Dark Sumi-e Outline (먹선)
    ctx.strokeStyle = '#05070a';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Boots / Gaiters (각반 & 혜)
    ctx.fillStyle = '#0a0d14';
    ctx.beginPath();
    ctx.arc(foot.x, foot.y, 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  // Draw Flowing Robe Tail (도포 자락)
  drawRobeTail(ctx, hip, layer) {
    ctx.save();
    ctx.fillStyle = this.char.robeColor;
    ctx.strokeStyle = '#05070a';
    ctx.lineWidth = 2.5;

    const lag = this.robeLag * layer;
    ctx.beginPath();
    ctx.moveTo(hip.x - 6, hip.y);
    ctx.lineTo(hip.x + 8, hip.y);
    ctx.quadraticCurveTo(hip.x + 12 + lag * 0.5, hip.y + 20, hip.x + 10 + lag, hip.y + 36);
    ctx.lineTo(hip.x - 12 + lag, hip.y + 36);
    ctx.quadraticCurveTo(hip.x - 8 + lag * 0.5, hip.y + 18, hip.x - 6, hip.y);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Robe trim accent (도포 동정선)
    ctx.strokeStyle = this.char.color;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(hip.x - 12 + lag, hip.y + 36);
    ctx.lineTo(hip.x + 10 + lag, hip.y + 36);
    ctx.stroke();

    ctx.restore();
  }

  // Draw Martial Torso & Sash (도포 상의와 요대)
  drawMartialTorso(ctx, neck, hip) {
    ctx.save();
    // Robe Body
    ctx.fillStyle = this.char.robeColor;
    ctx.strokeStyle = '#05070a';
    ctx.lineWidth = 2.5;

    ctx.beginPath();
    ctx.moveTo(neck.x - 8, neck.y);
    ctx.lineTo(neck.x + 8, neck.y);
    ctx.lineTo(hip.x + 7, hip.y);
    ctx.lineTo(hip.x - 7, hip.y);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Collar V-Lapel (깃/동정)
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(neck.x - 5, neck.y);
    ctx.lineTo(neck.x, neck.y + 16);
    ctx.lineTo(neck.x + 5, neck.y);
    ctx.stroke();

    // Martial Sash / Belt (요대/복대)
    ctx.fillStyle = this.char.sashColor;
    ctx.fillRect(hip.x - 8, hip.y - 8, 16, 8);
    ctx.strokeStyle = '#05070a';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(hip.x - 8, hip.y - 8, 16, 8);
    ctx.restore();
  }

  // Draw Martial Arm with Wide Flowing Sleeves (도포 소매)
  drawMartialArm(ctx, neck, elbow, hand, isFront) {
    ctx.save();
    // Upper Arm & Wide Sleeve
    ctx.fillStyle = this.char.robeColor;
    ctx.strokeStyle = '#05070a';
    ctx.lineWidth = 2;

    // Billowing Sleeve Polygon
    ctx.beginPath();
    ctx.moveTo(neck.x, neck.y);
    ctx.lineTo(elbow.x, elbow.y);
    ctx.lineTo(elbow.x - 6, elbow.y + 12); // Sleeve drapery
    ctx.lineTo(neck.x - 5, neck.y + 8);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Forearm & Bracer
    ctx.strokeStyle = isFront ? '#d5dbe6' : '#7f8899';
    ctx.lineWidth = isFront ? 6 : 5;
    ctx.beginPath();
    ctx.moveTo(elbow.x, elbow.y);
    ctx.lineTo(hand.x, hand.y);
    ctx.stroke();

    ctx.strokeStyle = '#05070a';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Fist / Hand
    ctx.fillStyle = '#f0c69d'; // Skin tone
    ctx.beginPath();
    ctx.arc(hand.x, hand.y, 3.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  // Draw Master Head & Hair
  drawMasterHead(ctx, head) {
    ctx.save();
    // Hair & Head Silhouette
    ctx.fillStyle = '#070a10';
    ctx.strokeStyle = '#070a10';
    ctx.beginPath();
    ctx.arc(head.x, head.y, 11, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Martial Face Contour
    ctx.fillStyle = '#e8be96';
    ctx.beginPath();
    ctx.arc(head.x + 3, head.y + 1, 8, -Math.PI / 2, Math.PI / 2);
    ctx.fill();

    // Glowing Martial Eye (영안)
    ctx.fillStyle = this.char.color;
    ctx.shadowBlur = 8;
    ctx.shadowColor = this.char.color;
    ctx.beginPath();
    ctx.ellipse(head.x + 5, head.y, 3, 1.8, 0.2, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  // Draw Dedicated Wuxia Weapon (사방신 보구)
  drawWeapon(ctx, hand, elbow) {
    ctx.save();
    ctx.translate(hand.x, hand.y);

    const angle = Math.atan2(hand.y - elbow.y, hand.x - elbow.x);
    ctx.rotate(angle);

    ctx.shadowBlur = 12;
    ctx.shadowColor = this.char.color;

    if (this.char.weaponType === 'SWORD') {
      // 1. 청룡검 (靑龍劍) - 날렵한 양날 보검 & 검수 매듭
      ctx.lineWidth = 3.5;
      ctx.strokeStyle = '#ffffff';
      ctx.fillStyle = this.char.color;

      // Blade
      ctx.beginPath();
      ctx.moveTo(-4, 0);
      ctx.lineTo(40, 0);
      ctx.lineTo(46, -2);
      ctx.lineTo(40, -4);
      ctx.lineTo(-4, -4);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Sword Guard (코등이)
      ctx.fillStyle = '#ffd700';
      ctx.fillRect(-2, -8, 4, 12);

      // Sword Tassel (붉은 검수 매듭)
      ctx.strokeStyle = '#ff3344';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(-6, -2);
      ctx.quadraticCurveTo(-14, 4, -18, 12);
      ctx.stroke();

    } else if (this.char.weaponType === 'BROADSWORD') {
      // 2. 백호대도 (白虎大刀) - 거대한 고리 대도
      ctx.fillStyle = '#222834';
      ctx.strokeStyle = this.char.color;
      ctx.lineWidth = 3;

      // Heavy curved cleaver blade
      ctx.beginPath();
      ctx.moveTo(-6, 2);
      ctx.lineTo(38, 4);
      ctx.quadraticCurveTo(48, -12, 34, -22); // Broad tip
      ctx.lineTo(12, -8);
      ctx.lineTo(-6, -4);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Golden Rings on back of blade (대도 환)
      ctx.fillStyle = '#ffd700';
      ctx.beginPath();
      ctx.arc(28, -6, 3, 0, Math.PI * 2);
      ctx.arc(18, -4, 3, 0, Math.PI * 2);
      ctx.fill();

    } else if (this.char.weaponType === 'IRON_FAN') {
      // 3. 주작철선 (朱雀鐵扇) - 활짝 펼쳐진 붉은 깃털 철제 부채
      ctx.fillStyle = this.char.color;
      ctx.strokeStyle = '#ffd700';
      ctx.lineWidth = 2;

      // Open Fan Arc
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.arc(0, 0, 30, -Math.PI / 3, Math.PI / 3);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Fan Ribs (선골)
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1.5;
      for (let a = -Math.PI / 3; a <= Math.PI / 3; a += Math.PI / 6) {
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(Math.cos(a) * 30, Math.sin(a) * 30);
        ctx.stroke();
      }

    } else if (this.char.weaponType === 'CHAIN_SICKLE') {
      // 4. 현무사슬낫 (玄武鎖鎌) - 굽은 낫날과 쇠사슬
      ctx.strokeStyle = '#8a99ad';
      ctx.lineWidth = 2.5;

      // Sickle handle & curved blade
      ctx.beginPath();
      ctx.moveTo(-6, 2);
      ctx.lineTo(22, 2);
      ctx.stroke();

      ctx.strokeStyle = this.char.color;
      ctx.lineWidth = 3.5;
      ctx.beginPath();
      ctx.moveTo(18, 2);
      ctx.quadraticCurveTo(28, -14, 34, -18);
      ctx.stroke();

      // Dangling chain links
      ctx.strokeStyle = '#aaaaaa';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(-6, 2);
      ctx.quadraticCurveTo(-14, 12, -22, 10);
      ctx.stroke();
    }

    ctx.restore();
  }

  computeJoints() {
    let head = { x: 0, y: -78 };
    let neck = { x: 0, y: -64 };
    let hip = { x: -2, y: -34 };

    let kneeL = { x: -10, y: -16 }, footL = { x: -14, y: 0 };
    let kneeR = { x: 8, y: -16 }, footR = { x: 12, y: 0 };

    let elbowL = { x: -14, y: -50 }, handL = { x: -8, y: -38 };
    let elbowR = { x: 14, y: -50 }, handR = { x: 22, y: -38 };

    const cycle = (this.animTick % 60) / 60;
    const breathe = Math.sin(cycle * Math.PI * 2) * 2;

    if (this.state === 'IDLE') {
      neck.y += breathe;
      head.y += breathe;
      handR.y += breathe;
      handL.y += breathe;
    } else if (this.state === 'WALK') {
      const walkCycle = (this.animTick % 24) / 24;
      const legAngle = Math.sin(walkCycle * Math.PI * 2);
      footL = { x: -legAngle * 18, y: Math.max(0, -Math.cos(walkCycle * Math.PI * 2) * 8) };
      footR = { x: legAngle * 18, y: Math.max(0, Math.cos(walkCycle * Math.PI * 2) * 8) };
      kneeL = { x: footL.x * 0.5 - 6, y: -16 };
      kneeR = { x: footR.x * 0.5 + 6, y: -16 };

      handL = { x: footR.x * 0.8, y: -40 };
      handR = { x: footL.x * 0.8, y: -40 };
    } else if (this.state === 'JUMP') {
      kneeL = { x: -8, y: -24 }; footL = { x: -12, y: -12 };
      kneeR = { x: 6, y: -24 }; footR = { x: 10, y: -12 };
      handL = { x: -18, y: -65 };
      handR = { x: 20, y: -65 };
    } else if (this.state === 'FALL') {
      kneeL = { x: -6, y: -20 }; footL = { x: -8, y: -6 };
      kneeR = { x: 8, y: -20 }; footR = { x: 10, y: -6 };
      handL = { x: -16, y: -50 };
      handR = { x: 18, y: -50 };
    } else if (this.state === 'CROUCH') {
      head.y += 24; neck.y += 24; hip.y += 24;
      kneeL = { x: -16, y: -12 }; footL = { x: -18, y: 0 };
      kneeR = { x: 12, y: -12 }; footR = { x: 14, y: 0 };
      handR = { x: 18, y: -30 }; elbowR = { x: 10, y: -25 };
    } else if (this.state === 'ATTACK_LIGHT') {
      const progress = this.stateTimer / this.stateDuration;
      handR = { x: 15 + Math.sin(progress * Math.PI) * 36, y: -45 - Math.cos(progress * Math.PI) * 10 };
      elbowR = { x: handR.x * 0.5 + 6, y: -52 };
    } else if (this.state === 'ATTACK_HEAVY') {
      const progress = this.stateTimer / this.stateDuration;
      if (progress < 0.4) {
        handR = { x: -18, y: -74 };
        elbowR = { x: -10, y: -82 };
      } else {
        handR = { x: 44, y: -25 };
        elbowR = { x: 28, y: -45 };
      }
    } else if (this.state === 'HURT') {
      head.x -= 8; neck.x -= 6;
      handL = { x: -20, y: -40 }; handR = { x: -10, y: -45 };
    } else if (this.state === 'KNOCKBACK') {
      hip.y -= 15; neck.y -= 15; head.y -= 15;
      footL = { x: -25, y: -8 }; footR = { x: -20, y: -4 };
      handL = { x: -22, y: -65 }; handR = { x: -15, y: -65 };
    } else if (this.state === 'DEAD') {
      head = { x: -45, y: -8 };
      neck = { x: -32, y: -8 };
      hip = { x: 0, y: -8 };
      kneeL = { x: 15, y: -8 }; footL = { x: 30, y: 0 };
      kneeR = { x: 18, y: -8 }; footR = { x: 35, y: 0 };
      handL = { x: -25, y: 0 }; handR = { x: -15, y: 0 };
    }

    return { head, neck, hip, kneeL, footL, kneeR, footR, elbowL, handL, elbowR, handR };
  }
}

SF.StickmanFighter = StickmanFighter;

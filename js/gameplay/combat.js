/**
 * Combat Manager - Hitbox/Hurtbox Collision Resolution, Damage, & Match Rules
 */
window.SF = window.SF || {};

class CombatManager {
  constructor() {
    this.roundTime = SF.CONSTANTS.COMBAT.ROUND_TIME;
    this.timerTick = 0;
    this.isMatchOver = false;
    this.winner = null;
  }

  reset() {
    this.roundTime = SF.CONSTANTS.COMBAT.ROUND_TIME;
    this.timerTick = 0;
    this.isMatchOver = false;
    this.winner = null;
  }

  // AABB Intersection check
  checkAABB(b1, b2) {
    return (
      b1.x < b2.x + b2.w &&
      b1.x + b1.w > b2.x &&
      b1.y < b2.y + b2.h &&
      b1.y + b1.h > b2.y
    );
  }

  update(f1, f2, projectiles) {
    if (this.isMatchOver) return;

    // Timer countdown (60 frames ~ 1 sec)
    this.timerTick++;
    if (this.timerTick >= 60) {
      this.timerTick = 0;
      if (this.roundTime > 0) {
        this.roundTime--;
        if (this.roundTime === 0) {
          this.handleTimeOver(f1, f2);
        }
      }
    }

    // 1. Fighter 1 attacking Fighter 2
    this.checkFighterAttack(f1, f2);

    // 2. Fighter 2 attacking Fighter 1
    this.checkFighterAttack(f2, f1);

    // 3. Projectiles collision
    this.updateProjectiles(f1, f2, projectiles);

    // 4. K.O. Detection
    if (f1.isDead || f2.isDead) {
      this.isMatchOver = true;
      this.winner = f1.isDead ? f2 : f1;
    }
  }

  checkFighterAttack(attacker, defender) {
    const hitbox = attacker.getCurrentHitbox();
    if (!hitbox) return;

    const hurtbox = defender.getHurtbox();
    if (this.checkAABB(hitbox, hurtbox)) {
      attacker.hasHitEnemy = true;
      const hitSuccess = defender.takeDamage(
        hitbox.damage,
        hitbox.hitstun,
        hitbox.knockback,
        hitbox.guardBreak
      );

      // Reward attacker with SP on hit
      if (hitSuccess) {
        attacker.sp = Math.min(SF.CONSTANTS.COMBAT.MAX_SP, attacker.sp + SF.CONSTANTS.COMBAT.SP_GAIN_HIT);
      }

      // Broadcast hit to peer if connected
      if (SF.Network && SF.Network.isConnected) {
        SF.Network.send({
          type: 'HIT_EVENT',
          damage: hitbox.damage,
          hitstun: hitbox.hitstun,
          knockback: hitbox.knockback,
          guardBreak: hitbox.guardBreak
        });
      }
    }
  }

  updateProjectiles(f1, f2, projectiles) {
    for (let i = projectiles.length - 1; i >= 0; i--) {
      const p = projectiles[i];
      p.update();

      if (!p.active) {
        projectiles.splice(i, 1);
        continue;
      }

      // Check collision with the opposing fighter
      const target = p.owner === f1 ? f2 : f1;
      const pBox = p.getHitbox();
      const tHurtbox = target.getHurtbox();

      if (this.checkAABB(pBox, tHurtbox)) {
        target.takeDamage(
          p.config.damage,
          p.config.hitstun || 18,
          p.config.knockback || { x: 5, y: -3 },
          false
        );

        p.owner.sp = Math.min(SF.CONSTANTS.COMBAT.MAX_SP, p.owner.sp + 4);

        // If not a persistent ground hazard, remove projectile on impact
        if (!p.config.isHazard) {
          projectiles.splice(i, 1);
        }
      }
    }
  }

  handleTimeOver(f1, f2) {
    this.isMatchOver = true;
    if (f1.hp > f2.hp) {
      this.winner = f1;
      f2.takeDamage(9999, 50, { x: 5, y: -5 });
    } else if (f2.hp > f1.hp) {
      this.winner = f2;
      f1.takeDamage(9999, 50, { x: 5, y: -5 });
    } else {
      this.winner = null; // Draw
    }
  }
}

SF.Combat = new CombatManager();

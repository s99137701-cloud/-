/**
 * CPU Fighter AI - Spatial awareness, guarding, combos, and skills
 */
window.SF = window.SF || {};

class FighterAI {
  constructor(fighter, opponent) {
    this.fighter = fighter;
    this.opponent = opponent;
    this.decisionTimer = 0;
    this.decisionInterval = 12; // Decision every 12 frames
    this.difficulty = 'NORMAL'; // EASY, NORMAL, HARD
  }

  update(projectilesList) {
    if (!this.fighter || !this.opponent || this.fighter.isDead || this.opponent.isDead) return;

    this.decisionTimer++;
    if (this.decisionTimer < this.decisionInterval) return;
    this.decisionTimer = 0;

    const dx = this.opponent.x - this.fighter.x;
    const dist = Math.abs(dx);
    const oppAttacking = ['ATTACK_LIGHT', 'ATTACK_HEAVY', 'SKILL', 'ULTIMATE'].includes(this.opponent.state);

    // 1. Ultimate Decision (High priority if SP is full)
    if (this.fighter.sp >= 100 && dist < 320) {
      if (Math.random() < 0.65) {
        this.fighter.useUltimate(projectilesList);
        return;
      }
    }

    // 2. Defensive Guarding if opponent is attacking in range
    if (oppAttacking && dist < 140) {
      const guardChance = this.difficulty === 'HARD' ? 0.85 : 0.6;
      if (Math.random() < guardChance) {
        this.fighter.crouch(true);
        return;
      }
    } else if (this.fighter.state === 'CROUCH') {
      this.fighter.standUp();
    }

    // 3. Ranged Skill check if distance is medium/far
    if (dist > 180 && dist < 420 && this.fighter.cooldowns.special <= 0 && this.fighter.sp >= 25) {
      if (Math.random() < 0.5) {
        this.fighter.useSpecial(projectilesList);
        return;
      }
    }

    // 4. Close Combat (Attack Range)
    if (dist < 90) {
      const roll = Math.random();
      if (roll < 0.55) {
        this.fighter.attackLight();
      } else if (roll < 0.85) {
        this.fighter.attackHeavy();
      } else {
        // Step back / re-position
        this.fighter.move(-Math.sign(dx));
      }
      return;
    }

    // 5. Approaching & Movement
    if (dist > 85) {
      this.fighter.move(Math.sign(dx));

      // Occasional jump in
      if (Math.random() < 0.08 && this.fighter.isGrounded) {
        this.fighter.jump();
      }
    }
  }
}

SF.FighterAI = FighterAI;

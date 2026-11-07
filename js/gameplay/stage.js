/**
 * 사방신 무림전 - 사계절 무림 투기장 (Seasonal Arenas: 봄, 여름, 가을, 겨울)
 */
window.SF = window.SF || {};

class StageManager {
  constructor() {
    this.currentSeason = SF.CONSTANTS.SEASONS.SPRING;
    this.stageTick = 0;
  }

  // 룸 입장 시 사계절 중 랜덤 결정
  selectRandomSeason() {
    const seasonKeys = Object.keys(SF.CONSTANTS.SEASONS);
    const randomKey = seasonKeys[Math.floor(Math.random() * seasonKeys.length)];
    this.currentSeason = SF.CONSTANTS.SEASONS[randomKey];
    console.log('Stage selected:', this.currentSeason.nameKr);
    return this.currentSeason;
  }

  setSeason(seasonId) {
    if (SF.CONSTANTS.SEASONS[seasonId]) {
      this.currentSeason = SF.CONSTANTS.SEASONS[seasonId];
    }
  }

  update() {
    this.stageTick++;
    // Continuously generate weather particles
    if (this.stageTick % 4 === 0) {
      SF.FX.spawnSeasonalWeather(this.currentSeason.id);
    }
  }

  draw(ctx, width, height) {
    const s = this.currentSeason;

    // 1. Sky Gradient based on season
    const skyGrad = ctx.createLinearGradient(0, 0, 0, height);
    skyGrad.addColorStop(0, '#04060a');
    skyGrad.addColorStop(0.55, s.skyColor);
    skyGrad.addColorStop(1, '#05070a');
    ctx.fillStyle = skyGrad;
    ctx.fillRect(0, 0, width, height);

    // 2. Giant Luminous Moon (계절별 색감 반영)
    ctx.save();
    ctx.fillStyle = s.moonColor;
    ctx.shadowBlur = 40;
    ctx.shadowColor = s.accentColor;
    ctx.beginPath();
    ctx.arc(width / 2, 175, 88, 0, Math.PI * 2);
    ctx.fill();

    // Subtle cloud drift
    ctx.fillStyle = 'rgba(10, 14, 24, 0.45)';
    ctx.beginPath();
    ctx.arc(width / 2 - 30, 170, 68, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // 3. Mountain Ridges with Seasonal Hues
    ctx.fillStyle = this.getMountainColor(s.id);
    ctx.beginPath();
    ctx.moveTo(0, 480);
    ctx.bezierCurveTo(180, 340, 320, 370, 520, 450);
    ctx.bezierCurveTo(720, 330, 880, 360, 1080, 440);
    ctx.lineTo(width, 390);
    ctx.lineTo(width, height);
    ctx.lineTo(0, height);
    ctx.fill();

    // 4. Forefront Scenery Props based on Season
    if (s.id === 'SPRING') {
      // 벚꽃 가지 실루엣
      this.drawCherryTree(ctx, 60, 160);
      this.drawCherryTree(ctx, width - 80, 160, -1);
    } else if (s.id === 'SUMMER') {
      // 대나무 숲 (청죽림)
      this.drawBamboo(ctx, 50, 180, 390);
      this.drawBamboo(ctx, width - 60, 180, 390);
    } else if (s.id === 'AUTUMN') {
      // 단풍나무 가지 실루엣
      this.drawMapleBranch(ctx, 70, 180);
      this.drawMapleBranch(ctx, width - 90, 180, -1);
    } else if (s.id === 'WINTER') {
      // 눈 덮인 도관 기둥과 고드름
      this.drawSnowyPillar(ctx, 80, 200);
      this.drawSnowyPillar(ctx, width - 100, 200);
    }

    // 5. Traditional Pagoda Pillars & Lanterns
    ctx.fillStyle = '#141a28';
    ctx.fillRect(80, 220, 22, 350);
    ctx.fillRect(width - 102, 220, 22, 350);

    // Hanging Lanterns with seasonal glow
    this.drawLantern(ctx, 91, 230, s.accentColor);
    this.drawLantern(ctx, width - 91, 230, s.accentColor);

    // 6. Arena Stone Floor (무림 투기장 바닥)
    const floorY = SF.CONSTANTS.PHYSICS.FLOOR_Y;
    const floorGrad = ctx.createLinearGradient(0, floorY, 0, height);
    floorGrad.addColorStop(0, '#252b3a');
    floorGrad.addColorStop(0.12, '#141824');
    floorGrad.addColorStop(1, '#07090f');
    ctx.fillStyle = floorGrad;
    ctx.fillRect(0, floorY, width, height - floorY);

    // Gold/Seasonal Boundary Line
    ctx.strokeStyle = s.accentColor;
    ctx.lineWidth = 2.5;
    ctx.shadowBlur = 8;
    ctx.shadowColor = s.accentColor;
    ctx.beginPath();
    ctx.moveTo(0, floorY);
    ctx.lineTo(width, floorY);
    ctx.stroke();
    ctx.shadowBlur = 0;

    // Stone Grid Lines
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
    ctx.lineWidth = 1.5;
    for (let x = 110; x < width; x += 130) {
      ctx.beginPath();
      ctx.moveTo(x, floorY);
      ctx.lineTo(x + 50, height);
      ctx.stroke();
    }
  }

  getMountainColor(seasonId) {
    if (seasonId === 'SPRING') return '#161022';
    if (seasonId === 'SUMMER') return '#0e181c';
    if (seasonId === 'AUTUMN') return '#22110c';
    if (seasonId === 'WINTER') return '#101726';
    return '#101420';
  }

  drawCherryTree(ctx, x, y, scaleX = 1) {
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(scaleX, 1);
    ctx.strokeStyle = '#0e0b14';
    ctx.lineWidth = 8;
    ctx.beginPath();
    ctx.moveTo(0, 240);
    ctx.quadraticCurveTo(-20, 100, 30, 40);
    ctx.quadraticCurveTo(60, 20, 80, -20);
    ctx.stroke();

    // Pink blossoms on branch
    ctx.fillStyle = '#ff80ab';
    ctx.beginPath();
    for (let i = 0; i < 8; i++) {
      ctx.arc(30 + i * 8, 40 - i * 6, 6, 0, Math.PI * 2);
    }
    ctx.fill();
    ctx.restore();
  }

  drawBamboo(ctx, x, topY, height) {
    ctx.save();
    ctx.strokeStyle = '#0b1614';
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.moveTo(x, topY);
    ctx.lineTo(x, topY + height);
    ctx.stroke();

    ctx.lineWidth = 9;
    for (let y = topY + 40; y < topY + height; y += 60) {
      ctx.beginPath();
      ctx.moveTo(x - 5, y);
      ctx.lineTo(x + 5, y);
      ctx.stroke();

      ctx.fillStyle = '#0b1614';
      ctx.beginPath();
      ctx.ellipse(x + 12, y - 6, 14, 4, Math.PI / 4, 0, Math.PI * 2);
      ctx.ellipse(x - 12, y - 4, 14, 4, -Math.PI / 4, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  drawMapleBranch(ctx, x, y, scaleX = 1) {
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(scaleX, 1);
    ctx.strokeStyle = '#180c08';
    ctx.lineWidth = 7;
    ctx.beginPath();
    ctx.moveTo(0, 240);
    ctx.quadraticCurveTo(-15, 120, 40, 30);
    ctx.stroke();

    ctx.fillStyle = '#ff5722';
    for (let i = 0; i < 6; i++) {
      ctx.beginPath();
      ctx.arc(20 + i * 10, 50 - i * 5, 8, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  drawSnowyPillar(ctx, x, y) {
    ctx.save();
    ctx.fillStyle = '#e3f2fd';
    // Frost snow on top of pillar
    ctx.fillRect(x - 4, y, 30, 8);
    // Icicles
    ctx.beginPath();
    ctx.moveTo(x, y + 8);
    ctx.lineTo(x + 6, y + 22);
    ctx.lineTo(x + 12, y + 8);
    ctx.fill();
    ctx.restore();
  }

  drawLantern(ctx, x, y, glowColor) {
    ctx.save();
    ctx.fillStyle = glowColor;
    ctx.shadowBlur = 24;
    ctx.shadowColor = glowColor;

    ctx.beginPath();
    ctx.ellipse(x, y + 16, 12, 18, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.shadowBlur = 0;
    ctx.fillStyle = '#ffd700';
    ctx.fillRect(x - 8, y, 16, 4);
    ctx.fillRect(x - 8, y + 32, 16, 4);

    ctx.strokeStyle = '#ffd700';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(x, y + 36);
    ctx.lineTo(x, y + 50);
    ctx.stroke();
    ctx.restore();
  }
}

SF.Stage = new StageManager();

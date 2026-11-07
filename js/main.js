/**
 * 사방신 무림전 - Main Controller (룸 코드 P2P 멀티플레이어 & 사계절 투기장 통합)
 */
window.SF = window.SF || {};

class GameManager {
  constructor() {
    this.canvas = document.getElementById('gameCanvas');
    this.ctx = this.canvas.getContext('2d');

    this.width = SF.CONSTANTS.CANVAS_WIDTH;
    this.height = SF.CONSTANTS.CANVAS_HEIGHT;
    this.canvas.width = this.width;
    this.canvas.height = this.height;

    // Local Character Choice
    this.myCharId = 'BLUE_DRAGON';
    this.opponentCharId = 'WHITE_TIGER';

    // Entities
    this.localFighter = null;
    this.remoteFighter = null;
    this.p1 = null;
    this.p2 = null;
    this.ai = null;
    this.projectiles = [];

    // Match Mode
    this.matchType = SF.CONSTANTS.MATCH_TYPE.PRACTICE; // P2P_HOST, P2P_GUEST, PRACTICE
    this.state = SF.CONSTANTS.STATE.LOBBY;
    this.bannerTimer = 0;
    this.bannerText = '';

    // Network Sync Throttle
    this.syncTick = 0;

    this.initUI();
    this.initNetworkEvents();
    this.initCardPreviews();
    this.startLoop();
  }

  // ==========================================
  // UI INITIALIZATION & EVENT LISTENERS
  // ==========================================
  initUI() {
    // 1. Character Card Clicks
    const cards = document.querySelectorAll('.char-card');
    cards.forEach(card => {
      card.addEventListener('click', () => {
        this.myCharId = card.getAttribute('data-char');
        cards.forEach(c => c.classList.remove('selected-p1'));
        card.classList.add('selected-p1');
        SF.Sound.playSlash();
      });
    });

    // 2. [방 만들기] Button
    const btnCreateRoom = document.getElementById('btn-create-room');
    btnCreateRoom.addEventListener('click', () => {
      SF.Sound.ensureContext();
      this.matchType = SF.CONSTANTS.MATCH_TYPE.P2P_HOST;
      SF.Network.createRoom((code) => {
        document.getElementById('display-room-code').innerText = code;
        document.getElementById('modal-create-room').style.display = 'flex';
      });
    });

    // Copy Room Code Button
    document.getElementById('btn-copy-code').addEventListener('click', () => {
      const code = document.getElementById('display-room-code').innerText;
      navigator.clipboard.writeText(code).then(() => {
        alert(`룸 코드 [${code}]가 클립보드에 복사되었습니다! 친구에게 전달하세요.`);
      });
    });

    // Cancel Create Room Modal
    document.getElementById('btn-cancel-create').addEventListener('click', () => {
      SF.Network.cleanup();
      document.getElementById('modal-create-room').style.display = 'none';
    });

    // 3. [방 참가하기] Button
    const btnJoinModal = document.getElementById('btn-join-modal');
    btnJoinModal.addEventListener('click', () => {
      SF.Sound.ensureContext();
      document.getElementById('modal-join-room').style.display = 'flex';
      document.getElementById('input-join-code').focus();
    });

    // Confirm Join Room
    document.getElementById('btn-confirm-join').addEventListener('click', () => {
      const code = document.getElementById('input-join-code').value.trim().toUpperCase();
      if (code.length !== 6) {
        alert('6자리 룸 코드를 입력해 주세요.');
        return;
      }
      this.matchType = SF.CONSTANTS.MATCH_TYPE.P2P_GUEST;
      document.getElementById('join-status-text').innerText = '호스트에 연결 중...';

      SF.Network.joinRoom(code, () => {
        // Connected!
        document.getElementById('modal-join-room').style.display = 'none';
      });
    });

    // Cancel Join Modal
    document.getElementById('btn-cancel-join').addEventListener('click', () => {
      SF.Network.cleanup();
      document.getElementById('modal-join-room').style.display = 'none';
      document.getElementById('join-status-text').innerText = '';
    });

    // 4. [연습 대전 (AI 봇)] Button
    document.getElementById('btn-practice-mode').addEventListener('click', () => {
      SF.Sound.ensureContext();
      this.startPracticeMatch();
    });

    // 5. Result Screen Buttons
    document.getElementById('btn-rematch').addEventListener('click', () => {
      if (this.matchType === SF.CONSTANTS.MATCH_TYPE.PRACTICE) {
        this.startPracticeMatch();
      } else {
        SF.Network.send({ type: 'REMATCH_REQ' });
        this.showBanner('재대결 요청 전송...', 60);
      }
    });

    document.getElementById('btn-to-select').addEventListener('click', () => {
      SF.Network.cleanup();
      this.showLobbyScreen();
    });
  }

  // Mini preview character canvas
  initCardPreviews() {
    const cards = document.querySelectorAll('.char-card');
    cards.forEach(card => {
      const charId = card.getAttribute('data-char');
      const charConfig = SF.CHARACTERS[charId];
      const previewCanvas = card.querySelector('.char-avatar-canvas');
      if (!previewCanvas) return;
      previewCanvas.width = 140;
      previewCanvas.height = 160;
      const pctx = previewCanvas.getContext('2d');

      const dummy = new SF.StickmanFighter(charConfig, true);
      dummy.x = 70;
      dummy.y = 145;
      dummy.draw(pctx);
    });
  }

  // ==========================================
  // P2P NETWORK EVENTS
  // ==========================================
  initNetworkEvents() {
    SF.Network.onConnected = () => {
      console.log('[Network] P2P 연결 수립 완료.');
      if (!SF.Network.isHost) {
        // 1. 게스트가 접속 즉시 자신의 캐릭터 정보를 호스트에게 송신
        SF.Network.send({
          type: 'GUEST_JOIN',
          guestCharId: this.myCharId
        });
      }
    };

    SF.Network.onData = (packet) => {
      this.handleNetworkData(packet);
    };

    SF.Network.onDisconnected = (msg) => {
      alert(msg);
      this.showLobbyScreen();
    };

    SF.Network.onError = (err) => {
      alert(`[네트워크] ${err}`);
      document.getElementById('modal-create-room').style.display = 'none';
      document.getElementById('modal-join-room').style.display = 'none';
    };
  }

  handleNetworkData(packet) {
    if (!packet || !packet.type) return;

    if (packet.type === 'GUEST_JOIN' && SF.Network.isHost) {
      // 2. 호스트가 게스트 정보 수신 -> 사계절 투기장 무작위 결정 -> 양측 동시 시작
      this.opponentCharId = packet.guestCharId;
      const season = SF.Stage.selectRandomSeason();

      SF.Network.send({
        type: 'MATCH_INIT',
        hostCharId: this.myCharId,
        guestCharId: this.opponentCharId,
        seasonId: season.id
      });

      document.getElementById('modal-create-room').style.display = 'none';
      this.startOnlineBattle(true, this.myCharId, this.opponentCharId, season.id);

    } else if (packet.type === 'MATCH_INIT' && !SF.Network.isHost) {
      // 3. 게스트가 호스트의 대전 개시 패킷 수신 -> 동일한 계절 배경 및 캐릭터 세팅 후 시작
      this.opponentCharId = packet.hostCharId;
      SF.Stage.setSeason(packet.seasonId);
      document.getElementById('modal-join-room').style.display = 'none';
      this.startOnlineBattle(false, packet.hostCharId, packet.guestCharId, packet.seasonId);

    } else if (packet.type === 'SYNC') {
      // 실시간 좌표 및 상태 동기화
      if (this.remoteFighter) {
        this.remoteFighter.x = packet.x;
        this.remoteFighter.y = packet.y;
        this.remoteFighter.vx = packet.vx;
        this.remoteFighter.vy = packet.vy;
        this.remoteFighter.facing = packet.facing;
        this.remoteFighter.hp = packet.hp;
        this.remoteFighter.sp = packet.sp;
        if (this.remoteFighter.state !== packet.state) {
          this.remoteFighter.state = packet.state;
        }
      }

    } else if (packet.type === 'ACTION') {
      // 원격 플레이어 공격/스킬 발동 동기화
      if (this.remoteFighter && !this.remoteFighter.isDead) {
        if (packet.action === 'LIGHT') this.remoteFighter.attackLight();
        else if (packet.action === 'SPECIAL') this.remoteFighter.useSpecial(this.projectiles);
        else if (packet.action === 'ULTIMATE') this.remoteFighter.useUltimate(this.projectiles);
      }

    } else if (packet.type === 'HIT_EVENT') {
      // 원격 피격 판정 동기화
      if (this.localFighter) {
        this.localFighter.takeDamage(
          packet.damage,
          packet.hitstun,
          packet.knockback,
          packet.guardBreak
        );
      }

    } else if (packet.type === 'REMATCH_REQ') {
      this.showBanner('재대결 시작!', 60);
      if (SF.Network.isHost) {
        const season = SF.Stage.selectRandomSeason();
        SF.Network.send({
          type: 'MATCH_INIT',
          hostCharId: this.myCharId,
          guestCharId: this.opponentCharId,
          seasonId: season.id
        });
        this.startOnlineBattle(true, this.myCharId, this.opponentCharId, season.id);
      }
    }
  }

  // ==========================================
  // MATCH START & STATE TRANSITIONS
  // ==========================================
  showLobbyScreen() {
    this.state = SF.CONSTANTS.STATE.LOBBY;
    document.getElementById('select-screen').style.display = 'flex';
    document.getElementById('battle-hud').style.display = 'none';
    document.getElementById('result-screen').style.display = 'none';
    document.getElementById('modal-create-room').style.display = 'none';
    document.getElementById('modal-join-room').style.display = 'none';
  }

  // Start Online P2P Battle
  startOnlineBattle(isHost, hostCharId, guestCharId, seasonId) {
    SF.Stage.setSeason(seasonId);

    const c1 = SF.CHARACTERS[hostCharId];
    const c2 = SF.CHARACTERS[guestCharId];

    this.p1 = new SF.StickmanFighter(c1, true, false);
    this.p2 = new SF.StickmanFighter(c2, false, false);

    this.p1.opponent = this.p2;
    this.p2.opponent = this.p1;

    // Assign Local vs Remote
    if (isHost) {
      this.localFighter = this.p1;
      this.remoteFighter = this.p2;
    } else {
      this.localFighter = this.p2;
      this.remoteFighter = this.p1;
    }

    this.ai = null;
    this.setupBattleEnvironment(c1, c2, `온라인 대전 [${SF.Network.roomCode}]`);
  }

  // Start Practice Match (Solo / AI)
  startPracticeMatch() {
    this.matchType = SF.CONSTANTS.MATCH_TYPE.PRACTICE;
    const pool = Object.keys(SF.CHARACTERS).filter(id => id !== this.myCharId);
    this.opponentCharId = pool[Math.floor(Math.random() * pool.length)];

    const season = SF.Stage.selectRandomSeason();

    const c1 = SF.CHARACTERS[this.myCharId];
    const c2 = SF.CHARACTERS[this.opponentCharId];

    this.p1 = new SF.StickmanFighter(c1, true, false);
    this.p2 = new SF.StickmanFighter(c2, false, true);

    this.p1.opponent = this.p2;
    this.p2.opponent = this.p1;

    this.localFighter = this.p1;
    this.remoteFighter = null;
    this.ai = new SF.FighterAI(this.p2, this.p1);

    this.setupBattleEnvironment(c1, c2, '연습 대전 (vs AI)');
  }

  setupBattleEnvironment(c1, c2, modeBadgeText) {
    this.projectiles = [];
    SF.FX.reset();
    SF.Combat.reset();

    document.getElementById('select-screen').style.display = 'none';
    document.getElementById('result-screen').style.display = 'none';
    document.getElementById('battle-hud').style.display = 'flex';

    // HUD Names & Season Badge
    document.getElementById('p1-name').innerText = c1.nameKr;
    document.getElementById('p1-badge').innerText = c1.title;
    document.getElementById('p1-badge').style.color = c1.color;

    document.getElementById('p2-name').innerText = c2.nameKr;
    document.getElementById('p2-badge').innerText = c2.title;
    document.getElementById('p2-badge').style.color = c2.color;

    document.getElementById('hud-mode-badge').innerText = `${modeBadgeText} · ${SF.Stage.currentSeason.nameKr}`;

    this.state = SF.CONSTANTS.STATE.BATTLE;
    this.showBanner('결전(決戰) 개시!', 90);
    SF.Sound.playUltimate();
  }

  showBanner(text, duration = 60) {
    this.bannerText = text;
    this.bannerTimer = duration;
    const banner = document.getElementById('announcer-banner');
    banner.innerText = text;
    banner.classList.add('show');
  }

  hideBanner() {
    const banner = document.getElementById('announcer-banner');
    banner.classList.remove('show');
  }

  // ==========================================
  // MAIN GAME LOOP
  // ==========================================
  startLoop() {
    const step = () => {
      this.update();
      this.render();
      requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }

  update() {
    if (this.bannerTimer > 0) {
      this.bannerTimer--;
      if (this.bannerTimer <= 0) {
        this.hideBanner();
      }
    }

    if (this.state !== SF.CONSTANTS.STATE.BATTLE) {
      SF.FX.update();
      SF.Input.flush();
      return;
    }

    if (SF.FX.isHitstopActive()) {
      SF.FX.update();
      SF.Input.flush();
      return;
    }

    // 1. Process Unified 1P Input (W, A, S, D, J, K, L)
    this.handleLocalInput();

    // 2. Process AI if practice mode
    if (this.ai && this.p2) {
      this.ai.update(this.projectiles);
    }

    // 3. Update Fighters
    if (this.p1) this.p1.update();
    if (this.p2) this.p2.update();

    // 4. Update Seasonal Stage Weather
    SF.Stage.update();

    // 5. Update Combat & Projectiles
    if (this.p1 && this.p2) {
      SF.Combat.update(this.p1, this.p2, this.projectiles);
    }
    SF.FX.update();

    // 6. Network State Sync (Host/Guest broadcast position & state)
    this.syncNetwork();

    // 7. Check Match Finish
    if (SF.Combat.isMatchOver && this.state === SF.CONSTANTS.STATE.BATTLE) {
      this.handleMatchEnd();
    }

    this.updateHUD();
    SF.Input.flush();
  }

  // Handle Unified 1P Controls for the local player
  handleLocalInput() {
    if (!this.localFighter || this.localFighter.isDead) return;

    const input = SF.Input;
    const f = this.localFighter;

    // Movement: A (Left), D (Right)
    let moveDir = 0;
    if (input.isDown('LEFT')) moveDir -= 1;
    if (input.isDown('RIGHT')) moveDir += 1;

    if (moveDir !== 0) {
      f.move(moveDir);
    } else {
      f.stopMove();
    }

    // Jump: W
    if (input.isPressed('UP')) {
      f.jump();
    }

    // Crouch / Guard: S
    if (input.isDown('DOWN')) {
      f.crouch(true);
    } else if (f.state === 'CROUCH') {
      f.standUp();
    }

    // Attack Combo: J
    if (input.isPressed('LIGHT')) {
      f.attackLight();
      this.broadcastAction('LIGHT');
    }

    // Weapon Special Skill: K
    if (input.isPressed('SPECIAL')) {
      f.useSpecial(this.projectiles);
      this.broadcastAction('SPECIAL');
    }

    // Ultimate: L
    if (input.isPressed('ULTIMATE')) {
      f.useUltimate(this.projectiles);
      this.broadcastAction('ULTIMATE');
    }
  }

  broadcastAction(action) {
    if (SF.Network && SF.Network.isConnected) {
      SF.Network.send({
        type: 'ACTION',
        action: action
      });
    }
  }

  syncNetwork() {
    if (!SF.Network || !SF.Network.isConnected || !this.localFighter) return;

    this.syncTick++;
    if (this.syncTick % 2 === 0) {
      SF.Network.send({
        type: 'SYNC',
        x: this.localFighter.x,
        y: this.localFighter.y,
        vx: this.localFighter.vx,
        vy: this.localFighter.vy,
        state: this.localFighter.state,
        hp: this.localFighter.hp,
        sp: this.localFighter.sp,
        facing: this.localFighter.facing
      });
    }
  }

  handleMatchEnd() {
    this.state = SF.CONSTANTS.STATE.VICTORY;
    const winner = SF.Combat.winner;
    const isLocalWinner = winner === this.localFighter;

    const titleText = winner ? (isLocalWinner ? '승리 (VICTORY)' : '패배 (DEFEAT)') : '무승부 (平局)';

    this.showBanner('승부 갈림!', 120);

    setTimeout(() => {
      document.getElementById('result-screen').style.display = 'flex';
      document.getElementById('victory-title').innerText = titleText;
      document.getElementById('victory-subtitle').innerText = winner ? `${winner.char.nameKr} (${winner.char.title}) 승리!` : '비김';
    }, 1800);
  }

  updateHUD() {
    if (!this.p1 || !this.p2) return;

    const p1HpPercent = (this.p1.hp / this.p1.maxHp) * 100;
    const p2HpPercent = (this.p2.hp / this.p2.maxHp) * 100;

    document.getElementById('p1-hp-bar').style.width = `${p1HpPercent}%`;
    document.getElementById('p1-hp-lag').style.width = `${p1HpPercent}%`;

    document.getElementById('p2-hp-bar').style.width = `${p2HpPercent}%`;
    document.getElementById('p2-hp-lag').style.width = `${p2HpPercent}%`;

    const p1SpPercent = (this.p1.sp / SF.CONSTANTS.COMBAT.MAX_SP) * 100;
    const p2SpPercent = (this.p2.sp / SF.CONSTANTS.COMBAT.MAX_SP) * 100;

    const p1SpBar = document.getElementById('p1-sp-bar');
    const p2SpBar = document.getElementById('p2-sp-bar');

    p1SpBar.style.width = `${p1SpPercent}%`;
    p2SpBar.style.width = `${p2SpPercent}%`;

    if (p1SpPercent >= 100) p1SpBar.classList.add('sp-full-glow');
    else p1SpBar.classList.remove('sp-full-glow');

    if (p2SpPercent >= 100) p2SpBar.classList.add('sp-full-glow');
    else p2SpBar.classList.remove('sp-full-glow');

    document.getElementById('round-timer').innerText = SF.Combat.roundTime.toString().padStart(2, '0');
  }

  render() {
    this.ctx.save();
    this.ctx.translate(SF.FX.shakeOffset.x, SF.FX.shakeOffset.y);

    // 1. Draw Seasonal Arena Background
    SF.Stage.draw(this.ctx, this.width, this.height);

    // 2. Draw Projectiles
    for (const p of this.projectiles) {
      p.draw(this.ctx);
    }

    // 3. Draw Fighters
    if (this.p1) this.p1.draw(this.ctx);
    if (this.p2) this.p2.draw(this.ctx);

    // 4. Draw Particles, Weather & Ultimate Cutscenes
    SF.FX.draw(this.ctx);

    this.ctx.restore();
  }
}

window.addEventListener('DOMContentLoaded', () => {
  SF.Game = new GameManager();
});

/* =====================================================
       1. CONSTANTS & CONFIGURATION
    ===================================================== */
    const SF = {
      INTERNAL_W: 320,  // Retro pixel buffer resolution
      INTERNAL_H: 180,
      FLOOR_Y: 146,
      ARENA_LEFT: 14,
      ARENA_RIGHT: 306,
      GRAVITY: 0.52,
      MAX_FALL_SPEED: 8.5,
      ROUND_TIME: 99,

      SEASONS: {
        SPRING: { id: 'SPRING', name: '봄 · 낙화유수', sky: '#181024', moon: '#ffeef5', accent: '#ff80ab' },
        SUMMER: { id: 'SUMMER', name: '여름 · 청죽녹음', sky: '#0a1e1a', moon: '#e0f7fa', accent: '#00e676' },
        AUTUMN: { id: 'AUTUMN', name: '가을 · 만산홍엽', sky: '#220e0a', moon: '#fff3e0', accent: '#ff7043' },
        WINTER: { id: 'WINTER', name: '겨울 · 설산빙벽', sky: '#0c1626', moon: '#e3f2fd', accent: '#90caf9' }
      },

      CHARACTERS: {
        BLUE_DRAGON: {
          id: 'BLUE_DRAGON', nameKr: '청룡', title: '신속의 청도검객',
          color: '#00f3ff', robe: '#005577', trim: '#ffffff', skin: '#f5c999', hair: '#0a0f1d',
          speed: 2.5, jump: -7.6, maxHp: 950, defense: 0.95, canDoubleJump: false,
          lightDmg: 38, heavyDmg: 85, weapon: 'SWORD'
        },
        WHITE_TIGER: {
          id: 'WHITE_TIGER', nameKr: '백호', title: '파천의 패도전사',
          color: '#ffd700', robe: '#332211', trim: '#ffd700', skin: '#e2ba8f', hair: '#ffffff',
          speed: 1.7, jump: -6.9, maxHp: 1150, defense: 0.85, canDoubleJump: false,
          lightDmg: 55, heavyDmg: 130, guardBreak: true, weapon: 'AXE'
        },
        VERMILION_BIRD: {
          id: 'VERMILION_BIRD', nameKr: '주작', title: '불멸의 선무가',
          color: '#ff2a4b', robe: '#551122', trim: '#ff9900', skin: '#fce0c5', hair: '#2a050d',
          speed: 2.2, jump: -7.2, maxHp: 900, defense: 1.0, canDoubleJump: true,
          lightDmg: 42, heavyDmg: 95, weapon: 'FAN'
        },
        BLACK_TORTOISE: {
          id: 'BLACK_TORTOISE', nameKr: '현무', title: '심연의 흑도사',
          color: '#3a7afe', robe: '#101728', trim: '#3a7afe', skin: '#d8b68f', hair: '#05070c',
          speed: 1.6, jump: -6.8, maxHp: 1200, defense: 0.80, canDoubleJump: false,
          lightDmg: 45, heavyDmg: 75, weapon: 'CHAIN'
        }
      }
    };

    /* =====================================================
       2. PROCEDURAL SOUND SYNTHESIZER (Web Audio API)
    ===================================================== */
    class SoundEngine {
      constructor() {
        this.ctx = null;
      }
      init() {
        if (!this.ctx) {
          const AudioContext = window.AudioContext || window.webkitAudioContext;
          this.ctx = new AudioContext();
        }
        if (this.ctx.state === 'suspended') this.ctx.resume();
      }
      playHit(isHeavy = false) {
        if (!this.ctx) return;
        const t = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = isHeavy ? 'sawtooth' : 'triangle';
        osc.frequency.setValueAtTime(isHeavy ? 180 : 340, t);
        osc.frequency.exponentialRampToValueAtTime(30, t + (isHeavy ? 0.2 : 0.08));
        gain.gain.setValueAtTime(isHeavy ? 0.4 : 0.25, t);
        gain.gain.exponentialRampToValueAtTime(0.01, t + (isHeavy ? 0.2 : 0.08));
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(t);
        osc.stop(t + (isHeavy ? 0.2 : 0.08));
      }
      playSlash() {
        if (!this.ctx) return;
        const t = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(800, t);
        osc.frequency.exponentialRampToValueAtTime(200, t + 0.12);
        gain.gain.setValueAtTime(0.2, t);
        gain.gain.exponentialRampToValueAtTime(0.01, t + 0.12);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(t);
        osc.stop(t + 0.12);
      }
      playUltimate() {
        if (!this.ctx) return;
        const t = this.ctx.currentTime;
        [220, 277, 330, 440].forEach((freq, idx) => {
          const osc = this.ctx.createOscillator();
          const gain = this.ctx.createGain();
          osc.type = 'square';
          osc.frequency.setValueAtTime(freq, t);
          osc.frequency.exponentialRampToValueAtTime(freq * 1.8, t + 0.4);
          gain.gain.setValueAtTime(0.12 / (idx + 1), t);
          gain.gain.exponentialRampToValueAtTime(0.001, t + 0.45);
          osc.connect(gain);
          gain.connect(this.ctx.destination);
          osc.start(t);
          osc.stop(t + 0.45);
        });
      }
    }
    const Sound = new SoundEngine();

    /* =====================================================
       3. UNIFIED INPUT MANAGER (W, A, S, D, J, K, L)
    ===================================================== */
    class InputManager {
      constructor() {
        this.down = new Set();
        this.pressed = new Set();
        window.addEventListener('keydown', (e) => {
          const keys = ['KeyW', 'KeyA', 'KeyS', 'KeyD', 'KeyJ', 'KeyK', 'KeyL', 'Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'];
          if (keys.includes(e.code)) e.preventDefault();
          if (!this.down.has(e.code)) this.pressed.add(e.code);
          this.down.add(e.code);
        });
        window.addEventListener('keyup', (e) => {
          this.down.delete(e.code);
        });
      }
      flush() { this.pressed.clear(); }
      isDown(code) { return this.down.has(code); }
      isPressed(code) { return this.pressed.has(code); }
    }
    const Input = new InputManager();

    /* =====================================================
       4. P2P NETWORK MANAGER (PeerJS WebRTC DataChannel)
    ===================================================== */
    class NetworkManager {
      constructor() {
        this.peer = null;
        this.conn = null;
        this.isHost = false;
        this.roomCode = null;
        this.isConnected = false;

        this.peerConfig = {
          debug: 1,
          config: {
            iceServers: [
              { urls: 'stun:stun.l.google.com:19302' },
              { urls: 'stun:stun1.l.google.com:19302' },
              { urls: 'stun:stun.cloudflare.com:3478' }
            ]
          }
        };

        this.onConnected = null;
        this.onData = null;
        this.onDisconnected = null;
        this.onError = null;
      }
      generateCode() {
        const c = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
        let res = '';
        for (let i = 0; i < 6; i++) res += c[Math.floor(Math.random() * c.length)];
        return res;
      }
      createRoom(cb) {
        this.cleanup();
        this.isHost = true;
        this.roomCode = this.generateCode();
        const peerId = `murim-px-${this.roomCode}`;
        try {
          this.peer = new Peer(peerId, this.peerConfig);
          this.peer.on('open', () => { if (cb) cb(this.roomCode); });
          this.peer.on('connection', (c) => {
            this.conn = c;
            this.setupConn();
          });
          this.peer.on('error', (err) => {
            if (err.type === 'unavailable-id') this.createRoom(cb);
            else if (this.onError) this.onError(err.message || err.type);
          });
        } catch (e) { if (this.onError) this.onError(e); }
      }
      joinRoom(code, cb) {
        this.cleanup();
        this.isHost = false;
        this.roomCode = code.trim().toUpperCase();
        const hostPeerId = `murim-px-${this.roomCode}`;
        try {
          this.peer = new Peer(this.peerConfig);
          this.peer.on('open', () => {
            this.conn = this.peer.connect(hostPeerId, { reliable: true });
            this.conn.on('open', () => {
              this.setupConn();
              if (cb) cb();
            });
          });
          this.peer.on('error', (err) => { if (this.onError) this.onError('방을 찾을 수 없습니다.'); });
        } catch (e) { if (this.onError) this.onError(e); }
      }
      setupConn() {
        this.isConnected = true;
        this.conn.on('data', (d) => { if (this.onData) this.onData(d); });
        this.conn.on('close', () => {
          this.isConnected = false;
          if (this.onDisconnected) this.onDisconnected();
        });
        if (this.onConnected) this.onConnected();
      }
      send(pkg) {
        if (this.conn && this.isConnected) {
          try { this.conn.send(pkg); } catch(e){}
        }
      }
      cleanup() {
        if (this.conn) { try { this.conn.close(); } catch(e){} this.conn = null; }
        if (this.peer) { try { this.peer.destroy(); } catch(e){} this.peer = null; }
        this.isConnected = false;
      }
    }
    const Network = new NetworkManager();

    /* =====================================================
       5. FULLSCREEN PIXEL ULTIMATE & WEATHER FX
    ===================================================== */
    class PixelFXManager {
      constructor() {
        this.particles = [];
        this.shake = 0;
        this.activeUlt = null;
      }
      reset() {
        this.particles = [];
        this.shake = 0;
        this.activeUlt = null;
      }
      addShake(amt) { this.shake = Math.min(this.shake + amt, 10); }

      triggerBlueDragonUlt(owner) {
        this.activeUlt = { type: 'BLUE_DRAGON', timer: 75, owner };
        this.addShake(8);
        Sound.playUltimate();
      }
      triggerVermilionBirdUlt(owner) {
        this.activeUlt = { type: 'VERMILION_BIRD', timer: 80, owner };
        this.addShake(6);
        Sound.playUltimate();
      }
      triggerBlackTortoiseUlt(owner) {
        this.activeUlt = { type: 'BLACK_TORTOISE', timer: 70, waveX: owner.facing === 1 ? -40 : 360, owner };
        this.addShake(7);
        Sound.playUltimate();
      }
      triggerWhiteTigerUlt(owner) {
        this.activeUlt = { type: 'WHITE_TIGER', timer: 75, pillars: [40, 90, 150, 210, 270], owner };
        this.addShake(10);
        Sound.playUltimate();
      }

      spawnHitSparks(x, y, color) {
        for (let i = 0; i < 8; i++) {
          this.particles.push({
            x, y,
            vx: (Math.random() - 0.5) * 4,
            vy: (Math.random() - 0.5) * 4 - 1,
            color, size: 2, life: 10 + Math.floor(Math.random() * 8)
          });
        }
      }

      spawnWeather(seasonId) {
        if (this.particles.length > 50) return;
        const x = Math.random() * (SF.INTERNAL_W + 20) - 10;
        if (seasonId === 'SPRING') {
          this.particles.push({ x, y: -4, vx: 0.5, vy: 0.8, color: '#ffb7c5', size: 2, life: 220 });
        } else if (seasonId === 'SUMMER') {
          const fx = Math.random() * SF.INTERNAL_W;
          this.particles.push({ x: fx, y: 70 + Math.random() * 80, vx: 0.1, vy: -0.1, color: '#00e676', size: 1, life: 150 });
        } else if (seasonId === 'AUTUMN') {
          const colors = ['#e64a19', '#ff7043', '#ffb300'];
          this.particles.push({ x, y: -4, vx: 0.8, vy: 1.1, color: colors[Math.floor(Math.random() * colors.length)], size: 2, life: 180 });
        } else if (seasonId === 'WINTER') {
          this.particles.push({ x, y: -4, vx: -0.3, vy: 1.2, color: '#ffffff', size: 1.5, life: 160 });
        }
      }

      update(oppFighter) {
        if (this.shake > 0.2) this.shake *= 0.88;
        else this.shake = 0;

        for (let i = this.particles.length - 1; i >= 0; i--) {
          const p = this.particles[i];
          p.x += p.vx;
          p.y += p.vy;
          p.life--;
          if (p.life <= 0 || p.y > SF.INTERNAL_H + 5) this.particles.splice(i, 1);
        }

        if (this.activeUlt) {
          this.activeUlt.timer--;
          const u = this.activeUlt;

          if (u.timer === 45 && oppFighter && !oppFighter.isDead) {
            oppFighter.takeDamage(260, 35, { x: 7, y: -6 });
            this.addShake(8);
          }

          if (u.type === 'BLACK_TORTOISE') {
            u.waveX += u.owner.facing === 1 ? 6.5 : -6.5;
          }

          if (u.timer <= 0) this.activeUlt = null;
        }
      }

      draw(ctx) {
        for (const p of this.particles) {
          ctx.fillStyle = p.color;
          ctx.fillRect(Math.floor(p.x), Math.floor(p.y), p.size, p.size);
        }

        if (this.activeUlt) {
          const u = this.activeUlt;
          ctx.save();

          if (u.type === 'BLUE_DRAGON') {
            ctx.fillStyle = (u.timer % 4 < 2) ? 'rgba(0, 243, 255, 0.2)' : 'rgba(0, 0, 0, 0.4)';
            ctx.fillRect(0, 0, SF.INTERNAL_W, SF.INTERNAL_H);

            const sliceProgress = (75 - u.timer) * 8;
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(0, 45, sliceProgress, 4);
            ctx.fillRect(SF.INTERNAL_W - sliceProgress, 95, sliceProgress, 6);
            ctx.fillRect(0, 130, sliceProgress * 1.2, 5);

            ctx.fillStyle = '#00f3ff';
            ctx.fillRect(0, 43, sliceProgress, 8);
            ctx.fillRect(SF.INTERNAL_W - sliceProgress, 93, sliceProgress, 10);

          } else if (u.type === 'VERMILION_BIRD') {
            ctx.fillStyle = 'rgba(255, 42, 75, 0.25)';
            ctx.fillRect(0, 0, SF.INTERNAL_W, SF.INTERNAL_H);

            for (let i = 0; i < 18; i++) {
              const mx = (i * 22 + (75 - u.timer) * 7) % (SF.INTERNAL_W + 40) - 20;
              const my = ((75 - u.timer) * 9 + i * 15) % SF.INTERNAL_H;
              ctx.fillStyle = '#ff2a4b';
              ctx.fillRect(mx, my, 4, 8);
              ctx.fillStyle = '#ffd700';
              ctx.fillRect(mx + 1, my - 2, 2, 4);
            }
            ctx.fillStyle = '#ff5500';
            ctx.fillRect(0, SF.FLOOR_Y - 2, SF.INTERNAL_W, 4);

          } else if (u.type === 'BLACK_TORTOISE') {
            ctx.fillStyle = 'rgba(10, 20, 45, 0.4)';
            ctx.fillRect(0, 0, SF.INTERNAL_W, SF.INTERNAL_H);

            const wx = u.waveX;
            ctx.fillStyle = '#1e88e5';
            ctx.fillRect(wx - 20, 30, 45, SF.INTERNAL_H);
            ctx.fillStyle = '#00f3ff';
            ctx.fillRect(wx - 10, 20, 25, SF.INTERNAL_H);
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(wx - 5, 15, 15, 8);

          } else if (u.type === 'WHITE_TIGER') {
            ctx.fillStyle = (u.timer % 6 < 2) ? 'rgba(255, 255, 255, 0.35)' : 'rgba(0, 0, 0, 0.3)';
            ctx.fillRect(0, 0, SF.INTERNAL_W, SF.INTERNAL_H);

            u.pillars.forEach((px, idx) => {
              const pHeight = Math.min(80, (75 - u.timer) * 4 + idx * 8);
              ctx.fillStyle = '#455a64';
              ctx.fillRect(px - 10, SF.FLOOR_Y - pHeight, 20, pHeight);
              ctx.fillStyle = '#78909c';
              ctx.fillRect(px - 6, SF.FLOOR_Y - pHeight, 12, pHeight);

              if (u.timer > 30 && u.timer < 60) {
                ctx.fillStyle = '#ffd700';
                ctx.fillRect(px - 2, 0, 4, SF.FLOOR_Y - pHeight);
              }
            });
          }

          ctx.restore();
        }
      }
    }
    const FX = new PixelFXManager();

    /* =====================================================
       6. PIXEL FIGHTER CLASS
    ===================================================== */
    class PixelFighter {
      constructor(charConfig, isP1 = true) {
        this.char = charConfig;
        this.isP1 = isP1;
        this.x = isP1 ? 70 : 250;
        this.y = SF.FLOOR_Y;
        this.vx = 0;
        this.vy = 0;
        this.facing = isP1 ? 1 : -1;

        this.hp = charConfig.maxHp;
        this.maxHp = charConfig.maxHp;
        this.sp = 0;
        this.isDead = false;

        this.state = 'IDLE';
        this.timer = 0;
        this.duration = 0;
        this.comboStep = 0;
        this.animTick = 0;
        this.isGrounded = true;
        this.jumpCount = 0;
        this.maxJumps = charConfig.canDoubleJump ? 2 : 1;

        this.cooldownSkill = 0;
        this.opponent = null;
      }

      reset(x, facing) {
        this.x = x;
        this.y = SF.FLOOR_Y;
        this.vx = 0;
        this.vy = 0;
        this.facing = facing;
        this.hp = this.maxHp;
        this.sp = 0;
        this.isDead = false;
        this.state = 'IDLE';
        this.timer = 0;
        this.duration = 0;
        this.comboStep = 0;
        this.jumpCount = 0;
        this.cooldownSkill = 0;
      }

      setState(st, dur = 0) {
        this.state = st;
        this.timer = 0;
        this.duration = dur;
      }

      update() {
        this.animTick++;
        if (this.cooldownSkill > 0) this.cooldownSkill--;

        if (this.duration > 0) {
          this.timer++;
          if (this.timer >= this.duration) {
            this.state = this.isGrounded ? 'IDLE' : 'JUMP';
            this.duration = 0;
          }
        }

        if (!this.isGrounded) {
          this.vy += SF.GRAVITY;
          if (this.vy > SF.MAX_FALL_SPEED) this.vy = SF.MAX_FALL_SPEED;
        }

        this.x += this.vx;
        this.y += this.vy;

        if (this.isGrounded) {
          this.vx *= 0.78;
          if (Math.abs(this.vx) < 0.1) this.vx = 0;
        }

        if (this.y >= SF.FLOOR_Y) {
          this.y = SF.FLOOR_Y;
          this.vy = 0;
          if (!this.isGrounded) {
            this.isGrounded = true;
            this.jumpCount = 0;
            if (this.state === 'JUMP') this.setState('IDLE');
          }
        } else {
          this.isGrounded = false;
        }

        if (this.x < SF.ARENA_LEFT) this.x = SF.ARENA_LEFT;
        if (this.x > SF.ARENA_RIGHT) this.x = SF.ARENA_RIGHT;

        if (this.opponent && ['IDLE', 'WALK', 'JUMP', 'CROUCH'].includes(this.state)) {
          this.facing = this.x < this.opponent.x ? 1 : -1;
        }
      }

      move(dir) {
        if (!['IDLE', 'WALK'].includes(this.state)) return;
        this.vx = dir * this.char.speed;
        this.state = 'WALK';
      }

      stopMove() {
        if (this.state === 'WALK') this.state = 'IDLE';
      }

      jump() {
        if (!['IDLE', 'WALK', 'JUMP'].includes(this.state)) return;
        if (this.jumpCount < this.maxJumps) {
          this.vy = this.char.jump;
          this.isGrounded = false;
          this.jumpCount++;
          this.setState('JUMP');
        }
      }

      crouch() {
        if (['IDLE', 'WALK'].includes(this.state)) this.setState('CROUCH');
      }

      standUp() {
        if (this.state === 'CROUCH') this.setState('IDLE');
      }

      attack() {
        if (!['IDLE', 'WALK'].includes(this.state)) return;

        this.comboStep = (this.comboStep % 3) + 1;
        const dur = this.comboStep === 3 ? 20 : 14;
        this.setState(`ATK_${this.comboStep}`, dur);
        this.vx = this.facing * (this.comboStep === 3 ? 3 : 1.5);

        Sound.playSlash();
        this.checkHit(this.comboStep === 3 ? this.char.heavyDmg : this.char.lightDmg, this.comboStep === 3);
      }

      specialSkill() {
        if (!['IDLE', 'WALK'].includes(this.state)) return;
        if (this.sp < 25 || this.cooldownSkill > 0) return;

        this.sp = Math.max(0, this.sp - 25);
        this.cooldownSkill = 60;
        this.setState('SKILL', 24);
        this.vx = this.facing * 5;

        Sound.playSlash();
        this.checkHit(70, false, 45);
      }

      ultimate() {
        if (!['IDLE', 'WALK'].includes(this.state)) return;
        if (this.sp < 100) return;

        this.sp = 0;
        this.setState('ULT', 60);

        if (this.char.id === 'BLUE_DRAGON') FX.triggerBlueDragonUlt(this);
        else if (this.char.id === 'WHITE_TIGER') FX.triggerWhiteTigerUlt(this);
        else if (this.char.id === 'VERMILION_BIRD') FX.triggerVermilionBirdUlt(this);
        else if (this.char.id === 'BLACK_TORTOISE') FX.triggerBlackTortoiseUlt(this);
      }

      checkHit(damage, isHeavy = false, reach = 24) {
        if (!this.opponent || this.opponent.isDead) return;
        const dist = Math.abs(this.opponent.x - this.x);
        const inFront = (this.opponent.x - this.x) * this.facing > 0;

        if (dist < reach && inFront) {
          const hitSuccess = this.opponent.takeDamage(damage, isHeavy ? 20 : 12, { x: isHeavy ? 6 : 3, y: isHeavy ? -4 : -2 }, this.char.guardBreak && isHeavy);
          if (hitSuccess) this.sp = Math.min(100, this.sp + 8);

          if (Network.isConnected) {
            Network.send({
              type: 'HIT_EVT',
              damage,
              isHeavy,
              guardBreak: this.char.guardBreak && isHeavy
            });
          }
        }
      }

      takeDamage(dmg, hitstun, knockback, isGuardBreak = false) {
        if (this.isDead) return false;

        const isGuarding = this.state === 'CROUCH';
        if (isGuarding && !isGuardBreak) {
          this.hp = Math.max(0, this.hp - Math.floor(dmg * 0.2));
          this.sp = Math.min(100, this.sp + 4);
          this.vx = -this.facing * 1.5;
          Sound.playHit(false);
          FX.spawnHitSparks(this.x, this.y - 16, '#ffffff');
          return false;
        }

        const finalDmg = Math.floor(dmg * this.char.defense);
        this.hp = Math.max(0, this.hp - finalDmg);
        this.sp = Math.min(100, this.sp + 12);
        this.vx = -this.facing * knockback.x;
        this.vy = knockback.y;

        if (this.hp <= 0) {
          this.hp = 0;
          this.isDead = true;
          this.setState('DEAD');
        } else {
          this.setState('HURT', hitstun);
        }

        Sound.playHit(isHeavy);
        FX.addShake(isHeavy ? 6 : 3);
        FX.spawnHitSparks(this.x, this.y - 18, this.char.color);
        return true;
      }

      draw(ctx) {
        ctx.save();
        const px = Math.floor(this.x);
        const py = Math.floor(this.y);

        ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
        ctx.fillRect(px - 8, py, 16, 2);

        ctx.translate(px, py);
        ctx.scale(this.facing, 1);

        const bob = (this.state === 'WALK' && Math.floor(this.animTick / 4) % 2 === 0) ? -1 : 0;
        const c = this.char;

        // Legs
        ctx.fillStyle = '#111722';
        if (this.state === 'WALK') {
          const step = Math.floor(this.animTick / 4) % 4;
          if (step === 0) { ctx.fillRect(-5, -8, 4, 8); ctx.fillRect(2, -8, 4, 8); }
          else if (step === 1) { ctx.fillRect(-7, -8, 4, 7); ctx.fillRect(4, -9, 4, 9); }
          else if (step === 2) { ctx.fillRect(-3, -8, 4, 8); ctx.fillRect(1, -8, 4, 8); }
          else { ctx.fillRect(-2, -9, 4, 9); ctx.fillRect(5, -8, 4, 7); }
        } else if (this.state === 'CROUCH') {
          ctx.fillRect(-6, -6, 12, 6);
        } else {
          ctx.fillRect(-5, -8, 4, 8);
          ctx.fillRect(2, -8, 4, 8);
        }

        // Torso & Robe
        const torsoY = this.state === 'CROUCH' ? -14 : -20 + bob;
        ctx.fillStyle = c.robe;
        ctx.fillRect(-5, torsoY, 11, 12);

        // V-Neck trim
        ctx.fillStyle = c.trim;
        ctx.fillRect(-1, torsoY + 1, 3, 5);

        // Sash Belt
        ctx.fillStyle = c.color;
        ctx.fillRect(-6, torsoY + 8, 13, 3);

        // Head & Hair
        const headY = torsoY - 9;
        ctx.fillStyle = c.hair;
        ctx.fillRect(-4, headY, 8, 9);
        ctx.fillRect(-2, headY - 3, 4, 3);

        // Face
        ctx.fillStyle = c.skin;
        ctx.fillRect(0, headY + 2, 5, 5);

        // Glowing Eye
        ctx.fillStyle = c.color;
        ctx.fillRect(2, headY + 3, 2, 2);

        // Arms & Weapon
        const armY = torsoY + 2;
        if (this.state.startsWith('ATK_')) {
          ctx.fillStyle = c.skin;
          ctx.fillRect(4, armY - 2, 9, 3);

          ctx.fillStyle = c.color;
          if (c.weapon === 'SWORD') {
            ctx.fillRect(12, armY - 5, 12, 2);
            ctx.fillStyle = '#fff';
            ctx.fillRect(10, armY - 4, 16, 2);
          } else if (c.weapon === 'AXE') {
            ctx.fillRect(11, armY - 8, 4, 14);
            ctx.fillStyle = '#fff';
            ctx.fillRect(14, armY - 11, 8, 10);
          } else if (c.weapon === 'FAN') {
            ctx.fillRect(11, armY - 6, 8, 8);
          } else if (c.weapon === 'CHAIN') {
            ctx.fillRect(12, armY - 3, 14, 2);
            ctx.fillRect(24, armY - 6, 4, 8);
          }

          ctx.fillStyle = c.color;
          ctx.fillRect(20, armY - 14, 3, 18);
          ctx.fillRect(22, armY - 10, 4, 12);
        } else if (this.state === 'CROUCH') {
          ctx.fillStyle = c.color;
          ctx.fillRect(6, torsoY - 2, 2, 14);
        } else {
          ctx.fillStyle = c.skin;
          ctx.fillRect(2, armY, 3, 6);
          ctx.fillStyle = c.color;
          ctx.fillRect(-7, torsoY + 4, 5, 2);
        }

        ctx.restore();
      }
    }

    /* =====================================================
       7. MAIN ARCADE CONTROLLER & SEASONAL STAGES
    ===================================================== */
    class ArcadeGame {
      constructor() {
        this.mainCanvas = document.getElementById('gameCanvas');
        this.mainCtx = this.mainCanvas.getContext('2d');

        this.offscreen = document.createElement('canvas');
        this.offscreen.width = SF.INTERNAL_W;
        this.offscreen.height = SF.INTERNAL_H;
        this.ctx = this.offscreen.getContext('2d');

        this.mainCtx.imageSmoothingEnabled = false;
        this.ctx.imageSmoothingEnabled = false;

        this.myCharId = 'BLUE_DRAGON';
        this.oppCharId = 'WHITE_TIGER';
        this.season = SF.SEASONS.SPRING;

        this.p1 = null;
        this.p2 = null;
        this.localFighter = null;
        this.remoteFighter = null;

        this.roundTime = SF.ROUND_TIME;
        this.timerTick = 0;
        this.matchState = 'LOBBY';
        this.bannerTimer = 0;
        this.isAiMode = true;

        this.initUI();
        this.initNetwork();
        this.initCardPreviews();
        this.startLoop();
      }

      initUI() {
        document.querySelectorAll('.char-card').forEach(card => {
          card.addEventListener('click', () => {
            this.myCharId = card.getAttribute('data-char');
            document.querySelectorAll('.char-card').forEach(c => c.classList.remove('selected-p1'));
            card.classList.add('selected-p1');
            Sound.init();
            Sound.playSlash();
          });
        });

        document.getElementById('btn-create-room').addEventListener('click', () => {
          Sound.init();
          this.isAiMode = false;
          Network.createRoom((code) => {
            document.getElementById('display-room-code').innerText = code;
            document.getElementById('modal-create-room').style.display = 'flex';
          });
        });

        document.getElementById('btn-copy-code').addEventListener('click', () => {
          const code = document.getElementById('display-room-code').innerText;
          navigator.clipboard.writeText(code).then(() => alert(`코드 [${code}] 복사 완료!`));
        });

        document.getElementById('btn-cancel-create').addEventListener('click', () => {
          Network.cleanup();
          document.getElementById('modal-create-room').style.display = 'none';
        });

        document.getElementById('btn-join-modal').addEventListener('click', () => {
          Sound.init();
          document.getElementById('modal-join-room').style.display = 'flex';
          document.getElementById('input-join-code').focus();
        });

        document.getElementById('btn-confirm-join').addEventListener('click', () => {
          const code = document.getElementById('input-join-code').value.trim();
          if (code.length !== 6) return alert('6자리 룸 코드를 입력하세요.');
          this.isAiMode = false;
          document.getElementById('join-status-text').innerText = '호스트에 연결 중...';
          Network.joinRoom(code, () => {
            document.getElementById('modal-join-room').style.display = 'none';
          });
        });

        document.getElementById('btn-cancel-join').addEventListener('click', () => {
          Network.cleanup();
          document.getElementById('modal-join-room').style.display = 'none';
        });

        document.getElementById('btn-practice-mode').addEventListener('click', () => {
          Sound.init();
          this.isAiMode = true;
          this.startPracticeBattle();
        });

        document.getElementById('btn-rematch').addEventListener('click', () => {
          if (this.isAiMode) this.startPracticeBattle();
          else Network.send({ type: 'REMATCH' });
        });

        document.getElementById('btn-to-select').addEventListener('click', () => {
          Network.cleanup();
          this.showLobby();
        });
      }

      initCardPreviews() {
        document.querySelectorAll('.char-card').forEach(card => {
          const charId = card.getAttribute('data-char');
          const canvas = card.querySelector('.char-avatar-canvas');
          if (!canvas) return;
          canvas.width = 60;
          canvas.height = 65;
          const pctx = canvas.getContext('2d');
          pctx.imageSmoothingEnabled = false;

          const dummy = new PixelFighter(SF.CHARACTERS[charId], true);
          dummy.x = 30;
          dummy.y = 52;
          dummy.draw(pctx);
        });
      }

      initNetwork() {
        Network.onConnected = () => {
          if (!Network.isHost) {
            Network.send({ type: 'GUEST_JOIN', charId: this.myCharId });
          }
        };

        Network.onData = (pkg) => {
          if (pkg.type === 'GUEST_JOIN' && Network.isHost) {
            this.oppCharId = pkg.charId;
            const keys = Object.keys(SF.SEASONS);
            const seasonKey = keys[Math.floor(Math.random() * keys.length)];
            Network.send({
              type: 'INIT_MATCH',
              hostChar: this.myCharId,
              guestChar: this.oppCharId,
              season: seasonKey
            });
            document.getElementById('modal-create-room').style.display = 'none';
            this.startOnlineBattle(true, this.myCharId, this.oppCharId, seasonKey);
          } else if (pkg.type === 'INIT_MATCH' && !Network.isHost) {
            this.oppCharId = pkg.hostChar;
            document.getElementById('modal-join-room').style.display = 'none';
            this.startOnlineBattle(false, pkg.hostChar, pkg.guestChar, pkg.season);
          } else if (pkg.type === 'SYNC') {
            if (this.remoteFighter) {
              this.remoteFighter.x = pkg.x;
              this.remoteFighter.y = pkg.y;
              this.remoteFighter.vx = pkg.vx;
              this.remoteFighter.vy = pkg.vy;
              this.remoteFighter.facing = pkg.facing;
              this.remoteFighter.hp = pkg.hp;
              this.remoteFighter.sp = pkg.sp;
              this.remoteFighter.state = pkg.state;
            }
          } else if (pkg.type === 'ACT') {
            if (this.remoteFighter) {
              if (pkg.act === 'ATK') this.remoteFighter.attack();
              else if (pkg.act === 'SKILL') this.remoteFighter.specialSkill();
              else if (pkg.act === 'ULT') this.remoteFighter.ultimate();
            }
          } else if (pkg.type === 'HIT_EVT') {
            if (this.localFighter) {
              this.localFighter.takeDamage(pkg.damage, pkg.isHeavy ? 20 : 12, { x: 4, y: -3 }, pkg.guardBreak);
            }
          } else if (pkg.type === 'REMATCH') {
            if (Network.isHost) {
              const keys = Object.keys(SF.SEASONS);
              const seasonKey = keys[Math.floor(Math.random() * keys.length)];
              Network.send({ type: 'INIT_MATCH', hostChar: this.myCharId, guestChar: this.oppCharId, season: seasonKey });
              this.startOnlineBattle(true, this.myCharId, this.oppCharId, seasonKey);
            }
          }
        };

        Network.onError = (err) => alert(err);
      }

      showLobby() {
        this.matchState = 'LOBBY';
        document.getElementById('select-screen').style.display = 'flex';
        document.getElementById('battle-hud').style.display = 'none';
        document.getElementById('result-screen').style.display = 'none';
      }

      startOnlineBattle(isHost, hostChar, guestChar, seasonKey) {
        this.season = SF.SEASONS[seasonKey] || SF.SEASONS.SPRING;
        const c1 = SF.CHARACTERS[hostChar];
        const c2 = SF.CHARACTERS[guestChar];

        this.p1 = new PixelFighter(c1, true);
        this.p2 = new PixelFighter(c2, false);
        this.p1.opponent = this.p2;
        this.p2.opponent = this.p1;

        if (isHost) {
          this.localFighter = this.p1;
          this.remoteFighter = this.p2;
        } else {
          this.localFighter = this.p2;
          this.remoteFighter = this.p1;
        }

        this.setupArenaUI(c1, c2, `온라인 [${Network.roomCode}]`);
      }

      startPracticeBattle() {
        const keys = Object.keys(SF.SEASONS);
        this.season = SF.SEASONS[keys[Math.floor(Math.random() * keys.length)]];

        const pool = Object.keys(SF.CHARACTERS).filter(id => id !== this.myCharId);
        this.oppCharId = pool[Math.floor(Math.random() * pool.length)];

        const c1 = SF.CHARACTERS[this.myCharId];
        const c2 = SF.CHARACTERS[this.oppCharId];

        this.p1 = new PixelFighter(c1, true);
        this.p2 = new PixelFighter(c2, false);
        this.p1.opponent = this.p2;
        this.p2.opponent = this.p1;

        this.localFighter = this.p1;
        this.remoteFighter = null;

        this.setupArenaUI(c1, c2, '연습 모드 (AI)');
      }

      setupArenaUI(c1, c2, modeText) {
        FX.reset();
        this.roundTime = SF.ROUND_TIME;
        this.timerTick = 0;
        this.matchState = 'BATTLE';

        document.getElementById('select-screen').style.display = 'none';
        document.getElementById('result-screen').style.display = 'none';
        document.getElementById('battle-hud').style.display = 'flex';

        document.getElementById('p1-name').innerText = c1.nameKr;
        document.getElementById('p1-badge').innerText = c1.title;
        document.getElementById('p1-badge').style.color = c1.color;

        document.getElementById('p2-name').innerText = c2.nameKr;
        document.getElementById('p2-badge').innerText = c2.title;
        document.getElementById('p2-badge').style.color = c2.color;

        document.getElementById('hud-mode-badge').innerText = `${modeText} · ${this.season.name}`;
        this.showBanner('결전 개시!', 80);
      }

      showBanner(txt, dur = 60) {
        const b = document.getElementById('announcer-banner');
        b.innerText = txt;
        b.classList.add('show');
        this.bannerTimer = dur;
      }

      startLoop() {
        const tick = () => {
          this.update();
          this.render();
          requestAnimationFrame(tick);
        };
        requestAnimationFrame(tick);
      }

      update() {
        if (this.bannerTimer > 0) {
          this.bannerTimer--;
          if (this.bannerTimer <= 0) document.getElementById('announcer-banner').classList.remove('show');
        }

        if (this.matchState !== 'BATTLE') {
          Input.flush();
          return;
        }

        this.handleInput();

        if (this.isAiMode && this.p2 && !this.p2.isDead) {
          this.updateAi();
        }

        if (this.p1) this.p1.update();
        if (this.p2) this.p2.update();

        FX.spawnWeather(this.season.id);
        FX.update(this.p1.isDead ? this.p1 : this.p2);

        this.timerTick++;
        if (this.timerTick >= 60) {
          this.timerTick = 0;
          if (this.roundTime > 0) this.roundTime--;
        }

        if (Network.isConnected && this.localFighter) {
          Network.send({
            type: 'SYNC',
            x: this.localFighter.x,
            y: this.localFighter.y,
            vx: this.localFighter.vx,
            vy: this.localFighter.vy,
            facing: this.localFighter.facing,
            hp: this.localFighter.hp,
            sp: this.localFighter.sp,
            state: this.localFighter.state
          });
        }

        if ((this.p1.isDead || this.p2.isDead || this.roundTime <= 0) && this.matchState === 'BATTLE') {
          this.handleGameOver();
        }

        this.updateHUD();
        Input.flush();
      }

      handleInput() {
        const f = this.localFighter;
        if (!f || f.isDead) return;

        let mx = 0;
        if (Input.isDown('KeyA') || Input.isDown('ArrowLeft')) mx -= 1;
        if (Input.isDown('KeyD') || Input.isDown('ArrowRight')) mx += 1;

        if (mx !== 0) f.move(mx);
        else f.stopMove();

        if (Input.isPressed('KeyW') || Input.isPressed('ArrowUp')) f.jump();

        if (Input.isDown('KeyS') || Input.isDown('ArrowDown')) f.crouch();
        else if (f.state === 'CROUCH') f.standUp();

        if (Input.isPressed('KeyJ')) {
          f.attack();
          if (Network.isConnected) Network.send({ type: 'ACT', act: 'ATK' });
        }
        if (Input.isPressed('KeyK')) {
          f.specialSkill();
          if (Network.isConnected) Network.send({ type: 'ACT', act: 'SKILL' });
        }
        if (Input.isPressed('KeyL')) {
          f.ultimate();
          if (Network.isConnected) Network.send({ type: 'ACT', act: 'ULT' });
        }
      }

      updateAi() {
        const ai = this.p2;
        const target = this.p1;
        const dist = Math.abs(target.x - ai.x);

        if (ai.sp >= 100 && Math.random() < 0.05) {
          ai.ultimate();
          return;
        }

        if (dist > 35) {
          ai.move(target.x < ai.x ? -1 : 1);
        } else {
          ai.stopMove();
          if (Math.random() < 0.08) ai.attack();
          else if (Math.random() < 0.03 && ai.sp >= 25) ai.specialSkill();
          else if (Math.random() < 0.04) ai.crouch();
        }
      }

      handleGameOver() {
        this.matchState = 'VICTORY';
        const winner = this.p1.isDead ? this.p2 : this.p1;
        const isMeWinner = winner === this.localFighter;
        this.showBanner('K.O.!', 120);

        setTimeout(() => {
          document.getElementById('result-screen').style.display = 'flex';
          document.getElementById('victory-title').innerText = isMeWinner ? 'VICTORY' : 'DEFEAT';
          document.getElementById('victory-subtitle').innerText = `${winner.char.nameKr} (${winner.char.title}) 승리!`;
        }, 1500);
      }

      updateHUD() {
        if (!this.p1 || !this.p2) return;
        const p1Pct = (this.p1.hp / this.p1.maxHp) * 100;
        const p2Pct = (this.p2.hp / this.p2.maxHp) * 100;

        document.getElementById('p1-hp-bar').style.width = `${p1Pct}%`;
        document.getElementById('p1-hp-lag').style.width = `${p1Pct}%`;
        document.getElementById('p2-hp-bar').style.width = `${p2Pct}%`;
        document.getElementById('p2-hp-lag').style.width = `${p2Pct}%`;

        const p1SpPct = (this.p1.sp / 100) * 100;
        const p2SpPct = (this.p2.sp / 100) * 100;
        document.getElementById('p1-sp-bar').style.width = `${p1SpPct}%`;
        document.getElementById('p2-sp-bar').style.width = `${p2SpPct}%`;

        document.getElementById('round-timer').innerText = this.roundTime.toString().padStart(2, '0');
      }

      render() {
        const ctx = this.ctx;
        ctx.save();

        if (FX.shake > 0) {
          ctx.translate((Math.random() - 0.5) * FX.shake, (Math.random() - 0.5) * FX.shake);
        }

        this.drawPixelStage(ctx);

        if (this.p1) this.p1.draw(ctx);
        if (this.p2) this.p2.draw(ctx);

        FX.draw(ctx);

        ctx.restore();

        // Crisp upscale to 1280x720 display canvas
        this.mainCtx.drawImage(this.offscreen, 0, 0, 1280, 720);
      }

      drawPixelStage(ctx) {
        const s = this.season;

        ctx.fillStyle = s.sky;
        ctx.fillRect(0, 0, SF.INTERNAL_W, SF.INTERNAL_H);

        // Pixel Moon
        ctx.fillStyle = s.moon;
        ctx.fillRect(SF.INTERNAL_W / 2 - 16, 25, 32, 32);
        ctx.fillStyle = s.accent;
        ctx.fillRect(SF.INTERNAL_W / 2 - 12, 29, 24, 24);

        // Mountain Silhouettes
        ctx.fillStyle = '#101524';
        for (let i = 0; i < SF.INTERNAL_W; i += 8) {
          const mHeight = 40 + Math.sin(i * 0.05) * 18;
          ctx.fillRect(i, SF.FLOOR_Y - mHeight, 8, mHeight);
        }

        // Seasonal Props
        if (s.id === 'SPRING') {
          ctx.fillStyle = '#2b1a1a';
          ctx.fillRect(15, 60, 6, 86);
          ctx.fillStyle = '#ff80ab';
          ctx.fillRect(8, 45, 24, 20);
        } else if (s.id === 'SUMMER') {
          ctx.fillStyle = '#112e1f';
          ctx.fillRect(20, 40, 5, 106);
          ctx.fillRect(SF.INTERNAL_W - 25, 40, 5, 106);
        }

        // Stone Floor
        ctx.fillStyle = '#222838';
        ctx.fillRect(0, SF.FLOOR_Y, SF.INTERNAL_W, SF.INTERNAL_H - SF.FLOOR_Y);

        ctx.fillStyle = s.accent;
        ctx.fillRect(0, SF.FLOOR_Y, SF.INTERNAL_W, 2);
      }
    }

    // Launch Game on Load
    window.addEventListener('DOMContentLoaded', () => {
      window.Arcade = new ArcadeGame();
    });

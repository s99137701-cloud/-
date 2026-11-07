/**
 * Procedural Audio Synthesizer using Web Audio API
 */
window.SF = window.SF || {};

class SoundManager {
  constructor() {
    this.ctx = null;
    this.enabled = true;
  }

  ensureContext() {
    if (!this.ctx) {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      this.ctx = new AudioContext();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  // Generic White Noise Buffer Generator
  createNoiseBuffer(duration = 0.5) {
    if (!this.ctx) return null;
    const bufferSize = this.ctx.sampleRate * duration;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }
    return buffer;
  }

  // 1. Light Attack Hit
  playHitLight() {
    if (!this.enabled) return;
    this.ensureContext();
    const t = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(260, t);
    osc.frequency.exponentialRampToValueAtTime(60, t + 0.08);

    gain.gain.setValueAtTime(0.4, t);
    gain.gain.exponentialRampToValueAtTime(0.01, t + 0.08);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(t);
    osc.stop(t + 0.08);
  }

  // 2. Heavy Attack Hit (Axe / Heavy punch)
  playHitHeavy() {
    if (!this.enabled) return;
    this.ensureContext();
    const t = this.ctx.currentTime;

    // Sub drop
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(160, t);
    osc.frequency.exponentialRampToValueAtTime(30, t + 0.22);

    gain.gain.setValueAtTime(0.7, t);
    gain.gain.exponentialRampToValueAtTime(0.01, t + 0.22);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    // Crunch noise
    const noise = this.ctx.createBufferSource();
    noise.buffer = this.createNoiseBuffer(0.15);
    const noiseFilter = this.ctx.createBiquadFilter();
    noiseFilter.type = 'lowpass';
    noiseFilter.frequency.setValueAtTime(800, t);
    noiseFilter.frequency.linearRampToValueAtTime(100, t + 0.15);

    const noiseGain = this.ctx.createGain();
    noiseGain.gain.setValueAtTime(0.5, t);
    noiseGain.gain.exponentialRampToValueAtTime(0.01, t + 0.15);

    noise.connect(noiseFilter);
    noiseFilter.connect(noiseGain);
    noiseGain.connect(this.ctx.destination);

    osc.start(t);
    noise.start(t);
    osc.stop(t + 0.22);
    noise.stop(t + 0.15);
  }

  // 3. Sword Slash (청룡)
  playSlash() {
    if (!this.enabled) return;
    this.ensureContext();
    const t = this.ctx.currentTime;

    const noise = this.ctx.createBufferSource();
    noise.buffer = this.createNoiseBuffer(0.18);

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.Q.value = 4;
    filter.frequency.setValueAtTime(3500, t);
    filter.frequency.exponentialRampToValueAtTime(600, t + 0.18);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.4, t);
    gain.gain.exponentialRampToValueAtTime(0.01, t + 0.18);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.ctx.destination);

    noise.start(t);
    noise.stop(t + 0.18);
  }

  // 4. Fire / Energy Blast (주작 / 투사체)
  playFireBlast() {
    if (!this.enabled) return;
    this.ensureContext();
    const t = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(380, t);
    osc.frequency.exponentialRampToValueAtTime(90, t + 0.25);

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(1200, t);
    filter.frequency.linearRampToValueAtTime(200, t + 0.25);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.35, t);
    gain.gain.exponentialRampToValueAtTime(0.01, t + 0.25);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(t);
    osc.stop(t + 0.25);
  }

  // 5. Guard / Parry Clank
  playGuard() {
    if (!this.enabled) return;
    this.ensureContext();
    const t = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(1400, t);
    osc.frequency.exponentialRampToValueAtTime(1000, t + 0.12);

    gain.gain.setValueAtTime(0.45, t);
    gain.gain.exponentialRampToValueAtTime(0.01, t + 0.12);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(t);
    osc.stop(t + 0.12);
  }

  // 6. Ultimate Awakening (사방신 궁극기 시전)
  playUltimate() {
    if (!this.enabled) return;
    this.ensureContext();
    const t = this.ctx.currentTime;

    // Cinematic chord + energy swell
    [220, 277, 330, 440].forEach((freq, i) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(freq * 0.5, t);
      osc.frequency.exponentialRampToValueAtTime(freq * 1.5, t + 0.6);

      gain.gain.setValueAtTime(0.01, t);
      gain.gain.linearRampToValueAtTime(0.25 / (i + 1), t + 0.2);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.7);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(t);
      osc.stop(t + 0.7);
    });
  }

  // 7. Jump Whoosh
  playJump() {
    if (!this.enabled) return;
    this.ensureContext();
    const t = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(120, t);
    osc.frequency.exponentialRampToValueAtTime(320, t + 0.1);

    gain.gain.setValueAtTime(0.2, t);
    gain.gain.exponentialRampToValueAtTime(0.01, t + 0.1);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(t);
    osc.stop(t + 0.1);
  }
}

SF.Sound = new SoundManager();

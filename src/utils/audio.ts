/**
 * Web Audio API synthesizer for realistic car engine sounds, acceleration "Brum!",
 * background arcade music, and interactive SFX.
 */

class SoundSystem {
  private ctx: AudioContext | null = null;
  public enabled: boolean = true;
  public musicEnabled: boolean = false;

  // Continuous Engine Synthesizer Nodes
  private engineOsc1: OscillatorNode | null = null;
  private engineOsc2: OscillatorNode | null = null;
  private engineSubOsc: OscillatorNode | null = null;
  private engineFilter: BiquadFilterNode | null = null;
  private engineGain: GainNode | null = null;
  private isEngineRunning: boolean = false;

  // Background Music Synthesizer
  private musicInterval: NodeJS.Timeout | null = null;
  private musicGain: GainNode | null = null;
  private musicStep: number = 0;

  private init() {
    if (!this.ctx && typeof window !== 'undefined') {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioCtx();
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  // Powerful Acceleration Roar ("¡Brum!")
  playBrumm(intensity: number = 0.8) {
    if (!this.enabled) return;
    try {
      this.init();
      if (!this.ctx) return;
      const now = this.ctx.currentTime;

      // 1. Primary engine cylinder burst
      const osc1 = this.ctx.createOscillator();
      const osc2 = this.ctx.createOscillator();
      const sub = this.ctx.createOscillator();
      const filter = this.ctx.createBiquadFilter();
      const gain = this.ctx.createGain();

      osc1.type = 'sawtooth';
      osc2.type = 'triangle';
      sub.type = 'sawtooth';
      filter.type = 'lowpass';

      const baseFreq = 50 + intensity * 60;
      // Pitch sweeps up with engine revving ("Brummm!")
      osc1.frequency.setValueAtTime(baseFreq, now);
      osc1.frequency.exponentialRampToValueAtTime(baseFreq * 2.8, now + 0.18);
      osc1.frequency.exponentialRampToValueAtTime(baseFreq * 1.5, now + 0.45);

      osc2.frequency.setValueAtTime(baseFreq * 1.5, now);
      osc2.frequency.exponentialRampToValueAtTime(baseFreq * 4.2, now + 0.18);
      osc2.frequency.exponentialRampToValueAtTime(baseFreq * 2.2, now + 0.45);

      sub.frequency.setValueAtTime(baseFreq * 0.5, now);
      sub.frequency.exponentialRampToValueAtTime(baseFreq * 1.4, now + 0.18);
      sub.frequency.exponentialRampToValueAtTime(baseFreq * 0.7, now + 0.45);

      // Filter opens up aggressively giving the throat roar
      filter.frequency.setValueAtTime(280, now);
      filter.frequency.exponentialRampToValueAtTime(1400 + intensity * 800, now + 0.18);
      filter.frequency.exponentialRampToValueAtTime(350, now + 0.45);
      filter.Q.setValueAtTime(3.5, now);

      gain.gain.setValueAtTime(0.01, now);
      gain.gain.linearRampToValueAtTime(0.24, now + 0.05);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.48);

      osc1.connect(filter);
      osc2.connect(filter);
      sub.connect(filter);
      filter.connect(gain);
      gain.connect(this.ctx.destination);

      osc1.start(now);
      osc2.start(now);
      sub.start(now);

      osc1.stop(now + 0.5);
      osc2.stop(now + 0.5);
      sub.stop(now + 0.5);
    } catch {
      // Audio safety
    }
  }

  // Start continuous realistic car engine sound
  startCarEngine() {
    if (!this.enabled || this.isEngineRunning) return;
    try {
      this.init();
      if (!this.ctx) return;

      this.isEngineRunning = true;
      const now = this.ctx.currentTime;

      this.engineGain = this.ctx.createGain();
      this.engineGain.gain.setValueAtTime(0.01, now);
      this.engineGain.gain.exponentialRampToValueAtTime(0.12, now + 0.15);

      this.engineFilter = this.ctx.createBiquadFilter();
      this.engineFilter.type = 'lowpass';
      this.engineFilter.frequency.setValueAtTime(260, now);
      this.engineFilter.Q.setValueAtTime(2.5, now);

      this.engineOsc1 = this.ctx.createOscillator();
      this.engineOsc1.type = 'sawtooth';
      this.engineOsc1.frequency.setValueAtTime(45, now);

      this.engineOsc2 = this.ctx.createOscillator();
      this.engineOsc2.type = 'triangle';
      this.engineOsc2.frequency.setValueAtTime(90, now);

      this.engineSubOsc = this.ctx.createOscillator();
      this.engineSubOsc.type = 'sawtooth';
      this.engineSubOsc.frequency.setValueAtTime(22.5, now);

      this.engineOsc1.connect(this.engineFilter);
      this.engineOsc2.connect(this.engineFilter);
      this.engineSubOsc.connect(this.engineFilter);
      this.engineFilter.connect(this.engineGain);
      this.engineGain.connect(this.ctx.destination);

      this.engineOsc1.start(now);
      this.engineOsc2.start(now);
      this.engineSubOsc.start(now);
    } catch {
      this.isEngineRunning = false;
    }
  }

  // Modulate engine pitch and roar based on velocity (0 to 1) and throttle
  updateCarEngine(speedFraction: number, isAccelerating: boolean = false) {
    if (!this.enabled) return;
    if (!this.isEngineRunning) {
      this.startCarEngine();
    }
    if (!this.ctx || !this.isEngineRunning) return;

    try {
      const now = this.ctx.currentTime;
      const clampedSpeed = Math.max(0, Math.min(1, speedFraction));

      const targetBaseFreq = 42 + clampedSpeed * 170;
      const targetFilterFreq = 220 + clampedSpeed * 650 + (isAccelerating ? 300 : 0);
      const targetGain = isAccelerating ? 0.18 : 0.08 + clampedSpeed * 0.07;

      if (this.engineOsc1) {
        this.engineOsc1.frequency.setTargetAtTime(targetBaseFreq, now, 0.08);
      }
      if (this.engineOsc2) {
        this.engineOsc2.frequency.setTargetAtTime(targetBaseFreq * 2, now, 0.08);
      }
      if (this.engineSubOsc) {
        this.engineSubOsc.frequency.setTargetAtTime(targetBaseFreq * 0.5, now, 0.08);
      }
      if (this.engineFilter) {
        this.engineFilter.frequency.setTargetAtTime(targetFilterFreq, now, 0.08);
      }
      if (this.engineGain) {
        this.engineGain.gain.setTargetAtTime(targetGain, now, 0.08);
      }
    } catch {
      // Audio safety
    }
  }

  // Smoothly fade out and stop continuous engine
  stopCarEngine() {
    if (!this.isEngineRunning || !this.ctx) return;
    try {
      const now = this.ctx.currentTime;
      if (this.engineGain) {
        this.engineGain.gain.setValueAtTime(this.engineGain.gain.value, now);
        this.engineGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.15);
      }
      setTimeout(() => {
        try {
          this.engineOsc1?.stop();
          this.engineOsc2?.stop();
          this.engineSubOsc?.stop();
          this.engineOsc1?.disconnect();
          this.engineOsc2?.disconnect();
          this.engineSubOsc?.disconnect();
          this.engineFilter?.disconnect();
          this.engineGain?.disconnect();
        } catch {
          // ignore
        }
        this.engineOsc1 = null;
        this.engineOsc2 = null;
        this.engineSubOsc = null;
        this.engineFilter = null;
        this.engineGain = null;
        this.isEngineRunning = false;
      }, 160);
    } catch {
      this.isEngineRunning = false;
    }
  }

  // Quick rev blip on click or keypress
  playEngineRev(intensity: number = 0.5) {
    if (!this.enabled) return;
    this.playBrumm(intensity);
  }

  // Tire brake / screech sound
  playBrake() {
    if (!this.enabled) return;
    try {
      this.init();
      if (!this.ctx) return;
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(1400, now);
      osc.frequency.exponentialRampToValueAtTime(700, now + 0.18);
      gain.gain.setValueAtTime(0.08, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + 0.19);
    } catch {
      // Audio safety
    }
  }

  // Click UI sound
  playClick() {
    if (!this.enabled) return;
    try {
      this.init();
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(800, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(300, this.ctx.currentTime + 0.05);
      gain.gain.setValueAtTime(0.12, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.05);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.05);
    } catch {
      // Audio safety
    }
  }

  // Ring collection sound (+100 PTS) with sparkle harmonic chime
  playCollect() {
    if (!this.enabled) return;
    try {
      this.init();
      if (!this.ctx) return;
      const now = this.ctx.currentTime;
      const osc1 = this.ctx.createOscillator();
      const osc2 = this.ctx.createOscillator();
      const gain1 = this.ctx.createGain();
      const gain2 = this.ctx.createGain();

      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(987.77, now); // B5
      osc1.frequency.setValueAtTime(1318.51, now + 0.07); // E6
      gain1.gain.setValueAtTime(0.2, now);
      gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.3);

      osc2.type = 'triangle';
      osc2.frequency.setValueAtTime(1975.53, now + 0.05); // B6
      gain2.gain.setValueAtTime(0.15, now + 0.05);
      gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

      osc1.connect(gain1);
      gain1.connect(this.ctx.destination);
      osc2.connect(gain2);
      gain2.connect(this.ctx.destination);

      osc1.start(now);
      osc1.stop(now + 0.3);
      osc2.start(now + 0.05);
      osc2.stop(now + 0.35);
    } catch {
      // Audio safety
    }
  }

  // Victory fanfare when crossing finish line
  playVictory() {
    if (!this.enabled) return;
    try {
      this.init();
      if (!this.ctx) return;
      const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
      notes.forEach((freq, idx) => {
        const osc = this.ctx!.createOscillator();
        const gain = this.ctx!.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, this.ctx!.currentTime + idx * 0.1);
        gain.gain.setValueAtTime(0.2, this.ctx!.currentTime + idx * 0.1);
        gain.gain.exponentialRampToValueAtTime(0.01, this.ctx!.currentTime + idx * 0.1 + 0.4);
        osc.connect(gain);
        gain.connect(this.ctx!.destination);
        osc.start(this.ctx!.currentTime + idx * 0.1);
        osc.stop(this.ctx!.currentTime + idx * 0.1 + 0.4);
      });
    } catch {
      // Audio safety
    }
  }

  // Cannon fire / projectile launch sound
  playCannonFire() {
    if (!this.enabled) return;
    try {
      this.init();
      if (!this.ctx) return;
      const now = this.ctx.currentTime;

      // 1. Heavy bass punch
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(140, now);
      osc.frequency.exponentialRampToValueAtTime(30, now + 0.35);

      gain.gain.setValueAtTime(0.35, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.38);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + 0.4);

      // 2. High pressure blast noise
      const bufferSize = this.ctx.sampleRate * 0.25;
      const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const output = noiseBuffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        output[i] = Math.random() * 2 - 1;
      }
      const whiteNoise = this.ctx.createBufferSource();
      whiteNoise.buffer = noiseBuffer;

      const noiseFilter = this.ctx.createBiquadFilter();
      noiseFilter.type = 'bandpass';
      noiseFilter.frequency.setValueAtTime(800, now);
      noiseFilter.frequency.exponentialRampToValueAtTime(150, now + 0.25);
      noiseFilter.Q.setValueAtTime(1.5, now);

      const noiseGain = this.ctx.createGain();
      noiseGain.gain.setValueAtTime(0.25, now);
      noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);

      whiteNoise.connect(noiseFilter);
      noiseFilter.connect(noiseGain);
      noiseGain.connect(this.ctx.destination);

      whiteNoise.start(now);
      whiteNoise.stop(now + 0.25);
    } catch {
      // Audio safety
    }
  }

  // Realistic hollow ping-pong ball bounce ("tok!")
  playPingPongBounce(strength: number = 1.0) {
    if (!this.enabled) return;
    try {
      this.init();
      if (!this.ctx) return;
      const now = this.ctx.currentTime;
      const clampedStrength = Math.max(0.15, Math.min(1.0, strength));

      // Dual tone with high initial pop for plastic ping-pong resonance
      const osc1 = this.ctx.createOscillator();
      const osc2 = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc1.type = 'sine';
      osc2.type = 'triangle';

      const baseFreq = 950 + Math.random() * 80;
      osc1.frequency.setValueAtTime(baseFreq, now);
      osc1.frequency.exponentialRampToValueAtTime(baseFreq * 0.65, now + 0.045);

      osc2.frequency.setValueAtTime(baseFreq * 1.5, now);
      osc2.frequency.exponentialRampToValueAtTime(baseFreq * 0.9, now + 0.03);

      gain.gain.setValueAtTime(0.18 * clampedStrength, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);

      osc1.connect(gain);
      osc2.connect(gain);
      gain.connect(this.ctx.destination);

      osc1.start(now);
      osc2.start(now);
      osc1.stop(now + 0.06);
      osc2.stop(now + 0.06);
    } catch {
      // Audio safety
    }
  }

  // Slingshot / Aim tension tone (sweeps upward as user pulls further)
  playSlingshotTension(ratio: number) {
    if (!this.enabled) return;
    try {
      this.init();
      if (!this.ctx) return;
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sawtooth';
      const freq = 180 + Math.min(1, Math.max(0, ratio)) * 400;
      osc.frequency.setValueAtTime(freq, now);

      gain.gain.setValueAtTime(0.04, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(600 + ratio * 800, now);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.09);
    } catch {
      // Audio safety
    }
  }

  // Target hit / basket scored fanfare chime
  playTargetHit() {
    if (!this.enabled) return;
    try {
      this.init();
      if (!this.ctx) return;
      const now = this.ctx.currentTime;
      const chord = [659.25, 830.61, 987.77, 1318.51]; // E5, G#5, B5, E6
      chord.forEach((freq, idx) => {
        const osc = this.ctx!.createOscillator();
        const gain = this.ctx!.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + idx * 0.06);
        gain.gain.setValueAtTime(0.18, now + idx * 0.06);
        gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.06 + 0.35);
        osc.connect(gain);
        gain.connect(this.ctx!.destination);
        osc.start(now + idx * 0.06);
        osc.stop(now + idx * 0.06 + 0.36);
      });
    } catch {
      // Audio safety
    }
  }

  // ==========================================
  // BACKGROUND ARCADE SYNTHWAVE MUSIC
  // ==========================================
  startMusic() {
    if (this.musicInterval) return;
    this.musicEnabled = true;
    this.init();
    if (!this.ctx) return;

    // Melody and Bassline pattern (A minor / Cyberpunk synthwave progression)
    // Scale: A2, C3, D3, E3, G3, A3
    const bassline = [110, 110, 130.81, 146.83, 164.81, 164.81, 196.00, 220.00];
    const arpeggio = [440, 523.25, 659.25, 783.99, 659.25, 523.25, 440, 329.63];

    this.musicStep = 0;
    this.musicInterval = setInterval(() => {
      if (!this.musicEnabled || !this.ctx) return;
      const now = this.ctx.currentTime;
      const step = this.musicStep % 8;
      const bassFreq = bassline[step];
      const arpFreq = arpeggio[step];

      try {
        // Bass synth note
        const bassOsc = this.ctx.createOscillator();
        const bassGain = this.ctx.createGain();
        bassOsc.type = 'triangle';
        bassOsc.frequency.setValueAtTime(bassFreq, now);

        bassGain.gain.setValueAtTime(0.045, now);
        bassGain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);

        bassOsc.connect(bassGain);
        bassGain.connect(this.ctx.destination);

        bassOsc.start(now);
        bassOsc.stop(now + 0.19);

        // Soft shimmer arpeggio note
        if (step % 2 === 0) {
          const arpOsc = this.ctx.createOscillator();
          const arpGain = this.ctx.createGain();
          arpOsc.type = 'sine';
          arpOsc.frequency.setValueAtTime(arpFreq, now);

          arpGain.gain.setValueAtTime(0.025, now);
          arpGain.gain.exponentialRampToValueAtTime(0.001, now + 0.28);

          arpOsc.connect(arpGain);
          arpGain.connect(this.ctx.destination);

          arpOsc.start(now);
          arpOsc.stop(now + 0.29);
        }
      } catch {
        // Audio safety
      }

      this.musicStep++;
    }, 220); // ~136 BPM sixteenth pulse
  }

  stopMusic() {
    this.musicEnabled = false;
    if (this.musicInterval) {
      clearInterval(this.musicInterval);
      this.musicInterval = null;
    }
  }

  toggleMusic(): boolean {
    if (this.musicEnabled) {
      this.stopMusic();
      return false;
    } else {
      this.startMusic();
      return true;
    }
  }
}

export const sound = new SoundSystem();

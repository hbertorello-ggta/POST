/**
 * Web Audio API synthesizer for C.O.S.TI alerts
 * Generates pure synthesizer tones without external media files.
 */

class SoundSystem {
  private ctx: AudioContext | null = null;
  private enabled: boolean = true;

  constructor() {
    // AudioContext will be initialized on first user interaction
    const saved = localStorage.getItem('costi-sound-enabled');
    if (saved !== null) {
      this.enabled = saved === 'true';
    }
  }

  private initCtx() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  public isEnabled(): boolean {
    return this.enabled;
  }

  public toggle(): boolean {
    this.enabled = !this.enabled;
    localStorage.setItem('costi-sound-enabled', String(this.enabled));
    if (this.enabled) {
      this.playSuccessChime();
    }
    return this.enabled;
  }

  /**
   * Alarma urgente y profunda para incidencias críticas PRODUCTIVAS que detienen planta
   */
  public playCriticalAlarm() {
    if (!this.enabled) return;
    try {
      this.initCtx();
      if (!this.ctx) return;

      const now = this.ctx.currentTime;
      // Pulse 1
      const osc1 = this.ctx.createOscillator();
      const gain1 = this.ctx.createGain();
      osc1.type = 'sawtooth';
      osc1.frequency.setValueAtTime(260, now);
      osc1.frequency.exponentialRampToValueAtTime(140, now + 0.25);
      gain1.gain.setValueAtTime(0.2, now);
      gain1.gain.exponentialRampToValueAtTime(0.01, now + 0.25);

      osc1.connect(gain1);
      gain1.connect(this.ctx.destination);
      osc1.start(now);
      osc1.stop(now + 0.25);

      // Pulse 2
      const osc2 = this.ctx.createOscillator();
      const gain2 = this.ctx.createGain();
      osc2.type = 'sawtooth';
      osc2.frequency.setValueAtTime(280, now + 0.3);
      osc2.frequency.exponentialRampToValueAtTime(130, now + 0.6);
      gain2.gain.setValueAtTime(0.25, now + 0.3);
      gain2.gain.exponentialRampToValueAtTime(0.01, now + 0.6);

      osc2.connect(gain2);
      gain2.connect(this.ctx.destination);
      osc2.start(now + 0.3);
      osc2.stop(now + 0.6);
    } catch {
      // Audio might be blocked by browser autoplay policy
    }
  }

  /**
   * Tono suave para advertencias y fallas de apoyo (no productivas)
   */
  public playWarningBeep() {
    if (!this.enabled) return;
    try {
      this.initCtx();
      if (!this.ctx) return;

      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(440, now);
      osc.frequency.exponentialRampToValueAtTime(350, now + 0.2);
      gain.gain.setValueAtTime(0.12, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.2);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + 0.2);
    } catch {
      // Ignore
    }
  }

  /**
   * Tono agradable de confirmación / resolución de evento
   */
  public playSuccessChime() {
    if (!this.enabled) return;
    try {
      this.initCtx();
      if (!this.ctx) return;

      const now = this.ctx.currentTime;
      [523.25, 659.25, 783.99].forEach((freq, idx) => {
        if (!this.ctx) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + idx * 0.08);
        gain.gain.setValueAtTime(0.08, now + idx * 0.08);
        gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.08 + 0.25);

        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now + idx * 0.08);
        osc.stop(now + idx * 0.08 + 0.25);
      });
    } catch {
      // Ignore
    }
  }

  /**
   * Click sutil para navegación
   */
  public playClick() {
    if (!this.enabled) return;
    try {
      this.initCtx();
      if (!this.ctx) return;
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(1200, now);
      gain.gain.setValueAtTime(0.02, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.03);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + 0.03);
    } catch {
      // Ignore
    }
  }
}

export const sound = new SoundSystem();

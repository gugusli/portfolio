// js/audio.js
// Motor de audio: Web Audio API + BGM procedural
// Extraído del HTML original (líneas 93-298), sin cambios funcionales

const Audio_ = {
  ctx: null, muted: false, vol: 0.3,
  bgmGain: null, bgmState: null, bgmInterval: null, bgmStep: 0,
  _hatBuffer: null,
  _reducedMotion: false,

  init() {
    try {
      this.ctx = new (window.AudioContext || window.webkitAudioContext)();
      // Cargar mute desde Storage
      const storedMute = window.Storage?.get('rb_muted');
      this.muted = storedMute === true || storedMute === '1' || storedMute === '"1"';
      // Verificar prefers-reduced-motion para reducir audio también
      this._reducedMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches || false;
      if (this._reducedMotion) this.vol = 0.15;

      // Master BGM gain node
      this.bgmGain = this.ctx.createGain();
      this.bgmGain.gain.value = 0;
      this.bgmGain.connect(this.ctx.destination);

      // Pre-allocate hi-hat buffer (avoid GC pressure)
      const hatLen = Math.ceil(this.ctx.sampleRate * 0.04);
      this._hatBuffer = this.ctx.createBuffer(1, hatLen, this.ctx.sampleRate);
      const hatCh = this._hatBuffer.getChannelData(0);
      for(let i = 0; i < hatCh.length; i++) hatCh[i] = (Math.random()*2-1)*Math.exp(-i/(hatLen*0.15));
    } catch(e) {
      console.warn('Audio init failed', e);
    }
  },

  resume() { this.ctx?.state === 'suspended' && this.ctx.resume(); },

  toggleMute() {
    this.muted = !this.muted;
    try { window.Storage?.set('rb_muted', this.muted ? '1' : '0'); } catch(e) {}
    if (this.muted) this.stopBGM();
    else if (this.bgmState) this.playBGM(this.bgmState);
  },

  play(type) {
    if (this.muted || !this.ctx) return;
    this.resume();
    switch(type) {
      case 'shoot':   this._tone(280,.08,'square',.2); this._noise(.05,.1); break;
      case 'hit':     this._tone(520+Math.random()*200,.06,'square',.15); break;
      case 'break':   this._tone(180,.15,'sawtooth',.2); this._tone(360,.1,'square',.12); this._noise(.1,.15); break;
      case 'wall':    this._tone(200,.03,'sine',.08); break;
      case 'levelup': this._melody([523,659,784],.12,.18); break;
      case 'gameover':this._melody([392,349,330,262],.2,.22); break;
      case 'powerup': this._melody([600,800,1000,1200],.08,.15); break;
      case 'click':   this._tone(800,.04,'sine',.12); break;
      case 'reward':  this._melody([523,659,784,1047],.15,.2); break;
      case 'bomb':    this._tone(80,.3,'sawtooth',.3); this._noise(.2,.25); break;
      case 'armored': this._tone(400,.04,'square',.12); this._tone(500,.04,'square',.1); break;
      case 'destroyed': this._tone(250,.12,'sawtooth',.18); this._noise(.08,.12); break;
      case 'milestone': this._melody([523,659,784,1047,1319],.1,.22); break;
    }
  },

  _tone(f,d,w,v) {
    const o=this.ctx.createOscillator(),g=this.ctx.createGain();
    o.type=w; o.frequency.value=f;
    g.gain.setValueAtTime(v*this.vol,this.ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(.001,this.ctx.currentTime+d);
    o.connect(g); g.connect(this.ctx.destination); o.start(); o.stop(this.ctx.currentTime+d+.01);
  },

  _noise(d,v) {
    const buf=this.ctx.createBuffer(1,Math.max(1,Math.ceil(this.ctx.sampleRate*d)),this.ctx.sampleRate),ch=buf.getChannelData(0);
    for(let i=0;i<ch.length;i++) ch[i]=Math.random()*2-1;
    const s=this.ctx.createBufferSource(); s.buffer=buf;
    const g=this.ctx.createGain();
    g.gain.setValueAtTime(v*this.vol,this.ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(.001,this.ctx.currentTime+d);
    s.connect(g); g.connect(this.ctx.destination); s.start(); s.stop(this.ctx.currentTime+d+.01);
  },

  _melody(notes,gap,vol) {
    notes.forEach((n,i) => setTimeout(() => this._tone(n,gap*.9,'square',vol), i*gap*1000));
  },

  _bgmTone(f,d,w,v) {
    if (!this.ctx || this.muted) return;
    const o=this.ctx.createOscillator(),g=this.ctx.createGain();
    o.type=w; o.frequency.value=f;
    const now=this.ctx.currentTime;
    g.gain.setValueAtTime(0, now);
    g.gain.linearRampToValueAtTime(v*this.vol*0.18, now+0.02);
    g.gain.setValueAtTime(v*this.vol*0.18, now+d*0.7);
    g.gain.linearRampToValueAtTime(0, now+d);
    o.connect(g); g.connect(this.bgmGain); o.start(now); o.stop(now+d+0.05);
  },

  _bgmPad(f,d,w,v) {
    if (!this.ctx || this.muted) return;
    const o=this.ctx.createOscillator(),g=this.ctx.createGain();
    o.type=w; o.frequency.value=f;
    const now=this.ctx.currentTime;
    g.gain.setValueAtTime(0, now);
    g.gain.linearRampToValueAtTime(v*this.vol*0.12, now+d*0.3);
    g.gain.linearRampToValueAtTime(0, now+d);
    o.connect(g); g.connect(this.bgmGain); o.start(now); o.stop(now+d+0.05);
  },

  _bgmKick() {
    if (!this.ctx || this.muted) return;
    const o=this.ctx.createOscillator(),g=this.ctx.createGain();
    const now=this.ctx.currentTime;
    o.type='sine'; o.frequency.setValueAtTime(150, now);
    o.frequency.exponentialRampToValueAtTime(30, now+0.15);
    g.gain.setValueAtTime(this.vol*0.25, now);
    g.gain.exponentialRampToValueAtTime(0.001, now+0.2);
    o.connect(g); g.connect(this.bgmGain); o.start(now); o.stop(now+0.25);
  },

  _bgmHat() {
    if (!this.ctx || this.muted || !this._hatBuffer) return;
    const s = this.ctx.createBufferSource(); s.buffer = this._hatBuffer;
    const g=this.ctx.createGain();
    const now=this.ctx.currentTime;
    g.gain.setValueAtTime(this.vol*0.08, now);
    g.gain.exponentialRampToValueAtTime(0.001, now+0.04);
    s.connect(g); g.connect(this.bgmGain); s.start(now); s.stop(now+0.05);
  },

  playBGM(state) {
    if (!this.ctx || this.muted) return;
    this.resume();
    this.stopBGM();
    this.bgmState = state;
    this.bgmStep = 0;
    const now=this.ctx.currentTime;
    this.bgmGain.gain.cancelScheduledValues(now);
    this.bgmGain.gain.setValueAtTime(this.bgmGain.gain.value, now);
    this.bgmGain.gain.linearRampToValueAtTime(1, now+1.5);

    if (state === 'MENU') {
      this._bgmPad(65.4, 4, 'sine', 0.5);
      this._bgmPad(130.8, 4, 'sine', 0.3);
      this._bgmPad(155.6, 4, 'triangle', 0.2);
      this._bgmPad(196.0, 4, 'triangle', 0.15);
      const menuNotes = [261.6, 311.1, 392.0, 466.2, 587.3, 466.2, 392.0, 311.1];
      const menuNoteLen = 0.45;
      this.bgmInterval = setInterval(() => {
        if (this.muted) return;
        const n = this.bgmStep % menuNotes.length;
        this._bgmTone(menuNotes[n], menuNoteLen, 'sine', 0.35);
        if (this.bgmStep % 2 === 0) {
          this._bgmTone(menuNotes[n]*0.5, menuNoteLen*1.8, 'sine', 0.15);
        }
        if (this.bgmStep % 8 === 0) {
          this._bgmPad(65.4, 3.6, 'sine', 0.4);
          this._bgmPad(155.6, 3.6, 'triangle', 0.15);
          this._bgmPad(196.0, 3.6, 'triangle', 0.12);
        }
        this.bgmStep++;
      }, 600);
    } else if (state === 'GAME') {
      const bassNotes = [65.4, 65.4, 87.3, 77.8];
      const arpNotes = [261.6, 311.1, 349.2, 392.0, 466.2, 392.0, 349.2, 311.1,
                      293.7, 349.2, 392.0, 466.2, 523.3, 466.2, 392.0, 349.2];
      const stepMs = 250;
      this.bgmInterval = setInterval(() => {
        if (this.muted) return;
        const s = this.bgmStep;
        if (s % 4 === 0) this._bgmKick();
        if (s % 2 === 0) this._bgmHat();
        const n = arpNotes[s % arpNotes.length];
        this._bgmTone(n, 0.18, 'square', 0.12);
        if (s % 4 === 0) {
          const bn = bassNotes[(s/4|0) % bassNotes.length];
          this._bgmPad(bn, 0.9, 'sawtooth', 0.3);
        }
        if (s % 16 === 12) {
          this._bgmTone(523.3, 0.3, 'square', 0.18);
          this._bgmTone(659.3, 0.25, 'square', 0.1);
        }
        this.bgmStep++;
      }, stepMs);
    } else if (state === 'GAMEOVER') {
      const sadNotes = [392.0, 349.2, 329.6, 293.7, 261.6, 246.9, 220.0, 196.0];
      let i = 0;
      this.bgmInterval = setInterval(() => {
        if (this.muted || i >= sadNotes.length) { this.stopBGM(); return; }
        this._bgmTone(sadNotes[i], 0.9, 'sine', 0.4);
        this._bgmTone(sadNotes[i]*0.5, 1.2, 'triangle', 0.2);
        if (i % 2 === 0) this._bgmTone(sadNotes[i]*1.06, 0.7, 'sine', 0.08);
        i++;
      }, 500);
    }
  },

  stopBGM() {
    if (this.bgmInterval) { clearInterval(this.bgmInterval); this.bgmInterval = null; }
    if (this.bgmGain && this.ctx) {
      const now=this.ctx.currentTime;
      this.bgmGain.gain.cancelScheduledValues(now);
      this.bgmGain.gain.setValueAtTime(this.bgmGain.gain.value, now);
      this.bgmGain.gain.linearRampToValueAtTime(0, now+0.5);
    }
    this.bgmStep = 0;
  },

  setBGMVolume(v) {
    if (this.bgmGain && this.ctx) {
      const now=this.ctx.currentTime;
      this.bgmGain.gain.cancelScheduledValues(now);
      this.bgmGain.gain.setValueAtTime(this.bgmGain.gain.value, now);
      this.bgmGain.gain.linearRampToValueAtTime(v, now+0.3);
    }
  }
};

window.Audio_ = Audio_;

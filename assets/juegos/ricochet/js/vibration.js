// js/vibration.js
// Haptic feedback con priority queue y cooldown anti-saturación
// Extraído del HTML original (líneas 448-469)

const Vib = {
  _timer: 0, _pending: null, _curPri: 0,
  _reducedMotion: false,

  init() {
    this._reducedMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches || false;
  },

  request(pattern, priority) {
    if (!navigator.vibrate) return;
    // Si el usuario prefiere reduced motion, reducir vibración también
    if (this._reducedMotion) {
      if (Array.isArray(pattern)) pattern = pattern.map(p => Math.min(p, 15));
      else pattern = Math.min(pattern, 15);
    }
    if (!this._pending || priority >= this._curPri) {
      this._pending = { pattern, priority };
    }
  },

  flush() {
    if (this._timer > 0) this._timer -= 16.667;
    if (this._pending && this._timer <= 0) {
      try { navigator.vibrate(this._pending.pattern); } catch(e) {}
      this._curPri = this._pending.priority;
      const p = this._pending.pattern;
      this._timer = (Array.isArray(p) ? p.reduce((a,b)=>a+b,0) : p) + 20;
      this._pending = null;
    }
  }
};

// Legacy wrapper for simple calls (wall=1, hit=2, break=3, bomb=5, milestone=6)
function vibrate(pattern){
  Vib.request(pattern, Array.isArray(pattern)?5:pattern<=10?1:pattern<=30?2:3);
}
function vibratePri(pattern,pri){Vib.request(pattern,pri);}

window.Vib = Vib;
window.vibrate = vibrate;
window.vibratePri = vibratePri;

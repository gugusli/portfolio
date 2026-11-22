// js/difficulty.js
// Curvas de dificultad escaladas por número de turno
// Extraído del HTML original (líneas 537-564)

const Diff = {
  fillRate(t)   { return Math.min(0.65 + t * 0.009, 0.84); },
  hpRange(t)    {
    const lo = Math.max(1, Math.floor(t / 3));
    const hi = lo + 3 + Math.floor(t / 3.5);
    return { lo, hi };
  },
  minBlocks(t)  { return Math.min(3, 2 + Math.floor(t / 12)); },
  doubleWave(t) { return t > 0 && t % 5 === 0; },
  ballGrowth(t) { return Math.ceil(t / 3); },
  powerUpChance(t) {
    if (t < 4) return 0;
    if (t < 15) return 0.12;
    if (t < 30) return 0.07;
    return 0.04;
  },
  armoredChance(t) { return t >= 8 ? Math.min(0.08 + (t-8)*0.003, 0.15) : 0; },
  bombChance(t)    { return t >= 12 ? Math.min(0.05 + (t-12)*0.002, 0.10) : 0; },
  movingChance(t)  { return t >= 18 ? Math.min(0.06 + (t-18)*0.003, 0.18) : 0; },
  level(t) {
    if (t <= 5) return 1;
    if (t <= 10) return 2;
    if (t <= 15) return 3;
    if (t <= 25) return 4;
    if (t <= 40) return 5;
    return 6;
  }
};

window.Diff = Diff;

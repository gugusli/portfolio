// js/rng.js
// Seeded RNG para Daily Challenge + utilidades de fecha

function SeededRandom(seed) {
  let s = seed >>> 0;
  return function() {
    s ^= s << 13; s ^= s >> 17; s ^= s << 5;
    return (s >>> 0) / 4294967296;
  };
}

// Daily seed normalizado a UTC (resuelve el bug de timezones detectado en auditoría)
function getDailySeed() {
  const d = new Date();
  // Usar fecha UTC para que todos los jugadores tengan el mismo challenge
  const y = d.getUTCFullYear();
  const m = d.getUTCMonth() + 1;
  const day = d.getUTCDate();
  return (y * 10000 + m * 100 + day) * 7919;
}

function getDailyKey(){
  const d = new Date();
  return `${d.getUTCFullYear()}-${d.getUTCMonth()+1}-${d.getUTCDate()}`;
}

let rng = Math.random;
let dailyMode = false;
let dailyBest = 0;
let dailyPlayed = false;

window.SeededRandom = SeededRandom;
window.getDailySeed = getDailySeed;
window.getDailyKey = getDailyKey;
window.rng = rng;
window.dailyMode = dailyMode;
window.dailyBest = dailyBest;
window.dailyPlayed = dailyPlayed;

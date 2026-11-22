// js/leaderboard.js
// Leaderboard top-10 + player name con sanitización estricta
// Resuelve el issue crítico de XSS (CWE-79) documentado en auditoría

let leaderboard = [];
let newLBIdx = -1;
let playerName = '';
let nameInputActive = false;
let nameSubmitted = false;
let nameInputReady = false;
let nameCursorTimer = 0;

function loadLB(){
  try {
    const lb = window.Storage?.get('rb_lb', []);
    return Array.isArray(lb) ? lb : [];
  } catch(e) { return []; }
}

function saveLB(lb){
  try { window.Storage?.set('rb_lb', lb); } catch(e) {}
}

/**
 * Añade una entrada al leaderboard.
 * El name se sanitiza SIEMPRE antes de persistir (defense-in-depth).
 */
function addLB(entry){
  leaderboard = loadLB();
  // Sanitizar name con whitelist estricta (XSS prevention)
  entry.name = window.Security.sanitizePlayerName(entry.name || playerName || '???');
  if (!entry.name) entry.name = '???';
  // Validar otros campos
  entry.score = window.Security.safeNumber(entry.score, 0, Number.MAX_SAFE_INTEGER, 0);
  entry.turn = window.Security.safeNumber(entry.turn, 0, 9999, 0);
  entry.comboMax = window.Security.safeNumber(entry.comboMax, 0, 9999, 0);
  entry.totalDestroyed = window.Security.safeNumber(entry.totalDestroyed, 0, 999999, 0);
  entry.date = Date.now();

  leaderboard.push(entry);
  leaderboard.sort((a,b)=>b.score-a.score);
  if(leaderboard.length>10) leaderboard.length=10;
  newLBIdx = leaderboard.indexOf(entry);
  saveLB(leaderboard);
}

function loadPlayerName(){
  try {
    const name = window.Storage?.get('rb_name', '');
    return window.Security.sanitizePlayerName(name || '');
  } catch(e) { return ''; }
}

function savePlayerName(n){
  const clean = window.Security.sanitizePlayerName(n);
  try { window.Storage?.set('rb_name', clean); } catch(e) {}
  return clean;
}

function loadHi(){
  const v = window.Storage?.get('rb_hi', 0);
  return window.Security.safeNumber(v, 0, Number.MAX_SAFE_INTEGER, 0);
}

function saveHi(s){
  try { window.Storage?.set('rb_hi', window.Security.safeNumber(s, 0)); } catch(e) {}
}

function loadDailyBest(){
  const v = window.Storage?.get('rb_daily_best', 0);
  return window.Security.safeNumber(v, 0, Number.MAX_SAFE_INTEGER, 0);
}

function saveDailyBest(s){
  try { window.Storage?.set('rb_daily_best', window.Security.safeNumber(s, 0)); } catch(e) {}
}

function loadDailyDate(){
  try { return window.Storage?.get('rb_daily_date', '') || ''; } catch(e) { return ''; }
}

function saveDailyDate(d){
  try { window.Storage?.set('rb_daily_date', d); } catch(e) {}
}

/**
 * Submit score al leaderboard.
 * Usa la API de CrazyGames si está disponible, sino solo local.
 */
function submitScore(){
  if(nameSubmitted) return;
  nameSubmitted = true;
  playerName = savePlayerName(playerName);
  addLB({score, turn, comboMax, totalDestroyed, date: Date.now(), name: playerName || '???'});
  hideNameInput();
  Audio_.play('click');
  vibrate(15);
}

window.loadLB = loadLB;
window.saveLB = saveLB;
window.addLB = addLB;
window.loadPlayerName = loadPlayerName;
window.savePlayerName = savePlayerName;
window.loadHi = loadHi;
window.saveHi = saveHi;
window.loadDailyBest = loadDailyBest;
window.saveDailyBest = saveDailyBest;
window.loadDailyDate = loadDailyDate;
window.saveDailyDate = saveDailyDate;
window.submitScore = submitScore;

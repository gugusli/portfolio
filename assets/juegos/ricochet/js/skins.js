// js/skins.js
// Sistema de skins de la bola y desbloqueables por milestones
// Extraído del HTML original (líneas 381-435)

const BALL_SKINS = {
  default: { color:'#ffffff', glow:'#88ccff', trail:'#aadeff', label:'DEFAULT' },
  plasma:  { color:'#ff00ff', glow:'#cc00ff', trail:'#880088', label:'PLASMA'  },
  acid:    { color:'#00ff88', glow:'#00cc44', trail:'#006633', label:'ACID'    },
  ghost:   { color:'rgba(200,220,255,0.85)', glow:'#4488ff', trail:'rgba(100,150,255,0.4)', label:'GHOST' },
  golden:  { color:'#ffdd59', glow:'#ffaa00', trail:'#cc8800', label:'GOLDEN'  },
};

const SKIN_ORDER = ['default','plasma','acid','ghost','golden'];

const SKIN_UNLOCKS = {
  default: null,
  plasma:  { type:'score', value:100000,  desc:'Reach 100K score' },
  acid:    { type:'combo', value:20,      desc:'Get a 20-hit combo' },
  ghost:   { type:'turns', value:30,      desc:'Survive 30 turns'  },
  golden:  { type:'score', value:1000000, desc:'Reach 1M score'    },
};

let activeSkinIdx = 0;
let skinUnlocks = {};

function loadSkinIdx(){
  const v = window.Storage?.get('rb_skin', 0);
  return window.Security?.safeNumber(v, 0, SKIN_ORDER.length-1, 0) || 0;
}

function saveSkinIdx(i){
  try { window.Storage?.set('rb_skin', i); } catch(e) {}
}

function loadUnlocks(){
  try {
    const u = window.Storage?.get('rb_unlocks', {default:true});
    return (u && typeof u === 'object') ? u : {default:true};
  } catch(e) { return {default:true}; }
}

function saveUnlocks(u){
  try { window.Storage?.set('rb_unlocks', u); } catch(e) {}
}

function checkSkinUnlocks() {
  let changed = false;
  const conds = { score, combo: comboMax, turns: turn };
  SKIN_ORDER.forEach(name => {
    if (skinUnlocks[name]) return;
    const u = SKIN_UNLOCKS[name];
    if (!u) return;
    if (conds[u.type] >= u.value) {
      skinUnlocks[name] = true;
      changed = true;
      const sk = BALL_SKINS[name];
      parts.push({x:W/2,y:H/2-40,vx:0,vy:-1,life:120,max:120,sz:0,
        color:sk.glow,rot:0,rs:0,g:0,t:'text',text:'SKIN UNLOCKED: '+sk.label,fs:16});
      Audio_.play('powerup');
    }
  });
  if (changed) saveUnlocks(skinUnlocks);
}

function getActiveSkin() {
  const name = SKIN_ORDER[activeSkinIdx] || 'default';
  return BALL_SKINS[skinUnlocks[name] ? name : 'default'];
}

function cycleSkin() {
  const available = SKIN_ORDER.filter(n => skinUnlocks[n]);
  if (available.length <= 1) return;
  let cur = available.indexOf(SKIN_ORDER[activeSkinIdx]);
  activeSkinIdx = SKIN_ORDER.indexOf(available[(cur+1) % available.length]);
  saveSkinIdx(activeSkinIdx);
  Audio_.play('click');
}

window.BALL_SKINS = BALL_SKINS;
window.SKIN_ORDER = SKIN_ORDER;
window.SKIN_UNLOCKS = SKIN_UNLOCKS;
window.activeSkinIdx = activeSkinIdx;
window.skinUnlocks = skinUnlocks;
window.loadSkinIdx = loadSkinIdx;
window.saveSkinIdx = saveSkinIdx;
window.loadUnlocks = loadUnlocks;
window.saveUnlocks = saveUnlocks;
window.checkSkinUnlocks = checkSkinUnlocks;
window.getActiveSkin = getActiveSkin;
window.cycleSkin = cycleSkin;

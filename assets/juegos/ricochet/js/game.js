// js/game.js
// Lógica principal del juego: state, fire, update, collide, endTurn
// Extraído del HTML original, adaptado para usar módulos externos

// ── Canvas y dimensiones globales ────────────────────────────
const C = document.getElementById('c'), ctx = C.getContext('2d');
const W = 420, H = 700;
C.width = W; C.height = H;
// Exponer inmediatamente para detectar si el resto del archivo falla
window.C = C; window.ctx = ctx; window.W = W; window.H = H;

// ── Layout Constants ─────────────────────────────────────────
// AUMENTADO Fase 2: botones más grandes (24→44px) para cumplir Apple HIG
// FIX v2.1: topBarH aumentado a 84 para evitar overlap entre botones y texto
const UI = {
  pauseBtn: {x:4, y:4, s:44},       // era 24, ahora 44 (Fase 2)
  muteBtn: {x:W-48, y:4, s:44},     // era W-36, s:24
  topBarH: 84,                      // era 66, ahora 84 para separar botones y texto
  cannonY: 648,
  pausePanel: {x:W/2-125, y:H/2-180, w:250, h:420, btnW:200, btnH:46, gap:10},
  goAdBtn: {x:W/2-90, y:H/2+90, w:180, h:46},
  goRetryBtn: {x:W/2-78, w:156, h:46},
  goHomeBtn: {w:156, h:38},
  goBtnGap: 10,
  dailyBtn: {w:160, h:40},
  skinBtn: {w:120, h:40},
  lbBtn: {w:130, h:36},
  nameInput: {w:200, h:40}
};

// Shared layout functions for button hit detection
function getPauseLayout() {
  const pp = UI.pausePanel;
  const bx = W/2 - pp.btnW/2;
  const startY = pp.y + 195;
  return {
    panel: pp,
    resume:  {x:bx, y:startY,                 w:pp.btnW, h:pp.btnH},
    sound:   {x:bx, y:startY + pp.btnH + pp.gap,   w:pp.btnW, h:pp.btnH},
    restart: {x:bx, y:startY + 2*(pp.btnH + pp.gap), w:pp.btnW, h:pp.btnH},
    quit:    {x:bx, y:startY + 3*(pp.btnH + pp.gap), w:pp.btnW, h:pp.btnH}
  };
}

function getGOLayout() {
  let nextY = UI.goAdBtn.y;
  const adBtn = !continueUsed
    ? {x:UI.goAdBtn.x, y:nextY, w:UI.goAdBtn.w, h:UI.goAdBtn.h}
    : null;
  if (!continueUsed) nextY += UI.goAdBtn.h + UI.goBtnGap;
  const retryBtn = {x:UI.goRetryBtn.x, y:nextY, w:UI.goRetryBtn.w, h:UI.goRetryBtn.h};
  const homeBtn = {x:UI.goRetryBtn.x, y:nextY + UI.goRetryBtn.h + UI.goBtnGap, w:UI.goHomeBtn.w, h:UI.goHomeBtn.h};
  return {adBtn, retryBtn, homeBtn};
}

const menuPlayBtn = {x:W/2-90, y:H*0.38, w:180, h:56};

// ── Constants ────────────────────────────────────────────────
// FIX v2.1: GTOP aumentado de 72 a 90 para coincidir con topBarH=84 + margen
const COLS=7, BW=60, BH=50, GTOP=90;
const MAX_ROW=10, GOLY=GTOP+MAX_ROW*BH;
const CX=W/2, CY=UI.cannonY, BR=7, BSPD=9, LDLY=5;
const NEONS=['#ff4757','#ff6b81','#ffa502','#ffdd59','#2ed573','#1e90ff','#5352ed','#00d2d3','#ff6b9d','#ff9f43'];
const POWER_COLORS={fireball:'#ff4500',multi:'#00d2d3',freeze:'#87ceeb'};
const POWER_TYPES=['fireball','multi','freeze'];

let uid=0;
function nid(){return ++uid;}

// ── Number Formatting ────────────────────────────────────────
function fmtNum(n){
  n = window.Security.safeNumber(n, 0);
  if(n<1000)return String(n);
  if(n<1000000){const v=n/1000;return v>=999.95?'999.9K':v.toFixed(1)+'K';}
  if(n<1000000000){const v=n/1000000;return v>=999.95?'999.9M':v.toFixed(1)+'M';}
  const v=n/1000000000;return v.toFixed(1)+'B';
}

// ── State ────────────────────────────────────────────────────
let gs, blocks, balls, parts, queue, turn, score, ballCount, mx, my, si, st, sx, sy, hiScore;
let survivalStreak = 0;
let activePower, powerUpBlock, freezeTurns, fireballTurns, multiShotTurns;
let comboCount, comboTimer, comboMax, totalDestroyed, scoreMultiplier;
let fadeAlpha, fadeTarget, fadeCallback, continueUsed;
let screenFlash, screenFlashColor;
let waveWarningTimer, pausedState;
let rowSlide = 0;
let newBestShown = false, newBestOld = 0;
let hiResetTimer = 0;
let lastMilestone = 0;
let goScoreDisplay = 0;
let goScoreAnimTimer = 0;
let milestoneColors = ['#ffdd59','#00d2d3','#ff6b9d','#7bed9f'];
let hiResetConfirm = 0;

function resetGame() {
  blocks=[]; parts=[]; queue=[]; balls=[];
  turn=1; score=0; ballCount=1;
  si=st=sx=sy=0;
  mx=W/2; my=CY-100;
  activePower=null; powerUpBlock=null;
  freezeTurns=0; fireballTurns=0; multiShotTurns=0;
  comboCount=0; comboTimer=0; comboMax=0; totalDestroyed=0;
  scoreMultiplier=1;
  continueUsed=false;
  nameSubmitted=false; nameInputActive=false; nameInputReady=false; nameCursorTimer=0;
  screenFlash=0; screenFlashColor='#fff';
  waveWarningTimer=0;
  pausedState=null;
  rowSlide = 0;
  newBestOld = hiScore || 0;
  newBestShown = false;
  lastMilestone = Math.floor(newBestOld / 1000000);
  goScoreDisplay = 0; goScoreAnimTimer = 0;
  for(let r=0;r<4;r++) mkRow(r,1).forEach(b=>blocks.push(b));
  survivalStreak = 0;
  dailyMode = false;
  rng = Math.random;
}

function reset() {
  gs='MENU';
  mx=W/2; my=H/2;
  hiScore=loadHi();
  leaderboard=loadLB();
  playerName=loadPlayerName();
  fadeAlpha=0; fadeTarget=0; fadeCallback=null;
  resetGame();
  dailyBest = loadDailyBest();
  skinUnlocks = loadUnlocks();
  skinUnlocks.default = true;
  activeSkinIdx = loadSkinIdx();
  dailyPlayed = (loadDailyDate() === getDailyKey());
  Audio_.playBGM('MENU');
}

// ── Fade ─────────────────────────────────────────────────────
function fadeIn(cb) { fadeAlpha=1; fadeCallback=cb; fadeTarget=0; }
function fadeOut(cb) { fadeAlpha=0; fadeCallback=cb; fadeTarget=1; }

// ── Block generation ─────────────────────────────────────────
function bHP(t) {
  const {lo,hi}=Diff.hpRange(t);
  return lo+Math.floor(rng()*(hi-lo+1));
}

function mkRow(row,t) {
  const out=[];
  const fillRate=Diff.fillRate(t);
  for(let c=0;c<COLS;c++){
    if(rng()<fillRate){
      const hp=bHP(t);
      out.push({id:nid(),col:c,row,hp,mhp:hp,
        color:NEONS[Math.floor(rng()*NEONS.length)],
        type:'normal',powerType:null,
        moveDir:0,moveTimer:0,movePhase:rng()*Math.PI*2,
        moveOffset:0,flashTimer:0,dyingTimer:0});
    }
  }
  const minB=Diff.minBlocks(t);
  while(out.length<minB){
    if(out.length>=COLS) break;
    const c=Math.floor(rng()*COLS);
    if(!out.find(b=>b.col===c)){
      const hp=bHP(t);
      out.push({id:nid(),col:c,row,hp,mhp:hp,
        color:NEONS[Math.floor(rng()*NEONS.length)],
        type:'normal',powerType:null,
        moveDir:0,moveTimer:0,movePhase:rng()*Math.PI*2,
        moveOffset:0,flashTimer:0,dyingTimer:0});
    }
  }
  for(let i=0;i<out.length;i++){
    const b=out[i];
    if(b.type==='normal' && rng()<Diff.armoredChance(t)){
      b.type='armored'; b.hp=Math.ceil(b.hp*2); b.mhp=b.hp;
      b.color='#aabbcc';
    }
    else if(b.type==='normal' && rng()<Diff.bombChance(t)){
      b.type='bomb'; b.hp=b.mhp=1;
      b.color='#ff6348';
    }
    if(b.type==='normal' && rng()<Diff.powerUpChance(t) && !out.find(x=>x.powerType)){
      const pType=POWER_TYPES[Math.floor(rng()*POWER_TYPES.length)];
      b.type='power'; b.powerType=pType;
      b.color=POWER_COLORS[pType]; b.mhp=b.hp=1;
    }
    if((b.type==='normal'||b.type==='armored') && rng()<Diff.movingChance(t)){
      b.moveDir=rng()<.5?-1:1;
      b.moveTimer=60+rng()*120;
    }
  }
  return out;
}

function bRect(b){
  return {x:b.col*BW+(b.moveOffset||0), y:GTOP+b.row*BH+(rowSlide||0), w:BW, h:BH};
}

// ── Shake ────────────────────────────────────────────────────
let shakeVelX=0, shakeVelY=0;
const SHK_STIFF=0.15, SHK_DAMP=0.72;
function shk(i,f) { if(i>si)si=i; if(f>st)st=f; }
function updShk() {
  if(st>0){
    st--;
    const targetX=(Math.random()-.5)*si*2.5;
    const targetY=(Math.random()-.5)*si*2.5;
    shakeVelX+=(targetX-sx)*SHK_STIFF;
    shakeVelY+=(targetY-sy)*SHK_STIFF;
    shakeVelX*=SHK_DAMP; shakeVelY*=SHK_DAMP;
    sx+=shakeVelX; sy+=shakeVelY;
    si*=.78;
  }else{
    shakeVelX+=(0-sx)*0.3;
    shakeVelY+=(0-sy)*0.3;
    shakeVelX*=0.7; shakeVelY*=0.7;
    sx+=shakeVelX; sy+=shakeVelY;
    if(Math.abs(sx)<0.1&&Math.abs(sy)<0.1&&Math.abs(shakeVelX)<0.05&&Math.abs(shakeVelY)<0.05){
      sx=sy=shakeVelX=shakeVelY=0;
    }
  }
}

// ── Particles ────────────────────────────────────────────────
function pBlast(x,y,color){
  for(let i=0;i<12;i++){
    const a=(Math.PI*2/12)*i+Math.random()*.5,spd=2+Math.random()*4.5;
    parts.push({x,y,vx:Math.cos(a)*spd,vy:Math.sin(a)*spd,
      life:40+Math.random()*20,max:60,sz:5+Math.random()*5,
      color,rot:Math.random()*Math.PI*2,rs:(Math.random()-.5)*.3,g:.14,t:'sq'});
  }
  parts.push({x,y,vx:0,vy:0,life:12,max:12,sz:BW*.5,color:'#fff',rot:0,rs:0,g:0,t:'fl'});
}
function pSpark(x,y){
  for(let i=0;i<3;i++)
    parts.push({x,y,vx:(Math.random()-.5)*3,vy:-Math.random()*2-.5,
      life:15,max:15,sz:2,color:'#fff',rot:0,rs:0,g:.1,t:'ci'});
}
function pMuzzle(x,y,a){
  const ba=a+Math.PI;
  for(let i=0;i<8;i++){
    const da=ba+(Math.random()-.5)*1.2,spd=1+Math.random()*3.5;
    parts.push({x,y,vx:Math.cos(da)*spd,vy:Math.sin(da)*spd,
      life:22,max:22,sz:2+Math.random()*2,color:'#ffcc00',rot:0,rs:0,g:.05,t:'ci'});
  }
  parts.push({x,y,vx:0,vy:0,life:8,max:8,sz:20,color:'#fff',rot:0,rs:0,g:0,t:'fl'});
}
function pLvlUp(x,y){
  for(let i=0;i<24;i++){
    const a=(Math.PI*2/24)*i,spd=2+Math.random()*5.5;
    parts.push({x,y,vx:Math.cos(a)*spd,vy:Math.sin(a)*spd,
      life:55,max:55,sz:4+Math.random()*5,color:'#2ed573',rot:0,rs:.2,g:.1,t:'sq'});
  }
  parts.push({x,y,vx:0,vy:0,life:15,max:15,sz:36,color:'#2ed573',rot:0,rs:0,g:0,t:'fl'});
}
function pPowerUp(x,y,color){
  for(let i=0;i<20;i++){
    const a=(Math.PI*2/20)*i,spd=3+Math.random()*6;
    parts.push({x,y,vx:Math.cos(a)*spd,vy:Math.sin(a)*spd,
      life:50,max:50,sz:3+Math.random()*4,color,rot:0,rs:.3,g:.08,t:'sq'});
  }
  parts.push({x,y,vx:0,vy:0,life:18,max:18,sz:40,color,rot:0,rs:0,g:0,t:'fl'});
}
function pCombo(x,y,combo,mult){
  parts.push({x,y,vx:0,vy:-1.5,life:60,max:60,sz:0,
    color:'#ffdd59',rot:0,rs:0,g:0,t:'text',
    text:`x${mult.toFixed(1)}`});
}
function pScorePopup(x,y,pts){
  parts.push({x,y,vx:(Math.random()-.5)*.5,vy:-2,life:45,max:45,sz:0,
    color:'#ffffff',rot:0,rs:0,g:0,t:'text',
    text:`+${fmtNum(pts)}`,fs:pts>100?16:13});
}
function pBombExplode(x,y){
  for(let i=0;i<32;i++){
    const a=(Math.PI*2/32)*i,spd=3+Math.random()*7;
    parts.push({x,y,vx:Math.cos(a)*spd,vy:Math.sin(a)*spd,
      life:50+Math.random()*20,max:70,sz:4+Math.random()*6,
      color:i%2===0?'#ff4500':'#ffdd59',rot:0,rs:.4,g:.1,t:'sq'});
  }
  parts.push({x,y,vx:0,vy:0,life:20,max:20,sz:60,color:'#ff6600',rot:0,rs:0,g:0,t:'fl'});
  parts.push({x,y,vx:0,vy:0,life:12,max:12,sz:35,color:'#fff',rot:0,rs:0,g:0,t:'fl'});
}
function pWaveWarning(){
  waveWarningTimer=90;
}

function updParts(dt){
  let write=0;
  for(let i=0;i<parts.length;i++){
    const p=parts[i];
    p.x+=p.vx*dt; p.y+=p.vy*dt; p.vy+=p.g*dt;
    p.rot+=p.rs*dt; p.life-=dt;
    if(p.life>0){parts[write++]=p;}
  }
  parts.length=write;
  if(parts.length>600)parts.splice(0,parts.length-600);
}

function drawParts(){
  for(const p of parts){
    const a=p.life/p.max;
    ctx.save(); ctx.globalAlpha=a;
    if(p.t==='sq'){
      ctx.translate(p.x,p.y);ctx.rotate(p.rot);
      ctx.fillStyle=p.color;ctx.fillRect(-p.sz/2,-p.sz/2,p.sz,p.sz);
    }else if(p.t==='ci'){
      ctx.beginPath();ctx.arc(p.x,p.y,p.sz,0,Math.PI*2);
      ctx.fillStyle=p.color;ctx.fill();
    }else if(p.t==='fl'){
      ctx.translate(p.x,p.y);
      const r=p.sz*(2-a*1.2);
      ctx.beginPath();ctx.arc(0,0,r,0,Math.PI*2);
      ctx.fillStyle=p.color;ctx.fill();
    }else if(p.t==='text'){
      const sz=p.fs||22;
      ctx.font=`bold ${sz}px 'Courier New',monospace`;
      ctx.textAlign='center';ctx.textBaseline='middle';
      ctx.shadowBlur=12;ctx.shadowColor=p.color;
      ctx.fillStyle=p.color;
      // Sanitizar texto para canvas (defense-in-depth)
      const safeText = window.Security.sanitizeForCanvas(p.text || '');
      ctx.fillText(safeText,p.x,p.y);
      ctx.shadowBlur=0;
    }
    ctx.restore();
  }
  ctx.globalAlpha=1;
}

// ── Collision ────────────────────────────────────────────────
function collide(ball,blk){
  const r=bRect(blk);
  const cx=Math.max(r.x,Math.min(ball.x,r.x+r.w));
  const cy=Math.max(r.y,Math.min(ball.y,r.y+r.h));
  const dx=ball.x-cx,dy=ball.y-cy,d2=dx*dx+dy*dy;
  if(d2>=BR*BR)return false;
  const dist=Math.sqrt(d2)||.01,push=BR-dist+.8;
  const onV=cx===r.x||cx===r.x+r.w;
  const onH=cy===r.y||cy===r.y+r.h;
  const isArmored=blk.type==='armored';
  if(!ball.fireball||isArmored){
    if(onV&&!onH){ball.vx=-ball.vx;ball.x+=(cx===r.x?-1:1)*push;}
    else if(onH&&!onV){ball.vy=-ball.vy;ball.y+=(cy===r.y?-1:1)*push;}
    else{
      if(Math.abs(dx)>Math.abs(dy)){ball.vx=-ball.vx;ball.x+=(dx/dist)*push;}
      else{ball.vy=-ball.vy;ball.y+=(dy/dist)*push;}
    }
  }
  return true;
}

// ── Power-up Activation ──────────────────────────────────────
function activatePower(type){
  Audio_.play('powerup');
  switch(type){
    case 'fireball': fireballTurns=2; activePower='fireball'; break;
    case 'multi': ballCount+=Math.max(2,Math.ceil(ballCount*0.5)); activePower='multi'; break;
    case 'freeze': freezeTurns=2; activePower='freeze'; break;
  }
  powerUpBlock={type,timer:90};
}

// ── Bomb chain destruction ───────────────────────────────────
function processBombDestruction(blkId, bx, by){
  pBombExplode(bx,by);
  Audio_.play('bomb');
  shk(18,20);
  vibrate([50,20,80]);
  score+=25*turn;

  const dead=new Set();
  const chainQueue=[{x:bx,y:by}];
  const processed=new Set([blkId]);
  let iterations=0;

  while(chainQueue.length>0 && iterations<15){
    iterations++;
    const{ x:ex, y:ey }=chainQueue.shift();
    for(let i=0;i<blocks.length;i++){
      const b=blocks[i];
      if(dead.has(b.id)||processed.has(b.id))continue;
      const br=bRect(b);
      const bcx=br.x+br.w/2, bcy=br.y+br.h/2;
      if(Math.abs(bcx-ex)<=BW*1.5 && Math.abs(bcy-ey)<=BH*1.5){
        processed.add(b.id);
        b.hp-=3;
        b.flashTimer=8;
        if(b.hp<=0){
          dead.add(b.id);
          pBlast(bcx,bcy,b.color);
          score+=15*turn;
          totalDestroyed++;
          if(b.type==='bomb') chainQueue.push({x:bcx,y:bcy});
        }
      }
    }
  }
  return dead;
}

// ── Logic ────────────────────────────────────────────────────
function canShoot(){return my<CY-22;}

function fire(){
  if(!canShoot())return;
  Audio_.play('shoot');
  const a=Math.atan2(my-CY,mx-CX),n=ballCount;
  const spread=Math.min((n-1)*.028,.16);
  const actualBalls=multiShotTurns>0?n*2:n;
  if(multiShotTurns>0)multiShotTurns--;
  const critChance = Math.min(0.02 + turn * 0.002, 0.08);
  queue=[];
  for(let i=0;i<actualBalls;i++){
    const t=actualBalls===1?0:(i/(actualBalls-1))-.5;
    queue.push({
      angle: a+t*spread*2,
      delay: i*LDLY,
      fireball: fireballTurns>0,
      crit: Math.random() < critChance
    });
  }
  if(fireballTurns>0)fireballTurns--;
  pMuzzle(CX,CY-16,a);
  gs='FIRING';
  // ARIA: anunciar acción para screen readers
  window.ARIA?.announce('Firing');
}

function endTurn(){
  turn++;score+=5;
  if(score>hiScore){hiScore=score;saveHi(hiScore);}

  survivalStreak++;
  if(survivalStreak > 0 && survivalStreak % 10 === 0){
    const streakBonus = survivalStreak * 100 * turn;
    score += streakBonus;
    pScorePopup(CX, CY-60, streakBonus);
    parts.push({x:W/2,y:H/2,vx:0,vy:-1.2,life:90,max:90,sz:0,
      color:'#ffa502',rot:0,rs:0,g:0,t:'text',
      text:`${survivalStreak} TURN STREAK!`,fs:18});
    screenFlash=0.2; screenFlashColor='#ffa502';
    Audio_.play('milestone');
    vibrate([30,10,40]);
  }
  checkSkinUnlocks();

  comboCount=0; comboTimer=0; scoreMultiplier=1;

  const nb=Diff.ballGrowth(turn);
  if(nb>ballCount){ballCount=nb;pLvlUp(CX,CY);shk(15,18);Audio_.play('levelup');}

  if(Diff.doubleWave(turn)&&freezeTurns<=0){
    pWaveWarning();
  }

  if(freezeTurns>0){
    freezeTurns--;
    rowSlide = -BH;
    mkRow(0,turn).forEach(b=>blocks.push(b));
  }else{
    const advanceRows=Diff.doubleWave(turn)?2:1;
    for(let a=0;a<advanceRows;a++){
      for(const b of blocks)b.row++;
      mkRow(0,turn).forEach(b=>blocks.push(b));
    }
    rowSlide = -(BH * advanceRows);
  }

  if(blocks.some(b=>b.row>=MAX_ROW)){
    if(dailyMode && score > dailyBest){
      dailyBest = score;
      saveDailyBest(score);
      saveDailyDate(getDailyKey());
    }
    CG.gameplayStop();
    gs='GAMEOVER';
    if(score>hiScore){hiScore=score;saveHi(hiScore);}
    Audio_.play('gameover');
    Audio_.playBGM('GAMEOVER');
    vibrate([100,50,100,50,200]);
    window.ARIA?.announce('Game over. Press R to retry.');
    return;
  }
  gs='AIMING';
}

// ── Pause/Resume ─────────────────────────────────────────────
function togglePause(){
  if(gs==='PAUSED'){
    resumeFromPause();
  }else if(gs==='AIMING'||gs==='FIRING'){
    pausedState=gs;
    gs='PAUSED';
    if(pausedState==='FIRING')CG.gameplayStop();
    Audio_.play('click');
    Audio_.setBGMVolume(0.3);
  }
}

function resumeFromPause(){
  gs=pausedState||'AIMING';
  pausedState=null;
  if(gs==='FIRING')CG.gameplayStart();
  Audio_.play('click');
  Audio_.setBGMVolume(1);
}

// ── Update ───────────────────────────────────────────────────
function update(dt){
  if(!dt) dt=1;
  updShk();updParts(dt);Vib.flush();

  if(rowSlide < 0) rowSlide = Math.min(0, rowSlide + BH * 0.1 * dt);

  if(gs==='PAUSED'){
    if(fadeAlpha!==fadeTarget){
      const speed=0.06*dt;
      if(fadeTarget>fadeAlpha)fadeAlpha=Math.min(fadeAlpha+speed,fadeTarget);
      else fadeAlpha=Math.max(fadeAlpha-speed,fadeTarget);
      if(Math.abs(fadeAlpha-fadeTarget)<0.01){fadeAlpha=fadeTarget;if(fadeCallback){const cb=fadeCallback;fadeCallback=null;cb();}}
    }
    return;
  }

  if(screenFlash>0)screenFlash*=.85;
  if(waveWarningTimer>0)waveWarningTimer-=dt;
  if(powerUpBlock){powerUpBlock.timer-=dt;if(powerUpBlock.timer<=0)powerUpBlock=null;}
  if(comboTimer>0)comboTimer-=dt;

  if(hiResetTimer>0){
    hiResetTimer+=dt;
    if(hiResetTimer>=180){
      GDPR.revoke();  // Limpia también todos los datos GDPR
      hiScore=0; saveHi(0); hiResetTimer=0;
      leaderboard=[]; saveLB([]);
      playerName=''; savePlayerName('');
      hiResetConfirm=120;
      window.ARIA?.announce('All data erased');
    }
  }
  if(hiResetConfirm>0)hiResetConfirm-=dt;

  if(gs==='GAMEOVER'){
    if(goScoreAnimTimer<90){
      goScoreAnimTimer+=dt;
      goScoreDisplay=Math.round(score*Math.min(1,goScoreAnimTimer/90));
    }else{
      goScoreDisplay=score;
    }
    if(goScoreAnimTimer>=90 && !nameInputReady && !nameSubmitted){
      showNameInput();
    }
    if(nameInputReady && !nameSubmitted) nameCursorTimer+=dt;
  }

  if(fadeAlpha!==fadeTarget){
    const speed=0.06*dt;
    if(fadeTarget>fadeAlpha)fadeAlpha=Math.min(fadeAlpha+speed,fadeTarget);
    else fadeAlpha=Math.max(fadeAlpha-speed,fadeTarget);
    if(Math.abs(fadeAlpha-fadeTarget)<0.01){
      fadeAlpha=fadeTarget;
      if(fadeCallback){const cb=fadeCallback;fadeCallback=null;cb();}
    }
  }

  if(gs==='AIMING'||gs==='FIRING'){
    for(const b of blocks){
      if(!b.moveDir)continue;
      b.moveTimer-=dt;
      if(b.moveTimer<=0){
        b.moveDir*=-1;
        b.moveTimer=80+Math.random()*100;
      }
      b.moveOffset+=b.moveDir*0.3*dt;
      const minX=-(b.col*BW);
      const maxX=W-BW-b.col*BW;
      if(b.moveOffset<minX){b.moveOffset=minX;b.moveDir=1;}
      if(b.moveOffset>maxX){b.moveOffset=maxX;b.moveDir=-1;}
    }
  }

  for(const b of blocks){
    if(b.flashTimer>0)b.flashTimer-=dt;
    if(b.dyingTimer>0)b.dyingTimer-=dt;
  }

  if(gs!=='FIRING')return;

  for(let i=queue.length-1;i>=0;i--){
    queue[i].delay-=dt;
    if(queue[i].delay<=0){
      const entry=queue.splice(i,1)[0];
      const{angle,fireball:fb,crit:bc}=entry;
      balls.push({
        x:CX,y:CY-16,
        vx:Math.cos(angle)*BSPD,vy:Math.sin(angle)*BSPD,
        alive:true,hs:new Set(),trail:[],fireball:!!fb,
        crit:!!entry.crit, critUsed:false
      });
    }
  }

  const destroyedThisFrame=new Set();
  let bombQueue=[];

  for(const ball of balls){
    if(!ball.alive)continue;
    ball.hs.clear();

    ball.trail.push({x:ball.x,y:ball.y});
    if(ball.trail.length>8)ball.trail.shift();

    ball.x+=ball.vx*dt;ball.y+=ball.vy*dt;

    if(ball.x-BR<0){ball.x=BR;ball.vx=Math.abs(ball.vx);pSpark(0,ball.y);Audio_.play('wall');vibrate(10);}
    if(ball.x+BR>W){ball.x=W-BR;ball.vx=-Math.abs(ball.vx);pSpark(W,ball.y);Audio_.play('wall');vibrate(10);}
    if(ball.y-BR<0){ball.y=BR;ball.vy=Math.abs(ball.vy);pSpark(ball.x,0);Audio_.play('wall');vibrate(10);}
    if(ball.y-BR>H){ball.alive=false;continue;}

    for(let j=0;j<blocks.length;j++){
      const blk=blocks[j];
      if(destroyedThisFrame.has(blk.id))continue;
      if(blk.dyingTimer>0)continue;
      if(ball.hs.has(blk.id))continue;
      if(!collide(ball,blk))continue;

      ball.hs.add(blk.id);

      if(ball.crit && !ball.critUsed) {
        ball.critUsed = true;
        const rr=bRect(blk);
        const critDmg = Math.max(5, Math.ceil(blk.mhp * 0.6));
        blk.hp -= critDmg;
        blk.flashTimer = 12;
        comboCount++; comboTimer=45;
        if(comboCount>comboMax)comboMax=comboCount;
        const basePts=Math.round((10+Math.min(comboCount,15)*2)*turn*scoreMultiplier*3);
        score+=basePts;
        totalDestroyed++;
        screenFlash=0.45; screenFlashColor='#ff4500';
        shk(18,20);
        vibrate([20,10,50]);
        Audio_.play('destroyed');
        pBlast(rr.x+rr.w/2,rr.y+rr.h/2,'#ff4500');
        pScorePopup(rr.x+rr.w/2,rr.y+rr.h/2-15,basePts);
        parts.push({x:rr.x+rr.w/2,y:rr.y+rr.h/2-28,vx:0,vy:-2.5,
          life:55,max:55,sz:0,color:'#ff4500',rot:0,rs:0,g:0,t:'text',text:'CRIT!',fs:22});
        if(blk.hp<=0){ blk.dyingTimer=12; }
        continue;
      }

      let dmg=1;
      if(ball.fireball && blk.type!=='armored') dmg=2;

      blk.hp-=dmg;
      blk.flashTimer=6;

      comboCount++;
      comboTimer=45;
      if(comboCount>comboMax)comboMax=comboCount;
      scoreMultiplier=1+Math.floor(comboCount/4)*0.5;

      if(blk.hp<=0){
        blk.dyingTimer=12;
        const rr=bRect(blk);
        const basePts=Math.round((10+Math.min(comboCount,15)*2)*turn*scoreMultiplier);
        pBlast(rr.x+rr.w/2,rr.y+rr.h/2,blk.color);
        pScorePopup(rr.x+rr.w/2,rr.y+rr.h/2-15,basePts);
        shk(9,9);
        score+=basePts;
        totalDestroyed++;
        Audio_.play('break');
        vibrate(30);
        if(comboCount>=4&&comboCount%4===0){
          pCombo(rr.x+rr.w/2,rr.y+rr.h/2-35,comboCount,scoreMultiplier);
          vibrate(20);
        }
        if(comboCount>=8&&comboCount%4===0){
          screenFlash=0.3;screenFlashColor=comboCount>=16?'#ff4500':'#ffdd59';
          vibrate([20,10,30]);
        }

        if(blk.type==='power'&&blk.powerType){
          activatePower(blk.powerType);
          pPowerUp(rr.x+rr.w/2,rr.y+rr.h/2,blk.color);
        }

        if(blk.type==='bomb'&&!bombQueue.find(b=>b.id===blk.id)){
          bombQueue.push({id:blk.id,x:rr.x+rr.w/2,y:rr.y+rr.h/2});
        }
      }else{
        if(blk.type==='armored')Audio_.play('armored');
        else Audio_.play('hit');
        vibrate(15);
      }
    }
  }

  blocks=blocks.filter(b=>!destroyedThisFrame.has(b.id)&&b.dyingTimer<=0);
  if(score>hiScore){hiScore=score;saveHi(hiScore);}

  if(!newBestShown && newBestOld > 0 && score > newBestOld){
    newBestShown = true;
    screenFlash = 0.4; screenFlashColor = '#ffdd59';
    shk(12, 15);
    Audio_.play('levelup');
    vibrate([30,15,50,15,70,15,100]);
    parts.push({x:W/2,y:H/2-60,vx:0,vy:-0.8,life:120,max:120,sz:0,
      color:'#ffdd59',rot:0,rs:0,g:0,t:'text',text:lang.newBest,fs:28});
    CG.happyTime();
  }

  var currentMilestone = Math.floor(score / 1000000);
  if(currentMilestone > lastMilestone){
    lastMilestone = currentMilestone;
    var mColor = milestoneColors[(currentMilestone-1) % milestoneColors.length];
    screenFlash = 0.6; screenFlashColor = mColor;
    shk(22, 25);
    Audio_.play('milestone');
    vibrate([40,20,60,20,80]);
    parts.push({x:W/2,y:H/2-20,vx:0,vy:-1.2,life:150,max:150,sz:0,
      color:mColor,rot:0,rs:0,g:0,t:'text',text:currentMilestone+'M!',fs:38});
    for(var mi=0;mi<20;mi++){
      var ma=(Math.PI*2/20)*mi,msp=3+Math.random()*7;
      parts.push({x:W/2,y:H/2,vx:Math.cos(ma)*msp,vy:Math.sin(ma)*msp-2,
        life:80,max:80,sz:3+Math.random()*4,color:mColor,rot:0,rs:.3,g:.08,t:'sq'});
    }
    CG.happyTime();
  }

  if(bombQueue.length>0){
    const allDead=new Set();
    for(const bomb of bombQueue){
      if(allDead.has(bomb.id))continue;
      const dead=processBombDestruction(bomb.id,bomb.x,bomb.y);
      dead.forEach(id=>allDead.add(id));
      blocks=blocks.filter(b=>!dead.has(b.id));
    }
    if(score>hiScore){hiScore=score;saveHi(hiScore);}
  }

  balls=balls.filter(b=>b.alive);
  if(balls.length===0&&queue.length===0)endTurn();
}

// Exponer todas las variables y funciones globalmente
window.C = C;
window.ctx = ctx;
window.W = W;
window.H = H;
window.UI = UI;
window.getPauseLayout = getPauseLayout;
window.getGOLayout = getGOLayout;
window.menuPlayBtn = menuPlayBtn;
window.COLS = COLS;
window.BW = BW;
window.BH = BH;
window.GTOP = GTOP;
window.MAX_ROW = MAX_ROW;
window.GOLY = GOLY;
window.CX = CX;
window.CY = CY;
window.BR = BR;
window.BSPD = BSPD;
window.LDLY = LDLY;
window.NEONS = NEONS;
window.POWER_COLORS = POWER_COLORS;
window.POWER_TYPES = POWER_TYPES;
window.nid = nid;
window.fmtNum = fmtNum;
window.gs = gs;
window.blocks = blocks;
window.balls = balls;
window.parts = parts;
window.queue = queue;
window.turn = turn;
window.score = score;
window.ballCount = ballCount;
window.mx = mx;
window.my = my;
window.si = si;
window.st = st;
window.sx = sx;
window.sy = sy;
window.hiScore = hiScore;
window.survivalStreak = survivalStreak;
window.activePower = activePower;
window.powerUpBlock = powerUpBlock;
window.freezeTurns = freezeTurns;
window.fireballTurns = fireballTurns;
window.multiShotTurns = multiShotTurns;
window.comboCount = comboCount;
window.comboTimer = comboTimer;
window.comboMax = comboMax;
window.totalDestroyed = totalDestroyed;
window.scoreMultiplier = scoreMultiplier;
window.fadeAlpha = fadeAlpha;
window.fadeTarget = fadeTarget;
window.fadeCallback = fadeCallback;
window.continueUsed = continueUsed;
window.screenFlash = screenFlash;
window.screenFlashColor = screenFlashColor;
window.waveWarningTimer = waveWarningTimer;
window.pausedState = pausedState;
window.rowSlide = rowSlide;
window.newBestShown = newBestShown;
window.newBestOld = newBestOld;
window.hiResetTimer = hiResetTimer;
window.lastMilestone = lastMilestone;
window.goScoreDisplay = goScoreDisplay;
window.goScoreAnimTimer = goScoreAnimTimer;
window.milestoneColors = milestoneColors;
window.hiResetConfirm = hiResetConfirm;
window.resetGame = resetGame;
window.reset = reset;
window.fadeIn = fadeIn;
window.fadeOut = fadeOut;
window.mkRow = mkRow;
window.bRect = bRect;
window.shk = shk;
window.updShk = updShk;
window.pBlast = pBlast;
window.pSpark = pSpark;
window.pMuzzle = pMuzzle;
window.pLvlUp = pLvlUp;
window.pPowerUp = pPowerUp;
window.pCombo = pCombo;
window.pScorePopup = pScorePopup;
window.pBombExplode = pBombExplode;
window.pWaveWarning = pWaveWarning;
window.updParts = updParts;
window.drawParts = drawParts;
window.collide = collide;
window.activatePower = activatePower;
window.processBombDestruction = processBombDestruction;
window.canShoot = canShoot;
window.fire = fire;
window.endTurn = endTurn;
window.togglePause = togglePause;
window.resumeFromPause = resumeFromPause;
window.update = update;

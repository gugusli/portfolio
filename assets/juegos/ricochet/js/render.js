// js/render.js
// Funciones de renderizado: drawBG, drawBlocks, drawBalls, drawHUD, drawMenu, etc.
// Extraído del HTML original

let gridCanvas;
let cachedGradDanger, cachedGradFreeze, cachedGradSep, cachedGradBot;

function buildGridCanvas(){
  gridCanvas=document.createElement('canvas');
  gridCanvas.width=W; gridCanvas.height=H;
  const gc=gridCanvas.getContext('2d');
  for(let y=0;y<H;y+=4){gc.fillStyle='rgba(0,0,0,0.08)';gc.fillRect(0,y,W,1);}
  gc.strokeStyle='rgba(255,255,255,0.03)';gc.lineWidth=1;
  for(let c=0;c<=COLS;c++){gc.beginPath();gc.moveTo(c*BW,GTOP);gc.lineTo(c*BW,GOLY);gc.stroke();}
  for(let r=0;r<=MAX_ROW;r++){gc.beginPath();gc.moveTo(0,GTOP+r*BH);gc.lineTo(W,GTOP+r*BH);gc.stroke();}
  cachedGradDanger=ctx.createLinearGradient(0,GOLY-30,0,GOLY+50);
  cachedGradDanger.addColorStop(0,'rgba(255,30,30,0)');cachedGradDanger.addColorStop(.5,'rgba(255,30,30,0.05)');cachedGradDanger.addColorStop(1,'rgba(255,30,30,0)');
  cachedGradFreeze=ctx.createLinearGradient(0,GOLY-30,0,GOLY+50);
  cachedGradFreeze.addColorStop(0,'rgba(135,206,235,0)');cachedGradFreeze.addColorStop(.5,'rgba(135,206,235,0.05)');cachedGradFreeze.addColorStop(1,'rgba(135,206,235,0)');
  cachedGradSep=ctx.createLinearGradient(0,GTOP-6,0,GTOP-5);
  cachedGradSep.addColorStop(0,'rgba(30,144,255,0.3)');cachedGradSep.addColorStop(0.5,'rgba(30,144,255,0.08)');cachedGradSep.addColorStop(1,'rgba(30,144,255,0)');
  cachedGradBot=ctx.createLinearGradient(0,H-6,0,H);
  cachedGradBot.addColorStop(0,'rgba(30,144,255,0)');cachedGradBot.addColorStop(1,'rgba(30,144,255,0.06)');
}

function drawBG(){
  ctx.fillStyle='#070b12';ctx.fillRect(0,0,W,H);
  ctx.drawImage(gridCanvas,0,0);
  if(freezeTurns>0){ctx.fillStyle='rgba(135,206,235,0.03)';ctx.fillRect(0,GTOP,W,GOLY-GTOP);}
  ctx.save();
  ctx.strokeStyle=freezeTurns>0?'rgba(135,206,235,0.5)':'rgba(255,60,60,0.4)';
  ctx.lineWidth=1.5;ctx.setLineDash([10,6]);
  ctx.beginPath();ctx.moveTo(0,GOLY);ctx.lineTo(W,GOLY);ctx.stroke();
  ctx.setLineDash([]);ctx.restore();
  ctx.fillStyle=freezeTurns>0?cachedGradFreeze:cachedGradDanger;ctx.fillRect(0,GOLY-30,W,80);
}

function drawBlocks(now){
  const pad=3;
  ctx.shadowBlur=0;
  for(const b of blocks){
    const r=bRect(b);
    const ratio=b.hp/b.mhp;
    let dScale=1, dAlpha=1;
    if(b.dyingTimer>0){
      const t=b.dyingTimer/12;
      dScale=0.4+t*0.6; dAlpha=t;
    }
    if(dScale<1){
      const dw=r.w*(1-dScale)/2, dh=r.h*(1-dScale)/2;
      r.x+=dw; r.y+=dh; r.w-=dw*2; r.h-=dh*2;
    }
    const flash=b.flashTimer>0?b.flashTimer/8:0;
    const bw=b.type==='power'?3:b.type==='bomb'?3:b.type==='armored'?2.5:1.5;
    ctx.globalAlpha=dAlpha*(.1+ratio*.2+flash*0.4);
    ctx.fillStyle=b.flashTimer>0?'#ffffff':b.color;
    ctx.fillRect(r.x+pad,r.y+pad,r.w-pad*2,r.h-pad*2);
    ctx.globalAlpha=dAlpha;
    if(b.type==='armored'){
      ctx.strokeStyle='#8899aa';ctx.lineWidth=2;
      ctx.strokeRect(r.x+pad,r.y+pad,r.w-pad*2,r.h-pad*2);
      ctx.strokeStyle='#ddeeff';ctx.lineWidth=1;
      ctx.strokeRect(r.x+pad+2,r.y+pad+2,r.w-pad*2-4,r.h-pad*2-4);
    }else if(b.type==='bomb'){
      ctx.strokeStyle='#ff4500';ctx.lineWidth=3;
      ctx.strokeRect(r.x+pad,r.y+pad,r.w-pad*2,r.h-pad*2);
    }else{
      ctx.strokeStyle=b.color;ctx.lineWidth=bw;
      ctx.strokeRect(r.x+pad,r.y+pad,r.w-pad*2,r.h-pad*2);
    }
    ctx.globalAlpha=dAlpha*0.15*ratio;
    ctx.strokeStyle='#ffffff';ctx.lineWidth=1;
    ctx.beginPath();ctx.moveTo(r.x+pad,r.y+pad+1);ctx.lineTo(r.x+r.w-pad,r.y+pad+1);ctx.stroke();
    ctx.globalAlpha=1;
    if(b.moveDir){
      ctx.globalAlpha=0.3*dAlpha;
      ctx.font='10px Courier New,monospace';ctx.fillStyle='#ffffff';
      ctx.fillText(b.moveDir>0?'>':'<',r.x+8,r.y+8);
      ctx.globalAlpha=1;
    }
  }

  ctx.shadowBlur=0;
  ctx.textAlign='center';ctx.textBaseline='middle';
  for(const b of blocks){
    if(b.dyingTimer>=12)continue;
    const r=bRect(b);
    let dScale=1;
    if(b.dyingTimer>0) dScale=0.4+(b.dyingTimer/12)*0.6;
    if(dScale<1){
      const dw=r.w*(1-dScale)/2, dh=r.h*(1-dScale)/2;
      r.x+=dw; r.y+=dh; r.w-=dw*2; r.h-=dh*2;
    }
    const cx=r.x+r.w/2, cy_=r.y+r.h/2;
    ctx.globalAlpha=b.dyingTimer>0?b.dyingTimer/12:1;
    if(b.type==='power'){
      ctx.font='bold 11px Courier New,monospace';ctx.fillStyle='#fff';
      ctx.fillText(b.powerType==='fireball'?'FB':b.powerType==='multi'?'x2':'*',cx,cy_);
    }else if(b.type==='bomb'){
      ctx.font='bold 18px Courier New,monospace';ctx.fillStyle='#ff4500';
      ctx.fillText('*',cx,cy_);
    }else if(b.type==='armored'){
      const fs=b.hp>=100?10:b.hp>=10?14:18;
      ctx.font=`bold ${fs}px 'Courier New',monospace`;ctx.fillStyle='#ddeeff';
      ctx.fillText(b.hp,cx,cy_);
    }else{
      const fs=b.hp>=100?12:b.hp>=10?16:20;
      ctx.font=`bold ${fs}px 'Courier New',monospace`;ctx.fillStyle=b.color;
      ctx.fillText(b.hp,cx,cy_);
    }
    ctx.globalAlpha=1;
  }
}

function drawBalls(){
  const skin = getActiveSkin();
  for(const b of balls){
    const trailColor = b.crit && !b.critUsed ? '#ff4500' : (b.fireball ? '#ff6600' : skin.trail);
    const ballColor  = b.crit && !b.critUsed ? '#ff6600' : (b.fireball ? '#ffaa00' : skin.color);
    const glowColor  = b.crit && !b.critUsed ? '#ff2200' : (b.fireball ? '#ff4500' : skin.glow);

    for(let i=0;i<b.trail.length;i++){
      const a=(i/b.trail.length)*0.35;
      const sz=BR*(i/b.trail.length)*.7;
      ctx.globalAlpha=a;
      ctx.fillStyle=trailColor;
      ctx.beginPath();ctx.arc(b.trail[i].x,b.trail[i].y,sz,0,Math.PI*2);ctx.fill();
    }
    ctx.globalAlpha=1;
    if(b.fireball){
      ctx.shadowBlur=22;ctx.shadowColor='#ff4500';
      ctx.beginPath();ctx.arc(b.x,b.y,BR+2,0,Math.PI*2);
      ctx.fillStyle='#ff6600';ctx.fill();
    }
    ctx.shadowBlur=16;ctx.shadowColor=glowColor;
    ctx.beginPath();ctx.arc(b.x,b.y,BR,0,Math.PI*2);
    ctx.fillStyle=ballColor;ctx.fill();
    ctx.shadowBlur=0;
  }
  ctx.globalAlpha=1;
}

function drawCannon(now){
  ctx.save();ctx.translate(CX,CY);
  const a=(gs==='AIMING'&&canShoot())?Math.atan2(my-CY,mx-CX):-Math.PI/2;
  var cannonGlowPulse = 0.4 + Math.sin(now*0.003)*0.2;
  ctx.shadowBlur=30*cannonGlowPulse;
  if(fireballTurns>0)ctx.shadowColor='#ff4500';
  else if(freezeTurns>0)ctx.shadowColor='#87ceeb';
  else ctx.shadowColor='#3366ff';
  ctx.beginPath();ctx.arc(0,0,20,0,Math.PI*2);
  ctx.fillStyle='#0c1828';ctx.fill();
  const rc=fireballTurns>0?'#ff4500':freezeTurns>0?'#87ceeb':'#2255cc';
  ctx.strokeStyle=rc;ctx.lineWidth=2;ctx.stroke();
  ctx.beginPath();ctx.arc(0,0,6,0,Math.PI*2);
  const dc=fireballTurns>0?'#ff4500':freezeTurns>0?'#87ceeb':'#3366ff';
  ctx.fillStyle=dc;ctx.fill();
  ctx.rotate(a+Math.PI/2);
  const barrelColor=fireballTurns>0?'#441100':freezeTurns>0?'#0a2a3a':'#152040';
  ctx.fillStyle=barrelColor;ctx.fillRect(-5,-27,10,22);
  const barrelBorder=fireballTurns>0?'#ff4500':freezeTurns>0?'#87ceeb':'#4477ff';
  ctx.strokeStyle=barrelBorder;ctx.lineWidth=1.5;ctx.strokeRect(-5,-27,10,22);
  ctx.beginPath();ctx.arc(0,-27,4,0,Math.PI*2);ctx.fillStyle=barrelBorder;ctx.fill();
  ctx.shadowBlur=0;ctx.restore();

  ctx.font=`bold 15px 'Courier New',monospace`;
  ctx.textAlign='center';ctx.textBaseline='middle';
  ctx.fillStyle='#2ed573';
  ctx.shadowBlur=12;ctx.shadowColor='#2ed573';
  ctx.fillText(`x${ballCount}`,CX,CY+32);
  ctx.shadowBlur=0;
}

function drawAim(now){
  if(gs!=='AIMING'||!canShoot())return;
  const a=Math.atan2(my-CY,mx-CX);
  let n=ballCount,spread=Math.min((n-1)*.028,.16);
  if(n>7)n=7;
  var glowPulse=0.5+Math.sin(now*0.006)*0.3;
  for(let b=0;b<n;b++){
    const t=n===1?0:(b/(n-1))-.5;
    const fa=a+t*spread*2;
    let fdx=Math.cos(fa),fdy=Math.sin(fa);
    let px=CX,py=CY-16;
    const color=fireballTurns>0?'#ff6600':n===1?'#ffffff':'#aaccff';
    const baseA=n===1?.55:.3;
    let step=0,maxSteps=36,bounces=0;
    var hitFound=false;
    while(step<maxSteps&&bounces<3){
      const nx=px+fdx*16,ny=py+fdy*16;
      step++;
      if(nx<0){px=0;fdx=Math.abs(fdx);py+=fdy*(0-px)/Math.abs(fdx||.001);bounces++;continue;}
      if(nx>W){px=W;fdx=-Math.abs(fdx);py+=fdy*(W-px)/Math.abs(fdx||.001);bounces++;continue;}
      if(ny<0){py=0;fdy=Math.abs(fdy);px+=fdx*(0-py)/Math.abs(fdy||.001);bounces++;continue;}
      px=nx;py=ny;
      if(py>H||py<0)break;
      if(!hitFound){
        for(let bi=0;bi<blocks.length;bi++){
          const br=bRect(blocks[bi]);
          if(px>=br.x&&px<=br.x+br.w&&py>=br.y&&py<=br.y+br.h){
            hitFound=true;
            ctx.globalAlpha=glowPulse;
            ctx.shadowBlur=10;ctx.shadowColor=color;
            ctx.beginPath();ctx.arc(px,py,4,0,Math.PI*2);
            ctx.fillStyle=color;ctx.fill();
            ctx.shadowBlur=0;
            ctx.globalAlpha=1;
            break;
          }
        }
      }
      const alpha=(1-step/maxSteps)*baseA;
      const dotAlpha = bounces>0 ? alpha*0.4 : alpha;
      ctx.globalAlpha=dotAlpha;
      ctx.beginPath();ctx.arc(px,py,bounces>0?1:1.5,0,Math.PI*2);
      ctx.fillStyle=color;ctx.fill();
    }
  }
  ctx.globalAlpha=1;
}

function drawCursor(){
  if(gs==='MENU'||gs==='PAUSED')return;
  if(mx>0&&my>0&&my<H&&mx<W){
    const isOverButton=
      (gs==='AIMING'&&((mx>UI.pauseBtn.x&&mx<UI.pauseBtn.x+UI.pauseBtn.s&&my<UI.pauseBtn.y+UI.pauseBtn.s)||
                        (mx>UI.muteBtn.x&&mx<UI.muteBtn.x+UI.muteBtn.s&&my<UI.muteBtn.y+UI.muteBtn.s)))||
      (gs==='GAMEOVER');
    if(!isOverButton){
      ctx.save();
      ctx.strokeStyle='rgba(255,255,255,.7)';ctx.lineWidth=1.5;
      const cs=10;
      ctx.beginPath();
      ctx.moveTo(mx-cs,my);ctx.lineTo(mx-3,my);
      ctx.moveTo(mx+3,my);ctx.lineTo(mx+cs,my);
      ctx.moveTo(mx,my-cs);ctx.lineTo(mx,my-3);
      ctx.moveTo(mx,my+3);ctx.lineTo(mx,my+cs);
      ctx.stroke();
      ctx.beginPath();ctx.arc(mx,my,2,0,Math.PI*2);
      ctx.fillStyle='rgba(255,255,255,.5)';ctx.fill();
      ctx.restore();
    }
  }
}

function drawHUD(now){
  // FIX v2.1: Layout de 2 filas para evitar overlap botones-texto
  // Fila 1 (y=4 a y=48): pause button (left) | title centered | mute button (right)
  // Fila 2 (y=52 a y=84): score (left) | best (center) | turn+difficulty (right)
  ctx.fillStyle='#060a10';ctx.fillRect(0,0,W,GTOP-6);
  ctx.fillStyle=cachedGradSep;ctx.fillRect(0,GTOP-6,W,2);
  ctx.strokeStyle='rgba(255,255,255,.07)';ctx.lineWidth=1;
  ctx.beginPath();ctx.moveTo(0,GTOP-6);ctx.lineTo(W,GTOP-6);ctx.stroke();

  // ── Fila 1: Título centrado entre los botones (y=26, baseline alphabetic) ──
  const tx='RICOCHET ';
  ctx.font=`bold 16px 'Courier New',monospace`;
  ctx.textBaseline='alphabetic';ctx.textAlign='left';
  // Medir ancho total para centrar entre pauseBtn (x=48) y muteBtn (x=W-48)
  const tw1 = ctx.measureText(tx).width;
  const tw2 = ctx.measureText('BLITZ').width;
  const totalTitleW = tw1 + tw2;
  const titleX = (48 + (W-48)) / 2 - totalTitleW / 2;
  ctx.fillStyle='#ffffff';ctx.fillText(tx, titleX, 30);
  ctx.fillStyle='#1e90ff';ctx.shadowBlur=12;ctx.shadowColor='#1e90ff';
  ctx.fillText('BLITZ', titleX + tw1, 30);
  ctx.shadowBlur=0;

  // ── Fila 2: Score (left), Best (center), Turn+Difficulty (right) ──
  // Score - izquierda, después del pause button
  ctx.font=`bold 15px 'Courier New',monospace`;ctx.fillStyle='#ffffff';ctx.textAlign='left';
  ctx.fillText(fmtNum(score), 54, 72);
  // Label "SCORE" arriba del score
  ctx.font=`9px 'Courier New',monospace`;ctx.fillStyle='#445566';
  ctx.fillText(lang.score, 54, 58);

  // Best - centro
  ctx.font=`9px 'Courier New',monospace`;ctx.fillStyle='#445566';ctx.textAlign='center';
  ctx.fillText(lang.best, W/2, 58);
  ctx.font=`bold 14px 'Courier New',monospace`;ctx.fillStyle='#ffdd59';
  ctx.fillText(fmtNum(hiScore), W/2, 72);

  // Turn + Difficulty - derecha, antes del mute button
  // Difficulty label y level
  const lvl=Diff.level(turn);
  const lvlColors=['#2ed573','#ffa502','#ff6348','#ff4757','#ff0044','#ff0000'];
  ctx.font=`bold 11px 'Courier New',monospace`;
  ctx.fillStyle=lvlColors[Math.min(lvl-1,5)];ctx.textAlign='right';
  ctx.fillText(lang.difficulty+' '+lvl, W-54, 58);
  // Turn number (grande)
  ctx.font=`bold 14px 'Courier New',monospace`;ctx.fillStyle='#ffdd59';ctx.textAlign='right';
  ctx.fillText(turn, W-54, 72);
  // Turn label
  ctx.font=`9px 'Courier New',monospace`;ctx.fillStyle='#445566';ctx.textAlign='right';
  ctx.fillText(lang.turn, W-54-22, 72);
  // Level bar (debajo del difficulty, antes del mute button)
  ctx.fillStyle='rgba(255,255,255,0.08)';
  ctx.fillRect(W-86, 78, 32, 4);
  ctx.fillStyle=lvlColors[Math.min(lvl-1,5)];
  ctx.fillRect(W-86, 78, Math.min(32,lvl*5.3), 4);

  // ── Pause button (44x44, esquina superior izquierda) ──
  const pbx=UI.pauseBtn.x,pby=UI.pauseBtn.y,pbs=UI.pauseBtn.s;
  ctx.fillStyle='rgba(255,255,255,0.06)';ctx.fillRect(pbx,pby,pbs,pbs);
  ctx.strokeStyle='rgba(255,255,255,0.2)';ctx.lineWidth=1;ctx.strokeRect(pbx,pby,pbs,pbs);
  ctx.fillStyle='#aabbcc';
  const pIconSize = 16;
  ctx.fillRect(pbx + (pbs-pIconSize)/2, pby + (pbs-pIconSize)/2 + 2, 4, pIconSize-4);
  ctx.fillRect(pbx + (pbs-pIconSize)/2 + 6, pby + (pbs-pIconSize)/2 + 2, 4, pIconSize-4);

  // ── Mute button (44x44, esquina superior derecha) ──
  const mbx=UI.muteBtn.x,mby=UI.muteBtn.y,mbs=UI.muteBtn.s;
  ctx.fillStyle='rgba(255,255,255,0.06)';ctx.fillRect(mbx,mby,mbs,mbs);
  ctx.strokeStyle='rgba(255,255,255,0.15)';ctx.lineWidth=1;ctx.strokeRect(mbx,mby,mbs,mbs);
  ctx.font='bold 16px Courier New,monospace';ctx.fillStyle=Audio_.muted?'#ff6b81':'#8899aa';
  ctx.textAlign='center';ctx.textBaseline='middle';
  ctx.fillText(Audio_.muted?'\u2715':'\u266B',mbx+mbs/2,mby+mbs/2);

  if(scoreMultiplier>1){
    ctx.font=`bold 12px 'Courier New',monospace`;ctx.textAlign='left';
    ctx.fillStyle='#ffdd59';ctx.shadowBlur=8;ctx.shadowColor='#ffdd59';
    ctx.fillText(`x${scoreMultiplier.toFixed(1)}`,12,GTOP+12);
    ctx.shadowBlur=0;
  }

  if(powerUpBlock){
    const pLabel=powerUpBlock.type==='fireball'?lang.powerFireball:
                 powerUpBlock.type==='multi'?lang.powerMulti:lang.powerFreeze;
    const pColor=POWER_COLORS[powerUpBlock.type];
    ctx.font=`bold 13px 'Courier New',monospace`;ctx.textAlign='center';
    ctx.fillStyle=pColor;ctx.shadowBlur=10;ctx.shadowColor=pColor;
    ctx.fillText(pLabel+'!',W/2,GTOP+12);
    ctx.shadowBlur=0;
  }

  if(waveWarningTimer>0){
    const wa=Math.min(1,waveWarningTimer/30);
    var wScale=1+Math.sin(now*0.015)*0.06;
    ctx.save();
    ctx.translate(W/2,GTOP+32);ctx.scale(wScale,wScale);ctx.translate(-W/2,-(GTOP+32));
    ctx.globalAlpha=wa;
    ctx.font=`bold 18px 'Courier New',monospace`;ctx.textAlign='center';
    ctx.fillStyle='#ff4757';ctx.shadowBlur=15;ctx.shadowColor='#ff4757';
    ctx.fillText(lang.waveWarning,W/2,GTOP+32);
    ctx.shadowBlur=0;ctx.globalAlpha=1;
    ctx.restore();
  }

  if(gs==='FIRING'){
    ctx.font=`11px 'Courier New',monospace`;ctx.textAlign='center';
    ctx.fillStyle='rgba(255,255,255,.3)';
    ctx.shadowBlur=6;ctx.shadowColor='rgba(255,255,255,0.3)';
    ctx.fillText(lang.firing,W/2,H-18);
    ctx.shadowBlur=0;
  }else if(gs==='AIMING'&&canShoot()){
    ctx.font=`11px 'Courier New',monospace`;ctx.textAlign='center';
    ctx.fillStyle='rgba(255,255,255,.25)';
    ctx.shadowBlur=4;ctx.shadowColor='rgba(255,255,255,0.2)';
    ctx.fillText(lang.aiming,W/2,H-18);
    ctx.shadowBlur=0;
  }

  ctx.fillStyle=cachedGradBot;ctx.fillRect(0,H-6,W,6);

  if(freezeTurns>0){
    ctx.font=`bold 12px 'Courier New',monospace`;ctx.textAlign='left';
    ctx.fillStyle='#87ceeb';ctx.shadowBlur=8;ctx.shadowColor='#87ceeb';
    ctx.fillText(`FREEZE x${freezeTurns}`,dailyMode?80:10,H-18);
    ctx.shadowBlur=0;
  }

  if(gs==='AIMING'&&freezeTurns<=0&&Diff.doubleWave(turn+1)){
    ctx.font=`bold 11px 'Courier New',monospace`;ctx.textAlign='right';
    ctx.fillStyle='#ff6348';
    ctx.fillText('!! '+lang.waveWarning,W-12,H-18);
  }

  if(survivalStreak >= 5){
    const nextBonus = 10 - (survivalStreak % 10);
    const streakColor = survivalStreak >= 20 ? '#ff4500' : survivalStreak >= 10 ? '#ffa502' : '#ffdd59';
    ctx.font=`bold 11px 'Courier New',monospace`;ctx.textAlign='right';
    ctx.fillStyle=streakColor;
    ctx.fillText('\uD83D\uDD25'+survivalStreak,W-12,H-30);
    ctx.font=`9px 'Courier New',monospace`;ctx.fillStyle='rgba(255,165,2,0.5)';
    ctx.fillText('+'+nextBonus,W-12,H-20);
  }

  if(dailyMode){
    ctx.font=`bold 10px 'Courier New',monospace`;ctx.textAlign='left';
    ctx.fillStyle='#00d2d3';
    ctx.fillText('\uD83D\uDCC5 DAILY',10,H-30);
  }
}

function drawLeaderboard(now){
  ctx.fillStyle='#070b12';ctx.fillRect(0,0,W,H);
  const t=now*0.001;

  for(let i=0;i<15;i++){
    const px_=(W/2)+Math.cos(t*0.2+i*1.3)*(100+i*4);
    const py_=(H/2)+Math.sin(t*0.4+i*0.9)*(80+i*3);
    ctx.globalAlpha=Math.max(0,0.06+Math.sin(t*0.8+i)*0.04);
    ctx.fillStyle=NEONS[i%NEONS.length];
    ctx.beginPath();ctx.arc(px_,py_,2+Math.sin(t*1.5+i)*1,0,Math.PI*2);ctx.fill();
  }
  ctx.globalAlpha=1;

  // FIX v2.1: Panel más alto (530→570) y rowH más compacto (38→34) para evitar
  // que el botón VOLVER se superponga con la 10ª entrada del leaderboard
  const lpx=W/2-175, lpy=50, lpw=350, lph=600;
  ctx.fillStyle='rgba(8,14,28,0.95)';
  ctx.strokeStyle='rgba(255,221,89,0.25)';ctx.lineWidth=1.5;
  const cr=12;
  ctx.beginPath();
  ctx.moveTo(lpx+cr,lpy);ctx.lineTo(lpx+lpw-cr,lpy);ctx.arcTo(lpx+lpw,lpy,lpx+lpw,lpy+cr,cr);
  ctx.lineTo(lpx+lpw,lpy+lph-cr);ctx.arcTo(lpx+lpw,lpy+lph,lpx+lpw-cr,lpy+lph,cr);
  ctx.lineTo(lpx+cr,lpy+lph);ctx.arcTo(lpx,lpy+lph,lpx,lpy+lph-cr,cr);
  ctx.lineTo(lpx,lpy+cr);ctx.arcTo(lpx,lpy,lpx+cr,lpy,cr);ctx.closePath();
  ctx.fill();ctx.stroke();

  ctx.save();
  ctx.shadowBlur=20;ctx.shadowColor='#ffdd59';
  ctx.font=`bold 24px 'Courier New',monospace`;
  ctx.fillStyle='#ffdd59';ctx.textAlign='center';ctx.textBaseline='middle';
  ctx.fillText(lang.ranking,W/2,lpy+35);
  ctx.shadowBlur=0;
  ctx.restore();

  ctx.font='bold 28px Courier New,monospace';
  ctx.fillStyle='#ffa502';ctx.textAlign='center';
  ctx.fillText('\u2605',W/2,lpy+62);

  ctx.strokeStyle='rgba(255,221,89,0.15)';ctx.lineWidth=1;
  ctx.beginPath();ctx.moveTo(lpx+20,lpy+80);ctx.lineTo(lpx+lpw-20,lpy+80);ctx.stroke();

  const hdrY=lpy+100;
  ctx.font=`bold 10px 'Courier New',monospace`;
  ctx.fillStyle='#445566';ctx.textAlign='center';
  ctx.fillText('#',lpx+22,hdrY);
  ctx.fillText(lang.nameCol,lpx+95,hdrY);
  ctx.fillText(lang.score,lpx+195,hdrY);
  ctx.fillText(lang.turn,lpx+280,hdrY);
  ctx.fillText(lang.comboH,lpx+330,hdrY);

  ctx.strokeStyle='rgba(255,255,255,0.06)';ctx.lineWidth=1;
  ctx.beginPath();ctx.moveTo(lpx+15,hdrY+10);ctx.lineTo(lpx+lpw-15,hdrY+10);ctx.stroke();

  if(leaderboard.length===0){
    ctx.font=`14px 'Courier New',monospace`;
    ctx.fillStyle='#445566';ctx.textAlign='center';
    ctx.fillText(lang.noScores,W/2,lpy+220);
  }else{
    const rowH=34;
    for(let i=0;i<leaderboard.length;i++){
      const e=leaderboard[i];
      const ry=hdrY+28+i*rowH;
      const isNew=i===newLBIdx;

      if(isNew){
        ctx.fillStyle='rgba(255,221,89,0.06)';
        ctx.fillRect(lpx+10,ry-12,lpw-20,rowH-4);
      }

      const rankColors=['#ffdd59','#c0c0c0','#cd7f32'];
      ctx.font=`bold 16px 'Courier New',monospace`;
      ctx.fillStyle=i<3?rankColors[i]:'#556677';
      ctx.textAlign='center';
      ctx.fillText(i+1,lpx+22,ry+4);

      if(isNew){
        ctx.font=`bold 8px 'Courier New',monospace`;
        ctx.fillStyle='#ffdd59';
        ctx.fillText(lang.newTag,lpx+46,ry+4);
      }

      // Sanitizar nombre para canvas
      var displayName = window.Security.sanitizeForCanvas((e.name||'???').toUpperCase());
      if(displayName.length>10) displayName = displayName.slice(0,9)+'~';
      ctx.font=`bold 13px 'Courier New',monospace`;
      ctx.fillStyle=isNew?'#ffdd59':'#aabbcc';
      ctx.textAlign='center';
      ctx.fillText(displayName,lpx+100,ry+4);

      const scoreStr=fmtNum(e.score);
      if(i<3){
        ctx.shadowBlur=8;ctx.shadowColor=rankColors[i];
      }
      ctx.font=`bold 14px 'Courier New',monospace`;
      ctx.fillStyle=isNew?'#ffdd59':'#ffffff';
      ctx.textAlign='center';
      ctx.fillText(scoreStr,lpx+200,ry+4);
      ctx.shadowBlur=0;

      ctx.font=`12px 'Courier New',monospace`;
      ctx.fillStyle='#8899aa';
      ctx.fillText(e.turn||'-',lpx+280,ry+4);
      ctx.fillText('x'+(e.comboMax||0),lpx+330,ry+4);

      if(i<leaderboard.length-1){
        ctx.strokeStyle='rgba(255,255,255,0.03)';ctx.lineWidth=1;
        ctx.beginPath();ctx.moveTo(lpx+20,ry+18);ctx.lineTo(lpx+lpw-20,ry+18);ctx.stroke();
      }
    }
  }

  const bx=W/2-80, by=lpy+lph-55, bw=160, bh=40;
  const btnPulse=1+Math.sin(t*2.5)*0.02;
  ctx.save();
  ctx.translate(W/2,by+bh/2);ctx.scale(btnPulse,btnPulse);ctx.translate(-W/2,-(by+bh/2));
  ctx.shadowBlur=12;ctx.shadowColor='#1e90ff';
  ctx.fillStyle='#0c2860';ctx.fillRect(bx,by,bw,bh);
  ctx.strokeStyle='#1e90ff';ctx.lineWidth=1.5;ctx.strokeRect(bx,by,bw,bh);
  ctx.shadowBlur=0;
  ctx.font=`bold 15px 'Courier New',monospace`;ctx.fillStyle='#ffffff';
  ctx.textAlign='center';ctx.textBaseline='middle';
  ctx.fillText('\u2190 '+lang.back,W/2,by+bh/2+1);
  ctx.restore();

  ctx.font=`9px 'Courier New',monospace`;
  ctx.fillStyle='rgba(255,255,255,0.12)';ctx.textAlign='center';
  ctx.fillText(lang.version,W/2,H-10);
}

function drawMenu(now){
  ctx.fillStyle='#070b12';ctx.fillRect(0,0,W,H);
  const t=now*0.001;

  // Reduced motion: reducir partículas en menú
  const particleCount = (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) ? 10 : 30;
  for(let i=0;i<particleCount;i++){
    const px=(W/2)+Math.cos(t*0.3+i*1.1)*(80+i*5);
    const py=(H/2)+Math.sin(t*0.5+i*0.8)*(60+i*4);
    ctx.globalAlpha=Math.max(0,0.1+Math.sin(t+i)*0.08);
    ctx.fillStyle=NEONS[i%NEONS.length];
    ctx.beginPath();ctx.arc(px,py,2+Math.sin(t*2+i)*1.5,0,Math.PI*2);ctx.fill();
  }
  ctx.globalAlpha=1;

  ctx.save();
  var glowPulse = 0.3 + Math.sin(t*1.5)*0.15;
  ctx.globalAlpha = glowPulse;
  ctx.beginPath();
  ctx.arc(W/2, H*0.18+23, 100+Math.sin(t*2)*8, 0, Math.PI*2);
  var titleGrad = ctx.createRadialGradient(W/2,H*0.18+23,30,W/2,H*0.18+23,110);
  titleGrad.addColorStop(0,'rgba(30,144,255,0.15)');
  titleGrad.addColorStop(0.6,'rgba(30,144,255,0.05)');
  titleGrad.addColorStop(1,'rgba(30,144,255,0)');
  ctx.fillStyle=titleGrad;
  ctx.fill();
  ctx.globalAlpha=1;
  ctx.restore();

  ctx.save();
  const pulse=1+Math.sin(t*2)*0.02;
  ctx.translate(W/2,H*0.18);ctx.scale(pulse,pulse);
  ctx.shadowBlur=30;ctx.shadowColor='#1e90ff';
  ctx.font=`bold 40px 'Courier New',monospace`;
  ctx.fillStyle='#ffffff';ctx.textAlign='center';ctx.textBaseline='middle';
  ctx.fillText('RICOCHET',0,0);
  ctx.fillStyle='#1e90ff';ctx.shadowColor='#1e90ff';
  ctx.fillText('BLITZ',0,46);
  ctx.shadowBlur=0;ctx.restore();

  if(hiScore>0 || hiResetConfirm>0){
    var hiText = hiScore>0 ? `${lang.best}: ${fmtNum(hiScore)}` : `${lang.best}: 0`;
    ctx.font=`14px 'Courier New',monospace`;
    ctx.fillStyle='#ffdd59';ctx.textAlign='center';
    ctx.shadowBlur=8;ctx.shadowColor='#ffdd59';
    ctx.fillText(hiText,W/2,H*0.32);
    ctx.shadowBlur=0;

    if(playerName){
      ctx.font=`bold 12px 'Courier New',monospace`;
      ctx.fillStyle='#1e90ff';
      // Sanitizar para canvas
      ctx.fillText(window.Security.sanitizeForCanvas(playerName.toUpperCase()),W/2,H*0.355);
    }

    if(hiResetTimer>0){
      var progress = Math.min(hiResetTimer/180, 1);
      var progAngle = progress * Math.PI * 2;
      ctx.save();
      ctx.strokeStyle='#ffdd59';ctx.lineWidth=2;
      ctx.globalAlpha=0.6;
      ctx.beginPath();
      ctx.arc(W/2, H*0.32, 18, -Math.PI/2, -Math.PI/2+progAngle);
      ctx.stroke();
      ctx.globalAlpha=1;
      ctx.restore();
    }

    if(hiResetTimer>60){
      var hintAlpha = Math.min(1,(hiResetTimer-60)/60)*0.5;
      ctx.globalAlpha=hintAlpha;
      ctx.font=`9px 'Courier New',monospace`;
      ctx.fillStyle='#ffdd59';ctx.textAlign='center';
      ctx.fillText(lang.holdReset,W/2,H*0.32+16);
      ctx.globalAlpha=1;
    }
  }

  if(hiResetConfirm>0){
    var confirmAlpha = Math.min(1,hiResetConfirm/60);
    ctx.globalAlpha=confirmAlpha;
    ctx.font=`bold 12px 'Courier New',monospace`;
    ctx.fillStyle='#ff6b81';ctx.textAlign='center';
    ctx.shadowBlur=8;ctx.shadowColor='#ff6b81';
    ctx.fillText('RESET!',W/2,H*0.32+16);
    ctx.shadowBlur=0;
    ctx.globalAlpha=1;
  }

  const bx=menuPlayBtn.x,by=menuPlayBtn.y,bw=menuPlayBtn.w,bh=menuPlayBtn.h;
  const btnPulse=1+Math.sin(t*3)*0.03;
  ctx.save();
  ctx.translate(W/2,by+bh/2);ctx.scale(btnPulse,btnPulse);
  ctx.translate(-W/2,-(by+bh/2));
  var gradAngle=t*1.5;
  var gb1=Math.cos(gradAngle)*0.5+0.5;
  var gb2=Math.sin(gradAngle)*0.5+0.5;
  ctx.shadowBlur=20;ctx.shadowColor='#1e90ff';
  ctx.fillStyle='#0c2860';ctx.fillRect(bx,by,bw,bh);
  var borderR=Math.round(30+gb1*20);
  var borderG=Math.round(100+gb2*44);
  var borderB=255;
  ctx.strokeStyle=`rgb(${borderR},${borderG},${borderB})`;ctx.lineWidth=2;ctx.strokeRect(bx,by,bw,bh);
  ctx.shadowBlur=0;
  ctx.font=`bold 22px 'Courier New',monospace`;ctx.fillStyle='#ffffff';
  ctx.textAlign='center';ctx.textBaseline='middle';
  ctx.fillText(lang.play,W/2,by+bh/2+1);
  ctx.restore();

  ctx.font=`13px 'Courier New',monospace`;
  ctx.fillStyle='rgba(255,255,255,.45)';ctx.textAlign='center';
  ctx.fillText(lang.tutorial,W/2,H*0.48);

  // Selector de idioma (multi-idioma)
  ctx.font=`bold 11px 'Courier New',monospace`;
  ctx.fillStyle='rgba(255,255,255,.4)';
  ctx.fillText('[ '+currentLangCode.toUpperCase()+' ]',W/2,H*0.51);

  // TOP 10 leaderboard button (ahora 130x36)
  if(leaderboard.length>0){
    const lbBtn = UI.lbBtn;
    const lbx=W/2-lbBtn.w/2, lby=H*0.545, lbw=lbBtn.w, lbh=lbBtn.h;
    ctx.fillStyle='rgba(255,221,89,0.08)';
    ctx.fillRect(lbx,lby,lbw,lbh);
    ctx.strokeStyle='rgba(255,221,89,0.25)';ctx.lineWidth=1;
    ctx.strokeRect(lbx,lby,lbw,lbh);
    ctx.font=`bold 11px 'Courier New',monospace`;
    ctx.fillStyle='#ffdd59';ctx.textAlign='center';ctx.textBaseline='middle';
    ctx.fillText('\u2605 TOP 10',W/2,lby+lbh/2+1);
  }

  // Daily Challenge button (160x40 - cumple Apple HIG)
  const dailyBtn = UI.dailyBtn;
  const _btnBase=H*0.545+(leaderboard.length>0?UI.lbBtn.h+8:0);
  const dcx=W/2-dailyBtn.w/2, dcy=_btnBase, dcw=dailyBtn.w, dch=dailyBtn.h;
  const dailyDone = (loadDailyDate()===getDailyKey());
  ctx.fillStyle=dailyDone?'rgba(0,210,211,0.05)':'rgba(0,210,211,0.12)';
  ctx.fillRect(dcx,dcy,dcw,dch);
  ctx.strokeStyle=dailyDone?'rgba(0,210,211,0.2)':'rgba(0,210,211,0.6)';
  ctx.lineWidth=1; ctx.strokeRect(dcx,dcy,dcw,dch);
  ctx.font=`bold 12px 'Courier New',monospace`;
  ctx.fillStyle=dailyDone?'rgba(0,210,211,0.4)':'#00d2d3';
  ctx.textAlign='center';ctx.textBaseline='middle';
  ctx.fillText(dailyDone?'\uD83D\uDCC5 DAILY \u2713':'\uD83D\uDCC5 DAILY CHALLENGE',W/2,dcy+dch/2+1);
  if(dailyBest>0){
    ctx.font=`9px 'Courier New',monospace`;ctx.fillStyle='rgba(0,210,211,0.5)';
    ctx.fillText('BEST: '+fmtNum(dailyBest),W/2,dcy+dch+8);
  }

  // Skin cycle button (120x40 - cumple Apple HIG)
  const unlockedSkins = SKIN_ORDER.filter(n=>skinUnlocks[n]);
  const sk=getActiveSkin();
  const skinBtn = UI.skinBtn;
  const skx=W/2-skinBtn.w/2, sky=dcy+dch+14+(dailyBest>0?8:0), skw=skinBtn.w, skh=skinBtn.h;
  if(unlockedSkins.length>1){
    ctx.fillStyle='rgba(255,255,255,0.05)';ctx.fillRect(skx,sky,skw,skh);
    ctx.strokeStyle='rgba(255,255,255,0.2)';ctx.lineWidth=1;ctx.strokeRect(skx,sky,skw,skh);
    ctx.font=`bold 11px 'Courier New',monospace`;
    ctx.fillStyle=sk.glow; ctx.textAlign='center';ctx.textBaseline='middle';
    ctx.fillText('\u25CF '+sk.label,W/2,sky+skh/2+1);
  }

  const ly = unlockedSkins.length>1 ? sky+skh+10 : (dailyBest>0 ? dcy+dch+24 : dcy+dch+10);
  ctx.font=`bold 11px 'Courier New',monospace`;
  ctx.fillStyle='rgba(255,255,255,.3)';ctx.textAlign='center';
  ctx.fillText(lang.blockTypes,W/2,ly);

  // Leyenda en columna única centrada: cada fila se mide con measureText para
  // centrar swatch+texto. Evita el desborde de la layout de 2 columnas, que a
  // 13px no podia alojar los sufijos entre parentesis en DE/FR/PT/ES.
  ctx.font=`13px 'Courier New',monospace`;
  ctx.textAlign='left';
  ctx.textBaseline='middle';
  var legendItems=[
    [POWER_COLORS.fireball, lang.legendFB],
    [POWER_COLORS.multi,   lang.legendMulti],
    [POWER_COLORS.freeze,  lang.legendFreeze],
    ['#ff6348',            lang.legendBomb],
    ['#aabbcc',            lang.legendArmored],
  ];
  var LEG_SW=12, LEG_GAP=6, LEG_STEP=15;
  for(var li=0;li<legendItems.length;li++){
    var lcolor=legendItems[li][0], ltext=legendItems[li][1];
    var lyy=ly+18+li*LEG_STEP;
    var ltw=ctx.measureText(ltext).width;
    var lx=W/2-(LEG_SW+LEG_GAP+ltw)/2;
    ctx.fillStyle=lcolor;ctx.fillRect(lx,lyy-LEG_SW/2,LEG_SW,LEG_SW);
    ctx.strokeStyle='rgba(255,255,255,0.2)';ctx.lineWidth=1;ctx.strokeRect(lx,lyy-LEG_SW/2,LEG_SW,LEG_SW);
    ctx.fillStyle='rgba(255,255,255,.65)';ctx.fillText(ltext,lx+LEG_SW+LEG_GAP,lyy);
  }

  ctx.fillStyle='rgba(255,255,255,.4)';
  ctx.font=`12px 'Courier New',monospace`;ctx.textAlign='center';
  ctx.fillText(lang.legendDiff,W/2,ly+94);
  ctx.fillText(lang.legendDW,W/2,ly+108);

  // Reduced motion: omitir partículas decorativas inferiores
  if (!window.matchMedia || !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    for(let i=0;i<5;i++){
      const bpx=W*0.15+i*(W*0.7/4);
      const bpy=H*0.95+Math.sin(t*2+i*1.2)*8;
      ctx.globalAlpha=0.4;ctx.shadowBlur=12;ctx.shadowColor='#88ccff';
      ctx.beginPath();ctx.arc(bpx,bpy,4,0,Math.PI*2);ctx.fillStyle='#aadeff';ctx.fill();
      ctx.shadowBlur=0;
    }
    ctx.globalAlpha=1;
  }

  ctx.font=`10px 'Courier New',monospace`;
  ctx.fillStyle='rgba(255,255,255,.15)';ctx.textAlign='right';
  ctx.fillText(lang.version,W-8,H-8);
}

function drawPauseMenu(now){
  ctx.fillStyle='rgba(0,0,0,.75)';ctx.fillRect(0,0,W,H);
  var vigGrad=ctx.createRadialGradient(W/2,H/2,H*0.3,W/2,H/2,H*0.75);
  vigGrad.addColorStop(0,'rgba(0,0,0,0)');vigGrad.addColorStop(1,'rgba(0,0,0,0.4)');
  ctx.fillStyle=vigGrad;ctx.fillRect(0,0,W,H);

  const t=now*0.001;
  // Reduced motion
  if (!window.matchMedia || !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    ctx.globalAlpha=0.04;
    for(let i=0;i<8;i++){
      const yy=(H/2)+Math.sin(t*0.5+i)*120;
      ctx.strokeStyle='#1e90ff';ctx.lineWidth=1;
      ctx.beginPath();ctx.moveTo(0,yy);ctx.lineTo(W,yy);ctx.stroke();
    }
    ctx.globalAlpha=1;
  }

  const layout = getPauseLayout();
  const px=layout.panel.x, py=layout.panel.y, pw=layout.panel.w, ph=layout.panel.h;
  ctx.fillStyle='rgba(8,14,28,0.95)';
  ctx.strokeStyle='rgba(30,144,255,0.3)';ctx.lineWidth=1.5;
  ctx.beginPath();
  const cr=12;
  ctx.moveTo(px+cr,py);ctx.lineTo(px+pw-cr,py);ctx.arcTo(px+pw,py,px+pw,py+cr,cr);
  ctx.lineTo(px+pw,py+ph-cr);ctx.arcTo(px+pw,py+ph,px+pw-cr,py+ph,cr);
  ctx.lineTo(px+cr,py+ph);ctx.arcTo(px,py+ph,px,py+ph-cr,cr);
  ctx.lineTo(px,py+cr);ctx.arcTo(px,py,px+cr,py,cr);ctx.closePath();
  ctx.fill();ctx.stroke();

  ctx.save();
  ctx.shadowBlur=20;ctx.shadowColor='#1e90ff';
  ctx.font=`bold 28px 'Courier New',monospace`;
  ctx.fillStyle='#1e90ff';ctx.textAlign='center';ctx.textBaseline='middle';
  ctx.fillText('||',W/2,py+45);
  ctx.shadowBlur=0;
  ctx.font=`bold 22px 'Courier New',monospace`;
  ctx.fillStyle='#ffffff';
  ctx.fillText(lang.paused,W/2,py+78);
  ctx.restore();

  ctx.strokeStyle='rgba(30,144,255,0.2)';ctx.lineWidth=1;
  ctx.beginPath();ctx.moveTo(px+24,py+100);ctx.lineTo(px+pw-24,py+100);ctx.stroke();

  ctx.font=`11px 'Courier New',monospace`;ctx.fillStyle='#667788';ctx.textAlign='center';
  ctx.fillText(lang.score,W/2,py+122);
  ctx.font=`bold 26px 'Courier New',monospace`;ctx.fillStyle='#ffdd59';
  ctx.shadowBlur=8;ctx.shadowColor='#ffdd59';
  ctx.fillText(fmtNum(score),W/2,py+150);
  ctx.shadowBlur=0;

  ctx.font=`12px 'Courier New',monospace`;ctx.fillStyle='#aabbcc';
  ctx.fillText(lang.turn+' '+turn+'  |  '+lang.difficulty+' '+Diff.level(turn),W/2,py+175);

  const r1=layout.resume, r2=layout.sound, r3=layout.restart, r4=layout.quit;

  const pulse1=1+Math.sin(t*2)*0.02;
  ctx.save();ctx.translate(W/2,r1.y+r1.h/2);ctx.scale(pulse1,pulse1);ctx.translate(-W/2,-(r1.y+r1.h/2));
  ctx.shadowBlur=14;ctx.shadowColor='#2ed573';
  ctx.fillStyle='#0a3020';ctx.fillRect(r1.x,r1.y,r1.w,r1.h);
  ctx.strokeStyle='#2ed573';ctx.lineWidth=1.5;ctx.strokeRect(r1.x,r1.y,r1.w,r1.h);
  ctx.shadowBlur=0;
  ctx.font=`bold 15px 'Courier New',monospace`;ctx.fillStyle='#2ed573';
  ctx.textAlign='center';ctx.textBaseline='middle';
  ctx.fillText('\u25B6 '+lang.resume,W/2,r1.y+r1.h/2+1);
  ctx.restore();

  ctx.fillStyle='rgba(255,255,255,0.05)';ctx.fillRect(r2.x,r2.y,r2.w,r2.h);
  ctx.strokeStyle='rgba(255,255,255,0.2)';ctx.lineWidth=1;ctx.strokeRect(r2.x,r2.y,r2.w,r2.h);
  ctx.font=`bold 14px 'Courier New',monospace`;
  ctx.fillStyle=Audio_.muted?'#ff6b81':'#8899aa';
  ctx.textAlign='center';ctx.textBaseline='middle';
  ctx.fillText(Audio_.muted?lang.muted+' \u2715':lang.sound+' \u266B',W/2,r2.y+r2.h/2+1);

  ctx.fillStyle='rgba(255,165,2,0.08)';ctx.fillRect(r3.x,r3.y,r3.w,r3.h);
  ctx.strokeStyle='#ffa502';ctx.lineWidth=1;ctx.strokeRect(r3.x,r3.y,r3.w,r3.h);
  ctx.font=`bold 14px 'Courier New',monospace`;ctx.fillStyle='#ffa502';
  ctx.textAlign='center';ctx.textBaseline='middle';
  ctx.fillText('\u21BB '+lang.restart,W/2,r3.y+r3.h/2+1);

  ctx.fillStyle='rgba(255,71,87,0.05)';ctx.fillRect(r4.x,r4.y,r4.w,r4.h);
  ctx.strokeStyle='rgba(255,71,87,0.4)';ctx.lineWidth=1;ctx.strokeRect(r4.x,r4.y,r4.w,r4.h);
  ctx.font=`bold 13px 'Courier New',monospace`;ctx.fillStyle='#8899aa';
  ctx.textAlign='center';ctx.textBaseline='middle';
  ctx.fillText(lang.quit,W/2,r4.y+r4.h/2+1);

  ctx.font=`9px 'Courier New',monospace`;ctx.fillStyle='rgba(255,255,255,0.25)';
  ctx.textAlign='right';ctx.textBaseline='middle';
  ctx.fillText('SPACE',r1.x+r1.w-6,r1.y+r1.h/2);
  ctx.fillText('R',r3.x+r3.w-6,r3.y+r3.h/2);
  ctx.fillText('ESC',r4.x+r4.w-6,r4.y+r4.h/2);

  ctx.font=`10px 'Courier New',monospace`;ctx.fillStyle='rgba(255,255,255,0.2)';
  ctx.textAlign='center';
  ctx.fillText('[ESC / P]',W/2,py+ph-15);
}

function drawGameOver(now){
  ctx.fillStyle='rgba(0,0,0,.88)';ctx.fillRect(0,0,W,H);
  var goGrad=ctx.createRadialGradient(W/2,H/2,H*0.2,W/2,H/2,H*0.7);
  goGrad.addColorStop(0,'rgba(0,0,0,0)');goGrad.addColorStop(1,'rgba(0,0,0,0.3)');
  ctx.fillStyle=goGrad;ctx.fillRect(0,0,W,H);

  var goT=now*0.001;
  if (!window.matchMedia || !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    for(var gri=0;gri<15;gri++){
      var grx=(gri*47+Math.sin(goT*0.7+gri)*30)%W;
      var gry=(goT*40+gri*80)%H;
      ctx.globalAlpha=0.15;
      ctx.fillStyle='#445566';
      ctx.fillRect(grx,gry,1,6);
    }
    ctx.globalAlpha=1;
  }

  const flicker=.85+Math.sin(now*0.01)*.15;
  ctx.save();ctx.shadowBlur=30;ctx.shadowColor='#ff4757';ctx.globalAlpha=flicker;
  ctx.font=`bold 38px 'Courier New',monospace`;
  ctx.fillStyle='#ff4757';ctx.textAlign='center';ctx.textBaseline='middle';
  ctx.fillText(lang.gameover,W/2,H/2-100);
  ctx.shadowBlur=0;ctx.globalAlpha=1;ctx.restore();

  ctx.strokeStyle='rgba(255,71,87,.4)';ctx.lineWidth=1;
  ctx.beginPath();ctx.moveTo(W/2-80,H/2-72);ctx.lineTo(W/2+80,H/2-72);ctx.stroke();

  ctx.font=`12px 'Courier New',monospace`;ctx.fillStyle='#667788';
  ctx.textAlign='center';ctx.textBaseline='middle';
  ctx.fillText(lang.score,W/2-90,H/2-48);
  ctx.fillText(lang.rounds,W/2,H/2-48);
  ctx.fillText('BEST COMBO',W/2+90,H/2-48);
  ctx.font=`bold 24px 'Courier New',monospace`;ctx.fillStyle='#ffffff';
  ctx.fillText(fmtNum(goScoreDisplay),W/2-90,H/2-22);
  ctx.fillText(turn,W/2,H/2-22);
  ctx.fillText('x'+comboMax,W/2+90,H/2-22);

  ctx.font=`10px 'Courier New',monospace`;ctx.fillStyle='#667788';
  ctx.textAlign='center';
  ctx.fillText(lang.destroyed+': '+totalDestroyed,W/2,H/2+6);

  if(!nameSubmitted){
    const nf = UI.nameInput;
    const nfx=W/2-nf.w/2, nfy=H/2+24, nfw=nf.w, nfh=nf.h;
    ctx.font=`bold 10px 'Courier New',monospace`;ctx.fillStyle='#445566';
    ctx.textAlign='center';ctx.textBaseline='middle';
    ctx.fillText(lang.enterName,W/2,nfy-8);
    ctx.fillStyle='rgba(255,255,255,0.04)';
    const nfcr=8;
    ctx.beginPath();
    ctx.moveTo(nfx+nfcr,nfy);ctx.lineTo(nfx+nfw-nfcr,nfy);ctx.arcTo(nfx+nfw,nfy,nfx+nfw,nfy+nfcr,nfcr);
    ctx.lineTo(nfx+nfw,nfy+nfh-nfcr);ctx.arcTo(nfx+nfw,nfy+nfh,nfx+nfw-nfcr,nfy+nfh,nfcr);
    ctx.lineTo(nfx+nfcr,nfy+nfh);ctx.arcTo(nfx,nfy+nfh,nfx,nfy+nfh-nfcr,nfcr);
    ctx.lineTo(nfx,nfy+nfcr);ctx.arcTo(nfx,nfy,nfx+nfcr,nfy,nfcr);ctx.closePath();
    ctx.fill();
    var nameBorderColor = nameInputActive ? 'rgba(30,144,255,0.6)' : 'rgba(255,255,255,0.15)';
    ctx.strokeStyle=nameBorderColor;ctx.lineWidth=1.5;ctx.stroke();
    ctx.font=`bold 14px 'Courier New',monospace`;
    if(playerName){
      ctx.fillStyle='#ffffff';
      // Sanitizar para canvas
      ctx.fillText(window.Security.sanitizeForCanvas(playerName),W/2,nfy+nfh/2+1);
      if(Math.floor(nameCursorTimer/30)%2===0){
        var tw=ctx.measureText(window.Security.sanitizeForCanvas(playerName)).width;
        ctx.fillStyle='#1e90ff';
        ctx.fillRect(W/2+tw/2+3,nfy+7,2,nfh-14);
      }
    }else{
      ctx.fillStyle='#334455';
      ctx.font=`12px 'Courier New',monospace`;
      ctx.fillText(lang.nameHint,W/2,nfy+nfh/2+1);
    }
    if(nameInputReady){
      ctx.font=`9px 'Courier New',monospace`;ctx.fillStyle='#335566';
      ctx.fillText('[ENTER] '+lang.saveLabel,W/2,nfy+nfh+12);
    }
  }else{
    ctx.font=`bold 11px 'Courier New',monospace`;ctx.fillStyle='#1e90ff';
    ctx.textAlign='center';ctx.textBaseline='middle';
    ctx.fillText(window.Security.sanitizeForCanvas((playerName||'???').toUpperCase()),W/2,H/2+28);
  }

  const isNewBest=score>=hiScore&&score>0;
  if(isNewBest){
    ctx.font=`bold 14px 'Courier New',monospace`;ctx.fillStyle='#ffdd59';
    ctx.shadowBlur=10;ctx.shadowColor='#ffdd59';
    ctx.fillText(lang.newBest,W/2,H/2+74);
    ctx.shadowBlur=0;
  }else if(hiScore>0){
    ctx.font=`12px 'Courier New',monospace`;ctx.fillStyle='#ffdd59';
    ctx.fillText(`${lang.best}: ${fmtNum(hiScore)}`,W/2,H/2+74);
  }

  const layout = getGOLayout();

  if(layout.adBtn){
    const ab=layout.adBtn;
    ctx.shadowBlur=12;ctx.shadowColor='#2ed573';
    ctx.fillStyle='#0a3020';ctx.fillRect(ab.x,ab.y,ab.w,ab.h);
    ctx.strokeStyle='#2ed573';ctx.lineWidth=1.5;ctx.strokeRect(ab.x,ab.y,ab.w,ab.h);
    ctx.shadowBlur=0;
    ctx.font=`bold 14px 'Courier New',monospace`;ctx.fillStyle='#2ed573';
    ctx.textAlign='center';ctx.textBaseline='middle';
    ctx.fillText(`[+] ${lang.watchAd}`,W/2,ab.y+ab.h/2+1);
  }

  const rb=layout.retryBtn;
  ctx.shadowBlur=14;ctx.shadowColor='#ff4757';
  ctx.fillStyle='#cc1f2e';ctx.fillRect(rb.x,rb.y,rb.w,rb.h);
  ctx.strokeStyle='#ff4757';ctx.lineWidth=1.5;ctx.strokeRect(rb.x,rb.y,rb.w,rb.h);
  ctx.shadowBlur=0;
  ctx.font=`bold 17px 'Courier New',monospace`;ctx.fillStyle='#ffffff';
  ctx.textAlign='center';ctx.textBaseline='middle';
  ctx.fillText(lang.retry,W/2,rb.y+rb.h/2+1);

  const hb=layout.homeBtn;
  ctx.fillStyle='rgba(255,255,255,0.06)';ctx.fillRect(hb.x,hb.y,hb.w,hb.h);
  ctx.strokeStyle='rgba(255,255,255,0.2)';ctx.lineWidth=1;ctx.strokeRect(hb.x,hb.y,hb.w,hb.h);
  ctx.font=`bold 13px 'Courier New',monospace`;ctx.fillStyle='#8899aa';
  ctx.textAlign='center';ctx.textBaseline='middle';
  ctx.fillText('MENU',W/2,hb.y+hb.h/2+1);
}

// ── Main Draw ────────────────────────────────────────────────
function draw(){
  ctx.clearRect(0,0,W,H);
  const now = Date.now();

  if(gs==='MENU'){
    drawMenu(now);
  }else if(gs==='LEADERBOARD'){
    drawLeaderboard(now);
  }else{
    ctx.save();ctx.translate(sx,sy);
    drawBG();drawBlocks(now);drawBalls();drawParts();drawAim(now);drawCannon(now);
    ctx.restore();
    drawHUD(now);
    if(gs==='PAUSED')drawPauseMenu(now);
    if(gs==='GAMEOVER')drawGameOver(now);
    drawCursor();
  }

  if(screenFlash>0.01){
    ctx.globalAlpha=screenFlash;
    ctx.fillStyle=screenFlashColor;
    ctx.fillRect(0,0,W,H);
    ctx.globalAlpha=1;
  }

  if(fadeAlpha>0.01){
    ctx.fillStyle=`rgba(0,0,0,${fadeAlpha})`;
    ctx.fillRect(0,0,W,H);
  }

  if(gs==='MENU'||gs==='PAUSED'||gs==='LEADERBOARD') { C.style.cursor='default'; }
  else if(gs==='GAMEOVER') { C.style.cursor='pointer'; }
  else { C.style.cursor='none'; }
}

// Exponer globalmente
window.buildGridCanvas = buildGridCanvas;
window.drawBG = drawBG;
window.drawBlocks = drawBlocks;
window.drawBalls = drawBalls;
window.drawCannon = drawCannon;
window.drawAim = drawAim;
window.drawCursor = drawCursor;
window.drawHUD = drawHUD;
window.drawLeaderboard = drawLeaderboard;
window.drawMenu = drawMenu;
window.drawPauseMenu = drawPauseMenu;
window.drawGameOver = drawGameOver;
window.draw = draw;

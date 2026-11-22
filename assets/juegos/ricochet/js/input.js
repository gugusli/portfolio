// js/input.js
// Manejo de input: mouse, touch, keyboard, name input
// Extraído del HTML original, adaptado para usar módulos

let touchHandled = false;
let adPending = false;   // evita requestAd('midgame'/'rewarded') encolado por click/tecla repetida

function showNameInput(){
  nameInputActive = true; nameInputReady = true;
  nameInputEl.value = playerName;
  const cr = C.getBoundingClientRect();
  const scx = W/cr.width, scy = H/cr.height;
  const nf = UI.nameInput;
  const fx = W/2-nf.w/2, fy = H/2+24, fw = nf.w, fh = nf.h;
  nameInputEl.style.left = (cr.left + fx*scx) + 'px';
  nameInputEl.style.top = (cr.top + fy*scy) + 'px';
  nameInputEl.style.width = (fw*scx) + 'px';
  nameInputEl.style.height = (fh*scy) + 'px';
  nameInputEl.style.opacity = '1';
  nameInputEl.style.zIndex = '10';
  nameInputEl.style.fontSize = (14*scy) + 'px';
  nameInputEl.focus();
}

function hideNameInput(){
  nameInputActive = false; nameInputReady = false;
  nameInputEl.style.left = '-9999px';
  nameInputEl.style.opacity = '0';
  nameInputEl.style.zIndex = '-1';
  nameInputEl.blur();
}

function handleTap(px,py){
  Audio_.resume();
  hiResetTimer = 0;

  if(gs==='MENU'){
    if(px>menuPlayBtn.x&&px<menuPlayBtn.x+menuPlayBtn.w&&py>menuPlayBtn.y&&py<menuPlayBtn.y+menuPlayBtn.h){
      Audio_.play('click');
      Audio_.stopBGM();
      fadeIn(()=>{
        resetGame();
        gs='AIMING';
        CG.gameplayStart();
        Audio_.playBGM('GAME');
      });
      return;
    }
    // Language toggle (cycle)
    if(py>H*0.495&&py<H*0.525&&px>W/2-50&&px<W/2+50){
      const langs = getAvailableLanguages();
      const curIdx = langs.findIndex(l => l.code === currentLangCode);
      const nextIdx = (curIdx + 1) % langs.length;
      setLanguage(langs[nextIdx].code);
      Audio_.play('click');
      return;
    }
    // TOP 10 leaderboard button
    if(leaderboard.length>0){
      const lbBtn = UI.lbBtn;
      const lbx=W/2-lbBtn.w/2, lby=H*0.545, lbw=lbBtn.w, lbh=lbBtn.h;
      if(px>lbx&&px<lbx+lbw&&py>lby&&py<lby+lbh){
        Audio_.play('click');
        newLBIdx=-1;
        gs='LEADERBOARD';
        return;
      }
    }

    // Daily Challenge button
    const dailyBtn = UI.dailyBtn;
    const _btnBase2=H*0.545+(leaderboard.length>0?UI.lbBtn.h+8:0);
    const dcx=W/2-dailyBtn.w/2, dcy=_btnBase2, dcw=dailyBtn.w, dch=dailyBtn.h;
    if(px>dcx&&px<dcx+dcw&&py>dcy&&py<dcy+dch){
      Audio_.play('click');
      Audio_.stopBGM();
      fadeIn(()=>{
        dailyMode = true;
        rng = SeededRandom(getDailySeed());
        resetGame();
        gs='AIMING';
        CG.gameplayStart();
        Audio_.playBGM('GAME');
      });
      return;
    }

    // Skin cycle button
    const skUnlocked = SKIN_ORDER.filter(n=>skinUnlocks[n]);
    if(skUnlocked.length>1){
      const skinBtn = UI.skinBtn;
      const skx=W/2-skinBtn.w/2, sky=dcy+dch+14+(dailyBest>0?8:0), skw=skinBtn.w, skh=skinBtn.h;
      if(px>skx&&px<skx+skw&&py>sky&&py<sky+skh){
        cycleSkin(); return;
      }
    }
    return;
  }

  if(gs==='LEADERBOARD'){
    // FIX v2.1: actualizar posiciones para coincidir con render.js (lpy=50, lph=600)
    const bx=W/2-80, by=50+600-55, bw=160, bh=40;
    if(px>bx&&px<bx+bw&&py>by&&py<by+bh){
      Audio_.play('click');
      gs='MENU';
      return;
    }
    return;
  }

  if(gs==='AIMING'){
    // Pause button (44x44)
    if(px>UI.pauseBtn.x&&px<UI.pauseBtn.x+UI.pauseBtn.s&&py>UI.pauseBtn.y&&py<UI.pauseBtn.y+UI.pauseBtn.s){
      togglePause();return;
    }
    // Mute button (44x44)
    if(px>UI.muteBtn.x&&px<UI.muteBtn.x+UI.muteBtn.s&&py>UI.muteBtn.y&&py<UI.muteBtn.y+UI.muteBtn.s){
      Audio_.toggleMute();Audio_.play('click');return;
    }
    fire();return;
  }

  if(gs==='FIRING'){
    if(px>UI.pauseBtn.x&&px<UI.pauseBtn.x+UI.pauseBtn.s&&py>UI.pauseBtn.y&&py<UI.pauseBtn.y+UI.pauseBtn.s){togglePause();return;}
    if(px>UI.muteBtn.x&&px<UI.muteBtn.x+UI.muteBtn.s&&py>UI.muteBtn.y&&py<UI.muteBtn.y+UI.muteBtn.s){Audio_.toggleMute();return;}
    return;
  }

  if(gs==='PAUSED'){
    const layout = getPauseLayout();

    const r1=layout.resume;
    if(px>r1.x&&px<r1.x+r1.w&&py>r1.y&&py<r1.y+r1.h){
      resumeFromPause();return;
    }
    const r2=layout.sound;
    if(px>r2.x&&px<r2.x+r2.w&&py>r2.y&&py<r2.y+r2.h){
      Audio_.toggleMute();Audio_.play('click');return;
    }
    const r3=layout.restart;
    if(px>r3.x&&px<r3.x+r3.w&&py>r3.y&&py<r3.y+r3.h){
      Audio_.play('click');
      Audio_.stopBGM();
      fadeIn(()=>{CG.gameplayStop();resetGame();gs='AIMING';CG.gameplayStart();Audio_.playBGM('GAME');});return;
    }
    const r4=layout.quit;
    if(px>r4.x&&px<r4.x+r4.w&&py>r4.y&&py<r4.y+r4.h){
      Audio_.play('click');
      Audio_.stopBGM();
      fadeIn(()=>{CG.gameplayStop();gs='MENU';Audio_.playBGM('MENU');});return;
    }
    return;
  }

  if(gs==='GAMEOVER'){
    if(!nameSubmitted){
      const nf = UI.nameInput;
      const nfx=W/2-nf.w/2, nfy=H/2+24, nfw=nf.w, nfh=nf.h;
      if(px>nfx&&px<nfx+nfw&&py>nfy-20&&py<nfy+nfh+20){
        showNameInput();
        return;
      }
    }
    const layout = getGOLayout();

    // Watch ad button (ahora usa rewardedBreak de CrazyGames)
    if(layout.adBtn){
      const ab=layout.adBtn;
      if(px>ab.x&&px<ab.x+ab.w&&py>ab.y&&py<ab.y+ab.h){
        if(adPending) return;
        if(!nameSubmitted) submitScore();
        Audio_.play('click');
        CG.gameplayStop();
        adPending = true;
        // Rewarded ad: el usuario DEBE verlo completo para recibir recompensa
        CG.rewardedBreak((success)=>{
          adPending = false;
          if(!success){
            // Ad falló o fue skipped: no dar recompensa
            window.ARIA?.announce('Ad not completed, no reward');
            return;
          }
          continueUsed=true;
          survivalStreak = 0;
          ballCount+=Math.max(3,Math.ceil(ballCount*0.75));
          Audio_.play('reward');
          Audio_.stopBGM();
          fadeIn(()=>{
            const minRow=blocks.reduce((m,b)=>Math.min(m,b.row),Infinity);
            blocks=blocks.filter(b=>b.row<=minRow+MAX_ROW-5);
            for(const b of blocks)if(b.row>0)b.row-=2;
            gs='AIMING';
            CG.gameplayStart();
            Audio_.playBGM('GAME');
          });
        });
        return;
      }
    }

    const rb=layout.retryBtn;
    if(px>rb.x&&px<rb.x+rb.w&&py>rb.y&&py<rb.y+rb.h){
      if(adPending) return;
      if(!nameSubmitted) submitScore();
      Audio_.play('click');
      Audio_.stopBGM();
      adPending = true;
      CG.commercialBreak(()=>{
        adPending = false;
        fadeIn(()=>{
          resetGame();
          gs='AIMING';
          CG.gameplayStart();
          Audio_.playBGM('GAME');
        });
      });
      return;
    }

    const hb=layout.homeBtn;
    if(px>hb.x&&px<hb.x+hb.w&&py>hb.y&&py<hb.y+hb.h){
      if(adPending) return;
      if(!nameSubmitted) submitScore();
      Audio_.play('click');
      Audio_.stopBGM();
      adPending = true;
      CG.commercialBreak(()=>{
        adPending = false;
        fadeIn(()=>{gs='MENU';Audio_.playBGM('MENU');});
      });
      return;
    }
  }
}

function setupInput(){
  // Mouse move
  C.addEventListener('mousemove',e=>{const p=getPos(e);mx=p.x;my=p.y;});

  // Touch start
  C.addEventListener('touchstart',e=>{
    const p=getPos(e, e.touches[0]);
    mx=p.x;my=p.y;
    if(gs==='MENU'&&hiScore>0){
      var resetX=W/2, resetY=H*0.32;
      if(Math.abs(p.x-resetX)<60&&Math.abs(p.y-resetY)<15){
        hiResetTimer=1;
      }
    }
  },{passive:true});

  // Mouse long press for hi score reset
  C.addEventListener('mousedown',e=>{
    if(gs==='MENU'&&hiScore>0){
      const p=getPos(e);
      var resetX=W/2, resetY=H*0.32;
      if(Math.abs(p.x-resetX)<60&&Math.abs(p.y-resetY)<15){
        hiResetTimer=1;
      }
    }
  });

  C.addEventListener('mouseup',()=>{hiResetTimer=0;});

  C.addEventListener('touchmove',e=>{
    e.preventDefault();
    const p=getPos(e, e.touches[0]);
    mx=p.x;my=p.y;
  },{passive:false});

  C.addEventListener('mouseenter',()=>{C.style.cursor='default';});

  // Click event
  C.addEventListener('click',e=>{
    const p=getPos(e);mx=p.x;my=p.y;
    if(touchHandled){touchHandled=false;return;}
    hiResetTimer=0;
    handleTap(p.x,p.y);
  });

  // Touch end
  C.addEventListener('touchend',e=>{
    e.preventDefault();
    hiResetTimer = 0;
    touchHandled = true;
    const p=getPos(e, e.changedTouches[0]);
    mx=p.x;my=p.y;
    handleTap(p.x,p.y);
  },{passive:false});

  // Keyboard
  document.addEventListener('keydown',e=>{
    if (e.target.closest('a,button') || document.getElementById('gdpr-consent')) return;
    if (gs === 'MENU' && (e.key === 'Enter' || e.key === ' ')) {
      e.preventDefault();
      handleTap(menuPlayBtn.x + menuPlayBtn.w / 2, menuPlayBtn.y + menuPlayBtn.h / 2);
      return;
    }
    if (gs === 'AIMING' && ['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(e.key)) {
      e.preventDefault();
      const step = 15;
      if (e.key === 'ArrowLeft') mx = Math.max(0, mx - step);
      if (e.key === 'ArrowRight') mx = Math.min(W, mx + step);
      if (e.key === 'ArrowUp') my = Math.max(0, my - step);
      if (e.key === 'ArrowDown') my = Math.min(CY - 12, my + step);
    }
    if(gs==='GAMEOVER' && nameInputActive && !nameSubmitted){
      if(e.key==='Enter'){ submitScore(); return; }
      if(e.key==='Escape'){ submitScore(); return; }
      return;
    }
    if(e.key==='Escape'||e.key==='p'||e.key==='P'){
      if(gs==='MENU')return;
      if(gs==='LEADERBOARD'){gs='MENU';return;}
      togglePause();
    }
    if(e.key===' '||e.key==='Enter'){
      Audio_.resume();
      if(gs==='AIMING')fire();
    }
    // Atajos de teclado: R para restart en game over
    if((e.key==='r'||e.key==='R') && gs==='GAMEOVER'){
      const layout = getGOLayout();
      const rb=layout.retryBtn;
      if(adPending) return;
      if(!nameSubmitted) submitScore();
      Audio_.play('click');
      Audio_.stopBGM();
      adPending = true;
      CG.commercialBreak(()=>{
        adPending = false;
        fadeIn(()=>{
          resetGame();
          gs='AIMING';
          CG.gameplayStart();
          Audio_.playBGM('GAME');
        });
      });
    }
  });

  // Visibility change
  document.addEventListener('visibilitychange',()=>{
    if(document.hidden){
      if(gs==='FIRING'){CG.gameplayStop();pausedState='FIRING';gs='PAUSED';}
      else if(gs==='AIMING'){pausedState='AIMING';gs='PAUSED';}
      Audio_.setBGMVolume(0.3);
    }else{
      if(gs==='PAUSED'){
        // Stay paused
      }else{
        Audio_.setBGMVolume(1);
      }
    }
  });
}

function getPos(e, touchSrc){
  const rect=C.getBoundingClientRect(), scx=W/rect.width, scy=H/rect.height;
  const src=touchSrc || (e.touches ? e.touches[0] : e);
  return{x:(src.clientX-rect.left)*scx, y:(src.clientY-rect.top)*scy};
}

window.showNameInput = showNameInput;
window.hideNameInput = hideNameInput;
window.handleTap = handleTap;
window.setupInput = setupInput;
window.getPos = getPos;

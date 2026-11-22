const SAVE_KEY = 'idleArcade_save';
const SAVE_VERSION = 4;

function saveGame(player, economy, helper1, helper2, refinery) {
  try {
    const data = {
      version: SAVE_VERSION,
      lastSeenTimestamp: Date.now(),
      coins: economy.coins,
      upgradeCosts: Object.assign({}, economy.upgradeCosts),
      playerSpeed: player.speed,
      playerCap: player.maxCapacity,
      playerInv: player.inventory,
      hasHelper1: economy.hasHelper1 ? 1 : 0,
      crystalUnlocked: economy.crystalUnlocked ? 1 : 0,
      hasHelper2: economy.hasHelper2 ? 1 : 0,
      zone2Unlocked: economy.zone2Unlocked ? 1 : 0,
      refineryUnlocked: economy.refineryUnlocked ? 1 : 0,
      prestigePoints: economy.prestigePoints,
      multiplier: economy.multiplier,
      totalEnergySold: economy.totalEnergySold,
      fastestPrestige: economy.fastestPrestige === Infinity ? -1 : economy.fastestPrestige,
      playTime: economy.playTime,
      helperSpeedLevel: economy.helperSpeedLevel,
      helperCapLevel: economy.helperCapLevel,
      stats: Object.assign({}, economy.stats),
      completedMilestones: economy.completedMilestones.slice(),
      prestigeInfinite: Object.assign({}, economy.prestigeInfinite || {}),
      prestigeTree: (typeof S !== 'undefined' && Array.isArray(S.prestigeTree)) ? S.prestigeTree.slice() : [],
      gr: (typeof S !== 'undefined' ? S.gr : economy.prestigePoints),
      endlessAcresLevel: (typeof S !== 'undefined' ? S.endlessAcresLevel : (economy.endlessAcresLevel||0)),
      ownedExpansions: (typeof S !== 'undefined' && Array.isArray(S.ownedExpansions)) ? S.ownedExpansions.slice() : (Array.isArray(economy.ownedExpansions)? economy.ownedExpansions.slice():[]),
      totalPlots: (typeof S !== 'undefined' ? S.totalPlots : economy.totalPlots),
    };
    if (helper1) {
      data.h1Speed = helper1.speed;
      data.h1Cap = helper1.maxCapacity;
    }
    if (helper2) {
      data.h2Speed = helper2.speed;
      data.h2Cap = helper2.maxCapacity;
    }
    if (refinery) {
      data.refineryInput = refinery.input;
      data.refineryOutput = refinery.output;
    }
    localStorage.setItem(SAVE_KEY, JSON.stringify(data));
  } catch (e) { /* storage unavailable */ }
}

function loadGame(player, economy, refinery) {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return null;
    const data = JSON.parse(raw);
    if (!data || typeof data !== 'object') return null;
    if (typeof data.version !== 'number' || data.version < 1) return null;

    const n = (v, def) => (typeof v === 'number' && isFinite(v) ? v : def);

    economy.coins = n(data.coins, 0);
    economy.prestigePoints = n(data.prestigePoints, 0);
    economy.multiplier = n(data.multiplier, 1);
    economy.totalEnergySold = n(data.totalEnergySold, 0);
    economy.playTime = n(data.playTime, 0);
    economy.fastestPrestige = data.fastestPrestige === -1 ? Infinity : n(data.fastestPrestige, Infinity);
    economy.helperSpeedLevel = n(data.helperSpeedLevel, 0);
    economy.helperCapLevel = n(data.helperCapLevel, 0);
    economy.prestigeInfinite = {};
    if(data.prestigeInfinite && typeof data.prestigeInfinite==='object' && !Array.isArray(data.prestigeInfinite)){
      for(const k in data.prestigeInfinite){
        const v=data.prestigeInfinite[k];
        if(typeof v==='number' && isFinite(v) && !isNaN(v) && v>=0) economy.prestigeInfinite[k]=Math.floor(v);
      }
    }
    if(typeof S!=='undefined'){
      if(Array.isArray(data.prestigeTree)){
        const seen=new Set();
        let valid=true;
        for(let i=0;i<data.prestigeTree.length;i++){
          const id=data.prestigeTree[i];
          if(typeof id!=='string'||seen.has(id)) {valid=false;break;}
          seen.add(id);
        }
        if(valid) S.prestigeTree=data.prestigeTree.slice();
      }
      if(data.prestigeInfinite && typeof data.prestigeInfinite==='object'){
        S.prestigeInfinite={};
        for(const k in data.prestigeInfinite){
          const v=data.prestigeInfinite[k];
          if(typeof v==='number' && isFinite(v) && !isNaN(v) && v>=0) S.prestigeInfinite[k]=Math.floor(v);
          else { S.prestigeInfinite={}; break; }
        }
        economy.prestigeInfinite=Object.assign({},S.prestigeInfinite);
      }
      if(typeof data.gr==='number' && isFinite(data.gr) && !isNaN(data.gr)) S.gr=data.gr;
      else S.gr=economy.prestigePoints;
      if(typeof data.endlessAcresLevel==='number' && isFinite(data.endlessAcresLevel) && !isNaN(data.endlessAcresLevel) && data.endlessAcresLevel>=0) { S.endlessAcresLevel=Math.floor(data.endlessAcresLevel); economy.endlessAcresLevel=S.endlessAcresLevel; }
      if(Array.isArray(data.ownedExpansions)) { S.ownedExpansions=data.ownedExpansions.slice(); S.expansions=S.ownedExpansions; economy.ownedExpansions=S.ownedExpansions.slice(); }
      else if(Array.isArray(data.expansions)) { S.ownedExpansions=data.expansions.slice(); S.expansions=S.ownedExpansions; economy.ownedExpansions=S.ownedExpansions.slice(); }
      if(typeof data.totalPlots==='number' && isFinite(data.totalPlots)) { S.totalPlots=data.totalPlots; S.plots=data.totalPlots; economy.totalPlots=data.totalPlots; }
      else if(typeof data.plots==='number' && isFinite(data.plots)) { S.totalPlots=data.plots; S.plots=data.plots; economy.totalPlots=data.plots; }
      if(typeof data.coins==='number' && isFinite(data.coins)) { S.coins=data.coins; }
    }
    if(typeof economy.applyInfiniteBonuses==='function') economy.applyInfiniteBonuses();
    if(typeof S!=='undefined' && typeof getTotalPlots==='function' && !data.totalPlots) { S.totalPlots=getTotalPlots(); S.plots=S.totalPlots; }

    // Migration v1/v2 → v3+
    if (data.version < 3) {
      economy.hasHelper1 = data.hasHelper === 1;
      economy.crystalUnlocked = false;
      economy.hasHelper2 = false;
      economy.refineryUnlocked = false;
    } else {
      economy.hasHelper1 = data.hasHelper1 === 1;
      economy.crystalUnlocked = data.crystalUnlocked === 1;
      economy.hasHelper2 = data.hasHelper2 === 1;
      economy.zone2Unlocked = data.zone2Unlocked === 1;
      economy.refineryUnlocked = data.refineryUnlocked === 1;
    }

    // Migration v3 → v4: stats and completedMilestones
    if (data.version < 4) {
      economy.stats = {
        totalGold: 0,
        totalCrystals: 0,
        totalCoins: 0,
        prestigeCount: economy.prestigePoints,
        playTime: economy.playTime,
        goldDeposited: 0,
        crystalsProcessed: 0,
      };
      economy.completedMilestones = [];
    } else {
      economy.stats = data.stats && typeof data.stats === 'object'
        ? {
            totalGold: n(data.stats.totalGold, 0),
            totalCrystals: n(data.stats.totalCrystals, 0),
            totalCoins: n(data.stats.totalCoins, 0),
            prestigeCount: n(data.stats.prestigeCount, 0),
            playTime: n(data.stats.playTime, 0),
            goldDeposited: n(data.stats.goldDeposited, 0),
            crystalsProcessed: n(data.stats.crystalsProcessed, 0),
          }
        : { totalGold: 0, totalCrystals: 0, totalCoins: 0, prestigeCount: 0, playTime: 0, goldDeposited: 0, crystalsProcessed: 0 };
      economy.completedMilestones = Array.isArray(data.completedMilestones) ? data.completedMilestones.slice() : [];
    }

    if (data.upgradeCosts && typeof data.upgradeCosts === 'object') {
      for (const key of Object.keys(CFG.upgrades)) {
        if (typeof data.upgradeCosts[key] === 'number') {
          economy.upgradeCosts[key] = data.upgradeCosts[key];
        }
      }
    }

    player.speed = n(data.playerSpeed, CFG.player.speed);
    player.maxCapacity = n(data.playerCap, CFG.player.maxCapacity);
    player.inventory = n(data.playerInv, 0);

    if (refinery) {
      refinery.input = n(data.refineryInput, 0);
      refinery.output = n(data.refineryOutput, 0);
    }

    // Offline time calculation
    let offlineSeconds = 0;
    if (data.lastSeenTimestamp) {
      offlineSeconds = Math.min((Date.now() - data.lastSeenTimestamp) / 1000, MAX_OFFLINE_SECONDS);
    }

    return { data, offlineSeconds };
  } catch (e) {
    console.warn('Save load failed, starting fresh');
    return null;
  }
}

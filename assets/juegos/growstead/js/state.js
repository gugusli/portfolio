var S = {
  gr: 0,
  prestigeTree: [],
  prestigeInfinite: {},
  coins: 0,
  level: 1,
  lv: 1,
  ownedExpansions: [],
  expansions: [],
  totalPlots: 9,
  plots: 9,
  endlessAcresLevel: 0,
  helpers: [],
  helpersDisabled: [],
  lastUpkeepCharge: Date.now()
};
S.expansions = S.ownedExpansions;
const VALID_PRESTIGE_IDS = new Set(PRESTIGE_TREE.map(function(n){ return n.id; }));
const VALID_INFINITE_IDS = new Set(PRESTIGE_INFINITE.map(function(n){ return n.id; }));
const VALID_EXPANSION_IDS = new Set(EXPANSIONS.map(function(n){ return n.id; }));
const VALID_HELPER_IDS = new Set(HELPERS.map(function(n){ return n.id; }));
function validateSave(data){
  if(!data || typeof data!=='object') return false;
  if(Array.isArray(data.prestigeTree)){
    var seen = new Set();
    for(var i=0;i<data.prestigeTree.length;i++){
      var id=data.prestigeTree[i];
      if(typeof id!=='string' || !VALID_PRESTIGE_IDS.has(id)) return false;
      if(seen.has(id)) return false;
      seen.add(id);
    }
  }
  if(data.prestigeInfinite!==undefined){
    if(typeof data.prestigeInfinite!=='object' || data.prestigeInfinite===null || Array.isArray(data.prestigeInfinite)) return false;
    for(var k in data.prestigeInfinite){
      if(!VALID_INFINITE_IDS.has(k)) return false;
      var v=data.prestigeInfinite[k];
      if(typeof v!=='number' || isNaN(v) || !isFinite(v) || v<0 || Math.floor(v)!==v) return false;
    }
  }
  if(data.ownedExpansions!==undefined){
    if(!Array.isArray(data.ownedExpansions)) return false;
    var seen2=new Set();
    for(var j=0;j<data.ownedExpansions.length;j++){
      var eid=data.ownedExpansions[j];
      if(typeof eid!=='string' || !VALID_EXPANSION_IDS.has(eid)) return false;
      if(seen2.has(eid)) return false;
      seen2.add(eid);
    }
  }
  if(data.expansions!==undefined && data.ownedExpansions===undefined){
    if(!Array.isArray(data.expansions)) return false;
    var seen3=new Set();
    for(var k2=0;k2<data.expansions.length;k2++){
      var eid2=data.expansions[k2];
      if(typeof eid2!=='string' || !VALID_EXPANSION_IDS.has(eid2)) return false;
      if(seen3.has(eid2)) return false;
      seen3.add(eid2);
    }
  }
  if(data.endlessAcresLevel!==undefined){
    var v=data.endlessAcresLevel;
    if(typeof v!=='number' || isNaN(v) || !isFinite(v) || v<0 || Math.floor(v)!==v) return false;
  }
  if(data.totalPlots!==undefined){
    var tp=data.totalPlots;
    if(typeof tp!=='number' || isNaN(tp) || !isFinite(tp) || tp<0) return false;
  }
  if(data.helpers!==undefined){
    if(!Array.isArray(data.helpers)) return false;
    var seenH=new Set();
    for(var hh=0;hh<data.helpers.length;hh++){
      var hid=data.helpers[hh];
      if(typeof hid!=='string' || !VALID_HELPER_IDS.has(hid)) return false;
      if(seenH.has(hid)) return false;
      seenH.add(hid);
    }
  }
  if(data.helpersDisabled!==undefined){
    if(!Array.isArray(data.helpersDisabled)) return false;
    for(var hd=0;hd<data.helpersDisabled.length;hd++){
      var did=data.helpersDisabled[hd];
      if(typeof did!=='string' || !VALID_HELPER_IDS.has(did)) return false;
    }
  }
  if(data.lastUpkeepCharge!==undefined){
    var luc=data.lastUpkeepCharge;
    if(typeof luc!=='number' || isNaN(luc) || !isFinite(luc) || luc<0) return false;
  }
  return true;
}
function loadPrestigeFromSave(data){
  if(Array.isArray(data.prestigeTree)) S.prestigeTree=data.prestigeTree.slice();
  if(data.prestigeInfinite && typeof data.prestigeInfinite==='object'){
    S.prestigeInfinite={};
    for(var k in data.prestigeInfinite){
      var v=data.prestigeInfinite[k];
      if(typeof v==='number' && isFinite(v) && !isNaN(v) && v>=0) S.prestigeInfinite[k]=Math.floor(v);
    }
  }
  if(typeof data.gr==='number' && isFinite(data.gr) && !isNaN(data.gr)) S.gr=data.gr;
  if(typeof data.coins==='number' && isFinite(data.coins) && !isNaN(data.coins)) S.coins=data.coins;
  if(Array.isArray(data.ownedExpansions)) { S.ownedExpansions=data.ownedExpansions.slice(); S.expansions=S.ownedExpansions; }
  else if(Array.isArray(data.expansions)) { S.ownedExpansions=data.expansions.slice(); S.expansions=S.ownedExpansions; }
  if(typeof data.endlessAcresLevel==='number' && isFinite(data.endlessAcresLevel) && !isNaN(data.endlessAcresLevel) && data.endlessAcresLevel>=0) S.endlessAcresLevel=Math.floor(data.endlessAcresLevel);
  else S.endlessAcresLevel=0;
  if(typeof data.totalPlots==='number' && isFinite(data.totalPlots) && !isNaN(data.totalPlots)) { S.totalPlots=data.totalPlots; S.plots=data.totalPlots; }
  else if(typeof data.plots==='number' && isFinite(data.plots) && !isNaN(data.plots)) { S.totalPlots=data.plots; S.plots=data.plots; }
  if(typeof data.level==='number' && isFinite(data.level)) { S.level=Math.floor(data.level); S.lv=S.level; }
  else if(typeof data.lv==='number' && isFinite(data.lv)) { S.lv=Math.floor(data.lv); S.level=S.lv; }
  if(Array.isArray(data.helpers)) { S.helpers=data.helpers.slice(); } else S.helpers=[];
  if(Array.isArray(data.helpersDisabled)) { S.helpersDisabled=data.helpersDisabled.slice(); } else S.helpersDisabled=[];
  if(typeof data.lastUpkeepCharge==='number' && isFinite(data.lastUpkeepCharge) && !isNaN(data.lastUpkeepCharge) && data.lastUpkeepCharge>=0) S.lastUpkeepCharge=data.lastUpkeepCharge; else S.lastUpkeepCharge=Date.now();
}
function getTotalPlots(){
  var base=9;
  var sum=base;
  for(var i=0;i<S.ownedExpansions.length;i++){
    var exp=EXPANSIONS.find(function(e){ return e.id===S.ownedExpansions[i]; });
    if(exp) sum+=exp.plots;
  }
  sum+= (S.endlessAcresLevel||0)*INFINITE_EXPANSION.plotsPerLevel;
  return sum;
}

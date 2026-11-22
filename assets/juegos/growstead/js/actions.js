function getPrestigeBonuses(){
  var bonuses={sellBonus:0, growSpeed:0, mutChance:0};
  for(var i=0;i<S.prestigeTree.length;i++){
    var id=S.prestigeTree[i];
    var node=PRESTIGE_TREE.find(function(n){ return n.id===id; });
    if(!node||!node.eff) continue;
    for(var k in node.eff) if(bonuses.hasOwnProperty(k)) bonuses[k]+=node.eff[k];
  }
  for(var id in S.prestigeInfinite){
    if(!S.prestigeInfinite.hasOwnProperty(id)) continue;
    var lvl=S.prestigeInfinite[id];
    if(typeof lvl!=='number'||lvl<=0) continue;
    var node=PRESTIGE_INFINITE.find(function(n){ return n.id===id; });
    if(!node||!node.eff) continue;
    for(var k in node.eff) if(bonuses.hasOwnProperty(k)) bonuses[k]+=lvl*node.eff[k];
  }
  return bonuses;
}
function applyPrestigeBonuses(){
  var b=getPrestigeBonuses();
  S._bonuses=b;
  if(typeof economy!=='undefined' && economy){
    economy._infiniteSellBonus=b.sellBonus;
    economy._infiniteGrowSpeed=b.growSpeed;
    economy._infiniteMutChance=b.mutChance;
    if(typeof economy.recalcMultiplier==='function') economy.recalcMultiplier();
  }
  return b;
}
function buyPrestigeNode(id){
  var node=PRESTIGE_TREE.find(function(n){ return n.id===id; });
  if(!node) return false;
  if(S.prestigeTree.indexOf(id)!==-1) return false;
  if(S.gr < node.cost) return false;
  if(node.requires){
    for(var i=0;i<node.requires.length;i++) if(S.prestigeTree.indexOf(node.requires[i])===-1) return false;
  }
  S.gr -= node.cost;
  S.prestigeTree.push(id);
  applyPrestigeBonuses();
  return true;
}
function buyInfinitePrestigeNode(id){
  var node=PRESTIGE_INFINITE.find(function(n){ return n.id===id; });
  if(!node) return false;
  var level=S.prestigeInfinite[id]||0;
  var cost=Math.floor(node.baseCost * Math.pow(node.costMult, level));
  if(S.gr < cost) return false;
  S.gr -= cost;
  S.prestigeInfinite[id]=level+1;
  applyPrestigeBonuses();
  return true;
}
function hasAllExpansions(){
  if(!Array.isArray(S.ownedExpansions)) return false;
  for(var i=0;i<EXPANSIONS.length;i++){
    if(S.ownedExpansions.indexOf(EXPANSIONS[i].id)===-1) return false;
  }
  return true;
}
function getExpansionsTotalPlots(){
  if(typeof getTotalPlots==='function') return getTotalPlots();
  var sum=0;
  for(var i=0;i<S.ownedExpansions.length;i++){
    var exp=EXPANSIONS.find(function(e){ return e.id===S.ownedExpansions[i]; });
    if(exp) sum+=exp.plots;
  }
  sum+=(S.endlessAcresLevel||0)*INFINITE_EXPANSION.plotsPerLevel;
  return sum;
}
function buyExpansion(id){
  var exp=EXPANSIONS.find(function(e){ return e.id===id; });
  if(!exp) return false;
  if(S.ownedExpansions.indexOf(id)!==-1) return false;
  if(typeof S.level!=='undefined' && S.level < exp.lv) return false;
  if(typeof S.lv!=='undefined' && S.lv < exp.lv) return false;
  if(S.coins < exp.cost) return false;
  S.coins -= exp.cost;
  S.ownedExpansions.push(id);
  S.expansions=S.ownedExpansions;
  if(typeof S.totalPlots==='number') { S.totalPlots+=exp.plots; S.plots=S.totalPlots; }
  else { S.totalPlots=getExpansionsTotalPlots(); S.plots=S.totalPlots; }
  if(typeof economy!=='undefined' && economy){
    economy.coins=S.coins;
    if(typeof economy.totalPlots!=='undefined') economy.totalPlots=S.totalPlots;
  }
  return true;
}
function buyEndlessAcres(){
  if(!hasAllExpansions()) return false;
  var level=S.endlessAcresLevel||0;
  var cost=Math.floor(INFINITE_EXPANSION.baseCost * Math.pow(INFINITE_EXPANSION.costMult, level));
  if(S.coins < cost) return false;
  S.coins -= cost;
  S.endlessAcresLevel=level+1;
  S.totalPlots+=INFINITE_EXPANSION.plotsPerLevel;
  S.plots=S.totalPlots;
  S.expansions=S.ownedExpansions;
  if(typeof economy!=='undefined' && economy){
    economy.coins=S.coins;
    if(typeof economy.endlessAcresLevel!=='undefined') economy.endlessAcresLevel=S.endlessAcresLevel;
    else economy.endlessAcresLevel=S.endlessAcresLevel;
    if(typeof economy.totalPlots!=='undefined') economy.totalPlots=S.totalPlots;
    else economy.totalPlots=S.totalPlots;
  }
  return true;
}
function buyHelper(id){
  var h=HELPERS.find(function(x){ return x.id===id; });
  if(!h) return false;
  if(S.helpers.indexOf(id) >=0) return false;
  if(S.coins < h.cost) return false;
  S.coins -= h.cost;
  S.helpers.push(id);
  if(typeof economy!=='undefined') economy.coins=S.coins;
  return true;
}

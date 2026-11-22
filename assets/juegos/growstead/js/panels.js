function renderPrestigePanel(container){
  if(!container) container=document.getElementById('prestigePanel');
  if(!container) return;
  var html='';
  html+='<div class="prestige-tree-section">';
  for(var i=0;i<PRESTIGE_TREE.length;i++){
    var node=PRESTIGE_TREE[i];
    var owned=S.prestigeTree.indexOf(node.id)!==-1;
    var unlocked=true;
    if(node.requires){
      for(var r=0;r<node.requires.length;r++) if(S.prestigeTree.indexOf(node.requires[r])===-1) unlocked=false;
    }
    html+='<div class="tree-node'+(owned?' owned':'')+(unlocked?' unlocked':' locked')+'">';
    html+='<div class="tree-node-name">'+node.name+'</div>';
    html+='<div class="tree-node-desc">'+node.desc+'</div>';
    html+='<div class="tree-node-cost">Cost: '+node.cost+' GR</div>';
    if(!owned && unlocked) html+='<button onclick="buyPrestigeNode(\''+node.id+'\')">Buy</button>';
    else if(owned) html+='<span>Owned</span>';
    else html+='<span>Locked</span>';
    html+='</div>';
  }
  html+='</div>';
  html+='<div class="prestige-infinite-section" style="margin-top:16px; border-top:1px solid #333; padding-top:12px;">';
  html+='<h3 style="color:#ffd700;">Infinite Prestige</h3>';
  for(var j=0;j<PRESTIGE_INFINITE.length;j++){
    var inode=PRESTIGE_INFINITE[j];
    var level=S.prestigeInfinite[inode.id]||0;
    var cost=Math.floor(inode.baseCost * Math.pow(inode.costMult, level));
    var canAfford=S.gr>=cost;
    html+='<div class="tree-node tree-node-infinite">';
    html+='<div class="tree-node-name">'+inode.name+' <span style="opacity:0.7">Lv '+level+'</span></div>';
    html+='<div class="tree-node-desc">'+inode.desc+'</div>';
    html+='<div class="tree-node-cost">Cost: '+cost+' GR</div>';
    html+='<div class="tree-node-level">Level: '+level+'</div>';
    html+='<button onclick="buyInfinitePrestigeNode(\''+inode.id+'\')"'+(canAfford?'':' disabled')+'>Buy Next</button>';
    html+='</div>';
  }
  html+='</div>';
  container.innerHTML=html;
}
function renderExpansionsPanel(container){
  if(!container) container=document.getElementById('expansionsPanel');
  if(!container) return;
  var html='';
  html+='<div class="expansions-section">';
  for(var i=0;i<EXPANSIONS.length;i++){
    var exp=EXPANSIONS[i];
    var owned=S.ownedExpansions.indexOf(exp.id)!==-1;
    var canAfford=S.coins>=exp.cost;
    var levelOk=(S.level>=exp.lv) || (S.lv>=exp.lv);
    html+='<div class="expansion-card'+(owned?' owned':'')+'">';
    html+='<div class="expansion-name">'+exp.emoji+' '+exp.name+'</div>';
    html+='<div class="expansion-desc">'+exp.desc+'</div>';
    html+='<div class="expansion-plots">+'+exp.plots+' plots</div>';
    html+='<div class="expansion-cost">Cost: '+exp.cost+' coins</div>';
    html+='<div class="expansion-lv">Lv '+exp.lv+'</div>';
    if(owned) html+='<span>Comprado</span>';
    else if(!levelOk) html+='<span>Bloqueado (Lv '+exp.lv+')</span>';
    else html+='<button onclick="buyExpansion(\''+exp.id+'\')"'+(canAfford?'':' disabled')+'>Comprar</button>';
    html+='</div>';
  }
  html+='</div>';
  var hasAll=true;
  for(var k=0;k<EXPANSIONS.length;k++) if(S.ownedExpansions.indexOf(EXPANSIONS[k].id)===-1) hasAll=false;
  var levelE=S.endlessAcresLevel||0;
  var costE=Math.floor(INFINITE_EXPANSION.baseCost * Math.pow(INFINITE_EXPANSION.costMult, levelE));
  var totalPlotsE=levelE*INFINITE_EXPANSION.plotsPerLevel;
  var canAffordE=S.coins>=costE;
  html+='<div class="endless-acres-card" style="margin-top:16px; border-top:1px solid #333; padding-top:12px;">';
  html+='<div class="expansion-name">'+INFINITE_EXPANSION.emoji+' '+INFINITE_EXPANSION.name+'</div>';
  html+='<div class="expansion-desc">'+INFINITE_EXPANSION.desc+'</div>';
  if(!hasAll){
    html+='<div class="expansion-locked" style="opacity:0.5; filter:grayscale(1);">Requiere todas las expansiones</div>';
    html+='<div class="tree-node-cost">Cost: '+costE+' coins</div>';
    html+='<button disabled>Bloqueado</button>';
  } else {
    html+='<div class="expansion-level">Nivel: '+levelE+'</div>';
    html+='<div class="expansion-total-plots">Plots totales: '+totalPlotsE+'</div>';
    html+='<div class="tree-node-cost">Cost: '+costE+' coins</div>';
    html+='<button onclick="buyEndlessAcres()"'+(canAffordE?'':' disabled')+'>Comprar</button>';
  }
  html+='</div>';
  container.innerHTML=html;
}
function renderHelpersPanel(container){
  if(!container) container=document.getElementById('helpersPanel');
  if(!container) return;
  var html='';
  html+='<div class="helpers-section">';
  for(var i=0;i<HELPERS.length;i++){
    var h=HELPERS[i];
    var owned=S.helpers.indexOf(h.id) >=0;
    var disabled=S.helpersDisabled.indexOf(h.id) >=0;
    html+='<div class="helper-card'+(owned?' owned':'')+(disabled?' disabled':'')+'">';
    html+='<div class="helper-name">'+h.emoji+' '+h.name+'</div>';
    html+='<div class="helper-desc">'+h.desc+'</div>';
    html+='<div class="helper-cost">💰 '+h.cost+' coins + 🔧 '+h.upkeep+'/min mantenimiento</div>';
    if(!owned){
      var canAfford=S.coins>=h.cost;
      html+='<button onclick="buyHelper(\''+h.id+'\')"'+(canAfford?'':' disabled')+'>Comprar</button>';
    } else if(disabled){
      html+='<div class="helper-alert">⚠️ Sin fondos — pausado</div>';
    } else {
      html+='<span>activo</span>';
    }
    html+='</div>';
  }
  html+='</div>';
  container.innerHTML=html;
}
function renderPanels(){
  renderPrestigePanel();
  renderExpansionsPanel();
  renderHelpersPanel();
}

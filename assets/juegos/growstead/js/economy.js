class Economy {
  constructor() {
    this.coins = 0;
    this.hasHelper1 = false;
    this.crystalUnlocked = false;
    this.hasHelper2 = false;
    this.zone2Unlocked = false;
    this.refineryUnlocked = false;
    this.prestigePoints = 0;
    this.multiplier = 1;
    this.playTime = 0;
    this.totalEnergySold = 0;
    this.fastestPrestige = Infinity;
    this.helperSpeedLevel = 0;
    this.helperCapLevel = 0;
    this.prestigeInfinite = {};
    this._infiniteSellBonus = 0;
    this._infiniteGrowSpeed = 0;
    this._infiniteMutChance = 0;
    this.ownedExpansions = [];
    this.endlessAcresLevel = 0;
    this.totalPlots = 9;
    this.stats = {
      totalGold: 0,
      totalCrystals: 0,
      totalCoins: 0,
      prestigeCount: 0,
      playTime: 0,
      goldDeposited: 0,
      crystalsProcessed: 0,
    };
    this.completedMilestones = [];
    this._resetCosts();
  }

  _resetCosts() {
    this.upgradeCosts = {};
    for (const [id, cfg] of Object.entries(CFG.upgrades)) {
      this.upgradeCosts[id] = cfg.baseCost;
    }
  }

  addCoins(amount) {
    this.coins += amount;
  }

  buyUpgrade(type) {
    const cost = this.upgradeCosts[type];
    if (cost === undefined) return false;
    if (this.coins < cost) return false;

    this.coins -= cost;

    switch (type) {
      case 'helper1':
        this.hasHelper1 = true;
        break;
      case 'crystal':
        this.crystalUnlocked = true;
        break;
      case 'helper2':
        this.hasHelper2 = true;
        break;
      case 'unlockZone2':
        this.zone2Unlocked = true;
        break;
      case 'refinery':
        this.refineryUnlocked = true;
        break;
      case 'helperSpeed':
        this.helperSpeedLevel++;
        this.upgradeCosts[type] = Math.round(cost * (CFG.upgrades[type] ? CFG.upgrades[type].inflation : 1.12));
        break;
      case 'helperCapacity':
        this.helperCapLevel++;
        this.upgradeCosts[type] = Math.round(cost * (CFG.upgrades[type] ? CFG.upgrades[type].inflation : 1.12));
        break;
      default:
        const cfg = CFG.upgrades[type];
        this.upgradeCosts[type] = Math.round(cost * (cfg ? cfg.inflation : 1.15));
        break;
    }
    return true;
  }

  recalcMultiplier() {
    const base = 1 + this.prestigePoints * CFG.prestige.bonusPerPoint;
    this.multiplier = base + (this._infiniteSellBonus || 0);
  }
  getInfiniteCost(id) {
    const nodes = typeof PRESTIGE_INFINITE !== 'undefined' ? PRESTIGE_INFINITE : [];
    const node = nodes.find(function(n){ return n.id===id; });
    if(!node) return Infinity;
    const lvl = this.prestigeInfinite[id] || 0;
    return Math.floor(node.baseCost * Math.pow(node.costMult, lvl));
  }
  getInfiniteBonuses() {
    const nodes = typeof PRESTIGE_INFINITE !== 'undefined' ? PRESTIGE_INFINITE : [];
    const b = {sellBonus:0, growSpeed:0, mutChance:0};
    for(const id in this.prestigeInfinite){
      const lvl=this.prestigeInfinite[id];
      const node=nodes.find(function(n){ return n.id===id; });
      if(!node||!node.eff||lvl<=0) continue;
      for(const k in node.eff) if(b.hasOwnProperty(k)) b[k]+=lvl*node.eff[k];
    }
    return b;
  }
  applyInfiniteBonuses(){
    const b=this.getInfiniteBonuses();
    this._infiniteSellBonus=b.sellBonus;
    this._infiniteGrowSpeed=b.growSpeed;
    this._infiniteMutChance=b.mutChance;
    this.recalcMultiplier();
    return b;
  }
  buyInfinitePrestigeNode(id){
    const cost=this.getInfiniteCost(id);
    if(!isFinite(cost) || this.prestigePoints < cost) return false;
    this.prestigePoints -= cost;
    this.prestigeInfinite[id]=(this.prestigeInfinite[id]||0)+1;
    this.applyInfiniteBonuses();
    if(typeof S!=='undefined'){ S.gr=this.prestigePoints; S.prestigeInfinite=Object.assign({},this.prestigeInfinite); }
    return true;
  }
  prestige() {
    const gained = Math.floor(this.coins / CFG.prestige.costPerPoint) + CFG.prestige.pointsPerPrestige;
    this.prestigePoints += gained;
    this.recalcMultiplier();
    this.coins = 0;
    this.playTime = 0;
    this.hasHelper1 = false;
    this.crystalUnlocked = false;
    this.hasHelper2 = false;
    this.zone2Unlocked = false;
    this.refineryUnlocked = false;
    this.helperSpeedLevel = 0;
    this.helperCapLevel = 0;
    this._resetCosts();
    if(typeof S!=='undefined'){ S.gr=this.prestigePoints; }
  }
}

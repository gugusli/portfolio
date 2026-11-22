class Resource {
  constructor(x, y, type) {
    this.x = x;
    this.y = y;
    this.type = type;
    this.locked = false;

    const cfg = CFG.resources[type] || CFG.resources.gold;
    this.size = cfg.size;
    this.valuePerUnit = cfg.value;
    this.harvestInterval = cfg.harvestInterval;
    this.helperHarvestInterval = cfg.helperHarvestInterval;
    this.maxAmount = cfg.maxAmount;
    this.currentAmount = this.maxAmount;
    this.isRegenerating = false;
    this.respawnTimer = 0;
    this.respawnDelay = cfg.respawnDelay;
  }

  decrease(amount) {
    this.currentAmount -= amount;
    if (this.currentAmount <= 0) {
      this.currentAmount = 0;
      this.isRegenerating = true;
      this.respawnTimer = 0;
    }
  }

  update() {
    if (!this.isRegenerating) return;
    this.respawnTimer++;
    if (this.respawnTimer >= this.respawnDelay) {
      this.respawnTimer = 0;
      this.isRegenerating = false;
      this.currentAmount = this.maxAmount;
    }
  }
}

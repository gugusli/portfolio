class Helper {
  constructor(x, y, mode) {
    this.x = x;
    this.y = y;
    this.mode = mode; // 'gold' or 'crystal'
    this.radius = CFG.helper.radius;
    this.speed = CFG.helper.speed;
    this.inventory = 0;
    this.maxCapacity = CFG.helper.maxCapacity;
    this.depositValue = 1;
    this.target = null;
    this.state = mode === 'gold' ? 'SEEK_GOLD' : 'SEEK_CRYSTAL';
    this.mineTimer = 0;
    this.depositTimer = 0;
    this.bobPhase = 0;
    this.transferAmount = 0;
  }

  upgradeSpeed() {
    this.speed += 1;
  }

  upgradeCapacity() {
    this.maxCapacity += 5;
  }

  _moveToward(tx, ty, dist) {
    const dx = tx - this.x;
    const dy = ty - this.y;
    const d = Math.sqrt(dx * dx + dy * dy) || 1;
    if (d < dist) return true;
    this.x += (dx / d) * this.speed;
    this.y += (dy / d) * this.speed;
    this.bobPhase += 0.15;
    return false;
  }

  update(resources, base, refinery, zone2Unlocked, refineryUnlocked) {
    if (this.mode === 'gold') return this._updateGold(resources, base);
    return this._updateCrystal(resources, base, refinery, refineryUnlocked);
  }

  _findNearest(resources, type) {
    let nearest = null;
    let nearDist = Infinity;
    for (let i = 0; i < resources.length; i++) {
      const r = resources[i];
      if (r.type !== type || r.isRegenerating || r.currentAmount <= 0 || r.locked) continue;
      const dx = r.x - this.x;
      const dy = r.y - this.y;
      const d = dx * dx + dy * dy;
      if (d < nearDist) { nearDist = d; nearest = r; }
    }
    return nearest;
  }

  _updateGold(resources, base) {
    switch (this.state) {
      case 'SEEK_GOLD': {
        const nearest = this._findNearest(resources, 'gold');
        if (!nearest) { this.state = 'IDLE'; return 0; }
        this.target = nearest;
        if (this._moveToward(this.target.x, this.target.y, this.radius + this.target.size / 2)) {
          this.state = 'MINING_GOLD'; this.mineTimer = 0;
        }
        break;
      }
      case 'MINING_GOLD': {
        if (!this.target || this.target.isRegenerating || this.target.currentAmount <= 0) {
          this.state = 'SEEK_GOLD'; return 0;
        }
        this.mineTimer++;
        if (this.mineTimer >= this.target.helperHarvestInterval) {
          this.mineTimer = 0;
          this.target.decrease(1);
          this.depositValue = this.target.valuePerUnit;
          this.inventory++;
          if (this.inventory >= this.maxCapacity || this.target.currentAmount <= 0) {
            this.state = 'SEEK_BASE';
          }
          return 1;
        }
        break;
      }
      case 'SEEK_BASE': {
        if (this._moveToward(base.x, base.y, this.radius + base.radius)) {
          this.state = 'DEPOSITING'; this.depositTimer = 0;
        }
        break;
      }
      case 'DEPOSITING': {
        this.depositTimer++;
        if (this.depositTimer >= CFG.helper.depositDelay) {
          this.depositTimer = 0;
          if (this.inventory > 0) {
            this.inventory--;
            return 2;
          } else {
            this.state = 'SEEK_GOLD';
          }
        }
        break;
      }
      case 'IDLE': {
        this.state = 'SEEK_GOLD';
        break;
      }
    }
    return 0;
  }

  _updateCrystal(resources, base, refinery, refineryUnlocked) {
    switch (this.state) {
      case 'SEEK_CRYSTAL': {
        const nearest = this._findNearest(resources, 'crystal');
        if (!nearest) { this.state = 'IDLE'; return 0; }
        this.target = nearest;
        if (this._moveToward(this.target.x, this.target.y, this.radius + this.target.size / 2)) {
          this.state = 'MINING_CRYSTAL'; this.mineTimer = 0;
        }
        break;
      }
      case 'MINING_CRYSTAL': {
        if (!this.target || this.target.isRegenerating || this.target.currentAmount <= 0) {
          this.state = 'SEEK_CRYSTAL'; return 0;
        }
        this.mineTimer++;
        if (this.mineTimer >= this.target.helperHarvestInterval) {
          this.mineTimer = 0;
          this.target.decrease(1);
          this.depositValue = this.target.valuePerUnit;
          this.inventory++;
          if (this.inventory >= this.maxCapacity || this.target.currentAmount <= 0) {
            this.state = refineryUnlocked ? 'DELIVER_REFINERY' : 'SEEK_BASE';
          }
          return 1;
        }
        break;
      }
      case 'SEEK_BASE': {
        if (this._moveToward(base.x, base.y, this.radius + base.radius)) {
          this.state = 'DEPOSITING'; this.depositTimer = 0;
        }
        break;
      }
      case 'DEPOSITING': {
        this.depositTimer++;
        if (this.depositTimer >= CFG.helper.depositDelay) {
          this.depositTimer = 0;
          if (this.inventory > 0) {
            this.inventory--;
            return 2;
          } else {
            this.state = 'SEEK_CRYSTAL';
          }
        }
        break;
      }
      case 'DELIVER_REFINERY': {
        const pad = refinery.inputPad;
        if (this._moveToward(pad.x, pad.y, this.radius + pad.radius)) {
          this.transferAmount = Math.min(this.inventory, refinery.maxInput - refinery.input);
          this.state = 'DUMP_REFINERY';
        }
        break;
      }
      case 'DUMP_REFINERY': {
        if (this.transferAmount > 0) {
          refinery.input += this.transferAmount;
          this.inventory -= this.transferAmount;
          this.transferAmount = 0;
        }
        this.state = 'SEEK_ENERGY';
        return 3;
      }
      case 'SEEK_ENERGY': {
        const pad = refinery.outputPad;
        if (this._moveToward(pad.x, pad.y, this.radius + pad.radius)) {
          this.state = 'COLLECT_ENERGY'; this.mineTimer = 0;
        }
        break;
      }
      case 'COLLECT_ENERGY': {
        if (refinery.output <= 0 || this.inventory >= this.maxCapacity) {
          this.state = 'SEEK_CRYSTAL'; return 0;
        }
        this.mineTimer++;
        if (this.mineTimer >= 15) {
          this.mineTimer = 0;
          refinery.output--;
          this.inventory++;
          this.depositValue = 15;
          if (this.inventory >= this.maxCapacity || refinery.output <= 0) {
            this.state = 'SEEK_BASE';
          }
          return 4;
        }
        break;
      }
      case 'IDLE': {
        this.state = 'SEEK_CRYSTAL';
        break;
      }
    }
    return 0;
  }
}

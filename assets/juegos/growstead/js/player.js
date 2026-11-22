class Player {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.radius = CFG.player.radius;
    this.speed = CFG.player.speed;
    this.inventory = 0;
    this.maxCapacity = CFG.player.maxCapacity;
    this.depositValue = 1;
    this.bobPhase = 0;
    this.facingX = 0;
    this.facingY = -1;
    this.hasMoved = false;
    this.hasDeposited = false;
    this.hasBoughtDroid = false;
  }

  isMoving() {
    return false; // handled externally via input.dx/dy
  }

  upgradeSpeed() {
    this.speed += 0.5;
  }

  upgradeCapacity() {
    this.maxCapacity += 5;
  }

  update(dx, dy, worldWidth, worldHeight) {
    const moving = dx !== 0 || dy !== 0;

    if (moving) {
      this.x += dx * this.speed;
      this.y += dy * this.speed;
      this.facingX = dx;
      this.facingY = dy;
      this.bobPhase += 0.15;
    }

    const r = this.radius;
    this.x = Math.max(r, Math.min(worldWidth - r, this.x));
    this.y = Math.max(r, Math.min(worldHeight - r, this.y));
  }
}

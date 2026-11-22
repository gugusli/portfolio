class ParticlePool {
  constructor(size) {
    this.pool = [];
    for (let i = 0; i < size; i++) {
      this.pool.push({
        x: 0, y: 0, vx: 0, vy: 0,
        color: '',
        size: 0,
        active: false,
        life: 0,
        maxLife: 0,
      });
    }
  }

  emit(x, y, color, count, speed, targetX, targetY, spread) {
    const dx = targetX - x;
    const dy = targetY - y;
    const dist = Math.sqrt(dx * dx + dy * dy) || 1;
    const nx = dx / dist;
    const ny = dy / dist;
    const spreadAngle = spread !== undefined ? spread : 1.2;

    let remaining = count;
    for (let i = 0; i < this.pool.length && remaining > 0; i++) {
      const p = this.pool[i];
      if (p.active) continue;

      const angle = Math.atan2(ny, nx) + (Math.random() - 0.5) * spreadAngle;
      const spd = speed * (0.5 + Math.random() * 0.8);

      p.x = x;
      p.y = y;
      p.vx = Math.cos(angle) * spd;
      p.vy = Math.sin(angle) * spd;
      p.color = color;
      p.size = 2 + Math.random() * 3;
      p.active = true;
      p.life = 20 + Math.random() * 15;
      p.maxLife = p.life;

      remaining--;
    }
  }

  update() {
    const pool = this.pool;
    for (let i = 0; i < pool.length; i++) {
      const p = pool[i];
      if (!p.active) continue;

      p.x += p.vx;
      p.y += p.vy;
      p.vx *= 0.95;
      p.vy *= 0.95;
      p.life--;

      if (p.life <= 0) p.active = false;
    }
  }
}

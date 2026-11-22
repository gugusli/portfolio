class TextPool {
  constructor(size) {
    this.pool = [];
    for (let i = 0; i < size; i++) {
      this.pool.push({
        x: 0, y: 0,
        text: '',
        color: '',
        active: false,
        life: 0,
        maxLife: 0,
        vy: 0,
        value: 0,
      });
    }
  }

  emit(x, y, text, color, value, duration) {
    const pool = this.pool;
    const v = value !== undefined ? value : 0;
    const dur = duration !== undefined ? duration : 45;
    for (let i = 0; i < pool.length; i++) {
      const t = pool[i];
      if (t.active) continue;

      t.x = x;
      t.y = y;
      t.text = text;
      t.color = color;
      t.value = v;
      t.active = true;
      t.life = dur;
      t.maxLife = dur;
      t.vy = dur > 60 ? -0.7 : -1.5;
      break;
    }
  }

  update() {
    const pool = this.pool;
    for (let i = 0; i < pool.length; i++) {
      const t = pool[i];
      if (!t.active) continue;

      t.y += t.vy;
      t.life--;
      if (t.life <= 0) t.active = false;
    }
  }
}

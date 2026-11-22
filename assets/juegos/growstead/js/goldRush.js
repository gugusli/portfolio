class GoldRushManager {
  constructor(onStart, onEnd) {
    this.active = false;
    this.endTime = 0;
    this.nextTriggerTime = 0;
    this.onStart = typeof onStart === 'function' ? onStart : null;
    this.onEnd = typeof onEnd === 'function' ? onEnd : null;
    this._scheduleNext();
  }

  _scheduleNext() {
    var interval = GOLD_RUSH.minIntervalMs + Math.random() * (GOLD_RUSH.maxIntervalMs - GOLD_RUSH.minIntervalMs);
    this.nextTriggerTime = Date.now() + interval;
  }

  update() {
    var now = Date.now();
    if (this.active) {
      if (now >= this.endTime) {
        this.active = false;
        this.endTime = 0;
        this._scheduleNext();
        if (this.onEnd) {
          try { this.onEnd(); } catch (e) {}
        }
      }
    } else {
      if (now >= this.nextTriggerTime) {
        this.active = true;
        this.endTime = now + GOLD_RUSH.durationMs;
        if (this.onStart) {
          try { this.onStart(); } catch (e) {}
        }
      }
    }
  }

  isActive() {
    return this.active;
  }

  getMultiplier() {
    return this.active ? GOLD_RUSH.valueMultiplier : 1;
  }
}

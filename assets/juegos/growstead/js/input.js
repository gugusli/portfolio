class InputManager {
  constructor(canvas) {
    this.keys = {};
    this._dx = 0;
    this._dy = 0;

    // Joystick state
    this.joystick = {
      active: false,
      cx: 0, cy: 0,
      px: 0, py: 0,
      dx: 0, dy: 0,
      touchId: -1,
    };

    this._clicks = [];
    this._tapStart = null;
    this.mouseX = 0;
    this.mouseY = 0;
    this._wheelDelta = 0;
    this._isTouchDevice = false;

    this._setupKeyboard();
    this._setupTouch(canvas);
    this._setupClicks(canvas);
    this._setupMouse(canvas);
    this._setupWheel(canvas);
  }

  get dx() { return this._dx; }
  get dy() { return this._dy; }

  isMoving() {
    return this._dx !== 0 || this._dy !== 0;
  }

  getClicks() {
    const arr = this._clicks.slice();
    this._clicks.length = 0;
    return arr;
  }

  getWheelDelta() {
    const d = this._wheelDelta;
    this._wheelDelta = 0;
    return d;
  }

  _setupClicks(canvas) {
    canvas.addEventListener('click', (e) => {
      const rect = canvas.getBoundingClientRect();
      this._clicks.push({
        x: (e.clientX - rect.left) * (canvas.width / rect.width),
        y: (e.clientY - rect.top) * (canvas.height / rect.height),
        button: e.button,
      });
    });
  }

  _setupMouse(canvas) {
    canvas.addEventListener('mousemove', (e) => {
      const rect = canvas.getBoundingClientRect();
      this.mouseX = (e.clientX - rect.left) * (canvas.width / rect.width);
      this.mouseY = (e.clientY - rect.top) * (canvas.height / rect.height);
    });
    canvas.addEventListener('mouseleave', () => {
      this.mouseX = -1;
      this.mouseY = -1;
    });
  }

  _setupWheel(canvas) {
    canvas.addEventListener('wheel', (e) => {
      this._wheelDelta += e.deltaY;
    }, { passive: true });
  }

  _setupKeyboard() {
    const onDown = (e) => {
      const key = e.key.toLowerCase();
      if (['w','a','s','d','escape','p'].includes(key)) {
        e.preventDefault();
      }
      this.keys[key] = true;
      this._updateFromKeys();
    };
    const onUp = (e) => {
      const key = e.key.toLowerCase();
      this.keys[key] = false;
      this._updateFromKeys();
    };
    window.addEventListener('keydown', onDown);
    window.addEventListener('keyup', onUp);
  }

  _updateFromKeys() {
    let dx = 0, dy = 0;
    if (this.keys['w'] || this.keys['arrowup']) dy -= 1;
    if (this.keys['s'] || this.keys['arrowdown']) dy += 1;
    if (this.keys['a'] || this.keys['arrowleft']) dx -= 1;
    if (this.keys['d'] || this.keys['arrowright']) dx += 1;
    const len = Math.sqrt(dx * dx + dy * dy);
    if (len > 0) {
      this._dx = dx / len;
      this._dy = dy / len;
    } else {
      this._dx = 0;
      this._dy = 0;
    }
  }

  _setupTouch(canvas) {
    const js = this.joystick;

    canvas.addEventListener('touchstart', (e) => {
      e.preventDefault();
      if (js.active) return;
      const t = e.changedTouches[0];
      const rect = canvas.getBoundingClientRect();
      const scaleX = canvas.width / rect.width;
      const scaleY = canvas.height / rect.height;
      const tx = (t.clientX - rect.left) * scaleX;
      const ty = (t.clientY - rect.top) * scaleY;

      // Left half activates joystick
      if (tx <= canvas.width * 0.5) {
        js.active = true;
        js.touchId = t.identifier;
        js.cx = tx;
        js.cy = ty;
        js.px = tx;
        js.py = ty;
        this._updateJoystickDir();
        return;
      }

      // Right half: track tap start
      this._tapStart = { x: tx, y: ty, time: Date.now() };
    }, { passive: false });

    canvas.addEventListener('touchmove', (e) => {
      e.preventDefault();
      if (!js.active) return;
      for (let i = 0; i < e.changedTouches.length; i++) {
        const t = e.changedTouches[i];
        if (t.identifier !== js.touchId) continue;
        const rect = canvas.getBoundingClientRect();
        const scaleX = canvas.width / rect.width;
        const scaleY = canvas.height / rect.height;
        js.px = (t.clientX - rect.left) * scaleX;
        js.py = (t.clientY - rect.top) * scaleY;
        this._updateJoystickDir();
      }
    }, { passive: false });

    const endTouch = (e) => {
      // End joystick touch
      if (js.active) {
        for (let i = 0; i < e.changedTouches.length; i++) {
          if (e.changedTouches[i].identifier === js.touchId) {
            js.active = false;
            js.touchId = -1;
            js.dx = 0;
            js.dy = 0;
            this._dx = 0;
            this._dy = 0;
            break;
          }
        }
      }
      // Register tap if short enough
      if (this._tapStart && Date.now() - this._tapStart.time < 300) {
        this._clicks.push({ x: this._tapStart.x, y: this._tapStart.y });
      }
      this._tapStart = null;
    };
    canvas.addEventListener('touchend', endTouch);
    canvas.addEventListener('touchcancel', endTouch);
  }

  _updateJoystickDir() {
    const js = this.joystick;
    const maxDist = 60;
    let dx = js.px - js.cx;
    let dy = js.py - js.cy;
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist > maxDist) {
      dx = (dx / dist) * maxDist;
      dy = (dy / dist) * maxDist;
      js.px = js.cx + dx;
      js.py = js.cy + dy;
    }
    const len = Math.sqrt(dx * dx + dy * dy);
    if (len > 0) {
      js.dx = dx / len;
      js.dy = dy / len;
    } else {
      js.dx = 0;
      js.dy = 0;
    }
    this._dx = js.dx;
    this._dy = js.dy;
  }
}

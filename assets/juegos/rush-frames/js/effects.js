/* ============================================================
   Rush Frames — capa de "feel" (solo visual / audible)
   · Sfx:           chiptune 8-bit con Web Audio (osciladores)
   · ScreenShake:   sacudida SOLO en el render (nunca en la física)
   · Particles:     polvo al saltar/aterrizar, restos al morir…
   · JumpAssist:    marcador de aterrizaje + arco de puntos.
                    predictFlight() replica EXACTAMENTE el orden de
                    operaciones de player.js#update (acel → gravedad →
                    salto → eje X → eje Y) y el orden de checkRules
                    (caída → hazard → meta), así el marcador miente
                    cero: lo que dibuja es lo que va a pasar.

   REGLA DE ORO de este archivo: nada de esto toca player.x/y,
   velocidades, timers ni colisiones. El motor ni se entera.
   ============================================================ */
"use strict";

/* ---------- utilidades locales ---------- */

function _rand(a, b) {
  return a + Math.random() * (b - a);
}

/* Caja reutilizable para las pruebas AABB del predictor
   (sin alocar objetos dentro del bucle). */
const _box = { x: 0, y: 0, w: 0, h: 0 };

/* ============================================================
   Sfx — sonidos chiptune con Web Audio API
   El AudioContext se crea con el PRIMER gesto del usuario
   (política de autoplay); si no hay audio, el juego sigue
   mudo pero intacto. Tecla M para silenciar.
   ============================================================ */

const Sfx = {
  ctx: null,
  master: null,
  muted: false,
  unlocked: false,
  _noiseBuf: null,
  _hooked: false,

  /* Registra los "gestos" que habilitan el audio (keydown/pointer). */
  _attachHooks() {
    if (this._hooked) return;
    if (typeof window === "undefined" || typeof window.addEventListener !== "function") return;
    this._hooked = true;
    const onGesture = () => { this.unlock(); this.resume(); };
    window.addEventListener("keydown", onGesture, { capture: true });
    window.addEventListener("pointerdown", onGesture, { capture: true });
  },

  /* Crea el AudioContext (idempotente, a prueba de fallos). */
  unlock() {
    if (this.ctx || this.unlocked) return;
    try {
      const AC =
        typeof window !== "undefined" &&
        (window.AudioContext || window.webkitAudioContext);
      if (!AC) return; // entorno sin audio: silencio digno
      this.ctx = new AC();
      this.master = this.ctx.createGain();
      this.master.gain.value = 0.22;
      this.master.connect(this.ctx.destination);
      this.unlocked = true;
    } catch (e) {
      this.ctx = null;
      this.unlocked = false;
    }
  },

  /* Reanuda si el navegador suspendió el contexto. */
  resume() {
    try {
      if (this.ctx && this.ctx.state === "suspended") {
        const r = this.ctx.resume();
        if (r && typeof r.catch === "function") r.catch(() => {});
      }
    } catch (e) { /* noop */ }
  },

  toggleMuted() {
    this.muted = !this.muted;
    return this.muted;
  },

  /* Un oscilador con envolvente exp y glissando opcional. */
  _tone(o) {
    if (!this.ctx || this.muted) return;
    try {
      const c = this.ctx;
      const now = c.currentTime + (o.when || 0);
      const osc = c.createOscillator();
      const gain = c.createGain();
      osc.type = o.type || "square";
      osc.frequency.setValueAtTime(o.f0, now);
      if (o.f1 && o.f1 !== o.f0) {
        osc.frequency.exponentialRampToValueAtTime(Math.max(1, o.f1), now + o.t);
      }
      gain.gain.setValueAtTime(0.0001, now);
      gain.gain.linearRampToValueAtTime(o.vol, now + 0.005);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + o.t);
      osc.connect(gain);
      gain.connect(this.master);
      osc.start(now);
      osc.stop(now + o.t + 0.02);
    } catch (e) { /* el audio jamás tira el juego abajo */ }
  },

  /* Ráfaga de ruido filtrado (golpes). */
  _noise(dur, vol, cutoff) {
    if (!this.ctx || this.muted) return;
    try {
      const c = this.ctx;
      if (!this._noiseBuf) {
        this._noiseBuf = c.createBuffer(1, Math.floor(c.sampleRate * 0.2), c.sampleRate);
        const d = this._noiseBuf.getChannelData(0);
        for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
      }
      const src = c.createBufferSource();
      src.buffer = this._noiseBuf;
      const flt = c.createBiquadFilter();
      flt.type = "lowpass";
      flt.frequency.value = cutoff || 500;
      const gain = c.createGain();
      const now = c.currentTime;
      gain.gain.setValueAtTime(vol, now);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + dur);
      src.connect(flt);
      flt.connect(gain);
      gain.connect(this.master);
      src.start(now);
      src.stop(now + dur + 0.02);
    } catch (e) { /* noop */ }
  },

  /* ---- la banda sonora de la jam ---- */

  jump() {
    // despegue: square con glissando ascendente, 90 ms
    this._tone({ type: "square", f0: 185, f1: 460, t: 0.09, vol: 0.26 });
  },

  land(vyImpact) {
    // aterrizaje: triangle grave que baja; el volumen escala con el impacto
    const k = clamp((vyImpact - 300) / 600, 0, 1);
    this._tone({ type: "triangle", f0: 150, f1: 55, t: 0.09, vol: 0.28 + 0.24 * k });
  },

  die() {
    // muerte: wail descendente + golpe de ruido grave
    this._tone({ type: "square", f0: 330, f1: 42, t: 0.30, vol: 0.42 });
    this._noise(0.14, 0.30, 320);
  },

  win(isRecord) {
    // meta: arpegio ascendente (C5-E5-G5-C6); récord añade E6 y un brillo
    const notes = isRecord
      ? [523.25, 659.25, 783.99, 1046.5, 1318.5]
      : [523.25, 659.25, 783.99, 1046.5];
    notes.forEach((f, i) => {
      this._tone({ type: "square", f0: f, f1: f, t: 0.10, vol: 0.30, when: i * 0.075 });
    });
    if (isRecord) {
      this._tone({ type: "square", f0: 1568, f1: 1568, t: 0.18, vol: 0.26, when: notes.length * 0.075 });
    }
  },
};

Sfx._attachHooks();
if (typeof window !== "undefined") window.__rushSfx = Sfx;

/* alias global usado por game.js (const de script clásico) */
const sfx = Sfx;

/* ============================================================
   ScreenShake — la sacudida que NO desincroniza nada
   La física usa coordenadas de mundo; el shake solo entra en
   render() como ctx.translate() dentro de save()/restore().
   ============================================================ */

class ScreenShake {
  constructor() {
    this.amp = 0;       // amplitud máxima en px
    this.dur = 0;       // duración total
    this.t = 0;         // cuenta atrás
    this.triggers = 0;  // contador (diagnóstico/pruebas)
  }

  trigger(amp, dur) {
    this.amp = Math.max(this.amp, amp);
    this.dur = Math.max(this.dur, dur);
    this.t = this.dur;
    this.triggers++;
  }

  update(dt) {
    if (this.t > 0) this.t = Math.max(0, this.t - dt);
  }

  /* Offset para ESTE frame de render (decae cuadrático). */
  offset() {
    if (this.t <= 0 || this.dur <= 0) return { x: 0, y: 0 };
    const k = (this.t / this.dur) * (this.t / this.dur);
    const a = this.amp * k;
    return { x: (Math.random() * 2 - 1) * a, y: (Math.random() * 2 - 1) * a };
  }
}

/* ============================================================
   Particles — cuadraditos de la paleta, como todo el juego
   Se actualizan con el dt de RENDER (no con el paso de física):
   son puramente cosméticas.
   ============================================================ */

class Particles {
  constructor() {
    this.parts = [];
    this.spawned = 0; // total histórico (pruebas/diagnóstico)
  }

  _add(p) {
    p.max = p.life;
    this.parts.push(p);
    this.spawned++;
    if (this.parts.length > 260) this.parts.splice(0, this.parts.length - 260);
  }

  /* Despegue: polvo que sale despedido hacia abajo/atrás de los pies. */
  spawnJump(cx, feetY, dir) {
    for (let i = 0; i < 6; i++) {
      this._add({
        x: cx + _rand(-8, 8),
        y: feetY - _rand(0, 3),
        vx: -dir * _rand(30, 120) + _rand(-40, 40),
        vy: _rand(20, 90), // impulso hacia abajo
        g: 0,
        life: _rand(0.16, 0.26),
        size: Math.random() < 0.5 ? 2 : 3,
        color: Math.random() < 0.6 ? COLORS.player : COLORS.platform,
      });
    }
  }

  /* Aterrizaje: polvo horizontal que salpica según la fuerza del impacto. */
  spawnLand(cx, feetY, vyImpact) {
    const k = clamp((vyImpact - 300) / 600, 0, 1);
    const n = 5 + Math.round(5 * k);
    for (let i = 0; i < n; i++) {
      const side = i % 2 === 0 ? 1 : -1;
      this._add({
        x: cx + side * _rand(2, 10),
        y: feetY - 1,
        vx: side * _rand(40, 90 + 120 * k),
        vy: -_rand(10, 60 + 60 * k),
        g: 900,
        life: _rand(0.28, 0.45),
        size: Math.random() < 0.7 ? 2 : 3,
        color: Math.random() < 0.8 ? COLORS.platform : COLORS.player,
      });
    }
  }

  /* Muerte: estallido de restos en el punto exacto del golpe. */
  spawnDeath(cx, cy) {
    for (let i = 0; i < 16; i++) {
      const ang = Math.random() * Math.PI * 2;
      const sp = _rand(120, 340);
      this._add({
        x: cx,
        y: cy,
        vx: Math.cos(ang) * sp,
        vy: Math.sin(ang) * sp - 60,
        g: 1300,
        life: _rand(0.45, 0.7),
        size: Math.round(_rand(2, 5)),
        color: Math.random() < 0.6 ? COLORS.hazard : (Math.random() < 0.6 ? COLORS.platform : COLORS.player),
      });
    }
  }

  /* Meta: fuente de chispas verdes. */
  spawnGoal(cx, cy) {
    for (let i = 0; i < 14; i++) {
      this._add({
        x: cx + _rand(-10, 10),
        y: cy + _rand(-8, 8),
        vx: _rand(-130, 130),
        vy: -_rand(60, 240),
        g: 750,
        life: _rand(0.5, 0.8),
        size: Math.random() < 0.7 ? 2 : 4,
        color: Math.random() < 0.7 ? COLORS.goal : COLORS.platform,
      });
    }
  }

  clear() {
    this.parts.length = 0;
  }

  update(dt) {
    const ps = this.parts;
    for (let i = ps.length - 1; i >= 0; i--) {
      const p = ps[i];
      p.life -= dt;
      if (p.life <= 0) { ps.splice(i, 1); continue; }
      p.vy += p.g * dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
    }
  }

  draw(ctx) {
    const ps = this.parts;
    for (let i = 0; i < ps.length; i++) {
      const p = ps[i];
      ctx.globalAlpha = Math.max(0, p.life / p.max) * 0.85;
      ctx.fillStyle = p.color;
      ctx.fillRect(p.x - p.size / 2, p.y - p.size / 2, p.size, p.size);
    }
    ctx.globalAlpha = 1;
  }
}

/* ============================================================
   JumpAssist — la ayuda de lectura del salto
   Dos pistas, una por estado:
   · EN SUELO (o ventana de coyote): solo el MARCADOR de
     aterrizaje ("si salto ahora, caigo acá"). Se recalcula
     en cada frame mientras te movés: al soltar la dirección
     el marcador se pliega hacia vos — así se aprende el truco
     de soltar en el aire sin tutorial.
   · EN EL AIRE: el marcador + un ARCO DE PUNTOS tenue hacia
     adelante ("seguís por acá"). Aparece solo durante el
     vuelo: no compite con el suelo.
   Colores del marcador: ámbar = aterrizás · rojo = morís
   (¡hazard o caída!) · verde = tocás la meta.
   ============================================================ */

/* Predice el vuelo replicando el motor REAL, paso a paso.
   injectJump=true → "si salto en el próximo paso" (suelo/coyote).
   injectJump=false → continuación del vuelo actual.
   Devuelve { type: landing|deadly|goal|fell|timeout, x, y, points }. */
function predictFlight(player, level, input, injectJump) {
  const dt = FIXED_DT;
  const dir = (input.right ? 1 : 0) - (input.left ? 1 : 0);
  let x = player.x, y = player.y, vx = player.vx, vy = player.vy;
  const groundedNow = player.grounded;
  const points = [];
  const box = _box;
  box.w = player.w;
  box.h = player.h;
  const MAX_STEPS = 160; // ~1,33 s de vuelo: cubre cualquier arco posible

  const finish = (type, cx, cy) => {
    points.push({ x: cx, y: cy }); // el arco termina en el marcador
    return { type, x: cx, y: cy, points };
  };

  for (let step = 0; step < MAX_STEPS; step++) {
    /* --- input/aceleración + gravedad + salto: MISMO orden que player.js --- */
    if (step === 0 && injectJump) {
      // el paso del despegue: acelera con la física del estado actual…
      if (dir !== 0) {
        const a = groundedNow ? ACCEL_GROUND : ACCEL_AIR;
        vx = clamp(vx + dir * a * dt, -MOVE_SPEED, MOVE_SPEED);
      } else if (groundedNow && vx !== 0) {
        const dec = FRICTION * dt;
        vx = Math.abs(vx) <= dec ? 0 : vx - Math.sign(vx) * dec;
      }
      vy = JUMP_VELOCITY; // …y la gravedad de ese paso la pisa el salto
    } else {
      if (dir !== 0) {
        vx = clamp(vx + dir * ACCEL_AIR * dt, -MOVE_SPEED, MOVE_SPEED);
      } else if (vx !== 0) {
        const dec = ACCEL_AIR * 0.5 * dt;
        vx = Math.abs(vx) <= dec ? 0 : vx - Math.sign(vx) * dec;
      }
      vy = Math.min(vy + GRAVITY * dt, MAX_FALL_SPEED);
    }

    /* --- eje X (colisión primero X, luego Y: como el motor) --- */
    x += vx * dt;
    for (const p of level.platforms) {
      box.x = x; box.y = y;
      if (aabb(box, p)) {
        if (vx > 0) x = p.x - box.w;
        else if (vx < 0) x = p.x + p.width;
        vx = 0;
      }
    }

    /* --- eje Y (con snap de aterrizaje idéntico) --- */
    y += vy * dt;
    let landed = false;
    for (const p of level.platforms) {
      box.x = x; box.y = y;
      if (aabb(box, p)) {
        if (vy > 0) { y = p.y - box.h; vy = 0; landed = true; }
        else if (vy < 0) { y = p.y + p.height; vy = 0; }
      }
    }

    if (step % 6 === 0) points.push({ x: x + box.w / 2, y: y + box.h / 2 });

    /* --- reglas: MISMO orden que game.js#checkRules --- */
    if (y > CANVAS_HEIGHT + 80 || x < -100 || x > CANVAS_WIDTH + 100) {
      return finish("fell", x + box.w / 2, CANVAS_HEIGHT);
    }
    for (const hz of level.hazards) {
      box.x = x; box.y = y;
      if (aabb(box, hz)) return finish("deadly", x + box.w / 2, y + box.h);
    }
    box.x = x; box.y = y;
    if (aabb(box, level.goal)) return finish("goal", x + box.w / 2, y + box.h / 2);
    if (landed) return finish("landing", x + box.w / 2, y + box.h);
  }
  return { type: "timeout", x: x + box.w / 2, y: y + box.h, points };
}

class JumpAssist {
  constructor() {
    this.last = null; // última predicción (para pruebas/diagnóstico)
  }

  draw(ctx, player, level, input, time) {
    const canJump = player.grounded || player.coyoteTimer <= COYOTE_TIME;
    const res = predictFlight(player, level, input, canJump);
    this.last = res;
    this._drawMarker(ctx, res, time);
    if (!player.grounded && res.points.length > 3) this._drawDots(ctx, res.points);
  }

  /* Marcador de destino: elipse que respira. */
  _drawMarker(ctx, res, time) {
    const pulse = 0.5 + 0.5 * Math.sin(time * 5);
    if (res.type === "fell") {
      // caída al vacío: chevron rojo apuntando al borde inferior
      ctx.save();
      ctx.globalAlpha = 0.35 + 0.25 * pulse;
      ctx.fillStyle = COLORS.hazard;
      ctx.beginPath();
      ctx.moveTo(res.x - 7, res.y - 16);
      ctx.lineTo(res.x + 7, res.y - 16);
      ctx.lineTo(res.x, res.y - 5);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
      return;
    }
    let color;
    if (res.type === "landing") color = COLORS.player;
    else if (res.type === "deadly") color = COLORS.hazard;
    else if (res.type === "goal") color = COLORS.goal;
    else return; // timeout: sin marcador
    ctx.save();
    ctx.strokeStyle = color;
    ctx.fillStyle = color;
    ctx.lineWidth = 1.5;
    ctx.globalAlpha = 0.36 + 0.22 * pulse;
    ctx.beginPath();
    ctx.ellipse(res.x, res.y - 2, 13, 3.5, 0, 0, Math.PI * 2);
    ctx.stroke();
    ctx.globalAlpha = 0.10;
    ctx.fill();
    ctx.restore();
  }

  /* Arco fantasma: puntos ámbar que se desvanecen con la distancia. */
  _drawDots(ctx, points) {
    const start = 2; // saltar los pegados al jugador
    const n = Math.min(points.length, start + 14);
    if (n <= start) return;
    ctx.save();
    ctx.fillStyle = COLORS.player;
    for (let i = start; i < n; i++) {
      const t = (i - start) / Math.max(1, n - 1 - start);
      ctx.globalAlpha = 0.30 * (1 - t) + 0.06;
      const p = points[i];
      ctx.fillRect(p.x - 1.5, p.y - 1.5, 3, 3);
    }
    ctx.restore();
  }
}

/* ============================================================
   Rush Frames — núcleo del juego
   · Loop con física de paso fijo (120 Hz) y render por rAF
   · Timer: arranca con el primer input, se detiene en la meta
   · Muerte (caída o hazard) = reinicio instantáneo del nivel
   · Todo el gameplay se dibuja en un único <canvas>
   ============================================================ */
"use strict";

/* ---------- Game ---------- */

class Game {

  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d");
    this.reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    setupCanvasHiDPI(canvas, this.ctx);
    window.addEventListener("resize", () => setupCanvasHiDPI(canvas, this.ctx));

    this.keys = new Set();       // códigos de tecla actualmente pulsados
    this.state = "selector";     // selector | playing | finished
    this.level = null;
    this.levelIndex = 0;

    // timer (ms de performance.now())
    this.timerRunning = false;
    this.timerStart = 0;
    this.timerElapsed = 0;

    this.attempts = 1;     // intentos del nivel actual
    this.deathFlash = 0;   // destello rojo al morir (no bloquea input)
    this.finishTimer = 0;  // pequeña celebración en canvas antes del panel
    this.resultShown = false;
    this.resultData = null;
    this.time = 0;         // reloj de animaciones (pulso de la meta, etc.)
    this.accumulator = 0;  // acumulador del paso fijo

    this.player = new Player();

    // capa de "juice" (effects.js): partículas, screen shake y la
    // ayuda de lectura del salto. Solo LEEN el estado del jugador;
    // la física, el coyote time y el jump buffer quedan intactos.
    this.fx = {
      particles: new Particles(),
      shake: new ScreenShake(),
      assist: new JumpAssist(),
    };
    this.muteFlash = 0;       // aviso "sonido on/off" (tecla M)
    this.muteFlashText = "";

    this.ui = new UI({
      onSelectLevel: (i) => this.startLevel(i),
      onRetry: () => this.restartLevel(),
      onExit: () => this.showSelector(),
    });

    bindInput(this);
    this.showSelector();

    this.lastFrame = performance.now();
    requestAnimationFrame((t) => this.loop(t));
  }

  /* ---------- flujo de pantallas ---------- */

  showSelector() {
    this.state = "selector";
    this.level = null;
    this.keys.clear();
    this.ui.showSelector(); // reconstruye los mejores tiempos
  }

  startLevel(index) {
    this.levelIndex = index;
    this.level = LEVELS[index];
    this.attempts = 1;
    this.fx.particles.clear(); // intento nuevo, aire limpio
    this.resetRun();
    this.state = "playing";
    this.ui.showGame();
  }

  /* Reinicio manual (tecla R o botón "Reintentar"). */
  restartLevel() {
    if (this.state !== "playing" && this.state !== "finished") return;
    this.attempts++;
    this.fx.particles.clear(); // reinicio manual: sin restos viejos
    this.resetRun();
    this.state = "playing";
    this.ui.showGame();
  }

  /* Vuelve al spawn con el timer a cero, esperando input. */
  resetRun() {
    const s = this.level.spawn;
    this.player.reset(s.x, s.y);
    this.timerRunning = false;
    this.timerElapsed = 0;
    this.deathFlash = 0;
    this.resultShown = false;
    this.resultData = null;
    this.accumulator = 0;
  }

  /* ---------- muerte y victoria ---------- */

  /* Caer del canvas o tocar un hazard: reinicio instantáneo,
     sin confirmación ni pantallas intermedias. */
  die() {
    // feedback de impacto: sonido + shake (solo render) + restos
    // en el punto exacto del golpe, capturados ANTES del reset.
    const hitX = this.player.x + this.player.w / 2;
    const hitY = this.player.y + this.player.h / 2;
    sfx.die();
    this.fx.shake.trigger(5, 0.26);
    this.fx.particles.spawnDeath(hitX, hitY);
    this.attempts++;
    this.resetRun();
    this.deathFlash = 0.14; // destello informativo; el control ya volvió
  }

  /* Tocar la meta: congela la física y guarda el récord. */
  finish() {
    this.state = "finished";
    this.timerElapsed = this.timerRunning ? performance.now() - this.timerStart : 0;
    this.timerRunning = false;
    this.finishTimer = 0.45;
    this.resultShown = false;

    const id = this.level.id;
    const prevBest = getBestTime(id);
    const isRecord = prevBest === null || this.timerElapsed < prevBest;
    if (isRecord) setBestTime(id, Math.round(this.timerElapsed));

    this.resultData = {
      index: this.levelIndex,
      level: this.level,
      time: this.timerElapsed,
      best: isRecord ? this.timerElapsed : prevBest,
      isRecord,
      attempts: this.attempts,
    };

    // celebración: arpegio (con brillo extra si es récord) + chispas
    sfx.win(isRecord);
    this.fx.particles.spawnGoal(
      this.level.goal.x + this.level.goal.width / 2,
      this.level.goal.y + this.level.goal.height / 2
    );
  }

  /* ---------- timer ---------- */

  startTimerIfNeeded() {
    if (this.state === "playing" && !this.timerRunning) {
      this.timerRunning = true;
      this.timerStart = performance.now();
    }
  }

  currentElapsed() {
    return this.timerRunning ? performance.now() - this.timerStart : this.timerElapsed;
  }

  /* ---------- reglas del nivel (tras cada paso de física) ---------- */

  checkRules() {
    const p = this.player;
    // caer fuera del canvas (con margen lateral también)
    if (p.y > CANVAS_HEIGHT + 80 || p.x < -100 || p.x > CANVAS_WIDTH + 100) {
      this.die();
      return;
    }
    // hazards: muerte instantánea
    for (const hz of this.level.hazards) {
      if (aabb(p, hz)) { this.die(); return; }
    }
    // meta
    if (aabb(p, this.level.goal)) { this.finish(); }
  }

  readInput() {
    const k = this.keys;
    return {
      left: KEY_LEFT.some((c) => k.has(c)),
      right: KEY_RIGHT.some((c) => k.has(c)),
    };
  }

  /* ---------- loop principal ---------- */

  loop(now) {
    requestAnimationFrame((t) => this.loop(t));
    let dt = (now - this.lastFrame) / 1000;
    this.lastFrame = now;
    if (!(dt > 0)) return;       // timestamp anómalo
    if (dt > 0.25) dt = 0.25;    // pestaña en segundo plano

    this.time += dt;
    if (this.deathFlash > 0) this.deathFlash = Math.max(0, this.deathFlash - dt);

    // efectos puramente visuales: viven con el dt de RENDER,
    // nunca dentro del paso fijo de física.
    this.fx.particles.update(dt);
    this.fx.shake.update(dt);
    if (this.muteFlash > 0) this.muteFlash = Math.max(0, this.muteFlash - dt);

    if (this.state === "playing") {
      // teclas mantenidas a través de una muerte también arrancan el timer
      const held = this.readInput();
      if (!this.timerRunning && (held.left || held.right)) this.startTimerIfNeeded();

      // física en pasos fijos (inmune a la variabilidad de framerate)
      this.accumulator += dt;
      const input = this.readInput();
      let steps = 0;
      while (this.accumulator >= FIXED_DT && steps < 10) {
        // lectura pasiva para el juice: se captura ANTES de update()
        // y se compara DESPUÉS; nada de esto altera la física.
        const wasGrounded = this.player.grounded;
        const vyBefore = this.player.vy;
        this.player.update(FIXED_DT, this.level, input);

        // despegue detectado: vy es JUMP_VELOCITY exactamente un paso
        // (la gravedad del paso siguiente ya lo cambia) — sin falsos
        // positivos ni dobles disparos, también con jump buffer.
        if (this.player.vy === JUMP_VELOCITY) {
          sfx.jump();
          this.fx.particles.spawnJump(
            this.player.x + this.player.w / 2,
            this.player.y + this.player.h,
            Math.sign(this.player.vx) || this.player.facing
          );
        }
        // aterrizaje con impacto real (umbral 300: sin spam en
        // micro-caídas de coyote)
        if (this.player.grounded && !wasGrounded && vyBefore > 300) {
          sfx.land(vyBefore);
          this.fx.particles.spawnLand(
            this.player.x + this.player.w / 2,
            this.player.y + this.player.h,
            vyBefore
          );
        }

        this.checkRules(); // puede cambiar el estado (muerte o meta)
        if (this.state !== "playing") { this.accumulator = 0; break; }
        this.accumulator -= FIXED_DT;
        steps++;
      }
      if (steps >= 10) this.accumulator = 0; // anti-espiral de la muerte
    } else if (this.state === "finished") {
      // celebración breve en canvas y luego el panel de resultado
      if (!this.resultShown) {
        this.finishTimer -= dt;
        if (this.finishTimer <= 0) {
          this.resultShown = true;
          this.ui.showResult(this.resultData);
        }
      }
    } else {
      this.accumulator = 0;
    }

    this.render();
  }

  /* ---------- render ---------- */

  render() {
    const ctx = this.ctx;
    ctx.fillStyle = COLORS.background;
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    if (!this.level) return; // pantalla de selector: no hay nivel cargado

    // capa MUNDO: el screen shake entra SOLO aquí, como translate
    // de render dentro de save/restore. Las coordenadas de colisión
    // (player.x/y, plataformas, hazards) viven en el mundo y jamás
    // se ven desplazadas — el motor ni se entera del temblor.
    const sh = this.reducedMotion.matches ? { x: 0, y: 0 } : this.fx.shake.offset();
    ctx.save();
    ctx.translate(sh.x, sh.y);

    drawGrid(ctx);
    drawPlatforms(ctx, this.level.platforms);
    drawHazards(ctx, this.level.hazards);
    drawGoal(ctx, this.level.goal, this.time);

    // ayuda de lectura del salto: debajo de jugador y estela
    if (this.state === "playing") {
      this.fx.assist.draw(ctx, this.player, this.level, this.readInput(), this.time);
    }

    if (!this.reducedMotion.matches) drawTrail(ctx, this.player.trail);
    drawPlayer(ctx, this.player);
    if (!this.reducedMotion.matches) this.fx.particles.draw(ctx);

    ctx.restore(); // fin del shake

    if (this.deathFlash > 0 && !this.reducedMotion.matches) {
      ctx.fillStyle = COLORS.hazard;
      ctx.globalAlpha = (this.deathFlash / 0.14) * 0.25;
      ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
      ctx.globalAlpha = 1;
    }

    drawHUD(ctx, this);
  }
}

/* ---------- dibujo: helpers ---------- */

/* Escala nítida en pantallas HiDPI; coordenadas lógicas 800x450. */
function setupCanvasHiDPI(canvas, ctx) {
  const dpr = window.devicePixelRatio || 1;
  canvas.width = Math.round(CANVAS_WIDTH * dpr);
  canvas.height = Math.round(CANVAS_HEIGHT * dpr);
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
}

function drawGrid(ctx) {
  ctx.save();
  ctx.strokeStyle = "rgba(244, 241, 234, 0.04)";
  ctx.lineWidth = 1;
  ctx.beginPath();
  for (let x = 50; x < CANVAS_WIDTH; x += 50) {
    ctx.moveTo(x + 0.5, 0);
    ctx.lineTo(x + 0.5, CANVAS_HEIGHT);
  }
  for (let y = 50; y < CANVAS_HEIGHT; y += 50) {
    ctx.moveTo(0, y + 0.5);
    ctx.lineTo(CANVAS_WIDTH, y + 0.5);
  }
  ctx.stroke();
  ctx.restore();
}

function drawPlatforms(ctx, platforms) {
  ctx.fillStyle = COLORS.platform;
  for (const p of platforms) {
    ctx.fillRect(p.x, p.y, p.width, p.height);
  }
}

/* Los hazards se dibujan como filas de pinchos triangulares
   dentro de su rectángulo de colisión. */
function drawHazards(ctx, hazards) {
  ctx.fillStyle = COLORS.hazard;
  for (const hz of hazards) {
    const n = Math.max(1, Math.round(hz.width / 14));
    const tw = hz.width / n;
    ctx.beginPath();
    ctx.moveTo(hz.x, hz.y + hz.height);
    for (let i = 0; i < n; i++) {
      ctx.lineTo(hz.x + i * tw + tw / 2, hz.y);
      ctx.lineTo(hz.x + (i + 1) * tw, hz.y + hz.height);
    }
    ctx.closePath();
    ctx.fill();
  }
}

function drawGoal(ctx, goal, time) {
  const pulse = 0.5 + 0.5 * Math.sin(time * 3.2);
  ctx.save();
  // área de meta con pulso
  ctx.strokeStyle = COLORS.goal;
  ctx.lineWidth = 2;
  ctx.globalAlpha = 0.18 + 0.30 * pulse;
  ctx.strokeRect(goal.x + 1, goal.y + 1, goal.width - 2, goal.height - 2);
  ctx.globalAlpha = 0.07 + 0.10 * pulse;
  ctx.fillRect(goal.x, goal.y, goal.width, goal.height);
  // mástil + banderín ondulante
  const cx = goal.x + goal.width / 2;
  const poleTop = goal.y - 22;
  ctx.globalAlpha = 1;
  ctx.fillStyle = COLORS.goal;
  ctx.fillRect(cx - 1.5, poleTop, 3, goal.y + goal.height - poleTop);
  const wob = Math.sin(time * 6) * 3;
  ctx.beginPath();
  ctx.moveTo(cx + 1.5, poleTop);
  ctx.lineTo(cx + 24, poleTop + 6 + wob);
  ctx.lineTo(cx + 1.5, poleTop + 12);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

function drawTrail(ctx, trail) {
  ctx.fillStyle = COLORS.player;
  for (let i = 0; i < trail.length; i++) {
    const t = trail[i];
    ctx.globalAlpha = ((i + 1) / trail.length) * 0.2;
    ctx.fillRect(t.x + 4, t.y + 4, PLAYER_WIDTH - 8, PLAYER_HEIGHT - 8);
  }
  ctx.globalAlpha = 1;
}

function drawPlayer(ctx, p) {
  const cx = p.x + p.w / 2;
  const feet = p.y + p.h; // ancla: los pies quedan fijos al escalar
  const scaleX = 1 - 0.22 * p.squash;
  const scaleY = 1 + 0.28 * p.squash;
  ctx.save();
  ctx.translate(cx, feet);
  ctx.scale(scaleX, scaleY);
  ctx.fillStyle = COLORS.player;
  ctx.fillRect(-p.w / 2, -p.h, p.w, p.h);
  // ojo minimalista mirando hacia donde corre
  ctx.fillStyle = COLORS.background;
  const eyeX = p.facing >= 0 ? p.w / 2 - 7 : -p.w / 2 + 3;
  ctx.fillRect(eyeX, -p.h + 8, 4, 5);
  ctx.restore();
}

function drawHUD(ctx, game) {
  const lvl = game.level;
  ctx.save();
  ctx.textBaseline = "top";

  // timer en tiempo real (mm:ss.mmm)
  ctx.font = "700 24px " + FONT_MONO;
  ctx.textAlign = "center";
  ctx.fillStyle = game.timerRunning || game.state === "finished" ? COLORS.text : COLORS.textDim;
  ctx.fillText(formatTime(game.currentElapsed()), CANVAS_WIDTH / 2, 14);

  // mejor tiempo personal (si existe)
  const best = getBestTime(lvl.id);
  if (best !== null) {
    ctx.font = "11px " + FONT_MONO;
    ctx.fillStyle = COLORS.textDim;
    ctx.fillText("PB " + formatTime(best), CANVAS_WIDTH / 2, 44);
  }

  // pista breve del nivel
  if (lvl.hint) {
    ctx.font = "11px " + FONT_MAIN;
    ctx.fillStyle = COLORS.textDim;
    ctx.fillText(lvl.hint, CANVAS_WIDTH / 2, best !== null ? 62 : 58);
  }

  // nombre del nivel e intentos
  ctx.textAlign = "left";
  ctx.font = "12px " + FONT_MAIN;
  ctx.fillStyle = COLORS.textDim;
  ctx.fillText("Nivel " + (game.levelIndex + 1) + " · " + lvl.name, 14, 14);
  ctx.font = "11px " + FONT_MONO;
  ctx.fillText("Intentos: " + game.attempts, 14, CANVAS_HEIGHT - 24);

  // recordatorio de teclas
  ctx.textAlign = "right";
  ctx.fillText("R reiniciar · Esc salir · M sonido", CANVAS_WIDTH - 14, CANVAS_HEIGHT - 24);
  ctx.restore();

  // aviso de silencio (tecla M) — se desvanece solo
  if (game.muteFlash > 0 && game.muteFlashText) {
    ctx.save();
    ctx.globalAlpha = Math.min(1, game.muteFlash);
    ctx.textAlign = "center";
    ctx.font = "700 12px " + FONT_MONO;
    ctx.fillStyle = COLORS.text;
    ctx.fillText(game.muteFlashText, CANVAS_WIDTH / 2, 84);
    ctx.restore();
  }

  // overlay de victoria (breve, antes del panel DOM)
  if (game.state === "finished") {
    ctx.save();
    ctx.textAlign = "center";
    ctx.textBaseline = "top";
    ctx.fillStyle = COLORS.goal;
    ctx.font = "800 30px " + FONT_MAIN;
    ctx.fillText("¡COMPLETADO!", CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 48);
    ctx.fillStyle = COLORS.text;
    ctx.font = "700 20px " + FONT_MONO;
    ctx.fillText(formatTime(game.timerElapsed), CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 8);
    ctx.restore();
  }
}

/* ---------- entrada de teclado ---------- */

function bindInput(game) {
  const controls = document.querySelector(".touch-controls");
  controls.querySelectorAll("[data-move]").forEach((button) => {
    const code = button.dataset.move;
    button.addEventListener("pointerdown", (event) => {
      button.setPointerCapture(event.pointerId);
      game.keys.add(code);
      game.startTimerIfNeeded();
    });
    button.addEventListener("lostpointercapture", () => game.keys.delete(code));
  });
  controls.querySelector("[data-jump]").addEventListener("pointerdown", () => {
    game.startTimerIfNeeded();
    game.player.queueJump();
  });
  controls.querySelector("[data-selector]").addEventListener("click", () => game.showSelector());

  window.addEventListener("keydown", (e) => {
    if (e.target.closest("a") || (e.target.closest("button") && ["Enter","Space"].includes(e.code))) return;
    const code = e.code;
    const isMove = KEY_LEFT.includes(code) || KEY_RIGHT.includes(code);
    const isJump = KEY_JUMP.includes(code);

    // silenciar/activar el sonido (capa de UI, no gameplay)
    if (code === "KeyM") {
      const muted = sfx.toggleMuted();
      game.muteFlash = 1.4;
      game.muteFlashText = muted ? "Sonido apagado" : "Sonido encendido";
      return;
    }

    if (game.state === "playing") {
      if (isMove || isJump) {
        e.preventDefault(); // sin scroll con espacio/flechas durante el juego
        game.keys.add(code);
        game.startTimerIfNeeded(); // el timer arranca en el PRIMER input
        if (isJump && !e.repeat) game.player.queueJump(); // buffer de salto
      } else if (KEY_RESTART.includes(code)) {
        game.restartLevel();
      } else if (KEY_EXIT.includes(code)) {
        game.showSelector();
      }
    } else if (game.state === "finished") {
      if (KEY_RESTART.includes(code) || code === "Enter") {
        game.restartLevel();
      } else if (KEY_EXIT.includes(code)) {
        game.showSelector();
      }
    } else if (game.state === "selector") {
      // atajo de teclado: 1/2/3 (y teclado numérico) para entrar directo
      let n = null;
      if (code.startsWith("Digit")) n = parseInt(code.slice(5), 10);
      else if (code.startsWith("Numpad")) n = parseInt(code.slice(6), 10);
      if (n !== null && n >= 1 && n <= LEVELS.length) game.startLevel(n - 1);
    }
  });

  window.addEventListener("keyup", (e) => game.keys.delete(e.code));

  // al perder el foco (alt+tab) soltar todo: evita teclas "pegadas"
  window.addEventListener("blur", () => game.keys.clear());
}

/* ---------- arranque ---------- */

(function main() {
  const canvas = document.getElementById("game-canvas");
  const game = new Game(canvas);
  window.game = game; // expuesto para depuración/pruebas
})();

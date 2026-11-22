/* ============================================================
   Rush Frames — jugador
   El corazón del "game feel":
   · Coyote time (saltar hasta 100 ms después de dejar el suelo)
   · Jump buffer (pre-saltar hasta 100 ms antes de aterrizar)
   · Colisión AABB por ejes: primero X, luego Y
   · Squash & stretch y estela: puramente visuales
   ============================================================ */
"use strict";

class Player {

  constructor() {
    this.w = PLAYER_WIDTH;
    this.h = PLAYER_HEIGHT;
    this.reset(0, 0);
  }

  /* Coloca al jugador en el spawn de un nivel (o lo reinicia). */
  reset(x, y) {
    this.x = x;
    this.y = y;
    this.vx = 0;
    this.vy = 0;
    this.grounded = false;      // ¿apoyado en una plataforma este paso?
    this.coyoteTimer = 0;      // tiempo transcurrido desde el suelo
    this.jumpBufferTimer = 0;  // cuenta atrás del buffer de salto
    this.facing = 1;           // 1 = derecha, -1 = izquierda
    this.trail = [];           // posiciones recientes (efecto "rush")
    this.squash = 0;           // -1 aplastado · 0 neutro · 1 estirado
  }

  /* Llamado en el evento keydown de salto (sin auto-repeat). */
  queueJump() {
    this.jumpBufferTimer = JUMP_BUFFER_TIME;
  }

  /* Un paso de física de duración fija (FIXED_DT). */
  update(dt, level, input) {
    const wasGrounded = this.grounded;

    /* ---- Input horizontal: aceleración y fricción ---- */
    const dir = (input.right ? 1 : 0) - (input.left ? 1 : 0);
    if (dir !== 0) {
      this.facing = dir;
      this.vx += dir * (this.grounded ? ACCEL_GROUND : ACCEL_AIR) * dt;
      this.vx = clamp(this.vx, -MOVE_SPEED, MOVE_SPEED);
    } else {
      // sin input: frena (fricción en suelo, deriva leve en el aire)
      const dec = (this.grounded ? FRICTION : ACCEL_AIR * 0.5) * dt;
      if (Math.abs(this.vx) <= dec) this.vx = 0;
      else this.vx -= Math.sign(this.vx) * dec;
    }

    /* ---- Gravedad constante ---- */
    this.vy = Math.min(this.vy + GRAVITY * dt, MAX_FALL_SPEED);

    /* ---- SALTO: la combinación buffer + coyote ----
       El buffer se consume solo si EN ESTE paso es posible saltar
       (en suelo, o dentro de la ventana de coyote). Si el jugador
       pre-saltó en el aire, el buffer queda vivo hasta aterrizar. */
    this.jumpBufferTimer = Math.max(0, this.jumpBufferTimer - dt);
    const canJump = this.grounded || this.coyoteTimer <= COYOTE_TIME;
    if (this.jumpBufferTimer > 0 && canJump) {
      this.vy = JUMP_VELOCITY;                  // velocidad de salto fija
      this.jumpBufferTimer = 0;                 // buffer consumido
      this.grounded = false;
      this.coyoteTimer = COYOTE_TIME + 1;       // consume el coyote: sin doble salto
      this.squash = 1;                          // estirado al despegar
    }

    /* ---- Movimiento + colisión, eje X ---- */
    this.x += this.vx * dt;
    for (const p of level.platforms) {
      if (aabb(this, p)) {
        if (this.vx > 0) this.x = p.x - this.w;        // choca por la derecha
        else if (this.vx < 0) this.x = p.x + p.width;  // choca por la izquierda
        this.vx = 0;
      }
    }

    /* ---- Movimiento + colisión, eje Y ---- */
    const vyPrev = this.vy; // velocidad de impacto para el squash
    this.y += this.vy * dt;
    this.grounded = false;
    for (const p of level.platforms) {
      if (aabb(this, p)) {
        if (this.vy > 0) {
          // cayendo → aterrizar encima de la plataforma
          this.y = p.y - this.h;
          this.vy = 0;
          this.grounded = true;
          if (!wasGrounded && vyPrev > 500) this.squash = -1; // aplastado al aterrizar
        } else if (this.vy < 0) {
          // subiendo → golpe de cabeza contra el fondo de la plataforma
          this.y = p.y + p.height;
          this.vy = 0;
        }
      }
    }

    /* ---- Coyote: cronómetro desde la última vez en el suelo ---- */
    if (this.grounded) this.coyoteTimer = 0;
    else this.coyoteTimer += dt;

    /* ---- Squash & stretch decae (~130 ms) ---- */
    if (this.squash !== 0) {
      const decay = dt / 0.13;
      this.squash -= Math.sign(this.squash) * Math.min(Math.abs(this.squash), decay);
    }

    /* ---- Estela de movimiento ---- */
    const speed = Math.hypot(this.vx, this.vy);
    if (speed > 80) {
      this.trail.push({ x: this.x, y: this.y });
      if (this.trail.length > TRAIL_LENGTH) this.trail.shift();
    } else if (this.trail.length > 0) {
      this.trail.shift(); // al frenar, la estela se disuelve
    }
  }
}

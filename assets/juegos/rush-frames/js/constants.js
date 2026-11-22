/* ============================================================
   Rush Frames — constantes y utilidades compartidas
   Se carga primero: todo el resto depende de este archivo.
   ============================================================ */
"use strict";

/* ---------- Canvas ---------- */
const CANVAS_WIDTH = 800;
const CANVAS_HEIGHT = 450;

/* ---------- Física ----------
   Valores ajustados para que el salto se sienta "punchy":
   - altura de salto ≈ 147 px (v² / 2g)
   - tiempo total en el aire ≈ 0.59 s
   - alcance horizontal máx. ≈ 200 px a velocidad completa */
const GRAVITY = 3400;        // px/s² (constante, sin caída variable)
const MAX_FALL_SPEED = 900;  // px/s (tope de caída)
const MOVE_SPEED = 340;      // px/s (velocidad horizontal máx.)
const ACCEL_GROUND = 4200;   // px/s² (aceleración en suelo)
const ACCEL_AIR = 3800;      // px/s² (control aéreo, casi total)
const FRICTION = 4800;       // px/s² (frenado en suelo sin input)
const JUMP_VELOCITY = -1000; // px/s (velocidad de salto FIJA)

/* ---------- El "game feel" que importa ----------
   COYOTE TIME: tras dejar una plataforma, el jugador todavía
   puede saltar durante esta ventana (~100 ms).
   JUMP BUFFER: si pulsa salto hasta esta ventana (~100 ms)
   antes de tocar suelo, el salto se ejecuta al aterrizar. */
const COYOTE_TIME = 0.1;        // segundos
const JUMP_BUFFER_TIME = 0.1;   // segundos

/* Paso fijo de física: 120 Hz. A 900 px/s de caída el jugador
   avanza 7.5 px por paso, imposible atravesar plataformas de 16 px. */
const FIXED_DT = 1 / 120;

/* ---------- Jugador ---------- */
const PLAYER_WIDTH = 24;
const PLAYER_HEIGHT = 30;
const TRAIL_LENGTH = 14; // estelas dibujadas (identidad "Rush Frames")

/* ---------- Paleta (fondo + 4 acentos) ----------
   Cámbiala aquí y todo el juego la sigue. */
const COLORS = {
  background: "#131317",
  platform:   "#f4f1ea",
  player:     "#ffc15e",
  goal:       "#3ee6a8",
  hazard:     "#ff5d5d",
  text:       "#f4f1ea",
  textDim:    "rgba(244, 241, 234, 0.55)",
};

const FONT_MAIN = "'Segoe UI', 'Helvetica Neue', Arial, sans-serif";
const FONT_MONO = "ui-monospace, 'Cascadia Code', 'JetBrains Mono', Consolas, monospace";

/* ---------- Teclas ---------- */
const KEY_LEFT = ["ArrowLeft", "KeyA"];
const KEY_RIGHT = ["ArrowRight", "KeyD"];
const KEY_JUMP = ["Space", "KeyW", "ArrowUp"]; // espacio es el principal
const KEY_RESTART = ["KeyR"];
const KEY_EXIT = ["Escape"];

/* ============================================================
   Utilidades compartidas
   ============================================================ */

/* localStorage puede estar bloqueado en ciertos contextos file://;
   este wrapper degrada a memoria sin romper el juego. */
const SafeStorage = {
  _fallback: new Map(),

  get(key) {
    try {
      const v = localStorage.getItem(key);
      if (v !== null) return v;
    } catch (e) { /* almacenamiento no disponible */ }
    return this._fallback.has(key) ? this._fallback.get(key) : null;
  },

  set(key, value) {
    this._fallback.set(key, value); // espejo en memoria por si localStorage falla
    try { localStorage.setItem(key, value); } catch (e) { /* noop */ }
  },
};

function bestTimeKey(levelId) {
  return "bestTime_" + levelId;
}

/* Devuelve el mejor tiempo en ms (número) o null si no hay récord. */
function getBestTime(levelId) {
  const v = SafeStorage.get(bestTimeKey(levelId));
  return v === null ? null : Number(v);
}

function setBestTime(levelId, ms) {
  SafeStorage.set(bestTimeKey(levelId), String(ms));
}

/* Formato speedrun: mm:ss.mmm */
function formatTime(ms) {
  if (ms === null || ms === undefined || !isFinite(ms)) return "—";
  const total = Math.max(0, Math.floor(ms));
  const m = Math.floor(total / 60000);
  const s = Math.floor((total % 60000) / 1000);
  const frac = total % 1000;
  return (
    String(m).padStart(2, "0") + ":" +
    String(s).padStart(2, "0") + "." +
    String(frac).padStart(3, "0")
  );
}

/* AABB genérico: acepta {w,h} (jugador) y {width,height} (nivel). */
function aabb(a, b) {
  const aw = a.w !== undefined ? a.w : a.width;
  const ah = a.h !== undefined ? a.h : a.height;
  const bw = b.w !== undefined ? b.w : b.width;
  const bh = b.h !== undefined ? b.h : b.height;
  return a.x < b.x + bw && a.x + aw > b.x && a.y < b.y + bh && a.y + ah > b.y;
}

function clamp(v, min, max) {
  return v < min ? min : v > max ? max : v;
}

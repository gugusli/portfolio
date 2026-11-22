/* ============================================================
   Rush Frames — interfaz DOM
   Solo gestiona las pantallas que NO son gameplay:
   · Selector de nivel (con mejores tiempos de localStorage)
   · Pantalla de resultado (tiempo final, PB, récord, reintentar)
   El gameplay vive en el canvas y en game.js.
   ============================================================ */
"use strict";

class UI {

  /* handlers: { onSelectLevel(index), onRetry(), onExit() } */
  constructor(handlers) {
    this.handlers = handlers;
    this.el = {
      selector:       document.getElementById("screen-selector"),
      game:           document.getElementById("screen-game"),
      result:         document.getElementById("screen-result"),
      levelList:      document.getElementById("level-list"),
      resultLevel:    document.getElementById("result-level"),
      resultRecord:   document.getElementById("result-record"),
      resultTime:     document.getElementById("result-time"),
      resultBest:     document.getElementById("result-best"),
      resultAttempts: document.getElementById("result-attempts"),
      btnRetry:       document.getElementById("btn-retry"),
      btnExit:        document.getElementById("btn-exit"),
    };

    this.el.btnRetry.addEventListener("click", (e) => {
      e.currentTarget.blur(); // sin foco residual: Espacio no re-activará el botón
      handlers.onRetry();
    });
    this.el.btnExit.addEventListener("click", (e) => {
      e.currentTarget.blur();
      handlers.onExit();
    });

    // Atajo "0" para el nivel 10 (1-9 los maneja game.js; la tecla 0
    // no tenía uso con 3 niveles). Solo activo en la pantalla del
    // selector. Vive acá, en la capa de UI, sin tocar el motor.
    window.addEventListener("keydown", (e) => {
      if (e.code !== "Digit0" && e.code !== "Numpad0") return;
      if (this.el.selector.classList.contains("hidden")) return;
      if (typeof LEVELS !== "undefined" && LEVELS.length >= 10) {
        e.preventDefault();
        this.handlers.onSelectLevel(9);
      }
    });
  }

  /* Cambia la pantalla visible (selector | game | result). */
  show(name) {
    for (const key of ["selector", "game", "result"]) {
      this.el[key].classList.toggle("hidden", key !== name);
    }
  }

  /* Construye el selector con un botón por nivel + su PB. */
  showSelector() {
    const list = this.el.levelList;
    list.innerHTML = "";

    LEVELS.forEach((lvl, i) => {
      const best = getBestTime(lvl.id);
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "level-btn";
      btn.innerHTML =
        '<span class="level-meta">' +
          '<span class="level-number">Nivel ' + (i + 1) + "</span>" +
          '<span class="level-name">' + lvl.name + "</span>" +
        "</span>" +
        '<span class="level-best' + (best === null ? " empty" : "") + '">' +
          (best === null ? "Sin récord" : "PB " + formatTime(best)) +
        "</span>";
      btn.addEventListener("click", () => this.handlers.onSelectLevel(i));
      list.appendChild(btn);
    });

    this.show("selector");
  }

  /* Muestra el canvas y suelta el foco del botón pulsado. */
  showGame() {
    this.show("game");
    const active = document.activeElement;
    if (active && typeof active.blur === "function") active.blur();
  }

  /* data: { index, level, time, best, isRecord, attempts } */
  showResult(data) {
    this.el.resultLevel.textContent = "Nivel " + (data.index + 1) + " · " + data.level.name;
    this.el.resultTime.textContent = formatTime(data.time);
    this.el.resultBest.textContent = formatTime(data.best);
    this.el.resultRecord.classList.toggle("hidden", !data.isRecord);
    this.el.resultAttempts.textContent = "Intentos: " + data.attempts;
    this.show("result");
  }
}

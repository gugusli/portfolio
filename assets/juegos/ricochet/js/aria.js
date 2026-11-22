// js/aria.js
// Módulo ARIA: anuncios para screen readers + aria-label en canvas
// Resuelve la accesibilidad (WCAG 2.1 nivel AA) documentada en auditoría

const ARIA = {
  _liveRegion: null,

  init() {
    // Crear live region para anuncios de screen reader
    this._liveRegion = document.createElement('div');
    this._liveRegion.setAttribute('aria-live', 'polite');
    this._liveRegion.setAttribute('aria-atomic', 'true');
    this._liveRegion.setAttribute('role', 'status');
    this._liveRegion.style.position = 'absolute';
    this._liveRegion.style.width = '1px';
    this._liveRegion.style.height = '1px';
    this._liveRegion.style.padding = '0';
    this._liveRegion.style.margin = '-1px';
    this._liveRegion.style.overflow = 'hidden';
    this._liveRegion.style.clip = 'rect(0,0,0,0)';
    this._liveRegion.style.whiteSpace = 'nowrap';
    this._liveRegion.style.border = '0';
    document.body.appendChild(this._liveRegion);

    // Añadir aria-label al canvas principal
    const canvas = document.getElementById('c');
    if (canvas) {
      canvas.setAttribute('role', 'application');
      canvas.setAttribute('aria-label',
        'Ricochet Blitz game. Drag to aim, tap to shoot, press P or Escape to pause, ' +
        'press R to retry after game over, press Space or Enter to fire.'
      );
    }
  },

  /**
   * Anuncia un mensaje a screen readers.
   */
  announce(message) {
    if (!this._liveRegion) return;
    // Limpiar y re-setear para forzar re-anuncio
    this._liveRegion.textContent = '';
    setTimeout(() => {
      this._liveRegion.textContent = message;
    }, 50);
  },

  /**
   * Actualiza el aria-label dinámicamente según el estado del juego.
   */
  updateGameStatusLabel(state) {
    const canvas = document.getElementById('c');
    if (!canvas) return;
    const baseLabel = 'Ricochet Blitz game. ';
    const stateLabels = {
      'MENU': 'Main menu. Press Play button to start.',
      'AIMING': 'Aiming. Drag to aim, tap to shoot.',
      'FIRING': 'Balls in motion.',
      'PAUSED': 'Paused. Press Escape or P to resume, R to restart.',
      'GAMEOVER': 'Game over. Press R to retry.',
      'LEADERBOARD': 'Top scores leaderboard. Press Escape to go back.'
    };
    const stateLabel = stateLabels[state] || '';
    canvas.setAttribute('aria-label', baseLabel + stateLabel);
  }
};

window.ARIA = ARIA;

// js/gdpr.js
// GDPR consent dialog - requisito para publicación en CrazyGames
// Cumple con GDPR (UE), CCPA (California) y Ley 25.326 (Argentina)

const GDPR = {
  CONSENT_KEY: 'rb_gdpr_consent',

  /**
   * Verifica si el usuario ya dio consentimiento.
   */
  hasConsent() {
    try {
      return localStorage.getItem(this.CONSENT_KEY) === 'accepted';
    } catch (e) {
      return false;
    }
  },

  /**
   * Muestra el diálogo de consentimiento si es necesario.
   * Retorna una Promise que resuelve cuando el usuario decide.
   */
  showIfRequired() {
    return new Promise((resolve) => {
      if (this.hasConsent()) {
        resolve(true);
        return;
      }

      // Crear el dialog
      const dialog = document.createElement('div');
      dialog.id = 'gdpr-consent';
      dialog.innerHTML = `
        <div class="gdpr-panel" role="dialog" aria-labelledby="gdpr-title" aria-describedby="gdpr-text">
          <h2 id="gdpr-title">PRIVACY NOTICE</h2>
          <p id="gdpr-text">
            This game stores your high score, leaderboard entries, and player name
            locally in your browser. No data is sent to any server. You can erase
            all your data at any time by pressing and holding on your high score.
          </p>
          <div class="gdpr-buttons">
            <button class="btn-accept" type="button" aria-label="Accept and continue">
              ACCEPT &amp; PLAY
            </button>
            <button class="btn-decline" type="button" aria-label="Decline and play without saving">
              PLAY WITHOUT SAVING
            </button>
          </div>
        </div>
      `;

      document.body.appendChild(dialog);

      const acceptBtn = dialog.querySelector('.btn-accept');
      const declineBtn = dialog.querySelector('.btn-decline');

      const cleanup = () => {
        dialog.remove();
      };

      acceptBtn.addEventListener('click', () => {
        try { localStorage.setItem(this.CONSENT_KEY, 'accepted'); } catch (e) {}
        cleanup();
        resolve(true);
      });

      declineBtn.addEventListener('click', () => {
        cleanup();
        resolve(false);
      });

      // Focus para accesibilidad por teclado
      acceptBtn.focus();
    });
  },

  /**
   * Retira el consentimiento y borra todos los datos (GDPR right to erasure).
   */
  revoke() {
    try {
      localStorage.removeItem(this.CONSENT_KEY);
    } catch (e) {}
    window.Storage?.clearAll();
  }
};

window.GDPR = GDPR;

// js/crazygames-sdk.js
// Wrapper defensivo sobre CrazyGames SDK v3
// API oficial: https://docs.crazygames.com/developer/html5/getting-started/
//
// Módulos disponibles en v3:
//   - ad     → requestAd('midgame' | 'rewarded' | 'start')
//   - banner → requestBanner, clearBanner
//   - game   → loadingStart, loadingStop, gameplayStart, gameplayStop, happytimeStart, happytimeStop, sdkGameLoadingStart (deprecated)
//   - user   → getUser, isUserAccountAvailable (var), systemInfo (var)
//   - data   → setItem, getItem (cross-device storage)
//
// Diferencias clave v2 → v3:
//   - init() ahora requiere await (es async)
//   - sdkGameLoadingStart() → loadingStart()
//   - sdkGameLoadingStop()  → loadingStop()
//   - requestAd() usa promesas, no callbacks
//   - environment es variable, no método
//   - Errores: {code, message}

const CG = {
  _sdk: null,
  _initialized: false,
  _environment: 'disabled',  // 'local' | 'crazygames' | 'disabled'

  /**
   * Inicializa el SDK de CrazyGames v3.
   * REQUIERE await porque es async.
   */
  async init() {
    try {
      if (typeof window.CrazyGames !== 'undefined' && window.CrazyGames.SDK) {
        this._sdk = window.CrazyGames.SDK;
        // v3: init() devuelve una promesa
        await this._sdk.init();
        this._initialized = true;
        // environment es una variable en v3, no un método
        this._environment = this._sdk.environment || 'disabled';
        console.log('[CG] SDK v3 initialized, environment:', this._environment);
        return true;
      } else {
        console.warn('[CG] SDK not available, running in standalone mode');
        this._environment = 'disabled';
        return false;
      }
    } catch (e) {
      console.warn('[CG] SDK init failed:', e?.code || e?.message || e);
      this._environment = 'disabled';
      return false;
    }
  },

  /**
   * Verifica si el SDK está listo para usarse.
   * En entorno 'disabled', todas las llamadas fallarían, así que las skip.
   */
  _isUsable() {
    return this._initialized && this._sdk && this._environment !== 'disabled';
  },

  /**
   * Retorna el entorno actual: 'local' | 'crazygames' | 'disabled'
   */
  getEnvironment() {
    return this._environment;
  },

  /**
   * ¿Está corriendo dentro de CrazyGames?
   */
  isRunningOnCrazyGames() {
    return this._environment === 'crazygames';
  },

  // ── Loading hooks (módulo game) ────────────────────────────
  // v3: loadingStart() / loadingStop() (renombrado de sdkGameLoadingStart/Stop)
  gameLoadingStart() {
    if (!this._isUsable()) return;
    try { this._sdk.game.loadingStart(); } catch (e) {
      console.warn('[CG] loadingStart failed:', e?.message);
    }
  },

  gameLoadingFinished() {
    if (!this._isUsable()) return;
    try { this._sdk.game.loadingStop(); } catch (e) {
      console.warn('[CG] loadingStop failed:', e?.message);
    }
  },

  // ── Gameplay hooks (módulo game) ───────────────────────────
  // gameplayStart/Stop siguen iguales en v3
  gameplayStart() {
    if (!this._isUsable()) return;
    try { this._sdk.game.gameplayStart(); } catch (e) {
      console.warn('[CG] gameplayStart failed:', e?.message);
    }
  },

  gameplayStop() {
    if (!this._isUsable()) return;
    try { this._sdk.game.gameplayStop(); } catch (e) {
      console.warn('[CG] gameplayStop failed:', e?.message);
    }
  },

  /**
   * Happytime - v3 tiene happytimeStart/Stop
   * Se llama cuando el jugador logra algo épico (milestone, new best).
   */
  happyTime() {
    if (!this._isUsable()) return;
    try {
      // v3: happytimeStart + happytimeStop con un pequeño delay
      this._sdk.game.happytimeStart();
      setTimeout(() => {
        try { this._sdk.game.happytimeStop(); } catch (_) {}
      }, 2000);
    } catch (e) {
      // happytime no es crítico, ignorar errores silenciosamente
    }
  },

  // ── Ads (módulo ad) ────────────────────────────────────────
  // v3: requestAd(type) devuelve una PROMESA, no usa callbacks
  // Tipos: 'midgame' (intersticial), 'rewarded' (con recompensa), 'start' (al iniciar)

  /**
   * Commercial break (ad intersticial midgame).
   * v3: await SDK.ad.requestAd('midgame')
   * El callback recibe (success) para mantener compat con el código existente.
   */
  async commercialBreak(callback) {
    if (!this._isUsable()) {
      // Fallback standalone
      if (callback) setTimeout(() => callback(true), 100);
      return;
    }
    try {
      // v3: requestAd devuelve promesa que resuelve cuando el ad termina
      await this._sdk.ad.requestAd('midgame');
      console.log('[CG] midgame ad completed');
      if (callback) callback(true);
    } catch (e) {
      console.warn('[CG] midgame ad failed:', e?.code || e?.message);
      if (callback) callback(false);
    }
  },

  /**
   * Rewarded ad (ad opt-in con recompensa).
   * v3: await SDK.ad.requestAd('rewarded')
   * El callback recibe (success): true si el usuario vio el ad completo.
   */
  async rewardedBreak(callback) {
    if (!this._isUsable()) {
      // Fallback standalone (simular ad exitoso para testing)
      if (callback) setTimeout(() => callback(true), 100);
      return;
    }
    try {
      // v3: requestAd('rewarded') resuelve solo si el ad se completó
      await this._sdk.ad.requestAd('rewarded');
      console.log('[CG] rewarded ad completed');
      if (callback) callback(true);
    } catch (e) {
      // El usuario puede haber skipeado el ad, o hubo error
      console.warn('[CG] rewarded ad not completed:', e?.code || e?.message);
      if (callback) callback(false);
    }
  },

  // ── User module (opcional) ─────────────────────────────────
  /**
   * Obtiene info del usuario logueado (si está disponible).
   * Retorna null si no hay usuario o el SDK no está disponible.
   */
  async getUser() {
    if (!this._isUsable()) return null;
    try {
      // v3: isUserAccountAvailable es una variable, no un método
      if (!this._sdk.user.isUserAccountAvailable) return null;
      return await this._sdk.user.getUser();
    } catch (e) {
      console.warn('[CG] getUser failed:', e?.message);
      return null;
    }
  },

  /**
   * Verifica si el usuario tiene cuenta CrazyGames (para login/logros).
   */
  isUserAvailable() {
    if (!this._isUsable()) return false;
    try {
      return !!this._sdk.user.isUserAccountAvailable;
    } catch (_) {
      return false;
    }
  },

  // ── Data module (almacenamiento cross-device) ──────────────
  /**
   * Guarda datos del usuario que persisten entre dispositivos (requiere login).
   * Útil para high score sincronizado, skins desbloqueados, etc.
   * Si no hay usuario logueado, falla silenciosamente.
   */
  async setData(key, value) {
    if (!this._isUsable()) return false;
    try {
      await this._sdk.data.setItem(key, JSON.stringify(value));
      return true;
    } catch (e) {
      console.warn('[CG] setData failed:', e?.message);
      return false;
    }
  },

  /**
   * Lee datos del usuario guardados con setData.
   * Retorna null si no hay datos o el SDK no está disponible.
   */
  async getData(key) {
    if (!this._isUsable()) return null;
    try {
      const raw = await this._sdk.data.getItem(key);
      if (raw == null) return null;
      return JSON.parse(raw);
    } catch (e) {
      console.warn('[CG] getData failed:', e?.message);
      return null;
    }
  },

  // ── Invite link (opcional) ─────────────────────────────────
  /**
   * Invita al usuario a compartir el juego.
   */
  inviteLink() {
    if (!this._isUsable()) return;
    try { this._sdk.game.inviteLink?.(); } catch (_) {}
  }
};

window.CG = CG;

// js/storage.js
// Módulo de persistencia con versionado de schema y migración
// Resuelve el issue crítico "Sin versionado de esquema localStorage"

const Storage = {
  // Versión actual del esquema. Incrementar en cada cambio breaking.
  SCHEMA_VERSION: 2,

  // Prefijo de todas las claves
  PREFIX: 'rb_',
  persistent: false,
  session: new Map(),

  // Mapeo de claves legacy → nuevas
  LEGACY_KEYS: {
    'rb_hi': 'hi',
    'rb_lb': 'lb',
    'rb_name': 'name',
    'rb_muted': 'muted',
    'rb_skin': 'skin',
    'rb_unlocks': 'unlocks',
    'rb_daily_best': 'daily_best',
    'rb_daily_date': 'daily_date'
  },

  /**
   * Inicializa el sistema de persistencia.
   * Verifica versión y ejecuta migración si es necesario.
   */
  init() {
    if (!this.persistent) return;
    const storedVersion = this._read('schema_version', 0);

    if (storedVersion < this.SCHEMA_VERSION) {
      this._migrate(storedVersion, this.SCHEMA_VERSION);
      this._write('schema_version', this.SCHEMA_VERSION);
    }
  },

  /**
   * Lee un valor del localStorage con manejo defensivo.
   */
  get(key, defaultValue = null) {
    return this._read(this.LEGACY_KEYS[key] || key, defaultValue);
  },

  /**
   * Escribe un valor en localStorage.
   */
  set(key, value) {
    this._write(this.LEGACY_KEYS[key] || key, value);
  },

  /**
   * Lectura interna con try/catch.
   */
  _read(rawKey, defaultValue) {
    if (!this.persistent) return this.session.get(rawKey) ?? defaultValue;
    try {
      const fullKey = this.PREFIX + rawKey;
      const raw = localStorage.getItem(fullKey);
      if (raw === null) return defaultValue;
      // Intentar JSON parse primero
      try {
        return JSON.parse(raw);
      } catch (_) {
        // Si no es JSON, retornar string crudo (compatibilidad con rb_hi, rb_muted)
        return raw;
      }
    } catch (e) {
      console.warn('Storage read error for key', rawKey, e);
      return defaultValue;
    }
  },

  /**
   * Escritura interna con try/catch.
   */
  _write(rawKey, value) {
    if (!this.persistent) {
      this.session.set(rawKey, value);
      return;
    }
    try {
      const fullKey = this.PREFIX + rawKey;
      const serialized = typeof value === 'string' ? value : JSON.stringify(value);
      localStorage.setItem(fullKey, serialized);
      return true;
    } catch (e) {
      // QuotaExceededError o SecurityError en modo privado
      console.warn('Storage write error for key', rawKey, e);
      return false;
    }
  },

  /**
   * Migra datos desde una versión anterior a la actual.
   * Cada caso debe transformar los datos al nuevo formato.
   */
  _migrate(fromVersion, toVersion) {
    console.log(`[Storage] Migrating schema from v${fromVersion} to v${toVersion}`);

    // v0 → v2: primera inicialización con schema versionado
    // (los datos existentes se conservan tal cual, solo se normalizan)
    if (fromVersion < 1) {
      // Migrar rb_lb: sanitizar todos los names existentes (XSS defense)
      try {
        const lbRaw = localStorage.getItem(this.PREFIX + 'lb');
        if (lbRaw) {
          const lb = JSON.parse(lbRaw);
          if (Array.isArray(lb)) {
            lb.forEach(entry => {
              if (entry && typeof entry.name === 'string') {
                entry.name = window.Security.sanitizePlayerName(entry.name);
              }
            });
            localStorage.setItem(this.PREFIX + 'lb', JSON.stringify(lb));
          }
        }
      } catch (e) {
        console.warn('[Storage] Failed to migrate leaderboard', e);
      }

      // Migrar rb_name: sanitizar
      try {
        const name = localStorage.getItem(this.PREFIX + 'name');
        if (name) {
          const clean = window.Security.sanitizePlayerName(name);
          localStorage.setItem(this.PREFIX + 'name', clean);
        }
      } catch (e) {
        console.warn('[Storage] Failed to migrate name', e);
      }
    }

    // v1 → v2: añadir timestamp de última migración para auditoría
    if (fromVersion < 2) {
      this._write('last_migration', Date.now());
    }

    // Futuras migraciones se añaden aquí:
    // if (fromVersion < 3) { ... }
  },

  /**
   * Limpia todos los datos del juego (usado por "Borrar mis datos" GDPR).
   */
  clearAll() {
    try {
      Object.keys(this.LEGACY_KEYS).forEach(legacyKey => {
        localStorage.removeItem(legacyKey);
      });
      Object.values(this.LEGACY_KEYS).forEach(shortKey => {
        localStorage.removeItem(this.PREFIX + shortKey);
      });
      localStorage.removeItem(this.PREFIX + 'schema_version');
      localStorage.removeItem(this.PREFIX + 'last_migration');
      return true;
    } catch (e) {
      console.warn('[Storage] clearAll failed', e);
      return false;
    }
  },

  /**
   * Exporta los datos del usuario (GDPR: derecho a portabilidad).
   */
  exportAll() {
    const data = {};
    Object.entries(this.LEGACY_KEYS).forEach(([legacyKey, shortKey]) => {
      data[shortKey] = this.get(legacyKey);
    });
    data.schema_version = this.SCHEMA_VERSION;
    data.exported_at = new Date().toISOString();
    return data;
  }
};

window.Storage = Storage;

// js/security.js
// Módulo de seguridad: sanitización, escape HTML, validación
// Resuelve la vulnerabilidad XSS crítica (CWE-79) documentada en la auditoría

const Security = {
  /**
   * Whitelist estricta de caracteres para player name.
   * Solo permite A-Z, 0-9, espacio, guion y guion bajo.
   * Máximo 10 caracteres.
   * Elimina cualquier carácter que pueda romper HTML/JS (incluye <>"'`&).
   */
  sanitizePlayerName(raw) {
    if (typeof raw !== 'string') return '';
    // Whitelist estricta: solo A-Z 0-9 espacio _ -
    let cleaned = raw.toUpperCase().replace(/[^A-Z0-9 _-]/g, '');
    // Colapsar espacios múltiples
    cleaned = cleaned.replace(/\s+/g, ' ').trim();
    // Limitar a 10 caracteres
    return cleaned.slice(0, 10);
  },

  /**
   * Escapa caracteres HTML peligrosos para uso seguro en cualquier contexto.
   * Previene XSS si los datos persistidos llegaran a renderizarse en DOM.
   */
  escapeHtml(text) {
    if (text == null) return '';
    return String(text)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;')
      .replace(/`/g, '&#96;');
  },

  /**
   * Sanitiza para uso seguro dentro de canvas (fillText).
   * Canvas NO interpreta HTML, pero por defense-in-depth eliminamos
   * caracteres de control y zero-width chars.
   */
  sanitizeForCanvas(text) {
    if (typeof text !== 'string') return '';
    return text
      // Eliminar caracteres de control (excepto \t \n)
      .replace(/[\x00-\x08\x0b\x0c\x0e-\x1f\x7f]/g, '')
      // Eliminar zero-width chars
      .replace(/[\u200b-\u200f\u2028-\u202f\u2060\ufeff]/g, '')
      // Eliminar replacement char
      .replace(/\ufffd/g, '')
      .slice(0, 10);
  },

  /**
   * Valida que un número persistido sea seguro de usar.
   */
  safeNumber(value, min = 0, max = Number.MAX_SAFE_INTEGER, defaultValue = 0) {
    const n = Number(value);
    if (!isFinite(n) || isNaN(n)) return defaultValue;
    return Math.max(min, Math.min(max, n));
  }
};

// Exponer globalmente (compatible con el patrón del código original)
window.Security = Security;

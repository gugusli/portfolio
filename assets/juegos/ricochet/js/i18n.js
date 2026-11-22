// js/i18n.js
// Localización multi-idioma: EN, ES, PT, FR, DE, JA
// Auditoría sección 11.4: añadir idiomas expande audiencia potencial 3x

const LANG = {
  en: {
    title:'RICOCHET BLITZ', play:'PLAY', retry:'RETRY',
    score:'SCORE', best:'BEST', turn:'TURN',
    aiming:'AIM AND SHOOT', firing:'FIRING...',
    gameover:'GAME OVER', continue_:'CONTINUE',
    watchAd:'WATCH AD', extraBalls:'EXTRA BALLS!',
    powerFireball:'FIREBALL', powerMulti:'MULTI SHOT', powerFreeze:'FREEZE',
    tutorial:'Drag to aim, tap to shoot', newBest:'NEW BEST!', rounds:'ROUNDS',
    powerBomb:'BOMB', powerArmored:'ARMORED', combo:'COMBO',
    waveWarning:'DOUBLE WAVE!', difficulty:'WAVE', level:'LVL',
    pause:'PAUSE', resume:'RESUME', restart:'RESTART',
    quit:'QUIT', sound:'SOUND', muted:'MUTED', paused:'PAUSED',
    holdReset:'hold to reset', destroyed:'DESTROYED', version:'v2.0',
    ranking:'TOP SCORES', back:'BACK', noScores:'No scores yet', newTag:'NEW',
    enterName:'ENTER YOUR NAME', nameHint:'tap to type', nameCol:'NAME',
    saveLabel:'SAVE', comboH:'COMBO', blockTypes:'BLOCK TYPES',
    legendFB:'FIREBALL (2x dmg)', legendMulti:'MULTI SHOT (+50%)',
    legendFreeze:'FREEZE (skip adv)', legendBomb:'BOMB (area)',
    legendArmored:'ARMORED (2x HP)',
    legendDiff:'Difficulty increases every wave!',
    legendDW:'Every 5th turn = DOUBLE WAVE!',
    eraseData:'ERASE DATA', confirmErase:'ERASE ALL DATA?',
    yes:'YES', no:'NO'
  },
  es: {
    title:'RICOCHET BLITZ', play:'JUGAR', retry:'REINTENTAR',
    score:'PUNTOS', best:'MEJOR', turn:'TURNO',
    aiming:'APUNTA Y DISPARA', firing:'DISPARANDO...',
    gameover:'GAME OVER', continue_:'CONTINUAR',
    watchAd:'VER ANUNCIO', extraBalls:'BALAS EXTRA!',
    powerFireball:'FUEGO', powerMulti:'MULTI DISPARO', powerFreeze:'CONGELAR',
    tutorial:'Arrastra para apuntar, toca para disparar', newBest:'NUEVO RECORD!', rounds:'RONDAS',
    powerBomb:'BOMBA', powerArmored:'BLINDADO', combo:'COMBO',
    waveWarning:'OLA DOBLE!', difficulty:'OLA', level:'NVL',
    pause:'PAUSA', resume:'CONTINUAR', restart:'REINICIAR',
    quit:'SALIR', sound:'SONIDO', muted:'SILENCIADO', paused:'PAUSADO',
    holdReset:'mantener para resetear', destroyed:'DESTRUIDOS', version:'v2.0',
    ranking:'MEJORES PUNTUACIONES', back:'VOLVER', noScores:'Sin puntajes aun', newTag:'NUEVO',
    enterName:'INGRESA TU NOMBRE', nameHint:'toca para escribir', nameCol:'NOMBRE',
    saveLabel:'GUARDAR', comboH:'COMBO', blockTypes:'TIPOS DE BLOQUES',
    legendFB:'FUEGO (2x daño)', legendMulti:'MULTI DISPARO (+50%)',
    legendFreeze:'CONGELAR (salta av)', legendBomb:'BOMBA (área)',
    legendArmored:'BLINDADO (2x HP)',
    legendDiff:'La dificultad sube cada ola!',
    legendDW:'Cada 5to turno = OLA DOBLE!',
    eraseData:'BORRAR DATOS', confirmErase:'¿BORRAR TODOS LOS DATOS?',
    yes:'SI', no:'NO'
  },
  pt: {
    title:'RICOCHET BLITZ', play:'JOGAR', retry:'TENTAR DE NOVO',
    score:'PONTOS', best:'MELHOR', turn:'TURNO',
    aiming:'MIRE E ATIRE', firing:'ATIRANDO...',
    gameover:'FIM DE JOGO', continue_:'CONTINUAR',
    watchAd:'VER ANÚNCIO', extraBalls:'BOLAS EXTRA!',
    powerFireball:'BOLA DE FOGO', powerMulti:'TIRO MÚLTIPLO', powerFreeze:'CONGELAR',
    tutorial:'Arraste para mirar, toque para atirar', newBest:'NOVO RECORDE!', rounds:'RODADAS',
    powerBomb:'BOMBA', powerArmored:'BLINDADO', combo:'COMBO',
    waveWarning:'ONDA DUPLA!', difficulty:'ONDA', level:'NÍVEL',
    pause:'PAUSAR', resume:'CONTINUAR', restart:'REINICIAR',
    quit:'SAIR', sound:'SOM', muted:'MUDO', paused:'PAUSADO',
    holdReset:'segure para resetar', destroyed:'DESTRUÍDOS', version:'v2.0',
    ranking:'MELHORES PONTUAÇÕES', back:'VOLTAR', noScores:'Sem pontuações ainda', newTag:'NOVO',
    enterName:'DIGITE SEU NOME', nameHint:'toque para digitar', nameCol:'NOME',
    saveLabel:'SALVAR', comboH:'COMBO', blockTypes:'TIPOS DE BLOCOS',
    legendFB:'BOLA DE FOGO (2x dano)', legendMulti:'TIRO MÚLTIPLO (+50%)',
    legendFreeze:'CONGELAR (pula av)', legendBomb:'BOMBA (área)',
    legendArmored:'BLINDADO (2x HP)',
    legendDiff:'Dificuldade aumenta a cada onda!',
    legendDW:'Cada 5º turno = ONDA DUPLA!',
    eraseData:'APAGAR DADOS', confirmErase:'APAGAR TODOS OS DADOS?',
    yes:'SIM', no:'NÃO'
  },
  fr: {
    title:'RICOCHET BLITZ', play:'JOUER', retry:'RÉESSAYER',
    score:'SCORE', best:'MEILLEUR', turn:'TOUR',
    aiming:'VISEZ ET TIREZ', firing:'TIR...',
    gameover:'JEU TERMINÉ', continue_:'CONTINUER',
    watchAd:'VOIR PUB', extraBalls:'BALLES EXTRA!',
    powerFireball:'BOULE DE FEU', powerMulti:'TIR MULTIPLE', powerFreeze:'GELER',
    tutorial:'Glissez pour viser, touchez pour tirer', newBest:'NOUVEAU RECORD!', rounds:'TOURS',
    powerBomb:'BOMBE', powerArmored:'BLINDÉ', combo:'COMBO',
    waveWarning:'DOUBLE VAGUE!', difficulty:'VAGUE', level:'NIV',
    pause:'PAUSE', resume:'REPRENDRE', restart:'RECOMMENCER',
    quit:'QUITTER', sound:'SON', muted:'MUET', paused:'EN PAUSE',
    holdReset:'maintenir pour réinitialiser', destroyed:'DÉTRUITS', version:'v2.0',
    ranking:'MEILLEURS SCORES', back:'RETOUR', noScores:'Pas encore de scores', newTag:'NOUVEAU',
    enterName:'ENTREZ VOTRE NOM', nameHint:'touchez pour taper', nameCol:'NOM',
    saveLabel:'SAUVER', comboH:'COMBO', blockTypes:'TYPES DE BLOCS',
    legendFB:'BOULE DE FEU (2x dégâts)', legendMulti:'TIR MULTIPLE (+50%)',
    legendFreeze:'GELER (saute av)', legendBomb:'BOMBE (zone)',
    legendArmored:'BLINDÉ (2x PV)',
    legendDiff:'La difficulté augmente à chaque vague!',
    legendDW:'Chaque 5ème tour = DOUBLE VAGUE!',
    eraseData:'EFFACER DONNÉES', confirmErase:'EFFACER TOUTES LES DONNÉES?',
    yes:'OUI', no:'NON'
  },
  de: {
    title:'RICOCHET BLITZ', play:'SPIELEN', retry:'WIEDERHOLEN',
    score:'PUNKTE', best:'BESTES', turn:'RUNDE',
    aiming:'ZIELEN UND SCHIESSEN', firing:'SCHIESSE...',
    gameover:'SPIEL VORBEI', continue_:'WEITER',
    watchAd:'WERBUNG SEHEN', extraBalls:'EXTRA BÄLLE!',
    powerFireball:'FEUERBALL', powerMulti:'MULTI-SCHUSS', powerFreeze:'EINFRIEREN',
    tutorial:'Ziehen zum Zielen, Tippen zum Schießen', newBest:'NEUER REKORD!', rounds:'RUNDEN',
    powerBomb:'BOMBE', powerArmored:'PANZER', combo:'COMBO',
    waveWarning:'DOPPELTE WELLE!', difficulty:'WELLE', level:'LVL',
    pause:'PAUSE', resume:'WEITER', restart:'NEUSTART',
    quit:'VERLASSEN', sound:'TON', muted:'STUMM', paused:'PAUSIERT',
    holdReset:'gedrückt halten zum Zurücksetzen', destroyed:'ZERSTÖRT', version:'v2.0',
    ranking:'TOP ERGEBNISSE', back:'ZURÜCK', noScores:'Noch keine Punkte', newTag:'NEU',
    enterName:'NAMEN EINGEBEN', nameHint:'tippen zum Tippen', nameCol:'NAME',
    saveLabel:'SPEICHERN', comboH:'COMBO', blockTypes:'BLOCKTYPEN',
    legendFB:'FEUERBALL (2x Schaden)', legendMulti:'MULTI-SCHUSS (+50%)',
    legendFreeze:'EINFRIEREN (überspringt Welle)', legendBomb:'BOMBE (Bereich)',
    legendArmored:'PANZER (2x HP)',
    legendDiff:'Schwierigkeit steigt jede Welle!',
    legendDW:'Jede 5. Runde = DOPPELTE WELLE!',
    eraseData:'DATEN LÖSCHEN', confirmErase:'ALLE DATEN LÖSCHEN?',
    yes:'JA', no:'NEIN'
  },
  ja: {
    title:'RICOCHET BLITZ', play:'プレイ', retry:'リトライ',
    score:'スコア', best:'ベスト', turn:'ターン',
    aiming:'ねらって うて', firing:'発射中...',
    gameover:'ゲームオーバー', continue_:'つづける',
    watchAd:'広告を見る', extraBalls:'ボール追加!',
    powerFireball:'ファイア', powerMulti:'マルチ', powerFreeze:'フリーズ',
    tutorial:'ドラッグでねらう,タップで発射', newBest:'新記録!', rounds:'ラウンド',
    powerBomb:'ボム', powerArmored:'装甲', combo:'コンボ',
    waveWarning:'ダブル波!', difficulty:'波', level:'Lv',
    pause:'一時停止', resume:'再開', restart:'リスタート',
    quit:'終了', sound:'音', muted:'ミュート', paused:'停止中',
    holdReset:'長押しでリセット', destroyed:'破壊数', version:'v2.0',
    ranking:'トップスコア', back:'戻る', noScores:'スコアなし', newTag:'新',
    enterName:'名前を入力', nameHint:'タップして入力', nameCol:'名前',
    saveLabel:'保存', comboH:'コンボ', blockTypes:'ブロック種類',
    legendFB:'ファイア (2xダメージ)', legendMulti:'マルチ (+50%)',
    legendFreeze:'フリーズ (波スキップ)', legendBomb:'ボム (範囲)',
    legendArmored:'装甲 (2x HP)',
    legendDiff:'毎波 難易度アップ!',
    legendDW:'5ターンごと = ダブル波!',
    eraseData:'データ削除', confirmErase:'全データ削除?',
    yes:'はい', no:'いいえ'
  }
};

// Detección de idioma con fallback a inglés
const userLang = (navigator.language || navigator.userLanguage || 'en').slice(0, 2).toLowerCase();
let lang = LANG[userLang] || LANG.en;

// Idioma actualmente seleccionado (persistido)
let currentLangCode = userLang;

/**
 * Cambia el idioma activo.
 */
function setLanguage(code) {
  if (LANG[code]) {
    lang = LANG[code];
    currentLangCode = code;
    window.Storage.set('lang', code);
  }
}

/**
 * Carga el idioma persistido.
 */
function loadPersistedLanguage() {
  try {
    const saved = window.Storage.get('lang');
    if (saved && LANG[saved]) {
      lang = LANG[saved];
      currentLangCode = saved;
    }
  } catch (e) {}
}

/**
 * Retorna la lista de idiomas disponibles para el selector.
 */
function getAvailableLanguages() {
  return [
    { code: 'en', label: 'EN' },
    { code: 'es', label: 'ES' },
    { code: 'pt', label: 'PT' },
    { code: 'fr', label: 'FR' },
    { code: 'de', label: 'DE' },
    { code: 'ja', label: 'JA' }
  ];
}

window.LANG = LANG;
window.lang = lang;
window.setLanguage = setLanguage;
window.loadPersistedLanguage = loadPersistedLanguage;
window.getAvailableLanguages = getAvailableLanguages;
window.currentLangCode = currentLangCode;

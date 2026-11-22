// js/main.js
// Entry point: inicialización, game loop, glue entre módulos
// Reemplaza al script inline del HTML original

let raf, lastTime = 0;
let gameStartTime = 0;

// Game loop con delta time normalization
function loop(timestamp){
  const dt = lastTime ? Math.min((timestamp - lastTime) / 16.667, 2) : 1;
  lastTime = timestamp;
  try{
    update(dt);
    draw();
    // Actualizar aria-label según estado
    if (window.ARIA) ARIA.updateGameStatusLabel(gs);
  }catch(e){
    console.error('Game loop error:',e);
  }
  raf=requestAnimationFrame(loop);
}

function resize() {
  const stage = C.parentElement;
  const s = Math.min(stage.clientWidth / W, stage.clientHeight / H, 1.6);
  C.style.width = (W * s) + 'px';
  C.style.height = (H * s) + 'px';
}

// Name input element listener
function setupNameInput(){
  const nameInputEl = document.getElementById('nameInput');
  // Hacer accesible globalmente para input.js
  window.nameInputEl = nameInputEl;

  nameInputEl.addEventListener('input', () => {
    // Sanitizar en tiempo real con whitelist estricta (XSS prevention)
    const sanitized = window.Security.sanitizePlayerName(nameInputEl.value);
    if (sanitized !== nameInputEl.value) {
      nameInputEl.value = sanitized;
    }
    playerName = sanitized;
  });

  nameInputEl.addEventListener('keydown', e => {
    if(e.key==='Enter'){ e.preventDefault(); submitScore(); }
  });
}

// Inicialización principal
async function main(){
  window.Storage.persistent = await window.GDPR.showIfRequired();
  // 1. Cargar idioma persistido
  loadPersistedLanguage();

  // 2. Inicializar Storage (incluye migración de schema)
  window.Storage.init();

  // 3. Inicializar ARIA para screen readers
  window.ARIA.init();

  // 4. Inicializar vibración (reduced motion detection)
  window.Vib.init();

  // 5. Inicializar audio
  window.Audio_.init();

  // 6. Configurar canvas y resize
  resize();
  window.addEventListener('resize', ()=>{
    resize();
    if(nameInputActive) showNameInput();
  });

  // 7. Configurar input listeners
  setupNameInput();
  setupInput();

  // 8. Inicializar estado del juego
  reset();

  // 9. Pre-renderizar grid canvas
  buildGridCanvas();

  C.focus();

  // 11. Inicializar CrazyGames SDK
  await window.CG.init();

  // 12. Notificar a CrazyGames que el juego está cargando
  window.CG.gameLoadingStart();

  // 13. Onboarding: skip animation delay si es first load
  gameStartTime = Date.now();

  // 14. Tras 800ms (loading mínimo), notificar loading finished y empezar game loop
  setTimeout(()=>{
    window.CG.gameLoadingFinished();
    loop(performance.now());
  }, 800);
}

// Arrancar cuando el DOM esté listo
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', main);
} else {
  main();
}

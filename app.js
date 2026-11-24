document.documentElement.classList.add('js');
const menu = document.querySelector('.nav-links');
const toggle = document.querySelector('.nav-burger');
toggle.hidden = false;

function setMenu(open) {
  menu.classList.toggle('open', open);
  toggle.setAttribute('aria-expanded', String(open));
  toggle.setAttribute('aria-label', open ? 'Cerrar menú' : 'Abrir menú');
}
toggle.addEventListener('click', () => setMenu(!menu.classList.contains('open')));
menu.addEventListener('click', () => setMenu(false));
window.addEventListener('keydown', event => {
  if (event.key === 'Escape' && menu.classList.contains('open')) {
    setMenu(false);
    toggle.focus();
  }
});
document.addEventListener('pointerdown', event => {
  if (!event.target.closest('.nav-inner')) setMenu(false);
});
matchMedia('(min-width:1021px)').addEventListener('change', () => setMenu(false));

const links = [...menu.querySelectorAll('a[href^="#"]')];
const sections = links.map(link => document.querySelector(link.hash));
function highlightSection() {
  const active = sections.filter(section => section.getBoundingClientRect().top <= innerHeight * .4).pop();
  links.forEach((link, i) => {
    if (sections[i] === active) link.setAttribute('aria-current', 'location');
    else link.removeAttribute('aria-current');
  });
}
let scheduled = false;
window.addEventListener('scroll', () => {
  if (scheduled) return;
  scheduled = true;
  requestAnimationFrame(() => { highlightSection(); scheduled = false; });
}, {passive:true});
highlightSection();

const motion = matchMedia('(prefers-reduced-motion: reduce)');
const timer = document.querySelector('#seren-timer');
if (timer) {
  const start = Date.now();
  setInterval(() => {
    if (!motion.matches && !document.hidden) {
      timer.textContent = new Date(Date.now() - start).toISOString().slice(11, 19);
    }
  }, 1000);
}
document.querySelector('.seren-corrupt-trigger')?.addEventListener('click', () => {
  if (motion.matches) return;
  const hero = document.querySelector('.hero');
  hero.classList.add('hero-corrupt');
  setTimeout(() => hero.classList.remove('hero-corrupt'), 650);
});

const home = document.querySelector('.home');
if (home) rememberPlayed(home);
const artRoot = home || document.querySelector('body.archivo .archive');
if (artRoot) {
  enableScrollArt(artRoot);
  enablePointerInk(artRoot);
}

function rememberPlayed(root) {
  const stamps = new Map(
    [...root.querySelectorAll('[data-game]')].map(card => [
      card.dataset.game, card.querySelector('.played-stamp')
    ])
  );

  function restorePlayed() {
    const played = syncSerenLog();
    for (const [slug, stamp] of stamps) stamp.hidden = !played.includes(slug);
  }

  function recordPlayed(event) {
    const link = event.target.closest('a[data-play]');
    if (!link) return;
    try {
      const key = 'played:' + link.dataset.play;
      localStorage.setItem(key, '1');
      restorePlayed();
    } catch {
      // Recording the stamp must never interfere with navigation.
    }
  }

  root.addEventListener('click', recordPlayed);
  root.addEventListener('auxclick', event => {
    if (event.button === 1) recordPlayed(event);
  });
  window.addEventListener('pageshow', restorePlayed);
  window.addEventListener('storage', restorePlayed);
  restorePlayed();
}

function enableScrollArt(root) {
  const timeline = root.querySelector('.tl');
  const milestones = timeline ? [...timeline.querySelectorAll('.tl-item')] : [];
  const links = milestones.slice(0, -1);
  const stamps = [...root.querySelectorAll('.game-stamp, .pause-stamp')];
  const entered = new WeakSet();
  const observer = typeof IntersectionObserver === 'function'
    ? new IntersectionObserver(entries => {
        for (const {target, isIntersecting} of entries) {
          if (!isIntersecting || motion.matches) continue;
          target.classList.add(target.matches('.tl-item') ? 'is-blooming' : 'stamp-hit');
          entered.add(target);
          observer.unobserve(target);
        }
      }, {threshold: .2})
    : null;
  let frame = 0;

  function drawBranch() {
    frame = 0;
    if (motion.matches) return;
    const anchors = milestones.map(item => item.getBoundingClientRect().top + 12.5);
    const front = innerHeight * .78;
    links.forEach((link, i) => {
      const fraction = (front - anchors[i]) / (anchors[i + 1] - anchors[i]);
      link.style.setProperty('--branch-fill', Math.min(1, Math.max(0, fraction)));
    });
    const travel = (front - anchors[0]) / (anchors.at(-1) - anchors[0]);
    timeline.style.setProperty('--gear-angle', Math.min(1, Math.max(0, travel)) * 180 + 'deg');
  }

  function scheduleBranch() {
    if (!frame && !motion.matches) frame = requestAnimationFrame(drawBranch);
  }

  function syncScrollArt() {
    observer?.disconnect();
    timeline?.classList.toggle('scroll-art', Boolean(observer) && !motion.matches);
    if (motion.matches) {
      cancelAnimationFrame(frame);
      frame = 0;
      return;
    }
    for (const element of [...stamps, ...milestones]) {
      if (!entered.has(element)) observer?.observe(element);
    }
    if (timeline) drawBranch();
  }

  if (timeline) {
    window.addEventListener('scroll', scheduleBranch, {passive: true});
    window.addEventListener('resize', scheduleBranch, {passive: true});
    document.fonts?.ready.then(scheduleBranch);
  }
  motion.addEventListener('change', syncScrollArt);
  syncScrollArt();
}

function enablePointerInk(root) {
  const finePointer = matchMedia('(hover: hover) and (pointer: fine) and (min-width: 701px)');
  const ghosts = [...root.querySelectorAll('.ghost')];
  let cleanup;

  function syncPointerInk() {
    cleanup?.();
    cleanup = finePointer.matches && !motion.matches ? startPointerInk(root, ghosts) : null;
  }

  finePointer.addEventListener('change', syncPointerInk);
  motion.addEventListener('change', syncPointerInk);
  syncPointerInk();
}

function startPointerInk(root, ghosts) {
  const canvas = document.createElement('canvas');
  canvas.className = 'ink-trail';
  canvas.setAttribute('aria-hidden', 'true');
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  root.before(canvas);

  const events = new AbortController();
  const lifetime = 900;
  const ink = getComputedStyle(document.documentElement).getPropertyValue('--ink').trim();
  const dropTarget = '.hero-cta a, .text-link';
  const readingArea = [
    'a', 'button', 'h1', 'h2', 'h3', 'p', '.sec-label', '.inscription', '.seren-log',
    '.hero-stats', '.ct-seren', '.about-log', '.about-statement', '.fragment', '.lang-row',
    '.sk-item', '.sk-cat', '.tl-t', '.tl-y', '.pausa-item', '.tool-row', '.ft', '.ft-seren',
    '.card', '.pasted', '.pub-list', '.still', 'figcaption'
  ].join(',');
  let segments = [];
  let cursor = null;
  let brush = null;
  let revealPending = false;
  let frame = 0;

  function sizeCanvas() {
    const dpr = Math.min(devicePixelRatio || 1, 1.5);
    canvas.width = Math.round(innerWidth * dpr);
    canvas.height = Math.round(innerHeight * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.lineCap = 'round';
    ctx.strokeStyle = ink;
    segments = [];
    brush = null;
  }

  function updateGhosts() {
    revealPending = false;
    for (const ghost of ghosts) {
      const rect = ghost.getBoundingClientRect();
      const x = cursor ? cursor.x - rect.x : -Infinity;
      const y = cursor ? cursor.y - rect.y : -Infinity;
      const insideReach = x >= -120 && y >= -120 && x <= rect.width + 120 && y <= rect.height + 120;
      if (insideReach) {
        ghost.style.setProperty('--mx', x + 'px');
        ghost.style.setProperty('--my', y + 'px');
      }
      ghost.classList.toggle('is-revealing', insideReach);
    }
  }

  function renderInk(now) {
    frame = 0;
    if (revealPending) updateGhosts();
    segments = segments.filter(segment => now - segment.to.time < lifetime);
    ctx.clearRect(0, 0, innerWidth + 1, innerHeight + 1);
    for (const {from, to, width} of segments) {
      const remaining = Math.min(1, 1 - (now - to.time) / lifetime);
      ctx.globalAlpha = remaining * remaining;
      ctx.lineWidth = width;
      ctx.beginPath();
      ctx.moveTo(from.x, from.y);
      ctx.quadraticCurveTo(from.x, (from.y + to.y) / 2, to.x, to.y);
      ctx.stroke();
    }
    if (segments.length) frame = requestAnimationFrame(renderInk);
  }

  function queueInk() {
    if (!frame) frame = requestAnimationFrame(renderInk);
  }

  function moveInk(event) {
    if (event.pointerType === 'touch') return;
    cursor = {x: event.clientX, y: event.clientY, time: performance.now()};
    revealPending = true;
    if (event.target.closest(readingArea)) {
      brush = null;
    } else {
      if (brush) {
        const distance = Math.hypot(cursor.x - brush.x, cursor.y - brush.y);
        const elapsed = cursor.time - brush.time;
        if (distance > 0 && distance < 110 && elapsed < 150) {
          const speed = distance / Math.max(8, elapsed);
          segments.push({from: brush, to: cursor, width: Math.max(2, 14 - speed * 4)});
          if (segments.length > 40) segments.shift();
        }
      }
      brush = cursor;
    }
    queueInk();
  }

  function dropInk(event) {
    const link = event.target.closest(dropTarget);
    if (!link || event.button !== 0 || event.pointerType === 'touch') return;
    const rect = link.getBoundingClientRect();
    link.style.setProperty('--drop-x', event.clientX - rect.x + 'px');
    link.style.setProperty('--drop-y', event.clientY - rect.y + 'px');
    link.classList.remove('ink-drop');
    // Restart the animation on rapid, repeated presses.
    link.getBoundingClientRect();
    link.classList.add('ink-drop');
  }

  window.addEventListener('pointermove', moveInk, {passive: true, signal: events.signal});
  document.documentElement.addEventListener('pointerleave', () => {
    cursor = brush = null;
    revealPending = true;
    queueInk();
  }, {passive: true, signal: events.signal});
  window.addEventListener('scroll', () => {
    if (!cursor) return;
    revealPending = true;
    queueInk();
  }, {passive: true, signal: events.signal});
  window.addEventListener('resize', sizeCanvas, {passive: true, signal: events.signal});
  root.addEventListener('pointerdown', dropInk, {passive: true, signal: events.signal});
  root.addEventListener('animationend', event => {
    if (event.animationName === 'ink-drop') event.target.classList.remove('ink-drop');
  }, {signal: events.signal});
  sizeCanvas();

  return () => {
    events.abort();
    cancelAnimationFrame(frame);
    canvas.remove();
    for (const ghost of ghosts) ghost.classList.remove('is-revealing');
    for (const link of root.querySelectorAll('.ink-drop')) link.classList.remove('ink-drop');
  };
}

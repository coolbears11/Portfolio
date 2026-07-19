/* ============================================================
   AFTER HOURS — behavior
   The player works today with placeholder tracks (src: null →
   playback is simulated so every control is testable). To ship
   real music: fill in src (mp3 path), art (image path), and the
   real titles/lyrics below. Nothing else changes.
   ============================================================ */

/* ---------- REPLACE WITH THE SEVEN REAL SONGS ---------- */

const ARTIST = 'Charlie Parker Wang';

const tracks = [
  { title: 'like you', artist: ARTIST, duration: 69, explicit: false,
    src: 'assets/audio/01-like-you.wav', art: 'assets/covers/01-like-you.jpg',
    note: 'The first song I finished, built around the simplest possible question: do you like me too? I wanted it to feel innocent, awkward, and direct—the kind of thought that loops in your head before you finally say it out loud.' },
  { title: 'i don’t want to lie', artist: ARTIST, duration: 92, explicit: true,
    src: 'assets/audio/02-i-dont-want-to-lie.wav', art: 'assets/covers/02-i-dont-want-to-lie.jpg',
    note: 'A high-energy rush of attraction, nightlife, and impulse. I wanted the song to feel immediate—like walking into a room, locking eyes with someone, and letting instinct take over before logic has a chance to catch up. It’s loud, playful, and unapologetically over the top.' },
  { title: 'gemini', artist: ARTIST, duration: 68, explicit: true,
    src: 'assets/audio/03-gemini.wav', art: 'assets/covers/03-gemini.jpg',
    note: 'A song about trying to stay in a relationship that constantly shifts between attraction and frustration. The hook treats “Gemini” less like astrology and more like shorthand for someone I could never fully understand, but kept trying to.' },
  { title: 'rocking jeans', artist: ARTIST, duration: 74, explicit: true,
    src: 'assets/audio/04-rocking-jeans.wav', art: 'assets/covers/04-rocking-jeans.jpg',
    note: 'This started as a freestyle and became an exercise in pure confidence. The lyrics move between fashion, nightlife, attraction, and ambition, but the real focus was cadence—making every phrase feel good against the beat before worrying about where the story went.' },
  { title: 'cat’s eyes', artist: ARTIST, duration: 64, explicit: true,
    src: 'assets/audio/05-cats-eyes.wav', art: 'assets/covers/05-cats-eyes.jpg',
    note: 'A cinematic airport crush compressed into a song. I imagined rushing through LAX, running out of breath, and suddenly noticing someone whose eyes made the rest of the terminal disappear. The reversed bridge was meant to feel like time briefly bending around that moment.' },
  { title: 'lit and young', artist: ARTIST, duration: 77, explicit: true,
    src: 'assets/audio/06-lit-and-young.wav', art: 'assets/covers/06-lit-and-young.jpg',
    note: 'A song about self-sabotage disguised as confidence. The hook sounds reckless and carefree, but underneath it is the feeling of missing a chance with someone, knowing I contributed to the outcome, and trying to hide that disappointment behind being “lit and young.”' },
  { title: 'i just want to fly', artist: ARTIST, duration: 125, explicit: true,
    src: 'assets/audio/07-i-just-want-to-fly.wav', art: 'assets/covers/07-i-just-want-to-fly.jpg',
    note: 'A stream of existential thoughts moving between God, love, anger, humor, sex, ambition, and fantasy. It is intentionally contradictory: wanting meaning and freedom while repeatedly rejecting the things that might provide them. “Flying” became the image for escaping my own mind.' },
];

/* glow position per track — the room's light shifts with the music */
const glowSpots = [
  [22, 18], [76, 24], [30, 78], [70, 70], [50, 12], [14, 52], [84, 46],
];

/* ---------- element handles ---------- */

const $ = (id) => document.getElementById(id);
const els = {
  cover: $('cover'), coverArt: $('cover-art'), coverNum: $('cover-num'), qPos: $('q-pos'),
  title: $('track-title'), artist: $('track-artist'), explicit: $('explicit'),
  shuffle: $('btn-shuffle'), prev: $('btn-prev'), play: $('btn-play'), next: $('btn-next'),
  iconPlay: $('icon-play'), iconPause: $('icon-pause'),
  seek: $('seek'), seekTrack: $('seek-track'), wave: $('wave'),
  timeCur: $('time-cur'), timeTotal: $('time-total'), vol: $('vol'),
  queue: $('queue'), linerText: $('liner-text'),
  led: $('led-line'), clock: $('clock'),
};

const REDUCED = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/* the sun: return to daylight, fading to black first */
const sunLink = document.getElementById('sun-link');
if (sunLink) {
  sunLink.addEventListener('click', (e) => {
    if (REDUCED) return; /* let the plain navigation happen */
    e.preventDefault();
    pause(); /* the room goes quiet before it goes dark */
    document.body.classList.add('departing');
    setTimeout(() => { window.location.href = sunLink.href; }, 950);
  });
}

/* ============================================================
   PLAYER
   Real <audio> when a track has src; a simulated clock when it
   doesn't, so seek/transport behave identically either way.
   ============================================================ */

const audio = new Audio();
audio.preload = 'metadata';

let idx = 0;
let playing = false;
let shuffle = false;
let simTime = 0;
let simTimer = null;
let seeking = false;

/* a src that fails to load falls back to simulated playback —
   the experience never breaks on a missing or renamed file */
const srcFailed = new Set();
const hasAudio = () => Boolean(tracks[idx].src) && !srcFailed.has(tracks[idx].src);
const duration = () => (hasAudio() && audio.duration ? audio.duration : tracks[idx].duration);
const position = () => (hasAudio() ? audio.currentTime : simTime);

function fmt(secs) {
  const s = Math.max(0, Math.floor(secs));
  return Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0');
}

function paintRange(input) {
  const pct = ((input.value - input.min) / (input.max - input.min)) * 100;
  input.style.setProperty('--fill', pct + '%');
}

function renderTime() {
  els.timeCur.textContent = fmt(position());
  els.timeTotal.textContent = fmt(duration());
  if (!seeking) {
    els.seek.value = duration() ? (position() / duration()) * 100 : 0;
    paintRange(els.seek);
  }
  if (activePeaks) drawWave(duration() ? position() / duration() : 0);
}

function startSim() {
  stopSim();
  /* wall-clock based: immune to background-tab timer throttling */
  const t0 = performance.now();
  const base = simTime;
  simTimer = setInterval(() => {
    simTime = base + (performance.now() - t0) / 1000;
    if (simTime >= duration()) { next(true); return; }
    renderTime();
  }, 250);
}

function stopSim() {
  if (simTimer) { clearInterval(simTimer); simTimer = null; }
}

function play() {
  playing = true;
  if (hasAudio()) {
    const attempt = audio.play();
    if (attempt) attempt.catch(() => {
      if (!hasAudio()) {
        /* source failed to load — keep the experience alive in sim */
        startSim();
        syncPlayState();
        return;
      }
      /* autoplay policy block — never fake a playing state */
      playing = false;
      stopSim();
      syncPlayState();
    });
  } else {
    startSim();
  }
  syncPlayState();
}

function pause() {
  playing = false;
  if (hasAudio()) audio.pause();
  stopSim();
  syncPlayState();
}

function load(i, autoplay) {
  idx = i;
  simTime = 0;
  stopSim();
  audio.pause();
  if (hasAudio()) {
    audio.src = tracks[i].src;
    audio.volume = Number(els.vol.value);
  }
  renderTrack();
  renderTime();
  setWaveFor(i);
  if (autoplay) play(); else pause();
}

function next(auto = false) {
  let n;
  if (shuffle && tracks.length > 1) {
    do { n = Math.floor(Math.random() * tracks.length); } while (n === idx);
  } else {
    n = (idx + 1) % tracks.length;
  }
  load(n, playing || auto);
}

function prev() {
  if (position() > 3) { seekTo(0); return; }
  load((idx - 1 + tracks.length) % tracks.length, playing);
}

function seekTo(t) {
  if (hasAudio()) {
    audio.currentTime = t;
  } else {
    simTime = t;
    if (playing) startSim(); /* re-anchor the clock to the scrub */
  }
  renderTime();
}

function syncPlayState() {
  document.body.classList.toggle('is-playing', playing);
  /* toggleAttribute: SVG elements ignore the .hidden property */
  els.iconPlay.toggleAttribute('hidden', playing);
  els.iconPause.toggleAttribute('hidden', !playing);
  els.play.setAttribute('aria-label', playing ? 'Pause' : 'Play');
}

/* ---------- render the active track everywhere ---------- */

function renderTrack() {
  const t = tracks[idx];
  const num = String(idx + 1).padStart(2, '0');

  /* artwork crossfade — debounced; reads idx at fire time so
     rapid track changes can't leave the cover out of sync */
  els.cover.classList.add('is-swapping');
  clearTimeout(renderTrack.swapTimer);
  renderTrack.swapTimer = setTimeout(() => {
    const cur = tracks[idx];
    els.cover.dataset.seed = String(idx + 1);
    els.coverNum.textContent = String(idx + 1).padStart(2, '0');
    if (cur.art) {
      els.coverArt.src = cur.art;
      els.coverArt.alt = cur.title + ' — artwork';
      els.coverArt.removeAttribute('hidden');
      els.cover.classList.add('has-art');
    } else {
      els.coverArt.setAttribute('hidden', '');
      els.cover.classList.remove('has-art');
    }
    els.cover.classList.remove('is-swapping');
  }, REDUCED ? 0 : 300);

  els.qPos.textContent = num + ' / ' + String(tracks.length).padStart(2, '0');
  els.title.textContent = t.title;
  els.artist.textContent = t.artist;
  els.explicit.hidden = !t.explicit;

  /* liner notes follow the active track */
  els.linerText.textContent = t.note || '';

  /* the room's glow drifts toward the track's corner */
  const [x, y] = glowSpots[idx % glowSpots.length];
  document.documentElement.style.setProperty('--glow-x', x + '%');
  document.documentElement.style.setProperty('--glow-y', y + '%');

  /* queue active state */
  els.queue.querySelectorAll('.q-row').forEach((row, i) => {
    row.setAttribute('aria-current', i === idx ? 'true' : 'false');
  });
}

/* ---------- build the queue ---------- */

tracks.forEach((t, i) => {
  const li = document.createElement('li');
  const btn = document.createElement('button');
  btn.className = 'q-row';
  btn.type = 'button';
  btn.setAttribute('aria-current', 'false');
  btn.innerHTML =
    '<span class="q-num">' + String(i + 1).padStart(2, '0') + '</span>' +
    '<span class="q-title">' + t.title + '</span>' +
    (t.explicit ? '<span class="q-e" aria-label="Explicit">E</span>' : '<span></span>') +
    '<span class="q-dur">' + fmt(t.duration) + '</span>';
  btn.addEventListener('click', () => load(i, true));
  li.appendChild(btn);
  els.queue.appendChild(li);
});

/* ---------- controls ---------- */

els.play.addEventListener('click', () => (playing ? pause() : play()));
els.next.addEventListener('click', () => next());
els.prev.addEventListener('click', prev);

els.shuffle.addEventListener('click', () => {
  shuffle = !shuffle;
  els.shuffle.setAttribute('aria-pressed', String(shuffle));
});

els.seek.addEventListener('pointerdown', () => { seeking = true; });
els.seek.addEventListener('pointerup', () => { seeking = false; });
els.seek.addEventListener('input', () => {
  paintRange(els.seek);
  seekTo((els.seek.value / 100) * duration());
});

els.vol.addEventListener('input', () => {
  paintRange(els.vol);
  if (hasAudio()) audio.volume = Number(els.vol.value);
});

audio.addEventListener('timeupdate', renderTime);
audio.addEventListener('ended', () => next(true));
audio.addEventListener('loadedmetadata', () => {
  /* trust the file over the data entry */
  tracks[idx].duration = audio.duration;
  syncQueueDuration(idx);
  renderTime();
});
audio.addEventListener('error', () => {
  srcFailed.add(tracks[idx].src);
  if (playing) startSim();
});

/* ============================================================
   WAVEFORM — generated from the real file via Web Audio.
   Placeholder tracks keep the plain LED line; tracks with real
   audio fade in their waveform once decoded (cached per src).
   ============================================================ */

const peaksCache = new Map();
let audioCtx = null;

async function loadPeaks(src) {
  if (peaksCache.has(src)) return peaksCache.get(src);
  try {
    const buf = await fetch(src).then((r) => {
      if (!r.ok) throw new Error(r.status);
      return r.arrayBuffer();
    });
    audioCtx = audioCtx || new (window.AudioContext || window.webkitAudioContext)();
    const decoded = await audioCtx.decodeAudioData(buf);
    const data = decoded.getChannelData(0);
    const BUCKETS = 160;
    const step = Math.floor(data.length / BUCKETS) || 1;
    const peaks = new Array(BUCKETS).fill(0);
    for (let b = 0; b < BUCKETS; b++) {
      let max = 0;
      for (let j = b * step, end = j + step; j < end; j += 64) {
        const v = Math.abs(data[j] || 0);
        if (v > max) max = v;
      }
      peaks[b] = max;
    }
    const top = Math.max(...peaks, 0.01);
    const norm = peaks.map((p) => Math.pow(p / top, 0.8)); /* soften dynamics */
    peaksCache.set(src, norm);
    return norm;
  } catch {
    peaksCache.set(src, null);
    return null;
  }
}

let activePeaks = null;

function drawWave(progress) {
  if (!activePeaks) return;
  const canvas = els.wave;
  const dpr = window.devicePixelRatio || 1;
  const w = canvas.clientWidth, h = canvas.clientHeight;
  if (!w || !h) return;
  if (canvas.width !== w * dpr) { canvas.width = w * dpr; canvas.height = h * dpr; }
  const ctx = canvas.getContext('2d');
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, w, h);

  const n = activePeaks.length;
  const slot = w / n;
  const barW = Math.max(1, slot * 0.6);
  const played = progress * n;

  for (let i = 0; i < n; i++) {
    const amp = Math.max(0.06, activePeaks[i]);
    const barH = amp * (h - 8);
    const x = i * slot + (slot - barW) / 2;
    const y = (h - barH) / 2;
    ctx.fillStyle = i < played
      ? 'rgba(174, 196, 212, 0.95)'   /* --led */
      : 'rgba(237, 235, 230, 0.16)';  /* unplayed: ghosted ink */
    ctx.fillRect(x, y, barW, barH);
  }
}

function setWaveFor(i) {
  const src = tracks[i].src;
  activePeaks = null;
  els.seekTrack.classList.remove('has-wave');
  if (!src) return;
  loadPeaks(src).then((peaks) => {
    if (i !== idx || !peaks) return; /* stale or failed decode */
    activePeaks = peaks;
    els.seekTrack.classList.add('has-wave');
    drawWave(duration() ? position() / duration() : 0);
  });
}

window.addEventListener('resize', () => {
  drawWave(duration() ? position() / duration() : 0);
});

/* a tab restored from the background has zero-sized layout at draw
   time — repaint the moment it becomes visible */
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'visible') {
    drawWave(duration() ? position() / duration() : 0);
  }
});

function syncQueueDuration(i) {
  const cell = els.queue.querySelectorAll('.q-dur')[i];
  if (cell) cell.textContent = fmt(tracks[i].duration);
}

/* read true durations from file metadata at boot, without
   downloading audio bodies (preload="metadata" only) */
tracks.forEach((t, i) => {
  if (!t.src) return;
  const probe = new Audio();
  probe.preload = 'metadata';
  probe.src = t.src;
  probe.addEventListener('loadedmetadata', () => {
    t.duration = probe.duration;
    syncQueueDuration(i);
    if (i === idx) renderTime();
  });
});

/* ---------- boot the player (no autoplay, ever) ---------- */

paintRange(els.vol);
load(0, false);

/* ============================================================
   THE ROOM — clock, entry, presence, dwell, LED descent
   ============================================================ */

function tickClock() {
  const now = new Date();
  els.clock.textContent =
    String(now.getHours()).padStart(2, '0') + ':' +
    String(now.getMinutes()).padStart(2, '0');
}
tickClock();
setInterval(tickClock, 30_000);

/* entry: quick staged arrival — or, when crossing over from
   daylight, a black veil that lifts into the entry sequence */
const ARRIVING = sessionStorage.getItem('ah-arrive') === '1';
if (ARRIVING) sessionStorage.removeItem('ah-arrive');

if (ARRIVING && !REDUCED) {
  document.body.classList.add('arriving');
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      document.body.classList.add('veil-lift');
      setTimeout(() => document.body.classList.add('entered'), 350);
      setTimeout(() => {
        const veil = document.getElementById('veil');
        if (veil) veil.remove();
      }, 1500);
    });
  });
} else {
  requestAnimationFrame(() => {
    requestAnimationFrame(() => document.body.classList.add('entered'));
  });
}

/* presence + dwell: arrival is free, depth is earned by staying */
const DWELL_MS = REDUCED ? 400 : 2800;
const dwellTimers = new WeakMap();

const observer = new IntersectionObserver((entries) => {
  for (const entry of entries) {
    const el = entry.target;
    if (entry.isIntersecting) {
      el.classList.add('is-present');
      dwellTimers.set(el, setTimeout(() => el.classList.add('is-deepened'), DWELL_MS));
    } else {
      clearTimeout(dwellTimers.get(el));
      el.classList.remove('is-present');
    }
  }
}, {
  /* threshold 0 + inset margin: a section is present while any part
     of it is inside the middle band of the viewport. A ratio-based
     threshold breaks for sections taller than the screen (an expanded
     grid can never show 30% of itself at once). */
  threshold: 0,
  rootMargin: '-10% 0px -10% 0px',
});

document.querySelectorAll('[data-dwell]').forEach((el) => observer.observe(el));

/* ============================================================
   GALLERY IMAGES — drawings sheet + photo strip, one shared
   lightbox. Each collection is numbered files (thumb-NN /
   full-NN); adding a piece = dropping two files and bumping
   the count.
   ============================================================ */

const lightbox = $('lightbox');
const lightboxImg = $('lightbox-img');
const lightboxClose = $('lightbox-close');
let lightboxReturnFocus = null;

const nn = (n) => String(n).padStart(2, '0');

function buildCollection(container, path, count, btnClass, label) {
  for (let i = 1; i <= count; i++) {
    const btn = document.createElement('button');
    btn.className = btnClass;
    btn.type = 'button';
    btn.setAttribute('aria-label', 'View ' + label + ' ' + i + ' of ' + count + ' enlarged');
    const img = document.createElement('img');
    img.src = path + 'thumb-' + nn(i) + '.jpg';
    img.loading = 'lazy';
    img.decoding = 'async';
    img.alt = '';
    btn.appendChild(img);
    btn.addEventListener('click', () => openLightbox(path + 'full-' + nn(i) + '.jpg', btn));
    container.appendChild(btn);
  }
}

buildCollection($('sheet'), 'assets/gallery/drawings/', 27, 'cell-btn', 'drawing');
buildCollection($('photo-grid'), 'assets/gallery/photos/', 14, 'cell-btn', 'photograph');

/* expand/collapse toggles — "view more" ↔ "view less" */
function wireToggle(grid, btn, moreText, lessText) {
  btn.setAttribute('aria-expanded', 'false');
  btn.addEventListener('click', () => {
    const open = grid.classList.toggle('is-expanded');
    btn.textContent = open ? lessText : moreText;
    btn.setAttribute('aria-expanded', String(open));
    if (open) {
      const first = grid.querySelector('[data-more]');
      if (first) first.focus();
    } else {
      /* collapsing can shrink the page from under the reader */
      btn.scrollIntoView({ block: 'center', behavior: 'smooth' });
      btn.focus();
    }
  });
}

/* photography: 9 up front, the rest behind the toggle */
const PHOTOS_SHOWN = 9;
const photoGrid = $('photo-grid');
const photoMore = $('photo-more');

[...photoGrid.children].slice(PHOTOS_SHOWN).forEach((btn) => btn.setAttribute('data-more', ''));

if (photoGrid.children.length <= PHOTOS_SHOWN) photoMore.remove();
else wireToggle(photoGrid, photoMore, 'View more', 'View less');

/* garments: two featured plates always visible; the rest behind the toggle */
buildCollection($('garment-grid'), 'assets/gallery/garments/', 10, 'cell-btn', 'garment');

const garmentGrid = $('garment-grid');
const garmentMore = $('garment-more');

[...garmentGrid.children].forEach((btn) => btn.setAttribute('data-more', ''));
wireToggle(garmentGrid, garmentMore, 'View all garments', 'View less');

/* the featured plates enlarge through the same lightbox */
document.querySelectorAll('.plate-btn').forEach((btn) => {
  btn.addEventListener('click', () => openLightbox(btn.dataset.full, btn));
});

function openLightbox(src, trigger) {
  lightboxReturnFocus = trigger;
  lightboxImg.src = src;
  lightbox.classList.add('is-open');
  lightbox.setAttribute('aria-hidden', 'false');
  document.body.style.overflow = 'hidden';
  lightboxClose.focus();
}

function closeLightbox() {
  lightbox.classList.remove('is-open');
  lightbox.setAttribute('aria-hidden', 'true');
  document.body.style.overflow = '';
  if (lightboxReturnFocus) lightboxReturnFocus.focus();
}

lightboxClose.addEventListener('click', closeLightbox);
lightbox.addEventListener('click', (e) => {
  if (e.target === lightbox) closeLightbox(); /* backdrop click */
});
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && lightbox.classList.contains('is-open')) closeLightbox();
});

/* scrollspy — the side nav follows the section in the middle band */
const sideLinks = [...document.querySelectorAll('.side-link')];
if (sideLinks.length) {
  const spy = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        sideLinks.forEach((link) =>
          link.classList.toggle('is-active', link.hash === '#' + entry.target.id));
      }
    });
  }, { threshold: 0, rootMargin: '-35% 0px -55% 0px' });
  ['music', 'photography', 'garments', 'sketchbook'].forEach((id) => {
    const el = document.getElementById(id);
    if (el) spy.observe(el);
  });
}

/* the LED line: descent rendered as light */
let ticking = false;

function renderLed() {
  const max = document.documentElement.scrollHeight - window.innerHeight;
  els.led.style.transform = 'scaleY(' + (max > 0 ? window.scrollY / max : 0) + ')';
  ticking = false;
}

window.addEventListener('scroll', () => {
  if (!ticking) { ticking = true; requestAnimationFrame(renderLed); }
}, { passive: true });

renderLed();

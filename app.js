const audio = document.getElementById('audio');
const $ = (id) => document.getElementById(id);

const playButtons = [$('bigPlay'), $('epPlay'), $('playBtn'), $('topPlay')];
const seek = $('seek');
const volume = $('volume');
const speeds = [1, 1.25, 1.5, 2, 0.75];
let speedIndex = 0;

// Inici de cada capítol, en segons (0:26, 16:34 i 23:55)
const chapters = [
  { start: 0,    title: 'Presentació', sub: 'Alex G., Bernat, Emilio i Alex S.' },
  { start: 26,   title: 'Entrevista 1 · Jordi', sub: 'Mestre i tècnic TIC a la Generalitat · amb Bernat' },
  { start: 994,  title: 'Entrevista 2 · David', sub: 'Ciberseguretat · amb Emilio i Alex G.' },
  { start: 1435, title: 'Entrevista 3 · Eric', sub: 'De SMIX al grau superior i les pràctiques · amb Alex S.' },
];

const fmt = (s) => {
  if (!isFinite(s)) return '0:00';
  s = Math.floor(s);
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
};

const setFill = (input) => {
  const pct = ((input.value - input.min) / (input.max - input.min)) * 100;
  input.style.setProperty('--p', pct + '%');
};

const toast = (msg) => {
  const t = $('toast');
  t.textContent = msg;
  t.classList.add('show');
  clearTimeout(t._h);
  t._h = setTimeout(() => t.classList.remove('show'), 2500);
};

// ---------- Reproducció ----------
function play() {
  return audio.play().catch(() => toast("No es troba l'àudio: poseu l'arxiu a audio/episodio1.mp3"));
}

function togglePlay() {
  audio.paused ? play() : audio.pause();
}

function jumpTo(seconds) {
  if (audio.readyState === 0) return toast("No es troba l'àudio: poseu l'arxiu a audio/episodio1.mp3");
  audio.currentTime = seconds;
  if (audio.paused) play();
}

function syncPlayState() {
  const playing = !audio.paused;
  document.body.classList.toggle('is-playing', playing);
  playButtons.forEach((b) => {
    b.classList.toggle('playing', playing);
    b.setAttribute('aria-label', playing ? 'Pausa' : 'Reprodueix');
  });
  $('episode').classList.toggle('current', playing || audio.currentTime > 0);
}

playButtons.forEach((b) => b.addEventListener('click', (e) => { e.stopPropagation(); togglePlay(); }));
$('episode').addEventListener('click', togglePlay);
['play', 'pause', 'ended'].forEach((ev) => audio.addEventListener(ev, syncPlayState));

audio.addEventListener('loadedmetadata', () => {
  $('totTime').textContent = fmt(audio.duration);
  $('epDuration').textContent = Math.round(audio.duration / 60) + ' min';
});

audio.addEventListener('timeupdate', () => {
  if (!audio.duration) return;
  const pct = (audio.currentTime / audio.duration) * 100;
  if (!seek.dragging) {
    seek.value = pct;
    setFill(seek);
    $('curTime').textContent = fmt(audio.currentTime);
  }
  $('epProgress').style.width = pct + '%';
  $('miniProgress').style.width = pct + '%';
  updateChapter();
});

// Bafarada amb el temps en passar el ratolí per la barra
const seekWrap = seek.parentElement;
function showTip(pct) {
  $('seekTip').style.left = pct + '%';
  $('seekTip').textContent = fmt((pct / 100) * (audio.duration || 0));
}
seekWrap.addEventListener('mousemove', (e) => {
  if (seek.dragging) return;
  const r = seek.getBoundingClientRect();
  showTip(Math.min(100, Math.max(0, ((e.clientX - r.left) / r.width) * 100)));
});

seek.addEventListener('input', () => {
  seek.dragging = true;
  seekWrap.classList.add('dragging');
  showTip(seek.value);
  setFill(seek);
  if (audio.duration) $('curTime').textContent = fmt((seek.value / 100) * audio.duration);
});
seek.addEventListener('change', () => {
  if (audio.duration) audio.currentTime = (seek.value / 100) * audio.duration;
  seek.dragging = false;
  seekWrap.classList.remove('dragging');
});

$('back15').addEventListener('click', () => { audio.currentTime = Math.max(0, audio.currentTime - 15); });
$('fwd15').addEventListener('click', () => { if (audio.duration) audio.currentTime = Math.min(audio.duration, audio.currentTime + 15); });
$('restartBtn').addEventListener('click', () => { audio.currentTime = 0; });

$('speedBtn').addEventListener('click', () => {
  speedIndex = (speedIndex + 1) % speeds.length;
  audio.playbackRate = speeds[speedIndex];
  const btn = $('speedBtn');
  btn.textContent = speeds[speedIndex] + 'x';
  btn.classList.toggle('changed', speeds[speedIndex] !== 1);
});

// ---------- Volum ----------
function syncVolume() {
  const muted = audio.muted || audio.volume === 0;
  $('muteBtn').classList.toggle('muted', muted);
  $('muteBtn').title = muted ? 'Activa el so' : 'Silencia';
  volume.value = audio.muted ? 0 : audio.volume;
  setFill(volume);
}
volume.addEventListener('input', () => {
  audio.volume = volume.value;
  audio.muted = false;
  syncVolume();
});
$('muteBtn').addEventListener('click', () => {
  if (audio.volume === 0) audio.volume = 1;
  audio.muted = !audio.muted;
  syncVolume();
});

// ---------- Capítols ----------
const chapterList = $('chapters');
chapters.forEach((c, i) => {
  const li = document.createElement('li');
  li.className = 'chapter';
  li.innerHTML = `
    <span class="num">${i + 1}</span>
    <div><div class="ch-title">${c.title}</div><div class="ch-sub">${c.sub}</div></div>
    <span class="ch-time">${fmt(c.start)}</span>`;
  li.addEventListener('click', () => jumpTo(c.start));
  chapterList.appendChild(li);
});

// Les targetes dels convidats salten a la seva entrevista
document.querySelectorAll('.card[data-chapter]').forEach((card) => {
  card.addEventListener('click', () => jumpTo(chapters[card.dataset.chapter].start));
});

function updateChapter() {
  let current = 0;
  chapters.forEach((c, i) => { if (audio.currentTime >= c.start) current = i; });
  [...chapterList.children].forEach((li, i) => li.classList.toggle('active', i === current));
  $('nowSub').textContent = chapters[current].title;
}

// ---------- Navegació ----------
const main = $('main');
const navItems = document.querySelectorAll('[data-section]');

document.querySelectorAll('a[href^="#"]').forEach((a) => {
  a.addEventListener('click', (e) => {
    e.preventDefault();
    const id = a.getAttribute('href').slice(1);
    if (id === 'inici') main.scrollTo({ top: 0, behavior: 'smooth' });
    else main.scrollTo({ top: $(id).offsetTop - $('topbar').offsetHeight - 8, behavior: 'smooth' });
  });
});

main.addEventListener('scroll', () => {
  // Barra superior opaca en fer scroll (com a Spotify)
  $('topbar').classList.toggle('solid', main.scrollTop > 220);

  // Marca a la barra lateral la secció visible
  let active = 'inici';
  navItems.forEach((n) => {
    const id = n.dataset.section;
    if (id !== 'inici' && $(id).offsetTop - $('topbar').offsetHeight - 40 <= main.scrollTop) active = id;
  });
  if (main.scrollTop + main.clientHeight >= main.scrollHeight - 4) active = 'presentacio';
  navItems.forEach((n) => n.classList.toggle('active', n.dataset.section === active));
});
main.dispatchEvent(new Event('scroll'));

// ---------- Presentació (Canva) ----------
const slidesFrame = $('slidesFrame');
$('slidesFull').addEventListener('click', () => {
  const req = slidesFrame.requestFullscreen || slidesFrame.webkitRequestFullscreen;
  if (req) req.call(slidesFrame);
  else window.open('https://canva.link/presentacio-podcast-ctrl-alt-futur', '_blank');
});
$('slidesExit').addEventListener('click', () => {
  (document.exitFullscreen || document.webkitExitFullscreen).call(document);
});

// Barra espaiadora = play/pausa
document.addEventListener('keydown', (e) => {
  if (e.code === 'Space' && !['INPUT', 'BUTTON', 'A'].includes(e.target.tagName)) {
    e.preventDefault();
    togglePlay();
  }
});

setFill(seek);
syncVolume();

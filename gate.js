// ---------- Pantalla d'espera fins a l'obertura ----------
(() => {
  const OPENING = new Date('2026-10-10T00:00:00+02:00'); // 10 d'octubre, hora de Catalunya
  const PIN = '2026';
  const CANVA = 'https://www.canva.com/design/DAHWGT2T9Nk/bfgOEFeW4avcOrC-ykzvVQ/view?embed';
  const KEY = 'caf-unlocked';

  const $ = (id) => document.getElementById(id);
  const gate = $('gate');

  let unlocked = false;
  try { unlocked = localStorage.getItem(KEY) === '1'; } catch (e) {}
  if (unlocked || Date.now() >= OPENING) return;

  document.body.classList.add('locked');
  gate.hidden = false;

  const pad = (n) => String(n).padStart(2, '0');
  function tick() {
    const ms = OPENING - Date.now();
    if (ms <= 0) return open();
    const s = Math.floor(ms / 1000);
    $('cdDays').textContent = pad(Math.floor(s / 86400));
    $('cdHours').textContent = pad(Math.floor(s / 3600) % 24);
    $('cdMins').textContent = pad(Math.floor(s / 60) % 60);
    $('cdSecs').textContent = pad(s % 60);
  }
  const timer = setInterval(tick, 1000);
  tick();

  function open() {
    clearInterval(timer);
    gate.classList.add('leaving');
    document.body.classList.remove('locked');
    setTimeout(() => { gate.hidden = true; gate.remove(); }, 400);
  }

  $('pinForm').addEventListener('submit', (e) => {
    e.preventDefault();
    const input = $('pinInput');
    if (input.value.trim() === PIN) {
      try { localStorage.setItem(KEY, '1'); } catch (err) {}
      open();
    } else {
      $('pinError').textContent = 'PIN incorrecte. Torna-ho a provar.';
      input.classList.remove('shake');
      void input.offsetWidth;
      input.classList.add('shake');
      input.select();
    }
  });
  $('pinInput').addEventListener('input', () => { $('pinError').textContent = ''; });

  $('teaserBtn').addEventListener('click', () => {
    const frame = $('teaserFrame');
    const iframe = frame.querySelector('iframe');
    if (!iframe.src) iframe.src = CANVA;
    frame.hidden = !frame.hidden;
    $('teaserBtn').textContent = frame.hidden ? "Veure l'avançament ▸" : 'Amaga ▾';
    if (!frame.hidden) frame.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  });
})();

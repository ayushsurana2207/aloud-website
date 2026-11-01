// Decorative wave bars (same heights and timings as the design).
const waveHeights = [8, 14, 22, 18, 26, 20, 12, 18, 24, 16, 10, 20, 26, 14, 8, 16, 22, 12, 18, 24, 14, 10, 16, 8, 12, 20, 14, 8];
document.getElementById('wave').append(...waveHeights.map((h, i) => {
  const s = document.createElement('span');
  s.style.height = h + 'px';
  s.style.animationDuration = (0.6 + (i % 6) * 0.11).toFixed(2) + 's';
  return s;
}));

// Class map: 180 dots from the design's seeded pattern (~30% understood, ~29% partly, rest gaps).
let seed = 13;
const rnd = () => { seed = (seed * 9301 + 49297) % 233280; return seed / 233280; };
const dots = document.getElementById('dots');
for (let i = 0; i < 180; i++) {
  const r = rnd() * 100;
  const d = document.createElement('span');
  d.className = r < 30 ? 'u' : r < 59 ? 'p' : 'g';
  dots.append(d);
}

// Early-access dialog. Native <dialog> gives focus trapping and Esc-to-close for free.
const dialog = document.getElementById('access');
const form = dialog.querySelector('form');
const input = form.elements.email;
const error = dialog.querySelector('.ea-error');
const done = dialog.querySelector('.ea-done');
const submit = form.querySelector('[type=submit]');

const openAccess = () => {
  form.hidden = false;
  done.hidden = true;
  error.textContent = '';
  dialog.showModal();
};
document.querySelectorAll('[data-open-access]').forEach((btn) => btn.addEventListener('click', openAccess));
// The Privacy/Terms pages link here as /#access so their CTA opens the same form.
if (location.hash === '#access') {
  history.replaceState(null, '', location.pathname);
  openAccess();
}
dialog.querySelector('[data-close]').addEventListener('click', () => dialog.close());
dialog.addEventListener('click', (e) => { if (e.target === dialog) dialog.close(); }); // backdrop click

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  error.textContent = '';
  if (!input.checkValidity()) {
    error.textContent = 'Please enter a valid email address.';
    input.focus();
    return;
  }
  submit.disabled = true;
  submit.textContent = 'Sending…';
  try {
    const res = await fetch('/api/early-access', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ email: input.value, website: form.elements.website.value }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || 'Something went wrong. Please try again.');
    form.hidden = true;
    done.hidden = false;
    form.reset();
  } catch (err) {
    error.textContent = err.message === 'Failed to fetch' ? 'Network error. Please try again.' : err.message;
  } finally {
    submit.disabled = false;
    submit.textContent = 'Request access';
  }
});

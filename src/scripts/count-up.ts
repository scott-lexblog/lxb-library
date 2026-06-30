import { els, fmt } from './utils';

const DURATION = 1200;
const START_RATIO = 0.8;

function easeOut(t: number): number {
  return 1 - Math.pow(1 - t, 3);
}

function animateCounter(el: HTMLElement) {
  const target = parseInt(el.getAttribute('data-count-to') || '0', 10);
  const start = Math.floor(target * START_RATIO);
  const range = target - start;
  let t0: number;

  el.textContent = fmt(start);

  function tick(now: number) {
    if (!t0) t0 = now;
    const progress = Math.min((now - t0) / DURATION, 1);
    const current = Math.floor(start + range * easeOut(progress));
    el.textContent = fmt(current);
    if (progress < 1) requestAnimationFrame(tick);
  }

  requestAnimationFrame(tick);
}

function init() {
  const grid = document.querySelector('[data-stats-grid]');
  if (!grid) return;

  const counters = els<HTMLElement>('count-to', grid);
  if (!counters.length) return;

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        counters.forEach(animateCounter);
        observer.disconnect();
      }
    });
  }, { threshold: 0.3 });

  observer.observe(grid);
}

init();

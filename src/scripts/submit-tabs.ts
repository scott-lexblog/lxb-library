import { el, els } from './utils';

function initSubmitTabs() {
  const root = el('submit-tabs');
  if (!root) return;

  const triggers = els<HTMLButtonElement>('tab-trigger', root);
  const panels = els('tab-panel');

  function activate(tab: string) {
    triggers.forEach(btn => {
      const isActive = btn.getAttribute('data-tab-trigger') === tab;
      btn.classList.toggle('text-[#0a0a0b]', isActive);
      btn.classList.toggle('font-bold', isActive);
      btn.classList.toggle('border-[#0a0a0b]', isActive);
      btn.classList.toggle('text-[#8a8d93]', !isActive);
      btn.classList.toggle('font-medium', !isActive);
      btn.classList.toggle('border-transparent', !isActive);
      btn.setAttribute('aria-selected', String(isActive));
    });

    panels.forEach(panel => {
      const isActive = panel.getAttribute('data-tab-panel') === tab;
      panel.classList.toggle('hidden', !isActive);
    });
  }

  triggers.forEach(btn => {
    btn.addEventListener('click', () => {
      const tab = btn.getAttribute('data-tab-trigger');
      if (tab) activate(tab);
    });
  });
}

initSubmitTabs();

import { el } from './utils';

function initMobileMenu() {
  const toggle = el('mobile-menu-toggle');
  const menu = el('mobile-menu');
  const iconOpen = el('icon-hamburger');
  const iconClose = el('icon-close');
  const header = el('site-header');

  if (!toggle || !menu || !iconOpen || !iconClose || !header) return;

  toggle.addEventListener('click', () => {
    const isOpen = !menu.classList.contains('hidden');

    if (isOpen) {
      menu.classList.add('hidden');
      menu.classList.remove('flex');
      iconOpen.classList.remove('hidden');
      iconClose.classList.add('hidden');
      header.classList.remove('fixed', 'top-0', 'left-0', 'right-0');
      document.body.classList.remove('overflow-hidden');
    } else {
      menu.classList.remove('hidden');
      menu.classList.add('flex');
      iconOpen.classList.add('hidden');
      iconClose.classList.remove('hidden');
      header.classList.add('fixed', 'top-0', 'left-0', 'right-0');
      document.body.classList.add('overflow-hidden');
    }
  });
}

initMobileMenu();

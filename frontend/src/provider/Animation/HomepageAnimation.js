
export function initNav() {
  const header = document.querySelector('.site-header');
  const menuButton = document.getElementById('menu-toggle');
  const menu = document.getElementById('nav-links');
  
  if (!menuButton || !menu) return;
  
  const links = menu.querySelectorAll('a[href^="#"]');
  
  menuButton.addEventListener('click', () => {
    const isOpen = menu.classList.toggle('open');
    menuButton.setAttribute('aria-expanded', isOpen);
  });
  
  links.forEach((link) => {
    link.addEventListener('click', () => {
      menu.classList.remove('open');
      menuButton.setAttribute('aria-expanded', false);
    });
  });
  
  const sectionIds = ['home', 'about', 'features', 'how-it-works', 'contact'];

  window.addEventListener('scroll', () => {
    if (!header) return;
    header.classList.toggle('scrolled', window.scrollY > 10);

    let current = 'home';
    sectionIds.forEach((id) => {
      const section = document.getElementById(id);
      if (section && window.scrollY >= section.offsetTop - 150) current = id;
    });

    links.forEach((link) => {
      link.classList.toggle('is-active', link.getAttribute('href') === '#' + current);
    });
  });
}

const DOMINO_EASE = 'cubic-bezier(0.16, 1, 0.3, 1)';

const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
const prefersReducedMotion = () => reducedMotion.matches;

const DOMINO_LEAVE_EASE = 'cubic-bezier(0.4, 0, 0.2, 1)';

function isOnscreen(el, viewHeight) {
  const rect = el.getBoundingClientRect();
  return rect.bottom > 24 && rect.top < viewHeight - 24;
}

function playDominoGroup(items, host, { leaving = false, direction = 0 } = {}) {
  if (!items.length) return Promise.resolve();

  if (prefersReducedMotion()) {
    items.forEach((el) => el.classList.add('in'));
    return Promise.resolve();
  }

  const isChrome =
    host?.matches?.('nav, [id$="-navbar"], [id$="-tab-strip"]') ||
    host?.closest?.('nav[id$="-navbar"]');
  const clipHost = host && !isChrome && !host.classList.contains('hero');
  const prevOverflow = host?.style.overflow ?? '';
  const prevOverflowX = host?.style.overflowX ?? '';
  const x = direction ? 18 * direction : 0;

  if (host && !isChrome) {
    host.style.overflowX = 'hidden';
    if (clipHost) host.style.overflow = 'hidden';
  }

  const pending = items.map((el, i) => {
    const layer = Math.min(i, 10);
    const delay = i * (leaving ? 32 : 64);
    const startScale = leaving ? 1 : 1.045 + layer * 0.012;
    const endScale = leaving ? 0.94 - layer * 0.006 : 1;
    const startY = leaving ? 0 : 12 + layer * 3;
    const endY = leaving ? -8 - layer * 2 : 0;
    const startX = leaving ? 0 : x;
    const endX = leaving ? -x : 0;

    if (leaving) {
      const running = el.getAnimations();
      for (let n = 0; n < running.length; n += 1) running[n].cancel();
    }
    const fadeOnly =
      el.matches?.('nav, [id$="-navbar"], [id$="-tab-strip"]') ||
      el.closest?.('nav[id$="-navbar"]');

    if (!fadeOnly) el.style.transformOrigin = '50% 40%';

    const animation = el.animate(
      fadeOnly
        ? [{ opacity: leaving ? 1 : 0 }, { opacity: leaving ? 0 : 1 }]
        : [
            {
              opacity: leaving ? 1 : 0,
              transform: `translate3d(${startX}px, ${startY}px, 0) scale(${startScale})`,
            },
            {
              opacity: leaving ? 0 : 1,
              transform: `translate3d(${endX}px, ${endY}px, 0) scale(${endScale})`,
            },
          ],
      {
        duration: fadeOnly ? (leaving ? 420 : 700) : leaving ? 280 : 720,
        delay: fadeOnly ? 0 : delay,
        easing: leaving ? DOMINO_LEAVE_EASE : DOMINO_EASE,
        fill: 'both',
        composite: 'replace',
      },
    );

    return animation.finished
      .then(() => {
        if (leaving) return;
        animation.cancel();
        el.classList.add('in');
        el.style.opacity = '';
        el.style.transform = '';
        el.style.transformOrigin = '';
      })
      .catch(() => {
        if (leaving) return;
        el.classList.add('in');
        el.style.opacity = '';
        el.style.transform = '';
      });
  });

  return Promise.all(pending).finally(() => {
    if (!host) return;
    host.style.overflow = prevOverflow;
    host.style.overflowX = prevOverflowX;
  });
}

const PAGE_SELECTOR = '[data-domino-page], [data-home-page]';

function collectDominoGroups(page) {
  const groups = new Map();

  const add = (host, nodes) => {
    const items = [...nodes].filter(Boolean);
    if (!host || !items.length) return;
    if (!groups.has(host)) groups.set(host, []);
    items.forEach((el) => {
      if (!groups.get(host).includes(el)) groups.get(host).push(el);
    });
  };

  page.querySelectorAll('.reveal, [data-domino-enter]').forEach((el) => {
    if (el.closest('nav[id$="-navbar"]')) return;
    add(el.closest('section, footer, article, main') || page, [el]);
  });

  const footer = page.querySelector('footer');
  if (footer) {
    add(footer, footer.querySelectorAll('.footer-grid > div'));
    add(footer, [footer.querySelector('.copyright')]);
  }

  return groups;
}

function observeDominoGroups(groups) {
  if (prefersReducedMotion()) {
    groups.forEach((group) => group.forEach((el) => el.classList.add('in')));
    return;
  }

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      playDominoGroup(groups.get(entry.target) || [], entry.target);
      observer.unobserve(entry.target);
    });
  }, { threshold: 0.12, rootMargin: '40px 0px -8% 0px' });

  groups.forEach((_, host) => observer.observe(host));
}

function playChromeFade(root, { leaving = false } = {}) {
  const nav = root?.matches?.('nav[id$="-navbar"]')
    ? root
    : root?.querySelector?.('nav[id$="-navbar"]');
  if (!nav) return Promise.resolve();
  return playDominoGroup([nav], null, { leaving });
}

export async function playPageDominoLeave(root, { direction = 1 } = {}) {
  if (!root) return false;
  if (prefersReducedMotion()) return true;

  const groups = collectDominoGroups(root);
  const pending = [playChromeFade(root, { leaving: true })];
  const viewHeight = window.innerHeight;

  groups.forEach((items, host) => {
    const visible = items.filter((el) => isOnscreen(el, viewHeight));
    if (visible.length) pending.push(playDominoGroup(visible, host, { leaving: true, direction }));
  });

  if (!pending.length) {
    await playDominoGroup([root], root, { leaving: true, direction });
    return true;
  }

  await Promise.all(pending);
  return true;
}

function collectPortalLeaveItems(page) {
  const main = page.querySelector?.('main') || page;
  const viewHeight = window.innerHeight;
  const items = [];

  const dashboard = [...(main.querySelectorAll?.('[data-dashboard-enter]') || [])];
  if (dashboard.length) {
    dashboard.forEach((el) => {
      if (el.id === 'primary-stats' || el.id === 'secondary-stats') {
        const cards = [...el.children];
        items.push(...(cards.length ? cards : [el]));
        return;
      }
      items.push(el);
    });
  } else {
    items.push(
      ...[...main.children].filter(
        (el) => el.tagName !== 'NAV' && !el.matches?.('nav[id$="-navbar"]'),
      ),
    );
  }

  const visible = items.filter((el) => isOnscreen(el, viewHeight));
  return (visible.length ? visible : items).slice(0, 12);
}

export async function playPortalDominoLeave(root = document, { direction = -1 } = {}) {
  if (!root) return false;
  if (prefersReducedMotion()) return true;

  const page =
    root.matches?.('[data-dashboard-page], [data-domino-page], .min-h-screen')
      ? root
      : root.querySelector?.('[data-dashboard-page], [data-domino-page], .min-h-screen') || root;

  const host = page.querySelector?.('main') || page;
  const items = collectPortalLeaveItems(page);

  await Promise.all([
    playChromeFade(document, { leaving: true }),
    items.length
      ? playDominoGroup(items, host, { leaving: true, direction })
      : playDominoGroup([page], page, { leaving: true, direction }),
  ]);

  return true;
}

export function playImmediateDomino(root) {
  if (!root) return Promise.resolve();

  const items = root.matches?.('.reveal, [data-domino-enter]')
    ? [root]
    : [...root.querySelectorAll('.reveal, [data-domino-enter]')];
  const unique = items.length ? items : [root];

  unique.forEach((el) => el.classList.remove('in'));
  return playDominoGroup(unique, root);
}

export function playPageDomino(root) {
  if (!root) return;

  const items = root.matches?.('.reveal, [data-domino-enter], article')
    ? [root]
    : [...root.querySelectorAll('.reveal, [data-domino-enter], article')];

  if (!items.length) {
    playDominoGroup([root], root);
    return;
  }

  const groups = new Map();
  items.forEach((el) => {
    const host = el.closest('article, section, footer, nav') || el;
    if (!groups.has(host)) groups.set(host, []);
    if (!groups.get(host).includes(el)) groups.get(host).push(el);
  });

  observeDominoGroups(groups);
}

export function initReveal(root = document) {
  const page =
    root.querySelector?.(PAGE_SELECTOR) ||
    root.closest?.(PAGE_SELECTOR) ||
    document.querySelector(PAGE_SELECTOR);
  const items = (page || root).querySelectorAll?.('.reveal') ?? [];

  if (!page) {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('in');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.15 });

    items.forEach((item) => observer.observe(item));
    return;
  }

  const groups = collectDominoGroups(page);
  requestAnimationFrame(() => {
    playChromeFade(page, { leaving: false });
    observeDominoGroups(groups);
  });
}

function countUp(element) {
  const target = Number(element.dataset.count);
  const steps = 60;
  let step = 0;

  const timer = setInterval(() => {
    step++;
    const value = Math.round((target * step) / steps);
    element.textContent = value.toLocaleString();
    if (step === steps) clearInterval(timer);
  }, 25);
}

export function initStats() {
  const numbers = document.querySelectorAll('[data-count]');

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        countUp(entry.target);
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.6 });

  numbers.forEach((number) => observer.observe(number));
}

export function initFaq() {
  const items = document.querySelectorAll('.faq-item');

  items.forEach((item) => {
    const question = item.querySelector('.faq-q');

    question.addEventListener('click', () => {
      const wasOpen = item.classList.contains('open');
      items.forEach((other) => {
        other.classList.remove('open');
        other.querySelector('.faq-q').setAttribute('aria-expanded', false);
      });
      if (!wasOpen) {
        item.classList.add('open');
        question.setAttribute('aria-expanded', true);
      }
    });
  });
}
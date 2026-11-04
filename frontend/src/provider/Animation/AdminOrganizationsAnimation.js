import { initReveal, playPageDomino } from './HomepageAnimation.js';

let parallaxCleanup = null;

function prefersReducedMotion() {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

function isMobileView() {
    return window.matchMedia('(max-width: 767px)').matches;
}

function updateOrgParallax(root) {
    const cards = root.querySelectorAll('.org-parallax-inner');
    if (!cards.length) return;

    if (prefersReducedMotion() || !isMobileView()) {
        cards.forEach((el) => {
            el.style.transform = '';
        });
        return;
    }

    const vh = window.innerHeight || 1;
    const focus = vh * 0.42;

    cards.forEach((el) => {
        const rect = el.getBoundingClientRect();
        if (rect.bottom < -80 || rect.top > vh + 80) return;

        const mid = rect.top + rect.height / 2;
        const t = (mid - focus) / vh;
        const scale = Math.max(0.92, Math.min(1.045, 1.03 - Math.abs(t) * 0.18));
        const y = t * 22;
        el.style.transform = `translate3d(0, ${y.toFixed(1)}px, 0) scale(${scale.toFixed(3)})`;
    });
}

export function initOrgParallaxScale(root = document) {
    if (typeof parallaxCleanup === 'function') {
        parallaxCleanup();
        parallaxCleanup = null;
    }

    const page = root.querySelector?.('#admin-orgs-page') || document.getElementById('admin-orgs-page') || root;
    if (!page) return () => {};

    let frame = 0;
    const tick = () => {
        frame = 0;
        updateOrgParallax(page);
    };
    const onScroll = () => {
        if (frame) return;
        frame = requestAnimationFrame(tick);
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    tick();

    parallaxCleanup = () => {
        window.removeEventListener('scroll', onScroll);
        window.removeEventListener('resize', onScroll);
        if (frame) cancelAnimationFrame(frame);
        page.querySelectorAll?.('.org-parallax-inner').forEach((el) => {
            el.style.transform = '';
        });
    };

    return parallaxCleanup;
}

export function initAdminOrganizationsAnimations(root = document) {
    initReveal(root);
    initOrgParallaxScale(root);
}

export function animateDominoList(root) {
    if (!root) return;
    playPageDomino(root);
    requestAnimationFrame(() => initOrgParallaxScale(document));
}

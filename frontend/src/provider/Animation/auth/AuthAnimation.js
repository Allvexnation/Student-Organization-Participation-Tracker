const TRANSITION_KEY = 'authRouteTransition';
const LAST_PATH_KEY = 'authLastPath';
const DASHBOARD_FROM_LOGIN_KEY = 'dashboardFromLogin';

import { playPageDominoLeave, playPortalDominoLeave } from '../HomepageAnimation.js';

const reducedMotion =
    typeof window !== 'undefined' &&
    window.matchMedia('(prefers-reduced-motion: reduce)');

const prefersReducedMotion = () => Boolean(reducedMotion?.matches);

function authKind(path) {
    const match = String(path || '').match(
        /^\/auth\/(admin|adviser|student)\/(login|forgot-password)/,
    );
    if (!match) return null;
    return { role: match[1], page: match[2] };
}

function isHomePath(path) {
    const value = String(path || '');
    return value === '/' || value === '';
}

const ROLE_ORDER = { admin: 0, adviser: 1, student: 2 };

function roleKeyFromRole(role) {
    return role === 'admin' ? 'administrator' : role;
}

function updateRoleSelection(role) {
    const roleKey = roleKeyFromRole(role);
    document.querySelectorAll('[data-role-card]').forEach((card) => {
        const active = card.dataset.roleCard === roleKey;
        card.setAttribute('data-active', String(active));
        if (active) card.setAttribute('aria-current', 'page');
        else card.removeAttribute('aria-current');
    });

    const indicator = document.querySelector('[data-chip-indicator]');
    const chipIndex = { administrator: 0, adviser: 1, student: 2 }[roleKey] ?? 0;
    if (indicator) {
        indicator.style.transform = `translateX(calc(${chipIndex} * (100% + 0.25rem)))`;
    }
}

function inferDirection(from, to) {
    const start = authKind(from);
    const end = authKind(to);
    if (isHomePath(to) && start) return -1;
    if (isHomePath(from) && end) return 1;
    if (!start || !end) return 0;

    if (start.role !== end.role) {
        const fromIndex = ROLE_ORDER[start.role];
        const toIndex = ROLE_ORDER[end.role];
        if (fromIndex == null || toIndex == null) return 1;
        return toIndex > fromIndex ? 1 : -1;
    }

    if (start.page === end.page) return 0;
    return end.page === 'forgot-password' ? 1 : -1;
}

function duration(ms) {
    return prefersReducedMotion() ? 0 : ms;
}

const ANIMATE_OPTS = { fill: 'both', composite: 'replace' };

let authNavigating = false;

const DOMINO_EASE = 'cubic-bezier(0.16, 1, 0.3, 1)';
const DOMINO_LEAVE_EASE = 'cubic-bezier(0.4, 0, 0.2, 1)';

let overflowLocks = 0;
let overflowState = null;

function lockOverflow(host) {
    overflowLocks += 1;
    if (overflowLocks === 1) {
        overflowState = { hostOverflowX: host?.style.overflowX ?? '' };
        if (host) host.style.overflowX = 'hidden';
    }

    return () => {
        overflowLocks = Math.max(0, overflowLocks - 1);
        if (overflowLocks || !overflowState) return;
        if (host) host.style.overflowX = overflowState.hostOverflowX;
        overflowState = null;
    };
}

function authHost(root) {
    return (
        root?.closest?.('[data-auth-shell]') ??
        root?.querySelector?.('[data-auth-shell]') ??
        document.querySelector('[data-auth-shell]')
    );
}

function visibleEnterItems(root) {
    if (!root) return [];
    const nested = [
        ...root.querySelectorAll('[data-auth-enter], [data-auth-bg], [data-auth-fade]'),
    ].filter((el) => !el.closest('[hidden]'));
    if (
        root.matches?.('[data-auth-enter], [data-auth-bg], [data-auth-fade]') &&
        !root.closest('[hidden]')
    ) {
        return [root, ...nested.filter((el) => el !== root)];
    }
    return nested;
}

function groupByLane(items) {
    const lanes = new Map();
    items.forEach((el) => {
        const lane = el.dataset.authLane || 'default';
        if (!lanes.has(lane)) lanes.set(lane, []);
        lanes.get(lane).push(el);
    });
    return lanes;
}

function runDomino(items, { direction = 0, leaving = false } = {}) {
    const pending = [];
    const x = direction ? 22 * direction : 0;

    groupByLane(items).forEach((laneItems) => {
        laneItems.forEach((el, i) => {
            const depth = Number(el.dataset.authDepth ?? i);
            const layer = Math.min(Number.isFinite(depth) ? depth : i, 10);
            const isBg = el.hasAttribute('data-auth-bg') || el.dataset.authLane === 'bg';
            const delay = i * (leaving ? 38 : 64);
            const startScale = leaving ? 1 : isBg ? 1.08 + layer * 0.02 : 1.045 + layer * 0.012;
            const endScale = leaving ? (isBg ? 0.86 : 0.94 - layer * 0.006) : 1;
            const startY = leaving ? 0 : isBg ? 16 + layer * 4 : 10 + layer * 3;
            const endY = leaving ? (isBg ? -18 : -8 - layer * 2) : 0;
            const startX = leaving ? 0 : x;
            const endX = leaving ? -x : 0;

            if (leaving) {
                const running = el.getAnimations();
                for (let n = 0; n < running.length; n += 1) running[n].cancel();
            }

            const fadeOnly =
                el.tagName === 'IMG' ||
                el.hasAttribute('data-auth-fade') ||
                el.hasAttribute('data-auth-bg') ||
                el.dataset.authLane === 'bg';

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
                    ...ANIMATE_OPTS,
                    duration: fadeOnly ? (leaving ? 480 : 900) : leaving ? 320 : 720,
                    delay: fadeOnly ? delay + (leaving ? 0 : 80) : delay,
                    easing: leaving ? DOMINO_LEAVE_EASE : DOMINO_EASE,
                },
            );

            pending.push(
                animation.finished
                    .then(() => {
                        if (!leaving) {
                            animation.cancel();
                            el.style.transformOrigin = '';
                            el.style.opacity = '';
                            el.style.transform = '';
                        }
                    })
                    .catch(() => {}),
            );
        });
    });

    return Promise.all(pending);
}

export function playAuthDominoEnter(root = document, { direction = 0 } = {}) {
    const items = visibleEnterItems(root);
    if (!items.length) return false;

    const host = authHost(root);

    if (!duration(1)) {
        items.forEach((el) => {
            el.style.opacity = '';
            el.style.transform = '';
        });
        return true;
    }

    items.forEach((el) => {
        el.style.opacity = '0';
    });

    const unlock = lockOverflow(host);
    runDomino(items, { direction, leaving: false }).finally(unlock);
    return true;
}

async function fadeAuthChips(chips, leaving) {
    if (!chips) return;

    chips.style.pointerEvents = leaving ? 'none' : '';

    if (!duration(1)) {
        chips.style.opacity = leaving ? '0' : '';
        return;
    }

    try {
        await chips.animate(
            leaving
                ? [{ opacity: 1, transform: 'translate3d(0, 0, 0)' }, { opacity: 0, transform: 'translate3d(0, -8px, 0)' }]
                : [{ opacity: 0, transform: 'translate3d(0, -8px, 0)' }, { opacity: 1, transform: 'translate3d(0, 0, 0)' }],
            {
                ...ANIMATE_OPTS,
                duration: leaving ? 280 : 420,
                easing: leaving ? DOMINO_LEAVE_EASE : DOMINO_EASE,
            },
        ).finished;
    } catch {

    }

    chips.style.opacity = leaving ? '0' : '';
    chips.style.transform = '';
}

export async function playAuthDominoLeave(root = document, { direction = 1 } = {}) {
    const items = visibleEnterItems(root);
    if (!items.length || !duration(1)) return false;

    const host = authHost(root);
    const unlock = lockOverflow(host);
    try {
        await runDomino(items, { direction, leaving: true });
    } finally {
        unlock();
    }
    return true;
}

export function peekDashboardFromLogin() {
    try {
        return sessionStorage.getItem(DASHBOARD_FROM_LOGIN_KEY) === '1';
    } catch {
        return false;
    }
}

export function consumeDashboardFromLogin() {
    try {
        const flagged = peekDashboardFromLogin();
        if (flagged) sessionStorage.removeItem(DASHBOARD_FROM_LOGIN_KEY);
        return flagged;
    } catch {
        return false;
    }
}

function goToPath(path) {
    if (window.appNavigate) {
        return window.appNavigate(path);
    }

    window.history.pushState({}, '', path);
    window.dispatchEvent(new PopStateEvent('popstate'));
}

export async function navigateAfterLogin(path) {
    try {
        sessionStorage.setItem(DASHBOARD_FROM_LOGIN_KEY, '1');
    } catch {

    }

    const authShell = document.querySelector('[data-auth-shell]');
    if (authShell?.querySelector('[data-auth-enter], [data-auth-bg]')) {
        await playAuthDominoLeave(authShell, { direction: 1 });
    } else if (authShell && duration(1)) {
        try {
            await authShell.animate(
                [
                    { opacity: 1, transform: 'translate3d(0, 0, 0) scale(1)' },
                    { opacity: 0, transform: 'translate3d(0, -18px, 0) scale(0.97)' },
                ],
                {
                    duration: 420,
                    easing: 'cubic-bezier(0.4, 0, 0.2, 1)',
                    fill: 'forwards',
                },
            ).finished;
        } catch {

        }
    }

    const leavingRoot = authShell || document.getElementById('root');
    leavingRoot?.getAnimations?.({ subtree: true })?.forEach((animation) => {
        try {
            animation.cancel();
        } catch {

        }
    });
    overflowLocks = 0;
    overflowState = null;

    await goToPath(path);
}

export async function navigateAfterLogout(path) {
    try {
        sessionStorage.setItem(TRANSITION_KEY, '-1');
        sessionStorage.setItem(LAST_PATH_KEY, window.location.pathname);
    } catch {

    }

    const dashboard = document.querySelector('[data-dashboard-page]');
    const publicPage = document.querySelector('[data-home-page], [data-domino-page]');
    const portal =
        dashboard ||
        publicPage ||
        document.querySelector('.min-h-screen') ||
        document.body;

    if (duration(1)) {
        if (publicPage && !dashboard) {
            await playPageDominoLeave(publicPage, { direction: -1 });
        } else {
            await playPortalDominoLeave(portal, { direction: -1 });
        }
    }

    goToPath(path);
}

export async function navigateAuthRoute(path) {
    const nextPath = new URL(path, window.location.origin).pathname;
    if (nextPath === window.location.pathname || authNavigating) return;
    authNavigating = true;

    const fromKind = authKind(window.location.pathname);
    const toKind = authKind(nextPath);
    const goingHome = isHomePath(nextPath);
    const keepChips = fromKind?.page === 'login' && toKind?.page === 'login';
    const keepScene =
        Boolean(fromKind && toKind) &&
        fromKind.role === toKind.role &&
        fromKind.page !== toKind.page;
    const direction = inferDirection(window.location.pathname, nextPath) || 1;
    sessionStorage.setItem(TRANSITION_KEY, String(direction));

    if (keepChips && toKind?.role) updateRoleSelection(toKind.role);

    const publicPage = document.querySelector('[data-home-page], [data-domino-page]');
    const authShell = document.querySelector('[data-auth-shell]');
    const shell = goingHome ? authShell : null;
    const panel = goingHome ? null : document.querySelector('[data-auth-panel]');
    const aside = goingHome || keepChips ? null : document.querySelector('[data-auth-aside]');
    const ms = duration(220);
    const pending = [];

    if (publicPage && toKind) {
        await playPageDominoLeave(publicPage, { direction });
    } else if (keepChips && panel) {
        const caption = document.querySelector('[data-role-caption]');
        await Promise.all([
            playAuthDominoLeave(panel, { direction }),
            caption ? playAuthDominoLeave(caption, { direction }) : Promise.resolve(),
        ]);
    } else if (keepScene && panel) {
        const asideCopy = document.querySelector('[data-auth-aside]');
        const chips =
            fromKind?.page === 'login' && toKind?.page === 'forgot-password'
                ? document.querySelector('[data-auth-chips]')
                : null;
        await Promise.all([
            playAuthDominoLeave(panel, { direction }),
            asideCopy ? playAuthDominoLeave(asideCopy, { direction }) : Promise.resolve(),
            fadeAuthChips(chips, true),
        ]);
    } else if (authShell?.querySelector('[data-auth-enter]')) {
        await playAuthDominoLeave(authShell, { direction });
    } else if (ms && (shell || panel)) {
        pending.push(
            (shell ?? panel).animate(
                [
                    { opacity: 1, transform: 'translateX(0)' },
                    { opacity: 0, transform: `translateX(${-32 * direction}px)` },
                ],
                { duration: ms, easing: 'ease-in', fill: 'forwards' },
            ).finished,
        );
        if (aside) {
            pending.push(
                aside.animate([{ opacity: 1 }, { opacity: 0 }], {
                    duration: Math.round(ms * 0.8),
                    easing: 'ease-in',
                    fill: 'forwards',
                }).finished,
            );
        }
    }

    if (pending.length) {
        try {
            await Promise.all(pending);
        } catch {

        }
    }

    try {
        if (window.appNavigate) {
            window.appNavigate(nextPath);
            return;
        }

        window.history.pushState({}, '', nextPath);
        window.dispatchEvent(new PopStateEvent('popstate'));
    } finally {
        authNavigating = false;
    }
}

export function bindAuthRouteLinks(root = document) {
    const links = root.querySelectorAll('[data-auth-route], a[href^="/auth/"]');

    links.forEach((link) => {
        if (link.dataset.authRouteBound === 'true') return;
        link.dataset.authRouteBound = 'true';

        link.addEventListener('click', (event) => {
            if (event.defaultPrevented || event.button !== 0) return;
            if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
            if (link.target && link.target !== '_self') return;

            const href = link.getAttribute('href');
            if (!href || href.startsWith('#')) return;

            event.preventDefault();
            navigateAuthRoute(href);
        });
    });
}

export function playAuthPageEnter() {
    const current = window.location.pathname;
    const previous = sessionStorage.getItem(LAST_PATH_KEY) || '';
    const stored = sessionStorage.getItem(TRANSITION_KEY);
    sessionStorage.removeItem(TRANSITION_KEY);
    sessionStorage.setItem(LAST_PATH_KEY, current);

    const direction =
        stored != null ? Number(stored) : inferDirection(previous, current);

    const home = isHomePath(current) ? document.querySelector('[data-home-page]') : null;
    const panel = home ? null : document.querySelector('[data-auth-panel]');
    const fromKind = authKind(previous);
    const toKind = authKind(current);
    const keepChips = fromKind?.page === 'login' && toKind?.page === 'login';
    const keepScene =
        Boolean(fromKind && toKind) &&
        fromKind.role === toKind.role &&
        fromKind.page !== toKind.page;
    const aside = home || keepChips ? null : document.querySelector('[data-auth-aside]');
    const target = home ?? panel;
    if (!target) return;
    if (home?.querySelector('.reveal')) return;

    const shell = document.querySelector('[data-auth-shell]');
    if (keepChips && panel) {
        playAuthDominoEnter(panel, { direction });
        const caption = document.querySelector('[data-role-caption]');
        if (caption) playAuthDominoEnter(caption, { direction });
        return;
    }

    if (keepScene && panel) {
        playAuthDominoEnter(panel, { direction });
        const asideCopy = document.querySelector('[data-auth-aside]');
        if (asideCopy) playAuthDominoEnter(asideCopy, { direction });
        if (fromKind?.page === 'forgot-password' && toKind?.page === 'login') {
            fadeAuthChips(document.querySelector('[data-auth-chips]'), false);
        }
        return;
    }

    if (shell?.querySelector('[data-auth-enter]') && playAuthDominoEnter(shell, { direction })) {
        return;
    }

    const ms = duration(direction ? 320 : 280);
    if (!ms) return;

    target.animate(
        [
            {
                opacity: 0,
                transform: direction
                    ? `translateX(${36 * direction}px)`
                    : 'translateY(16px)',
            },
            { opacity: 1, transform: 'translateX(0) translateY(0)' },
        ],
        { duration: ms, easing: 'cubic-bezier(0.2, 0.7, 0.2, 1)' },
    );

    aside?.animate(
        [
            { opacity: 0, transform: 'translateY(8px)' },
            { opacity: 1, transform: 'translateY(0)' },
        ],
        {
            duration: ms + 40,
            easing: 'cubic-bezier(0.2, 0.7, 0.2, 1)',
            delay: duration(40),
        },
    );
}

export function initAuthRouteAnimation() {
    bindAuthRouteLinks();
    playAuthPageEnter();
}

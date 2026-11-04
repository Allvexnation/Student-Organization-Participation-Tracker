import { skeletonStatCard } from '../../SkeletonLoading.js';
import { dashboardImages } from '../../../static/Dashboard/Dashboard.js';
import {
    playPageDomino,
    playPortalDominoLeave,
} from '../../../provider/Animation/HomepageAnimation.js';
import {
    consumeDashboardFromLogin,
    peekDashboardFromLogin,
} from '../../../provider/Animation/auth/AuthAnimation.js';

let dashboardCardNavigating = false;

function getGreeting() {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
}

function formatDate() {
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    return new Date().toLocaleDateString('en-US', options);
}

function createIcons() {
    if (typeof lucide !== 'undefined') {
        lucide.createIcons();
    }
}

function enterHoldStyle(fromLogin) {
    return fromLogin ? 'opacity:0;' : '';
}

function escapeHtml(value) {
    return String(value ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}

export function initDashboardTransition() {
    createIcons();

    const page = document.querySelector('[data-dashboard-page]');
    if (!page) return () => consumeDashboardFromLogin();

    page.querySelectorAll('[data-dashboard-enter="chrome"]').forEach((el) => {
        playPageDomino(el);
    });

    return playDashboardEnter;
}

export function playDashboardEnter() {
    consumeDashboardFromLogin();

    const page = document.querySelector('[data-dashboard-page]');
    if (!page) return;

    page.querySelectorAll('[data-dashboard-enter="content"]').forEach((el) => {
        el.style.opacity = '';
    });

    playPageDomino(page.querySelector('#primary-stats'));
    playPageDomino(page.querySelector('#secondary-stats'));
    playPageDomino(page.querySelector('#audit-logs-section'));
}

export function DashboardLayout({
    navbar = '',
    displayName = '',
    extra = '',
    badge = 'Dashboard',
    subtitle = 'Review your latest counts, activity, and records in one place.',
} = {}) {
    const fromLogin = peekDashboardFromLogin();
    const hide = enterHoldStyle(fromLogin);
    const safeName = escapeHtml(displayName);
    const safeBadge = escapeHtml(badge);
    const safeSubtitle = escapeHtml(subtitle);

    return `
        <div class="min-h-screen bg-surface font-sans text-ink" data-dashboard-page>
            ${navbar}

            <main class="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-5 sm:py-8 lg:py-10">
                <header class="reveal mb-6 sm:mb-8" data-dashboard-enter="chrome" data-domino-enter style="${hide}">
                    <div class="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                        <div class="min-w-0">
                            <span class="inline-flex items-center gap-2 rounded-full border border-line bg-white px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-blue-600">
                                <span class="h-1.5 w-1.5 rounded-full bg-yellow"></span>
                                ${safeBadge}
                            </span>
                            <h1 class="mt-3 text-[1.65rem] sm:text-3xl lg:text-[2.1rem] font-semibold tracking-tight text-ink leading-tight break-words">
                                ${getGreeting()}, ${safeName}
                            </h1>
                            <p class="mt-2 max-w-2xl text-sm sm:text-[15px] text-body leading-relaxed">
                                ${safeSubtitle}
                            </p>
                        </div>
                        <div class="flex items-center gap-2.5 self-start lg:self-auto rounded-2xl border border-line bg-white px-3.5 py-2.5 shadow-sm">
                            <span class="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50 text-blue-600 shrink-0">
                                <i data-lucide="calendar-days" class="w-4 h-4"></i>
                            </span>
                            <div class="min-w-0">
                                <p class="text-[11px] font-semibold uppercase tracking-wider text-muted">Today</p>
                                <p class="text-sm font-medium text-ink truncate">${formatDate()}</p>
                            </div>
                        </div>
                    </div>
                </header>

                <section class="mb-5 sm:mb-6" aria-labelledby="dashboard-overview-heading">
                    <div class="reveal mb-3 sm:mb-4 flex items-center justify-between gap-3" data-dashboard-enter="chrome" data-domino-enter style="${hide}">
                        <div>
                            <h2 id="dashboard-overview-heading" class="text-sm sm:text-base font-semibold text-ink">Overview</h2>
                            <p class="text-xs sm:text-sm text-muted mt-0.5">Key figures at a glance</p>
                        </div>
                    </div>
                    <div class="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3 sm:gap-4" id="primary-stats" data-dashboard-enter="content" style="${hide}">
                        ${skeletonStatCard('primary')}
                        ${skeletonStatCard('primary')}
                        ${skeletonStatCard('primary')}
                    </div>
                </section>

                <section class="mb-6 sm:mb-8" aria-labelledby="dashboard-metrics-heading">
                    <div class="reveal mb-3 sm:mb-4 flex items-center justify-between gap-3" data-dashboard-enter="chrome" data-domino-enter style="${hide}">
                        <div>
                            <h2 id="dashboard-metrics-heading" class="text-sm sm:text-base font-semibold text-ink">Quick metrics</h2>
                            <p class="text-xs sm:text-sm text-muted mt-0.5">Supporting counts and status</p>
                        </div>
                    </div>
                    <div class="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3 sm:gap-4" id="secondary-stats" data-dashboard-enter="content" style="${hide}">
                        ${skeletonStatCard('secondary')}
                        ${skeletonStatCard('secondary')}
                        ${skeletonStatCard('secondary')}
                    </div>
                </section>

                ${extra ? `
                    <section id="audit-logs-section" class="reveal pb-6 sm:pb-8" data-dashboard-enter="content" data-domino-enter style="${hide}" aria-label="Recent activity">
                        ${extra}
                    </section>
                ` : ''}
            </main>
        </div>
    `;
}

export function renderPrimaryStatCard({ href, imageKey, label, value, valueId, icon }) {
    const imageUrl = dashboardImages[imageKey]?.path || '';
    const safeLabel = escapeHtml(label);
    const safeHref = escapeHtml(href);
    const safeIcon = escapeHtml(icon);
    const safeValueId = escapeHtml(valueId);

    return `
        <a href="${safeHref}" class="dashboard-stat-card reveal group relative isolate flex min-h-[148px] sm:min-h-[168px] flex-col overflow-hidden rounded-2xl p-5 sm:p-6 text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-yellow focus-visible:ring-offset-2" data-domino-enter aria-label="${safeLabel}">
            <span class="absolute inset-0 bg-cover bg-center transition-transform duration-500 group-hover:scale-105" style="background-image: url('${imageUrl}');"></span>
            <span class="absolute inset-0 bg-gradient-to-br from-blue-600/92 via-blue-600/78 to-blue-800/88"></span>
            <span class="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-blue-800/50 to-transparent"></span>
            <div class="relative z-10 flex flex-1 flex-col justify-between">
                <div class="flex items-start justify-between gap-3">
                    <p class="text-[11px] sm:text-xs font-semibold uppercase tracking-[0.14em] text-white/75">${safeLabel}</p>
                    <span class="flex h-10 w-10 items-center justify-center rounded-xl bg-white/12 ring-1 ring-white/20 backdrop-blur-sm">
                        <i data-lucide="${safeIcon}" class="w-5 h-5 text-yellow"></i>
                    </span>
                </div>
                <div class="mt-6 flex items-end justify-between gap-3">
                    <p class="text-3xl sm:text-4xl font-semibold tracking-tight tabular-nums" id="${safeValueId}">${value || 0}</p>
                    <span class="inline-flex items-center gap-1 text-xs font-medium text-white/80">
                        View
                        <i data-lucide="arrow-up-right" class="w-3.5 h-3.5 transition-transform duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5"></i>
                    </span>
                </div>
            </div>
        </a>
    `;
}

export function renderSecondaryStatCard({ href, label, value, valueId, icon }) {
    const safeLabel = escapeHtml(label);
    const safeHref = escapeHtml(href);
    const safeIcon = escapeHtml(icon);
    const safeValueId = escapeHtml(valueId);

    return `
        <a href="${safeHref}" class="dashboard-metric-card reveal group flex min-h-[108px] items-center justify-between gap-4 rounded-2xl border border-line bg-white p-4 sm:p-5 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-600/40 focus-visible:ring-offset-2" data-domino-enter aria-label="${safeLabel}">
            <div class="min-w-0">
                <p class="text-[11px] sm:text-xs font-semibold uppercase tracking-[0.14em] text-muted">${safeLabel}</p>
                <p class="mt-2 text-2xl sm:text-[1.75rem] font-semibold tracking-tight text-ink tabular-nums" id="${safeValueId}">${value || 0}</p>
            </div>
            <span class="flex h-11 w-11 sm:h-12 sm:w-12 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600 ring-1 ring-blue-50 transition-colors duration-200 group-hover:bg-blue-600 group-hover:text-white">
                <i data-lucide="${safeIcon}" class="w-5 h-5"></i>
            </span>
        </a>
    `;
}

async function navigateDashboardCard(path) {
    if (!path || path === window.location.pathname || dashboardCardNavigating) return;

    dashboardCardNavigating = true;

    try {
        const page = document.querySelector('[data-dashboard-page]');
        if (page) {
            await playPortalDominoLeave(page, { direction: 1 });
        }

        if (window.appNavigate) {
            window.appNavigate(path);
            return;
        }

        window.location.href = path;
    } finally {
        dashboardCardNavigating = false;
    }
}

function bindDashboardCardLinks(root = document) {
    const page = root.querySelector?.('[data-dashboard-page]') || root.closest?.('[data-dashboard-page]') || document.querySelector('[data-dashboard-page]');
    if (!page || page.dataset.dashboardCardsBound === '1') return;

    page.dataset.dashboardCardsBound = '1';
    page.addEventListener('click', (event) => {
        if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) {
            return;
        }

        const card = event.target.closest('a.dashboard-stat-card, a.dashboard-metric-card');
        if (!card || !page.contains(card)) return;

        const path = card.getAttribute('href');
        if (!path || path.startsWith('http') || path.startsWith('mailto:') || path.startsWith('tel:')) return;

        event.preventDefault();
        event.stopPropagation();
        navigateDashboardCard(path);
    });
}

export function fillDashboardStats({ primary = [], secondary = [] } = {}) {
    const primaryStats = document.getElementById('primary-stats');
    if (primaryStats) {
        primaryStats.innerHTML = primary.map(renderPrimaryStatCard).join('');
    }

    const secondaryStats = document.getElementById('secondary-stats');
    if (secondaryStats) {
        secondaryStats.innerHTML = secondary.map(renderSecondaryStatCard).join('');
    }

    createIcons();
    bindDashboardCardLinks();
}

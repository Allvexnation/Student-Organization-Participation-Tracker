import { AdminNavbar, initAdminNavbar } from '../../../components/Navbar/AdminNavbar.js';
import { protectAdminRoute } from '../../../middleware/AdminMiddleware.js';
import * as EventsAPI from '../../../api/admin/Events/ManageEvents.js';
import * as EventOrgAPI from '../../../api/admin/EventOrganizations/EventOrganizations.js';
import { CacheService } from '../../../../cache/CacheService.js';
import { openManageEventsModal, openViewEventsModal } from '../../../components/Modal/ManageEventsModal.js';
import { openManageEventRegistModal, openViewEventRegistModal } from '../../../components/Modal/ManageEventRegistModal.js';
import { openConfirmDialog } from '../../../components/Dialog/ConfirmDialog.js';
import { showToast } from '../../../components/ToastMessage.js';
import { CrudMenu } from '../../../components/CrudMenu.js';
import { skeletonTableRows } from '../../../components/SkeletonLoading.js';
import { logChange } from '../../../api/AuditLogs/AuditLogs.js';
import { getUserId, getUserData } from '../../../utils/jwt.js';
import { initAdminEventsAnimations, animateDominoList } from '../../../provider/Animation/AdminEventsAnimation.js';

const TABS = ['events', 'registrations'];
const TAB_ACTIVE_CLASSES = ['bg-blue-600', 'text-white', 'shadow-sm'];
const TAB_IDLE_CLASSES = ['text-muted', 'hover:text-ink', 'hover:bg-surface'];

function escapeHtml(value) {
    return String(value ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}

function formatShortDate(value) {
    if (!value) return '—';
    const date = new Date(value);
    return Number.isNaN(date.getTime())
        ? '—'
        : date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function formatDateRange(start, end) {
    if (!start && !end) return '—';
    if (start && end && start === end) return formatShortDate(start);
    if (start && end) return `${formatShortDate(start)} – ${formatShortDate(end)}`;
    return formatShortDate(start || end);
}

function dateParts(value) {
    const date = value ? new Date(value) : null;
    if (!date || Number.isNaN(date.getTime())) {
        return { month: '—', day: '—' };
    }
    return {
        month: date.toLocaleDateString('en-US', { month: 'short' }).toUpperCase(),
        day: String(date.getDate()),
    };
}

const tabCountState = { events: 0, registrations: 0 };

function paintTabCounts() {
    Object.entries(tabCountState).forEach(([key, count]) => {
        document.querySelectorAll(`[data-tab-count="${key}"]`).forEach((el) => {
            el.textContent = String(count);
        });
    });
}

function refreshIcons() {
    if (typeof lucide !== 'undefined') lucide.createIcons();
    paintTabCounts();
}

function isMobileView() {
    return window.matchMedia('(max-width: 767px)').matches;
}

function tonePill(label, tone = 'blue') {
    const tones = {
        blue: 'bg-blue-50 text-blue-600 border-blue-100',
        green: 'bg-emerald-50 text-emerald-700 border-emerald-200',
        yellow: 'bg-yellow-50 text-yellow-800 border-yellow-200',
        gray: 'bg-slate-50 text-slate-600 border-slate-200',
    };
    return `<span class="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium border ${tones[tone] || tones.blue}">${escapeHtml(label)}</span>`;
}

function categoryPill(category) {
    const value = String(category || '').trim();
    if (!value) return tonePill('Uncategorized', 'gray');
    return tonePill(value, 'blue');
}

function emptyState(icon, title, subtitle) {
    return `
        <div class="py-10 px-4 text-center">
            <span class="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-surface text-muted mb-3">
                <i data-lucide="${icon}" class="w-6 h-6"></i>
            </span>
            <p class="text-sm text-ink font-medium">${title}</p>
            <p class="text-xs text-muted mt-1">${subtitle}</p>
        </div>
    `;
}

function skeletonCards(count = 4) {
    return Array.from({ length: count }, () => `
        <div class="evt-mobile-card rounded-2xl border border-line bg-white/90 p-4">
            <div class="flex items-center gap-3">
                <div class="w-12 h-14 rounded-2xl skeleton-shimmer shrink-0"></div>
                <div class="flex-1 space-y-2 min-w-0">
                    <div class="h-4 w-36 skeleton-shimmer rounded"></div>
                    <div class="h-3 w-48 skeleton-shimmer rounded"></div>
                </div>
            </div>
            <div class="mt-4 grid grid-cols-2 gap-2">
                <div class="h-12 skeleton-shimmer rounded-xl"></div>
                <div class="h-12 skeleton-shimmer rounded-xl"></div>
            </div>
        </div>
    `).join('');
}

function toolbar({ searchId, addId, placeholder }) {
    return `
        <div class="reveal mb-4 md:mb-5" data-domino-enter>
            <div class="flex items-center gap-2.5">
                <div class="relative flex-1 md:flex-none">
                    <i data-lucide="search" class="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted"></i>
                    <input
                        type="search"
                        id="${searchId}"
                        placeholder="${placeholder}"
                        class="w-full md:w-80 pl-9 pr-3 py-2.5 text-sm border border-line rounded-xl bg-white text-ink placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-blue-600/15 focus:border-blue-600">
                </div>
                <button
                    type="button"
                    id="${addId}"
                    class="hidden md:inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-white bg-blue-600 hover:bg-blue-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-600/30 transition shadow-sm">
                    <i data-lucide="plus" class="w-4 h-4"></i>
                    <span>Add New</span>
                </button>
            </div>
        </div>
    `;
}

function desktopTable({ bodyId, headers, colSpan }) {
    return `
        <div class="hidden md:block">
            <div class="bg-white border border-line rounded-2xl shadow-sm overflow-hidden">
                <table class="w-full text-sm text-left">
                    <thead>
                        <tr class="bg-surface border-b border-line text-[11px] font-semibold text-muted uppercase tracking-[0.14em]">
                            ${headers}
                        </tr>
                    </thead>
                    <tbody id="${bodyId}" class="divide-y divide-line">
                        ${skeletonTableRows(4, colSpan, true)}
                    </tbody>
                </table>
            </div>
        </div>
    `;
}

function tabButton({ id, tab, icon, label, countKey, active = false }) {
    const state = active
        ? 'bg-blue-600 text-white shadow-sm'
        : 'text-muted hover:text-ink hover:bg-surface';
    return `
        <button
            type="button"
            id="${id}"
            onclick="switchTab('${tab}')"
            class="events-tab flex flex-col md:flex-row items-center justify-center gap-1 md:gap-2 rounded-2xl md:rounded-xl px-2 py-3 md:px-4 md:py-2.5 text-[11px] md:text-sm font-semibold transition-colors ${state}">
            <i data-lucide="${icon}" class="w-4 h-4 pointer-events-none"></i>
            <span>${label}</span>
            <span data-tab-count="${countKey}" class="inline-flex min-w-[1.15rem] h-4 md:h-5 px-1.5 items-center justify-center rounded-full bg-yellow text-[10px] md:text-[11px] font-bold text-blue-600 leading-none">0</span>
        </button>
    `;
}

function calendarBadge(start) {
    const { month, day } = dateParts(start);
    return `
        <div class="w-12 h-14 rounded-2xl bg-blue-600 text-white flex flex-col items-center justify-center shadow-sm shrink-0">
            <span class="text-[9px] font-semibold uppercase tracking-[0.16em] text-yellow leading-none">${escapeHtml(month)}</span>
            <span class="mt-1 text-lg font-semibold leading-none tabular-nums">${escapeHtml(day)}</span>
        </div>
    `;
}

function orgBadge(name) {
    const text = String(name || 'ORG').trim().charAt(0).toUpperCase() || 'O';
    return `<div class="w-12 h-12 rounded-2xl bg-blue-600 text-white flex items-center justify-center font-semibold text-sm shadow-sm shrink-0">${escapeHtml(text)}</div>`;
}

function metaTile(label, value) {
    return `
        <div class="rounded-xl bg-surface border border-line px-3 py-2.5 min-w-0">
            <div class="text-[10px] uppercase tracking-[0.12em] text-muted">${label}</div>
            <div class="text-xs font-semibold text-ink mt-0.5 truncate">${value}</div>
        </div>
    `;
}

function setTabCount(key, count) {
    tabCountState[key] = Number(count) || 0;
    paintTabCounts();
}

function setTabStyles(tab) {
    TABS.forEach((id) => {
        const button = document.getElementById(`${id}Tab`);
        const section = document.getElementById(`${id}Section`);
        const active = id === tab;
        if (button) {
            TAB_ACTIVE_CLASSES.forEach((cls) => button.classList.toggle(cls, active));
            TAB_IDLE_CLASSES.forEach((cls) => button.classList.toggle(cls, !active));
        }
        if (section) section.classList.toggle('hidden', !active);
    });
}

function finishRender(sectionId, animate) {
    refreshIcons();
    if (animate) {
        const section = document.getElementById(sectionId);
        if (section) animateDominoList(section);
    }
}

function isUpcomingEvent(event) {
    const end = event.event_day_end || event.event_day_start;
    if (!end) return false;
    const date = new Date(end);
    if (Number.isNaN(date.getTime())) return false;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    date.setHours(0, 0, 0, 0);
    return date >= today;
}

function updateSummary(events, registrations) {
    const eventList = Array.isArray(events) ? events : [];
    const registList = Array.isArray(registrations) ? registrations : [];
    const setText = (id, value) => {
        const el = document.getElementById(id);
        if (el) el.textContent = String(value);
    };
    setText('eventsStatTotal', eventList.length);
    setText('eventsStatUpcoming', eventList.filter(isUpcomingEvent).length);
    setText('eventsStatRegs', registList.length);
    setTabCount('events', eventList.length);
    setTabCount('registrations', registList.length);
}

export function AdminEvents() {
    return `
        <div id="admin-events-page" data-domino-page class="min-h-screen bg-surface font-sans text-ink pb-28 md:pb-8">
            ${AdminNavbar()}
            <main class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5 sm:py-8">
                <header class="reveal mb-5 sm:mb-7" data-domino-enter>
                    <span class="inline-flex items-center gap-2 rounded-full border border-line bg-white px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-blue-600">
                        <span class="h-1.5 w-1.5 rounded-full bg-yellow"></span>
                        Event calendar
                    </span>
                    <div class="mt-3 min-w-0">
                        <h1 class="text-[1.65rem] sm:text-3xl font-semibold tracking-tight text-ink leading-tight">Manage Events</h1>
                        <p class="mt-1.5 max-w-2xl text-sm text-body">Create events, keep schedules current, and assign participating organizations.</p>
                    </div>
                </header>

                <section class="reveal mb-5 sm:mb-6 grid grid-cols-3 gap-2 sm:gap-3" data-domino-enter>
                    <div class="evt-stat-chip rounded-2xl border border-line bg-white p-3 sm:p-4">
                        <p class="text-[10px] sm:text-[11px] uppercase tracking-[0.12em] text-muted">Events</p>
                        <p id="eventsStatTotal" class="mt-1 text-lg sm:text-2xl font-semibold text-ink">0</p>
                    </div>
                    <div class="evt-stat-chip rounded-2xl border border-line bg-white p-3 sm:p-4">
                        <p class="text-[10px] sm:text-[11px] uppercase tracking-[0.12em] text-muted">Upcoming</p>
                        <p id="eventsStatUpcoming" class="mt-1 text-lg sm:text-2xl font-semibold text-blue-600">0</p>
                    </div>
                    <div class="evt-stat-chip rounded-2xl border border-line bg-white p-3 sm:p-4">
                        <p class="text-[10px] sm:text-[11px] uppercase tracking-[0.12em] text-muted">Registrations</p>
                        <p id="eventsStatRegs" class="mt-1 text-lg sm:text-2xl font-semibold text-ink">0</p>
                    </div>
                </section>

                <div class="reveal mb-5 sm:mb-6" data-domino-enter>
                    <nav class="events-tab-bar grid grid-cols-2 gap-1 p-1 rounded-2xl border border-line bg-white/90 md:flex md:items-center md:gap-1 md:w-fit" aria-label="Event views">
                        ${tabButton({ id: 'eventsTab', tab: 'events', icon: 'calendar-days', label: 'Events', countKey: 'events', active: true })}
                        ${tabButton({ id: 'registrationsTab', tab: 'registrations', icon: 'clipboard-list', label: 'Registrations', countKey: 'registrations' })}
                    </nav>
                </div>

                <section id="eventsSection">
                    ${toolbar({ searchId: 'eventSearch', addId: 'addEventBtn', placeholder: 'Search events...' })}
                    ${desktopTable({
                        bodyId: 'eventTableBody',
                        colSpan: 6,
                        headers: `
                            <th class="px-5 py-3.5 w-12 text-center">#</th>
                            <th class="px-5 py-3.5">Title</th>
                            <th class="px-5 py-3.5">Date Range</th>
                            <th class="px-5 py-3.5">Schedules</th>
                            <th class="px-5 py-3.5">Venue</th>
                            <th class="px-5 py-3.5 text-center w-28">Actions</th>
                        `
                    })}
                    <div id="eventMobileList" class="md:hidden space-y-3">${skeletonCards()}</div>
                </section>

                <section id="registrationsSection" class="hidden">
                    ${toolbar({ searchId: 'eventRegistSearch', addId: 'addEventRegistBtn', placeholder: 'Search registrations...' })}
                    ${desktopTable({
                        bodyId: 'eventRegistTableBody',
                        colSpan: 6,
                        headers: `
                            <th class="px-5 py-3.5 w-12 text-center">#</th>
                            <th class="px-5 py-3.5">Event</th>
                            <th class="px-5 py-3.5">Organization</th>
                            <th class="px-5 py-3.5">Approver</th>
                            <th class="px-5 py-3.5">Registered At</th>
                            <th class="px-5 py-3.5 text-center w-28">Actions</th>
                        `
                    })}
                    <div id="eventRegistMobileList" class="md:hidden space-y-3">${skeletonCards()}</div>
                </section>
            </main>

            <button
                type="button"
                id="eventsMobileAddBtn"
                class="md:hidden fixed z-30 right-4 bottom-[max(1.25rem,env(safe-area-inset-bottom))] h-14 w-14 rounded-full bg-blue-600 text-white shadow-lift-lg flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-yellow"
                aria-label="Add new">
                <i data-lucide="plus" class="w-6 h-6"></i>
            </button>
        </div>
    `;
}

export async function initAdminEvents() {
    protectAdminRoute();

    let events = [];
    let eventRegistrations = [];
    let hasLoadedEvents = false;
    let hasLoadedRegistrations = false;
    let currentTab = 'events';

    const eventsRequest = EventsAPI.getAllEvents().catch((error) => {
        console.error('Error loading events:', error);
        return null;
    });
    const regsRequest = EventOrgAPI.getAllEventOrganizations().catch((error) => {
        console.error('Error loading event registrations:', error);
        return null;
    });
    const eventsCache = CacheService.get('cachedEvents').catch(() => null);
    const regsCache = CacheService.get('cachedEventRegistrations').catch(() => null);

    initAdminNavbar();
    initAdminEventsAnimations();
    refreshIcons();

    const addButtons = {
        events: document.getElementById('addEventBtn'),
        registrations: document.getElementById('addEventRegistBtn'),
    };

    function applyEvents(list, { animate } = {}) {
        events = Array.isArray(list) ? list : [];
        hasLoadedEvents = true;
        updateSummary(events, eventRegistrations);
        renderEvents(events, { animate: animate ?? currentTab === 'events' });
    }

    function applyRegistrations(list, { animate } = {}) {
        eventRegistrations = Array.isArray(list) ? list : [];
        hasLoadedRegistrations = true;
        updateSummary(events, eventRegistrations);
        renderEventRegistrations(eventRegistrations, { animate: animate ?? currentTab === 'registrations' });
    }

    window.switchTab = function(tab) {
        currentTab = tab;
        setTabStyles(tab);
        refreshIcons();

        if (tab === 'events' && !hasLoadedEvents) loadEvents();
        if (tab === 'registrations' && !hasLoadedRegistrations) loadEventRegistrations();

        const section = document.getElementById(`${tab}Section`);
        if (section) animateDominoList(section);
    };

    document.getElementById('eventsMobileAddBtn')?.addEventListener('click', () => {
        addButtons[currentTab]?.click();
    });

    async function loadEvents(forceRefresh = false) {
        if (!forceRefresh) {
            try {
                const cachedData = await CacheService.get('cachedEvents');
                if (cachedData && Array.isArray(cachedData) && cachedData.length > 0) {
                    applyEvents(cachedData);
                }
            } catch (e) {
                console.error('Error reading cached events:', e);
            }
        }

        try {
            const freshData = await EventsAPI.getAllEvents();
            if (freshData) {
                const list = Array.isArray(freshData) ? freshData : [];
                CacheService.set('cachedEvents', list).catch(() => {});
                applyEvents(list);
            }
        } catch (error) {
            console.error('Error loading events:', error);
            if (!hasLoadedEvents) {
                renderFailed('eventTableBody', 'eventMobileList', 6, 'Failed to load events');
                showToast('Failed to load events', 'error');
            }
        }
    }

    function renderEvents(data, { animate = true } = {}) {
        const tbody = document.getElementById('eventTableBody');
        const mobile = document.getElementById('eventMobileList');
        if (!tbody || !mobile) return;

        const list = Array.isArray(data) ? data : [];

        if (!list.length) {
            if (isMobileView()) {
                tbody.innerHTML = '';
                mobile.innerHTML = emptyState('calendar-days', 'No events found.', 'Use the + button to create the first event.');
            } else {
                mobile.innerHTML = '';
                tbody.innerHTML = `<tr data-domino-enter class="reveal"><td colspan="6">${emptyState('calendar-days', 'No events found.', 'Click Add New to create the first event.')}</td></tr>`;
            }
            finishRender('eventsSection', animate);
            return;
        }

        if (isMobileView()) {
            tbody.innerHTML = '';
            mobile.innerHTML = list.map((event) => {
                const scheduleCount = event.daily_schedules ? event.daily_schedules.length : 0;
                const scheduleLabel = scheduleCount > 0
                    ? `${scheduleCount} day${scheduleCount > 1 ? 's' : ''}`
                    : 'No schedules';
                return `
                <article class="evt-mobile-card reveal rounded-2xl border border-line bg-white overflow-hidden" data-domino-enter>
                    <div class="p-4">
                        <div class="flex items-start gap-3">
                            ${calendarBadge(event.event_day_start)}
                            <div class="min-w-0 flex-1">
                                <div class="flex items-start justify-between gap-2">
                                    <div class="min-w-0">
                                        <h3 class="text-sm font-semibold text-ink leading-snug">${escapeHtml(event.title)}</h3>
                                        <p class="text-[11px] text-muted mt-1 truncate">${escapeHtml(event.venue || 'Venue not set')}</p>
                                    </div>
                                    ${categoryPill(event.event_category)}
                                </div>
                            </div>
                        </div>
                        <div class="mt-3.5 grid grid-cols-2 gap-2">
                            ${metaTile('Dates', escapeHtml(formatDateRange(event.event_day_start, event.event_day_end)))}
                            ${metaTile('Schedules', escapeHtml(scheduleLabel))}
                        </div>
                    </div>
                    <div class="px-3 py-2.5 border-t border-line bg-surface/70 flex justify-end">
                        ${CrudMenu({
                            id: String(event.id),
                            showView: true,
                            onView: 'viewEvent',
                            onEdit: 'editEvent',
                            onDelete: 'deleteEvent',
                            deleteLabel: event.title
                        })}
                    </div>
                </article>
                `;
            }).join('');
        } else {
            mobile.innerHTML = '';
            tbody.innerHTML = list.map((event, index) => {
                const scheduleCount = event.daily_schedules ? event.daily_schedules.length : 0;
                const scheduleInfo = scheduleCount > 0
                    ? `<span class="text-xs text-blue-600 font-medium">${scheduleCount} day${scheduleCount > 1 ? 's' : ''}</span>`
                    : '<span class="text-xs text-muted">No schedules</span>';
                return `
                <tr class="reveal hover:bg-surface/80 transition-colors" data-domino-enter>
                    <td class="px-5 py-4 text-center text-muted">${index + 1}</td>
                    <td class="px-5 py-4">
                        <div class="font-semibold text-ink">${escapeHtml(event.title)}</div>
                        <div class="mt-1">${categoryPill(event.event_category)}</div>
                    </td>
                    <td class="px-5 py-4 text-body whitespace-nowrap">${escapeHtml(formatDateRange(event.event_day_start, event.event_day_end))}</td>
                    <td class="px-5 py-4">${scheduleInfo}</td>
                    <td class="px-5 py-4 text-body truncate">${escapeHtml(event.venue || 'N/A')}</td>
                    <td class="px-5 py-4 text-center">
                        ${CrudMenu({
                            id: String(event.id),
                            showView: true,
                            onView: 'viewEvent',
                            onEdit: 'editEvent',
                            onDelete: 'deleteEvent',
                            deleteLabel: event.title
                        })}
                    </td>
                </tr>
                `;
            }).join('');
        }

        finishRender('eventsSection', animate);
    }

    document.getElementById('addEventBtn').addEventListener('click', () => {
        openManageEventsModal({
            mode: 'add',
            onSubmit: async (id, data) => {
                if (id) {
                    const oldEvent = events.find(e => e.id === id);
                    await EventsAPI.updateEvent(id, data);
                    const user = getUserData('admin');

                    const fields = ['title', 'description', 'venue', 'event_category', 'event_day_start', 'event_day_end'];
                    for (const field of fields) {
                        if (oldEvent && oldEvent[field] !== data[field]) {
                            await logChange({
                                user_id: getUserId('admin'),
                                user_type: 'admin',
                                user_name: user?.name || user?.email || 'Unknown',
                                action: 'UPDATE',
                                table_name: 'events',
                                record_id: id,
                                field_name: field,
                                old_value: oldEvent[field] || null,
                                new_value: data[field] || null
                            });
                        }
                    }
                } else {
                    const result = await EventsAPI.createEvent(data);
                    const user = getUserData('admin');
                    await logChange({
                        user_id: getUserId('admin'),
                        user_type: 'admin',
                        user_name: user?.name || user?.email || 'Unknown',
                        action: 'CREATE',
                        table_name: 'events',
                        record_id: result?.id || null,
                        field_name: 'event_title',
                        old_value: null,
                        new_value: data.title
                    });
                }
                loadEvents(true);
            }
        });
    });

    window.editEvent = (id) => {
        openManageEventsModal({
            mode: 'edit',
            eventId: id,
            onSubmit: async (id, data) => {
                const oldEvent = await EventsAPI.getEvent(id);
                await EventsAPI.updateEvent(id, data);
                const user = getUserData('admin');

                const fields = ['title', 'description', 'venue', 'event_category', 'event_day_start', 'event_day_end'];
                for (const field of fields) {
                    if (oldEvent[field] !== data[field]) {
                        await logChange({
                            user_id: getUserId('admin'),
                            user_type: 'admin',
                            user_name: user?.name || user?.email || 'Unknown',
                            action: 'UPDATE',
                            table_name: 'events',
                            record_id: id,
                            field_name: field,
                            old_value: oldEvent[field] || null,
                            new_value: data[field] || null
                        });
                    }
                }
                loadEvents(true);
            }
        });
    };

    window.viewEvent = async (id) => {
        await openViewEventsModal(id);
    };

    window.deleteEvent = (id, deleteLabel) => {
        openConfirmDialog({
            title: 'Confirm Delete',
            message: `Are you sure you want to delete ${deleteLabel || 'this event'}?`,
            confirmText: 'Delete',
            cancelText: 'Cancel',
            type: 'danger',
            onConfirm: async () => {
                try {
                    await EventsAPI.deleteEvent(id);
                    const user = getUserData('admin');
                    await logChange({
                        user_id: getUserId('admin'),
                        user_type: 'admin',
                        user_name: user?.name || user?.email || 'Unknown',
                        action: 'DELETE',
                        table_name: 'events',
                        record_id: id,
                        field_name: 'event_title',
                        old_value: deleteLabel || 'Unknown',
                        new_value: null
                    });
                    loadEvents(true);
                    showToast('Event deleted successfully', 'success');
                } catch (error) {
                    console.error('Error deleting event:', error);
                    showToast('Failed to delete event', 'error');
                }
            }
        });
    };

    document.getElementById('eventSearch').addEventListener('input', (e) => {
        const searchTerm = e.target.value.toLowerCase();
        const filtered = events.filter((event) =>
            (event.title || '').toLowerCase().includes(searchTerm) ||
            (event.venue || '').toLowerCase().includes(searchTerm) ||
            (event.event_category || '').toLowerCase().includes(searchTerm)
        );
        renderEvents(filtered, { animate: true });
    });

    async function loadEventRegistrations(forceRefresh = false) {
        if (!forceRefresh) {
            try {
                const cachedData = await CacheService.get('cachedEventRegistrations');
                if (cachedData && Array.isArray(cachedData) && cachedData.length > 0) {
                    applyRegistrations(cachedData);
                }
            } catch (e) {
                console.error('Error reading cached event registrations:', e);
            }
        }

        try {
            const freshData = await EventOrgAPI.getAllEventOrganizations();
            if (freshData) {
                const list = Array.isArray(freshData) ? freshData : [];
                CacheService.set('cachedEventRegistrations', list).catch(() => {});
                applyRegistrations(list);
            }
        } catch (error) {
            console.error('Error loading event registrations:', error);
            if (!hasLoadedRegistrations) {
                renderFailed('eventRegistTableBody', 'eventRegistMobileList', 6, 'Failed to load event registrations');
                showToast('Failed to load event registrations', 'error');
            }
        }
    }

    function renderEventRegistrations(data, { animate = true } = {}) {
        const tbody = document.getElementById('eventRegistTableBody');
        const mobile = document.getElementById('eventRegistMobileList');
        if (!tbody || !mobile) return;

        const list = Array.isArray(data) ? data : [];

        if (!list.length) {
            if (isMobileView()) {
                tbody.innerHTML = '';
                mobile.innerHTML = emptyState('clipboard-list', 'No event registrations found.', 'Use the + button to create the first registration.');
            } else {
                mobile.innerHTML = '';
                tbody.innerHTML = `<tr data-domino-enter class="reveal"><td colspan="6">${emptyState('clipboard-list', 'No event registrations found.', 'Click Add New to create the first registration.')}</td></tr>`;
            }
            finishRender('registrationsSection', animate);
            return;
        }

        if (isMobileView()) {
            tbody.innerHTML = '';
            mobile.innerHTML = list.map((reg) => `
                <article class="evt-mobile-card reveal rounded-2xl border border-line bg-white overflow-hidden" data-domino-enter>
                    <div class="p-4">
                        <div class="flex items-start gap-3">
                            ${orgBadge(reg.organization_name)}
                            <div class="min-w-0 flex-1">
                                <h3 class="text-sm font-semibold text-ink leading-snug">${escapeHtml(reg.organization_name || 'N/A')}</h3>
                                <p class="text-[11px] text-muted mt-1 truncate">${escapeHtml(reg.event_title || 'N/A')}</p>
                            </div>
                        </div>
                        <div class="mt-3.5 grid grid-cols-2 gap-2">
                            ${metaTile('Approver', escapeHtml(reg.approver_name || 'N/A'))}
                            ${metaTile('Registered', escapeHtml(formatShortDate(reg.registered_at)))}
                        </div>
                    </div>
                    <div class="px-3 py-2.5 border-t border-line bg-surface/70 flex justify-end">
                        ${CrudMenu({
                            id: String(reg.id),
                            showView: true,
                            onView: 'viewEventRegist',
                            onEdit: 'editEventRegist',
                            onDelete: 'deleteEventRegist',
                            deleteLabel: reg.organization_name
                        })}
                    </div>
                </article>
            `).join('');
        } else {
            mobile.innerHTML = '';
            tbody.innerHTML = list.map((reg, index) => `
                <tr class="reveal hover:bg-surface/80 transition-colors" data-domino-enter>
                    <td class="px-5 py-4 text-center text-muted">${index + 1}</td>
                    <td class="px-5 py-4 font-semibold text-ink">${escapeHtml(reg.event_title || 'N/A')}</td>
                    <td class="px-5 py-4 text-body truncate">${escapeHtml(reg.organization_name || 'N/A')}</td>
                    <td class="px-5 py-4 text-body truncate">${escapeHtml(reg.approver_name || 'N/A')}</td>
                    <td class="px-5 py-4 text-body whitespace-nowrap">${escapeHtml(formatShortDate(reg.registered_at))}</td>
                    <td class="px-5 py-4 text-center">
                        ${CrudMenu({
                            id: String(reg.id),
                            showView: true,
                            onView: 'viewEventRegist',
                            onEdit: 'editEventRegist',
                            onDelete: 'deleteEventRegist',
                            deleteLabel: reg.organization_name
                        })}
                    </td>
                </tr>
            `).join('');
        }

        finishRender('registrationsSection', animate);
    }

    document.getElementById('addEventRegistBtn').addEventListener('click', () => {
        openManageEventRegistModal({
            mode: 'add',
            onSubmit: async (id, data) => {
                if (id) {
                    const oldReg = await EventOrgAPI.getEventOrganization(id);
                    await EventOrgAPI.updateEventOrganization(id, data);
                    const user = getUserData('admin');

                    const fields = ['event_id', 'organization_id', 'approver_id', 'status'];
                    for (const field of fields) {
                        if (oldReg[field] !== data[field]) {
                            let oldValue = oldReg[field] || null;
                            let newValue = data[field] || null;

                            if (field === 'event_id') {
                                oldValue = oldReg.event_title || oldReg[field] || 'Unknown';
                                newValue = data.event_title || data[field] || 'Unknown';
                            }
                            if (field === 'organization_id') {
                                oldValue = oldReg.organization_name || oldReg[field] || 'Unknown';
                                newValue = data.organization_name || data[field] || 'Unknown';
                            }
                            if (field === 'approver_id') {
                                oldValue = oldReg.approver_name || oldReg[field] || 'Unknown';
                                newValue = data.approver_name || data[field] || 'Unknown';
                            }

                            await logChange({
                                user_id: getUserId('admin'),
                                user_type: 'admin',
                                user_name: user?.name || user?.email || 'Unknown',
                                action: 'UPDATE',
                                table_name: 'event_organizations',
                                record_id: id,
                                field_name: field,
                                old_value: oldValue,
                                new_value: newValue
                            });
                        }
                    }
                } else {
                    const result = await EventOrgAPI.createEventOrganization(data);
                    const user = getUserData('admin');
                    await logChange({
                        user_id: getUserId('admin'),
                        user_type: 'admin',
                        user_name: user?.name || user?.email || 'Unknown',
                        action: 'CREATE',
                        table_name: 'event_organizations',
                        record_id: result?.ids?.[0] || result?.id || null,
                        field_name: 'event_registration',
                        old_value: null,
                        new_value: `${data.event_title || data.event_id}: ${data.organization_names ? data.organization_names.join(', ') : (data.organization_name || 'Organizations')}`
                    });
                }
                loadEventRegistrations(true);
            }
        });
    });

    window.editEventRegist = (id) => {
        openManageEventRegistModal({
            mode: 'edit',
            registrationId: id,
            onSubmit: async (id, data) => {
                const oldReg = await EventOrgAPI.getEventOrganization(id);
                await EventOrgAPI.updateEventOrganization(id, data);
                const user = getUserData('admin');

                const fields = ['event_id', 'organization_id', 'approver_id', 'status'];
                for (const field of fields) {
                    if (oldReg[field] !== data[field]) {
                        let oldValue = oldReg[field] || null;
                        let newValue = data[field] || null;

                        if (field === 'event_id') {
                            oldValue = oldReg.event_title || oldReg[field] || 'Unknown';
                            newValue = data.event_title || data[field] || 'Unknown';
                        }
                        if (field === 'organization_id') {
                            oldValue = oldReg.organization_name || oldReg[field] || 'Unknown';
                            newValue = data.organization_name || data[field] || 'Unknown';
                        }
                        if (field === 'approver_id') {
                            oldValue = oldReg.approver_name || oldReg[field] || 'Unknown';
                            newValue = data.approver_name || data[field] || 'Unknown';
                        }

                        await logChange({
                            user_id: getUserId('admin'),
                            user_type: 'admin',
                            user_name: user?.name || user?.email || 'Unknown',
                            action: 'UPDATE',
                            table_name: 'event_organizations',
                            record_id: id,
                            field_name: field,
                            old_value: oldValue,
                            new_value: newValue
                        });
                    }
                }
                loadEventRegistrations(true);
            }
        });
    };

    window.viewEventRegist = async (id) => {
        await openViewEventRegistModal(id);
    };

    window.deleteEventRegist = (id, deleteLabel) => {
        openConfirmDialog({
            title: 'Confirm Delete',
            message: `Are you sure you want to delete ${deleteLabel || 'this registration'}?`,
            confirmText: 'Delete',
            cancelText: 'Cancel',
            type: 'danger',
            onConfirm: async () => {
                try {
                    await EventOrgAPI.deleteEventOrganization(id);
                    const user = getUserData('admin');
                    await logChange({
                        user_id: getUserId('admin'),
                        user_type: 'admin',
                        user_name: user?.name || user?.email || 'Unknown',
                        action: 'DELETE',
                        table_name: 'event_organizations',
                        record_id: id,
                        field_name: 'event_registration',
                        old_value: deleteLabel || 'Unknown',
                        new_value: null
                    });
                    loadEventRegistrations(true);
                    showToast('Event registration deleted successfully', 'success');
                } catch (error) {
                    console.error('Error deleting event registration:', error);
                    showToast('Failed to delete event registration', 'error');
                }
            }
        });
    };

    document.getElementById('eventRegistSearch').addEventListener('input', (e) => {
        const searchTerm = e.target.value.toLowerCase();
        const filtered = eventRegistrations.filter((reg) =>
            (reg.event_title || '').toLowerCase().includes(searchTerm) ||
            (reg.organization_name || '').toLowerCase().includes(searchTerm) ||
            (reg.approver_name || '').toLowerCase().includes(searchTerm)
        );
        renderEventRegistrations(filtered, { animate: true });
    });

    function renderFailed(tableId, mobileId, colSpan, message) {
        const tbody = document.getElementById(tableId);
        const mobile = document.getElementById(mobileId);
        if (tbody) {
            tbody.innerHTML = `<tr><td colspan="${colSpan}" class="px-5 py-12 text-center text-danger">${escapeHtml(message)}</td></tr>`;
        }
        if (mobile) {
            mobile.innerHTML = `<div class="rounded-2xl border border-red-100 bg-white p-6 text-center text-sm text-danger">${escapeHtml(message)}</div>`;
        }
    }

    let lastMobileView = isMobileView();
    window.addEventListener('resize', () => {
        const next = isMobileView();
        if (next === lastMobileView) return;
        lastMobileView = next;
        if (hasLoadedEvents) document.getElementById('eventSearch')?.dispatchEvent(new Event('input'));
        if (hasLoadedRegistrations) document.getElementById('eventRegistSearch')?.dispatchEvent(new Event('input'));
    });

    eventsCache.then((cachedEvents) => {
        if (Array.isArray(cachedEvents) && cachedEvents.length > 0) {
            applyEvents(cachedEvents, { animate: currentTab === 'events' });
        }
    });
    regsCache.then((cachedRegs) => {
        if (Array.isArray(cachedRegs) && cachedRegs.length > 0) {
            applyRegistrations(cachedRegs, { animate: false });
        }
    });

    eventsRequest.then((freshEvents) => {
        if (freshEvents) {
            const list = Array.isArray(freshEvents) ? freshEvents : [];
            CacheService.set('cachedEvents', list).catch(() => {});
            applyEvents(list);
            return;
        }
        if (!hasLoadedEvents) {
            renderFailed('eventTableBody', 'eventMobileList', 6, 'Failed to load events');
            showToast('Failed to load events', 'error');
        }
    });
    regsRequest.then((freshRegs) => {
        if (freshRegs) {
            const list = Array.isArray(freshRegs) ? freshRegs : [];
            CacheService.set('cachedEventRegistrations', list).catch(() => {});
            applyRegistrations(list);
            return;
        }
        if (!hasLoadedRegistrations) {
            renderFailed('eventRegistTableBody', 'eventRegistMobileList', 6, 'Failed to load event registrations');
            showToast('Failed to load event registrations', 'error');
        }
    });
}

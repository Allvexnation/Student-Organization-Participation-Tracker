import { AdviserNavbar, initAdviserNavbar } from '../../../components/Navbar/AdviserNavbar.js';
import { isAuthenticated, getUserId, getUserData } from '../../../utils/jwt.js';
import { navigate } from '../../../utils/navigation.js';
import * as AdviserEventsAPI from '../../../api/adviser/Events/AdviserEvents.js';
import * as AdviserOrganizationAPI from '../../../api/adviser/Organization/AdviserOrganization.js';
import { openTaskModal } from '../../../components/Modal/Adviser/TaskModal.js';
import { showToast } from '../../../components/ToastMessage.js';
import { CrudMenu } from '../../../components/CrudMenu.js';
import { skeletonTableRows } from '../../../components/SkeletonLoading.js';
import { openConfirmDialog } from '../../../components/Dialog/ConfirmDialog.js';
import { logAdviserChange } from '../../../api/AuditLogs/AdviserAuditLogs.js';
import { initAdviserEventsAnimations, animateDominoList } from '../../../provider/Animation/adviser/AdviserEventsAnimation.js';

function skeletonTaskCards(count = 4) {
    return Array.from({ length: count }, () => `
        <div class="evt-mobile-card rounded-2xl border border-line bg-white/90 p-4" style="backdrop-filter: blur(12px); -webkit-backdrop-filter: blur(12px);">
            <div class="flex items-center gap-3">
                <div class="w-11 h-11 rounded-xl skeleton-shimmer shrink-0"></div>
                <div class="flex-1 space-y-2 min-w-0">
                    <div class="h-4 w-36 skeleton-shimmer rounded"></div>
                    <div class="h-3 w-28 skeleton-shimmer rounded"></div>
                </div>
                <div class="h-6 w-20 skeleton-shimmer rounded-full"></div>
            </div>
            <div class="mt-4 grid grid-cols-2 gap-2">
                <div class="h-14 skeleton-shimmer rounded-xl"></div>
                <div class="h-14 skeleton-shimmer rounded-xl"></div>
            </div>
            <div class="mt-3 h-10 skeleton-shimmer rounded-xl"></div>
        </div>
    `).join('');
}

function skeletonEventInfo() {
    return `
        <div class="animate-pulse space-y-3">
            <div class="h-5 w-24 rounded-full bg-white/15"></div>
            <div class="h-6 sm:h-7 w-3/5 max-w-xs rounded-lg bg-white/20"></div>
            <div class="flex flex-wrap gap-2 pt-1">
                <div class="h-3.5 w-28 rounded bg-white/10"></div>
                <div class="h-3.5 w-32 rounded bg-white/10"></div>
                <div class="h-3.5 w-24 rounded bg-white/10"></div>
            </div>
        </div>
    `;
}

function escapeEventText(value) {
    return String(value ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}

function eventInfoMarkup({ title, organization, category, venue, dateRange }) {
    return `
        <div class="inline-flex items-center gap-2 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-white/10 text-yellow border border-white/15 mb-2" id="eventCategoryBadge">${escapeEventText(category)}</div>
        <h2 class="text-lg sm:text-xl font-semibold tracking-tight break-words text-white" id="eventTitleDisplay">${escapeEventText(title)}</h2>
        <div class="flex flex-wrap items-center gap-x-3 gap-y-1.5 text-xs text-blue-100/90 mt-2">
            <span class="inline-flex items-center gap-1.5 min-w-0"><i data-lucide="building-2" class="w-3.5 h-3.5 text-yellow shrink-0"></i><span id="eventOrgDisplay" class="truncate">${escapeEventText(organization)}</span></span>
            <span class="inline-flex items-center gap-1.5 min-w-0"><i data-lucide="calendar" class="w-3.5 h-3.5 text-yellow shrink-0"></i><span id="eventDateRangeDisplay" class="truncate">${escapeEventText(dateRange)}</span></span>
            <span class="inline-flex items-center gap-1.5 min-w-0"><i data-lucide="map-pin" class="w-3.5 h-3.5 text-yellow shrink-0"></i><span id="eventVenueDisplay" class="truncate">${escapeEventText(venue)}</span></span>
        </div>
    `;
}

let eventsListReady = false;

function finishEventsRender(animate = true) {
    if (typeof lucide !== 'undefined') lucide.createIcons();
    const targets = document.querySelectorAll(
        '#dailyTasksMobileList .reveal, #dailyTasksTableBody .reveal, #manageTasksMobileList .reveal, #manageTasksTableBody .reveal'
    );

    if (!animate || eventsListReady) {
        targets.forEach((el) => el.classList.add('in'));
        eventsListReady = true;
        return;
    }

    const isMobile = window.matchMedia('(max-width: 767px)').matches;
    const dailyList = document.getElementById('dailyTasksMobileList');
    const dailyPanel = document.getElementById('dailyTasksDesktopPanel');
    const manageList = document.getElementById('manageTasksMobileList');
    const managePanel = document.getElementById('manageTasksDesktopPanel');
    const manageHidden = document.getElementById('manageTasksView')?.classList.contains('hidden');

    if (manageHidden === false) {
        if (isMobile && manageList) animateDominoList(manageList);
        else if (!isMobile && managePanel) animateDominoList(managePanel);
    } else if (isMobile && dailyList) {
        animateDominoList(dailyList);
    } else if (!isMobile && dailyPanel) {
        animateDominoList(dailyPanel);
    }

    eventsListReady = true;
}

function setTasksLoading(isLoading) {
    const tbody = document.getElementById('dailyTasksTableBody');
    const mobileList = document.getElementById('dailyTasksMobileList');
    const statsGrid = document.getElementById('tasksStatsGrid');
    const eventInfo = document.getElementById('eventInfoContent');
    const summaryCard = document.getElementById('eventSummaryCard');

    if (isLoading) {
        if (tbody) tbody.innerHTML = skeletonTableRows(4, 6, true);
        if (mobileList) mobileList.innerHTML = skeletonTaskCards();
        if (eventInfo) eventInfo.innerHTML = skeletonEventInfo();
        summaryCard?.classList.remove('hidden');
        statsGrid?.classList.add('att-stats-loading');
    } else {
        statsGrid?.classList.remove('att-stats-loading');
    }
}

const TAB_ACTIVE = ['border-blue-600', 'text-blue-600', 'font-semibold', 'bg-white'];
const TAB_IDLE = ['border-transparent', 'text-muted', 'font-medium', 'hover:text-ink', 'hover:bg-surface'];

function emptyBlock(icon, title, subtitle = '') {
    return `
        <div class="py-12 px-4 text-center">
            <span class="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-surface text-muted mb-3">
                <i data-lucide="${icon}" class="w-6 h-6"></i>
            </span>
            <p class="text-sm font-medium text-ink">${title}</p>
            ${subtitle ? `<p class="text-xs text-muted mt-1 max-w-sm mx-auto">${subtitle}</p>` : ''}
        </div>
    `;
}

export function AdviserEvents() {
    return `
        <div id="adviser-events-page" data-domino-page class="min-h-screen bg-surface font-sans text-ink pb-24 md:pb-10">
            ${AdviserNavbar()}
            <main class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5 sm:py-8">
                <header class="reveal mb-5 sm:mb-7" data-domino-enter>
                    <span class="inline-flex items-center gap-2 rounded-full border border-line bg-white px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-blue-600">
                        <span class="h-1.5 w-1.5 rounded-full bg-yellow"></span>
                        Task tracker
                    </span>
                    <div class="mt-3 flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4">
                        <div class="min-w-0">
                            <h1 class="text-[1.65rem] sm:text-3xl font-semibold tracking-tight text-ink leading-tight">Student Event Tasks</h1>
                            <p class="mt-1.5 max-w-2xl text-sm text-body">Track each student&rsquo;s daily event tasks and mark completion day by day.</p>
                        </div>
                        <div class="flex flex-col sm:flex-row items-stretch sm:items-end gap-2.5 w-full lg:w-auto">
                            <div class="relative flex-1 lg:min-w-[280px]">
                                <label for="eventSelect" class="block text-[11px] font-semibold uppercase tracking-[0.14em] text-muted mb-1.5">Event</label>
                                <select
                                    id="eventSelect"
                                    class="w-full px-3.5 py-2.5 text-sm bg-white border border-line rounded-xl text-ink shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600">
                                    <option value="">Loading events...</option>
                                </select>
                            </div>
                            <div class="flex items-center gap-2">
                                <button
                                    type="button"
                                    id="refreshTasksBtn"
                                    title="Refresh Data"
                                    class="inline-flex flex-1 sm:flex-none items-center justify-center gap-2 px-3.5 py-2.5 text-sm font-medium text-ink bg-white border border-line rounded-xl hover:bg-surface focus:outline-none focus:ring-2 focus:ring-blue-600/20 shadow-sm transition">
                                    <i data-lucide="refresh-cw" class="w-4 h-4"></i>
                                    <span>Refresh</span>
                                </button>
                                <button
                                    type="button"
                                    id="addTaskBtn"
                                    class="hidden sm:inline-flex items-center justify-center gap-2 px-3.5 py-2.5 text-sm font-medium text-white bg-blue-600 hover:bg-blue-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-600/30 shadow-sm transition">
                                    <i data-lucide="plus" class="w-4 h-4"></i>
                                    <span>Add Task</span>
                                </button>
                            </div>
                        </div>
                    </div>
                </header>

                <nav class="reveal mb-5 sm:mb-6" data-domino-enter>
                    <div class="flex gap-1 p-1 rounded-2xl border border-line bg-white/80 shadow-sm overflow-x-auto att-days-scroll" style="backdrop-filter: blur(12px); -webkit-backdrop-filter: blur(12px);">
                        <button
                            type="button"
                            id="tabDailyTracker"
                            class="view-tab-btn flex-1 min-w-[9rem] px-3.5 py-2.5 text-sm border border-blue-600 text-blue-600 font-semibold bg-white rounded-xl transition inline-flex items-center justify-center gap-1.5">
                            <i data-lucide="calendar" class="w-4 h-4"></i>
                            <span>Daily Tracker</span>
                        </button>
                        <button
                            type="button"
                            id="tabManageTasks"
                            class="view-tab-btn flex-1 min-w-[9rem] px-3.5 py-2.5 text-sm border border-transparent text-muted font-medium hover:text-ink hover:bg-surface rounded-xl transition inline-flex items-center justify-center gap-1.5">
                            <i data-lucide="list-todo" class="w-4 h-4"></i>
                            <span>Manage (<span id="tabTaskCount">0</span>)</span>
                        </button>
                    </div>
                </nav>

                <section id="eventSummaryCard" class="reveal mb-5 sm:mb-6" data-domino-enter>
                    <div class="relative overflow-hidden rounded-2xl border border-blue-600/10 text-white shadow-lift" style="background-image: url('public/Overview2.jpg'); background-size: cover; background-position: center;">
                        <div class="absolute inset-0 bg-blue-900/60 pointer-events-none"></div>
                        <div class="relative p-4 sm:p-5">
                            <div class="flex flex-col xl:flex-row xl:items-start xl:justify-between gap-4">
                                <div class="min-w-0 flex-1">
                                    <div id="eventInfoContent">
                                        ${skeletonEventInfo()}
                                    </div>
                                </div>
                                <div id="tasksStatsGrid" class="att-stats-grid att-stats-grid--4 w-full xl:w-auto xl:min-w-[340px] xl:max-w-md">
                                    <div class="att-stat-cell">
                                        <div class="att-stat-label text-blue-100/80">Assigned</div>
                                        <div class="att-stat-value" id="statTotalStudents">0</div>
                                    </div>
                                    <div class="att-stat-cell">
                                        <div class="att-stat-label text-emerald-200/90">Done</div>
                                        <div class="att-stat-value text-emerald-300" id="statCompleted">0</div>
                                    </div>
                                    <div class="att-stat-cell">
                                        <div class="att-stat-label text-yellow/90">Pending</div>
                                        <div class="att-stat-value text-yellow" id="statPending">0</div>
                                    </div>
                                    <div class="att-stat-cell">
                                        <div class="att-stat-label text-rose-200/90">Missed</div>
                                        <div class="att-stat-value text-rose-200" id="statNotComplete">0</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                <section id="scheduleDaysContainer" class="hidden reveal mb-4 sm:mb-5" data-domino-enter>
                    <div class="rounded-2xl border border-line bg-white p-3 sm:p-4 shadow-sm">
                        <div class="flex items-center justify-between gap-3 mb-2.5">
                            <span class="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted inline-flex items-center gap-1.5">
                                <i data-lucide="calendar-days" class="w-4 h-4 text-blue-600"></i>
                                Event day
                            </span>
                            <span class="text-xs text-muted tabular-nums" id="selectedDayInfoText"></span>
                        </div>
                        <div id="scheduleDaysList" class="flex gap-2 overflow-x-auto att-days-scroll pb-0.5 sm:flex-wrap sm:overflow-visible"></div>
                    </div>
                </section>

                <section id="dailyTrackerView" class="reveal" data-domino-enter>
                    <div class="mb-3 sm:mb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                        <div class="min-w-0">
                            <h3 class="text-sm font-semibold text-ink tracking-tight" id="tableDayTitle">Student Daily Tasks</h3>
                            <p class="text-xs text-muted mt-0.5" id="tableDayNotice">
                                Markings are set day by day for each scheduled task.
                            </p>
                        </div>
                        <div class="relative w-full sm:w-auto">
                            <i data-lucide="search" class="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted"></i>
                            <input
                                type="search"
                                id="taskSearchInput"
                                placeholder="Search student or task..."
                                class="w-full sm:w-64 pl-9 pr-3 py-2.5 text-sm border border-line rounded-xl bg-white text-ink placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-blue-600/15 focus:border-blue-600">
                        </div>
                    </div>

                    <div id="dailyTasksDesktopPanel" class="hidden md:block">
                        <div class="bg-white border border-line rounded-2xl shadow-sm overflow-hidden">
                            <div class="overflow-x-auto">
                                <table class="w-full text-sm text-left">
                                    <thead>
                                        <tr class="bg-surface border-b border-line text-[11px] font-semibold text-muted uppercase tracking-[0.14em]">
                                            <th class="px-4 py-3.5 w-12 text-center">#</th>
                                            <th class="px-4 py-3.5 min-w-[200px]">Student</th>
                                            <th class="px-4 py-3.5 min-w-[220px]">Task</th>
                                            <th class="px-4 py-3.5 text-center w-36">Schedule</th>
                                            <th class="px-4 py-3.5 text-center w-36">Status</th>
                                            <th class="px-4 py-3.5 text-center min-w-[250px]">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody id="dailyTasksTableBody" class="divide-y divide-line">
                                        ${skeletonTableRows(4, 6, true)}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>

                    <div id="dailyTasksMobileList" class="md:hidden space-y-3">
                        ${skeletonTaskCards()}
                    </div>
                </section>

                <section id="manageTasksView" class="hidden reveal" data-domino-enter>
                    <div class="mb-3 sm:mb-4">
                        <h3 class="text-sm font-semibold text-ink tracking-tight">Configured Tasks</h3>
                        <p class="text-xs text-muted mt-0.5">Manage task descriptions, date ranges, and assigned members</p>
                    </div>

                    <div id="manageTasksDesktopPanel" class="hidden md:block">
                        <div class="bg-white border border-line rounded-2xl shadow-sm overflow-hidden">
                            <div class="overflow-x-auto">
                                <table class="w-full text-sm text-left">
                                    <thead>
                                        <tr class="bg-surface border-b border-line text-[11px] font-semibold text-muted uppercase tracking-[0.14em]">
                                            <th class="px-4 py-3.5 w-12 text-center">#</th>
                                            <th class="px-4 py-3.5 min-w-[200px]">Task</th>
                                            <th class="px-4 py-3.5 w-32">Assigned</th>
                                            <th class="px-4 py-3.5 w-48">Date Range</th>
                                            <th class="px-4 py-3.5 text-center w-28">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody id="manageTasksTableBody" class="divide-y divide-line"></tbody>
                                </table>
                            </div>
                        </div>
                    </div>

                    <div id="manageTasksMobileList" class="md:hidden space-y-3"></div>
                </section>
            </main>

            <button
                type="button"
                id="addTaskFab"
                aria-label="Add Task"
                class="md:hidden fixed z-30 right-4 bottom-[max(1.25rem,env(safe-area-inset-bottom))] h-14 w-14 rounded-full bg-blue-600 text-white shadow-lift-lg flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-yellow">
                <i data-lucide="plus" class="w-6 h-6"></i>
            </button>
        </div>
    `;
}

function getTodayLocalDate() {
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, '0');
    const d = String(now.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
}

function formatTime12(timeString) {
    if (!timeString) return 'N/A';
    const parts = timeString.split(':');
    if (parts.length < 2) return timeString;
    let hours = parseInt(parts[0], 10);
    const minutes = parts[1];
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12;
    hours = hours ? hours : 12;
    return `${hours}:${minutes} ${ampm}`;
}

function formatDateDisplay(dateString) {
    if (!dateString) return { formatted: '-', dayName: '', raw: '' };
    try {
        const date = new Date(dateString + 'T00:00:00');
        const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        return {
            formatted: `${months[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()}`,
            dayName: days[date.getDay()],
            raw: dateString
        };
    } catch (e) {
        return { formatted: dateString, dayName: '', raw: dateString };
    }
}

function getScheduleStatusBadge(status, markedBy = null, isVoided = 0) {
    const s = (status || 'pending').toLowerCase();
    const base = 'inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-md text-[10px] font-semibold border';
    let badgeHtml = '';

    if (s === 'completed') {
        badgeHtml = `<span class="${base} bg-emerald-50 text-emerald-800 border-emerald-200"><i data-lucide="check" class="w-3 h-3"></i> Done</span>`;
    } else if (s === 'not_completed') {
        badgeHtml = `<span class="${base} bg-rose-50 text-rose-800 border-rose-200"><i data-lucide="x" class="w-3 h-3"></i> Missed</span>`;
    } else if (s === 'not_finished') {
        badgeHtml = `<span class="${base} bg-orange-50 text-orange-800 border-orange-200"><i data-lucide="alert-triangle" class="w-3 h-3"></i> Open</span>`;
    } else {
        badgeHtml = `<span class="${base} bg-surface text-muted border-line font-medium"><i data-lucide="minus" class="w-3 h-3"></i> Pending</span>`;
    }

    let metaHtml = '';
    if (markedBy === 'student') {
        metaHtml += `<span class="inline-flex items-center gap-0.5 px-1 py-0.5 rounded text-[9px] font-medium bg-blue-50 text-blue-600 border border-blue-100" title="Marked by Student"><i data-lucide="user-check" class="w-2.5 h-2.5"></i> Student</span>`;
    }
    if (isVoided == 1) {
        metaHtml += `<span class="inline-flex items-center gap-0.5 px-1 py-0.5 rounded text-[9px] font-medium bg-amber-50 text-amber-800 border border-amber-200" title="Voided by Adviser"><i data-lucide="shield-alert" class="w-2.5 h-2.5"></i> Voided</span>`;
    }

    return `<div class="inline-flex flex-wrap items-center justify-center gap-1">${badgeHtml}${metaHtml}</div>`;
}

function markActionButtons({ scheduleId, status, studentNameEscaped, taskTitleEscaped, dayNumber, canVoid }) {
    const isCompleted = status === 'completed';
    const isNotCompleted = status === 'not_completed';
    const isPending = status === 'pending';
    const seg = 'flex-1 min-w-0 px-1.5 py-1.5 text-[10px] sm:text-[11px] font-semibold transition inline-flex items-center justify-center gap-0.5 sm:gap-1';

    return `
        <div class="evt-mark-group inline-flex w-full max-w-[16rem] sm:max-w-none items-stretch rounded-lg border border-line bg-white overflow-hidden shadow-sm" role="group" aria-label="Day mark actions">
            <button type="button" onclick="adviserMarkSchedule(${scheduleId}, 'completed', '${studentNameEscaped}', '${taskTitleEscaped}')"
                class="${seg} ${isCompleted ? 'bg-emerald-600 text-white' : 'text-emerald-700 hover:bg-emerald-50'}"
                title="Mark Completed for Day ${dayNumber || ''}">
                <i data-lucide="check" class="w-3.5 h-3.5 shrink-0"></i>
                <span class="truncate">Done</span>
            </button>
            <button type="button" onclick="adviserMarkSchedule(${scheduleId}, 'not_completed', '${studentNameEscaped}', '${taskTitleEscaped}')"
                class="${seg} border-l border-line ${isNotCompleted ? 'bg-rose-600 text-white' : 'text-rose-700 hover:bg-rose-50'}"
                title="Mark Not Complete for Day ${dayNumber || ''}">
                <i data-lucide="x" class="w-3.5 h-3.5 shrink-0"></i>
                <span class="truncate">Miss</span>
            </button>
            <button type="button" onclick="adviserMarkSchedule(${scheduleId}, 'pending', '${studentNameEscaped}', '${taskTitleEscaped}')"
                class="${seg} border-l border-line ${isPending ? 'bg-amber-500 text-white' : 'text-amber-800 hover:bg-amber-50'}"
                title="Reset to Pending">
                <i data-lucide="rotate-ccw" class="w-3.5 h-3.5 shrink-0"></i>
                <span class="truncate">Reset</span>
            </button>
            ${canVoid ? `
                <button type="button" onclick="adviserVoidSchedule(${scheduleId}, '${studentNameEscaped}', '${status}')"
                    class="${seg} flex-none px-2 border-l border-line text-muted hover:text-rose-700 hover:bg-rose-50"
                    title="Void Student Schedule Marking">
                    <i data-lucide="trash-2" class="w-3.5 h-3.5 shrink-0"></i>
                </button>
            ` : ''}
        </div>
    `;
}

export async function initAdviserEvents() {
    if (!isAuthenticated('adviser')) {
        navigate('/adviser/login');
        return;
    }

    await initAdviserNavbar();
    initAdviserEventsAnimations(document.getElementById('adviser-events-page') || document);

    let events = [];
    let selectedEvent = null;
    let selectedOrganization = null;
    let adviserOrg = null;
    let tasks = [];
    let memberships = [];
    let selectedDate = null;
    let eventSchedules = [];
    let searchQuery = '';
    let currentView = 'tracker';
    let currentGroupedTasks = [];

    const eventSelect = document.getElementById('eventSelect');
    const refreshBtn = document.getElementById('refreshTasksBtn');
    const addTaskBtn = document.getElementById('addTaskBtn');
    const addTaskFab = document.getElementById('addTaskFab');
    const searchInput = document.getElementById('taskSearchInput');
    const tabDailyTracker = document.getElementById('tabDailyTracker');
    const tabManageTasks = document.getElementById('tabManageTasks');
    const dailyTrackerView = document.getElementById('dailyTrackerView');
    const manageTasksView = document.getElementById('manageTasksView');

    function setTabClasses(activeBtn, idleBtn) {
        TAB_ACTIVE.forEach((c) => activeBtn?.classList.add(c));
        TAB_IDLE.forEach((c) => activeBtn?.classList.remove(c));
        TAB_IDLE.forEach((c) => idleBtn?.classList.add(c));
        TAB_ACTIVE.forEach((c) => idleBtn?.classList.remove(c));
    }

    function switchView(view) {
        currentView = view;
        if (view === 'tracker') {
            setTabClasses(tabDailyTracker, tabManageTasks);
            dailyTrackerView?.classList.remove('hidden');
            manageTasksView?.classList.add('hidden');
            if (selectedEvent && eventSchedules.length > 0) {
                document.getElementById('scheduleDaysContainer')?.classList.remove('hidden');
            }
            finishEventsRender(false);
        } else {
            setTabClasses(tabManageTasks, tabDailyTracker);
            manageTasksView?.classList.remove('hidden');
            dailyTrackerView?.classList.add('hidden');
            document.getElementById('scheduleDaysContainer')?.classList.add('hidden');
            renderManageTasks();
        }
        if (typeof lucide !== 'undefined') lucide.createIcons();
    }

    tabDailyTracker?.addEventListener('click', () => switchView('tracker'));
    tabManageTasks?.addEventListener('click', () => switchView('manage'));

    async function auditScheduleAction(action, data, changedFields = []) {
        try {
            const adviserId = getUserId('adviser');
            const user = getUserData('adviser');
            const userName = user?.name || user?.username || 'Unknown';

            if (action === 'UPDATE') {
                for (const change of changedFields) {
                    await logAdviserChange({
                        user_id: adviserId,
                        user_type: 'adviser',
                        user_name: userName,
                        action: 'UPDATE',
                        table_name: 'task_daily_schedules',
                        record_id: data.id || 0,
                        field_name: change.field_name,
                        old_value: change.old_value !== null && change.old_value !== undefined ? String(change.old_value) : 'None',
                        new_value: change.new_value !== null && change.new_value !== undefined ? String(change.new_value) : 'None'
                    }, 'adviser');
                }
            } else if (action === 'VOID') {
                await logAdviserChange({
                    user_id: adviserId,
                    user_type: 'adviser',
                    user_name: userName,
                    action: 'UPDATE',
                    table_name: 'task_daily_schedules',
                    record_id: data.id || 0,
                    field_name: 'void_schedule_marking',
                    old_value: data.old_status || 'Marked',
                    new_value: 'Voided'
                }, 'adviser');
            }
        } catch (error) {
            console.error('Audit log failed for schedule:', error);
        }
    }

    async function refreshTasksForCurrentSelection() {
        if (!selectedEvent) return;
        const selectedEventId = selectedEvent.event_id || selectedEvent.id;
        const selectedOrgId = selectedOrganization ? selectedOrganization.organization_id : selectedEvent.organization_id;
        try {
            const rawTasks = await AdviserEventsAPI.getTasksByEvent(selectedEventId, selectedOrgId);
            tasks = (rawTasks || []).filter(t => {
                const matchEvent = String(t.event_id) === String(selectedEventId);
                const matchOrg = !selectedOrgId || !t.organization_id || String(t.organization_id) === String(selectedOrgId);
                return matchEvent && matchOrg;
            });
            renderSummaryCard();
            renderDailyTable();
            renderManageTasks();
            updateManageTasksBadge();
        } catch (err) {
            console.error('Error refreshing tasks:', err);
        }
    }

    async function loadEvents() {
        try {
            if (eventSelect) {
                eventSelect.innerHTML = '<option value="">Loading events...</option>';
            }

            const [orgResult, eventsResult] = await Promise.all([
                AdviserOrganizationAPI.getAdviserOrganization().catch(err => {
                    console.error('Error loading organization:', err);
                    return null;
                }),
                AdviserEventsAPI.getRegisteredEvents().catch(err => {
                    console.error('Error loading registered events:', err);
                    return [];
                })
            ]);
            adviserOrg = orgResult;
            events = eventsResult;

            if (!eventSelect) return;

            if (!events || events.length === 0) {
                eventSelect.innerHTML = '<option value="">No registered events found</option>';
                eventSelect.disabled = true;
                [addTaskBtn, addTaskFab].forEach((btn) => {
                    if (btn) {
                        btn.disabled = true;
                        btn.classList.add('opacity-50', 'cursor-not-allowed');
                    }
                });
                renderEmptyDailyTable('no_events');
                return;
            }

            eventSelect.disabled = false;
            [addTaskBtn, addTaskFab].forEach((btn) => {
                if (btn) {
                    btn.disabled = false;
                    btn.classList.remove('opacity-50', 'cursor-not-allowed');
                }
            });

            eventSelect.innerHTML = '<option value="">-- Choose an Event --</option>';

            events.forEach(event => {
                const eId = event.event_id || event.id;
                const oId = event.organization_id || '';
                const eTitle = event.event_title || event.title || 'Event';
                const oName = event.organization_name || (adviserOrg ? adviserOrg.name : 'Organization');
                const option = document.createElement('option');
                option.value = `${eId}_${oId}`;
                option.textContent = `${eTitle} (${oName})`;
                eventSelect.appendChild(option);
            });

            if (events.length > 0) {
                const firstEvent = events[0];
                const firstVal = `${firstEvent.event_id || firstEvent.id}_${firstEvent.organization_id || ''}`;
                eventSelect.value = firstVal;
                await handleEventChange(firstVal);
            } else {
                renderEmptyDailyTable('no_events');
            }
        } catch (error) {
            console.error('Error loading events:', error);
            showToast('Failed to load events', 'error');
            renderEmptyDailyTable('error');
        }
    }

    async function handleEventChange(rawValue) {
        if (!rawValue) {
            selectedEvent = null;
            selectedOrganization = null;
            selectedDate = null;
            tasks = [];
            eventSchedules = [];
            document.getElementById('eventSummaryCard')?.classList.add('hidden');
            document.getElementById('scheduleDaysContainer')?.classList.add('hidden');
            renderEmptyDailyTable('select_event');
            return;
        }

        const [eventIdStr, orgIdStr] = rawValue.includes('_') ? rawValue.split('_') : [rawValue, null];

        selectedEvent = events.find(event =>
            String(event.event_id || event.id) === String(eventIdStr) &&
            (!orgIdStr || String(event.organization_id) === String(orgIdStr))
        ) || events.find(event => String(event.event_id || event.id) === String(eventIdStr));

        if (!selectedEvent) {
            renderEmptyDailyTable('select_event');
            return;
        }

        const selectedEventId = selectedEvent.event_id || selectedEvent.id;
        const selectedOrgId = selectedEvent.organization_id || (adviserOrg ? adviserOrg.id : null);

        selectedOrganization = {
            organization_id: selectedOrgId,
            organization_name: selectedEvent.organization_name || (adviserOrg ? adviserOrg.name : 'Organization')
        };

        setTasksLoading(true);

        try {
            const [rawTasks] = await Promise.all([
                AdviserEventsAPI.getTasksByEvent(selectedEventId, selectedOrgId),
                loadMemberships(selectedOrganization.organization_id)
            ]);

            tasks = (rawTasks || []).filter(t => {
                const matchEvent = String(t.event_id) === String(selectedEventId);
                const matchOrg = !selectedOrgId || !t.organization_id || String(t.organization_id) === String(selectedOrgId);
                return matchEvent && matchOrg;
            });

            let schedules = selectedEvent.daily_schedules || [];
            if (!schedules || schedules.length === 0) {
                const taskDatesMap = new Map();
                (tasks || []).forEach(t => {
                    (t.daily_schedules || []).forEach(ds => {
                        if (ds.schedule_date && !taskDatesMap.has(ds.schedule_date)) {
                            taskDatesMap.set(ds.schedule_date, {
                                schedule_date: ds.schedule_date,
                                start_time: ds.start_time || '08:00:00',
                                end_time: ds.end_time || '17:00:00'
                            });
                        }
                    });
                });
                schedules = Array.from(taskDatesMap.values()).sort((a, b) => a.schedule_date.localeCompare(b.schedule_date));
            }

            if ((!schedules || schedules.length === 0) && selectedEvent.event_day_start && selectedEvent.event_day_end) {
                try {
                    const start = new Date(selectedEvent.event_day_start + 'T00:00:00');
                    const end = new Date(selectedEvent.event_day_end + 'T00:00:00');
                    const cur = new Date(start);
                    while (cur <= end) {
                        const y = cur.getFullYear();
                        const m = String(cur.getMonth() + 1).padStart(2, '0');
                        const d = String(cur.getDate()).padStart(2, '0');
                        schedules.push({
                            schedule_date: `${y}-${m}-${d}`,
                            start_time: '08:00:00',
                            end_time: '17:00:00'
                        });
                        cur.setDate(cur.getDate() + 1);
                    }
                } catch (e) {}
            }

            eventSchedules = schedules;
            selectedEvent = { ...selectedEvent, daily_schedules: schedules };

            if (eventSchedules.length > 0) {
                const todayStr = getTodayLocalDate();
                const hasToday = eventSchedules.some(s => s.schedule_date === todayStr);
                selectedDate = hasToday ? todayStr : eventSchedules[0].schedule_date;
            } else {
                selectedDate = null;
            }

            renderScheduleDays(eventSchedules);
            renderSummaryCard();
            renderDailyTable();
            renderManageTasks();
            updateManageTasksBadge();
        } catch (error) {
            console.error('Error fetching event tasks:', error);
            showToast('Failed to load event tasks', 'error');
            renderEmptyDailyTable('error');
        } finally {
            setTasksLoading(false);
        }
    }

    async function loadMemberships(orgId) {
        try {
            let rawMemberships = [];
            if (orgId) {
                rawMemberships = await AdviserOrganizationAPI.getAdviserOrgMembershipsByOrg(orgId);
            }
            const seen = new Set();
            memberships = (rawMemberships || []).filter(m => {
                if (!m || !m.student_id || seen.has(m.student_id)) return false;
                seen.add(m.student_id);
                return true;
            });
        } catch (error) {
            console.error('Error loading memberships:', error);
            memberships = [];
        }
    }

    function renderScheduleDays(schedules) {
        const container = document.getElementById('scheduleDaysContainer');
        const list = document.getElementById('scheduleDaysList');
        if (!container || !list) return;

        if (!schedules || schedules.length === 0) {
            container.classList.add('hidden');
            return;
        }

        if (currentView === 'tracker') {
            container.classList.remove('hidden');
        }
        const todayStr = getTodayLocalDate();

        list.innerHTML = schedules.map((sched, idx) => {
            const dateInfo = formatDateDisplay(sched.schedule_date);
            const isSelected = sched.schedule_date === selectedDate;
            const isDayToday = (sched.schedule_date === todayStr);
            const activeClasses = isSelected
                ? 'bg-blue-600 text-white font-semibold shadow-sm border-blue-600'
                : 'bg-surface text-body hover:bg-white border-line';
            const shortDate = dateInfo.formatted.replace(/, \d{4}$/, '');

            return `
                <button
                    type="button"
                    data-date="${sched.schedule_date}"
                    class="day-tab-btn shrink-0 px-2 py-1.5 text-[11px] rounded-lg border transition inline-flex items-center gap-1 ${activeClasses}">
                    <span class="font-bold tabular-nums">D${idx + 1}</span>
                    <span class="opacity-90">${shortDate}</span>
                    <span class="hidden sm:inline opacity-70">(${dateInfo.dayName})</span>
                    ${isDayToday ? `
                        <span class="px-1 py-0.5 rounded text-[9px] font-bold leading-none ${isSelected ? 'bg-yellow text-blue-600' : 'bg-emerald-50 text-emerald-800 border border-emerald-200'}">Today</span>
                    ` : ''}
                </button>
            `;
        }).join('');

        container.querySelectorAll('.day-tab-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const date = btn.getAttribute('data-date');
                if (date && date !== selectedDate) {
                    selectedDate = date;
                    renderScheduleDays(eventSchedules);
                    renderSummaryCard();
                    renderDailyTable(false);
                }
            });
        });

        const selectedSched = schedules.find(s => s.schedule_date === selectedDate);
        const infoText = document.getElementById('selectedDayInfoText');
        if (infoText && selectedSched) {
            const timeRange = selectedSched.start_time && selectedSched.end_time
                ? `${formatTime12(selectedSched.start_time)} - ${formatTime12(selectedSched.end_time)}`
                : '';
            infoText.textContent = timeRange;
        }

        const titleSpan = document.getElementById('tableDayTitle');
        if (titleSpan) {
            const dateObj = formatDateDisplay(selectedDate);
            const isToday = (selectedDate === todayStr);
            titleSpan.innerHTML = `Tasks — ${dateObj.formatted} <span class="text-muted font-normal">(${dateObj.dayName})</span> ${isToday
                ? '<span class="inline-flex items-center gap-0.5 text-[10px] px-1.5 py-0.5 rounded-md bg-emerald-50 text-emerald-800 border border-emerald-200 font-semibold ml-1 align-middle"><span class="w-1 h-1 rounded-full bg-emerald-500 animate-pulse"></span>Today</span>'
                : '<span class="inline-flex text-[10px] px-1.5 py-0.5 rounded-md bg-surface text-muted border border-line font-medium ml-1 align-middle">Scheduled</span>'}`;
        }
    }

    function renderSummaryCard() {
        const card = document.getElementById('eventSummaryCard');
        const eventInfo = document.getElementById('eventInfoContent');
        if (!card || !selectedEvent || !eventInfo) return;

        card.classList.remove('hidden');

        const start = selectedEvent.event_day_start ? formatDateDisplay(selectedEvent.event_day_start).formatted : '';
        const end = selectedEvent.event_day_end ? formatDateDisplay(selectedEvent.event_day_end).formatted : '';

        eventInfo.innerHTML = eventInfoMarkup({
            title: selectedEvent.event_title || selectedEvent.title || 'Event Title',
            organization: selectedEvent.organization_name || 'Organization',
            category: selectedEvent.event_category || 'Event',
            venue: selectedEvent.venue || 'Campus / Venue',
            dateRange: (start && end) ? `${start} - ${end}` : (start || 'Flexible schedule')
        });

        let totalAssigned = 0;
        let completed = 0;
        let pending = 0;
        let notComplete = 0;

        (tasks || []).forEach(task => {
            const daySchedule = (task.daily_schedules || []).find(ds => ds.schedule_date === selectedDate);
            if (daySchedule) {
                totalAssigned++;
                const st = (daySchedule.status || 'pending').toLowerCase();
                if (st === 'completed') {
                    completed++;
                } else if (st === 'not_completed' || st === 'not_finished') {
                    notComplete++;
                } else {
                    pending++;
                }
            }
        });

        const setText = (id, value) => {
            const el = document.getElementById(id);
            if (el) el.textContent = value;
        };

        setText('statTotalStudents', totalAssigned);
        setText('statCompleted', completed);
        setText('statPending', pending);
        setText('statNotComplete', notComplete);
        document.getElementById('tasksStatsGrid')?.classList.remove('att-stats-loading');

        if (typeof lucide !== 'undefined') lucide.createIcons();
    }

    function renderDailyTable(animate = true) {
        const tbody = document.getElementById('dailyTasksTableBody');
        const mobileList = document.getElementById('dailyTasksMobileList');
        if (!tbody && !mobileList) return;

        if (!selectedEvent) {
            renderEmptyDailyTable('select_event');
            return;
        }

        if (!selectedDate) {
            const block = emptyBlock('calendar-x', 'No schedules configured for this event', 'Tap Add Task to create tasks and schedules for students.');
            if (tbody) tbody.innerHTML = `<tr data-domino-enter class="reveal"><td colspan="6">${block}</td></tr>`;
            if (mobileList) mobileList.innerHTML = `<article class="reveal rounded-2xl border border-line bg-white" data-domino-enter>${block}</article>`;
            finishEventsRender(animate);
            return;
        }

        const dayRows = [];
        (tasks || []).forEach(task => {
            const schedule = (task.daily_schedules || []).find(ds => ds.schedule_date === selectedDate);
            if (schedule) {
                dayRows.push({ task, schedule });
            }
        });

        if (dayRows.length === 0) {
            const block = emptyBlock(
                'calendar-off',
                `No student tasks on ${formatDateDisplay(selectedDate).formatted}`,
                'Select another day or add a task for this date.'
            );
            if (tbody) tbody.innerHTML = `<tr data-domino-enter class="reveal"><td colspan="6">${block}</td></tr>`;
            if (mobileList) mobileList.innerHTML = `<article class="reveal rounded-2xl border border-line bg-white" data-domino-enter>${block}</article>`;
            finishEventsRender(animate);
            return;
        }

        const filteredRows = dayRows.filter(item => {
            if (!searchQuery) return true;
            const q = searchQuery.toLowerCase();
            const studentName = (item.task.student_name || `${item.task.first_name || ''} ${item.task.last_name || ''}`).toLowerCase();
            const studentNum = (item.task.student_number || '').toLowerCase();
            const taskTitle = (item.task.task_title || item.task.task_description || '').toLowerCase();
            return studentName.includes(q) || studentNum.includes(q) || taskTitle.includes(q);
        });

        if (filteredRows.length === 0) {
            const block = emptyBlock('search-x', 'No matches', `No tasks or students matching "${searchQuery}" on this day`);
            if (tbody) tbody.innerHTML = `<tr data-domino-enter class="reveal"><td colspan="6">${block}</td></tr>`;
            if (mobileList) mobileList.innerHTML = `<article class="reveal rounded-2xl border border-line bg-white" data-domino-enter>${block}</article>`;
            finishEventsRender(animate);
            return;
        }

        let rowsHtml = '';
        let cardsHtml = '';

        filteredRows.forEach((item, index) => {
            const { task, schedule } = item;
            const studentName = task.student_name || `${task.first_name || ''} ${task.last_name || ''}` || 'Student';
            const studentNumber = task.student_number || 'N/A';
            const taskTitle = task.task_title || 'Assigned Task';
            const taskDesc = task.task_description || '';
            const timeRange = `${formatTime12(schedule.start_time)} - ${formatTime12(schedule.end_time)}`;
            const status = schedule.status || 'pending';
            const studentNameEscaped = studentName.replace(/'/g, "\\'");
            const taskTitleEscaped = taskTitle.replace(/'/g, "\\'");
            const dayNumber = schedule.day_number || (index + 1);
            const canVoid = status === 'completed' || status === 'not_completed' || schedule.marked_by === 'student';
            const actionsHtml = markActionButtons({
                scheduleId: schedule.id,
                status,
                studentNameEscaped,
                taskTitleEscaped,
                dayNumber,
                canVoid
            });

            rowsHtml += `
                <tr class="reveal hover:bg-surface/80 transition-colors" data-domino-enter>
                    <td class="px-4 py-3.5 text-center text-xs text-muted font-mono">${index + 1}</td>
                    <td class="px-4 py-3.5">
                        <div class="flex items-center gap-2.5">
                            <div class="w-9 h-9 bg-blue-600/10 text-blue-600 rounded-xl flex items-center justify-center font-bold text-xs shrink-0">
                                ${studentName.charAt(0).toUpperCase()}
                            </div>
                            <div class="min-w-0">
                                <p class="text-sm font-semibold text-ink truncate">${studentName}</p>
                                <p class="text-[11px] text-muted font-mono mt-0.5"><span class="bg-surface border border-line px-1.5 py-0.5 rounded">${studentNumber}</span></p>
                            </div>
                        </div>
                    </td>
                    <td class="px-4 py-3.5">
                        <p class="text-sm font-semibold text-ink">${taskTitle}</p>
                        ${taskDesc && taskDesc !== taskTitle ? `<p class="text-xs text-muted line-clamp-1 mt-0.5">${taskDesc}</p>` : ''}
                        <span class="inline-block mt-1.5 text-[10px] text-blue-600 bg-blue-50 border border-blue-100 px-1.5 py-0.5 rounded font-medium">D${dayNumber}</span>
                    </td>
                    <td class="px-4 py-3.5 text-center">
                        <span class="inline-flex items-center gap-1 text-xs text-body font-medium tabular-nums">
                            <i data-lucide="clock" class="w-3.5 h-3.5 text-muted"></i>
                            <span>${timeRange}</span>
                        </span>
                    </td>
                    <td class="px-4 py-3.5 text-center">
                        ${getScheduleStatusBadge(status, schedule.marked_by, schedule.is_voided)}
                    </td>
                    <td class="px-3 py-3 text-center">
                        <div class="flex justify-center">${actionsHtml}</div>
                    </td>
                </tr>
            `;

            cardsHtml += `
                <article class="evt-mobile-card reveal rounded-2xl border border-line bg-white shadow-sm overflow-hidden" data-domino-enter>
                    <div class="p-3.5">
                        <div class="flex items-start gap-2.5">
                            <div class="w-10 h-10 bg-blue-600 text-white rounded-xl flex items-center justify-center font-bold text-sm shrink-0">
                                ${studentName.charAt(0).toUpperCase()}
                            </div>
                            <div class="min-w-0 flex-1">
                                <div class="flex items-start justify-between gap-2">
                                    <div class="min-w-0">
                                        <h3 class="text-sm font-semibold text-ink truncate">${studentName}</h3>
                                        <p class="text-[11px] text-muted font-mono mt-0.5">${studentNumber}</p>
                                    </div>
                                    ${getScheduleStatusBadge(status, schedule.marked_by, schedule.is_voided)}
                                </div>
                                <p class="text-sm font-medium text-ink mt-2">${taskTitle}</p>
                                ${taskDesc && taskDesc !== taskTitle ? `<p class="text-xs text-muted line-clamp-2 mt-0.5">${taskDesc}</p>` : ''}
                                <div class="mt-2 flex flex-wrap items-center gap-1.5 text-[11px]">
                                    <span class="inline-flex items-center px-1.5 py-0.5 rounded bg-blue-600 text-white text-[10px] font-semibold">D${dayNumber}</span>
                                    <span class="inline-flex items-center gap-1 text-muted tabular-nums">
                                        <i data-lucide="clock" class="w-3 h-3"></i>${timeRange}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div class="px-3 py-2.5 border-t border-line bg-surface/70">
                        ${actionsHtml}
                    </div>
                </article>
            `;
        });

        if (tbody) tbody.innerHTML = rowsHtml;
        if (mobileList) mobileList.innerHTML = cardsHtml;
        finishEventsRender(animate);
    }

    function updateManageTasksBadge() {
        const grouped = groupTasks(tasks);
        currentGroupedTasks = grouped;
        const countSpan = document.getElementById('tabTaskCount');
        if (countSpan) {
            countSpan.textContent = grouped.length;
        }
    }

    function groupTasks(taskList) {
        const grouped = {};
        (taskList || []).forEach(task => {
            const key = `${task.event_id || ''}-${task.organization_id || ''}-${task.task_title || ''}-${task.task_description}`;
            if (!grouped[key]) {
                grouped[key] = {
                    title: task.task_title,
                    description: task.task_description,
                    organization_name: task.organization_name,
                    organization_id: task.organization_id,
                    event_id: task.event_id,
                    start_date: task.start_date,
                    end_date: task.end_date,
                    students: []
                };
            }
            if (!grouped[key].students.some(s => s.student_id === task.student_id)) {
                grouped[key].students.push(task);
            }
        });
        return Object.values(grouped);
    }

    function renderManageTasks() {
        const tbody = document.getElementById('manageTasksTableBody');
        const mobileList = document.getElementById('manageTasksMobileList');
        if (!tbody && !mobileList) return;

        const grouped = groupTasks(tasks);
        currentGroupedTasks = grouped;

        if (grouped.length === 0) {
            const block = emptyBlock('check-square', 'No configured tasks for this event', 'Tap Add Task to assign work to organization members.');
            if (tbody) tbody.innerHTML = `<tr data-domino-enter class="reveal"><td colspan="5">${block}</td></tr>`;
            if (mobileList) mobileList.innerHTML = `<article class="reveal rounded-2xl border border-line bg-white" data-domino-enter>${block}</article>`;
            if (currentView === 'manage') finishEventsRender();
            return;
        }

        let rowsHtml = '';
        let cardsHtml = '';

        grouped.forEach((group, groupIndex) => {
            const startDateStr = group.students[0]?.student_start_date || group.students[0]?.start_date || group.start_date;
            const endDateStr = group.students[0]?.student_end_date || group.students[0]?.end_date || group.end_date;
            const formattedDates = `${formatDateDisplay(startDateStr).formatted} - ${formatDateDisplay(endDateStr).formatted}`;
            const title = group.title || group.description || 'Assigned Task';
            const menu = CrudMenu({
                id: String(groupIndex),
                showView: false,
                onEdit: 'editTaskGroup',
                onDelete: 'deleteTaskGroup',
                deleteLabel: title.substring(0, 30)
            });

            rowsHtml += `
                <tr class="reveal hover:bg-surface/80 transition-colors" data-domino-enter>
                    <td class="px-4 py-3.5 text-center text-xs text-muted font-mono">${groupIndex + 1}</td>
                    <td class="px-4 py-3.5">
                        <p class="text-sm font-semibold text-ink">${title}</p>
                        ${group.description && group.description !== group.title ? `<p class="text-xs text-muted mt-0.5 line-clamp-2">${group.description}</p>` : ''}
                    </td>
                    <td class="px-4 py-3.5">
                        <span class="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-md text-[10px] font-semibold bg-blue-50 text-blue-600 border border-blue-100" title="${group.students.length} assigned student(s)">
                            <i data-lucide="users" class="w-3 h-3"></i>
                            ${group.students.length}
                        </span>
                    </td>
                    <td class="px-4 py-3.5 text-xs text-body whitespace-nowrap tabular-nums">${formattedDates}</td>
                    <td class="px-4 py-3.5 text-center">
                        <div class="flex items-center justify-center gap-1">${menu}</div>
                    </td>
                </tr>
            `;

            cardsHtml += `
                <article class="evt-mobile-card reveal rounded-2xl border border-line bg-white shadow-sm overflow-hidden" data-domino-enter>
                    <div class="p-4">
                        <div class="flex items-start justify-between gap-3">
                            <div class="min-w-0 flex-1">
                                <span class="text-[11px] font-mono text-muted">#${groupIndex + 1}</span>
                                <h3 class="text-sm font-semibold text-ink mt-1">${title}</h3>
                                ${group.description && group.description !== group.title ? `<p class="text-xs text-muted mt-1 line-clamp-2">${group.description}</p>` : ''}
                            </div>
                            ${menu}
                        </div>
                        <div class="mt-3 flex flex-wrap items-center gap-1.5 text-[11px]">
                            <span class="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-md text-[10px] font-semibold bg-blue-50 text-blue-600 border border-blue-100">
                                <i data-lucide="users" class="w-3 h-3"></i>
                                ${group.students.length} assigned
                            </span>
                            <span class="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-md text-[10px] font-medium text-muted bg-surface border border-line tabular-nums">
                                <i data-lucide="calendar" class="w-3 h-3"></i>
                                ${formattedDates}
                            </span>
                        </div>
                    </div>
                </article>
            `;
        });

        if (tbody) tbody.innerHTML = rowsHtml;
        if (mobileList) mobileList.innerHTML = cardsHtml;
        if (currentView === 'manage') finishEventsRender();
        else if (typeof lucide !== 'undefined') lucide.createIcons();
    }

    function renderEmptyDailyTable(type) {
        const tbody = document.getElementById('dailyTasksTableBody');
        const mobileList = document.getElementById('dailyTasksMobileList');

        let icon = 'calendar';
        let title = 'Select an Event';
        let subtitle = 'Choose an event from the dropdown above to view student daily task schedules.';

        switch (type) {
            case 'no_organization':
                icon = 'building-2';
                title = 'No Organization Assigned';
                subtitle = 'You are not assigned to any organization. Please contact the administrator.';
                break;
            case 'no_events':
                icon = 'calendar-x';
                title = 'No Events Registered';
                subtitle = 'Your organization has not registered for any events yet.';
                break;
            case 'error':
                icon = 'alert-triangle';
                title = 'Error Loading Tasks';
                subtitle = 'Something went wrong while loading event tasks. Try refreshing.';
                break;
            case 'select_event':
            default:
                break;
        }

        const block = emptyBlock(icon, title, subtitle);
        if (tbody) tbody.innerHTML = `<tr data-domino-enter class="reveal"><td colspan="6">${block}</td></tr>`;
        if (mobileList) mobileList.innerHTML = `<article class="reveal rounded-2xl border border-line bg-white" data-domino-enter>${block}</article>`;
        finishEventsRender();
    }

    function openAddTask() {
        if (!selectedEvent) {
            showToast('Please select an event first', 'error');
            return;
        }

        if (!memberships || memberships.length === 0) {
            const orgName = selectedOrganization?.organization_name || 'the selected organization';
            showToast(`No members found in ${orgName}. Please add members to the organization first.`, 'error');
            return;
        }

        openTaskModal({
            mode: 'add',
            eventId: selectedEvent.event_id || selectedEvent.id,
            eventTitle: selectedEvent.event_title || selectedEvent.title,
            organizationId: selectedOrganization ? selectedOrganization.organization_id : (selectedEvent.organization_id || null),
            memberships: memberships,
            event: selectedEvent,
            onSubmit: async (payload) => {
                await AdviserEventsAPI.syncTaskGroup(payload);
                await refreshTasksForCurrentSelection();
            }
        });
    }

    window.adviserMarkSchedule = async (scheduleId, status, studentName, taskTitle) => {
        try {
            await AdviserEventsAPI.updateScheduleStatus(scheduleId, status);
            const statusLabel = status === 'completed' ? 'Completed' : status === 'not_completed' ? 'Not Complete' : 'Pending';
            showToast(`${studentName}: Day marked as ${statusLabel}`, 'success');

            await auditScheduleAction('UPDATE', { id: scheduleId }, [{
                field_name: 'day_schedule_status',
                old_value: 'Previous',
                new_value: statusLabel
            }]);

            if (selectedEvent) { await refreshTasksForCurrentSelection(); }
        } catch (error) {
            console.error('Error updating schedule status:', error);
            showToast(error.message || 'Failed to update schedule status', 'error');
        }
    };

    window.adviserVoidSchedule = (scheduleId, studentName, oldStatus) => {
        openConfirmDialog({
            title: 'Void Schedule Marking',
            message: `Are you sure you want to void the task marking for ${studentName} on this day? The schedule status will be reset.`,
            confirmText: 'Void Marking',
            cancelText: 'Cancel',
            type: 'danger',
            onConfirm: async () => {
                try {
                    await AdviserEventsAPI.voidScheduleStatus(scheduleId, 'Voided by adviser');
                    showToast(`Marking for ${studentName} has been voided`, 'info');

                    await auditScheduleAction('VOID', { id: scheduleId, old_status: oldStatus });

                    if (selectedEvent) { await refreshTasksForCurrentSelection(); }
                } catch (error) {
                    console.error('Error voiding schedule marking:', error);
                    showToast(error.message || 'Failed to void schedule marking', 'error');
                }
            }
        });
    };

    window.editTaskGroup = (groupIndex) => {
        const group = currentGroupedTasks[parseInt(groupIndex)];
        if (!group) return;

        openTaskModal({
            mode: 'edit',
            taskGroup: group,
            eventId: selectedEvent.event_id || selectedEvent.id,
            eventTitle: selectedEvent.event_title || selectedEvent.title,
            organizationId: group.organization_id || (selectedOrganization ? selectedOrganization.organization_id : (selectedEvent.organization_id || null)),
            memberships: memberships,
            event: selectedEvent,
            onSubmit: async (payload) => {
                await AdviserEventsAPI.syncTaskGroup(payload);
                await refreshTasksForCurrentSelection();
            }
        });
    };

    window.deleteTaskGroup = (groupIndex, deleteLabel) => {
        const group = currentGroupedTasks[parseInt(groupIndex)];
        if (!group) return;

        const taskIds = group.students.map(s => s.id);
        const taskTitle = group.title || group.description || deleteLabel || 'this task';

        openConfirmDialog({
            title: 'Confirm Delete',
            message: `Are you sure you want to delete "${taskTitle}"? This will delete the task and all daily schedules for assigned students.`,
            confirmText: 'Delete',
            cancelText: 'Cancel',
            type: 'danger',
            onConfirm: async () => {
                try {
                    await AdviserEventsAPI.deleteTaskGroup(taskIds);
                    showToast('Task deleted successfully', 'success');
                    await refreshTasksForCurrentSelection();
                } catch (error) {
                    console.error('Error deleting task group:', error);
                    showToast('Failed to delete task', 'error');
                }
            }
        });
    };

    eventSelect?.addEventListener('change', async (e) => {
        await handleEventChange(e.target.value);
    });

    refreshBtn?.addEventListener('click', async () => {
        if (selectedEvent) {
            await handleEventChange(eventSelect?.value);
            showToast('Event tasks refreshed', 'info');
        } else {
            await loadEvents();
        }
    });

    addTaskBtn?.addEventListener('click', openAddTask);
    addTaskFab?.addEventListener('click', openAddTask);

    searchInput?.addEventListener('input', (e) => {
        searchQuery = (e.target.value || '').trim();
        renderDailyTable(false);
    });

    await loadEvents();
}

import { AdviserNavbar, initAdviserNavbar } from '../../../components/Navbar/AdviserNavbar.js';
import { isAuthenticated, getUserId, getUserData } from '../../../utils/jwt.js';
import { navigate } from '../../../utils/navigation.js';
import * as AttendanceAPI from '../../../api/adviser/Attendance/Attendance.js';
import { openModal, closeModal, setModalButtonLoading } from '../../../utils/modal.js';
import { openConfirmDialog } from '../../../components/Dialog/ConfirmDialog.js';
import { showToast } from '../../../components/ToastMessage.js';
import { skeletonTableRows } from '../../../components/SkeletonLoading.js';
import { logAdviserChange } from '../../../api/AuditLogs/AdviserAuditLogs.js';
import { initAttendanceAnimations, animateDominoList } from '../../../provider/Animation/AttendanceAnimation.js';
import { FIELD_CLASS, LABEL_CLASS, modalSection, modalDetailTile, applyModalDomino } from '../../../components/Modal/modalUi.js';

function attendanceModalActions({
    cancelText = 'Cancel',
    confirmText,
    confirmId,
    danger = false,
    confirmClass = null,
    extraButtons = ''
}) {
    const submitBg = confirmClass || (danger ? 'bg-danger hover:bg-red-800' : 'bg-blue-600 hover:bg-blue-800');
    return `
        <div class="manage-modal-actions reveal flex flex-col-reverse sm:flex-row sm:justify-end gap-2" data-domino-enter>
            <button type="button" onclick="closeModal()" class="w-full sm:w-auto px-4 py-2.5 text-sm font-medium text-ink bg-surface hover:bg-line rounded-xl transition">${cancelText}</button>
            ${extraButtons}
            ${confirmText ? `<button type="button" id="${confirmId}" class="w-full sm:w-auto px-5 py-2.5 text-sm font-medium text-white ${submitBg} rounded-xl transition inline-flex items-center justify-center gap-1.5">${confirmText}</button>` : ''}
        </div>
    `;
}

function sessionChoiceCard({ name, value, label, hint = '', checked = false, tone = 'navy' }) {
    const tones = {
        navy: 'peer-checked:border-blue-600 peer-checked:bg-blue-50 peer-checked:ring-1 peer-checked:ring-blue-600/20',
        red: 'peer-checked:border-danger peer-checked:bg-red-50 peer-checked:ring-1 peer-checked:ring-danger/20',
        purple: 'peer-checked:border-purple-600 peer-checked:bg-purple-50 peer-checked:ring-1 peer-checked:ring-purple-200'
    };
    return `
        <label class="relative block cursor-pointer">
            <input type="radio" name="${name}" value="${value}" class="peer sr-only" ${checked ? 'checked' : ''}>
            <span class="flex flex-col gap-0.5 rounded-xl border border-line bg-white px-3.5 py-3 transition ${tones[tone] || tones.navy}">
                <span class="text-sm font-semibold text-ink">${label}</span>
                ${hint ? `<span class="text-[11px] text-muted">${hint}</span>` : ''}
            </span>
        </label>
    `;
}

function skeletonAttendanceCards(count = 4) {
    return Array.from({ length: count }, () => `
        <div class="att-mobile-card rounded-2xl border border-line bg-white/90 p-4">
            <div class="flex items-center gap-3">
                <div class="w-11 h-11 rounded-xl skeleton-shimmer shrink-0"></div>
                <div class="flex-1 space-y-2 min-w-0">
                    <div class="h-4 w-36 skeleton-shimmer rounded"></div>
                    <div class="h-3 w-28 skeleton-shimmer rounded"></div>
                </div>
            </div>
            <div class="mt-4 grid grid-cols-3 gap-2">
                <div class="h-16 skeleton-shimmer rounded-xl"></div>
                <div class="h-16 skeleton-shimmer rounded-xl"></div>
                <div class="h-16 skeleton-shimmer rounded-xl"></div>
            </div>
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

let attendanceListReady = false;

function finishAttendanceRender(animate = true) {
    if (typeof lucide !== 'undefined') lucide.createIcons();
    const targets = document.querySelectorAll('#attendanceMobileList .reveal, #attendanceTableBody .reveal');

    if (!animate || attendanceListReady) {
        targets.forEach((el) => el.classList.add('in'));
        attendanceListReady = true;
        return;
    }

    const isMobile = window.matchMedia('(max-width: 767px)').matches;
    const list = document.getElementById('attendanceMobileList');
    const table = document.getElementById('attendanceDesktopPanel');
    if (isMobile && list) animateDominoList(list);
    else if (!isMobile && table) animateDominoList(table);
    attendanceListReady = true;
}

function setAttendanceLoading(isLoading) {
    const tbody = document.getElementById('attendanceTableBody');
    const mobileList = document.getElementById('attendanceMobileList');
    const statsGrid = document.getElementById('attendanceStatsGrid');
    const eventInfo = document.getElementById('eventInfoContent');
    const summaryCard = document.getElementById('eventSummaryCard');

    if (isLoading) {
        if (tbody) tbody.innerHTML = skeletonTableRows(4, 8, true);
        if (mobileList) mobileList.innerHTML = skeletonAttendanceCards();
        if (eventInfo && !document.getElementById('eventTitleDisplay')) {
            eventInfo.innerHTML = skeletonEventInfo();
        }
        summaryCard?.classList.remove('hidden');
        statsGrid?.classList.add('att-stats-loading');
    } else {
        statsGrid?.classList.remove('att-stats-loading');
    }
}

function showHeroSkeleton() {
    const summaryCard = document.getElementById('eventSummaryCard');
    const eventInfo = document.getElementById('eventInfoContent');
    const statsGrid = document.getElementById('attendanceStatsGrid');
    summaryCard?.classList.remove('hidden');
    if (eventInfo) eventInfo.innerHTML = skeletonEventInfo();
    statsGrid?.classList.add('att-stats-loading');
    ['statTotalStudents', 'statCompleted', 'statInProgress', 'statAbsentExcused', 'statPendingExcuses'].forEach((id) => {
        const el = document.getElementById(id);
        if (el) el.textContent = '0';
    });
}

export function Attendance() {
    return `
        <div id="adviser-attendance-page" data-domino-page class="min-h-screen bg-surface font-sans text-ink pb-10">
            ${AdviserNavbar()}
            <main class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5 sm:py-8">
                <header class="reveal mb-5 sm:mb-7" data-domino-enter>
                    <span class="inline-flex items-center gap-2 rounded-full border border-line bg-white px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-blue-600">
                        <span class="h-1.5 w-1.5 rounded-full bg-yellow"></span>
                        Live session log
                    </span>
                    <div class="mt-3 flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4">
                        <div class="min-w-0">
                            <h1 class="text-[1.65rem] sm:text-3xl font-semibold tracking-tight text-ink leading-tight">Student Attendance</h1>
                            <p class="mt-1.5 max-w-2xl text-sm text-body">Track AM, break, and PM sessions for every registered student on each event day.</p>
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
                            <button
                                type="button"
                                id="refreshAttendanceBtn"
                                title="Refresh Data"
                                class="inline-flex items-center justify-center gap-2 px-3.5 py-2.5 text-sm font-medium text-ink bg-white border border-line rounded-xl hover:bg-surface focus:outline-none focus:ring-2 focus:ring-blue-600/20 shadow-sm transition">
                                <i data-lucide="refresh-cw" class="w-4 h-4"></i>
                                <span class="sm:inline">Refresh</span>
                            </button>
                        </div>
                    </div>
                </header>

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
                                <div id="attendanceStatsGrid" class="att-stats-grid w-full xl:w-auto xl:min-w-[420px] xl:max-w-md att-stats-loading">
                                    <div class="att-stat-cell">
                                        <div class="att-stat-label text-blue-100/80">Students</div>
                                        <div class="att-stat-value" id="statTotalStudents">0</div>
                                    </div>
                                    <div class="att-stat-cell">
                                        <div class="att-stat-label text-emerald-200/90">Done</div>
                                        <div class="att-stat-value text-emerald-300" id="statCompleted">0</div>
                                    </div>
                                    <div class="att-stat-cell">
                                        <div class="att-stat-label text-yellow/90">Active</div>
                                        <div class="att-stat-value text-yellow" id="statInProgress">0</div>
                                    </div>
                                    <div class="att-stat-cell">
                                        <div class="att-stat-label text-rose-200/90">Absent</div>
                                        <div class="att-stat-value text-rose-200" id="statAbsentExcused">0</div>
                                    </div>
                                    <div class="att-stat-cell">
                                        <div class="att-stat-label text-amber-200/90">Pending</div>
                                        <div class="att-stat-value text-amber-200" id="statPendingExcuses">0</div>
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

                <section class="reveal" data-domino-enter>
                    <div class="mb-3 sm:mb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                        <div class="min-w-0">
                            <h3 class="text-sm font-semibold text-ink tracking-tight" id="tableDayTitle">Student Attendance</h3>
                            <p class="text-xs text-muted mt-0.5" id="tableDayNotice">
                                Status becomes <span class="font-semibold text-success">Completed</span> when both AM and PM sessions are timed in &amp; out.
                            </p>
                        </div>
                        <div class="relative w-full sm:w-auto">
                            <i data-lucide="search" class="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted"></i>
                            <input
                                type="search"
                                id="studentSearchInput"
                                placeholder="Search name or student #..."
                                class="w-full sm:w-64 pl-9 pr-3 py-2.5 text-sm border border-line rounded-xl bg-white text-ink placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-blue-600/15 focus:border-blue-600">
                        </div>
                    </div>

                    <div id="attendanceDesktopPanel" class="hidden md:block">
                        <div class="bg-white border border-line rounded-2xl shadow-sm overflow-hidden">
                            <div class="overflow-x-auto">
                                <table class="w-full text-sm text-left">
                                    <thead>
                                        <tr class="bg-surface border-b border-line text-[11px] font-semibold text-muted uppercase tracking-[0.14em]">
                                            <th class="px-4 py-3.5 w-12 text-center">#</th>
                                            <th class="px-4 py-3.5 min-w-[200px]">Student</th>
                                            <th class="px-4 py-3.5 text-center min-w-[160px]">AM</th>
                                            <th class="px-4 py-3.5 text-center min-w-[160px]">Break</th>
                                            <th class="px-4 py-3.5 text-center min-w-[160px]">PM</th>
                                            <th class="px-4 py-3.5 text-center w-28">Duration</th>
                                            <th class="px-4 py-3.5 text-center w-36">Status</th>
                                            <th class="px-4 py-3.5 text-center min-w-[220px]">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody id="attendanceTableBody" class="divide-y divide-line">
                                        ${skeletonTableRows(4, 8, true)}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>

                    <div id="attendanceMobileList" class="md:hidden space-y-3">
                        ${skeletonAttendanceCards()}
                    </div>
                </section>
            </main>
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
    if (!timeString) return null;
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

function formatDuration(minutes) {
    if (!minutes || minutes <= 0) return '0 hrs';
    const hrs = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hrs > 0 && mins > 0) {
        return `${hrs}h ${mins}m`;
    } else if (hrs > 0) {
        return `${hrs} hrs`;
    } else {
        return `${mins} mins`;
    }
}

function getStatusBadge(status, excuseReason = null, excuseStatus = null) {
    const s = (status || 'Pending').toLowerCase();
    const es = (excuseStatus || '').toLowerCase();
    const base = 'inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-md text-[10px] font-semibold border whitespace-nowrap';

    if (es === 'pending' || s.includes('pending excuse')) {
        return `<span class="${base} bg-amber-50 text-amber-800 border-amber-200" title="Pending Excuse"><i data-lucide="clock" class="w-3 h-3"></i> Excuse?</span>`;
    }
    if (es === 'rejected') {
        return `<span class="${base} bg-rose-50 text-rose-800 border-rose-200" title="Excuse rejected by adviser"><i data-lucide="x" class="w-3 h-3"></i> Rejected</span>`;
    }
    if (s === 'completed' || s.includes('completed')) {
        return `<span class="${base} bg-emerald-50 text-emerald-800 border-emerald-200" title="${status}"><i data-lucide="check" class="w-3 h-3"></i> Done</span>`;
    }
    if (s.includes('absent')) {
        return `<span class="${base} bg-red-50 text-red-800 border-red-200" title="${status}"><i data-lucide="user-x" class="w-3 h-3"></i> Absent</span>`;
    }
    if (s.includes('excused')) {
        const titleAttr = excuseReason ? `title="Reason: ${excuseReason.replace(/"/g, '&quot;')}"` : `title="${status}"`;
        return `<span ${titleAttr} class="${base} bg-violet-50 text-violet-800 border-violet-200 cursor-help"><i data-lucide="file-check" class="w-3 h-3"></i> Excused</span>`;
    }
    if (s === 'in progress') {
        return `<span class="${base} bg-blue-50 text-blue-600 border-blue-100"><i data-lucide="clock" class="w-3 h-3"></i> Active</span>`;
    }
    return `<span class="${base} bg-surface text-muted border-line"><i data-lucide="minus" class="w-3 h-3"></i> Pending</span>`;
}

function sessionChip({ label, value, actionAttrs, tone = 'blue', disabled = false, disabledTitle = '' }) {
    const tones = {
        blue: {
            box: 'bg-blue-50/70 border-blue-100',
            label: 'text-blue-600/70',
            btn: 'text-blue-600 bg-white hover:bg-blue-50 border-blue-200',
            val: 'border-blue-100'
        },
        amber: {
            box: 'bg-amber-50/70 border-amber-100',
            label: 'text-amber-900/70',
            btn: 'text-amber-900 bg-white hover:bg-amber-50 border-amber-200',
            val: 'border-amber-200'
        }
    };
    const t = tones[tone] || tones.blue;
    if (value) {
        return `
            <div class="flex items-center justify-between gap-2 text-xs">
                <span class="text-[11px] font-medium ${t.label}">${label}</span>
                <span class="font-semibold text-ink bg-white px-1.5 py-0.5 rounded-md border ${t.val} text-[11px] tabular-nums">${value}</span>
            </div>
        `;
    }
    return `
        <div class="flex items-center justify-between gap-2 text-xs">
            <span class="text-[11px] font-medium ${t.label}">${label}</span>
            <button type="button" ${actionAttrs}
                ${disabled ? `disabled title="${disabledTitle.replace(/"/g, '&quot;')}"` : ''}
                class="px-2 py-0.5 text-[11px] font-medium rounded-md border transition disabled:opacity-40 disabled:cursor-not-allowed disabled:bg-surface disabled:text-muted disabled:border-line ${t.btn}">
                + ${label}
            </button>
        </div>
    `;
}

function sessionBlock({ title, tone, rows }) {
    const tones = {
        blue: 'bg-surface/80 border-line',
        amber: 'bg-amber-50/40 border-amber-100'
    };
    return `
        <div class="rounded-xl border p-2 space-y-1.5 ${tones[tone] || tones.blue}">
            <div class="text-[10px] font-semibold uppercase tracking-[0.12em] text-muted px-0.5">${title}</div>
            ${rows}
        </div>
    `;
}

export async function initAttendance() {
    if (!(await isAuthenticated('adviser'))) {
        navigate('/auth/adviser/login');
        return;
    }
    await initAdviserNavbar();

    let events = [];
    let selectedEvent = null;
    let selectedDate = null;
    let students = [];
    let attendanceRecords = [];
    let searchQuery = '';

    const eventSelect = document.getElementById('eventSelect');
    const refreshBtn = document.getElementById('refreshAttendanceBtn');
    const searchInput = document.getElementById('studentSearchInput');

    async function auditAttendanceAction(action, data, changedFields = []) {
        try {
            const adviserId = getUserId('adviser');
            const user = getUserData('adviser');
            const userName = user?.name || user?.username || 'Unknown';
            const actionUpper = (action || '').toUpperCase();

            if (actionUpper === 'DELETE') {
                await logAdviserChange({
                    user_id: adviserId,
                    user_type: 'adviser',
                    user_name: userName,
                    action: 'DELETE',
                    table_name: 'attendance',
                    record_id: data.id || data.student_id || 0,
                    field_name: data.field_name || 'attendance_record',
                    old_value: data.old_value || data.title || 'Attendance Record',
                    new_value: null
                }, 'adviser');
            } else if (actionUpper === 'CREATE') {
                await logAdviserChange({
                    user_id: adviserId,
                    user_type: 'adviser',
                    user_name: userName,
                    action: 'CREATE',
                    table_name: 'attendance',
                    record_id: data.id || data.student_id || 0,
                    field_name: data.field_name || 'attendance',
                    old_value: null,
                    new_value: data.new_value || data.title || 'Attendance'
                }, 'adviser');
            } else if (actionUpper === 'UPDATE') {
                for (const change of changedFields) {
                    await logAdviserChange({
                        user_id: adviserId,
                        user_type: 'adviser',
                        user_name: userName,
                        action: 'UPDATE',
                        table_name: 'attendance',
                        record_id: data.id || data.student_id || 0,
                        field_name: change.field_name,
                        old_value: change.old_value !== null && change.old_value !== undefined && change.old_value !== '' ? String(change.old_value) : 'None',
                        new_value: change.new_value !== null && change.new_value !== undefined && change.new_value !== '' ? String(change.new_value) : 'None'
                    }, 'adviser');
                }
            }
        } catch (error) {
            console.error('Audit log failed for attendance:', error);
        }
    }

    async function loadEvents() {
        try {
            showHeroSkeleton();
            if (eventSelect) {
                eventSelect.innerHTML = '<option value="">Loading events...</option>';
            }
            events = await AttendanceAPI.getAttendanceEvents();

            if (!events || events.length === 0) {
                if (eventSelect) {
                    eventSelect.innerHTML = '<option value="">No registered events found</option>';
                }
                showHeroSkeleton();
                renderEmpty('no_events');
                return;
            }

            if (eventSelect) {
                eventSelect.innerHTML = '<option value="">-- Choose an Event --</option>' +
                    events.map(ev => {
                        const eId = ev.event_id || ev.id;
                        const oId = ev.organization_id || '';
                        const title = ev.title || ev.event_title || 'Event';
                        const orgName = ev.organization_name || 'Organization';
                        return `<option value="${eId}_${oId}">${title} (${orgName})</option>`;
                    }).join('');

                if (events.length > 0) {
                    const first = events[0];
                    const firstVal = `${first.event_id || first.id}_${first.organization_id || ''}`;
                    eventSelect.value = firstVal;
                    await handleEventChange(firstVal);
                }
            }
        } catch (error) {
            console.error('Error loading events:', error);
            showToast('Failed to load events for attendance', 'error');
            renderEmpty('error');
        }
    }

    function parseEventSelectValue(rawValue) {
        if (!rawValue) return { eventId: null, organizationId: null };
        if (rawValue.includes('_')) {
            const [eventId, organizationId] = rawValue.split('_');
            return {
                eventId: eventId || null,
                organizationId: organizationId || null
            };
        }
        return { eventId: rawValue, organizationId: null };
    }

    async function handleEventChange(rawValue) {
        if (!rawValue) {
            selectedEvent = null;
            selectedDate = null;
            students = [];
            attendanceRecords = [];
            attendanceListReady = false;
            showHeroSkeleton();
            document.getElementById('scheduleDaysContainer')?.classList.add('hidden');
            renderEmpty('select_event');
            return;
        }

        const { eventId, organizationId } = parseEventSelectValue(rawValue);
        if (!eventId) {
            renderEmpty('select_event');
            return;
        }

        const listedEvent = events.find(ev =>
            String(ev.event_id || ev.id) === String(eventId) &&
            (!organizationId || String(ev.organization_id || '') === String(organizationId))
        ) || events.find(ev => String(ev.event_id || ev.id) === String(eventId));

        students = [];
        attendanceRecords = [];
        selectedDate = null;

        if (listedEvent) {
            selectedEvent = {
                ...listedEvent,
                id: listedEvent.event_id || listedEvent.id,
                organization_id: listedEvent.organization_id || organizationId || null,
                organization_name: listedEvent.organization_name || 'Organization',
                daily_schedules: listedEvent.daily_schedules || []
            };
            paintEventMeta(selectedEvent, { statsLoading: true });
        }

        setAttendanceLoading(true);

        try {
            const data = await AttendanceAPI.getAttendanceByEvent(
                eventId,
                null,
                organizationId || listedEvent?.organization_id || null
            );
            if (data && data.success) {
                selectedEvent = {
                    ...data.event,
                    id: data.event.id || data.event.event_id || eventId,
                    organization_id: data.event.organization_id || organizationId || listedEvent?.organization_id || null,
                    organization_name: data.event.organization_name || listedEvent?.organization_name || 'Organization'
                };
                students = data.students || [];
                attendanceRecords = data.attendance || [];

                const schedules = selectedEvent.daily_schedules || [];
                if (schedules.length > 0) {
                    const todayStr = getTodayLocalDate();
                    const hasToday = schedules.some(s => s.schedule_date === todayStr);
                    selectedDate = hasToday ? todayStr : schedules[0].schedule_date;
                } else {
                    selectedDate = null;
                }

                renderScheduleDays(schedules);
                renderSummaryCard();
                renderTable();
            } else {
                showToast(data?.message || 'Event not found', 'error');
                renderEmpty('not_found');
            }
        } catch (error) {
            console.error('Error fetching event attendance:', error);
            showToast('Failed to load attendance records', 'error');
            renderEmpty('error');
        } finally {
            setAttendanceLoading(false);
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

        container.classList.remove('hidden');
        const todayStr = getTodayLocalDate();

        list.innerHTML = schedules.map((sched, idx) => {
            const dateInfo = formatDateDisplay(sched.schedule_date);
            const isSelected = sched.schedule_date === selectedDate;
            const isDayToday = (sched.schedule_date === todayStr);

            const activeClasses = isSelected
                ? 'bg-navy text-white font-semibold shadow-sm border-navy'
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
            titleSpan.innerHTML = `Attendance — ${dateObj.formatted} <span class="text-muted font-normal">(${dateObj.dayName})</span> ${isToday
                ? '<span class="inline-flex items-center gap-0.5 text-[10px] px-1.5 py-0.5 rounded-md bg-emerald-50 text-emerald-800 border border-emerald-200 font-semibold ml-1 align-middle"><span class="w-1 h-1 rounded-full bg-emerald-500 animate-pulse"></span>Today</span>'
                : '<span class="inline-flex text-[10px] px-1.5 py-0.5 rounded-md bg-surface text-muted border border-line font-medium ml-1 align-middle">Live log off</span>'}`;
        }
    }

    function paintEventMeta(eventData, { statsLoading = false } = {}) {
        const card = document.getElementById('eventSummaryCard');
        const eventInfo = document.getElementById('eventInfoContent');
        if (!card || !eventData || !eventInfo) return;

        card.classList.remove('hidden');

        const start = eventData.event_day_start ? formatDateDisplay(eventData.event_day_start).formatted : '';
        const end = eventData.event_day_end ? formatDateDisplay(eventData.event_day_end).formatted : '';

        eventInfo.innerHTML = eventInfoMarkup({
            title: eventData.title || 'Event Title',
            organization: eventData.organization_name || 'Organization',
            category: eventData.event_category || 'Event',
            venue: eventData.venue || 'No venue specified',
            dateRange: (start && end) ? `${start} - ${end}` : (start || 'Flexible schedule')
        });

        if (statsLoading) {
            document.getElementById('attendanceStatsGrid')?.classList.add('att-stats-loading');
        }

        if (typeof lucide !== 'undefined') {
            lucide.createIcons();
        }
    }

    function renderSummaryCard() {
        const card = document.getElementById('eventSummaryCard');
        if (!card || !selectedEvent) return;

        paintEventMeta(selectedEvent);

        const dayRecords = attendanceRecords.filter(r => r.schedule_date === selectedDate);
        let completed = 0;
        let inProgress = 0;
        let absentExcused = 0;
        let pendingExcuses = 0;

        dayRecords.forEach(r => {
            const s = (r.status || '').toLowerCase();
            const es = (r.excuse_status || '').toLowerCase();

            if (es === 'pending' || s.includes('pending excuse')) {
                pendingExcuses++;
            }
            if (s === 'completed' || s.includes('completed')) {
                completed++;
            } else if (s === 'in progress') {
                inProgress++;
            } else if (s.includes('absent') || s.includes('excused')) {
                absentExcused++;
            }
        });

        const setStat = (id, value) => {
            const el = document.getElementById(id);
            if (el) el.textContent = value;
        };
        setStat('statTotalStudents', students.length);
        setStat('statCompleted', completed);
        setStat('statInProgress', inProgress);
        setStat('statAbsentExcused', absentExcused);
        setStat('statPendingExcuses', pendingExcuses);
        document.getElementById('attendanceStatsGrid')?.classList.remove('att-stats-loading');
    }

    function renderTable() {
        const tbody = document.getElementById('attendanceTableBody');
        const mobileList = document.getElementById('attendanceMobileList');
        if (!tbody && !mobileList) return;

        if (!selectedEvent) {
            renderEmpty('select_event');
            return;
        }

        const todayStr = getTodayLocalDate();
        const isToday = (selectedDate === todayStr);

        const noticeEl = document.getElementById('tableDayNotice');
        if (noticeEl) {
            if (!isToday) {
                noticeEl.innerHTML = `<span class="inline-flex items-center gap-1 text-amber-800 font-medium"><i data-lucide="alert-circle" class="w-3.5 h-3.5 inline"></i> Session logging is off — this date is not today.</span>`;
            } else {
                noticeEl.innerHTML = `Status becomes <span class="font-semibold text-success">Completed</span> when AM and PM are timed in &amp; out. <span class="inline-flex items-center gap-1 text-success font-semibold ml-1"><i data-lucide="check-circle" class="w-3.5 h-3.5"></i> Live today</span>`;
            }
        }

        const emptyBlock = (icon, title, subtitle) => `
            <div class="py-12 px-4 text-center">
                <span class="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-surface text-muted mb-3">
                    <i data-lucide="${icon}" class="w-6 h-6"></i>
                </span>
                <p class="text-sm font-medium text-ink">${title}</p>
                <p class="text-xs text-muted mt-1 max-w-sm mx-auto">${subtitle}</p>
            </div>
        `;

        if (students.length === 0) {
            if (tbody) {
                tbody.innerHTML = `<tr data-domino-enter class="reveal"><td colspan="8">${emptyBlock('users', 'No students registered', 'Register students to this event or add organization members first.')}</td></tr>`;
            }
            if (mobileList) {
                mobileList.innerHTML = `<article class="reveal rounded-2xl border border-line bg-white p-2" data-domino-enter>${emptyBlock('users', 'No students registered', 'Register students to this event or add organization members first.')}</article>`;
            }
            finishAttendanceRender();
            return;
        }

        const filteredStudents = students.filter(std => {
            if (!searchQuery) return true;
            const q = searchQuery.toLowerCase();
            const name = (std.student_name || `${std.first_name || ''} ${std.last_name || ''}`).toLowerCase();
            const num = (std.student_number || '').toLowerCase();
            const prog = (std.program || '').toLowerCase();
            return name.includes(q) || num.includes(q) || prog.includes(q);
        });

        if (filteredStudents.length === 0) {
            if (tbody) {
                tbody.innerHTML = `<tr data-domino-enter class="reveal"><td colspan="8">${emptyBlock('search-x', 'No matches', `No students matching "${searchQuery}"`)}</td></tr>`;
            }
            if (mobileList) {
                mobileList.innerHTML = `<article class="reveal rounded-2xl border border-line bg-white p-2" data-domino-enter>${emptyBlock('search-x', 'No matches', `No students matching "${searchQuery}"`)}</article>`;
            }
            finishAttendanceRender();
            return;
        }

        const attByStudent = {};
        attendanceRecords
            .filter(r => r.schedule_date === selectedDate)
            .forEach(r => {
                attByStudent[r.student_id] = r;
            });

        const disabledLiveLogTitle = !isToday
            ? `Live session logging is only enabled on the day of the event (${formatDateDisplay(selectedDate).formatted}). Use "Edit" to adjust past/future dates.`
            : 'Record Time';

        let rowsHtml = '';
        let cardsHtml = '';

        filteredStudents.forEach((student, index) => {
            const studentId = student.student_id;
            const studentName = student.student_name || `${student.first_name || ''} ${student.last_name || ''}`.trim();
            const safeName = studentName.replace(/"/g, '&quot;');
            const att = attByStudent[studentId] || null;

            const timeInAm = att?.time_in_am ? formatTime12(att.time_in_am) : null;
            const timeOutAm = att?.time_out_am ? formatTime12(att.time_out_am) : null;
            const breakOut = att?.break_out ? formatTime12(att.break_out) : null;
            const breakIn = att?.break_in ? formatTime12(att.break_in) : null;
            const timeInPm = att?.time_in_pm ? formatTime12(att.time_in_pm) : null;
            const timeOutPm = att?.time_out_pm ? formatTime12(att.time_out_pm) : null;

            const isExcused = att?.is_excused == 1;
            const excuseStatus = att?.excuse_status || null;
            const excuseSession = att?.excuse_session || null;
            const isPendingExcuse = excuseStatus === 'Pending' || att?.status === 'Pending Excuse';
            const status = att?.status || 'Pending';
            const durationFormatted = att?.duration_minutes ? formatDuration(att.duration_minutes) : '0 hrs';
            const isAbsent = att?.is_absent == 1;
            const absentSession = att?.absent_session || null;

            const isAmLocked = (isExcused && excuseSession === 'AM') || (isExcused && excuseSession === 'BOTH') || (isAbsent && absentSession === 'AM') || (isAbsent && absentSession === 'BOTH') || (status.toLowerCase().includes('absent') && !absentSession) || (status.toLowerCase().includes('excused') && !excuseSession);
            const isPmLocked = (isExcused && excuseSession === 'PM') || (isExcused && excuseSession === 'BOTH') || (isAbsent && absentSession === 'PM') || (isAbsent && absentSession === 'BOTH') || (status.toLowerCase().includes('absent') && !absentSession) || (status.toLowerCase().includes('excused') && !excuseSession);
            const isBreakLocked = isAmLocked || isPmLocked;

            const canTimeOutAm = timeInAm !== null;
            const canBreakOut = timeInAm !== null;
            const canBreakIn = breakOut !== null;
            const canTimeInPm = breakIn !== null;
            const canTimeOutPm = timeInPm !== null;

            const isEditLocked = (isExcused && excuseSession === 'BOTH') || (isAbsent && absentSession === 'BOTH') || (status.toLowerCase().includes('absent') && !absentSession) || (status.toLowerCase().includes('excused') && !excuseSession);
            const isActionLocked = isEditLocked;

            const logAttrs = (type) => `data-action="log" data-student-id="${studentId}" data-student-name="${safeName}" data-type="${type}"`;
            const actionAttrs = (action) => `data-action="${action}" data-student-id="${studentId}" data-student-name="${safeName}"`;

            const amRows = `
                ${sessionChip({ label: 'In', value: timeInAm, actionAttrs: logAttrs('time_in_am'), disabled: !isToday || isAmLocked, disabledTitle: !isToday ? disabledLiveLogTitle : 'AM session is locked (excused/absent). Use Edit to modify.' })}
                ${sessionChip({ label: 'Out', value: timeOutAm, actionAttrs: logAttrs('time_out_am'), disabled: !isToday || isAmLocked || !canTimeOutAm, disabledTitle: !isToday ? disabledLiveLogTitle : !canTimeOutAm ? 'Time In AM must be recorded first' : 'AM session is locked (excused/absent). Use Edit to modify.' })}
            `;
            const breakRows = `
                ${sessionChip({ label: 'Out', value: breakOut, actionAttrs: logAttrs('break_out'), tone: 'amber', disabled: !isToday || isBreakLocked || !canBreakOut, disabledTitle: !isToday ? disabledLiveLogTitle : !canBreakOut ? 'Time In AM must be recorded first' : 'Break session is locked (excused/absent). Use Edit to modify.' })}
                ${sessionChip({ label: 'In', value: breakIn, actionAttrs: logAttrs('break_in'), tone: 'amber', disabled: !isToday || isBreakLocked || !canBreakIn, disabledTitle: !isToday ? disabledLiveLogTitle : !canBreakIn ? 'Break Out must be recorded first' : 'Break session is locked (excused/absent). Use Edit to modify.' })}
            `;
            const pmRows = `
                ${sessionChip({ label: 'In', value: timeInPm, actionAttrs: logAttrs('time_in_pm'), disabled: !isToday || isPmLocked || !canTimeInPm, disabledTitle: !isToday ? disabledLiveLogTitle : !canTimeInPm ? 'Break In must be recorded first' : 'PM session is locked (excused/absent). Use Edit to modify.' })}
                ${sessionChip({ label: 'Out', value: timeOutPm, actionAttrs: logAttrs('time_out_pm'), disabled: !isToday || isPmLocked || !canTimeOutPm, disabledTitle: !isToday ? disabledLiveLogTitle : !canTimeOutPm ? 'Time In PM must be recorded first' : 'PM session is locked (excused/absent). Use Edit to modify.' })}
            `;

            const actionsHtml = `
                <div class="evt-mark-group inline-flex w-full max-w-[15.5rem] items-stretch rounded-lg border border-line bg-white overflow-hidden shadow-sm" role="group" aria-label="Attendance actions">
                    ${isPendingExcuse ? `
                        <button type="button" ${actionAttrs('review-excuse')} ${!isToday ? 'disabled title="Actions are only available on the current day"' : 'title="Review Student\'s Excuse Request"'}
                            class="flex-1 min-w-0 px-1.5 py-1.5 text-[10px] font-semibold text-amber-900 hover:bg-amber-50 disabled:opacity-40 disabled:cursor-not-allowed transition inline-flex items-center justify-center gap-0.5">
                            <i data-lucide="alert-circle" class="w-3 h-3 shrink-0"></i><span class="truncate">Review</span>
                        </button>
                    ` : ''}
                    <button type="button" ${actionAttrs('edit-session')} ${!isToday ? 'disabled title="Actions are only available on the current day"' : (isEditLocked ? 'disabled title="Cannot edit full-day excused/absent students. Reset status first."' : 'title="Edit session times"')}
                        class="flex-1 min-w-0 px-1.5 py-1.5 text-[10px] font-semibold text-blue-600 hover:bg-blue-50 disabled:opacity-40 disabled:cursor-not-allowed transition inline-flex items-center justify-center gap-0.5 ${isPendingExcuse ? 'border-l border-line' : ''}">
                        <i data-lucide="edit-3" class="w-3 h-3 shrink-0"></i><span class="truncate">Edit</span>
                    </button>
                    <button type="button" ${actionAttrs('absent-modal')} ${!isToday || isActionLocked ? 'disabled title="Unavailable"' : 'title="Mark Absent"'}
                        class="flex-1 min-w-0 px-1.5 py-1.5 text-[10px] font-semibold text-red-700 hover:bg-red-50 disabled:opacity-40 disabled:cursor-not-allowed transition inline-flex items-center justify-center gap-0.5 border-l border-line">
                        <i data-lucide="user-x" class="w-3 h-3 shrink-0"></i><span class="truncate">Absent</span>
                    </button>
                    <button type="button" ${actionAttrs('excuse-modal')} ${!isToday || isActionLocked ? 'disabled title="Unavailable"' : 'title="Mark Excused"'}
                        class="flex-1 min-w-0 px-1.5 py-1.5 text-[10px] font-semibold text-violet-700 hover:bg-violet-50 disabled:opacity-40 disabled:cursor-not-allowed transition inline-flex items-center justify-center gap-0.5 border-l border-line">
                        <i data-lucide="file-text" class="w-3 h-3 shrink-0"></i><span class="truncate">Excuse</span>
                    </button>
                    ${att ? `
                        <button type="button" ${actionAttrs('reset')} ${!isToday ? 'disabled title="Actions are only available on the current day"' : 'title="Reset attendance"'}
                            class="flex-none px-2 py-1.5 text-muted hover:text-red-700 hover:bg-red-50 disabled:opacity-40 disabled:cursor-not-allowed transition border-l border-line inline-flex items-center justify-center">
                            <i data-lucide="rotate-ccw" class="w-3.5 h-3.5"></i>
                        </button>
                    ` : ''}
                </div>
            `;

            rowsHtml += `
                <tr class="reveal hover:bg-surface/80 transition-colors" data-domino-enter>
                    <td class="px-4 py-3.5 text-center text-xs text-muted font-medium tabular-nums">${index + 1}</td>
                    <td class="px-4 py-3.5 align-middle">
                        <div class="font-semibold text-ink">${studentName}</div>
                        <div class="text-xs text-muted flex items-center gap-1.5 mt-0.5">
                            <span class="font-mono bg-surface text-body px-1.5 py-0.5 rounded text-[11px] border border-line">${student.student_number || 'No ID'}</span>
                            <span>·</span>
                            <span class="truncate max-w-[140px]">${student.program || 'Student'} ${student.year_level ? `(${student.year_level})` : ''}</span>
                        </div>
                    </td>
                    <td class="px-3 py-2.5 align-middle">${sessionBlock({ title: 'AM', tone: 'blue', rows: amRows })}</td>
                    <td class="px-3 py-2.5 align-middle">${sessionBlock({ title: 'Break', tone: 'amber', rows: breakRows })}</td>
                    <td class="px-3 py-2.5 align-middle">${sessionBlock({ title: 'PM', tone: 'blue', rows: pmRows })}</td>
                    <td class="px-4 py-3.5 align-middle text-center">
                        <div class="text-xs font-semibold text-ink tabular-nums">${durationFormatted}</div>
                    </td>
                    <td class="px-4 py-3.5 align-middle text-center">
                        ${getStatusBadge(status, att?.excuse_reason, excuseStatus)}
                        ${isExcused && att?.excuse_reason ? `<div class="text-[11px] text-violet-700 mt-0.5 max-w-[130px] truncate mx-auto" title="${att.excuse_reason}">"${att.excuse_reason}"</div>` : ''}
                    </td>
                    <td class="px-4 py-3.5 align-middle text-center">
                        <div class="flex items-center justify-center">${actionsHtml}</div>
                    </td>
                </tr>
            `;

            const initial = (studentName || '?').charAt(0).toUpperCase();
            cardsHtml += `
                <article class="att-mobile-card reveal rounded-2xl border border-line bg-white shadow-sm overflow-hidden" data-domino-enter>
                    <div class="p-4">
                        <div class="flex items-start gap-3">
                            <div class="w-11 h-11 rounded-xl bg-navy text-white flex items-center justify-center text-sm font-semibold shrink-0 shadow-sm">${initial}</div>
                            <div class="min-w-0 flex-1">
                                <div class="flex items-start justify-between gap-2">
                                    <div class="min-w-0">
                                        <h3 class="text-sm font-semibold text-ink truncate">${studentName}</h3>
                                        <p class="text-xs text-muted mt-0.5 truncate">${student.student_number || 'No ID'} · ${student.program || 'Student'}${student.year_level ? ` Y${student.year_level}` : ''}</p>
                                    </div>
                                    <div class="shrink-0 text-right">
                                        ${getStatusBadge(status, att?.excuse_reason, excuseStatus)}
                                        <div class="text-[11px] font-semibold text-ink tabular-nums mt-1">${durationFormatted}</div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div class="mt-3.5 grid grid-cols-3 gap-2">
                            ${sessionBlock({ title: 'AM', tone: 'blue', rows: amRows })}
                            ${sessionBlock({ title: 'Break', tone: 'amber', rows: breakRows })}
                            ${sessionBlock({ title: 'PM', tone: 'blue', rows: pmRows })}
                        </div>
                    </div>
                    <div class="px-4 py-3 border-t border-line bg-surface/60">
                        ${actionsHtml}
                    </div>
                </article>
            `;
        });

        if (tbody) tbody.innerHTML = rowsHtml;
        if (mobileList) mobileList.innerHTML = cardsHtml;
        finishAttendanceRender();
    }

    function renderEmpty(type) {
        const tbody = document.getElementById('attendanceTableBody');
        const mobileList = document.getElementById('attendanceMobileList');

        let icon = 'calendar';
        let title = 'No data';
        let subtitle = '';

        if (type === 'no_events') {
            icon = 'calendar-x';
            title = 'No Events Registered';
            subtitle = 'Your organization has no registered events for attendance tracking yet.';
        } else if (type === 'select_event') {
            icon = 'clipboard-check';
            title = 'Select an Event';
            subtitle = 'Choose a registered event from the dropdown above to view student attendance.';
        } else if (type === 'error') {
            icon = 'alert-triangle';
            title = 'Error Loading Attendance';
            subtitle = 'Something went wrong while loading attendance. Try refreshing.';
        } else if (type === 'not_found') {
            icon = 'info';
            title = 'Event Not Found';
            subtitle = 'The selected event could not be loaded.';
        } else {
            icon = 'info';
            title = 'No Attendance Records';
            subtitle = 'No attendance data found.';
        }

        const block = `
            <div class="py-14 px-4 text-center">
                <span class="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-surface text-muted mb-3">
                    <i data-lucide="${icon}" class="w-6 h-6"></i>
                </span>
                <p class="text-sm font-medium text-ink">${title}</p>
                <p class="text-xs text-muted mt-1 max-w-sm mx-auto">${subtitle}</p>
            </div>
        `;

        if (tbody) {
            tbody.innerHTML = `<tr data-domino-enter class="reveal"><td colspan="8">${block}</td></tr>`;
        }
        if (mobileList) {
            mobileList.innerHTML = `<article class="reveal rounded-2xl border border-line bg-white" data-domino-enter>${block}</article>`;
        }
        finishAttendanceRender();
    }

    function handleAttendanceActionClick(e) {
        const btn = e.target.closest('button');
        if (!btn) return;

        const action = btn.getAttribute('data-action');
        const studentId = btn.getAttribute('data-student-id');
        const studentName = btn.getAttribute('data-student-name') || 'Student';

        if (action === 'log') {
            openLogTimeModal(studentId, studentName, btn.getAttribute('data-type'));
        } else if (action === 'absent-modal') {
            openAbsentModal(studentId, studentName);
        } else if (action === 'excuse-modal') {
            openExcuseModal(studentId, studentName);
        } else if (action === 'edit-session') {
            openEditSessionModal(studentId, studentName);
        } else if (action === 'review-excuse') {
            openReviewExcuseModal(studentId, studentName);
        } else if (action === 'reset') {
            confirmResetStudent(studentId, studentName);
        }
    }

    function openLogTimeModal(studentId, studentName, logType) {
        if (!selectedEvent || !selectedDate) return;

        const todayStr = getTodayLocalDate();
        if (selectedDate !== todayStr) {
            showToast('Live session time-in logging is only enabled on the day of the event. Use Edit to update other dates.', 'warning');
            return;
        }

        const typeLabels = {
            'time_in_am': 'Time In (AM)',
            'time_out_am': 'Time Out (AM)',
            'break_out': 'Break Out',
            'break_in': 'Break In',
            'time_in_pm': 'Time In (PM)',
            'time_out_pm': 'Time Out (PM)'
        };

        const label = typeLabels[logType] || logType;
        const now = new Date();
        const currentHours = String(now.getHours()).padStart(2, '0');
        const currentMinutes = String(now.getMinutes()).padStart(2, '0');
        const currentTimeStr = `${currentHours}:${currentMinutes}`;

        const content = `
            <div class="manage-modal-form space-y-4">
                ${modalSection('Session Context', `
                    <div class="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                        ${modalDetailTile('Student', studentName)}
                        ${modalDetailTile('Date', formatDateDisplay(selectedDate).formatted)}
                        ${modalDetailTile('Action', label)}
                    </div>
                `)}
                ${modalSection('Time Entry', `
                    <div>
                        <label for="modalTimeInput" class="${LABEL_CLASS}">Time to Record</label>
                        <input type="time" id="modalTimeInput" value="${currentTimeStr}" class="${FIELD_CLASS}">
                        <p class="text-xs text-muted mt-1.5">Defaults to your system time. Adjust only if needed.</p>
                    </div>
                `)}
                ${attendanceModalActions({ confirmText: 'Save Time', confirmId: 'confirmLogTimeBtn' })}
            </div>
        `;

        openModal(`Record ${label}`, content, 'small');
        applyModalDomino();

        const confirmBtn = document.getElementById('confirmLogTimeBtn');
        if (confirmBtn) {
            confirmBtn.addEventListener('click', async () => {
                const timeVal = document.getElementById('modalTimeInput').value;
                setModalButtonLoading('confirmLogTimeBtn', true, 'Save Time');
                try {
                    const att = attendanceRecords.find(r => r.student_id == studentId && r.schedule_date === selectedDate);
                    const oldTime = att ? att[logType] : null;
                    const newTime = timeVal ? `${timeVal}:00` : null;

                    await AttendanceAPI.logAttendanceTime({
                        student_id: studentId,
                        event_id: selectedEvent.id,
                        organization_id: selectedEvent.organization_id,
                        schedule_date: selectedDate,
                        log_type: logType,
                        time_value: newTime
                    });

                    await auditAttendanceAction('UPDATE', {
                        id: att?.id || studentId,
                        student_id: studentId
                    }, [
                        {
                            field_name: logType,
                            old_value: oldTime || 'None',
                            new_value: newTime || 'None'
                        }
                    ]);

                    showToast(`${label} recorded for ${studentName}!`, 'success');
                    closeModal();
                    await refreshCurrentEvent();
                } catch (err) {
                    console.error('Error logging time:', err);
                    showToast(err.message || 'Failed to record time', 'error');
                    setModalButtonLoading('confirmLogTimeBtn', false, 'Save Time');
                }
            });
        }
    }

    function openAbsentModal(studentId, studentName) {
        if (!selectedEvent || !selectedDate) return;

        const att = attendanceRecords.find(r => r.student_id == studentId && r.schedule_date === selectedDate);
        const isExcused = att?.is_excused == 1;
        const excuseSession = att?.excuse_session || null;
        const isAbsent = att?.is_absent == 1;
        const absentSession = att?.absent_session || null;

        const amAvailable = !(isExcused && (excuseSession === 'AM' || excuseSession === 'BOTH')) && !(isAbsent && (absentSession === 'AM' || absentSession === 'BOTH'));
        const pmAvailable = !(isExcused && (excuseSession === 'PM' || excuseSession === 'BOTH')) && !(isAbsent && (absentSession === 'PM' || absentSession === 'BOTH'));
        const bothAvailable = amAvailable && pmAvailable;

        let sessionOptions = '';
        if (bothAvailable) {
            sessionOptions += sessionChoiceCard({
                name: 'absentSession',
                value: 'BOTH',
                label: 'Whole Day',
                hint: 'Mark both AM and PM as absent',
                checked: true,
                tone: 'red'
            });
        }
        if (amAvailable) {
            sessionOptions += sessionChoiceCard({
                name: 'absentSession',
                value: 'AM',
                label: 'AM Session Only',
                hint: 'Morning session only',
                checked: !bothAvailable,
                tone: 'red'
            });
        }
        if (pmAvailable) {
            sessionOptions += sessionChoiceCard({
                name: 'absentSession',
                value: 'PM',
                label: 'PM Session Only',
                hint: 'Afternoon session only',
                checked: !bothAvailable && !amAvailable,
                tone: 'red'
            });
        }

        const content = `
            <div class="manage-modal-form space-y-4">
                ${modalSection('Student Context', `
                    <div class="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                        ${modalDetailTile('Student', studentName)}
                        ${modalDetailTile('Date', formatDateDisplay(selectedDate).formatted)}
                    </div>
                `)}
                ${!amAvailable || !pmAvailable ? `
                    ${modalSection('Availability Notice', `
                        <div class="rounded-xl border border-amber-200 bg-amber-50 px-3.5 py-3 text-xs text-amber-900 flex items-start gap-2">
                            <i data-lucide="alert-circle" class="w-4 h-4 text-amber-600 shrink-0 mt-0.5"></i>
                            <span>
                                ${!amAvailable && !pmAvailable ? 'Both sessions are already excused/absent. Reset status first.' :
                                  !amAvailable ? 'AM session is already excused/absent. Only PM is available.' :
                                  'PM session is already excused/absent. Only AM is available.'}
                            </span>
                        </div>
                    `)}
                ` : ''}
                ${modalSection('Absent Session', `
                    <div class="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                        ${sessionOptions || '<p class="text-sm text-muted col-span-full">No sessions available.</p>'}
                    </div>
                `)}
                ${attendanceModalActions({ confirmText: 'Confirm Absent', confirmId: 'confirmAbsentBtn', danger: true })}
            </div>
        `;

        openModal('Mark Student Absent', content, 'small');
        applyModalDomino();

        const confirmBtn = document.getElementById('confirmAbsentBtn');
        if (confirmBtn) {
            confirmBtn.addEventListener('click', async () => {
                const selectedRadio = document.querySelector('input[name="absentSession"]:checked');
                const sessionVal = selectedRadio ? selectedRadio.value : 'BOTH';

                setModalButtonLoading('confirmAbsentBtn', true, 'Confirm Absent');
                try {
                    const att = attendanceRecords.find(r => r.student_id == studentId && r.schedule_date === selectedDate);
                    const prevStatus = att?.is_absent == 1 ? `Absent (${att.absent_session || 'BOTH'})` : (att?.status || 'Present');

                    await AttendanceAPI.markAttendanceAbsent({
                        student_id: studentId,
                        event_id: selectedEvent.id,
                        organization_id: selectedEvent.organization_id,
                        schedule_date: selectedDate,
                        session: sessionVal
                    });

                    await auditAttendanceAction('UPDATE', {
                        id: att?.id || studentId,
                        student_id: studentId
                    }, [
                        {
                            field_name: 'absent_status',
                            old_value: prevStatus,
                            new_value: `Absent (${sessionVal})`
                        }
                    ]);

                    showToast(`${studentName} marked as Absent (${sessionVal})`, 'success');
                    closeModal();
                    await refreshCurrentEvent();
                } catch (err) {
                    console.error('Error marking absent:', err);
                    showToast(err.message || 'Failed to mark absent', 'error');
                    setModalButtonLoading('confirmAbsentBtn', false, 'Confirm Absent');
                }
            });
        }
    }

    function openExcuseModal(studentId, studentName) {
        if (!selectedEvent || !selectedDate) return;

        const att = attendanceRecords.find(r => r.student_id == studentId && r.schedule_date === selectedDate);
        const isExcused = att?.is_excused == 1;
        const excuseSession = att?.excuse_session || null;
        const isAbsent = att?.is_absent == 1;
        const absentSession = att?.absent_session || null;

        const amAvailable = !(isExcused && (excuseSession === 'AM' || excuseSession === 'BOTH')) && !(isAbsent && (absentSession === 'AM' || absentSession === 'BOTH'));
        const pmAvailable = !(isExcused && (excuseSession === 'PM' || excuseSession === 'BOTH')) && !(isAbsent && (absentSession === 'PM' || absentSession === 'BOTH'));
        const bothAvailable = amAvailable && pmAvailable;

        let sessionOptions = '';
        if (bothAvailable) {
            sessionOptions += sessionChoiceCard({
                name: 'excuseSession',
                value: 'BOTH',
                label: 'Whole Day',
                hint: 'Excuse AM and PM',
                checked: true,
                tone: 'purple'
            });
        }
        if (amAvailable) {
            sessionOptions += sessionChoiceCard({
                name: 'excuseSession',
                value: 'AM',
                label: 'AM Only',
                hint: 'Morning session',
                checked: !bothAvailable,
                tone: 'purple'
            });
        }
        if (pmAvailable) {
            sessionOptions += sessionChoiceCard({
                name: 'excuseSession',
                value: 'PM',
                label: 'PM Only',
                hint: 'Afternoon session',
                checked: !bothAvailable && !amAvailable,
                tone: 'purple'
            });
        }

        const content = `
            <div class="manage-modal-form space-y-4">
                ${modalSection('Student Context', `
                    <div class="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                        ${modalDetailTile('Student', studentName)}
                        ${modalDetailTile('Date', formatDateDisplay(selectedDate).formatted)}
                    </div>
                `)}
                ${!amAvailable || !pmAvailable ? `
                    ${modalSection('Availability Notice', `
                        <div class="rounded-xl border border-amber-200 bg-amber-50 px-3.5 py-3 text-xs text-amber-900 flex items-start gap-2">
                            <i data-lucide="alert-circle" class="w-4 h-4 text-amber-600 shrink-0 mt-0.5"></i>
                            <span>
                                ${!amAvailable && !pmAvailable ? 'Both sessions are already excused/absent. Reset status first.' :
                                  !amAvailable ? 'AM session is already excused/absent. Only PM is available.' :
                                  'PM session is already excused/absent. Only AM is available.'}
                            </span>
                        </div>
                    `)}
                ` : ''}
                ${modalSection('Excuse Details', `
                    <div class="space-y-3">
                        <div>
                            <p class="${LABEL_CLASS}">Excuse Session</p>
                            <div class="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                                ${sessionOptions || '<p class="text-sm text-muted col-span-full">No sessions available.</p>'}
                            </div>
                        </div>
                        <div>
                            <label for="excuseReasonInput" class="${LABEL_CLASS}">Reason for Excuse <span class="text-red-500">*</span></label>
                            <textarea id="excuseReasonInput" rows="3" placeholder="Medical, academic competition, emergency..." class="${FIELD_CLASS} resize-none"></textarea>
                            <p id="excuseError" class="text-xs text-danger mt-1.5 hidden">Reason is required</p>
                        </div>
                    </div>
                `)}
                ${attendanceModalActions({
                    confirmText: 'Submit Excuse',
                    confirmId: 'confirmExcuseBtn',
                    confirmClass: 'bg-purple-700 hover:bg-purple-800'
                })}
            </div>
        `;

        openModal('Submit Excuse Reason', content, 'small');
        applyModalDomino();

        const confirmBtn = document.getElementById('confirmExcuseBtn');
        if (confirmBtn) {
            confirmBtn.addEventListener('click', async () => {
                const reasonInput = document.getElementById('excuseReasonInput');
                const reasonVal = reasonInput?.value.trim();
                const errElem = document.getElementById('excuseError');

                if (!reasonVal) {
                    if (errElem) errElem.classList.remove('hidden');
                    reasonInput?.classList.add('border-red-500');
                    return;
                }

                const selectedRadio = document.querySelector('input[name="excuseSession"]:checked');
                const sessionVal = selectedRadio ? selectedRadio.value : 'BOTH';

                setModalButtonLoading('confirmExcuseBtn', true, 'Submit Excuse');
                try {
                    const att = attendanceRecords.find(r => r.student_id == studentId && r.schedule_date === selectedDate);
                    const prevStatus = att?.status || 'Pending';

                    await AttendanceAPI.markAttendanceExcused({
                        student_id: studentId,
                        event_id: selectedEvent.id,
                        organization_id: selectedEvent.organization_id,
                        schedule_date: selectedDate,
                        reason: reasonVal,
                        session: sessionVal
                    });

                    await auditAttendanceAction('UPDATE', {
                        id: att?.id || studentId,
                        student_id: studentId
                    }, [
                        {
                            field_name: 'excuse_status',
                            old_value: prevStatus,
                            new_value: `Excused (${sessionVal}): ${reasonVal}`
                        }
                    ]);

                    showToast(`Excuse recorded for ${studentName}`, 'success');
                    closeModal();
                    await refreshCurrentEvent();
                } catch (err) {
                    console.error('Error submitting excuse:', err);
                    showToast(err.message || 'Failed to submit excuse', 'error');
                    setModalButtonLoading('confirmExcuseBtn', false, 'Submit Excuse');
                }
            });
        }
    }

    function openReviewExcuseModal(studentId, studentName) {
        if (!selectedEvent || !selectedDate) return;

        const att = attendanceRecords.find(r => r.student_id == studentId && r.schedule_date === selectedDate);
        const reason = att?.excuse_reason || 'No specific reason given';
        const session = att?.excuse_session || 'BOTH';

        const content = `
            <div class="manage-modal-form space-y-4">
                ${modalSection('Request Summary', `
                    <div class="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                        ${modalDetailTile('Student', studentName)}
                        ${modalDetailTile('Event', selectedEvent.title)}
                        ${modalDetailTile('Date', formatDateDisplay(selectedDate).formatted)}
                        ${modalDetailTile('Requested Session', session)}
                    </div>
                `)}
                ${modalSection('Excuse Reason', `
                    <div class="rounded-xl border border-line bg-surface px-3.5 py-3 text-sm text-ink italic leading-relaxed">
                        "${reason}"
                    </div>
                    <div class="mt-3 rounded-xl border border-blue-100 bg-blue-50 px-3.5 py-3 text-xs text-blue-600 flex items-start gap-2">
                        <i data-lucide="info" class="w-4 h-4 shrink-0 mt-0.5"></i>
                        <span>Approving marks the student as <strong>Excused</strong>. Rejecting keeps normal attendance active.</span>
                    </div>
                `)}
                ${attendanceModalActions({
                    cancelText: 'Cancel',
                    confirmText: '<i data-lucide="check" class="w-4 h-4"></i> Approve Excuse',
                    confirmId: 'approveExcuseBtn',
                    confirmClass: 'bg-emerald-600 hover:bg-emerald-700',
                    extraButtons: `
                        <button type="button" id="rejectExcuseBtn" class="w-full sm:w-auto px-4 py-2.5 text-sm font-medium text-danger bg-red-50 hover:bg-red-100 border border-red-200 rounded-xl transition inline-flex items-center justify-center gap-1.5">
                            <i data-lucide="x" class="w-4 h-4"></i>
                            Reject Excuse
                        </button>
                    `
                })}
            </div>
        `;

        openModal('Review Student Excuse Request', content, 'medium');
        applyModalDomino();

        const approveBtn = document.getElementById('approveExcuseBtn');
        const rejectBtn = document.getElementById('rejectExcuseBtn');

        if (approveBtn) {
            approveBtn.addEventListener('click', async () => {
                setModalButtonLoading('approveExcuseBtn', true, 'Approve');
                try {
                    const att = attendanceRecords.find(r => r.student_id == studentId && r.schedule_date === selectedDate);

                    await AttendanceAPI.handleExcuseApproval({
                        student_id: studentId,
                        event_id: selectedEvent.id,
                        schedule_date: selectedDate,
                        action: 'approve'
                    });

                    await auditAttendanceAction('UPDATE', {
                        id: att?.id || studentId,
                        student_id: studentId
                    }, [
                        {
                            field_name: 'excuse_approval',
                            old_value: 'Pending Excuse',
                            new_value: 'Approved (Excused)'
                        }
                    ]);

                    showToast(`Excuse request approved for ${studentName}`, 'success');
                    closeModal();
                    await refreshCurrentEvent();
                } catch (err) {
                    console.error('Error approving excuse:', err);
                    showToast(err.message || 'Failed to approve excuse', 'error');
                    setModalButtonLoading('approveExcuseBtn', false, 'Approve Excuse');
                }
            });
        }

        if (rejectBtn) {
            rejectBtn.addEventListener('click', async () => {
                setModalButtonLoading('rejectExcuseBtn', true, 'Reject');
                try {
                    const att = attendanceRecords.find(r => r.student_id == studentId && r.schedule_date === selectedDate);

                    await AttendanceAPI.handleExcuseApproval({
                        student_id: studentId,
                        event_id: selectedEvent.id,
                        schedule_date: selectedDate,
                        action: 'reject'
                    });

                    await auditAttendanceAction('UPDATE', {
                        id: att?.id || studentId,
                        student_id: studentId
                    }, [
                        {
                            field_name: 'excuse_approval',
                            old_value: 'Pending Excuse',
                            new_value: 'Rejected'
                        }
                    ]);

                    showToast(`Excuse request rejected for ${studentName}`, 'info');
                    closeModal();
                    await refreshCurrentEvent();
                } catch (err) {
                    console.error('Error rejecting excuse:', err);
                    showToast(err.message || 'Failed to reject excuse', 'error');
                    setModalButtonLoading('rejectExcuseBtn', false, 'Reject Excuse');
                }
            });
        }
    }

    function openEditSessionModal(studentId, studentName) {
        if (!selectedEvent || !selectedDate) return;

        const att = attendanceRecords.find(r => r.student_id == studentId && r.schedule_date === selectedDate);

        const toInputTime = (val) => {
            if (!val) return '';
            const parts = val.split(':');
            if (parts.length >= 2) return `${parts[0].padStart(2, '0')}:${parts[1].padStart(2, '0')}`;
            return val;
        };

        const timeInAm = toInputTime(att?.time_in_am);
        const timeOutAm = toInputTime(att?.time_out_am);
        const breakOut = toInputTime(att?.break_out);
        const breakIn = toInputTime(att?.break_in);
        const timeInPm = toInputTime(att?.time_in_pm);
        const timeOutPm = toInputTime(att?.time_out_pm);

        const isExcused = att?.is_excused == 1;
        const excuseSession = att?.excuse_session || null;
        const isAbsent = att?.is_absent == 1;
        const absentSession = att?.absent_session || 'BOTH';

        const amLocked = (isExcused && (excuseSession === 'AM' || excuseSession === 'BOTH')) || (isAbsent && (absentSession === 'AM' || absentSession === 'BOTH'));
        const pmLocked = (isExcused && (excuseSession === 'PM' || excuseSession === 'BOTH')) || (isAbsent && (absentSession === 'PM' || absentSession === 'BOTH'));
        const breakLocked = amLocked || pmLocked;

        const amAvailableForAbsent = !(isExcused && (excuseSession === 'AM' || excuseSession === 'BOTH')) && !(isAbsent && (absentSession === 'AM' || absentSession === 'BOTH'));
        const pmAvailableForAbsent = !(isExcused && (excuseSession === 'PM' || excuseSession === 'BOTH')) && !(isAbsent && (absentSession === 'PM' || absentSession === 'BOTH'));
        const bothAvailableForAbsent = amAvailableForAbsent && pmAvailableForAbsent;

        const content = `
            <div class="manage-modal-form space-y-4">
                ${modalSection('Student Context', `
                    <div class="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
                        <div class="grid grid-cols-1 sm:grid-cols-2 gap-2.5 flex-1 min-w-0">
                            ${modalDetailTile('Student', studentName)}
                            ${modalDetailTile('Date', formatDateDisplay(selectedDate).formatted)}
                        </div>
                        <button type="button" id="clearAllTimesBtn" class="w-full sm:w-auto shrink-0 px-3 py-2.5 text-xs font-semibold text-danger bg-red-50 hover:bg-red-100 border border-red-200 rounded-xl transition inline-flex items-center justify-center gap-1.5">
                            <i data-lucide="trash-2" class="w-3.5 h-3.5"></i>
                            Clear All Times
                        </button>
                    </div>
                    <div class="mt-3 rounded-xl border border-amber-200 bg-amber-50 px-3.5 py-3 text-xs text-amber-900 flex items-start gap-2">
                        <i data-lucide="${amLocked || pmLocked ? 'info' : 'shield-alert'}" class="w-4 h-4 text-amber-600 shrink-0 mt-0.5"></i>
                        <span>
                            ${amLocked && pmLocked
                                ? 'Both AM and PM sessions are locked due to excused/absent status. Reset status to edit times.'
                                : amLocked
                                    ? 'AM session is locked due to excused/absent status. Only PM session can be edited.'
                                    : pmLocked
                                        ? 'PM session is locked due to excused/absent status. Only AM session can be edited.'
                                        : '<strong>Adviser Override:</strong> Adjust or clear recorded hours if a student logged time while not present.'}
                        </span>
                    </div>
                `)}
                ${!amLocked ? `
                    ${modalSection('AM Session', `
                        <div class="flex items-center justify-between gap-2 mb-3">
                            <p class="text-xs text-muted">Morning time in / out</p>
                            <button type="button" id="clearAmBtn" class="text-xs font-medium text-muted hover:text-danger transition">Clear AM</button>
                        </div>
                        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div>
                                <label for="editTimeInAm" class="${LABEL_CLASS}">Time In (AM)</label>
                                <input type="time" id="editTimeInAm" value="${timeInAm}" class="${FIELD_CLASS}">
                            </div>
                            <div>
                                <label for="editTimeOutAm" class="${LABEL_CLASS}">Time Out (AM)</label>
                                <input type="time" id="editTimeOutAm" value="${timeOutAm}" class="${FIELD_CLASS}">
                            </div>
                        </div>
                    `)}
                ` : ''}
                ${!breakLocked ? `
                    ${modalSection('Break Session', `
                        <div class="flex items-center justify-between gap-2 mb-3">
                            <p class="text-xs text-muted">Break out / in</p>
                            <button type="button" id="clearBreakBtn" class="text-xs font-medium text-muted hover:text-danger transition">Clear Break</button>
                        </div>
                        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div>
                                <label for="editBreakOut" class="${LABEL_CLASS}">Break Out</label>
                                <input type="time" id="editBreakOut" value="${breakOut}" class="${FIELD_CLASS}">
                            </div>
                            <div>
                                <label for="editBreakIn" class="${LABEL_CLASS}">Break In</label>
                                <input type="time" id="editBreakIn" value="${breakIn}" class="${FIELD_CLASS}">
                            </div>
                        </div>
                    `)}
                ` : ''}
                ${!pmLocked ? `
                    ${modalSection('PM Session', `
                        <div class="flex items-center justify-between gap-2 mb-3">
                            <p class="text-xs text-muted">Afternoon time in / out</p>
                            <button type="button" id="clearPmBtn" class="text-xs font-medium text-muted hover:text-danger transition">Clear PM</button>
                        </div>
                        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div>
                                <label for="editTimeInPm" class="${LABEL_CLASS}">Time In (PM)</label>
                                <input type="time" id="editTimeInPm" value="${timeInPm}" class="${FIELD_CLASS}">
                            </div>
                            <div>
                                <label for="editTimeOutPm" class="${LABEL_CLASS}">Time Out (PM)</label>
                                <input type="time" id="editTimeOutPm" value="${timeOutPm}" class="${FIELD_CLASS}">
                            </div>
                        </div>
                    `)}
                ` : ''}
                ${modalSection('Absence Override', `
                    <label class="flex items-center gap-2.5 cursor-pointer rounded-xl border border-line bg-surface px-3.5 py-3">
                        <input type="checkbox" id="editIsAbsent" ${isAbsent ? 'checked' : ''} class="w-4 h-4 text-danger rounded border-gray-300 focus:ring-danger">
                        <span class="text-sm font-semibold text-ink">Mark as Absent</span>
                    </label>
                    <div id="absentOptionsContainer" class="${isAbsent ? '' : 'hidden'} mt-3 grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                        ${bothAvailableForAbsent ? sessionChoiceCard({
                            name: 'editAbsentSession',
                            value: 'BOTH',
                            label: 'Whole Day',
                            checked: absentSession === 'BOTH',
                            tone: 'red'
                        }) : ''}
                        ${amAvailableForAbsent ? sessionChoiceCard({
                            name: 'editAbsentSession',
                            value: 'AM',
                            label: 'AM Only',
                            checked: absentSession === 'AM' || (!bothAvailableForAbsent && amAvailableForAbsent && absentSession !== 'PM'),
                            tone: 'red'
                        }) : ''}
                        ${pmAvailableForAbsent ? sessionChoiceCard({
                            name: 'editAbsentSession',
                            value: 'PM',
                            label: 'PM Only',
                            checked: absentSession === 'PM' || (!bothAvailableForAbsent && !amAvailableForAbsent),
                            tone: 'red'
                        }) : ''}
                    </div>
                `)}
                ${attendanceModalActions({ confirmText: 'Save Changes', confirmId: 'saveSessionChangesBtn' })}
            </div>
        `;

        openModal(`Edit Session — ${studentName}`, content, 'medium');
        applyModalDomino();

        const absentCheck = document.getElementById('editIsAbsent');
        const absentContainer = document.getElementById('absentOptionsContainer');
        if (absentCheck && absentContainer) {
            absentCheck.addEventListener('change', (e) => {
                if (e.target.checked) {
                    absentContainer.classList.remove('hidden');
                } else {
                    absentContainer.classList.add('hidden');
                }
            });
        }

        document.getElementById('clearAmBtn')?.addEventListener('click', () => {
            const inAm = document.getElementById('editTimeInAm');
            const outAm = document.getElementById('editTimeOutAm');
            if (inAm) inAm.value = '';
            if (outAm) outAm.value = '';
        });

        document.getElementById('clearBreakBtn')?.addEventListener('click', () => {
            const bOut = document.getElementById('editBreakOut');
            const bIn = document.getElementById('editBreakIn');
            if (bOut) bOut.value = '';
            if (bIn) bIn.value = '';
        });

        document.getElementById('clearPmBtn')?.addEventListener('click', () => {
            const inPm = document.getElementById('editTimeInPm');
            const outPm = document.getElementById('editTimeOutPm');
            if (inPm) inPm.value = '';
            if (outPm) outPm.value = '';
        });

        document.getElementById('clearAllTimesBtn')?.addEventListener('click', () => {
            ['editTimeInAm', 'editTimeOutAm', 'editBreakOut', 'editBreakIn', 'editTimeInPm', 'editTimeOutPm'].forEach(id => {
                const el = document.getElementById(id);
                if (el) el.value = '';
            });
            showToast('All session times cleared. Click Save Changes to apply.', 'info');
        });

        const saveBtn = document.getElementById('saveSessionChangesBtn');
        if (saveBtn) {
            saveBtn.addEventListener('click', async () => {
                const inAmVal = document.getElementById('editTimeInAm')?.value || null;
                const outAmVal = document.getElementById('editTimeOutAm')?.value || null;
                const bOutVal = document.getElementById('editBreakOut')?.value || null;
                const bInVal = document.getElementById('editBreakIn')?.value || null;
                const inPmVal = document.getElementById('editTimeInPm')?.value || null;
                const outPmVal = document.getElementById('editTimeOutPm')?.value || null;

                const isAbsentChecked = document.getElementById('editIsAbsent')?.checked;
                const absentSessionRadio = document.querySelector('input[name="editAbsentSession"]:checked');
                const absentSessionVal = isAbsentChecked ? (absentSessionRadio ? absentSessionRadio.value : 'BOTH') : null;

                setModalButtonLoading('saveSessionChangesBtn', true, 'Save Changes');

                try {
                    await AttendanceAPI.editStudentSession({
                        student_id: studentId,
                        event_id: selectedEvent.id,
                        organization_id: selectedEvent.organization_id,
                        schedule_date: selectedDate,
                        time_in_am: inAmVal ? `${inAmVal}:00` : '',
                        time_out_am: outAmVal ? `${outAmVal}:00` : '',
                        break_out: bOutVal ? `${bOutVal}:00` : '',
                        break_in: bInVal ? `${bInVal}:00` : '',
                        time_in_pm: inPmVal ? `${inPmVal}:00` : '',
                        time_out_pm: outPmVal ? `${outPmVal}:00` : '',
                        is_absent: isAbsentChecked ? 1 : 0,
                        absent_session: absentSessionVal
                    });

                    showToast(`Session updated for ${studentName}`, 'success');
                    closeModal();
                    await refreshCurrentEvent();
                } catch (err) {
                    console.error('Error saving session:', err);
                    showToast(err.message || 'Failed to update session', 'error');
                    setModalButtonLoading('saveSessionChangesBtn', false, 'Save Changes');
                }
            });
        }
    }

    function confirmResetStudent(studentId, studentName) {
        if (!selectedEvent || !selectedDate) return;

        openConfirmDialog({
            title: 'Reset Student Attendance',
            message: `Are you sure you want to reset attendance for ${studentName} on ${formatDateDisplay(selectedDate).formatted}? All recorded logs for this day will be removed.`,
            confirmText: 'Reset Logs',
            cancelText: 'Cancel',
            type: 'danger',
            onConfirm: async () => {
                try {
                    await AttendanceAPI.resetAttendanceDay({
                        student_id: studentId,
                        event_id: selectedEvent.id,
                        schedule_date: selectedDate
                    });
  
                    await auditAttendanceAction('DELETE', {
                        id: studentId,
                        title: `Reset attendance for ${studentName} on ${formatDateDisplay(selectedDate).formatted}`
                    });
                    
                    showToast(`Attendance reset for ${studentName}`, 'success');
                    await refreshCurrentEvent();
                } catch (err) {
                    console.error('Error resetting attendance:', err);
                    showToast(err.message || 'Failed to reset attendance', 'error');
                }
            }
        });
    }

    async function refreshCurrentEvent() {
        if (!selectedEvent) return;
        try {
            const eventId = selectedEvent.id || selectedEvent.event_id;
            const orgId = selectedEvent.organization_id || null;
            const data = await AttendanceAPI.getAttendanceByEvent(eventId, null, orgId);
            if (data && data.success) {
                selectedEvent = {
                    ...data.event,
                    id: data.event.id || data.event.event_id || eventId,
                    organization_id: data.event.organization_id || orgId,
                    organization_name: data.event.organization_name || selectedEvent.organization_name || 'Organization'
                };
                students = data.students || [];
                attendanceRecords = data.attendance || [];
                renderSummaryCard();
                renderTable();
            }
        } catch (e) {
            console.error('Error refreshing event attendance:', e);
        }
    }

    if (eventSelect) {
        eventSelect.addEventListener('change', (e) => {
            handleEventChange(e.target.value);
        });
    }

    if (refreshBtn) {
        refreshBtn.addEventListener('click', () => {
            if (selectedEvent) {
                refreshCurrentEvent();
                showToast('Attendance data refreshed', 'info');
            } else {
                loadEvents();
            }
        });
    }

    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            searchQuery = e.target.value.trim();
            renderTable();
        });
    }

    const daysContainer = document.getElementById('scheduleDaysContainer');
    if (daysContainer) {
        daysContainer.addEventListener('click', (e) => {
            const btn = e.target.closest('.day-tab-btn');
            if (!btn) return;
            const newDate = btn.getAttribute('data-date');
            if (newDate && newDate !== selectedDate) {
                selectedDate = newDate;
                if (selectedEvent) {
                    renderScheduleDays(selectedEvent.daily_schedules || []);
                    renderSummaryCard();
                    renderTable();
                }
            }
        });
    }

    const tbody = document.getElementById('attendanceTableBody');
    const mobileList = document.getElementById('attendanceMobileList');
    if (tbody) tbody.addEventListener('click', handleAttendanceActionClick);
    if (mobileList) mobileList.addEventListener('click', handleAttendanceActionClick);

    initAttendanceAnimations(document.getElementById('adviser-attendance-page') || document);
    await loadEvents();
}

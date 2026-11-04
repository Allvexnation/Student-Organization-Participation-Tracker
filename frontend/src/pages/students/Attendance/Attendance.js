import { StudentNavbar, initStudentNavbar } from '../../../components/Navbar/StudentNavbar.js';
import { isAuthenticated, getUserId, getUserData } from '../../../utils/jwt.js';
import { navigate } from '../../../utils/navigation.js';
import * as StudentAttendanceAPI from '../../../api/students/Attendance/Attendance.js';
import { openModal, closeModal, setModalButtonLoading } from '../../../utils/modal.js';
import { showToast } from '../../../components/ToastMessage.js';
import { skeletonTableRows } from '../../../components/SkeletonLoading.js';
import { logStudentChange } from '../../../api/AuditLogs/StudentAuditLogs.js';
import { initAttendanceAnimations, animateDominoList } from '../../../provider/Animation/AttendanceAnimation.js';
import { FIELD_CLASS, LABEL_CLASS, modalSection, modalDetailTile, applyModalDomino } from '../../../components/Modal/modalUi.js';

function attendanceModalActions({
    cancelText = 'Cancel',
    confirmText,
    confirmId,
    confirmClass = null,
    danger = false
}) {
    const submitBg = confirmClass || (danger ? 'bg-danger hover:bg-red-800' : 'bg-blue-600 hover:bg-blue-800');
    return `
        <div class="manage-modal-actions reveal flex flex-col-reverse sm:flex-row sm:justify-end gap-2" data-domino-enter>
            <button type="button" onclick="closeModal()" class="w-full sm:w-auto px-4 py-2.5 text-sm font-medium text-ink bg-surface hover:bg-line rounded-xl transition">${cancelText}</button>
            <button type="button" id="${confirmId}" class="w-full sm:w-auto px-5 py-2.5 text-sm font-medium text-white ${submitBg} rounded-xl transition">${confirmText}</button>
        </div>
    `;
}

function sessionChoiceCard({ name, value, label, hint = '', checked = false, tone = 'purple' }) {
    const tones = {
        navy: 'peer-checked:border-blue-600 peer-checked:bg-blue-50 peer-checked:ring-1 peer-checked:ring-blue-600/20',
        purple: 'peer-checked:border-purple-600 peer-checked:bg-purple-50 peer-checked:ring-1 peer-checked:ring-purple-200'
    };
    return `
        <label class="relative block cursor-pointer">
            <input type="radio" name="${name}" value="${value}" class="peer sr-only" ${checked ? 'checked' : ''}>
            <span class="flex flex-col gap-0.5 rounded-xl border border-line bg-white px-3.5 py-3 transition ${tones[tone] || tones.purple}">
                <span class="text-sm font-semibold text-ink">${label}</span>
                ${hint ? `<span class="text-[11px] text-muted">${hint}</span>` : ''}
            </span>
        </label>
    `;
}

function skeletonStudentDayCards(count = 3) {
    return Array.from({ length: count }, () => `
        <div class="att-mobile-card rounded-2xl border border-line bg-white/90 p-4" style="backdrop-filter: blur(12px); -webkit-backdrop-filter: blur(12px);">
            <div class="flex items-center justify-between gap-3">
                <div class="space-y-2 flex-1">
                    <div class="h-4 w-32 skeleton-shimmer rounded"></div>
                    <div class="h-3 w-24 skeleton-shimmer rounded"></div>
                </div>
                <div class="h-6 w-20 skeleton-shimmer rounded-full"></div>
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
                <div class="h-3.5 w-28 rounded bg-white/10"></div>
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

function studentEventInfoMarkup({ title, organization, adviser, category, venue, dateRange }) {
    return `
        <div class="inline-flex items-center gap-2 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-white/10 text-yellow border border-white/15 mb-2" id="studentEventCategory">${escapeEventText(category)}</div>
        <h2 class="text-lg sm:text-xl font-semibold tracking-tight break-words text-white" id="studentEventTitle">${escapeEventText(title)}</h2>
        <div class="flex flex-wrap items-center gap-x-3 gap-y-1.5 text-xs text-blue-100/90 mt-2">
            <span class="inline-flex items-center gap-1.5 min-w-0"><i data-lucide="building-2" class="w-3.5 h-3.5 text-yellow shrink-0"></i><span id="studentEventOrg" class="truncate">${escapeEventText(organization)}</span></span>
            <span class="inline-flex items-center gap-1.5 min-w-0"><i data-lucide="user" class="w-3.5 h-3.5 text-yellow shrink-0"></i><span id="studentEventAdviser" class="truncate">${escapeEventText(adviser)}</span></span>
            <span class="inline-flex items-center gap-1.5 min-w-0"><i data-lucide="calendar" class="w-3.5 h-3.5 text-yellow shrink-0"></i><span id="studentEventDateRange" class="truncate">${escapeEventText(dateRange)}</span></span>
            <span class="inline-flex items-center gap-1.5 min-w-0"><i data-lucide="map-pin" class="w-3.5 h-3.5 text-yellow shrink-0"></i><span id="studentEventVenue" class="truncate">${escapeEventText(venue)}</span></span>
        </div>
    `;
}

let studentAttendanceListReady = false;

function finishStudentAttendanceRender(animate = true) {
    if (typeof lucide !== 'undefined') lucide.createIcons();
    const targets = document.querySelectorAll('#studentAttendanceMobileList .reveal, #studentAttendanceTableBody .reveal');

    if (!animate || studentAttendanceListReady) {
        targets.forEach((el) => el.classList.add('in'));
        studentAttendanceListReady = true;
        return;
    }

    const isMobile = window.matchMedia('(max-width: 767px)').matches;
    const list = document.getElementById('studentAttendanceMobileList');
    const panel = document.getElementById('studentAttendanceDesktopPanel');
    if (isMobile && list) animateDominoList(list);
    else if (!isMobile && panel) animateDominoList(panel);
    studentAttendanceListReady = true;
}

function studentSessionChip({ label, value, actionAttrs, tone = 'blue', disabled = false, disabledTitle = '' }) {
    const tones = {
        blue: {
            label: 'text-blue-600/70',
            btn: 'text-blue-600 bg-white hover:bg-blue-50 border-blue-200',
            val: 'border-blue-100'
        },
        amber: {
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

function studentSessionBlock({ title, tone, rows }) {
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

export function StudentAttendance() {
    return `
        <div id="student-attendance-page" data-domino-page class="min-h-screen bg-surface font-sans text-ink pb-10">
            ${StudentNavbar()}
            <main class="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-5 sm:py-8">
                <header class="reveal mb-5 sm:mb-7" data-domino-enter>
                    <span class="inline-flex items-center gap-2 rounded-full border border-line bg-white px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-blue-600">
                        <span class="h-1.5 w-1.5 rounded-full bg-yellow"></span>
                        My sessions
                    </span>
                    <div class="mt-3 flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4">
                        <div class="min-w-0">
                            <h1 class="text-[1.65rem] sm:text-3xl font-semibold tracking-tight text-ink leading-tight">My Event Attendance</h1>
                            <p class="mt-1.5 max-w-2xl text-sm text-body">Log AM, break, and PM times for each event day, or submit an excuse when you cannot attend.</p>
                        </div>
                        <div class="flex flex-col sm:flex-row items-stretch sm:items-end gap-2.5 w-full lg:w-auto">
                            <div class="relative flex-1 lg:min-w-[280px]">
                                <label for="studentEventSelect" class="block text-[11px] font-semibold uppercase tracking-[0.14em] text-muted mb-1.5">Event</label>
                                <select
                                    id="studentEventSelect"
                                    class="w-full px-3.5 py-2.5 text-sm bg-white border border-line rounded-xl text-ink shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600">
                                    <option value="">Loading your events...</option>
                                </select>
                            </div>
                            <button
                                type="button"
                                id="refreshStudentAttendanceBtn"
                                title="Refresh Data"
                                class="inline-flex items-center justify-center gap-2 px-3.5 py-2.5 text-sm font-medium text-ink bg-white border border-line rounded-xl hover:bg-surface focus:outline-none focus:ring-2 focus:ring-blue-600/20 shadow-sm transition">
                                <i data-lucide="refresh-cw" class="w-4 h-4"></i>
                                <span>Refresh</span>
                            </button>
                        </div>
                    </div>
                </header>

                <section id="studentEventSummaryCard" class="reveal mb-5 sm:mb-6" data-domino-enter>
                    <div class="relative overflow-hidden rounded-2xl border border-blue-600/10 text-white shadow-lift" style="background-image: url('public/Overview2.jpg'); background-size: cover; background-position: center;">
                        <div class="absolute inset-0 bg-blue-900/60 pointer-events-none"></div>
                        <div class="relative p-4 sm:p-5">
                            <div class="flex flex-col xl:flex-row xl:items-start xl:justify-between gap-4">
                                <div class="min-w-0 flex-1">
                                    <div id="studentEventInfoContent">
                                        ${skeletonEventInfo()}
                                    </div>
                                </div>
                                <div id="studentAttendanceStatsGrid" class="att-stats-grid att-stats-grid--3 w-full xl:w-auto xl:min-w-[260px]">
                                    <div class="att-stat-cell">
                                        <div class="att-stat-label text-blue-100/80">Days</div>
                                        <div class="att-stat-value" id="statStudentTotalDays">0</div>
                                    </div>
                                    <div class="att-stat-cell">
                                        <div class="att-stat-label text-emerald-200/90">Done</div>
                                        <div class="att-stat-value text-emerald-300" id="statStudentCompletedDays">0</div>
                                    </div>
                                    <div class="att-stat-cell">
                                        <div class="att-stat-label text-blue-100/80">Time</div>
                                        <div class="att-stat-value text-blue-100" id="statStudentTotalDuration">0h 0m</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                <section class="reveal" data-domino-enter>
                    <div class="mb-3 sm:mb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                        <div>
                            <h3 class="text-sm font-semibold text-ink tracking-tight">Daily attendance logs</h3>
                            <p class="text-xs text-muted mt-0.5">
                                Status becomes <span class="font-semibold text-success">Completed</span> when both AM and PM are timed in &amp; out.
                            </p>
                        </div>
                        <div class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-medium bg-blue-50 text-blue-600 border border-blue-100 self-start">
                            <i data-lucide="info" class="w-3.5 h-3.5"></i>
                            <span>Logging only on today&rsquo;s date</span>
                        </div>
                    </div>

                    <div id="studentAttendanceDesktopPanel" class="hidden md:block">
                        <div class="bg-white border border-line rounded-2xl shadow-sm overflow-hidden">
                            <div class="overflow-x-auto">
                                <table class="w-full text-sm text-left">
                                    <thead>
                                        <tr class="bg-surface border-b border-line text-[11px] font-semibold text-muted uppercase tracking-[0.14em]">
                                            <th class="px-4 py-3.5 w-44">Schedule</th>
                                            <th class="px-4 py-3.5 text-center min-w-[160px]">AM</th>
                                            <th class="px-4 py-3.5 text-center min-w-[160px]">Break</th>
                                            <th class="px-4 py-3.5 text-center min-w-[160px]">PM</th>
                                            <th class="px-4 py-3.5 text-center w-28">Duration</th>
                                            <th class="px-4 py-3.5 text-center w-36">Status</th>
                                            <th class="px-4 py-3.5 text-center w-32">Excuse</th>
                                        </tr>
                                    </thead>
                                    <tbody id="studentAttendanceTableBody" class="divide-y divide-line">
                                        ${skeletonTableRows(3, 7, true)}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>

                    <div id="studentAttendanceMobileList" class="md:hidden att-day-rail space-y-3">
                        ${skeletonStudentDayCards()}
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

function getStatusBadge(status, excuseReason = null) {
    const s = (status || 'Pending').toLowerCase();
    const base = 'inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-md text-[10px] font-semibold border whitespace-nowrap';
    if (s === 'completed' || s.includes('completed')) {
        return `<span class="${base} bg-emerald-50 text-emerald-800 border-emerald-200" title="${status}"><i data-lucide="check" class="w-3 h-3"></i> Done</span>`;
    }
    if (s.includes('pending excuse')) {
        return `<span title="Awaiting adviser review" class="${base} bg-amber-50 text-amber-800 border-amber-200"><i data-lucide="clock" class="w-3 h-3"></i> Excuse?</span>`;
    }
    if (s.includes('absent')) {
        return `<span class="${base} bg-red-50 text-red-800 border-red-200" title="${status}"><i data-lucide="x" class="w-3 h-3"></i> Absent</span>`;
    }
    if (s.includes('excused')) {
        const titleAttr = excuseReason ? `title="Reason: ${excuseReason.replace(/"/g, '&quot;')}"` : `title="${status}"`;
        return `<span ${titleAttr} class="${base} bg-violet-50 text-violet-800 border-violet-200"><i data-lucide="file-check" class="w-3 h-3"></i> Excused</span>`;
    }
    if (s === 'in progress') {
        return `<span class="${base} bg-blue-50 text-blue-600 border-blue-100"><i data-lucide="clock" class="w-3 h-3"></i> Active</span>`;
    }
    return `<span class="${base} bg-surface text-muted border-line"><i data-lucide="minus" class="w-3 h-3"></i> Pending</span>`;
}

export async function initStudentAttendance() {
    if (!(await isAuthenticated('student'))) {
        navigate('/auth/student/login');
        return;
    }
    await initStudentNavbar();

    let events = [];
    let selectedEvent = null;
    let attendanceRecords = [];

    const eventSelect = document.getElementById('studentEventSelect');
    const refreshBtn = document.getElementById('refreshStudentAttendanceBtn');

    async function auditAttendanceAction(action, data, changedFields = []) {
        try {
            const studentId = getUserId('student');
            const user = getUserData('student');
            const userName = user?.name || (user?.first_name ? `${user.first_name} ${user.last_name || ''}`.trim() : user?.username) || 'Unknown';
            const actionUpper = (action || '').toUpperCase();

            if (actionUpper === 'DELETE') {
                await logStudentChange({
                    user_id: studentId,
                    user_type: 'student',
                    user_name: userName,
                    action: 'DELETE',
                    table_name: 'attendance',
                    record_id: data.id || data.student_id || studentId || 0,
                    field_name: data.field_name || 'attendance_record',
                    old_value: data.old_value || data.title || 'Attendance Record',
                    new_value: null
                }, 'student');
            } else if (actionUpper === 'CREATE') {
                await logStudentChange({
                    user_id: studentId,
                    user_type: 'student',
                    user_name: userName,
                    action: 'CREATE',
                    table_name: 'attendance',
                    record_id: data.id || data.student_id || studentId || 0,
                    field_name: data.field_name || 'attendance',
                    old_value: null,
                    new_value: data.new_value || data.title || 'Attendance'
                }, 'student');
            } else if (actionUpper === 'UPDATE') {
                for (const change of changedFields) {
                    await logStudentChange({
                        user_id: studentId,
                        user_type: 'student',
                        user_name: userName,
                        action: 'UPDATE',
                        table_name: 'attendance',
                        record_id: data.id || data.student_id || studentId || 0,
                        field_name: change.field_name,
                        old_value: change.old_value !== null && change.old_value !== undefined && change.old_value !== '' ? String(change.old_value) : 'None',
                        new_value: change.new_value !== null && change.new_value !== undefined && change.new_value !== '' ? String(change.new_value) : 'None'
                    }, 'student');
                }
            }
        } catch (error) {
            console.error('Audit log failed for student attendance:', error);
        }
    }

    async function loadEvents() {
        try {
            if (eventSelect) {
                eventSelect.innerHTML = '<option value="">Loading your events...</option>';
            }
            events = await StudentAttendanceAPI.getStudentAttendanceEvents();

            if (!events || events.length === 0) {
                if (eventSelect) {
                    eventSelect.innerHTML = '<option value="">No registered events found</option>';
                }
                renderEmpty('no_events');
                return;
            }

            if (eventSelect) {
                eventSelect.innerHTML = '<option value="">-- Choose an Event --</option>' +
                    events.map(ev => `
                        <option value="${ev.id}">${ev.title} (${ev.organization_name || 'Organization'})</option>
                    `).join('');

                if (events.length > 0) {
                    eventSelect.value = events[0].id;
                    await handleEventChange(events[0].id);
                }
            }
        } catch (error) {
            console.error('Error loading events:', error);
            showToast('Failed to load events for attendance', 'error');
            renderEmpty('error');
        }
    }

    async function handleEventChange(eventId) {
        if (!eventId) {
            selectedEvent = null;
            attendanceRecords = [];
            studentAttendanceListReady = false;
            document.getElementById('studentEventSummaryCard')?.classList.add('hidden');
            renderEmpty('select_event');
            return;
        }

        const tbody = document.getElementById('studentAttendanceTableBody');
        const mobileList = document.getElementById('studentAttendanceMobileList');
        const statsGrid = document.getElementById('studentAttendanceStatsGrid');
        const eventInfo = document.getElementById('studentEventInfoContent');
        if (tbody) tbody.innerHTML = skeletonTableRows(3, 7, true);
        if (mobileList) mobileList.innerHTML = skeletonStudentDayCards();
        if (eventInfo) eventInfo.innerHTML = skeletonEventInfo();
        statsGrid?.classList.add('att-stats-loading');
        document.getElementById('studentEventSummaryCard')?.classList.remove('hidden');

        try {
            selectedEvent = events.find(e => String(e.id) === String(eventId)) || null;
            attendanceRecords = [];

            if (selectedEvent) {
                paintStudentEventMeta(selectedEvent, { statsLoading: true });
            }

            const res = await StudentAttendanceAPI.getStudentAttendanceByEvent(eventId);
            if (res && res.success) {
                attendanceRecords = res.attendance || [];
                renderSummary();
                renderTable();
            } else {
                showToast(res?.message || 'Failed to fetch attendance', 'error');
                renderEmpty('error');
            }
        } catch (error) {
            console.error('Error fetching student attendance:', error);
            showToast('Failed to load attendance records', 'error');
            renderEmpty('error');
        }
    }

    function paintStudentEventMeta(eventData, { statsLoading = false } = {}) {
        const card = document.getElementById('studentEventSummaryCard');
        const eventInfo = document.getElementById('studentEventInfoContent');
        if (!card || !eventData || !eventInfo) return;

        card.classList.remove('hidden');

        const start = eventData.event_day_start ? formatDateDisplay(eventData.event_day_start).formatted : '';
        const end = eventData.event_day_end ? formatDateDisplay(eventData.event_day_end).formatted : '';

        eventInfo.innerHTML = studentEventInfoMarkup({
            title: eventData.title || 'Event Title',
            organization: eventData.organization_name || 'Organization',
            adviser: eventData.adviser_name || 'Adviser',
            category: eventData.event_category || 'Event',
            venue: eventData.venue || 'No venue specified',
            dateRange: (start && end) ? `${start} - ${end}` : (start || 'Flexible schedule')
        });

        if (statsLoading) {
            document.getElementById('studentAttendanceStatsGrid')?.classList.add('att-stats-loading');
        }

        if (typeof lucide !== 'undefined') {
            lucide.createIcons();
        }
    }

    function renderSummary() {
        const card = document.getElementById('studentEventSummaryCard');
        if (!card || !selectedEvent) return;

        paintStudentEventMeta(selectedEvent);

        const schedules = selectedEvent.daily_schedules || [];
        let completed = 0;
        let totalMinutes = 0;

        attendanceRecords.forEach(r => {
            const s = (r.status || '').toLowerCase();
            if (s === 'completed' || s.includes('completed')) {
                completed++;
            }
            if (r.duration_minutes) {
                totalMinutes += parseInt(r.duration_minutes, 10);
            }
        });

        const durationLabel = formatDuration(totalMinutes);
        const setStat = (id, value) => {
            const el = document.getElementById(id);
            if (el) el.textContent = value;
        };
        setStat('statStudentTotalDays', schedules.length);
        setStat('statStudentCompletedDays', completed);
        setStat('statStudentTotalDuration', durationLabel);
        document.getElementById('studentAttendanceStatsGrid')?.classList.remove('att-stats-loading');
    }

    function renderTable() {
        const tbody = document.getElementById('studentAttendanceTableBody');
        const mobileList = document.getElementById('studentAttendanceMobileList');
        if (!tbody && !mobileList) return;

        if (!selectedEvent) {
            renderEmpty('select_event');
            return;
        }

        const schedules = selectedEvent.daily_schedules || [];
        const emptyBlock = (icon, title, subtitle = '') => `
            <div class="py-12 px-4 text-center">
                <span class="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-surface text-muted mb-3">
                    <i data-lucide="${icon}" class="w-6 h-6"></i>
                </span>
                <p class="text-sm font-medium text-ink">${title}</p>
                ${subtitle ? `<p class="text-xs text-muted mt-1 max-w-sm mx-auto">${subtitle}</p>` : ''}
            </div>
        `;

        if (schedules.length === 0) {
            if (tbody) {
                tbody.innerHTML = `<tr data-domino-enter class="reveal"><td colspan="7">${emptyBlock('calendar-x', 'No scheduled dates for this event')}</td></tr>`;
            }
            if (mobileList) {
                mobileList.innerHTML = `<article class="reveal rounded-2xl border border-line bg-white" data-domino-enter>${emptyBlock('calendar-x', 'No scheduled dates for this event')}</article>`;
            }
            finishStudentAttendanceRender();
            return;
        }

        const attMap = {};
        attendanceRecords.forEach(r => {
            attMap[r.schedule_date] = r;
        });

        const todayStr = getTodayLocalDate();
        let rowsHtml = '';
        let cardsHtml = '';

        schedules.forEach((sched, index) => {
            const dateStr = sched.schedule_date;
            const dateInfo = formatDateDisplay(dateStr);
            const att = attMap[dateStr] || null;

            const isToday = (dateStr === todayStr);
            const isPast = (dateStr < todayStr);

            const timeInAm = att?.time_in_am ? formatTime12(att.time_in_am) : null;
            const timeOutAm = att?.time_out_am ? formatTime12(att.time_out_am) : null;
            const breakOut = att?.break_out ? formatTime12(att.break_out) : null;
            const breakIn = att?.break_in ? formatTime12(att.break_in) : null;
            const timeInPm = att?.time_in_pm ? formatTime12(att.time_in_pm) : null;
            const timeOutPm = att?.time_out_pm ? formatTime12(att.time_out_pm) : null;

            const isAbsent = att?.is_absent == 1;
            const absentSession = att?.absent_session || null;
            const isExcused = att?.is_excused == 1;
            const excuseSession = att?.excuse_session || null;
            const isPendingExcuse = att?.status === 'Pending Excuse' || att?.excuse_status === 'Pending';
            const status = att?.status || 'Pending';
            const durationFormatted = att?.duration_minutes ? formatDuration(att.duration_minutes) : '0 hrs';

            const isAmLocked = (isExcused && (excuseSession === 'AM' || excuseSession === 'BOTH')) || (isAbsent && (absentSession === 'AM' || absentSession === 'BOTH'));
            const isPmLocked = (isExcused && (excuseSession === 'PM' || excuseSession === 'BOTH')) || (isAbsent && (absentSession === 'PM' || absentSession === 'BOTH'));
            const isBreakLocked = isAmLocked || isPmLocked;

            const canTimeOutAm = timeInAm !== null;
            const canBreakOut = timeInAm !== null;
            const canBreakIn = breakOut !== null;
            const canTimeInPm = breakIn !== null;
            const canTimeOutPm = timeInPm !== null;

            const disableLog = !isToday;
            const disabledLogTitle = !isToday
                ? `Attendance session logging is only enabled on the day of the event (${dateInfo.formatted})`
                : 'Record Time';

            const logAttrs = (type) => `data-action="student-log" data-date="${dateStr}" data-type="${type}"`;
            const amRows = `
                ${studentSessionChip({ label: 'In', value: timeInAm, actionAttrs: logAttrs('time_in_am'), disabled: disableLog || isAmLocked, disabledTitle: !isToday ? disabledLogTitle : 'AM session is locked (excused/absent)' })}
                ${studentSessionChip({ label: 'Out', value: timeOutAm, actionAttrs: logAttrs('time_out_am'), disabled: disableLog || isAmLocked || !canTimeOutAm, disabledTitle: !isToday ? disabledLogTitle : !canTimeOutAm ? 'Time In AM must be recorded first' : 'AM session is locked (excused/absent)' })}
            `;
            const breakRows = `
                ${studentSessionChip({ label: 'Out', value: breakOut, actionAttrs: logAttrs('break_out'), tone: 'amber', disabled: disableLog || isBreakLocked || !canBreakOut, disabledTitle: !isToday ? disabledLogTitle : !canBreakOut ? 'Time In AM must be recorded first' : 'Break session is locked (excused/absent)' })}
                ${studentSessionChip({ label: 'In', value: breakIn, actionAttrs: logAttrs('break_in'), tone: 'amber', disabled: disableLog || isBreakLocked || !canBreakIn, disabledTitle: !isToday ? disabledLogTitle : !canBreakIn ? 'Break Out must be recorded first' : 'Break session is locked (excused/absent)' })}
            `;
            const pmRows = `
                ${studentSessionChip({ label: 'In', value: timeInPm, actionAttrs: logAttrs('time_in_pm'), disabled: disableLog || isPmLocked || !canTimeInPm, disabledTitle: !isToday ? disabledLogTitle : !canTimeInPm ? 'Break In must be recorded first' : 'PM session is locked (excused/absent)' })}
                ${studentSessionChip({ label: 'Out', value: timeOutPm, actionAttrs: logAttrs('time_out_pm'), disabled: disableLog || isPmLocked || !canTimeOutPm, disabledTitle: !isToday ? disabledLogTitle : !canTimeOutPm ? 'Time In PM must be recorded first' : 'PM session is locked (excused/absent)' })}
            `;

            const dayBadge = isToday
                ? `<span class="inline-flex items-center gap-0.5 px-1 py-0.5 rounded text-[9px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200"><span class="w-1 h-1 rounded-full bg-emerald-500 animate-pulse"></span> Today</span>`
                : isPast
                    ? `<span class="inline-flex px-1 py-0.5 rounded text-[9px] font-medium bg-surface text-muted border border-line">Past</span>`
                    : `<span class="inline-flex px-1 py-0.5 rounded text-[9px] font-medium bg-blue-50 text-blue-600 border border-blue-100">Soon</span>`;

            const excuseCell = isPendingExcuse
                ? `<span class="text-[10px] text-amber-800 font-semibold">Submitted</span>`
                : isExcused
                    ? `<span class="text-[10px] text-violet-800 font-semibold">Approved</span>`
                    : `<button type="button" data-action="student-excuse" data-date="${dateStr}" ${!isToday ? 'disabled title="Actions are only available on the current day"' : 'title="Submit an excuse request for this date"'}
                        class="px-1.5 py-1 text-[10px] font-medium text-violet-700 bg-violet-50 hover:bg-violet-100 disabled:opacity-40 disabled:cursor-not-allowed border border-violet-200 rounded-md transition inline-flex items-center gap-0.5">
                        <i data-lucide="file-text" class="w-3 h-3"></i><span>Excuse</span>
                    </button>`;

            rowsHtml += `
                <tr class="reveal hover:bg-surface/80 transition-colors ${isToday ? 'bg-blue-50/30' : ''}" data-domino-enter>
                    <td class="px-4 py-3.5 align-top">
                        <div class="flex items-center gap-1.5 flex-wrap">
                            <span class="inline-flex items-center justify-center h-5 min-w-[1.25rem] px-1 rounded bg-blue-600 text-white text-[10px] font-bold">D${index + 1}</span>
                            <span class="font-semibold text-ink text-sm">${dateInfo.formatted}</span>
                            ${dayBadge}
                        </div>
                        <div class="text-[11px] text-muted mt-1">${dateInfo.dayName}${sched.start_time && sched.end_time ? ` · ${formatTime12(sched.start_time)} – ${formatTime12(sched.end_time)}` : ''}</div>
                    </td>
                    <td class="px-3 py-2.5 align-middle">${studentSessionBlock({ title: 'AM', tone: 'blue', rows: amRows })}</td>
                    <td class="px-3 py-2.5 align-middle">${studentSessionBlock({ title: 'Break', tone: 'amber', rows: breakRows })}</td>
                    <td class="px-3 py-2.5 align-middle">${studentSessionBlock({ title: 'PM', tone: 'blue', rows: pmRows })}</td>
                    <td class="px-4 py-4 align-middle text-center"><div class="text-xs font-semibold text-ink tabular-nums">${durationFormatted}</div></td>
                    <td class="px-4 py-4 align-middle text-center">
                        ${getStatusBadge(status, att?.excuse_reason)}
                        ${isPendingExcuse ? `<div class="text-[10px] text-amber-700 mt-1">Awaiting approval</div>` : ''}
                        ${isExcused && att?.excuse_reason ? `<div class="text-[11px] text-violet-700 mt-0.5 max-w-[130px] truncate mx-auto" title="${att.excuse_reason}">"${att.excuse_reason}"</div>` : ''}
                    </td>
                    <td class="px-4 py-4 align-middle text-center">${excuseCell}</td>
                </tr>
            `;

            cardsHtml += `
                <article class="att-mobile-card reveal rounded-2xl border ${isToday ? 'border-blue-600/30 ring-1 ring-blue-600/10' : 'border-line'} bg-white shadow-sm overflow-hidden" data-domino-enter>
                    <div class="p-3.5">
                        <div class="flex items-start justify-between gap-2">
                            <div class="min-w-0">
                                <div class="flex items-center gap-1.5 flex-wrap">
                                    <span class="inline-flex items-center justify-center h-6 min-w-[1.5rem] px-1 rounded-md bg-blue-600 text-white text-[10px] font-bold">D${index + 1}</span>
                                    ${dayBadge}
                                </div>
                                <h3 class="text-sm font-semibold text-ink mt-1.5">${dateInfo.formatted}</h3>
                                <p class="text-[11px] text-muted mt-0.5">${dateInfo.dayName}${sched.start_time && sched.end_time ? ` · ${formatTime12(sched.start_time)} – ${formatTime12(sched.end_time)}` : ''}</p>
                            </div>
                            <div class="text-right shrink-0 space-y-1">
                                ${getStatusBadge(status, att?.excuse_reason)}
                                <div class="text-[10px] font-semibold text-ink tabular-nums">${durationFormatted}</div>
                            </div>
                        </div>

                        <div class="mt-3.5 grid grid-cols-3 gap-2">
                            ${studentSessionBlock({ title: 'AM', tone: 'blue', rows: amRows })}
                            ${studentSessionBlock({ title: 'Break', tone: 'amber', rows: breakRows })}
                            ${studentSessionBlock({ title: 'PM', tone: 'blue', rows: pmRows })}
                        </div>
                    </div>
                    <div class="px-4 py-3 border-t border-line bg-surface/60 flex items-center justify-between gap-2">
                        <span class="text-[11px] text-muted">${isPendingExcuse ? 'Excuse awaiting review' : isExcused ? 'Excuse approved' : 'Need to miss this day?'}</span>
                        ${excuseCell}
                    </div>
                </article>
            `;
        });

        if (tbody) tbody.innerHTML = rowsHtml;
        if (mobileList) mobileList.innerHTML = cardsHtml;
        finishStudentAttendanceRender();
    }

    function renderEmpty(type) {
        const tbody = document.getElementById('studentAttendanceTableBody');
        const mobileList = document.getElementById('studentAttendanceMobileList');

        let icon = 'calendar';
        let title = 'No data';
        let subtitle = '';

        if (type === 'no_events') {
            icon = 'calendar-x';
            title = 'No Events Found';
            subtitle = 'You are not registered for any events yet. Join an organization or register for an event first.';
        } else if (type === 'select_event') {
            icon = 'clipboard-check';
            title = 'Select an Event';
            subtitle = 'Choose an event above to view your schedule and log attendance.';
        } else if (type === 'error') {
            icon = 'alert-triangle';
            title = 'Error Loading Attendance';
            subtitle = 'Something went wrong while loading your attendance. Try refreshing.';
        } else {
            icon = 'info';
            title = 'No Records Found';
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

        if (tbody) tbody.innerHTML = `<tr data-domino-enter class="reveal"><td colspan="7">${block}</td></tr>`;
        if (mobileList) mobileList.innerHTML = `<article class="reveal rounded-2xl border border-line bg-white" data-domino-enter>${block}</article>`;
        finishStudentAttendanceRender();
    }

    function handleStudentAttendanceClick(e) {
        const btn = e.target.closest('button');
        if (!btn) return;
        const action = btn.getAttribute('data-action');
        const dateStr = btn.getAttribute('data-date');
        if (action === 'student-log') {
            openLogTimeModal(dateStr, btn.getAttribute('data-type'));
        } else if (action === 'student-excuse') {
            openStudentExcuseModal(dateStr);
        }
    }

    function openLogTimeModal(dateStr, logType) {
        if (!selectedEvent) return;

        const todayStr = getTodayLocalDate();
        if (dateStr !== todayStr) {
            showToast('Attendance session logging is only allowed on the day of the event.', 'warning');
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
                        ${modalDetailTile('Event', selectedEvent.title)}
                        ${modalDetailTile('Date', formatDateDisplay(dateStr).formatted)}
                        ${modalDetailTile('Session', label)}
                    </div>
                `)}
                ${modalSection('Time Entry', `
                    <div>
                        <label for="studentModalTimeInput" class="${LABEL_CLASS}">Current System Time</label>
                        <input type="time" id="studentModalTimeInput" value="${currentTimeStr}" class="${FIELD_CLASS}">
                        <p class="text-xs text-muted mt-1.5">This records your time log for this session.</p>
                    </div>
                `)}
                ${attendanceModalActions({
                    confirmText: `Confirm ${label}`,
                    confirmId: 'confirmStudentLogBtn'
                })}
            </div>
        `;

        openModal(`Record ${label}`, content, 'small');
        applyModalDomino();

        const confirmBtn = document.getElementById('confirmStudentLogBtn');
        if (confirmBtn) {
            confirmBtn.addEventListener('click', async () => {
                const timeVal = document.getElementById('studentModalTimeInput').value;
                setModalButtonLoading('confirmStudentLogBtn', true, 'Confirm');
                try {
                    const att = attendanceRecords.find(r => r.schedule_date === dateStr);
                    const oldTime = att ? att[logType] : null;
                    const newTime = timeVal ? `${timeVal}:00` : null;

                    const res = await StudentAttendanceAPI.logStudentAttendanceTime({
                        event_id: selectedEvent.id,
                        organization_id: selectedEvent.organization_id,
                        adviser_id: selectedEvent.adviser_id,
                        schedule_date: dateStr,
                        log_type: logType,
                        time_value: newTime
                    });

                    await auditAttendanceAction('UPDATE', {
                        id: att?.id || res?.data?.id || getUserId('student'),
                        student_id: getUserId('student')
                    }, [
                        {
                            field_name: logType,
                            old_value: oldTime || 'None',
                            new_value: newTime || 'None'
                        }
                    ]);

                    showToast(`${label} recorded successfully!`, 'success');
                    closeModal();
                    await handleEventChange(selectedEvent.id);
                } catch (err) {
                    console.error('Error logging time:', err);
                    showToast(err.message || 'Failed to record time', 'error');
                    setModalButtonLoading('confirmStudentLogBtn', false, 'Confirm');
                }
            });
        }
    }

    function openStudentExcuseModal(dateStr) {
        if (!selectedEvent) return;

        const att = attendanceRecords.find(r => r.schedule_date === dateStr);
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
                name: 'studentExcuseSession',
                value: 'BOTH',
                label: 'Whole Day',
                hint: 'Excuse AM and PM',
                checked: true
            });
        }
        if (amAvailable) {
            sessionOptions += sessionChoiceCard({
                name: 'studentExcuseSession',
                value: 'AM',
                label: 'AM Only',
                hint: 'Morning session',
                checked: !bothAvailable
            });
        }
        if (pmAvailable) {
            sessionOptions += sessionChoiceCard({
                name: 'studentExcuseSession',
                value: 'PM',
                label: 'PM Only',
                hint: 'Afternoon session',
                checked: !bothAvailable && !amAvailable
            });
        }

        const content = `
            <div class="manage-modal-form space-y-4">
                ${modalSection('Request Context', `
                    <div class="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                        ${modalDetailTile('Event', selectedEvent.title)}
                        ${modalDetailTile('Date', formatDateDisplay(dateStr).formatted)}
                    </div>
                    <div class="mt-3 rounded-xl border border-purple-100 bg-purple-50 px-3.5 py-3 text-xs text-purple-900">
                        Your excuse request must be approved by your adviser before it takes effect.
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
                            <p class="${LABEL_CLASS}">Applicable Session</p>
                            <div class="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                                ${sessionOptions || '<p class="text-sm text-muted col-span-full">No sessions available.</p>'}
                            </div>
                        </div>
                        <div>
                            <label for="studentExcuseReasonInput" class="${LABEL_CLASS}">Reason for Excuse <span class="text-red-500">*</span></label>
                            <textarea id="studentExcuseReasonInput" rows="3" placeholder="Medical certificate, academic contest, family emergency..." class="${FIELD_CLASS} resize-none"></textarea>
                            <p id="studentExcuseError" class="text-xs text-danger mt-1.5 hidden">Reason is required</p>
                        </div>
                    </div>
                `)}
                ${attendanceModalActions({
                    confirmText: 'Submit for Approval',
                    confirmId: 'confirmStudentExcuseBtn',
                    confirmClass: 'bg-purple-700 hover:bg-purple-800'
                })}
            </div>
        `;

        openModal('Submit Excuse Request', content, 'small');
        applyModalDomino();

        const confirmBtn = document.getElementById('confirmStudentExcuseBtn');
        if (confirmBtn) {
            confirmBtn.addEventListener('click', async () => {
                const reasonInput = document.getElementById('studentExcuseReasonInput');
                const reasonVal = reasonInput?.value.trim();
                const errElem = document.getElementById('studentExcuseError');

                if (!reasonVal) {
                    if (errElem) errElem.classList.remove('hidden');
                    reasonInput?.classList.add('border-red-500');
                    return;
                }

                const selectedRadio = document.querySelector('input[name="studentExcuseSession"]:checked');
                const sessionVal = selectedRadio ? selectedRadio.value : 'BOTH';

                setModalButtonLoading('confirmStudentExcuseBtn', true, 'Submitting...');
                try {
                    const att = attendanceRecords.find(r => r.schedule_date === dateStr);
                    const prevStatus = att?.status || 'Pending';

                    const res = await StudentAttendanceAPI.submitStudentExcuse({
                        event_id: selectedEvent.id,
                        organization_id: selectedEvent.organization_id,
                        adviser_id: selectedEvent.adviser_id,
                        schedule_date: dateStr,
                        reason: reasonVal,
                        session: sessionVal
                    });

                    await auditAttendanceAction('UPDATE', {
                        id: att?.id || res?.data?.id || getUserId('student'),
                        student_id: getUserId('student')
                    }, [
                        {
                            field_name: 'excuse_status',
                            old_value: prevStatus,
                            new_value: `Pending Excuse (${sessionVal}): ${reasonVal}`
                        }
                    ]);

                    showToast('Excuse request submitted. Awaiting adviser approval.', 'success');
                    closeModal();
                    await handleEventChange(selectedEvent.id);
                } catch (err) {
                    console.error('Error submitting excuse:', err);
                    showToast(err.message || 'Failed to submit excuse request', 'error');
                    setModalButtonLoading('confirmStudentExcuseBtn', false, 'Submit for Approval');
                }
            });
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
                handleEventChange(selectedEvent.id);
                showToast('Attendance refreshed', 'info');
            } else {
                loadEvents();
            }
        });
    }

    const tbody = document.getElementById('studentAttendanceTableBody');
    const mobileList = document.getElementById('studentAttendanceMobileList');
    if (tbody) tbody.addEventListener('click', handleStudentAttendanceClick);
    if (mobileList) mobileList.addEventListener('click', handleStudentAttendanceClick);

    initAttendanceAnimations(document.getElementById('student-attendance-page') || document);
    await loadEvents();
}

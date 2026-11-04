import { StudentNavbar, initStudentNavbar } from '../../../components/Navbar/StudentNavbar.js';
import { protectStudentRoute } from '../../../middleware/StudentMiddleware.js';
import { getUserId, getUserData } from '../../../utils/jwt.js';
import * as EventTaskAPI from '../../../api/students/Task/EventTask.js';
import { showToast } from '../../../components/ToastMessage.js';
import { skeletonTableRows } from '../../../components/SkeletonLoading.js';
import { logStudentChange } from '../../../api/AuditLogs/StudentAuditLogs.js';
import { initAttendanceAnimations, animateDominoList } from '../../../provider/Animation/AttendanceAnimation.js';
import { openModal, closeModal, setModalButtonLoading } from '../../../utils/modal.js';
import { LABEL_CLASS, modalSection, modalDetailTile, applyModalDomino } from '../../../components/Modal/modalUi.js';

function skeletonStudentTaskCards(count = 3) {
    return Array.from({ length: count }, () => `
        <div class="evt-mobile-card rounded-2xl border border-line bg-white/90 p-4" style="backdrop-filter: blur(12px); -webkit-backdrop-filter: blur(12px);">
            <div class="flex items-center justify-between gap-3">
                <div class="space-y-2 flex-1">
                    <div class="h-4 w-32 skeleton-shimmer rounded"></div>
                    <div class="h-3 w-24 skeleton-shimmer rounded"></div>
                </div>
                <div class="h-6 w-20 skeleton-shimmer rounded-full"></div>
            </div>
            <div class="mt-4 space-y-2">
                <div class="h-4 w-48 skeleton-shimmer rounded"></div>
                <div class="h-3 w-full skeleton-shimmer rounded"></div>
            </div>
            <div class="mt-4 h-11 skeleton-shimmer rounded-xl"></div>
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

function studentTaskEventInfoMarkup({ title, organization, category, dateRange }) {
    return `
        <div class="inline-flex items-center gap-2 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-white/10 text-yellow border border-white/15 mb-2" id="studentEventCategory">${escapeEventText(category)}</div>
        <h2 class="text-lg sm:text-xl font-semibold tracking-tight break-words text-white" id="studentEventTitle">${escapeEventText(title)}</h2>
        <div class="flex flex-wrap items-center gap-x-3 gap-y-1.5 text-xs text-blue-100/90 mt-2">
            <span class="inline-flex items-center gap-1.5 min-w-0"><i data-lucide="building-2" class="w-3.5 h-3.5 text-yellow shrink-0"></i><span id="studentEventOrg" class="truncate">${escapeEventText(organization)}</span></span>
            <span class="inline-flex items-center gap-1.5 min-w-0"><i data-lucide="calendar" class="w-3.5 h-3.5 text-yellow shrink-0"></i><span id="studentEventDateRange" class="truncate">${escapeEventText(dateRange)}</span></span>
        </div>
    `;
}

let studentTasksListReady = false;

function finishStudentTasksRender(animate = true) {
    if (typeof lucide !== 'undefined') lucide.createIcons();
    const targets = document.querySelectorAll('#studentTasksMobileList .reveal, #studentTasksTableBody .reveal');

    if (!animate || studentTasksListReady) {
        targets.forEach((el) => el.classList.add('in'));
        studentTasksListReady = true;
        return;
    }

    const isMobile = window.matchMedia('(max-width: 767px)').matches;
    const list = document.getElementById('studentTasksMobileList');
    const panel = document.getElementById('studentTasksDesktopPanel');
    if (isMobile && list) animateDominoList(list);
    else if (!isMobile && panel) animateDominoList(panel);
    studentTasksListReady = true;
}

function setStudentTasksLoading(isLoading) {
    const tbody = document.getElementById('studentTasksTableBody');
    const mobileList = document.getElementById('studentTasksMobileList');
    const statsGrid = document.getElementById('studentTasksStatsGrid');
    const eventInfo = document.getElementById('studentEventInfoContent');
    const summaryCard = document.getElementById('studentEventSummaryCard');

    if (isLoading) {
        if (tbody) tbody.innerHTML = skeletonTableRows(3, 5, true);
        if (mobileList) mobileList.innerHTML = skeletonStudentTaskCards();
        if (eventInfo) eventInfo.innerHTML = skeletonEventInfo();
        summaryCard?.classList.remove('hidden');
        statsGrid?.classList.add('att-stats-loading');
    } else {
        statsGrid?.classList.remove('att-stats-loading');
    }
}

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

export function EventTask() {
    return `
        <div id="student-tasks-page" data-domino-page class="min-h-screen bg-surface font-sans text-ink pb-10">
            ${StudentNavbar()}
            <main class="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-5 sm:py-8">
                <header class="reveal mb-5 sm:mb-7" data-domino-enter>
                    <span class="inline-flex items-center gap-2 rounded-full border border-line bg-white px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-blue-600">
                        <span class="h-1.5 w-1.5 rounded-full bg-yellow"></span>
                        My assignments
                    </span>
                    <div class="mt-3 flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4">
                        <div class="min-w-0">
                            <h1 class="text-[1.65rem] sm:text-3xl font-semibold tracking-tight text-ink leading-tight">My Event Tasks</h1>
                            <p class="mt-1.5 max-w-2xl text-sm text-body">Track daily schedules and mark each day complete or not complete before time expires.</p>
                        </div>
                        <div class="flex flex-col sm:flex-row items-stretch sm:items-end gap-2.5 w-full lg:w-auto">
                            <div class="relative flex-1 lg:min-w-[280px]">
                                <label for="studentTaskEventSelect" class="block text-[11px] font-semibold uppercase tracking-[0.14em] text-muted mb-1.5">Event</label>
                                <select
                                    id="studentTaskEventSelect"
                                    class="w-full px-3.5 py-2.5 text-sm bg-white border border-line rounded-xl text-ink shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600">
                                    <option value="">Loading your tasks...</option>
                                </select>
                            </div>
                            <button
                                type="button"
                                id="refreshStudentTasksBtn"
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
                                <div id="studentTasksStatsGrid" class="att-stats-grid att-stats-grid--3 w-full xl:w-auto xl:min-w-[260px]">
                                    <div class="att-stat-cell">
                                        <div class="att-stat-label text-blue-100/80">Days</div>
                                        <div class="att-stat-value" id="statStudentTotalDays">0</div>
                                    </div>
                                    <div class="att-stat-cell">
                                        <div class="att-stat-label text-emerald-200/90">Done</div>
                                        <div class="att-stat-value text-emerald-300" id="statStudentCompletedDays">0</div>
                                    </div>
                                    <div class="att-stat-cell">
                                        <div class="att-stat-label text-yellow/90">Open</div>
                                        <div class="att-stat-value text-yellow" id="statStudentPendingDays">0</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                <section class="reveal" data-domino-enter>
                    <div class="mb-3 sm:mb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                        <div>
                            <h3 class="text-sm font-semibold text-ink tracking-tight">My daily task logs</h3>
                            <p class="text-xs text-muted mt-0.5">
                                Mark each day <span class="font-semibold text-success">Complete</span> or Not Complete before the schedule ends.
                            </p>
                        </div>
                        <div class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-medium bg-blue-50 text-blue-600 border border-blue-100 self-start">
                            <i data-lucide="calendar-check" class="w-3.5 h-3.5"></i>
                            <span>Recorded per day</span>
                        </div>
                    </div>

                    <div id="studentTasksDesktopPanel" class="hidden md:block">
                        <div class="bg-white border border-line rounded-2xl shadow-sm overflow-hidden">
                            <div class="overflow-x-auto">
                                <table class="w-full text-sm text-left">
                                    <thead>
                                        <tr class="bg-surface border-b border-line text-[11px] font-semibold text-muted uppercase tracking-[0.14em]">
                                            <th class="px-4 py-3.5 w-44">Schedule</th>
                                            <th class="px-4 py-3.5 min-w-[220px]">Task</th>
                                            <th class="px-4 py-3.5 text-center min-w-[160px]">Time</th>
                                            <th class="px-4 py-3.5 text-center w-36">Status</th>
                                            <th class="px-4 py-3.5 text-center min-w-[200px]">Mark</th>
                                        </tr>
                                    </thead>
                                    <tbody id="studentTasksTableBody" class="divide-y divide-line">
                                        ${skeletonTableRows(3, 5, true)}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>

                    <div id="studentTasksMobileList" class="md:hidden evt-day-rail space-y-3">
                        ${skeletonStudentTaskCards()}
                    </div>
                </section>
            </main>
        </div>
    `;
}

function getNowStrings() {
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, '0');
    const d = String(now.getDate()).padStart(2, '0');
    const hh = String(now.getHours()).padStart(2, '0');
    const mm = String(now.getMinutes()).padStart(2, '0');
    const ss = String(now.getSeconds()).padStart(2, '0');
    return {
        todayStr: `${y}-${m}-${d}`,
        currentTimeStr: `${hh}:${mm}:${ss}`
    };
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

function getStatusBadge(status) {
    const s = (status || 'pending').toLowerCase();
    const base = 'inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-md text-[10px] font-semibold border';
    if (s === 'completed') {
        return `<span class="${base} bg-emerald-50 text-emerald-800 border-emerald-200"><i data-lucide="check" class="w-3 h-3"></i> Done</span>`;
    }
    if (s === 'not_completed') {
        return `<span class="${base} bg-rose-50 text-rose-800 border-rose-200"><i data-lucide="x" class="w-3 h-3"></i> Missed</span>`;
    }
    if (s === 'not_finished') {
        return `<span class="${base} bg-orange-50 text-orange-800 border-orange-200"><i data-lucide="alert-triangle" class="w-3 h-3"></i> Open</span>`;
    }
    return `<span class="${base} bg-amber-50 text-amber-800 border-amber-200 font-medium"><i data-lucide="clock" class="w-3 h-3"></i> Pending</span>`;
}

function studentMarkActions({ scheduleId, status, taskTitleEscaped, dayNum, dateLabel = '', timeRange = '' }) {
    const isCompleted = status === 'completed';
    const isNotCompleted = status === 'not_completed';
    const seg = 'flex-1 min-w-0 px-2 py-1.5 text-[11px] font-semibold transition inline-flex items-center justify-center gap-1';
    const dateEscaped = String(dateLabel).replace(/'/g, "\\'");
    const timeEscaped = String(timeRange).replace(/'/g, "\\'");

    return `
        <div class="evt-mark-group inline-flex w-full max-w-[14rem] sm:max-w-none items-stretch rounded-lg border border-line bg-white overflow-hidden shadow-sm" role="group" aria-label="Mark day status">
            <button type="button" onclick="openStudentMarkDayModal(${scheduleId}, 'completed', '${taskTitleEscaped}', ${dayNum}, '${dateEscaped}', '${timeEscaped}')"
                class="${seg} ${isCompleted ? 'bg-emerald-600 text-white' : 'text-emerald-700 hover:bg-emerald-50'}"
                title="Mark Day ${dayNum} Complete">
                <i data-lucide="check" class="w-3.5 h-3.5 shrink-0"></i>
                <span class="truncate">Done</span>
            </button>
            <button type="button" onclick="openStudentMarkDayModal(${scheduleId}, 'not_completed', '${taskTitleEscaped}', ${dayNum}, '${dateEscaped}', '${timeEscaped}')"
                class="${seg} border-l border-line ${isNotCompleted ? 'bg-rose-600 text-white' : 'text-rose-700 hover:bg-rose-50'}"
                title="Mark Day ${dayNum} Not Complete">
                <i data-lucide="x" class="w-3.5 h-3.5 shrink-0"></i>
                <span class="truncate">Miss</span>
            </button>
        </div>
    `;
}

export async function initEventTask() {
    protectStudentRoute();
    await initStudentNavbar();
    initAttendanceAnimations(document.getElementById('student-tasks-page') || document);

    let allTasks = [];
    let eventsList = [];
    let selectedEventId = null;

    const eventSelect = document.getElementById('studentTaskEventSelect');
    const refreshBtn = document.getElementById('refreshStudentTasksBtn');

    async function auditStudentTaskAction(scheduleId, status, taskTitle) {
        try {
            const studentId = getUserId('student');
            const user = getUserData('student');
            const userName = user?.name || (user?.first_name ? `${user.first_name} ${user.last_name || ''}`.trim() : user?.username) || 'Student';

            await logStudentChange({
                user_id: studentId,
                user_type: 'student',
                user_name: userName,
                action: 'UPDATE',
                table_name: 'task_daily_schedules',
                record_id: scheduleId,
                field_name: 'day_schedule_status',
                old_value: 'Previous',
                new_value: status === 'completed' ? 'Completed' : 'Not Complete'
            }, 'student');
        } catch (error) {
            console.error('Audit log error for student task:', error);
        }
    }

    async function loadTasks() {
        setStudentTasksLoading(true);

        try {
            allTasks = await EventTaskAPI.getStudentTasks();
            rebuildEventsListFromTasks();

            if (eventsList.length === 0) {
                if (eventSelect) {
                    eventSelect.innerHTML = '<option value="">No task assignments found</option>';
                }
                document.getElementById('studentEventSummaryCard')?.classList.add('hidden');
                renderEmptyTable('no_tasks');
                return;
            }

            if (eventSelect) {
                eventSelect.innerHTML = eventsList.map(ev => `
                    <option value="${ev.id}">${ev.title} (${ev.organization_name})</option>
                `).join('');

                const stillExists = eventsList.some(ev => String(ev.id) === String(selectedEventId));
                if (!selectedEventId || !stillExists) {
                    selectedEventId = eventsList[0].id;
                }
                eventSelect.value = selectedEventId;
            }

            renderEventView(selectedEventId);
        } catch (error) {
            console.error('Error loading student tasks:', error);
            showToast('Failed to load tasks', 'error');
            renderEmptyTable('error');
        } finally {
            setStudentTasksLoading(false);
        }
    }

    function renderEventView(eventId) {
        const currentEvent = eventsList.find(e => String(e.id) === String(eventId));
        if (!currentEvent) {
            document.getElementById('studentEventSummaryCard')?.classList.add('hidden');
            renderEmptyTable('select_event');
            return;
        }

        const eventTasks = currentEvent.tasks || [];

        const allSchedules = [];
        eventTasks.forEach(task => {
            (task.daily_schedules || []).forEach(sch => {
                allSchedules.push({
                    task: task,
                    schedule: sch
                });
            });
        });

        allSchedules.sort((a, b) => {
            const dateCmp = a.schedule.schedule_date.localeCompare(b.schedule.schedule_date);
            if (dateCmp !== 0) return dateCmp;
            return (a.schedule.start_time || '').localeCompare(b.schedule.start_time || '');
        });

        renderSummaryCard(currentEvent, allSchedules);
        renderTable(allSchedules);
    }

    function renderSummaryCard(eventObj, schedulesList) {
        const card = document.getElementById('studentEventSummaryCard');
        const eventInfo = document.getElementById('studentEventInfoContent');
        if (!card || !eventInfo) return;

        card.classList.remove('hidden');

        let dateRangeStr = 'Flexible schedule';
        if (schedulesList.length > 0) {
            const firstDate = schedulesList[0].schedule.schedule_date;
            const lastDate = schedulesList[schedulesList.length - 1].schedule.schedule_date;
            const firstFormatted = formatDateDisplay(firstDate).formatted;
            const lastFormatted = formatDateDisplay(lastDate).formatted;
            dateRangeStr = firstDate === lastDate ? firstFormatted : `${firstFormatted} - ${lastFormatted}`;
        }

        eventInfo.innerHTML = studentTaskEventInfoMarkup({
            title: eventObj.title || 'Event Title',
            organization: eventObj.organization_name || 'Organization',
            category: eventObj.category || 'Event Task',
            dateRange: dateRangeStr
        });

        const totalDays = schedulesList.length;
        const completedDays = schedulesList.filter(s => (s.schedule.status || '').toLowerCase() === 'completed').length;
        const pendingDays = totalDays - completedDays;

        const setStat = (id, value) => {
            const el = document.getElementById(id);
            if (el) el.textContent = value;
        };
        setStat('statStudentTotalDays', totalDays);
        setStat('statStudentCompletedDays', completedDays);
        setStat('statStudentPendingDays', pendingDays);
        document.getElementById('studentTasksStatsGrid')?.classList.remove('att-stats-loading');

        if (typeof lucide !== 'undefined') lucide.createIcons();
    }

    function renderTable(schedulesList) {
        const tbody = document.getElementById('studentTasksTableBody');
        const mobileList = document.getElementById('studentTasksMobileList');
        if (!tbody && !mobileList) return;

        if (schedulesList.length === 0) {
            const block = emptyBlock('check-square', 'No daily tasks scheduled for this event', 'You have no pending day schedules at the moment.');
            if (tbody) tbody.innerHTML = `<tr data-domino-enter class="reveal"><td colspan="5">${block}</td></tr>`;
            if (mobileList) mobileList.innerHTML = `<article class="reveal rounded-2xl border border-line bg-white" data-domino-enter>${block}</article>`;
            finishStudentTasksRender();
            return;
        }

        const { todayStr, currentTimeStr } = getNowStrings();
        let rowsHtml = '';
        let cardsHtml = '';

        schedulesList.forEach((item, index) => {
            const { task, schedule } = item;
            const dateObj = formatDateDisplay(schedule.schedule_date);
            const isToday = schedule.schedule_date === todayStr;
            const isPast = schedule.schedule_date < todayStr;
            const isExpired = isPast || (isToday && schedule.end_time < currentTimeStr);

            const dayNum = schedule.day_number || (index + 1);
            const taskTitle = task.task_title || task.task_description || 'Assigned Task';
            const taskDesc = task.task_description || '';
            const timeRange = `${formatTime12(schedule.start_time)} - ${formatTime12(schedule.end_time)}`;
            const status = (schedule.status || 'pending').toLowerCase();
            const taskTitleEscaped = taskTitle.replace(/'/g, "\\'");

            const statusBadge = getStatusBadge(status);

            let metaBadge = '';
            if (schedule.marked_by === 'student') {
                metaBadge += `<span class="inline-flex items-center gap-0.5 px-1 py-0.5 rounded text-[9px] font-medium bg-blue-50 text-blue-600 border border-blue-100"><i data-lucide="user-check" class="w-2.5 h-2.5"></i> You</span>`;
            }
            if (schedule.is_voided == 1) {
                metaBadge += `<span class="inline-flex items-center gap-0.5 px-1 py-0.5 rounded text-[9px] font-medium bg-amber-50 text-amber-800 border border-amber-200"><i data-lucide="shield-alert" class="w-2.5 h-2.5"></i> Voided</span>`;
            }

            const dayBadge = isToday
                ? `<span class="inline-flex items-center gap-0.5 px-1 py-0.5 rounded text-[9px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200"><span class="w-1 h-1 rounded-full bg-emerald-500 animate-pulse"></span> Today</span>`
                : isPast
                    ? `<span class="inline-flex px-1 py-0.5 rounded text-[9px] font-medium bg-surface text-muted border border-line">Past</span>`
                    : `<span class="inline-flex px-1 py-0.5 rounded text-[9px] font-medium bg-blue-50 text-blue-600 border border-blue-100">Soon</span>`;

            const markControls = isExpired
                ? `<span class="text-[11px] text-orange-700 font-medium inline-flex items-center gap-1"><i data-lucide="clock-alert" class="w-3.5 h-3.5"></i> Expired</span>`
                : studentMarkActions({
                    scheduleId: schedule.id,
                    status,
                    taskTitleEscaped,
                    dayNum,
                    dateLabel: dateObj.formatted,
                    timeRange
                });

            rowsHtml += `
                <tr class="reveal hover:bg-surface/80 transition-colors ${isToday ? 'bg-blue-50/30' : ''}" data-domino-enter>
                    <td class="px-4 py-3.5">
                        <div class="flex items-center gap-1.5 flex-wrap">
                            <span class="px-1.5 py-0.5 rounded text-[10px] font-bold bg-blue-600 text-white">D${dayNum}</span>
                            <span class="text-sm font-semibold text-ink">${dateObj.formatted}</span>
                            ${dayBadge}
                        </div>
                        <div class="text-xs text-muted mt-1">${dateObj.dayName}</div>
                    </td>
                    <td class="px-4 py-3.5">
                        <p class="text-sm font-semibold text-ink">${taskTitle}</p>
                        ${taskDesc && taskDesc !== taskTitle ? `<p class="text-xs text-muted line-clamp-2 mt-0.5">${taskDesc}</p>` : ''}
                    </td>
                    <td class="px-4 py-3.5 text-center">
                        <span class="inline-flex items-center gap-1 text-xs text-body font-medium tabular-nums">
                            <i data-lucide="clock" class="w-3.5 h-3.5 text-muted"></i>
                            <span>${timeRange}</span>
                        </span>
                    </td>
                    <td class="px-4 py-3.5 text-center">
                        <div class="inline-flex flex-wrap items-center justify-center gap-1">
                            ${statusBadge}
                            ${metaBadge}
                        </div>
                    </td>
                    <td class="px-3 py-3 text-center">
                        <div class="flex justify-center">${markControls}</div>
                    </td>
                </tr>
            `;

            cardsHtml += `
                <article class="evt-mobile-card reveal rounded-2xl border ${isToday ? 'border-blue-600/30 ring-1 ring-blue-600/10' : 'border-line'} bg-white shadow-sm overflow-hidden" data-domino-enter>
                    <div class="p-3.5">
                        <div class="flex items-start justify-between gap-2">
                            <div class="min-w-0">
                                <div class="flex items-center gap-1.5 flex-wrap">
                                    <span class="inline-flex items-center justify-center h-6 min-w-[1.5rem] px-1 rounded-md bg-blue-600 text-white text-[10px] font-bold">D${dayNum}</span>
                                    ${dayBadge}
                                </div>
                                <h3 class="text-sm font-semibold text-ink mt-1.5">${dateObj.formatted}</h3>
                                <p class="text-[11px] text-muted mt-0.5">${dateObj.dayName} · ${timeRange}</p>
                            </div>
                            <div class="shrink-0 inline-flex flex-wrap items-center justify-end gap-1 max-w-[40%]">
                                ${statusBadge}
                                ${metaBadge}
                            </div>
                        </div>
                        <div class="mt-3 rounded-lg border border-line bg-surface/80 p-2.5">
                            <p class="text-sm font-semibold text-ink">${taskTitle}</p>
                            ${taskDesc && taskDesc !== taskTitle ? `<p class="text-xs text-muted mt-1 line-clamp-2">${taskDesc}</p>` : ''}
                        </div>
                    </div>
                    <div class="px-3 py-2.5 border-t border-line bg-surface/60 flex items-center justify-center">
                        ${markControls}
                    </div>
                </article>
            `;
        });

        if (tbody) tbody.innerHTML = rowsHtml;
        if (mobileList) mobileList.innerHTML = cardsHtml;
        finishStudentTasksRender();
    }

    function renderEmptyTable(type) {
        const tbody = document.getElementById('studentTasksTableBody');
        const mobileList = document.getElementById('studentTasksMobileList');

        let icon = 'check-square';
        let title = 'No Tasks Found';
        let subtitle = 'You have no assigned tasks at the moment.';

        if (type === 'select_event') {
            icon = 'calendar';
            title = 'Select an Event';
            subtitle = 'Choose an event from the dropdown above to view your task schedules.';
        } else if (type === 'error') {
            icon = 'alert-triangle';
            title = 'Error Loading Tasks';
            subtitle = 'Something went wrong while loading your tasks. Try refreshing.';
        } else if (type === 'no_tasks') {
            icon = 'clipboard-list';
            title = 'No Task Assignments';
            subtitle = 'You do not have any event task assignments yet.';
        }

        const block = emptyBlock(icon, title, subtitle);
        if (tbody) tbody.innerHTML = `<tr data-domino-enter class="reveal"><td colspan="5">${block}</td></tr>`;
        if (mobileList) mobileList.innerHTML = `<article class="reveal rounded-2xl border border-line bg-white" data-domino-enter>${block}</article>`;
        finishStudentTasksRender();
    }

    function rebuildEventsListFromTasks() {
        const eventsMap = new Map();
        (allTasks || []).forEach(t => {
            const eId = t.event_id || 0;
            if (!eventsMap.has(eId)) {
                eventsMap.set(eId, {
                    id: eId,
                    title: t.event_title || 'General Tasks',
                    organization_name: t.organization_name || 'Organization',
                    category: t.event_category || 'Event',
                    tasks: []
                });
            }
            eventsMap.get(eId).tasks.push(t);
        });
        eventsList = Array.from(eventsMap.values());
    }

    async function applyStudentMarkDay(scheduleId, status, taskTitle) {
        await EventTaskAPI.updateScheduleStatus(scheduleId, status);
        const statusLabel = status === 'completed' ? 'Complete' : 'Not Complete';
        showToast(`Day marked as ${statusLabel}`, 'success');

        let updated = false;
        (allTasks || []).forEach(task => {
            (task.daily_schedules || []).forEach(sch => {
                if (String(sch.id) === String(scheduleId)) {
                    sch.status = status;
                    updated = true;
                }
            });
        });

        if (updated) {
            rebuildEventsListFromTasks();
            renderEventView(selectedEventId);
        } else {
            await loadTasks();
        }

        auditStudentTaskAction(scheduleId, status, taskTitle).catch(() => {});
    }

    window.openStudentMarkDayModal = (scheduleId, status, taskTitle, dayNum, dateLabel = '', timeRange = '') => {
        const isDone = status === 'completed';
        const statusLabel = isDone ? 'Complete' : 'Not Complete';
        const confirmClass = isDone ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-rose-600 hover:bg-rose-700';
        const icon = isDone ? 'check-circle-2' : 'x-circle';
        const eventTitle = eventsList.find(e => String(e.id) === String(selectedEventId))?.title || 'Event';

        const content = `
            <div class="manage-modal-form space-y-4">
                ${modalSection('Day Context', `
                    <div class="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                        ${modalDetailTile('Event', eventTitle)}
                        ${modalDetailTile('Day', `Day ${dayNum}`)}
                        ${modalDetailTile('Date', dateLabel || '—')}
                        ${modalDetailTile('Time', timeRange || '—')}
                    </div>
                    <div class="mt-3 rounded-xl border border-line bg-surface px-3.5 py-3">
                        <p class="text-[10px] uppercase tracking-[0.12em] text-muted">Task</p>
                        <p class="text-sm font-semibold text-ink mt-1 break-words">${taskTitle}</p>
                    </div>
                `)}
                ${modalSection('Confirm Status', `
                    <div class="rounded-xl border ${isDone ? 'border-emerald-200 bg-emerald-50' : 'border-rose-200 bg-rose-50'} px-3.5 py-3.5 flex items-start gap-3">
                        <span class="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${isDone ? 'bg-emerald-600 text-white' : 'bg-rose-600 text-white'}">
                            <i data-lucide="${icon}" class="w-5 h-5"></i>
                        </span>
                        <div class="min-w-0">
                            <p class="${LABEL_CLASS} mb-1">Mark as ${statusLabel}</p>
                            <p class="text-sm text-body leading-relaxed">
                                ${isDone
                                    ? 'This day will be recorded as completed for your assignment.'
                                    : 'This day will be recorded as not completed for your assignment.'}
                            </p>
                        </div>
                    </div>
                `)}
                <div class="manage-modal-actions reveal flex flex-col-reverse sm:flex-row sm:justify-end gap-2" data-domino-enter>
                    <button type="button" onclick="closeModal()" class="w-full sm:w-auto px-4 py-2.5 text-sm font-medium text-ink bg-surface hover:bg-line rounded-xl transition">Cancel</button>
                    <button type="button" id="confirmStudentMarkDayBtn" class="w-full sm:w-auto px-5 py-2.5 text-sm font-medium text-white ${confirmClass} rounded-xl transition inline-flex items-center justify-center gap-1.5">
                        <i data-lucide="${isDone ? 'check' : 'x'}" class="w-4 h-4"></i>
                        Confirm ${statusLabel}
                    </button>
                </div>
            </div>
        `;

        openModal(`Mark Day ${dayNum}`, content, 'small');
        applyModalDomino();

        document.getElementById('confirmStudentMarkDayBtn')?.addEventListener('click', async () => {
            setModalButtonLoading('confirmStudentMarkDayBtn', true, `Confirm ${statusLabel}`);
            try {
                await applyStudentMarkDay(scheduleId, status, taskTitle);
                closeModal();
            } catch (error) {
                console.error('Error marking day schedule:', error);
                showToast(error.message || 'Failed to update schedule status', 'error');
                setModalButtonLoading('confirmStudentMarkDayBtn', false, `Confirm ${statusLabel}`);
            }
        });
    };

    window.studentMarkDaySchedule = async (scheduleId, status, taskTitle) => {
        try {
            await applyStudentMarkDay(scheduleId, status, taskTitle);
        } catch (error) {
            console.error('Error marking day schedule:', error);
            showToast(error.message || 'Failed to update schedule status', 'error');
        }
    };

    eventSelect?.addEventListener('change', (e) => {
        selectedEventId = e.target.value;
        renderEventView(selectedEventId);
    });

    refreshBtn?.addEventListener('click', async () => {
        await loadTasks();
        showToast('Tasks refreshed', 'info');
    });

    await loadTasks();
}

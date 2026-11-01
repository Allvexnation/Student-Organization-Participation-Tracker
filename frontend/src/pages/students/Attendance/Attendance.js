import { StudentNavbar, initStudentNavbar } from '../../../components/Navbar/StudentNavbar.js';
import { isAuthenticated } from '../../../utils/jwt.js';
import { navigate } from '../../../utils/navigation.js';
import * as StudentAttendanceAPI from '../../../api/students/Attendance/Attendance.js';
import { openModal, closeModal, setModalButtonLoading } from '../../../utils/modal.js';
import { showToast } from '../../../components/ToastMessage.js';
import { skeletonTableRows } from '../../../components/SkeletonLoading.js';

export function StudentAttendance() {
    return `
        ${StudentNavbar()}
        <main class="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <div class="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
                <div>
                    <h1 class="text-2xl font-semibold text-gray-900 flex items-center gap-2">
                        <i data-lucide="clipboard-check" class="w-7 h-7 text-blue-900"></i>
                        <span>My Event Attendance</span>
                    </h1>
                    <p class="text-sm text-gray-500 mt-1">
                        Log your daily event attendance (Time In/Out AM, Breaks, Time In/Out PM) or submit excuse requests.
                    </p>
                </div>
                <div class="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                    <div class="relative min-w-[240px] sm:min-w-[280px]">
                        <label for="studentEventSelect" class="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Select Event</label>
                        <select 
                            id="studentEventSelect" 
                            class="w-full px-3.5 py-2.5 text-sm bg-white border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-blue-600">
                            <option value="">Loading your events...</option>
                        </select>
                    </div>
                    <div class="self-end pt-5 sm:pt-0">
                        <button 
                            type="button" 
                            id="refreshStudentAttendanceBtn" 
                            title="Refresh Data"
                            class="px-3.5 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm transition flex items-center gap-1.5">
                            <i data-lucide="refresh-cw" class="w-4 h-4"></i>
                            <span class="hidden sm:inline">Refresh</span>
                        </button>
                    </div>
                </div>
            </div>

            <div id="studentEventSummaryCard" class="hidden mb-6 bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 text-white rounded-xl shadow-md p-5 transition-all">
                <div class="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div>
                        <div class="inline-flex items-center gap-2 px-2.5 py-1 rounded-full text-xs font-medium bg-blue-800 text-blue-100 mb-2" id="studentEventCategory">
                            Category
                        </div>
                        <h2 class="text-xl font-bold" id="studentEventTitle">-</h2>
                        <div class="flex flex-wrap items-center gap-4 text-xs text-blue-200 mt-2">
                            <span class="flex items-center gap-1">
                                <i data-lucide="building-2" class="w-3.5 h-3.5 text-blue-300"></i>
                                <span id="studentEventOrg">-</span>
                            </span>
                            <span class="flex items-center gap-1">
                                <i data-lucide="user-check" class="w-3.5 h-3.5 text-blue-300"></i>
                                <span>Adviser: <span id="studentEventAdviser">-</span></span>
                            </span>
                            <span class="flex items-center gap-1">
                                <i data-lucide="calendar" class="w-3.5 h-3.5 text-blue-300"></i>
                                <span id="studentEventDateRange">-</span>
                            </span>
                            <span class="flex items-center gap-1">
                                <i data-lucide="map-pin" class="w-3.5 h-3.5 text-blue-300"></i>
                                <span id="studentEventVenue">-</span>
                            </span>
                        </div>
                    </div>

                    <div class="grid grid-cols-3 gap-3 bg-white/10 backdrop-blur-sm rounded-lg p-3 border border-white/10">
                        <div class="text-center px-2">
                            <div class="text-xs text-blue-200">Total Days</div>
                            <div class="text-lg font-bold text-white" id="statStudentTotalDays">0</div>
                        </div>
                        <div class="text-center px-2 border-l border-white/10">
                            <div class="text-xs text-green-300">Completed</div>
                            <div class="text-lg font-bold text-green-300" id="statStudentCompletedDays">0</div>
                        </div>
                        <div class="text-center px-2 border-l border-white/10">
                            <div class="text-xs text-blue-200">Duration</div>
                            <div class="text-lg font-bold text-blue-100" id="statStudentTotalDuration">0h 0m</div>
                        </div>
                    </div>
                </div>
            </div>

            <div class="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
                <div class="px-5 py-4 border-b border-gray-200 bg-gray-50 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                    <div>
                        <h3 class="text-sm font-semibold text-gray-800 uppercase tracking-wider">My Daily Attendance Logs</h3>
                        <p class="text-xs text-gray-500 mt-0.5">
                            Status automatically becomes <span class="font-semibold text-green-700">Completed</span> when both AM and PM sessions are timed in & out.
                        </p>
                    </div>
                    <div class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-blue-50 text-blue-800 border border-blue-200 self-start sm:self-auto">
                        <i data-lucide="info" class="w-3.5 h-3.5 text-blue-700"></i>
                        <span>Sessions are only enabled on the current day</span>
                    </div>
                </div>

                <div class="overflow-x-auto">
                    <table class="w-full text-sm text-left">
                        <thead>
                            <tr class="bg-gray-100 border-b border-gray-200 text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                <th class="px-4 py-3.5 w-44">Schedule Date</th>
                                <th class="px-4 py-3.5 text-center min-w-[180px]">AM Session</th>
                                <th class="px-4 py-3.5 text-center min-w-[180px]">Break Session</th>
                                <th class="px-4 py-3.5 text-center min-w-[180px]">PM Session</th>
                                <th class="px-4 py-3.5 text-center w-32">Duration</th>
                                <th class="px-4 py-3.5 text-center w-36">Status</th>
                                <th class="px-4 py-3.5 text-center w-32">Excuse</th>
                            </tr>
                        </thead>
                        <tbody id="studentAttendanceTableBody" class="divide-y divide-gray-100">
                            ${skeletonTableRows(3, 7, true)}
                        </tbody>
                    </table>
                </div>
            </div>
        </main>
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
    if (s === 'completed' || s.includes('completed')) {
        return `<span class="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-800 border border-green-200">
            <i data-lucide="check-circle" class="w-3.5 h-3.5"></i> ${status}
        </span>`;
    }
    if (s.includes('pending excuse')) {
        return `<span title="Awaiting adviser review" class="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 border border-amber-200">
            <i data-lucide="clock" class="w-3.5 h-3.5"></i> Pending Excuse
        </span>`;
    }
    if (s.includes('absent')) {
        return `<span class="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-800 border border-red-200">
            <i data-lucide="x-circle" class="w-3.5 h-3.5"></i> ${status}
        </span>`;
    }
    if (s.includes('excused')) {
        const titleAttr = excuseReason ? `title="Reason: ${excuseReason.replace(/"/g, '&quot;')}"` : '';
        return `<span ${titleAttr} class="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-purple-100 text-purple-800 border border-purple-200">
            <i data-lucide="file-check" class="w-3.5 h-3.5"></i> ${status}
        </span>`;
    }
    if (s === 'in progress') {
        return `<span class="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 border border-amber-200">
            <i data-lucide="clock" class="w-3.5 h-3.5"></i> In Progress
        </span>`;
    }
    return `<span class="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600 border border-gray-200">
        <i data-lucide="minus-circle" class="w-3.5 h-3.5"></i> Pending
    </span>`;
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
            document.getElementById('studentEventSummaryCard')?.classList.add('hidden');
            renderEmpty('select_event');
            return;
        }

        const tbody = document.getElementById('studentAttendanceTableBody');
        if (tbody) {
            tbody.innerHTML = skeletonTableRows(3, 7, true);
        }

        try {
            selectedEvent = events.find(e => String(e.id) === String(eventId)) || null;

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

    function renderSummary() {
        const card = document.getElementById('studentEventSummaryCard');
        if (!card || !selectedEvent) return;

        card.classList.remove('hidden');

        document.getElementById('studentEventTitle').textContent = selectedEvent.title || 'Event Title';
        document.getElementById('studentEventOrg').textContent = selectedEvent.organization_name || 'Organization';
        document.getElementById('studentEventAdviser').textContent = selectedEvent.adviser_name || 'Adviser';
        document.getElementById('studentEventCategory').textContent = selectedEvent.event_category || 'Event';
        document.getElementById('studentEventVenue').textContent = selectedEvent.venue || 'No venue specified';

        const start = selectedEvent.event_day_start ? formatDateDisplay(selectedEvent.event_day_start).formatted : '';
        const end = selectedEvent.event_day_end ? formatDateDisplay(selectedEvent.event_day_end).formatted : '';
        document.getElementById('studentEventDateRange').textContent = (start && end) ? `${start} - ${end}` : (start || 'Flexible schedule');

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

        document.getElementById('statStudentTotalDays').textContent = schedules.length;
        document.getElementById('statStudentCompletedDays').textContent = completed;
        document.getElementById('statStudentTotalDuration').textContent = formatDuration(totalMinutes);

        if (typeof lucide !== 'undefined') {
            lucide.createIcons();
        }
    }

    function renderTable() {
        const tbody = document.getElementById('studentAttendanceTableBody');
        if (!tbody) return;

        if (!selectedEvent) {
            renderEmpty('select_event');
            return;
        }

        const schedules = selectedEvent.daily_schedules || [];
        if (schedules.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="7" class="px-5 py-12 text-center text-gray-500">
                        <div class="flex flex-col items-center justify-center">
                            <i data-lucide="calendar-x" class="w-10 h-10 text-gray-400 mb-2"></i>
                            <p class="font-medium text-gray-700">No scheduled dates found for this event</p>
                        </div>
                    </td>
                </tr>
            `;
            if (typeof lucide !== 'undefined') lucide.createIcons();
            return;
        }

        const attMap = {};
        attendanceRecords.forEach(r => {
            attMap[r.schedule_date] = r;
        });

        const todayStr = getTodayLocalDate();
        let rowsHtml = '';

        schedules.forEach((sched, index) => {
            const dateStr = sched.schedule_date;
            const dateInfo = formatDateDisplay(dateStr);
            const att = attMap[dateStr] || null;

            const isToday = (dateStr === todayStr);
            const isPast = (dateStr < todayStr);
            const isUpcoming = (dateStr > todayStr);

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

            rowsHtml += `
                <tr class="hover:bg-blue-50/40 transition-colors ${isToday ? 'bg-blue-50/20' : ''}">
                    <td class="px-4 py-4 align-top">
                        <div class="font-semibold text-gray-900">${dateInfo.formatted}</div>
                        <div class="text-xs text-blue-700 font-medium">Day ${index + 1} (${dateInfo.dayName})</div>
                        ${sched.start_time && sched.end_time ? `
                            <div class="text-[11px] text-gray-400 mt-0.5">${formatTime12(sched.start_time)} - ${formatTime12(sched.end_time)}</div>
                        ` : ''}
                        <div class="mt-1">
                            ${isToday ? `
                                <span class="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-green-100 text-green-800 border border-green-200">
                                    <span class="w-1.5 h-1.5 rounded-full bg-green-600 animate-pulse"></span> Today
                                </span>
                            ` : isPast ? `
                                <span class="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium bg-gray-100 text-gray-500">
                                    Past
                                </span>
                            ` : `
                                <span class="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium bg-blue-50 text-blue-600">
                                    Upcoming
                                </span>
                            `}
                        </div>
                    </td>

                    <td class="px-3 py-2.5 align-middle text-center">
                        <div class="bg-gray-50 rounded-lg p-2 border border-gray-100 flex flex-col gap-1">
                            <div class="flex items-center justify-between text-xs">
                                <span class="text-[11px] text-gray-500 font-medium">In:</span>
                                ${timeInAm ? `
                                    <span class="font-semibold text-gray-900 bg-white px-2 py-0.5 rounded border border-gray-200 text-xs shadow-xs">${timeInAm}</span>
                                ` : `
                                    <button 
                                        type="button" 
                                        data-action="student-log" 
                                        data-date="${dateStr}" 
                                        data-type="time_in_am" 
                                        ${disableLog || isAmLocked ? `disabled title="${!isToday ? disabledLogTitle : 'AM session is locked (excused/absent)'}"` : 'title="Record Time In (AM)"'}
                                        class="px-2 py-0.5 text-[11px] font-medium text-blue-800 bg-blue-50 hover:bg-blue-100 disabled:opacity-40 disabled:cursor-not-allowed disabled:bg-gray-100 disabled:text-gray-400 disabled:border-gray-200 rounded border border-blue-200 transition">
                                        + Time In
                                    </button>
                                `}
                            </div>
                            <div class="flex items-center justify-between text-xs">
                                <span class="text-[11px] text-gray-500 font-medium">Out:</span>
                                ${timeOutAm ? `
                                    <span class="font-semibold text-gray-900 bg-white px-2 py-0.5 rounded border border-gray-200 text-xs shadow-xs">${timeOutAm}</span>
                                ` : `
                                    <button 
                                        type="button" 
                                        data-action="student-log" 
                                        data-date="${dateStr}" 
                                        data-type="time_out_am" 
                                        ${disableLog || isAmLocked || !canTimeOutAm ? `disabled title="${!isToday ? disabledLogTitle : !canTimeOutAm ? 'Time In AM must be recorded first' : 'AM session is locked (excused/absent)'}"` : 'title="Record Time Out (AM)"'}
                                        class="px-2 py-0.5 text-[11px] font-medium text-blue-800 bg-blue-50 hover:bg-blue-100 disabled:opacity-40 disabled:cursor-not-allowed disabled:bg-gray-100 disabled:text-gray-400 disabled:border-gray-200 rounded border border-blue-200 transition">
                                        + Time Out
                                    </button>
                                `}
                            </div>
                        </div>
                    </td>

                    <td class="px-3 py-2.5 align-middle text-center">
                        <div class="bg-amber-50/50 rounded-lg p-2 border border-amber-100 flex flex-col gap-1">
                            <div class="flex items-center justify-between text-xs">
                                <span class="text-[11px] text-amber-800 font-medium">Out:</span>
                                ${breakOut ? `
                                    <span class="font-semibold text-gray-900 bg-white px-2 py-0.5 rounded border border-amber-200 text-xs shadow-xs">${breakOut}</span>
                                ` : `
                                    <button 
                                        type="button" 
                                        data-action="student-log" 
                                        data-date="${dateStr}" 
                                        data-type="break_out" 
                                        ${disableLog || isBreakLocked || !canBreakOut ? `disabled title="${!isToday ? disabledLogTitle : !canBreakOut ? 'Time In AM must be recorded first' : 'Break session is locked (excused/absent)'}"` : 'title="Record Break Out"'}
                                        class="px-2 py-0.5 text-[11px] font-medium text-amber-900 bg-amber-100/70 hover:bg-amber-100 disabled:opacity-40 disabled:cursor-not-allowed disabled:bg-gray-100 disabled:text-gray-400 disabled:border-gray-200 rounded border border-amber-200 transition">
                                        + Break Out
                                    </button>
                                `}
                            </div>
                            <div class="flex items-center justify-between text-xs">
                                <span class="text-[11px] text-amber-800 font-medium">In:</span>
                                ${breakIn ? `
                                    <span class="font-semibold text-gray-900 bg-white px-2 py-0.5 rounded border border-amber-200 text-xs shadow-xs">${breakIn}</span>
                                ` : `
                                    <button 
                                        type="button" 
                                        data-action="student-log" 
                                        data-date="${dateStr}" 
                                        data-type="break_in" 
                                        ${disableLog || isBreakLocked || !canBreakIn ? `disabled title="${!isToday ? disabledLogTitle : !canBreakIn ? 'Break Out must be recorded first' : 'Break session is locked (excused/absent)'}"` : 'title="Record Break In"'}
                                        class="px-2 py-0.5 text-[11px] font-medium text-amber-900 bg-amber-100/70 hover:bg-amber-100 disabled:opacity-40 disabled:cursor-not-allowed disabled:bg-gray-100 disabled:text-gray-400 disabled:border-gray-200 rounded border border-amber-200 transition">
                                        + Break In
                                    </button>
                                `}
                            </div>
                        </div>
                    </td>

                    <td class="px-3 py-2.5 align-middle text-center">
                        <div class="bg-gray-50 rounded-lg p-2 border border-gray-100 flex flex-col gap-1">
                            <div class="flex items-center justify-between text-xs">
                                <span class="text-[11px] text-gray-500 font-medium">In:</span>
                                ${timeInPm ? `
                                    <span class="font-semibold text-gray-900 bg-white px-2 py-0.5 rounded border border-gray-200 text-xs shadow-xs">${timeInPm}</span>
                                ` : `
                                    <button 
                                        type="button" 
                                        data-action="student-log" 
                                        data-date="${dateStr}" 
                                        data-type="time_in_pm" 
                                        ${disableLog || isPmLocked || !canTimeInPm ? `disabled title="${!isToday ? disabledLogTitle : !canTimeInPm ? 'Break In must be recorded first' : 'PM session is locked (excused/absent)'}"` : 'title="Record Time In (PM)"'}
                                        class="px-2 py-0.5 text-[11px] font-medium text-blue-800 bg-blue-50 hover:bg-blue-100 disabled:opacity-40 disabled:cursor-not-allowed disabled:bg-gray-100 disabled:text-gray-400 disabled:border-gray-200 rounded border border-blue-200 transition">
                                        + Time In
                                    </button>
                                `}
                            </div>
                            <div class="flex items-center justify-between text-xs">
                                <span class="text-[11px] text-gray-500 font-medium">Out:</span>
                                ${timeOutPm ? `
                                    <span class="font-semibold text-gray-900 bg-white px-2 py-0.5 rounded border border-gray-200 text-xs shadow-xs">${timeOutPm}</span>
                                ` : `
                                    <button 
                                        type="button" 
                                        data-action="student-log" 
                                        data-date="${dateStr}" 
                                        data-type="time_out_pm" 
                                        ${disableLog || isPmLocked || !canTimeOutPm ? `disabled title="${!isToday ? disabledLogTitle : !canTimeOutPm ? 'Time In PM must be recorded first' : 'PM session is locked (excused/absent)'}"` : 'title="Record Time Out (PM)"'}
                                        class="px-2 py-0.5 text-[11px] font-medium text-blue-800 bg-blue-50 hover:bg-blue-100 disabled:opacity-40 disabled:cursor-not-allowed disabled:bg-gray-100 disabled:text-gray-400 disabled:border-gray-200 rounded border border-blue-200 transition">
                                        + Time Out
                                    </button>
                                `}
                            </div>
                        </div>
                    </td>

                    <td class="px-4 py-4 align-middle text-center">
                        <div class="text-xs font-semibold text-gray-800">${durationFormatted}</div>
                    </td>

                    <td class="px-4 py-4 align-middle text-center">
                        ${getStatusBadge(status, att?.excuse_reason)}
                        ${isPendingExcuse ? `
                            <div class="text-[10px] text-amber-700 mt-1 italic">Awaiting adviser approval</div>
                        ` : ''}
                        ${isExcused && att?.excuse_reason ? `
                            <div class="text-[11px] text-purple-700 mt-0.5 max-w-[130px] truncate mx-auto" title="${att.excuse_reason}">
                                "${att.excuse_reason}"
                            </div>
                        ` : ''}
                    </td>

                    <td class="px-4 py-4 align-middle text-center">
                        ${isPendingExcuse ? `
                            <span class="text-xs text-amber-800 font-medium">Submitted</span>
                        ` : isExcused ? `
                            <span class="text-xs text-purple-800 font-medium">Approved</span>
                        ` : `
                            <button 
                                type="button" 
                                data-action="student-excuse" 
                                data-date="${dateStr}" 
                                ${!isToday ? 'disabled title="Actions are only available on the current day"' : 'title="Submit an excuse request for this date"'}
                                class="px-2.5 py-1.5 text-xs font-medium text-purple-700 bg-purple-50 hover:bg-purple-100 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-purple-50 border border-purple-200 rounded-md transition flex items-center gap-1 mx-auto">
                                <i data-lucide="file-text" class="w-3.5 h-3.5"></i>
                                <span>Request Excuse</span>
                            </button>
                        `}
                    </td>
                </tr>
            `;
        });

        tbody.innerHTML = rowsHtml;

        if (typeof lucide !== 'undefined') {
            lucide.createIcons();
        }
    }

    function renderEmpty(type) {
        const tbody = document.getElementById('studentAttendanceTableBody');
        if (!tbody) return;

        let icon = 'calendar';
        let title = 'No data';
        let subtitle = '';

        if (type === 'no_events') {
            icon = 'calendar-x';
            title = 'No Events Found';
            subtitle = 'You are not currently registered for any events. Please register for events or join an active organization.';
        } else if (type === 'select_event') {
            icon = 'clipboard-check';
            title = 'Select an Event';
            subtitle = 'Please select an event from the dropdown above to view your schedule and log attendance.';
        } else if (type === 'error') {
            icon = 'alert-triangle';
            title = 'Error Loading Attendance';
            subtitle = 'An error occurred while loading your attendance. Please try refreshing.';
        } else {
            icon = 'info';
            title = 'No Records Found';
            subtitle = 'No attendance data found.';
        }

        tbody.innerHTML = `
            <tr>
                <td colspan="7" class="px-5 py-16 text-center text-gray-500">
                    <div class="flex flex-col items-center justify-center">
                        <div class="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mb-3">
                            <i data-lucide="${icon}" class="w-6 h-6 text-gray-400"></i>
                        </div>
                        <p class="font-medium text-gray-800 text-sm">${title}</p>
                        <p class="text-xs text-gray-500 mt-1 max-w-sm">${subtitle}</p>
                    </div>
                </td>
            </tr>
        `;

        if (typeof lucide !== 'undefined') {
            lucide.createIcons();
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
            <div class="space-y-4">
                <div class="bg-blue-50 border border-blue-100 rounded-lg p-3 text-xs text-blue-900 space-y-1">
                    <div><strong>Event:</strong> ${selectedEvent.title}</div>
                    <div><strong>Date:</strong> ${formatDateDisplay(dateStr).formatted}</div>
                    <div><strong>Session:</strong> ${label}</div>
                </div>

                <div>
                    <label for="studentModalTimeInput" class="block text-sm font-medium text-gray-700 mb-1">Current System Time</label>
                    <input 
                        type="time" 
                        id="studentModalTimeInput" 
                        value="${currentTimeStr}" 
                        class="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-600 focus:border-blue-600">
                    <p class="text-xs text-gray-500 mt-1">This will record your time log for this session.</p>
                </div>

                <div class="flex items-center justify-end gap-2 pt-3 border-t border-gray-100">
                    <button 
                        type="button" 
                        onclick="closeModal()" 
                        class="px-3.5 py-2 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition">
                        Cancel
                    </button>
                    <button 
                        type="button" 
                        id="confirmStudentLogBtn" 
                        class="px-4 py-2 text-xs font-medium text-white bg-blue-900 hover:bg-blue-800 rounded-md shadow-sm transition">
                        Confirm ${label}
                    </button>
                </div>
            </div>
        `;

        openModal(`Record ${label}`, content, 'small');

        const confirmBtn = document.getElementById('confirmStudentLogBtn');
        if (confirmBtn) {
            confirmBtn.addEventListener('click', async () => {
                const timeVal = document.getElementById('studentModalTimeInput').value;
                setModalButtonLoading('confirmStudentLogBtn', true, 'Confirm');
                try {
                    await StudentAttendanceAPI.logStudentAttendanceTime({
                        event_id: selectedEvent.id,
                        organization_id: selectedEvent.organization_id,
                        adviser_id: selectedEvent.adviser_id,
                        schedule_date: dateStr,
                        log_type: logType,
                        time_value: timeVal ? `${timeVal}:00` : null
                    });
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
            sessionOptions = `
                <label class="flex items-center justify-center p-2 rounded-lg border border-gray-200 hover:bg-gray-50 cursor-pointer text-xs font-medium">
                    <input type="radio" name="studentExcuseSession" value="BOTH" checked class="mr-1.5 text-purple-600 focus:ring-purple-500">
                    Whole Day
                </label>
            `;
        }
        if (amAvailable) {
            sessionOptions += `
                <label class="flex items-center justify-center p-2 rounded-lg border border-gray-200 hover:bg-gray-50 cursor-pointer text-xs font-medium">
                    <input type="radio" name="studentExcuseSession" value="AM" ${!bothAvailable ? 'checked' : ''} class="mr-1.5 text-purple-600 focus:ring-purple-500">
                    AM Only
                </label>
            `;
        }
        if (pmAvailable) {
            sessionOptions += `
                <label class="flex items-center justify-center p-2 rounded-lg border border-gray-200 hover:bg-gray-50 cursor-pointer text-xs font-medium">
                    <input type="radio" name="studentExcuseSession" value="PM" ${!bothAvailable && !amAvailable ? 'checked' : ''} class="mr-1.5 text-purple-600 focus:ring-purple-500">
                    PM Only
                </label>
            `;
        }

        const content = `
            <div class="space-y-4">
                <div class="bg-purple-50 border border-purple-100 rounded-lg p-3 text-xs text-purple-900 space-y-1">
                    <div><strong>Event:</strong> ${selectedEvent.title}</div>
                    <div><strong>Date:</strong> ${formatDateDisplay(dateStr).formatted}</div>
                    <div class="text-[11px] text-purple-700 italic">Note: Your excuse request must be approved by your adviser.</div>
                </div>

                ${!amAvailable || !pmAvailable ? `
                    <div class="p-2.5 bg-amber-50/70 border border-amber-200 rounded-lg text-xs text-amber-800 flex items-start gap-1.5">
                        <i data-lucide="alert-circle" class="w-4 h-4 text-amber-600 shrink-0 mt-0.5"></i>
                        <span>
                            ${!amAvailable && !pmAvailable ? 'Both sessions are already excused/absent. Reset status first.' : 
                              !amAvailable ? 'AM session is already excused/absent. Only PM is available.' : 
                              'PM session is already excused/absent. Only AM is available.'}
                        </span>
                    </div>
                ` : ''}

                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">Applicable Session</label>
                    <div class="grid grid-cols-3 gap-2">
                        ${sessionOptions}
                    </div>
                </div>

                <div>
                    <label for="studentExcuseReasonInput" class="block text-sm font-medium text-gray-700 mb-1">
                        Reason for Excuse <span class="text-red-500">*</span>
                    </label>
                    <textarea 
                        id="studentExcuseReasonInput" 
                        rows="3" 
                        placeholder="Provide clear reason (e.g. medical illness with certificate, academic contest, urgent family emergency)..." 
                        class="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-600 focus:border-purple-600 transition resize-none"></textarea>
                    <p id="studentExcuseError" class="text-xs text-red-500 mt-1 hidden">Reason is required</p>
                </div>

                <div class="flex items-center justify-end gap-2 pt-3 border-t border-gray-100">
                    <button 
                        type="button" 
                        onclick="closeModal()" 
                        class="px-3.5 py-2 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition">
                        Cancel
                    </button>
                    <button 
                        type="button" 
                        id="confirmStudentExcuseBtn" 
                        class="px-4 py-2 text-xs font-medium text-white bg-purple-700 hover:bg-purple-800 rounded-md shadow-sm transition">
                        Submit for Approval
                    </button>
                </div>
            </div>
        `;

        openModal('Submit Excuse Request', content, 'small');

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
                    await StudentAttendanceAPI.submitStudentExcuse({
                        event_id: selectedEvent.id,
                        organization_id: selectedEvent.organization_id,
                        adviser_id: selectedEvent.adviser_id,
                        schedule_date: dateStr,
                        reason: reasonVal,
                        session: sessionVal
                    });
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
    if (tbody) {
        tbody.addEventListener('click', (e) => {
            const btn = e.target.closest('button');
            if (!btn) return;

            const action = btn.getAttribute('data-action');
            const dateStr = btn.getAttribute('data-date');

            if (action === 'student-log') {
                const logType = btn.getAttribute('data-type');
                openLogTimeModal(dateStr, logType);
            } else if (action === 'student-excuse') {
                openStudentExcuseModal(dateStr);
            }
        });
    }

    await loadEvents();
}

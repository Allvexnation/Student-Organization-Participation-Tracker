import { AdviserNavbar, initAdviserNavbar } from '../../../components/Navbar/AdviserNavbar.js';
import { isAuthenticated } from '../../../utils/jwt.js';
import { navigate } from '../../../utils/navigation.js';
import * as AttendanceAPI from '../../../api/adviser/Attendance/Attendance.js';
import { openModal, closeModal, setModalButtonLoading } from '../../../utils/modal.js';
import { openConfirmDialog } from '../../../components/Dialog/ConfirmDialog.js';
import { showToast } from '../../../components/ToastMessage.js';
import { skeletonTableRows } from '../../../components/SkeletonLoading.js';

export function Attendance() {
    return `
        ${AdviserNavbar()}
        <main class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <div class="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
                <div>
                    <h1 class="text-2xl font-semibold text-gray-900 flex items-center gap-2">
                        <i data-lucide="clipboard-check" class="w-7 h-7 text-blue-900"></i>
                        <span>Student Attendance Tracker</span>
                    </h1>
                    <p class="text-sm text-gray-500 mt-1">
                        Track each student's daily attendance: Time In/Out (AM), Break In/Out, and Time In/Out (PM).
                    </p>
                </div>
                <div class="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                    <div class="relative min-w-[240px] sm:min-w-[280px]">
                        <label for="eventSelect" class="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Select Event</label>
                        <select 
                            id="eventSelect" 
                            class="w-full px-3.5 py-2.5 text-sm bg-white border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-blue-600">
                            <option value="">Loading events...</option>
                        </select>
                    </div>
                    <div class="self-end pt-5 sm:pt-0">
                        <button 
                            type="button" 
                            id="refreshAttendanceBtn" 
                            title="Refresh Data"
                            class="px-3.5 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm transition flex items-center gap-1.5">
                            <i data-lucide="refresh-cw" class="w-4 h-4"></i>
                            <span class="hidden sm:inline">Refresh</span>
                        </button>
                    </div>
                </div>
            </div>

            <div id="eventSummaryCard" class="hidden mb-6 bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 text-white rounded-xl shadow-md p-5 transition-all">
                <div class="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div>
                        <div class="inline-flex items-center gap-2 px-2.5 py-1 rounded-full text-xs font-medium bg-blue-800 text-blue-100 mb-2" id="eventCategoryBadge">
                            Category
                        </div>
                        <h2 class="text-xl font-bold" id="eventTitleDisplay">-</h2>
                        <div class="flex flex-wrap items-center gap-4 text-xs text-blue-200 mt-2">
                            <span class="flex items-center gap-1">
                                <i data-lucide="building-2" class="w-3.5 h-3.5 text-blue-300"></i>
                                <span id="eventOrgDisplay">-</span>
                            </span>
                            <span class="flex items-center gap-1">
                                <i data-lucide="calendar" class="w-3.5 h-3.5 text-blue-300"></i>
                                <span id="eventDateRangeDisplay">-</span>
                            </span>
                            <span class="flex items-center gap-1">
                                <i data-lucide="map-pin" class="w-3.5 h-3.5 text-blue-300"></i>
                                <span id="eventVenueDisplay">-</span>
                            </span>
                        </div>
                    </div>

                    <div class="grid grid-cols-2 sm:grid-cols-5 gap-2.5 bg-white/10 backdrop-blur-sm rounded-lg p-3 border border-white/10">
                        <div class="text-center px-2">
                            <div class="text-xs text-blue-200">Registered Students</div>
                            <div class="text-lg font-bold text-white" id="statTotalStudents">0</div>
                        </div>
                        <div class="text-center px-2 border-l border-white/10">
                            <div class="text-xs text-green-300">Completed</div>
                            <div class="text-lg font-bold text-green-300" id="statCompleted">0</div>
                        </div>
                        <div class="text-center px-2 border-l border-white/10">
                            <div class="text-xs text-yellow-300">In Progress</div>
                            <div class="text-lg font-bold text-yellow-300" id="statInProgress">0</div>
                        </div>
                        <div class="text-center px-2 border-l border-white/10">
                            <div class="text-xs text-red-300">Absent / Excused</div>
                            <div class="text-lg font-bold text-red-200" id="statAbsentExcused">0</div>
                        </div>
                        <div class="text-center px-2 border-l border-white/10">
                            <div class="text-xs text-amber-300">Pending Excuses</div>
                            <div class="text-lg font-bold text-amber-300" id="statPendingExcuses">0</div>
                        </div>
                    </div>
                </div>
            </div>

            <div id="scheduleDaysContainer" class="hidden mb-4 bg-white border border-gray-200 rounded-xl p-3 shadow-sm">
                <div class="flex items-center justify-between gap-3 mb-2">
                    <span class="text-xs font-semibold text-gray-500 uppercase tracking-wider flex items-center gap-1.5">
                        <i data-lucide="calendar-days" class="w-4 h-4 text-blue-900"></i>
                        <span>Select Event Day</span>
                    </span>
                    <span class="text-xs text-gray-400" id="selectedDayInfoText"></span>
                </div>
                <div id="scheduleDaysList" class="flex flex-wrap gap-2">
                </div>
            </div>

            <div class="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
                <div class="px-5 py-4 border-b border-gray-200 bg-gray-50 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <div>
                        <h3 class="text-sm font-semibold text-gray-800 uppercase tracking-wider flex items-center gap-1.5">
                            <span id="tableDayTitle">Student Attendance</span>
                        </h3>
                        <p class="text-xs text-gray-500 mt-0.5" id="tableDayNotice">
                            Status becomes <span class="font-semibold text-green-700">Completed</span> when both AM and PM sessions are timed in & out.
                        </p>
                    </div>
                    <div class="flex items-center gap-2">
                        <div class="relative">
                            <i data-lucide="search" class="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"></i>
                            <input 
                                type="text" 
                                id="studentSearchInput" 
                                placeholder="Search student name or #..." 
                                class="pl-9 pr-3 py-1.5 text-xs border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-600 w-48 sm:w-60">
                        </div>
                    </div>
                </div>

                <div class="overflow-x-auto">
                    <table class="w-full text-sm text-left">
                        <thead>
                            <tr class="bg-gray-100 border-b border-gray-200 text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                <th class="px-4 py-3.5 w-12 text-center">#</th>
                                <th class="px-4 py-3.5 min-w-[200px]">Student Info</th>
                                <th class="px-4 py-3.5 text-center min-w-[170px]">AM Session</th>
                                <th class="px-4 py-3.5 text-center min-w-[170px]">Break Session</th>
                                <th class="px-4 py-3.5 text-center min-w-[170px]">PM Session</th>
                                <th class="px-4 py-3.5 text-center w-28">Duration</th>
                                <th class="px-4 py-3.5 text-center w-36">Status</th>
                                <th class="px-4 py-3.5 text-center min-w-[220px]">Actions</th>
                            </tr>
                        </thead>
                        <tbody id="attendanceTableBody" class="divide-y divide-gray-100">
                            ${skeletonTableRows(4, 8, true)}
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

function getStatusBadge(status, excuseReason = null, excuseStatus = null) {
    const s = (status || 'Pending').toLowerCase();
    const es = (excuseStatus || '').toLowerCase();

    if (es === 'pending' || s.includes('pending excuse')) {
        return `<span class="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 border border-amber-300">
            <i data-lucide="clock" class="w-3.5 h-3.5"></i> Pending Excuse
        </span>`;
    }
    if (es === 'rejected') {
        return `<span class="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-100 text-rose-800 border border-rose-200" title="Excuse rejected by adviser">
            <i data-lucide="x-circle" class="w-3.5 h-3.5"></i> Excuse Rejected
        </span>`;
    }
    if (s === 'completed' || s.includes('completed')) {
        return `<span class="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-800 border border-green-200">
            <i data-lucide="check-circle" class="w-3.5 h-3.5"></i> ${status}
        </span>`;
    }
    if (s.includes('absent')) {
        return `<span class="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-800 border border-red-200">
            <i data-lucide="user-x" class="w-3.5 h-3.5"></i> ${status}
        </span>`;
    }
    if (s.includes('excused')) {
        const titleAttr = excuseReason ? `title="Reason: ${excuseReason.replace(/"/g, '&quot;')}"` : '';
        return `<span ${titleAttr} class="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-purple-100 text-purple-800 border border-purple-200 cursor-help">
            <i data-lucide="file-check" class="w-3.5 h-3.5"></i> ${status}
        </span>`;
    }
    if (s === 'in progress') {
        return `<span class="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-800 border border-blue-200">
            <i data-lucide="clock" class="w-3.5 h-3.5"></i> In Progress
        </span>`;
    }
    return `<span class="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600 border border-gray-200">
        <i data-lucide="minus-circle" class="w-3.5 h-3.5"></i> Pending
    </span>`;
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

    async function loadEvents() {
        try {
            if (eventSelect) {
                eventSelect.innerHTML = '<option value="">Loading events...</option>';
            }
            events = await AttendanceAPI.getAttendanceEvents();

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
            selectedDate = null;
            document.getElementById('eventSummaryCard')?.classList.add('hidden');
            document.getElementById('scheduleDaysContainer')?.classList.add('hidden');
            renderEmpty('select_event');
            return;
        }

        const tbody = document.getElementById('attendanceTableBody');
        if (tbody) {
            tbody.innerHTML = skeletonTableRows(4, 8, true);
        }

        try {
            const data = await AttendanceAPI.getAttendanceByEvent(eventId);
            if (data && data.success) {
                selectedEvent = data.event;
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
                ? 'bg-blue-900 text-white font-semibold shadow-sm border-blue-900' 
                : 'bg-gray-50 text-gray-700 hover:bg-gray-100 border-gray-200';

            return `
                <button 
                    type="button" 
                    data-date="${sched.schedule_date}" 
                    class="day-tab-btn px-3 py-1.5 text-xs rounded-lg border transition flex items-center gap-1.5 ${activeClasses}">
                    <span class="font-bold">Day ${idx + 1}:</span>
                    <span>${dateInfo.formatted}</span>
                    <span class="text-[11px] opacity-75">(${dateInfo.dayName})</span>
                    ${isDayToday ? `
                        <span class="px-1.5 py-0.2 rounded text-[10px] font-bold ${isSelected ? 'bg-white text-blue-900' : 'bg-green-100 text-green-800 border border-green-200'}">Today</span>
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
            titleSpan.innerHTML = `Student Attendance — ${dateObj.formatted} (${dateObj.dayName}) ${isToday ? '<span class="text-xs px-2 py-0.5 rounded-full bg-green-100 text-green-800 font-bold ml-1.5">Today</span>' : '<span class="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 font-normal ml-1.5">Live Log Disabled</span>'}`;
        }
    }

    function renderSummaryCard() {
        const card = document.getElementById('eventSummaryCard');
        if (!card || !selectedEvent) return;

        card.classList.remove('hidden');

        document.getElementById('eventTitleDisplay').textContent = selectedEvent.title || 'Event Title';
        document.getElementById('eventOrgDisplay').textContent = selectedEvent.organization_name || 'Organization';
        document.getElementById('eventCategoryBadge').textContent = selectedEvent.event_category || 'Event';
        document.getElementById('eventVenueDisplay').textContent = selectedEvent.venue || 'No venue specified';

        const start = selectedEvent.event_day_start ? formatDateDisplay(selectedEvent.event_day_start).formatted : '';
        const end = selectedEvent.event_day_end ? formatDateDisplay(selectedEvent.event_day_end).formatted : '';
        document.getElementById('eventDateRangeDisplay').textContent = (start && end) ? `${start} - ${end}` : (start || 'Flexible schedule');

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

        document.getElementById('statTotalStudents').textContent = students.length;
        document.getElementById('statCompleted').textContent = completed;
        document.getElementById('statInProgress').textContent = inProgress;
        document.getElementById('statAbsentExcused').textContent = absentExcused;
        document.getElementById('statPendingExcuses').textContent = pendingExcuses;

        if (typeof lucide !== 'undefined') {
            lucide.createIcons();
        }
    }

    function renderTable() {
        const tbody = document.getElementById('attendanceTableBody');
        if (!tbody) return;

        if (!selectedEvent) {
            renderEmpty('select_event');
            return;
        }

        const todayStr = getTodayLocalDate();
        const isToday = (selectedDate === todayStr);

        const noticeEl = document.getElementById('tableDayNotice');
        if (noticeEl) {
            if (!isToday) {
                noticeEl.innerHTML = `<span class="inline-flex items-center gap-1 text-amber-700 font-medium"><i data-lucide="alert-circle" class="w-3.5 h-3.5 inline"></i> All session logging and action buttons are disabled because this date is not today.</span>`;
            } else {
                noticeEl.innerHTML = `Status becomes <span class="font-semibold text-green-700">Completed</span> when both AM and PM sessions are timed in & out. <span class="text-green-700 font-semibold ml-1.5"><i data-lucide="check-circle" class="w-3.5 h-3.5 inline"></i> Live Logging Active (Today)</span>`;
            }
        }

        if (students.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="8" class="px-5 py-12 text-center text-gray-500">
                        <div class="flex flex-col items-center justify-center">
                            <i data-lucide="users" class="w-10 h-10 text-gray-400 mb-2"></i>
                            <p class="font-medium text-gray-700">No students registered for this event yet</p>
                            <p class="text-xs text-gray-400 mt-1">Please register students to the event in Event Registrations or add organization members.</p>
                        </div>
                    </td>
                </tr>
            `;
            if (typeof lucide !== 'undefined') lucide.createIcons();
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
            tbody.innerHTML = `
                <tr>
                    <td colspan="8" class="px-5 py-8 text-center text-gray-500 text-xs">
                        No students matching "${searchQuery}"
                    </td>
                </tr>
            `;
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

        filteredStudents.forEach((student, index) => {
            const studentId = student.student_id;
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

            rowsHtml += `
                <tr class="hover:bg-blue-50/40 transition-colors">
                    <td class="px-4 py-3.5 text-center text-xs text-gray-500 font-medium">
                        ${index + 1}
                    </td>

                    <td class="px-4 py-3.5 align-middle">
                        <div class="font-semibold text-gray-900">${student.student_name || `${student.first_name} ${student.last_name}`}</div>
                        <div class="text-xs text-gray-500 flex items-center gap-1.5 mt-0.5">
                            <span class="font-mono bg-gray-100 text-gray-700 px-1.5 py-0.2 rounded text-[11px]">${student.student_number || 'No ID'}</span>
                            <span>•</span>
                            <span class="truncate max-w-[120px]">${student.program || 'Student'} ${student.year_level ? `(${student.year_level})` : ''}</span>
                        </div>
                    </td>

                    <td class="px-3 py-2.5 align-middle text-center">
                        <div class="bg-gray-50/80 rounded-lg p-2 border border-gray-100 flex flex-col gap-1">
                            <div class="flex items-center justify-between text-xs">
                                <span class="text-[11px] text-gray-500 font-medium">In:</span>
                                ${timeInAm ? `
                                    <span class="font-semibold text-gray-900 bg-white px-1.5 py-0.5 rounded border border-gray-200 text-xs shadow-xs">${timeInAm}</span>
                                ` : `
                                    <button 
                                        type="button" 
                                        data-action="log" 
                                        data-student-id="${studentId}" 
                                        data-student-name="${(student.student_name || '').replace(/"/g, '&quot;')}"
                                        data-type="time_in_am" 
                                        ${!isToday || isAmLocked ? `disabled title="${!isToday ? disabledLiveLogTitle : 'AM session is locked (excused/absent). Use Edit to modify.'}"` : 'title="Record Time In (AM)"'}
                                        class="px-2 py-0.5 text-[11px] font-medium text-blue-800 bg-blue-50 hover:bg-blue-100 disabled:opacity-40 disabled:cursor-not-allowed disabled:bg-gray-100 disabled:text-gray-400 disabled:border-gray-200 rounded border border-blue-200 transition">
                                        + In
                                    </button>
                                `}
                            </div>
                            <div class="flex items-center justify-between text-xs">
                                <span class="text-[11px] text-gray-500 font-medium">Out:</span>
                                ${timeOutAm ? `
                                    <span class="font-semibold text-gray-900 bg-white px-1.5 py-0.5 rounded border border-gray-200 text-xs shadow-xs">${timeOutAm}</span>
                                ` : `
                                    <button 
                                        type="button" 
                                        data-action="log" 
                                        data-student-id="${studentId}" 
                                        data-student-name="${(student.student_name || '').replace(/"/g, '&quot;')}"
                                        data-type="time_out_am" 
                                        ${!isToday || isAmLocked || !canTimeOutAm ? `disabled title="${!isToday ? disabledLiveLogTitle : !canTimeOutAm ? 'Time In AM must be recorded first' : 'AM session is locked (excused/absent). Use Edit to modify.'}"` : 'title="Record Time Out (AM)"'}
                                        class="px-2 py-0.5 text-[11px] font-medium text-blue-800 bg-blue-50 hover:bg-blue-100 disabled:opacity-40 disabled:cursor-not-allowed disabled:bg-gray-100 disabled:text-gray-400 disabled:border-gray-200 rounded border border-blue-200 transition">
                                        + Out
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
                                    <span class="font-semibold text-gray-900 bg-white px-1.5 py-0.5 rounded border border-amber-200 text-xs shadow-xs">${breakOut}</span>
                                ` : `
                                    <button 
                                        type="button" 
                                        data-action="log" 
                                        data-student-id="${studentId}" 
                                        data-student-name="${(student.student_name || '').replace(/"/g, '&quot;')}"
                                        data-type="break_out" 
                                        ${!isToday || isBreakLocked || !canBreakOut ? `disabled title="${!isToday ? disabledLiveLogTitle : !canBreakOut ? 'Time In AM must be recorded first' : 'Break session is locked (excused/absent). Use Edit to modify.'}"` : 'title="Record Break Out"'}
                                        class="px-2 py-0.5 text-[11px] font-medium text-amber-900 bg-amber-100/70 hover:bg-amber-100 disabled:opacity-40 disabled:cursor-not-allowed disabled:bg-gray-100 disabled:text-gray-400 disabled:border-gray-200 rounded border border-amber-200 transition">
                                        + Break
                                    </button>
                                `}
                            </div>
                            <div class="flex items-center justify-between text-xs">
                                <span class="text-[11px] text-amber-800 font-medium">In:</span>
                                ${breakIn ? `
                                    <span class="font-semibold text-gray-900 bg-white px-1.5 py-0.5 rounded border border-amber-200 text-xs shadow-xs">${breakIn}</span>
                                ` : `
                                    <button 
                                        type="button" 
                                        data-action="log" 
                                        data-student-id="${studentId}" 
                                        data-student-name="${(student.student_name || '').replace(/"/g, '&quot;')}"
                                        data-type="break_in" 
                                        ${!isToday || isBreakLocked || !canBreakIn ? `disabled title="${!isToday ? disabledLiveLogTitle : !canBreakIn ? 'Break Out must be recorded first' : 'Break session is locked (excused/absent). Use Edit to modify.'}"` : 'title="Record Break In"'}
                                        class="px-2 py-0.5 text-[11px] font-medium text-amber-900 bg-amber-100/70 hover:bg-amber-100 disabled:opacity-40 disabled:cursor-not-allowed disabled:bg-gray-100 disabled:text-gray-400 disabled:border-gray-200 rounded border border-amber-200 transition">
                                        + In
                                    </button>
                                `}
                            </div>
                        </div>
                    </td>

                    <td class="px-3 py-2.5 align-middle text-center">
                        <div class="bg-gray-50/80 rounded-lg p-2 border border-gray-100 flex flex-col gap-1">
                            <div class="flex items-center justify-between text-xs">
                                <span class="text-[11px] text-gray-500 font-medium">In:</span>
                                ${timeInPm ? `
                                    <span class="font-semibold text-gray-900 bg-white px-1.5 py-0.5 rounded border border-gray-200 text-xs shadow-xs">${timeInPm}</span>
                                ` : `
                                    <button 
                                        type="button" 
                                        data-action="log" 
                                        data-student-id="${studentId}" 
                                        data-student-name="${(student.student_name || '').replace(/"/g, '&quot;')}"
                                        data-type="time_in_pm" 
                                        ${!isToday || isPmLocked || !canTimeInPm ? `disabled title="${!isToday ? disabledLiveLogTitle : !canTimeInPm ? 'Break In must be recorded first' : 'PM session is locked (excused/absent). Use Edit to modify.'}"` : 'title="Record Time In (PM)"'}
                                        class="px-2 py-0.5 text-[11px] font-medium text-blue-800 bg-blue-50 hover:bg-blue-100 disabled:opacity-40 disabled:cursor-not-allowed disabled:bg-gray-100 disabled:text-gray-400 disabled:border-gray-200 rounded border border-blue-200 transition">
                                        + In
                                    </button>
                                `}
                            </div>
                            <div class="flex items-center justify-between text-xs">
                                <span class="text-[11px] text-gray-500 font-medium">Out:</span>
                                ${timeOutPm ? `
                                    <span class="font-semibold text-gray-900 bg-white px-1.5 py-0.5 rounded border border-gray-200 text-xs shadow-xs">${timeOutPm}</span>
                                ` : `
                                    <button 
                                        type="button" 
                                        data-action="log" 
                                        data-student-id="${studentId}" 
                                        data-student-name="${(student.student_name || '').replace(/"/g, '&quot;')}"
                                        data-type="time_out_pm" 
                                        ${!isToday || isPmLocked || !canTimeOutPm ? `disabled title="${!isToday ? disabledLiveLogTitle : !canTimeOutPm ? 'Time In PM must be recorded first' : 'PM session is locked (excused/absent). Use Edit to modify.'}"` : 'title="Record Time Out (PM)"'}
                                        class="px-2 py-0.5 text-[11px] font-medium text-blue-800 bg-blue-50 hover:bg-blue-100 disabled:opacity-40 disabled:cursor-not-allowed disabled:bg-gray-100 disabled:text-gray-400 disabled:border-gray-200 rounded border border-blue-200 transition">
                                        + Out
                                    </button>
                                `}
                            </div>
                        </div>
                    </td>

                    <td class="px-4 py-3.5 align-middle text-center">
                        <div class="text-xs font-semibold text-gray-800">${durationFormatted}</div>
                    </td>

                    <td class="px-4 py-3.5 align-middle text-center">
                        ${getStatusBadge(status, att?.excuse_reason, excuseStatus)}
                        ${isExcused && att?.excuse_reason ? `
                            <div class="text-[11px] text-purple-700 mt-0.5 max-w-[130px] truncate mx-auto" title="${att.excuse_reason}">
                                "${att.excuse_reason}"
                            </div>
                        ` : ''}
                    </td>

                    <td class="px-4 py-3.5 align-middle text-center">
                        <div class="flex items-center justify-center gap-1.5 flex-wrap">
                            ${isPendingExcuse ? `
                                <button 
                                    type="button" 
                                    data-action="review-excuse" 
                                    data-student-id="${studentId}" 
                                    data-student-name="${(student.student_name || '').replace(/"/g, '&quot;')}"
                                    ${!isToday ? 'disabled title="Actions are only available on the current day"' : 'title="Review Student\'s Excuse Request"'}
                                    class="px-2.5 py-1 text-[11px] font-semibold text-amber-900 bg-amber-100 hover:bg-amber-200 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-amber-100 border border-amber-300 rounded shadow-xs transition flex items-center gap-1">
                                    <i data-lucide="alert-circle" class="w-3 h-3 text-amber-700"></i>
                                    <span>Review Excuse</span>
                                </button>
                            ` : ''}

                            <button 
                                type="button" 
                                data-action="edit-session" 
                                data-student-id="${studentId}" 
                                data-student-name="${(student.student_name || '').replace(/"/g, '&quot;')}"
                                ${!isToday ? 'disabled title="Actions are only available on the current day"' : (isEditLocked ? 'disabled title="Cannot edit full-day excused/absent students. Reset status first."' : 'title="Edit / Override student session times or invalidate false logs"')}
                                class="px-2 py-1 text-[11px] font-medium text-blue-800 bg-blue-50 hover:bg-blue-100 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-blue-50 border border-blue-200 rounded transition flex items-center gap-1">
                                <i data-lucide="edit-3" class="w-3 h-3"></i>
                                <span>Edit</span>
                            </button>

                            <button 
                                type="button" 
                                data-action="absent-modal" 
                                data-student-id="${studentId}" 
                                data-student-name="${(student.student_name || '').replace(/"/g, '&quot;')}"
                                ${!isToday || isActionLocked ? 'disabled title="Actions are only available on the current day or for non-full-day locked statuses"' : 'title="Mark Absent (AM / PM / Both)"'}
                                class="px-2 py-1 text-[11px] font-medium text-red-700 bg-red-50 hover:bg-red-100 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-red-50 border border-red-200 rounded transition flex items-center gap-0.5">
                                <i data-lucide="user-x" class="w-3 h-3"></i>
                                <span>Absent</span>
                            </button>

                            <button 
                                type="button" 
                                data-action="excuse-modal" 
                                data-student-id="${studentId}" 
                                data-student-name="${(student.student_name || '').replace(/"/g, '&quot;')}"
                                ${!isToday || isActionLocked ? 'disabled title="Actions are only available on the current day or for non-full-day locked statuses"' : 'title="Mark Excused with Reason"'}
                                class="px-2 py-1 text-[11px] font-medium text-purple-700 bg-purple-50 hover:bg-purple-100 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-purple-50 border border-purple-200 rounded transition flex items-center gap-0.5">
                                <i data-lucide="file-text" class="w-3 h-3"></i>
                                <span>Excuse</span>
                            </button>

                            ${att ? `
                                <button 
                                    type="button" 
                                    data-action="reset" 
                                    data-student-id="${studentId}" 
                                    data-student-name="${(student.student_name || '').replace(/"/g, '&quot;')}"
                                    ${!isToday ? 'disabled title="Actions are only available on the current day"' : 'title="Reset this student\'s attendance"'}
                                    class="p-1 text-gray-400 hover:text-red-700 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-transparent rounded transition">
                                    <i data-lucide="rotate-ccw" class="w-3.5 h-3.5"></i>
                                </button>
                            ` : ''}
                        </div>
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
        const tbody = document.getElementById('attendanceTableBody');
        if (!tbody) return;

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
            subtitle = 'Please select a registered event from the dropdown above to view student attendance.';
        } else if (type === 'error') {
            icon = 'alert-triangle';
            title = 'Error Loading Attendance';
            subtitle = 'An error occurred while loading attendance. Please try refreshing.';
        } else {
            icon = 'info';
            title = 'No Attendance Records';
            subtitle = 'No attendance data found.';
        }

        tbody.innerHTML = `
            <tr>
                <td colspan="8" class="px-5 py-16 text-center text-gray-500">
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
            <div class="space-y-4">
                <div class="bg-blue-50 border border-blue-100 rounded-lg p-3 text-xs text-blue-900 space-y-1">
                    <div><strong>Student:</strong> ${studentName}</div>
                    <div><strong>Date:</strong> ${formatDateDisplay(selectedDate).formatted}</div>
                    <div><strong>Action:</strong> ${label}</div>
                </div>

                <div>
                    <label for="modalTimeInput" class="block text-sm font-medium text-gray-700 mb-1">Time to Record</label>
                    <input 
                        type="time" 
                        id="modalTimeInput" 
                        value="${currentTimeStr}" 
                        class="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-600 focus:border-blue-600">
                    <p class="text-xs text-gray-500 mt-1">Defaults to your system time. You can adjust it if needed.</p>
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
                        id="confirmLogTimeBtn" 
                        class="px-4 py-2 text-xs font-medium text-white bg-blue-900 hover:bg-blue-800 rounded-md shadow-sm transition">
                        Save Time
                    </button>
                </div>
            </div>
        `;

        openModal(`Record ${label}`, content, 'small');

        const confirmBtn = document.getElementById('confirmLogTimeBtn');
        if (confirmBtn) {
            confirmBtn.addEventListener('click', async () => {
                const timeVal = document.getElementById('modalTimeInput').value;
                setModalButtonLoading('confirmLogTimeBtn', true, 'Save Time');
                try {
                    await AttendanceAPI.logAttendanceTime({
                        student_id: studentId,
                        event_id: selectedEvent.id,
                        organization_id: selectedEvent.organization_id,
                        schedule_date: selectedDate,
                        log_type: logType,
                        time_value: timeVal ? `${timeVal}:00` : null
                    });
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
            sessionOptions = `
                <label class="flex items-center gap-2 p-2.5 rounded-lg border border-gray-200 hover:bg-gray-50 cursor-pointer">
                    <input type="radio" name="absentSession" value="BOTH" checked class="text-red-600 focus:ring-red-500">
                    <span class="text-sm font-medium text-gray-800">BOTH (Full Day Absent)</span>
                </label>
            `;
        }
        if (amAvailable) {
            sessionOptions += `
                <label class="flex items-center gap-2 p-2.5 rounded-lg border border-gray-200 hover:bg-gray-50 cursor-pointer">
                    <input type="radio" name="absentSession" value="AM" ${!bothAvailable ? 'checked' : ''} class="text-red-600 focus:ring-red-500">
                    <span class="text-sm font-medium text-gray-800">AM Session Only</span>
                </label>
            `;
        }
        if (pmAvailable) {
            sessionOptions += `
                <label class="flex items-center gap-2 p-2.5 rounded-lg border border-gray-200 hover:bg-gray-50 cursor-pointer">
                    <input type="radio" name="absentSession" value="PM" ${!bothAvailable && !amAvailable ? 'checked' : ''} class="text-red-600 focus:ring-red-500">
                    <span class="text-sm font-medium text-gray-800">PM Session Only</span>
                </label>
            `;
        }

        const content = `
            <div class="space-y-4">
                <div class="bg-red-50 border border-red-100 rounded-lg p-3 text-xs text-red-900 space-y-1">
                    <div><strong>Student:</strong> ${studentName}</div>
                    <div><strong>Date:</strong> ${formatDateDisplay(selectedDate).formatted}</div>
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
                    <label class="block text-sm font-medium text-gray-700 mb-2">Absent Session</label>
                    <div class="space-y-2">
                        ${sessionOptions}
                    </div>
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
                        id="confirmAbsentBtn" 
                        class="px-4 py-2 text-xs font-medium text-white bg-red-600 hover:bg-red-700 rounded-md shadow-sm transition">
                        Confirm Absent
                    </button>
                </div>
            </div>
        `;

        openModal('Mark Student Absent', content, 'small');

        const confirmBtn = document.getElementById('confirmAbsentBtn');
        if (confirmBtn) {
            confirmBtn.addEventListener('click', async () => {
                const selectedRadio = document.querySelector('input[name="absentSession"]:checked');
                const sessionVal = selectedRadio ? selectedRadio.value : 'BOTH';

                setModalButtonLoading('confirmAbsentBtn', true, 'Confirm Absent');
                try {
                    await AttendanceAPI.markAttendanceAbsent({
                        student_id: studentId,
                        event_id: selectedEvent.id,
                        organization_id: selectedEvent.organization_id,
                        schedule_date: selectedDate,
                        session: sessionVal
                    });
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
            sessionOptions = `
                <label class="flex items-center justify-center p-2 rounded-lg border border-gray-200 hover:bg-gray-50 cursor-pointer text-xs font-medium">
                    <input type="radio" name="excuseSession" value="BOTH" checked class="mr-1.5 text-purple-600 focus:ring-purple-500">
                    Whole Day
                </label>
            `;
        }
        if (amAvailable) {
            sessionOptions += `
                <label class="flex items-center justify-center p-2 rounded-lg border border-gray-200 hover:bg-gray-50 cursor-pointer text-xs font-medium">
                    <input type="radio" name="excuseSession" value="AM" ${!bothAvailable ? 'checked' : ''} class="mr-1.5 text-purple-600 focus:ring-purple-500">
                    AM Only
                </label>
            `;
        }
        if (pmAvailable) {
            sessionOptions += `
                <label class="flex items-center justify-center p-2 rounded-lg border border-gray-200 hover:bg-gray-50 cursor-pointer text-xs font-medium">
                    <input type="radio" name="excuseSession" value="PM" ${!bothAvailable && !amAvailable ? 'checked' : ''} class="mr-1.5 text-purple-600 focus:ring-purple-500">
                    PM Only
                </label>
            `;
        }

        const content = `
            <div class="space-y-4">
                <div class="bg-purple-50 border border-purple-100 rounded-lg p-3 text-xs text-purple-900 space-y-1">
                    <div><strong>Student:</strong> ${studentName}</div>
                    <div><strong>Date:</strong> ${formatDateDisplay(selectedDate).formatted}</div>
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
                    <label class="block text-sm font-medium text-gray-700 mb-2">Excuse Session</label>
                    <div class="grid grid-cols-3 gap-2">
                        ${sessionOptions}
                    </div>
                </div>

                <div>
                    <label for="excuseReasonInput" class="block text-sm font-medium text-gray-700 mb-1">
                        Reason for Excuse <span class="text-red-500">*</span>
                    </label>
                    <textarea 
                        id="excuseReasonInput" 
                        rows="3" 
                        placeholder="Please provide excuse reason (e.g. Medical, Academic Competition, Emergency)..." 
                        class="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-600 focus:border-purple-600 transition resize-none"></textarea>
                    <p id="excuseError" class="text-xs text-red-500 mt-1 hidden">Reason is required</p>
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
                        id="confirmExcuseBtn" 
                        class="px-4 py-2 text-xs font-medium text-white bg-purple-700 hover:bg-purple-800 rounded-md shadow-sm transition">
                        Submit Excuse
                    </button>
                </div>
            </div>
        `;

        openModal('Submit Excuse Reason', content, 'small');

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
                    await AttendanceAPI.markAttendanceExcused({
                        student_id: studentId,
                        event_id: selectedEvent.id,
                        organization_id: selectedEvent.organization_id,
                        schedule_date: selectedDate,
                        reason: reasonVal,
                        session: sessionVal
                    });
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
            <div class="space-y-4">
                <div class="bg-amber-50 border border-amber-200 rounded-lg p-3 text-xs text-amber-900 space-y-1.5">
                    <div><strong>Student:</strong> ${studentName}</div>
                    <div><strong>Event:</strong> ${selectedEvent.title}</div>
                    <div><strong>Date:</strong> ${formatDateDisplay(selectedDate).formatted}</div>
                    <div><strong>Requested Session:</strong> <span class="font-semibold text-amber-800">${session}</span></div>
                </div>

                <div>
                    <label class="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Excuse Reason Submitted</label>
                    <div class="p-3 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-800 italic">
                        "${reason}"
                    </div>
                </div>

                <div class="p-3 bg-blue-50 border border-blue-100 rounded-lg text-xs text-blue-900">
                    <i data-lucide="info" class="w-4 h-4 inline-block mr-1 text-blue-700"></i>
                    Approving will mark this student's status as <strong>Excused</strong>. Rejecting will leave their normal attendance active.
                </div>

                <div class="flex items-center justify-between gap-2 pt-3 border-t border-gray-100">
                    <button 
                        type="button" 
                        onclick="closeModal()" 
                        class="px-3 py-2 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition">
                        Cancel
                    </button>
                    <div class="flex items-center gap-2">
                        <button 
                            type="button" 
                            id="rejectExcuseBtn" 
                            class="px-3.5 py-2 text-xs font-medium text-red-700 bg-red-50 hover:bg-red-100 border border-red-200 rounded-md transition flex items-center gap-1">
                            <i data-lucide="x" class="w-3.5 h-3.5"></i>
                            Reject Excuse
                        </button>
                        <button 
                            type="button" 
                            id="approveExcuseBtn" 
                            class="px-4 py-2 text-xs font-medium text-white bg-green-600 hover:bg-green-700 rounded-md shadow-sm transition flex items-center gap-1">
                            <i data-lucide="check" class="w-3.5 h-3.5"></i>
                            Approve Excuse
                        </button>
                    </div>
                </div>
            </div>
        `;

        openModal('Review Student Excuse Request', content, 'medium');

        if (typeof lucide !== 'undefined') lucide.createIcons();

        const approveBtn = document.getElementById('approveExcuseBtn');
        const rejectBtn = document.getElementById('rejectExcuseBtn');

        if (approveBtn) {
            approveBtn.addEventListener('click', async () => {
                setModalButtonLoading('approveExcuseBtn', true, 'Approve');
                try {
                    await AttendanceAPI.handleExcuseApproval({
                        student_id: studentId,
                        event_id: selectedEvent.id,
                        schedule_date: selectedDate,
                        action: 'approve'
                    });
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
                    await AttendanceAPI.handleExcuseApproval({
                        student_id: studentId,
                        event_id: selectedEvent.id,
                        schedule_date: selectedDate,
                        action: 'reject'
                    });
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
            <div class="space-y-4">
                <div class="bg-blue-50 border border-blue-100 rounded-lg p-3 text-xs text-blue-900 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                        <div><strong>Student:</strong> ${studentName}</div>
                        <div><strong>Date:</strong> ${formatDateDisplay(selectedDate).formatted}</div>
                    </div>
                    <div>
                        <button 
                            type="button" 
                            id="clearAllTimesBtn" 
                            class="px-2.5 py-1 text-[11px] font-semibold text-red-700 bg-red-100 hover:bg-red-200 border border-red-300 rounded transition flex items-center gap-1">
                            <i data-lucide="trash-2" class="w-3 h-3"></i>
                            Void / Clear All Times
                        </button>
                    </div>
                </div>

                ${amLocked || pmLocked ? `
                    <div class="p-2.5 bg-amber-50/70 border border-amber-200 rounded-lg text-xs text-amber-800 flex items-start gap-1.5">
                        <i data-lucide="info" class="w-4 h-4 text-amber-600 shrink-0 mt-0.5"></i>
                        <span>
                            ${amLocked && pmLocked ? 'Both AM and PM sessions are locked due to excused/absent status. Reset status to edit times.' : 
                              amLocked ? 'AM session is locked due to excused/absent status. Only PM session can be edited.' : 
                              'PM session is locked due to excused/absent status. Only AM session can be edited.'}
                        </span>
                    </div>
                ` : `
                    <div class="p-2.5 bg-amber-50/70 border border-amber-200 rounded-lg text-xs text-amber-800 flex items-start gap-1.5">
                        <i data-lucide="shield-alert" class="w-4 h-4 text-amber-600 shrink-0 mt-0.5"></i>
                        <span>
                            <strong>Adviser Override:</strong> If a student timed in or out when they were not actually present, you can adjust or clear their recorded hours here.
                        </span>
                    </div>
                `}

                ${!amLocked ? `
                    <div class="p-3 bg-gray-50 rounded-lg border border-gray-200">
                        <h4 class="text-xs font-bold text-gray-700 uppercase tracking-wider mb-2 flex items-center justify-between">
                            <span>AM Session</span>
                            <button type="button" id="clearAmBtn" class="text-[11px] text-gray-400 hover:text-red-600 font-normal underline">Clear AM</button>
                        </h4>
                        <div class="grid grid-cols-2 gap-3">
                            <div>
                                <label class="block text-xs font-medium text-gray-600 mb-1">Time In (AM)</label>
                                <input 
                                    type="time" 
                                    id="editTimeInAm" 
                                    value="${timeInAm}" 
                                    class="w-full px-2.5 py-1.5 text-xs bg-white border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-600">
                            </div>
                            <div>
                                <label class="block text-xs font-medium text-gray-600 mb-1">Time Out (AM)</label>
                                <input 
                                    type="time" 
                                    id="editTimeOutAm" 
                                    value="${timeOutAm}" 
                                    class="w-full px-2.5 py-1.5 text-xs bg-white border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-600">
                            </div>
                        </div>
                    </div>
                ` : ''}

                ${!breakLocked ? `
                    <div class="p-3 bg-amber-50/40 rounded-lg border border-amber-200/60">
                        <h4 class="text-xs font-bold text-amber-900 uppercase tracking-wider mb-2 flex items-center justify-between">
                            <span>Break Session</span>
                            <button type="button" id="clearBreakBtn" class="text-[11px] text-gray-400 hover:text-red-600 font-normal underline">Clear Break</button>
                        </h4>
                        <div class="grid grid-cols-2 gap-3">
                            <div>
                                <label class="block text-xs font-medium text-gray-600 mb-1">Break Out</label>
                                <input 
                                    type="time" 
                                    id="editBreakOut" 
                                    value="${breakOut}" 
                                    class="w-full px-2.5 py-1.5 text-xs bg-white border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-600">
                            </div>
                            <div>
                                <label class="block text-xs font-medium text-gray-600 mb-1">Break In</label>
                                <input 
                                    type="time" 
                                    id="editBreakIn" 
                                    value="${breakIn}" 
                                    class="w-full px-2.5 py-1.5 text-xs bg-white border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-600">
                            </div>
                        </div>
                    </div>
                ` : ''}

                ${!pmLocked ? `
                    <div class="p-3 bg-gray-50 rounded-lg border border-gray-200">
                        <h4 class="text-xs font-bold text-gray-700 uppercase tracking-wider mb-2 flex items-center justify-between">
                            <span>PM Session</span>
                            <button type="button" id="clearPmBtn" class="text-[11px] text-gray-400 hover:text-red-600 font-normal underline">Clear PM</button>
                        </h4>
                        <div class="grid grid-cols-2 gap-3">
                            <div>
                                <label class="block text-xs font-medium text-gray-600 mb-1">Time In (PM)</label>
                                <input 
                                    type="time" 
                                    id="editTimeInPm" 
                                    value="${timeInPm}" 
                                    class="w-full px-2.5 py-1.5 text-xs bg-white border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-600">
                            </div>
                            <div>
                                <label class="block text-xs font-medium text-gray-600 mb-1">Time Out (PM)</label>
                                <input 
                                    type="time" 
                                    id="editTimeOutPm" 
                                    value="${timeOutPm}" 
                                    class="w-full px-2.5 py-1.5 text-xs bg-white border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-600">
                            </div>
                        </div>
                    </div>
                ` : ''}

                <div>
                    <label class="flex items-center gap-2 cursor-pointer mb-2">
                        <input type="checkbox" id="editIsAbsent" ${isAbsent ? 'checked' : ''} class="w-4 h-4 text-red-600 rounded border-gray-300 focus:ring-red-500">
                        <span class="text-xs font-semibold text-gray-800">Mark as Absent</span>
                    </label>
                    <div id="absentOptionsContainer" class="${isAbsent ? '' : 'hidden'} pl-6 space-y-1">
                        <div class="flex items-center gap-3 text-xs">
                            ${bothAvailableForAbsent ? `
                                <label class="flex items-center gap-1 cursor-pointer">
                                    <input type="radio" name="editAbsentSession" value="BOTH" ${absentSession === 'BOTH' ? 'checked' : ''} class="text-red-600">
                                    <span>Whole Day</span>
                                </label>
                            ` : ''}
                            ${amAvailableForAbsent ? `
                                <label class="flex items-center gap-1 cursor-pointer">
                                    <input type="radio" name="editAbsentSession" value="AM" ${absentSession === 'AM' || (!bothAvailableForAbsent && amAvailableForAbsent) ? 'checked' : ''} class="text-red-600">
                                    <span>AM Only</span>
                                </label>
                            ` : ''}
                            ${pmAvailableForAbsent ? `
                                <label class="flex items-center gap-1 cursor-pointer">
                                    <input type="radio" name="editAbsentSession" value="PM" ${absentSession === 'PM' || (!bothAvailableForAbsent && !amAvailableForAbsent) ? 'checked' : ''} class="text-red-600">
                                    <span>PM Only</span>
                                </label>
                            ` : ''}
                        </div>
                    </div>
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
                        id="saveSessionChangesBtn" 
                        class="px-4 py-2 text-xs font-medium text-white bg-blue-900 hover:bg-blue-800 rounded-md shadow-sm transition">
                        Save Changes
                    </button>
                </div>
            </div>
        `;

        openModal(`Edit Session — ${studentName}`, content, 'medium');

        if (typeof lucide !== 'undefined') lucide.createIcons();

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
            const data = await AttendanceAPI.getAttendanceByEvent(selectedEvent.id);
            if (data && data.success) {
                selectedEvent = data.event;
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
    if (tbody) {
        tbody.addEventListener('click', (e) => {
            const btn = e.target.closest('button');
            if (!btn) return;

            const action = btn.getAttribute('data-action');
            const studentId = btn.getAttribute('data-student-id');
            const studentName = btn.getAttribute('data-student-name') || 'Student';

            if (action === 'log') {
                const logType = btn.getAttribute('data-type');
                openLogTimeModal(studentId, studentName, logType);
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
        });
    }

    await loadEvents();
}

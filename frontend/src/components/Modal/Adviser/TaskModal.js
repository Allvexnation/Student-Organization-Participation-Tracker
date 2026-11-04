import { openModal, closeModal, setModalButtonLoading } from '../../../utils/modal.js';
import { animateModalClose, clearModalAnimations } from '../../../provider/ModalAnimation.js';
import { showToast } from '../../ToastMessage.js';
import { API_ROUTES } from '../../../api/server/api.js';
import { getToken } from '../../../utils/jwt.js';
import { MembershipValidator } from '../../../validator/MembershipValidator.js';
import { FIELD_CLASS, LABEL_CLASS, modalSection, modalActions, applyModalDomino } from '../modalUi.js';

export function openTaskModal({ mode = 'add', task = null, taskId = null, taskGroup = null, eventId, eventTitle, organizationId, memberships = [], onSubmit, event = null }) {
    const isEdit = mode === 'edit';
    const title = isEdit ? 'Edit Task' : 'New Task';
    const buttonText = isEdit ? 'Save Changes' : 'Add Task';

    const uniqueMemberships = [];
    const seenStudentIds = new Set();
    (memberships || []).forEach(m => {
        if (m && m.student_id && !seenStudentIds.has(m.student_id)) {
            seenStudentIds.add(m.student_id);
            uniqueMemberships.push(m);
        }
    });

    const assignedStudentIds = new Set();
    if (isEdit) {
        if (taskGroup && taskGroup.students) {
            taskGroup.students.forEach(s => assignedStudentIds.add(parseInt(s.student_id)));
        } else if (task && task.student_id) {
            assignedStudentIds.add(parseInt(task.student_id));
        }
    }

    const taskTitleVal = isEdit ? (taskGroup ? (taskGroup.title || '') : (task?.task_title || '')) : '';
    const taskDescVal = isEdit ? (taskGroup ? (taskGroup.description || '') : (task?.task_description || '')) : '';
    const startDateVal = isEdit 
        ? ((taskGroup?.students && (taskGroup.students[0]?.student_start_date || taskGroup.students[0]?.start_date)) || task?.student_start_date || task?.start_date || '') 
        : (event?.event_day_start || '');
    const endDateVal = isEdit 
        ? ((taskGroup?.students && (taskGroup.students[0]?.student_end_date || taskGroup.students[0]?.end_date)) || task?.student_end_date || task?.end_date || '') 
        : (event?.event_day_end || '');

    const allCheckedInitially = uniqueMemberships.length > 0 && uniqueMemberships.every(m => assignedStudentIds.has(parseInt(m.student_id)));

    const formContent = `
        <form id="taskForm" class="manage-modal-form space-y-4">
            ${isEdit ? `<input type="hidden" id="taskId" value="${task?.id || taskId || ''}">` : ''}
            <input type="hidden" id="eventId" value="${eventId || ''}">
            <input type="hidden" id="organizationId" value="${organizationId || ''}">
            ${modalSection('Event Context', `
                <div class="rounded-xl border border-blue-100 bg-blue-50 px-3.5 py-3">
                    <p class="text-[10px] uppercase tracking-[0.12em] text-navy/70">Assigned Event</p>
                    <p class="text-sm font-semibold text-navy mt-1">${eventTitle || 'Event'}</p>
                </div>
            `)}
            ${modalSection('Task Details', `
                <div class="space-y-3">
                    <div>
                        <label for="taskTitle" class="${LABEL_CLASS}">Task Title</label>
                        <input type="text" id="taskTitle" name="taskTitle" placeholder="Enter a brief title for the task" class="${FIELD_CLASS}" value="${taskTitleVal}">
                    </div>
                    <div>
                        <label for="taskDescription" class="${LABEL_CLASS}">Task Description <span class="text-red-500">*</span></label>
                        <textarea id="taskDescription" name="taskDescription" rows="3" required placeholder="Describe the task to be completed" class="${FIELD_CLASS} resize-none">${taskDescVal}</textarea>
                    </div>
                    <div>
                        <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-2">
                            <label class="${LABEL_CLASS} mb-0">Assign to Students <span class="text-red-500">*</span></label>
                            <button type="button" id="selectAllStudentsBtn" class="text-xs text-navy hover:text-navy-700 font-medium self-start sm:self-auto">
                                ${allCheckedInitially ? 'Deselect All' : 'Select All'}
                            </button>
                        </div>
                        <div id="studentsList" class="space-y-2 max-h-44 overflow-y-auto rounded-xl border border-line p-2 sm:p-3 bg-surface">
                            ${uniqueMemberships.map(m => {
                                const isChecked = isEdit && assignedStudentIds.has(parseInt(m.student_id));
                                const isInactive = MembershipValidator.isInactive(m);
                                const displayName = MembershipValidator.getDisplayName(m);
                                return `
                                    <label class="flex flex-col sm:flex-row sm:items-center gap-1.5 sm:gap-2 cursor-pointer hover:bg-white p-2.5 rounded-xl border border-transparent hover:border-line ${isInactive ? 'opacity-60 cursor-not-allowed' : ''}">
                                        <span class="flex items-center gap-2 min-w-0">
                                            <input type="checkbox" name="studentSelect" value="${m.student_id}" ${isChecked ? 'checked' : ''} ${isInactive ? 'disabled' : ''}
                                                class="w-4 h-4 text-navy border-gray-300 rounded focus:ring-navy">
                                            <span class="text-sm text-ink flex-1">${displayName} (${m.student_number || 'N/A'})</span>
                                        </span>
                                        <span class="text-xs text-muted bg-white px-2 py-1 rounded-lg border border-line ml-6 sm:ml-0">${m.role_name || m.position || 'Member'}</span>
                                    </label>
                                `;
                            }).join('')}
                        </div>
                    </div>
                    <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                            <label for="startDate" class="${LABEL_CLASS}">Start Date <span class="text-red-500">*</span></label>
                            <input type="date" id="startDate" name="startDate" value="${startDateVal}" required class="${FIELD_CLASS}">
                        </div>
                        <div>
                            <label for="endDate" class="${LABEL_CLASS}">End Date <span class="text-red-500">*</span></label>
                            <input type="date" id="endDate" name="endDate" value="${endDateVal}" required class="${FIELD_CLASS}">
                        </div>
                    </div>
                    ${eventId ? `
                    <button type="button" id="syncToEventBtn" class="w-full px-3 py-2.5 text-xs font-medium text-navy bg-blue-50 hover:bg-blue-100 rounded-xl border border-blue-100 transition flex items-center justify-center gap-2">
                        <i data-lucide="refresh-cw" class="w-3 h-3"></i>
                        <span>Sync to Event Schedule</span>
                    </button>
                    ` : ''}
                </div>
            `)}
            ${modalSection('Student Schedule Configuration', `
                <div class="space-y-3">
                    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                        <p class="text-sm text-muted">Configure daily schedules for each student</p>
                        <button type="button" id="applyToAllBtn" class="w-full sm:w-auto px-3 py-2 text-xs font-medium text-navy bg-blue-50 hover:bg-blue-100 rounded-xl border border-blue-100 transition">
                            Apply to All Students
                        </button>
                    </div>
                    <div id="studentSchedulesContainer" class="space-y-3 max-h-80 overflow-y-auto rounded-xl border border-line p-2 sm:p-3 bg-surface">
                        <p class="text-sm text-muted text-center py-4">Select students first to configure their schedules</p>
                    </div>
                </div>
            `)}
            <div id="formError" class="hidden text-sm text-red-700 bg-red-50 border border-red-200 rounded-xl px-3 py-2.5"></div>
            ${modalActions({ cancelOnclick: 'closeTaskModal()', submitText: buttonText })}
        </form>
    `;

    openModal(title, formContent, 'large');
    applyModalDomino();
    setupFormHandlers({ taskId, buttonText, onSubmit, task, taskGroup, isEdit, event });
}

function setupFormHandlers({ taskId, buttonText, onSubmit, task, taskGroup, isEdit, event }) {
    const form = document.getElementById('taskForm');
    if (form) {
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            await processTaskSubmit({ isEdit, taskGroup, taskId, buttonText, onSubmit });
        });
    }

    const startDateInput = document.getElementById('startDate');
    const endDateInput = document.getElementById('endDate');
    const studentSchedulesContainer = document.getElementById('studentSchedulesContainer');
    const applyToAllBtn = document.getElementById('applyToAllBtn');
    const syncToEventBtn = document.getElementById('syncToEventBtn');
    const selectAllStudentsBtn = document.getElementById('selectAllStudentsBtn');
    const studentsList = document.getElementById('studentsList');
    
    let studentSchedules = {};

    if (isEdit) {
        if (taskGroup && taskGroup.students) {
            taskGroup.students.forEach(st => {
                const sId = parseInt(st.student_id);
                if (!studentSchedules[sId]) {
                    const schedules = (st.daily_schedules && st.daily_schedules.length > 0)
                        ? st.daily_schedules.map(ds => ({
                            id: ds.id,
                            date: ds.schedule_date,
                            start_time: ds.start_time ? ds.start_time.substring(0, 5) : '09:00',
                            end_time: ds.end_time ? ds.end_time.substring(0, 5) : '17:00',
                            status: ds.status || 'pending'
                        }))
                        : [];
                    studentSchedules[sId] = schedules;
                    studentSchedules[sId].student_start_date = st.student_start_date || st.start_date || startDateInput.value;
                    studentSchedules[sId].student_end_date = st.student_end_date || st.end_date || endDateInput.value;
                }
            });
        } else if (task) {
            const sId = parseInt(task.student_id);
            const schedules = (task.daily_schedules && task.daily_schedules.length > 0)
                ? task.daily_schedules.map(ds => ({
                    id: ds.id,
                    date: ds.schedule_date,
                    start_time: ds.start_time ? ds.start_time.substring(0, 5) : '09:00',
                    end_time: ds.end_time ? ds.end_time.substring(0, 5) : '17:00',
                    status: ds.status || 'pending'
                }))
                : [];
            studentSchedules[sId] = schedules;
            studentSchedules[sId].student_start_date = task.student_start_date || task.start_date || startDateInput.value;
            studentSchedules[sId].student_end_date = task.student_end_date || task.end_date || endDateInput.value;
        }
    }
    
    const renderStudentSchedules = () => {
        const selectedCheckboxes = Array.from(document.querySelectorAll('input[name="studentSelect"]:checked'));
        const selectedStudents = selectedCheckboxes.map(cb => {
            const label = cb.closest('label');
            return {
                id: parseInt(cb.value),
                name: label ? label.querySelector('span').textContent : `Student #${cb.value}`
            };
        });
        
        if (selectedStudents.length === 0) {
            studentSchedulesContainer.innerHTML = '<p class="text-sm text-muted text-center py-4">Select students first to configure their schedules</p>';
            return;
        }
        
        const startDate = startDateInput.value;
        const endDate = endDateInput.value;
        
        if (!startDate || !endDate) {
            studentSchedulesContainer.innerHTML = '<p class="text-sm text-muted text-center py-4">Select start and end dates to generate schedules</p>';
            return;
        }
        
        const start = new Date(startDate);
        const end = new Date(endDate);
        
        if (start > end) {
            studentSchedulesContainer.innerHTML = '<p class="text-sm text-red-500 text-center py-4">Start date must be before or equal to end date</p>';
            return;
        }
        
        const dates = getDatesInRange(start, end);
        
        let html = '';
        selectedStudents.forEach(student => {
            const studentId = student.id;
            if (!studentSchedules[studentId] || studentSchedules[studentId].length === 0) {

                const templateId = Object.keys(studentSchedules).find(id => 
                    studentSchedules[id] && studentSchedules[id].length > 0
                );
                if (templateId && studentSchedules[templateId]) {
                    studentSchedules[studentId] = dates.map(date => {
                        const dateStr = date.toISOString().split('T')[0];
                        const existingMatch = studentSchedules[templateId].find(s => s.date === dateStr);
                        return {
                            date: dateStr,
                            start_time: existingMatch ? existingMatch.start_time : (studentSchedules[templateId][0]?.start_time || '09:00'),
                            end_time: existingMatch ? existingMatch.end_time : (studentSchedules[templateId][0]?.end_time || '17:00'),
                            status: 'pending'
                        };
                    });
                } else {
                    studentSchedules[studentId] = dates.map(date => ({
                        date: date.toISOString().split('T')[0],
                        start_time: '09:00',
                        end_time: '17:00',
                        status: 'pending'
                    }));
                }
                studentSchedules[studentId].student_start_date = startDate;
                studentSchedules[studentId].student_end_date = endDate;
            }
            
            html += `
                <div class="bg-white rounded-2xl border border-line p-3" data-student-id="${studentId}">
                    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-3">
                        <h4 class="text-sm font-semibold text-ink">${student.name}</h4>
                        <button type="button" class="w-full sm:w-auto px-2.5 py-1.5 text-xs font-medium text-navy bg-blue-50 hover:bg-blue-100 rounded-xl border border-blue-100 transition" onclick="copySchedulesToAll(${studentId})">
                            Copy to All
                        </button>
                    </div>
                    <div class="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-3">
                        <div>
                            <label class="block text-xs font-medium text-ink mb-1">Student Start Date</label>
                            <input type="date" name="student_${studentId}_start_date" value="${studentSchedules[studentId]?.student_start_date || startDate}" 
                                class="w-full px-2.5 py-2 text-xs border border-line rounded-xl focus:ring-2 focus:ring-navy/15"
                                onchange="updateStudentDate(${studentId}, 'student_start_date', this.value)">
                        </div>
                        <div>
                            <label class="block text-xs font-medium text-ink mb-1">Student End Date</label>
                            <input type="date" name="student_${studentId}_end_date" value="${studentSchedules[studentId]?.student_end_date || endDate}" 
                                class="w-full px-2.5 py-2 text-xs border border-line rounded-xl focus:ring-2 focus:ring-navy/15"
                                onchange="updateStudentDate(${studentId}, 'student_end_date', this.value)">
                        </div>
                    </div>
                    <div class="space-y-2 max-h-40 overflow-y-auto">
                        ${studentSchedules[studentId].map((schedule, index) => {
                            const schedDateStr = schedule.date || schedule.schedule_date || '';
                            const date = schedDateStr ? new Date(schedDateStr + 'T00:00:00') : new Date();
                            const formattedDate = date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
                            const startTimeVal = schedule.start_time ? schedule.start_time.substring(0, 5) : '09:00';
                            const endTimeVal = schedule.end_time ? schedule.end_time.substring(0, 5) : '17:00';
                            return `
                                <div class="flex flex-col sm:flex-row sm:items-center gap-2 p-2.5 bg-surface rounded-xl border border-line">
                                    <div class="flex items-center justify-between sm:justify-start gap-2 shrink-0">
                                        <span class="text-xs font-bold text-navy">Day ${schedule.day_number || (index + 1)}</span>
                                        <span class="text-xs font-medium text-muted">${formattedDate}</span>
                                    </div>
                                    <div class="flex items-center gap-2 min-w-0">
                                        <input type="time" name="schedule_${studentId}_${index}_start" value="${startTimeVal}" 
                                            class="flex-1 px-2 py-1.5 text-xs border border-line rounded-lg focus:ring-2 focus:ring-navy/15"
                                            onchange="updateSchedule(${studentId}, ${index}, 'start_time', this.value)">
                                        <span class="text-xs text-muted">to</span>
                                        <input type="time" name="schedule_${studentId}_${index}_end" value="${endTimeVal}" 
                                            class="flex-1 px-2 py-1.5 text-xs border border-line rounded-lg focus:ring-2 focus:ring-navy/15"
                                            onchange="updateSchedule(${studentId}, ${index}, 'end_time', this.value)">
                                    </div>
                                    <input type="hidden" name="schedule_${studentId}_${index}_date" value="${schedDateStr}">
                                </div>
                            `;
                        }).join('')}
                    </div>
                </div>
            `;
        });
        
        studentSchedulesContainer.innerHTML = html;
    };
    
    window.updateSchedule = (studentId, index, field, value) => {
        if (studentSchedules[studentId] && studentSchedules[studentId][index]) {
            studentSchedules[studentId][index][field] = value;
        }
    };
    
    window.updateStudentDate = (studentId, field, value) => {
        if (!studentSchedules[studentId]) {
            studentSchedules[studentId] = [];
        }
        studentSchedules[studentId][field] = value;
    };
    
    window.copySchedulesToAll = (sourceStudentId) => {
        const sourceSchedules = studentSchedules[sourceStudentId];
        if (!sourceSchedules) return;
        
        const selectedCheckboxes = Array.from(document.querySelectorAll('input[name="studentSelect"]:checked'));
        selectedCheckboxes.forEach(cb => {
            const studentId = parseInt(cb.value);
            if (studentId !== sourceStudentId) {
                studentSchedules[studentId] = sourceSchedules.map(s => ({ ...s }));
                studentSchedules[studentId].student_start_date = sourceSchedules.student_start_date;
                studentSchedules[studentId].student_end_date = sourceSchedules.student_end_date;
            }
        });
        
        renderStudentSchedules();
        showToast('Schedules copied to all students', 'success');
    };
    
    if (startDateInput) {
        startDateInput.addEventListener('change', () => {

            Object.keys(studentSchedules).forEach(id => {
                delete studentSchedules[id];
            });
            renderStudentSchedules();
        });
    }
    
    if (endDateInput) {
        endDateInput.addEventListener('change', () => {
            Object.keys(studentSchedules).forEach(id => {
                delete studentSchedules[id];
            });
            renderStudentSchedules();
        });
    }
    
    if (studentsList) {
        studentsList.addEventListener('change', () => {
            const checkboxes = document.querySelectorAll('input[name="studentSelect"]');
            const allChecked = checkboxes.length > 0 && Array.from(checkboxes).every(cb => cb.checked);
            if (selectAllStudentsBtn) {
                selectAllStudentsBtn.textContent = allChecked ? 'Deselect All' : 'Select All';
            }
            renderStudentSchedules();
        });
    }
    
    if (applyToAllBtn) {
        applyToAllBtn.addEventListener('click', () => {
            const selectedCheckboxes = Array.from(document.querySelectorAll('input[name="studentSelect"]:checked'));
            if (selectedCheckboxes.length === 0) {
                showToast('No students selected', 'error');
                return;
            }
            
            const firstStudentId = parseInt(selectedCheckboxes[0].value);
            window.copySchedulesToAll(firstStudentId);
        });
    }

    if (syncToEventBtn) {
        syncToEventBtn.addEventListener('click', async () => {
            const eventId = document.getElementById('eventId').value;
            if (!eventId) {
                showToast('No event selected', 'error');
                return;
            }

            syncToEventBtn.disabled = true;
            syncToEventBtn.innerHTML = '<i data-lucide="loader-2" class="w-3 h-3 animate-spin"></i><span>Syncing...</span>';
            if (typeof lucide !== 'undefined') lucide.createIcons();

            try {
                const token = getToken('adviser');
                const response = await fetch(API_ROUTES.ADVISER.EVENT_GET(eventId), {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    }
                });

                if (!response.ok) {
                    throw new Error('Failed to fetch event details');
                }

                const data = await response.json();
                const ev = data.event || data;

                if (ev && (ev.event_day_start || ev.start_date) && (ev.event_day_end || ev.end_date)) {
                    const eStart = ev.event_day_start || ev.start_date;
                    const eEnd = ev.event_day_end || ev.end_date;
                    startDateInput.value = eStart;
                    endDateInput.value = eEnd;
                    
                    const start = new Date(eStart + 'T00:00:00');
                    const end = new Date(eEnd + 'T00:00:00');
                    const dates = getDatesInRange(start, end);

                    let baseSchedules = [];
                    if (ev.daily_schedules && ev.daily_schedules.length > 0) {
                        baseSchedules = ev.daily_schedules.map((ds, idx) => ({
                            day_number: ds.day_number || (idx + 1),
                            date: ds.schedule_date || ds.date,
                            start_time: ds.start_time ? ds.start_time.substring(0, 5) : '09:00',
                            end_time: ds.end_time ? ds.end_time.substring(0, 5) : '17:00',
                            status: ds.status || 'pending'
                        }));
                    } else {
                        baseSchedules = dates.map((date, idx) => ({
                            day_number: idx + 1,
                            date: formatLocalDate(date),
                            start_time: '09:00',
                            end_time: '17:00',
                            status: 'pending'
                        }));
                    }
                    
                    const selectedStudents = Array.from(document.querySelectorAll('input[name="studentSelect"]:checked')).map(cb => parseInt(cb.value));
                    selectedStudents.forEach(studentId => {
                        studentSchedules[studentId] = baseSchedules.map(s => ({ ...s }));
                        studentSchedules[studentId].student_start_date = eStart;
                        studentSchedules[studentId].student_end_date = eEnd;
                    });
                    
                    renderStudentSchedules();
                    showToast('Synced to event schedule', 'success');
                } else {
                    showToast('Event has no date range set', 'error');
                }
            } catch (error) {
                console.error('Error syncing to event:', error);
                showToast('Failed to sync to event schedule', 'error');
            } finally {
                syncToEventBtn.disabled = false;
                syncToEventBtn.innerHTML = '<i data-lucide="refresh-cw" class="w-3 h-3"></i><span>Sync to Event Schedule</span>';
                if (typeof lucide !== 'undefined') lucide.createIcons();
            }
        });
    }

    if (selectAllStudentsBtn) {
        selectAllStudentsBtn.addEventListener('click', () => {
            const checkboxes = document.querySelectorAll('input[name="studentSelect"]');
            const allChecked = Array.from(checkboxes).every(cb => cb.checked);
            checkboxes.forEach(cb => cb.checked = !allChecked);
            selectAllStudentsBtn.textContent = !allChecked ? 'Deselect All' : 'Select All';
            renderStudentSchedules();
        });
    }
    
    window.getStudentSchedules = () => studentSchedules;

    renderStudentSchedules();
}

function formatLocalDate(d) {
    if (!d) return '';
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
}

function getDatesInRange(startDate, endDate) {
    const dates = [];
    let currentDate = new Date(startDate);
    const end = new Date(endDate);
    
    while (currentDate <= end) {
        dates.push(new Date(currentDate));
        currentDate.setDate(currentDate.getDate() + 1);
    }
    
    return dates;
}

function showFormError(message) {
    const el = document.getElementById('formError');
    if (el) {
        el.textContent = message;
        el.classList.remove('hidden');
    }
}

function hideFormError() {
    const el = document.getElementById('formError');
    if (el) el.classList.add('hidden');
}

async function processTaskSubmit({ isEdit, taskGroup, taskId, buttonText, onSubmit }) {
    hideFormError();

    const studentSchedules = window.getStudentSchedules();
    const selectedCheckboxes = Array.from(document.querySelectorAll('input[name="studentSelect"]:checked'));
    const selectedStudentIds = [...new Set(selectedCheckboxes.map(cb => parseInt(cb.value)))];
    
    if (selectedStudentIds.length === 0) {
        showFormError('Please select at least one student');
        return;
    }

    const taskTitle = document.getElementById('taskTitle').value.trim() || null;
    const taskDescription = document.getElementById('taskDescription').value.trim();
    const startDate = document.getElementById('startDate').value;
    const endDate = document.getElementById('endDate').value;

    if (!taskDescription) {
        showFormError('Please enter a task description');
        return;
    }

    if (!startDate || !endDate) {
        showFormError('Please select start and end dates');
        return;
    }

    if (new Date(startDate) > new Date(endDate)) {
        showFormError('Start date must be before or equal to end date');
        return;
    }

    const eventId = parseInt(document.getElementById('eventId').value);
    const organizationId = parseInt(document.getElementById('organizationId').value);

    const existingTaskIds = isEdit 
        ? (taskGroup && taskGroup.students ? taskGroup.students.map(s => s.id) : (taskId ? [taskId] : []))
        : [];

    const dates = getDatesInRange(new Date(startDate), new Date(endDate));

    const studentsPayload = selectedStudentIds.map(studentId => {
        let schedules = studentSchedules[studentId];
        if (!schedules || schedules.length === 0) {
            schedules = dates.map((date, idx) => ({
                day_number: idx + 1,
                date: formatLocalDate(date),
                start_time: '09:00',
                end_time: '17:00',
                status: 'pending'
            }));
        }

        return {
            student_id: studentId,
            student_start_date: studentSchedules[studentId]?.student_start_date || startDate,
            student_end_date: studentSchedules[studentId]?.student_end_date || endDate,
            daily_schedules: schedules.map((s, schIdx) => {
                const sDate = s.date || s.schedule_date;
                const sStart = s.start_time ? (s.start_time.length === 5 ? s.start_time + ':00' : s.start_time) : '09:00:00';
                const sEnd = s.end_time ? (s.end_time.length === 5 ? s.end_time + ':00' : s.end_time) : '17:00:00';
                return {
                    day_number: s.day_number || (schIdx + 1),
                    date: sDate,
                    start_time: sStart,
                    end_time: sEnd,
                    status: s.status || 'pending'
                };
            })
        };
    });

    const payload = {
        event_id: eventId,
        organization_id: organizationId,
        task_title: taskTitle,
        task_description: taskDescription,
        start_date: startDate,
        end_date: endDate,
        task_ids: existingTaskIds,
        students: studentsPayload
    };

    setModalButtonLoading('submitBtn', true, buttonText);

    try {
        await onSubmit(payload, taskId);
        closeTaskModal();
        showToast(isEdit ? 'Task updated successfully' : `Task assigned to ${studentsPayload.length} student(s) successfully`, 'success');
    } catch (error) {
        console.error('Error saving task:', error);
        showFormError(error.message || 'Failed to save task. Please try again.');
        setModalButtonLoading('submitBtn', false, buttonText);
        showToast(isEdit ? 'Failed to update task' : 'Failed to add task', 'error');
    }
}

async function closeTaskModal() {
    const modalOverlay = document.getElementById('modal-overlay');
    const modalContent = document.getElementById('modal-content');
    
    if (modalOverlay && modalContent) {
        await animateModalClose(modalOverlay, modalContent, 'scale');
        clearModalAnimations(modalOverlay, modalContent);
        modalOverlay.remove();
        document.body.classList.remove('overflow-hidden');
        document.removeEventListener('keydown', (e) => {
            if (e.key === 'Escape') closeTaskModal();
        });
    } else {
        closeModal();
    }
}

window.closeTaskModal = closeTaskModal;

import { openModal, closeModal, setModalButtonLoading } from '../../../utils/modal.js';
import { animateModalOpen, animateModalClose, clearModalAnimations, animateFormElements } from '../../../provider/ModalAnimation.js';
import { showToast } from '../../ToastMessage.js';
import { API_ROUTES } from '../../../api/server/api.js';
import { getToken } from '../../../utils/jwt.js';
import { MembershipValidator } from '../../../validator/MembershipValidator.js';

export function openTaskModal({ mode = 'add', task = null, taskId = null, taskGroup = null, eventId, eventTitle, organizationId, memberships = [], onSubmit }) {
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
        : '';
    const endDateVal = isEdit 
        ? ((taskGroup?.students && (taskGroup.students[0]?.student_end_date || taskGroup.students[0]?.end_date)) || task?.student_end_date || task?.end_date || '') 
        : '';

    const allCheckedInitially = uniqueMemberships.length > 0 && uniqueMemberships.every(m => assignedStudentIds.has(parseInt(m.student_id)));

    const formContent = `
        <form id="taskForm" class="space-y-5">
            ${isEdit ? `<input type="hidden" id="taskId" value="${task?.id || taskId || ''}">` : ''}
            <input type="hidden" id="eventId" value="${eventId || ''}">
            <input type="hidden" id="organizationId" value="${organizationId || ''}">

            <fieldset>
                <legend class="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Event Context</legend>
                <div class="bg-blue-50 border border-blue-200 rounded-md p-3">
                    <p class="text-sm font-medium text-blue-900">${eventTitle || 'Event'}</p>
                </div>
            </fieldset>

            <fieldset>
                <legend class="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Task Details</legend>
                <div class="space-y-3">
                    <div>
                        <label for="taskTitle" class="block text-sm font-medium text-gray-700 mb-1">Task Title</label>
                        <input type="text" id="taskTitle" name="taskTitle"
                            placeholder="Enter a brief title for the task"
                            class="w-full px-3 py-2 text-sm border border-gray-200 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                            value="${taskTitleVal}">
                    </div>
                    <div>
                        <label for="taskDescription" class="block text-sm font-medium text-gray-700 mb-1">Task Description <span class="text-red-500">*</span></label>
                        <textarea id="taskDescription" name="taskDescription" rows="3" required
                            placeholder="Describe the task to be completed"
                            class="w-full px-3 py-2 text-sm border border-gray-200 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent transition resize-none">${taskDescVal}</textarea>
                    </div>
                    <div>
                        <div class="flex items-center justify-between mb-2">
                            <label class="block text-sm font-medium text-gray-700">Assign to Students <span class="text-red-500">*</span></label>
                            <button type="button" id="selectAllStudentsBtn" class="text-xs text-blue-900 hover:text-blue-700 font-medium">
                                ${allCheckedInitially ? 'Deselect All' : 'Select All'}
                            </button>
                        </div>
                        <div id="studentsList" class="space-y-2 max-h-40 overflow-y-auto border border-gray-200 rounded-md p-3 bg-gray-50">
                            ${uniqueMemberships.map(m => {
                                const isChecked = isEdit && assignedStudentIds.has(parseInt(m.student_id));
                                const isInactive = MembershipValidator.isInactive(m);
                                const displayName = MembershipValidator.getDisplayName(m);
                                return `
                                    <label class="flex items-center gap-2 cursor-pointer hover:bg-gray-100 p-1 rounded ${isInactive ? 'opacity-60 cursor-not-allowed' : ''}">
                                        <input type="checkbox" name="studentSelect" value="${m.student_id}" ${isChecked ? 'checked' : ''} ${isInactive ? 'disabled' : ''}
                                            class="w-4 h-4 text-blue-900 border-gray-300 rounded focus:ring-blue-500">
                                        <span class="text-sm text-gray-700 flex-1">${displayName} (${m.student_number || 'N/A'})</span>
                                        <span class="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">${m.role_name || m.position || 'Member'}</span>
                                    </label>
                                `;
                            }).join('')}
                        </div>
                    </div>
                    <div class="grid grid-cols-2 gap-3">
                        <div>
                            <label for="startDate" class="block text-sm font-medium text-gray-700 mb-1">Start Date <span class="text-red-500">*</span></label>
                            <input type="date" id="startDate" name="startDate" value="${startDateVal}" required
                                class="w-full px-3 py-2 text-sm border border-gray-200 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent transition">
                        </div>
                        <div>
                            <label for="endDate" class="block text-sm font-medium text-gray-700 mb-1">End Date <span class="text-red-500">*</span></label>
                            <input type="date" id="endDate" name="endDate" value="${endDateVal}" required
                                class="w-full px-3 py-2 text-sm border border-gray-200 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent transition">
                        </div>
                    </div>
                    ${eventId ? `
                    <button type="button" id="syncToEventBtn" class="w-full px-3 py-2 text-xs font-medium text-blue-900 bg-blue-50 hover:bg-blue-100 rounded border border-blue-200 transition flex items-center justify-center gap-2">
                        <i data-lucide="refresh-cw" class="w-3 h-3"></i>
                        <span>Sync to Event Schedule</span>
                    </button>
                    ` : ''}
                </div>
            </fieldset>

            <hr class="border-gray-100">

            <fieldset>
                <legend class="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Student Schedule Configuration</legend>
                <div class="space-y-3">
                    <div class="flex items-center justify-between">
                        <p class="text-sm text-gray-600">Configure daily schedules for each student</p>
                        <button type="button" id="applyToAllBtn" class="px-3 py-1 text-xs font-medium text-blue-900 bg-blue-50 hover:bg-blue-100 rounded border border-blue-200 transition">
                            Apply to All Students
                        </button>
                    </div>
                    <div id="studentSchedulesContainer" class="space-y-4 max-h-80 overflow-y-auto border border-gray-200 rounded-md p-3 bg-gray-50">
                        <p class="text-sm text-gray-400 text-center py-4">Select students first to configure their schedules</p>
                    </div>
                </div>
            </fieldset>

            <div id="formError" class="hidden text-sm text-red-600 bg-red-50 border border-red-200 rounded-md px-3 py-2"></div>

            <div class="flex justify-end pt-3 border-t border-gray-100 flex-row gap-2">
                <button 
                    type="button" 
                    onclick="closeTaskModal()" 
                    class="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-200 transition">
                    Cancel
                </button>
                <button 
                    type="submit" 
                    id="submitBtn" 
                    class="px-5 py-2 text-sm font-medium text-white bg-blue-900 hover:bg-blue-800 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 transition">
                    ${buttonText}
                </button>
            </div>
        </form>
    `;

    openModal(title, formContent, 'mid-large');

    const modalOverlay = document.getElementById('modal-overlay');
    const modalContent = document.getElementById('modal-content');
    if (modalOverlay && modalContent) {
        animateModalOpen(modalOverlay, modalContent, 'scale');
    }

    setTimeout(() => {
        const form = document.getElementById('taskForm');
        if (form) {
            animateFormElements(form);
        }
    }, 100);

    setupFormHandlers({ taskId, buttonText, onSubmit, task, taskGroup, isEdit });
}

function setupFormHandlers({ taskId, buttonText, onSubmit, task, taskGroup, isEdit }) {
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
            studentSchedulesContainer.innerHTML = '<p class="text-sm text-gray-400 text-center py-4">Select students first to configure their schedules</p>';
            return;
        }
        
        const startDate = startDateInput.value;
        const endDate = endDateInput.value;
        
        if (!startDate || !endDate) {
            studentSchedulesContainer.innerHTML = '<p class="text-sm text-gray-400 text-center py-4">Select start and end dates to generate schedules</p>';
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
                <div class="bg-white rounded border border-gray-200 p-3" data-student-id="${studentId}">
                    <div class="flex items-center justify-between mb-2">
                        <h4 class="text-sm font-semibold text-gray-900">${student.name}</h4>
                        <button type="button" class="px-2 py-1 text-xs font-medium text-blue-900 bg-blue-50 hover:bg-blue-100 rounded border border-blue-200 transition" onclick="copySchedulesToAll(${studentId})">
                            Copy to All
                        </button>
                    </div>
                    <div class="grid grid-cols-2 gap-2 mb-3">
                        <div>
                            <label class="block text-xs font-medium text-gray-700 mb-1">Student Start Date</label>
                            <input type="date" name="student_${studentId}_start_date" value="${studentSchedules[studentId]?.student_start_date || startDate}" 
                                class="w-full px-2 py-1 text-xs border border-gray-200 rounded focus:ring-2 focus:ring-blue-500"
                                onchange="updateStudentDate(${studentId}, 'student_start_date', this.value)">
                        </div>
                        <div>
                            <label class="block text-xs font-medium text-gray-700 mb-1">Student End Date</label>
                            <input type="date" name="student_${studentId}_end_date" value="${studentSchedules[studentId]?.student_end_date || endDate}" 
                                class="w-full px-2 py-1 text-xs border border-gray-200 rounded focus:ring-2 focus:ring-blue-500"
                                onchange="updateStudentDate(${studentId}, 'student_end_date', this.value)">
                        </div>
                    </div>
                    <div class="space-y-2 max-h-40 overflow-y-auto">
                        ${studentSchedules[studentId].map((schedule, index) => {
                            const date = new Date(schedule.date);
                            const formattedDate = date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
                            return `
                                <div class="flex items-center gap-2 p-2 bg-gray-50 rounded border border-gray-200">
                                    <span class="text-xs font-medium text-gray-700 w-28">${formattedDate}</span>
                                    <input type="time" name="schedule_${studentId}_${index}_start" value="${schedule.start_time}" 
                                        class="px-2 py-1 text-xs border border-gray-200 rounded focus:ring-2 focus:ring-blue-500"
                                        onchange="updateSchedule(${studentId}, ${index}, 'start_time', this.value)">
                                    <span class="text-xs text-gray-500">to</span>
                                    <input type="time" name="schedule_${studentId}_${index}_end" value="${schedule.end_time}" 
                                        class="px-2 py-1 text-xs border border-gray-200 rounded focus:ring-2 focus:ring-blue-500"
                                        onchange="updateSchedule(${studentId}, ${index}, 'end_time', this.value)">
                                    <input type="hidden" name="schedule_${studentId}_${index}_date" value="${schedule.date}">
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
                const token = getToken();
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
                const event = data.event;

                if (event.event_day_start && event.event_day_end) {
                    startDateInput.value = event.event_day_start;
                    endDateInput.value = event.event_day_end;
                    
                    const start = new Date(event.event_day_start);
                    const end = new Date(event.event_day_end);
                    const dates = getDatesInRange(start, end);

                    const baseSchedules = dates.map(date => ({
                        date: date.toISOString().split('T')[0],
                        start_time: '09:00',
                        end_time: '17:00'
                    }));

                    if (event.daily_schedules && event.daily_schedules.length > 0) {
                        baseSchedules.length = 0;
                        baseSchedules.push(...event.daily_schedules);
                    }
                    
                    const selectedStudents = Array.from(document.querySelectorAll('input[name="studentSelect"]:checked')).map(cb => parseInt(cb.value));
                    selectedStudents.forEach(studentId => {
                        studentSchedules[studentId] = baseSchedules.map(s => ({ ...s }));
                        studentSchedules[studentId].student_start_date = event.event_day_start;
                        studentSchedules[studentId].student_end_date = event.event_day_end;
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
            schedules = dates.map(date => ({
                date: date.toISOString().split('T')[0],
                start_time: '09:00',
                end_time: '17:00',
                status: 'pending'
            }));
        }

        return {
            student_id: studentId,
            student_start_date: studentSchedules[studentId]?.student_start_date || startDate,
            student_end_date: studentSchedules[studentId]?.student_end_date || endDate,
            daily_schedules: schedules.map(s => ({
                date: s.date,
                start_time: s.start_time,
                end_time: s.end_time,
                status: s.status || 'pending'
            }))
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
        document.removeEventListener('keydown', (e) => {
            if (e.key === 'Escape') closeTaskModal();
        });
    } else {
        closeModal();
    }
}

window.closeTaskModal = closeTaskModal;

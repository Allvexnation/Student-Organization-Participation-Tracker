import { AdviserNavbar, initAdviserNavbar } from '../../../components/Navbar/AdviserNavbar.js';
import { isAuthenticated } from '../../../utils/jwt.js';
import { navigate } from '../../../utils/navigation.js';
import * as AdviserEventsAPI from '../../../api/adviser/Events/AdviserEvents.js';
import * as AdviserOrganizationAPI from '../../../api/adviser/Organization/AdviserOrganization.js';
import { openTaskModal } from '../../../components/Modal/Adviser/TaskModal.js';
import { showToast } from '../../../components/ToastMessage.js';
import { CrudMenu } from '../../../components/CrudMenu.js';
import { skeletonTableRows } from '../../../components/SkeletonLoading.js';
import { openConfirmDialog } from '../../../components/Dialog/ConfirmDialog.js';

export function AdviserEvents() {
    return `
        ${AdviserNavbar()}
        <main class="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
                <div>
                    <h1 class="text-2xl font-semibold text-gray-900">Events & Tasks</h1>
                    <p class="text-sm text-gray-500 mt-1">Manage tasks for registered events and organization members</p>
                </div>
                <div class="flex items-center gap-2.5">
                    <select 
                        id="eventSelect" 
                        class="px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent w-48 sm:w-64">
                        <option value="">Select Event</option>
                    </select>
                    <button 
                        type="button" 
                        id="addTaskBtn" 
                        class="px-4 py-2 text-sm font-medium text-white bg-blue-900 hover:bg-blue-800 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition flex items-center gap-2 shadow-sm">
                        <i data-lucide="plus" class="w-4 h-4"></i>
                        <span>Add Task</span>
                    </button>
                </div>
            </div>

            <div class="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
                <div class="overflow-x-auto">
                    <table class="w-full text-sm text-left">
                        <thead>
                            <tr class="bg-gray-50 border-b border-gray-200 text-xs font-medium text-gray-500 uppercase tracking-wider">
                                <th class="px-5 py-3.5 w-12 text-center">#</th>
                                <th class="px-5 py-3.5">Task</th>
                                <th class="px-5 py-3.5">Student</th>
                                <th class="px-5 py-3.5 hidden sm:table-cell">Organization</th>
                                <th class="px-5 py-3.5">Due Date</th>
                                <th class="px-5 py-3.5">Status</th>
                                <th class="px-5 py-3.5 text-center w-28">Actions</th>
                            </tr>
                        </thead>
                        <tbody id="tasksTableBody" class="divide-y divide-gray-100">
                            ${skeletonTableRows(window.innerWidth < 640 ? 3 : 4, window.innerWidth < 640 ? 3 : 7, true)}
                        </tbody>
                    </table>
                </div>
            </div>
        </main>
    `;
}

export async function initAdviserEvents() {
    if (!isAuthenticated('adviser')) {
        navigate('/auth/adviser/login');
        return;
    }
    await initAdviserNavbar();

    let events = [];
    let selectedEvent = null;
    let organizations = [];
    let selectedOrganization = null;
    let tasks = [];
    let memberships = [];
    let currentGroupedTasks = [];

    async function loadEvents() {
        try {
            events = await AdviserEventsAPI.getRegisteredEvents();
            renderEventSelect();
        } catch (error) {
            console.error('Error loading events:', error);
            showToast('Failed to load events', 'error');
        }
    }

    function renderEventSelect() {
        const select = document.getElementById('eventSelect');
        if (!select) return;

        select.innerHTML = '<option value="">Select Event</option>';
        
        events.forEach(event => {
            const option = document.createElement('option');
            option.value = event.event_id;
            option.textContent = event.event_title;
            select.appendChild(option);
        });

        if (events.length > 0) {
            select.value = events[0].event_id;
            handleEventChange();
        }
    }

    async function handleEventChange() {
        const select = document.getElementById('eventSelect');
        if (!select) return;

        const eventId = parseInt(select.value);
        selectedEvent = events.find(e => e.event_id === eventId);

        if (selectedEvent) {
            await Promise.all([
                loadOrganizationsByEvent(eventId),
                loadTasksByEvent(eventId)
            ]);
        } else {
            organizations = [];
            selectedOrganization = null;
            tasks = [];
            memberships = [];
            currentGroupedTasks = [];
            renderTasks([]);
        }
    }

    async function loadOrganizationsByEvent(eventId) {
        try {
            organizations = await AdviserEventsAPI.getOrganizationsByEvent(eventId);
            if (organizations.length > 0) {
                selectedOrganization = organizations[0];
                await loadMemberships(selectedOrganization.organization_id);
            } else {
                selectedOrganization = null;
                memberships = [];
            }
        } catch (error) {
            console.error('Error loading organizations:', error);
            organizations = [];
            selectedOrganization = null;
            memberships = [];
        }
    }

    async function loadMemberships(orgId) {
        try {
            const rawMemberships = await AdviserOrganizationAPI.getAdviserOrgMembershipsByOrg(orgId);
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

    async function loadTasksByEvent(eventId) {
        try {
            tasks = await AdviserEventsAPI.getTasksByEvent(eventId);
            await checkOverdueTasks(tasks);
            
            renderTasks(tasks);
        } catch (error) {
            console.error('Error loading tasks:', error);
            const tbody = document.getElementById('tasksTableBody');
            if (tbody) {
                tbody.innerHTML = `
                    <tr>
                        <td colspan="7" class="px-5 py-12 text-center text-red-500">Failed to load tasks</td>
                    </tr>
                `;
            }
            showToast('Failed to load tasks', 'error');
        }
    }

    async function checkOverdueTasks(tasks) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        for (const task of tasks) {
            const endDate = new Date(task.student_end_date || task.end_date);
            
            if (endDate < today && task.status === 'pending') {
                if (task.daily_schedules && task.daily_schedules.length > 0) {
                    const allCompleted = task.daily_schedules.every(s => s.status === 'completed');
                    if (!allCompleted) {
                        await AdviserEventsAPI.updateTaskStatus(task.id, 'not_finished');
                    }
                } else {
                    await AdviserEventsAPI.updateTaskStatus(task.id, 'not_finished');
                }
            }
        }
    }

    async function loadTasksByOrganization(orgId) {
        try {
            tasks = await AdviserEventsAPI.getTasksByOrganization(orgId);
            renderTasks(tasks);
        } catch (error) {
            console.error('Error loading tasks:', error);
            const tbody = document.getElementById('tasksTableBody');
            if (tbody) {
                tbody.innerHTML = `
                    <tr>
                        <td colspan="7" class="px-5 py-12 text-center text-red-500">Failed to load tasks</td>
                    </tr>
                `;
            }
            showToast('Failed to load tasks', 'error');
        }
    }

    function renderTasks(data) {
        const tbody = document.getElementById('tasksTableBody');
        
        if (!tbody) {
            console.error('tasksTableBody element not found');
            return;
        }
        
        if (!data || data.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="7" class="px-5 py-12 text-center">
                        <i data-lucide="check-square" class="w-10 h-10 text-gray-200 mx-auto mb-2"></i>
                        <p class="text-sm text-gray-500 font-medium">No tasks found.</p>
                        <p class="text-xs text-gray-400 mt-1">${selectedEvent ? 'Click "Add Task" to create tasks for event organization members.' : 'Select an event to view tasks.'}</p>
                    </td>
                </tr>
            `;
            if (typeof lucide !== 'undefined') lucide.createIcons();
            currentGroupedTasks = [];
            return;
        }

        const groupedTasks = {};
        data.forEach(task => {
            const key = `${task.event_id || ''}-${task.organization_id || ''}-${task.task_title || ''}-${task.task_description}`;
            if (!groupedTasks[key]) {
                groupedTasks[key] = {
                    title: task.task_title,
                    description: task.task_description,
                    organization_name: task.organization_name,
                    organization_id: task.organization_id,
                    event_id: task.event_id,
                    students: []
                };
            }

            const alreadyHasStudent = groupedTasks[key].students.some(s => s.student_id === task.student_id);
            if (!alreadyHasStudent) {
                groupedTasks[key].students.push(task);
            }
        });

        currentGroupedTasks = Object.values(groupedTasks);

        tbody.innerHTML = currentGroupedTasks.map((group, groupIndex) => {
            const statusColors = {
                'pending': 'bg-yellow-50 text-yellow-700 border border-yellow-200',
                'completed': 'bg-green-50 text-green-700 border border-green-200',
                'overdue': 'bg-red-50 text-red-700 border border-red-200',
                'not_finished': 'bg-orange-50 text-orange-700 border border-orange-200'
            };

            const formatTime = (time) => {
                if (!time) return 'N/A';
                const [hours, minutes] = time.substring(0, 5).split(':');
                const hour = parseInt(hours);
                const ampm = hour >= 12 ? 'PM' : 'AM';
                const hour12 = hour % 12 || 12;
                return `${hour12}:${minutes} ${ampm}`;
            };

            const scheduleStatusColors = {
                'pending': 'bg-yellow-50 text-yellow-700 border border-yellow-200',
                'completed': 'bg-green-50 text-green-700 border border-green-200',
                'not_completed': 'bg-red-50 text-red-700 border border-red-200'
            };

            return `
            <tr style="transition: background-color 0.2s;" onmouseover="this.style.backgroundColor = document.documentElement.classList.contains('dark') ? 'rgba(255, 255, 255, 0.02)' : 'rgba(0, 0, 0, 0.1)'" onmouseout="this.style.backgroundColor = ''">
                <td class="px-3 sm:px-5 py-2 sm:py-3.5 text-xs text-gray-400 text-center font-mono">
                    ${groupIndex + 1}
                </td>
                <td class="px-3 sm:px-5 py-2 sm:py-3.5">
                    <p class="text-xs sm:text-sm font-semibold text-gray-900">${group.title || group.description || 'N/A'}</p>
                    ${group.description && group.title ? `<p class="text-xs text-gray-500 mt-1">${group.description}</p>` : ''}
                </td>
                <td class="px-3 sm:px-5 py-2 sm:py-3.5 text-gray-600 text-sm truncate">
                    ${group.students.length} student(s)
                </td>
                <td class="px-3 sm:px-5 py-2 sm:py-3.5 hidden sm:table-cell text-gray-600 text-sm truncate">${group.organization_name || 'N/A'}</td>
                <td class="px-3 sm:px-5 py-2 sm:py-3.5 text-gray-600 text-sm whitespace-nowrap">
                    ${group.students.length > 0 ? 
                        new Date(group.students[0].student_start_date || group.students[0].start_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) + ' - ' + 
                        new Date(group.students[0].student_end_date || group.students[0].end_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) 
                        : 'N/A'}
                </td>
                <td class="px-3 sm:px-5 py-2 sm:py-3.5">
                    <span class="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200">
                        Active
                    </span>
                </td>
                <td class="px-3 sm:px-5 py-2 sm:py-3.5 text-center">
                    <div class="flex items-center justify-center gap-1">
                        <button 
                            type="button"
                            onclick="toggleTaskStudents(${groupIndex})" 
                            class="p-1.5 text-blue-600 hover:bg-blue-50 rounded-md transition" 
                            title="View Students">
                            <i data-lucide="users" class="w-4 h-4"></i>
                        </button>
                        ${CrudMenu({ 
                            id: String(groupIndex), 
                            showView: false,
                            onEdit: 'editTaskGroup',
                            onDelete: 'deleteTaskGroup',
                            deleteLabel: (group.title || group.description).substring(0, 30) + '...'
                        })}
                    </div>
                </td>
            </tr>
            <tr id="students-${groupIndex}" class="hidden bg-gray-50">
                <td colspan="7" class="px-5 py-4">
                    <div class="space-y-4">
                        ${group.students.map(studentTask => {
                            const hasSchedules = studentTask.daily_schedules && studentTask.daily_schedules.length > 0;
                            const startDate = new Date(studentTask.student_start_date || studentTask.start_date);
                            const endDate = new Date(studentTask.student_end_date || studentTask.end_date);
                            const today = new Date();
                            today.setHours(0, 0, 0, 0);
                            const isOverdue = endDate < today && studentTask.status === 'pending';

                            return `
                                <div class="bg-white rounded-lg border border-gray-200 p-4">
                                    <div class="flex items-center justify-between mb-3">
                                        <div class="flex items-center gap-3">
                                            <div class="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                                                <i data-lucide="user" class="w-5 h-5 text-blue-600"></i>
                                            </div>
                                            <div>
                                                <p class="text-sm font-semibold text-gray-900">${studentTask.student_name || 'N/A'}</p>
                                                <p class="text-xs text-gray-500">${startDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })} - ${endDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</p>
                                            </div>
                                        </div>
                                        <div class="flex items-center gap-2">
                                            <span class="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${statusColors[studentTask.status] || statusColors['pending']}">
                                                ${studentTask.status.charAt(0).toUpperCase() + studentTask.status.slice(1)}
                                                ${isOverdue ? ' (Overdue)' : ''}
                                            </span>
                                            <button 
                                                type="button"
                                                onclick="removeStudentFromTask(${studentTask.id}, '${(studentTask.student_name || 'Student').replace(/'/g, "\\'")}', ${groupIndex})" 
                                                class="p-1.5 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-md transition" 
                                                title="Remove Student from Task">
                                                <i data-lucide="user-minus" class="w-4 h-4"></i>
                                            </button>
                                        </div>
                                    </div>
                                    ${hasSchedules ? `
                                        <div class="mt-3 pt-3 border-t border-gray-200">
                                            <h5 class="text-xs font-semibold text-gray-700 uppercase tracking-wider mb-2">Daily Schedules</h5>
                                            <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                                                ${studentTask.daily_schedules.map(schedule => {
                                                    const date = new Date(schedule.schedule_date);
                                                    const formattedDate = date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
                                                    return `
                                                        <div class="flex items-center justify-between p-2 bg-gray-50 rounded border border-gray-200">
                                                            <div class="flex items-center gap-2">
                                                                <span class="text-xs font-medium text-gray-700">${formattedDate}</span>
                                                                <span class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${scheduleStatusColors[schedule.status] || scheduleStatusColors['pending']}">
                                                                    ${schedule.status ? schedule.status.charAt(0).toUpperCase() + schedule.status.slice(1) : 'Pending'}
                                                                </span>
                                                            </div>
                                                            <div class="flex items-center gap-2">
                                                                <span class="text-xs text-gray-600">${formatTime(schedule.start_time)} - ${formatTime(schedule.end_time)}</span>
                                                                <div class="flex items-center gap-1">
                                                                    <button 
                                                                        onclick="updateScheduleStatus(${schedule.id}, 'pending')" 
                                                                        class="p-1 text-yellow-600 hover:bg-yellow-50 rounded transition" 
                                                                        title="Mark as Pending">
                                                                        <i data-lucide="clock" class="w-3 h-3"></i>
                                                                    </button>
                                                                    <button 
                                                                        onclick="updateScheduleStatus(${schedule.id}, 'completed')" 
                                                                        class="p-1 text-green-600 hover:bg-green-50 rounded transition" 
                                                                        title="Mark as Completed">
                                                                        <i data-lucide="check" class="w-3 h-3"></i>
                                                                    </button>
                                                                    <button 
                                                                        onclick="updateScheduleStatus(${schedule.id}, 'not_completed')" 
                                                                        class="p-1 text-red-600 hover:bg-red-50 rounded transition" 
                                                                        title="Mark as Not Completed">
                                                                        <i data-lucide="x" class="w-3 h-3"></i>
                                                                    </button>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    `;
                                                }).join('')}
                                            </div>
                                        </div>
                                    ` : ''}
                                </div>
                            `;
                        }).join('')}
                    </div>
                </td>
            </tr>
            `;
        }).join('');

        if (typeof lucide !== 'undefined') {
            lucide.createIcons();
        }
    }

    document.getElementById('eventSelect').addEventListener('change', handleEventChange);

    document.getElementById('addTaskBtn').addEventListener('click', () => {
        if (!selectedEvent) {
            showToast('Please select an event first', 'error');
            return;
        }

        if (!selectedOrganization) {
            showToast('No organizations registered for this event', 'error');
            return;
        }

        if (memberships.length === 0) {
            showToast('No members in this organization', 'error');
            return;
        }

        openTaskModal({
            mode: 'add',
            eventId: selectedEvent.event_id,
            eventTitle: selectedEvent.event_title,
            organizationId: selectedOrganization.organization_id,
            memberships: memberships,
            onSubmit: async (payload) => {
                await AdviserEventsAPI.syncTaskGroup(payload);
                loadTasksByEvent(selectedEvent.event_id);
            }
        });
    });

    window.editTaskGroup = (groupIndex) => {
        const group = currentGroupedTasks[parseInt(groupIndex)];
        if (!group) return;

        openTaskModal({
            mode: 'edit',
            taskGroup: group,
            eventId: group.event_id || selectedEvent.event_id,
            eventTitle: selectedEvent.event_title,
            organizationId: group.organization_id || (selectedOrganization ? selectedOrganization.organization_id : null),
            memberships: memberships,
            onSubmit: async (payload) => {
                await AdviserEventsAPI.syncTaskGroup(payload);
                loadTasksByEvent(selectedEvent.event_id);
            }
        });
    };

    window.editTask = (id) => {

        const numId = parseInt(id);
        if (currentGroupedTasks[numId]) {
            window.editTaskGroup(numId);
            return;
        }
        const groupIndex = currentGroupedTasks.findIndex(g => g.students.some(s => s.id == id));
        if (groupIndex !== -1) {
            window.editTaskGroup(groupIndex);
        } else {
            const task = tasks.find(t => t.id == id);
            if (!task) return;
            openTaskModal({
                mode: 'edit',
                taskId: id,
                task: task,
                eventId: selectedEvent.event_id,
                eventTitle: selectedEvent.event_title,
                organizationId: task.organization_id || (selectedOrganization ? selectedOrganization.organization_id : null),
                memberships: memberships,
                onSubmit: async (payload) => {
                    await AdviserEventsAPI.syncTaskGroup(payload);
                    loadTasksByEvent(selectedEvent.event_id);
                }
            });
        }
    };

    window.deleteTaskGroup = (groupIndex, deleteLabel) => {
        const group = currentGroupedTasks[parseInt(groupIndex)];
        if (!group) return;

        const taskIds = group.students.map(s => s.id);
        const taskTitle = group.title || group.description || deleteLabel || 'this task';

        openConfirmDialog({
            title: 'Confirm Delete',
            message: `Are you sure you want to delete "${taskTitle}"? This will delete the task for all assigned students.`,
            confirmText: 'Delete',
            cancelText: 'Cancel',
            type: 'danger',
            onConfirm: async () => {
                try {
                    await AdviserEventsAPI.deleteTaskGroup(taskIds);
                    loadTasksByEvent(selectedEvent.event_id);
                    showToast('Task deleted successfully', 'success');
                } catch (error) {
                    console.error('Error deleting task group:', error);
                    showToast('Failed to delete task', 'error');
                }
            }
        });
    };

    window.deleteTask = (id, deleteLabel) => {
        const numId = parseInt(id);
        if (currentGroupedTasks[numId]) {
            window.deleteTaskGroup(numId, deleteLabel);
            return;
        }
        const groupIndex = currentGroupedTasks.findIndex(g => g.students.some(s => s.id == id));
        if (groupIndex !== -1) {
            window.deleteTaskGroup(groupIndex, deleteLabel);
        } else {
            openConfirmDialog({
                title: 'Confirm Delete',
                message: `Are you sure you want to delete "${deleteLabel || 'this task'}"?`,
                confirmText: 'Delete',
                cancelText: 'Cancel',
                type: 'danger',
                onConfirm: async () => {
                    try {
                        await AdviserEventsAPI.deleteTask(id);
                        loadTasksByEvent(selectedEvent.event_id);
                        showToast('Task deleted successfully', 'success');
                    } catch (error) {
                        console.error('Error deleting task:', error);
                        showToast('Failed to delete task', 'error');
                    }
                }
            });
        }
    };

    window.removeStudentFromTask = (taskId, studentName, groupIndex) => {
        openConfirmDialog({
            title: 'Remove Student',
            message: `Are you sure you want to remove ${studentName} from this task?`,
            confirmText: 'Remove',
            cancelText: 'Cancel',
            type: 'danger',
            onConfirm: async () => {
                try {
                    await AdviserEventsAPI.deleteTask(taskId);
                    await loadTasksByEvent(selectedEvent.event_id);
                    showToast('Student removed from task', 'success');
                    if (groupIndex !== undefined && groupIndex !== null) {
                        const newStudentsRow = document.getElementById(`students-${groupIndex}`);
                        if (newStudentsRow) {
                            newStudentsRow.classList.remove('hidden');
                            if (typeof lucide !== 'undefined') lucide.createIcons();
                        }
                    }
                } catch (error) {
                    console.error('Error removing student from task:', error);
                    showToast('Failed to remove student', 'error');
                }
            }
        });
    };

    window.markTaskComplete = async (id) => {
        try {
            await AdviserEventsAPI.updateTaskStatus(id, 'completed');
            showToast('Task marked as complete', 'success');
            loadTasksByEvent(selectedEvent.event_id);
        } catch (error) {
            console.error('Error marking task as complete:', error);
            showToast('Failed to update task status', 'error');
        }
    };

    window.markTaskPending = async (id) => {
        try {
            await AdviserEventsAPI.updateTaskStatus(id, 'pending');
            showToast('Task marked as pending', 'success');
            loadTasksByEvent(selectedEvent.event_id);
        } catch (error) {
            console.error('Error marking task as pending:', error);
            showToast('Failed to update task status', 'error');
        }
    };

    window.toggleTaskStudents = (groupIndex) => {
        const studentsDiv = document.getElementById(`students-${groupIndex}`);
        if (studentsDiv) {
            if (studentsDiv.classList.contains('hidden')) {
                studentsDiv.classList.remove('hidden');
                if (typeof lucide !== 'undefined') lucide.createIcons();
            } else {
                studentsDiv.classList.add('hidden');
            }
        }
    };

    window.updateScheduleStatus = async (scheduleId, status) => {
        try {
            await AdviserEventsAPI.updateScheduleStatus(scheduleId, status);
            showToast('Schedule status updated successfully', 'success');
            const scheduleBtn = document.querySelector(`button[onclick*="updateScheduleStatus(${scheduleId}"]`);
            const studentsRow = scheduleBtn ? scheduleBtn.closest('tr[id^="students-"]') : null;
            const groupIndex = studentsRow ? studentsRow.id.replace('students-', '') : null;
            await loadTasksByEvent(selectedEvent.event_id);
            if (groupIndex) {
                const newStudentsRow = document.getElementById(`students-${groupIndex}`);
                if (newStudentsRow) {
                    newStudentsRow.classList.remove('hidden');
                    if (typeof lucide !== 'undefined') lucide.createIcons();
                }
            }
            await checkAndUpdateTaskStatuses();
        } catch (error) {
            console.error('Error updating schedule status:', error);
            showToast('Failed to update schedule status', 'error');
        }
    };

    async function checkAndUpdateTaskStatuses() {
        try {
            const updatedTasks = await AdviserEventsAPI.getTasksByEvent(selectedEvent.event_id);
            
            for (const task of updatedTasks) {
                if (!task.daily_schedules || task.daily_schedules.length === 0) {
                    continue;
                }

                const schedules = task.daily_schedules;
                const allCompleted = schedules.every(s => s.status === 'completed');
                const anyNotCompleted = schedules.some(s => s.status === 'not_completed');
                const allPending = schedules.every(s => s.status === 'pending');

                let newStatus = task.status;

                if (allCompleted) {
                    newStatus = 'completed';
                } else if (anyNotCompleted) {
                    newStatus = 'not_finished';
                } else if (allPending) {
                    newStatus = 'pending';
                } else {
                    newStatus = 'pending';
                }

                const endDate = new Date(task.student_end_date || task.end_date);
                const today = new Date();
                today.setHours(0, 0, 0, 0);
                
                if (endDate < today && task.status === 'pending' && !allCompleted) {
                    newStatus = 'not_finished';
                }

                if (newStatus !== task.status) {
                    await AdviserEventsAPI.updateTaskStatus(task.id, newStatus);
                }
            }
            await loadTasksByEvent(selectedEvent.event_id);
        } catch (error) {
            console.error('Error checking task statuses:', error);
        }
    }

    const waitForElement = () => {
        if (document.getElementById('eventSelect')) {
            loadEvents();
        } else {
            setTimeout(waitForElement, 50);
        }
    };
    waitForElement();
}

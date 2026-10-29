import { StudentNavbar, initStudentNavbar } from '../../../components/Navbar/StudentNavbar.js';
import { protectStudentRoute } from '../../../middleware/StudentMiddleware.js';
import * as EventTaskAPI from '../../../api/students/Task/EventTask.js';
import { showToast } from '../../../components/ToastMessage.js';
import { skeletonTableRows } from '../../../components/SkeletonLoading.js';

export function EventTask() {
    return `
        ${StudentNavbar()}
        <main class="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
                <div>
                    <h1 class="text-2xl font-semibold text-gray-900">My Tasks</h1>
                    <p class="text-sm text-gray-500 mt-1">View your assigned event tasks</p>
                </div>
            </div>

            <div id="tasksContainer" class="space-y-4">
                <div class="bg-white border border-gray-200 rounded-lg shadow-sm p-6">
                    <div class="animate-pulse space-y-4">
                        <div class="h-4 bg-gray-200 rounded w-3/4"></div>
                        <div class="h-4 bg-gray-200 rounded w-1/2"></div>
                        <div class="h-4 bg-gray-200 rounded w-5/6"></div>
                    </div>
                </div>
            </div>
        </main>
    `;
}

export async function initEventTask() {
    protectStudentRoute();
    await initStudentNavbar();

    let tasks = [];

    async function loadTasks() {
        try {
            tasks = await EventTaskAPI.getStudentTasks();
            await checkOverdueTasks(tasks);
            
            renderTasks(tasks);
        } catch (error) {
            console.error('Error loading tasks:', error);
            const container = document.getElementById('tasksContainer');
            if (container) {
                container.innerHTML = `
                    <div class="bg-white border border-gray-200 rounded-lg shadow-sm p-12 text-center">
                        <p class="text-red-500">Failed to load tasks</p>
                    </div>
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
                        await EventTaskAPI.updateTaskStatus(task.id, 'not_finished');
                    }
                } else {
                    await EventTaskAPI.updateTaskStatus(task.id, 'not_finished');
                }
            }
        }
    }

    function renderTasks(data) {
        const container = document.getElementById('tasksContainer');
        
        if (!container) {
            console.error('tasksContainer element not found');
            return;
        }
        
        if (!data || data.length === 0) {
            container.innerHTML = `
                <div class="bg-white border border-gray-200 rounded-lg shadow-sm p-12 text-center">
                    <i data-lucide="check-square" class="w-10 h-10 text-gray-200 mx-auto mb-2"></i>
                    <p class="text-sm text-gray-500 font-medium">No tasks found.</p>
                    <p class="text-xs text-gray-400 mt-1">You have no assigned tasks at the moment.</p>
                </div>
            `;
            if (typeof lucide !== 'undefined') lucide.createIcons();
            return;
        }

        container.innerHTML = data.map((task) => {
            const statusColors = {
                'pending': 'bg-yellow-50 text-yellow-700 border border-yellow-200',
                'completed': 'bg-green-50 text-green-700 border border-green-200',
                'overdue': 'bg-red-50 text-red-700 border border-red-200',
                'not_finished': 'bg-orange-50 text-orange-700 border border-orange-200'
            };

            const startDate = new Date(task.student_start_date || task.start_date);
            const endDate = new Date(task.student_end_date || task.end_date);
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const isOverdue = endDate < today && task.status === 'pending';

            const hasSchedules = task.daily_schedules && task.daily_schedules.length > 0;

            const formatTime = (time) => {
                if (!time) return 'N/A';
                const [hours, minutes] = time.substring(0, 5).split(':');
                const hour = parseInt(hours);
                const ampm = hour >= 12 ? 'PM' : 'AM';
                const hour12 = hour % 12 || 12;
                return `${hour12}:${minutes} ${ampm}`;
            };

            return `
            <div class="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
                <div class="p-6">
                    <div class="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-4">
                        <div class="flex-1">
                            <h3 class="text-lg font-semibold text-gray-900 mb-2">${task.task_title || task.task_description || 'N/A'}</h3>
                            ${task.task_description && task.task_title ? `<p class="text-sm text-gray-600 mb-2">${task.task_description}</p>` : ''}
                            <div class="flex flex-wrap gap-2">
                                <span class="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${statusColors[task.status] || statusColors['pending']}">
                                    ${task.status.charAt(0).toUpperCase() + task.status.slice(1)}
                                </span>
                                ${isOverdue ? '<span class="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-red-50 text-red-700 border border-red-200">Overdue</span>' : ''}
                            </div>
                        </div>
                    </div>

                    <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                        <div>
                            <p class="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Event</p>
                            <p class="text-sm text-gray-900">${task.event_title || 'N/A'}</p>
                        </div>
                        <div>
                            <p class="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Organization</p>
                            <p class="text-sm text-gray-900">${task.organization_name || 'N/A'}</p>
                        </div>
                        <div>
                            <p class="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Start Date</p>
                            <p class="text-sm text-gray-900">${startDate.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}</p>
                        </div>
                        <div>
                            <p class="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">End Date</p>
                            <p class="text-sm text-gray-900">${endDate.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}</p>
                        </div>
                    </div>

                    ${hasSchedules ? `
                    <div class="mt-4 pt-4 border-t border-gray-200">
                        <div class="flex items-center justify-between mb-3">
                            <h4 class="text-xs font-semibold text-gray-700 uppercase tracking-wider">Daily Schedules</h4>
                            <button 
                                onclick="toggleSchedules(${task.id})" 
                                class="text-blue-600 hover:text-blue-700 text-sm font-medium flex items-center gap-1">
                                <i data-lucide="calendar-clock" class="w-4 h-4"></i>
                                <span id="toggleText-${task.id}">Show Schedules</span>
                            </button>
                        </div>
                        <div id="schedules-${task.id}" class="hidden">
                            <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                                ${task.daily_schedules.map(schedule => {
                                    const date = new Date(schedule.schedule_date);
                                    const formattedDate = date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
                                    const scheduleStatusColors = {
                                        'pending': 'bg-yellow-50 text-yellow-700 border border-yellow-200',
                                        'completed': 'bg-green-50 text-green-700 border border-green-200',
                                        'not_completed': 'bg-red-50 text-red-700 border border-red-200'
                                    };
                                    return `
                                        <div class="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200">
                                            <div class="flex items-center gap-2">
                                                <span class="text-sm font-medium text-gray-700">${formattedDate}</span>
                                                <span class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${scheduleStatusColors[schedule.status] || scheduleStatusColors['pending']}">
                                                    ${schedule.status ? schedule.status.charAt(0).toUpperCase() + schedule.status.slice(1) : 'Pending'}
                                                </span>
                                            </div>
                                            <div class="flex items-center gap-2">
                                                <span class="text-sm text-gray-600">${formatTime(schedule.start_time)} - ${formatTime(schedule.end_time)}</span>
                                                <div class="flex items-center gap-1">
                                                    <button 
                                                        onclick="updateScheduleStatus(${schedule.id}, 'pending', ${task.id})" 
                                                        class="p-1 text-yellow-600 hover:bg-yellow-50 rounded transition" 
                                                        title="Mark as Pending">
                                                        <i data-lucide="clock" class="w-3 h-3"></i>
                                                    </button>
                                                    <button 
                                                        onclick="updateScheduleStatus(${schedule.id}, 'completed', ${task.id})" 
                                                        class="p-1 text-green-600 hover:bg-green-50 rounded transition" 
                                                        title="Mark as Completed">
                                                        <i data-lucide="check" class="w-3 h-3"></i>
                                                    </button>
                                                    <button 
                                                        onclick="updateScheduleStatus(${schedule.id}, 'not_completed', ${task.id})" 
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
                    </div>
                    ` : ''}
                </div>
            </div>
            `;
        }).join('');

        if (typeof lucide !== 'undefined') {
            lucide.createIcons();
        }
    }

    window.toggleSchedules = (taskId) => {
        const scheduleDiv = document.getElementById(`schedules-${taskId}`);
        const toggleText = document.getElementById(`toggleText-${taskId}`);
        if (scheduleDiv && toggleText) {
            if (scheduleDiv.classList.contains('hidden')) {
                scheduleDiv.classList.remove('hidden');
                toggleText.textContent = 'Hide Schedules';
            } else {
                scheduleDiv.classList.add('hidden');
                toggleText.textContent = 'Show Schedules';
            }
        }
    };

    window.updateScheduleStatus = async (scheduleId, status, taskId) => {
        try {
            await EventTaskAPI.updateScheduleStatus(scheduleId, status);
            showToast('Schedule status updated successfully', 'success');
            await loadTasks();
            const scheduleDiv = document.getElementById(`schedules-${taskId}`);
            const toggleText = document.getElementById(`toggleText-${taskId}`);
            if (scheduleDiv && toggleText) {
                scheduleDiv.classList.remove('hidden');
                toggleText.textContent = 'Hide Schedules';
            }
            await checkAndUpdateTaskStatus(taskId);
        } catch (error) {
            console.error('Error updating schedule status:', error);
            showToast('Failed to update schedule status', 'error');
        }
    };

    async function checkAndUpdateTaskStatus(taskId) {
        try {
            const updatedTasks = await EventTaskAPI.getStudentTasks();
            const task = updatedTasks.find(t => t.id === taskId);
            
            if (!task || !task.daily_schedules || task.daily_schedules.length === 0) {
                return;
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
                await EventTaskAPI.updateTaskStatus(taskId, newStatus);
                await loadTasks();
                const scheduleDiv = document.getElementById(`schedules-${taskId}`);
                const toggleText = document.getElementById(`toggleText-${taskId}`);
                if (scheduleDiv && toggleText) {
                    scheduleDiv.classList.remove('hidden');
                    toggleText.textContent = 'Hide Schedules';
                }
            }
        } catch (error) {
            console.error('Error checking task status:', error);
        }
    }

    const waitForElement = () => {
        if (document.getElementById('tasksContainer')) {
            loadTasks();
        } else {
            setTimeout(waitForElement, 50);
        }
    };
    waitForElement();
}

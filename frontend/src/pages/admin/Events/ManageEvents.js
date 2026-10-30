import { AdminNavbar, initAdminNavbar } from '../../../components/Navbar/AdminNavbar.js';
import { protectAdminRoute } from '../../../middleware/AdminMiddleware.js';
import * as EventsAPI from '../../../api/admin/Events/ManageEvents.js';
import { CacheService } from '../../../../cache/CacheService.js';
import { initManageEventsAnimations, animateTableRows } from '../../../provider/Animation/ManageEventsAnimation.js';
import { openManageEventsModal, openViewEventsModal } from '../../../components/Modal/ManageEventsModal.js';
import { openConfirmDialog } from '../../../components/Dialog/ConfirmDialog.js';
import { showToast } from '../../../components/ToastMessage.js';
import { CrudMenu } from '../../../components/CrudMenu.js';
import { skeletonTableRows } from '../../../components/SkeletonLoading.js';

export function ManageEvents() {
    return `
        ${AdminNavbar()}
        <main class="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
                <div>
                    <h1 class="text-2xl font-semibold text-gray-900">Manage Events</h1>
                    <p class="text-sm text-gray-500 mt-1">Manage events and their details in the system.</p>
                </div>
                <div class="flex items-center gap-2.5">
                    <input 
                        type="text" 
                        id="eventSearch" 
                        placeholder="Search events..." 
                        class="px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent w-48 sm:w-64">
                    <button 
                        type="button" 
                        id="addEventBtn" 
                        class="px-4 py-2 text-sm font-medium text-white bg-blue-900 hover:bg-blue-800 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition flex items-center gap-2 shadow-sm">
                        <i data-lucide="plus" class="w-4 h-4"></i>
                        <span>Add New</span>
                    </button>
                </div>
            </div>

            <div class="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
                <div class="overflow-x-auto">
                    <table class="w-full text-sm text-left">
                        <thead>
                            <tr class="bg-gray-50 border-b border-gray-200 text-xs font-medium text-gray-500 uppercase tracking-wider">
                                <th class="px-5 py-3.5 w-12 text-center">#</th>
                                <th class="px-5 py-3.5">Title</th>
                                <th class="px-5 py-3.5 hidden sm:table-cell">Organization</th>
                                <th class="px-5 py-3.5">Date Range</th>
                                <th class="px-5 py-3.5 hidden sm:table-cell">Schedules</th>
                                <th class="px-5 py-3.5 hidden sm:table-cell">Venue</th>
                                <th class="px-5 py-3.5 text-center w-28">Actions</th>
                            </tr>
                        </thead>
                        <tbody id="eventTableBody" class="divide-y divide-gray-100">
                            ${skeletonTableRows(window.innerWidth < 640 ? 3 : 4, window.innerWidth < 640 ? 3 : 6, true)}
                        </tbody>
                    </table>
                </div>
            </div>
        </main>
    `;
}

export async function initManageEvents() {
    protectAdminRoute();
    await initAdminNavbar();

    initManageEventsAnimations();

    let events = [];
    let hasLoaded = false;
    async function loadEvents(forceRefresh = false) {
        if (!forceRefresh) {
            try {
                const cachedData = await CacheService.get('cachedEvents');
                if (cachedData && Array.isArray(cachedData) && cachedData.length > 0) {
                    events = cachedData;
                    renderEvents(events);
                    hasLoaded = true;
                }
            } catch (e) {
                console.error('Error reading cached events:', e);
            }
        }

        try {
            const freshData = await EventsAPI.getAllEvents();
            if (freshData) {
                events = freshData;
                await CacheService.set('cachedEvents', events);
                renderEvents(events);
                hasLoaded = true;
            }
        } catch (error) {
            console.error('Error loading events:', error);
            if (!hasLoaded) {
                const tbody = document.getElementById('eventTableBody');
                if (tbody) {
                    tbody.innerHTML = `
                        <tr>
                            <td colspan="7" class="px-5 py-12 text-center text-red-500">Failed to load events</td>
                        </tr>
                    `;
                }
                showToast('Failed to load events', 'error');
            }
        }
    }

    function renderEvents(data) {
        const tbody = document.getElementById('eventTableBody');
        
        if (!tbody) {
            console.error('eventTableBody element not found');
            return;
        }
        
        if (!data || data.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="7" class="px-5 py-12 text-center">
                        <i data-lucide="calendar" class="w-10 h-10 text-gray-200 mx-auto mb-2"></i>
                        <p class="text-sm text-gray-500 font-medium">No events found.</p>
                        <p class="text-xs text-gray-400 mt-1">Click "Add New" to create the first event.</p>
                    </td>
                </tr>
            `;
            if (typeof lucide !== 'undefined') lucide.createIcons();
            return;
        }

        tbody.innerHTML = data.map((event, index) => {
            const formatDate = (date) => {
                if (!date) return '—';
                return new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
            };
            
            const formatTime = (time) => {
                if (!time) return '—';
                const [hours, minutes] = time.split(':');
                const hour = parseInt(hours);
                const ampm = hour >= 12 ? 'PM' : 'AM';
                const hour12 = hour % 12 || 12;
                return `${hour12}:${minutes} ${ampm}`;
            };
            
            const dateRange = event.event_day_start && event.event_day_end 
                ? (event.event_day_start === event.event_day_end 
                    ? formatDate(event.event_day_start) 
                    : `${formatDate(event.event_day_start)} - ${formatDate(event.event_day_end)}`)
                : '—';
            
            const scheduleCount = event.daily_schedules ? event.daily_schedules.length : 0;
            const scheduleInfo = scheduleCount > 0 
                ? `<span class="text-xs text-blue-600 font-medium">${scheduleCount} day${scheduleCount > 1 ? 's' : ''}</span>`
                : '<span class="text-xs text-gray-400">No schedules</span>';
            
            return `
            <tr style="transition: background-color 0.2s;" onmouseover="this.style.backgroundColor = document.documentElement.classList.contains('dark') ? 'rgba(255, 255, 255, 0.02)' : 'rgba(0, 0, 0, 0.1)'" onmouseout="this.style.backgroundColor = ''">
                <td class="px-3 sm:px-5 py-2 sm:py-3.5 text-xs text-gray-400 text-center font-mono">
                    ${index + 1}
                </td>
                <td class="px-3 sm:px-5 py-2 sm:py-3.5">
                    <p class="text-xs sm:text-sm font-semibold text-gray-900">${event.title}</p>
                </td>
                <td class="px-3 sm:px-5 py-2 sm:py-3.5 hidden sm:table-cell text-gray-600 text-sm truncate">${event.organization_name || 'N/A'}</td>
                <td class="px-3 sm:px-5 py-2 sm:py-3.5 text-gray-600 text-sm whitespace-nowrap">
                    ${dateRange}
                </td>
                <td class="px-3 sm:px-5 py-2 sm:py-3.5 hidden sm:table-cell">
                    ${scheduleInfo}
                </td>
                <td class="px-3 sm:px-5 py-2 sm:py-3.5 hidden sm:table-cell text-gray-600 text-sm truncate">${event.venue || 'N/A'}</td>
                <td class="px-3 sm:px-5 py-2 sm:py-3.5 text-center">
                    ${CrudMenu({ 
                        id: String(event.id), 
                        showView: true,
                        onView: 'viewEvent',
                        onEdit: 'editEvent', 
                        onDelete: 'deleteEvent',
                        deleteLabel: event.title
                    })}
                </td>
            </tr>
            `;
        }).join('');

        if (typeof lucide !== 'undefined') {
            lucide.createIcons();
        }

        animateTableRows('#eventTableBody tr');
    }

    document.getElementById('addEventBtn').addEventListener('click', () => {
        openManageEventsModal({
            mode: 'add',
            onSubmit: async (id, data) => {
                if (id) {
                    await EventsAPI.updateEvent(id, data);
                } else {
                    await EventsAPI.createEvent(data);
                }
                loadEvents(true);
            }
        });
    });

    window.editEvent = (id) => {
        openManageEventsModal({
            mode: 'edit',
            eventId: id,
            onSubmit: async (id, data) => {
                await EventsAPI.updateEvent(id, data);
                loadEvents(true);
            }
        });
    };

    window.viewEvent = async (id) => {
        await openViewEventsModal(id);
    };

    window.deleteEvent = (id, deleteLabel) => {
        openConfirmDialog({
            title: 'Confirm Delete',
            message: `Are you sure you want to delete ${deleteLabel || 'this event'}?`,
            confirmText: 'Delete',
            cancelText: 'Cancel',
            type: 'danger',
            onConfirm: async () => {
                try {
                    await EventsAPI.deleteEvent(id);
                    loadEvents(true);
                    showToast('Event deleted successfully', 'success');
                } catch (error) {
                    console.error('Error deleting event:', error);
                    showToast('Failed to delete event', 'error');
                }
            }
        });
    };

    document.getElementById('eventSearch').addEventListener('input', (e) => {
        const searchTerm = e.target.value.toLowerCase();
        const filtered = events.filter(event => 
            (event.title || '').toLowerCase().includes(searchTerm) ||
            (event.organization_name || '').toLowerCase().includes(searchTerm) ||
            (event.venue || '').toLowerCase().includes(searchTerm) ||
            (event.event_category || '').toLowerCase().includes(searchTerm)
        );
        renderEvents(filtered);
    });

    const waitForElement = () => {
        if (document.getElementById('eventTableBody')) {
            loadEvents();
        } else {
            setTimeout(waitForElement, 50);
        }
    };
    waitForElement();
}

import { AdminNavbar, initAdminNavbar } from '../../../components/Navbar/AdminNavbar.js';
import { requireAuth } from '../../../utils/jwt.js';
import * as EventsAPI from '../../../api/admin/Events/ManageEvents.js';
import { initManageEventsAnimations, addButtonHoverAnimations, animateSearchInput, animateTableRows } from '../../../provider/Animation/ManageEventsAnimation.js';
import { openManageEventsModal, openViewEventsModal } from '../../../components/Modal/ManageEventsModal.js';
import { openConfirmDialog } from '../../../components/Dialog/ConfirmDialog.js';
import { showToast } from '../../../components/ToastMessage.js';
import { CrudMenu } from '../../../components/CrudMenu.js';

export function ManageEvents() {
    return `
        ${AdminNavbar()}
        <main class="container mx-auto px-4 py-8 bg-white min-h-screen">
            <div class="p-6">
                <div class="flex justify-between items-center mb-6">
                    <h2 class="text-2xl font-bold text-blue-800">Events</h2>
                    <button id="addEventBtn" class="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors">
                        <i data-lucide="plus" class="w-4 h-4"></i>
                        <span>Add Event</span>
                    </button>
                </div>

                <div class="mb-4">
                    <input type="text" id="eventSearch" placeholder="Search events..." class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                </div>

                <div class="overflow-x-auto">
                    <table class="w-full table-fixed border-collapse">
                        <thead>
                            <tr class="bg-blue-50">
                                <th class="px-3 py-2.5 text-left text-sm font-semibold text-blue-900 border-b-2 border-blue-200 whitespace-nowrap">Title</th>
                                <th class="hidden sm:table-cell px-3 py-2.5 text-left text-sm font-semibold text-blue-900 border-b-2 border-blue-200 whitespace-nowrap">Organization</th>
                                <th class="px-3 py-2.5 text-left text-sm font-semibold text-blue-900 border-b-2 border-blue-200 whitespace-nowrap">Date</th>
                                <th class="hidden sm:table-cell px-3 py-2.5 text-left text-sm font-semibold text-blue-900 border-b-2 border-blue-200 whitespace-nowrap">Venue</th>
                                <th class="px-3 py-2.5 text-left text-sm font-semibold text-blue-900 border-b-2 border-blue-200 whitespace-nowrap">Category</th>
                                <th class="w-28 px-3 py-2.5 text-center text-sm font-semibold text-blue-900 border-b-2 border-blue-200 whitespace-nowrap">Actions</th>
                            </tr>
                        </thead>
                        <tbody id="eventTableBody">
                            ${Array.from({ length: 5 }, () => `
                                <tr>
                                    <td class="px-3 py-2.5 border-b">
                                        <div class="h-4 w-3/4 bg-gray-200 rounded animate-pulse"></div>
                                    </td>
                                    <td class="hidden sm:table-cell px-3 py-2.5 border-b">
                                        <div class="h-4 w-3/4 bg-gray-200 rounded animate-pulse"></div>
                                    </td>
                                    <td class="px-3 py-2.5 border-b">
                                        <div class="h-4 w-20 bg-gray-200 rounded animate-pulse"></div>
                                    </td>
                                    <td class="hidden sm:table-cell px-3 py-2.5 border-b">
                                        <div class="h-4 w-1/2 bg-gray-200 rounded animate-pulse"></div>
                                    </td>
                                    <td class="px-3 py-2.5 border-b">
                                        <div class="h-6 w-20 bg-gray-200 rounded-full animate-pulse"></div>
                                    </td>
                                    <td class="px-3 py-2.5 border-b">
                                        <div class="flex justify-center">
                                            <div class="inline-flex items-center gap-0.5 bg-gray-50/80 p-0.5 rounded-lg border border-gray-200/70">
                                                <div class="w-7 h-7 bg-gray-200 rounded-md animate-pulse"></div>
                                                <div class="w-7 h-7 bg-gray-200 rounded-md animate-pulse"></div>
                                                <div class="w-7 h-7 bg-gray-200 rounded-md animate-pulse"></div>
                                            </div>
                                        </div>
                                    </td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            </div>
        </main>
    `;
}

export async function initManageEvents() {
    requireAuth();
    await initAdminNavbar();

    initManageEventsAnimations();
    addButtonHoverAnimations('button');
    animateSearchInput('#eventSearch');

    let events = [];
    let hasLoaded = false;

    async function loadEvents(forceRefresh = false) {
        const cachedData = localStorage.getItem('cachedEvents');
        if (cachedData && !forceRefresh) {
            try {
                events = JSON.parse(cachedData);
                renderEvents(events);
                hasLoaded = true;
                return;
            } catch (e) {
                console.error('Error parsing cached events:', e);
            }
        }

        try {
            events = await EventsAPI.getAllEvents();
            localStorage.setItem('cachedEvents', JSON.stringify(events));
            localStorage.setItem('cachedEventsTimestamp', Date.now().toString());
            renderEvents(events);
            hasLoaded = true;
        } catch (error) {
            console.error('Error loading events:', error);
            const tbody = document.getElementById('eventTableBody');
            if (tbody) {
                tbody.innerHTML = `
                    <tr>
                        <td colspan="6" class="px-4 py-8 text-center text-red-500">Failed to load events</td>
                    </tr>
                `;
            }
            showToast('Failed to load events', 'error');
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
                    <td colspan="6" class="px-4 py-8 text-center text-gray-500">No events found</td>
                </tr>
            `;
            return;
        }

        tbody.innerHTML = data.map(event => `
            <tr class="hover:bg-gray-50 transition-colors">
                <td class="px-3 py-2.5 border-b text-gray-900 font-medium truncate">${event.title}</td>
                <td class="hidden sm:table-cell px-3 py-2.5 border-b text-gray-600 truncate">${event.organization_name || 'N/A'}</td>
                <td class="px-3 py-2.5 border-b text-gray-600 text-sm whitespace-nowrap">${event.event_date ? new Date(event.event_date).toLocaleDateString() : 'N/A'}</td>
                <td class="hidden sm:table-cell px-3 py-2.5 border-b text-gray-600 truncate">${event.venue || 'N/A'}</td>
                <td class="px-3 py-2.5 border-b">
                    <span class="px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800">
                        ${event.event_category}
                    </span>
                </td>
                <td class="px-3 py-2.5 border-b text-center align-middle" onclick="event.stopPropagation()">
                    <div class="flex justify-center">
                        ${CrudMenu({
                            id: String(event.id),
                            showView: true,
                            onView: 'viewEvent',
                            onEdit: 'editEvent',
                            onDelete: 'deleteEvent',
                            deleteLabel: event.title
                        })}
                    </div>
                </td>
            </tr>
        `).join('');

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

    window.editEvent = async (id) => {
        try {
            const event = await EventsAPI.getEvent(id);
            openManageEventsModal({
                mode: 'edit',
                event: event,
                onSubmit: async (id, data) => {
                    await EventsAPI.updateEvent(id, data);
                    loadEvents(true);
                }
            });
        } catch (error) {
            console.error('Error loading event:', error);
            showToast('Failed to load event', 'error');
        }
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

    loadEvents();
}

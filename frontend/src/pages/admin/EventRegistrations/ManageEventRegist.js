import { AdminNavbar, initAdminNavbar } from '../../../components/Navbar/AdminNavbar.js';
import { requireAuth } from '../../../utils/jwt.js';
import * as EventRegistAPI from '../../../api/admin/EventRegistrations/ManageEventRegist.js';
import { initManageEventRegistAnimations, addButtonHoverAnimations, animateSearchInput, animateTableRows } from '../../../provider/Animation/ManageEventRegistAnimation.js';
import { openManageEventRegistModal, openViewEventRegistModal } from '../../../components/Modal/ManageEventRegistModal.js';
import { openConfirmDialog } from '../../../components/Dialog/ConfirmDialog.js';
import { showToast } from '../../../components/ToastMessage.js';
import { CrudMenu } from '../../../components/CrudMenu.js';

export function ManageEventRegist() {
    return `
        ${AdminNavbar()}
        <main class="container mx-auto px-4 py-8 bg-white min-h-screen">
            <div class="p-6">
                <div class="flex justify-between items-center mb-6">
                    <h2 class="text-2xl font-bold text-blue-800">Event Registrations</h2>
                    <button id="addEventRegistBtn" class="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors">
                        <i data-lucide="plus" class="w-4 h-4"></i>
                        <span>Add Registration</span>
                    </button>
                </div>

                <div class="mb-4">
                    <input type="text" id="eventRegistSearch" placeholder="Search registrations..." class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                </div>

                <div class="overflow-x-auto">
                    <table class="w-full table-fixed border-collapse">
                        <thead>
                            <tr class="bg-blue-50">
                                <th class="px-3 py-2.5 text-left text-sm font-semibold text-blue-900 border-b-2 border-blue-200 whitespace-nowrap">Event</th>
                                <th class="px-3 py-2.5 text-left text-sm font-semibold text-blue-900 border-b-2 border-blue-200 whitespace-nowrap">Student</th>
                                <th class="hidden sm:table-cell px-3 py-2.5 text-left text-sm font-semibold text-blue-900 border-b-2 border-blue-200 whitespace-nowrap">Organization</th>
                                <th class="px-3 py-2.5 text-left text-sm font-semibold text-blue-900 border-b-2 border-blue-200 whitespace-nowrap">Registered At</th>
                                <th class="w-28 px-3 py-2.5 text-center text-sm font-semibold text-blue-900 border-b-2 border-blue-200 whitespace-nowrap">Actions</th>
                            </tr>
                        </thead>
                        <tbody id="eventRegistTableBody">
                            ${Array.from({ length: 5 }, () => `
                                <tr>
                                    <td class="px-3 py-2.5 border-b">
                                        <div class="h-4 w-3/4 bg-gray-200 rounded animate-pulse"></div>
                                    </td>
                                    <td class="px-3 py-2.5 border-b">
                                        <div class="h-4 w-3/4 bg-gray-200 rounded animate-pulse"></div>
                                    </td>
                                    <td class="hidden sm:table-cell px-3 py-2.5 border-b">
                                        <div class="h-4 w-3/4 bg-gray-200 rounded animate-pulse"></div>
                                    </td>
                                    <td class="px-3 py-2.5 border-b">
                                        <div class="h-4 w-20 bg-gray-200 rounded animate-pulse"></div>
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

export async function initManageEventRegist() {
    requireAuth();
    await initAdminNavbar();

    initManageEventRegistAnimations();
    addButtonHoverAnimations('button');
    animateSearchInput('#eventRegistSearch');

    let eventRegistrations = [];
    let hasLoaded = false;

    async function loadEventRegistrations(forceRefresh = false) {
        const cachedData = localStorage.getItem('cachedEventRegistrations');
        if (cachedData && !forceRefresh) {
            try {
                eventRegistrations = JSON.parse(cachedData);
                renderEventRegistrations(eventRegistrations);
                hasLoaded = true;
                return;
            } catch (e) {
                console.error('Error parsing cached event registrations:', e);
            }
        }

        try {
            eventRegistrations = await EventRegistAPI.getAllEventRegistrations();
            localStorage.setItem('cachedEventRegistrations', JSON.stringify(eventRegistrations));
            localStorage.setItem('cachedEventRegistrationsTimestamp', Date.now().toString());
            renderEventRegistrations(eventRegistrations);
            hasLoaded = true;
        } catch (error) {
            console.error('Error loading event registrations:', error);
            const tbody = document.getElementById('eventRegistTableBody');
            if (tbody) {
                tbody.innerHTML = `
                    <tr>
                        <td colspan="5" class="px-4 py-8 text-center text-red-500">Failed to load event registrations</td>
                    </tr>
                `;
            }
            showToast('Failed to load event registrations', 'error');
        }
    }

    function renderEventRegistrations(data) {
        const tbody = document.getElementById('eventRegistTableBody');
        
        if (!data || data.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="5" class="px-4 py-8 text-center text-gray-500">No event registrations found</td>
                </tr>
            `;
            return;
        }

        tbody.innerHTML = data.map(reg => `
            <tr class="hover:bg-gray-50 transition-colors">
                <td class="px-3 py-2.5 border-b text-gray-900 font-medium truncate">${reg.event_title || 'N/A'}</td>
                <td class="px-3 py-2.5 border-b text-gray-600 truncate">${reg.student_name || 'N/A'}</td>
                <td class="hidden sm:table-cell px-3 py-2.5 border-b text-gray-600 truncate">${reg.organization_name || 'N/A'}</td>
                <td class="px-3 py-2.5 border-b text-gray-600 text-sm whitespace-nowrap">${reg.registered_at ? new Date(reg.registered_at).toLocaleDateString() : 'N/A'}</td>
                <td class="px-3 py-2.5 border-b text-center align-middle" onclick="event.stopPropagation()">
                    <div class="flex justify-center">
                        ${CrudMenu({
                            id: String(reg.id),
                            showView: true,
                            onView: 'viewEventRegist',
                            onEdit: 'editEventRegist',
                            onDelete: 'deleteEventRegist',
                            deleteLabel: reg.student_name
                        })}
                    </div>
                </td>
            </tr>
        `).join('');

        if (typeof lucide !== 'undefined') {
            lucide.createIcons();
        }

        animateTableRows('#eventRegistTableBody tr');
    }

    document.getElementById('addEventRegistBtn').addEventListener('click', () => {
        openManageEventRegistModal({
            mode: 'add',
            onSubmit: async (id, data) => {
                if (id) {
                    await EventRegistAPI.updateEventRegistration(id, data);
                } else {
                    await EventRegistAPI.createEventRegistration(data);
                }
                loadEventRegistrations(true);
            }
        });
    });

    window.editEventRegist = async (id) => {
        try {
            const registration = await EventRegistAPI.getEventRegistration(id);
            openManageEventRegistModal({
                mode: 'edit',
                registration: registration,
                onSubmit: async (id, data) => {
                    await EventRegistAPI.updateEventRegistration(id, data);
                    loadEventRegistrations(true);
                }
            });
        } catch (error) {
            console.error('Error loading event registration:', error);
            showToast('Failed to load event registration', 'error');
        }
    };

    window.viewEventRegist = async (id) => {
        await openViewEventRegistModal(id);
    };

    window.deleteEventRegist = (id, deleteLabel) => {
        openConfirmDialog({
            title: 'Confirm Delete',
            message: `Are you sure you want to delete ${deleteLabel || 'this registration'}?`,
            confirmText: 'Delete',
            cancelText: 'Cancel',
            type: 'danger',
            onConfirm: async () => {
                try {
                    await EventRegistAPI.deleteEventRegistration(id);
                    loadEventRegistrations(true);
                    showToast('Event registration deleted successfully', 'success');
                } catch (error) {
                    console.error('Error deleting event registration:', error);
                    showToast('Failed to delete event registration', 'error');
                }
            }
        });
    };

    document.getElementById('eventRegistSearch').addEventListener('input', (e) => {
        const searchTerm = e.target.value.toLowerCase();
        const filtered = eventRegistrations.filter(reg => 
            (reg.event_title || '').toLowerCase().includes(searchTerm) ||
            (reg.student_name || '').toLowerCase().includes(searchTerm) ||
            (reg.organization_name || '').toLowerCase().includes(searchTerm)
        );
        renderEventRegistrations(filtered);
    });

    loadEventRegistrations();
}

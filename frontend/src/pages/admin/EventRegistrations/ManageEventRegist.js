import { AdminNavbar, initAdminNavbar } from '../../../components/Navbar/AdminNavbar.js';
import { protectAdminRoute } from '../../../middleware/AdminMiddleware.js';
import * as EventOrgAPI from '../../../api/admin/EventOrganizations/EventOrganizations.js';
import { CacheService } from '../../../../cache/CacheService.js';
import { initManageEventRegistAnimations, animateTableRows } from '../../../provider/Animation/ManageEventRegistAnimation.js';
import { openManageEventRegistModal, openViewEventRegistModal } from '../../../components/Modal/ManageEventRegistModal.js';
import { openConfirmDialog } from '../../../components/Dialog/ConfirmDialog.js';
import { showToast } from '../../../components/ToastMessage.js';
import { CrudMenu } from '../../../components/CrudMenu.js';
import { skeletonTableRows } from '../../../components/SkeletonLoading.js';

export function ManageEventRegist() {
    return `
        ${AdminNavbar()}
        <main class="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
                <div>
                    <h1 class="text-2xl font-semibold text-gray-900">Manage Event Registrations</h1>
                    <p class="text-sm text-gray-500 mt-1">Manage event registrations and participant information in the system.</p>
                </div>
                <div class="flex items-center gap-2.5">
                    <input 
                        type="text" 
                        id="eventRegistSearch" 
                        placeholder="Search registrations..." 
                        class="px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent w-48 sm:w-64">
                    <button 
                        type="button" 
                        id="addEventRegistBtn" 
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
                                <th class="px-5 py-3.5">Event</th>
                                <th class="px-5 py-3.5">Organization</th>
                                <th class="px-5 py-3.5 hidden sm:table-cell">Approver</th>
                                <th class="px-5 py-3.5">Registered At</th>
                                <th class="px-5 py-3.5 text-center w-28">Actions</th>
                            </tr>
                        </thead>
                        <tbody id="eventRegistTableBody" class="divide-y divide-gray-100">
                            ${skeletonTableRows(window.innerWidth < 640 ? 3 : 4, window.innerWidth < 640 ? 3 : 6, true)}
                        </tbody>
                    </table>
                </div>
            </div>
        </main>
    `;
}

export async function initManageEventRegist() {
    protectAdminRoute();
    await initAdminNavbar();

    initManageEventRegistAnimations();

    let eventRegistrations = [];
    let hasLoaded = false;
    async function loadEventRegistrations(forceRefresh = false) {
        if (!forceRefresh) {
            try {
                const cachedData = await CacheService.get('cachedEventRegistrations');
                if (cachedData && Array.isArray(cachedData) && cachedData.length > 0) {
                    eventRegistrations = cachedData;
                    renderEventRegistrations(eventRegistrations);
                    hasLoaded = true;
                }
            } catch (e) {
                console.error('Error reading cached event registrations:', e);
            }
        }

        try {
            const freshData = await EventOrgAPI.getAllEventOrganizations();
            if (freshData) {
                eventRegistrations = freshData;
                await CacheService.set('cachedEventRegistrations', eventRegistrations);
                renderEventRegistrations(eventRegistrations);
                hasLoaded = true;
            }
        } catch (error) {
            console.error('Error loading event registrations:', error);
            if (!hasLoaded) {
                const tbody = document.getElementById('eventRegistTableBody');
                if (tbody) {
                    tbody.innerHTML = `
                        <tr>
                            <td colspan="6" class="px-5 py-12 text-center text-red-500">Failed to load event registrations</td>
                        </tr>
                    `;
                }
                showToast('Failed to load event registrations', 'error');
            }
        }
    }

    function renderEventRegistrations(data) {
        const tbody = document.getElementById('eventRegistTableBody');
        
        if (!tbody) {
            console.error('eventRegistTableBody element not found');
            return;
        }
        
        if (!data || data.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="6" class="px-5 py-12 text-center">
                        <i data-lucide="users" class="w-10 h-10 text-gray-200 mx-auto mb-2"></i>
                        <p class="text-sm text-gray-500 font-medium">No event registrations found.</p>
                        <p class="text-xs text-gray-400 mt-1">Click "Add New" to create the first registration.</p>
                    </td>
                </tr>
            `;
            if (typeof lucide !== 'undefined') lucide.createIcons();
            return;
        }

        tbody.innerHTML = data.map((reg, index) => {
            return `
            <tr style="transition: background-color 0.2s;" onmouseover="this.style.backgroundColor = document.documentElement.classList.contains('dark') ? 'rgba(255, 255, 255, 0.02)' : 'rgba(0, 0, 0, 0.1)'" onmouseout="this.style.backgroundColor = ''">
                <td class="px-3 sm:px-5 py-2 sm:py-3.5 text-xs text-gray-400 text-center font-mono">
                    ${index + 1}
                </td>
                <td class="px-3 sm:px-5 py-2 sm:py-3.5">
                    <p class="text-xs sm:text-sm font-semibold text-gray-900">${reg.event_title || 'N/A'}</p>
                </td>
                <td class="px-3 sm:px-5 py-2 sm:py-3.5 text-gray-600 text-sm truncate">${reg.organization_name || 'N/A'}</td>
                <td class="px-3 sm:px-5 py-2 sm:py-3.5 hidden sm:table-cell text-gray-600 text-sm truncate">${reg.approver_name || 'N/A'}</td>
                <td class="px-3 sm:px-5 py-2 sm:py-3.5 text-gray-600 text-sm whitespace-nowrap">
                    ${reg.registered_at ? new Date(reg.registered_at).toLocaleDateString() : '—'}
                </td>
                <td class="px-3 sm:px-5 py-2 sm:py-3.5 text-center">
                    ${CrudMenu({ 
                        id: String(reg.id), 
                        showView: true,
                        onView: 'viewEventRegist',
                        onEdit: 'editEventRegist', 
                        onDelete: 'deleteEventRegist',
                        deleteLabel: reg.organization_name
                    })}
                </td>
            </tr>
            `;
        }).join('');

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
                    await EventOrgAPI.updateEventOrganization(id, data);
                } else {
                    await EventOrgAPI.createEventOrganization(data);
                }
                loadEventRegistrations(true);
            }
        });
    });

    window.editEventRegist = (id) => {
        openManageEventRegistModal({
            mode: 'edit',
            registrationId: id,
            onSubmit: async (id, data) => {
                await EventOrgAPI.updateEventOrganization(id, data);
                loadEventRegistrations(true);
            }
        });
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
                    await EventOrgAPI.deleteEventOrganization(id);
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
            (reg.organization_name || '').toLowerCase().includes(searchTerm) ||
            (reg.approver_name || '').toLowerCase().includes(searchTerm)
        );
        renderEventRegistrations(filtered);
    });

    const waitForElement = () => {
        if (document.getElementById('eventRegistTableBody')) {
            loadEventRegistrations();
        } else {
            setTimeout(waitForElement, 50);
        }
    };
    waitForElement();
}

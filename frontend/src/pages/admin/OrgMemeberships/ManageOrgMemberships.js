import { AdminNavbar, initAdminNavbar } from '../../../components/Navbar/AdminNavbar.js';
import { protectAdminRoute } from '../../../middleware/AdminMiddleware.js';
import * as OrgMembershipsAPI from '../../../api/admin/OrgMemberships/ManageOrgMemberships.js';
import { initManageOrgMemAnimations, animateTableRows } from '../../../provider/Animation/ManageOrgMemAnimation.js';
import { openManageOrgMemModal, openViewOrgMemModal } from '../../../components/Modal/ManageOrgMemModal.js';
import { openConfirmDialog } from '../../../components/Dialog/ConfirmDialog.js';
import { showToast } from '../../../components/ToastMessage.js';
import { CrudMenu } from '../../../components/CrudMenu.js';
import { skeletonTableRows } from '../../../components/SkeletonLoading.js';

export function ManageOrgMemberships() {
    return `
        ${AdminNavbar()}
        <main class="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
                <div>
                    <h1 class="text-2xl font-semibold text-gray-900">Manage Organization Memberships</h1>
                    <p class="text-sm text-gray-500 mt-1">Manage student organization memberships and roles in the system.</p>
                </div>
                <div class="flex items-center gap-2.5">
                    <input 
                        type="text" 
                        id="orgMemSearch" 
                        placeholder="Search memberships..." 
                        class="px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent w-48 sm:w-64">
                    <button 
                        type="button" 
                        id="addOrgMemBtn" 
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
                                <th class="px-5 py-3.5">Student</th>
                                <th class="px-5 py-3.5 hidden sm:table-cell">Organization</th>
                                <th class="px-5 py-3.5">Position</th>
                                <th class="px-5 py-3.5 hidden sm:table-cell">Status</th>
                                <th class="px-5 py-3.5 hidden sm:table-cell">Date Joined</th>
                                <th class="px-5 py-3.5 text-center w-28">Actions</th>
                            </tr>
                        </thead>
                        <tbody id="orgMemTableBody" class="divide-y divide-gray-100">
                            ${skeletonTableRows(window.innerWidth < 640 ? 3 : 4, window.innerWidth < 640 ? 3 : 7, true)}
                        </tbody>
                    </table>
                </div>
            </div>
        </main>
    `;
}

export async function initManageOrgMemberships() {
    protectAdminRoute();
    await initAdminNavbar();

    initManageOrgMemAnimations();

    let orgMemberships = [];
    let hasLoaded = false;

    async function loadOrgMemberships(forceRefresh = false) {
        const cachedData = localStorage.getItem('cachedOrgMemberships');
        if (cachedData && !forceRefresh) {
            try {
                orgMemberships = JSON.parse(cachedData);
                renderOrgMemberships(orgMemberships);
                hasLoaded = true;
                return;
            } catch (e) {
                console.error('Error parsing cached org memberships:', e);
            }
        }

        try {
            orgMemberships = await OrgMembershipsAPI.getAllOrgMemberships();
            localStorage.setItem('cachedOrgMemberships', JSON.stringify(orgMemberships));
            localStorage.setItem('cachedOrgMembershipsTimestamp', Date.now().toString());
            renderOrgMemberships(orgMemberships);
            hasLoaded = true;
        } catch (error) {
            console.error('Error loading organization memberships:', error);
            const tbody = document.getElementById('orgMemTableBody');
            if (tbody) {
                tbody.innerHTML = `
                    <tr>
                        <td colspan="7" class="px-5 py-12 text-center text-red-500">Failed to load memberships</td>
                    </tr>
                `;
            }
            showToast('Failed to load memberships', 'error');
        }
    }

    function renderOrgMemberships(data) {
        const tbody = document.getElementById('orgMemTableBody');
        
        if (!tbody) {
            console.error('orgMemTableBody element not found');
            return;
        }
        
        if (!data || data.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="7" class="px-5 py-12 text-center">
                        <i data-lucide="users" class="w-10 h-10 text-gray-200 mx-auto mb-2"></i>
                        <p class="text-sm text-gray-500 font-medium">No memberships found.</p>
                        <p class="text-xs text-gray-400 mt-1">Click "Add New" to create the first membership.</p>
                    </td>
                </tr>
            `;
            if (typeof lucide !== 'undefined') lucide.createIcons();
            return;
        }

        tbody.innerHTML = data.map((membership, index) => {
            return `
            <tr style="transition: background-color 0.2s;" onmouseover="this.style.backgroundColor = document.documentElement.classList.contains('dark') ? 'rgba(255, 255, 255, 0.02)' : 'rgba(0, 0, 0, 0.1)'" onmouseout="this.style.backgroundColor = ''">
                <td class="px-3 sm:px-5 py-2 sm:py-3.5 text-xs text-gray-400 text-center font-mono">
                    ${index + 1}
                </td>
                <td class="px-3 sm:px-5 py-2 sm:py-3.5">
                    <p class="text-xs sm:text-sm font-semibold text-gray-900">${membership.student_name || 'Unknown'}</p>
                </td>
                <td class="px-3 sm:px-5 py-2 sm:py-3.5 hidden sm:table-cell text-gray-600 text-sm truncate">${membership.organization_name || 'Unknown'}</td>
                <td class="px-3 sm:px-5 py-2 sm:py-3.5 text-gray-600 text-sm truncate">${membership.role_name || 'N/A'}</td>
                <td class="px-3 sm:px-5 py-2 sm:py-3.5 hidden sm:table-cell">
                    <span class="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${membership.membership_status === 'Active' ? 'bg-green-50 text-green-700 border border-green-200' : membership.membership_status === 'Inactive' ? 'bg-gray-50 text-gray-700 border border-gray-200' : 'bg-red-50 text-red-700 border border-red-200'}">
                        ${membership.membership_status}
                    </span>
                </td>
                <td class="px-3 sm:px-5 py-2 sm:py-3.5 hidden sm:table-cell text-gray-600 text-sm whitespace-nowrap">
                    ${membership.date_joined ? new Date(membership.date_joined).toLocaleDateString() : '—'}
                </td>
                <td class="px-3 sm:px-5 py-2 sm:py-3.5 text-center">
                    ${CrudMenu({ 
                        id: String(membership.id), 
                        showView: true,
                        onView: 'viewOrgMem',
                        onEdit: 'editOrgMem', 
                        onDelete: 'deleteOrgMem',
                        deleteLabel: `${membership.student_name || 'Student'} - ${membership.organization_name || 'Organization'}`
                    })}
                </td>
            </tr>
            `;
        }).join('');

        if (typeof lucide !== 'undefined') {
            lucide.createIcons();
        }

        animateTableRows('#orgMemTableBody tr');
    }

    document.getElementById('addOrgMemBtn').addEventListener('click', () => {
        openManageOrgMemModal({
            mode: 'add',
            onSubmit: async (id, data) => {
                if (id) {
                    await OrgMembershipsAPI.updateOrgMembership(id, data);
                } else {
                    await OrgMembershipsAPI.createOrgMembership(data);
                }
                loadOrgMemberships(true);
            }
        });
    });

    window.editOrgMem = (id) => {
        openManageOrgMemModal({
            mode: 'edit',
            membershipId: id,
            onSubmit: async (id, data) => {
                await OrgMembershipsAPI.updateOrgMembership(id, data);
                loadOrgMemberships(true);
            }
        });
    };

    window.viewOrgMem = async (id) => {
        await openViewOrgMemModal(id);
    };

    window.deleteOrgMem = (id, deleteLabel) => {
        openConfirmDialog({
            title: 'Confirm Delete',
            message: `Are you sure you want to delete ${deleteLabel || 'this membership'}?`,
            confirmText: 'Delete',
            cancelText: 'Cancel',
            type: 'danger',
            onConfirm: async () => {
                try {
                    await OrgMembershipsAPI.deleteOrgMembership(id);
                    loadOrgMemberships(true);
                    showToast('Membership deleted successfully', 'success');
                } catch (error) {
                    console.error('Error deleting membership:', error);
                    showToast('Failed to delete membership', 'error');
                }
            }
        });
    };

    document.getElementById('orgMemSearch').addEventListener('input', (e) => {
        const searchTerm = e.target.value.toLowerCase();
        const filtered = orgMemberships.filter(membership => 
            (membership.student_name || '').toLowerCase().includes(searchTerm) ||
            (membership.organization_name || '').toLowerCase().includes(searchTerm) ||
            (membership.position || '').toLowerCase().includes(searchTerm) ||
            (membership.membership_status || '').toLowerCase().includes(searchTerm)
        );
        renderOrgMemberships(filtered);
    });

    const waitForElement = () => {
        if (document.getElementById('orgMemTableBody')) {
            loadOrgMemberships();
        } else {
            setTimeout(waitForElement, 50);
        }
    };
    waitForElement();
}

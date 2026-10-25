import { AdminNavbar, initAdminNavbar } from '../../../components/Navbar/AdminNavbar.js';
import { requireAuth } from '../../../utils/jwt.js';
import * as OrgMembershipsAPI from '../../../api/admin/OrgMemberships/ManageOrgMemberships.js';
import { initManageOrgMemAnimations, addButtonHoverAnimations, animateSearchInput, animateTableRows } from '../../../provider/Animation/ManageOrgMemAnimation.js';
import { openManageOrgMemModal, openViewOrgMemModal } from '../../../components/Modal/ManageOrgMemModal.js';
import { openConfirmDialog } from '../../../components/Dialog/ConfirmDialog.js';
import { showToast } from '../../../components/ToastMessage.js';
import { CrudMenu } from '../../../components/CrudMenu.js';

export function ManageOrgMemberships() {
    return `
        ${AdminNavbar()}
        <main class="container mx-auto px-4 py-8 bg-white min-h-screen">
            <div class="p-6">
                <div class="flex justify-between items-center mb-6">
                    <h2 class="text-2xl font-bold text-blue-800">Organization Memberships</h2>
                    <button id="addOrgMemBtn" class="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors">
                        <i data-lucide="plus" class="w-4 h-4"></i>
                        <span>Add Membership</span>
                    </button>
                </div>

                <div class="mb-4">
                    <input type="text" id="orgMemSearch" placeholder="Search memberships..." class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                </div>

                <div class="overflow-x-auto">
                    <table class="w-full table-fixed border-collapse">
                        <thead>
                            <tr class="bg-blue-50">
                                <th class="px-3 py-2.5 text-left text-sm font-semibold text-blue-900 border-b-2 border-blue-200 whitespace-nowrap">Student</th>
                                <th class="hidden sm:table-cell px-3 py-2.5 text-left text-sm font-semibold text-blue-900 border-b-2 border-blue-200 whitespace-nowrap">Organization</th>
                                <th class="px-3 py-2.5 text-left text-sm font-semibold text-blue-900 border-b-2 border-blue-200 whitespace-nowrap">Position</th>
                                <th class="hidden sm:table-cell px-3 py-2.5 text-left text-sm font-semibold text-blue-900 border-b-2 border-blue-200 whitespace-nowrap">Status</th>
                                <th class="hidden sm:table-cell px-3 py-2.5 text-left text-sm font-semibold text-blue-900 border-b-2 border-blue-200 whitespace-nowrap">Date Joined</th>
                                <th class="w-28 px-3 py-2.5 text-center text-sm font-semibold text-blue-900 border-b-2 border-blue-200 whitespace-nowrap">Actions</th>
                            </tr>
                        </thead>
                        <tbody id="orgMemTableBody">
                            ${Array.from({ length: 5 }, () => `
                                <tr>
                                    <td class="px-3 py-2.5 border-b">
                                        <div class="h-4 w-3/4 bg-gray-200 rounded animate-pulse"></div>
                                    </td>
                                    <td class="hidden sm:table-cell px-3 py-2.5 border-b">
                                        <div class="h-4 w-3/4 bg-gray-200 rounded animate-pulse"></div>
                                    </td>
                                    <td class="px-3 py-2.5 border-b">
                                        <div class="h-4 w-4/5 bg-gray-200 rounded animate-pulse"></div>
                                    </td>
                                    <td class="hidden sm:table-cell px-3 py-2.5 border-b">
                                        <div class="h-6 w-20 bg-gray-200 rounded-full animate-pulse"></div>
                                    </td>
                                    <td class="hidden sm:table-cell px-3 py-2.5 border-b">
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

export async function initManageOrgMemberships() {
    requireAuth();
    await initAdminNavbar();

    initManageOrgMemAnimations();
    addButtonHoverAnimations('button');
    animateSearchInput('#orgMemSearch');

    let orgMemberships = [];

    async function loadOrgMemberships() {
        try {
            orgMemberships = await OrgMembershipsAPI.getAllOrgMemberships();
            renderOrgMemberships(orgMemberships);
        } catch (error) {
            console.error('Error loading organization memberships:', error);
            const tbody = document.getElementById('orgMemTableBody');
            if (tbody) {
                tbody.innerHTML = `
                    <tr>
                        <td colspan="6" class="px-4 py-8 text-center text-red-500">Failed to load memberships</td>
                    </tr>
                `;
            }
            showToast('Failed to load memberships', 'error');
        }
    }

    function renderOrgMemberships(data) {
        const tbody = document.getElementById('orgMemTableBody');
        
        if (!data || data.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="6" class="px-4 py-8 text-center text-gray-500">No memberships found</td>
                </tr>
            `;
            return;
        }

        tbody.innerHTML = data.map(membership => `
            <tr class="hover:bg-gray-50 transition-colors">
                <td class="px-3 py-2.5 border-b text-gray-900 truncate">${membership.student_name || 'Unknown'}</td>
                <td class="hidden sm:table-cell px-3 py-2.5 border-b text-gray-600 truncate">${membership.organization_name || 'Unknown'}</td>
                <td class="px-3 py-2.5 border-b text-gray-600 truncate">${membership.role_name || 'N/A'}</td>
                <td class="hidden sm:table-cell px-3 py-2.5 border-b">
                    <span class="px-2 py-1 text-xs font-medium rounded-full ${membership.membership_status === 'Active' ? 'bg-green-100 text-green-800' : membership.membership_status === 'Inactive' ? 'bg-gray-100 text-gray-800' : 'bg-red-100 text-red-800'}">
                        ${membership.membership_status}
                    </span>
                </td>
                <td class="hidden sm:table-cell px-3 py-2.5 border-b text-gray-600 text-sm whitespace-nowrap">${membership.date_joined ? new Date(membership.date_joined).toLocaleDateString() : 'N/A'}</td>
                <td class="px-3 py-2.5 border-b text-center align-middle" onclick="event.stopPropagation()">
                    <div class="flex justify-center">
                        ${CrudMenu({
                            id: String(membership.id),
                            showView: true,
                            onView: 'viewOrgMem',
                            onEdit: 'editOrgMem',
                            onDelete: 'deleteOrgMem',
                            deleteLabel: `${membership.student_name || 'Student'} - ${membership.organization_name || 'Organization'}`
                        })}
                    </div>
                </td>
            </tr>
        `).join('');

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
                loadOrgMemberships();
            }
        });
    });

    window.editOrgMem = async (id) => {
        try {
            const membership = await OrgMembershipsAPI.getOrgMembership(id);
            openManageOrgMemModal({
                mode: 'edit',
                membership: membership,
                onSubmit: async (id, data) => {
                    await OrgMembershipsAPI.updateOrgMembership(id, data);
                    loadOrgMemberships();
                }
            });
        } catch (error) {
            console.error('Error loading membership:', error);
            showToast('Failed to load membership', 'error');
        }
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
                    loadOrgMemberships();
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

    loadOrgMemberships();
}

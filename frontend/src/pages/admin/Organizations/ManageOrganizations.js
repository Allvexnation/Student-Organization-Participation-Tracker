import { AdminNavbar, initAdminNavbar } from '../../../components/Navbar/AdminNavbar.js';
import { requireAuth } from '../../../utils/jwt.js';
import * as OrganizationsAPI from '../../../api/admin/Organizations/ManageOrganizations.js';
import { initManageOrgsAnimations, addButtonHoverAnimations, animateSearchInput, animateTableRows } from '../../../provider/Animation/ManageOrgsAnimation.js';
import { openManageOrgsModal, openViewOrgsModal } from '../../../components/Modal/ManageOrgsModal.js';
import { openConfirmDialog } from '../../../components/Dialog/ConfirmDialog.js';
import { showToast } from '../../../components/ToastMessage.js';
import { CrudMenu } from '../../../components/CrudMenu.js';

export function ManageOrganizations() {
    return `
        ${AdminNavbar()}
        <main class="container mx-auto px-4 py-8 bg-white min-h-screen">
            <div class="p-6">
                <div class="flex justify-between items-center mb-6">
                    <h2 class="text-2xl font-bold text-blue-800">Organizations</h2>
                    <button id="addOrgBtn" class="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors">
                        <i data-lucide="plus" class="w-4 h-4"></i>
                        <span>Add Organization</span>
                    </button>
                </div>

                <div class="mb-4">
                    <input type="text" id="orgSearch" placeholder="Search organizations..." class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                </div>

                <div class="overflow-x-auto">
                    <table class="w-full table-fixed border-collapse">
                        <thead>
                            <tr class="bg-blue-50">
                                <th class="px-3 py-2.5 text-left text-sm font-semibold text-blue-900 border-b-2 border-blue-200 whitespace-nowrap">Code</th>
                                <th class="px-3 py-2.5 text-left text-sm font-semibold text-blue-900 border-b-2 border-blue-200 whitespace-nowrap">Name</th>
                                <th class="hidden sm:table-cell px-3 py-2.5 text-left text-sm font-semibold text-blue-900 border-b-2 border-blue-200 whitespace-nowrap">Adviser</th>
                                <th class="px-3 py-2.5 text-left text-sm font-semibold text-blue-900 border-b-2 border-blue-200 whitespace-nowrap">Status</th>
                                <th class="hidden sm:table-cell px-3 py-2.5 text-left text-sm font-semibold text-blue-900 border-b-2 border-blue-200 whitespace-nowrap">Created</th>
                                <th class="w-28 px-3 py-2.5 text-center text-sm font-semibold text-blue-900 border-b-2 border-blue-200 whitespace-nowrap">Actions</th>
                            </tr>
                        </thead>
                        <tbody id="orgTableBody">
                            ${Array.from({ length: 5 }, () => `
                                <tr>
                                    <td class="px-3 py-2.5 border-b">
                                        <div class="h-4 w-16 bg-gray-200 rounded animate-pulse"></div>
                                    </td>
                                    <td class="px-3 py-2.5 border-b">
                                        <div class="h-4 w-3/4 bg-gray-200 rounded animate-pulse"></div>
                                    </td>
                                    <td class="hidden sm:table-cell px-3 py-2.5 border-b">
                                        <div class="h-4 w-3/4 bg-gray-200 rounded animate-pulse"></div>
                                    </td>
                                    <td class="px-3 py-2.5 border-b">
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

export async function initManageOrganizations() {
    requireAuth();
    await initAdminNavbar();

    initManageOrgsAnimations();
    addButtonHoverAnimations('button');
    animateSearchInput('#orgSearch');

    let organizations = [];

    async function loadOrganizations() {
        try {
            organizations = await OrganizationsAPI.getAllOrganizations();
            renderOrganizations(organizations);
        } catch (error) {
            console.error('Error loading organizations:', error);
            const tbody = document.getElementById('orgTableBody');
            if (tbody) {
                tbody.innerHTML = `
                    <tr>
                        <td colspan="6" class="px-4 py-8 text-center text-red-500">Failed to load organizations</td>
                    </tr>
                `;
            }
            showToast('Failed to load organizations', 'error');
        }
    }

    function renderOrganizations(data) {
        const tbody = document.getElementById('orgTableBody');
        
        if (!data || data.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="6" class="px-4 py-8 text-center text-gray-500">No organizations found</td>
                </tr>
            `;
            return;
        }

        tbody.innerHTML = data.map(org => `
            <tr class="hover:bg-gray-50 transition-colors">
                <td class="px-3 py-2.5 border-b text-gray-900 font-medium truncate">${org.org_code}</td>
                <td class="px-3 py-2.5 border-b text-gray-600 truncate">${org.name}</td>
                <td class="hidden sm:table-cell px-3 py-2.5 border-b text-gray-600 truncate">${org.adviser || 'N/A'}</td>
                <td class="px-3 py-2.5 border-b">
                    <span class="px-2 py-1 text-xs font-medium rounded-full ${org.status === 'Active' ? 'bg-green-100 text-green-800' : org.status === 'Inactive' ? 'bg-gray-100 text-gray-800' : 'bg-red-100 text-red-800'}">
                        ${org.status}
                    </span>
                </td>
                <td class="hidden sm:table-cell px-3 py-2.5 border-b text-gray-600 text-sm whitespace-nowrap">${org.created_at ? new Date(org.created_at).toLocaleDateString() : 'N/A'}</td>
                <td class="px-3 py-2.5 border-b text-center align-middle" onclick="event.stopPropagation()">
                    <div class="flex justify-center">
                        ${CrudMenu({
                            id: String(org.id),
                            showView: true,
                            onView: 'viewOrg',
                            onEdit: 'editOrg',
                            onDelete: 'deleteOrg',
                            deleteLabel: org.name
                        })}
                    </div>
                </td>
            </tr>
        `).join('');

        if (typeof lucide !== 'undefined') {
            lucide.createIcons();
        }

        animateTableRows('#orgTableBody tr');
    }

    document.getElementById('addOrgBtn').addEventListener('click', () => {
        openManageOrgsModal({
            mode: 'add',
            onSubmit: async (id, data) => {
                if (id) {
                    await OrganizationsAPI.updateOrganization(id, data);
                } else {
                    await OrganizationsAPI.createOrganization(data);
                }
                loadOrganizations();
            }
        });
    });

    window.editOrg = async (id) => {
        try {
            const organization = await OrganizationsAPI.getOrganization(id);
            openManageOrgsModal({
                mode: 'edit',
                organization: organization,
                onSubmit: async (id, data) => {
                    await OrganizationsAPI.updateOrganization(id, data);
                    loadOrganizations();
                }
            });
        } catch (error) {
            console.error('Error loading organization:', error);
            showToast('Failed to load organization', 'error');
        }
    };

    window.viewOrg = async (id) => {
        await openViewOrgsModal(id);
    };

    window.deleteOrg = (id, deleteLabel) => {
        openConfirmDialog({
            title: 'Confirm Delete',
            message: `Are you sure you want to delete ${deleteLabel || 'this organization'}?`,
            confirmText: 'Delete',
            cancelText: 'Cancel',
            type: 'danger',
            onConfirm: async () => {
                try {
                    await OrganizationsAPI.deleteOrganization(id);
                    loadOrganizations();
                    showToast('Organization deleted successfully', 'success');
                } catch (error) {
                    console.error('Error deleting organization:', error);
                    showToast('Failed to delete organization', 'error');
                }
            }
        });
    };

    document.getElementById('orgSearch').addEventListener('input', (e) => {
        const searchTerm = e.target.value.toLowerCase();
        const filtered = organizations.filter(org => 
            (org.org_code || '').toLowerCase().includes(searchTerm) ||
            (org.name || '').toLowerCase().includes(searchTerm) ||
            (org.adviser || '').toLowerCase().includes(searchTerm) ||
            (org.status || '').toLowerCase().includes(searchTerm)
        );
        renderOrganizations(filtered);
    });

    loadOrganizations();
}

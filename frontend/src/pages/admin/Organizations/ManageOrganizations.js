import { AdminNavbar, initAdminNavbar } from '../../../components/Navbar/AdminNavbar.js';
import { requireAuth } from '../../../utils/jwt.js';
import * as OrganizationsAPI from '../../../api/admin/Organizations/ManageOrganizations.js';
import { initManageOrgsAnimations, animateTableRows } from '../../../provider/Animation/ManageOrgsAnimation.js';
import { openManageOrgsModal, openViewOrgsModal } from '../../../components/Modal/ManageOrgsModal.js';
import { openConfirmDialog } from '../../../components/Dialog/ConfirmDialog.js';
import { showToast } from '../../../components/ToastMessage.js';
import { CrudMenu } from '../../../components/CrudMenu.js';
import { skeletonTableRows } from '../../../components/SkeletonLoading.js';

export function ManageOrganizations() {
    return `
        ${AdminNavbar()}
        <main class="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
                <div>
                    <h1 class="text-2xl font-semibold text-gray-900">Manage Organizations</h1>
                    <p class="text-sm text-gray-500 mt-1">Manage student organizations and their information in the system.</p>
                </div>
                <div class="flex items-center gap-2.5">
                    <input 
                        type="text" 
                        id="orgSearch" 
                        placeholder="Search organizations..." 
                        class="px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent w-48 sm:w-64">
                    <button 
                        type="button" 
                        id="addOrgBtn" 
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
                                <th class="px-5 py-3.5">Code</th>
                                <th class="px-5 py-3.5">Name</th>
                                <th class="px-5 py-3.5 hidden sm:table-cell">Adviser</th>
                                <th class="px-5 py-3.5">Status</th>
                                <th class="px-5 py-3.5 hidden sm:table-cell">Created At</th>
                                <th class="px-5 py-3.5 text-center w-28">Actions</th>
                            </tr>
                        </thead>
                        <tbody id="orgTableBody" class="divide-y divide-gray-100">
                            ${skeletonTableRows(window.innerWidth < 640 ? 3 : 4, window.innerWidth < 640 ? 3 : 5, true)}
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

    let organizations = [];
    let hasLoaded = false;

    async function loadOrganizations(forceRefresh = false) {
        const cachedData = localStorage.getItem('cachedOrganizations');
        if (cachedData && !forceRefresh) {
            try {
                organizations = JSON.parse(cachedData);
                renderOrganizations(organizations);
                hasLoaded = true;
                return;
            } catch (e) {
                console.error('Error parsing cached organizations:', e);
            }
        }

        try {
            organizations = await OrganizationsAPI.getAllOrganizations();
            localStorage.setItem('cachedOrganizations', JSON.stringify(organizations));
            localStorage.setItem('cachedOrganizationsTimestamp', Date.now().toString());
            renderOrganizations(organizations);
            hasLoaded = true;
        } catch (error) {
            console.error('Error loading organizations:', error);
            const tbody = document.getElementById('orgTableBody');
            if (tbody) {
                tbody.innerHTML = `
                    <tr>
                        <td colspan="6" class="px-5 py-12 text-center text-red-500">Failed to load organizations</td>
                    </tr>
                `;
            }
            showToast('Failed to load organizations', 'error');
        }
    }

    function renderOrganizations(data) {
        const tbody = document.getElementById('orgTableBody');
        
        if (!tbody) {
            console.error('orgTableBody element not found');
            return;
        }
        
        if (!data || data.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="6" class="px-5 py-12 text-center">
                        <i data-lucide="building-2" class="w-10 h-10 text-gray-200 mx-auto mb-2"></i>
                        <p class="text-sm text-gray-500 font-medium">No organizations found.</p>
                        <p class="text-xs text-gray-400 mt-1">Click "Add New" to create the first organization.</p>
                    </td>
                </tr>
            `;
            if (typeof lucide !== 'undefined') lucide.createIcons();
            return;
        }

        tbody.innerHTML = data.map((org, index) => {
            return `
            <tr style="transition: background-color 0.2s;" onmouseover="this.style.backgroundColor = document.documentElement.classList.contains('dark') ? 'rgba(255, 255, 255, 0.02)' : 'rgba(0, 0, 0, 0.1)'" onmouseout="this.style.backgroundColor = ''">
                <td class="px-3 sm:px-5 py-2 sm:py-3.5">
                    <p class="text-xs sm:text-sm font-semibold text-gray-900">${org.org_code}</p>
                </td>
                <td class="px-3 sm:px-5 py-2 sm:py-3.5 text-gray-600 text-sm truncate">${org.name}</td>
                <td class="px-3 sm:px-5 py-2 sm:py-3.5 hidden sm:table-cell text-gray-600 text-sm truncate">${org.adviser || 'N/A'}</td>
                <td class="px-3 sm:px-5 py-2 sm:py-3.5">
                    <span class="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${org.status === 'Active' ? 'bg-green-50 text-green-700 border border-green-200' : org.status === 'Inactive' ? 'bg-gray-50 text-gray-700 border border-gray-200' : 'bg-red-50 text-red-700 border border-red-200'}">
                        ${org.status}
                    </span>
                </td>
                <td class="px-3 sm:px-5 py-2 sm:py-3.5 hidden sm:table-cell text-gray-600 text-sm whitespace-nowrap">
                    ${org.created_at ? new Date(org.created_at).toLocaleDateString() : '—'}
                </td>
                <td class="px-3 sm:px-5 py-2 sm:py-3.5 text-center">
                    ${CrudMenu({ 
                        id: String(org.id), 
                        showView: true,
                        onView: 'viewOrg',
                        onEdit: 'editOrg', 
                        onDelete: 'deleteOrg',
                        deleteLabel: org.name
                    })}
                </td>
            </tr>
            `;
        }).join('');

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
                loadOrganizations(true);
            }
        });
    });

    window.editOrg = (id) => {
        openManageOrgsModal({
            mode: 'edit',
            organizationId: id,
            onSubmit: async (id, data) => {
                await OrganizationsAPI.updateOrganization(id, data);
                loadOrganizations(true);
            }
        });
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
                    loadOrganizations(true);
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

    const waitForElement = () => {
        if (document.getElementById('orgTableBody')) {
            loadOrganizations();
        } else {
            setTimeout(waitForElement, 50);
        }
    };
    waitForElement();
}

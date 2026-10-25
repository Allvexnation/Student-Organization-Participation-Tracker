import { AdminNavbar, initAdminNavbar } from '../../../components/Navbar/AdminNavbar.js';
import { requireAuth } from '../../../utils/jwt.js';
import * as RolesAPI from '../../../api/admin/roles/ManageRoles.js';
import { initManageRolesAnimations, animateTableRows } from '../../../provider/Animation/ManageRolesAnimation.js';
import { openManageRolesModal, openViewRolesModal } from '../../../components/Modal/ManageRolesModal.js';
import { openConfirmDialog } from '../../../components/Dialog/ConfirmDialog.js';
import { showToast } from '../../../components/ToastMessage.js';
import { CrudMenu } from '../../../components/CrudMenu.js';
import { skeletonTableRows } from '../../../components/SkeletonLoading.js';

export function ManageRoles() {
    return `
        ${AdminNavbar()}
        <main class="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
                <div>
                    <h1 class="text-2xl font-semibold text-gray-900">Manage Roles</h1>
                    <p class="text-sm text-gray-500 mt-1">Manage user roles and permissions for the system.</p>
                </div>
                <div class="flex items-center gap-2.5">
                    <button 
                        type="button" 
                        id="addRoleBtn" 
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
                                <th class="px-5 py-3.5">Role Name</th>
                                <th class="px-5 py-3.5 hidden sm:table-cell">Linked Users</th>
                                <th class="px-5 py-3.5 hidden sm:table-cell">Created At</th>
                                <th class="px-5 py-3.5 hidden sm:table-cell">Updated At</th>
                                <th class="px-5 py-3.5 text-center w-28">Actions</th>
                            </tr>
                        </thead>
                        <tbody id="roleTableBody" class="divide-y divide-gray-100">
                            ${skeletonTableRows(window.innerWidth < 640 ? 3 : 4, window.innerWidth < 640 ? 3 : 6)}
                        </tbody>
                    </table>
                </div>
            </div>
        </main>
    `;
}

export async function initManageRoles() {
    requireAuth();
    await initAdminNavbar();

    initManageRolesAnimations();

    let roles = [];

    // Load roles
    async function loadRoles() {
        try {
            roles = await RolesAPI.getAllRoles();
            renderRoles(roles);
        } catch (error) {
            console.error('Error loading roles:', error);
            const tbody = document.getElementById('roleTableBody');
            if (tbody) {
                tbody.innerHTML = `
                    <tr>
                        <td colspan="6" class="px-5 py-12 text-center text-red-500">Failed to load roles</td>
                    </tr>
                `;
            }
            showToast('Failed to load roles', 'error');
        }
    }

    function renderRoles(data) {
        const tbody = document.getElementById('roleTableBody');
        
        if (!tbody) {
            console.error('roleTableBody element not found');
            return;
        }
        
        if (!data || data.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="6" class="px-5 py-12 text-center">
                        <i data-lucide="shield" class="w-10 h-10 text-gray-200 mx-auto mb-2"></i>
                        <p class="text-sm text-gray-500 font-medium">No roles found.</p>
                        <p class="text-xs text-gray-400 mt-1">Click "Add New" to create the first role.</p>
                    </td>
                </tr>
            `;
            if (typeof lucide !== 'undefined') lucide.createIcons();
            return;
        }

        tbody.innerHTML = data.map((role, index) => {
            const userCount = role.users ? role.users.length : 0;
            return `
            <tr style="transition: background-color 0.2s;" onmouseover="this.style.backgroundColor = document.documentElement.classList.contains('dark') ? 'rgba(255, 255, 255, 0.02)' : 'rgba(0, 0, 0, 0.1)'" onmouseout="this.style.backgroundColor = ''">
                <td class="px-3 sm:px-5 py-2 sm:py-3.5 text-xs text-gray-400 text-center font-mono">
                    ${index + 1}
                </td>
                <td class="px-3 sm:px-5 py-2 sm:py-3.5">
                    <p class="text-xs sm:text-sm font-semibold text-gray-900">${role.role_name}</p>
                </td>
                <td class="px-3 sm:px-5 py-2 sm:py-3.5 hidden sm:table-cell">
                    <span class="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200">
                        ${userCount} user${userCount !== 1 ? 's' : ''}
                    </span>
                </td>
                <td class="px-3 sm:px-5 py-2 sm:py-3.5 hidden sm:table-cell text-gray-600 text-sm whitespace-nowrap">
                    ${role.created_at ? new Date(role.created_at).toLocaleDateString() : '—'}
                </td>
                <td class="px-3 sm:px-5 py-2 sm:py-3.5 hidden sm:table-cell text-gray-600 text-sm whitespace-nowrap">
                    ${role.updated_at ? new Date(role.updated_at).toLocaleDateString() : '—'}
                </td>
                <td class="px-3 sm:px-5 py-2 sm:py-3.5 text-center">
                    ${CrudMenu({ 
                        id: String(role.id), 
                        showView: true,
                        onView: 'viewRole',
                        onEdit: 'editRole', 
                        onDelete: 'deleteRole',
                        deleteLabel: role.role_name
                    })}
                </td>
            </tr>
            `;
        }).join('');

        if (typeof lucide !== 'undefined') {
            lucide.createIcons();
        }

        animateTableRows('#roleTableBody tr');
    }

    document.getElementById('addRoleBtn').addEventListener('click', () => {
        openManageRolesModal({
            mode: 'add',
            onSubmit: async (id, data) => {
                if (id) {
                    await RolesAPI.updateRole(id, data);
                } else {
                    await RolesAPI.createRole(data);
                }
                loadRoles();
            }
        });
    });

    window.editRole = async (id) => {
        try {
            const role = await RolesAPI.getRole(id);
            openManageRolesModal({
                mode: 'edit',
                role: role,
                onSubmit: async (id, data) => {
                    await RolesAPI.updateRole(id, data);
                    loadRoles();
                }
            });
        } catch (error) {
            console.error('Error loading role:', error);
            showToast('Failed to load role', 'error');
        }
    };

    window.viewRole = async (id) => {
        await openViewRolesModal(id);
    };

    window.deleteRole = (id, deleteLabel) => {
        openConfirmDialog({
            title: 'Confirm Delete',
            message: `Are you sure you want to delete ${deleteLabel || 'this role'}?`,
            confirmText: 'Delete',
            cancelText: 'Cancel',
            type: 'danger',
            onConfirm: async () => {
                try {
                    await RolesAPI.deleteRole(id);
                    loadRoles();
                    showToast('Role deleted successfully', 'success');
                } catch (error) {
                    console.error('Error deleting role:', error);
                    showToast('Failed to delete role', 'error');
                }
            }
        });
    };

    const waitForElement = () => {
        if (document.getElementById('roleTableBody')) {
            loadRoles();
        } else {
            setTimeout(waitForElement, 50);
        }
    };
    waitForElement();
}

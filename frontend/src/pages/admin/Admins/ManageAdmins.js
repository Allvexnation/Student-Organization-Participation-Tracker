import { AdminNavbar, initAdminNavbar } from '../../../components/Navbar/AdminNavbar.js';
import { protectAdminRoute } from '../../../middleware/AdminMiddleware.js';
import * as AdminAPI from '../../../api/admin/Admin/ManageAdmins.js';
import { CacheService } from '../../../../cache/CacheService.js';
import { initManageAdminsAnimations, animateTableRows } from '../../../provider/Animation/ManageAdminsAnimation.js';
import { openManageAdminsModal, openViewAdminModal } from '../../../components/Modal/ManageAdminsModal.js';
import { openConfirmDialog } from '../../../components/Dialog/ConfirmDialog.js';
import { showToast } from '../../../components/ToastMessage.js';
import { CrudMenu } from '../../../components/CrudMenu.js';
import { skeletonTableRows } from '../../../components/SkeletonLoading.js';
import { getDefaultProfileSVG } from '../../../static/Profile/DefaultProfile.js';
import { logChange } from '../../../api/AuditLogs/AuditLogs.js';
import { decodeToken, getToken, isSuperAdmin } from '../../../utils/jwt.js';

export function ManageAdmins() {
    return `
        ${AdminNavbar()}
        <main class="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
                <div>
                    <h1 class="text-2xl font-semibold text-gray-900">Manage Admins</h1>
                    <p class="text-sm text-gray-500 mt-1">Manage admin accounts and their roles in the system.</p>
                </div>
                <div class="flex items-center gap-2.5">
                    <input 
                        type="text" 
                        id="adminSearch" 
                        placeholder="Search admins..." 
                        class="px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent w-48 sm:w-64">
                    <button 
                        type="button" 
                        id="addAdminBtn" 
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
                                <th class="px-5 py-3.5 w-12 text-center hidden sm:table-cell">#</th>
                                <th class="px-5 py-3.5">Photo</th>
                                <th class="px-5 py-3.5">Name</th>
                                <th class="px-5 py-3.5 hidden sm:table-cell">Username</th>
                                <th class="px-5 py-3.5 hidden sm:table-cell">Email</th>
                                <th class="px-5 py-3.5 hidden sm:table-cell">Role</th>
                                <th class="px-5 py-3.5 hidden sm:table-cell">Status</th>
                                <th class="px-5 py-3.5 hidden sm:table-cell">Created At</th>
                                <th class="px-5 py-3.5 text-center w-28">Actions</th>
                            </tr>
                        </thead>
                        <tbody id="adminTableBody" class="divide-y divide-gray-100">
                            ${skeletonTableRows(window.innerWidth < 640 ? 3 : 4, window.innerWidth < 640 ? 3 : 9, true)}
                        </tbody>
                    </table>
                </div>
            </div>
        </main>
    `;
}

export async function initManageAdmins() {
    protectAdminRoute();
    
    if (!isSuperAdmin('admin')) {
        window.location.href = '/404';
        return;
    }
    
    await initAdminNavbar();

    initManageAdminsAnimations();

    const adminToken = getToken('admin');
    const adminUser = decodeToken(adminToken) || {};

    let admins = [];
    let hasLoaded = false;
    async function loadAdmins(forceRefresh = false) {
        if (!forceRefresh) {
            try {
                const cachedData = await CacheService.get('cachedAdmins');
                if (cachedData && Array.isArray(cachedData) && cachedData.length > 0) {
                    admins = cachedData;
                    renderAdmins(admins);
                    hasLoaded = true;
                }
            } catch (e) {
                console.error('Error reading cached admins:', e);
            }
        }

        try {
            const freshData = await AdminAPI.getAllAdmins();
            if (freshData) {
                admins = freshData;
                await CacheService.set('cachedAdmins', admins);
                renderAdmins(admins);
                hasLoaded = true;
            }
        } catch (error) {
            console.error('Error loading admins:', error);
            if (!hasLoaded) {
                const tbody = document.getElementById('adminTableBody');
                if (tbody) {
                    tbody.innerHTML = `
                        <tr>
                            <td colspan="9" class="px-5 py-12 text-center text-red-500">Failed to load admins</td>
                        </tr>
                    `;
                }
                showToast('Failed to load admins', 'error');
            }
        }
    }

function renderAdmins(data) {
        const tbody = document.getElementById('adminTableBody');

        if (!tbody) {
            console.error('adminTableBody element not found');
            return;
        }

        const filteredData = data.filter(admin => 
            (!admin.email || !admin.email.toLowerCase().endsWith('@edu.com')) && 
            admin.id !== adminUser.user_id
        );

        if (!filteredData || filteredData.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="9" class="px-5 py-12 text-center">
                        <i data-lucide="user" class="w-10 h-10 text-gray-200 mx-auto mb-2"></i>
                        <p class="text-sm text-gray-500 font-medium">No admins found.</p>
                        <p class="text-xs text-gray-400 mt-1">Click "Add New" to create the first admin.</p>
                    </td>
                </tr>
            `;
            if (typeof lucide !== 'undefined') lucide.createIcons();
            return;
        }

        tbody.innerHTML = filteredData.map((admin, index) => {
            return `
            <tr style="transition: background-color 0.2s;" onmouseover="this.style.backgroundColor = document.documentElement.classList.contains('dark') ? 'rgba(255, 255, 255, 0.02)' : 'rgba(0, 0, 0, 0.1)'" onmouseout="this.style.backgroundColor = ''">
                <td class="px-3 sm:px-5 py-2 sm:py-3.5 text-xs text-gray-400 text-center font-mono hidden sm:table-cell">
                    ${index + 1}
                </td>
                <td class="px-3 sm:px-5 py-2 sm:py-3.5">
                    ${admin.profile_photo ?
                        `<img src="${admin.profile_photo}" alt="${admin.name}" class="w-10 h-10 object-cover rounded-full" onerror="handleProfileImageError(this)">` :
                        `<div class="w-10 h-10 rounded-full overflow-hidden">
                            ${getDefaultProfileSVG('100%', '100%')}
                        </div>`
                    }
                </td>
                <td class="px-3 sm:px-5 py-2 sm:py-3.5">
                    <p class="text-xs sm:text-sm font-semibold text-gray-900">${admin.name}</p>
                </td>
                <td class="px-3 sm:px-5 py-2 sm:py-3.5 hidden sm:table-cell text-gray-600 text-sm truncate">${admin.username}</td>
                <td class="px-3 sm:px-5 py-2 sm:py-3.5 hidden sm:table-cell text-gray-600 text-sm truncate">${admin.email}</td>
                <td class="px-3 sm:px-5 py-2 sm:py-3.5 hidden sm:table-cell">
                    <span class="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${admin.role === 'super_admin' ? 'bg-purple-50 text-purple-700 border border-purple-200' : 'bg-blue-50 text-blue-700 border border-blue-200'}">
                        ${admin.role === 'super_admin' ? 'Super Admin' : 'Admin'}
                    </span>
                </td>
                <td class="px-3 sm:px-5 py-2 sm:py-3.5 hidden sm:table-cell">
                    <span class="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${admin.status === 'active' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}">
                        ${admin.status}
                    </span>
                </td>
                <td class="px-3 sm:px-5 py-2 sm:py-3.5 hidden sm:table-cell text-gray-600 text-sm whitespace-nowrap">
                    ${admin.created_at ? new Date(admin.created_at).toLocaleDateString() : '—'}
                </td>
                <td class="px-3 sm:px-5 py-2 sm:py-3.5 text-center">
                    ${CrudMenu({
                        id: String(admin.id),
                        showView: true,
                        onView: 'viewAdmin',
                        onEdit: 'editAdmin',
                        onDelete: 'deleteAdmin',
                        deleteLabel: admin.name
                    })}
                </td>
            </tr>
            `;
        }).join('');

        if (typeof lucide !== 'undefined') {
            lucide.createIcons();
        }

        animateTableRows('#adminTableBody tr');
    }

    document.getElementById('addAdminBtn').addEventListener('click', () => {
        openManageAdminsModal({
            mode: 'add',
            onSubmit: async (id, data) => {
                if (id) {
                    await AdminAPI.updateAdmin(id, data);
                } else {
                    const response = await AdminAPI.createAdmin(data);
                    try {
                        await logChange({
                            user_id: adminUser.user_id,
                            user_type: 'admin',
                            action: 'create',
                            table_name: 'admins',
                            record_id: response.id,
                            field_name: 'all',
                            old_value: null,
                            new_value: `Admin: ${data.name}`
                        });
                    } catch (error) {
                        console.error('Failed to log admin creation:', error);
                    }
                    loadAdmins(true);
                    return response;
                }
                loadAdmins(true);
            }
        });
    });

    window.editAdmin = (id) => {
        openManageAdminsModal({
            mode: 'edit',
            adminId: id,
            onSubmit: async (id, data) => {
                const oldAdmin = admins.find(a => a.id === id);
                try {
                    await AdminAPI.updateAdmin(id, data);

                    const fieldsToLog = ['name', 'username', 'email', 'role', 'status'];
                    for (const field of fieldsToLog) {
                        if (oldAdmin && oldAdmin[field] !== data[field]) {
                            try {
                                await logChange({
                                    user_id: adminUser.user_id,
                                    user_type: 'admin',
                                    action: 'update',
                                    table_name: 'admins',
                                    record_id: id,
                                    field_name: field,
                                    old_value: oldAdmin[field] || 'None',
                                    new_value: data[field] || 'Removed'
                                });
                            } catch (error) {
                                console.error(`Failed to log admin ${field} change:`, error);
                            }
                        }
                    }

                    if (oldAdmin && oldAdmin.profile_photo !== data.profile_photo) {
                        try {
                            await logChange({
                                user_id: adminUser.user_id,
                                user_type: 'admin',
                                action: 'update',
                                table_name: 'admins',
                                record_id: id,
                                field_name: 'profile_photo',
                                old_value: oldAdmin.profile_photo ? 'Base64 image data' : 'None',
                                new_value: data.profile_photo ? 'Base64 image data' : 'Removed'
                            });
                        } catch (error) {
                            console.error('Failed to log admin profile photo change:', error);
                        }
                    }

                    loadAdmins(true);
                    showToast('Admin updated successfully', 'success');
                } catch (error) {
                    showToast(error.message || 'Failed to update admin', 'error');
                }
            }
        });
    };

    window.viewAdmin = async (id) => {
        await openViewAdminModal(id);
    };

    window.deleteAdmin = (id, deleteLabel) => {
        openConfirmDialog({
            title: 'Confirm Delete',
            message: `Are you sure you want to delete ${deleteLabel || 'this admin'}?`,
            confirmText: 'Delete',
            cancelText: 'Cancel',
            type: 'danger',
            showReason: true,
            onConfirm: async (reason) => {
                try {
                    const oldAdmin = admins.find(a => a.id === id);
                    await AdminAPI.deleteAdmin(id, reason);

                    try {
                        await logChange({
                            user_id: adminUser.user_id,
                            user_type: 'admin',
                            action: 'delete',
                            table_name: 'admins',
                            record_id: id,
                            field_name: 'all',
                            old_value: `Admin: ${oldAdmin?.name || 'Unknown'}`,
                            new_value: null
                        });
                    } catch (error) {
                        console.error('Failed to log admin deletion:', error);
                    }

                    loadAdmins(true);
                    showToast('Admin deleted successfully', 'success');
                } catch (error) {
                    console.error('Error deleting admin:', error);
                    showToast('Failed to delete admin', 'error');
                }
            }
        });
    };

    document.getElementById('adminSearch').addEventListener('input', (e) => {
        const searchTerm = e.target.value.toLowerCase();
        const filtered = admins.filter(admin => 
            admin.name.toLowerCase().includes(searchTerm) ||
            admin.username.toLowerCase().includes(searchTerm) ||
            admin.email.toLowerCase().includes(searchTerm)
        );
        renderAdmins(filtered);
    });

    const waitForElement = () => {
        if (document.getElementById('adminTableBody')) {
            loadAdmins();
        } else {
            setTimeout(waitForElement, 50);
        }
    };
    waitForElement();
}

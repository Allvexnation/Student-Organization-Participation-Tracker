import { createBan, updateBan, getSessions, getAllBans, deactivateBan, cleanupExpiredBans, deleteBan, activateBan } from '../../../api/web/Banned.js';
import { showToast, updateToast } from '../../../components/ToastMessage.js';
import { AdminNavbar, initAdminNavbar } from '../../../components/Navbar/AdminNavbar.js';
import { protectAdminRoute } from '../../../middleware/AdminMiddleware.js';
import { API_ROUTES } from '../../../api/server/api.js';
import { initManageBannedAnimations, animateTableRows } from '../../../provider/Animation/ManageBannedAnimation.js';
import { openManageBannedModal } from '../../../components/Modal/ManageBannedModal.js';
import { openConfirmDialog } from '../../../components/Dialog/ConfirmDialog.js';
import { CrudMenu } from '../../../components/CrudMenu.js';
import { skeletonTableRows } from '../../../components/SkeletonLoading.js';

export function ManageBanned() {
    return `
        ${AdminNavbar()}
        <main class="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
                <div>
                    <h1 class="text-2xl font-semibold text-gray-900">Manage Bans</h1>
                    <p class="text-sm text-gray-500 mt-1">Create and manage user bans in the system.</p>
                </div>
                <div class="flex items-center gap-2.5">
                    <input 
                        type="text" 
                        id="bannedSearch" 
                        placeholder="Search bans..." 
                        class="px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent w-48 sm:w-64">
                    <button 
                        type="button" 
                        id="addBanBtn" 
                        class="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 transition flex items-center gap-2 shadow-sm">
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
                                <th class="px-5 py-3.5">Type</th>
                                <th class="px-5 py-3.5">Target</th>
                                <th class="px-5 py-3.5 hidden sm:table-cell">IP Address</th>
                                <th class="px-5 py-3.5 hidden sm:table-cell">Reason</th>
                                <th class="px-5 py-3.5 hidden sm:table-cell">Status</th>
                                <th class="px-5 py-3.5 hidden sm:table-cell">Duration</th>
                                <th class="px-5 py-3.5 hidden sm:table-cell">Expires</th>
                                <th class="px-5 py-3.5 hidden sm:table-cell">Created</th>
                                <th class="px-5 py-3.5 text-center w-28">Actions</th>
                            </tr>
                        </thead>
                        <tbody id="bannedTableBody" class="divide-y divide-gray-100">
                            ${skeletonTableRows(window.innerWidth < 640 ? 3 : 4, window.innerWidth < 640 ? 3 : 9, true)}
                        </tbody>
                    </table>
                </div>
            </div>
        </main>
    `;
}

export async function initManageBanned() {
    protectAdminRoute();
    await initAdminNavbar();

    initManageBannedAnimations();

    let bans = [];
    let hasLoaded = false;

    async function loadBans(forceRefresh = false) {
        try {

            const result = await getAllBans();
            if (result) {
                bans = result.bans || [];
                renderBans(bans);
                hasLoaded = true;
            }
        } catch (error) {
            console.error('Error loading bans:', error);
            if (!hasLoaded) {
                const tbody = document.getElementById('bannedTableBody');
                if (tbody) {
                    tbody.innerHTML = `
                        <tr>
                            <td colspan="10" class="px-5 py-12 text-center text-red-500">Failed to load bans</td>
                        </tr>
                    `;
                }
                showToast('Failed to load bans', 'error');
            }
        }
    }

    function renderBans(data) {
        const tbody = document.getElementById('bannedTableBody');
        
        if (!tbody) {
            console.error('bannedTableBody element not found');
            return;
        }
        
        if (!data || data.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="10" class="px-5 py-12 text-center">
                        <i data-lucide="shield" class="w-10 h-10 text-gray-200 mx-auto mb-2"></i>
                        <p class="text-sm text-gray-500 font-medium">No bans found.</p>
                        <p class="text-xs text-gray-400 mt-1">Click "Add New" to create the first ban.</p>
                    </td>
                </tr>
            `;
            if (typeof lucide !== 'undefined') lucide.createIcons();
            return;
        }

        tbody.innerHTML = data.map((ban, index) => {
            return `
            <tr style="transition: background-color 0.2s;" onmouseover="this.style.backgroundColor = document.documentElement.classList.contains('dark') ? 'rgba(255, 255, 255, 0.02)' : 'rgba(0, 0, 0, 0.1)'" onmouseout="this.style.backgroundColor = ''">
                <td class="px-3 sm:px-5 py-2 sm:py-3.5 text-xs text-gray-400 text-center font-mono hidden sm:table-cell">
                    ${index + 1}
                </td>
                <td class="px-3 sm:px-5 py-2 sm:py-3.5">
                    <span class="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${
                        ban.ban_type === 'session' ? 'bg-yellow-50 text-yellow-700 border border-yellow-200' :
                        ban.ban_type === 'overall' ? 'bg-red-50 text-red-700 border border-red-200' :
                        'bg-blue-50 text-blue-700 border border-blue-200'
                    }">
                        ${ban.ban_type.toUpperCase()}
                    </span>
                </td>
                <td class="px-3 sm:px-5 py-2 sm:py-3.5 text-gray-600 text-sm truncate">
                    ${ban.target_name || '—'}
                </td>
                <td class="px-3 sm:px-5 py-2 sm:py-3.5 hidden sm:table-cell text-gray-600 text-sm truncate">
                    ${ban.ip_address || '—'}
                </td>
                <td class="px-3 sm:px-5 py-2 sm:py-3.5 hidden sm:table-cell text-gray-600 text-sm truncate max-w-xs">
                    ${ban.reason || '—'}
                </td>
                <td class="px-3 sm:px-5 py-2 sm:py-3.5 hidden sm:table-cell">
                    <span class="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${
                        ban.is_active === 1 ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-gray-50 text-gray-500 border border-gray-200'
                    }">
                        ${ban.is_active === 1 ? 'Active' : 'Not Active'}
                    </span>
                </td>
                <td class="px-3 sm:px-5 py-2 sm:py-3.5 hidden sm:table-cell">
                    <span class="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${
                        ban.ban_duration_type === 'permanent' ? 'bg-gray-50 text-gray-700 border border-gray-200' :
                        'bg-orange-50 text-orange-700 border border-orange-200'
                    }">
                        ${ban.ban_duration_type}
                    </span>
                </td>
                <td class="px-3 sm:px-5 py-2 sm:py-3.5 hidden sm:table-cell text-gray-600 text-sm whitespace-nowrap">
                    ${ban.expires_at ? new Date(ban.expires_at).toLocaleString() : '—'}
                </td>
                <td class="px-3 sm:px-5 py-2 sm:py-3.5 hidden sm:table-cell text-gray-600 text-sm whitespace-nowrap">
                    ${ban.created_at ? new Date(ban.created_at).toLocaleString() : '—'}
                </td>
                <td class="px-3 sm:px-5 py-2 sm:py-3.5 text-center">
                    ${CrudMenu({
                        id: String(ban.id),
                        showView: false,
                        onEdit: 'editBan',
                        onDelete: 'deleteBan',
                        deleteLabel: 'this ban',
                        deleteText: 'Delete',
                        customActions: [
                            {
                                title: ban.is_active === 1 ? 'Deactivate' : 'Activate',
                                handler: `toggleBanStatus('${ban.id}', ${ban.is_active})`,
                                icon: ban.is_active === 1
                                    ? `<svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18.36 6.64a9 9 0 1 1-12.73 0"/><line x1="12" x2="12" y1="2" y2="12"/></svg>`
                                    : `<svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14"/><path d="M12 5v14"/></svg>`,
                                colorClass: ban.is_active === 1 ? 'text-yellow-700 hover:bg-yellow-50' : 'text-green-700 hover:bg-green-50'
                            }
                        ]
                    })}
                </td>
            </tr>
            `;
        }).join('');

        if (typeof lucide !== 'undefined') {
            lucide.createIcons();
        }

        animateTableRows('#bannedTableBody tr');
    }

    document.getElementById('addBanBtn').addEventListener('click', () => {
        openManageBannedModal({
            mode: 'add',
            onSubmit: async (id, data) => {
                await createBan(data);
                loadBans(true);
            }
        });
    });

    window.editBan = (id) => {
        const ban = bans.find(b => String(b.id) === String(id));
        openManageBannedModal({
            mode: 'edit',
            ban: ban,
            banId: id,
            onSubmit: async (id, data) => {
                await updateBan(id, data);
                loadBans(true);
            }
        });
    };

    window.deactivateBan = (id, deleteLabel) => {
        openConfirmDialog({
            title: 'Confirm Deactivation',
            message: `Are you sure you want to deactivate ${deleteLabel || 'this ban'}?`,
            confirmText: 'Deactivate',
            cancelText: 'Cancel',
            type: 'danger',
            onConfirm: async () => {
                try {
                    await deactivateBan(id);
                    loadBans(true);
                    showToast('Ban deactivated successfully', 'success');
                } catch (error) {
                    console.error('Error deactivating ban:', error);
                    showToast('Failed to deactivate ban', 'error');
                }
            }
        });
    };

    window.deleteBan = (id, deleteLabel) => {
        openConfirmDialog({
            title: 'Confirm Deletion',
            message: `Are you sure you want to permanently delete ${deleteLabel || 'this ban'}? This action cannot be undone.`,
            confirmText: 'Delete',
            cancelText: 'Cancel',
            type: 'danger',
            onConfirm: async () => {
                try {
                    await deleteBan(id);
                    loadBans(true);
                    showToast('Ban deleted successfully', 'success');
                } catch (error) {
                    console.error('Error deleting ban:', error);
                    showToast('Failed to delete ban', 'error');
                }
            }
        });
    };

    window.toggleBanStatus = async (id, currentStatus) => {
        const action = currentStatus === 1 ? 'deactivate' : 'activate';
        const message = `Are you sure you want to ${action} this ban?`;

        openConfirmDialog({
            title: `Confirm ${action.charAt(0).toUpperCase() + action.slice(1)}`,
            message: message,
            confirmText: action.charAt(0).toUpperCase() + action.slice(1),
            cancelText: 'Cancel',
            type: currentStatus === 1 ? 'warning' : 'success',
            onConfirm: async () => {
                try {
                    if (currentStatus === 1) {
                        await deactivateBan(id);
                        showToast('Ban deactivated successfully', 'success');
                    } else {
                        await activateBan(id);
                        showToast('Ban activated successfully', 'success');
                    }
                    loadBans(true);
                } catch (error) {
                    console.error(`Error ${action}ing ban:`, error);
                    showToast(`Failed to ${action} ban`, 'error');
                }
            }
        });
    };

    document.getElementById('bannedSearch').addEventListener('input', (e) => {
        const searchTerm = e.target.value.toLowerCase();
        const filtered = bans.filter(ban => 
            (ban.reason && ban.reason.toLowerCase().includes(searchTerm)) ||
            (ban.target_name && ban.target_name.toLowerCase().includes(searchTerm)) ||
            (ban.ip_address && ban.ip_address.toLowerCase().includes(searchTerm)) ||
            (ban.ban_type && ban.ban_type.toLowerCase().includes(searchTerm))
        );
        renderBans(filtered);
    });

    const waitForElement = () => {
        if (document.getElementById('bannedTableBody')) {
            loadBans();
        } else {
            setTimeout(waitForElement, 50);
        }
    };
    waitForElement();
}

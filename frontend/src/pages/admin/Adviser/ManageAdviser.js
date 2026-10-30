import { AdminNavbar, initAdminNavbar } from '../../../components/Navbar/AdminNavbar.js';
import { protectAdminRoute } from '../../../middleware/AdminMiddleware.js';
import * as AdviserAPI from '../../../api/admin/adviser/ManageAdviser.js';
import { CacheService } from '../../../../cache/CacheService.js';
import { initManageAdviserAnimations, animateTableRows } from '../../../provider/Animation/ManageAdviserAnimation.js';
import { openManageAdviserModal, openViewAdviserModal } from '../../../components/Modal/ManageAdviserModal.js';
import { openConfirmDialog } from '../../../components/Dialog/ConfirmDialog.js';
import { showToast } from '../../../components/ToastMessage.js';
import { CrudMenu } from '../../../components/CrudMenu.js';
import { skeletonTableRows } from '../../../components/SkeletonLoading.js';

export function ManageAdviser() {
    return `
        ${AdminNavbar()}
        <main class="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
                <div>
                    <h1 class="text-2xl font-semibold text-gray-900">Manage Advisers</h1>
                    <p class="text-sm text-gray-500 mt-1">Manage adviser accounts and their roles in the system.</p>
                </div>
                <div class="flex items-center gap-2.5">
                    <input 
                        type="text" 
                        id="adviserSearch" 
                        placeholder="Search advisers..." 
                        class="px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent w-48 sm:w-64">
                    <button 
                        type="button" 
                        id="addAdviserBtn" 
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
                        <tbody id="adviserTableBody" class="divide-y divide-gray-100">
                            ${skeletonTableRows(window.innerWidth < 640 ? 3 : 4, window.innerWidth < 640 ? 3 : 9, true)}
                        </tbody>
                    </table>
                </div>
            </div>
        </main>
    `;
}

export async function initManageAdviser() {
    protectAdminRoute();
    await initAdminNavbar();

    initManageAdviserAnimations();

    let advisers = [];
    let hasLoaded = false;
    async function loadAdvisers(forceRefresh = false) {
        if (!forceRefresh) {
            try {
                const cachedData = await CacheService.get('cachedAdvisers');
                if (cachedData && Array.isArray(cachedData) && cachedData.length > 0) {
                    advisers = cachedData;
                    renderAdvisers(advisers);
                    hasLoaded = true;
                }
            } catch (e) {
                console.error('Error reading cached advisers:', e);
            }
        }

        try {
            const freshData = await AdviserAPI.getAllAdvisers();
            if (freshData) {
                advisers = freshData;
                await CacheService.set('cachedAdvisers', advisers);
                renderAdvisers(advisers);
                hasLoaded = true;
            }
        } catch (error) {
            console.error('Error loading advisers:', error);
            if (!hasLoaded) {
                const tbody = document.getElementById('adviserTableBody');
                if (tbody) {
                    tbody.innerHTML = `
                        <tr>
                            <td colspan="9" class="px-5 py-12 text-center text-red-500">Failed to load advisers</td>
                        </tr>
                    `;
                }
                showToast('Failed to load advisers', 'error');
            }
        }
    }

    function renderAdvisers(data) {
        const tbody = document.getElementById('adviserTableBody');
        
        if (!tbody) {
            console.error('adviserTableBody element not found');
            return;
        }
        
        if (!data || data.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="9" class="px-5 py-12 text-center">
                        <i data-lucide="user" class="w-10 h-10 text-gray-200 mx-auto mb-2"></i>
                        <p class="text-sm text-gray-500 font-medium">No advisers found.</p>
                        <p class="text-xs text-gray-400 mt-1">Click "Add New" to create the first adviser.</p>
                    </td>
                </tr>
            `;
            if (typeof lucide !== 'undefined') lucide.createIcons();
            return;
        }

        tbody.innerHTML = data.map((adviser, index) => {
            return `
            <tr style="transition: background-color 0.2s;" onmouseover="this.style.backgroundColor = document.documentElement.classList.contains('dark') ? 'rgba(255, 255, 255, 0.02)' : 'rgba(0, 0, 0, 0.1)'" onmouseout="this.style.backgroundColor = ''">
                <td class="px-3 sm:px-5 py-2 sm:py-3.5 text-xs text-gray-400 text-center font-mono hidden sm:table-cell">
                    ${index + 1}
                </td>
                <td class="px-3 sm:px-5 py-2 sm:py-3.5">
                    ${adviser.profile_photo ? 
                        `<img src="${adviser.profile_photo}" alt="${adviser.name}" class="w-10 h-10 object-cover rounded-full">` : 
                        `<div class="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                            <i data-lucide="user" class="w-5 h-5 text-gray-400"></i>
                        </div>`
                    }
                </td>
                <td class="px-3 sm:px-5 py-2 sm:py-3.5">
                    <p class="text-xs sm:text-sm font-semibold text-gray-900">${adviser.name}</p>
                </td>
                <td class="px-3 sm:px-5 py-2 sm:py-3.5 hidden sm:table-cell text-gray-600 text-sm truncate">${adviser.username}</td>
                <td class="px-3 sm:px-5 py-2 sm:py-3.5 hidden sm:table-cell text-gray-600 text-sm truncate">${adviser.email}</td>
                <td class="px-3 sm:px-5 py-2 sm:py-3.5 hidden sm:table-cell">
                    <span class="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${adviser.role === 'head_adviser' ? 'bg-purple-50 text-purple-700 border border-purple-200' : 'bg-blue-50 text-blue-700 border border-blue-200'}">
                        ${adviser.role === 'head_adviser' ? 'Head Adviser' : 'Adviser'}
                    </span>
                </td>
                <td class="px-3 sm:px-5 py-2 sm:py-3.5 hidden sm:table-cell">
                    <span class="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${adviser.status === 'active' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}">
                        ${adviser.status}
                    </span>
                </td>
                <td class="px-3 sm:px-5 py-2 sm:py-3.5 hidden sm:table-cell text-gray-600 text-sm whitespace-nowrap">
                    ${adviser.created_at ? new Date(adviser.created_at).toLocaleDateString() : '—'}
                </td>
                <td class="px-3 sm:px-5 py-2 sm:py-3.5 text-center">
                    ${CrudMenu({ 
                        id: String(adviser.id), 
                        showView: true,
                        onView: 'viewAdviser',
                        onEdit: 'editAdviser', 
                        onDelete: 'deleteAdviser',
                        deleteLabel: adviser.name
                    })}
                </td>
            </tr>
            `;
        }).join('');

        if (typeof lucide !== 'undefined') {
            lucide.createIcons();
        }

        animateTableRows('#adviserTableBody tr');
    }

    document.getElementById('addAdviserBtn').addEventListener('click', () => {
        openManageAdviserModal({
            mode: 'add',
            onSubmit: async (id, data) => {
                if (id) {
                    await AdviserAPI.updateAdviser(id, data);
                } else {
                    const response = await AdviserAPI.createAdviser(data);
                    loadAdvisers(true);
                    return response;
                }
                loadAdvisers(true);
            }
        });
    });

    window.editAdviser = (id) => {
        openManageAdviserModal({
            mode: 'edit',
            adviserId: id,
            onSubmit: async (id, data) => {
                await AdviserAPI.updateAdviser(id, data);
                loadAdvisers(true);
            }
        });
    };

    window.viewAdviser = async (id) => {
        await openViewAdviserModal(id);
    };

    window.deleteAdviser = (id, deleteLabel) => {
        openConfirmDialog({
            title: 'Confirm Delete',
            message: `Are you sure you want to delete ${deleteLabel || 'this adviser'}?`,
            confirmText: 'Delete',
            cancelText: 'Cancel',
            type: 'danger',
            showReason: true,
            onConfirm: async (reason) => {
                try {
                    await AdviserAPI.deleteAdviser(id, reason);
                    loadAdvisers(true);
                    showToast('Adviser deleted successfully', 'success');
                } catch (error) {
                    console.error('Error deleting adviser:', error);
                    showToast('Failed to delete adviser', 'error');
                }
            }
        });
    };

    document.getElementById('adviserSearch').addEventListener('input', (e) => {
        const searchTerm = e.target.value.toLowerCase();
        const filtered = advisers.filter(adviser => 
            adviser.name.toLowerCase().includes(searchTerm) ||
            adviser.username.toLowerCase().includes(searchTerm) ||
            adviser.email.toLowerCase().includes(searchTerm)
        );
        renderAdvisers(filtered);
    });

    const waitForElement = () => {
        if (document.getElementById('adviserTableBody')) {
            loadAdvisers();
        } else {
            setTimeout(waitForElement, 50);
        }
    };
    waitForElement();
}

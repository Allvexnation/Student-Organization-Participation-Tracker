import { AdminNavbar, initAdminNavbar } from '../../../components/Navbar/AdminNavbar.js';
import { requireAuth } from '../../../utils/jwt.js';
import * as AdviserAPI from '../../../api/admin/adviser/ManageAdviser.js';
import { initManageAdviserAnimations, addButtonHoverAnimations, animateSearchInput, animateTableRows } from '../../../provider/Animation/ManageAdviserAnimation.js';
import { openManageAdviserModal, openViewAdviserModal } from '../../../components/Modal/ManageAdviserModal.js';
import { openConfirmDialog } from '../../../components/Dialog/ConfirmDialog.js';
import { showToast } from '../../../components/ToastMessage.js';
import { CrudMenu } from '../../../components/CrudMenu.js';

export function ManageAdviser() {
    return `
        ${AdminNavbar()}
        <main class="container mx-auto px-4 py-8 bg-white min-h-screen">
            <div class="p-6">
                <div class="flex justify-between items-center mb-6">
                    <h2 class="text-2xl font-bold text-blue-800">Manage Advisers</h2>
                    <button id="addAdviserBtn" class="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors">
                        <i data-lucide="plus" class="w-4 h-4"></i>
                        <span>Add Adviser</span>
                    </button>
                </div>

                <div class="mb-4">
                    <input type="text" id="adviserSearch" placeholder="Search advisers..." class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                </div>

                <div class="overflow-x-auto">
                    <table class="w-full table-fixed border-collapse">
                        <thead>
                            <tr class="bg-blue-50">
                                <th class="w-20 px-3 py-2.5 text-left text-sm font-semibold text-blue-900 border-b-2 border-blue-200 whitespace-nowrap">Photo</th>
                                <th class="px-3 py-2.5 text-left text-sm font-semibold text-blue-900 border-b-2 border-blue-200 whitespace-nowrap">Name</th>
                                <th class="hidden sm:table-cell w-28 px-3 py-2.5 text-left text-sm font-semibold text-blue-900 border-b-2 border-blue-200 whitespace-nowrap">Username</th>
                                <th class="hidden sm:table-cell px-3 py-2.5 text-left text-sm font-semibold text-blue-900 border-b-2 border-blue-200 whitespace-nowrap">Email</th>
                                <th class="w-28 px-3 py-2.5 text-left text-sm font-semibold text-blue-900 border-b-2 border-blue-200 whitespace-nowrap">Role</th>
                                <th class="hidden sm:table-cell w-20 px-3 py-2.5 text-left text-sm font-semibold text-blue-900 border-b-2 border-blue-200 whitespace-nowrap">Status</th>
                                <th class="hidden sm:table-cell w-28 px-3 py-2.5 text-left text-sm font-semibold text-blue-900 border-b-2 border-blue-200 whitespace-nowrap">Created At</th>
                                <th class="w-28 px-3 py-2.5 text-center text-sm font-semibold text-blue-900 border-b-2 border-blue-200 whitespace-nowrap">Actions</th>
                            </tr>
                        </thead>
                        <tbody id="adviserTableBody">
                            ${Array.from({ length: 5 }, () => `
                                <tr>
                                    <td class="px-3 py-2.5 border-b">
                                        <div class="w-12 h-12 bg-gray-200 rounded-full animate-pulse"></div>
                                    </td>
                                    <td class="px-3 py-2.5 border-b">
                                        <div class="h-4 w-3/4 bg-gray-200 rounded animate-pulse"></div>
                                    </td>
                                    <td class="hidden sm:table-cell px-3 py-2.5 border-b">
                                        <div class="h-4 w-3/4 bg-gray-200 rounded animate-pulse"></div>
                                    </td>
                                    <td class="hidden sm:table-cell px-3 py-2.5 border-b">
                                        <div class="h-4 w-4/5 bg-gray-200 rounded animate-pulse"></div>
                                    </td>
                                    <td class="px-3 py-2.5 border-b">
                                        <div class="h-6 w-20 bg-gray-200 rounded-full animate-pulse"></div>
                                    </td>
                                    <td class="hidden sm:table-cell px-3 py-2.5 border-b">
                                        <div class="h-6 w-14 bg-gray-200 rounded-full animate-pulse"></div>
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

export async function initManageAdviser() {
    requireAuth();
    await initAdminNavbar();

    initManageAdviserAnimations();
    addButtonHoverAnimations('button');
    animateSearchInput('#adviserSearch');

    let advisers = [];

    // Load advisers
    async function loadAdvisers() {
        try {
            advisers = await AdviserAPI.getAllAdvisers();
            renderAdvisers(advisers);
        } catch (error) {
            console.error('Error loading advisers:', error);
            const tbody = document.getElementById('adviserTableBody');
            if (tbody) {
                tbody.innerHTML = `
                    <tr>
                        <td colspan="8" class="px-4 py-8 text-center text-red-500">Failed to load advisers</td>
                    </tr>
                `;
            }
            showToast('Failed to load advisers', 'error');
        }
    }

    // Render advisers table
    function renderAdvisers(data) {
        const tbody = document.getElementById('adviserTableBody');
        
        if (!data || data.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="8" class="px-4 py-8 text-center text-gray-500">No advisers found</td>
                </tr>
            `;
            return;
        }

        tbody.innerHTML = data.map(adviser => `
            <tr class="hover:bg-gray-50 transition-colors">
                <td class="px-3 py-2.5 border-b">
                    ${adviser.profile_photo ? 
                        `<img src="${adviser.profile_photo}" alt="${adviser.name}" class="w-12 h-12 object-cover rounded-full">` : 
                        `<div class="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center">
                            <i data-lucide="user" class="w-6 h-6 text-gray-400"></i>
                        </div>`
                    }
                </td>
                <td class="px-3 py-2.5 border-b text-gray-900 truncate">${adviser.name}</td>
                <td class="hidden sm:table-cell px-3 py-2.5 border-b text-gray-600 truncate">${adviser.username}</td>
                <td class="hidden sm:table-cell px-3 py-2.5 border-b text-gray-600 truncate">${adviser.email}</td>
                <td class="px-3 py-2.5 border-b">
                    <span class="px-2 py-1 text-xs font-medium rounded-full ${adviser.role === 'head_adviser' ? 'bg-purple-100 text-purple-800' : 'bg-blue-100 text-blue-800'}">
                        ${adviser.role === 'head_adviser' ? 'Head Adviser' : 'Adviser'}
                    </span>
                </td>
                <td class="hidden sm:table-cell px-3 py-2.5 border-b">
                    <span class="px-2 py-1 text-xs font-medium rounded-full ${adviser.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}">
                        ${adviser.status}
                    </span>
                </td>
                <td class="hidden sm:table-cell px-3 py-2.5 border-b text-gray-600 text-sm whitespace-nowrap">${new Date(adviser.created_at).toLocaleDateString()}</td>
                <td class="px-3 py-2.5 border-b text-center align-middle" onclick="event.stopPropagation()">
                    <div class="flex justify-center">
                        ${CrudMenu({
                            id: String(adviser.id),
                            showView: true,
                            onView: 'viewAdviser',
                            onEdit: 'editAdviser',
                            onDelete: 'deleteAdviser',
                            deleteLabel: adviser.name
                        })}
                    </div>
                </td>
            </tr>
        `).join('');

        if (typeof lucide !== 'undefined') {
            lucide.createIcons();
        }

        animateTableRows('#adviserTableBody tr');
    }

    // Open add modal
    document.getElementById('addAdviserBtn').addEventListener('click', () => {
        openManageAdviserModal({
            mode: 'add',
            onSubmit: async (id, data) => {
                if (id) {
                    await AdviserAPI.updateAdviser(id, data);
                } else {
                    await AdviserAPI.createAdviser(data);
                }
                loadAdvisers();
            }
        });
    });

    // Edit adviser (global function)
    window.editAdviser = async (id) => {
        try {
            const adviser = await AdviserAPI.getAdviser(id);
            openManageAdviserModal({
                mode: 'edit',
                adviser: adviser,
                onSubmit: async (id, data) => {
                    await AdviserAPI.updateAdviser(id, data);
                    loadAdvisers();
                }
            });
        } catch (error) {
            console.error('Error loading adviser:', error);
            showToast('Failed to load adviser', 'error');
        }
    };

    // View adviser (global function)
    window.viewAdviser = async (id) => {
        await openViewAdviserModal(id);
    };

    // Delete adviser (global function)
    window.deleteAdviser = (id, deleteLabel) => {
        openConfirmDialog({
            title: 'Confirm Delete',
            message: `Are you sure you want to delete ${deleteLabel || 'this adviser'}?`,
            confirmText: 'Delete',
            cancelText: 'Cancel',
            type: 'danger',
            onConfirm: async () => {
                try {
                    await AdviserAPI.deleteAdviser(id);
                    loadAdvisers();
                    showToast('Adviser deleted successfully', 'success');
                } catch (error) {
                    console.error('Error deleting adviser:', error);
                    showToast('Failed to delete adviser', 'error');
                }
            }
        });
    };

    // Search functionality
    document.getElementById('adviserSearch').addEventListener('input', (e) => {
        const searchTerm = e.target.value.toLowerCase();
        const filtered = advisers.filter(adviser => 
            adviser.name.toLowerCase().includes(searchTerm) ||
            adviser.username.toLowerCase().includes(searchTerm) ||
            adviser.email.toLowerCase().includes(searchTerm)
        );
        renderAdvisers(filtered);
    });

    // Initial load
    loadAdvisers();
}

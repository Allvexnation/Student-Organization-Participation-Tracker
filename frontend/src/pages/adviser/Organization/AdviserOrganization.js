import { AdviserNavbar, initAdviserNavbar } from '../../../components/Navbar/AdviserNavbar.js';
import { protectAdviserRoute } from '../../../middleware/AdviserMiddleware.js';
import * as AdviserOrganizationAPI from '../../../api/adviser/Organization/AdviserOrganization.js';
import { openAdviserOrgMemModal, openViewAdviserOrgMemModal, openEditOrgModal, openSwitchOrgModal } from '../../../components/Modal/Adviser/AdviserOrganizationModal.js';
import { showToast } from '../../../components/ToastMessage.js';
import { CrudMenu } from '../../../components/CrudMenu.js';
import { skeletonTableRows } from '../../../components/SkeletonLoading.js';
import { openConfirmDialog } from '../../../components/Dialog/ConfirmDialog.js';

export function AdviserOrganization() {
    return `
        ${AdviserNavbar()}
        <main class="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <div class="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden mb-6">
                <div class="px-5 py-4 border-b border-gray-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                        <h2 class="text-lg font-semibold text-gray-900">Organization Information</h2>
                        <p class="text-sm text-gray-500 mt-1">Manage your organization details</p>
                    </div>
                    <div class="flex items-center gap-2 self-start sm:self-auto">
                        <button 
                            type="button" 
                            id="switchOrgBtn" 
                            class="px-4 py-2 text-sm font-medium text-white bg-gray-700 hover:bg-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition flex items-center gap-2 shadow-sm">
                            <i data-lucide="refresh-cw" class="w-4 h-4"></i>
                            <span>Switch Organization</span>
                        </button>
                        <button 
                            type="button" 
                            id="editOrgBtn" 
                            class="px-4 py-2 text-sm font-medium text-white bg-blue-900 hover:bg-blue-800 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition flex items-center gap-2 shadow-sm">
                            <i data-lucide="edit-2" class="w-4 h-4"></i>
                            <span>Edit Organization</span>
                        </button>
                    </div>
                </div>
                <div id="orgInfoContent" class="p-5">
                    <div class="animate-pulse space-y-4">
                        <div class="h-4 bg-gray-200 rounded w-1/4"></div>
                        <div class="h-3 bg-gray-200 rounded w-1/2"></div>
                        <div class="h-3 bg-gray-200 rounded w-3/4"></div>
                    </div>
                </div>
            </div>

            <div class="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
                <div class="px-5 py-4 border-b border-gray-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                        <h2 class="text-lg font-semibold text-gray-900">Organization Members</h2>
                        <p class="text-sm text-gray-500 mt-1">Manage students in your organization</p>
                    </div>
                    <div class="flex items-center gap-2.5 self-start sm:self-auto">
                        <input 
                            type="text" 
                            id="memberSearch" 
                            placeholder="Search members..." 
                            class="px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent w-48 sm:w-64">
                        <button 
                            type="button" 
                            id="addMemberBtn" 
                            class="px-4 py-2 text-sm font-medium text-white bg-blue-900 hover:bg-blue-800 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition flex items-center gap-2 shadow-sm">
                            <i data-lucide="plus" class="w-4 h-4"></i>
                            <span>Add Member</span>
                        </button>
                    </div>
                </div>
                <div class="overflow-x-auto">
                    <table class="w-full text-sm text-left">
                        <thead>
                            <tr class="bg-gray-50 border-b border-gray-200 text-xs font-medium text-gray-500 uppercase tracking-wider">
                                <th class="px-5 py-3.5 w-12 text-center">#</th>
                                <th class="px-5 py-3.5">Student</th>
                                <th class="px-5 py-3.5 hidden sm:table-cell">Student Number</th>
                                <th class="px-5 py-3.5">Role</th>
                                <th class="px-5 py-3.5 hidden sm:table-cell">Status</th>
                                <th class="px-5 py-3.5 hidden sm:table-cell">Date Joined</th>
                                <th class="px-5 py-3.5 text-center w-28">Actions</th>
                            </tr>
                        </thead>
                        <tbody id="membersTableBody" class="divide-y divide-gray-100">
                            ${skeletonTableRows(window.innerWidth < 640 ? 3 : 4, window.innerWidth < 640 ? 3 : 7, true)}
                        </tbody>
                    </table>
                </div>
            </div>
        </main>
    `;
}

export async function initAdviserOrganization() {
    protectAdviserRoute();
    await initAdviserNavbar();

    let organization = null;
    let memberships = [];
    let hasLoaded = false;

    async function loadOrganization(showSkeleton = false) {
        if (showSkeleton) {
            const orgInfoContent = document.getElementById('orgInfoContent');
            if (orgInfoContent) {
                orgInfoContent.innerHTML = `
                    <div class="animate-pulse space-y-4">
                        <div class="h-4 bg-gray-200 rounded w-1/4"></div>
                        <div class="h-3 bg-gray-200 rounded w-1/2"></div>
                        <div class="h-3 bg-gray-200 rounded w-3/4"></div>
                    </div>
                `;
            }
            const tbody = document.getElementById('membersTableBody');
            if (tbody) {
                tbody.innerHTML = skeletonTableRows(window.innerWidth < 640 ? 3 : 4, window.innerWidth < 640 ? 3 : 7, true);
            }
        }

        try {
            organization = await AdviserOrganizationAPI.getAdviserOrganization();
            if (organization) {
                renderOrganizationInfo(organization);
                loadMemberships();
            } else {
                const orgInfoContent = document.getElementById('orgInfoContent');
                if (orgInfoContent) {
                    orgInfoContent.innerHTML = `
                        <div class="text-center py-8">
                            <i data-lucide="alert-circle" class="w-12 h-12 text-gray-300 mx-auto mb-2"></i>
                            <p class="text-sm text-gray-500">No organization assigned to you yet.</p>
                        </div>
                    `;
                    if (typeof lucide !== 'undefined') lucide.createIcons();
                }
            }
        } catch (error) {
            console.error('Error loading organization:', error);
            const orgInfoContent = document.getElementById('orgInfoContent');
            if (orgInfoContent) {
                orgInfoContent.innerHTML = `
                    <div class="text-center py-8">
                        <i data-lucide="alert-circle" class="w-12 h-12 text-gray-300 mx-auto mb-2"></i>
                        <p class="text-sm text-gray-500">No organization assigned to you yet.</p>
                    </div>
                `;
                if (typeof lucide !== 'undefined') lucide.createIcons();
            }
            showToast('No organization found', 'error');
        }
    }

    function renderOrganizationInfo(org) {
        const orgInfoContent = document.getElementById('orgInfoContent');
        if (!orgInfoContent) return;

        const createdAt = org.created_at ? new Date(org.created_at).toLocaleDateString('en-PH', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
        }) : 'N/A';

        orgInfoContent.innerHTML = `
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                    <h3 class="text-sm font-semibold text-gray-900 mb-3">${org.name}</h3>
                    <dl class="space-y-2">
                        <div class="flex justify-between">
                            <dt class="text-xs text-gray-500">Organization Code</dt>
                            <dd class="text-sm font-medium text-gray-900">${org.org_code}</dd>
                        </div>
                        <div class="flex justify-between">
                            <dt class="text-xs text-gray-500">Status</dt>
                            <dd>
                                <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${org.status === 'Active' ? 'bg-green-50 text-green-700 border border-green-200' : org.status === 'Inactive' ? 'bg-gray-50 text-gray-700 border border-gray-200' : 'bg-red-50 text-red-700 border border-red-200'}">
                                    ${org.status}
                                </span>
                            </dd>
                        </div>
                        <div class="flex justify-between">
                            <dt class="text-xs text-gray-500">Created At</dt>
                            <dd class="text-sm font-medium text-gray-900">${createdAt}</dd>
                        </div>
                    </dl>
                </div>
                <div>
                    <dt class="text-xs text-gray-500 mb-1">Description</dt>
                    <dd class="text-sm text-gray-900">${org.description || 'No description provided'}</dd>
                </div>
            </div>
        `;

        if (typeof lucide !== 'undefined') lucide.createIcons();
    }

    async function loadMemberships(forceRefresh = false) {
        if (!organization) return;

        try {
            memberships = await AdviserOrganizationAPI.getAdviserOrgMemberships();
            renderMemberships(memberships);
            hasLoaded = true;
        } catch (error) {
            console.error('Error loading memberships:', error);
            const tbody = document.getElementById('membersTableBody');
            if (tbody) {
                tbody.innerHTML = `
                    <tr>
                        <td colspan="7" class="px-5 py-12 text-center text-red-500">Failed to load members</td>
                    </tr>
                `;
            }
            showToast('Failed to load members', 'error');
        }
    }

    function renderMemberships(data) {
        const tbody = document.getElementById('membersTableBody');
        
        if (!tbody) {
            console.error('membersTableBody element not found');
            return;
        }
        
        if (!data || data.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="7" class="px-5 py-12 text-center">
                        <i data-lucide="users" class="w-10 h-10 text-gray-200 mx-auto mb-2"></i>
                        <p class="text-sm text-gray-500 font-medium">No members found.</p>
                        <p class="text-xs text-gray-400 mt-1">Click "Add Member" to add students to your organization.</p>
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
                    <div class="flex items-center gap-3">
                        ${membership.profile_photo ?
                            `<img src="${membership.profile_photo}" alt="${membership.student_name}" class="w-10 h-10 object-cover rounded-full">` :
                            `<div class="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                                <i data-lucide="user" class="w-5 h-5 text-gray-400"></i>
                            </div>`
                        }
                        <p class="text-xs sm:text-sm font-semibold text-gray-900">${membership.student_name || 'Unknown'}</p>
                    </div>
                </td>
                <td class="px-3 sm:px-5 py-2 sm:py-3.5 hidden sm:table-cell text-gray-600 text-sm">${membership.student_number || 'N/A'}</td>
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
                        showView: false,
                        onEdit: 'editMember',
                        onDelete: 'deleteMember',
                        deleteLabel: `${membership.student_name || 'Student'}`
                    })}
                </td>
            </tr>
            `;
        }).join('');

        if (typeof lucide !== 'undefined') {
            lucide.createIcons();
        }
    }

    document.getElementById('editOrgBtn').addEventListener('click', () => {
        if (!organization) {
            showToast('No organization to edit', 'error');
            return;
        }
        openEditOrgModal(organization, loadOrganization);
    });

    document.getElementById('switchOrgBtn').addEventListener('click', async () => {
        try {
            const organizations = await AdviserOrganizationAPI.getAdviserAllOrganizations();
            
            if (!organizations || organizations.length === 0) {
                showToast('No organizations available to switch', 'error');
                return;
            }

            if (organizations.length === 1) {
                showToast('Only one organization available', 'info');
                return;
            }

            const currentOrgId = organization ? organization.id : null;
            
            const orgOptions = organizations.map(org => ({
                id: org.id,
                name: org.name,
                code: org.org_code,
                isCurrent: org.id === currentOrgId
            }));

            openSwitchOrgModal(orgOptions, async (selectedOrgId) => {
                try {
                    await AdviserOrganizationAPI.setCurrentAdviserOrganization(selectedOrgId);
                    showToast('Organization switched successfully', 'success');
                    loadOrganization(true);
                } catch (error) {
                    console.error('Error switching organization:', error);
                    showToast('Failed to switch organization', 'error');
                }
            });
        } catch (error) {
            console.error('Error loading organizations:', error);
            showToast('Failed to load organizations', 'error');
        }
    });

    document.getElementById('addMemberBtn').addEventListener('click', () => {
        if (!organization) {
            showToast('No organization to add members to', 'error');
            return;
        }
        const existingMemberIds = memberships.map(m => m.student_id);
        openAdviserOrgMemModal({
            mode: 'add',
            organizationId: organization.id,
            existingMemberIds: existingMemberIds,
            onSubmit: async (id, formData) => {
                await AdviserOrganizationAPI.createAdviserOrgMembership(formData);
                loadMemberships(true);
            }
        });
    });

    window.editMember = (id) => {
        const membership = memberships.find(m => m.id == id);
        if (!membership) return;

        const existingMemberIds = memberships.map(m => m.student_id);
        openAdviserOrgMemModal({
            mode: 'edit',
            membership: membership,
            membershipId: id,
            organizationId: organization.id,
            existingMemberIds: existingMemberIds,
            onSubmit: async (id, formData) => {
                await AdviserOrganizationAPI.updateAdviserOrgMembership(id, formData);
                loadMemberships(true);
            }
        });
    };

    window.deleteMember = (id, deleteLabel) => {
        openConfirmDialog({
            title: 'Confirm Delete',
            message: `Are you sure you want to remove ${deleteLabel || 'this member'} from the organization?`,
            confirmText: 'Delete',
            cancelText: 'Cancel',
            type: 'danger',
            onConfirm: async () => {
                try {
                    await AdviserOrganizationAPI.deleteAdviserOrgMembership(id);
                    loadMemberships(true);
                    showToast('Member removed successfully', 'success');
                } catch (error) {
                    console.error('Error deleting member:', error);
                    showToast('Failed to remove member', 'error');
                }
            }
        });
    };

    document.getElementById('memberSearch').addEventListener('input', (e) => {
        const searchTerm = e.target.value.toLowerCase();
        const filtered = memberships.filter(membership => 
            (membership.student_name || '').toLowerCase().includes(searchTerm) ||
            (membership.student_number || '').toLowerCase().includes(searchTerm) ||
            (membership.role_name || '').toLowerCase().includes(searchTerm) ||
            (membership.membership_status || '').toLowerCase().includes(searchTerm)
        );
        renderMemberships(filtered);
    });

    window.closeModal = () => {
        const modal = document.getElementById('modal-overlay');
        if (modal) {
            modal.remove();
        }
    };

    const waitForElement = () => {
        if (document.getElementById('orgInfoContent')) {
            loadOrganization();
        } else {
            setTimeout(waitForElement, 50);
        }
    };
    waitForElement();
}

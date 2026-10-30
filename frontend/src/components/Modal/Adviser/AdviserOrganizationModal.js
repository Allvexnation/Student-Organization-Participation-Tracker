import { openModal, closeModal, setModalButtonLoading } from '../../../utils/modal.js';
import { openConfirmDialog } from '../../Dialog/ConfirmDialog.js';
import { animateModalOpen, animateModalClose, clearModalAnimations, animateFormElements, clearFormAnimations, animateViewModalElements } from '../../../provider/Animation/adviser/AdviserOrgAnimation.js';
import * as AdviserOrganizationAPI from '../../../api/adviser/Organization/AdviserOrganization.js';
import * as RolesAPI from '../../../api/admin/roles/ManageRoles.js';
import * as StudentsAPI from '../../../api/admin/Students/ManageStudents.js';
import { showToast } from '../../ToastMessage.js';
import { skeletonOrgMemForm, skeletonOrgMemView } from '../../SkeletonLoading.js';
import { OrganizationValidator } from '../../../validator/OrganizationValidator.js';
import { OrganizationCrudValidator } from '../../../validator/OrganizationCrudValidator.js';
import { OrganizationMembershipCrudValidator } from '../../../validator/OrganizationMembershipCrudValidator.js';

export function openAdviserOrgMemModal({ mode = 'add', membership = null, membershipId = null, organizationId, existingMemberIds = [], onSubmit }) {
    const isEdit = mode === 'edit';
    const title = isEdit ? 'Edit Membership' : 'New Membership';
    const buttonText = isEdit ? 'Save Changes' : 'Add Membership';

    const formContent = `
        <form id="orgMemForm" class="space-y-5">
            ${isEdit ? `<input type="hidden" id="orgMemId" value="${membership?.id || membershipId || ''}">` : ''}
            <input type="hidden" id="organizationId" value="${organizationId}">

            <fieldset>
                <legend class="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Membership Details</legend>
                <div class="space-y-3">
                    <div>
                        <label for="studentId" class="block text-sm font-medium text-gray-700 mb-1">Student <span class="text-red-500">*</span></label>
                        <select id="studentId" name="studentId" required
                            class="w-full px-3 py-2 text-sm border border-gray-200 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white transition">
                            <option value="">Select Student</option>
                        </select>
                    </div>
                    <div>
                        <label for="dateJoined" class="block text-sm font-medium text-gray-700 mb-1">Date Joined <span class="text-red-500">*</span></label>
                        <input type="date" id="dateJoined" name="dateJoined" value="${isEdit && membership ? membership.date_joined : ''}" required
                            class="w-full px-3 py-2 text-sm border border-gray-200 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent transition">
                    </div>
                </div>
            </fieldset>

            <hr class="border-gray-100">

            <fieldset>
                <legend class="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Position & Status</legend>
                <div class="space-y-3">
                    <div>
                        <label for="roleId" class="block text-sm font-medium text-gray-700 mb-1">Position/Role <span class="text-red-500">*</span></label>
                        <select id="roleId" name="roleId" required
                            class="w-full px-3 py-2 text-sm border border-gray-200 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white transition">
                            <option value="">Select Position</option>
                        </select>
                    </div>
                    <div>
                        <label for="membershipStatus" class="block text-sm font-medium text-gray-700 mb-1">Membership Status <span class="text-red-500">*</span></label>
                        <select id="membershipStatus" name="membershipStatus" required
                            class="w-full px-3 py-2 text-sm border border-gray-200 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white transition">
                            <option value="">Select Status</option>
                            <option value="Active" ${isEdit && membership?.membership_status === 'Active' ? 'selected' : ''}>Active</option>
                            <option value="Inactive" ${isEdit && membership?.membership_status === 'Inactive' ? 'selected' : ''}>Inactive</option>
                            <option value="Resigned" ${isEdit && membership?.membership_status === 'Resigned' ? 'selected' : ''}>Resigned</option>
                        </select>
                    </div>
                </div>
            </fieldset>

            <div id="formError" class="hidden text-sm text-red-600 bg-red-50 border border-red-200 rounded-md px-3 py-2"></div>

            <div class="flex justify-end pt-3 border-t border-gray-100 flex-row gap-2">
                <button 
                    type="button" 
                    onclick="closeAdviserOrgMemModal()" 
                    class="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-200 transition">
                    Cancel
                </button>
                <button 
                    type="submit" 
                    id="submitBtn" 
                    class="px-5 py-2 text-sm font-medium text-white bg-blue-900 hover:bg-blue-800 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 transition">
                    ${buttonText}
                </button>
            </div>
        </form>
    `;

    if (isEdit && !membership && membershipId) {
        openModal(title, skeletonOrgMemForm(), 'mid-large');

        const modalOverlay = document.getElementById('modal-overlay');
        const modalContent = document.getElementById('modal-content');
        if (modalOverlay && modalContent) {
            animateModalOpen(modalOverlay, modalContent, 'scale');
        }

        setTimeout(async () => {
            try {
                const fetchedMem = await AdviserOrganizationAPI.getAdviserOrgMembership(membershipId);
                const modalBody = document.getElementById('modal-body');
                if (modalBody) {
                    modalBody.innerHTML = formContent;
                    populateFormWithMem(fetchedMem, existingMemberIds);
                    setupFormHandlers(fetchedMem.id, buttonText, onSubmit, existingMemberIds);
                }
            } catch (error) {
                console.error('Error loading membership:', error);
                showToast('Failed to load membership', 'error');
                closeAdviserOrgMemModal();
            }
        }, 100);
    } else {
        openModal(title, formContent, 'mid-large');

        const modalOverlay = document.getElementById('modal-overlay');
        const modalContent = document.getElementById('modal-content');
        if (modalOverlay && modalContent) {
            animateModalOpen(modalOverlay, modalContent, 'scale');
        }

        setTimeout(() => {
            const form = document.getElementById('orgMemForm');
            if (form) {
                animateFormElements(form);
            }
        }, 100);

        setupFormHandlers(membership?.id, buttonText, onSubmit, existingMemberIds);
    }
}

function populateFormWithMem(membership, existingMemberIds) {
    const form = document.getElementById('orgMemForm');
    if (!form) return;

    document.getElementById('orgMemId').value = membership.id;
    document.getElementById('dateJoined').value = membership.date_joined;
    document.getElementById('membershipStatus').value = membership.membership_status;

    setTimeout(() => {
        const formEl = document.getElementById('orgMemForm');
        if (formEl) {
            animateFormElements(formEl);
        }
    }, 50);

    loadRoles(membership.role_id);
    const excludeIds = existingMemberIds.filter(id => id !== membership.student_id);
    loadStudents(membership.student_id, excludeIds);
}

function setupFormHandlers(memId, buttonText, onSubmit, existingMemberIds) {
    const form = document.getElementById('orgMemForm');
    if (form) {
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            await processOrgMemSubmit(memId, buttonText, onSubmit);
        });
    }

    loadRoles();
    loadStudents(null, existingMemberIds);
}

async function loadRoles(selectedRoleId = null) {
    try {
        const cachedData = localStorage.getItem('cachedRoles');
        let roles;

        if (cachedData) {
            try {
                roles = JSON.parse(cachedData);
            } catch (e) {
                console.error('Error parsing cached roles:', e);
                roles = await RolesAPI.getAllRoles();
                localStorage.setItem('cachedRoles', JSON.stringify(roles));
                localStorage.setItem('cachedRolesTimestamp', Date.now().toString());
            }
        } else {
            roles = await RolesAPI.getAllRoles();
            localStorage.setItem('cachedRoles', JSON.stringify(roles));
            localStorage.setItem('cachedRolesTimestamp', Date.now().toString());
        }

        const roleSelect = document.getElementById('roleId');
        if (roleSelect) {
            roleSelect.innerHTML = '<option value="">Select Position</option>';
            roles.forEach(role => {
                const option = document.createElement('option');
                option.value = role.id;
                option.textContent = role.role_name;
                if (selectedRoleId && selectedRoleId == role.id) {
                    option.selected = true;
                }
                roleSelect.appendChild(option);
            });
        }
    } catch (error) {
        console.error('Error loading roles:', error);
        showToast('Failed to load roles', 'error');
    }
}

async function loadStudents(selectedStudentId = null, excludeIds = []) {
    try {
        const cachedData = localStorage.getItem('cachedStudents');
        let students;

        if (cachedData) {
            try {
                students = JSON.parse(cachedData);
            } catch (e) {
                console.error('Error parsing cached students:', e);
                students = await StudentsAPI.getAllStudents();
                localStorage.setItem('cachedStudents', JSON.stringify(students));
                localStorage.setItem('cachedStudentsTimestamp', Date.now().toString());
            }
        } else {
            students = await StudentsAPI.getAllStudents();
            localStorage.setItem('cachedStudents', JSON.stringify(students));
            localStorage.setItem('cachedStudentsTimestamp', Date.now().toString());
        }

        // Get existing memberships to check which students already have organizations
        const allMemberships = await AdviserOrganizationAPI.getAdviserOrgMemberships();
        const studentWithOrgIds = allMemberships.map(m => m.student_id);

        const studentSelect = document.getElementById('studentId');
        if (studentSelect) {
            studentSelect.innerHTML = '<option value="">Select Student</option>';
            students.forEach(student => {
                if (excludeIds.map(String).includes(String(student.id))) {
                    return;
                }
                const hasOrg = studentWithOrgIds.includes(student.id);
                const displayName = hasOrg ? 
                    `${student.first_name} ${student.last_name} (Has Org)` : 
                    `${student.first_name} ${student.last_name}`;
                const option = document.createElement('option');
                option.value = student.id;
                option.textContent = displayName;
                if (selectedStudentId && selectedStudentId == student.id) {
                    option.selected = true;
                }
                if (hasOrg) {
                    option.disabled = true;
                }
                studentSelect.appendChild(option);
            });
        }
    } catch (error) {
        console.error('Error loading students:', error);
        showToast('Failed to load students', 'error');
    }
}

function showFormError(message) {
    const el = document.getElementById('formError');
    if (el) {
        el.textContent = message;
        el.classList.remove('hidden');
    }
}

function hideFormError() {
    const el = document.getElementById('formError');
    if (el) el.classList.add('hidden');
}

async function processOrgMemSubmit(id, buttonText, onSubmit) {
    hideFormError();

    const formData = {
        student_id: document.getElementById('studentId').value,
        organization_id: document.getElementById('organizationId').value,
        date_joined: document.getElementById('dateJoined').value,
        role_id: document.getElementById('roleId').value,
        membership_status: document.getElementById('membershipStatus').value
    };

    // Validate organization membership data
    try {
        const allMemberships = await AdviserOrganizationAPI.getAdviserOrgMemberships();
        const validation = OrganizationMembershipCrudValidator.validate(formData, allMemberships, id);
        if (!validation.isValid) {
            showFormError(validation.message);
            showToast(validation.message, 'error');
            return;
        }
    } catch (error) {
        console.error('Error validating membership:', error);
    }

    const isEdit = id != null;

    if (isEdit) {
        openConfirmDialog({
            title: 'Confirm Update',
            message: 'Are you sure you want to update this membership?',
            confirmText: 'Update',
            cancelText: 'Cancel',
            type: 'blue',
            onConfirm: async () => {
                setModalButtonLoading('submitBtn', true, buttonText);
                try {
                    await onSubmit(id, formData);
                    closeAdviserOrgMemModal();
                    showToast('Membership updated successfully', 'success');
                } catch (error) {
                    console.error('Error saving membership:', error);
                    showFormError('Failed to save membership. Please try again.');
                    setModalButtonLoading('submitBtn', false, buttonText);
                    showToast('Failed to update membership', 'error');
                }
            }
        });
    } else {
        setModalButtonLoading('submitBtn', true, buttonText);
        try {
            await onSubmit(id, formData);
            closeAdviserOrgMemModal();
            showToast('Membership added successfully', 'success');
        } catch (error) {
            console.error('Error saving membership:', error);
            showFormError('Failed to save membership. Please try again.');
            setModalButtonLoading('submitBtn', false, buttonText);
            showToast('Failed to add membership', 'error');
        }
    }
}

async function closeAdviserOrgMemModal() {
    const modalOverlay = document.getElementById('modal-overlay');
    const modalContent = document.getElementById('modal-content');
    
    if (modalOverlay && modalContent) {
        await animateModalClose(modalOverlay, modalContent, 'scale');
        clearModalAnimations(modalOverlay, modalContent);
        modalOverlay.remove();
        document.removeEventListener('keydown', (e) => {
            if (e.key === 'Escape') closeAdviserOrgMemModal();
        });
    } else {
        closeModal();
    }
}

window.closeAdviserOrgMemModal = closeAdviserOrgMemModal;

export function openEditOrgModal(organization, onSuccess) {
    const formContent = `
        <form id="editOrgForm" class="space-y-5">
            <div>
                <label for="orgCode" class="block text-sm font-medium text-gray-700 mb-1">Organization Code <span class="text-red-500">*</span></label>
                <input type="text" id="orgCode" name="orgCode" value="${organization.org_code}" required
                    class="w-full px-3 py-2 text-sm border border-gray-200 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent transition uppercase">
            </div>
            <div>
                <label for="orgName" class="block text-sm font-medium text-gray-700 mb-1">Organization Name <span class="text-red-500">*</span></label>
                <input type="text" id="orgName" name="orgName" value="${organization.name}" required
                    class="w-full px-3 py-2 text-sm border border-gray-200 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent transition">
            </div>
            <div>
                <label for="orgDescription" class="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea id="orgDescription" name="orgDescription" rows="3"
                    class="w-full px-3 py-2 text-sm border border-gray-200 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent transition resize-none">${organization.description || ''}</textarea>
            </div>
            <div>
                <label for="orgStatus" class="block text-sm font-medium text-gray-700 mb-1">Status <span class="text-red-500">*</span></label>
                <select id="orgStatus" name="orgStatus" required
                    class="w-full px-3 py-2 text-sm border border-gray-200 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white transition">
                    <option value="Active" ${organization.status === 'Active' ? 'selected' : ''}>Active</option>
                    <option value="Inactive" ${organization.status === 'Inactive' ? 'selected' : ''}>Inactive</option>
                    <option value="Suspended" ${organization.status === 'Suspended' ? 'selected' : ''}>Suspended</option>
                </select>
            </div>
            <div id="formError" class="hidden text-sm text-red-600 bg-red-50 border border-red-200 rounded-md px-3 py-2"></div>
            <div class="flex justify-end pt-3 border-t border-gray-100 flex-row gap-2">
                <button 
                    type="button" 
                    onclick="closeEditOrgModal()" 
                    class="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-200 transition">
                    Cancel
                </button>
                <button 
                    type="submit" 
                    id="submitBtn" 
                    class="px-5 py-2 text-sm font-medium text-white bg-blue-900 hover:bg-blue-800 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 transition">
                    Save Changes
                </button>
            </div>
        </form>
    `;

    openModal('Edit Organization', formContent, 'mid-large');

    const modalOverlay = document.getElementById('modal-overlay');
    const modalContent = document.getElementById('modal-content');
    if (modalOverlay && modalContent) {
        animateModalOpen(modalOverlay, modalContent, 'scale');
    }

    setTimeout(() => {
        const form = document.getElementById('editOrgForm');
        if (form) {
            animateFormElements(form);
        }
    }, 100);

    const form = document.getElementById('editOrgForm');
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const formData = {
            org_code: document.getElementById('orgCode').value.toUpperCase().trim(),
            name: document.getElementById('orgName').value.trim(),
            description: document.getElementById('orgDescription').value.trim(),
            status: document.getElementById('orgStatus').value
        };

        // Validate organization code uniqueness
        try {
            const allOrganizations = await AdviserOrganizationAPI.getAdviserAllOrganizations();
            const validation = OrganizationCrudValidator.validateCodeUniqueness(formData.org_code, allOrganizations, organization.id);
            if (!validation.isValid) {
                showToast(validation.message, 'error');
                return;
            }
        } catch (error) {
            console.error('Error checking organization code:', error);
        }

        try {
            await AdviserOrganizationAPI.updateAdviserOrganization(formData);
            closeEditOrgModal();
            showToast('Organization updated successfully', 'success');
            if (onSuccess && typeof onSuccess === 'function') {
                onSuccess();
            }
        } catch (error) {
            console.error('Error updating organization:', error);
            showToast('Failed to update organization', 'error');
        }
    });
}

async function closeEditOrgModal() {
    const modalOverlay = document.getElementById('modal-overlay');
    const modalContent = document.getElementById('modal-content');
    
    if (modalOverlay && modalContent) {
        await animateModalClose(modalOverlay, modalContent, 'scale');
        clearModalAnimations(modalOverlay, modalContent);
        modalOverlay.remove();
        document.removeEventListener('keydown', (e) => {
            if (e.key === 'Escape') closeEditOrgModal();
        });
    } else {
        closeModal();
    }
}

window.closeEditOrgModal = closeEditOrgModal;

export function openSwitchOrgModal(organizations, onSwitch) {
    const orgListContent = organizations.map(org => {
        const isActive = OrganizationValidator.isActive(org);
        const displayName = OrganizationValidator.getDisplayName(org);
        const statusBadge = !isActive ? 
            `<span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${org.status === 'Suspended' ? 'bg-red-50 text-red-700 border border-red-200' : 'bg-gray-50 text-gray-700 border border-gray-200'}">${org.status}</span>` : '';
        
        return `
        <div class="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition cursor-pointer ${org.isCurrent ? 'bg-blue-50 border-blue-200' : ''} ${!isActive ? 'opacity-60 cursor-not-allowed' : ''}"
             onclick="selectOrganization(${org.id})" ${!isActive ? 'onclick=""' : ''}>
            <div class="flex items-center gap-3">
                <div class="w-10 h-10 rounded-full bg-blue-900 text-white flex items-center justify-center text-sm font-bold">
                    ${org.name.charAt(0).toUpperCase()}
                </div>
                <div>
                    <h4 class="text-sm font-semibold text-gray-900">${displayName}</h4>
                    <p class="text-xs text-gray-500">${org.code}</p>
                </div>
            </div>
            <div class="flex items-center gap-2">
                ${statusBadge}
                ${org.isCurrent ? '<span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">Current</span>' : ''}
            </div>
        </div>
        `;
    }).join('');

    const modalContent = `
        <div class="space-y-4">
            <p class="text-sm text-gray-600">Select an organization to switch to:</p>
            <div class="space-y-3 max-h-96 overflow-y-auto">
                ${orgListContent}
            </div>
            <div class="flex justify-end pt-3 border-t border-gray-100">
                <button 
                    type="button" 
                    onclick="closeSwitchOrgModal()" 
                    class="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-200 transition">
                    Cancel
                </button>
            </div>
        </div>
    `;

    openModal('Switch Organization', modalContent, 'mid');

    const modalOverlay = document.getElementById('modal-overlay');
    const modalContentEl = document.getElementById('modal-content');
    if (modalOverlay && modalContentEl) {
        animateModalOpen(modalOverlay, modalContentEl, 'scale');
    }

    window.selectOrganization = (orgId) => {
        const org = organizations.find(o => o.id === orgId);
        if (!org) {
            showToast('Organization not found', 'error');
            return;
        }

        if (org.isCurrent) {
            showToast('This is already the current organization', 'info');
            return;
        }

        // Check if organization is active
        if (!OrganizationValidator.isActive(org.status)) {
            showToast('Cannot switch to an inactive or suspended organization', 'error');
            return;
        }

        openConfirmDialog({
            title: 'Switch Organization',
            message: `Are you sure you want to switch to ${org.name}?`,
            confirmText: 'Switch',
            cancelText: 'Cancel',
            type: 'blue',
            onConfirm: async () => {
                try {
                    await onSwitch(orgId);
                    closeSwitchOrgModal();
                } catch (error) {
                    console.error('Error switching organization:', error);
                    showToast('Failed to switch organization', 'error');
                }
            }
        });
    };

    window.closeSwitchOrgModal = async () => {
        const modalOverlay = document.getElementById('modal-overlay');
        const modalContentEl = document.getElementById('modal-content');
        
        if (modalOverlay && modalContentEl) {
            await animateModalClose(modalOverlay, modalContentEl, 'scale');
            clearModalAnimations(modalOverlay, modalContentEl);
            modalOverlay.remove();
            delete window.selectOrganization;
            delete window.closeSwitchOrgModal;
        } else {
            closeModal();
        }
    };
}

export async function openViewAdviserOrgMemModal(id) {
    openModal('Membership Details', skeletonOrgMemView(), 'mid-large');

    const modalOverlay = document.getElementById('modal-overlay');
    const modalContent = document.getElementById('modal-content');
    if (modalOverlay && modalContent) {
        animateModalOpen(modalOverlay, modalContent, 'scale');
    }

    try {
        const membership = await AdviserOrganizationAPI.getAdviserOrgMembership(id);
        const dateJoined = membership.date_joined ? new Date(membership.date_joined).toLocaleDateString('en-PH', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
        }) : 'N/A';

        const content = `
            <div class="space-y-5">
                <div class="flex flex-col sm:flex-row sm:items-center gap-4 bg-gray-50 rounded-lg p-4 border border-gray-100">
                    <div class="flex-shrink-0 w-24 h-24 sm:w-32 sm:h-32 rounded-lg bg-blue-900 text-blue-100 flex items-center justify-center text-sm font-bold shadow-sm mx-auto sm:mx-0">
                        <i data-lucide="users" class="w-12 h-12"></i>
                    </div>
                    <div class="text-center sm:text-left">
                        <h3 class="text-lg font-semibold text-gray-900">${membership.student_name || 'Unknown Student'}</h3>
                        <p class="text-sm text-gray-500 mt-0.5">Student Number: ${membership.student_number || 'N/A'}</p>
                        <span class="inline-flex items-center px-2.5 py-0.5 mt-0.5 rounded-full text-xs font-medium ${membership.membership_status === 'Active' ? 'bg-green-50 text-green-900' : membership.membership_status === 'Inactive' ? 'bg-gray-50 text-gray-900' : 'bg-red-50 text-red-900'} border border-gray-200">
                            ${membership.membership_status}
                        </span>
                    </div>
                </div>

                <div class="border-b border-gray-200 pb-4">
                    <h4 class="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Membership Details</h4>
                    <dl class="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3">
                        <div>
                            <dt class="text-xs text-gray-400 font-medium">Student Name</dt>
                            <dd class="text-sm font-semibold text-gray-900 mt-0.5">${membership.student_name || 'Unknown'}</dd>
                        </div>
                        <div>
                            <dt class="text-xs text-gray-400 font-medium">Student Number</dt>
                            <dd class="text-sm font-semibold text-gray-900 mt-0.5">${membership.student_number || 'N/A'}</dd>
                        </div>
                        <div>
                            <dt class="text-xs text-gray-400 font-medium">Date Joined</dt>
                            <dd class="text-sm font-semibold text-gray-900 mt-0.5">${dateJoined}</dd>
                        </div>
                        <div>
                            <dt class="text-xs text-gray-400 font-medium">Position</dt>
                            <dd class="text-sm font-semibold text-gray-900 mt-0.5">${membership.role_name || 'N/A'}</dd>
                        </div>
                    </dl>
                </div>

                <div class="border-b border-gray-200 pb-4">
                    <h4 class="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Status Information</h4>
                    <dl class="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3">
                        <div>
                            <dt class="text-xs text-gray-400 font-medium">Membership Status</dt>
                            <dd class="text-sm font-semibold text-gray-900 mt-0.5">${membership.membership_status}</dd>
                        </div>
                    </dl>
                </div>

                <div class="flex justify-end pt-3 border-t border-gray-100 flex-col sm:flex-row gap-2">
                    <button 
                        type="button" 
                        onclick="closeModal()" 
                        class="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-200 transition">
                        Close
                    </button>
                </div>
            </div>
        `;

        const modalBody = document.getElementById('modal-body');
        if (modalBody) {
            modalBody.innerHTML = content;
        }

        setTimeout(() => {
            const modalContentEl = document.getElementById('modal-content');
            if (modalContentEl) {
                animateViewModalElements(modalContentEl);
            }
            if (typeof lucide !== 'undefined') {
                lucide.createIcons();
            }
        }, 50);
    } catch (error) {
        console.error('Error loading membership:', error);
        showToast('Failed to load membership', 'error');
        closeModal();
    }
}

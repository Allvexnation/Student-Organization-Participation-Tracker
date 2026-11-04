import { openModal, closeModal, setModalButtonLoading } from '../../utils/modal.js';
import { openConfirmDialog } from '../Dialog/ConfirmDialog.js';
import { animateModalClose, clearModalAnimations } from '../../provider/ModalAnimation.js';
import * as OrgMembershipsAPI from '../../api/admin/OrgMemberships/ManageOrgMemberships.js';
import * as StudentsAPI from '../../api/admin/Students/ManageStudents.js';
import * as OrganizationsAPI from '../../api/admin/Organizations/ManageOrganizations.js';
import * as RolesAPI from '../../api/admin/roles/ManageRoles.js';
import { showToast } from '../ToastMessage.js';
import { skeletonOrgMemForm, skeletonOrgMemView } from '../SkeletonLoading.js';
import { OrganizationValidator } from '../../validator/OrganizationValidator.js';
import { OrganizationMembershipCrudValidator } from '../../validator/OrganizationMembershipCrudValidator.js';
import { CacheService } from '../../../cache/CacheService.js';
import { FIELD_CLASS, LABEL_CLASS, modalSection, modalActions, modalViewClose, modalDetailTile, modalBadge, modalHero, applyModalDomino } from './modalUi.js';

export function openManageOrgMemModal({ mode = 'add', membership = null, membershipId = null, onSubmit }) {
    const isEdit = mode === 'edit';
    const title = isEdit ? 'Edit Membership' : 'New Membership';
    const buttonText = isEdit ? 'Save Changes' : 'Add Membership';

    const formContent = `
        <form id="orgMemForm" class="manage-modal-form space-y-4">
            ${isEdit ? `<input type="hidden" id="orgMemId" value="${membership?.id || membershipId || ''}">` : ''}
            ${modalSection('Membership Details', `
                <div class="space-y-3">
                    <div>
                        <label for="studentId" class="${LABEL_CLASS}">Student <span class="text-red-500">*</span></label>
                        <select id="studentId" name="studentId" required class="${FIELD_CLASS}">
                            <option value="">Select Student</option>
                        </select>
                    </div>
                    <div>
                        <label for="organizationId" class="${LABEL_CLASS}">Organization <span class="text-red-500">*</span></label>
                        <select id="organizationId" name="organizationId" required class="${FIELD_CLASS}">
                            <option value="">Select Organization</option>
                        </select>
                    </div>
                    <div>
                        <label for="dateJoined" class="${LABEL_CLASS}">Date Joined <span class="text-red-500">*</span></label>
                        <input type="date" id="dateJoined" name="dateJoined" value="${isEdit && membership ? membership.date_joined : ''}" required class="${FIELD_CLASS}">
                    </div>
                </div>
            `)}
            ${modalSection('Position & Status', `
                <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                        <label for="roleId" class="${LABEL_CLASS}">Position/Role <span class="text-red-500">*</span></label>
                        <select id="roleId" name="roleId" required class="${FIELD_CLASS}">
                            <option value="">Select Position</option>
                        </select>
                    </div>
                    <div>
                        <label for="membershipStatus" class="${LABEL_CLASS}">Membership Status <span class="text-red-500">*</span></label>
                        <select id="membershipStatus" name="membershipStatus" required class="${FIELD_CLASS}">
                            <option value="">Select Status</option>
                            <option value="Active" ${isEdit && membership?.membership_status === 'Active' ? 'selected' : ''}>Active</option>
                            <option value="Inactive" ${isEdit && membership?.membership_status === 'Inactive' ? 'selected' : ''}>Inactive</option>
                            <option value="Resigned" ${isEdit && membership?.membership_status === 'Resigned' ? 'selected' : ''}>Resigned</option>
                        </select>
                    </div>
                </div>
            `)}
            <div id="formError" class="hidden text-sm text-red-700 bg-red-50 border border-red-200 rounded-xl px-3 py-2.5"></div>
            ${modalActions({ cancelOnclick: 'closeManageOrgMemModal()', submitText: buttonText })}
        </form>
    `;

    if (isEdit && !membership && membershipId) {
        openModal(title, skeletonOrgMemForm(), 'mid-large');

        setTimeout(async () => {
            try {
                const fetchedMem = await OrgMembershipsAPI.getOrgMembership(membershipId);
                const modalBody = document.getElementById('modal-body');
                if (modalBody) {
                    modalBody.innerHTML = formContent;
                    populateFormWithMem(fetchedMem);
                    setupFormHandlers(fetchedMem.id, buttonText, onSubmit);
                    applyModalDomino();
                }
            } catch (error) {
                console.error('Error loading membership:', error);
                showToast('Failed to load membership', 'error');
                closeManageOrgMemModal();
            }
        }, 100);
    } else {
        openModal(title, formContent, 'mid-large');
        applyModalDomino();
        setupFormHandlers(membership?.id, buttonText, onSubmit);
    }
}

function populateFormWithMem(membership) {
    const form = document.getElementById('orgMemForm');
    if (!form) return;

    document.getElementById('orgMemId').value = membership.id;
    document.getElementById('dateJoined').value = membership.date_joined;
    document.getElementById('membershipStatus').value = membership.membership_status;

    applyModalDomino();
    Promise.all([loadStudents(membership.student_id), loadOrganizations(membership.organization_id), loadRoles(membership.role_id)]);
}

function setupFormHandlers(memId, buttonText, onSubmit) {
    const form = document.getElementById('orgMemForm');
    if (form) {
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            await processOrgMemSubmit(memId, buttonText, onSubmit);
        });
    }

    if (!memId) {
        Promise.all([loadStudents(), loadOrganizations(), loadRoles()]);
    }
}

async function loadStudents(selectedStudentId = null) {
    try {
        let students = await CacheService.get('cachedStudents');
        if (!students || !Array.isArray(students) || students.length === 0) {
            students = await StudentsAPI.getAllStudents();
            if (students) {
                await CacheService.set('cachedStudents', students);
            }
        }

        const allMemberships = await OrgMembershipsAPI.getAllOrgMemberships();
        const studentWithOrgIds = allMemberships.map(m => m.student_id);
        
        const studentSelect = document.getElementById('studentId');
        if (studentSelect) {
            studentSelect.innerHTML = '<option value="">Select Student</option>';
            students.forEach(student => {
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

async function loadOrganizations(selectedOrgId = null) {
    try {
        let organizations = await CacheService.get('cachedOrganizations');
        if (!organizations || !Array.isArray(organizations) || organizations.length === 0) {
            organizations = await OrganizationsAPI.getAllOrganizations();
            if (organizations) {
                await CacheService.set('cachedOrganizations', organizations);
            }
        }
        
        const orgSelect = document.getElementById('organizationId');
        if (orgSelect) {
            orgSelect.innerHTML = '<option value="">Select Organization</option>';
            organizations.forEach(org => {
                const isSuspended = OrganizationValidator.isSuspended(org);
                const displayName = OrganizationValidator.getDisplayName(org);
                const option = document.createElement('option');
                option.value = org.id;
                option.textContent = displayName;
                if (selectedOrgId && selectedOrgId == org.id) {
                    option.selected = true;
                }
                if (isSuspended) {
                    option.disabled = true;
                }
                orgSelect.appendChild(option);
            });
        }
    } catch (error) {
        console.error('Error loading organizations:', error);
        showToast('Failed to load organizations', 'error');
    }
}

async function loadRoles(selectedRoleId = null) {
    try {
        let roles = await CacheService.get('cachedRoles');
        if (!roles || !Array.isArray(roles) || roles.length === 0) {
            roles = await RolesAPI.getAllRoles();
            if (roles) {
                await CacheService.set('cachedRoles', roles);
            }
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

    const studentSelect = document.getElementById('studentId');
    const organizationSelect = document.getElementById('organizationId');
    const roleSelect = document.getElementById('roleId');

    const formData = {
        student_id: studentSelect.value,
        student_name: studentSelect.options[studentSelect.selectedIndex]?.text || '',
        organization_id: organizationSelect.value,
        organization_name: organizationSelect.options[organizationSelect.selectedIndex]?.text || '',
        date_joined: document.getElementById('dateJoined').value,
        role_id: roleSelect.value,
        role_name: roleSelect.options[roleSelect.selectedIndex]?.text || '',
        membership_status: document.getElementById('membershipStatus').value
    };

    try {
        const allMemberships = await OrgMembershipsAPI.getAllOrgMemberships();
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
                    closeManageOrgMemModal();
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
            closeManageOrgMemModal();
            showToast('Membership added successfully', 'success');
        } catch (error) {
            console.error('Error saving membership:', error);
            showFormError('Failed to save membership. Please try again.');
            setModalButtonLoading('submitBtn', false, buttonText);
            showToast('Failed to add membership', 'error');
        }
    }
}

async function closeManageOrgMemModal() {
    const modalOverlay = document.getElementById('modal-overlay');
    const modalContent = document.getElementById('modal-content');
    
    if (modalOverlay && modalContent) {
        await animateModalClose(modalOverlay, modalContent, 'scale');
        clearModalAnimations(modalOverlay, modalContent);
        modalOverlay.remove();
        document.body.classList.remove('overflow-hidden');
        document.removeEventListener('keydown', (e) => {
            if (e.key === 'Escape') closeManageOrgMemModal();
        });
    } else {
        closeModal();
    }
}

window.closeManageOrgMemModal = closeManageOrgMemModal;

export async function openViewOrgMemModal(id) {
    openModal('Membership Details', skeletonOrgMemView(), 'mid-large');

    try {
        const membership = await OrgMembershipsAPI.getOrgMembership(id);
        const dateJoined = membership.date_joined ? new Date(membership.date_joined).toLocaleDateString('en-PH', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
        }) : 'N/A';

        const statusTone = membership.membership_status === 'Active'
            ? 'green'
            : membership.membership_status === 'Inactive'
                ? 'gray'
                : 'red';

        const content = `
            <div class="space-y-4">
                ${modalHero({
                    fallback: `<i data-lucide="users" class="w-10 h-10"></i>`,
                    name: membership.student_name || 'Unknown Student',
                    subtitle: membership.organization_name || 'Unknown Organization',
                    badges: [modalBadge(membership.membership_status, statusTone)]
                })}
                ${modalSection('Membership Details', `
                    <dl class="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                        ${modalDetailTile('Student', membership.student_name || 'Unknown')}
                        ${modalDetailTile('Organization', membership.organization_name || 'Unknown')}
                        ${modalDetailTile('Date Joined', dateJoined)}
                        ${modalDetailTile('Position', membership.role_name || 'N/A')}
                    </dl>
                `)}
                ${modalSection('Status Information', `
                    <dl class="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                        ${modalDetailTile('Membership Status', modalBadge(membership.membership_status, statusTone))}
                    </dl>
                `)}
                ${modalViewClose()}
            </div>
        `;

        const modalBody = document.getElementById('modal-body');
        if (modalBody) {
            modalBody.innerHTML = content;
        }
        applyModalDomino();
    } catch (error) {
        console.error('Error loading membership:', error);
        showToast('Failed to load membership', 'error');
        closeModal();
    }
}

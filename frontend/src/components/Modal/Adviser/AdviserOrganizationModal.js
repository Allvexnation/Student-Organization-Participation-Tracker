import { openModal, closeModal, setModalButtonLoading } from '../../../utils/modal.js';
import { openConfirmDialog } from '../../Dialog/ConfirmDialog.js';
import { animateModalClose, clearModalAnimations } from '../../../provider/ModalAnimation.js';
import * as AdviserOrganizationAPI from '../../../api/adviser/Organization/AdviserOrganization.js';
import * as RolesAPI from '../../../api/admin/roles/ManageRoles.js';
import * as StudentsAPI from '../../../api/admin/Students/ManageStudents.js';
import { showToast } from '../../ToastMessage.js';
import { skeletonOrgMemForm, skeletonOrgMemView } from '../../SkeletonLoading.js';
import { OrganizationValidator } from '../../../validator/OrganizationValidator.js';
import { OrganizationCrudValidator } from '../../../validator/OrganizationCrudValidator.js';
import { OrganizationMembershipCrudValidator } from '../../../validator/OrganizationMembershipCrudValidator.js';
import { CacheService } from '../../../../cache/CacheService.js';
import { FIELD_CLASS, LABEL_CLASS, modalSection, modalActions, modalViewClose, modalDetailTile, modalBadge, modalHero, applyModalDomino } from '../modalUi.js';

export function openAdviserOrgMemModal({ mode = 'add', membership = null, membershipId = null, organizationId, existingMemberIds = [], onSubmit }) {
    const isEdit = mode === 'edit';
    const title = isEdit ? 'Edit Membership' : 'New Membership';
    const buttonText = isEdit ? 'Save Changes' : 'Add Membership';

    const formContent = `
        <form id="orgMemForm" class="manage-modal-form space-y-4">
            ${isEdit ? `<input type="hidden" id="orgMemId" value="${membership?.id || membershipId || ''}">` : ''}
            ${modalSection('Membership Details', `
                <div class="space-y-3">
                    <div>
                        <label for="organizationId" class="${LABEL_CLASS}">Organization <span class="text-red-500">*</span></label>
                        <select id="organizationId" name="organizationId" required class="${FIELD_CLASS}">
                            <option value="">Select Organization</option>
                        </select>
                    </div>
                    <div>
                        <label for="studentId" class="${LABEL_CLASS}">Student <span class="text-red-500">*</span></label>
                        <select id="studentId" name="studentId" required class="${FIELD_CLASS}">
                            <option value="">Select Student</option>
                        </select>
                    </div>
                    <div>
                        <label for="dateJoined" class="${LABEL_CLASS}">Date Joined <span class="text-red-500">*</span></label>
                        <input type="date" id="dateJoined" name="dateJoined" value="${isEdit && membership ? String(membership.date_joined || '').split('T')[0].split(' ')[0] : ''}" required class="${FIELD_CLASS}">
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
            ${modalActions({ cancelOnclick: 'closeAdviserOrgMemModal()', submitText: buttonText })}
        </form>
    `;

    if (isEdit && !membership && membershipId) {
        openModal(title, skeletonOrgMemForm(), 'mid-large');

        setTimeout(async () => {
            try {
                const fetchedMem = await AdviserOrganizationAPI.getAdviserOrgMembership(membershipId);
                const modalBody = document.getElementById('modal-body');
                if (modalBody) {
                    modalBody.innerHTML = formContent;
                    populateFormWithMem(fetchedMem);
                    setupFormHandlers({
                        memId: fetchedMem.id,
                        buttonText,
                        onSubmit,
                        selectedStudentId: fetchedMem.student_id,
                        selectedRoleId: fetchedMem.role_id,
                        selectedOrgId: fetchedMem.organization_id || organizationId,
                        loadDropdowns: false
                    });
                    applyModalDomino();
                }
            } catch (error) {
                console.error('Error loading membership:', error);
                showToast('Failed to load membership', 'error');
                closeAdviserOrgMemModal();
            }
        }, 100);
    } else {
        openModal(title, formContent, 'mid-large');
        applyModalDomino();
        setupFormHandlers({
            memId: membership?.id,
            buttonText,
            onSubmit,
            selectedStudentId: membership?.student_id || null,
            selectedRoleId: membership?.role_id || null,
            selectedOrgId: membership?.organization_id || organizationId
        });
    }
}

function populateFormWithMem(membership) {
    const form = document.getElementById('orgMemForm');
    if (!form) return;

    document.getElementById('orgMemId').value = membership.id;
    document.getElementById('dateJoined').value = String(membership.date_joined || '').split('T')[0].split(' ')[0];
    document.getElementById('membershipStatus').value = membership.membership_status;

    applyModalDomino();

    loadRoles(membership.role_id);
    loadOrganizations(membership.organization_id).then(() => {
        loadStudents(membership.student_id);
    });
}

function setupFormHandlers({ memId, buttonText, onSubmit, selectedStudentId = null, selectedRoleId = null, selectedOrgId = null, loadDropdowns = true }) {
    const form = document.getElementById('orgMemForm');
    if (form) {
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            await processOrgMemSubmit(memId, buttonText, onSubmit);
        });
    }

    const orgSelect = document.getElementById('organizationId');
    if (orgSelect) {
        orgSelect.addEventListener('change', () => {
            loadStudents(selectedStudentId);
        });
    }

    if (loadDropdowns) {
        loadRoles(selectedRoleId);
        loadOrganizations(selectedOrgId).then(() => {
            loadStudents(selectedStudentId);
        });
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

async function loadOrganizations(selectedOrgId = null) {
    try {
        const organizations = await AdviserOrganizationAPI.getAdviserAllOrganizations();
        const orgSelect = document.getElementById('organizationId');
        if (!orgSelect) return;

        orgSelect.innerHTML = '<option value="">Select Organization</option>';
        (organizations || []).forEach(org => {
            const option = document.createElement('option');
            option.value = org.id;
            option.textContent = org.org_code ? `${org.name} (${org.org_code})` : (org.name || `Organization ${org.id}`);
            if (selectedOrgId && String(selectedOrgId) === String(org.id)) {
                option.selected = true;
            }
            if (String(org.status || '').toLowerCase() === 'suspended') {
                option.disabled = true;
            }
            orgSelect.appendChild(option);
        });

        if (selectedOrgId && !orgSelect.value) {
            orgSelect.value = String(selectedOrgId);
        }
    } catch (error) {
        console.error('Error loading organizations:', error);
        showToast('Failed to load organizations', 'error');
    }
}

async function loadStudents(selectedStudentId = null) {
    const studentSelect = document.getElementById('studentId');
    const orgSelect = document.getElementById('organizationId');
    const selectedOrgId = orgSelect?.value || '';

    if (studentSelect) {
        studentSelect.innerHTML = '<option value="">Loading students...</option>';
        studentSelect.disabled = true;
    }

    try {
        let students = await CacheService.get('cachedStudents');
        if (!students || !Array.isArray(students) || students.length === 0) {
            students = await StudentsAPI.getAllStudents();
            if (students) {
                await CacheService.set('cachedStudents', students);
            }
        }

        const organizations = await AdviserOrganizationAPI.getAdviserAllOrganizations();
        const membershipGroups = await Promise.all(
            (organizations || []).map(org =>
                AdviserOrganizationAPI.getAdviserOrgMembershipsByOrg(org.id).catch(() => [])
            )
        );
        const allMemberships = membershipGroups.flat();
        const studentWithOrgIds = new Set(allMemberships.map(m => String(m.student_id)));
        const selectedOrgMemberIds = new Set(
            allMemberships
                .filter(m => selectedOrgId && String(m.organization_id) === String(selectedOrgId))
                .map(m => String(m.student_id))
        );

        if (!studentSelect) return;

        studentSelect.innerHTML = '<option value="">Select Student</option>';
        (students || []).forEach(student => {
            const studentId = String(student.id);
            const isCurrent = selectedStudentId && studentId === String(selectedStudentId);
            if (selectedOrgMemberIds.has(studentId) && !isCurrent) {
                return;
            }

            const hasOrg = studentWithOrgIds.has(studentId) && !isCurrent;
            const option = document.createElement('option');
            option.value = student.id;
            option.textContent = hasOrg
                ? `${student.first_name} ${student.last_name} (Has Org)`
                : `${student.first_name} ${student.last_name}`;
            if (isCurrent) option.selected = true;
            if (hasOrg) option.disabled = true;
            studentSelect.appendChild(option);
        });
        studentSelect.disabled = false;
    } catch (error) {
        console.error('Error loading students:', error);
        if (studentSelect) {
            studentSelect.innerHTML = '<option value="">Select Student</option>';
            studentSelect.disabled = false;
        }
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

    const studentSelect = document.getElementById('studentId');
    const selectedStudentText = studentSelect && studentSelect.selectedIndex >= 0 ? 
        studentSelect.options[studentSelect.selectedIndex]?.text?.replace(/\s*\(Has Org\)/i, '').trim() : '';
    const roleSelect = document.getElementById('roleId');
    const selectedRoleText = roleSelect && roleSelect.selectedIndex >= 0 ? 
        roleSelect.options[roleSelect.selectedIndex]?.text?.trim() : '';

    const formData = {
        student_id: document.getElementById('studentId').value,
        organization_id: document.getElementById('organizationId').value,
        date_joined: document.getElementById('dateJoined').value,
        role_id: document.getElementById('roleId').value,
        membership_status: document.getElementById('membershipStatus').value,
        student_name: selectedStudentText,
        role_name: selectedRoleText
    };

    try {
        const organizations = await AdviserOrganizationAPI.getAdviserAllOrganizations();
        const membershipGroups = await Promise.all(
            (organizations || []).map(org =>
                AdviserOrganizationAPI.getAdviserOrgMembershipsByOrg(org.id).catch(() => [])
            )
        );
        const allMemberships = membershipGroups.flat();
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
        document.body.classList.remove('overflow-hidden');
        document.removeEventListener('keydown', (e) => {
            if (e.key === 'Escape') closeAdviserOrgMemModal();
        });
    } else {
        closeModal();
    }
}

window.closeAdviserOrgMemModal = closeAdviserOrgMemModal;

export function openEditOrgModal(organization, onSuccess, onSubmit) {
    const formContent = `
        <form id="editOrgForm" class="manage-modal-form space-y-4">
            ${modalSection('Organization Details', `
                <div class="space-y-3">
                    <div>
                        <label for="orgCode" class="${LABEL_CLASS}">Organization Code <span class="text-red-500">*</span></label>
                        <input type="text" id="orgCode" name="orgCode" value="${organization.org_code}" required class="${FIELD_CLASS} uppercase">
                    </div>
                    <div>
                        <label for="orgName" class="${LABEL_CLASS}">Organization Name <span class="text-red-500">*</span></label>
                        <input type="text" id="orgName" name="orgName" value="${organization.name}" required class="${FIELD_CLASS}">
                    </div>
                    <div>
                        <label for="orgDescription" class="${LABEL_CLASS}">Description</label>
                        <textarea id="orgDescription" name="orgDescription" rows="3" class="${FIELD_CLASS} resize-none">${organization.description || ''}</textarea>
                    </div>
                    <div>
                        <label for="orgStatus" class="${LABEL_CLASS}">Status <span class="text-red-500">*</span></label>
                        <select id="orgStatus" name="orgStatus" required class="${FIELD_CLASS}">
                            <option value="Active" ${organization.status === 'Active' ? 'selected' : ''}>Active</option>
                            <option value="Inactive" ${organization.status === 'Inactive' ? 'selected' : ''}>Inactive</option>
                            <option value="Suspended" ${organization.status === 'Suspended' ? 'selected' : ''}>Suspended</option>
                        </select>
                    </div>
                </div>
            `)}
            <div id="formError" class="hidden text-sm text-red-700 bg-red-50 border border-red-200 rounded-xl px-3 py-2.5"></div>
            ${modalActions({ cancelOnclick: 'closeEditOrgModal()', submitText: 'Save Changes' })}
        </form>
    `;

    openModal('Edit Organization', formContent, 'mid-large');
    applyModalDomino();

    const form = document.getElementById('editOrgForm');
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const formData = {
            org_code: document.getElementById('orgCode').value.toUpperCase().trim(),
            name: document.getElementById('orgName').value.trim(),
            description: document.getElementById('orgDescription').value.trim(),
            status: document.getElementById('orgStatus').value
        };

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
            if (onSubmit && typeof onSubmit === 'function') {
                await onSubmit(formData, organization);
            } else {
                await AdviserOrganizationAPI.updateAdviserOrganization(formData);
            }
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
        document.body.classList.remove('overflow-hidden');
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
        const statusBadge = !isActive
            ? modalBadge(org.status, org.status === 'Suspended' ? 'red' : 'gray')
            : '';

        return `
        <button type="button" class="w-full text-left rounded-2xl border ${org.isCurrent ? 'border-navy/30 bg-blue-50' : 'border-line bg-white'} ${!isActive ? 'opacity-60 cursor-not-allowed' : 'hover:bg-surface'} p-3.5 sm:p-4 transition"
             onclick="selectOrganization(${org.id})" ${!isActive ? 'disabled' : ''}>
            <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div class="flex items-center gap-3 min-w-0">
                    <div class="w-11 h-11 rounded-2xl bg-navy text-white flex items-center justify-center text-sm font-bold shrink-0">
                        ${org.name.charAt(0).toUpperCase()}
                    </div>
                    <div class="min-w-0">
                        <h4 class="text-sm font-semibold text-ink truncate">${displayName}</h4>
                        <p class="text-xs text-muted">${org.code}</p>
                    </div>
                </div>
                <div class="flex flex-wrap items-center gap-1.5 pl-14 sm:pl-0">
                    ${statusBadge}
                    ${org.isCurrent ? modalBadge('Current', 'navy') : ''}
                </div>
            </div>
        </button>
        `;
    }).join('');

    const modalContent = `
        <div class="manage-modal-form space-y-4">
            ${modalSection('Available Organizations', `
                <p class="text-sm text-muted mb-3">Select an organization to switch to.</p>
                <div class="space-y-2.5">${orgListContent}</div>
            `)}
            ${modalViewClose('closeSwitchOrgModal()')}
        </div>
    `;

    openModal('Switch Organization', modalContent, 'mid');
    applyModalDomino();

    window.selectOrganization = (orgId) => {
        const org = organizations.find(o => String(o.id) === String(orgId));
        if (!org) {
            showToast('Organization not found', 'error');
            return;
        }

        if (org.isCurrent) {
            showToast('This is already the current organization', 'info');
            return;
        }

        if (!OrganizationValidator.isActive(org)) {
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
            document.body.classList.remove('overflow-hidden');
            delete window.selectOrganization;
            delete window.closeSwitchOrgModal;
        } else {
            closeModal();
        }
    };
}

export async function openViewAdviserOrgMemModal(id) {
    openModal('Membership Details', skeletonOrgMemView(), 'mid-large');

    try {
        const membership = await AdviserOrganizationAPI.getAdviserOrgMembership(id);
        const dateJoined = membership.date_joined ? new Date(membership.date_joined).toLocaleDateString('en-PH', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
        }) : 'N/A';

        const statusTone = membership.membership_status === 'Active' ? 'green' : membership.membership_status === 'Inactive' ? 'gray' : 'red';
        const content = `
            <div class="space-y-4">
                ${modalHero({
                    photo: '',
                    fallback: '<i data-lucide="users" class="w-10 h-10"></i>',
                    name: membership.student_name || 'Unknown Student',
                    subtitle: `Student Number: ${membership.student_number || 'N/A'}`,
                    badges: [modalBadge(membership.membership_status, statusTone)]
                })}
                ${modalSection('Membership Details', `
                    <dl class="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                        ${modalDetailTile('Student Name', membership.student_name || 'Unknown')}
                        ${modalDetailTile('Student Number', membership.student_number || 'N/A')}
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

import { openModal, closeModal, setModalButtonLoading } from '../../utils/modal.js';
import { openConfirmDialog } from '../Dialog/ConfirmDialog.js';
import { animateModalClose, clearModalAnimations } from '../../provider/ModalAnimation.js';
import * as RolesAPI from '../../api/admin/roles/ManageRoles.js';
import { showToast } from '../ToastMessage.js';
import { skeletonRoleForm, skeletonRoleView } from '../SkeletonLoading.js';
import { FIELD_CLASS, LABEL_CLASS, modalSection, modalActions, modalViewClose, modalDetailTile, modalBadge, modalHero, applyModalDomino } from './modalUi.js';

export function openManageRolesModal({ mode = 'add', role = null, roleId = null, onSubmit }) {
    const isEdit = mode === 'edit';
    const title = isEdit ? 'Edit Role' : 'New Role';
    const buttonText = isEdit ? 'Save Changes' : 'Add Role';

    const formContent = `
        <form id="roleForm" class="manage-modal-form space-y-4">
            ${isEdit ? `<input type="hidden" id="roleId" value="${role?.id || roleId || ''}">` : ''}
            ${modalSection('Role Information', `
                <div>
                    <label for="roleName" class="${LABEL_CLASS}">Role Name <span class="text-red-500">*</span></label>
                    <input type="text" id="roleName" name="roleName" value="${isEdit && role ? role.role_name : ''}" required
                        placeholder="e.g. Admin, Moderator, Member" class="${FIELD_CLASS}">
                </div>
            `)}
            <div id="formError" class="hidden text-sm text-red-700 bg-red-50 border border-red-200 rounded-xl px-3 py-2.5"></div>
            ${modalActions({ cancelOnclick: 'closeManageRolesModal()', submitText: buttonText })}
        </form>
    `;

    if (isEdit && !role && roleId) {
        openModal(title, skeletonRoleForm(), 'medium');

        setTimeout(async () => {
            try {
                const fetchedRole = await RolesAPI.getRole(roleId);
                const modalBody = document.getElementById('modal-body');
                if (modalBody) {
                    modalBody.innerHTML = formContent;
                    populateFormWithRole(fetchedRole);
                    setupFormHandlers(fetchedRole.id, buttonText, onSubmit);
                    applyModalDomino();
                }
            } catch (error) {
                console.error('Error loading role:', error);
                showToast('Failed to load role', 'error');
                closeManageRolesModal();
            }
        }, 100);
    } else {
        openModal(title, formContent, 'medium');
        applyModalDomino();
        setupFormHandlers(role?.id, buttonText, onSubmit);
    }
}

function populateFormWithRole(role) {
    const form = document.getElementById('roleForm');
    if (!form) return;

    document.getElementById('roleId').value = role.id;
    document.getElementById('roleName').value = role.role_name;
    applyModalDomino();
}

function setupFormHandlers(roleId, buttonText, onSubmit) {
    const form = document.getElementById('roleForm');
    if (form) {
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            await processRoleSubmit(roleId, buttonText, onSubmit);
        });
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

async function processRoleSubmit(id, buttonText, onSubmit) {
    hideFormError();

    const formData = {
        role_name: document.getElementById('roleName').value.trim()
    };

    if (!formData.role_name) {
        showFormError('Role name is required');
        return;
    }

    const isEdit = id != null;

    if (isEdit) {
        openConfirmDialog({
            title: 'Confirm Update',
            message: 'Are you sure you want to update this role?',
            confirmText: 'Update',
            cancelText: 'Cancel',
            type: 'blue',
            onConfirm: async () => {
                setModalButtonLoading('submitBtn', true, buttonText);
                try {
                    await onSubmit(id, formData);
                    closeManageRolesModal();
                    showToast('Role updated successfully', 'success');
                } catch (error) {
                    console.error('Error saving role:', error);
                    showFormError('Failed to save role. Please try again.');
                    setModalButtonLoading('submitBtn', false, buttonText);
                    showToast('Failed to update role', 'error');
                }
            }
        });
    } else {
        setModalButtonLoading('submitBtn', true, buttonText);
        try {
            await onSubmit(id, formData);
            closeManageRolesModal();
            showToast('Role added successfully', 'success');
        } catch (error) {
            console.error('Error saving role:', error);
            showFormError('Failed to save role. Please try again.');
            setModalButtonLoading('submitBtn', false, buttonText);
            showToast('Failed to add role', 'error');
        }
    }
}

async function closeManageRolesModal() {
    const modalOverlay = document.getElementById('modal-overlay');
    const modalContent = document.getElementById('modal-content');
    
    if (modalOverlay && modalContent) {
        await animateModalClose(modalOverlay, modalContent, 'scale');
        clearModalAnimations(modalOverlay, modalContent);
        modalOverlay.remove();
        document.body.classList.remove('overflow-hidden');
        document.removeEventListener('keydown', (e) => {
            if (e.key === 'Escape') closeManageRolesModal();
        });
    } else {
        closeModal();
    }
}

window.closeManageRolesModal = closeManageRolesModal;

export async function openViewRolesModal(id) {
    openModal('Role Details', skeletonRoleView(), 'mid-large');

    try {
        const role = await RolesAPI.getRole(id);
        const dateCreated = new Date(role.created_at).toLocaleDateString('en-PH', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
        });
        const dateUpdated = role.updated_at ? new Date(role.updated_at).toLocaleDateString('en-PH', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
        }) : '—';

        const userCount = role.users ? role.users.length : 0;
        const usersList = role.users && role.users.length > 0 
            ? role.users.map(user => `<span class="inline-block px-2.5 py-1 text-xs bg-surface text-ink border border-line rounded-lg mr-1.5 mb-1.5">${user.name || user.username || 'Unknown'}</span>`).join('')
            : '<span class="text-sm text-muted">No users linked</span>';

        const content = `
            <div class="space-y-4">
                ${modalHero({
                    fallback: `<i data-lucide="shield" class="w-10 h-10"></i>`,
                    name: role.role_name,
                    subtitle: `Role ID: ${role.id}`,
                    badges: [modalBadge(`${userCount} user${userCount !== 1 ? 's' : ''}`, 'navy')]
                })}
                ${modalSection('Role Information', `
                    <dl class="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                        ${modalDetailTile('Role Name', role.role_name)}
                        ${modalDetailTile('Linked Users', userCount)}
                        ${modalDetailTile('Created At', dateCreated)}
                        ${modalDetailTile('Updated At', dateUpdated)}
                    </dl>
                `)}
                ${modalSection('Linked Users', `
                    <div class="rounded-xl border border-line bg-surface px-3.5 py-3">
                        ${usersList}
                    </div>
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
        console.error('Error loading role:', error);
        showToast('Failed to load role', 'error');
        closeModal();
    }
}

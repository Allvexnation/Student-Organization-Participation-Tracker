import { openModal, closeModal, setModalButtonLoading } from '../../utils/modal.js';
import { openConfirmDialog } from '../Dialog/ConfirmDialog.js';
import { animateModalOpen, animateModalClose, clearModalAnimations, animateFormElements, clearFormAnimations, animateViewModalElements } from '../../provider/ModalAnimation.js';
import * as RolesAPI from '../../api/admin/roles/ManageRoles.js';
import { showToast } from '../ToastMessage.js';
import { skeletonRoleForm, skeletonRoleView } from '../SkeletonLoading.js';

export function openManageRolesModal({ mode = 'add', role = null, roleId = null, onSubmit }) {
    const isEdit = mode === 'edit';
    const title = isEdit ? 'Edit Role' : 'New Role';
    const buttonText = isEdit ? 'Save Changes' : 'Add Role';

    const formContent = `
        <form id="roleForm" class="space-y-5">
            ${isEdit ? `<input type="hidden" id="roleId" value="${role?.id || roleId || ''}">` : ''}

            <fieldset>
                <legend class="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Role Information</legend>
                <div class="space-y-3">
                    <div>
                        <label for="roleName" class="block text-sm font-medium text-gray-700 mb-1">Role Name <span class="text-red-500">*</span></label>
                        <input type="text" id="roleName" name="roleName" value="${isEdit && role ? role.role_name : ''}" required
                            placeholder="e.g. Admin, Moderator, Member"
                            class="w-full px-3 py-2 text-sm border border-gray-200 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent transition">
                    </div>
                </div>
            </fieldset>

            <div id="formError" class="hidden text-sm text-red-600 bg-red-50 border border-red-200 rounded-md px-3 py-2"></div>

            <div class="flex justify-end pt-3 border-t border-gray-100 flex-row gap-2">
                <button 
                    type="button" 
                    onclick="closeManageRolesModal()" 
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

    if (isEdit && !role && roleId) {
        openModal(title, skeletonRoleForm(), 'medium');

        const modalOverlay = document.getElementById('modal-overlay');
        const modalContent = document.getElementById('modal-content');
        if (modalOverlay && modalContent) {
            animateModalOpen(modalOverlay, modalContent, 'scale');
        }

        setTimeout(async () => {
            try {
                const fetchedRole = await RolesAPI.getRole(roleId);
                const modalBody = document.getElementById('modal-body');
                if (modalBody) {
                    modalBody.innerHTML = formContent;
                    populateFormWithRole(fetchedRole);
                    setupFormHandlers(fetchedRole.id, buttonText, onSubmit);
                }
            } catch (error) {
                console.error('Error loading role:', error);
                showToast('Failed to load role', 'error');
                closeManageRolesModal();
            }
        }, 100);
    } else {
        openModal(title, formContent, 'medium');

        const modalOverlay = document.getElementById('modal-overlay');
        const modalContent = document.getElementById('modal-content');
        if (modalOverlay && modalContent) {
            animateModalOpen(modalOverlay, modalContent, 'scale');
        }

        setTimeout(() => {
            const form = document.getElementById('roleForm');
            if (form) {
                animateFormElements(form);
            }
        }, 100);

        setupFormHandlers(role?.id, buttonText, onSubmit);
    }
}

function populateFormWithRole(role) {
    const form = document.getElementById('roleForm');
    if (!form) return;

    document.getElementById('roleId').value = role.id;
    document.getElementById('roleName').value = role.role_name;

    setTimeout(() => {
        const formEl = document.getElementById('roleForm');
        if (formEl) {
            animateFormElements(formEl);
        }
    }, 50);
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

    const isEdit = id !== null;

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

    const modalOverlay = document.getElementById('modal-overlay');
    const modalContent = document.getElementById('modal-content');
    if (modalOverlay && modalContent) {
        animateModalOpen(modalOverlay, modalContent, 'scale');
    }

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
            ? role.users.map(user => `<span class="inline-block px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded mr-1 mb-1">${user.name || user.username || 'Unknown'}</span>`).join('')
            : '<span class="text-sm text-gray-500">No users linked</span>';

        const content = `
            <div class="space-y-5">
                <div class="bg-gray-50 rounded-lg p-4 border border-gray-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <div>
                        <h3 class="text-base font-bold text-gray-900">${role.role_name}</h3>
                        <p class="text-xs text-gray-500 mt-0.5">Role ID: ${role.id}</p>
                    </div>
                    <div>
                        <span class="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200">
                            ${userCount} user${userCount !== 1 ? 's' : ''}
                        </span>
                    </div>
                </div>

                <hr class="border-gray-200">

                <div>
                    <h4 class="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Role Information</h4>
                    <dl class="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3">
                        <div>
                            <dt class="text-xs text-gray-400 font-medium">Role Name:</dt>
                            <dd class="text-sm font-semibold text-gray-900 mt-0.5">${role.role_name}</dd>
                        </div>
                        <div>
                            <dt class="text-xs text-gray-400 font-medium">Linked Users:</dt>
                            <dd class="text-sm font-semibold text-gray-900 mt-0.5">${userCount}</dd>
                        </div>
                        <div>
                            <dt class="text-xs text-gray-400 font-medium">Created At:</dt>
                            <dd class="text-sm font-semibold text-gray-900 mt-0.5">${dateCreated}</dd>
                        </div>
                        <div>
                            <dt class="text-xs text-gray-400 font-medium">Updated At:</dt>
                            <dd class="text-sm font-semibold text-gray-900 mt-0.5">${dateUpdated}</dd>
                        </div>
                    </dl>
                </div>

                <hr class="border-gray-200">

                <div>
                    <h4 class="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Linked Users</h4>
                    <div class="bg-gray-50 rounded-lg p-3 border border-gray-100">
                        ${usersList}
                    </div>
                </div>

                <div class="flex justify-end pt-3 border-t border-gray-100">
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
        }, 50);
    } catch (error) {
        console.error('Error loading role:', error);
        showToast('Failed to load role', 'error');
        closeModal();
    }
}

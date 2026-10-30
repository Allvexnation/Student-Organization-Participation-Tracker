import { openModal, closeModal, setModalButtonLoading } from '../../utils/modal.js';
import { openConfirmDialog } from '../Dialog/ConfirmDialog.js';
import { animateModalOpen, animateModalClose, clearModalAnimations, animateFormElements, clearFormAnimations, animateViewModalElements } from '../../provider/ModalAnimation.js';
import * as OrganizationsAPI from '../../api/admin/Organizations/ManageOrganizations.js';
import * as AdviserAPI from '../../api/admin/adviser/ManageAdviser.js';
import { showToast } from '../ToastMessage.js';
import { skeletonOrgForm, skeletonOrgView } from '../SkeletonLoading.js';
import { AdviserValidator } from '../../validator/AdviserValidator.js';
import { OrganizationCrudValidator } from '../../validator/OrganizationCrudValidator.js';

export function openManageOrgsModal({ mode = 'add', organization = null, organizationId = null, onSubmit }) {
    const isEdit = mode === 'edit';
    const title = isEdit ? 'Edit Organization' : 'New Organization';
    const buttonText = isEdit ? 'Save Changes' : 'Add Organization';

    const formContent = `
        <form id="orgForm" class="space-y-5">
            ${isEdit ? `<input type="hidden" id="orgId" value="${organization?.id || organizationId || ''}">` : ''}

            <fieldset>
                <legend class="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Organization Details</legend>
                <div class="space-y-3">
                    <div>
                        <label for="orgCode" class="block text-sm font-medium text-gray-700 mb-1">Organization Code <span class="text-red-500">*</span></label>
                        <input type="text" id="orgCode" name="orgCode" value="${isEdit && organization ? organization.org_code : ''}" required
                            placeholder="e.g. PITS, JMS, BEC"
                            class="w-full px-3 py-2 text-sm border border-gray-200 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent transition uppercase">
                    </div>
                    <div>
                        <label for="orgName" class="block text-sm font-medium text-gray-700 mb-1">Organization Name <span class="text-red-500">*</span></label>
                        <input type="text" id="orgName" name="orgName" value="${isEdit && organization ? organization.name : ''}" required
                            placeholder="e.g. Philippine Institute of Technology Students"
                            class="w-full px-3 py-2 text-sm border border-gray-200 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent transition">
                    </div>
                    <div>
                        <label for="orgDescription" class="block text-sm font-medium text-gray-700 mb-1">Description</label>
                        <textarea id="orgDescription" name="orgDescription" rows="3"
                            placeholder="Brief overview or purpose of the organization"
                            class="w-full px-3 py-2 text-sm border border-gray-200 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent transition resize-none">${isEdit && organization ? organization.description : ''}</textarea>
                    </div>
                </div>
            </fieldset>

            <hr class="border-gray-100">

            <fieldset>
                <legend class="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Status Information</legend>
                <div class="space-y-3">
                    <div>
                        <label for="orgAdviser" class="block text-sm font-medium text-gray-700 mb-1">Adviser</label>
                        <select id="orgAdviser" name="orgAdviser" required
                            class="w-full px-3 py-2 text-sm border border-gray-200 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white transition">
                            <option value="">Select Adviser</option>
                        </select>
                    </div>
                    <div>
                        <label for="orgStatus" class="block text-sm font-medium text-gray-700 mb-1">Status <span class="text-red-500">*</span></label>
                        <select id="orgStatus" name="orgStatus" required
                            class="w-full px-3 py-2 text-sm border border-gray-200 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white transition">
                            <option value="">Select Status</option>
                            <option value="Active" ${isEdit && organization?.status === 'Active' ? 'selected' : ''}>Active</option>
                            <option value="Inactive" ${isEdit && organization?.status === 'Inactive' ? 'selected' : ''}>Inactive</option>
                            <option value="Suspended" ${isEdit && organization?.status === 'Suspended' ? 'selected' : ''}>Suspended</option>
                        </select>
                    </div>
                </div>
            </fieldset>

            <div id="formError" class="hidden text-sm text-red-600 bg-red-50 border border-red-200 rounded-md px-3 py-2"></div>

            <div class="flex justify-end pt-3 border-t border-gray-100 flex-row gap-2">
                <button 
                    type="button" 
                    onclick="closeManageOrgsModal()" 
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

    if (isEdit && !organization && organizationId) {
        openModal(title, skeletonOrgForm(), 'mid-large');

        const modalOverlay = document.getElementById('modal-overlay');
        const modalContent = document.getElementById('modal-content');
        if (modalOverlay && modalContent) {
            animateModalOpen(modalOverlay, modalContent, 'scale');
        }

        setTimeout(async () => {
            try {
                const fetchedOrg = await OrganizationsAPI.getOrganization(organizationId);
                const modalBody = document.getElementById('modal-body');
                if (modalBody) {
                    modalBody.innerHTML = formContent;
                    populateFormWithOrg(fetchedOrg);
                    setupFormHandlers(fetchedOrg.id, buttonText, onSubmit);
                }
            } catch (error) {
                console.error('Error loading organization:', error);
                showToast('Failed to load organization', 'error');
                closeManageOrgsModal();
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
            const form = document.getElementById('orgForm');
            if (form) {
                animateFormElements(form);
            }
        }, 100);

        setupFormHandlers(organization?.id, buttonText, onSubmit);
    }
}

function populateFormWithOrg(organization) {
    const form = document.getElementById('orgForm');
    if (!form) return;

    document.getElementById('orgId').value = organization.id;
    document.getElementById('orgCode').value = organization.org_code;
    document.getElementById('orgName').value = organization.name;
    document.getElementById('orgDescription').value = organization.description || '';
    document.getElementById('orgStatus').value = organization.status;

    setTimeout(() => {
        const formEl = document.getElementById('orgForm');
        if (formEl) {
            animateFormElements(formEl);
        }
    }, 50);

    loadAdvisers(organization.adviser_id);
}

function setupFormHandlers(orgId, buttonText, onSubmit) {
    const form = document.getElementById('orgForm');
    if (form) {
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            await processOrgSubmit(orgId, buttonText, onSubmit);
        });
    }

    if (!orgId) {
        loadAdvisers();
    }
}

async function loadAdvisers(selectedAdviserId = null) {
    try {
        const advisers = await AdviserAPI.getAllAdvisers();
        const adviserSelect = document.getElementById('orgAdviser');
        if (adviserSelect) {
            adviserSelect.innerHTML = '<option value="">Select Adviser</option>';
            advisers.forEach(adviser => {
                const isInactive = AdviserValidator.isInactive(adviser);
                const displayName = AdviserValidator.getDisplayName(adviser);
                const option = document.createElement('option');
                option.value = adviser.id;
                option.textContent = displayName;
                if (selectedAdviserId && selectedAdviserId == adviser.id) {
                    option.selected = true;
                }
                if (isInactive) {
                    option.disabled = true;
                }
                adviserSelect.appendChild(option);
            });
        }
    } catch (error) {
        console.error('Error loading advisers:', error);
        showToast('Failed to load advisers', 'error');
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

async function processOrgSubmit(id, buttonText, onSubmit) {
    hideFormError();

    const formData = {
        org_code: document.getElementById('orgCode').value.toUpperCase().trim(),
        name: document.getElementById('orgName').value.trim(),
        description: document.getElementById('orgDescription').value.trim(),
        adviser_id: document.getElementById('orgAdviser').value,
        status: document.getElementById('orgStatus').value
    };

    // Validate organization code uniqueness
    try {
        const allOrganizations = await OrganizationsAPI.getAllOrganizations();
        const validation = OrganizationCrudValidator.validateCodeUniqueness(formData.org_code, allOrganizations, id);
        if (!validation.isValid) {
            showFormError(validation.message);
            showToast(validation.message, 'error');
            return;
        }
    } catch (error) {
        console.error('Error checking organization code:', error);
    }

    const isEdit = id != null;

    if (isEdit) {
        openConfirmDialog({
            title: 'Confirm Update',
            message: 'Are you sure you want to update this organization?',
            confirmText: 'Update',
            cancelText: 'Cancel',
            type: 'blue',
            onConfirm: async () => {
                setModalButtonLoading('submitBtn', true, buttonText);
                try {
                    await onSubmit(id, formData);
                    closeManageOrgsModal();
                    showToast('Organization updated successfully', 'success');
                } catch (error) {
                    console.error('Error saving organization:', error);
                    showFormError('Failed to save organization. Please try again.');
                    setModalButtonLoading('submitBtn', false, buttonText);
                    showToast('Failed to update organization', 'error');
                }
            }
        });
    } else {
        setModalButtonLoading('submitBtn', true, buttonText);
        try {
            await onSubmit(id, formData);
            closeManageOrgsModal();
            showToast('Organization added successfully', 'success');
        } catch (error) {
            console.error('Error saving organization:', error);
            showFormError('Failed to save organization. Please try again.');
            setModalButtonLoading('submitBtn', false, buttonText);
            showToast('Failed to add organization', 'error');
        }
    }
}

async function closeManageOrgsModal() {
    const modalOverlay = document.getElementById('modal-overlay');
    const modalContent = document.getElementById('modal-content');
    
    if (modalOverlay && modalContent) {
        await animateModalClose(modalOverlay, modalContent, 'scale');
        clearModalAnimations(modalOverlay, modalContent);
        modalOverlay.remove();
        document.removeEventListener('keydown', (e) => {
            if (e.key === 'Escape') closeManageOrgsModal();
        });
    } else {
        closeModal();
    }
}

window.closeManageOrgsModal = closeManageOrgsModal;

export async function openViewOrgsModal(id) {
    openModal('Organization Details', skeletonOrgView(), 'mid-large');

    const modalOverlay = document.getElementById('modal-overlay');
    const modalContent = document.getElementById('modal-content');
    if (modalOverlay && modalContent) {
        animateModalOpen(modalOverlay, modalContent, 'scale');
    }

    try {
        const organization = await OrganizationsAPI.getOrganization(id);
        const createdAt = organization.created_at ? new Date(organization.created_at).toLocaleDateString('en-PH', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
        }) : 'N/A';
        const updatedAt = organization.updated_at ? new Date(organization.updated_at).toLocaleDateString('en-PH', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
        }) : 'N/A';

        const content = `
            <div class="space-y-5">
                <div class="flex flex-col sm:flex-row sm:items-center gap-4 bg-gray-50 rounded-lg p-4 border border-gray-100">
                    <div class="flex-shrink-0 w-24 h-24 sm:w-32 sm:h-32 rounded-lg bg-blue-900 text-blue-100 flex items-center justify-center text-2xl font-bold shadow-sm mx-auto sm:mx-0">
                        ${organization.org_code}
                    </div>
                    <div class="text-center sm:text-left">
                        <h3 class="text-lg font-semibold text-gray-900">${organization.name}</h3>
                        <p class="text-sm text-gray-500 mt-0.5">${organization.org_code}</p>
                        <span class="inline-flex items-center px-2.5 py-0.5 mt-0.5 rounded-full text-xs font-medium ${organization.status === 'Active' ? 'bg-green-50 text-green-900' : organization.status === 'Inactive' ? 'bg-gray-50 text-gray-900' : 'bg-red-50 text-red-900'} border border-gray-200">
                            ${organization.status}
                        </span>
                    </div>
                </div>

                <div class="border-b border-gray-200 pb-4">
                    <h4 class="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Organization Details</h4>
                    <dl class="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3">
                        <div>
                            <dt class="text-xs text-gray-400 font-medium">Organization Code</dt>
                            <dd class="text-sm font-semibold text-gray-900 mt-0.5">${organization.org_code}</dd>
                        </div>
                        <div>
                            <dt class="text-xs text-gray-400 font-medium">Organization Name</dt>
                            <dd class="text-sm font-semibold text-gray-900 mt-0.5">${organization.name}</dd>
                        </div>
                        <div class="sm:col-span-2">
                            <dt class="text-xs text-gray-400 font-medium">Description</dt>
                            <dd class="text-sm font-semibold text-gray-900 mt-0.5">${organization.description || 'N/A'}</dd>
                        </div>
                    </dl>
                </div>

                <div class="border-b border-gray-200 pb-4">
                    <h4 class="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Status Information</h4>
                    <dl class="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3">
                        <div>
                            <dt class="text-xs text-gray-400 font-medium">Adviser</dt>
                            <dd class="text-sm font-semibold text-gray-900 mt-0.5">${organization.adviser || 'N/A'}</dd>
                        </div>
                        <div>
                            <dt class="text-xs text-gray-400 font-medium">Status</dt>
                            <dd class="text-sm font-semibold text-gray-900 mt-0.5">${organization.status}</dd>
                        </div>
                    </dl>
                </div>

                <div class="border-b border-gray-200 pb-4">
                    <h4 class="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Timestamps</h4>
                    <dl class="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3">
                        <div>
                            <dt class="text-xs text-gray-400 font-medium">Created At</dt>
                            <dd class="text-sm font-semibold text-gray-900 mt-0.5">${createdAt}</dd>
                        </div>
                        <div>
                            <dt class="text-xs text-gray-400 font-medium">Updated At</dt>
                            <dd class="text-sm font-semibold text-gray-900 mt-0.5">${updatedAt}</dd>
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
        }, 50);
    } catch (error) {
        console.error('Error loading organization:', error);
        showToast('Failed to load organization', 'error');
        closeModal();
    }
}

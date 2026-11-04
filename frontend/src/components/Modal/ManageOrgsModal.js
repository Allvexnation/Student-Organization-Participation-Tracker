import { openModal, closeModal, setModalButtonLoading } from '../../utils/modal.js';
import { openConfirmDialog } from '../Dialog/ConfirmDialog.js';
import { animateModalClose, clearModalAnimations } from '../../provider/ModalAnimation.js';
import * as OrganizationsAPI from '../../api/admin/Organizations/ManageOrganizations.js';
import * as AdviserAPI from '../../api/admin/adviser/ManageAdviser.js';
import { showToast } from '../ToastMessage.js';
import { skeletonOrgForm, skeletonOrgView } from '../SkeletonLoading.js';
import { AdviserValidator } from '../../validator/AdviserValidator.js';
import { OrganizationCrudValidator } from '../../validator/OrganizationCrudValidator.js';
import { FIELD_CLASS, LABEL_CLASS, modalSection, modalActions, modalViewClose, modalDetailTile, modalBadge, modalHero, applyModalDomino } from './modalUi.js';

function escapeHtml(value) {
    return String(value ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}

function statusTone(status) {
    const lower = String(status || '').toLowerCase();
    if (lower === 'active') return 'green';
    if (lower === 'inactive') return 'gray';
    return 'red';
}

function orgFormMarkup({ isEdit, organization, organizationId, buttonText }) {
    const code = isEdit && organization ? escapeHtml(organization.org_code) : '';
    const name = isEdit && organization ? escapeHtml(organization.name) : '';
    const description = isEdit && organization ? escapeHtml(organization.description || '') : '';
    const status = isEdit && organization ? organization.status : '';

    return `
        <form id="orgForm" class="manage-modal-form space-y-4">
            ${isEdit ? `<input type="hidden" id="orgId" value="${escapeHtml(organization?.id || organizationId || '')}">` : ''}
            ${modalSection('Organization Details', `
                <div class="space-y-3">
                    <div>
                        <label for="orgCode" class="${LABEL_CLASS}">Organization Code <span class="text-red-500">*</span></label>
                        <input type="text" id="orgCode" name="orgCode" value="${code}" required
                            placeholder="e.g. PITS, JMS, BEC"
                            class="${FIELD_CLASS} uppercase">
                    </div>
                    <div>
                        <label for="orgName" class="${LABEL_CLASS}">Organization Name <span class="text-red-500">*</span></label>
                        <input type="text" id="orgName" name="orgName" value="${name}" required
                            placeholder="e.g. Philippine Institute of Technology Students"
                            class="${FIELD_CLASS}">
                    </div>
                    <div>
                        <label for="orgDescription" class="${LABEL_CLASS}">Description</label>
                        <textarea id="orgDescription" name="orgDescription" rows="3"
                            placeholder="Brief overview or purpose of the organization"
                            class="${FIELD_CLASS} resize-none">${description}</textarea>
                    </div>
                </div>
            `)}
            ${modalSection('Status Information', `
                <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                        <label for="orgAdviser" class="${LABEL_CLASS}">Adviser</label>
                        <select id="orgAdviser" name="orgAdviser" required class="${FIELD_CLASS}">
                            <option value="">Select Adviser</option>
                        </select>
                    </div>
                    <div>
                        <label for="orgStatus" class="${LABEL_CLASS}">Status <span class="text-red-500">*</span></label>
                        <select id="orgStatus" name="orgStatus" required class="${FIELD_CLASS}">
                            <option value="">Select Status</option>
                            <option value="Active" ${status === 'Active' ? 'selected' : ''}>Active</option>
                            <option value="Inactive" ${status === 'Inactive' ? 'selected' : ''}>Inactive</option>
                            <option value="Suspended" ${status === 'Suspended' ? 'selected' : ''}>Suspended</option>
                        </select>
                    </div>
                </div>
            `)}
            <div id="formError" class="hidden text-sm text-red-700 bg-red-50 border border-red-200 rounded-xl px-3 py-2.5"></div>
            ${modalActions({ cancelOnclick: 'closeManageOrgsModal()', submitText: buttonText })}
        </form>
    `;
}

export function openManageOrgsModal({ mode = 'add', organization = null, organizationId = null, onSubmit }) {
    const isEdit = mode === 'edit';
    const title = isEdit ? 'Edit Organization' : 'New Organization';
    const buttonText = isEdit ? 'Save Changes' : 'Add Organization';
    const formContent = orgFormMarkup({ isEdit, organization, organizationId, buttonText });

    if (isEdit && !organization && organizationId) {
        openModal(title, skeletonOrgForm(), 'mid-large');
        applyModalDomino();

        setTimeout(async () => {
            try {
                const fetchedOrg = await OrganizationsAPI.getOrganization(organizationId);
                const modalBody = document.getElementById('modal-body');
                if (modalBody) {
                    modalBody.innerHTML = orgFormMarkup({
                        isEdit: true,
                        organization: fetchedOrg,
                        organizationId: fetchedOrg.id,
                        buttonText
                    });
                    populateFormWithOrg(fetchedOrg);
                    setupFormHandlers(fetchedOrg.id, buttonText, onSubmit);
                    applyModalDomino();
                }
            } catch (error) {
                console.error('Error loading organization:', error);
                showToast('Failed to load organization', 'error');
                closeManageOrgsModal();
            }
        }, 100);
    } else {
        openModal(title, formContent, 'mid-large');
        applyModalDomino();
        setupFormHandlers(organization?.id, buttonText, onSubmit);
    }
}

function populateFormWithOrg(organization) {
    const form = document.getElementById('orgForm');
    if (!form) return;

    const orgId = document.getElementById('orgId');
    if (orgId) orgId.value = organization.id;
    const orgCode = document.getElementById('orgCode');
    if (orgCode) orgCode.value = organization.org_code || '';
    const orgName = document.getElementById('orgName');
    if (orgName) orgName.value = organization.name || '';
    const orgDescription = document.getElementById('orgDescription');
    if (orgDescription) orgDescription.value = organization.description || '';
    const orgStatus = document.getElementById('orgStatus');
    if (orgStatus) orgStatus.value = organization.status || '';

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
        document.body.classList.remove('overflow-hidden');
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
    applyModalDomino();

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
        const tone = statusTone(organization.status);
        const code = escapeHtml(organization.org_code || 'ORG');

        const content = `
            <div class="space-y-4">
                ${modalHero({
                    fallback: `<span class="text-xl tracking-wide">${code}</span>`,
                    name: escapeHtml(organization.name),
                    subtitle: code,
                    badges: [modalBadge(escapeHtml(organization.status || '—'), tone)]
                })}
                ${modalSection('Organization Details', `
                    <dl class="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                        ${modalDetailTile('Organization Code', code)}
                        ${modalDetailTile('Organization Name', escapeHtml(organization.name))}
                        <div class="md:col-span-2">${modalDetailTile('Description', escapeHtml(organization.description || 'N/A'))}</div>
                    </dl>
                `)}
                ${modalSection('Status Information', `
                    <dl class="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                        ${modalDetailTile('Adviser', escapeHtml(organization.adviser || 'N/A'))}
                        ${modalDetailTile('Status', modalBadge(escapeHtml(organization.status || '—'), tone))}
                    </dl>
                `)}
                ${modalSection('Timestamps', `
                    <dl class="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                        ${modalDetailTile('Created At', createdAt)}
                        ${modalDetailTile('Updated At', updatedAt)}
                    </dl>
                `)}
                ${modalViewClose('closeManageOrgsModal()')}
            </div>
        `;

        const modalBody = document.getElementById('modal-body');
        if (modalBody) {
            modalBody.innerHTML = content;
        }
        applyModalDomino();
    } catch (error) {
        console.error('Error loading organization:', error);
        showToast('Failed to load organization', 'error');
        closeModal();
    }
}

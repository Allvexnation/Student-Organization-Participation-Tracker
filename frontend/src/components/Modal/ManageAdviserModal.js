import { openModal, closeModal, setModalButtonLoading } from '../../utils/modal.js';
import { openConfirmDialog } from '../Dialog/ConfirmDialog.js';
import { animateModalClose, clearModalAnimations } from '../../provider/ModalAnimation.js';
import * as AdviserAPI from '../../api/admin/adviser/ManageAdviser.js';
import { showToast } from '../ToastMessage.js';
import { skeletonAdviserForm, skeletonAdviserView } from '../SkeletonLoading.js';
import { AdviserCrudValidator } from '../../validator/AdviserCrudValidator.js';
import { FIELD_CLASS, LABEL_CLASS, modalSection, modalActions, modalViewClose, modalDetailTile, modalBadge, modalHero, modalPhotoField, applyModalDomino } from './modalUi.js';

let croppedAdviserImage = null;

export function openManageAdviserModal({ mode = 'add', adviser = null, adviserId = null, onSubmit }) {
    croppedAdviserImage = null;
    const isEdit = mode === 'edit';
    const title = isEdit ? 'Edit Adviser' : 'New Adviser';
    const buttonText = isEdit ? 'Save Changes' : 'Add Adviser';
    const existingImageUrl = isEdit && adviser?.profile_photo ? adviser.profile_photo : '';

    const formContent = `
        <form id="adviserForm" class="manage-modal-form space-y-4">
            ${isEdit ? `<input type="hidden" id="adviserId" value="${adviser?.id || adviserId || ''}">` : ''}
            ${isEdit ? `<input type="hidden" id="existingImageUrl" value="${existingImageUrl}">` : ''}
            ${modalSection('Photo', modalPhotoField(existingImageUrl))}
            ${modalSection('Personal Information', `
                <div class="space-y-3">
                    <div>
                        <label for="adviserName" class="${LABEL_CLASS}">Name <span class="text-red-500">*</span></label>
                        <input type="text" id="adviserName" name="adviserName" value="${isEdit && adviser ? adviser.name : ''}" required placeholder="e.g. Juan Dela Cruz" class="${FIELD_CLASS}">
                    </div>
                    ${isEdit ? `
                    <div>
                        <label for="adviserUsername" class="${LABEL_CLASS}">Username <span class="text-red-500">*</span></label>
                        <input type="text" id="adviserUsername" name="adviserUsername" value="${adviser ? adviser.username : ''}" required placeholder="e.g. juandelacruz" class="${FIELD_CLASS}">
                    </div>
                    ` : ''}
                    <div>
                        <label for="adviserEmail" class="${LABEL_CLASS}">Email <span class="text-red-500">*</span></label>
                        <input type="email" id="adviserEmail" name="adviserEmail" value="${isEdit && adviser ? adviser.email : ''}" required placeholder="e.g. juan@example.com" class="${FIELD_CLASS}">
                    </div>
                    ${!isEdit ? `
                    <p class="text-xs text-muted bg-blue-50 border border-blue-100 rounded-xl px-3 py-2.5">
                        <i data-lucide="info" class="w-4 h-4 inline mr-1"></i>
                        Username and password will be auto-generated and sent to the adviser's email.
                    </p>
                    ` : ''}
                </div>
            `)}
            ${modalSection('Role & Status', `
                <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                        <label for="adviserRole" class="${LABEL_CLASS}">Role <span class="text-red-500">*</span></label>
                        <select id="adviserRole" name="adviserRole" required class="${FIELD_CLASS}">
                            <option value="adviser" ${isEdit && adviser?.role === 'adviser' ? 'selected' : ''}>Adviser</option>
                            <option value="head_adviser" ${isEdit && adviser?.role === 'head_adviser' ? 'selected' : ''}>Head Adviser</option>
                        </select>
                    </div>
                    <div>
                        <label for="adviserStatus" class="${LABEL_CLASS}">Status <span class="text-red-500">*</span></label>
                        <select id="adviserStatus" name="adviserStatus" required class="${FIELD_CLASS}">
                            <option value="active" ${isEdit && adviser?.status === 'active' ? 'selected' : ''}>Active</option>
                            <option value="inactive" ${isEdit && adviser?.status === 'inactive' ? 'selected' : ''}>Inactive</option>
                        </select>
                    </div>
                </div>
            `)}
            <div id="formError" class="hidden text-sm text-red-700 bg-red-50 border border-red-200 rounded-xl px-3 py-2.5"></div>
            ${modalActions({ cancelOnclick: 'closeManageAdviserModal()', submitText: buttonText })}
        </form>
    `;

    if (isEdit && !adviser && adviserId) {
        openModal(title, skeletonAdviserForm(), 'mid-large');

        setTimeout(async () => {
            try {
                const fetchedAdviser = await AdviserAPI.getAdviser(adviserId);
                const modalBody = document.getElementById('modal-body');
                if (modalBody) {
                    modalBody.innerHTML = formContent;
                    populateFormWithAdviser(fetchedAdviser);
                    setupFormHandlers(fetchedAdviser.id, buttonText, onSubmit);
                    applyModalDomino();
                }
            } catch (error) {
                console.error('Error loading adviser:', error);
                showToast('Failed to load adviser', 'error');
                closeManageAdviserModal();
            }
        }, 100);
    } else {
        openModal(title, formContent, 'mid-large');
        applyModalDomino();
        setupFormHandlers(adviser?.id, buttonText, onSubmit);
    }
}

function populateFormWithAdviser(adviser) {
    const form = document.getElementById('adviserForm');
    if (!form) return;

    const adviserIdInput = document.getElementById('adviserId');
    if (adviserIdInput) adviserIdInput.value = adviser.id;

    const adviserNameInput = document.getElementById('adviserName');
    if (adviserNameInput) adviserNameInput.value = adviser.name;

    const adviserUsernameInput = document.getElementById('adviserUsername');
    if (adviserUsernameInput) adviserUsernameInput.value = adviser.username;

    const adviserEmailInput = document.getElementById('adviserEmail');
    if (adviserEmailInput) adviserEmailInput.value = adviser.email;

    const adviserRoleInput = document.getElementById('adviserRole');
    if (adviserRoleInput) adviserRoleInput.value = adviser.role;

    const adviserStatusInput = document.getElementById('adviserStatus');
    if (adviserStatusInput) adviserStatusInput.value = adviser.status;

    if (adviser.profile_photo) {
        const existingImageUrlInput = document.getElementById('existingImageUrl');
        const imageUrlInput = document.getElementById('imageUrl');
        if (existingImageUrlInput) existingImageUrlInput.value = adviser.profile_photo;
        if (imageUrlInput) imageUrlInput.value = adviser.profile_photo;
        const imagePreviewContainer = document.getElementById('imagePreviewContainer');
        if (imagePreviewContainer) {
            imagePreviewContainer.innerHTML = `<img src="${adviser.profile_photo}" alt="Preview" class="w-full h-full object-cover" id="imagePreview">`;
        }
    }

    applyModalDomino();
}

function setupFormHandlers(adviserId, buttonText, onSubmit) {
    const form = document.getElementById('adviserForm');
    if (form) {
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            await processAdviserSubmit(adviserId, buttonText, onSubmit);
        });
    }

    const imageUpload = document.getElementById('imageUpload');
    if (imageUpload) {
        imageUpload.addEventListener('change', handleImagePreview);
    }
}

function handleImagePreview(e) {
    const file = e.target.files[0];
    const previewContainer = document.getElementById('imagePreviewContainer');
    const imageUrlInput = document.getElementById('imageUrl');
    
    if (!file) {
        const existingImageUrl = document.getElementById('existingImageUrl')?.value || '';
        if (existingImageUrl) {
            previewContainer.innerHTML = `<img src="${existingImageUrl}" alt="Preview" class="w-full h-full object-cover" id="imagePreview">`;
            imageUrlInput.value = existingImageUrl;
        } else {
            previewContainer.innerHTML = `<i data-lucide="user" class="w-8 h-8 text-gray-400" id="imagePreviewIcon"></i>`;
            imageUrlInput.value = '';
        }
        croppedAdviserImage = null;
        if (typeof lucide !== 'undefined') lucide.createIcons();
        return;
    }

    if (file.size > 5 * 1024 * 1024) {
        e.target.value = '';
        showFormError('File size exceeds 5MB limit.');
        return;
    }

    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
        e.target.value = '';
        showFormError('Invalid file type. Only images are allowed.');
        return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
        const imageSrc = event.target.result;
        previewContainer.innerHTML = `<img src="${imageSrc}" alt="Preview" class="w-full h-full object-cover" id="imagePreview">`;
        imageUrlInput.value = imageSrc;
        croppedAdviserImage = imageSrc;
    };
    reader.readAsDataURL(file);
    hideFormError();
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

async function processAdviserSubmit(id, buttonText, onSubmit) {
    hideFormError();

    let imageUrl = document.getElementById('imageUrl').value;

    const isEdit = id != null;

    const formData = {
        name: document.getElementById('adviserName').value.trim(),
        username: document.getElementById('adviserUsername')?.value.trim() || '',
        email: document.getElementById('adviserEmail').value.trim(),
        role: document.getElementById('adviserRole').value,
        status: document.getElementById('adviserStatus').value,
        profile_photo: imageUrl
    };

    try {
        const existingAdvisers = await AdviserAPI.getAllAdvisers();

        const validation = AdviserCrudValidator.validate(formData, existingAdvisers, isEdit ? 'edit' : 'add', id);
        
        if (!validation.isValid) {
            showFormError(validation.message);
            return;
        }
    } catch (error) {
        console.error('Error validating adviser:', error);
    }

    if (isEdit) {
        openConfirmDialog({
            title: 'Confirm Update',
            message: 'Are you sure you want to update this adviser details?',
            confirmText: 'Update',
            cancelText: 'Cancel',
            type: 'blue',
            onConfirm: async () => {
                setModalButtonLoading('submitBtn', true, buttonText);
                try {
                    await onSubmit(id, formData);
                    closeManageAdviserModal();
                    showToast('Adviser updated successfully', 'success');
                } catch (error) {
                    console.error('Error saving adviser:', error);
                    showFormError('Failed to save adviser. Please try again.');
                    setModalButtonLoading('submitBtn', false, buttonText);
                    showToast('Failed to update adviser', 'error');
                }
            }
        });
    } else {
        setModalButtonLoading('submitBtn', true, buttonText);
        try {
            const response = await onSubmit(id, formData);
            closeManageAdviserModal();
            if (response && response.username) {
                showToast(`Adviser added successfully. Username: ${response.username}. Password sent to email.`, 'success');
            } else {
                showToast('Adviser added successfully', 'success');
            }
        } catch (error) {
            console.error('Error saving adviser:', error);
            showFormError('Failed to save adviser. Please try again.');
            setModalButtonLoading('submitBtn', false, buttonText);
            showToast('Failed to add adviser', 'error');
        }
    }
}

async function closeManageAdviserModal() {
    const modalOverlay = document.getElementById('modal-overlay');
    const modalContent = document.getElementById('modal-content');
    
    if (modalOverlay && modalContent) {
        await animateModalClose(modalOverlay, modalContent, 'scale');
        clearModalAnimations(modalOverlay, modalContent);
        modalOverlay.remove();
        document.body.classList.remove('overflow-hidden');
        document.removeEventListener('keydown', (e) => {
            if (e.key === 'Escape') closeManageAdviserModal();
        });
    } else {
        closeModal();
    }
}

window.closeManageAdviserModal = closeManageAdviserModal;

export async function openViewAdviserModal(id) {
    openModal('Adviser Details', skeletonAdviserView(), 'mid-large');

    try {
        const adviser = await AdviserAPI.getAdviser(id);
        const dateCreated = new Date(adviser.created_at).toLocaleDateString('en-PH', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
        });

        const content = `
            <div class="space-y-4">
                ${modalHero({
                    photo: adviser.profile_photo,
                    fallback: adviser.name.charAt(0).toUpperCase(),
                    name: adviser.name,
                    badges: [modalBadge(adviser.role === 'head_adviser' ? 'Head Adviser' : 'Adviser', adviser.role === 'head_adviser' ? 'purple' : 'navy')]
                })}
                ${modalSection('Personal Information', `
                    <dl class="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                        ${modalDetailTile('Name', adviser.name)}
                        ${modalDetailTile('Username', adviser.username)}
                        ${modalDetailTile('Email', adviser.email)}
                        ${modalDetailTile('Role', adviser.role === 'head_adviser' ? 'Head Adviser' : 'Adviser')}
                    </dl>
                `)}
                ${modalSection('Account Status', `
                    <dl class="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                        ${modalDetailTile('Status', modalBadge(adviser.status, adviser.status === 'active' ? 'green' : 'red'))}
                        ${modalDetailTile('Created At', dateCreated)}
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
        console.error('Error loading adviser:', error);
        showToast('Failed to load adviser', 'error');
        closeModal();
    }
}
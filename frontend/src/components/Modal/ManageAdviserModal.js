import { openModal, closeModal, setModalButtonLoading } from '../../utils/modal.js';
import { openConfirmDialog } from '../Dialog/ConfirmDialog.js';
import { animateModalOpen, animateModalClose, clearModalAnimations, animateFormElements, clearFormAnimations, animateViewModalElements } from '../../provider/ModalAnimation.js';
import * as AdviserAPI from '../../api/admin/adviser/ManageAdviser.js';
import { showToast } from '../ToastMessage.js';
import { skeletonAdviserForm, skeletonAdviserView } from '../SkeletonLoading.js';

let croppedAdviserImage = null;

export function openManageAdviserModal({ mode = 'add', adviser = null, adviserId = null, onSubmit }) {
    croppedAdviserImage = null;
    const isEdit = mode === 'edit';
    const title = isEdit ? 'Edit Adviser' : 'New Adviser';
    const buttonText = isEdit ? 'Save Changes' : 'Add Adviser';
    const existingImageUrl = isEdit && adviser?.profile_photo ? adviser.profile_photo : '';

    const formContent = `
        <form id="adviserForm" class="space-y-5">
            ${isEdit ? `<input type="hidden" id="adviserId" value="${adviser?.id || adviserId || ''}">` : ''}
            ${isEdit && existingImageUrl ? `<input type="hidden" id="existingImageUrl" value="${existingImageUrl}">` : ''}

            <fieldset>
                <legend class="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Photo</legend>
                <div class="space-y-3">
                    <div class="flex flex-col sm:flex-row sm:items-center gap-4">
                        <div id="imagePreviewContainer" class="flex-shrink-0 w-20 h-20 rounded-lg bg-gray-100 border-2 border-dashed border-gray-300 flex items-center justify-center overflow-hidden">
                            ${existingImageUrl
                                ? `<img src="${existingImageUrl}" alt="Preview" class="w-full h-full object-cover" id="imagePreview">`
                                : `<i data-lucide="user" class="w-8 h-8 text-gray-400" id="imagePreviewIcon"></i>`
                            }
                        </div>
                        <div class="flex-1 w-full">
                            <label for="imageUpload" class="block text-sm font-medium text-gray-700 mb-1">Upload Photo</label>
                            <input type="file" id="imageUpload" name="imageUpload" accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
                                class="w-full text-sm text-gray-500 file:mr-3 file:py-2 file:px-3 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-900 hover:file:bg-blue-100 transition">
                            <p class="text-xs text-gray-400 mt-1">JPG, PNG, GIF, or WebP (max 5MB)</p>
                        </div>
                    </div>
                    <input type="hidden" id="imageUrl" name="imageUrl" value="${existingImageUrl}">
                </div>
            </fieldset>

            <hr class="border-gray-100">

            <fieldset>
                <legend class="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Personal Information</legend>
                <div class="space-y-3">
                    <div>
                        <label for="adviserName" class="block text-sm font-medium text-gray-700 mb-1">Name <span class="text-red-500">*</span></label>
                        <input type="text" id="adviserName" name="adviserName" value="${isEdit && adviser ? adviser.name : ''}" required
                            placeholder="e.g. Juan Dela Cruz"
                            class="w-full px-3 py-2 text-sm border border-gray-200 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent transition">
                    </div>
                    <div>
                        <label for="adviserEmail" class="block text-sm font-medium text-gray-700 mb-1">Email <span class="text-red-500">*</span></label>
                        <input type="email" id="adviserEmail" name="adviserEmail" value="${isEdit && adviser ? adviser.email : ''}" required
                            placeholder="e.g. juan@example.com"
                            class="w-full px-3 py-2 text-sm border border-gray-200 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent transition">
                    </div>
                    ${!isEdit ? `
                    <p class="text-xs text-gray-500 bg-blue-50 border border-blue-200 rounded-md px-3 py-2">
                        <i data-lucide="info" class="w-4 h-4 inline mr-1"></i>
                        Username and password will be auto-generated and sent to the adviser's email.
                    </p>
                    ` : ``}
                </div>
            </fieldset>

            <hr class="border-gray-100">

            <fieldset>
                <legend class="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Role & Status</legend>
                <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                        <label for="adviserRole" class="block text-sm font-medium text-gray-700 mb-1">Role <span class="text-red-500">*</span></label>
                        <select id="adviserRole" name="adviserRole" required
                            class="w-full px-3 py-2 text-sm border border-gray-200 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white transition">
                            <option value="adviser" ${isEdit && adviser?.role === 'adviser' ? 'selected' : ''}>Adviser</option>
                            <option value="head_adviser" ${isEdit && adviser?.role === 'head_adviser' ? 'selected' : ''}>Head Adviser</option>
                        </select>
                    </div>
                    <div>
                        <label for="adviserStatus" class="block text-sm font-medium text-gray-700 mb-1">Status <span class="text-red-500">*</span></label>
                        <select id="adviserStatus" name="adviserStatus" required
                            class="w-full px-3 py-2 text-sm border border-gray-200 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white transition">
                            <option value="active" ${isEdit && adviser?.status === 'active' ? 'selected' : ''}>Active</option>
                            <option value="inactive" ${isEdit && adviser?.status === 'inactive' ? 'selected' : ''}>Inactive</option>
                        </select>
                    </div>
                </div>
            </fieldset>

            <div id="formError" class="hidden text-sm text-red-600 bg-red-50 border border-red-200 rounded-md px-3 py-2"></div>

            <div class="flex justify-end pt-3 border-t border-gray-100 flex-row gap-2">
                <button
                    type="button"
                    onclick="closeManageAdviserModal()"
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

    if (isEdit && !adviser && adviserId) {
        openModal(title, skeletonAdviserForm(), 'mid-large');

        const modalOverlay = document.getElementById('modal-overlay');
        const modalContent = document.getElementById('modal-content');
        if (modalOverlay && modalContent) {
            animateModalOpen(modalOverlay, modalContent, 'scale');
        }

        setTimeout(async () => {
            try {
                const fetchedAdviser = await AdviserAPI.getAdviser(adviserId);
                const modalBody = document.getElementById('modal-body');
                if (modalBody) {
                    modalBody.innerHTML = formContent;
                    populateFormWithAdviser(fetchedAdviser);
                    setupFormHandlers(fetchedAdviser.id, buttonText, onSubmit);
                    if (typeof lucide !== 'undefined') lucide.createIcons();
                }
            } catch (error) {
                console.error('Error loading adviser:', error);
                showToast('Failed to load adviser', 'error');
                closeManageAdviserModal();
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
            const form = document.getElementById('adviserForm');
            if (form) {
                animateFormElements(form);
            }
        }, 100);

        setupFormHandlers(adviser?.id, buttonText, onSubmit);
    }
}

function populateFormWithAdviser(adviser) {
    const form = document.getElementById('adviserForm');
    if (!form) return;

    document.getElementById('adviserId').value = adviser.id;
    document.getElementById('adviserName').value = adviser.name;
    document.getElementById('adviserUsername').value = adviser.username;
    document.getElementById('adviserEmail').value = adviser.email;
    document.getElementById('adviserRole').value = adviser.role;
    document.getElementById('adviserStatus').value = adviser.status;

    if (adviser.profile_photo) {
        document.getElementById('existingImageUrl').value = adviser.profile_photo;
        document.getElementById('imageUrl').value = adviser.profile_photo;
        document.getElementById('imagePreviewContainer').innerHTML = `<img src="${adviser.profile_photo}" alt="Preview" class="w-full h-full object-cover" id="imagePreview">`;
    }

    setTimeout(() => {
        const formEl = document.getElementById('adviserForm');
        if (formEl) {
            animateFormElements(formEl);
        }
    }, 50);
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
        email: document.getElementById('adviserEmail').value.trim(),
        role: document.getElementById('adviserRole').value,
        status: document.getElementById('adviserStatus').value,
        profile_photo: imageUrl
    };


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

    const modalOverlay = document.getElementById('modal-overlay');
    const modalContent = document.getElementById('modal-content');
    if (modalOverlay && modalContent) {
        animateModalOpen(modalOverlay, modalContent, 'scale');
    }

    try {
        const adviser = await AdviserAPI.getAdviser(id);
        const dateCreated = new Date(adviser.created_at).toLocaleDateString('en-PH', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
        });

        const content = `
            <div class="space-y-5">
                <div class="flex flex-col sm:flex-row sm:items-center gap-4 bg-gray-50 rounded-lg p-4 border border-gray-100">
                    <div class="flex-shrink-0 w-24 h-24 sm:w-32 sm:h-32 rounded-lg bg-blue-900 text-blue-100 flex items-center justify-center text-sm font-bold shadow-sm overflow-hidden mx-auto sm:mx-0">
                        ${adviser.profile_photo
                            ? `<img src="${adviser.profile_photo}" alt="${adviser.name}" class="w-full h-full object-cover">`
                            : adviser.name.charAt(0).toUpperCase()
                        }
                    </div>
                    <div class="text-center sm:text-left">
                        <h3 class="text-lg font-semibold text-gray-900">${adviser.name}</h3>
                        <span class="inline-flex items-center px-2.5 py-0.5 mt-0.5 rounded-full text-xs font-medium ${adviser.role === 'head_adviser' ? 'bg-purple-50 text-purple-900 border border-purple-200' : 'bg-blue-50 text-blue-900 border border-blue-200'}">
                            ${adviser.role === 'head_adviser' ? 'Head Adviser' : 'Adviser'}
                        </span>
                    </div>
                </div>

                <div class="border-b border-gray-200 pb-4">
                    <h4 class="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Personal Information</h4>
                    <dl class="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3">
                        <div>
                            <dt class="text-xs text-gray-400 font-medium">Name</dt>
                            <dd class="text-sm font-semibold text-gray-900 mt-0.5">${adviser.name}</dd>
                        </div>
                        <div>
                            <dt class="text-xs text-gray-400 font-medium">Username</dt>
                            <dd class="text-sm font-semibold text-gray-900 mt-0.5">${adviser.username}</dd>
                        </div>
                        <div>
                            <dt class="text-xs text-gray-400 font-medium">Email</dt>
                            <dd class="text-sm font-semibold text-gray-900 mt-0.5">${adviser.email}</dd>
                        </div>
                        <div>
                            <dt class="text-xs text-gray-400 font-medium">Role</dt>
                            <dd class="text-sm font-semibold text-gray-900 mt-0.5">${adviser.role === 'head_adviser' ? 'Head Adviser' : 'Adviser'}</dd>
                        </div>
                    </dl>
                </div>

                <div class="border-b border-gray-200 pb-4">
                    <h4 class="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Account Status</h4>
                    <dl class="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3">
                        <div>
                            <dt class="text-xs text-gray-400 font-medium">Status</dt>
                            <dd class="text-sm font-semibold text-gray-900 mt-0.5">
                                <span class="px-2 py-1 text-xs font-medium rounded-full ${adviser.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}">
                                    ${adviser.status}
                                </span>
                            </dd>
                        </div>
                        <div>
                            <dt class="text-xs text-gray-400 font-medium">Created At</dt>
                            <dd class="text-sm font-semibold text-gray-900 mt-0.5">${dateCreated}</dd>
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
        console.error('Error loading adviser:', error);
        showToast('Failed to load adviser', 'error');
        closeModal();
    }
}
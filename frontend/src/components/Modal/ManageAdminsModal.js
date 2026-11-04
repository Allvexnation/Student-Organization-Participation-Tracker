import { openModal, closeModal, setModalButtonLoading } from '../../utils/modal.js';
import { openConfirmDialog } from '../Dialog/ConfirmDialog.js';
import { animateModalClose, clearModalAnimations } from '../../provider/ModalAnimation.js';
import * as AdminAPI from '../../api/admin/Admin/ManageAdmins.js';
import { showToast } from '../ToastMessage.js';
import { skeletonAdminForm, skeletonAdminView } from '../SkeletonLoading.js';
import { AdminCrudValidator } from '../../validator/AdminCrudValidator.js';
import { FIELD_CLASS, LABEL_CLASS, modalSection, modalActions, modalViewClose, modalDetailTile, modalBadge, modalHero, modalPhotoField, applyModalDomino } from './modalUi.js';

let croppedAdminImage = null;

export function openManageAdminsModal({ mode = 'add', admin = null, adminId = null, onSubmit }) {
    croppedAdminImage = null;
    const isEdit = mode === 'edit';
    const title = isEdit ? 'Edit Admin' : 'New Admin';
    const buttonText = isEdit ? 'Save Changes' : 'Add Admin';
    const existingImageUrl = isEdit && admin?.profile_photo ? admin.profile_photo : '';

    const formContent = `
        <form id="adminForm" class="manage-modal-form space-y-4">
            ${isEdit ? `<input type="hidden" id="adminId" value="${admin?.id || adminId || ''}">` : ''}
            ${isEdit ? `<input type="hidden" id="existingImageUrl" value="${existingImageUrl}">` : ''}
            ${modalSection('Photo', modalPhotoField(existingImageUrl))}
            ${modalSection('Personal Information', `
                <div class="space-y-3">
                    <div>
                        <label for="adminName" class="${LABEL_CLASS}">Name <span class="text-red-500">*</span></label>
                        <input type="text" id="adminName" name="adminName" value="${isEdit && admin ? admin.name : ''}" required placeholder="e.g. Juan Dela Cruz" class="${FIELD_CLASS}">
                    </div>
                    ${isEdit ? `
                    <div>
                        <label for="adminUsername" class="${LABEL_CLASS}">Username <span class="text-red-500">*</span></label>
                        <input type="text" id="adminUsername" name="adminUsername" value="${admin ? admin.username : ''}" required placeholder="e.g. juandelacruz" class="${FIELD_CLASS}">
                    </div>
                    ` : ''}
                    <div>
                        <label for="adminEmail" class="${LABEL_CLASS}">Email <span class="text-red-500">*</span></label>
                        <input type="email" id="adminEmail" name="adminEmail" value="${isEdit && admin ? admin.email : ''}" required placeholder="e.g. juan@example.com" class="${FIELD_CLASS}">
                    </div>
                    ${!isEdit ? `
                    <p class="text-xs text-muted bg-blue-50 border border-blue-100 rounded-xl px-3 py-2.5">
                        <i data-lucide="info" class="w-4 h-4 inline mr-1"></i>
                        Username and password will be auto-generated and sent to the admin's email.
                    </p>
                    ` : ''}
                </div>
            `)}
            ${modalSection('Role & Status', `
                <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                        <label for="adminRole" class="${LABEL_CLASS}">Role <span class="text-red-500">*</span></label>
                        <select id="adminRole" name="adminRole" required class="${FIELD_CLASS}">
                            <option value="admin" ${isEdit && admin?.role === 'admin' ? 'selected' : ''}>Admin</option>
                            <option value="super_admin" ${isEdit && admin?.role === 'super_admin' ? 'selected' : ''}>Super Admin</option>
                        </select>
                    </div>
                    <div>
                        <label for="adminStatus" class="${LABEL_CLASS}">Status <span class="text-red-500">*</span></label>
                        <select id="adminStatus" name="adminStatus" required class="${FIELD_CLASS}">
                            <option value="active" ${isEdit && admin?.status === 'active' ? 'selected' : ''}>Active</option>
                            <option value="inactive" ${isEdit && admin?.status === 'inactive' ? 'selected' : ''}>Inactive</option>
                        </select>
                    </div>
                </div>
            `)}
            <div id="formError" class="hidden text-sm text-red-700 bg-red-50 border border-red-200 rounded-xl px-3 py-2.5"></div>
            ${modalActions({ cancelOnclick: 'closeManageAdminsModal()', submitText: buttonText })}
        </form>
    `;

    if (isEdit && !admin && adminId) {
        openModal(title, skeletonAdminForm(), 'mid-large');

        setTimeout(async () => {
            try {
                const fetchedAdmin = await AdminAPI.getAdmin(adminId);
                const modalBody = document.getElementById('modal-body');
                if (modalBody) {
                    modalBody.innerHTML = formContent;
                    populateFormWithAdmin(fetchedAdmin);
                    setupFormHandlers(fetchedAdmin.id, buttonText, onSubmit);
                    applyModalDomino();
                }
            } catch (error) {
                console.error('Error loading admin:', error);
                showToast('Failed to load admin', 'error');
                closeManageAdminsModal();
            }
        }, 100);
    } else {
        openModal(title, formContent, 'mid-large');
        applyModalDomino();
        setupFormHandlers(admin?.id, buttonText, onSubmit);
    }
}

function populateFormWithAdmin(admin) {
    const form = document.getElementById('adminForm');
    if (!form) return;

    const adminIdInput = document.getElementById('adminId');
    if (adminIdInput) adminIdInput.value = admin.id;

    const adminNameInput = document.getElementById('adminName');
    if (adminNameInput) adminNameInput.value = admin.name;

    const adminUsernameInput = document.getElementById('adminUsername');
    if (adminUsernameInput) adminUsernameInput.value = admin.username;

    const adminEmailInput = document.getElementById('adminEmail');
    if (adminEmailInput) adminEmailInput.value = admin.email;

    const adminRoleInput = document.getElementById('adminRole');
    if (adminRoleInput) adminRoleInput.value = admin.role;

    const adminStatusInput = document.getElementById('adminStatus');
    if (adminStatusInput) adminStatusInput.value = admin.status;

    if (admin.profile_photo) {
        const existingImageUrlInput = document.getElementById('existingImageUrl');
        const imageUrlInput = document.getElementById('imageUrl');
        if (existingImageUrlInput) existingImageUrlInput.value = admin.profile_photo;
        if (imageUrlInput) imageUrlInput.value = admin.profile_photo;
        const imagePreviewContainer = document.getElementById('imagePreviewContainer');
        if (imagePreviewContainer) {
            imagePreviewContainer.innerHTML = `<img src="${admin.profile_photo}" alt="Preview" class="w-full h-full object-cover" id="imagePreview">`;
        }
    }

    applyModalDomino();
}

function setupFormHandlers(adminId, buttonText, onSubmit) {
    const form = document.getElementById('adminForm');
    if (form) {
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            await processAdminSubmit(adminId, buttonText, onSubmit);
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
        croppedAdminImage = null;
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
        croppedAdminImage = imageSrc;
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

async function processAdminSubmit(id, buttonText, onSubmit) {
    hideFormError();

    let imageUrl = document.getElementById('imageUrl').value;

    const isEdit = id != null;

    const formData = {
        name: document.getElementById('adminName').value.trim(),
        username: document.getElementById('adminUsername')?.value.trim() || '',
        email: document.getElementById('adminEmail').value.trim(),
        role: document.getElementById('adminRole').value,
        status: document.getElementById('adminStatus').value,
        profile_photo: imageUrl
    };

    try {
        const existingAdmins = await AdminAPI.getAllAdmins();

        const validation = AdminCrudValidator.validate(formData, existingAdmins, isEdit ? 'edit' : 'add', id);
        
        if (!validation.isValid) {
            showFormError(validation.message);
            return;
        }
    } catch (error) {
        console.error('Error validating admin:', error);
    }

    if (isEdit) {
        openConfirmDialog({
            title: 'Confirm Update',
            message: 'Are you sure you want to update this admin details?',
            confirmText: 'Update',
            cancelText: 'Cancel',
            type: 'blue',
            onConfirm: async () => {
                setModalButtonLoading('submitBtn', true, buttonText);
                try {
                    await onSubmit(id, formData);
                    closeManageAdminsModal();
                } catch (error) {
                    console.error('Error saving admin:', error);
                    showFormError('Failed to save admin. Please try again.');
                    setModalButtonLoading('submitBtn', false, buttonText);
                }
            }
        });
    } else {
        setModalButtonLoading('submitBtn', true, buttonText);
        try {
            const response = await onSubmit(id, formData);
            closeManageAdminsModal();
            if (response && response.username) {
                showToast(`Admin added successfully. Username: ${response.username}. Password sent to email.`, 'success');
            } else {
                showToast('Admin added successfully', 'success');
            }
        } catch (error) {
            console.error('Error saving admin:', error);
            showFormError('Failed to save admin. Please try again.');
            setModalButtonLoading('submitBtn', false, buttonText);
            showToast('Failed to add admin', 'error');
        }
    }
}

async function closeManageAdminsModal() {
    const modalOverlay = document.getElementById('modal-overlay');
    const modalContent = document.getElementById('modal-content');
    
    if (modalOverlay && modalContent) {
        await animateModalClose(modalOverlay, modalContent, 'scale');
        clearModalAnimations(modalOverlay, modalContent);
        modalOverlay.remove();
        document.body.classList.remove('overflow-hidden');
        document.removeEventListener('keydown', (e) => {
            if (e.key === 'Escape') closeManageAdminsModal();
        });
    } else {
        closeModal();
    }
}

window.closeManageAdminsModal = closeManageAdminsModal;

export async function openViewAdminModal(id) {
    openModal('Admin Details', skeletonAdminView(), 'mid-large');

    try {
        const admin = await AdminAPI.getAdmin(id);
        const dateCreated = new Date(admin.created_at).toLocaleDateString('en-PH', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
        });

        const content = `
            <div class="space-y-4">
                ${modalHero({
                    photo: admin.profile_photo,
                    fallback: admin.name.charAt(0).toUpperCase(),
                    name: admin.name,
                    badges: [modalBadge(admin.role === 'super_admin' ? 'Super Admin' : 'Admin', admin.role === 'super_admin' ? 'purple' : 'navy')]
                })}
                ${modalSection('Personal Information', `
                    <dl class="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                        ${modalDetailTile('Name', admin.name)}
                        ${modalDetailTile('Username', admin.username)}
                        ${modalDetailTile('Email', admin.email)}
                        ${modalDetailTile('Role', admin.role === 'super_admin' ? 'Super Admin' : 'Admin')}
                    </dl>
                `)}
                ${modalSection('Account Status', `
                    <dl class="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                        ${modalDetailTile('Status', modalBadge(admin.status, admin.status === 'active' ? 'green' : 'red'))}
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
        console.error('Error loading admin:', error);
        showToast('Failed to load admin', 'error');
        closeModal();
    }
}

import { openModal, closeModal, setModalButtonLoading } from '../../utils/modal.js';
import { openConfirmDialog } from '../Dialog/ConfirmDialog.js';
import { animateModalClose, clearModalAnimations } from '../../provider/ModalAnimation.js';
import * as StudentsAPI from '../../api/admin/Students/ManageStudents.js';
import { showToast } from '../ToastMessage.js';
import { skeletonStudentForm, skeletonStudentView } from '../SkeletonLoading.js';
import { StudentCrudValidator } from '../../validator/StudentCrudValidator.js';
import { FIELD_CLASS, LABEL_CLASS, modalSection, modalActions, modalViewClose, modalDetailTile, modalBadge, modalHero, modalPhotoField, applyModalDomino } from './modalUi.js';

let croppedStudentImage = null;

export function openManageStudentsModal({ mode = 'add', student = null, studentId = null, onSubmit }) {
    croppedStudentImage = null;
    const isEdit = mode === 'edit';
    const title = isEdit ? 'Edit Student' : 'New Student';
    const buttonText = isEdit ? 'Save Changes' : 'Add Student';
    const existingImageUrl = isEdit && student?.profile_photo ? student.profile_photo : '';

    const formContent = `
        <form id="studentForm" class="manage-modal-form space-y-4">
            ${isEdit ? `<input type="hidden" id="studentId" value="${student?.id || studentId || ''}">` : ''}
            ${isEdit && existingImageUrl ? `<input type="hidden" id="existingImageUrl" value="${existingImageUrl}">` : ''}
            ${modalSection('Photo', modalPhotoField(existingImageUrl))}
            ${modalSection('Personal Information', `
                <div class="space-y-3">
                    <div>
                        <label for="studentNumber" class="${LABEL_CLASS}">Student Number <span class="text-red-500">*</span></label>
                        <input type="text" id="studentNumber" name="studentNumber" value="${isEdit && student ? student.student_number : ''}" required
                            placeholder="e.g. 2023-00001" class="${FIELD_CLASS}">
                    </div>
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div>
                            <label for="firstName" class="${LABEL_CLASS}">First Name <span class="text-red-500">*</span></label>
                            <input type="text" id="firstName" name="firstName" value="${isEdit && student ? student.first_name : ''}" required
                                placeholder="e.g. Juan" class="${FIELD_CLASS}">
                        </div>
                        <div>
                            <label for="lastName" class="${LABEL_CLASS}">Last Name <span class="text-red-500">*</span></label>
                            <input type="text" id="lastName" name="lastName" value="${isEdit && student ? student.last_name : ''}" required
                                placeholder="e.g. Dela Cruz" class="${FIELD_CLASS}">
                        </div>
                    </div>
                </div>
            `)}
            ${modalSection('Academic Information', `
                <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                        <label for="program" class="${LABEL_CLASS}">Program <span class="text-red-500">*</span></label>
                        <input type="text" id="program" name="program" value="${isEdit && student ? student.program : ''}" required
                            placeholder="e.g. BSIT, BSCS" class="${FIELD_CLASS}">
                    </div>
                    <div>
                        <label for="yearLevel" class="${LABEL_CLASS}">Year Level <span class="text-red-500">*</span></label>
                        <select id="yearLevel" name="yearLevel" required class="${FIELD_CLASS}">
                            <option value="">Select Year Level</option>
                            <option value="1st Year" ${isEdit && student?.year_level === '1st Year' ? 'selected' : ''}>1st Year</option>
                            <option value="2nd Year" ${isEdit && student?.year_level === '2nd Year' ? 'selected' : ''}>2nd Year</option>
                            <option value="3rd Year" ${isEdit && student?.year_level === '3rd Year' ? 'selected' : ''}>3rd Year</option>
                            <option value="4th Year" ${isEdit && student?.year_level === '4th Year' ? 'selected' : ''}>4th Year</option>
                            <option value="5th Year" ${isEdit && student?.year_level === '5th Year' ? 'selected' : ''}>5th Year</option>
                        </select>
                    </div>
                </div>
            `)}
            ${modalSection('Account Information', `
                <div class="space-y-3">
                    ${isEdit ? `
                    <div>
                        <label for="username" class="${LABEL_CLASS}">Username <span class="text-red-500">*</span></label>
                        <input type="text" id="username" name="username" value="${isEdit && student ? student.username : ''}" required
                            placeholder="e.g. juandelacruz" class="${FIELD_CLASS}">
                    </div>
                    ` : ``}
                    <div>
                        <label for="email" class="${LABEL_CLASS}">Email <span class="text-red-500">*</span></label>
                        <input type="email" id="email" name="email" value="${isEdit && student ? student.email : ''}" required
                            placeholder="e.g. juan@example.com" class="${FIELD_CLASS}">
                    </div>
                    ${!isEdit ? `
                    <p class="text-xs text-muted bg-blue-50 border border-blue-100 rounded-xl px-3 py-2.5">
                        <i data-lucide="info" class="w-4 h-4 inline mr-1"></i>
                        Username and password will be auto-generated and sent to the student's email.
                    </p>
                    ` : ``}
                </div>
            `)}
            <div id="formError" class="hidden text-sm text-red-700 bg-red-50 border border-red-200 rounded-xl px-3 py-2.5"></div>
            ${modalActions({ cancelOnclick: 'closeManageStudentsModal()', submitText: buttonText })}
        </form>
    `;

    if (isEdit && !student && studentId) {
        openModal(title, skeletonStudentForm(), 'mid-large');

        setTimeout(async () => {
            try {
                const fetchedStudent = await StudentsAPI.getStudent(studentId);
                const modalBody = document.getElementById('modal-body');
                if (modalBody) {
                    modalBody.innerHTML = formContent;
                    populateFormWithStudent(fetchedStudent);
                    setupFormHandlers(fetchedStudent.id, buttonText, onSubmit);
                    applyModalDomino();
                }
            } catch (error) {
                console.error('Error loading student:', error);
                showToast('Failed to load student', 'error');
                closeManageStudentsModal();
            }
        }, 100);
    } else {
        openModal(title, formContent, 'mid-large');
        applyModalDomino();
        setupFormHandlers(student?.id, buttonText, onSubmit);
    }
}

function populateFormWithStudent(student) {
    const form = document.getElementById('studentForm');
    if (!form) return;

    const setVal = (id, value) => {
        const el = document.getElementById(id);
        if (el) {
            el.value = value || '';
        }
    };

    let studentIdEl = document.getElementById('studentId');
    if (!studentIdEl) {
        studentIdEl = document.createElement('input');
        studentIdEl.type = 'hidden';
        studentIdEl.id = 'studentId';
        form.prepend(studentIdEl);
    }
    studentIdEl.value = student.id;

    setVal('studentNumber', student.student_number);
    setVal('firstName', student.first_name);
    setVal('lastName', student.last_name);
    setVal('program', student.program);
    setVal('yearLevel', student.year_level);
    setVal('username', student.username);
    setVal('email', student.email);

    if (student.profile_photo) {
        let existingImgEl = document.getElementById('existingImageUrl');
        if (!existingImgEl) {
            existingImgEl = document.createElement('input');
            existingImgEl.type = 'hidden';
            existingImgEl.id = 'existingImageUrl';
            form.prepend(existingImgEl);
        }
        existingImgEl.value = student.profile_photo;

        setVal('imageUrl', student.profile_photo);

        const previewContainer = document.getElementById('imagePreviewContainer');
        if (previewContainer) {
            previewContainer.innerHTML = `<img src="${student.profile_photo}" alt="Preview" class="w-full h-full object-cover" id="imagePreview">`;
        }
    }

    applyModalDomino();
}

function setupFormHandlers(studentId, buttonText, onSubmit) {
    const form = document.getElementById('studentForm');
    if (form) {
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            await processStudentSubmit(studentId, buttonText, onSubmit);
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
            previewContainer.innerHTML = `<i data-lucide="user" class="w-8 h-8 text-muted" id="imagePreviewIcon"></i>`;
            imageUrlInput.value = '';
        }
        croppedStudentImage = null;
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
        croppedStudentImage = imageSrc;
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

async function processStudentSubmit(id, buttonText, onSubmit) {
    hideFormError();

    let imageUrl = document.getElementById('imageUrl').value;

    const isEdit = id != null;

    const formData = {
        student_number: document.getElementById('studentNumber').value.trim(),
        first_name: document.getElementById('firstName').value.trim(),
        last_name: document.getElementById('lastName').value.trim(),
        program: document.getElementById('program').value.trim(),
        year_level: document.getElementById('yearLevel').value,
        email: document.getElementById('email').value.trim(),
        profile_photo: imageUrl
    };

    if (isEdit) {
        const usernameEl = document.getElementById('username');
        if (usernameEl) {
            formData.username = usernameEl.value.trim();
        }
    }

    try {
        const existingStudents = await StudentsAPI.getAllStudents();

        const validation = StudentCrudValidator.validate(formData, existingStudents, isEdit ? 'edit' : 'add', id);
        
        if (!validation.isValid) {
            showFormError(validation.message);
            return;
        }
    } catch (error) {
        console.error('Error validating student:', error);
    }

    if (isEdit) {
        openConfirmDialog({
            title: 'Confirm Update',
            message: 'Are you sure you want to update this student details?',
            confirmText: 'Update',
            cancelText: 'Cancel',
            type: 'blue',
            onConfirm: async () => {
                setModalButtonLoading('submitBtn', true, buttonText);
                try {
                    await onSubmit(id, formData);
                    closeManageStudentsModal();
                    showToast('Student updated successfully', 'success');
                } catch (error) {
                    console.error('Error saving student:', error);
                    showFormError('Failed to save student. Please try again.');
                    setModalButtonLoading('submitBtn', false, buttonText);
                    showToast('Failed to update student', 'error');
                }
            }
        });
    } else {
        setModalButtonLoading('submitBtn', true, buttonText);
        try {
            const response = await onSubmit(id, formData);
            closeManageStudentsModal();
            if (response && response.username) {
                showToast(`Student added successfully. Username: ${response.username}. Password sent to email.`, 'success');
            } else {
                showToast('Student added successfully', 'success');
            }
        } catch (error) {
            console.error('Error saving student:', error);
            showFormError('Failed to save student. Please try again.');
            setModalButtonLoading('submitBtn', false, buttonText);
            showToast('Failed to add student', 'error');
        }
    }
}

async function closeManageStudentsModal() {
    const modalOverlay = document.getElementById('modal-overlay');
    const modalContent = document.getElementById('modal-content');
    
    if (modalOverlay && modalContent) {
        await animateModalClose(modalOverlay, modalContent, 'scale');
        clearModalAnimations(modalOverlay, modalContent);
        modalOverlay.remove();
        document.body.classList.remove('overflow-hidden');
        document.removeEventListener('keydown', (e) => {
            if (e.key === 'Escape') closeManageStudentsModal();
        });
    } else {
        closeModal();
    }
}

window.closeManageStudentsModal = closeManageStudentsModal;

export async function openViewStudentsModal(id) {
    openModal('Student Details', skeletonStudentView(), 'mid-large');

    try {
        const student = await StudentsAPI.getStudent(id);
        const dateCreated = new Date(student.created_at).toLocaleDateString('en-PH', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
        });

        const content = `
            <div class="space-y-4">
                ${modalHero({
                    photo: student.profile_photo,
                    fallback: `${student.first_name.charAt(0)}${student.last_name.charAt(0)}`,
                    name: `${student.first_name} ${student.last_name}`,
                    subtitle: student.student_number,
                    badges: [modalBadge(student.year_level, 'navy')]
                })}
                ${modalSection('Personal Information', `
                    <dl class="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                        ${modalDetailTile('Student Number', student.student_number)}
                        ${modalDetailTile('Full Name', `${student.first_name} ${student.last_name}`)}
                        ${modalDetailTile('Username', student.username)}
                        ${modalDetailTile('Email', student.email)}
                    </dl>
                `)}
                ${modalSection('Academic Information', `
                    <dl class="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                        ${modalDetailTile('Program', student.program)}
                        ${modalDetailTile('Year Level', student.year_level)}
                    </dl>
                `)}
                ${modalSection('Account Details', `
                    <dl class="grid grid-cols-1 md:grid-cols-2 gap-2.5">
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
        console.error('Error loading student:', error);
        showToast('Failed to load student', 'error');
        closeModal();
    }
}

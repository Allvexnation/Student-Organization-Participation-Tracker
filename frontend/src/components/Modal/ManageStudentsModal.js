import { openModal, closeModal, setModalButtonLoading } from '../../utils/modal.js';
import { openConfirmDialog } from '../Dialog/ConfirmDialog.js';
import { animateModalOpen, animateModalClose, clearModalAnimations, animateFormElements, clearFormAnimations, animateViewModalElements } from '../../provider/ModalAnimation.js';
import * as StudentsAPI from '../../api/admin/Students/ManageStudents.js';
import { showToast } from '../ToastMessage.js';
import { skeletonStudentForm, skeletonStudentView } from '../SkeletonLoading.js';

let croppedStudentImage = null;

export function openManageStudentsModal({ mode = 'add', student = null, studentId = null, onSubmit }) {
    croppedStudentImage = null;
    const isEdit = mode === 'edit';
    const title = isEdit ? 'Edit Student' : 'New Student';
    const buttonText = isEdit ? 'Save Changes' : 'Add Student';
    const existingImageUrl = isEdit && student?.profile_photo ? student.profile_photo : '';

    const formContent = `
        <form id="studentForm" class="space-y-5">
            ${isEdit ? `<input type="hidden" id="studentId" value="${student?.id || studentId || ''}">` : ''}
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
                        <label for="studentNumber" class="block text-sm font-medium text-gray-700 mb-1">Student Number <span class="text-red-500">*</span></label>
                        <input type="text" id="studentNumber" name="studentNumber" value="${isEdit && student ? student.student_number : ''}" required
                            placeholder="e.g. 2023-00001"
                            class="w-full px-3 py-2 text-sm border border-gray-200 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent transition">
                    </div>
                    <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                            <label for="firstName" class="block text-sm font-medium text-gray-700 mb-1">First Name <span class="text-red-500">*</span></label>
                            <input type="text" id="firstName" name="firstName" value="${isEdit && student ? student.first_name : ''}" required
                                placeholder="e.g. Juan"
                                class="w-full px-3 py-2 text-sm border border-gray-200 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent transition">
                        </div>
                        <div>
                            <label for="lastName" class="block text-sm font-medium text-gray-700 mb-1">Last Name <span class="text-red-500">*</span></label>
                            <input type="text" id="lastName" name="lastName" value="${isEdit && student ? student.last_name : ''}" required
                                placeholder="e.g. Dela Cruz"
                                class="w-full px-3 py-2 text-sm border border-gray-200 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent transition">
                        </div>
                    </div>
                </div>
            </fieldset>

            <hr class="border-gray-100">

            <fieldset>
                <legend class="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Academic Information</legend>
                <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                        <label for="program" class="block text-sm font-medium text-gray-700 mb-1">Program <span class="text-red-500">*</span></label>
                        <input type="text" id="program" name="program" value="${isEdit && student ? student.program : ''}" required
                            placeholder="e.g. BSIT, BSCS"
                            class="w-full px-3 py-2 text-sm border border-gray-200 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent transition">
                    </div>
                    <div>
                        <label for="yearLevel" class="block text-sm font-medium text-gray-700 mb-1">Year Level <span class="text-red-500">*</span></label>
                        <select id="yearLevel" name="yearLevel" required
                            class="w-full px-3 py-2 text-sm border border-gray-200 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white transition">
                            <option value="">Select Year Level</option>
                            <option value="1st Year" ${isEdit && student?.year_level === '1st Year' ? 'selected' : ''}>1st Year</option>
                            <option value="2nd Year" ${isEdit && student?.year_level === '2nd Year' ? 'selected' : ''}>2nd Year</option>
                            <option value="3rd Year" ${isEdit && student?.year_level === '3rd Year' ? 'selected' : ''}>3rd Year</option>
                            <option value="4th Year" ${isEdit && student?.year_level === '4th Year' ? 'selected' : ''}>4th Year</option>
                            <option value="5th Year" ${isEdit && student?.year_level === '5th Year' ? 'selected' : ''}>5th Year</option>
                        </select>
                    </div>
                </div>
            </fieldset>

            <hr class="border-gray-100">

            <fieldset>
                <legend class="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Account Information</legend>
                <div class="space-y-3">
                    <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                            <label for="username" class="block text-sm font-medium text-gray-700 mb-1">Username <span class="text-red-500">*</span></label>
                            <input type="text" id="username" name="username" value="${isEdit && student ? student.username : ''}" required
                                placeholder="e.g. juandelacruz"
                                class="w-full px-3 py-2 text-sm border border-gray-200 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent transition">
                        </div>
                        <div>
                            <label for="email" class="block text-sm font-medium text-gray-700 mb-1">Email <span class="text-red-500">*</span></label>
                            <input type="email" id="email" name="email" value="${isEdit && student ? student.email : ''}" required
                                placeholder="e.g. juan@example.com"
                                class="w-full px-3 py-2 text-sm border border-gray-200 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent transition">
                        </div>
                    </div>
                    <div>
                        <label for="password" class="block text-sm font-medium text-gray-700 mb-1">Password ${!isEdit ? '<span class="text-red-500">*</span>' : ''}</label>
                        <input type="password" id="password" name="password" ${!isEdit ? 'required' : ''}
                            placeholder="${isEdit ? 'Leave blank to keep existing password' : 'Enter password'}"
                            class="w-full px-3 py-2 text-sm border border-gray-200 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent transition">
                        ${isEdit ? '<p class="text-xs text-gray-400 mt-1">Leave blank to keep existing password</p>' : ''}
                    </div>
                </div>
            </fieldset>

            <div id="formError" class="hidden text-sm text-red-600 bg-red-50 border border-red-200 rounded-md px-3 py-2"></div>

            <div class="flex justify-end pt-3 border-t border-gray-100 flex-row gap-2">
                <button 
                    type="button" 
                    onclick="closeManageStudentsModal()" 
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

    if (isEdit && !student && studentId) {
        openModal(title, skeletonStudentForm(), 'mid-large');

        const modalOverlay = document.getElementById('modal-overlay');
        const modalContent = document.getElementById('modal-content');
        if (modalOverlay && modalContent) {
            animateModalOpen(modalOverlay, modalContent, 'scale');
        }

        setTimeout(async () => {
            try {
                const fetchedStudent = await StudentsAPI.getStudent(studentId);
                const modalBody = document.getElementById('modal-body');
                if (modalBody) {
                    modalBody.innerHTML = formContent;
                    populateFormWithStudent(fetchedStudent);
                    setupFormHandlers(fetchedStudent.id, buttonText, onSubmit);
                    if (typeof lucide !== 'undefined') lucide.createIcons();
                }
            } catch (error) {
                console.error('Error loading student:', error);
                showToast('Failed to load student', 'error');
                closeManageStudentsModal();
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
            const form = document.getElementById('studentForm');
            if (form) {
                animateFormElements(form);
            }
        }, 100);

        setupFormHandlers(student?.id, buttonText, onSubmit);
    }
}

function populateFormWithStudent(student) {
    const form = document.getElementById('studentForm');
    if (!form) return;

    document.getElementById('studentId').value = student.id;
    document.getElementById('studentNumber').value = student.student_number;
    document.getElementById('firstName').value = student.first_name;
    document.getElementById('lastName').value = student.last_name;
    document.getElementById('program').value = student.program;
    document.getElementById('yearLevel').value = student.year_level;
    document.getElementById('username').value = student.username;
    document.getElementById('email').value = student.email;

    if (student.profile_photo) {
        document.getElementById('existingImageUrl').value = student.profile_photo;
        document.getElementById('imageUrl').value = student.profile_photo;
        document.getElementById('imagePreviewContainer').innerHTML = `<img src="${student.profile_photo}" alt="Preview" class="w-full h-full object-cover" id="imagePreview">`;
    }

    setTimeout(() => {
        const formEl = document.getElementById('studentForm');
        if (formEl) {
            animateFormElements(formEl);
        }
    }, 50);
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
            previewContainer.innerHTML = `<i data-lucide="user" class="w-8 h-8 text-gray-400" id="imagePreviewIcon"></i>`;
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

    const formData = {
        student_number: document.getElementById('studentNumber').value.trim(),
        first_name: document.getElementById('firstName').value.trim(),
        last_name: document.getElementById('lastName').value.trim(),
        program: document.getElementById('program').value.trim(),
        year_level: document.getElementById('yearLevel').value,
        username: document.getElementById('username').value.trim(),
        email: document.getElementById('email').value.trim(),
        password: document.getElementById('password').value,
        profile_photo: imageUrl
    };

    const isEdit = id != null;

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
            await onSubmit(id, formData);
            closeManageStudentsModal();
            showToast('Student added successfully', 'success');
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

    const modalOverlay = document.getElementById('modal-overlay');
    const modalContent = document.getElementById('modal-content');
    if (modalOverlay && modalContent) {
        animateModalOpen(modalOverlay, modalContent, 'scale');
    }

    try {
        const student = await StudentsAPI.getStudent(id);
        const dateCreated = new Date(student.created_at).toLocaleDateString('en-PH', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
        });

        const content = `
            <div class="space-y-5">
                <div class="flex flex-col sm:flex-row sm:items-center gap-4 bg-gray-50 rounded-lg p-4 border border-gray-100">
                    <div class="flex-shrink-0 w-24 h-24 sm:w-32 sm:h-32 rounded-lg bg-blue-900 text-blue-100 flex items-center justify-center text-sm font-bold shadow-sm overflow-hidden mx-auto sm:mx-0">
                        ${student.profile_photo 
                            ? `<img src="${student.profile_photo}" alt="${student.first_name} ${student.last_name}" class="w-full h-full object-cover">` 
                            : `${student.first_name.charAt(0)}${student.last_name.charAt(0)}`
                        }
                    </div>
                    <div class="text-center sm:text-left">
                        <h3 class="text-lg font-semibold text-gray-900">${student.first_name} ${student.last_name}</h3>
                        <p class="text-sm text-gray-500 mt-0.5">${student.student_number}</p>
                        <span class="inline-flex items-center px-2.5 py-0.5 mt-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-900 border border-blue-200">
                            ${student.year_level}
                        </span>
                    </div>
                </div>

                <div class="border-b border-gray-200 pb-4">
                    <h4 class="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Personal Information</h4>
                    <dl class="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3">
                        <div>
                            <dt class="text-xs text-gray-400 font-medium">Student Number</dt>
                            <dd class="text-sm font-semibold text-gray-900 mt-0.5">${student.student_number}</dd>
                        </div>
                        <div>
                            <dt class="text-xs text-gray-400 font-medium">Full Name</dt>
                            <dd class="text-sm font-semibold text-gray-900 mt-0.5">${student.first_name} ${student.last_name}</dd>
                        </div>
                        <div>
                            <dt class="text-xs text-gray-400 font-medium">Username</dt>
                            <dd class="text-sm font-semibold text-gray-900 mt-0.5">${student.username}</dd>
                        </div>
                        <div>
                            <dt class="text-xs text-gray-400 font-medium">Email</dt>
                            <dd class="text-sm font-semibold text-gray-900 mt-0.5">${student.email}</dd>
                        </div>
                    </dl>
                </div>

                <div class="border-b border-gray-200 pb-4">
                    <h4 class="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Academic Information</h4>
                    <dl class="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3">
                        <div>
                            <dt class="text-xs text-gray-400 font-medium">Program</dt>
                            <dd class="text-sm font-semibold text-gray-900 mt-0.5">${student.program}</dd>
                        </div>
                        <div>
                            <dt class="text-xs text-gray-400 font-medium">Year Level</dt>
                            <dd class="text-sm font-semibold text-gray-900 mt-0.5">${student.year_level}</dd>
                        </div>
                    </dl>
                </div>

                <div class="border-b border-gray-200 pb-4">
                    <h4 class="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Account Details</h4>
                    <dl class="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3">
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
        console.error('Error loading student:', error);
        showToast('Failed to load student', 'error');
        closeModal();
    }
}

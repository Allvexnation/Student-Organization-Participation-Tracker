import { openModal, closeModal, setModalButtonLoading } from '../../utils/modal.js';
import { openConfirmDialog } from '../Dialog/ConfirmDialog.js';
import { animateModalOpen, animateModalClose, clearModalAnimations, animateFormElements, clearFormAnimations, animateViewModalElements } from '../../provider/ModalAnimation.js';
import * as EventRegistAPI from '../../api/admin/EventRegistrations/ManageEventRegist.js';
import * as EventsAPI from '../../api/admin/Events/ManageEvents.js';
import * as StudentsAPI from '../../api/admin/Students/ManageStudents.js';
import { showToast } from '../ToastMessage.js';
import { skeletonEventRegistForm, skeletonEventRegistView } from '../SkeletonLoading.js';

export function openManageEventRegistModal({ mode = 'add', registration = null, registrationId = null, onSubmit }) {
    const isEdit = mode === 'edit';
    const title = isEdit ? 'Edit Registration' : 'New Registration';
    const buttonText = isEdit ? 'Save Changes' : 'Add Registration';

    const formContent = `
        <form id="eventRegistForm" class="space-y-5">
            ${isEdit ? `<input type="hidden" id="eventRegistId" value="${registration?.id || registrationId || ''}">` : ''}

            <fieldset>
                <legend class="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Registration Details</legend>
                <div class="space-y-3">
                    <div>
                        <label for="eventId" class="block text-sm font-medium text-gray-700 mb-1">Event <span class="text-red-500">*</span></label>
                        <select id="eventId" name="eventId" required
                            class="w-full px-3 py-2 text-sm border border-gray-200 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white transition">
                            <option value="">Select Event</option>
                        </select>
                    </div>
                    <div>
                        <label for="studentId" class="block text-sm font-medium text-gray-700 mb-1">Student <span class="text-red-500">*</span></label>
                        <select id="studentId" name="studentId" required
                            class="w-full px-3 py-2 text-sm border border-gray-200 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white transition">
                            <option value="">Select Student</option>
                        </select>
                    </div>
                </div>
            </fieldset>

            <div id="formError" class="hidden text-sm text-red-600 bg-red-50 border border-red-200 rounded-md px-3 py-2"></div>

            <div class="flex justify-end pt-3 border-t border-gray-100 flex-row gap-2">
                <button 
                    type="button" 
                    onclick="closeManageEventRegistModal()" 
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

    if (isEdit && !registration && registrationId) {
        openModal(title, skeletonEventRegistForm(), 'mid-large');

        const modalOverlay = document.getElementById('modal-overlay');
        const modalContent = document.getElementById('modal-content');
        if (modalOverlay && modalContent) {
            animateModalOpen(modalOverlay, modalContent, 'scale');
        }

        setTimeout(async () => {
            try {
                const fetchedRegist = await EventRegistAPI.getEventRegistration(registrationId);
                const modalBody = document.getElementById('modal-body');
                if (modalBody) {
                    modalBody.innerHTML = formContent;
                    populateFormWithRegist(fetchedRegist);
                    setupFormHandlers(fetchedRegist.id, buttonText, onSubmit);
                }
            } catch (error) {
                console.error('Error loading registration:', error);
                showToast('Failed to load registration', 'error');
                closeManageEventRegistModal();
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
            const form = document.getElementById('eventRegistForm');
            if (form) {
                animateFormElements(form);
            }
        }, 100);

        setupFormHandlers(registration?.id, buttonText, onSubmit);
    }
}

function populateFormWithRegist(registration) {
    const form = document.getElementById('eventRegistForm');
    if (!form) return;

    document.getElementById('eventRegistId').value = registration.id;

    setTimeout(() => {
        const formEl = document.getElementById('eventRegistForm');
        if (formEl) {
            animateFormElements(formEl);
        }
    }, 50);

    Promise.all([loadEvents(registration.event_id), loadStudents(registration.student_id)]);
}

function setupFormHandlers(registId, buttonText, onSubmit) {
    const form = document.getElementById('eventRegistForm');
    if (form) {
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            await processEventRegistSubmit(registId, buttonText, onSubmit);
        });
    }

    if (!registId) {
        Promise.all([loadEvents(), loadStudents()]);
    }
}

async function loadEvents(selectedEventId = null) {
    try {
        const cachedData = localStorage.getItem('cachedEvents');
        let events;
        
        if (cachedData) {
            try {
                events = JSON.parse(cachedData);
            } catch (e) {
                console.error('Error parsing cached events:', e);
                events = await EventsAPI.getAllEvents();
                localStorage.setItem('cachedEvents', JSON.stringify(events));
                localStorage.setItem('cachedEventsTimestamp', Date.now().toString());
            }
        } else {
            events = await EventsAPI.getAllEvents();
            localStorage.setItem('cachedEvents', JSON.stringify(events));
            localStorage.setItem('cachedEventsTimestamp', Date.now().toString());
        }
        
        const eventSelect = document.getElementById('eventId');
        if (eventSelect) {
            eventSelect.innerHTML = '<option value="">Select Event</option>';
            events.forEach(event => {
                const option = document.createElement('option');
                option.value = event.id;
                option.textContent = event.title;
                if (selectedEventId && selectedEventId == event.id) {
                    option.selected = true;
                }
                eventSelect.appendChild(option);
            });
        }
    } catch (error) {
        console.error('Error loading events:', error);
        showToast('Failed to load events', 'error');
    }
}

async function loadStudents(selectedStudentId = null) {
    try {
        const cachedData = localStorage.getItem('cachedStudents');
        let students;
        
        if (cachedData) {
            try {
                students = JSON.parse(cachedData);
            } catch (e) {
                console.error('Error parsing cached students:', e);
                students = await StudentsAPI.getAllStudents();
                localStorage.setItem('cachedStudents', JSON.stringify(students));
                localStorage.setItem('cachedStudentsTimestamp', Date.now().toString());
            }
        } else {
            students = await StudentsAPI.getAllStudents();
            localStorage.setItem('cachedStudents', JSON.stringify(students));
            localStorage.setItem('cachedStudentsTimestamp', Date.now().toString());
        }
        
        const studentSelect = document.getElementById('studentId');
        if (studentSelect) {
            studentSelect.innerHTML = '<option value="">Select Student</option>';
            students.forEach(student => {
                const option = document.createElement('option');
                option.value = student.id;
                option.textContent = `${student.first_name} ${student.last_name}`;
                if (selectedStudentId && selectedStudentId == student.id) {
                    option.selected = true;
                }
                studentSelect.appendChild(option);
            });
        }
    } catch (error) {
        console.error('Error loading students:', error);
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

async function processEventRegistSubmit(id, buttonText, onSubmit) {
    hideFormError();

    const formData = {
        event_id: document.getElementById('eventId').value,
        student_id: document.getElementById('studentId').value
    };

    const isEdit = id !== null;

    if (isEdit) {
        openConfirmDialog({
            title: 'Confirm Update',
            message: 'Are you sure you want to update this registration?',
            confirmText: 'Update',
            cancelText: 'Cancel',
            type: 'blue',
            onConfirm: async () => {
                setModalButtonLoading('submitBtn', true, buttonText);
                try {
                    await onSubmit(id, formData);
                    closeManageEventRegistModal();
                    showToast('Registration updated successfully', 'success');
                } catch (error) {
                    console.error('Error saving registration:', error);
                    showFormError('Failed to save registration. Please try again.');
                    setModalButtonLoading('submitBtn', false, buttonText);
                    showToast('Failed to update registration', 'error');
                }
            }
        });
    } else {
        setModalButtonLoading('submitBtn', true, buttonText);
        try {
            await onSubmit(id, formData);
            closeManageEventRegistModal();
            showToast('Registration added successfully', 'success');
        } catch (error) {
            console.error('Error saving registration:', error);
            showFormError('Failed to save registration. Please try again.');
            setModalButtonLoading('submitBtn', false, buttonText);
            showToast('Failed to add registration', 'error');
        }
    }
}

async function closeManageEventRegistModal() {
    const modalOverlay = document.getElementById('modal-overlay');
    const modalContent = document.getElementById('modal-content');
    
    if (modalOverlay && modalContent) {
        await animateModalClose(modalOverlay, modalContent, 'scale');
        clearModalAnimations(modalOverlay, modalContent);
        modalOverlay.remove();
        document.removeEventListener('keydown', (e) => {
            if (e.key === 'Escape') closeManageEventRegistModal();
        });
    } else {
        closeModal();
    }
}

window.closeManageEventRegistModal = closeManageEventRegistModal;

export async function openViewEventRegistModal(id) {
    openModal('Registration Details', skeletonEventRegistView(), 'mid-large');

    const modalOverlay = document.getElementById('modal-overlay');
    const modalContent = document.getElementById('modal-content');
    if (modalOverlay && modalContent) {
        animateModalOpen(modalOverlay, modalContent, 'scale');
    }

    try {
        const registration = await EventRegistAPI.getEventRegistration(id);
        const registeredAt = registration.registered_at ? new Date(registration.registered_at).toLocaleString('en-PH', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        }) : 'N/A';
        const createdAt = registration.created_at ? new Date(registration.created_at).toLocaleDateString('en-PH', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
        }) : 'N/A';
        const updatedAt = registration.updated_at ? new Date(registration.updated_at).toLocaleDateString('en-PH', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
        }) : 'N/A';

        const content = `
            <div class="space-y-5">
                <div class="flex flex-col sm:flex-row sm:items-center gap-4 bg-gray-50 rounded-lg p-4 border border-gray-100">
                    <div class="flex-shrink-0 w-24 h-24 sm:w-32 sm:h-32 rounded-lg bg-blue-900 text-blue-100 flex items-center justify-center text-2xl font-bold shadow-sm mx-auto sm:mx-0">
                        <i data-lucide="user-check" class="w-12 h-12"></i>
                    </div>
                    <div class="text-center sm:text-left">
                        <h3 class="text-lg font-semibold text-gray-900">${registration.student_name || 'N/A'}</h3>
                        <p class="text-sm text-gray-500 mt-0.5">${registration.event_title || 'N/A'}</p>
                        <span class="inline-flex items-center px-2.5 py-0.5 mt-0.5 rounded-full text-xs font-medium bg-green-50 text-green-900 border border-gray-200">
                            Registered
                        </span>
                    </div>
                </div>

                <div class="border-b border-gray-200 pb-4">
                    <h4 class="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Registration Details</h4>
                    <dl class="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3">
                        <div>
                            <dt class="text-xs text-gray-400 font-medium">Event</dt>
                            <dd class="text-sm font-semibold text-gray-900 mt-0.5">${registration.event_title || 'N/A'}</dd>
                        </div>
                        <div>
                            <dt class="text-xs text-gray-400 font-medium">Student</dt>
                            <dd class="text-sm font-semibold text-gray-900 mt-0.5">${registration.student_name || 'N/A'}</dd>
                        </div>
                        <div>
                            <dt class="text-xs text-gray-400 font-medium">Organization</dt>
                            <dd class="text-sm font-semibold text-gray-900 mt-0.5">${registration.organization_name || 'N/A'}</dd>
                        </div>
                        <div>
                            <dt class="text-xs text-gray-400 font-medium">Registered At</dt>
                            <dd class="text-sm font-semibold text-gray-900 mt-0.5">${registeredAt}</dd>
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
            if (typeof lucide !== 'undefined') {
                lucide.createIcons();
            }
        }, 50);
    } catch (error) {
        console.error('Error loading registration:', error);
        showToast('Failed to load registration', 'error');
        closeModal();
    }
}

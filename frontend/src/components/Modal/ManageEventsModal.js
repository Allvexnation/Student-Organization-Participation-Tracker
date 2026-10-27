import { openModal, closeModal, setModalButtonLoading } from '../../utils/modal.js';
import { openConfirmDialog } from '../Dialog/ConfirmDialog.js';
import { animateModalOpen, animateModalClose, clearModalAnimations, animateFormElements, clearFormAnimations, animateViewModalElements } from '../../provider/ModalAnimation.js';
import * as EventsAPI from '../../api/admin/Events/ManageEvents.js';
import * as OrganizationsAPI from '../../api/admin/Organizations/ManageOrganizations.js';
import { showToast } from '../ToastMessage.js';
import { skeletonEventForm, skeletonEventView } from '../SkeletonLoading.js';

export function openManageEventsModal({ mode = 'add', event = null, eventId = null, onSubmit }) {
    const isEdit = mode === 'edit';
    const title = isEdit ? 'Edit Event' : 'New Event';
    const buttonText = isEdit ? 'Save Changes' : 'Add Event';

    const formContent = `
        <form id="eventForm" class="space-y-5">
            ${isEdit ? `<input type="hidden" id="eventId" value="${event?.id || eventId || ''}">` : ''}

            <fieldset>
                <legend class="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Event Details</legend>
                <div class="space-y-3">
                    <div>
                        <label for="eventTitle" class="block text-sm font-medium text-gray-700 mb-1">Event Title <span class="text-red-500">*</span></label>
                        <input type="text" id="eventTitle" name="eventTitle" value="${isEdit && event ? event.title : ''}" required
                            placeholder="e.g. Annual General Assembly"
                            class="w-full px-3 py-2 text-sm border border-gray-200 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent transition">
                    </div>
                    <div>
                        <label for="eventDescription" class="block text-sm font-medium text-gray-700 mb-1">Description</label>
                        <textarea id="eventDescription" name="eventDescription" rows="3"
                            placeholder="Detailed description of the event"
                            class="w-full px-3 py-2 text-sm border border-gray-200 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent transition resize-none">${isEdit && event ? event.description : ''}</textarea>
                    </div>
                </div>
            </fieldset>

            <hr class="border-gray-100">

            <fieldset>
                <legend class="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Event Information</legend>
                <div class="space-y-3">
                    <div>
                        <label for="organizationId" class="block text-sm font-medium text-gray-700 mb-1">Organization <span class="text-red-500">*</span></label>
                        <select id="organizationId" name="organizationId" required
                            class="w-full px-3 py-2 text-sm border border-gray-200 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white transition">
                            <option value="">Select Organization</option>
                        </select>
                    </div>
                    <div>
                        <label for="eventDate" class="block text-sm font-medium text-gray-700 mb-1">Event Date <span class="text-red-500">*</span></label>
                        <input type="datetime-local" id="eventDate" name="eventDate" value="${isEdit && event ? event.event_date : ''}" required
                            class="w-full px-3 py-2 text-sm border border-gray-200 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent transition">
                    </div>
                    <div>
                        <label for="eventVenue" class="block text-sm font-medium text-gray-700 mb-1">Venue</label>
                        <input type="text" id="eventVenue" name="eventVenue" value="${isEdit && event ? event.venue : ''}"
                            placeholder="e.g. Main Auditorium, Online via Zoom"
                            class="w-full px-3 py-2 text-sm border border-gray-200 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent transition">
                    </div>
                    <div>
                        <label for="eventCategory" class="block text-sm font-medium text-gray-700 mb-1">Event Category <span class="text-red-500">*</span></label>
                        <select id="eventCategory" name="eventCategory" required
                            class="w-full px-3 py-2 text-sm border border-gray-200 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white transition">
                            <option value="">Select Category</option>
                            <option value="Seminar" ${isEdit && event?.event_category === 'Seminar' ? 'selected' : ''}>Seminar</option>
                            <option value="Outreach" ${isEdit && event?.event_category === 'Outreach' ? 'selected' : ''}>Outreach</option>
                            <option value="General Assembly" ${isEdit && event?.event_category === 'General Assembly' ? 'selected' : ''}>General Assembly</option>
                            <option value="Workshop" ${isEdit && event?.event_category === 'Workshop' ? 'selected' : ''}>Workshop</option>
                            <option value="Competition" ${isEdit && event?.event_category === 'Competition' ? 'selected' : ''}>Competition</option>
                            <option value="Social Event" ${isEdit && event?.event_category === 'Social Event' ? 'selected' : ''}>Social Event</option>
                            <option value="Other" ${isEdit && event?.event_category && !['Seminar', 'Outreach', 'General Assembly', 'Workshop', 'Competition', 'Social Event'].includes(event.event_category) ? 'selected' : ''}>Other</option>
                        </select>
                    </div>
                    <div id="customCategoryContainer" class="${isEdit && event?.event_category && !['Seminar', 'Outreach', 'General Assembly', 'Workshop', 'Competition', 'Social Event'].includes(event.event_category) ? '' : 'hidden'}">
                        <label for="customCategory" class="block text-sm font-medium text-gray-700 mb-1">Specify Category <span class="text-red-500">*</span></label>
                        <input type="text" id="customCategory" name="customCategory" value="${isEdit && event?.event_category && !['Seminar', 'Outreach', 'General Assembly', 'Workshop', 'Competition', 'Social Event'].includes(event.event_category) ? event.event_category : ''}"
                            placeholder="e.g. Sports Competition, Cultural Event"
                            class="w-full px-3 py-2 text-sm border border-gray-200 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent transition">
                    </div>
                </div>
            </fieldset>

            <div id="formError" class="hidden text-sm text-red-600 bg-red-50 border border-red-200 rounded-md px-3 py-2"></div>

            <div class="flex justify-end pt-3 border-t border-gray-100 flex-row gap-2">
                <button 
                    type="button" 
                    onclick="closeManageEventsModal()" 
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

    if (isEdit && !event && eventId) {
        openModal(title, skeletonEventForm(), 'mid-large');

        const modalOverlay = document.getElementById('modal-overlay');
        const modalContent = document.getElementById('modal-content');
        if (modalOverlay && modalContent) {
            animateModalOpen(modalOverlay, modalContent, 'scale');
        }

        setTimeout(async () => {
            try {
                const fetchedEvent = await EventsAPI.getEvent(eventId);
                const modalBody = document.getElementById('modal-body');
                if (modalBody) {
                    modalBody.innerHTML = formContent;
                    populateFormWithEvent(fetchedEvent);
                    setupFormHandlers(fetchedEvent.id, buttonText, onSubmit);
                }
            } catch (error) {
                console.error('Error loading event:', error);
                showToast('Failed to load event', 'error');
                closeManageEventsModal();
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
            const form = document.getElementById('eventForm');
            if (form) {
                animateFormElements(form);
            }
        }, 100);

        setupFormHandlers(event?.id, buttonText, onSubmit);
    }
}

function populateFormWithEvent(event) {
    const form = document.getElementById('eventForm');
    if (!form) return;

    document.getElementById('eventId').value = event.id;
    document.getElementById('eventTitle').value = event.title;
    document.getElementById('eventDescription').value = event.description || '';
    document.getElementById('eventDate').value = event.event_date;
    document.getElementById('eventVenue').value = event.venue || '';
    document.getElementById('eventCategory').value = ['Seminar', 'Outreach', 'General Assembly', 'Workshop', 'Competition', 'Social Event'].includes(event.event_category) ? event.event_category : 'Other';

    if (!['Seminar', 'Outreach', 'General Assembly', 'Workshop', 'Competition', 'Social Event'].includes(event.event_category)) {
        document.getElementById('customCategory').value = event.event_category;
        document.getElementById('customCategoryContainer').classList.remove('hidden');
    }

    setTimeout(() => {
        const formEl = document.getElementById('eventForm');
        if (formEl) {
            animateFormElements(formEl);
        }
    }, 50);

    loadOrganizations(event.organization_id);
}

function setupFormHandlers(eventId, buttonText, onSubmit) {
    const form = document.getElementById('eventForm');
    if (form) {
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            await processEventSubmit(eventId, buttonText, onSubmit);
        });
    }

    const categorySelect = document.getElementById('eventCategory');
    const customCategoryContainer = document.getElementById('customCategoryContainer');
    const customCategoryInput = document.getElementById('customCategory');
    
    if (categorySelect && customCategoryContainer) {
        categorySelect.addEventListener('change', (e) => {
            if (e.target.value === 'Other') {
                customCategoryContainer.classList.remove('hidden');
                customCategoryInput.required = true;
            } else {
                customCategoryContainer.classList.add('hidden');
                customCategoryInput.required = false;
                customCategoryInput.value = '';
            }
        });
    }

    if (!eventId) {
        loadOrganizations();
    }
}

async function loadOrganizations(selectedOrgId = null) {
    try {
        const cachedData = localStorage.getItem('cachedOrganizations');
        let organizations;
        
        if (cachedData) {
            try {
                organizations = JSON.parse(cachedData);
            } catch (e) {
                console.error('Error parsing cached organizations:', e);
                organizations = await OrganizationsAPI.getAllOrganizations();
                localStorage.setItem('cachedOrganizations', JSON.stringify(organizations));
                localStorage.setItem('cachedOrganizationsTimestamp', Date.now().toString());
            }
        } else {
            organizations = await OrganizationsAPI.getAllOrganizations();
            localStorage.setItem('cachedOrganizations', JSON.stringify(organizations));
            localStorage.setItem('cachedOrganizationsTimestamp', Date.now().toString());
        }
        
        const orgSelect = document.getElementById('organizationId');
        if (orgSelect) {
            orgSelect.innerHTML = '<option value="">Select Organization</option>';
            organizations.forEach(org => {
                const option = document.createElement('option');
                option.value = org.id;
                option.textContent = org.name;
                if (selectedOrgId && selectedOrgId == org.id) {
                    option.selected = true;
                }
                orgSelect.appendChild(option);
            });
        }
    } catch (error) {
        console.error('Error loading organizations:', error);
        showToast('Failed to load organizations', 'error');
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

async function processEventSubmit(id, buttonText, onSubmit) {
    hideFormError();

    const categorySelect = document.getElementById('eventCategory');
    const customCategoryInput = document.getElementById('customCategory');
    
    let eventCategory = categorySelect.value;
    if (eventCategory === 'Other') {
        eventCategory = customCategoryInput.value.trim();
    }

    const formData = {
        title: document.getElementById('eventTitle').value.trim(),
        description: document.getElementById('eventDescription').value.trim(),
        organization_id: document.getElementById('organizationId').value,
        event_date: document.getElementById('eventDate').value,
        venue: document.getElementById('eventVenue').value.trim(),
        event_category: eventCategory
    };

    const isEdit = id != null;

    if (isEdit) {
        openConfirmDialog({
            title: 'Confirm Update',
            message: 'Are you sure you want to update this event?',
            confirmText: 'Update',
            cancelText: 'Cancel',
            type: 'blue',
            onConfirm: async () => {
                setModalButtonLoading('submitBtn', true, buttonText);
                try {
                    await onSubmit(id, formData);
                    closeManageEventsModal();
                    showToast('Event updated successfully', 'success');
                } catch (error) {
                    console.error('Error saving event:', error);
                    showFormError('Failed to save event. Please try again.');
                    setModalButtonLoading('submitBtn', false, buttonText);
                    showToast('Failed to update event', 'error');
                }
            }
        });
    } else {
        setModalButtonLoading('submitBtn', true, buttonText);
        try {
            await onSubmit(id, formData);
            closeManageEventsModal();
            showToast('Event added successfully', 'success');
        } catch (error) {
            console.error('Error saving event:', error);
            showFormError('Failed to save event. Please try again.');
            setModalButtonLoading('submitBtn', false, buttonText);
            showToast('Failed to add event', 'error');
        }
    }
}

async function closeManageEventsModal() {
    const modalOverlay = document.getElementById('modal-overlay');
    const modalContent = document.getElementById('modal-content');
    
    if (modalOverlay && modalContent) {
        await animateModalClose(modalOverlay, modalContent, 'scale');
        clearModalAnimations(modalOverlay, modalContent);
        modalOverlay.remove();
        document.removeEventListener('keydown', (e) => {
            if (e.key === 'Escape') closeManageEventsModal();
        });
    } else {
        closeModal();
    }
}

window.closeManageEventsModal = closeManageEventsModal;

export async function openViewEventsModal(id) {
    openModal('Event Details', skeletonEventView(), 'mid-large');

    const modalOverlay = document.getElementById('modal-overlay');
    const modalContent = document.getElementById('modal-content');
    if (modalOverlay && modalContent) {
        animateModalOpen(modalOverlay, modalContent, 'scale');
    }

    try {
        const event = await EventsAPI.getEvent(id);
        const eventDate = event.event_date ? new Date(event.event_date).toLocaleString('en-PH', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        }) : 'N/A';
        const createdAt = event.created_at ? new Date(event.created_at).toLocaleDateString('en-PH', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
        }) : 'N/A';
        const updatedAt = event.updated_at ? new Date(event.updated_at).toLocaleDateString('en-PH', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
        }) : 'N/A';

        const content = `
            <div class="space-y-5">
                <div class="flex flex-col sm:flex-row sm:items-center gap-4 bg-gray-50 rounded-lg p-4 border border-gray-100">
                    <div class="flex-shrink-0 w-24 h-24 sm:w-32 sm:h-32 rounded-lg bg-blue-900 text-blue-100 flex items-center justify-center text-2xl font-bold shadow-sm mx-auto sm:mx-0">
                        <i data-lucide="calendar" class="w-12 h-12"></i>
                    </div>
                    <div class="text-center sm:text-left">
                        <h3 class="text-lg font-semibold text-gray-900">${event.title}</h3>
                        <p class="text-sm text-gray-500 mt-0.5">${event.organization_name || 'N/A'}</p>
                        <span class="inline-flex items-center px-2.5 py-0.5 mt-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-900 border border-gray-200">
                            ${event.event_category}
                        </span>
                    </div>
                </div>

                <div class="border-b border-gray-200 pb-4">
                    <h4 class="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Event Details</h4>
                    <dl class="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3">
                        <div>
                            <dt class="text-xs text-gray-400 font-medium">Event Title</dt>
                            <dd class="text-sm font-semibold text-gray-900 mt-0.5">${event.title}</dd>
                        </div>
                        <div>
                            <dt class="text-xs text-gray-400 font-medium">Organization</dt>
                            <dd class="text-sm font-semibold text-gray-900 mt-0.5">${event.organization_name || 'N/A'}</dd>
                        </div>
                        <div class="sm:col-span-2">
                            <dt class="text-xs text-gray-400 font-medium">Description</dt>
                            <dd class="text-sm font-semibold text-gray-900 mt-0.5">${event.description || 'N/A'}</dd>
                        </div>
                    </dl>
                </div>

                <div class="border-b border-gray-200 pb-4">
                    <h4 class="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Event Information</h4>
                    <dl class="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3">
                        <div>
                            <dt class="text-xs text-gray-400 font-medium">Event Date</dt>
                            <dd class="text-sm font-semibold text-gray-900 mt-0.5">${eventDate}</dd>
                        </div>
                        <div>
                            <dt class="text-xs text-gray-400 font-medium">Venue</dt>
                            <dd class="text-sm font-semibold text-gray-900 mt-0.5">${event.venue || 'N/A'}</dd>
                        </div>
                        <div>
                            <dt class="text-xs text-gray-400 font-medium">Category</dt>
                            <dd class="text-sm font-semibold text-gray-900 mt-0.5">${event.event_category}</dd>
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
        console.error('Error loading event:', error);
        showToast('Failed to load event', 'error');
        closeModal();
    }
}

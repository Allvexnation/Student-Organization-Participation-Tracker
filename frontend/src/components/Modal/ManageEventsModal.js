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
                        <label for="organizationIds" class="block text-sm font-medium text-gray-700 mb-1">Organizations <span class="text-red-500">*</span></label>
                        <div id="organizationCheckboxes" class="space-y-2 max-h-40 overflow-y-auto border border-gray-200 rounded-md p-3 bg-gray-50">
                            <p class="text-sm text-gray-400">Loading organizations...</p>
                        </div>
                    </div>
                    <div>
                        <label for="eventDayStart" class="block text-sm font-medium text-gray-700 mb-1">Event Day Start <span class="text-red-500">*</span></label>
                        <input type="date" id="eventDayStart" name="eventDayStart" value="${isEdit && event ? event.event_day_start : ''}" required
                            class="w-full px-3 py-2 text-sm border border-gray-200 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent transition">
                    </div>
                    <div>
                        <label for="eventDayEnd" class="block text-sm font-medium text-gray-700 mb-1">Event Day End <span class="text-red-500">*</span></label>
                        <input type="date" id="eventDayEnd" name="eventDayEnd" value="${isEdit && event ? event.event_day_end : ''}" required
                            class="w-full px-3 py-2 text-sm border border-gray-200 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent transition">
                    </div>
                    <div id="dailySchedulesContainer" class="hidden">
                        <div class="flex items-center justify-between mb-2">
                            <label class="block text-sm font-medium text-gray-700">Daily Schedule Configuration</label>
                            <button type="button" id="setSameTimeBtn" class="px-3 py-1 text-xs font-medium text-blue-900 bg-blue-50 hover:bg-blue-100 rounded border border-blue-200 transition">
                                Set Same Time for All Days
                            </button>
                        </div>
                        <div id="dailySchedulesList" class="space-y-2 max-h-60 overflow-y-auto border border-gray-200 rounded-md p-3 bg-gray-50">
                        </div>
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
    document.getElementById('eventDayStart').value = event.event_day_start || '';
    document.getElementById('eventDayEnd').value = event.event_day_end || '';
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

    const selectedOrgIds = event.organization_ids ? event.organization_ids.split(',').map(id => parseInt(id.trim())) : [event.organization_id].filter(id => id);
    loadOrganizations(selectedOrgIds);

    if (event.daily_schedules && event.daily_schedules.length > 0) {
        const dailySchedulesContainer = document.getElementById('dailySchedulesContainer');
        if (dailySchedulesContainer) {
            dailySchedulesContainer.classList.remove('hidden');
        }
        renderDailySchedules(event.daily_schedules);
    } else if (event.event_day_start && event.event_day_end) {

        const dailySchedulesContainer = document.getElementById('dailySchedulesContainer');
        if (dailySchedulesContainer) {
            dailySchedulesContainer.classList.remove('hidden');
            const dates = getDatesInRange(new Date(event.event_day_start), new Date(event.event_day_end));
            renderDailySchedules(dates.map(date => ({
                date: date.toISOString().split('T')[0],
                start_time: '09:00',
                end_time: '17:00'
            })));
        }
    }
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

    const eventDayStart = document.getElementById('eventDayStart');
    const eventDayEnd = document.getElementById('eventDayEnd');
    const dailySchedulesContainer = document.getElementById('dailySchedulesContainer');
    const setSameTimeBtn = document.getElementById('setSameTimeBtn');
    
    const generateDailySchedules = () => {
        const startDate = eventDayStart.value;
        const endDate = eventDayEnd.value;

        if (startDate && endDate) {
            const start = new Date(startDate);
            const end = new Date(endDate);

            if (isNaN(start.getTime()) || isNaN(end.getTime())) {
                console.error('Invalid dates provided');
                return;
            }

            dailySchedulesContainer.classList.remove('hidden');
            const dates = getDatesInRange(start, end);
            renderDailySchedules(dates.map(date => ({
                date: date.toISOString().split('T')[0],
                start_time: '09:00',
                end_time: '17:00'
            })));
        } else {
            dailySchedulesContainer.classList.add('hidden');
        }
    };
    
    if (eventDayStart && eventDayEnd) {
        eventDayStart.addEventListener('change', generateDailySchedules);
        eventDayEnd.addEventListener('change', generateDailySchedules);
    }

    if (setSameTimeBtn) {
        setSameTimeBtn.addEventListener('click', () => {
            const scheduleInputs = document.querySelectorAll('#dailySchedulesList > div');
            if (scheduleInputs.length === 0) {
                showToast('Please select a date range first', 'error');
                return;
            }

            const firstStart = scheduleInputs[0].querySelector('input[type="time"][name^="schedule_start"]').value;
            const firstEnd = scheduleInputs[0].querySelector('input[type="time"][name^="schedule_end"]').value;

            scheduleInputs.forEach((div, index) => {
                const startInput = div.querySelector(`input[name="schedule_start_${index}"]`);
                const endInput = div.querySelector(`input[name="schedule_end_${index}"]`);
                if (startInput) startInput.value = firstStart;
                if (endInput) endInput.value = firstEnd;
            });
            
            showToast('Same time applied to all days', 'success');
        });
    }

    if (!eventId) {
        loadOrganizations();
    }
}

function getDatesInRange(startDate, endDate) {
    const dates = [];
    let currentDate = new Date(startDate);
    const end = new Date(endDate);
    
    while (currentDate <= end) {
        dates.push(new Date(currentDate));
        currentDate.setDate(currentDate.getDate() + 1);
    }
    
    return dates;
}

function renderDailySchedules(schedules) {
    const container = document.getElementById('dailySchedulesList');
    if (!container) return;
    
    container.innerHTML = schedules.map((schedule, index) => {
        const dateValue = schedule.date || schedule.schedule_date;
        const date = new Date(dateValue);
        const formattedDate = date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
        const startTime = schedule.start_time || '09:00';
        const endTime = schedule.end_time || '17:00';
        
        return `
            <div class="flex items-center gap-2 p-2 bg-white rounded border border-gray-200">
                <span class="text-xs font-medium text-gray-700 w-28">${formattedDate}</span>
                <input type="time" name="schedule_start_${index}" value="${startTime}" 
                    class="px-2 py-1 text-xs border border-gray-200 rounded focus:ring-2 focus:ring-blue-500">
                <span class="text-xs text-gray-500">to</span>
                <input type="time" name="schedule_end_${index}" value="${endTime}" 
                    class="px-2 py-1 text-xs border border-gray-200 rounded focus:ring-2 focus:ring-blue-500">
                <input type="hidden" name="schedule_date_${index}" value="${dateValue}">
            </div>
        `;
    }).join('');
}

async function loadOrganizations(selectedOrgIds = []) {
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
        
        const orgContainer = document.getElementById('organizationCheckboxes');
        if (orgContainer) {
            orgContainer.innerHTML = organizations.map(org => `
                <label class="flex items-center space-x-2 cursor-pointer hover:bg-gray-100 p-1 rounded">
                    <input type="checkbox" name="organizationIds" value="${org.id}" ${selectedOrgIds.includes(org.id) ? 'checked' : ''}
                        class="w-4 h-4 text-blue-900 border-gray-300 rounded focus:ring-blue-500">
                    <span class="text-sm text-gray-700">${org.name}</span>
                </label>
            `).join('');
        }
    } catch (error) {
        console.error('Error loading organizations:', error);
        const orgContainer = document.getElementById('organizationCheckboxes');
        if (orgContainer) {
            orgContainer.innerHTML = '<p class="text-sm text-red-500">Failed to load organizations</p>';
        }
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

    const orgCheckboxes = document.querySelectorAll('input[name="organizationIds"]:checked');
    const organizationIds = Array.from(orgCheckboxes).map(cb => parseInt(cb.value));

    if (organizationIds.length === 0) {
        showFormError('Please select at least one organization');
        return;
    }

    const eventDayStart = document.getElementById('eventDayStart').value;
    const eventDayEnd = document.getElementById('eventDayEnd').value;

    const scheduleInputs = document.querySelectorAll('#dailySchedulesList > div');
    const dailySchedules = [];
    scheduleInputs.forEach((div, index) => {
        const date = div.querySelector(`input[name="schedule_date_${index}"]`).value;
        const startTime = div.querySelector(`input[name="schedule_start_${index}"]`).value;
        const endTime = div.querySelector(`input[name="schedule_end_${index}"]`).value;
 
        if (date && date !== '0000-00-00' && date !== '') {
            dailySchedules.push({
                date: date,
                start_time: startTime,
                end_time: endTime
            });
        }
    });

    const formData = {
        title: document.getElementById('eventTitle').value.trim(),
        description: document.getElementById('eventDescription').value.trim(),
        organization_ids: organizationIds,
        event_day_start: eventDayStart,
        event_day_end: eventDayEnd,
        daily_schedules: dailySchedules,
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
        
        const formatDate = (date) => {
            if (!date) return 'N/A';
            return new Date(date).toLocaleDateString('en-PH', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            });
        };
        
        const eventDayStart = formatDate(event.event_day_start);
        const eventDayEnd = formatDate(event.event_day_end);
        const dateRange = event.event_day_start === event.event_day_end 
            ? eventDayStart 
            : `${eventDayStart} to ${eventDayEnd}`;
        
        const formatTime = (time) => {
            if (!time) return 'N/A';
            const [hours, minutes] = time.substring(0, 5).split(':');
            const hour = parseInt(hours);
            const ampm = hour >= 12 ? 'PM' : 'AM';
            const hour12 = hour % 12 || 12;
            return `${hour12}:${minutes} ${ampm}`;
        };
        
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
                        <div class="sm:col-span-2">
                            <dt class="text-xs text-gray-400 font-medium">Date Range</dt>
                            <dd class="text-sm font-semibold text-gray-900 mt-0.5">${dateRange}</dd>
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

                ${event.daily_schedules && event.daily_schedules.length > 0 ? `
                <div class="border-b border-gray-200 pb-4">
                    <h4 class="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Daily Schedule</h4>
                    <div class="space-y-2 max-h-48 overflow-y-auto">
                        ${event.daily_schedules.map(schedule => {
                            const date = new Date(schedule.schedule_date);
                            const formattedDate = date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
                            return `
                                <div class="flex items-center justify-between p-2 bg-gray-50 rounded border border-gray-100">
                                    <span class="text-sm font-medium text-gray-700">${formattedDate}</span>
                                    <span class="text-sm text-gray-600">${formatTime(schedule.start_time)} - ${formatTime(schedule.end_time)}</span>
                                </div>
                            `;
                        }).join('')}
                    </div>
                </div>
                ` : ''}

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

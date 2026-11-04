import { openModal, closeModal, setModalButtonLoading } from '../../utils/modal.js';
import { openConfirmDialog } from '../Dialog/ConfirmDialog.js';
import { animateModalClose, clearModalAnimations } from '../../provider/ModalAnimation.js';
import * as EventsAPI from '../../api/admin/Events/ManageEvents.js';
import { showToast } from '../ToastMessage.js';
import { skeletonEventForm, skeletonEventView } from '../SkeletonLoading.js';
import { FIELD_CLASS, LABEL_CLASS, modalSection, modalActions, modalViewClose, modalDetailTile, modalBadge, modalHero, applyModalDomino } from './modalUi.js';

export function openManageEventsModal({ mode = 'add', event = null, eventId = null, onSubmit }) {
    const isEdit = mode === 'edit';
    const title = isEdit ? 'Edit Event' : 'New Event';
    const buttonText = isEdit ? 'Save Changes' : 'Add Event';

    const formContent = `
        <form id="eventForm" class="manage-modal-form space-y-4">
            ${isEdit ? `<input type="hidden" id="eventId" value="${event?.id || eventId || ''}">` : ''}
            ${modalSection('Event Details', `
                <div class="space-y-3">
                    <div>
                        <label for="eventTitle" class="${LABEL_CLASS}">Event Title <span class="text-red-500">*</span></label>
                        <input type="text" id="eventTitle" name="eventTitle" value="${isEdit && event ? event.title : ''}" required placeholder="e.g. Annual General Assembly" class="${FIELD_CLASS}">
                    </div>
                    <div>
                        <label for="eventDescription" class="${LABEL_CLASS}">Description</label>
                        <textarea id="eventDescription" name="eventDescription" rows="3" placeholder="Detailed description of the event" class="${FIELD_CLASS} resize-none">${isEdit && event ? event.description : ''}</textarea>
                    </div>
                </div>
            `)}
            ${modalSection('Event Information', `
                <div class="space-y-3">
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div>
                            <label for="eventDayStart" class="${LABEL_CLASS}">Event Day Start <span class="text-red-500">*</span></label>
                            <input type="date" id="eventDayStart" name="eventDayStart" value="${isEdit && event ? event.event_day_start : ''}" required class="${FIELD_CLASS}">
                        </div>
                        <div>
                            <label for="eventDayEnd" class="${LABEL_CLASS}">Event Day End <span class="text-red-500">*</span></label>
                            <input type="date" id="eventDayEnd" name="eventDayEnd" value="${isEdit && event ? event.event_day_end : ''}" required class="${FIELD_CLASS}">
                        </div>
                    </div>
                    <div id="dailySchedulesContainer" class="hidden">
                        <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-2">
                            <label class="block text-sm font-medium text-ink">Daily Schedule</label>
                            <button type="button" id="setSameTimeBtn" class="px-3 py-1.5 text-xs font-medium text-navy bg-blue-50 hover:bg-blue-100 rounded-lg border border-blue-100 transition">
                                Set Same Time for All Days
                            </button>
                        </div>
                        <div id="dailySchedulesList" class="space-y-2 max-h-60 overflow-y-auto border border-line rounded-xl p-3 bg-surface">
                        </div>
                    </div>
                    <div>
                        <label for="eventVenue" class="${LABEL_CLASS}">Venue</label>
                        <input type="text" id="eventVenue" name="eventVenue" value="${isEdit && event ? event.venue : ''}" placeholder="e.g. Main Auditorium, Online via Zoom" class="${FIELD_CLASS}">
                    </div>
                    <div>
                        <label for="eventCategory" class="${LABEL_CLASS}">Event Category <span class="text-red-500">*</span></label>
                        <select id="eventCategory" name="eventCategory" required class="${FIELD_CLASS}">
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
                        <label for="customCategory" class="${LABEL_CLASS}">Specify Category <span class="text-red-500">*</span></label>
                        <input type="text" id="customCategory" name="customCategory" value="${isEdit && event?.event_category && !['Seminar', 'Outreach', 'General Assembly', 'Workshop', 'Competition', 'Social Event'].includes(event.event_category) ? event.event_category : ''}" placeholder="e.g. Sports Competition, Cultural Event" class="${FIELD_CLASS}">
                    </div>
                </div>
            `)}
            <div id="formError" class="hidden text-sm text-red-700 bg-red-50 border border-red-200 rounded-xl px-3 py-2.5"></div>
            ${modalActions({ cancelOnclick: 'closeManageEventsModal()', submitText: buttonText })}
        </form>
    `;

    if (isEdit && !event && eventId) {
        openModal(title, skeletonEventForm(), 'mid-large');

        setTimeout(async () => {
            try {
                const fetchedEvent = await EventsAPI.getEvent(eventId);
                const modalBody = document.getElementById('modal-body');
                if (modalBody) {
                    modalBody.innerHTML = formContent;
                    populateFormWithEvent(fetchedEvent);
                    setupFormHandlers(fetchedEvent.id, buttonText, onSubmit);
                    applyModalDomino();
                }
            } catch (error) {
                console.error('Error loading event:', error);
                showToast('Failed to load event', 'error');
                closeManageEventsModal();
            }
        }, 100);
    } else {
        openModal(title, formContent, 'mid-large');
        applyModalDomino();
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

    applyModalDomino();

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
            <div class="flex flex-col sm:flex-row sm:items-center gap-2 p-3 bg-white rounded-xl border border-line">
                <span class="text-xs font-semibold text-ink sm:w-28">${formattedDate}</span>
                <div class="grid grid-cols-2 gap-2 flex-1">
                    <input type="time" name="schedule_start_${index}" value="${startTime}" class="w-full px-2 py-2 text-sm border border-line rounded-lg focus:ring-2 focus:ring-navy/15 focus:border-navy">
                    <input type="time" name="schedule_end_${index}" value="${endTime}" class="w-full px-2 py-2 text-sm border border-line rounded-lg focus:ring-2 focus:ring-navy/15 focus:border-navy">
                </div>
                <input type="hidden" name="schedule_date_${index}" value="${dateValue}">
            </div>
        `;
    }).join('');
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
        document.body.classList.remove('overflow-hidden');
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
            <div class="space-y-4">
                ${modalHero({
                    fallback: '<i data-lucide="calendar" class="w-10 h-10"></i>',
                    name: event.title,
                    badges: [modalBadge(event.event_category, 'navy')]
                })}
                ${modalSection('Event Details', `
                    <dl class="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                        ${modalDetailTile('Event Title', event.title)}
                        ${modalDetailTile('Category', event.event_category)}
                        <div class="md:col-span-2">${modalDetailTile('Description', event.description || 'N/A')}</div>
                    </dl>
                `)}
                ${modalSection('Event Information', `
                    <dl class="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                        <div class="md:col-span-2">${modalDetailTile('Date Range', dateRange)}</div>
                        ${modalDetailTile('Venue', event.venue || 'N/A')}
                    </dl>
                `)}
                ${event.daily_schedules && event.daily_schedules.length > 0 ? modalSection('Daily Schedule', `
                    <div class="space-y-2 max-h-48 overflow-y-auto">
                        ${event.daily_schedules.map(schedule => {
                            const date = new Date(schedule.schedule_date);
                            const formattedDate = date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
                            return `
                                <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 p-3 bg-surface rounded-xl border border-line">
                                    <span class="text-sm font-medium text-ink">${formattedDate}</span>
                                    <span class="text-sm text-muted">${formatTime(schedule.start_time)} - ${formatTime(schedule.end_time)}</span>
                                </div>
                            `;
                        }).join('')}
                    </div>
                `) : ''}
                ${modalSection('Timestamps', `
                    <dl class="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                        ${modalDetailTile('Created At', createdAt)}
                        ${modalDetailTile('Updated At', updatedAt)}
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
        console.error('Error loading event:', error);
        showToast('Failed to load event', 'error');
        closeModal();
    }
}

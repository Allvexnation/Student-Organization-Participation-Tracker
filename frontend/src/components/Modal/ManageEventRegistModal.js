import { openModal, closeModal, setModalButtonLoading } from '../../utils/modal.js';
import { openConfirmDialog } from '../Dialog/ConfirmDialog.js';
import { animateModalOpen, animateModalClose, clearModalAnimations, animateFormElements, clearFormAnimations, animateViewModalElements } from '../../provider/ModalAnimation.js';
import * as EventOrgAPI from '../../api/admin/EventOrganizations/EventOrganizations.js';
import * as EventsAPI from '../../api/admin/Events/ManageEvents.js';
import * as OrganizationsAPI from '../../api/admin/Organizations/ManageOrganizations.js';
import { getApprovers } from '../../api/admin/EventOrganizations/EventOrganizations.js';
import { showToast } from '../ToastMessage.js';
import { skeletonEventRegistForm, skeletonEventRegistView } from '../SkeletonLoading.js';
import { OrganizationValidator } from '../../validator/OrganizationValidator.js';
import { CacheService } from '../../../cache/CacheService.js';
import { AdviserValidator } from '../../validator/AdviserValidator.js';

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
                        <label for="organizationId" class="block text-sm font-medium text-gray-700 mb-1">Organization <span class="text-red-500">*</span></label>
                        <select id="organizationId" name="organizationId" required
                            class="w-full px-3 py-2 text-sm border border-gray-200 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white transition">
                            <option value="">Select Organization</option>
                        </select>
                    </div>
                    <div>
                        <label for="approverId" class="block text-sm font-medium text-gray-700 mb-1">Approver (Admin/Adviser) <span class="text-red-500">*</span></label>
                        <select id="approverId" name="approverId" required
                            class="w-full px-3 py-2 text-sm border border-gray-200 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white transition">
                            <option value="">Select Approver</option>
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
                const fetchedRegist = await EventOrgAPI.getEventOrganization(registrationId);
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

    Promise.all([loadEvents(registration.event_id), loadOrganizations(registration.organization_id), loadApprovers(registration.approver_id)]);
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
        setTimeout(() => {
            Promise.all([loadEvents(), loadOrganizations(), loadApprovers()]);
        }, 100);
    }
}

async function loadEvents(selectedEventId = null) {
    try {
        let events = await CacheService.get('cachedEvents');
        if (!events || !Array.isArray(events) || events.length === 0) {
            events = await EventsAPI.getAllEvents();
            if (events) {
                await CacheService.set('cachedEvents', events);
            }
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

async function loadOrganizations(selectedOrganizationId = null) {
    try {
        let organizations = await CacheService.get('cachedOrganizations');
        if (!organizations || !Array.isArray(organizations) || organizations.length === 0) {
            organizations = await OrganizationsAPI.getAllOrganizations();
            if (organizations) {
                await CacheService.set('cachedOrganizations', organizations);
            }
        }
        
        const organizationSelect = document.getElementById('organizationId');
        if (organizationSelect) {
            organizationSelect.innerHTML = '<option value="">Select Organization</option>';
            organizations.forEach(org => {
                const isSuspended = OrganizationValidator.isSuspended(org);
                const displayName = OrganizationValidator.getDisplayName(org);
                const option = document.createElement('option');
                option.value = org.id;
                option.textContent = displayName;
                if (selectedOrganizationId && selectedOrganizationId == org.id) {
                    option.selected = true;
                }
                if (isSuspended) {
                    option.disabled = true;
                }
                organizationSelect.appendChild(option);
            });
        }
    } catch (error) {
        console.error('Error loading organizations:', error);
        showToast('Failed to load organizations', 'error');
    }
}

async function loadApprovers(selectedApproverId = null) {
    try {
        const approvers = await getApprovers();
        
        const approverSelect = document.getElementById('approverId');
        if (approverSelect) {
            approverSelect.innerHTML = '<option value="">Select Approver</option>';
            approvers.forEach(approver => {
                const isInactive = approver.type === 'adviser' ? AdviserValidator.isInactive(approver) : false;
                const displayName = isInactive ? AdviserValidator.getDisplayName(approver) : approver.name;
                const typeLabel = approver.type === 'admin' ? 'Admin' : 'Adviser';
                const option = document.createElement('option');
                option.value = approver.id;
                option.textContent = `${displayName} (${typeLabel})`;
                if (selectedApproverId && selectedApproverId == approver.id) {
                    option.selected = true;
                }
                if (isInactive) {
                    option.disabled = true;
                }
                approverSelect.appendChild(option);
            });
        }
    } catch (error) {
        console.error('Error loading approvers:', error);
        showToast('Failed to load approvers', 'error');
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
        organization_id: document.getElementById('organizationId').value,
        approver_id: document.getElementById('approverId').value
    };

    const isEdit = id != null;

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
        const registration = await EventOrgAPI.getEventOrganization(id);
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
                        <i data-lucide="users" class="w-12 h-12"></i>
                    </div>
                    <div class="text-center sm:text-left">
                        <h3 class="text-lg font-semibold text-gray-900">${registration.organization_name || 'N/A'}</h3>
                        <p class="text-sm text-gray-500 mt-0.5">${registration.event_title || 'N/A'}</p>
                        <span class="inline-flex items-center px-2.5 py-0.5 mt-0.5 rounded-full text-xs font-medium bg-green-50 text-green-900 border border-gray-200">
                            ${registration.status || 'Registered'}
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
                            <dt class="text-xs text-gray-400 font-medium">Organization</dt>
                            <dd class="text-sm font-semibold text-gray-900 mt-0.5">${registration.organization_name || 'N/A'}</dd>
                        </div>
                        <div>
                            <dt class="text-xs text-gray-400 font-medium">Approver</dt>
                            <dd class="text-sm font-semibold text-gray-900 mt-0.5">${registration.approver_name || 'N/A'}</dd>
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

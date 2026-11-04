import { openModal, closeModal, setModalButtonLoading } from '../../utils/modal.js';
import { openConfirmDialog } from '../Dialog/ConfirmDialog.js';
import { animateModalClose, clearModalAnimations } from '../../provider/ModalAnimation.js';
import * as EventOrgAPI from '../../api/admin/EventOrganizations/EventOrganizations.js';
import * as EventsAPI from '../../api/admin/Events/ManageEvents.js';
import * as OrganizationsAPI from '../../api/admin/Organizations/ManageOrganizations.js';
import { getApprovers } from '../../api/admin/EventOrganizations/EventOrganizations.js';
import { showToast } from '../ToastMessage.js';
import { skeletonEventRegistForm, skeletonEventRegistView } from '../SkeletonLoading.js';
import { OrganizationValidator } from '../../validator/OrganizationValidator.js';
import { CacheService } from '../../../cache/CacheService.js';
import { AdviserValidator } from '../../validator/AdviserValidator.js';
import { FIELD_CLASS, LABEL_CLASS, modalSection, modalActions, modalViewClose, modalDetailTile, modalBadge, modalHero, applyModalDomino } from './modalUi.js';

export function openManageEventRegistModal({ mode = 'add', registration = null, registrationId = null, onSubmit }) {
    const isEdit = mode === 'edit';
    const title = isEdit ? 'Edit Registration' : 'New Registration';
    const buttonText = isEdit ? 'Save Changes' : 'Add Registration';

    const formContent = `
        <form id="eventRegistForm" class="manage-modal-form space-y-4">
            ${isEdit ? `<input type="hidden" id="eventRegistId" value="${registration?.id || registrationId || ''}">` : ''}
            ${modalSection('Registration Details', `
                <div class="space-y-3">
                    <div>
                        <label for="eventId" class="${LABEL_CLASS}">Event <span class="text-red-500">*</span></label>
                        <select id="eventId" name="eventId" required class="${FIELD_CLASS}">
                            <option value="">Select Event</option>
                        </select>
                    </div>
                    ${isEdit ? `
                    <div>
                        <label for="organizationId" class="${LABEL_CLASS}">Organization <span class="text-red-500">*</span></label>
                        <select id="organizationId" name="organizationId" required class="${FIELD_CLASS}">
                            <option value="">Select Organization</option>
                        </select>
                    </div>
                    ` : `
                    <div>
                        <div class="flex items-center justify-between mb-1.5">
                            <label class="${LABEL_CLASS} mb-0">Organizations <span class="text-red-500">*</span></label>
                            <button type="button" id="toggleAllOrgsBtn" class="text-xs text-navy hover:text-navy-700 font-medium">Select All</button>
                        </div>
                        <div id="organizationCheckboxes" class="space-y-1.5 max-h-48 overflow-y-auto border border-line rounded-xl p-3 bg-surface">
                            <p class="text-sm text-muted">Loading organizations...</p>
                        </div>
                    </div>
                    `}
                    <div>
                        <label for="approverId" class="${LABEL_CLASS}">Approver (Admin/Adviser) <span class="text-red-500">*</span></label>
                        <select id="approverId" name="approverId" required class="${FIELD_CLASS}">
                            <option value="">Select Approver</option>
                        </select>
                    </div>
                </div>
            `)}
            <div id="formError" class="hidden text-sm text-red-700 bg-red-50 border border-red-200 rounded-xl px-3 py-2.5"></div>
            ${modalActions({ cancelOnclick: 'closeManageEventRegistModal()', submitText: buttonText })}
        </form>
    `;

    if (isEdit && !registration && registrationId) {
        openModal(title, skeletonEventRegistForm(), 'mid-large');

        setTimeout(async () => {
            try {
                const fetchedRegist = await EventOrgAPI.getEventOrganization(registrationId);
                const modalBody = document.getElementById('modal-body');
                if (modalBody) {
                    modalBody.innerHTML = formContent;
                    populateFormWithRegist(fetchedRegist);
                    setupFormHandlers(fetchedRegist.id, buttonText, onSubmit);
                    applyModalDomino();
                }
            } catch (error) {
                console.error('Error loading registration:', error);
                showToast('Failed to load registration', 'error');
                closeManageEventRegistModal();
            }
        }, 100);
    } else {
        openModal(title, formContent, 'mid-large');
        applyModalDomino();
        setupFormHandlers(registration?.id, buttonText, onSubmit);
    }
}

function populateFormWithRegist(registration) {
    const form = document.getElementById('eventRegistForm');
    if (!form) return;

    document.getElementById('eventRegistId').value = registration.id;

    applyModalDomino();

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

async function loadOrganizations(selectedOrgParam = null) {
    try {
        let organizations = await CacheService.get('cachedOrganizations');
        if (!organizations || !Array.isArray(organizations) || organizations.length === 0) {
            organizations = await OrganizationsAPI.getAllOrganizations();
            if (organizations) {
                await CacheService.set('cachedOrganizations', organizations);
            }
        }
        
        const orgContainer = document.getElementById('organizationCheckboxes');
        if (orgContainer) {
            const selectedIds = Array.isArray(selectedOrgParam) ? selectedOrgParam : (selectedOrgParam ? [Number(selectedOrgParam)] : []);
            orgContainer.innerHTML = organizations.map(org => {
                const isSuspended = OrganizationValidator.isSuspended(org);
                const displayName = OrganizationValidator.getDisplayName(org);
                const isChecked = selectedIds.includes(Number(org.id));
                return `
                    <label class="flex items-center space-x-2.5 ${isSuspended ? 'cursor-not-allowed opacity-60' : 'cursor-pointer hover:bg-white'} p-2 rounded-lg transition">
                        <input type="checkbox" name="organizationIds" value="${org.id}" data-name="${displayName}" ${isChecked ? 'checked' : ''} ${isSuspended ? 'disabled' : ''}
                            class="w-4 h-4 text-navy border-line rounded focus:ring-navy">
                        <span class="text-sm ${isSuspended ? 'text-muted italic' : 'text-ink'}">${displayName}</span>
                    </label>
                `;
            }).join('');

            const toggleBtn = document.getElementById('toggleAllOrgsBtn');
            if (toggleBtn) {
                toggleBtn.onclick = () => {
                    const checkboxes = Array.from(document.querySelectorAll('input[name="organizationIds"]:not(:disabled)'));
                    const allChecked = checkboxes.length > 0 && checkboxes.every(cb => cb.checked);
                    checkboxes.forEach(cb => { cb.checked = !allChecked; });
                    toggleBtn.textContent = allChecked ? 'Select All' : 'Deselect All';
                };
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
                if (selectedOrgParam && selectedOrgParam == org.id) {
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

    const eventSelect = document.getElementById('eventId');
    const approverSelect = document.getElementById('approverId');

    if (!eventSelect.value) {
        showFormError('Please select an event');
        return;
    }

    if (!approverSelect.value) {
        showFormError('Please select an approver');
        return;
    }

    const isEdit = id != null;
    let formData;

    if (isEdit) {
        const organizationSelect = document.getElementById('organizationId');
        if (!organizationSelect || !organizationSelect.value) {
            showFormError('Please select an organization');
            return;
        }

        formData = {
            event_id: eventSelect.value,
            event_title: eventSelect.options[eventSelect.selectedIndex]?.text || '',
            organization_id: organizationSelect.value,
            organization_name: organizationSelect.options[organizationSelect.selectedIndex]?.text || '',
            approver_id: approverSelect.value,
            approver_name: approverSelect.options[approverSelect.selectedIndex]?.text || ''
        };

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
        const checkedBoxes = Array.from(document.querySelectorAll('input[name="organizationIds"]:checked'));
        if (checkedBoxes.length === 0) {
            showFormError('Please select at least one organization');
            return;
        }

        const organizationIds = checkedBoxes.map(cb => parseInt(cb.value));
        const organizationNames = checkedBoxes.map(cb => cb.getAttribute('data-name') || cb.value);

        formData = {
            event_id: eventSelect.value,
            event_title: eventSelect.options[eventSelect.selectedIndex]?.text || '',
            organization_ids: organizationIds,
            organization_names: organizationNames,
            approver_id: approverSelect.value,
            approver_name: approverSelect.options[approverSelect.selectedIndex]?.text || ''
        };

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
        document.body.classList.remove('overflow-hidden');
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
            <div class="space-y-4">
                ${modalHero({
                    fallback: '<i data-lucide="users" class="w-10 h-10"></i>',
                    name: registration.organization_name || 'N/A',
                    subtitle: registration.event_title || 'N/A',
                    badges: [modalBadge(registration.status || 'Registered', 'green')]
                })}
                ${modalSection('Registration Details', `
                    <dl class="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                        ${modalDetailTile('Event', registration.event_title || 'N/A')}
                        ${modalDetailTile('Organization', registration.organization_name || 'N/A')}
                        ${modalDetailTile('Approver', registration.approver_name || 'N/A')}
                        ${modalDetailTile('Registered At', registeredAt)}
                    </dl>
                `)}
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
        console.error('Error loading registration:', error);
        showToast('Failed to load registration', 'error');
        closeModal();
    }
}

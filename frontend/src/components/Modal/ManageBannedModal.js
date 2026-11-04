import { openModal, closeModal, setModalButtonLoading } from '../../utils/modal.js';
import { animateModalClose, clearModalAnimations } from '../../provider/ModalAnimation.js';
import { getSessions } from '../../api/web/Banned.js';
import { API_ROUTES } from '../../api/server/api.js';
import { showToast } from '../ToastMessage.js';
import { FIELD_CLASS, LABEL_CLASS, modalSection, modalActions, applyModalDomino } from './modalUi.js';

let sessions = [];
let users = {
    admin: [],
    adviser: [],
    student: []
};

export function openManageBannedModal({ mode = 'add', ban = null, banId = null, onSubmit }) {
    const isEdit = mode === 'edit';
    const title = isEdit ? 'Edit Ban' : 'Create New Ban';
    const buttonText = isEdit ? 'Save Changes' : 'Create Ban';

    const formContent = `
        <form id="banForm" class="manage-modal-form space-y-4">
            ${isEdit ? `<input type="hidden" id="banId" value="${ban?.id || banId || ''}">` : ''}
            ${modalSection('Ban Type', `
                <div>
                    <label for="banType" class="${LABEL_CLASS}">Ban Type <span class="text-red-500">*</span></label>
                    <select id="banType" name="banType" required class="${FIELD_CLASS}">
                        <option value="">Select ban type</option>
                        <option value="session" ${isEdit && ban?.ban_type === 'session' ? 'selected' : ''}>Session Banned</option>
                        <option value="overall" ${isEdit && ban?.ban_type === 'overall' ? 'selected' : ''}>Overall Banned</option>
                        <option value="ip" ${isEdit && ban?.ban_type === 'ip' ? 'selected' : ''}>IP Only Banned</option>
                    </select>
                </div>
            `)}
            <section id="sessionFieldset" class="manage-modal-section hidden reveal rounded-2xl border border-line bg-white p-4 sm:p-5" data-domino-enter>
                <p class="text-[11px] uppercase tracking-[0.16em] text-muted mb-3">Session Information</p>
                <div>
                    <label for="sessionSelect" class="${LABEL_CLASS}">Select Session</label>
                    <select id="sessionSelect" name="sessionSelect" class="${FIELD_CLASS}">
                        <option value="">Loading sessions...</option>
                    </select>
                    <p class="text-xs text-muted mt-1.5">Shows IP and user information</p>
                </div>
            </section>
            <section id="targetFieldset" class="manage-modal-section hidden reveal rounded-2xl border border-line bg-white p-4 sm:p-5" data-domino-enter>
                <p class="text-[11px] uppercase tracking-[0.16em] text-muted mb-3">Target Information</p>
                <div class="space-y-3">
                    <div>
                        <label for="targetType" class="${LABEL_CLASS}">Target Type</label>
                        <select id="targetType" name="targetType" class="${FIELD_CLASS}">
                            <option value="">Select target type</option>
                            <option value="admin" ${isEdit && ban?.target_type === 'admin' ? 'selected' : ''}>Admin</option>
                            <option value="adviser" ${isEdit && ban?.target_type === 'adviser' ? 'selected' : ''}>Adviser</option>
                            <option value="student" ${isEdit && ban?.target_type === 'student' ? 'selected' : ''}>Student</option>
                        </select>
                    </div>
                    <div id="targetUserSection" class="hidden">
                        <label for="targetUser" class="${LABEL_CLASS}">Select User</label>
                        <select id="targetUser" name="targetUser" class="${FIELD_CLASS}">
                            <option value="">Loading users...</option>
                        </select>
                    </div>
                    <input type="hidden" id="targetId" name="targetId">
                </div>
            </section>
            <section id="ipFieldset" class="manage-modal-section hidden reveal rounded-2xl border border-line bg-white p-4 sm:p-5" data-domino-enter>
                <p class="text-[11px] uppercase tracking-[0.16em] text-muted mb-3">IP Information</p>
                <div class="space-y-3">
                    <div>
                        <label for="ipAddress" class="${LABEL_CLASS}">IP Address <span class="text-red-500">*</span></label>
                        <input type="text" id="ipAddress" name="ipAddress" value="${isEdit && ban ? ban.ip_address : ''}" placeholder="Enter IP address (e.g., 192.168.1.1)" class="${FIELD_CLASS}">
                    </div>
                    <div>
                        <label for="ipBanType" class="${LABEL_CLASS}">IP Ban Scope</label>
                        <select id="ipBanType" name="ipBanType" class="${FIELD_CLASS}">
                            <option value="session" ${isEdit && ban?.ip_ban_scope === 'session' ? 'selected' : ''}>Session Banned</option>
                            <option value="overall" ${isEdit && ban?.ip_ban_scope === 'overall' ? 'selected' : ''}>Overall Banned</option>
                        </select>
                    </div>
                </div>
            </section>
            ${modalSection('Ban Details', `
                <div class="space-y-3">
                    <div>
                        <label for="banReason" class="${LABEL_CLASS}">Reason for Ban <span class="text-red-500">*</span></label>
                        <textarea id="banReason" name="banReason" rows="3" required placeholder="Enter the reason for this ban" class="${FIELD_CLASS} resize-none">${isEdit && ban?.reason ? ban.reason : ''}</textarea>
                    </div>
                    <div>
                        <label for="banDuration" class="${LABEL_CLASS}">Ban Duration</label>
                        <select id="banDuration" name="banDuration" class="${FIELD_CLASS}">
                            <option value="permanent" ${isEdit && ban?.ban_duration_type === 'permanent' ? 'selected' : ''}>Permanent</option>
                            <option value="temporary" ${isEdit && ban?.ban_duration_type === 'temporary' ? 'selected' : ''}>Temporary</option>
                        </select>
                    </div>
                    <div id="expirationSection" class="${isEdit && ban?.expires_at ? '' : 'hidden'}">
                        <label for="expirationDate" class="${LABEL_CLASS}">Expiration Date & Time</label>
                        <input type="datetime-local" id="expirationDate" name="expirationDate" value="${isEdit && ban?.expires_at ? ban.expires_at.slice(0, 16) : ''}" class="${FIELD_CLASS}">
                    </div>
                </div>
            `)}
            <div id="formError" class="hidden text-sm text-red-700 bg-red-50 border border-red-200 rounded-xl px-3 py-2.5"></div>
            ${modalActions({ cancelOnclick: 'closeManageBannedModal()', submitText: buttonText, danger: true })}
        </form>
    `;

    openModal(title, formContent, 'mid-large');
    applyModalDomino();

    setTimeout(() => {
        setupFormHandlers(ban?.id, buttonText, onSubmit);

        loadSessions().then(() => {
            if (isEdit && ban) {
                populateFormWithBan(ban);
            }
        });
    }, 100);
}

function populateFormWithBan(ban) {
    const banTypeInput = document.getElementById('banType');
    if (banTypeInput) banTypeInput.value = ban.ban_type;

    const banReasonInput = document.getElementById('banReason');
    if (banReasonInput) banReasonInput.value = ban.reason;

    const banDurationInput = document.getElementById('banDuration');
    if (banDurationInput) banDurationInput.value = ban.ban_duration_type;

    if (ban.ban_type === 'session' || ban.ban_type === 'overall') {
        const sessionSelect = document.getElementById('sessionSelect');
        if (sessionSelect && ban.session_id) {
            sessionSelect.value = ban.session_id;
        }
    }

    if (ban.ban_type === 'overall') {
        const targetTypeInput = document.getElementById('targetType');
        if (targetTypeInput) targetTypeInput.value = ban.target_type;

        const targetIdInput = document.getElementById('targetId');
        if (targetIdInput) targetIdInput.value = ban.target_id;

        const targetUserSelect = document.getElementById('targetUser');
        if (targetUserSelect && ban.target_id) {
            targetUserSelect.value = ban.target_id;
        }
    }

    if (ban.ban_type === 'ip') {
        const ipAddressInput = document.getElementById('ipAddress');
        if (ipAddressInput) ipAddressInput.value = ban.ip_address;

        const ipBanTypeInput = document.getElementById('ipBanType');
        if (ipBanTypeInput) ipBanTypeInput.value = ban.ip_ban_scope || 'session';
    }

    if (ban.expires_at) {
        const expirationDateInput = document.getElementById('expirationDate');
        if (expirationDateInput) {
            expirationDateInput.value = ban.expires_at.slice(0, 16);
        }
    }

    setTimeout(() => {
        triggerBanTypeChange(ban.ban_type);
    }, 50);
}

async function loadSessions() {
    try {
        const result = await getSessions();
        sessions = result.sessions || [];

        const select = document.getElementById('sessionSelect');
        if (!select) {
            console.error('sessionSelect element not found');
            return;
        }

        select.innerHTML = '<option value="">Select a session</option>';

        sessions.forEach(session => {
            const option = document.createElement('option');
            option.value = session.id;
            option.dataset.userId = session.user_id;
            option.dataset.userType = session.user_type;
            option.textContent = `${session.user_name || session.user_type} - ${session.ip_address} (${session.device_type || 'Unknown'})`;
            select.appendChild(option);
        });
    } catch (error) {
        console.error('Error loading sessions:', error);
        showToast('Failed to load sessions', 'error');
    }
}

async function loadUsers(userType) {
    try {
        let url;
        if (userType === 'admin') {
            url = API_ROUTES.ADMIN.ADMIN_GET_ALL;
        } else if (userType === 'adviser') {
            url = API_ROUTES.ADMIN.ADVISER_GET_ALL;
        } else if (userType === 'student') {
            url = API_ROUTES.ADMIN.STUDENT_GET_ALL;
        }

        const response = await fetch(url, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
            }
        });
        const data = await response.json();
        
        users[userType] = data.admins || data.advisers || data.students || [];
        
        const select = document.getElementById('targetUser');
        select.innerHTML = '<option value="">Select a user</option>';
        
        users[userType].forEach(user => {
            const option = document.createElement('option');
            option.value = user.id;
            const name = user.name || (user.first_name && user.last_name ? `${user.first_name} ${user.last_name}` : 'Unknown');
            option.textContent = `${name} (ID: ${user.id})`;
            select.appendChild(option);
        });
    } catch (error) {
        console.error(`Error loading ${userType}s:`, error);
        showToast(`Failed to load ${userType}s`, 'error');
    }
}

function triggerBanTypeChange(banType) {
    document.getElementById('sessionFieldset').classList.add('hidden');
    document.getElementById('targetFieldset').classList.add('hidden');
    document.getElementById('targetUserSection').classList.add('hidden');
    document.getElementById('ipFieldset').classList.add('hidden');

    if (banType === 'session') {
        document.getElementById('sessionFieldset').classList.remove('hidden');
    } else if (banType === 'overall') {
        document.getElementById('sessionFieldset').classList.remove('hidden');
        document.getElementById('targetFieldset').classList.remove('hidden');
    } else if (banType === 'ip') {
        document.getElementById('ipFieldset').classList.remove('hidden');
    }
}

function setupFormHandlers(banId, buttonText, onSubmit) {
    const form = document.getElementById('banForm');
    if (form) {
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            await processBanSubmit(banId, buttonText, onSubmit);
        });
    }

    const banTypeInput = document.getElementById('banType');
    if (banTypeInput) {
        banTypeInput.addEventListener('change', function() {
            triggerBanTypeChange(this.value);
        });
    }

    const targetTypeInput = document.getElementById('targetType');
    if (targetTypeInput) {
        targetTypeInput.addEventListener('change', function() {
            const targetType = this.value;
            
            if (targetType) {
                document.getElementById('targetUserSection').classList.remove('hidden');
                loadUsers(targetType);
            } else {
                document.getElementById('targetUserSection').classList.add('hidden');
            }
        });
    }

    const targetUserInput = document.getElementById('targetUser');
    if (targetUserInput) {
        targetUserInput.addEventListener('change', function() {
            document.getElementById('targetId').value = this.value;
        });
    }

    const sessionSelect = document.getElementById('sessionSelect');
    if (sessionSelect) {
        sessionSelect.addEventListener('change', function() {
            const selectedOption = this.options[this.selectedIndex];
            if (selectedOption && selectedOption.dataset.userId) {
                document.getElementById('targetId').value = selectedOption.dataset.userId;
                document.getElementById('targetType').value = selectedOption.dataset.userType;
            }
        });
    }

    const banDurationInput = document.getElementById('banDuration');
    if (banDurationInput) {
        banDurationInput.addEventListener('change', function() {
            const duration = this.value;
            
            if (duration === 'temporary') {
                document.getElementById('expirationSection').classList.remove('hidden');
            } else {
                document.getElementById('expirationSection').classList.add('hidden');
            }
        });
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

async function processBanSubmit(id, buttonText, onSubmit) {
    hideFormError();

    const banType = document.getElementById('banType').value;
    const reason = document.getElementById('banReason').value;
    const banDuration = document.getElementById('banDuration').value;
    
    if (!banType || !reason) {
        showFormError('Please fill in all required fields');
        return;
    }

    const banData = {
        ban_type: banType,
        reason: reason,
        ban_duration_type: banDuration
    };

    if (banType === 'session') {
        const sessionId = document.getElementById('sessionSelect').value;
        if (!sessionId) {
            showFormError('Please select a session');
            return;
        }
        banData.session_id = parseInt(sessionId);
    } else if (banType === 'overall') {
        const targetType = document.getElementById('targetType').value;
        const targetId = document.getElementById('targetId').value;
        const sessionId = document.getElementById('sessionSelect').value;
        
        if (!targetType || !targetId) {
            showFormError('Please select target type and ID');
            return;
        }
        banData.target_type = targetType;
        banData.target_id = parseInt(targetId);
        if (sessionId) {
            banData.session_id = parseInt(sessionId);
        }
    } else if (banType === 'ip') {
        const ipAddress = document.getElementById('ipAddress').value;
        const ipBanType = document.getElementById('ipBanType').value;
        
        if (!ipAddress) {
            showFormError('Please enter an IP address');
            return;
        }
        banData.ip_address = ipAddress;
        banData.ban_type = 'ip';
        banData.ip_ban_scope = ipBanType;
    }

    if (banDuration === 'temporary') {
        const expirationDate = document.getElementById('expirationDate').value;
        if (!expirationDate) {
            showFormError('Please set an expiration date');
            return;
        }
        banData.expires_at = expirationDate;
    }

    setModalButtonLoading('submitBtn', true, buttonText);
    try {
        await onSubmit(id, banData);
        closeManageBannedModal();
        showToast('Ban created successfully', 'success');
    } catch (error) {
        console.error('Error saving ban:', error);
        showFormError('Failed to save ban. Please try again.');
        setModalButtonLoading('submitBtn', false, buttonText);
        showToast('Failed to create ban', 'error');
    }
}

async function closeManageBannedModal() {
    const modalOverlay = document.getElementById('modal-overlay');
    const modalContent = document.getElementById('modal-content');
    
    if (modalOverlay && modalContent) {
        await animateModalClose(modalOverlay, modalContent, 'scale');
        clearModalAnimations(modalOverlay, modalContent);
        modalOverlay.remove();
        document.body.classList.remove('overflow-hidden');
        document.removeEventListener('keydown', (e) => {
            if (e.key === 'Escape') closeManageBannedModal();
        });
    } else {
        closeModal();
    }
}

window.closeManageBannedModal = closeManageBannedModal;
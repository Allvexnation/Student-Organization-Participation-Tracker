import { openModal, closeModal, setModalButtonLoading } from '../../../utils/modal.js';
import { animateModalClose, clearModalAnimations } from '../../../provider/ModalAnimation.js';
import { submitAppeal } from '../../../api/Contacts/Contacts.js';
import { showToast } from '../../ToastMessage.js';
import { FIELD_CLASS, LABEL_CLASS, modalSection, modalActions, applyModalDomino } from '../modalUi.js';

export function showBannedContactsModal() {
    const formContent = `
        <form id="appealForm" class="manage-modal-form space-y-4">
            ${modalSection('Personal Information', `
                <div class="space-y-3">
                    <div>
                        <label for="appealName" class="${LABEL_CLASS}">Your Name <span class="text-red-500">*</span></label>
                        <input type="text" id="appealName" name="appealName" required placeholder="Enter your full name" class="${FIELD_CLASS}">
                    </div>
                    <div>
                        <label for="appealEmail" class="${LABEL_CLASS}">Email Address <span class="text-red-500">*</span></label>
                        <input type="email" id="appealEmail" name="appealEmail" required placeholder="Enter your email address" class="${FIELD_CLASS}">
                    </div>
                </div>
            `)}
            ${modalSection('Ban Information', `
                <div>
                    <label for="appealIp" class="${LABEL_CLASS}">IP Address Used Before Ban <span class="text-red-500">*</span></label>
                    <div class="flex flex-col sm:flex-row gap-2">
                        <input type="text" id="appealIp" name="appealIp" required placeholder="Enter the IP address you were using" class="${FIELD_CLASS} flex-1">
                        <button type="button" id="detectIpBtn" class="w-full sm:w-auto px-3 py-2.5 text-sm font-medium text-navy bg-blue-50 hover:bg-blue-100 border border-blue-100 rounded-xl transition inline-flex items-center justify-center gap-2">
                            <i data-lucide="refresh-cw" class="w-4 h-4"></i>
                            <span class="sm:hidden">Detect IP</span>
                        </button>
                    </div>
                    <p class="text-xs text-muted mt-1.5">
                        <a href="https://www.whatismyip.com/" target="_blank" rel="noopener" class="text-navy hover:underline">Check your IP here</a>
                    </p>
                </div>
            `)}
            ${modalSection('Appeal Details', `
                <div class="space-y-3">
                    <div>
                        <label for="appealSubject" class="${LABEL_CLASS}">Appeal Subject <span class="text-red-500">*</span></label>
                        <input type="text" id="appealSubject" name="appealSubject" required placeholder="Brief subject for your appeal" class="${FIELD_CLASS}">
                    </div>
                    <div>
                        <label for="appealReason" class="${LABEL_CLASS}">Reason for Appeal <span class="text-red-500">*</span></label>
                        <textarea id="appealReason" name="appealReason" required rows="4" placeholder="Please explain why you believe the ban should be lifted..." class="${FIELD_CLASS} resize-none"></textarea>
                    </div>
                </div>
            `)}
            <div id="formError" class="hidden text-sm text-red-700 bg-red-50 border border-red-200 rounded-xl px-3 py-2.5"></div>
            ${modalActions({ cancelOnclick: 'closeBannedContactsModal()', submitText: 'Submit Appeal' })}
        </form>
    `;

    openModal('Submit Ban Appeal', formContent, 'mid-large');
    applyModalDomino();
    setupFormHandlers();
}

function setupFormHandlers() {
    const form = document.getElementById('appealForm');
    if (form) {
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            await processAppealSubmit();
        });
    }

    const detectIpBtn = document.getElementById('detectIpBtn');
    if (detectIpBtn) {
        detectIpBtn.addEventListener('click', detectIP);
    }

    detectIP();
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

async function detectIP() {
    const ipInput = document.getElementById('appealIp');
    const detectBtn = document.getElementById('detectIpBtn');
    
    if (!ipInput || !detectBtn) return;

    detectBtn.disabled = true;
    detectBtn.innerHTML = '<i data-lucide="loader-2" class="w-4 h-4 animate-spin"></i><span class="sm:hidden">Detecting...</span>';
    if (typeof lucide !== 'undefined') lucide.createIcons();

    try {
        const ipResponse = await fetch('https://api.ipify.org?format=json');
        const ipData = await ipResponse.json();
        if (ipData.ip) {
            ipInput.value = ipData.ip;
        }
    } catch (error) {
        console.log('Could not auto-detect IP');
    } finally {
        detectBtn.disabled = false;
        detectBtn.innerHTML = '<i data-lucide="refresh-cw" class="w-4 h-4"></i><span class="sm:hidden">Detect IP</span>';
        if (typeof lucide !== 'undefined') lucide.createIcons();
    }
}

async function processAppealSubmit() {
    hideFormError();

    const formData = {
        name: document.getElementById('appealName').value.trim(),
        email: document.getElementById('appealEmail').value.trim(),
        ip_address: document.getElementById('appealIp').value.trim(),
        subject: document.getElementById('appealSubject').value.trim(),
        reason: document.getElementById('appealReason').value.trim()
    };

    setModalButtonLoading('submitBtn', true, 'Submit Appeal');

    try {
        const result = await submitAppeal(formData);

        if (result.success) {
            closeBannedContactsModal();
            showToast('Your appeal has been submitted successfully. You will receive a confirmation email shortly.', 'success');
        } else {
            showFormError(result.data?.message || 'Failed to submit appeal. Please try again.');
            setModalButtonLoading('submitBtn', false, 'Submit Appeal');
            showToast('Failed to submit appeal', 'error');
        }
    } catch (error) {
        console.error('Error submitting appeal:', error);
        showFormError('An error occurred. Please try again later.');
        setModalButtonLoading('submitBtn', false, 'Submit Appeal');
        showToast('Failed to submit appeal', 'error');
    }
}

async function closeBannedContactsModal() {
    const modalOverlay = document.getElementById('modal-overlay');
    const modalContent = document.getElementById('modal-content');
    
    if (modalOverlay && modalContent) {
        await animateModalClose(modalOverlay, modalContent, 'scale');
        clearModalAnimations(modalOverlay, modalContent);
        modalOverlay.remove();
        document.body.classList.remove('overflow-hidden');
        document.removeEventListener('keydown', (e) => {
            if (e.key === 'Escape') closeBannedContactsModal();
        });
    } else {
        closeModal();
    }
}

window.closeBannedContactsModal = closeBannedContactsModal;
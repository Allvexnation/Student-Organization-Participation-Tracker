import { openModal, closeModal, setModalButtonLoading } from '../../../utils/modal.js';
import { animateModalClose, clearModalAnimations } from '../../../provider/ModalAnimation.js';
import { API_ROUTES } from '../../../api/server/api.js';
import { showToast } from '../../ToastMessage.js';
import { FIELD_CLASS, LABEL_CLASS, FILE_CLASS, modalSection, modalActions, applyModalDomino } from '../modalUi.js';

const TAB_ACTIVE = 'px-3 py-2.5 text-sm font-semibold rounded-xl bg-navy text-white transition';
const TAB_IDLE = 'px-3 py-2.5 text-sm font-medium rounded-xl text-muted hover:bg-surface transition';

export function showContactSupportModal(type = 'contact') {
    const isContact = type === 'contact';

    const formContent = `
        <div class="support-modal-shell flex flex-col flex-1 min-h-0">
            <div class="support-modal-tabs reveal shrink-0 px-4 pt-4 md:px-0 md:pt-0" data-domino-enter>
                <div class="grid grid-cols-2 gap-1 rounded-2xl border border-line bg-white p-1.5">
                    <button type="button" id="modalContactTab" onclick="switchModalTab('contact')" class="${isContact ? TAB_ACTIVE : TAB_IDLE}">
                        Contact Us
                    </button>
                    <button type="button" id="modalReportTab" onclick="switchModalTab('report')" class="${isContact ? TAB_IDLE : TAB_ACTIVE}">
                        Report a Problem
                    </button>
                </div>
            </div>
            <form id="contactForm" class="manage-modal-form space-y-4${isContact ? '' : ' hidden'}"${isContact ? '' : ' hidden'}>
                ${getContactForm()}
            </form>
            <form id="reportForm" class="manage-modal-form space-y-4${isContact ? ' hidden' : ''}"${isContact ? ' hidden' : ''}>
                ${getReportForm()}
            </form>
        </div>
    `;

    openModal(isContact ? 'Contact Us' : 'Report a Problem', formContent, 'mid-large');

    const contactForm = document.getElementById('contactForm');
    const reportForm = document.getElementById('reportForm');
    setSupportFormVisible(contactForm, isContact);
    setSupportFormVisible(reportForm, !isContact);

    applyModalDomino(isContact ? contactForm : reportForm);
    setupFormHandlers();
}

function getContactForm() {
    return `
        ${modalSection('Your Details', `
            <div class="space-y-3">
                <div>
                    <label for="contactName" class="${LABEL_CLASS}">Name <span class="text-red-500">*</span></label>
                    <input type="text" id="contactName" name="name" required placeholder="Your full name" class="${FIELD_CLASS}">
                </div>
                <div>
                    <label for="contactEmail" class="${LABEL_CLASS}">Email <span class="text-red-500">*</span></label>
                    <input type="email" id="contactEmail" name="email" required placeholder="your.email@example.com" class="${FIELD_CLASS}">
                </div>
            </div>
        `)}
        ${modalSection('Message', `
            <div class="space-y-3">
                <div>
                    <label for="contactSubject" class="${LABEL_CLASS}">Subject <span class="text-red-500">*</span></label>
                    <input type="text" id="contactSubject" name="subject" required placeholder="What is this about?" class="${FIELD_CLASS}">
                </div>
                <div>
                    <label for="contactMessage" class="${LABEL_CLASS}">Message <span class="text-red-500">*</span></label>
                    <textarea id="contactMessage" name="message" required rows="4" placeholder="Tell us more..." class="${FIELD_CLASS} resize-none"></textarea>
                </div>
            </div>
        `)}
        <div id="contactFormError" class="hidden text-sm text-red-700 bg-red-50 border border-red-200 rounded-xl px-3 py-2.5"></div>
        ${modalActions({ cancelOnclick: 'closeContactSupportModal()', submitText: 'Send Message', submitId: 'contactSubmitBtn' })}
    `;
}

function getReportForm() {
    return `
        ${modalSection('Your Details', `
            <div class="space-y-3">
                <div>
                    <label for="reportName" class="${LABEL_CLASS}">Name <span class="text-red-500">*</span></label>
                    <input type="text" id="reportName" name="name" required placeholder="Your full name" class="${FIELD_CLASS}">
                </div>
                <div>
                    <label for="reportEmail" class="${LABEL_CLASS}">Email <span class="text-red-500">*</span></label>
                    <input type="email" id="reportEmail" name="email" required placeholder="your.email@example.com" class="${FIELD_CLASS}">
                </div>
            </div>
        `)}
        ${modalSection('Issue Details', `
            <div class="space-y-3">
                <div>
                    <label for="reportSubject" class="${LABEL_CLASS}">Subject <span class="text-red-500">*</span></label>
                    <select id="reportSubject" name="subject" required class="${FIELD_CLASS}">
                        <option value="">Select a category</option>
                        <option value="Bugs">Bugs</option>
                        <option value="Error">Error</option>
                        <option value="Glitches">Glitches</option>
                        <option value="System Issue">System Issue</option>
                    </select>
                </div>
                <div>
                    <label for="reportLink" class="${LABEL_CLASS}">Page Link <span class="text-red-500">*</span></label>
                    <input type="url" id="reportLink" name="link" required placeholder="https://example.com/page-with-issue" class="${FIELD_CLASS}">
                </div>
                <div>
                    <label for="reportDescription" class="${LABEL_CLASS}">Description <span class="text-red-500">*</span></label>
                    <textarea id="reportDescription" name="description" required rows="4" placeholder="Describe the issue in detail..." class="${FIELD_CLASS} resize-none"></textarea>
                </div>
            </div>
        `)}
        ${modalSection('Diagnostics', `
            <div class="space-y-3">
                <div>
                    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1.5 mb-1.5">
                        <label for="reportConsoleLog" class="${LABEL_CLASS} mb-0">Console Log (Optional)</label>
                        <button type="button" onclick="openConsole()" class="text-xs font-medium text-navy hover:underline self-start">How to copy logs</button>
                    </div>
                    <textarea id="reportConsoleLog" name="console_log" rows="3" placeholder="Paste console errors here (optional)" class="${FIELD_CLASS} resize-none font-mono"></textarea>
                </div>
                <div>
                    <label for="reportImages" class="${LABEL_CLASS}">Attach Images (Max 5)</label>
                    <input type="file" id="reportImages" name="images" multiple accept="image/*" class="${FILE_CLASS}">
                    <p class="text-xs text-muted mt-1.5">You can attach up to 5 images</p>
                    <div id="imagePreview" class="mt-2 grid grid-cols-2 sm:grid-cols-5 gap-2"></div>
                </div>
            </div>
        `)}
        <div id="reportFormError" class="hidden text-sm text-red-700 bg-red-50 border border-red-200 rounded-xl px-3 py-2.5"></div>
        ${modalActions({ cancelOnclick: 'closeContactSupportModal()', submitText: 'Submit Report', submitId: 'reportSubmitBtn', danger: true })}
    `;
}

function setupFormHandlers() {
    const contactForm = document.getElementById('contactForm');
    const reportForm = document.getElementById('reportForm');

    if (contactForm) {
        contactForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            await processContactSubmit();
        });
    }

    if (reportForm) {
        reportForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            await processReportSubmit();
        });
    }

    const imageInput = document.getElementById('reportImages');
    const imagePreview = document.getElementById('imagePreview');

    if (imageInput) {
        imageInput.addEventListener('change', function(e) {
            const files = Array.from(e.target.files);
            if (files.length > 5) {
                showToast('You can only upload up to 5 images', 'error');
                this.value = '';
                imagePreview.innerHTML = '';
                return;
            }

            imagePreview.innerHTML = '';
            files.forEach((file, index) => {
                if (file.type.startsWith('image/')) {
                    const reader = new FileReader();
                    reader.onload = function(e) {
                        const div = document.createElement('div');
                        div.className = 'relative';
                        div.innerHTML = `
                            <img src="${e.target.result}" alt="Attachment ${index + 1}" class="w-full h-16 object-cover rounded-xl border border-line">
                            <button type="button" onclick="removeModalImage(${index})"
                                class="absolute -top-1.5 -right-1.5 h-5 w-5 rounded-full bg-danger text-white text-xs flex items-center justify-center">×</button>
                        `;
                        imagePreview.appendChild(div);
                    };
                    reader.readAsDataURL(file);
                }
            });
        });
    }
}

const FORM_LAYOUT_CLASSES = [
    'manage-modal-scroll-parent',
    'flex',
    'flex-col',
    'flex-1',
    'min-h-0',
    'overflow-hidden',
    'h-full'
];

function setSupportFormVisible(form, visible) {
    if (!form) return;
    form.classList.toggle('hidden', !visible);
    form.toggleAttribute('hidden', !visible);
    if (!visible) {
        // Layout flex classes also force display; strip them when hiding.
        form.classList.remove(...FORM_LAYOUT_CLASSES);
    }
}

window.switchModalTab = function(tab) {
    const contactTab = document.getElementById('modalContactTab');
    const reportTab = document.getElementById('modalReportTab');
    const contactForm = document.getElementById('contactForm');
    const reportForm = document.getElementById('reportForm');
    const heading = document.querySelector('#modal-content h3');

    if (!contactTab || !reportTab || !contactForm || !reportForm) return;

    const isContact = tab === 'contact';
    contactTab.className = isContact ? TAB_ACTIVE : TAB_IDLE;
    reportTab.className = isContact ? TAB_IDLE : TAB_ACTIVE;
    setSupportFormVisible(contactForm, isContact);
    setSupportFormVisible(reportForm, !isContact);
    if (heading) heading.textContent = isContact ? 'Contact Us' : 'Report a Problem';

    applyModalDomino(isContact ? contactForm : reportForm);
};

window.openConsole = function() {
    alert('To open the console:\n\n1. Press F12 on your keyboard\n2. Or right-click anywhere on the page and select "Inspect"\n3. Then click on the "Console" tab\n4. Copy any red error messages and paste them in the Console Log field');
};

window.removeModalImage = function(index) {
    const input = document.getElementById('reportImages');
    const dt = new DataTransfer();
    const files = Array.from(input.files);
    files.splice(index, 1);
    files.forEach(file => dt.items.add(file));
    input.files = dt.files;
    input.dispatchEvent(new Event('change'));
};

function showFormError(formId, message) {
    const el = document.getElementById(formId + 'Error');
    if (el) {
        el.textContent = message;
        el.classList.remove('hidden');
    }
}

function hideFormError(formId) {
    const el = document.getElementById(formId + 'Error');
    if (el) el.classList.add('hidden');
}

async function processContactSubmit() {
    hideFormError('contactForm');

    const formData = {
        name: document.getElementById('contactName').value.trim(),
        email: document.getElementById('contactEmail').value.trim(),
        subject: document.getElementById('contactSubject').value.trim(),
        message: document.getElementById('contactMessage').value.trim()
    };

    setModalButtonLoading('contactSubmitBtn', true, 'Send Message');

    try {
        const response = await fetch(API_ROUTES.CONTACTS.SUBMIT_CONTACT, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(formData)
        });

        const result = await response.json();

        if (response.ok) {
            closeContactSupportModal();
            showToast('Message sent successfully!', 'success');
        } else {
            showFormError('contactForm', result.message || 'Failed to send message');
            setModalButtonLoading('contactSubmitBtn', false, 'Send Message');
            showToast('Failed to send message', 'error');
        }
    } catch (error) {
        console.error('Error submitting contact:', error);
        showFormError('contactForm', 'An error occurred. Please try again later.');
        setModalButtonLoading('contactSubmitBtn', false, 'Send Message');
        showToast('Network error. Please try again.', 'error');
    }
}

async function processReportSubmit() {
    hideFormError('reportForm');

    const images = document.getElementById('reportImages').files;

    if (images.length > 5) {
        showFormError('reportForm', 'You can only upload up to 5 images');
        return;
    }

    const formData = {
        name: document.getElementById('reportName').value.trim(),
        email: document.getElementById('reportEmail').value.trim(),
        subject: document.getElementById('reportSubject').value.trim(),
        link: document.getElementById('reportLink').value.trim(),
        console_log: document.getElementById('reportConsoleLog').value.trim(),
        description: document.getElementById('reportDescription').value.trim()
    };

    setModalButtonLoading('reportSubmitBtn', true, 'Submit Report');

    const imageData = [];
    for (let i = 0; i < images.length; i++) {
        const base64 = await fileToBase64(images[i]);
        imageData.push(base64);
    }

    if (imageData.length > 0) {
        formData.images = imageData;
    }

    try {
        const response = await fetch(API_ROUTES.CONTACTS.SUBMIT_REPORT, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(formData)
        });

        const result = await response.json();

        if (response.ok) {
            closeContactSupportModal();
            showToast('Report submitted successfully!', 'success');
        } else {
            showFormError('reportForm', result.message || 'Failed to submit report');
            setModalButtonLoading('reportSubmitBtn', false, 'Submit Report');
            showToast('Failed to submit report', 'error');
        }
    } catch (error) {
        console.error('Error submitting report:', error);
        showFormError('reportForm', 'An error occurred. Please try again later.');
        setModalButtonLoading('reportSubmitBtn', false, 'Submit Report');
        showToast('Network error. Please try again.', 'error');
    }
}

function fileToBase64(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result);
        reader.onerror = error => reject(error);
    });
}

async function closeContactSupportModal() {
    const modalOverlay = document.getElementById('modal-overlay');
    const modalContent = document.getElementById('modal-content');

    if (modalOverlay && modalContent) {
        await animateModalClose(modalOverlay, modalContent, 'scale');
        clearModalAnimations(modalOverlay, modalContent);
        modalOverlay.remove();
        document.body.classList.remove('overflow-hidden');
        document.removeEventListener('keydown', (e) => {
            if (e.key === 'Escape') closeContactSupportModal();
        });
    } else {
        closeModal();
    }
}

window.closeContactSupportModal = closeContactSupportModal;
window.showContactSupportModal = showContactSupportModal;

import { animateModalOpen, animateModalClose, clearModalAnimations } from '../provider/ModalAnimation.js';
import { playImmediateDomino } from '../provider/Animation/HomepageAnimation.js';
import { pinManageModalActions } from '../components/Modal/modalUi.js';

export function openModal(title, content, size = 'medium', zIndex = 'z-50', animationType = 'scale') {
    closeModal();

    const modal = document.createElement('div');
    modal.id = 'modal-overlay';
    modal.className = `fixed inset-0 ${zIndex} font-sans`;

    const sizeClasses = {
        small: 'md:max-w-md',
        medium: 'md:max-w-lg',
        large: 'md:max-w-2xl',
        'mid-large': 'md:max-w-xl'
    };

    modal.innerHTML = `
        <div class="absolute inset-0 bg-ink/50" data-modal-overlay></div>
        <div class="absolute inset-0 flex items-end md:items-center justify-center p-0 md:p-4 pointer-events-none">
            <div id="modal-content" class="manage-modal-panel pointer-events-auto relative bg-white shadow-lift-lg w-full min-w-0 ${sizeClasses[size] || sizeClasses.medium} max-h-[92vh] overflow-hidden rounded-t-3xl md:rounded-2xl flex flex-col" data-modal-panel>
                <div class="mx-auto mt-2.5 h-1.5 w-12 rounded-full bg-line md:hidden"></div>
                <div class="manage-modal-header sticky top-0 z-10 bg-white/95 backdrop-blur flex justify-between items-start gap-3 px-5 sm:px-6 pt-3 pb-4 border-b border-line shrink-0" data-domino-enter>
                    <div class="min-w-0">
                        <p class="text-[11px] uppercase tracking-[0.16em] text-muted">Manage</p>
                        <h3 class="text-lg font-semibold text-ink leading-tight">${title}</h3>
                    </div>
                    <button type="button" onclick="closeModal()" class="h-10 w-10 shrink-0 inline-flex items-center justify-center rounded-xl text-muted hover:bg-surface hover:text-ink" aria-label="Close">
                        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                        </svg>
                    </button>
                </div>
                <div id="modal-body" class="p-0 md:p-6 overflow-y-auto flex-1 min-h-0 min-w-0 flex flex-col overscroll-contain">
                    ${content}
                </div>
            </div>
        </div>
    `;

    document.body.appendChild(modal);
    document.body.classList.add('overflow-hidden');

    const modalContent = document.getElementById('modal-content');
    if (modalContent) {
        pinManageModalActions(modalContent);
        animateModalOpen(modal, modalContent, animationType);
        requestAnimationFrame(() => playImmediateDomino(modalContent));
    }

    const backdrop = modal.querySelector('[data-modal-overlay]');
    backdrop?.addEventListener('click', () => closeModal());

    document.addEventListener('keydown', handleEscape);
}

export async function closeModal() {
    const modal = document.getElementById('modal-overlay');
    const modalContent = document.getElementById('modal-content');

    if (modal && modalContent) {
        await animateModalClose(modal, modalContent);
        clearModalAnimations(modal, modalContent);
        modal.remove();
        document.body.classList.remove('overflow-hidden');
        document.removeEventListener('keydown', handleEscape);
    } else if (modal) {
        modal.remove();
        document.body.classList.remove('overflow-hidden');
        document.removeEventListener('keydown', handleEscape);
    }
}

function handleEscape(e) {
    if (e.key === 'Escape') {
        closeModal();
    }
}

window.closeModal = closeModal;

export function setModalButtonLoading(buttonId, isLoading, originalText = 'Save') {
    const button = document.getElementById(buttonId);
    if (button) {
        if (isLoading) {
            button.disabled = true;
            button.dataset.originalText = button.textContent;
            button.textContent = 'Saving...';
            button.classList.add('opacity-50', 'cursor-not-allowed');
        } else {
            button.disabled = false;
            button.textContent = button.dataset.originalText || originalText;
            button.classList.remove('opacity-50', 'cursor-not-allowed');
        }
    }
}

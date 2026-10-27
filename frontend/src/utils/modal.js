import { animateModalOpen, animateModalClose, clearModalAnimations } from '../provider/ModalAnimation.js';

export function openModal(title, content, size = 'medium', zIndex = 'z-50', animationType = 'scale') {
    closeModal();

    const modal = document.createElement('div');
    modal.id = 'modal-overlay';
    modal.className = `fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center ${zIndex}`;
    
    const sizeClasses = {
        small: 'max-w-md',
        medium: 'max-w-lg',
        large: 'max-w-2xl',
        'mid-large': 'max-w-xl'
    };

    modal.innerHTML = `
        <div id="modal-content" class="bg-white rounded-lg shadow-xl ${sizeClasses[size] || sizeClasses.medium} w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div class="flex justify-between items-center p-4 border-b border-gray-200">
                <h3 class="text-lg font-semibold text-gray-800">${title}</h3>
                <button onclick="closeModal()" class="text-gray-500 hover:text-gray-700">
                    <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                    </svg>
                </button>
            </div>
            <div id="modal-body" class="p-4">
                ${content}
            </div>
        </div>
    `;

    document.body.appendChild(modal);

    const modalContent = document.getElementById('modal-content');
    if (modalContent) {
        animateModalOpen(modal, modalContent, animationType);
    }

    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            closeModal();
        }
    });

    document.addEventListener('keydown', handleEscape);
}

export async function closeModal() {
    const modal = document.getElementById('modal-overlay');
    const modalContent = document.getElementById('modal-content');
    
    if (modal && modalContent) {
        await animateModalClose(modal, modalContent);
        clearModalAnimations(modal, modalContent);
        modal.remove();
        document.removeEventListener('keydown', handleEscape);
    } else if (modal) {
        modal.remove();
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

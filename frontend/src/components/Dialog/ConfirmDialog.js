import { openModal, closeModal, setModalButtonLoading } from '../../utils/modal.js';

export function openConfirmDialog({ 
    title = 'Confirm Action', 
    message = 'Are you sure you want to proceed?', 
    onConfirm, 
    confirmText = 'Confirm', 
    cancelText = 'Cancel', 
    type = 'danger',
    showReason = false
}) {
    const isDanger = type === 'danger';
    
    const config = isDanger ? {
        icon: 'alert-triangle',
        iconBg: 'bg-red-50 text-red-600 border border-red-100',
        confirmBtnClass: 'bg-red-600 hover:bg-red-700 text-white focus:ring-2 focus:ring-red-500 focus:ring-offset-1'
    } : {
        icon: 'help-circle',
        iconBg: 'bg-blue-50 text-blue-900 border border-blue-100',
        confirmBtnClass: 'bg-blue-900 hover:bg-blue-800 text-white focus:ring-2 focus:ring-blue-500 focus:ring-offset-1'
    };

    const content = `
        <div class="space-y-4">
            <div class="flex items-center gap-3.5">
                <div class="flex-shrink-0 w-10 h-10 rounded-full ${config.iconBg} flex items-center justify-center">
                    <i data-lucide="${config.icon}" class="w-5 h-5"></i>
                </div>
                <div class="flex-1">
                    <p class="text-sm text-gray-700 leading-normal">${message}</p>
                </div>
            </div>
            ${showReason ? `
            <div>
                <label for="deleteReason" class="block text-sm font-medium text-gray-700 mb-1">Reason for deletion <span class="text-red-500">*</span></label>
                <textarea 
                    id="deleteReason" 
                    rows="3" 
                    placeholder="Please provide a reason for this deletion..."
                    class="w-full px-3 py-2 text-sm border border-gray-200 rounded-md focus:ring-2 focus:ring-red-500 focus:border-transparent transition resize-none"></textarea>
            </div>
            ` : ''}

            <div class="flex items-center justify-end gap-2 pt-3">
                <button 
                    type="button" 
                    id="cancelBtn" 
                    onclick="closeModal()" 
                    class="px-3.5 py-2 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-200 transition">
                    ${cancelText}
                </button>
                <button 
                    type="button" 
                    id="confirmBtn" 
                    class="px-3.5 py-2 text-xs font-medium rounded-md transition focus:outline-none ${config.confirmBtnClass}">
                    ${confirmText}
                </button>
            </div>
        </div>
    `;

    openModal(title, content, 'small', 'z-[150]');

    if (typeof lucide !== 'undefined') {
        lucide.createIcons();
    }

    const confirmBtn = document.getElementById('confirmBtn');
    if (confirmBtn) {
        confirmBtn.addEventListener('click', async () => {
            if (showReason) {
                const reason = document.getElementById('deleteReason').value.trim();
                if (!reason) {
                    const reasonInput = document.getElementById('deleteReason');
                    reasonInput.classList.add('border-red-500');
                    reasonInput.placeholder = 'Reason is required';
                    return;
                }
            }

            setModalButtonLoading('confirmBtn', true, confirmText);
            try {
                const reason = showReason ? document.getElementById('deleteReason').value.trim() : null;
                await onConfirm(reason);
                closeModal();
            } catch (error) {
                console.error('Error in confirm action:', error);
                setModalButtonLoading('confirmBtn', false, confirmText);
            }
        });
    }
}

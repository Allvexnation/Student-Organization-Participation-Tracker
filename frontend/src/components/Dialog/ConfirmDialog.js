import { setModalButtonLoading } from '../../utils/modal.js';
import { animateModalOpen, animateModalClose, clearModalAnimations } from '../../provider/ModalAnimation.js';
import { playImmediateDomino } from '../../provider/Animation/HomepageAnimation.js';

const CONFIRM_OVERLAY_ID = 'confirm-dialog-overlay';
const CONFIRM_PANEL_ID = 'confirm-dialog-panel';

function ensureConfirmStyles() {
    if (document.getElementById('confirm-dialog-styles')) return;

    const style = document.createElement('style');
    style.id = 'confirm-dialog-styles';
    style.textContent = `
        .confirm-dialog-panel {
            transform-origin: 50% 40%;
        }

        @media (max-width: 767px) {
            .confirm-dialog-panel {
                transform-origin: 50% 100%;
                background:
                    linear-gradient(180deg, rgba(248, 250, 252, 1) 0%, rgba(255, 255, 255, 1) 28%);
            }

            .confirm-dialog-icon-wrap {
                width: 2.5rem;
                height: 2.5rem;
            }

            .confirm-dialog-icon {
                width: 1.15rem;
                height: 1.15rem;
            }

            .confirm-dialog-actions {
                position: sticky;
                bottom: 0;
                background: #fff;
                border-top: 1px solid var(--line, #e5e7eb);
                padding-bottom: max(1.25rem, env(safe-area-inset-bottom));
            }
        }
    `;
    document.head.appendChild(style);
}

function simpleIcon(name, toneClass, wrapClass) {
    return `
        <div class="confirm-dialog-icon-wrap shrink-0 w-11 h-11 md:w-12 md:h-12 rounded-full ${wrapClass} flex items-center justify-center">
            <i data-lucide="${name}" class="confirm-dialog-icon w-5 h-5 md:w-[1.35rem] md:h-[1.35rem] ${toneClass}" stroke-width="1.75"></i>
        </div>
    `;
}

async function closeConfirmDialog() {
    const overlay = document.getElementById(CONFIRM_OVERLAY_ID);
    const panel = document.getElementById(CONFIRM_PANEL_ID);

    if (!overlay) return;

    if (panel) {
        await animateModalClose(overlay, panel);
        clearModalAnimations(overlay, panel);
    }

    overlay.remove();
    document.removeEventListener('keydown', handleConfirmEscape);

    if (!document.getElementById('modal-overlay')) {
        document.body.classList.remove('overflow-hidden');
    }
}

function handleConfirmEscape(e) {
    if (e.key === 'Escape') {
        e.stopPropagation();
        closeConfirmDialog();
    }
}

export function openConfirmDialog({
    title = 'Confirm Action',
    message = 'Are you sure you want to proceed?',
    onConfirm,
    confirmText = 'Confirm',
    cancelText = 'Cancel',
    type = 'danger',
    showReason = false
}) {
    const existing = document.getElementById(CONFIRM_OVERLAY_ID);
    if (existing) existing.remove();

    const isDanger = type === 'danger';
    const iconName = isDanger ? 'alert-triangle' : 'help-circle';
    const iconTone = isDanger ? 'text-danger' : 'text-navy';
    const iconWrap = isDanger ? 'bg-white text-danger' : 'bg-white text-navy';
    const infoWrap = isDanger
        ? 'border-red-100 bg-red-50/70'
        : 'border-blue-100 bg-blue-50/60';
    const confirmBtnClass = isDanger
        ? 'bg-danger hover:bg-red-800 text-white'
        : 'bg-navy hover:bg-navy-700 text-white';

    ensureConfirmStyles();

    const overlay = document.createElement('div');
    overlay.id = CONFIRM_OVERLAY_ID;
    overlay.className = 'fixed inset-0 z-[200] font-sans';
    overlay.innerHTML = `
        <div class="absolute inset-0 bg-ink/50" data-modal-overlay data-confirm-backdrop></div>
        <div class="absolute inset-0 flex items-end md:items-center justify-center p-0 md:p-4 pointer-events-none">
            <div id="${CONFIRM_PANEL_ID}"
                class="confirm-dialog-panel pointer-events-auto relative bg-white border border-line shadow-lift-lg w-full min-w-0 md:max-w-md max-h-[92vh] overflow-hidden rounded-t-[1.75rem] md:rounded-2xl flex flex-col"
                data-modal-panel
                role="dialog"
                aria-modal="true"
                aria-labelledby="confirmDialogTitle"
                aria-describedby="confirmDialogMessage">

                <div class="mx-auto mt-2.5 h-1.5 w-12 rounded-full bg-line md:hidden" aria-hidden="true"></div>

                <div class="flex-1 min-h-0 overflow-y-auto overscroll-contain px-5 pt-5 pb-4 md:px-7 md:pt-7 md:pb-5 space-y-4">
                    <div class="confirm-dialog-info reveal rounded-2xl border ${infoWrap} p-4 sm:p-5" data-domino-enter>
                        <div class="flex items-start gap-3 sm:gap-3.5 md:gap-4 text-left">
                            <div class="mt-0.5">
                                ${simpleIcon(iconName, iconTone, iconWrap)}
                            </div>
                            <div class="min-w-0 flex-1 space-y-1.5 sm:space-y-2">
                                <h3 id="confirmDialogTitle" class="text-base sm:text-lg font-semibold text-ink leading-tight tracking-tight">
                                    ${title}
                                </h3>
                                <p id="confirmDialogMessage" class="text-sm text-muted leading-relaxed">
                                    ${message}
                                </p>
                            </div>
                        </div>
                    </div>

                    ${showReason ? `
                    <div class="reveal rounded-2xl border border-line bg-surface p-4 sm:p-5 text-left" data-domino-enter>
                        <label for="deleteReason" class="block text-sm font-medium text-ink mb-1.5">
                            Reason for deletion <span class="text-danger">*</span>
                        </label>
                        <textarea
                            id="deleteReason"
                            rows="3"
                            placeholder="Please provide a reason for this deletion..."
                            class="w-full px-3 py-2.5 text-sm border border-line rounded-xl bg-white text-ink placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-danger/20 focus:border-danger transition resize-none"></textarea>
                    </div>
                    ` : ''}
                </div>

                <div class="confirm-dialog-actions reveal shrink-0 px-5 pt-3 pb-5 md:px-7 md:pt-0 md:pb-6" data-domino-enter>
                    <div class="flex flex-col md:flex-row-reverse gap-2.5">
                        <button
                            type="button"
                            id="confirmBtn"
                            class="w-full md:w-auto md:min-w-[7.5rem] px-4 py-3 md:py-2.5 text-sm font-medium rounded-2xl md:rounded-xl transition focus:outline-none focus:ring-2 focus:ring-offset-1 ${confirmBtnClass}">
                            ${confirmText}
                        </button>
                        <button
                            type="button"
                            id="cancelBtn"
                            class="w-full md:w-auto md:min-w-[7.5rem] px-4 py-3 md:py-2.5 text-sm font-medium text-ink bg-surface hover:bg-line rounded-2xl md:rounded-xl transition focus:outline-none focus:ring-2 focus:ring-gray-200">
                            ${cancelText}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `;

    document.body.appendChild(overlay);
    document.body.classList.add('overflow-hidden');
    document.addEventListener('keydown', handleConfirmEscape, true);

    const panel = document.getElementById(CONFIRM_PANEL_ID);
    animateModalOpen(overlay, panel, 'scale');
    requestAnimationFrame(() => playImmediateDomino(panel));

    if (typeof lucide !== 'undefined') {
        lucide.createIcons();
    }

    overlay.querySelector('[data-confirm-backdrop]')?.addEventListener('click', () => {
        closeConfirmDialog();
    });

    document.getElementById('cancelBtn')?.addEventListener('click', () => {
        closeConfirmDialog();
    });

    const confirmBtn = document.getElementById('confirmBtn');
    if (confirmBtn) {
        confirmBtn.addEventListener('click', async () => {
            if (showReason) {
                const reasonInput = document.getElementById('deleteReason');
                const reason = reasonInput?.value.trim();
                if (!reason) {
                    reasonInput.classList.add('border-danger');
                    reasonInput.placeholder = 'Reason is required';
                    reasonInput.focus();
                    return;
                }
            }

            setModalButtonLoading('confirmBtn', true, confirmText);
            try {
                const reason = showReason ? document.getElementById('deleteReason').value.trim() : null;
                await onConfirm(reason);
                await closeConfirmDialog();
            } catch (error) {
                console.error('Error in confirm action:', error);
                setModalButtonLoading('confirmBtn', false, confirmText);
            }
        });
    }
}

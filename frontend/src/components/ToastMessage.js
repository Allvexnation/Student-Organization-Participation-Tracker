import { playImmediateDomino } from '../provider/Animation/HomepageAnimation.js';

let toastContainer = null;
let currentToast = null;
let dismissTimer = null;

const TOAST_TYPES = {
    success: {
        icon: 'check',
        tone: 'text-emerald-600',
        wrap: 'bg-white text-emerald-600',
        info: 'bg-emerald-50/70'
    },
    error: {
        icon: 'circle-alert',
        tone: 'text-danger',
        wrap: 'bg-white text-danger',
        info: 'bg-red-50/70'
    },
    warning: {
        icon: 'alert-triangle',
        tone: 'text-amber-600',
        wrap: 'bg-white text-amber-600',
        info: 'bg-amber-50/70'
    },
    info: {
        icon: 'info',
        tone: 'text-navy',
        wrap: 'bg-white text-navy',
        info: 'bg-blue-50/60'
    },
    loading: {
        icon: null,
        tone: 'text-navy',
        wrap: 'bg-white text-navy',
        info: 'bg-blue-50/60'
    }
};

function ensureToastStyles() {
    let style = document.getElementById('toast-message-styles');
    if (!style) {
        style = document.createElement('style');
        style.id = 'toast-message-styles';
        document.head.appendChild(style);
    }

    style.textContent = `
        #toast-container {
            position: fixed;
            top: max(1rem, env(safe-area-inset-top));
            right: auto;
            bottom: auto;
            left: 50%;
            transform: translateX(-50%);
            z-index: 2147483647;
            display: flex;
            flex-direction: column;
            align-items: stretch;
            gap: 0.5rem;
            width: calc(100% - 2rem);
            max-width: 22rem;
            pointer-events: none;
        }

        .toast-card,
        .toast-card * {
            pointer-events: auto;
            cursor: default;
            user-select: none;
            caret-color: transparent;
        }

        .toast-card {
            transform-origin: 50% 0%;
        }

        @keyframes toast-spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
        }

        .toast-spinner {
            width: 0.7rem;
            height: 0.7rem;
            border: 1.5px solid rgba(30, 64, 175, 0.2);
            border-top-color: currentColor;
            border-radius: 50%;
            animation: toast-spin 0.8s linear infinite;
        }
    `;
}

function ensureToastContainer() {
    ensureToastStyles();

    if (!toastContainer || !toastContainer.isConnected) {
        toastContainer = document.createElement('div');
        toastContainer.id = 'toast-container';
    }

    if (toastContainer.parentElement !== document.body) {
        document.body.appendChild(toastContainer);
    }

    return toastContainer;
}

function iconSvg(name) {
    const paths = {
        check: '<path d="M20 6 9 17l-5-5"/>',
        'circle-alert': '<circle cx="12" cy="12" r="10"/><path d="M12 8v4"/><path d="M12 16h.01"/>',
        'alert-triangle': '<path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3"/><path d="M12 9v4"/><path d="M12 17h.01"/>',
        info: '<circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/>',
        x: '<path d="M18 6 6 18"/><path d="m6 6 12 12"/>'
    };

    return `
        <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            ${paths[name] || paths.info}
        </svg>
    `;
}

function toastIcon(config, type) {
    if (type === 'loading') {
        return `
            <div class="toast-icon-wrap shrink-0 w-6 h-6 rounded-full ${config.wrap} flex items-center justify-center">
                <span class="toast-spinner ${config.tone}" aria-hidden="true"></span>
            </div>
        `;
    }

    return `
        <div class="toast-icon-wrap shrink-0 w-6 h-6 rounded-full ${config.wrap} flex items-center justify-center">
            ${iconSvg(config.icon)}
        </div>
    `;
}

function toastMarkup(message, type) {
    const config = TOAST_TYPES[type] || TOAST_TYPES.success;

    return `
        <div class="toast-info reveal ${config.info} px-2 py-1.5" data-domino-enter>
            <div class="flex items-center gap-2 text-left">
                <div class="reveal" data-domino-enter>
                    ${toastIcon(config, type)}
                </div>
                <p class="reveal min-w-0 flex-1 text-xs font-medium text-ink leading-snug" data-domino-enter>
                    ${message}
                </p>
                ${type !== 'loading' ? `
                <button type="button" class="toast-close reveal shrink-0 h-6 w-6 inline-flex items-center justify-center rounded-md text-muted hover:bg-white/70 hover:text-ink transition cursor-default" data-domino-enter aria-label="Dismiss">
                    ${iconSvg('x')}
                </button>
                ` : ''}
            </div>
        </div>
    `;
}

function paintToast(toast, message, type) {
    toast.innerHTML = toastMarkup(message, type);

    const closeBtn = toast.querySelector('.toast-close');
    if (closeBtn) {
        closeBtn.onclick = () => removeToast(toast);
    }

    requestAnimationFrame(() => playImmediateDomino(toast));
}

let toastSettled = null;

function resolveToastSettled() {
    const resolve = toastSettled;
    toastSettled = null;
    resolve?.();
}

function scheduleDismiss(toast, type, durationMs = 3000) {
    if (dismissTimer) {
        clearTimeout(dismissTimer);
        dismissTimer = null;
    }

    if (type === 'loading') {
        resolveToastSettled();
        return;
    }

    dismissTimer = setTimeout(() => {
        removeToast(toast);
    }, durationMs);
}

export function showToast(message, type = 'success', durationMs) {
    const container = ensureToastContainer();

    if (currentToast?.parentNode) {
        removeToast(currentToast, { immediate: true });
        currentToast = null;
    }

    const toast = document.createElement('div');
    toast.className = 'toast-card font-sans bg-white border border-line shadow-sm rounded-xl overflow-hidden';
    paintToast(toast, message, type);

    container.appendChild(toast);
    currentToast = toast;

    const settled = new Promise((resolve) => {
        toastSettled = resolve;
    });

    scheduleDismiss(toast, type, durationMs);
    return settled;
}

export function updateToast(message, type, durationMs) {
    if (!currentToast?.parentNode) {
        return showToast(message, type, durationMs);
    }

    paintToast(currentToast, message, type);
    const settled = new Promise((resolve) => {
        toastSettled = resolve;
    });
    scheduleDismiss(currentToast, type, durationMs);
    return settled;
}

function removeToast(toast, { immediate = false } = {}) {
    if (!toast) return;

    if (currentToast === toast) {
        currentToast = null;
        if (dismissTimer) {
            clearTimeout(dismissTimer);
            dismissTimer = null;
        }
    }

    if (immediate) {
        toast.remove();
        resolveToastSettled();
        return;
    }

    toast.style.transition = 'opacity 0.22s ease-out, transform 0.22s ease-out';
    toast.style.opacity = '0';
    toast.style.transform = 'scale(0.96) translateY(8px)';

    setTimeout(() => {
        toast.remove();
        resolveToastSettled();
    }, 220);
}

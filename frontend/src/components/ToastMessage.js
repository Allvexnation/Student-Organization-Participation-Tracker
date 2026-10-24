let toastContainer = null;
let currentToast = null;

export function showToast(message, type = 'success') {
    if (!toastContainer) {
        toastContainer = document.createElement('div');
        toastContainer.id = 'toast-container';
        toastContainer.style.cssText = `
            position: fixed;
            top: 20px;
            left: 50%;
            transform: translateX(-50%);
            z-index: 100000;
            display: flex;
            flex-direction: column;
            gap: 10px;
            align-items: center;
        `;
        document.body.appendChild(toastContainer);
    }

    if (currentToast && currentToast.parentNode) {
        removeToast(currentToast);
        currentToast = null;
    }

    const toast = document.createElement('div');

    const styles = {
        success: {
            backgroundColor: '#10B981',
            icon: '✓'
        },
        error: {
            backgroundColor: '#EF4444',
            icon: '✕'
        },
        warning: {
            backgroundColor: '#F59E0B',
            icon: '⚠'
        },
        info: {
            backgroundColor: '#3B82F6',
            icon: 'ℹ'
        },
        loading: {
            backgroundColor: '#3B82F6',
            icon: null
        }
    };

    const style = styles[type] || styles.success;

    toast.style.cssText = `
        min-width: 300px;
        max-width: 400px;
        padding: 8px 12px;
        background-color: white;
        color: #1f2937;
        border-radius: 6px;
        box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        display: flex;
        align-items: center;
        gap: 8px;
        animation: slideIn 0.3s ease-out;
        font-family: system-ui, -apple-system, sans-serif;
        font-size: 13px;
        pointer-events: auto;
    `;

    toast.innerHTML = `
        ${type === 'loading' ? `
            <span style="width: 16px; height: 16px; border: 2px solid rgba(59, 130, 246, 0.3); border-top-color: #3B82F6; border-radius: 50%; animation: spin 0.8s linear infinite;"></span>
        ` : `
            <span style="font-size: 15px; font-weight: bold; color: ${style.backgroundColor};">${style.icon}</span>
        `}
        <span style="flex: 1;">${message}</span>
        ${type !== 'loading' ? `
            <button style="background: none; border: none; color: #9ca3af; cursor: pointer; font-size: 16px; padding: 0; width: 20px; height: 20px; display: flex; align-items: center; justify-content: center;">&times;</button>
        ` : ''}
    `;

    const closeBtn = toast.querySelector('button');
    if (closeBtn) {
        closeBtn.onclick = () => removeToast(toast);
    }

    toastContainer.appendChild(toast);

    currentToast = toast;

    if (type !== 'loading') {
        setTimeout(() => {
            removeToast(toast);
        }, 3000);
    }
}

export function updateToast(message, type) {
    if (!currentToast) {
        return showToast(message, type);
    }

    const styles = {
        success: {
            backgroundColor: '#10B981',
            icon: '✓'
        },
        error: {
            backgroundColor: '#EF4444',
            icon: '✕'
        },
        warning: {
            backgroundColor: '#F59E0B',
            icon: '⚠'
        },
        info: {
            backgroundColor: '#3B82F6',
            icon: 'ℹ'
        },
        loading: {
            backgroundColor: '#3B82F6',
            icon: null
        }
    };

    const style = styles[type] || styles.success;

    currentToast.style.backgroundColor = 'white';
    currentToast.style.color = '#1f2937';

    currentToast.innerHTML = `
        ${type === 'loading' ? `
            <span style="width: 16px; height: 16px; border: 2px solid rgba(59, 130, 246, 0.3); border-top-color: #3B82F6; border-radius: 50%; animation: spin 0.8s linear infinite;"></span>
        ` : `
            <span style="font-size: 15px; font-weight: bold; color: ${style.backgroundColor};">${style.icon}</span>
        `}
        <span style="flex: 1;">${message}</span>
        ${type !== 'loading' ? `
            <button style="background: none; border: none; color: #9ca3af; cursor: pointer; font-size: 16px; padding: 0; width: 20px; height: 20px; display: flex; align-items: center; justify-content: center;">&times;</button>
        ` : ''}
    `;

    const closeBtn = currentToast.querySelector('button');
    if (closeBtn) {
        closeBtn.onclick = () => removeToast(currentToast);
    }

    if (type !== 'loading') {
        setTimeout(() => {
            removeToast(currentToast);
        }, 3000);
    }
}

function removeToast(toast) {
    toast.style.transition = 'opacity 0.3s ease-out';
    toast.style.opacity = '0';
    setTimeout(() => {
        if (toast.parentNode) {
            toast.parentNode.removeChild(toast);
        }
    }, 300);
}

const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from {
            transform: translateY(-100%);
            opacity: 0;
        }
        to {
            transform: translateY(0);
            opacity: 1;
        }
    }
    @keyframes slideOut {
        from {
            transform: translateY(0);
            opacity: 1;
        }
        to {
            transform: translateY(-100%);
            opacity: 0;
        }
    }
    @keyframes spin {
        from {
            transform: rotate(0deg);
        }
        to {
            transform: rotate(360deg);
        }
    }
    #toast-container > div:hover {
        transform: none !important;
        transition: none !important;
    }
    #toast-container:hover {
        transform: translateX(-50%) !important;
    }
`;
document.head.appendChild(style);

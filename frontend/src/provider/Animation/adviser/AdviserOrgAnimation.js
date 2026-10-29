export function animateModalOpen(modalOverlay, modalContent, animationType = 'scale') {
    if (!modalOverlay || !modalContent) return;

    modalOverlay.style.opacity = '0';
    modalContent.style.opacity = '0';
    modalContent.style.transform = 'scale(0.95)';

    requestAnimationFrame(() => {
        modalOverlay.style.transition = 'opacity 0.2s ease-out';
        modalContent.style.transition = 'opacity 0.2s ease-out, transform 0.2s ease-out';
        
        modalOverlay.style.opacity = '1';
        modalContent.style.opacity = '1';
        modalContent.style.transform = 'scale(1)';
    });
}

export function animateModalClose(modalOverlay, modalContent, animationType = 'scale') {
    return new Promise((resolve) => {
        if (!modalOverlay || !modalContent) {
            resolve();
            return;
        }

        modalOverlay.style.transition = 'opacity 0.15s ease-in';
        modalContent.style.transition = 'opacity 0.15s ease-in, transform 0.15s ease-in';
        
        modalOverlay.style.opacity = '0';
        modalContent.style.opacity = '0';
        modalContent.style.transform = 'scale(0.95)';

        setTimeout(() => {
            resolve();
        }, 150);
    });
}

export function clearModalAnimations(modalOverlay, modalContent) {
    if (modalOverlay) {
        modalOverlay.style.transition = '';
        modalOverlay.style.opacity = '';
    }
    if (modalContent) {
        modalContent.style.transition = '';
        modalContent.style.opacity = '';
        modalContent.style.transform = '';
    }
}

export function animateFormElements(form) {
    if (!form) return;

    const elements = form.querySelectorAll('input, select, button, label, fieldset');
    elements.forEach((el, index) => {
        el.style.opacity = '0';
        el.style.transform = 'translateY(10px)';
        
        setTimeout(() => {
            el.style.transition = 'opacity 0.3s ease-out, transform 0.3s ease-out';
            el.style.opacity = '1';
            el.style.transform = 'translateY(0)';
        }, index * 30);
    });
}

export function clearFormAnimations(form) {
    if (!form) return;

    const elements = form.querySelectorAll('input, select, button, label, fieldset');
    elements.forEach((el) => {
        el.style.transition = '';
        el.style.opacity = '';
        el.style.transform = '';
    });
}

export function animateViewModalElements(modalContent) {
    if (!modalContent) return;

    const elements = modalContent.querySelectorAll('div, dl, dt, dd, h3, h4, p, span');
    elements.forEach((el, index) => {
        el.style.opacity = '0';
        el.style.transform = 'translateY(10px)';
        
        setTimeout(() => {
            el.style.transition = 'opacity 0.3s ease-out, transform 0.3s ease-out';
            el.style.opacity = '1';
            el.style.transform = 'translateY(0)';
        }, index * 20);
    });
}

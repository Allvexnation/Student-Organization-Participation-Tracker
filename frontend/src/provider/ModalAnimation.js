
export function ensureAnimationStyles() {
    if (document.getElementById('modal-animation-styles')) {
        return;
    }

    const style = document.createElement('style');
    style.id = 'modal-animation-styles';
    style.textContent = `
        @keyframes fadeIn {
            from {
                opacity: 0;
            }
            to {
                opacity: 1;
            }
        }

        @keyframes fadeOut {
            from {
                opacity: 1;
            }
            to {
                opacity: 0;
            }
        }

        @keyframes scaleIn {
            from {
                opacity: 0;
                transform: scale(0.95) translateY(-10px);
            }
            to {
                opacity: 1;
                transform: scale(1) translateY(0);
            }
        }

        @keyframes scaleOut {
            from {
                opacity: 1;
                transform: scale(1) translateY(0);
            }
            to {
                opacity: 0;
                transform: scale(0.95) translateY(-10px);
            }
        }

        @keyframes slideIn {
            from {
                opacity: 0;
                transform: translateY(-20px);
            }
            to {
                opacity: 1;
                transform: translateY(0);
            }
        }

        @keyframes slideOut {
            from {
                opacity: 1;
                transform: translateY(0);
            }
            to {
                opacity: 0;
                transform: translateY(-20px);
            }
        }

        .modal-overlay-fade-in {
            animation: fadeIn 0.1s ease-out forwards;
        }

        .modal-overlay-fade-out {
            animation: fadeOut 0.1s ease-in forwards;
        }

        .modal-content-scale-in {
            animation: scaleIn 0.15s ease-out forwards;
        }

        .modal-content-scale-out {
            animation: scaleOut 0.1s ease-in forwards;
        }

        .modal-content-slide-in {
            animation: slideIn 0.15s ease-out forwards;
        }

        .modal-content-slide-out {
            animation: slideOut 0.1s ease-in forwards;
        }
    `;
    document.head.appendChild(style);
}

export function animateModalOpen(modalOverlay, modalContent, animationType = 'scale') {
    ensureAnimationStyles();

    modalOverlay.classList.add('modal-overlay-fade-in');

    if (animationType === 'slide') {
        modalContent.classList.add('modal-content-slide-in');
    } else {
        modalContent.classList.add('modal-content-scale-in');
    }
}

export function animateModalClose(modalOverlay, modalContent, animationType = 'scale') {
    return new Promise((resolve) => {
        ensureAnimationStyles();

        modalOverlay.classList.remove('modal-overlay-fade-in');
        modalContent.classList.remove('modal-content-scale-in', 'modal-content-slide-in');

        modalOverlay.classList.add('modal-overlay-fade-out');

        if (animationType === 'slide') {
            modalContent.classList.add('modal-content-slide-out');
        } else {
            modalContent.classList.add('modal-content-scale-out');
        }

        setTimeout(() => {
            resolve();
        }, 100);
    });
}

export function clearModalAnimations(modalOverlay, modalContent) {
    modalOverlay.classList.remove(
        'modal-overlay-fade-in',
        'modal-overlay-fade-out'
    );
    modalContent.classList.remove(
        'modal-content-scale-in',
        'modal-content-scale-out',
        'modal-content-slide-in',
        'modal-content-slide-out'
    );
}

export function ensureFormAnimationStyles() {
    if (document.getElementById('form-animation-styles')) {
        return;
    }

    const style = document.createElement('style');
    style.id = 'form-animation-styles';
    style.textContent = `
        @keyframes fadeInUp {
            from {
                opacity: 0;
                transform: translateY(10px);
            }
            to {
                opacity: 1;
                transform: translateY(0);
            }
        }

        @keyframes fadeInLeft {
            from {
                opacity: 0;
                transform: translateX(-10px);
            }
            to {
                opacity: 1;
                transform: translateX(0);
            }
        }

        @keyframes pulse {
            0%, 100% {
                transform: scale(1);
            }
            50% {
                transform: scale(1.02);
            }
        }

        @keyframes buttonPress {
            0% {
                transform: scale(1);
            }
            50% {
                transform: scale(0.95);
            }
            100% {
                transform: scale(1);
            }
        }

        .form-element-fade-in {
            opacity: 0;
            animation: fadeInUp 0.3s ease-out forwards;
        }

        .form-element-fade-in-left {
            opacity: 0;
            animation: fadeInLeft 0.3s ease-out forwards;
        }

        .button-hover-effect {
            transition: all 0.2s ease;
        }

        .button-hover-effect:hover {
            transform: translateY(-2px);
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        }

        .button-hover-effect:active {
            animation: buttonPress 0.2s ease;
        }

        .input-focus-effect {
            transition: all 0.2s ease;
        }

        .input-focus-effect:focus {
            transform: scale(1.01);
        }

        .fieldset-animate {
            opacity: 0;
            animation: fadeInUp 0.4s ease-out forwards;
        }

        .legend-animate {
            opacity: 0;
            animation: fadeInLeft 0.3s ease-out forwards;
        }

        @keyframes expandWidth {
            from {
                width: 0;
                opacity: 0;
            }
            to {
                width: 100%;
                opacity: 1;
            }
        }

        @keyframes fadeInScale {
            from {
                opacity: 0;
                transform: scale(0.95);
            }
            to {
                opacity: 1;
                transform: scale(1);
            }
        }

        @keyframes slideInRight {
            from {
                opacity: 0;
                transform: translateX(20px);
            }
            to {
                opacity: 1;
                transform: translateX(0);
            }
        }

        .text-animate {
            opacity: 0;
            animation: fadeInUp 0.4s ease-out forwards;
        }

        .heading-animate {
            opacity: 0;
            animation: fadeInScale 0.5s ease-out forwards;
        }

        .divider-animate {
            width: 0;
            opacity: 0;
            animation: expandWidth 0.4s ease-out forwards;
        }

        .detail-item-animate {
            opacity: 0;
            animation: slideInRight 0.3s ease-out forwards;
        }

        .badge-animate {
            opacity: 0;
            animation: fadeInScale 0.3s ease-out forwards;
        }

        @keyframes imageZoomIn {
            from {
                opacity: 0;
                transform: scale(0.8);
            }
            to {
                opacity: 1;
                transform: scale(1);
            }
        }

        @keyframes imageFadeIn {
            from {
                opacity: 0;
            }
            to {
                opacity: 1;
            }
        }

        .image-animate {
            opacity: 0;
            animation: imageZoomIn 0.4s ease-out forwards;
        }

        .image-container-animate {
            opacity: 0;
            animation: imageFadeIn 0.5s ease-out forwards;
        }
    `;
    document.head.appendChild(style);
}

export function animateFormElements(container) {
    ensureFormAnimationStyles();

    const fieldsets = container.querySelectorAll('fieldset');
    const inputs = container.querySelectorAll('input, select, textarea');
    const buttons = container.querySelectorAll('button');
    const legends = container.querySelectorAll('legend');
    const labels = container.querySelectorAll('label');
    const helperTexts = container.querySelectorAll('p.text-xs.text-gray-400, p.text-xs.text-gray-500');
    const infoBoxes = container.querySelectorAll('.bg-blue-50, .bg-blue-50\\/border');

    fieldsets.forEach((fieldset, index) => {
        fieldset.classList.add('fieldset-animate');
        fieldset.style.animationDelay = `${index * 0.1}s`;
    });

    legends.forEach((legend, index) => {
        legend.classList.add('legend-animate');
        legend.style.animationDelay = `${index * 0.05 + 0.1}s`;
    });

    labels.forEach((label, index) => {
        label.classList.add('form-element-fade-in-left');
        label.style.animationDelay = `${index * 0.03 + 0.12}s`;
    });

    inputs.forEach((input, index) => {
        input.classList.add('form-element-fade-in', 'input-focus-effect');
        input.style.animationDelay = `${index * 0.05 + 0.15}s`;
    });

    helperTexts.forEach((text, index) => {
        text.classList.add('form-element-fade-in');
        text.style.animationDelay = `${index * 0.05 + 0.2}s`;
    });

    infoBoxes.forEach((box, index) => {
        box.classList.add('form-element-fade-in');
        box.style.animationDelay = `${index * 0.1 + 0.05}s`;
    });

    buttons.forEach((button, index) => {
        button.classList.add('form-element-fade-in', 'button-hover-effect');
        button.style.animationDelay = `${index * 0.05 + 0.3}s`;
    });
}

export function clearFormAnimations(container) {
    const elements = container.querySelectorAll('.form-element-fade-in, .form-element-fade-in-left, .fieldset-animate, .legend-animate');
    elements.forEach(el => {
        el.style.animationDelay = '';
        el.classList.remove(
            'form-element-fade-in',
            'form-element-fade-in-left',
            'fieldset-animate',
            'legend-animate'
        );
    });
}

export function animateViewModalElements(container) {
    ensureFormAnimationStyles();

    const headings = container.querySelectorAll('h2, h3, h4, h5, h6');
    const paragraphs = container.querySelectorAll('p, dd, dt');
    const dividers = container.querySelectorAll('hr');
    const detailItems = container.querySelectorAll('dl > div, .detail-item');
    const badges = container.querySelectorAll('span[class*="bg-"]');
    const buttons = container.querySelectorAll('button');
    const labels = container.querySelectorAll('label');
    const selects = container.querySelectorAll('select');
    const auditLogContainers = container.querySelectorAll('.space-y-2 > div, .bg-gray-50.rounded-lg');
    const fieldContainers = container.querySelectorAll('.bg-gray-50\\/70, .bg-gray-50\\/border');
    const images = container.querySelectorAll('img');
    const imageContainers = container.querySelectorAll('.w-32.h-32, #imagePreviewContainer');
    const gridItems = container.querySelectorAll('.grid > div');
    const coloredBoxes = container.querySelectorAll('.bg-blue-50, .bg-green-50, .bg-yellow-50');
    const preElements = container.querySelectorAll('pre');
    const spans = container.querySelectorAll('span:not([class*="bg-"])');

    headings.forEach((heading, index) => {
        heading.classList.add('heading-animate');
        heading.style.animationDelay = `${index * 0.1 + 0.1}s`;
    });

    paragraphs.forEach((text, index) => {
        text.classList.add('text-animate');
        text.style.animationDelay = `${index * 0.05 + 0.2}s`;
    });

    dividers.forEach((divider, index) => {
        divider.classList.add('divider-animate');
        divider.style.animationDelay = `${index * 0.1 + 0.15}s`;
    });

    detailItems.forEach((item, index) => {
        item.classList.add('detail-item-animate');
        item.style.animationDelay = `${index * 0.05 + 0.25}s`;
    });

    badges.forEach((badge, index) => {
        badge.classList.add('badge-animate');
        badge.style.animationDelay = `${index * 0.03 + 0.3}s`;
    });

    labels.forEach((label, index) => {
        label.classList.add('form-element-fade-in-left');
        label.style.animationDelay = `${index * 0.05 + 0.15}s`;
    });

    selects.forEach((select, index) => {
        select.classList.add('form-element-fade-in', 'input-focus-effect');
        select.style.animationDelay = `${index * 0.05 + 0.2}s`;
    });

    auditLogContainers.forEach((container, index) => {
        container.classList.add('detail-item-animate');
        container.style.animationDelay = `${index * 0.08 + 0.35}s`;
    });

    fieldContainers.forEach((container, index) => {
        container.classList.add('text-animate');
        container.style.animationDelay = `${index * 0.05 + 0.3}s`;
    });

    images.forEach((img, index) => {
        img.classList.add('image-animate');
        img.style.animationDelay = `${index * 0.1 + 0.2}s`;
    });

    imageContainers.forEach((container, index) => {
        container.classList.add('image-container-animate');
        container.style.animationDelay = `${index * 0.1 + 0.15}s`;
    });

    gridItems.forEach((item, index) => {
        item.classList.add('form-element-fade-in');
        item.style.animationDelay = `${index * 0.05 + 0.1}s`;
    });

    coloredBoxes.forEach((box, index) => {
        box.classList.add('text-animate');
        box.style.animationDelay = `${index * 0.08 + 0.2}s`;
    });

    preElements.forEach((pre, index) => {
        pre.classList.add('form-element-fade-in');
        pre.style.animationDelay = `${index * 0.05 + 0.25}s`;
    });

    spans.forEach((span, index) => {
        span.classList.add('text-animate');
        span.style.animationDelay = `${index * 0.02 + 0.15}s`;
    });

    buttons.forEach((button, index) => {
        button.classList.add('form-element-fade-in', 'button-hover-effect');
        button.style.animationDelay = `${index * 0.05 + 0.4}s`;
    });
}

export function clearViewModalAnimations(container) {
    const elements = container.querySelectorAll('.text-animate, .heading-animate, .divider-animate, .detail-item-animate, .badge-animate');
    elements.forEach(el => {
        el.style.animationDelay = '';
        el.classList.remove(
            'text-animate',
            'heading-animate',
            'divider-animate',
            'detail-item-animate',
            'badge-animate'
        );
    });
}

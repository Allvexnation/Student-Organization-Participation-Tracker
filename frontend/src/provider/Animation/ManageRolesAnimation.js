export const ANIMATION_CONFIG = {
    duration: 500,
    easing: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)',
    stagger: 75,
};

export function fadeIn(element, delay = 0, duration = ANIMATION_CONFIG.duration) {
    if (!element) return;
    
    element.style.opacity = '0';
    element.style.transform = 'translateY(20px)';
    element.style.transition = `opacity ${duration}ms ${ANIMATION_CONFIG.easing}, transform ${duration}ms ${ANIMATION_CONFIG.easing}`;
    
    requestAnimationFrame(() => {
        setTimeout(() => {
            element.style.opacity = '1';
            element.style.transform = 'translateY(0)';
        }, delay);
    });
}

export function slideInLeft(element, delay = 0, duration = ANIMATION_CONFIG.duration) {
    if (!element) return;
    
    element.style.opacity = '0';
    element.style.transform = 'translateX(-30px)';
    element.style.transition = `opacity ${duration}ms ${ANIMATION_CONFIG.easing}, transform ${duration}ms ${ANIMATION_CONFIG.easing}`;
    
    requestAnimationFrame(() => {
        setTimeout(() => {
            element.style.opacity = '1';
            element.style.transform = 'translateX(0)';
        }, delay);
    });
}

export function slideInRight(element, delay = 0, duration = ANIMATION_CONFIG.duration) {
    if (!element) return;
    
    element.style.opacity = '0';
    element.style.transform = 'translateX(30px)';
    element.style.transition = `opacity ${duration}ms ${ANIMATION_CONFIG.easing}, transform ${duration}ms ${ANIMATION_CONFIG.easing}`;
    
    requestAnimationFrame(() => {
        setTimeout(() => {
            element.style.opacity = '1';
            element.style.transform = 'translateX(0)';
        }, delay);
    });
}

export function scaleIn(element, delay = 0, duration = ANIMATION_CONFIG.duration) {
    if (!element) return;
    
    element.style.opacity = '0';
    element.style.transform = 'scale(0.9)';
    element.style.transition = `opacity ${duration}ms ${ANIMATION_CONFIG.easing}, transform ${duration}ms ${ANIMATION_CONFIG.easing}`;
    
    requestAnimationFrame(() => {
        setTimeout(() => {
            element.style.opacity = '1';
            element.style.transform = 'scale(1)';
        }, delay);
    });
}

export function staggerAnimate(elements, animationFn = fadeIn, staggerDelay = ANIMATION_CONFIG.stagger) {
    if (!elements || elements.length === 0) return;
    
    Array.from(elements).forEach((element, index) => {
        animationFn(element, index * staggerDelay);
    });
}

export function animateHeader(selector = 'h1, p.text-sm.text-gray-500') {
    const headers = document.querySelectorAll(selector);
    staggerAnimate(headers, slideInRight, 0);
}

export function animateTableRows(selector = 'tbody tr') {
    const rows = document.querySelectorAll(selector);
    staggerAnimate(rows, slideInLeft, 50);
}

export function animateButtons(selector = 'button') {
    const buttons = document.querySelectorAll(selector);
    staggerAnimate(buttons, scaleIn, 75);
}

export function initManageRolesAnimations() {
    animateHeader('h1');
    
    animateButtons('#addRoleBtn');
    
    const tableContainer = document.querySelector('.bg-white.border.rounded-lg');
    if (tableContainer) {
        fadeIn(tableContainer, 200);
    }
    
    setTimeout(() => {
        animateTableRows('#roleTableBody tr');
    }, 300);
}

export function addButtonHoverAnimations(selector = 'button') {
    const buttons = document.querySelectorAll(selector);
    
    buttons.forEach(button => {
        button.style.transition = 'transform 200ms cubic-bezier(0.25, 0.46, 0.45, 0.94), box-shadow 200ms cubic-bezier(0.25, 0.46, 0.45, 0.94)';
        
        button.addEventListener('mouseenter', () => {
            button.style.transform = 'translateY(-2px)';
            button.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.15)';
        });
        
        button.addEventListener('mouseleave', () => {
            button.style.transform = 'translateY(0)';
            button.style.boxShadow = '';
        });
    });
}


export function CRTLogo({ className = '', alt = 'CRT Logo', size = 'md' } = {}) {
    const sizeClasses = {
        sm: 'w-6 h-6',
        md: 'w-9 h-9',
        lg: 'w-12 h-12'
    };
    
    const sizeClass = sizeClasses[size] || size;
    
    return `
        <img 
            src="/public/crtlogo.png" 
            alt="${alt}" 
            class="${sizeClass} rounded-full object-cover shadow ${className}"
        />
    `;
}

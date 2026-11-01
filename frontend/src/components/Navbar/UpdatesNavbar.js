export function UpdatesNavbar() {
    return `
    <nav class="bg-blue-700 text-white shadow-lg sticky top-0 z-50">
        <div class="container mx-auto px-4">
            <div class="flex items-center justify-between h-16">
                <div class="flex items-center">
                    <img src="/public/crtlogo.png" alt="CRT Logo" class="h-10 w-auto mr-3">
                    <span class="font-bold text-lg hidden md:block">College for Research & Technology</span>
                    <span class="font-bold text-lg md:hidden">CRT</span>
                </div>
                <button id="updates-hamburger-menu" class="text-white hover:bg-blue-600 p-2 rounded-lg transition-colors">
                    <svg id="updates-hamburger-icon" xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 transition-all duration-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
                    </svg>
                    <svg id="updates-close-icon" xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 hidden transition-all duration-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>
            </div>
        </div>
    </nav>
    `;
}

export function initUpdatesNavbar() {
    const hamburgerMenu = document.getElementById('updates-hamburger-menu');
    const hamburgerIcon = document.getElementById('updates-hamburger-icon');
    const closeIcon = document.getElementById('updates-close-icon');
    const tabStrip = document.getElementById('updates-tab-strip-inner');

    if (hamburgerMenu && tabStrip) {
        const stripBarState = localStorage.getItem('updatesStripBarState') || 'collapsed';

        if (stripBarState === 'expanded') {
            tabStrip.style.maxHeight = 'none';
            const contentHeight = tabStrip.scrollHeight;
            tabStrip.style.maxHeight = contentHeight + 'px';
            hamburgerIcon.classList.add('hidden');
            closeIcon.classList.remove('hidden');
        } else {
            tabStrip.style.maxHeight = '0px';
            hamburgerIcon.classList.remove('hidden');
            closeIcon.classList.add('hidden');
        }

        hamburgerMenu.addEventListener('click', () => {
            const isExpanded = tabStrip.style.maxHeight !== '0px' && tabStrip.style.maxHeight !== '';

            if (isExpanded) {
                tabStrip.style.maxHeight = '0px';
                hamburgerIcon.classList.remove('hidden');
                closeIcon.classList.add('hidden');
                localStorage.setItem('updatesStripBarState', 'collapsed');
            } else {
                tabStrip.style.maxHeight = 'none';
                const contentHeight = tabStrip.scrollHeight;
                tabStrip.style.maxHeight = contentHeight + 'px';
                hamburgerIcon.classList.add('hidden');
                closeIcon.classList.remove('hidden');
                localStorage.setItem('updatesStripBarState', 'expanded');
            }
        });

        window.addEventListener('resize', () => {
            if (tabStrip.style.maxHeight !== '0px' && tabStrip.style.maxHeight !== '') {
                tabStrip.style.maxHeight = 'none';
                const contentHeight = tabStrip.scrollHeight;
                tabStrip.style.maxHeight = contentHeight + 'px';
            }
        });
    }
}

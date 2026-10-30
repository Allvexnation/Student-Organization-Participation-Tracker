import { AdviserStripBar, initAdviserStripBarDropdowns } from '../Stripbar/AdviserStripbar.js';
import { getAdviserData, adviserLogout } from '../../api/adviser/AdviserAuth/AdviserAuth.js';
import { openConfirmDialog } from '../Dialog/ConfirmDialog.js';
import { showToast, updateToast } from '../ToastMessage.js';
import { navigate } from '../../utils/navigation.js';
import { getToken, setUserData } from '../../utils/jwt.js';

export function AdviserNavbar() {
    return `
    <nav class="bg-blue-700 text-white shadow-lg sticky top-0 z-50">
        <div class="container mx-auto px-4">
            <div class="flex items-center justify-between h-16">
                <div class="flex items-center">
                    <img src="/public/crtlogo.png" alt="CRT Logo" class="h-10 w-auto mr-3">
                    <span class="font-bold text-lg hidden md:block">College for Research & Technology - Adviser</span>
                    <span class="font-bold text-lg md:hidden">CRT - Adviser</span>
                </div>
                <div class="flex items-center space-x-4">
                    <span class="text-sm hidden md:block" id="navUsername">Welcome, Adviser</span>
                    <div class="md:hidden flex items-center space-x-2">
                        <div class="relative w-8 h-8 flex-shrink-0">
                            <img src="" alt="Profile" class="w-8 h-8 rounded-full object-cover border-2 border-blue-400 hidden" id="navProfilePhotoMobile">
                            <div class="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center" id="navProfilePlaceholderMobile">
                                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                </svg>
                            </div>
                        </div>
                    </div>
                    <button id="logoutBtn" class="bg-blue-600 hover:bg-blue-800 px-4 py-2 rounded-lg text-sm font-semibold transition-colors hidden md:flex items-center gap-2">
                        <span>Logout</span>
                    </button>
                    <button id="logoutBtnMobile" class="bg-blue-600 hover:bg-blue-800 p-2 rounded-lg transition-colors md:hidden">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                        </svg>
                    </button>
                    <button id="adviser-hamburger-menu" class="text-white hover:bg-blue-600 p-2 rounded-lg transition-colors">
                        <svg id="adviser-hamburger-icon" xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 transition-all duration-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
                        </svg>
                        <svg id="adviser-close-icon" xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 hidden transition-all duration-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>
            </div>
        </div>
        ${AdviserStripBar()}
    </nav>
    `;
}

export function updateNavbarProfile(adviserData) {
    if (!adviserData) return;
    const navUsername = document.getElementById('navUsername');
    const navProfilePhotoMobile = document.getElementById('navProfilePhotoMobile');
    const navProfilePlaceholderMobile = document.getElementById('navProfilePlaceholderMobile');

    if (navUsername && adviserData.name) {
        navUsername.textContent = `Welcome, ${adviserData.name}`;
    }

    if (navProfilePhotoMobile && navProfilePlaceholderMobile) {
        const photo = adviserData.profile_photo;
        const isValidPhoto = photo && 
                           photo.length > 0 &&
                           (photo.startsWith('data:image/') || photo.startsWith('http'));

        if (!isValidPhoto) {
            navProfilePhotoMobile.src = '';
            navProfilePhotoMobile.classList.add('hidden');
            navProfilePlaceholderMobile.classList.remove('hidden');
            return;
        }

        const photoUrl = photo.startsWith('data:') 
            ? photo 
            : `${photo}${photo.includes('?') ? '&' : '?'}_t=${Date.now()}`;

        navProfilePhotoMobile.src = photoUrl;
        navProfilePhotoMobile.classList.remove('hidden');
        navProfilePlaceholderMobile.classList.add('hidden');

        navProfilePhotoMobile.onerror = function() {
            navProfilePhotoMobile.src = '';
            navProfilePhotoMobile.classList.add('hidden');
            navProfilePlaceholderMobile.classList.remove('hidden');
        };
    }
}

export function initAdviserNavbar() {
    let adviserData = getAdviserData() || {};
    
    return Promise.resolve().then(() => {
        updateNavbarProfile(adviserData);

        if (!window._adviserProfileListenerRegistered) {
            window._adviserProfileListenerRegistered = true;
            window.addEventListener('adviser-profile-updated', (event) => {
                if (event.detail) {
                    updateNavbarProfile(event.detail);
                }
            });
        }

        if (!adviserData.profile_photo && getToken('adviser')) {
            import('../../api/adviser/AdviserProfile.js').then(({ getAdviserProfile }) => {
                getAdviserProfile().then((fresh) => {
                    if (fresh) {
                        setUserData(fresh, 'adviser');
                        updateNavbarProfile(fresh);
                    }
                }).catch(() => {});
            }).catch(() => {});
        }

        const logoutBtn = document.getElementById('logoutBtn');
        const logoutBtnMobile = document.getElementById('logoutBtnMobile');

        if (logoutBtn) {
            logoutBtn.addEventListener('click', () => {
                openConfirmDialog({
                    title: 'Confirm Logout',
                    message: 'Are you sure you want to logout?',
                    onConfirm: async () => {
                        showToast('Logging out...', 'loading');
                        await adviserLogout(getToken('adviser'));
                        updateToast('Logged out successfully!', 'success');
                        setTimeout(() => {
                            window.location.href = '/auth/adviser/login';
                        }, 1500);
                    },
                    confirmText: 'Logout',
                    cancelText: 'Cancel'
                });
            });
        }

        if (logoutBtnMobile) {
            logoutBtnMobile.addEventListener('click', () => {
                openConfirmDialog({
                    title: 'Confirm Logout',
                    message: 'Are you sure you want to logout?',
                    onConfirm: async () => {
                        showToast('Logging out...', 'loading');
                        await adviserLogout(getToken('adviser'));
                        updateToast('Logged out successfully!', 'success');
                        setTimeout(() => {
                            window.location.href = '/auth/adviser/login';
                        }, 1500);
                    },
                    confirmText: 'Logout',
                    cancelText: 'Cancel'
                });
            });
        }

        const hamburgerMenu = document.getElementById('adviser-hamburger-menu');
        const hamburgerIcon = document.getElementById('adviser-hamburger-icon');
        const closeIcon = document.getElementById('adviser-close-icon');
        const tabStrip = document.getElementById('adviser-tab-strip');

        if (hamburgerMenu && tabStrip) {
            const stripBarState = localStorage.getItem('adviserStripBarState');
            
            if (stripBarState === 'expanded') {
                tabStrip.style.maxHeight = tabStrip.scrollHeight + 'px';
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
                    localStorage.setItem('adviserStripBarState', 'collapsed');
                } else {
                    tabStrip.style.maxHeight = tabStrip.scrollHeight + 'px';
                    hamburgerIcon.classList.add('hidden');
                    closeIcon.classList.remove('hidden');
                    localStorage.setItem('adviserStripBarState', 'expanded');
                }
            });
        } else {
            console.error('Adviser hamburger menu or tab strip not found');
        }

        const scrollLeft = document.getElementById('adviser-scroll-left');
        const scrollRight = document.getElementById('adviser-scroll-right');
        const tabsContainer = document.getElementById('adviser-tabs-container');

        if (scrollLeft && scrollRight && tabsContainer) {
            scrollLeft.addEventListener('click', () => {
                tabsContainer.scrollBy({ left: -200, behavior: 'smooth' });
            });

            scrollRight.addEventListener('click', () => {
                tabsContainer.scrollBy({ left: 200, behavior: 'smooth' });
            });
        }

        initAdviserStripBarDropdowns();
    });
}

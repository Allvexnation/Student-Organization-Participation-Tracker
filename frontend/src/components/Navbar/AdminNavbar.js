import { AdminStripBar, initStripBarDropdowns } from '../Stripbar/AdminStripbar.js';
import { getAdminData, logout, verifyAdminExists } from '../../api/admin/AdminLogin.js';
import { openConfirmDialog } from '../Dialog/ConfirmDialog.js';
import { showToast, updateToast } from '../ToastMessage.js';
import { navigate } from '../../utils/navigation.js';

export function AdminNavbar() {
    return `
    <nav class="bg-blue-700 text-white shadow-lg sticky top-0 z-50">
        <div class="container mx-auto px-4">
            <div class="flex items-center justify-between h-16">
                <div class="flex items-center">
                    <img src="/public/crtlogo.png" alt="CRT Logo" class="h-10 w-auto mr-3">
                    <span class="font-bold text-lg hidden md:block">College for Research & Technology - Admin</span>
                    <span class="font-bold text-lg md:hidden">CRT - Admin</span>
                </div>
                <div class="flex items-center space-x-4">
                    <span class="text-sm hidden md:block" id="navUsername">Welcome, Admin</span>
                    <div class="md:hidden flex items-center space-x-2">
                        <img src="" alt="Profile" class="w-8 h-8 rounded-full object-cover border-2 border-blue-400 hidden" id="navProfilePhotoMobile">
                        <div class="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center" id="navProfilePlaceholderMobile">
                            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                            </svg>
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
                    <button id="admin-hamburger-menu" class="text-white hover:bg-blue-600 p-2 rounded-lg transition-colors">
                        <svg id="admin-hamburger-icon" xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 transition-all duration-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
                        </svg>
                        <svg id="admin-close-icon" xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 hidden transition-all duration-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>
            </div>
        </div>
        ${AdminStripBar()}
    </nav>
    `;
}

export function initAdminNavbar() {
    const adminData = getAdminData() || {};
    const isVerified = localStorage.getItem('adminVerified');
    
    const verifyPromise = isVerified ? Promise.resolve(true) : verifyAdminExists();
    
    verifyPromise.then(exists => {
        if (!exists) {
            navigate('/auth/admin/login');
            return;
        }

        if (!isVerified) {
            localStorage.setItem('adminVerified', 'true');
        }

        const navUsername = document.getElementById('navUsername');
        const navProfilePhotoMobile = document.getElementById('navProfilePhotoMobile');
        const navProfilePlaceholderMobile = document.getElementById('navProfilePlaceholderMobile');
        
        if (navUsername) navUsername.textContent = `Welcome, ${adminData.name || 'Admin'}`;

        if (adminData.profile_photo && navProfilePhotoMobile && navProfilePlaceholderMobile) {
            navProfilePhotoMobile.src = adminData.profile_photo;
            navProfilePhotoMobile.classList.remove('hidden');
            navProfilePlaceholderMobile.classList.add('hidden');
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
                        logout();
                        updateToast('Logged out successfully!', 'success');
                        setTimeout(() => {
                            window.location.href = '/auth/admin/login';
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
                        logout();
                        updateToast('Logged out successfully!', 'success');
                        setTimeout(() => {
                            window.location.href = '/auth/admin/login';
                        }, 1500);
                    },
                    confirmText: 'Logout',
                    cancelText: 'Cancel'
                });
            });
        }

        const hamburgerMenu = document.getElementById('admin-hamburger-menu');
        const hamburgerIcon = document.getElementById('admin-hamburger-icon');
        const closeIcon = document.getElementById('admin-close-icon');
        const tabStrip = document.getElementById('admin-tab-strip');

        if (hamburgerMenu && tabStrip) {
            const stripBarState = localStorage.getItem('adminStripBarState');
            
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
                    localStorage.setItem('adminStripBarState', 'collapsed');
                } else {
                    tabStrip.style.maxHeight = tabStrip.scrollHeight + 'px';
                    hamburgerIcon.classList.add('hidden');
                    closeIcon.classList.remove('hidden');
                    localStorage.setItem('adminStripBarState', 'expanded');
                }
            });
        }

        const scrollLeft = document.getElementById('admin-scroll-left');
        const scrollRight = document.getElementById('admin-scroll-right');
        const tabsContainer = document.getElementById('admin-tabs-container');

        if (scrollLeft && scrollRight && tabsContainer) {
            scrollLeft.addEventListener('click', () => {
                tabsContainer.scrollBy({ left: -200, behavior: 'smooth' });
            });

            scrollRight.addEventListener('click', () => {
                tabsContainer.scrollBy({ left: 200, behavior: 'smooth' });
            });
        }

        initStripBarDropdowns();
    });
}

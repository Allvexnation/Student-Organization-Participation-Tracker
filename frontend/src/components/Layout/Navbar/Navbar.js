import { StripBar, initStripBar, bindPortalNavbarChrome } from '../Stripbar/Stripbar.js';
import { getAdminData, logout, verifyAdminExists } from '../../../api/admin/AdminLogin.js';
import { getAdviserData, adviserLogout } from '../../../api/adviser/AdviserAuth/AdviserAuth.js';
import { getStudentData, studentLogout } from '../../../api/students/StudentAuth/StudentAuth.js';
import { openConfirmDialog } from '../../Dialog/ConfirmDialog.js';
import { showToast, updateToast } from '../../ToastMessage.js';
import { getToken, setUserData } from '../../../utils/jwt.js';
import { getDefaultProfileSVG } from '../../../static/Profile/DefaultProfile.js';
import { navigateAfterLogout } from '../../../provider/Animation/auth/AuthAnimation.js';

const PORTAL_NAV = {
    admin: {
        title: 'College for Research & Technology',
        mobileTitle: 'CRT - Admin',
        subtitle: 'Student Organization Participation Tracker - Admin',
        welcomeFallback: 'Admin',
        storageKey: 'adminStripBarState',
        loginPath: '/auth/admin/login',
        wrapProfile: false,
        displayName: (data) => data.name || 'Admin',
        getUserData: getAdminData,
        logout: async () => logout()
    },
    adviser: {
        title: 'College for Research & Technology',
        mobileTitle: 'CRT - Adviser',
        subtitle: 'Student Organization Participation Tracker - Adviser',
        welcomeFallback: 'Adviser',
        storageKey: 'adviserStripBarState',
        loginPath: '/auth/adviser/login',
        wrapProfile: true,
        profileEvent: 'adviser-profile-updated',
        profileListenerFlag: '_adviserProfileListenerRegistered',
        displayName: (data) => data.name || 'Adviser',
        getUserData: getAdviserData,
        logout: async () => adviserLogout(getToken('adviser')),
        loadProfile: async () => {
            const { getAdviserProfile } = await import('../../../api/adviser/AdviserProfile.js');
            return getAdviserProfile();
        }
    },
    student: {
        title: 'College for Research & Technology',
        mobileTitle: 'CRT - Student',
        subtitle: 'Student Organization Participation Tracker - Student',
        welcomeFallback: 'Student',
        storageKey: 'studentStripBarState',
        loginPath: '/auth/student/login',
        wrapProfile: false,
        profileEvent: 'student-profile-updated',
        profileListenerFlag: '_studentProfileListenerRegistered',
        displayName: (data) => data.first_name || data.name || 'Student',
        getUserData: getStudentData,
        logout: async () => studentLogout(getToken('student')),
        loadProfile: async () => {
            const { getStudentProfile } = await import('../../../api/students/StudentProfile.js');
            return getStudentProfile();
        }
    }
};

const PUBLIC_NAV = {
    homepage: {
        title: 'College for Research & Technology',
        mobileTitle: 'CRT',
        subtitle: 'Student Organization Participation Tracker',
        storageKey: 'homepageStripBarState',
        variant: 'login',
        loginPath: '/auth/admin/login',
        logoHref: '#home'
    },
    notfound: {
        title: 'College for Research & Technology',
        mobileTitle: 'CRT',
        subtitle: 'Student Organization Participation Tracker',
        storageKey: 'homepageStripBarState',
        variant: 'login',
        loginPath: '/auth/admin/login',
        logoHref: '/'
    },
    support: {
        title: 'College for Research & Technology',
        mobileTitle: 'CRT',
        subtitle: 'Student Organization Participation Tracker',
        storageKey: 'homepageStripBarState',
        variant: 'login',
        loginPath: '/auth/admin/login',
        logoHref: '/'
    },
    events: {
        title: 'College for Research & Technology',
        mobileTitle: 'CRT',
        subtitle: 'Student Organization Participation Tracker',
        storageKey: 'homepageStripBarState',
        variant: 'login',
        loginPath: '/auth/admin/login',
        logoHref: '/'
    },
    banned: {
        title: 'College for Research & Technology',
        mobileTitle: 'CRT',
        subtitle: 'Student Organization Participation Tracker',
        storageKey: 'homepageStripBarState',
        variant: 'login-disabled',
        loginPath: '/auth/admin/login',
        logoHref: '/'
    },
    updates: {
        title: 'College for Research & Technology',
        mobileTitle: 'CRT - Updates',
        subtitle: 'Student Organization Participation Tracker - Updates',
        storageKey: 'updatesStripBarState',
        variant: 'minimal',
        logoHref: '/',
        tabSelector: '.updates-filter-item'
    }
};

function getNav(role) {
    const config = PORTAL_NAV[role] || PUBLIC_NAV[role];
    if (!config) {
        throw new Error(`Unknown navbar role: ${role}`);
    }
    return config;
}

function detectNavbarRole() {
    if (document.getElementById('admin-navbar')) return 'admin';
    if (document.getElementById('adviser-navbar')) return 'adviser';
    if (document.getElementById('student-navbar')) return 'student';
    return null;
}

function renderHamburger(role, isExpanded) {
    return `
                    <button id="${role}-hamburger-menu" class="${isExpanded ? 'text-white hover:bg-blue-600' : 'text-gray-900 hover:bg-gray-100'} p-2 rounded-lg transition-colors">
                        <svg id="${role}-hamburger-icon" xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 transition-all duration-300 ${isExpanded ? 'hidden' : ''}" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
                        </svg>
                        <svg id="${role}-close-icon" xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 transition-all duration-300 ${isExpanded ? '' : 'hidden'}" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>`;
}

function renderNavbarActions(role, config, isExpanded) {
    const hamburger = renderHamburger(role, isExpanded);

    if (config.variant === 'login') {
        return `
                    <a href="${config.loginPath}" data-auth-route id="navbar-login-desktop" class="bg-blue-600 hover:bg-blue-800 px-4 py-2 rounded-lg text-sm font-semibold transition-colors hidden md:flex items-center gap-2 text-white">
                        <span>Login</span>
                        <i data-lucide="log-in" class="w-4 h-4"></i>
                    </a>
                    <a href="${config.loginPath}" data-auth-route id="navbar-login-mobile" class="bg-blue-600 hover:bg-blue-800 p-2 rounded-lg transition-colors md:hidden text-white">
                        <i data-lucide="log-in" class="w-5 h-5"></i>
                    </a>
                    ${hamburger}`;
    }

    if (config.variant === 'login-disabled') {
        return `
                    <span id="navbar-login-desktop" class="bg-blue-600 px-4 py-2 rounded-lg text-sm font-semibold hidden md:flex items-center gap-2 text-white" style="pointer-events: none; opacity: 0.7;">
                        <span>Login</span>
                        <i data-lucide="log-in" class="w-4 h-4"></i>
                    </span>
                    <span id="navbar-login-mobile" class="bg-blue-600 p-2 rounded-lg md:hidden text-white" style="pointer-events: none; opacity: 0.7;">
                        <i data-lucide="log-in" class="w-5 h-5"></i>
                    </span>
                    ${hamburger}`;
    }

    if (config.variant === 'minimal') {
        return hamburger;
    }

    const profilePhoto = `
                        <img src="" alt="Profile" class="w-8 h-8 rounded-full object-cover border-2 border-blue-400 hidden" id="navProfilePhotoMobile">
                        <div class="w-8 h-8 ${role === 'student' ? '' : 'bg-blue-600 '}rounded-full overflow-hidden" id="navProfilePlaceholderMobile">
                            ${getDefaultProfileSVG('100%', '100%')}
                        </div>`;

    return `
                    <span class="text-sm hidden md:block" id="navUsername">Welcome, ${config.welcomeFallback}</span>
                    <div class="md:hidden flex items-center space-x-2">
                        ${config.wrapProfile ? `<div class="relative w-8 h-8 flex-shrink-0">${profilePhoto}</div>` : profilePhoto}
                    </div>
                    <button id="logoutBtn" class="bg-blue-600 hover:bg-blue-800 px-4 py-2 rounded-lg text-sm font-semibold transition-colors hidden md:flex items-center gap-2 text-white">
                        <span>Logout</span>
                    </button>
                    <button id="logoutBtnMobile" class="bg-blue-600 hover:bg-blue-800 p-2 rounded-lg transition-colors md:hidden">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                        </svg>
                    </button>
                    ${hamburger}`;
}

function renderBrand(role, config, isExpanded) {
    const titles = `
                        <span id="${role}-navbar-title" class="font-bold text-lg hidden md:block transition-colors duration-300 ${isExpanded ? 'text-white' : 'text-gray-900'}">${config.title}</span>
                        <span id="${role}-navbar-title-mobile" class="font-bold text-lg md:hidden transition-colors duration-300 ${isExpanded ? 'text-white' : 'text-gray-900'}">${config.mobileTitle}</span>
                        <span id="${role}-navbar-subtitle" class="text-xs block hidden md:block transition-colors duration-300 ${isExpanded ? 'text-blue-200' : 'text-gray-600'}">${config.subtitle}</span>`;
    const img = `<img src="/public/crtlogo.png" alt="CRT Logo" class="h-10 w-auto mr-3">`;

    if (config.logoHref) {
        return `
                    <a href="${config.logoHref}" class="flex items-center" aria-label="CRT Student Organization Participation Tracker">
                        ${img}
                        <div class="ml-3">${titles}</div>
                    </a>`;
    }

    return `
                    ${img}
                    <div class="ml-3">${titles}</div>`;
}

export function Navbar(role, options = {}) {
    const config = getNav(role);
    const isExpanded = localStorage.getItem(config.storageKey) === 'expanded';

    return `
    <style>
        @keyframes slideIn {
            from {
                opacity: 0;
                transform: translateY(8px);
            }
            to {
                opacity: 1;
                transform: translateY(0);
            }
        }
    </style>
    <nav id="${role}-navbar" class="${isExpanded ? 'bg-blue-700 text-white' : 'bg-white text-gray-900'} shadow-lg z-50 transition-colors duration-300">
        <div class="container mx-auto px-4">
            <div class="flex items-center justify-between h-16">
                <div class="flex items-center">
                    ${renderBrand(role, config, isExpanded)}
                </div>
                <div class="flex items-center space-x-4">
                    ${renderNavbarActions(role, config, isExpanded)}
                </div>
            </div>
        </div>
        ${StripBar(role, options)}
    </nav>
    `;
}

export function updateNavbarProfile(userData, role = detectNavbarRole()) {
    if (!userData || !role) return;

    const config = getNav(role);
    const navUsername = document.getElementById('navUsername');
    const navProfilePhotoMobile = document.getElementById('navProfilePhotoMobile');
    const navProfilePlaceholderMobile = document.getElementById('navProfilePlaceholderMobile');

    if (navUsername) {
        navUsername.textContent = `Welcome, ${config.displayName(userData)}`;
    }

    if (!navProfilePhotoMobile || !navProfilePlaceholderMobile) return;

    const photo = userData.profile_photo;
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
    navProfilePhotoMobile.onerror = function () {
        handleProfileImageError(this);
    };
}

function bindLogout(config) {
    const confirmLogout = () => {
        openConfirmDialog({
            title: 'Confirm Logout',
            message: 'Are you sure you want to logout?',
            onConfirm: async () => {
                showToast('Logging out...', 'loading');
                await config.logout();
                updateToast('Logged out successfully!', 'success');
                await navigateAfterLogout(config.loginPath);
            },
            confirmText: 'Logout',
            cancelText: 'Cancel'
        });
    };

    document.getElementById('logoutBtn')?.addEventListener('click', confirmLogout);
    document.getElementById('logoutBtnMobile')?.addEventListener('click', confirmLogout);
}

export function initNavbar(role) {
    const config = getNav(role);

    initStripBar(role);
    bindPortalNavbarChrome({
        role,
        navbar: document.getElementById(`${role}-navbar`),
        navbarTitle: document.getElementById(`${role}-navbar-title`),
        navbarTitleMobile: document.getElementById(`${role}-navbar-title-mobile`),
        navbarSubtitle: document.getElementById(`${role}-navbar-subtitle`),
        hamburgerMenu: document.getElementById(`${role}-hamburger-menu`),
        hamburgerIcon: document.getElementById(`${role}-hamburger-icon`),
        closeIcon: document.getElementById(`${role}-close-icon`),
        tabStrip: document.getElementById(`${role}-tab-strip`),
        storageKey: config.storageKey,
        scrollLeft: document.getElementById(`${role}-scroll-left`),
        scrollRight: document.getElementById(`${role}-scroll-right`),
        tabsContainer: document.getElementById(`${role}-tabs-container`),
        tabSelector: config.tabSelector || '.portal-tab'
    });

    if (PUBLIC_NAV[role]) {
        return;
    }

    const userData = config.getUserData() || {};

    const finishInit = () => {
        updateNavbarProfile(userData, role);

        if (config.profileEvent && !window[config.profileListenerFlag]) {
            window[config.profileListenerFlag] = true;
            window.addEventListener(config.profileEvent, (event) => {
                if (event.detail) {
                    updateNavbarProfile(event.detail, role);
                }
            });
        }

        if (config.loadProfile && !userData.profile_photo && getToken(role)) {
            config.loadProfile().then((fresh) => {
                if (fresh) {
                    setUserData(fresh, role);
                    updateNavbarProfile(fresh, role);
                }
            }).catch(() => {});
        }

        bindLogout(config);
    };

    if (role !== 'admin') {
        return Promise.resolve().then(finishInit);
    }

    const isVerified = sessionStorage.getItem('adminVerified');
    const verifyPromise = isVerified ? Promise.resolve(true) : verifyAdminExists();

    verifyPromise.then((verified) => {
        if (!verified) {
            window.location.href = config.loginPath;
            return;
        }

        if (!isVerified) {
            sessionStorage.setItem('adminVerified', 'true');
        }

        finishInit();
    });
}

export function AdminNavbar() {
    return Navbar('admin');
}

export function AdviserNavbar() {
    return Navbar('adviser');
}

export function StudentNavbar() {
    return Navbar('student');
}

export function initAdminNavbar() {
    return initNavbar('admin');
}

export function initAdviserNavbar() {
    return initNavbar('adviser');
}

export function initStudentNavbar() {
    return initNavbar('student');
}

export function HomepageNavbar(options) {
    return Navbar('homepage', options);
}

export function initHomepageNavbar() {
    return initNavbar('homepage');
}

export function NotFoundNavbar() {
    return Navbar('notfound');
}

export function initNotFoundNavbar() {
    return initNavbar('notfound');
}

export function SupportNavbar() {
    return Navbar('support');
}

export function initSupportNavbar() {
    return initNavbar('support');
}

export function EventsNavbar() {
    return Navbar('events');
}

export function initEventsNavbar() {
    return initNavbar('events');
}

export function BannedNavbar() {
    return Navbar('banned');
}

export function initBannedNavbar() {
    return initNavbar('banned');
}

export function UpdatesNavbar(options) {
    return Navbar('updates', options);
}

export function initUpdatesNavbar() {
    return initNavbar('updates');
}

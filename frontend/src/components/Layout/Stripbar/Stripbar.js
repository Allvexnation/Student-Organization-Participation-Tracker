import { isAuthenticated, getUserRole } from '../../../utils/jwt.js';
import { navigate } from '../../../utils/navigation.js';
import { protectAdminRoute } from '../../../middleware/AdminMiddleware.js';
import { protectAdviserRoute } from '../../../middleware/AdviserMiddleware.js';
import { protectStudentRoute } from '../../../middleware/StudentMiddleware.js';

const ACTIVE_TAB_CLASS = 'bg-blue-50 text-blue-900 font-semibold border-b-2 border-blue-900';
const INACTIVE_TAB_CLASS = 'text-gray-600 hover:text-gray-900 hover:bg-gray-50 border-b-2 border-transparent';
const STRIP_TRANSITION = 'max-height 0.3s ease-in-out, transform 0.3s ease-in-out, opacity 0.3s ease-in-out, padding 0.3s ease-in-out';

const chromeState = {};
const stripBarState = {};

const PORTAL_STRIPS = {
    admin: {
        defaultPath: '/admin/dashboard',
        storageKey: 'adminStripBarState',
        scrollKey: 'adminTabsScroll',
        protect: protectAdminRoute,
        loginPath: '/auth/admin/login',
        tabs: [
            { href: '/admin/dashboard', label: 'Dashboard', icon: 'layout-dashboard' },
            { href: '/admin/users', label: 'Manage Users', icon: 'users' },
            { href: '/admin/organizations', label: 'Organizations', icon: 'building' },
            { href: '/admin/events', label: 'Events', icon: 'calendar' },
            { href: '/admin/contacts', label: 'Contacts', icon: 'mail' },
            { href: '/admin/settings', label: 'Settings', icon: 'user-cog', extraActive: ['/settings', '/admin/audit-logs', '/admin/banned', '/admin/analytics'] }
        ]
    },
    adviser: {
        defaultPath: '/adviser/dashboard',
        storageKey: 'adviserStripBarState',
        scrollKey: 'adviserTabsScroll',
        protect: protectAdviserRoute,
        loginPath: '/auth/adviser/login',
        tabs: [
            { href: '/adviser/dashboard', label: 'Dashboard', icon: 'layout-dashboard' },
            { href: '/adviser/profile', label: 'Profile', icon: 'user-cog', extraActive: ['/settings'] },
            { href: '/adviser/organization', label: 'Organization', icon: 'building-2' },
            { href: '/adviser/events', label: 'Events & Tasks', icon: 'check-square' },
            { href: '/adviser/attendance', label: 'Attendance', icon: 'calendar-check' },
            { href: '/adviser/audit-logs', label: 'Audit Logs', icon: 'file-text' }
        ]
    },
    student: {
        defaultPath: '/student/dashboard',
        storageKey: 'studentStripBarState',
        scrollKey: 'studentTabsScroll',
        protect: protectStudentRoute,
        loginPath: '/auth/student/login',
        tabs: [
            { href: '/student/dashboard', label: 'Dashboard', icon: 'layout-dashboard' },
            { href: '/student/tasks', label: 'Tasks', icon: 'check-square' },
            { href: '/student/attendance', label: 'Attendance', icon: 'calendar-check' },
            { href: '/student/audit-logs', label: 'Audit Logs', icon: 'file-text' },
            { href: '/student/profile', label: 'Profile', icon: 'user-cog', extraActive: ['/settings'] }
        ]
    }
};

const PUBLIC_LOGIN_TABS = [
    { href: '/auth/admin/login', label: 'Admin Login', icon: 'shield-check' },
    { href: '/auth/adviser/login', label: 'Adviser Login', icon: 'user-cog' },
    { href: '/auth/student/login', label: 'Student Login', icon: 'graduation-cap' }
];

const PUBLIC_STRIPS = {
    homepage: {
        storageKey: 'homepageStripBarState',
        scrollKey: 'homepageTabsScroll',
        defaultPath: '/',
        tabMode: 'scroll',
        tabs: [
            { href: '#home', label: 'Home', icon: 'home', target: '#home' },
            { href: '#about', label: 'About', icon: 'info', target: '#about' },
            { href: '#features', label: 'Features', icon: 'star', target: '#features' },
            { href: '#how-it-works', label: 'How It Works', icon: 'cog', target: '#how-it-works' },
            { href: '/events', label: 'Events', icon: 'calendar-days' },
            { href: '/support', label: 'Support', icon: 'life-buoy' },
            { href: '#contact', label: 'Start', icon: 'rocket', target: '#contact' }
        ]
    },
    notfound: {
        storageKey: 'homepageStripBarState',
        scrollKey: 'notfoundTabsScroll',
        defaultPath: '/',
        tabMode: 'navigate',
        tabs: [
            { href: '/', label: 'Home', icon: 'home' },
            { href: '/events', label: 'Events', icon: 'calendar-days' },
            { href: '/support', label: 'Support', icon: 'life-buoy' },
            ...PUBLIC_LOGIN_TABS
        ]
    },
    support: {
        storageKey: 'homepageStripBarState',
        scrollKey: 'supportTabsScroll',
        defaultPath: '/support',
        tabMode: 'navigate',
        tabs: [
            { href: '/', label: 'Home', icon: 'home' },
            { href: '/events', label: 'Events', icon: 'calendar-days' },
            { href: '/support', label: 'Support', icon: 'life-buoy' },
            ...PUBLIC_LOGIN_TABS
        ]
    },
    events: {
        storageKey: 'homepageStripBarState',
        scrollKey: 'eventsTabsScroll',
        defaultPath: '/events',
        tabMode: 'navigate',
        tabs: [
            { href: '/', label: 'Home', icon: 'home' },
            { href: '/events', label: 'Events', icon: 'calendar-days' },
            { href: '/support', label: 'Support', icon: 'life-buoy' },
            ...PUBLIC_LOGIN_TABS
        ]
    },
    banned: {
        storageKey: 'homepageStripBarState',
        scrollKey: 'bannedTabsScroll',
        defaultPath: '/',
        tabMode: 'disabled',
        tabs: PUBLIC_LOGIN_TABS.map((tab) => ({ ...tab, disabled: true }))
    },
    updates: {
        storageKey: 'updatesStripBarState',
        scrollKey: 'updatesTabsScroll',
        defaultPath: '/updates',
        tabMode: 'custom'
    }
};

export function portalTabMarkup({ href, label, icon, active, index, animate, disabled, target }) {
    const tabClass = `portal-tab group px-3.5 py-3 text-sm font-medium transition-all duration-200 whitespace-nowrap flex items-center gap-2 rounded-t-md ${active ? ACTIVE_TAB_CLASS : INACTIVE_TAB_CLASS}${animate ? ' opacity-0 translate-y-2' : ''}${disabled ? ' pointer-events-none' : ''}`;
    const tabStyle = animate
        ? `animation: slideIn 0.4s ease-out forwards; animation-delay: ${index * 50}ms;`
        : 'opacity: 1; transform: none;';
    const iconClass = `w-4 h-4 ${active ? 'text-blue-900' : 'text-gray-400'} transition-transform duration-200 group-hover:scale-125 group-hover:rotate-12`;
    const tag = disabled ? 'span' : 'a';
    const hrefAttr = disabled ? '' : ` href="${href}"`;
    const targetAttr = target ? ` data-target="${target}"` : '';

    return `
                    <${tag}${hrefAttr} class="${tabClass}" style="${tabStyle}"${targetAttr}>
                        <i data-lucide="${icon}" class="${iconClass}"></i>
                        <span>${label}</span>
                    </${tag}>`;
}

export function stripBarShellStyle(expanded) {
    return `max-height: ${expanded ? 'none' : '0'}; transition: ${STRIP_TRANSITION};`;
}

export function replayTabSlideIn(tabStrip, selector = '.portal-tab') {
    if (!tabStrip) return;

    tabStrip.querySelectorAll(selector).forEach((tab, index) => {
        tab.classList.add('opacity-0', 'translate-y-2');
        tab.getAnimations?.().forEach((animation) => animation.cancel());
        tab.style.animation = 'none';
        tab.style.opacity = '0';
        tab.style.transform = 'translateY(8px)';
        void tab.offsetWidth;
        tab.style.animation = `slideIn 0.4s ease-out ${index * 50}ms forwards`;
    });
}

function getStripPlaceholder(tabStrip) {
    const next = tabStrip?.nextElementSibling;
    return next?.dataset?.stripPlaceholder === 'true' ? next : null;
}

function lockStripPlaceholder(tabStrip) {
    if (!tabStrip) return;

    let placeholder = getStripPlaceholder(tabStrip);
    if (!placeholder) {
        placeholder = document.createElement('div');
        placeholder.dataset.stripPlaceholder = 'true';
        placeholder.setAttribute('aria-hidden', 'true');
        tabStrip.after(placeholder);
    }

    placeholder.style.height = `${tabStrip.offsetHeight}px`;
    placeholder.style.width = '100%';
    placeholder.style.pointerEvents = 'none';
}

function releaseStripPlaceholder(tabStrip) {
    getStripPlaceholder(tabStrip)?.remove();
}

function resetStickyStrip(tabStrip) {
    if (!tabStrip) return;

    tabStrip.style.position = '';
    tabStrip.style.top = '';
    tabStrip.style.left = '';
    tabStrip.style.right = '';
    tabStrip.style.zIndex = '';
    tabStrip.style.padding = '';
    tabStrip.style.opacity = '';
    tabStrip.style.transition = '';
    releaseStripPlaceholder(tabStrip);

    tabStrip.querySelectorAll('.portal-tab').forEach((tab) => {
        tab.style.padding = '';
        tab.style.fontSize = '';
        tab.style.borderWidth = '';
        const icon = tab.querySelector('svg, i');
        if (icon) {
            icon.style.width = '';
            icon.style.height = '';
        }
    });

    tabStrip.querySelectorAll('button[id*="-scroll"]').forEach((btn) => {
        btn.style.padding = '';
    });
}

function applyStickyStrip(tabStrip) {
    lockStripPlaceholder(tabStrip);

    tabStrip.style.position = 'fixed';
    tabStrip.style.top = '0';
    tabStrip.style.left = '0';
    tabStrip.style.right = '0';
    tabStrip.style.zIndex = '50';
    tabStrip.style.padding = '0.25rem 0';

    tabStrip.querySelectorAll('.portal-tab').forEach((tab) => {
        tab.style.transition = 'padding 0.3s ease-in-out, font-size 0.3s ease-in-out, border-width 0.3s ease-in-out';
        tab.style.padding = '0.5rem 1rem';
        tab.style.fontSize = '0.8rem';
        tab.style.borderWidth = '0 0 1px 0';

        const icon = tab.querySelector('svg, i');
        if (icon) {
            icon.style.transition = 'width 0.3s ease-in-out, height 0.3s ease-in-out';
            icon.style.width = '0.8rem';
            icon.style.height = '0.8rem';
        }
    });

    tabStrip.querySelectorAll('button[id*="-scroll"]').forEach((btn) => {
        btn.style.transition = 'padding 0.3s ease-in-out';
        btn.style.padding = '0.5rem';
    });
}

function isStripExpanded(tabStrip) {
    return tabStrip.style.maxHeight !== '0px' && tabStrip.style.maxHeight !== '';
}

export function bindPortalNavbarChrome({
    role,
    navbar,
    navbarTitle,
    navbarTitleMobile,
    navbarSubtitle,
    hamburgerMenu,
    hamburgerIcon,
    closeIcon,
    tabStrip,
    storageKey,
    scrollLeft,
    scrollRight,
    tabsContainer,
    tabSelector = '.portal-tab'
}) {
    if (chromeState[role]?.cleanup) {
        chromeState[role].cleanup();
    }

    let isSticky = false;
    let stickyTimer = null;
    const STICK_AT = 64;
    const UNSTICK_AT = 24;

    const updateNavbarColors = (isExpanded) => {
        if (!navbar) return;

        if (isExpanded) {
            navbar.classList.remove('bg-white', 'text-gray-900');
            navbar.classList.add('bg-blue-700', 'text-white');
            navbarTitle?.classList.remove('text-gray-900');
            navbarTitle?.classList.add('text-white');
            navbarTitleMobile?.classList.remove('text-gray-900');
            navbarTitleMobile?.classList.add('text-white');
            navbarSubtitle?.classList.remove('text-gray-600');
            navbarSubtitle?.classList.add('text-blue-200');
            hamburgerMenu?.classList.remove('text-gray-900', 'hover:bg-gray-100');
            hamburgerMenu?.classList.add('text-white', 'hover:bg-blue-600');
        } else {
            navbar.classList.remove('bg-blue-700', 'text-white');
            navbar.classList.add('bg-white', 'text-gray-900');
            navbarTitle?.classList.remove('text-white');
            navbarTitle?.classList.add('text-gray-900');
            navbarTitleMobile?.classList.remove('text-white');
            navbarTitleMobile?.classList.add('text-gray-900');
            navbarSubtitle?.classList.remove('text-blue-200');
            navbarSubtitle?.classList.add('text-gray-600');
            hamburgerMenu?.classList.remove('text-white', 'hover:bg-blue-600');
            hamburgerMenu?.classList.add('text-gray-900', 'hover:bg-gray-100');
        }
    };

    const onHamburger = () => {
        if (!tabStrip) return;

        if (isStripExpanded(tabStrip)) {
            tabStrip.style.maxHeight = '0px';
            hamburgerIcon?.classList.remove('hidden');
            closeIcon?.classList.add('hidden');
            localStorage.setItem(storageKey, 'collapsed');
            updateNavbarColors(false);
            isSticky = false;
            if (stickyTimer) {
                clearTimeout(stickyTimer);
                stickyTimer = null;
            }
            resetStickyStrip(tabStrip);
        } else {
            tabStrip.style.maxHeight = `${tabStrip.scrollHeight}px`;
            hamburgerIcon?.classList.add('hidden');
            closeIcon?.classList.remove('hidden');
            localStorage.setItem(storageKey, 'expanded');
            updateNavbarColors(true);
            replayTabSlideIn(tabStrip, tabSelector);
        }
    };

    if (hamburgerMenu && tabStrip) {
        const storedState = localStorage.getItem(storageKey);

        if (storedState === 'expanded') {
            tabStrip.style.maxHeight = 'none';
            hamburgerIcon?.classList.add('hidden');
            closeIcon?.classList.remove('hidden');
        } else {
            tabStrip.style.maxHeight = '0px';
            hamburgerIcon?.classList.remove('hidden');
            closeIcon?.classList.add('hidden');
        }

        hamburgerMenu.addEventListener('click', onHamburger);
    }

    const onScrollLeft = () => tabsContainer.scrollBy({ left: -200, behavior: 'smooth' });
    const onScrollRight = () => tabsContainer.scrollBy({ left: 200, behavior: 'smooth' });

    if (scrollLeft && scrollRight && tabsContainer) {
        scrollLeft.addEventListener('click', onScrollLeft);
        scrollRight.addEventListener('click', onScrollRight);
    }

    const onWindowScroll = () => {
        if (!tabStrip || !isStripExpanded(tabStrip)) return;

        const scrollTop = window.pageYOffset || document.documentElement.scrollTop;

        if (!isSticky && scrollTop > STICK_AT) {
            isSticky = true;
            if (stickyTimer) clearTimeout(stickyTimer);
            applyStickyStrip(tabStrip);
        } else if (isSticky && scrollTop <= UNSTICK_AT) {
            isSticky = false;
            if (stickyTimer) clearTimeout(stickyTimer);
            resetStickyStrip(tabStrip);
        }
    };

    window.addEventListener('scroll', onWindowScroll, { passive: true });
    onWindowScroll();

    chromeState[role] = {
        cleanup() {
            hamburgerMenu?.removeEventListener('click', onHamburger);
            scrollLeft?.removeEventListener('click', onScrollLeft);
            scrollRight?.removeEventListener('click', onScrollRight);
            window.removeEventListener('scroll', onWindowScroll);
            if (stickyTimer) clearTimeout(stickyTimer);
            resetStickyStrip(tabStrip);
        }
    };
}

export function paintActiveTabs(container, href, isTabActive) {
    if (!container) return;

    container.querySelectorAll('a').forEach((tab) => {
        const active = isTabActive(tab.getAttribute('href'), href);
        tab.classList.toggle('bg-blue-50', active);
        tab.classList.toggle('text-blue-900', active);
        tab.classList.toggle('font-semibold', active);
        tab.classList.toggle('border-blue-900', active);
        tab.classList.toggle('text-gray-600', !active);
        tab.classList.toggle('hover:text-gray-900', !active);
        tab.classList.toggle('hover:bg-gray-50', !active);
        tab.classList.toggle('border-transparent', !active);

        const icon = tab.querySelector('svg, i');
        if (icon) {
            icon.classList.toggle('text-blue-900', active);
            icon.classList.toggle('text-gray-400', !active);
        }
    });
}

export async function goToTab(path) {
    if (!path || path === window.location.pathname) return;

    if (path.startsWith('/auth/')) {
        const { navigateAuthRoute } = await import('../../../provider/Animation/auth/AuthAnimation.js');
        await navigateAuthRoute(path);
        return;
    }

    if (window.appNavigate) {
        window.appNavigate(path);
        return;
    }

    window.location.href = path;
}

export function bindTabContainer(container, { isTabActive, scrollKey }) {
    if (!container) return null;

    const savedScroll = sessionStorage.getItem(scrollKey);
    if (savedScroll != null) {
        container.scrollLeft = Number(savedScroll) || 0;
    }

    const onScroll = () => {
        sessionStorage.setItem(scrollKey, String(container.scrollLeft));
    };
    container.addEventListener('scroll', onScroll, { passive: true });

    const onClick = (e) => {
        const tab = e.target.closest('a');
        if (!tab || !container.contains(tab)) return;

        e.preventDefault();
        e.stopPropagation();

        const path = tab.getAttribute('href');
        if (!path) return;

        paintActiveTabs(container, path, isTabActive);
        goToTab(path);
    };
    container.addEventListener('click', onClick);

    return { onClick, onScroll };
}

function getStrip(role) {
    const config = PORTAL_STRIPS[role] || PUBLIC_STRIPS[role];
    if (!config) {
        throw new Error(`Unknown strip role: ${role}`);
    }
    return config;
}

function isTabActiveForRole(role, href, currentPath) {
    if (!href) return false;
    if (href === currentPath) return true;

    const tab = getStrip(role).tabs?.find((item) => item.href === href);
    return Boolean(tab?.extraActive?.includes(currentPath));
}

function bindHomepageSectionTabs(container, { scrollKey }) {
    if (!container) return null;

    const sections = ['#home', '#about', '#features', '#how-it-works', '#contact'];

    const computeActive = () => {
        let activeTarget = '#home';
        let maxVisibility = 0;

        sections.forEach((section) => {
            const element = document.querySelector(section);
            if (!element) return;

            const rect = element.getBoundingClientRect();
            const windowHeight = window.innerHeight;
            const visibleHeight = Math.min(rect.bottom, windowHeight) - Math.max(rect.top, 0);
            const visibility = visibleHeight / windowHeight;

            if (visibility > maxVisibility) {
                maxVisibility = visibility;
                activeTarget = section;
            }
        });

        return activeTarget;
    };

    const centerTab = (target) => {
        const activeTab = container.querySelector(`a[data-target="${target}"], a[href="${target}"]`);
        if (!activeTab) return;

        const containerRect = container.getBoundingClientRect();
        const tabRect = activeTab.getBoundingClientRect();
        const nextScrollLeft = container.scrollLeft + (tabRect.left + tabRect.width / 2) - (containerRect.left + containerRect.width / 2);
        const maxScrollLeft = Math.max(0, container.scrollWidth - container.clientWidth);
        container.scrollLeft = Math.min(Math.max(0, nextScrollLeft), maxScrollLeft);
        sessionStorage.setItem(scrollKey, String(container.scrollLeft));
    };

    const updateActive = (target) => {
        paintActiveTabs(container, target, (href, activeHref) => href === activeHref);
        centerTab(target);
    };

    const onClick = (e) => {
        const tab = e.target.closest('a');
        if (!tab || !container.contains(tab)) return;

        const target = tab.getAttribute('data-target');
        const href = tab.getAttribute('href');

        if (target) {
            e.preventDefault();
            e.stopPropagation();
            document.querySelector(target)?.scrollIntoView({ behavior: 'smooth' });
            updateActive(target);
            return;
        }

        if (href) {
            e.preventDefault();
            goToTab(href);
        }
    };

    const onScroll = () => {
        sessionStorage.setItem(scrollKey, String(container.scrollLeft));
    };
    const onWindowScroll = () => updateActive(computeActive());

    const savedScroll = sessionStorage.getItem(scrollKey);
    if (savedScroll != null) {
        container.scrollLeft = Number(savedScroll) || 0;
    }

    container.addEventListener('click', onClick);
    container.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('scroll', onWindowScroll, { passive: true });
    updateActive(computeActive());

    return { onClick, onScroll, onWindowScroll };
}

export function StripBar(role, options = {}) {
    const config = getStrip(role);
    const currentPath = window.location.pathname || config.defaultPath;
    const isExpanded = localStorage.getItem(config.storageKey) === 'expanded';
    const animateTabs = !isExpanded;
    const pointerStyle = config.tabMode === 'disabled' ? ' pointer-events: none;' : '';

    const innerMarkup = options.stripContent || (config.tabs || [])
        .map((tab, index) => portalTabMarkup({
            href: tab.href,
            label: tab.label,
            icon: tab.icon,
            active: config.tabMode === 'scroll' ? false : isTabActiveForRole(role, tab.href, currentPath),
            index,
            animate: animateTabs,
            disabled: Boolean(tab.disabled || config.tabMode === 'disabled'),
            target: tab.target
        }))
        .join('');

    const wrappedInner = options.stripContent
        ? innerMarkup
        : `<div class="inline-flex items-center gap-1">${innerMarkup}</div>`;

    return `
    <div id="${role}-tab-strip" class="relative bg-white text-gray-900 border-b border-gray-200 w-full left-0 overflow-hidden transition-all duration-300 ease-in-out shadow-sm" style="${stripBarShellStyle(isExpanded)}">
        <div class="container mx-auto px-2 sm:px-4 flex items-center text-gray-900">
            <button id="${role}-scroll-left" class="flex-shrink-0 p-2.5 text-gray-900 hover:text-black hover:bg-gray-100 rounded-md transition md:hidden" aria-label="Scroll left">
                <i data-lucide="chevron-left" class="w-4 h-4"></i>
            </button>

            <div id="${role}-tabs-container" class="flex-1 overflow-x-auto whitespace-nowrap scrollbar-hide py-0.5 text-gray-900" style="-ms-overflow-style: none; scrollbar-width: none; overflow-anchor: none;${pointerStyle}">
                ${wrappedInner}
            </div>

            <button id="${role}-scroll-right" class="flex-shrink-0 p-2.5 text-gray-900 hover:text-black hover:bg-gray-100 rounded-md transition md:hidden" aria-label="Scroll right">
                <i data-lucide="chevron-right" class="w-4 h-4"></i>
            </button>
        </div>
    </div>
    `;
}

export function scrollToActiveTab(role) {
    const config = getStrip(role);
    const container = document.getElementById(`${role}-tabs-container`);
    if (!container) return;

    const currentPath = window.location.pathname || config.defaultPath;
    const tabs = container.querySelectorAll('a');
    let activeTab = null;

    tabs.forEach((tab) => {
        if (isTabActiveForRole(role, tab.getAttribute('href'), currentPath)) {
            activeTab = tab;
        }
    });

    if (!activeTab) return;

    const containerRect = container.getBoundingClientRect();
    const tabRect = activeTab.getBoundingClientRect();
    const tabCenter = tabRect.left + tabRect.width / 2;
    const containerCenter = containerRect.left + containerRect.width / 2;
    const nextScrollLeft = container.scrollLeft + (tabCenter - containerCenter);
    const maxScrollLeft = Math.max(0, container.scrollWidth - container.clientWidth);

    container.scrollLeft = Math.min(Math.max(0, nextScrollLeft), maxScrollLeft);
    sessionStorage.setItem(config.scrollKey, String(container.scrollLeft));
}

export function initStripBar(role) {
    const config = getStrip(role);
    const previous = stripBarState[role];

    if (typeof config.protect === 'function') {
        config.protect();
        isAuthenticated(role).then((auth) => {
            if (!auth || getUserRole(role) !== role) {
                navigate(config.loginPath);
            }
        });
    }

    if (previous?.hashChangeHandler) {
        window.removeEventListener('popstate', previous.hashChangeHandler);
    }

    const tabsContainer = document.getElementById(`${role}-tabs-container`);
    if (previous?.tabContainerBindings && tabsContainer) {
        tabsContainer.removeEventListener('click', previous.tabContainerBindings.onClick);
        tabsContainer.removeEventListener('scroll', previous.tabContainerBindings.onScroll);
    }
    if (previous?.tabContainerBindings?.onWindowScroll) {
        window.removeEventListener('scroll', previous.tabContainerBindings.onWindowScroll);
    }

    if (typeof lucide !== 'undefined') {
        lucide.createIcons();
    }

    let tabContainerBindings = null;
    if (config.tabMode === 'scroll') {
        tabContainerBindings = bindHomepageSectionTabs(tabsContainer, { scrollKey: config.scrollKey });
    } else if (config.tabMode !== 'custom' && config.tabMode !== 'disabled') {
        tabContainerBindings = bindTabContainer(tabsContainer, {
            isTabActive: (href, currentPath) => isTabActiveForRole(role, href, currentPath),
            scrollKey: config.scrollKey
        });
        requestAnimationFrame(() => scrollToActiveTab(role));
    }

    const hashChangeHandler = () => {
        requestAnimationFrame(() => scrollToActiveTab(role));
    };
    window.addEventListener('popstate', hashChangeHandler);

    stripBarState[role] = { hashChangeHandler, tabContainerBindings };
}

export function AdminStripBar() {
    return StripBar('admin');
}

export function AdviserStripBar() {
    return StripBar('adviser');
}

export function StudentStripBar() {
    return StripBar('student');
}

export function initStripBarDropdowns() {
    initStripBar('admin');
}

export function initAdviserStripBarDropdowns() {
    initStripBar('adviser');
}

export function initStudentStripBarDropdowns() {
    initStripBar('student');
}

export function HomepageStripBar(options) {
    return StripBar('homepage', options);
}

export function NotFoundStripBar() {
    return StripBar('notfound');
}

export function SupportStripBar() {
    return StripBar('support');
}

export function BannedStripBar() {
    return StripBar('banned');
}

export function UpdatesStripBar(options) {
    return StripBar('updates', options);
}

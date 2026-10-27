export function AdminStripBar(userRole = 'Admin') {
    const currentPath = window.location.pathname || '/admin/dashboard';
    const stripBarState = localStorage.getItem('adminStripBarState') || 'collapsed';
    const initialMaxHeight = stripBarState === 'expanded' ? '500px' : '0';
    const userIsAdmin = userRole === 'Admin';

    const isSettingsActive = currentPath === '/admin/profile' || currentPath === '/settings';

    const activeTabClass = 'bg-blue-50 text-blue-900 font-semibold border-b-2 border-blue-900';
    const inactiveTabClass = 'text-gray-600 hover:text-gray-900 hover:bg-gray-50 border-b-2 border-transparent';
    const inactiveTabNoHoverClass = 'text-gray-600 border-b-2 border-transparent';

    return `
    <div id="admin-tab-strip" class="relative bg-white border-b border-gray-200 w-full left-0 overflow-hidden transition-all duration-300 ease-in-out shadow-sm" style="max-height: ${initialMaxHeight};">
        <div class="container mx-auto px-2 sm:px-4 flex items-center">
            <button id="admin-scroll-left" class="flex-shrink-0 p-2.5 text-gray-500 hover:text-gray-800 hover:bg-gray-100 rounded-md transition md:hidden" aria-label="Scroll left">
                <i data-lucide="chevron-left" class="w-4 h-4"></i>
            </button>

            <div id="admin-tabs-container" class="flex-1 overflow-x-auto whitespace-nowrap scrollbar-hide py-0.5" style="-ms-overflow-style: none; scrollbar-width: none; overflow-anchor: none;">
                <div class="inline-flex items-center gap-1">
                    <a href="/admin/dashboard" class="px-3.5 py-3 text-sm font-medium transition-colors whitespace-nowrap flex items-center gap-2 rounded-t-md ${currentPath === '/admin/dashboard' ? activeTabClass : inactiveTabClass}">
                        <i data-lucide="layout-dashboard" class="w-4 h-4 ${currentPath === '/admin/dashboard' ? 'text-blue-900' : 'text-gray-400'}"></i>
                        <span>Dashboard</span>
                    </a>

                    <a href="/admin/profile" class="px-3.5 py-3 text-sm font-medium transition-colors whitespace-nowrap flex items-center gap-2 rounded-t-md ${isSettingsActive ? activeTabClass : inactiveTabClass}">
                        <i data-lucide="user-cog" class="w-4 h-4 ${isSettingsActive ? 'text-blue-900' : 'text-gray-400'}"></i>
                        <span>Profile</span>
                    </a>

                    <a href="/admin/adviser" class="px-3.5 py-3 text-sm font-medium transition-colors whitespace-nowrap flex items-center gap-2 rounded-t-md ${currentPath === '/admin/adviser' ? activeTabClass : inactiveTabClass}">
                        <i data-lucide="users" class="w-4 h-4 ${currentPath === '/admin/adviser' ? 'text-blue-900' : 'text-gray-400'}"></i>
                        <span>Manage Adviser</span>
                    </a>

                    <a href="/admin/roles" class="px-3.5 py-3 text-sm font-medium transition-colors whitespace-nowrap flex items-center gap-2 rounded-t-md ${currentPath === '/admin/roles' ? activeTabClass : inactiveTabClass}">
                        <i data-lucide="shield" class="w-4 h-4 ${currentPath === '/admin/roles' ? 'text-blue-900' : 'text-gray-400'}"></i>
                        <span>Manage Roles</span>
                    </a>

                    <a href="/admin/students" class="px-3.5 py-3 text-sm font-medium transition-colors whitespace-nowrap flex items-center gap-2 rounded-t-md ${currentPath === '/admin/students' ? activeTabClass : inactiveTabClass}">
                        <i data-lucide="graduation-cap" class="w-4 h-4 ${currentPath === '/admin/students' ? 'text-blue-900' : 'text-gray-400'}"></i>
                        <span>Manage Students</span>
                    </a>

                    <a href="/admin/organizations" class="px-3.5 py-3 text-sm font-medium transition-colors whitespace-nowrap flex items-center gap-2 rounded-t-md ${currentPath === '/admin/organizations' ? activeTabClass : inactiveTabClass}">
                        <i data-lucide="building" class="w-4 h-4 ${currentPath === '/admin/organizations' ? 'text-blue-900' : 'text-gray-400'}"></i>
                        <span>Organizations</span>
                    </a>

                    <a href="/admin/events" class="px-3.5 py-3 text-sm font-medium transition-colors whitespace-nowrap flex items-center gap-2 rounded-t-md ${currentPath === '/admin/events' ? activeTabClass : inactiveTabClass}">
                        <i data-lucide="calendar" class="w-4 h-4 ${currentPath === '/admin/events' ? 'text-blue-900' : 'text-gray-400'}"></i>
                        <span>Events</span>
                    </a>

                    <a href="/admin/event-registrations" class="px-3.5 py-3 text-sm font-medium transition-colors whitespace-nowrap flex items-center gap-2 rounded-t-md ${currentPath === '/admin/event-registrations' ? activeTabClass : inactiveTabClass}">
                        <i data-lucide="user-check" class="w-4 h-4 ${currentPath === '/admin/event-registrations' ? 'text-blue-900' : 'text-gray-400'}"></i>
                        <span>Event Registrations</span>
                    </a>

                    <a href="/admin/org-memberships" class="px-3.5 py-3 text-sm font-medium transition-colors whitespace-nowrap flex items-center gap-2 rounded-t-md ${currentPath === '/admin/org-memberships' ? activeTabClass : inactiveTabClass}">
                        <i data-lucide="users" class="w-4 h-4 ${currentPath === '/admin/org-memberships' ? 'text-blue-900' : 'text-gray-400'}"></i>
                        <span>Org Memberships</span>
                    </a>
                </div>
            </div>

            <button id="admin-scroll-right" class="flex-shrink-0 p-2.5 text-gray-500 hover:text-gray-800 hover:bg-gray-100 rounded-md transition md:hidden" aria-label="Scroll right">
                <i data-lucide="chevron-right" class="w-4 h-4"></i>
            </button>
        </div>
    </div>
    `;
}

let activeDocHandler = null;
let hashChangeHandler = null;
let tabContainerHandler = null;

function isTabActive(href, currentPath) {
    if (!href) return false;
    if (href === currentPath) return true;
    return href === '/admin/profile' && (currentPath === '/admin/profile' || currentPath === '/settings');
}

export function scrollToActiveTab() {
    const container = document.getElementById('admin-tabs-container');
    if (!container) return;

    const currentPath = window.location.pathname || '/admin/dashboard';
    const tabs = container.querySelectorAll('a');
    let activeTab = null;

    tabs.forEach((tab) => {
        if (isTabActive(tab.getAttribute('href'), currentPath)) {
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
}

export function initStripBarDropdowns() {
    if (activeDocHandler) {
        document.removeEventListener('click', activeDocHandler);
    }

    if (hashChangeHandler) {
        window.removeEventListener('popstate', hashChangeHandler);
    }

    if (tabContainerHandler) {
        const tabsContainer = document.getElementById('admin-tabs-container');
        if (tabsContainer) {
            tabsContainer.removeEventListener('click', tabContainerHandler);
        }
    }

    if (typeof lucide !== 'undefined') {
        lucide.createIcons();
    }

    requestAnimationFrame(() => {
        scrollToActiveTab();
        setTimeout(scrollToActiveTab, 50);
    });

    const tabsContainer = document.getElementById('admin-tabs-container');
    if (tabsContainer) {
        tabContainerHandler = (e) => {
            const tab = e.target.closest('a');
            if (tab && tabsContainer.contains(tab)) {
                e.preventDefault();
                e.stopPropagation();
                const path = tab.getAttribute('href');
                if (window.appNavigate) {
                    window.appNavigate(path);
                } else {
                    window.location.href = path;
                }
            }
        };
        tabsContainer.addEventListener('click', tabContainerHandler);
    }

    hashChangeHandler = () => {
        requestAnimationFrame(() => {
            scrollToActiveTab();
        });
    };
    window.addEventListener('popstate', hashChangeHandler);
}

document.addEventListener('click', function(e) {
    const tab = e.target.closest('a');
    if (!tab) return;

    const tabsContainer = tab.closest('#admin-tabs-container');
    if (!tabsContainer) return;

    e.preventDefault();
    e.stopPropagation();
    const path = tab.getAttribute('href');
    if (window.appNavigate) {
        window.appNavigate(path);

        setTimeout(() => {
            if (typeof lucide !== 'undefined') {
                lucide.createIcons();
            }
        }, 50);
    } else {
        window.location.href = path;
    }
}, true);

document.addEventListener('DOMContentLoaded', function() {
    setTimeout(() => {
        initStripBarDropdowns();
    }, 300);
});

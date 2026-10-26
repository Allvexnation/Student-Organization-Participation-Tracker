export function AdminStripBar(userRole = 'Admin') {
    const currentPath = window.location.pathname || '/admin-dashboard';
    const stripBarState = localStorage.getItem('adminStripBarState') || 'collapsed';
    const initialMaxHeight = stripBarState === 'expanded' ? '500px' : '0';
    const userIsAdmin = userRole === 'Admin';

    const isSettingsActive = currentPath === '/edit-admin-profile' || currentPath === '/settings';

    const activeTabClass = 'bg-blue-50 text-blue-900 font-semibold border-b-2 border-blue-900';
    const inactiveTabClass = 'text-gray-600 hover:text-gray-900 hover:bg-gray-50 border-b-2 border-transparent';
    const inactiveTabNoHoverClass = 'text-gray-600 border-b-2 border-transparent';

    return `
    <div id="admin-tab-strip" class="relative bg-white border-b border-gray-200 w-full left-0 overflow-hidden transition-all duration-300 ease-in-out shadow-sm" style="max-height: ${initialMaxHeight};">
        <div class="container mx-auto px-2 sm:px-4 flex items-center">
            <button id="admin-scroll-left" class="flex-shrink-0 p-2.5 text-gray-500 hover:text-gray-800 hover:bg-gray-100 rounded-md transition md:hidden" aria-label="Scroll left">
                <i data-lucide="chevron-left" class="w-4 h-4"></i>
            </button>

            <div id="admin-tabs-container" class="flex-1 overflow-x-auto whitespace-nowrap scrollbar-hide py-0.5" style="-ms-overflow-style: none; scrollbar-width: none;">
                <div class="inline-flex items-center gap-1">
                    <a href="/admin-dashboard" class="px-3.5 py-3 text-sm font-medium transition-colors whitespace-nowrap flex items-center gap-2 rounded-t-md ${currentPath === '/admin-dashboard' ? activeTabClass : inactiveTabClass}">
                        <i data-lucide="layout-dashboard" class="w-4 h-4 ${currentPath === '/admin-dashboard' ? 'text-blue-900' : 'text-gray-400'}"></i>
                        <span>Dashboard</span>
                    </a>

                    <a href="/edit-admin-profile" class="px-3.5 py-3 text-sm font-medium transition-colors whitespace-nowrap flex items-center gap-2 rounded-t-md ${isSettingsActive ? activeTabClass : inactiveTabClass}">
                        <i data-lucide="user-cog" class="w-4 h-4 ${isSettingsActive ? 'text-blue-900' : 'text-gray-400'}"></i>
                        <span>Profile</span>
                    </a>

                    <a href="/manage-adviser" class="px-3.5 py-3 text-sm font-medium transition-colors whitespace-nowrap flex items-center gap-2 rounded-t-md ${currentPath === '/manage-adviser' ? activeTabClass : inactiveTabClass}">
                        <i data-lucide="users" class="w-4 h-4 ${currentPath === '/manage-adviser' ? 'text-blue-900' : 'text-gray-400'}"></i>
                        <span>Manage Adviser</span>
                    </a>

                    <a href="/manage-roles" class="px-3.5 py-3 text-sm font-medium transition-colors whitespace-nowrap flex items-center gap-2 rounded-t-md ${currentPath === '/manage-roles' ? activeTabClass : inactiveTabClass}">
                        <i data-lucide="shield" class="w-4 h-4 ${currentPath === '/manage-roles' ? 'text-blue-900' : 'text-gray-400'}"></i>
                        <span>Manage Roles</span>
                    </a>

                    <a href="/manage-students" class="px-3.5 py-3 text-sm font-medium transition-colors whitespace-nowrap flex items-center gap-2 rounded-t-md ${currentPath === '/manage-students' ? activeTabClass : inactiveTabClass}">
                        <i data-lucide="graduation-cap" class="w-4 h-4 ${currentPath === '/manage-students' ? 'text-blue-900' : 'text-gray-400'}"></i>
                        <span>Manage Students</span>
                    </a>

                    <a href="/manage-organizations" class="px-3.5 py-3 text-sm font-medium transition-colors whitespace-nowrap flex items-center gap-2 rounded-t-md ${currentPath === '/manage-organizations' ? activeTabClass : inactiveTabClass}">
                        <i data-lucide="building" class="w-4 h-4 ${currentPath === '/manage-organizations' ? 'text-blue-900' : 'text-gray-400'}"></i>
                        <span>Organizations</span>
                    </a>

                    <a href="/manage-events" class="px-3.5 py-3 text-sm font-medium transition-colors whitespace-nowrap flex items-center gap-2 rounded-t-md ${currentPath === '/manage-events' ? activeTabClass : inactiveTabClass}">
                        <i data-lucide="calendar" class="w-4 h-4 ${currentPath === '/manage-events' ? 'text-blue-900' : 'text-gray-400'}"></i>
                        <span>Events</span>
                    </a>

                    <a href="/manage-event-registrations" class="px-3.5 py-3 text-sm font-medium transition-colors whitespace-nowrap flex items-center gap-2 rounded-t-md ${currentPath === '/manage-event-registrations' ? activeTabClass : inactiveTabClass}">
                        <i data-lucide="user-check" class="w-4 h-4 ${currentPath === '/manage-event-registrations' ? 'text-blue-900' : 'text-gray-400'}"></i>
                        <span>Event Registrations</span>
                    </a>

                    <a href="/manage-org-memberships" class="px-3.5 py-3 text-sm font-medium transition-colors whitespace-nowrap flex items-center gap-2 rounded-t-md ${currentPath === '/manage-org-memberships' ? activeTabClass : inactiveTabClass}">
                        <i data-lucide="users" class="w-4 h-4 ${currentPath === '/manage-org-memberships' ? 'text-blue-900' : 'text-gray-400'}"></i>
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

function scrollToActiveTab() {
    const container = document.getElementById('admin-tabs-container');
    if (!container) return;

    const currentPath = window.location.pathname || '/admin-dashboard';
    
    let activeTab = null;
    const tabs = container.querySelectorAll('a, button');
    
    tabs.forEach(tab => {
        if (tab.tagName === 'A' && tab.getAttribute('href') === currentPath) {
            activeTab = tab;
        }
    });

    if (activeTab) {
        activeTab.scrollIntoView({
            behavior: 'auto',
            block: 'nearest',
            inline: 'center'
        });
    }
}

export function initStripBarDropdowns() {
    if (activeDocHandler) {
        document.removeEventListener('click', activeDocHandler);
    }

    if (hashChangeHandler) {
        window.removeEventListener('hashchange', hashChangeHandler);
    }

    if (typeof lucide !== 'undefined') {
        lucide.createIcons();
    }

    scrollToActiveTab();

    hashChangeHandler = () => {
        scrollToActiveTab();
        setTimeout(() => {
            initStripBarDropdowns();
        }, 100);
    };
    window.addEventListener('popstate', hashChangeHandler);
}

document.addEventListener('DOMContentLoaded', function() {
    setTimeout(() => {
        initStripBarDropdowns();
    }, 300);
});

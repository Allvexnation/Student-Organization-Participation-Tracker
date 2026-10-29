export function StudentStripBar(userRole = 'Student') {
    const currentPath = window.location.pathname || '/student/dashboard';
    const stripBarState = localStorage.getItem('studentStripBarState');
    const initialMaxHeight = stripBarState === 'expanded' ? '500px' : '0';
    const userIsStudent = userRole === 'Student';

    const isSettingsActive = currentPath === '/student/profile' || currentPath === '/settings';
    const isTasksActive = currentPath === '/student/tasks';

    const activeTabClass = 'bg-blue-50 text-blue-900 font-semibold border-b-2 border-blue-900';
    const inactiveTabClass = 'text-gray-600 hover:text-gray-900 hover:bg-gray-50 border-b-2 border-transparent';
    const inactiveTabNoHoverClass = 'text-gray-600 border-b-2 border-transparent';

    return `
    <div id="student-tab-strip" class="relative bg-white border-b border-gray-200 w-full left-0 overflow-hidden transition-all duration-300 ease-in-out shadow-sm" style="max-height: ${initialMaxHeight};">
        <div class="container mx-auto px-2 sm:px-4 flex items-center">
            <button id="student-scroll-left" class="flex-shrink-0 p-2.5 text-gray-500 hover:text-gray-800 hover:bg-gray-100 rounded-md transition md:hidden" aria-label="Scroll left">
                <i data-lucide="chevron-left" class="w-4 h-4"></i>
            </button>

            <div id="student-tabs-container" class="flex-1 overflow-x-auto whitespace-nowrap scrollbar-hide py-0.5" style="-ms-overflow-style: none; scrollbar-width: none; overflow-anchor: none;">
                <div class="inline-flex items-center gap-1">
                    <a href="/student/dashboard" class="px-3.5 py-3 text-sm font-medium transition-colors whitespace-nowrap flex items-center gap-2 rounded-t-md ${currentPath === '/student/dashboard' ? activeTabClass : inactiveTabClass}">
                        <i data-lucide="layout-dashboard" class="w-4 h-4 ${currentPath === '/student/dashboard' ? 'text-blue-900' : 'text-gray-400'}"></i>
                        <span>Dashboard</span>
                    </a>

                    <a href="/student/tasks" class="px-3.5 py-3 text-sm font-medium transition-colors whitespace-nowrap flex items-center gap-2 rounded-t-md ${isTasksActive ? activeTabClass : inactiveTabClass}">
                        <i data-lucide="check-square" class="w-4 h-4 ${isTasksActive ? 'text-blue-900' : 'text-gray-400'}"></i>
                        <span>Tasks</span>
                    </a>

                    <a href="/student/profile" class="px-3.5 py-3 text-sm font-medium transition-colors whitespace-nowrap flex items-center gap-2 rounded-t-md ${isSettingsActive ? activeTabClass : inactiveTabClass}">
                        <i data-lucide="user-cog" class="w-4 h-4 ${isSettingsActive ? 'text-blue-900' : 'text-gray-400'}"></i>
                        <span>Profile</span>
                    </a>
                </div>
            </div>

            <button id="student-scroll-right" class="flex-shrink-0 p-2.5 text-gray-500 hover:text-gray-800 hover:bg-gray-100 rounded-md transition md:hidden" aria-label="Scroll right">
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
    return href === '/student/profile' && (currentPath === '/student/profile' || currentPath === '/settings');
}

export function scrollToActiveTab() {
    const container = document.getElementById('student-tabs-container');
    if (!container) return;

    const currentPath = window.location.pathname || '/student/dashboard';
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

export function initStudentStripBarDropdowns() {
    if (activeDocHandler) {
        document.removeEventListener('click', activeDocHandler);
    }

    if (hashChangeHandler) {
        window.removeEventListener('popstate', hashChangeHandler);
    }

    if (tabContainerHandler) {
        const tabsContainer = document.getElementById('student-tabs-container');
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

    const tabsContainer = document.getElementById('student-tabs-container');
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

    const tabsContainer = tab.closest('#student-tabs-container');
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
        initStudentStripBarDropdowns();
    }, 300);
});

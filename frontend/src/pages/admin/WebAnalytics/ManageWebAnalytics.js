import { getAllAnalytics, getAnalyticsStats, deleteAnalytics } from '../../../api/web/WebAnalytics.js';
import { showToast } from '../../../components/ToastMessage.js';
import { AdminNavbar, initAdminNavbar } from '../../../components/Navbar/AdminNavbar.js';
import { protectAdminRoute } from '../../../middleware/AdminMiddleware.js';
import { CrudMenu } from '../../../components/CrudMenu.js';
import { skeletonTableRows } from '../../../components/SkeletonLoading.js';
import { initStripBarDropdowns } from '../../../components/Stripbar/AdminStripbar.js';

export function ManageWebAnalytics() {
    return `
        ${AdminNavbar()}
        <main class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
                <div>
                    <h1 class="text-2xl font-semibold text-gray-900">Web Analytics</h1>
                    <p class="text-sm text-gray-500 mt-1">Track visitor statistics and page views across the application.</p>
                </div>
                <div class="flex items-center gap-2.5">
                    <input 
                        type="text" 
                        id="analyticsSearch" 
                        placeholder="Search analytics..." 
                        class="px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent w-48 sm:w-64">
                </div>
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                <div class="bg-white border border-gray-200 rounded-lg shadow-sm p-5">
                    <div class="flex items-center justify-between">
                        <div>
                            <p class="text-sm font-medium text-gray-500">Total Visits</p>
                            <p id="totalVisits" class="text-2xl font-semibold text-gray-900 mt-1">—</p>
                        </div>
                        <div class="p-3 bg-blue-50 rounded-lg">
                            <i data-lucide="eye" class="w-5 h-5 text-blue-600"></i>
                        </div>
                    </div>
                </div>
                <div class="bg-white border border-gray-200 rounded-lg shadow-sm p-5">
                    <div class="flex items-center justify-between">
                        <div>
                            <p class="text-sm font-medium text-gray-500">Unique Visitors</p>
                            <p id="uniqueVisitors" class="text-2xl font-semibold text-gray-900 mt-1">—</p>
                        </div>
                        <div class="p-3 bg-green-50 rounded-lg">
                            <i data-lucide="users" class="w-5 h-5 text-green-600"></i>
                        </div>
                    </div>
                </div>
                <div class="bg-white border border-gray-200 rounded-lg shadow-sm p-5">
                    <div class="flex items-center justify-between">
                        <div>
                            <p class="text-sm font-medium text-gray-500">Unique Routes</p>
                            <p id="uniqueRoutes" class="text-2xl font-semibold text-gray-900 mt-1">—</p>
                        </div>
                        <div class="p-3 bg-purple-50 rounded-lg">
                            <i data-lucide="route" class="w-5 h-5 text-purple-600"></i>
                        </div>
                    </div>
                </div>
                <div class="bg-white border border-gray-200 rounded-lg shadow-sm p-5">
                    <div class="flex items-center justify-between">
                        <div>
                            <p class="text-sm font-medium text-gray-500">Authenticated Visits</p>
                            <p id="authenticatedVisits" class="text-2xl font-semibold text-gray-900 mt-1">—</p>
                        </div>
                        <div class="p-3 bg-orange-50 rounded-lg">
                            <i data-lucide="shield-check" class="w-5 h-5 text-orange-600"></i>
                        </div>
                    </div>
                </div>
            </div>

            <div class="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
                <div class="overflow-x-auto">
                    <table class="w-full text-sm text-left">
                        <thead>
                            <tr class="bg-gray-50 border-b border-gray-200 text-xs font-medium text-gray-500 uppercase tracking-wider">
                                <th class="px-5 py-3.5 w-12 text-center hidden sm:table-cell">#</th>
                                <th class="px-5 py-3.5">Route</th>
                                <th class="px-5 py-3.5 hidden md:table-cell">IP Address</th>
                                <th class="px-5 py-3.5 hidden lg:table-cell">Device</th>
                                <th class="px-5 py-3.5 hidden lg:table-cell">Location</th>
                                <th class="px-5 py-3.5 hidden md:table-cell">User</th>
                                <th class="px-5 py-3.5 hidden md:table-cell">Active</th>
                                <th class="px-5 py-3.5 hidden lg:table-cell">URL</th>
                                <th class="px-5 py-3.5 hidden sm:table-cell">Visited At</th>
                                <th class="px-5 py-3.5 text-center w-28">Actions</th>
                            </tr>
                        </thead>
                        <tbody id="analyticsTableBody" class="divide-y divide-gray-100">
                            ${skeletonTableRows(window.innerWidth < 640 ? 3 : 4, window.innerWidth < 640 ? 3 : 8, true)}
                        </tbody>
                    </table>
                </div>
            </div>
        </main>
    `;
}

export async function initManageWebAnalytics() {
    protectAdminRoute();
    await initAdminNavbar();
    initStripBarDropdowns();

    let analytics = [];
    let stats = null;
    let hasLoaded = false;

    async function loadAnalytics(forceRefresh = false) {
        try {
            const [analyticsResult, statsResult] = await Promise.all([
                getAllAnalytics(),
                getAnalyticsStats()
            ]);

            if (analyticsResult) {
                analytics = analyticsResult.analytics || [];
                renderAnalytics(analytics);
                hasLoaded = true;
            }

            if (statsResult) {
                stats = statsResult;
                renderStats(stats);
            }
        } catch (error) {
            console.error('Error loading analytics:', error);
            if (!hasLoaded) {
                const tbody = document.getElementById('analyticsTableBody');
                if (tbody) {
                    tbody.innerHTML = `
                        <tr>
                            <td colspan="10" class="px-5 py-12 text-center text-red-500">Failed to load analytics</td>
                        </tr>
                    `;
                }
                showToast('Failed to load analytics', 'error');
            }
        }
    }

    function renderStats(data) {
        if (data.stats) {
            document.getElementById('totalVisits').textContent = data.stats.total_visits || 0;
            document.getElementById('uniqueVisitors').textContent = data.stats.unique_visitors || 0;
            document.getElementById('uniqueRoutes').textContent = data.stats.unique_routes || 0;
            document.getElementById('authenticatedVisits').textContent = data.stats.authenticated_visits || 0;
        }
    }

    function renderAnalytics(data) {
        const tbody = document.getElementById('analyticsTableBody');
        
        if (!tbody) {
            console.error('analyticsTableBody element not found');
            return;
        }
        
        if (!data || data.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="10" class="px-5 py-12 text-center">
                        <i data-lucide="bar-chart-2" class="w-10 h-10 text-gray-200 mx-auto mb-2"></i>
                        <p class="text-sm text-gray-500 font-medium">No analytics data found.</p>
                        <p class="text-xs text-gray-400 mt-1">Visitor data will appear here as users navigate the application.</p>
                    </td>
                </tr>
            `;
            if (typeof lucide !== 'undefined') lucide.createIcons();
            return;
        }

        tbody.innerHTML = data.map((item, index) => {
            const location = [item.city, item.country].filter(Boolean).join(', ') || '—';
            const userInfo = item.user_type && item.user_id 
                ? `${item.user_type} #${item.user_id}` 
                : 'Anonymous';
            const isActive = item.active === 1;
            const urlDisplay = item.url ? (item.url.length > 50 ? item.url.substring(0, 50) + '...' : item.url) : '—';
            
            return `
            <tr style="transition: background-color 0.2s;" onmouseover="this.style.backgroundColor = document.documentElement.classList.contains('dark') ? 'rgba(255, 255, 255, 0.02)' : 'rgba(0, 0, 0, 0.1)'" onmouseout="this.style.backgroundColor = ''">
                <td class="px-3 sm:px-5 py-2 sm:py-3.5 text-xs text-gray-400 text-center font-mono hidden sm:table-cell">
                    ${index + 1}
                </td>
                <td class="px-3 sm:px-5 py-2 sm:py-3.5">
                    <span class="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200 font-mono">
                        ${item.route}
                    </span>
                </td>
                <td class="px-3 sm:px-5 py-2 sm:py-3.5 hidden md:table-cell text-gray-600 text-sm font-mono">
                    ${item.ip_address || '—'}
                </td>
                <td class="px-3 sm:px-5 py-2 sm:py-3.5 hidden lg:table-cell text-gray-600 text-sm">
                    ${item.device_type || '—'}
                </td>
                <td class="px-3 sm:px-5 py-2 sm:py-3.5 hidden lg:table-cell text-gray-600 text-sm truncate max-w-xs">
                    ${location}
                </td>
                <td class="px-3 sm:px-5 py-2 sm:py-3.5 hidden md:table-cell">
                    <span class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                        item.user_type ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-gray-50 text-gray-500 border border-gray-200'
                    }">
                        ${userInfo}
                    </span>
                </td>
                <td class="px-3 sm:px-5 py-2 sm:py-3.5 hidden md:table-cell">
                    <span class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                        isActive ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-gray-50 text-gray-500 border border-gray-200'
                    }">
                        ${isActive ? 'Active' : 'Inactive'}
                    </span>
                </td>
                <td class="px-3 sm:px-5 py-2 sm:py-3.5 hidden lg:table-cell text-gray-600 text-sm truncate max-w-xs" title="${item.url || ''}">
                    <a href="${item.url || '#'}" target="_blank" class="text-blue-600 hover:text-blue-800 hover:underline" ${!item.url ? 'pointer-events-none' : ''}>
                        ${urlDisplay}
                    </a>
                </td>
                <td class="px-3 sm:px-5 py-2 sm:py-3.5 hidden sm:table-cell text-gray-600 text-sm whitespace-nowrap">
                    ${item.visited_at ? new Date(item.visited_at).toLocaleString() : '—'}
                </td>
                <td class="px-3 sm:px-5 py-2 sm:py-3.5 text-center">
                    ${CrudMenu({
                        id: String(item.id),
                        showView: false,
                        showEdit: false,
                        onDelete: 'deleteAnalytics',
                        deleteLabel: 'this analytics record',
                        deleteText: 'Delete'
                    })}
                </td>
            </tr>
            `;
        }).join('');

        if (typeof lucide !== 'undefined') {
            lucide.createIcons();
        }
    }

    window.deleteAnalytics = (id, deleteLabel) => {
        const confirmDelete = confirm(`Are you sure you want to permanently delete ${deleteLabel || 'this analytics record'}? This action cannot be undone.`);
        
        if (confirmDelete) {
            deleteAnalytics(id).then(() => {
                loadAnalytics(true);
                showToast('Analytics record deleted successfully', 'success');
            }).catch((error) => {
                console.error('Error deleting analytics:', error);
                showToast('Failed to delete analytics record', 'error');
            });
        }
    };

    document.getElementById('analyticsSearch').addEventListener('input', (e) => {
        const searchTerm = e.target.value.toLowerCase();
        const filtered = analytics.filter(item => 
            (item.route && item.route.toLowerCase().includes(searchTerm)) ||
            (item.ip_address && item.ip_address.toLowerCase().includes(searchTerm)) ||
            (item.country && item.country.toLowerCase().includes(searchTerm)) ||
            (item.city && item.city.toLowerCase().includes(searchTerm)) ||
            (item.device_type && item.device_type.toLowerCase().includes(searchTerm)) ||
            (item.browser && item.browser.toLowerCase().includes(searchTerm)) ||
            (item.url && item.url.toLowerCase().includes(searchTerm))
        );
        renderAnalytics(filtered);
    });

    const waitForElement = () => {
        if (document.getElementById('analyticsTableBody')) {
            loadAnalytics();
        } else {
            setTimeout(waitForElement, 50);
        }
    };
    waitForElement();
}

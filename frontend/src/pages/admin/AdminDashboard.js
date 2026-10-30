import { logout, getAdminData } from '../../api/admin/AdminLogin.js';
import { AdminNavbar, initAdminNavbar } from '../../components/Navbar/AdminNavbar.js';
import { protectAdminRoute } from '../../middleware/AdminMiddleware.js';
import { isAuthenticated, getUserRole } from '../../utils/jwt.js';
import { navigate } from '../../utils/navigation.js';
import { getDashboardCounts } from '../../api/admin/Dashboard/AdminDashboard.js';
import { skeletonStatCard } from '../../components/SkeletonLoading.js';
import { dashboardImages } from '../../static/Dashboard/Dashboard.js';

function getGreeting() {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
}

function formatDate() {
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    return new Date().toLocaleDateString('en-US', options);
}

export function AdminDashboard() {
    const adminData = getAdminData();
    const displayName = adminData?.firstName || 'Admin';
    
    return `
        <div class="min-h-screen bg-gray-50" style="overflow: auto;">
            ${AdminNavbar()}

            <main class="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                <div class="mb-6">
                    <h1 class="text-2xl font-semibold text-gray-900">${getGreeting()}, ${displayName}</h1>
                    <p class="text-sm text-gray-500 mt-1">${formatDate()}</p>
                </div>

                <div class="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4" id="primary-stats">
                    ${skeletonStatCard('primary')}
                    ${skeletonStatCard('primary')}
                    ${skeletonStatCard('primary')}
                </div>

                <div class="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6" id="secondary-stats">
                    ${skeletonStatCard('secondary')}
                    ${skeletonStatCard('secondary')}
                    ${skeletonStatCard('secondary')}
                </div>
            </main>
        </div>
    `;
}

function renderPrimaryStats(stats) {
    const studentsImageUrl = dashboardImages.students.path;
    const organizationsImageUrl = dashboardImages.organizations.path;
    const eventsImageUrl = dashboardImages.events.path;
    
    return `
        <a href="#students" class="block rounded-lg p-5 text-white hover:bg-blue-800 transition-colors relative overflow-hidden" style="background-image: url('${studentsImageUrl}'); background-size: cover; background-position: center;">
            <div style="position: absolute; top: 0; left: 0; right: 0; bottom: 0; background-color: rgba(30, 58, 138, 0.7); z-index: 0;"></div>
            <div class="flex items-center justify-between relative z-10">
                <div>
                    <p class="text-blue-200 text-xs font-medium uppercase tracking-wide">Total Students</p>
                    <p class="text-3xl font-bold mt-1" id="total-students">${stats.totalStudents}</p>
                </div>
                <i data-lucide="users" class="w-8 h-8 text-blue-300 opacity-60"></i>
            </div>
        </a>
        <a href="#organizations" class="block rounded-lg p-5 text-white hover:bg-blue-800 transition-colors relative overflow-hidden" style="background-image: url('${organizationsImageUrl}'); background-size: cover; background-position: center;">
            <div style="position: absolute; top: 0; left: 0; right: 0; bottom: 0; background-color: rgba(30, 58, 138, 0.7); z-index: 0;"></div>
            <div class="flex items-center justify-between relative z-10">
                <div>
                    <p class="text-blue-200 text-xs font-medium uppercase tracking-wide">Organizations</p>
                    <p class="text-3xl font-bold mt-1" id="total-organizations">${stats.totalOrganizations}</p>
                </div>
                <i data-lucide="building-2" class="w-8 h-8 text-blue-300 opacity-60"></i>
            </div>
        </a>
        <a href="#events" class="block rounded-lg p-5 text-white hover:bg-blue-800 transition-colors relative overflow-hidden" style="background-image: url('${eventsImageUrl}'); background-size: cover; background-position: center;">
            <div style="position: absolute; top: 0; left: 0; right: 0; bottom: 0; background-color: rgba(30, 58, 138, 0.7); z-index: 0;"></div>
            <div class="flex items-center justify-between relative z-10">
                <div>
                    <p class="text-blue-200 text-xs font-medium uppercase tracking-wide">Total Events</p>
                    <p class="text-3xl font-bold mt-1" id="active-events">${stats.activeEvents}</p>
                </div>
                <i data-lucide="calendar" class="w-8 h-8 text-blue-300 opacity-60"></i>
            </div>
        </a>
    `;
}

function renderSecondaryStats(stats) {
    return `
        <a href="#registrations" class="block bg-white border border-gray-200 rounded-lg p-5 hover:border-blue-300 transition-colors">
            <div class="flex items-center justify-between">
                <div>
                    <p class="text-gray-500 text-xs font-medium uppercase tracking-wide">Event Registrations</p>
                    <p class="text-2xl font-bold text-gray-900 mt-1" id="event-registrations">${stats.eventRegistrations || 0}</p>
                </div>
                <i data-lucide="clipboard-list" class="w-6 h-6 text-gray-400"></i>
            </div>
        </a>
        <a href="#memberships" class="block bg-white border border-gray-200 rounded-lg p-5 hover:border-blue-300 transition-colors">
            <div class="flex items-center justify-between">
                <div>
                    <p class="text-gray-500 text-xs font-medium uppercase tracking-wide">Org Memberships</p>
                    <p class="text-2xl font-bold text-gray-900 mt-1" id="org-memberships">${stats.orgMemberships || 0}</p>
                </div>
                <i data-lucide="user-check" class="w-6 h-6 text-gray-400"></i>
            </div>
        </a>
        <a href="#advisers" class="block bg-white border border-gray-200 rounded-lg p-5 hover:border-blue-300 transition-colors">
            <div class="flex items-center justify-between">
                <div>
                    <p class="text-gray-500 text-xs font-medium uppercase tracking-wide">Advisers</p>
                    <p class="text-2xl font-bold text-gray-900 mt-1" id="total-advisers">${stats.totalAdvisers || 0}</p>
                </div>
                <i data-lucide="user-cog" class="w-6 h-6 text-gray-400"></i>
            </div>
        </a>
    `;
}

export async function initAdminDashboard() {
    const auth = await isAuthenticated('admin');
    if (!auth || getUserRole('admin') !== 'admin') {
        navigate('/auth/admin/login');
        return;
    }
    protectAdminRoute();
    await initAdminNavbar();

    try {
        const counts = await getDashboardCounts();

        const primaryStats = document.getElementById('primary-stats');
        if (primaryStats) {
            primaryStats.innerHTML = renderPrimaryStats(counts);
        }

        const secondaryStats = document.getElementById('secondary-stats');
        if (secondaryStats) {
            secondaryStats.innerHTML = renderSecondaryStats(counts);
        }

        if (typeof lucide !== 'undefined') {
            lucide.createIcons();
        }
    } catch (error) {
        console.error('Error loading dashboard data:', error);
    }
}

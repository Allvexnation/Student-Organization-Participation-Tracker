import { studentLogout, getStudentData } from '../../api/students/StudentAuth/StudentAuth.js';
import { StudentNavbar, initStudentNavbar } from '../../components/Navbar/StudentNavbar.js';
import { isAuthenticated, getUserRole } from '../../utils/jwt.js';
import { navigate } from '../../utils/navigation.js';
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

export function StudentDashboard() {
    const studentData = getStudentData();
    const displayName = studentData?.firstName || 'Student';
    
    return `
        <div class="min-h-screen bg-gray-50" style="overflow: auto;">
            ${StudentNavbar()}

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
    const organizationsImageUrl = dashboardImages.organizations.path;
    const eventsImageUrl = dashboardImages.events.path;
    const tasksImageUrl = dashboardImages.tasks.path;
    
    return `
        <a href="#organizations" class="block rounded-lg p-5 text-white hover:bg-blue-800 transition-colors relative overflow-hidden" style="background-image: url('${organizationsImageUrl}'); background-size: cover; background-position: center;">
            <div style="position: absolute; top: 0; left: 0; right: 0; bottom: 0; background-color: rgba(30, 58, 138, 0.7); z-index: 0;"></div>
            <div class="flex items-center justify-between relative z-10">
                <div>
                    <p class="text-blue-200 text-xs font-medium uppercase tracking-wide">My Organizations</p>
                    <p class="text-3xl font-bold mt-1" id="total-organizations">${stats.totalOrganizations || 0}</p>
                </div>
                <i data-lucide="building-2" class="w-8 h-8 text-blue-300 opacity-60"></i>
            </div>
        </a>
        <a href="#events" class="block rounded-lg p-5 text-white hover:bg-blue-800 transition-colors relative overflow-hidden" style="background-image: url('${eventsImageUrl}'); background-size: cover; background-position: center;">
            <div style="position: absolute; top: 0; left: 0; right: 0; bottom: 0; background-color: rgba(30, 58, 138, 0.7); z-index: 0;"></div>
            <div class="flex items-center justify-between relative z-10">
                <div>
                    <p class="text-blue-200 text-xs font-medium uppercase tracking-wide">Registered Events</p>
                    <p class="text-3xl font-bold mt-1" id="total-events">${stats.totalEvents || 0}</p>
                </div>
                <i data-lucide="calendar" class="w-8 h-8 text-blue-300 opacity-60"></i>
            </div>
        </a>
        <a href="#tasks" class="block rounded-lg p-5 text-white hover:bg-blue-800 transition-colors relative overflow-hidden" style="background-image: url('${tasksImageUrl}'); background-size: cover; background-position: center;">
            <div style="position: absolute; top: 0; left: 0; right: 0; bottom: 0; background-color: rgba(30, 58, 138, 0.7); z-index: 0;"></div>
            <div class="flex items-center justify-between relative z-10">
                <div>
                    <p class="text-blue-200 text-xs font-medium uppercase tracking-wide">Completed Tasks</p>
                    <p class="text-3xl font-bold mt-1" id="completed-tasks">${stats.completedTasks || 0}</p>
                </div>
                <i data-lucide="check-circle" class="w-8 h-8 text-blue-300 opacity-60"></i>
            </div>
        </a>
    `;
}

function renderSecondaryStats(stats) {
    return `
        <a href="#upcoming" class="block bg-white border border-gray-200 rounded-lg p-5 hover:border-blue-300 transition-colors">
            <div class="flex items-center justify-between">
                <div>
                    <p class="text-gray-500 text-xs font-medium uppercase tracking-wide">Upcoming Events</p>
                    <p class="text-2xl font-bold text-gray-900 mt-1" id="upcoming-events">${stats.upcomingEvents || 0}</p>
                </div>
                <i data-lucide="calendar-clock" class="w-6 h-6 text-gray-400"></i>
            </div>
        </a>
        <a href="#notifications" class="block bg-white border border-gray-200 rounded-lg p-5 hover:border-blue-300 transition-colors">
            <div class="flex items-center justify-between">
                <div>
                    <p class="text-gray-500 text-xs font-medium uppercase tracking-wide">Notifications</p>
                    <p class="text-2xl font-bold text-gray-900 mt-1" id="notifications">${stats.notifications || 0}</p>
                </div>
                <i data-lucide="bell" class="w-6 h-6 text-gray-400"></i>
            </div>
        </a>
        <a href="#achievements" class="block bg-white border border-gray-200 rounded-lg p-5 hover:border-blue-300 transition-colors">
            <div class="flex items-center justify-between">
                <div>
                    <p class="text-gray-500 text-xs font-medium uppercase tracking-wide">Achievements</p>
                    <p class="text-2xl font-bold text-gray-900 mt-1" id="achievements">${stats.achievements || 0}</p>
                </div>
                <i data-lucide="award" class="w-6 h-6 text-gray-400"></i>
            </div>
        </a>
    `;
}

export async function initStudentDashboard() {
    if (!(await isAuthenticated('student')) || getUserRole('student') !== 'student') {
        navigate('/auth/student/login');
        return;
    }
    await initStudentNavbar();

    try {
        const stats = {
            totalOrganizations: 0,
            totalEvents: 0,
            completedTasks: 0,
            upcomingEvents: 0,
            notifications: 0,
            achievements: 0
        };

        const primaryStats = document.getElementById('primary-stats');
        if (primaryStats) {
            primaryStats.innerHTML = renderPrimaryStats(stats);
        }

        const secondaryStats = document.getElementById('secondary-stats');
        if (secondaryStats) {
            secondaryStats.innerHTML = renderSecondaryStats(stats);
        }

        if (typeof lucide !== 'undefined') {
            lucide.createIcons();
        }
    } catch (error) {
        console.error('Error loading dashboard data:', error);
    }
}

import { adviserLogout, getAdviserData } from '../../api/adviser/AdviserAuth/AdviserAuth.js';
import { AdviserNavbar, initAdviserNavbar } from '../../components/Navbar/AdviserNavbar.js';
import { isAuthenticated, getUserRole } from '../../utils/jwt.js';
import { navigate } from '../../utils/navigation.js';

export function AdviserDashboard() {
    const adviserData = getAdviserData();
    
    return `
        ${AdviserNavbar()}
        <main class="container mx-auto px-4 py-8 bg-white min-h-screen">
            <div class="p-6">
                <h2 class="text-2xl font-bold text-blue-800 mb-6">Dashboard Overview</h2>
                
                <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                    <div class="bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg p-4 text-white transition-transform duration-300 hover:scale-105 shadow-lg">
                        <div class="text-3xl font-bold" id="totalStudents">0</div>
                        <div class="text-sm opacity-90">Total Students</div>
                    </div>
                    <div class="bg-gradient-to-br from-cyan-500 to-cyan-600 rounded-lg p-4 text-white transition-transform duration-300 hover:scale-105 shadow-lg">
                        <div class="text-3xl font-bold" id="totalOrganizations">0</div>
                        <div class="text-sm opacity-90">Total Organizations</div>
                    </div>
                    <div class="bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-lg p-4 text-white transition-transform duration-300 hover:scale-105 shadow-lg">
                        <div class="text-3xl font-bold" id="activeEvents">0</div>
                        <div class="text-sm opacity-90">Active Events</div>
                    </div>
                </div>
            </div>
        </main>
    `;
}

export async function initAdviserDashboard() {
    if (!isAuthenticated('adviser') || getUserRole('adviser') !== 'adviser') {
        navigate('/auth/adviser/login');
        return;
    }
    await initAdviserNavbar();
}

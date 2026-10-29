import { studentLogout, getStudentData } from '../../api/students/StudentAuth/StudentAuth.js';
import { StudentNavbar, initStudentNavbar } from '../../components/Navbar/StudentNavbar.js';
import { isAuthenticated, getUserRole } from '../../utils/jwt.js';
import { navigate } from '../../utils/navigation.js';

export function StudentDashboard() {
    const studentData = getStudentData();
    
    return `
        ${StudentNavbar()}
        <main class="container mx-auto px-4 py-8 bg-white min-h-screen">
            <div class="p-6">
                <h2 class="text-2xl font-bold text-blue-800 mb-6">Dashboard Overview</h2>
                
                <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                    <div class="bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg p-4 text-white transition-transform duration-300 hover:scale-105 shadow-lg">
                        <div class="text-3xl font-bold" id="totalOrganizations">0</div>
                        <div class="text-sm opacity-90">My Organizations</div>
                    </div>
                    <div class="bg-gradient-to-br from-cyan-500 to-cyan-600 rounded-lg p-4 text-white transition-transform duration-300 hover:scale-105 shadow-lg">
                        <div class="text-3xl font-bold" id="totalEvents">0</div>
                        <div class="text-sm opacity-90">Registered Events</div>
                    </div>
                    <div class="bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-lg p-4 text-white transition-transform duration-300 hover:scale-105 shadow-lg">
                        <div class="text-3xl font-bold" id="completedTasks">0</div>
                        <div class="text-sm opacity-90">Completed Tasks</div>
                    </div>
                </div>
            </div>
        </main>
    `;
}

export async function initStudentDashboard() {
    if (!isAuthenticated() || getUserRole() !== 'student') {
        navigate('/auth/student/login');
        return;
    }
    await initStudentNavbar();
}

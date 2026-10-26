export function HomePage() {
    return `
        <div class="min-h-screen relative bg-cover bg-center" style="background-image: url('public/banner.png');">
            <div class="absolute inset-0 bg-blue-900 opacity-50"></div>
            
            <div class="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
                <div class="flex justify-center mb-12">
                    <img src="public/crtlogo.png" alt="CRT Logo" class="h-32 w-auto bg-white rounded-full p-4 shadow-lg">
                </div>
                
                <div class="text-center mb-16">
                    <h1 class="text-4xl md:text-5xl font-bold text-white mb-4 drop-shadow-lg">
                        CRT Student Organization Participation Tracker
                    </h1>
                    <p class="text-xl text-white max-w-3xl mx-auto leading-relaxed drop-shadow-md">
                        A comprehensive system for tracking and managing student organization participation and activities
                    </p>
                </div>
                
                <div class="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
                    <div class="bg-white bg-opacity-95 backdrop-blur-sm rounded-lg p-8 hover:shadow-xl transition-shadow duration-300">
                        <div class="flex justify-center mb-4">
                            <i data-lucide="bar-chart-3" class="w-12 h-12 text-blue-600"></i>
                        </div>
                        <h3 class="text-xl font-semibold text-gray-900 text-center mb-3">Track Participation</h3>
                        <p class="text-gray-600 text-center">
                            Monitor and record student involvement in organizations and events
                        </p>
                    </div>
                    <div class="bg-white bg-opacity-95 backdrop-blur-sm rounded-lg p-8 hover:shadow-xl transition-shadow duration-300">
                        <div class="flex justify-center mb-4">
                            <i data-lucide="calendar-check" class="w-12 h-12 text-blue-600"></i>
                        </div>
                        <h3 class="text-xl font-semibold text-gray-900 text-center mb-3">Manage Activities</h3>
                        <p class="text-gray-600 text-center">
                            Create, schedule, and manage organization activities and events
                        </p>
                    </div>
                    <div class="bg-white bg-opacity-95 backdrop-blur-sm rounded-lg p-8 hover:shadow-xl transition-shadow duration-300">
                        <div class="flex justify-center mb-4">
                            <i data-lucide="file-text" class="w-12 h-12 text-blue-600"></i>
                        </div>
                        <h3 class="text-xl font-semibold text-gray-900 text-center mb-3">View Reports</h3>
                        <p class="text-gray-600 text-center">
                            Generate detailed reports on participation and engagement metrics
                        </p>
                    </div>
                </div>
                
                <div class="flex justify-center">
                    <a href="/admin-login" class="bg-blue-800 hover:bg-blue-900 text-white font-semibold py-3 px-10 rounded transition-colors duration-200 shadow-lg">
                        Login to Portal
                    </a>
                </div>
            </div>
            
            <div class="relative z-10 bg-white bg-opacity-90 backdrop-blur-sm border-t border-gray-200 mt-16">
                <div class="max-w-7xl mx-auto px-4 py-8 text-center text-gray-600 text-sm">
                    <p>&copy; 2026 CRT - Student Organization Participation Tracker</p>
                </div>
            </div>
        </div>
    `;
}

export function initHomePage() {
    if (typeof lucide !== 'undefined') {
        lucide.createIcons();
    }
}

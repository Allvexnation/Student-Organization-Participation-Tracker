import { animate404Elements } from '../../provider/Animation/404Animation.js';

export function NotFoundPage() {
    return `
    <div class="min-h-screen flex items-center justify-center p-4 relative bg-cover bg-center bg-no-repeat" style="background-image: url('/public/banner.png');">
        <div class="absolute inset-0 pointer-events-none bg-gradient-to-b from-blue-900/50 via-blue-900/30 to-transparent"></div>
        <div class="bg-white rounded-2xl shadow-2xl w-full max-w-md p-8 relative z-10">
            <div class="text-center mb-8">
                <img src="/public/crtlogo.png" alt="CRT Logo" class="h-24 w-auto mx-auto mb-4">
                <h1 class="text-8xl font-bold text-blue-800 mb-4">404</h1>
                <p class="text-gray-600 mt-2 text-lg">Page not found</p>
                <p class="text-gray-500 mt-2">The page you're looking for doesn't exist or has been moved.</p>
            </div>

            <button onclick="window.appNavigate('/')"
                class="w-full bg-blue-700 hover:bg-blue-800 text-white font-semibold py-3 px-4 rounded-lg transition-colors duration-200 shadow-md hover:shadow-lg">
                Go to Home
            </button>

            <div class="mt-8 pt-6 border-t border-gray-200 text-center">
                <p class="text-xs text-gray-500">San Jose Branch</p>
            </div>
        </div>
    </div>
    `;
}

export function initNotFoundPage() {
    animate404Elements();
}

import { adminLogin } from '../../api/admin/AdminAuth/AdminAuth.js';
import { initStepForm } from '../../utils/steps.js';
import { setToken, isAuthenticated, initNetworkListener, removeToken, setUserData, getUserRole } from '../../utils/jwt.js';
import { showToast, updateToast } from '../../components/ToastMessage.js';
import { navigate } from '../../utils/navigation.js';

export function AdminLogin() {
    return `
    <div class="min-h-screen flex items-center justify-center p-4 relative bg-cover bg-center bg-no-repeat" style="background-image: url('/public/banner.png');">
        <div class="absolute inset-0 pointer-events-none bg-gradient-to-b from-blue-900/50 via-blue-900/30 to-transparent"></div>
        <div class="bg-white rounded-2xl shadow-2xl w-full max-w-md p-8 relative z-10">
            <div class="text-center mb-8">
                <img src="/public/crtlogo.png" alt="CRT Logo" class="h-24 w-auto mx-auto mb-4">
                <h1 class="text-2xl font-bold text-blue-800">College for Research & Technology</h1>
                <p class="text-gray-600 mt-2">Admin Portal Login</p>
            </div>

            <form id="adminLoginForm">
                <div data-step="1">
                    <div class="mb-4">
                        <label for="email" class="block text-sm font-medium text-gray-700 mb-2">Email or Username</label>
                        <input type="text" id="email" name="email" required
                            class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                            placeholder="Enter your email or username">
                    </div>
                    <div class="flex gap-3">
                        <button type="button" data-action="next"
                            class="flex-1 bg-blue-700 hover:bg-blue-800 text-white font-semibold py-3 px-4 rounded-lg transition-colors duration-200 shadow-md hover:shadow-lg">
                            Next
                        </button>
                    </div>
                </div>

                <div data-step="2" class="hidden">
                    <div class="mb-4">
                        <label for="password" class="block text-sm font-medium text-gray-700 mb-2">Password</label>
                        <div class="relative">
                            <input type="password" id="password" name="password"
                                class="w-full px-4 py-3 pr-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                                placeholder="Enter your password">
                            <button type="button" id="togglePassword" class="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700">
                                <i data-lucide="eye" id="eyeIcon" class="w-5 h-5"></i>
                                <i data-lucide="eye-off" id="eyeOffIcon" class="w-5 h-5 hidden"></i>
                            </button>
                        </div>
                    </div>
                    <div class="flex gap-3">
                        <button type="button" data-action="prev"
                            class="flex-1 bg-gray-500 hover:bg-gray-600 text-white font-semibold py-3 px-4 rounded-lg transition-colors">
                            Back
                        </button>
                        <button type="submit" data-action="submit" id="loginButton"
                            class="flex-1 bg-blue-700 hover:bg-blue-800 text-white font-semibold py-3 px-4 rounded-lg transition-colors duration-200 shadow-md hover:shadow-lg">
                            Login
                        </button>
                    </div>
                </div>
            </form>

            <div class="mt-8 pt-6 border-t border-gray-200 text-center">
                <p class="text-xs text-gray-500">San Jose Branch</p>
            </div>
        </div>
    </div>
    `;
}

export function initAdminLogin() {
    initNetworkListener();

    (async () => {
        const authenticated = await isAuthenticated('admin');
        if (authenticated && getUserRole('admin') === 'admin') {
            navigate('/admin/dashboard');
            return;
        }
    })();
    
    document.body.classList.remove('admin-page', 'student-page');

    initStepForm(
        'adminLoginForm',
        2,
        (proceed) => {
            const email = document.getElementById('email').value;
            if (!email) {
                showToast('Please enter your email or username', 'error');
                return;
            }
            proceed();
        },
        () => {
        }
    );
    
    document.getElementById('adminLoginForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const Email = document.getElementById('email').value;
        const Password = document.getElementById('password').value;
        const loginButton = document.getElementById('loginButton');
        
        loginButton.disabled = true;
        loginButton.textContent = 'Logging in...';
        
        showToast('Logging in...', 'loading');
        
        const result = await adminLogin(Email, Password);
        
        if (result.token) {
            setToken(result.token, 'admin');
            if (result.admin) {
                setUserData(result.admin, 'admin');
            }
            updateToast('Login successful! Redirecting...', 'success');
            setTimeout(() => {
                navigate('/admin/dashboard');
            }, 1000);
        } else {
            updateToast(result.message || 'Login failed', 'error');
            loginButton.disabled = false;
            loginButton.textContent = 'Login';
        }
    });
    
    const togglePassword = document.getElementById('togglePassword');
    const passwordInput = document.getElementById('password');
    const eyeIcon = document.getElementById('eyeIcon');
    const eyeOffIcon = document.getElementById('eyeOffIcon');
    
    lucide.createIcons();
    
    togglePassword.addEventListener('click', () => {
        if (passwordInput.type === 'password') {
            passwordInput.type = 'text';
            eyeIcon.classList.add('hidden');
            eyeOffIcon.classList.remove('hidden');
        } else {
            passwordInput.type = 'password';
            eyeIcon.classList.remove('hidden');
            eyeOffIcon.classList.add('hidden');
        }
    });
}

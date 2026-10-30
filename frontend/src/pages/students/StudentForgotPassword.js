import { studentForgotPassword, studentVerifyOtp, studentResetPassword } from '../../api/students/StudentForgotPassword.js';
import { initStepForm } from '../../utils/steps.js';
import { showToast, updateToast } from '../../components/ToastMessage.js';
import { navigate } from '../../utils/navigation.js';
import { PasswordValidator } from '../../validator/PasswordValidator.js';

export function StudentForgotPassword() {
    return `
    <div class="min-h-screen flex items-center justify-center p-4 relative bg-cover bg-center bg-no-repeat" style="background-image: url('/public/banner.png');">
        <div class="absolute inset-0 pointer-events-none bg-gradient-to-b from-blue-900/50 via-blue-900/30 to-transparent"></div>
        <div class="bg-white rounded-2xl shadow-2xl w-full max-w-md p-8 relative z-10">
            <div class="text-center mb-8">
                <img src="/public/crtlogo.png" alt="CRT Logo" class="h-24 w-auto mx-auto mb-4">
                <h1 class="text-2xl font-bold text-blue-800">College for Research & Technology</h1>
                <p class="text-gray-600 mt-2">Reset Your Password</p>
            </div>

            <form id="studentForgotPasswordForm">
                <div data-step="1">
                    <div class="mb-4">
                        <label for="usernameOrEmail" class="block text-sm font-medium text-gray-700 mb-2">Username or Email</label>
                        <input type="text" id="usernameOrEmail" name="usernameOrEmail" required
                            class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                            placeholder="Enter your username or email">
                    </div>
                    <div class="flex gap-3">
                        <button type="button" data-action="next"
                            class="flex-1 bg-blue-700 hover:bg-blue-800 text-white font-semibold py-3 px-4 rounded-lg transition-colors duration-200 shadow-md hover:shadow-lg">
                            Send OTP
                        </button>
                    </div>
                    <div class="mt-4 text-center">
                        <a href="/auth/student/login" class="text-blue-600 hover:text-blue-800 text-sm">Back to Login</a>
                    </div>
                </div>

                <div data-step="2" class="hidden">
                    <div class="mb-4">
                        <label class="block text-sm font-medium text-gray-700 mb-2">Enter 6-Digit OTP</label>
                        <p class="text-xs text-gray-500 mb-3">Enter the code sent to your email</p>
                        <div class="flex justify-center gap-2" id="otpContainer">
                            <input type="text" maxlength="1" inputmode="numeric" pattern="[0-9]*" class="otp-input w-12 h-12 text-center text-2xl font-bold border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors" data-index="0">
                            <input type="text" maxlength="1" inputmode="numeric" pattern="[0-9]*" class="otp-input w-12 h-12 text-center text-2xl font-bold border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors" data-index="1">
                            <input type="text" maxlength="1" inputmode="numeric" pattern="[0-9]*" class="otp-input w-12 h-12 text-center text-2xl font-bold border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors" data-index="2">
                            <input type="text" maxlength="1" inputmode="numeric" pattern="[0-9]*" class="otp-input w-12 h-12 text-center text-2xl font-bold border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors" data-index="3">
                            <input type="text" maxlength="1" inputmode="numeric" pattern="[0-9]*" class="otp-input w-12 h-12 text-center text-2xl font-bold border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors" data-index="4">
                            <input type="text" maxlength="1" inputmode="numeric" pattern="[0-9]*" class="otp-input w-12 h-12 text-center text-2xl font-bold border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors" data-index="5">
                        </div>
                    </div>
                    <div class="flex gap-3">
                        <button type="button" data-action="prev"
                            class="flex-1 bg-gray-500 hover:bg-gray-600 text-white font-semibold py-3 px-4 rounded-lg transition-colors">
                            Back
                        </button>
                        <button type="button" data-action="next" id="verifyOtpButton"
                            class="flex-1 bg-blue-700 hover:bg-blue-800 text-white font-semibold py-3 px-4 rounded-lg transition-colors duration-200 shadow-md hover:shadow-lg">
                            Verify OTP
                        </button>
                    </div>
                </div>

                <div data-step="3" class="hidden">
                    <div class="mb-4">
                        <label for="newPassword" class="block text-sm font-medium text-gray-700 mb-2">New Password</label>
                        <div class="relative">
                            <input type="password" id="newPassword" name="newPassword" required
                                class="w-full px-4 py-3 pr-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                                placeholder="Enter your new password">
                            <button type="button" id="toggleNewPassword" class="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700">
                                <i data-lucide="eye" id="eyeIconNew" class="w-5 h-5"></i>
                                <i data-lucide="eye-off" id="eyeOffIconNew" class="w-5 h-5 hidden"></i>
                            </button>
                        </div>
                    </div>
                    <div class="mb-4">
                        <label for="confirmPassword" class="block text-sm font-medium text-gray-700 mb-2">Confirm Password</label>
                        <div class="relative">
                            <input type="password" id="confirmPassword" name="confirmPassword" required
                                class="w-full px-4 py-3 pr-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                                placeholder="Confirm your new password">
                            <button type="button" id="toggleConfirmPassword" class="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700">
                                <i data-lucide="eye" id="eyeIconConfirm" class="w-5 h-5"></i>
                                <i data-lucide="eye-off" id="eyeOffIconConfirm" class="w-5 h-5 hidden"></i>
                            </button>
                        </div>
                    </div>
                    <div class="flex gap-3">
                        <button type="button" data-action="prev"
                            class="flex-1 bg-gray-500 hover:bg-gray-600 text-white font-semibold py-3 px-4 rounded-lg transition-colors">
                            Back
                        </button>
                        <button type="submit" data-action="submit" id="resetPasswordButton"
                            class="flex-1 bg-blue-700 hover:bg-blue-800 text-white font-semibold py-3 px-4 rounded-lg transition-colors duration-200 shadow-md hover:shadow-lg">
                            Reset Password
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

export function initStudentForgotPassword() {
    document.body.classList.remove('admin-page', 'adviser-page');
    document.body.classList.add('student-page');

    let studentId = null;
    let stepForm = null;

    stepForm = initStepForm(
        'studentForgotPasswordForm',
        3,
        async (proceed) => {
            const usernameOrEmail = document.getElementById('usernameOrEmail').value;
            if (!usernameOrEmail) {
                showToast('Please enter your username or email', 'error');
                return;
            }
            
            showToast('Checking account...', 'loading');
            
            const result = await studentForgotPassword(usernameOrEmail);

            if (result.student_id) {
                studentId = result.student_id;
                updateToast('OTP sent successfully to your email!', 'success');
                proceed();
            } else {
                updateToast(result.message, 'error');
            }
        },
        () => {},
        (proceed) => {
            const newPassword = document.getElementById('newPassword').value;
            const confirmPassword = document.getElementById('confirmPassword').value;
            
            // Validate password using PasswordValidator
            const validation = PasswordValidator.validate(newPassword, confirmPassword);
            if (!validation.isValid) {
                showToast(validation.message, 'error');
                return;
            }
            
            proceed();
        }
    );

    const otpInputs = document.querySelectorAll('.otp-input');
    otpInputs.forEach((input, index) => {
        input.addEventListener('input', (e) => {
            const value = e.target.value;
            e.target.value = value.replace(/[^0-9]/g, '');
            
            if (e.target.value.length === 1 && index < otpInputs.length - 1) {
                otpInputs[index + 1].focus();
            }
        });

        input.addEventListener('keydown', (e) => {
            if (e.key === 'Backspace' && !e.target.value && index > 0) {
                otpInputs[index - 1].focus();
            }
        });

        input.addEventListener('paste', (e) => {
            e.preventDefault();
            const pasteData = e.clipboardData.getData('text').replace(/[^0-9]/g, '').slice(0, 6);
            pasteData.split('').forEach((char, i) => {
                if (otpInputs[i]) {
                    otpInputs[i].value = char;
                }
            });
            if (pasteData.length === 6) {
                otpInputs[5].focus();
            }
        });
    });

    document.getElementById('verifyOtpButton').addEventListener('click', async () => {
        const otpCode = Array.from(otpInputs).map(input => input.value).join('');
        
        if (otpCode.length !== 6) {
            showToast('Please enter the complete 6-digit OTP', 'error');
            return;
        }

        const verifyButton = document.getElementById('verifyOtpButton');
        verifyButton.disabled = true;
        verifyButton.textContent = 'Verifying...';
        
        showToast('Verifying OTP...', 'loading');

        const result = await studentVerifyOtp(studentId, otpCode);

        if (result.message === 'OTP verified successfully') {
            updateToast('OTP verified successfully!', 'success');
            setTimeout(() => {
                stepForm.showStep(3);
                verifyButton.disabled = false;
                verifyButton.textContent = 'Verify OTP';
            }, 1500);
        } else {
            updateToast(result.message, 'error');
            verifyButton.disabled = false;
            verifyButton.textContent = 'Verify OTP';
            otpInputs.forEach(input => input.value = '');
            otpInputs[0].focus();
        }
    });

    document.getElementById('studentForgotPasswordForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const newPassword = document.getElementById('newPassword').value;
        const confirmPassword = document.getElementById('confirmPassword').value;
        const resetButton = document.getElementById('resetPasswordButton');
        
        // Validate password using PasswordValidator
        const validation = PasswordValidator.validate(newPassword, confirmPassword);
        if (!validation.isValid) {
            showToast(validation.message, 'error');
            return;
        }

        resetButton.disabled = true;
        resetButton.textContent = 'Resetting...';
        
        showToast('Resetting password...', 'loading');

        const result = await studentResetPassword(studentId, newPassword);

        if (result.message === 'Password reset successfully') {
            updateToast('Password reset successfully! Redirecting to login...', 'success');
            setTimeout(() => {
                navigate('/auth/student/login');
            }, 2000);
        } else {
            updateToast(result.message, 'error');
            resetButton.disabled = false;
            resetButton.textContent = 'Reset Password';
        }
    });

    const toggleNewPassword = document.getElementById('toggleNewPassword');
    const newPasswordInput = document.getElementById('newPassword');
    const eyeIconNew = document.getElementById('eyeIconNew');
    const eyeOffIconNew = document.getElementById('eyeOffIconNew');

    const toggleConfirmPassword = document.getElementById('toggleConfirmPassword');
    const confirmPasswordInput = document.getElementById('confirmPassword');
    const eyeIconConfirm = document.getElementById('eyeIconConfirm');
    const eyeOffIconConfirm = document.getElementById('eyeOffIconConfirm');

    lucide.createIcons();

    toggleNewPassword.addEventListener('click', () => {
        if (newPasswordInput.type === 'password') {
            newPasswordInput.type = 'text';
            eyeIconNew.classList.add('hidden');
            eyeOffIconNew.classList.remove('hidden');
        } else {
            newPasswordInput.type = 'password';
            eyeIconNew.classList.remove('hidden');
            eyeOffIconNew.classList.add('hidden');
        }
    });

    toggleConfirmPassword.addEventListener('click', () => {
        if (confirmPasswordInput.type === 'password') {
            confirmPasswordInput.type = 'text';
            eyeIconConfirm.classList.add('hidden');
            eyeOffIconConfirm.classList.remove('hidden');
        } else {
            confirmPasswordInput.type = 'password';
            eyeIconConfirm.classList.remove('hidden');
            eyeIconConfirm.classList.add('hidden');
        }
    });
}

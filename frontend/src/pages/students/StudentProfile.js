import { StudentNavbar, initStudentNavbar } from '../../components/Navbar/StudentNavbar.js';
import { getStudentData } from '../../api/students/StudentAuth/StudentAuth.js';
import { getStudentProfile, updateStudentProfile } from '../../api/students/StudentProfile.js';
import { protectStudentRoute } from '../../middleware/StudentMiddleware.js';
import { openConfirmDialog } from '../../components/Dialog/ConfirmDialog.js';
import { showToast, updateToast } from '../../components/ToastMessage.js';

export function StudentProfile() {
    const studentData = getStudentData() || {};
    const firstName = studentData.first_name || '';
    const lastName = studentData.last_name || '';
    const fullName = `${firstName} ${lastName}`.trim();
    const username = studentData.username || '';
    const email = studentData.email || '';
    const studentNumber = studentData.student_number || '';
    const program = studentData.program || '';
    const yearLevel = studentData.year_level || '';
    const profilePhoto = studentData.profile_photo || '';
    
    const initials = getInitials(fullName);

    return `
        <div class="min-h-screen bg-gray-50">
            ${StudentNavbar()}

            <main class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                <div class="mb-6">
                    <h1 class="text-2xl font-semibold text-gray-900">Manage Account & Profile</h1>
                    <p class="text-sm text-gray-500 mt-1">Update your student credentials, personal details, and account security.</p>
                </div>

                <form id="edit-profile-form">
                    <input type="hidden" name="id" id="settingsId" value="${studentData.id || ''}">

                    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        <div class="lg:col-span-1">
                            <div class="bg-white border border-gray-200 rounded-lg p-5 sm:p-6 shadow-sm flex flex-col items-center text-center">
                                <div class="w-full flex items-center gap-2 mb-4 pb-3 border-b border-gray-100 text-left">
                                    <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4 text-blue-900" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                    </svg>
                                    <h2 class="text-sm font-semibold text-gray-900 uppercase tracking-wider">Profile Photo</h2>
                                </div>

                                <div class="relative group my-3">
                                    <div id="profilePhotoPreview" class="w-28 h-28 rounded-full border-2 border-dashed border-gray-300 p-1 flex items-center justify-center overflow-hidden bg-gray-50 shadow-inner">
                                        ${getPhotoPreview(profilePhoto, initials)}
                                    </div>
                                </div>

                                <div class="mb-4">
                                    <h3 class="text-base font-semibold text-gray-900" id="profileFullNameDisplay">${fullName}</h3>
                                    <span class="inline-flex items-center gap-1.5 px-2.5 py-0.5 mt-1 rounded-full text-xs font-medium bg-blue-50 text-blue-900 border border-blue-200">
                                        <span class="w-1.5 h-1.5 rounded-full bg-blue-600"></span>
                                        Student
                                    </span>
                                </div>

                                <label for="profilePhoto" class="w-full cursor-pointer px-4 py-2 text-xs font-medium text-blue-900 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-md transition flex items-center justify-center gap-2">
                                    <svg xmlns="http://www.w3.org/2000/svg" class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                                    </svg>
                                    <span>Upload New Photo</span>
                                </label>
                                <input 
                                    type="file" 
                                    id="profilePhoto" 
                                    name="profilePhoto" 
                                    accept="image/png,image/jpeg,image/webp" 
                                    class="hidden">

                                <p class="text-[11px] text-gray-400 mt-2">JPG, PNG, or WEBP up to 2MB</p>
                            </div>
                        </div>

                        <div class="lg:col-span-2 space-y-6">
                            <div class="bg-white border border-gray-200 rounded-lg p-5 sm:p-6 shadow-sm">
                                <div class="flex items-center gap-2 mb-4 pb-3 border-b border-gray-100">
                                    <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4 text-blue-900" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                    </svg>
                                    <h2 class="text-sm font-semibold text-gray-900 uppercase tracking-wider">Personal Information</h2>
                                </div>

                                <div class="space-y-4">
                                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <label for="settingsFirstName" class="block text-xs font-medium text-gray-700 uppercase tracking-wide mb-1.5">
                                                First Name <span class="text-red-500">*</span>
                                            </label>
                                            <input 
                                                type="text" 
                                                name="first_name" 
                                                id="settingsFirstName" 
                                                value="${firstName}" 
                                                required 
                                                class="w-full px-3.5 py-2.5 text-sm border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition">
                                        </div>

                                        <div>
                                            <label for="settingsLastName" class="block text-xs font-medium text-gray-700 uppercase tracking-wide mb-1.5">
                                                Last Name <span class="text-red-500">*</span>
                                            </label>
                                            <input 
                                                type="text" 
                                                name="last_name" 
                                                id="settingsLastName" 
                                                value="${lastName}" 
                                                required 
                                                class="w-full px-3.5 py-2.5 text-sm border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition">
                                        </div>
                                    </div>

                                    <div>
                                        <label for="settingsStudentNumber" class="block text-xs font-medium text-gray-700 uppercase tracking-wide mb-1.5">
                                            Student Number
                                        </label>
                                        <input 
                                            type="text" 
                                            name="student_number" 
                                            id="settingsStudentNumber" 
                                            value="${studentNumber}" 
                                            class="w-full px-3.5 py-2.5 text-sm border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition">
                                    </div>

                                    <div>
                                        <label for="settingsUsername" class="block text-xs font-medium text-gray-700 uppercase tracking-wide mb-1.5">
                                            Username <span class="text-red-500">*</span>
                                        </label>
                                        <input 
                                            type="text" 
                                            name="username" 
                                            id="settingsUsername" 
                                            value="${username}" 
                                            required 
                                            class="w-full px-3.5 py-2.5 text-sm border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition">
                                    </div>

                                    <div>
                                        <label for="settingsEmail" class="block text-xs font-medium text-gray-700 uppercase tracking-wide mb-1.5">
                                            Email <span class="text-red-500">*</span>
                                        </label>
                                        <input 
                                            type="email" 
                                            name="email" 
                                            id="settingsEmail" 
                                            value="${email}" 
                                            required 
                                            class="w-full px-3.5 py-2.5 text-sm border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition">
                                    </div>

                                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <label for="settingsProgram" class="block text-xs font-medium text-gray-700 uppercase tracking-wide mb-1.5">
                                                Program
                                            </label>
                                            <input 
                                                type="text" 
                                                name="program" 
                                                id="settingsProgram" 
                                                value="${program}" 
                                                class="w-full px-3.5 py-2.5 text-sm border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition">
                                        </div>

                                        <div>
                                            <label for="settingsYearLevel" class="block text-xs font-medium text-gray-700 uppercase tracking-wide mb-1.5">
                                                Year Level
                                            </label>
                                            <input 
                                                type="text" 
                                                name="year_level" 
                                                id="settingsYearLevel" 
                                                value="${yearLevel}" 
                                                class="w-full px-3.5 py-2.5 text-sm border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition">
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div class="bg-white border border-gray-200 rounded-lg p-5 sm:p-6 shadow-sm">
                                <div class="flex items-center gap-2 mb-2 pb-3 border-b border-gray-100">
                                    <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4 text-blue-900" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                                    </svg>
                                    <h2 class="text-sm font-semibold text-gray-900 uppercase tracking-wider">Change Password</h2>
                                </div>
                                <p class="text-xs text-gray-500 mb-4">Leave password fields blank if you do not wish to change your current password.</p>

                                <div class="space-y-4">
                                    <div>
                                        <label for="settingsOldPassword" class="block text-xs font-medium text-gray-700 uppercase tracking-wide mb-1.5">
                                            Current (Old) Password
                                        </label>
                                        <div class="relative">
                                            <input 
                                                type="password" 
                                                name="old_password" 
                                                id="settingsOldPassword" 
                                                placeholder="Enter current password to verify"
                                                class="w-full px-3.5 py-2.5 text-sm border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition pr-10">
                                            <button type="button" onclick="togglePassword('settingsOldPassword')" class="absolute right-2 top-0 bottom-0 flex items-center justify-center text-gray-400 hover:text-gray-600 focus:outline-none px-2">
                                                <svg id="settingsOldPassword-eye-icon" xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                                </svg>
                                            </button>
                                        </div>
                                    </div>

                                    <div>
                                        <label for="settingsPassword" class="block text-xs font-medium text-gray-700 uppercase tracking-wide mb-1.5">
                                            New Password
                                        </label>
                                        <div class="relative">
                                            <input 
                                                type="password" 
                                                name="password" 
                                                id="settingsPassword" 
                                                placeholder="Minimum 6 characters"
                                                class="w-full px-3.5 py-2.5 text-sm border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition pr-10">
                                            <button type="button" onclick="togglePassword('settingsPassword')" class="absolute right-2 top-0 bottom-0 flex items-center justify-center text-gray-400 hover:text-gray-600 focus:outline-none px-2">
                                                <svg id="settingsPassword-eye-icon" xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                                </svg>
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div class="mt-6 bg-white border border-gray-200 rounded-lg p-4 shadow-sm flex flex-col-reverse sm:flex-row items-center justify-end gap-3">
                        <button 
                            type="button" 
                            id="resetProfileBtn" 
                            class="w-full sm:w-auto px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-200 transition">
                            Reset Changes
                        </button>
                        <button 
                            type="submit" 
                            id="saveSettings" 
                            class="w-full sm:w-auto px-6 py-2 text-sm font-medium text-white bg-blue-900 hover:bg-blue-800 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition flex items-center justify-center gap-2">
                            <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
                            </svg>
                            <span>Save Profile</span>
                        </button>
                    </div>
                </form>
            </main>

            <div id="successModal" class="fixed inset-0 bg-black bg-opacity-50 hidden items-center justify-center z-[100]">
                <div class="bg-white rounded-lg p-6 max-w-sm w-full mx-4 shadow-2xl">
                    <div class="text-center">
                        <div class="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100 mb-4">
                            <svg class="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                            </svg>
                        </div>
                        <h3 class="text-lg font-semibold text-gray-900 mb-2">Success!</h3>
                        <p class="text-gray-600 mb-6">Your profile has been updated successfully.</p>
                        <button id="closeSuccessModal" class="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition-colors">
                            OK
                        </button>
                    </div>
                </div>
            </div>

            <div id="errorModal" class="fixed inset-0 bg-black bg-opacity-50 hidden items-center justify-center z-[100]">
                <div class="bg-white rounded-lg p-6 max-w-sm w-full mx-4 shadow-2xl">
                    <div class="text-center">
                        <div class="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
                            <svg class="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </div>
                        <h3 class="text-lg font-semibold text-gray-900 mb-2">Error!</h3>
                        <p class="text-gray-600 mb-6" id="errorMessage">Failed to update profile. Please try again.</p>
                        <button id="closeErrorModal" class="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-semibold transition-colors">
                            OK
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `;
}

export async function initStudentProfile() {
    protectStudentRoute();
    await initStudentNavbar();

    try {
        const freshData = await getStudentProfile();
        if (freshData) {
            localStorage.setItem('studentData', JSON.stringify(freshData));
        }
    } catch (error) {
        console.error('Failed to fetch fresh profile data:', error);
    }

    const studentData = getStudentData() || {};
    let selectedPhoto = null;

    const profilePhotoInput = document.getElementById('profilePhoto');
    const profilePhotoPreview = document.getElementById('profilePhotoPreview');

    if (profilePhotoInput && profilePhotoPreview) {
        profilePhotoInput.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = (event) => {
                    selectedPhoto = event.target.result;
                    profilePhotoPreview.innerHTML = `<img src="${selectedPhoto}" alt="Profile Preview" class="w-full h-full object-cover rounded-full">`;
                };
                reader.readAsDataURL(file);
            }
        });
    }

    const form = document.getElementById('edit-profile-form');
    if (form) {
        form.addEventListener('submit', async (e) => {
            e.preventDefault();

            const firstName = document.getElementById('settingsFirstName').value;
            const lastName = document.getElementById('settingsLastName').value;
            const username = document.getElementById('settingsUsername').value;
            const email = document.getElementById('settingsEmail').value;
            const studentNumber = document.getElementById('settingsStudentNumber').value;
            const program = document.getElementById('settingsProgram').value;
            const yearLevel = document.getElementById('settingsYearLevel').value;
            const password = document.getElementById('settingsPassword').value;
            const oldPassword = document.getElementById('settingsOldPassword').value;

            if (password && !oldPassword) {
                showToast('Please enter your current password to change your password.', 'error');
                return;
            }

            const profileData = {
                first_name: firstName,
                last_name: lastName,
                username,
                email,
                student_number: studentNumber,
                program,
                year_level: yearLevel,
                profile_photo: selectedPhoto || studentData.profile_photo || ''
            };

            if (password) {
                profileData.password = password;
            }

            openConfirmDialog({
                title: 'Save Profile Changes',
                message: 'Are you sure you want to save these changes to your profile?',
                confirmText: 'Save Changes',
                cancelText: 'Cancel',
                type: 'normal',
                onConfirm: async () => {
                    showToast('Saving profile changes...', 'loading');
                    try {
                        const saveBtn = document.getElementById('saveSettings');
                        saveBtn.disabled = true;
                        saveBtn.innerHTML = `
                            <svg class="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            <span>Saving...</span>
                        `;

                        const result = await updateStudentProfile(profileData);

                        const navUsername = document.getElementById('navUsername');
                        if (navUsername) {
                            navUsername.textContent = `Welcome, ${firstName}`;
                        }

                        const profileFullNameDisplay = document.getElementById('profileFullNameDisplay');
                        if (profileFullNameDisplay) {
                            profileFullNameDisplay.textContent = `${firstName} ${lastName}`.trim();
                        }

                        if (result.student && result.student.profile_photo) {
                            const initials = getInitials(`${firstName} ${lastName}`.trim());
                            if (profilePhotoPreview) {
                                profilePhotoPreview.innerHTML = getPhotoPreview(result.student.profile_photo, initials);
                            }
                            selectedPhoto = null;
                        }

                        document.getElementById('settingsPassword').value = '';
                        document.getElementById('settingsOldPassword').value = '';

                        updateToast('Profile updated successfully!', 'success');
                    } catch (error) {
                        updateToast(error.message || 'Failed to update profile. Please try again.', 'error');
                    } finally {
                        const saveBtn = document.getElementById('saveSettings');
                        saveBtn.disabled = false;
                        saveBtn.innerHTML = `
                            <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
                            </svg>
                            <span>Save Profile</span>
                        `;
                    }
                }
            });
        });
    }

    const resetBtn = document.getElementById('resetProfileBtn');
    if (resetBtn) {
        resetBtn.addEventListener('click', () => {
            document.getElementById('settingsFirstName').value = studentData.first_name || '';
            document.getElementById('settingsLastName').value = studentData.last_name || '';
            document.getElementById('settingsUsername').value = studentData.username || '';
            document.getElementById('settingsEmail').value = studentData.email || '';
            document.getElementById('settingsStudentNumber').value = studentData.student_number || '';
            document.getElementById('settingsProgram').value = studentData.program || '';
            document.getElementById('settingsYearLevel').value = studentData.year_level || '';
            document.getElementById('settingsPassword').value = '';
            document.getElementById('settingsOldPassword').value = '';

            selectedPhoto = null;
            const initials = getInitials(`${studentData.first_name || ''} ${studentData.last_name || ''}`.trim());
            if (profilePhotoPreview) {
                profilePhotoPreview.innerHTML = getPhotoPreview(studentData.profile_photo || '', initials);
            }
        });
    }

    const successModal = document.getElementById('successModal');
    const closeSuccessModal = document.getElementById('closeSuccessModal');
    if (closeSuccessModal && successModal) {
        closeSuccessModal.addEventListener('click', () => {
            successModal.classList.add('hidden');
            successModal.classList.remove('flex');
        });
    }

    const errorModal = document.getElementById('errorModal');
    const closeErrorModal = document.getElementById('closeErrorModal');
    if (closeErrorModal && errorModal) {
        closeErrorModal.addEventListener('click', () => {
            errorModal.classList.add('hidden');
            errorModal.classList.remove('flex');
        });
    }

    window.togglePassword = togglePassword;
}

function showSuccess() {
    const successModal = document.getElementById('successModal');
    if (successModal) {
        successModal.classList.remove('hidden');
        successModal.classList.add('flex');
    }
}

function showError(message) {
    const errorModal = document.getElementById('errorModal');
    const errorMessage = document.getElementById('errorMessage');
    if (errorModal && errorMessage) {
        errorMessage.textContent = message;
        errorModal.classList.remove('hidden');
        errorModal.classList.add('flex');
    }
}

function getInitials(name) {
    if (!name) return 'ST';
    const parts = name.trim().split(' ');
    if (parts.length === 1) {
        return parts[0][0].toUpperCase();
    }
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function getPhotoPreview(profilePhoto, initials) {
    return profilePhoto
        ? `<img id="profile-photo-img" src="${profilePhoto}" alt="Profile" class="w-full h-full object-cover rounded-full">`
        : `<div id="profile-initials-fallback" class="w-full h-full rounded-full bg-blue-900 text-blue-100 flex items-center justify-center text-2xl font-bold">${initials}</div>`;
}

function togglePassword(inputId) {
    const passwordInput = document.getElementById(inputId);
    const eyeIcon = document.getElementById(`${inputId}-eye-icon`);
    
    if (passwordInput && eyeIcon) {
        if (passwordInput.type === 'password') {
            passwordInput.type = 'text';
            eyeIcon.innerHTML = `
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
            `;
        } else {
            passwordInput.type = 'password';
            eyeIcon.innerHTML = `
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            `;
        }
    }
}

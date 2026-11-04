import { AdminNavbar, initAdminNavbar } from '../../components/Navbar/AdminNavbar.js';
import { getAdminData } from '../../api/admin/AdminLogin.js';
import { setUserData, isCrtAdmin } from '../../utils/jwt.js';
import { getAdminProfile, updateAdminProfile } from '../../api/admin/AdminProfile.js';
import { protectAdminRoute } from '../../middleware/AdminMiddleware.js';
import { openConfirmDialog } from '../../components/Dialog/ConfirmDialog.js';
import { showToast, updateToast } from '../../components/ToastMessage.js';
import { ProfileValidator } from '../../validator/ProfileValidator.js';
import { getDefaultProfileSVG } from '../../static/Profile/DefaultProfile.js';
import { logChange } from '../../api/AuditLogs/AuditLogs.js';
import { decodeToken, getToken } from '../../utils/jwt.js';
import { initProfileAnimations } from '../../provider/Animation/ProfileAnimation.js';

export function AdminProfile() {
    const adminData = getAdminData() || {};
    const name = adminData.name || '';
    const username = adminData.username || '';
    const email = adminData.email || '';
    const role = adminData.role || 'Administrator';
    const profilePhoto = adminData.profile_photo || '';
    const isCrtAdminUser = isCrtAdmin('admin') || adminData.is_crt_admin;

    const initials = getInitials(name);

    return `
        <div id="admin-profile-page" data-domino-page class="profile-page min-h-screen bg-surface font-sans text-ink pb-24 md:pb-10">
            ${AdminNavbar()}

            <main class="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-5 sm:py-8">
                <header class="reveal mb-5 sm:mb-7" data-domino-enter>
                    <span class="inline-flex items-center gap-2 rounded-full border border-line bg-white px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-blue-600">
                        <span class="h-1.5 w-1.5 rounded-full bg-yellow"></span>
                        Admin account
                    </span>
                    <div class="mt-3">
                        <h1 class="text-[1.65rem] sm:text-3xl font-semibold tracking-tight text-ink leading-tight">Manage Account &amp; Profile</h1>
                        <p class="mt-1.5 max-w-2xl text-sm text-body">Update your administrator credentials, personal details, and account security.</p>
                    </div>
                </header>

                <form id="edit-profile-form">
                    <input type="hidden" name="id" id="settingsId" value="${adminData.id || ''}">

                    <div class="grid grid-cols-1 lg:grid-cols-12 gap-5 lg:gap-6">
                        <aside class="lg:col-span-4">
                            <section class="profile-identity reveal rounded-2xl border border-line bg-white p-5 sm:p-6 flex flex-col items-center text-center" data-domino-enter>
                                <div class="profile-identity-heading w-full flex items-center gap-2 mb-4 pb-3 border-b border-line text-left">
                                    <i data-lucide="user-round" class="w-4 h-4 text-blue-600"></i>
                                    <h2 class="text-sm font-semibold text-ink uppercase tracking-wider">Profile Photo</h2>
                                </div>

                                <div id="profilePhotoPreview" class="profile-photo-ring w-28 h-28 rounded-full border-2 border-dashed border-line p-1 flex items-center justify-center overflow-hidden bg-surface">
                                    ${getPhotoPreview(profilePhoto, initials)}
                                </div>

                                <div class="mt-4 mb-1">
                                    <h3 class="text-base font-semibold text-ink" id="profileFullNameDisplay">${name}</h3>
                                    <span class="profile-role-badge inline-flex items-center gap-1.5 px-2.5 py-0.5 mt-1.5 rounded-full text-xs font-medium bg-blue-50 text-blue-600 border border-blue-200">
                                        <span class="w-1.5 h-1.5 rounded-full bg-blue-600"></span>
                                        ${role}
                                    </span>
                                </div>
                                <p class="profile-identity-meta mt-2 text-xs text-muted break-all">${email || username}</p>

                                <div class="profile-photo-actions w-full mt-4">
                                    <label for="profilePhoto" class="profile-upload-btn w-full cursor-pointer px-4 py-2.5 text-xs font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-xl transition flex items-center justify-center gap-2">
                                        <i data-lucide="camera" class="w-3.5 h-3.5"></i>
                                        <span>Upload Photo</span>
                                    </label>
                                    <input type="file" id="profilePhoto" name="profilePhoto" accept="image/png,image/jpeg,image/webp" class="hidden">

                                    <button type="button" id="removeProfilePhotoBtn" class="profile-remove-btn w-full mt-2 md:mt-2 px-4 py-2.5 text-xs font-medium text-red-600 bg-red-50 hover:bg-red-100 border border-red-200 rounded-xl transition flex items-center justify-center gap-2">
                                        <svg xmlns="http://www.w3.org/2000/svg" class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                        </svg>
                                        <span>Remove Photo</span>
                                    </button>
                                </div>
                                <p class="profile-identity-hint text-[11px] text-muted mt-2">JPG, PNG, or WEBP up to 2MB</p>
                            </section>
                        </aside>

                        <div class="lg:col-span-8 space-y-5">
                            <section class="profile-card reveal rounded-2xl border border-line bg-white p-5 sm:p-6" data-domino-enter>
                                <div class="flex items-center gap-2 mb-4 pb-3 border-b border-line">
                                    <i data-lucide="id-card" class="w-4 h-4 text-blue-600"></i>
                                    <h2 class="text-sm font-semibold text-ink uppercase tracking-wider">Personal Information</h2>
                                </div>

                                <div class="space-y-4">
                                    <div>
                                        <label for="settingsName" class="block text-[11px] font-semibold uppercase tracking-[0.12em] text-muted mb-1.5">
                                            Full Name <span class="text-red-500">*</span>
                                        </label>
                                        <input type="text" name="name" id="settingsName" value="${name}" required class="profile-input">
                                    </div>

                                    <div>
                                        <label for="settingsUsername" class="block text-[11px] font-semibold uppercase tracking-[0.12em] text-muted mb-1.5">
                                            Username <span class="text-red-500">*</span>
                                        </label>
                                        <input type="text" name="username" id="settingsUsername" value="${username}" ${isCrtAdminUser ? 'disabled' : ''} required class="profile-input ${isCrtAdminUser ? 'cursor-not-allowed' : ''}">
                                    </div>

                                    <div>
                                        <label for="settingsEmail" class="block text-[11px] font-semibold uppercase tracking-[0.12em] text-muted mb-1.5">
                                            Email <span class="text-red-500">*</span>
                                        </label>
                                        <input type="email" name="email" id="settingsEmail" value="${email}" ${isCrtAdminUser ? 'disabled' : ''} required class="profile-input ${isCrtAdminUser ? 'cursor-not-allowed' : ''}">
                                    </div>
                                </div>
                            </section>

                            <section class="profile-card reveal rounded-2xl border border-line bg-white p-5 sm:p-6" data-domino-enter>
                                <div class="flex items-center gap-2 mb-2 pb-3 border-b border-line">
                                    <i data-lucide="key-round" class="w-4 h-4 text-blue-600"></i>
                                    <h2 class="text-sm font-semibold text-ink uppercase tracking-wider">Change Password</h2>
                                </div>
                                ${isCrtAdminUser ? `
                                <div class="bg-yellow-50 border border-yellow-200 rounded-xl px-4 py-3 mb-4">
                                    <p class="text-xs text-yellow-800 flex items-start gap-2">
                                        <i data-lucide="triangle-alert" class="w-4 h-4 mt-0.5 shrink-0"></i>
                                        <span>Password change is disabled for this account.</span>
                                    </p>
                                </div>
                                ` : `
                                <p class="text-xs text-muted mb-4">Leave password fields blank if you do not wish to change your current password.</p>
                                `}

                                <div class="space-y-4">
                                    <div>
                                        <label for="settingsOldPassword" class="block text-[11px] font-semibold uppercase tracking-[0.12em] text-muted mb-1.5">Current Password</label>
                                        <div class="relative">
                                            <input type="password" name="old_password" id="settingsOldPassword" placeholder="Enter current password to verify" ${isCrtAdminUser ? 'disabled' : ''} class="profile-input pr-11 ${isCrtAdminUser ? 'cursor-not-allowed' : ''}">
                                            <button type="button" onclick="togglePassword('settingsOldPassword')" class="absolute right-2 top-0 bottom-0 flex items-center justify-center text-muted hover:text-ink focus:outline-none px-2" ${isCrtAdminUser ? 'disabled' : ''}>
                                                <svg id="settingsOldPassword-eye-icon" xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                                </svg>
                                            </button>
                                        </div>
                                    </div>

                                    <div>
                                        <label for="settingsPassword" class="block text-[11px] font-semibold uppercase tracking-[0.12em] text-muted mb-1.5">New Password</label>
                                        <div class="relative">
                                            <input type="password" name="password" id="settingsPassword" placeholder="Minimum 6 characters" ${isCrtAdminUser ? 'disabled' : ''} class="profile-input pr-11 ${isCrtAdminUser ? 'cursor-not-allowed' : ''}">
                                            <button type="button" onclick="togglePassword('settingsPassword')" class="absolute right-2 top-0 bottom-0 flex items-center justify-center text-muted hover:text-ink focus:outline-none px-2" ${isCrtAdminUser ? 'disabled' : ''}>
                                                <svg id="settingsPassword-eye-icon" xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                                </svg>
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </section>
                        </div>
                    </div>

                    <div class="profile-actions reveal mt-5 md:mt-6 rounded-2xl border border-line bg-white p-3.5 sm:p-4 flex justify-end" data-domino-enter>
                        <button type="submit" id="saveSettings" class="w-full sm:w-auto px-6 py-2.5 text-sm font-medium text-white bg-blue-600 hover:bg-blue-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-600/30 transition flex items-center justify-center gap-2">
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

export function initAdminProfile() {
    protectAdminRoute();
    initAdminNavbar();
    initProfileAnimations();
    if (typeof lucide !== 'undefined') lucide.createIcons();

    const adminToken = getToken('admin');
    const adminUser = decodeToken(adminToken) || {};

    let adminData = getAdminData() || {};
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

    const removeProfilePhotoBtn = document.getElementById('removeProfilePhotoBtn');
    if (removeProfilePhotoBtn) {
        removeProfilePhotoBtn.addEventListener('click', () => {
            openConfirmDialog({
                title: 'Remove Profile Photo',
                message: 'Are you sure you want to remove your profile photo? This action cannot be undone.',
                confirmText: 'Remove Photo',
                cancelText: 'Cancel',
                type: 'danger',
                onConfirm: async () => {
                    showToast('Removing profile photo...', 'loading');
                    try {
                        const removeBtn = document.getElementById('removeProfilePhotoBtn');
                        removeBtn.disabled = true;
                        removeBtn.innerHTML = `
                            <svg class="animate-spin h-3.5 w-3.5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            <span>Removing...</span>
                        `;

                        const profileData = {
                            profile_photo: '',
                            name: adminData.name || '',
                            username: adminData.username || '',
                            email: adminData.email || '',
                            role: adminData.role || 'Administrator'
                        };

                        const result = await updateAdminProfile(profileData);
                        if (result.admin) {
                            setUserData(result.admin, 'admin');
                            adminData = result.admin;
                        }

                        try {
                            await logChange({
                                user_id: adminUser.user_id,
                                user_type: 'admin',
                                action: 'UPDATE',
                                table_name: 'admins',
                                record_id: adminData.id,
                                field_name: 'profile_photo',
                                old_value: adminData.profile_photo ? 'Base64 image data' : 'None',
                                new_value: 'Removed'
                            });
                        } catch (logError) {
                            console.error('Failed to log change:', logError);
                        }

                        const initials = getInitials(adminData.name || '');
                        if (profilePhotoPreview) {
                            profilePhotoPreview.innerHTML = getPhotoPreview('', initials);
                        }
                        selectedPhoto = null;

                        const navProfilePhotoMobile = document.getElementById('navProfilePhotoMobile');
                        const navProfilePlaceholderMobile = document.getElementById('navProfilePlaceholderMobile');
                        if (navProfilePhotoMobile && navProfilePlaceholderMobile) {
                            navProfilePhotoMobile.classList.add('hidden');
                            navProfilePlaceholderMobile.classList.remove('hidden');
                        }

                        updateToast('Profile photo removed successfully!', 'success');
                    } catch (error) {
                        updateToast(error.message || 'Failed to remove profile photo. Please try again.', 'error');
                    } finally {
                        const removeBtn = document.getElementById('removeProfilePhotoBtn');
                        removeBtn.disabled = false;
                        removeBtn.innerHTML = `
                            <svg xmlns="http://www.w3.org/2000/svg" class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                            <span>Remove Profile Photo</span>
                        `;
                    }
                }
            });
        });
    }

    const form = document.getElementById('edit-profile-form');
    if (form) {
        form.addEventListener('submit', async (e) => {
            e.preventDefault();

            const name = document.getElementById('settingsName').value;
            const username = document.getElementById('settingsUsername').value;
            const email = document.getElementById('settingsEmail').value;
            const password = document.getElementById('settingsPassword').value;
            const oldPassword = document.getElementById('settingsOldPassword').value;

            const profileData = {
                name,
                username,
                email,
                profile_photo: selectedPhoto || adminData.profile_photo || '',
                role: adminData.role || 'Administrator'
            };

            if (password) {
                profileData.password = password;
                profileData.old_password = oldPassword;
            }

            const validation = ProfileValidator.validate(profileData, [adminData], 'admin', adminData.id);
            if (!validation.isValid) {
                showToast(validation.message, 'error');
                return;
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

                        const changes = [];
                        if (name !== adminData.name) {
                            changes.push({
                                field_name: 'name',
                                old_value: adminData.name,
                                new_value: name
                            });
                        }
                        if (username !== adminData.username) {
                            changes.push({
                                field_name: 'username',
                                old_value: adminData.username,
                                new_value: username
                            });
                        }
                        if (email !== adminData.email) {
                            changes.push({
                                field_name: 'email',
                                old_value: adminData.email,
                                new_value: email
                            });
                        }
                        if (selectedPhoto && selectedPhoto !== adminData.profile_photo) {
                            changes.push({
                                field_name: 'profile_photo',
                                old_value: adminData.profile_photo ? 'Base64 image data' : 'None',
                                new_value: 'Base64 image data'
                            });
                        }
                        if (password) {
                            changes.push({
                                field_name: 'password',
                                old_value: '******',
                                new_value: 'Updated'
                            });
                        }

                        const result = await updateAdminProfile(profileData);
                        if (result.admin) {
                            setUserData(result.admin, 'admin');
                        }

                        if (changes.length > 0) {
                            for (const change of changes) {
                                try {
                                    await logChange({
                                        user_id: adminUser.user_id,
                                        user_type: 'admin',
                                        action: 'UPDATE',
                                        table_name: 'admins',
                                        record_id: adminData.id,
                                        field_name: change.field_name,
                                        old_value: change.old_value,
                                        new_value: change.new_value
                                    });
                                } catch (logError) {
                                    console.error('Failed to log change:', logError);
                                }
                            }
                        }

                        const navUsername = document.getElementById('navUsername');
                        if (navUsername) {
                            navUsername.textContent = `Welcome, ${name}`;
                        }

                        const profileFullNameDisplay = document.getElementById('profileFullNameDisplay');
                        if (profileFullNameDisplay) {
                            profileFullNameDisplay.textContent = name;
                        }

                        if (result.admin && result.admin.profile_photo) {
                            const initials = getInitials(name);
                            if (profilePhotoPreview) {
                                profilePhotoPreview.innerHTML = getPhotoPreview(result.admin.profile_photo, initials);
                            }
                            selectedPhoto = null;

                            const navProfilePhotoMobile = document.getElementById('navProfilePhotoMobile');
                            const navProfilePlaceholderMobile = document.getElementById('navProfilePlaceholderMobile');
                            if (navProfilePhotoMobile && navProfilePlaceholderMobile && result.admin.profile_photo) {
                                const cacheBuster = Date.now();
                                const photoUrl = result.admin.profile_photo.startsWith('data:') 
                                    ? result.admin.profile_photo 
                                    : `${result.admin.profile_photo}?_t=${cacheBuster}`;
                                navProfilePhotoMobile.src = photoUrl;
                                navProfilePhotoMobile.classList.remove('hidden');
                                navProfilePlaceholderMobile.classList.add('hidden');
                            }
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

    const isCrtAdminUser = isCrtAdmin('admin') || adminData.is_crt_admin;
    if (isCrtAdminUser) {
        const usernameInput = document.getElementById('settingsUsername');
        const emailInput = document.getElementById('settingsEmail');
        const oldPasswordInput = document.getElementById('settingsOldPassword');
        const newPasswordInput = document.getElementById('settingsPassword');

        if (usernameInput) {
            usernameInput.disabled = true;
            usernameInput.classList.add('bg-gray-100', 'cursor-not-allowed');
        }
        if (emailInput) {
            emailInput.disabled = true;
            emailInput.classList.add('bg-gray-100', 'cursor-not-allowed');
        }
        if (oldPasswordInput) {
            oldPasswordInput.disabled = true;
            oldPasswordInput.classList.add('bg-gray-100', 'cursor-not-allowed');
        }
        if (newPasswordInput) {
            newPasswordInput.disabled = true;
            newPasswordInput.classList.add('bg-gray-100', 'cursor-not-allowed');
        }
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
    if (!name) return 'AD';
    const parts = name.trim().split(' ');
    if (parts.length === 1) {
        return parts[0][0].toUpperCase();
    }
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function getPhotoPreview(profilePhoto, initials) {
    if (profilePhoto) {
        const isValidPhoto = profilePhoto && 
                           profilePhoto.length > 0 &&
                           (profilePhoto.startsWith('data:image/') || 
                            profilePhoto.startsWith('http'));
        
        if (!isValidPhoto) {
            return `<div class="w-full h-full rounded-full overflow-hidden">${getDefaultProfileSVG('100%', '100%')}</div>`;
        }
        
        const cacheBuster = Date.now();
        const separator = profilePhoto.includes('?') ? '&' : '?';
        const photoUrl = profilePhoto.startsWith('data:') ? profilePhoto : `${profilePhoto}${separator}_t=${cacheBuster}`;
        return `<img id="profile-photo-img" src="${photoUrl}" alt="Profile" class="w-full h-full object-cover rounded-full" crossorigin="anonymous" onerror="handleProfileImageError(this)">`;
    }
    return `<div class="w-full h-full rounded-full overflow-hidden">${getDefaultProfileSVG('100%', '100%')}</div>`;
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

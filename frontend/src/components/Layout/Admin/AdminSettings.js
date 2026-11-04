import { AdminNavbar, initAdminNavbar } from '../../../components/Navbar/AdminNavbar.js';
import { getAdminData } from '../../../api/admin/AdminLogin.js';
import { setUserData, isCrtAdmin, getToken, decodeToken } from '../../../utils/jwt.js';
import { updateAdminProfile } from '../../../api/admin/AdminProfile.js';
import { protectAdminRoute } from '../../../middleware/AdminMiddleware.js';
import { openConfirmDialog } from '../../../components/Dialog/ConfirmDialog.js';
import { showToast, updateToast } from '../../../components/ToastMessage.js';
import { ProfileValidator } from '../../../validator/ProfileValidator.js';
import { getDefaultProfileSVG } from '../../../static/Profile/DefaultProfile.js';
import { logChange } from '../../../api/AuditLogs/AuditLogs.js';
import { getAllAuditLogs, deleteAuditLog, cleanupOldAuditLogs } from '../../../api/AuditLogs/AuditLogs.js';
import { createBan, getAllBans, deactivateBan, deleteBan, activateBan } from '../../../api/web/Banned.js';
import { getAllAnalytics, getAnalyticsStats, deleteAnalytics } from '../../../api/web/WebAnalytics.js';
import { openManageBannedModal } from '../../../components/Modal/ManageBannedModal.js';
import { CrudMenu } from '../../../components/CrudMenu.js';
import { skeletonTableRows } from '../../../components/SkeletonLoading.js';
import { initAdminSettingsAnimations, animateDominoList } from '../../../provider/Animation/AdminSettingsAnimation.js';

const TABS = ['profile', 'auditLogs', 'bans', 'analytics'];
const TAB_ACTIVE_CLASSES = ['bg-blue-600', 'text-white', 'shadow-sm'];
const TAB_IDLE_CLASSES = ['text-muted', 'hover:text-ink', 'hover:bg-surface'];

function escapeHtml(str) {
    if (!str) return '';
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

function refreshIcons() {
    if (typeof lucide !== 'undefined') lucide.createIcons();
}

function isMobileView() {
    return window.matchMedia('(max-width: 767px)').matches;
}

function tonePill(label, tone = 'blue') {
    const tones = {
        blue: 'bg-blue-50 text-blue-600 border-blue-100',
        green: 'bg-emerald-50 text-emerald-700 border-emerald-200',
        red: 'bg-red-50 text-red-700 border-red-200',
        yellow: 'bg-yellow-50 text-yellow-700 border-yellow-200',
        orange: 'bg-orange-50 text-orange-700 border-orange-200',
        gray: 'bg-slate-50 text-slate-600 border-slate-200',
        purple: 'bg-purple-50 text-purple-700 border-purple-200',
    };
    return `<span class="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium border ${tones[tone] || tones.blue}">${escapeHtml(label)}</span>`;
}

function emptyState(icon, title, subtitle) {
    return `
        <div class="py-10 px-4 text-center">
            <span class="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-surface text-muted mb-3">
                <i data-lucide="${icon}" class="w-6 h-6"></i>
            </span>
            <p class="text-sm text-ink font-medium">${title}</p>
            <p class="text-xs text-muted mt-1">${subtitle}</p>
        </div>
    `;
}

function skeletonCards(count = 4) {
    return Array.from({ length: count }, () => `
        <div class="settings-mobile-card rounded-2xl border border-line bg-white/90 p-4">
            <div class="flex items-center gap-3">
                <div class="w-11 h-11 rounded-2xl skeleton-shimmer shrink-0"></div>
                <div class="flex-1 space-y-2 min-w-0">
                    <div class="h-4 w-32 skeleton-shimmer rounded"></div>
                    <div class="h-3 w-44 skeleton-shimmer rounded"></div>
                </div>
            </div>
            <div class="mt-4 grid grid-cols-2 gap-2">
                <div class="h-12 skeleton-shimmer rounded-xl"></div>
                <div class="h-12 skeleton-shimmer rounded-xl"></div>
            </div>
        </div>
    `).join('');
}

function metaTile(label, value) {
    return `
        <div class="rounded-xl bg-surface border border-line px-3 py-2.5 min-w-0">
            <div class="text-[10px] uppercase tracking-[0.12em] text-muted">${label}</div>
            <div class="text-xs font-semibold text-ink mt-0.5 truncate">${value}</div>
        </div>
    `;
}

function desktopTable({ bodyId, headers, colSpan }) {
    return `
        <div class="hidden md:block">
            <div class="bg-white border border-line rounded-2xl shadow-sm overflow-hidden">
                <div class="overflow-x-auto">
                <table class="w-full text-sm text-left">
                    <thead>
                        <tr class="bg-surface border-b border-line text-[11px] font-semibold text-muted uppercase tracking-[0.14em]">
                            ${headers}
                        </tr>
                    </thead>
                    <tbody id="${bodyId}" class="divide-y divide-line">
                        ${skeletonTableRows(4, colSpan, true)}
                    </tbody>
                </table>
                </div>
            </div>
        </div>
    `;
}

function tabButton({ id, tab, icon, label, countId, active = false }) {
    const state = active
        ? 'bg-blue-600 text-white shadow-sm'
        : 'text-muted hover:text-ink hover:bg-surface';
    return `
        <button
            type="button"
            id="${id}"
            onclick="switchTab('${tab}')"
            class="settings-tab flex flex-col md:flex-row items-center justify-center gap-1 md:gap-2 rounded-2xl md:rounded-xl px-1.5 py-3 md:px-4 md:py-2.5 text-[10px] md:text-sm font-semibold transition-colors ${state}">
            <span class="relative">
                <i data-lucide="${icon}" class="w-4 h-4"></i>
                ${countId ? `<span id="${countId}" class="md:hidden absolute -top-2 -right-2 min-w-[16px] h-4 px-1 rounded-full bg-yellow text-[9px] font-bold text-blue-600 leading-4 text-center opacity-0">0</span>` : ''}
            </span>
            <span>${label}</span>
            ${countId ? `<span id="${countId}Desktop" class="hidden md:inline-flex min-w-[1.25rem] h-5 px-1.5 items-center justify-center rounded-full bg-yellow text-[11px] font-bold text-blue-600 opacity-0">0</span>` : ''}
        </button>
    `;
}

function setTabCount(baseId, count) {
    const mobile = document.getElementById(baseId);
    const desktop = document.getElementById(`${baseId}Desktop`);
    const value = String(count ?? 0);
    const empty = !count;
    if (mobile) {
        mobile.textContent = value;
        mobile.classList.toggle('opacity-0', empty);
    }
    if (desktop) {
        desktop.textContent = value;
        desktop.classList.toggle('opacity-0', empty);
    }
}

function setTabStyles(tab) {
    TABS.forEach((id) => {
        const button = document.getElementById(`${id}Tab`);
        const section = document.getElementById(`${id}Section`);
        const active = id === tab;
        if (button) {
            TAB_ACTIVE_CLASSES.forEach((cls) => button.classList.toggle(cls, active));
            TAB_IDLE_CLASSES.forEach((cls) => button.classList.toggle(cls, !active));
        }
        if (section) section.classList.toggle('hidden', !active);
    });

    const fab = document.getElementById('settingsMobileAddBtn');
    if (fab) fab.classList.toggle('invisible', tab !== 'bans');
}

function finishRender(sectionId, animate) {
    refreshIcons();
    if (animate) {
        const section = document.getElementById(sectionId);
        if (section) animateDominoList(section);
    }
}

function getInitials(name) {
    if (!name) return 'A';
    return name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2);
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
        
        const photoUrl = profilePhoto.startsWith('data:') 
            ? profilePhoto 
            : `${profilePhoto}${profilePhoto.includes('?') ? '&' : '?'}_t=${Date.now()}`;

        return `<img id="profile-photo-img" src="${photoUrl}" alt="Profile" class="w-full h-full object-cover rounded-full" crossorigin="anonymous" onerror="handleProfileImageError(this)">`;
    }
    return `<div class="w-full h-full rounded-full overflow-hidden">${getDefaultProfileSVG('100%', '100%')}</div>`;
}

export function AdminSettings() {
    const adminData = getAdminData() || {};
    const name = adminData.name || '';
    const username = adminData.username || '';
    const email = adminData.email || '';
    const role = adminData.role || 'Administrator';
    const profilePhoto = adminData.profile_photo || '';
    const isCrtAdminUser = isCrtAdmin('admin') || adminData.is_crt_admin;
    const initials = getInitials(name);

    return `
        <div id="admin-settings-page" data-domino-page class="profile-page min-h-screen bg-surface font-sans text-ink pb-28 md:pb-8">
            ${AdminNavbar()}
            <main class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5 sm:py-8">
                <header class="reveal mb-5 sm:mb-7" data-domino-enter>
                    <span class="inline-flex items-center gap-2 rounded-full border border-line bg-white px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-blue-600">
                        <span class="h-1.5 w-1.5 rounded-full bg-yellow"></span>
                        Control center
                    </span>
                    <div class="mt-3 min-w-0">
                        <h1 class="text-[1.65rem] sm:text-3xl font-semibold tracking-tight text-ink leading-tight">Admin Settings</h1>
                        <p class="mt-1.5 max-w-2xl text-sm text-body">Manage your profile, review audit activity, control bans, and inspect visitor analytics.</p>
                    </div>
                </header>

                <div class="reveal mb-5 sm:mb-6" data-domino-enter>
                    <nav class="settings-tab-bar grid grid-cols-4 gap-1 p-1 rounded-2xl border border-line bg-white/90 md:flex md:items-center md:gap-1 md:w-fit" aria-label="Settings views">
                        ${tabButton({ id: 'profileTab', tab: 'profile', icon: 'user-round', label: 'Profile', active: true })}
                        ${tabButton({ id: 'auditLogsTab', tab: 'auditLogs', icon: 'file-text', label: 'Audit', countId: 'auditLogsCount' })}
                        ${tabButton({ id: 'bansTab', tab: 'bans', icon: 'shield-off', label: 'Bans', countId: 'bansCount' })}
                        ${tabButton({ id: 'analyticsTab', tab: 'analytics', icon: 'bar-chart-2', label: 'Analytics', countId: 'analyticsCount' })}
                    </nav>
                </div>

                <section id="profileSection">
                    <form id="edit-profile-form">
                        <input type="hidden" name="id" id="settingsId" value="${adminData.id || ''}">

                        <div class="grid grid-cols-1 lg:grid-cols-12 gap-5 lg:gap-6">
                            <aside class="lg:col-span-4">
                                <section class="profile-identity settings-identity reveal rounded-2xl border border-line bg-white p-5 sm:p-6 flex flex-col items-center text-center" data-domino-enter>
                                    <div class="profile-identity-heading w-full flex items-center gap-2 mb-4 pb-3 border-b border-line text-left">
                                        <i data-lucide="user-round" class="w-4 h-4 text-blue-600"></i>
                                        <h2 class="text-sm font-semibold text-ink uppercase tracking-wider">Profile Photo</h2>
                                    </div>

                                    <div id="profilePhotoPreview" class="profile-photo-ring w-28 h-28 rounded-full border-2 border-dashed border-line p-1 flex items-center justify-center overflow-hidden bg-surface">
                                        ${getPhotoPreview(profilePhoto, initials)}
                                    </div>

                                    <div class="mt-4 mb-1">
                                        <h3 class="text-base font-semibold text-ink" id="profileFullNameDisplay">${escapeHtml(name)}</h3>
                                        <span class="profile-role-badge inline-flex items-center gap-1.5 px-2.5 py-0.5 mt-1.5 rounded-full text-xs font-medium bg-blue-50 text-blue-600 border border-blue-200">
                                            <span class="w-1.5 h-1.5 rounded-full bg-blue-600"></span>
                                            ${escapeHtml(role)}
                                        </span>
                                    </div>
                                    <p class="profile-identity-meta mt-2 text-xs text-muted break-all">${escapeHtml(email || username)}</p>

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
                                            <label for="settingsName" class="block text-[11px] font-semibold uppercase tracking-[0.12em] text-muted mb-1.5">Full Name <span class="text-red-500">*</span></label>
                                            <input type="text" name="name" id="settingsName" value="${escapeHtml(name)}" required class="profile-input">
                                        </div>
                                        <div>
                                            <label for="settingsUsername" class="block text-[11px] font-semibold uppercase tracking-[0.12em] text-muted mb-1.5">Username <span class="text-red-500">*</span></label>
                                            <input type="text" name="username" id="settingsUsername" value="${escapeHtml(username)}" ${isCrtAdminUser ? 'disabled' : ''} required class="profile-input ${isCrtAdminUser ? 'cursor-not-allowed' : ''}">
                                        </div>
                                        <div>
                                            <label for="settingsEmail" class="block text-[11px] font-semibold uppercase tracking-[0.12em] text-muted mb-1.5">Email <span class="text-red-500">*</span></label>
                                            <input type="email" name="email" id="settingsEmail" value="${escapeHtml(email)}" ${isCrtAdminUser ? 'disabled' : ''} required class="profile-input ${isCrtAdminUser ? 'cursor-not-allowed' : ''}">
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
                </section>

                <section id="auditLogsSection" class="hidden">
                    <div class="reveal mb-4 md:mb-5" data-domino-enter>
                        <div class="flex items-center gap-2.5">
                            <p class="hidden md:block flex-1 text-sm text-body">Track every create, update, and delete across the system.</p>
                            <button id="refreshLogsBtn" type="button" class="inline-flex items-center justify-center gap-2 h-11 md:h-auto px-3 md:px-4 py-2.5 text-sm font-medium text-white bg-blue-600 hover:bg-blue-800 rounded-xl transition">
                                <i data-lucide="refresh-cw" class="w-4 h-4"></i>
                                <span class="hidden md:inline">Refresh</span>
                            </button>
                            <button id="cleanupLogsBtn" type="button" class="inline-flex items-center justify-center gap-2 h-11 md:h-auto px-3 md:px-4 py-2.5 text-sm font-medium text-red-600 bg-red-50 hover:bg-red-100 border border-red-200 rounded-xl transition">
                                <i data-lucide="trash-2" class="w-4 h-4"></i>
                                <span class="hidden md:inline">Cleanup Old Logs</span>
                            </button>
                        </div>
                    </div>

                    <div class="reveal mb-4 rounded-2xl border border-line bg-white p-3.5 sm:p-4" data-domino-enter>
                        <div class="grid grid-cols-2 lg:grid-cols-4 gap-3">
                            <div>
                                <label for="filterUserType" class="block text-[11px] font-semibold uppercase tracking-[0.12em] text-muted mb-1.5">User Type</label>
                                <select id="filterUserType" class="profile-input">
                                    <option value="">All</option>
                                    <option value="admin">Admin</option>
                                    <option value="adviser">Adviser</option>
                                    <option value="student">Student</option>
                                </select>
                            </div>
                            <div>
                                <label for="filterAction" class="block text-[11px] font-semibold uppercase tracking-[0.12em] text-muted mb-1.5">Action</label>
                                <select id="filterAction" class="profile-input">
                                    <option value="">All</option>
                                    <option value="CREATE">Create</option>
                                    <option value="UPDATE">Update</option>
                                    <option value="DELETE">Delete</option>
                                </select>
                            </div>
                            <div>
                                <label for="filterTable" class="block text-[11px] font-semibold uppercase tracking-[0.12em] text-muted mb-1.5">Table</label>
                                <input type="text" id="filterTable" placeholder="e.g., admins" class="profile-input">
                            </div>
                            <div>
                                <label for="filterDate" class="block text-[11px] font-semibold uppercase tracking-[0.12em] text-muted mb-1.5">Date</label>
                                <input type="date" id="filterDate" class="profile-input">
                            </div>
                        </div>
                    </div>

                    ${desktopTable({
                        bodyId: 'auditLogsTableBody',
                        colSpan: 9,
                        headers: `
                            <th class="px-4 py-3.5">Date/Time</th>
                            <th class="px-4 py-3.5">User</th>
                            <th class="px-4 py-3.5">Action</th>
                            <th class="px-4 py-3.5">Table</th>
                            <th class="px-4 py-3.5">Field</th>
                            <th class="px-4 py-3.5">Changes</th>
                            <th class="px-4 py-3.5">Device</th>
                            <th class="px-4 py-3.5">IP Address</th>
                            <th class="px-4 py-3.5 text-center w-24">Actions</th>
                        `
                    })}
                    <div id="auditLogsMobileList" class="md:hidden space-y-3">${skeletonCards()}</div>

                    <div class="mt-4 rounded-2xl border border-line bg-white px-4 py-3 flex items-center justify-between gap-3">
                        <div class="text-sm text-body">Showing <span id="logsCount" class="font-semibold text-ink">0</span> logs</div>
                        <div class="flex gap-2">
                            <button id="prevPage" class="px-3 py-1.5 text-sm font-medium text-ink bg-white border border-line rounded-xl hover:bg-surface disabled:opacity-50 disabled:cursor-not-allowed" disabled>Prev</button>
                            <button id="nextPage" class="px-3 py-1.5 text-sm font-medium text-ink bg-white border border-line rounded-xl hover:bg-surface disabled:opacity-50 disabled:cursor-not-allowed" disabled>Next</button>
                        </div>
                    </div>
                </section>

                <section id="bansSection" class="hidden">
                    <div class="reveal mb-4 md:mb-5" data-domino-enter>
                        <div class="flex items-center gap-2.5">
                            <div class="relative flex-1 md:flex-none">
                                <i data-lucide="search" class="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted"></i>
                                <input type="search" id="bannedSearch" placeholder="Search bans..." class="w-full md:w-80 pl-9 pr-3 py-2.5 text-sm border border-line rounded-xl bg-white text-ink placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-blue-600/15 focus:border-blue-600">
                            </div>
                            <button type="button" id="addBanBtn" class="hidden md:inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-white bg-blue-600 hover:bg-blue-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-600/30 transition shadow-sm">
                                <i data-lucide="plus" class="w-4 h-4"></i>
                                <span>Add New</span>
                            </button>
                        </div>
                    </div>

                    ${desktopTable({
                        bodyId: 'bannedTableBody',
                        colSpan: 10,
                        headers: `
                            <th class="px-5 py-3.5 w-12 text-center">#</th>
                            <th class="px-5 py-3.5">Type</th>
                            <th class="px-5 py-3.5">Target</th>
                            <th class="px-5 py-3.5">IP Address</th>
                            <th class="px-5 py-3.5">Reason</th>
                            <th class="px-5 py-3.5">Status</th>
                            <th class="px-5 py-3.5">Duration</th>
                            <th class="px-5 py-3.5">Expires</th>
                            <th class="px-5 py-3.5">Created</th>
                            <th class="px-5 py-3.5 text-center w-28">Actions</th>
                        `
                    })}
                    <div id="bannedMobileList" class="md:hidden space-y-3">${skeletonCards()}</div>
                </section>

                <section id="analyticsSection" class="hidden">
                    <div class="reveal mb-4 md:mb-5" data-domino-enter>
                        <div class="relative">
                            <i data-lucide="search" class="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted"></i>
                            <input type="search" id="analyticsSearch" placeholder="Search analytics..." class="w-full md:w-80 pl-9 pr-3 py-2.5 text-sm border border-line rounded-xl bg-white text-ink placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-blue-600/15 focus:border-blue-600">
                        </div>
                    </div>

                    <section class="reveal mb-5 sm:mb-6 grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3" data-domino-enter>
                        <div class="settings-stat-chip rounded-2xl border border-line bg-white p-3 sm:p-4">
                            <div class="flex items-center justify-between gap-2">
                                <p class="text-[10px] sm:text-[11px] uppercase tracking-[0.12em] text-muted">Total Visits</p>
                                <i data-lucide="eye" class="w-4 h-4 text-blue-600 hidden sm:block"></i>
                            </div>
                            <p id="totalVisits" class="mt-1 text-lg sm:text-2xl font-semibold text-ink">—</p>
                        </div>
                        <div class="settings-stat-chip rounded-2xl border border-line bg-white p-3 sm:p-4">
                            <div class="flex items-center justify-between gap-2">
                                <p class="text-[10px] sm:text-[11px] uppercase tracking-[0.12em] text-muted">Unique Visitors</p>
                                <i data-lucide="users" class="w-4 h-4 text-emerald-600 hidden sm:block"></i>
                            </div>
                            <p id="uniqueVisitors" class="mt-1 text-lg sm:text-2xl font-semibold text-ink">—</p>
                        </div>
                        <div class="settings-stat-chip rounded-2xl border border-line bg-white p-3 sm:p-4">
                            <div class="flex items-center justify-between gap-2">
                                <p class="text-[10px] sm:text-[11px] uppercase tracking-[0.12em] text-muted">Unique Routes</p>
                                <i data-lucide="route" class="w-4 h-4 text-purple-600 hidden sm:block"></i>
                            </div>
                            <p id="uniqueRoutes" class="mt-1 text-lg sm:text-2xl font-semibold text-ink">—</p>
                        </div>
                        <div class="settings-stat-chip rounded-2xl border border-line bg-white p-3 sm:p-4">
                            <div class="flex items-center justify-between gap-2">
                                <p class="text-[10px] sm:text-[11px] uppercase tracking-[0.12em] text-muted">Authenticated</p>
                                <i data-lucide="shield-check" class="w-4 h-4 text-orange-600 hidden sm:block"></i>
                            </div>
                            <p id="authenticatedVisits" class="mt-1 text-lg sm:text-2xl font-semibold text-ink">—</p>
                        </div>
                    </section>

                    ${desktopTable({
                        bodyId: 'analyticsTableBody',
                        colSpan: 10,
                        headers: `
                            <th class="px-5 py-3.5 w-12 text-center">#</th>
                            <th class="px-5 py-3.5">Route</th>
                            <th class="px-5 py-3.5">IP Address</th>
                            <th class="px-5 py-3.5">Device</th>
                            <th class="px-5 py-3.5">Location</th>
                            <th class="px-5 py-3.5">User</th>
                            <th class="px-5 py-3.5">Active</th>
                            <th class="px-5 py-3.5">URL</th>
                            <th class="px-5 py-3.5">Visited At</th>
                            <th class="px-5 py-3.5 text-center w-28">Actions</th>
                        `
                    })}
                    <div id="analyticsMobileList" class="md:hidden space-y-3">${skeletonCards()}</div>
                </section>
            </main>

            <button
                type="button"
                id="settingsMobileAddBtn"
                class="invisible md:hidden fixed z-30 right-4 bottom-[max(1.25rem,env(safe-area-inset-bottom))] h-14 w-14 rounded-full bg-blue-600 text-white shadow-lift-lg flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-yellow"
                aria-label="Add ban">
                <i data-lucide="plus" class="w-6 h-6"></i>
            </button>
        </div>
    `;
}

window.togglePassword = function(inputId) {
    const input = document.getElementById(inputId);
    const icon = document.getElementById(inputId + '-eye-icon');
    if (input && icon) {
        if (input.type === 'password') {
            input.type = 'text';
            icon.innerHTML = '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />';
        } else {
            input.type = 'password';
            icon.innerHTML = '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />';
        }
    }
};

export async function initAdminSettings() {
    protectAdminRoute();
    await initAdminNavbar();
    initAdminSettingsAnimations();
    refreshIcons();

    const adminToken = getToken('admin');
    const adminUser = decodeToken(adminToken) || {};
    let adminData = getAdminData() || {};
    let selectedPhoto = null;

    const currentPath = window.location.pathname;
    const urlParams = new URLSearchParams(window.location.search);
    const highlightLogId = urlParams.get('highlight');

    let initialTab = 'profile';
    if (currentPath === '/admin/audit-logs') initialTab = 'auditLogs';
    else if (currentPath === '/admin/banned') initialTab = 'bans';
    else if (currentPath === '/admin/analytics') initialTab = 'analytics';

    let hasLoadedAuditLogs = false;
    let hasLoadedBans = false;
    let hasLoadedAnalytics = false;

    window.switchTab = function(tab) {
        setTabStyles(tab);
        refreshIcons();

        if (tab === 'auditLogs' && !hasLoadedAuditLogs) loadAuditLogs();
        if (tab === 'bans' && !hasLoadedBans) loadBans();
        if (tab === 'analytics' && !hasLoadedAnalytics) loadAnalytics();

        const section = document.getElementById(`${tab}Section`);
        if (section) animateDominoList(section);
    };

    document.getElementById('settingsMobileAddBtn')?.addEventListener('click', () => {
        document.getElementById('addBanBtn')?.click();
    });

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
                        const initials = getInitials(adminData.name || '');
                        if (profilePhotoPreview) {
                            profilePhotoPreview.innerHTML = getPhotoPreview('', initials);
                        }
                        selectedPhoto = null;
                        updateToast('Profile photo removed successfully!', 'success');
                    } catch (error) {
                        updateToast(error.message || 'Failed to remove profile photo. Please try again.', 'error');
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
                        const changes = [];
                        if (name !== adminData.name) changes.push({ field_name: 'name', old_value: adminData.name, new_value: name });
                        if (username !== adminData.username) changes.push({ field_name: 'username', old_value: adminData.username, new_value: username });
                        if (email !== adminData.email) changes.push({ field_name: 'email', old_value: adminData.email, new_value: email });
                        if (selectedPhoto && selectedPhoto !== adminData.profile_photo) changes.push({ field_name: 'profile_photo', old_value: adminData.profile_photo ? 'Base64 image data' : 'None', new_value: 'Base64 image data' });
                        if (password) changes.push({ field_name: 'password', old_value: '******', new_value: 'Updated' });

                        const result = await updateAdminProfile(profileData);
                        if (result.admin) {
                            setUserData(result.admin, 'admin');
                        }

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

                        const navUsername = document.getElementById('navUsername');
                        if (navUsername) navUsername.textContent = `Welcome, ${name}`;

                        const profileFullNameDisplay = document.getElementById('profileFullNameDisplay');
                        if (profileFullNameDisplay) profileFullNameDisplay.textContent = name;

                        updateToast('Profile updated successfully!', 'success');
                    } catch (error) {
                        updateToast(error.message || 'Failed to update profile. Please try again.', 'error');
                    }
                }
            });
        });
    }


    let currentPage = 0;
    const pageSize = 20;
    let allLogs = [];

    async function loadAuditLogs(filters = {}) {
        try {
            const response = await getAllAuditLogs({ ...filters, limit: pageSize, offset: currentPage * pageSize });
            if (response && response.success) {
                allLogs = response.data || [];
                renderLogs(allLogs);
                document.getElementById('logsCount').textContent = response.total || 0;
                setTabCount('auditLogsCount', response.total || 0);
                document.getElementById('prevPage').disabled = currentPage === 0;
                document.getElementById('nextPage').disabled = (currentPage + 1) * pageSize >= (response.total || 0);
                hasLoadedAuditLogs = true;
                if (highlightLogId) highlightLog(highlightLogId);
            }
        } catch (error) {
            console.error('Failed to load audit logs:', error);
            const tbody = document.getElementById('auditLogsTableBody');
            const mobile = document.getElementById('auditLogsMobileList');
            if (isMobileView()) {
                if (tbody) tbody.innerHTML = '';
                if (mobile) mobile.innerHTML = emptyState('circle-alert', 'Failed to load audit logs.', 'Please try again.');
            } else if (tbody) {
                tbody.innerHTML = `<tr data-domino-enter class="reveal"><td colspan="9">${emptyState('circle-alert', 'Failed to load audit logs.', 'Please try again.')}</td></tr>`;
            }
            finishRender('auditLogsSection', true);
        }
    }

    function highlightLog(logId) {
        const target = document.querySelector(`[data-log-id="${logId}"]`);
        if (target) {
            target.classList.add('ring-2', 'ring-blue-600', 'bg-blue-50');
            target.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
    }

    function formatDate(dateString) {
        const date = new Date(dateString);
        return date.toLocaleString('en-US', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
    }

    function getActionTone(action) {
        switch (action) {
            case 'CREATE': return 'green';
            case 'UPDATE': return 'blue';
            case 'DELETE': return 'red';
            default: return 'gray';
        }
    }

    function getReadableTableName(tableName) {
        const tableMap = { organizations: 'Organizations', events: 'Events', event_organizations: 'Event Registrations', advisers: 'Advisers', students: 'Students', admins: 'Admins', roles: 'Roles', organization_memberships: 'Organization Memberships', tasks: 'Tasks', member_tasks: 'Tasks', attendance: 'Attendance', attendances: 'Attendance' };
        return tableMap[tableName] || String(tableName || '').replace(/_/g, ' ').replace(/\b\w/g, (char) => char.toUpperCase());
    }

    function getReadableFieldName(fieldName) {
        const fieldMap = { organization_id: 'Organization', organization_name: 'Organization Name', adviser_id: 'Adviser', event_title: 'Event Title', event_category: 'Event Category', event_day_start: 'Event Start Date', event_day_end: 'Event End Date', event_id: 'Event', approver_id: 'Approver', approver_name: 'Approver Name', event_registration: 'Event Registration', org_code: 'Organization Code', name: 'Name', description: 'Description', status: 'Status', venue: 'Venue', student_id: 'Student', student_name: 'Student Name', role_id: 'Role', role_name: 'Role Name', membership_status: 'Membership Status', date_joined: 'Date Joined', organization_membership: 'Organization Membership', username: 'Username', email: 'Email', profile_photo: 'Profile Photo', password: 'Password', task: 'Task', tasks: 'Tasks', task_title: 'Task Title', task_description: 'Task Description', start_date: 'Start Date', end_date: 'End Date', student_start_date: 'Student Start Date', student_end_date: 'Student End Date', assigned_students: 'Assigned Students', assigned_student: 'Assigned Student', daily_schedules: 'Daily Schedules', schedule_status: 'Schedule Status', event_task: 'Event Task', attendance: 'Attendance', attendance_record: 'Attendance Record', time_in_am: 'Time In (AM)', time_out_am: 'Time Out (AM)', break_out: 'Break Out', break_in: 'Break In', time_in_pm: 'Time In (PM)', time_out_pm: 'Time Out (PM)', absent_status: 'Absent Status', excuse_status: 'Excuse Status', excuse_reason: 'Excuse Reason', excuse_approval: 'Excuse Approval' };
        return fieldMap[fieldName] || String(fieldName || '').replace(/_/g, ' ').replace(/\b\w/g, (char) => char.toUpperCase());
    }

    function renderChangesCell(log) {
        const action = (log.action || '').toUpperCase();
        if (action === 'CREATE') return tonePill('CREATED', 'green');
        if (action === 'DELETE') return tonePill('DELETED', 'red');
        return `<div class="truncate" title="${escapeHtml(log.old_value || '-')}"><span class="text-red-600 line-through text-xs">${escapeHtml(log.old_value || '-')}</span></div><div class="truncate" title="${escapeHtml(log.new_value || '-')}"><span class="text-emerald-600 text-xs">${escapeHtml(log.new_value || '-')}</span></div>`;
    }

    function renderLogs(logs, { animate = true } = {}) {
        const tbody = document.getElementById('auditLogsTableBody');
        const mobile = document.getElementById('auditLogsMobileList');
        if (!tbody || !mobile) return;

        const list = logs || [];
        if (!list.length) {
            if (isMobileView()) {
                tbody.innerHTML = '';
                mobile.innerHTML = emptyState('file-text', 'No audit logs found.', 'Activity will appear here as changes are made.');
            } else {
                mobile.innerHTML = '';
                tbody.innerHTML = `<tr data-domino-enter class="reveal"><td colspan="9">${emptyState('file-text', 'No audit logs found.', 'Activity will appear here as changes are made.')}</td></tr>`;
            }
            finishRender('auditLogsSection', animate);
            return;
        }

        if (isMobileView()) {
            tbody.innerHTML = '';
            mobile.innerHTML = list.map((log) => `
                <article class="settings-mobile-card reveal rounded-2xl border border-line bg-white overflow-hidden" data-domino-enter data-log-id="${log.id}">
                    <div class="p-4">
                        <div class="flex items-start justify-between gap-2">
                            <div class="min-w-0">
                                <h3 class="text-sm font-semibold text-ink truncate">${escapeHtml(log.user_name || 'Unknown')}</h3>
                                <p class="text-[11px] text-muted mt-0.5">${escapeHtml(log.user_type || '—')} · ${formatDate(log.created_at)}</p>
                            </div>
                            ${tonePill(log.action || '—', getActionTone(log.action))}
                        </div>
                        <div class="mt-3.5 grid grid-cols-2 gap-2">
                            ${metaTile('Table', escapeHtml(getReadableTableName(log.table_name)))}
                            ${metaTile('Field', escapeHtml(getReadableFieldName(log.field_name) || '—'))}
                            ${metaTile('Device', escapeHtml(log.device_type || '—'))}
                            ${metaTile('IP', escapeHtml(log.ip_address || '—'))}
                        </div>
                        <div class="mt-3 text-xs">${renderChangesCell(log)}</div>
                    </div>
                    <div class="px-4 py-2.5 border-t border-line bg-surface/70 flex justify-end">
                        <button type="button" onclick="deleteLog(${log.id})" class="text-red-600 hover:text-red-800 text-xs font-semibold">Delete</button>
                    </div>
                </article>
            `).join('');
        } else {
            mobile.innerHTML = '';
            tbody.innerHTML = list.map((log) => `
                <tr class="reveal hover:bg-surface/80 transition-colors audit-log-row" data-domino-enter data-log-id="${log.id}">
                    <td class="px-4 py-3 text-sm text-ink whitespace-nowrap">${formatDate(log.created_at)}</td>
                    <td class="px-4 py-3 text-sm text-ink"><div class="font-medium">${escapeHtml(log.user_name || 'Unknown')}</div><div class="text-xs text-muted">${escapeHtml(log.user_type)}</div></td>
                    <td class="px-4 py-3">${tonePill(log.action || '—', getActionTone(log.action))}</td>
                    <td class="px-4 py-3 text-sm text-ink font-mono text-xs">${escapeHtml(getReadableTableName(log.table_name))}</td>
                    <td class="px-4 py-3 text-sm text-ink">${escapeHtml(getReadableFieldName(log.field_name) || '-')}</td>
                    <td class="px-4 py-3 text-sm text-ink max-w-sm">${renderChangesCell(log)}</td>
                    <td class="px-4 py-3 text-sm text-ink"><div class="text-xs">${escapeHtml(log.device_type || '-')}</div><div class="text-xs text-muted">${escapeHtml(log.browser || '-')} / ${escapeHtml(log.os || '-')}</div></td>
                    <td class="px-4 py-3 text-sm text-ink font-mono text-xs">${escapeHtml(log.ip_address || '-')}</td>
                    <td class="px-4 py-3 text-center"><button type="button" onclick="deleteLog(${log.id})" class="text-red-600 hover:text-red-800 text-xs font-medium">Delete</button></td>
                </tr>
            `).join('');
        }

        finishRender('auditLogsSection', animate);
    }

    window.deleteLog = async function(logId) {
        openConfirmDialog({
            title: 'Delete Audit Log',
            message: 'Are you sure you want to delete this audit log? This action cannot be undone.',
            confirmText: 'Delete',
            cancelText: 'Cancel',
            type: 'danger',
            onConfirm: async () => {
                try {
                    await deleteAuditLog(logId);
                    showToast('Audit log deleted successfully', 'success');
                    loadAuditLogs(getCurrentFilters());
                } catch (error) {
                    showToast('Failed to delete audit log', 'error');
                }
            }
        });
    };

    function getCurrentFilters() {
        return {
            user_type: document.getElementById('filterUserType').value,
            action: document.getElementById('filterAction').value,
            table_name: document.getElementById('filterTable').value,
            date: document.getElementById('filterDate').value
        };
    }

    document.getElementById('refreshLogsBtn').addEventListener('click', () => loadAuditLogs(getCurrentFilters()));
    document.getElementById('cleanupLogsBtn').addEventListener('click', () => {
        openConfirmDialog({
            title: 'Cleanup Old Logs',
            message: 'Are you sure you want to delete audit logs older than 90 days?',
            confirmText: 'Cleanup',
            cancelText: 'Cancel',
            type: 'danger',
            onConfirm: async () => {
                try {
                    await cleanupOldAuditLogs();
                    showToast('Old logs cleaned up successfully', 'success');
                    loadAuditLogs(getCurrentFilters());
                } catch (error) {
                    showToast('Failed to cleanup old logs', 'error');
                }
            }
        });
    });

    ['filterUserType', 'filterAction', 'filterTable', 'filterDate'].forEach((id) => {
        document.getElementById(id).addEventListener('change', () => {
            currentPage = 0;
            loadAuditLogs(getCurrentFilters());
        });
    });

    document.getElementById('prevPage').addEventListener('click', () => {
        if (currentPage > 0) {
            currentPage--;
            loadAuditLogs(getCurrentFilters());
        }
    });
    document.getElementById('nextPage').addEventListener('click', () => {
        currentPage++;
        loadAuditLogs(getCurrentFilters());
    });

    let bans = [];

    async function loadBans() {
        try {
            const result = await getAllBans();
            if (result) {
                bans = result.bans || [];
                renderBans(bans);
                hasLoadedBans = true;
            }
        } catch (error) {
            console.error('Error loading bans:', error);
            const tbody = document.getElementById('bannedTableBody');
            const mobile = document.getElementById('bannedMobileList');
            if (isMobileView()) {
                if (tbody) tbody.innerHTML = '';
                if (mobile) mobile.innerHTML = emptyState('shield-off', 'Failed to load bans.', 'Please try again.');
            } else if (tbody) {
                tbody.innerHTML = `<tr data-domino-enter class="reveal"><td colspan="10">${emptyState('shield-off', 'Failed to load bans.', 'Please try again.')}</td></tr>`;
            }
            finishRender('bansSection', true);
            showToast('Failed to load bans', 'error');
        }
    }

    function banActions(ban) {
        return CrudMenu({
            id: String(ban.id),
            showView: false,
            onEdit: 'editBan',
            onDelete: 'deleteBan',
            deleteLabel: 'this ban',
            deleteText: 'Delete',
            customActions: [{
                title: ban.is_active === 1 ? 'Deactivate' : 'Activate',
                handler: `toggleBanStatus('${ban.id}', ${ban.is_active})`,
                icon: ban.is_active === 1
                    ? '<svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18.36 6.64a9 9 0 1 1-12.73 0"/><line x1="12" x2="12" y1="2" y2="12"/></svg>'
                    : '<svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14"/><path d="M12 5v14"/></svg>',
                colorClass: ban.is_active === 1 ? 'text-yellow-700 hover:bg-yellow-50' : 'text-green-700 hover:bg-green-50'
            }]
        });
    }

    function renderBans(data, { animate = true } = {}) {
        const tbody = document.getElementById('bannedTableBody');
        const mobile = document.getElementById('bannedMobileList');
        if (!tbody || !mobile) return;

        const list = data || [];
        setTabCount('bansCount', bans.length);

        if (!list.length) {
            if (isMobileView()) {
                tbody.innerHTML = '';
                mobile.innerHTML = emptyState('shield', 'No bans found.', 'Use the + button to create the first ban.');
            } else {
                mobile.innerHTML = '';
                tbody.innerHTML = `<tr data-domino-enter class="reveal"><td colspan="10">${emptyState('shield', 'No bans found.', 'Click Add New to create the first ban.')}</td></tr>`;
            }
            finishRender('bansSection', animate);
            return;
        }

        if (isMobileView()) {
            tbody.innerHTML = '';
            mobile.innerHTML = list.map((ban) => `
                <article class="settings-mobile-card reveal rounded-2xl border border-line bg-white overflow-hidden" data-domino-enter>
                    <div class="p-4">
                        <div class="flex items-start justify-between gap-2">
                            <div class="min-w-0">
                                <h3 class="text-sm font-semibold text-ink truncate">${escapeHtml(ban.target_name || '—')}</h3>
                                <p class="text-[11px] text-muted mt-0.5 font-mono">${escapeHtml(ban.ip_address || 'No IP')}</p>
                            </div>
                            <div class="flex flex-col items-end gap-1">
                                ${tonePill((ban.ban_type || '').toUpperCase(), ban.ban_type === 'session' ? 'yellow' : ban.ban_type === 'overall' ? 'red' : 'blue')}
                                ${tonePill(ban.is_active === 1 ? 'Active' : 'Inactive', ban.is_active === 1 ? 'green' : 'gray')}
                            </div>
                        </div>
                        <p class="mt-3 text-xs text-body line-clamp-2">${escapeHtml(ban.reason || 'No reason provided')}</p>
                        <div class="mt-3.5 grid grid-cols-2 gap-2">
                            ${metaTile('Duration', escapeHtml(ban.ban_duration_type || '—'))}
                            ${metaTile('Expires', ban.expires_at ? new Date(ban.expires_at).toLocaleDateString() : '—')}
                        </div>
                    </div>
                    <div class="px-3 py-2.5 border-t border-line bg-surface/70 flex justify-end">
                        ${banActions(ban)}
                    </div>
                </article>
            `).join('');
        } else {
            mobile.innerHTML = '';
            tbody.innerHTML = list.map((ban, index) => `
                <tr class="reveal hover:bg-surface/80 transition-colors" data-domino-enter>
                    <td class="px-5 py-4 text-center text-muted">${index + 1}</td>
                    <td class="px-5 py-4">${tonePill((ban.ban_type || '').toUpperCase(), ban.ban_type === 'session' ? 'yellow' : ban.ban_type === 'overall' ? 'red' : 'blue')}</td>
                    <td class="px-5 py-4 text-body truncate">${escapeHtml(ban.target_name || '—')}</td>
                    <td class="px-5 py-4 text-body truncate">${escapeHtml(ban.ip_address || '—')}</td>
                    <td class="px-5 py-4 text-body truncate max-w-xs">${escapeHtml(ban.reason || '—')}</td>
                    <td class="px-5 py-4">${tonePill(ban.is_active === 1 ? 'Active' : 'Not Active', ban.is_active === 1 ? 'green' : 'gray')}</td>
                    <td class="px-5 py-4">${tonePill(ban.ban_duration_type || '—', ban.ban_duration_type === 'permanent' ? 'gray' : 'orange')}</td>
                    <td class="px-5 py-4 text-body">${ban.expires_at ? new Date(ban.expires_at).toLocaleDateString() : '—'}</td>
                    <td class="px-5 py-4 text-body">${ban.created_at ? new Date(ban.created_at).toLocaleDateString() : '—'}</td>
                    <td class="px-5 py-4 text-center">${banActions(ban)}</td>
                </tr>
            `).join('');
        }

        finishRender('bansSection', animate);
    }

    document.getElementById('addBanBtn').addEventListener('click', () => {
        openManageBannedModal({ mode: 'add', onSubmit: async (id, data) => { await createBan(data); loadBans(); }});
    });

    window.editBan = (id) => {
        const ban = bans.find((b) => b.id === id);
        openManageBannedModal({ mode: 'edit', ban, banId: id, onSubmit: async () => { loadBans(); }});
    };

    window.deleteBan = (id, deleteLabel) => {
        openConfirmDialog({
            title: 'Confirm Deletion',
            message: `Are you sure you want to permanently delete ${deleteLabel || 'this ban'}?`,
            confirmText: 'Delete',
            cancelText: 'Cancel',
            type: 'danger',
            onConfirm: async () => {
                try {
                    await deleteBan(id);
                    loadBans();
                    showToast('Ban deleted successfully', 'success');
                } catch (error) {
                    showToast('Failed to delete ban', 'error');
                }
            }
        });
    };

    window.toggleBanStatus = async (id, currentStatus) => {
        const action = currentStatus === 1 ? 'deactivate' : 'activate';
        openConfirmDialog({
            title: `Confirm ${action.charAt(0).toUpperCase() + action.slice(1)}`,
            message: `Are you sure you want to ${action} this ban?`,
            confirmText: action.charAt(0).toUpperCase() + action.slice(1),
            cancelText: 'Cancel',
            type: currentStatus === 1 ? 'warning' : 'success',
            onConfirm: async () => {
                try {
                    if (currentStatus === 1) {
                        await deactivateBan(id);
                        showToast('Ban deactivated successfully', 'success');
                    } else {
                        await activateBan(id);
                        showToast('Ban activated successfully', 'success');
                    }
                    loadBans();
                } catch (error) {
                    showToast(`Failed to ${action} ban`, 'error');
                }
            }
        });
    };

    document.getElementById('bannedSearch').addEventListener('input', (e) => {
        const searchTerm = e.target.value.toLowerCase();
        const filtered = bans.filter((ban) =>
            (ban.reason && ban.reason.toLowerCase().includes(searchTerm)) ||
            (ban.target_name && ban.target_name.toLowerCase().includes(searchTerm)) ||
            (ban.ip_address && ban.ip_address.toLowerCase().includes(searchTerm)) ||
            (ban.ban_type && ban.ban_type.toLowerCase().includes(searchTerm))
        );
        renderBans(filtered, { animate: false });
    });

    let analytics = [];
    let stats = null;

    async function loadAnalytics() {
        try {
            const [analyticsResult, statsResult] = await Promise.all([getAllAnalytics(), getAnalyticsStats()]);
            if (analyticsResult) {
                analytics = analyticsResult.analytics || [];
                renderAnalytics(analytics);
                hasLoadedAnalytics = true;
            }
            if (statsResult) {
                stats = statsResult;
                renderStats(stats);
            }
        } catch (error) {
            console.error('Error loading analytics:', error);
            const tbody = document.getElementById('analyticsTableBody');
            const mobile = document.getElementById('analyticsMobileList');
            if (isMobileView()) {
                if (tbody) tbody.innerHTML = '';
                if (mobile) mobile.innerHTML = emptyState('bar-chart-2', 'Failed to load analytics.', 'Please try again.');
            } else if (tbody) {
                tbody.innerHTML = `<tr data-domino-enter class="reveal"><td colspan="10">${emptyState('bar-chart-2', 'Failed to load analytics.', 'Please try again.')}</td></tr>`;
            }
            finishRender('analyticsSection', true);
            showToast('Failed to load analytics', 'error');
        }
    }

    function renderStats(data) {
        if (data.stats) {
            document.getElementById('totalVisits').textContent = data.stats.total_visits || 0;
            document.getElementById('uniqueVisitors').textContent = data.stats.unique_visitors || 0;
            document.getElementById('uniqueRoutes').textContent = data.stats.unique_routes || 0;
            document.getElementById('authenticatedVisits').textContent = data.stats.authenticated_visits || 0;
        }
    }

    function renderAnalytics(data, { animate = true } = {}) {
        const tbody = document.getElementById('analyticsTableBody');
        const mobile = document.getElementById('analyticsMobileList');
        if (!tbody || !mobile) return;

        const list = data || [];
        setTabCount('analyticsCount', analytics.length);

        if (!list.length) {
            if (isMobileView()) {
                tbody.innerHTML = '';
                mobile.innerHTML = emptyState('bar-chart-2', 'No analytics data found.', 'Visitor data will appear as users navigate the application.');
            } else {
                mobile.innerHTML = '';
                tbody.innerHTML = `<tr data-domino-enter class="reveal"><td colspan="10">${emptyState('bar-chart-2', 'No analytics data found.', 'Visitor data will appear as users navigate the application.')}</td></tr>`;
            }
            finishRender('analyticsSection', animate);
            return;
        }

        if (isMobileView()) {
            tbody.innerHTML = '';
            mobile.innerHTML = list.map((item) => {
                const location = [item.city, item.country].filter(Boolean).join(', ') || '—';
                const userInfo = item.user_type && item.user_id ? `${item.user_type} #${item.user_id}` : 'Anonymous';
                const isActive = item.active === 1;
                return `
                    <article class="settings-mobile-card reveal rounded-2xl border border-line bg-white overflow-hidden" data-domino-enter>
                        <div class="p-4">
                            <div class="flex items-start justify-between gap-2">
                                <span class="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-blue-50 text-blue-600 border border-blue-100 font-mono truncate max-w-[70%]">${escapeHtml(item.route)}</span>
                                ${tonePill(isActive ? 'Active' : 'Inactive', isActive ? 'green' : 'gray')}
                            </div>
                            <div class="mt-3.5 grid grid-cols-2 gap-2">
                                ${metaTile('IP', escapeHtml(item.ip_address || '—'))}
                                ${metaTile('Device', escapeHtml(item.device_type || '—'))}
                                ${metaTile('Location', escapeHtml(location))}
                                ${metaTile('User', escapeHtml(userInfo))}
                            </div>
                            <p class="mt-3 text-[11px] text-muted">${item.visited_at ? new Date(item.visited_at).toLocaleString() : '—'}</p>
                        </div>
                        <div class="px-3 py-2.5 border-t border-line bg-surface/70 flex justify-end">
                            ${CrudMenu({ id: String(item.id), showView: false, showEdit: false, onDelete: 'deleteAnalytics', deleteLabel: 'this analytics record', deleteText: 'Delete' })}
                        </div>
                    </article>
                `;
            }).join('');
        } else {
            mobile.innerHTML = '';
            tbody.innerHTML = list.map((item, index) => {
                const location = [item.city, item.country].filter(Boolean).join(', ') || '—';
                const userInfo = item.user_type && item.user_id ? `${item.user_type} #${item.user_id}` : 'Anonymous';
                const isActive = item.active === 1;
                const urlDisplay = item.url ? (item.url.length > 50 ? item.url.substring(0, 50) + '...' : item.url) : '—';
                return `
                    <tr class="reveal hover:bg-surface/80 transition-colors" data-domino-enter>
                        <td class="px-5 py-4 text-center text-muted">${index + 1}</td>
                        <td class="px-5 py-4"><span class="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-blue-50 text-blue-600 border border-blue-100 font-mono">${escapeHtml(item.route)}</span></td>
                        <td class="px-5 py-4 text-body font-mono">${escapeHtml(item.ip_address || '—')}</td>
                        <td class="px-5 py-4 text-body">${escapeHtml(item.device_type || '—')}</td>
                        <td class="px-5 py-4 text-body truncate max-w-xs">${escapeHtml(location)}</td>
                        <td class="px-5 py-4">${tonePill(userInfo, item.user_type ? 'green' : 'gray')}</td>
                        <td class="px-5 py-4">${tonePill(isActive ? 'Active' : 'Inactive', isActive ? 'green' : 'gray')}</td>
                        <td class="px-5 py-4 text-body truncate max-w-xs" title="${escapeHtml(item.url || '')}"><a href="${item.url || '#'}" target="_blank" class="text-blue-600 hover:underline" ${!item.url ? 'pointer-events-none' : ''}>${escapeHtml(urlDisplay)}</a></td>
                        <td class="px-5 py-4 text-body">${item.visited_at ? new Date(item.visited_at).toLocaleString() : '—'}</td>
                        <td class="px-5 py-4 text-center">${CrudMenu({ id: String(item.id), showView: false, showEdit: false, onDelete: 'deleteAnalytics', deleteLabel: 'this analytics record', deleteText: 'Delete' })}</td>
                    </tr>
                `;
            }).join('');
        }

        finishRender('analyticsSection', animate);
    }

    window.deleteAnalytics = (id, deleteLabel) => {
        const confirmDelete = confirm(`Are you sure you want to permanently delete ${deleteLabel || 'this analytics record'}?`);
        if (confirmDelete) {
            deleteAnalytics(id).then(() => {
                loadAnalytics();
                showToast('Analytics record deleted successfully', 'success');
            }).catch((error) => {
                console.error('Error deleting analytics:', error);
                showToast('Failed to delete analytics record', 'error');
            });
        }
    };

    document.getElementById('analyticsSearch').addEventListener('input', (e) => {
        const searchTerm = e.target.value.toLowerCase();
        const filtered = analytics.filter((item) =>
            (item.route && item.route.toLowerCase().includes(searchTerm)) ||
            (item.ip_address && item.ip_address.toLowerCase().includes(searchTerm)) ||
            (item.country && item.country.toLowerCase().includes(searchTerm)) ||
            (item.city && item.city.toLowerCase().includes(searchTerm)) ||
            (item.device_type && item.device_type.toLowerCase().includes(searchTerm)) ||
            (item.browser && item.browser.toLowerCase().includes(searchTerm)) ||
            (item.url && item.url.toLowerCase().includes(searchTerm))
        );
        renderAnalytics(filtered, { animate: false });
    });

    async function loadTabCounts() {
        const [auditRes, bansRes, analyticsRes] = await Promise.allSettled([
            getAllAuditLogs({ limit: 1, offset: 0 }),
            getAllBans(),
            getAllAnalytics()
        ]);

        if (auditRes.status === 'fulfilled' && auditRes.value?.success) {
            setTabCount('auditLogsCount', auditRes.value.total || 0);
        }
        if (bansRes.status === 'fulfilled' && bansRes.value) {
            setTabCount('bansCount', (bansRes.value.bans || []).length);
        }
        if (analyticsRes.status === 'fulfilled' && analyticsRes.value) {
            setTabCount('analyticsCount', (analyticsRes.value.analytics || []).length);
        }
    }

    loadTabCounts();
    switchTab(initialTab);
}

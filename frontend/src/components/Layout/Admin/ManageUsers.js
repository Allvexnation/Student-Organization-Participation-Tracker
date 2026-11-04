import { AdminNavbar, initAdminNavbar } from '../../../components/Navbar/AdminNavbar.js';
import { protectAdminRoute } from '../../../middleware/AdminMiddleware.js';
import * as AdminAPI from '../../../api/admin/Admin/ManageAdmins.js';
import * as AdviserAPI from '../../../api/admin/adviser/ManageAdviser.js';
import * as StudentsAPI from '../../../api/admin/Students/ManageStudents.js';
import * as RolesAPI from '../../../api/admin/roles/ManageRoles.js';
import { CacheService } from '../../../../cache/CacheService.js';
import { openManageAdminsModal, openViewAdminModal } from '../../../components/Modal/ManageAdminsModal.js';
import { openManageAdviserModal, openViewAdviserModal } from '../../../components/Modal/ManageAdviserModal.js';
import { openManageStudentsModal, openViewStudentsModal } from '../../../components/Modal/ManageStudentsModal.js';
import { openManageRolesModal, openViewRolesModal } from '../../../components/Modal/ManageRolesModal.js';
import { openConfirmDialog } from '../../../components/Dialog/ConfirmDialog.js';
import { showToast } from '../../../components/ToastMessage.js';
import { CrudMenu } from '../../../components/CrudMenu.js';
import { skeletonTableRows } from '../../../components/SkeletonLoading.js';
import { getDefaultProfileSVG } from '../../../static/Profile/DefaultProfile.js';
import { logChange } from '../../../api/AuditLogs/AuditLogs.js';
import { decodeToken, getToken } from '../../../utils/jwt.js';
import { initManageUsersAnimations, animateDominoList } from '../../../provider/Animation/ManageUsersAnimation.js';

const TABS = ['admins', 'advisers', 'students', 'roles'];
const TAB_ACTIVE_CLASSES = ['bg-blue-600', 'text-white', 'shadow-sm'];
const TAB_IDLE_CLASSES = ['text-muted', 'hover:text-ink', 'hover:bg-surface'];

function escapeHtml(value) {
    return String(value ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}

function formatShortDate(value) {
    if (!value) return '—';
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? '—' : date.toLocaleDateString();
}

function refreshIcons() {
    if (typeof lucide !== 'undefined') lucide.createIcons();
}

function userPhoto(src, alt, sizeClass = 'w-11 h-11') {
    if (src) {
        return `<img src="${src}" alt="${escapeHtml(alt)}" class="${sizeClass} object-cover rounded-full ring-2 ring-white shadow-sm" onerror="handleProfileImageError(this)">`;
    }
    return `<div class="${sizeClass} rounded-full overflow-hidden ring-2 ring-white shadow-sm">${getDefaultProfileSVG('100%', '100%')}</div>`;
}

function tonePill(label, tone = 'blue') {
    const tones = {
        blue: 'bg-blue-50 text-blue-600 border-blue-100',
        purple: 'bg-purple-50 text-purple-700 border-purple-200',
        green: 'bg-emerald-50 text-emerald-700 border-emerald-200',
        red: 'bg-red-50 text-red-700 border-red-200',
        gray: 'bg-slate-50 text-slate-600 border-slate-200',
    };
    return `<span class="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium border ${tones[tone] || tones.blue}">${escapeHtml(label)}</span>`;
}

function statusPill(status) {
    const value = String(status || '—');
    return tonePill(value, value.toLowerCase() === 'active' ? 'green' : 'red');
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
        <div class="users-mobile-card rounded-2xl border border-line bg-white/90 p-4">
            <div class="flex items-center gap-3">
                <div class="w-12 h-12 rounded-full skeleton-shimmer shrink-0"></div>
                <div class="flex-1 space-y-2 min-w-0">
                    <div class="h-4 w-32 skeleton-shimmer rounded"></div>
                    <div class="h-3 w-44 skeleton-shimmer rounded"></div>
                </div>
            </div>
            <div class="mt-4 grid grid-cols-2 gap-2">
                <div class="h-8 skeleton-shimmer rounded-lg"></div>
                <div class="h-8 skeleton-shimmer rounded-lg"></div>
            </div>
        </div>
    `).join('');
}

function toolbar({ searchId, addId, placeholder }) {
    return `
        <div class="reveal mb-4 md:mb-5" data-domino-enter>
            <div class="flex items-center gap-2.5">
                <div class="relative flex-1 md:flex-none">
                    <i data-lucide="search" class="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted"></i>
                    <input
                        type="search"
                        id="${searchId}"
                        placeholder="${placeholder}"
                        class="w-full md:w-80 pl-9 pr-3 py-2.5 text-sm border border-line rounded-xl bg-white text-ink placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-blue-600/15 focus:border-blue-600">
                </div>
                <button
                    type="button"
                    id="${addId}"
                    class="hidden md:inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-white bg-blue-600 hover:bg-blue-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-600/30 transition shadow-sm">
                    <i data-lucide="plus" class="w-4 h-4"></i>
                    <span>Add New</span>
                </button>
            </div>
        </div>
    `;
}

function desktopTable({ bodyId, headers, colSpan }) {
    return `
        <div class="hidden md:block">
            <div class="bg-white border border-line rounded-2xl shadow-sm overflow-hidden">
                <div>
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
            class="users-tab flex flex-col md:flex-row items-center justify-center gap-1 md:gap-2 rounded-2xl md:rounded-xl px-2 py-3 md:px-4 md:py-2.5 text-[11px] md:text-sm font-semibold transition-colors ${state}">
            <span class="relative">
                <i data-lucide="${icon}" class="w-4 h-4"></i>
                <span id="${countId}" class="md:hidden absolute -top-2 -right-2 min-w-[16px] h-4 px-1 rounded-full bg-yellow text-[9px] font-bold text-blue-600 leading-4 text-center">0</span>
            </span>
            <span>${label}</span>
            <span id="${countId}Desktop" class="hidden md:inline-flex min-w-[1.25rem] h-5 px-1.5 items-center justify-center rounded-full bg-yellow text-[11px] font-bold text-blue-600">0</span>
        </button>
    `;
}

function mobileCard({ photo, title, subtitle, badges, meta, actions }) {
    return `
        <article class="users-mobile-card reveal rounded-2xl border border-line bg-white/95 p-4" data-domino-enter>
            <div class="flex items-start gap-3">
                ${photo}
                <div class="min-w-0 flex-1">
                    <div class="flex items-start justify-between gap-2">
                        <div class="min-w-0">
                            <h3 class="text-sm font-semibold text-ink truncate">${title}</h3>
                            ${subtitle ? `<p class="text-xs text-muted truncate mt-0.5">${subtitle}</p>` : ''}
                        </div>
                        <div class="shrink-0">${actions}</div>
                    </div>
                    ${badges ? `<div class="mt-2 flex flex-wrap gap-1.5">${badges}</div>` : ''}
                </div>
            </div>
            ${meta ? `<div class="mt-3 pt-3 border-t border-line grid grid-cols-1 gap-1.5 text-xs text-body">${meta}</div>` : ''}
        </article>
    `;
}

function metaRow(label, value) {
    return `<div class="flex items-center justify-between gap-3"><span class="text-muted">${label}</span><span class="font-medium text-ink truncate text-right">${value}</span></div>`;
}

function isMobileView() {
    return window.matchMedia('(max-width: 767px)').matches;
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
}

function finishRender(sectionId, animate) {
    refreshIcons();
    if (animate) {
        const section = document.getElementById(sectionId);
        if (section) animateDominoList(section);
    }
}

export function ManageUsers() {
    return `
        <div id="users-page" data-domino-page class="min-h-screen bg-surface font-sans text-ink pb-28 md:pb-8">
            ${AdminNavbar()}
            <main class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5 sm:py-8">
                <header class="reveal mb-5 sm:mb-7" data-domino-enter>
                    <span class="inline-flex items-center gap-2 rounded-full border border-line bg-white px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-blue-600">
                        <span class="h-1.5 w-1.5 rounded-full bg-yellow"></span>
                        User directory
                    </span>
                    <div class="mt-3 flex flex-col lg:flex-row lg:items-end lg:justify-between gap-3">
                        <div class="min-w-0">
                            <h1 class="text-[1.65rem] sm:text-3xl font-semibold tracking-tight text-ink leading-tight">Manage Users</h1>
                            <p class="mt-1.5 max-w-2xl text-sm text-body">Create and maintain admin, adviser, and student accounts, plus the roles they inherit.</p>
                        </div>
                    </div>
                </header>

                <div class="reveal mb-5 sm:mb-6" data-domino-enter>
                    <nav class="users-tab-bar grid grid-cols-4 gap-1 p-1 rounded-2xl border border-line bg-white/90 md:flex md:items-center md:gap-1" aria-label="User types">
                        ${tabButton({ id: 'adminsTab', tab: 'admins', icon: 'shield', label: 'Admins', countId: 'adminsCount', active: true })}
                        ${tabButton({ id: 'advisersTab', tab: 'advisers', icon: 'user-cog', label: 'Advisers', countId: 'advisersCount' })}
                        ${tabButton({ id: 'studentsTab', tab: 'students', icon: 'graduation-cap', label: 'Students', countId: 'studentsCount' })}
                        ${tabButton({ id: 'rolesTab', tab: 'roles', icon: 'key-round', label: 'Roles', countId: 'rolesCount' })}
                    </nav>
                </div>

                <section id="adminsSection">
                    ${toolbar({ searchId: 'adminSearch', addId: 'addAdminBtn', placeholder: 'Search admins...' })}
                    ${desktopTable({
                        bodyId: 'adminTableBody',
                        colSpan: 9,
                        headers: `
                            <th class="px-5 py-3.5 w-12 text-center">#</th>
                            <th class="px-5 py-3.5">Photo</th>
                            <th class="px-5 py-3.5">Name</th>
                            <th class="px-5 py-3.5">Username</th>
                            <th class="px-5 py-3.5">Email</th>
                            <th class="px-5 py-3.5">Role</th>
                            <th class="px-5 py-3.5">Status</th>
                            <th class="px-5 py-3.5">Created</th>
                            <th class="px-5 py-3.5 text-center w-28">Actions</th>
                        `
                    })}
                    <div id="adminMobileList" class="md:hidden space-y-3">${skeletonCards()}</div>
                </section>

                <section id="advisersSection" class="hidden">
                    ${toolbar({ searchId: 'adviserSearch', addId: 'addAdviserBtn', placeholder: 'Search advisers...' })}
                    ${desktopTable({
                        bodyId: 'adviserTableBody',
                        colSpan: 9,
                        headers: `
                            <th class="px-5 py-3.5 w-12 text-center">#</th>
                            <th class="px-5 py-3.5">Photo</th>
                            <th class="px-5 py-3.5">Name</th>
                            <th class="px-5 py-3.5">Username</th>
                            <th class="px-5 py-3.5">Email</th>
                            <th class="px-5 py-3.5">Role</th>
                            <th class="px-5 py-3.5">Status</th>
                            <th class="px-5 py-3.5">Created</th>
                            <th class="px-5 py-3.5 text-center w-28">Actions</th>
                        `
                    })}
                    <div id="adviserMobileList" class="md:hidden space-y-3">${skeletonCards()}</div>
                </section>

                <section id="studentsSection" class="hidden">
                    ${toolbar({ searchId: 'studentSearch', addId: 'addStudentBtn', placeholder: 'Search students...' })}
                    ${desktopTable({
                        bodyId: 'studentTableBody',
                        colSpan: 8,
                        headers: `
                            <th class="px-5 py-3.5">Photo</th>
                            <th class="px-5 py-3.5">Name</th>
                            <th class="px-5 py-3.5">Student No.</th>
                            <th class="px-5 py-3.5">Program</th>
                            <th class="px-5 py-3.5">Year Level</th>
                            <th class="px-5 py-3.5">Email</th>
                            <th class="px-5 py-3.5">Created</th>
                            <th class="px-5 py-3.5 text-center w-28">Actions</th>
                        `
                    })}
                    <div id="studentMobileList" class="md:hidden space-y-3">${skeletonCards()}</div>
                </section>

                <section id="rolesSection" class="hidden">
                    ${toolbar({ searchId: 'roleSearch', addId: 'addRoleBtn', placeholder: 'Search roles...' })}
                    ${desktopTable({
                        bodyId: 'roleTableBody',
                        colSpan: 6,
                        headers: `
                            <th class="px-5 py-3.5 w-12 text-center">#</th>
                            <th class="px-5 py-3.5">Role Name</th>
                            <th class="px-5 py-3.5">Linked Users</th>
                            <th class="px-5 py-3.5">Created</th>
                            <th class="px-5 py-3.5">Updated</th>
                            <th class="px-5 py-3.5 text-center w-28">Actions</th>
                        `
                    })}
                    <div id="roleMobileList" class="md:hidden space-y-3">${skeletonCards()}</div>
                </section>
            </main>

            <button
                type="button"
                id="usersMobileAddBtn"
                class="md:hidden fixed z-30 right-4 bottom-[max(1.25rem,env(safe-area-inset-bottom))] h-14 w-14 rounded-full bg-blue-600 text-white shadow-lift-lg flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-yellow"
                aria-label="Add new">
                <i data-lucide="plus" class="w-6 h-6"></i>
            </button>
        </div>
    `;
}

export async function initManageUsers() {
    protectAdminRoute();
    await initAdminNavbar();
    initManageUsersAnimations();
    refreshIcons();

    const adminToken = getToken('admin');
    const adminUser = decodeToken(adminToken) || {};

    let currentTab = 'admins';
    let admins = [];
    let advisers = [];
    let students = [];
    let roles = [];
    let hasLoadedAdmins = false;
    let hasLoadedAdvisers = false;
    let hasLoadedStudents = false;
    let hasLoadedRoles = false;

    const addButtons = {
        admins: document.getElementById('addAdminBtn'),
        advisers: document.getElementById('addAdviserBtn'),
        students: document.getElementById('addStudentBtn'),
        roles: document.getElementById('addRoleBtn'),
    };

    window.switchTab = function(tab) {
        currentTab = tab;
        setTabStyles(tab);
        refreshIcons();

        if (tab === 'admins' && !hasLoadedAdmins) loadAdmins();
        if (tab === 'advisers' && !hasLoadedAdvisers) loadAdvisers();
        if (tab === 'students' && !hasLoadedStudents) loadStudents();
        if (tab === 'roles' && !hasLoadedRoles) loadRoles();

        const section = document.getElementById(`${tab}Section`);
        if (section) animateDominoList(section);
    };

    document.getElementById('usersMobileAddBtn')?.addEventListener('click', () => {
        addButtons[currentTab]?.click();
    });

    async function loadAdmins(forceRefresh = false) {
        if (!forceRefresh) {
            try {
                const cachedData = await CacheService.get('cachedAdmins');
                if (cachedData && Array.isArray(cachedData) && cachedData.length > 0) {
                    admins = cachedData;
                    renderAdmins(admins);
                    hasLoadedAdmins = true;
                }
            } catch (e) {
                console.error('Error reading cached admins:', e);
            }
        }

        try {
            const freshData = await AdminAPI.getAllAdmins();
            if (freshData) {
                admins = freshData;
                await CacheService.set('cachedAdmins', admins);
                renderAdmins(admins);
                hasLoadedAdmins = true;
            }
        } catch (error) {
            console.error('Error loading admins:', error);
            if (!hasLoadedAdmins) {
                renderFailed('adminTableBody', 'adminMobileList', 9, 'Failed to load admins');
                showToast('Failed to load admins', 'error');
            }
        }
    }

    function filterVisibleAdmins(data) {
        return (data || []).filter((admin) =>
            (!admin.email || !admin.email.toLowerCase().endsWith('@edu.com')) &&
            admin.id !== adminUser.user_id
        );
    }

    function renderAdmins(data, { animate = true } = {}) {
        const tbody = document.getElementById('adminTableBody');
        const mobile = document.getElementById('adminMobileList');
        if (!tbody || !mobile) return;

        const filteredData = filterVisibleAdmins(data);
        setTabCount('adminsCount', filteredData.length);

        if (!filteredData.length) {
            if (isMobileView()) {
                tbody.innerHTML = '';
                mobile.innerHTML = emptyState('user', 'No admins found.', 'Use the + button to create the first admin.');
            } else {
                mobile.innerHTML = '';
                tbody.innerHTML = `<tr data-domino-enter class="reveal"><td colspan="9">${emptyState('user', 'No admins found.', 'Tap Add to create the first admin.')}</td></tr>`;
            }
            finishRender('adminsSection', animate);
            return;
        }

        if (isMobileView()) {
            tbody.innerHTML = '';
            mobile.innerHTML = filteredData.map((admin) => mobileCard({
                photo: userPhoto(admin.profile_photo, admin.name, 'w-12 h-12'),
                title: escapeHtml(admin.name),
                subtitle: escapeHtml(admin.email),
                badges: `${tonePill(admin.role === 'super_admin' ? 'Super Admin' : 'Admin', admin.role === 'super_admin' ? 'purple' : 'blue')}${statusPill(admin.status)}`,
                meta: `${metaRow('Username', escapeHtml(admin.username))}${metaRow('Created', formatShortDate(admin.created_at))}`,
                actions: CrudMenu({
                    id: String(admin.id),
                    showView: true,
                    onView: 'viewAdmin',
                    onEdit: 'editAdmin',
                    onDelete: 'deleteAdmin',
                    deleteLabel: admin.name
                })
            })).join('');
        } else {
            mobile.innerHTML = '';
            tbody.innerHTML = filteredData.map((admin, index) => `
                <tr class="reveal hover:bg-surface/80 transition-colors" data-domino-enter>
                    <td class="px-5 py-4 text-center text-muted">${index + 1}</td>
                    <td class="px-5 py-4">${userPhoto(admin.profile_photo, admin.name, 'w-10 h-10')}</td>
                    <td class="px-5 py-4 font-medium text-ink">${escapeHtml(admin.name)}</td>
                    <td class="px-5 py-4 text-body">${escapeHtml(admin.username)}</td>
                    <td class="px-5 py-4 text-body">${escapeHtml(admin.email)}</td>
                    <td class="px-5 py-4">${tonePill(admin.role === 'super_admin' ? 'Super Admin' : 'Admin', admin.role === 'super_admin' ? 'purple' : 'blue')}</td>
                    <td class="px-5 py-4">${statusPill(admin.status)}</td>
                    <td class="px-5 py-4 text-body">${formatShortDate(admin.created_at)}</td>
                    <td class="px-5 py-4 text-center">
                        ${CrudMenu({
                            id: String(admin.id),
                            showView: true,
                            onView: 'viewAdmin',
                            onEdit: 'editAdmin',
                            onDelete: 'deleteAdmin',
                            deleteLabel: admin.name
                        })}
                    </td>
                </tr>
            `).join('');
        }

        finishRender('adminsSection', animate);
    }

    document.getElementById('addAdminBtn').addEventListener('click', () => {
        openManageAdminsModal({
            mode: 'add',
            onSubmit: async (id, data) => {
                if (id) {
                    await AdminAPI.updateAdmin(id, data);
                } else {
                    const response = await AdminAPI.createAdmin(data);
                    try {
                        await logChange({
                            user_id: adminUser.user_id,
                            user_type: 'admin',
                            action: 'create',
                            table_name: 'admins',
                            record_id: response.id,
                            field_name: 'all',
                            old_value: null,
                            new_value: `Admin: ${data.name}`
                        });
                    } catch (error) {
                        console.error('Failed to log admin creation:', error);
                    }
                    loadAdmins(true);
                    return response;
                }
                loadAdmins(true);
            }
        });
    });

    window.editAdmin = (id) => {
        openManageAdminsModal({
            mode: 'edit',
            adminId: id,
            onSubmit: async (id, data) => {
                const oldAdmin = admins.find(a => a.id === id);
                try {
                    await AdminAPI.updateAdmin(id, data);

                    const fieldsToLog = ['name', 'username', 'email', 'role', 'status'];
                    for (const field of fieldsToLog) {
                        if (oldAdmin && oldAdmin[field] !== data[field]) {
                            try {
                                await logChange({
                                    user_id: adminUser.user_id,
                                    user_type: 'admin',
                                    action: 'update',
                                    table_name: 'admins',
                                    record_id: id,
                                    field_name: field,
                                    old_value: oldAdmin[field] || 'None',
                                    new_value: data[field] || 'Removed'
                                });
                            } catch (error) {
                                console.error(`Failed to log admin ${field} change:`, error);
                            }
                        }
                    }

                    if (oldAdmin && oldAdmin.profile_photo !== data.profile_photo) {
                        try {
                            await logChange({
                                user_id: adminUser.user_id,
                                user_type: 'admin',
                                action: 'update',
                                table_name: 'admins',
                                record_id: id,
                                field_name: 'profile_photo',
                                old_value: oldAdmin.profile_photo ? 'Base64 image data' : 'None',
                                new_value: data.profile_photo ? 'Base64 image data' : 'Removed'
                            });
                        } catch (error) {
                            console.error('Failed to log admin profile photo change:', error);
                        }
                    }

                    loadAdmins(true);
                    showToast('Admin updated successfully', 'success');
                } catch (error) {
                    showToast(error.message || 'Failed to update admin', 'error');
                }
            }
        });
    };

    window.viewAdmin = async (id) => {
        await openViewAdminModal(id);
    };

    window.deleteAdmin = (id, deleteLabel) => {
        openConfirmDialog({
            title: 'Confirm Delete',
            message: `Are you sure you want to delete ${deleteLabel || 'this admin'}?`,
            confirmText: 'Delete',
            cancelText: 'Cancel',
            type: 'danger',
            showReason: true,
            onConfirm: async (reason) => {
                try {
                    const oldAdmin = admins.find(a => a.id === id);
                    await AdminAPI.deleteAdmin(id, reason);

                    try {
                        await logChange({
                            user_id: adminUser.user_id,
                            user_type: 'admin',
                            action: 'delete',
                            table_name: 'admins',
                            record_id: id,
                            field_name: 'all',
                            old_value: `Admin: ${oldAdmin?.name || 'Unknown'}`,
                            new_value: null
                        });
                    } catch (error) {
                        console.error('Failed to log admin deletion:', error);
                    }

                    loadAdmins(true);
                    showToast('Admin deleted successfully', 'success');
                } catch (error) {
                    console.error('Error deleting admin:', error);
                    showToast('Failed to delete admin', 'error');
                }
            }
        });
    };

    document.getElementById('adminSearch').addEventListener('input', (e) => {
        const searchTerm = e.target.value.toLowerCase();
        const filtered = admins.filter(admin =>
            admin.name.toLowerCase().includes(searchTerm) ||
            admin.username.toLowerCase().includes(searchTerm) ||
            admin.email.toLowerCase().includes(searchTerm)
        );
        renderAdmins(filtered, { animate: false });
    });

    async function loadAdvisers(forceRefresh = false) {
        if (!forceRefresh) {
            try {
                const cachedData = await CacheService.get('cachedAdvisers');
                if (cachedData && Array.isArray(cachedData) && cachedData.length > 0) {
                    advisers = cachedData;
                    renderAdvisers(advisers);
                    hasLoadedAdvisers = true;
                }
            } catch (e) {
                console.error('Error reading cached advisers:', e);
            }
        }

        try {
            const freshData = await AdviserAPI.getAllAdvisers();
            if (freshData) {
                advisers = freshData;
                await CacheService.set('cachedAdvisers', advisers);
                renderAdvisers(advisers);
                hasLoadedAdvisers = true;
            }
        } catch (error) {
            console.error('Error loading advisers:', error);
            if (!hasLoadedAdvisers) {
                renderFailed('adviserTableBody', 'adviserMobileList', 9, 'Failed to load advisers');
                showToast('Failed to load advisers', 'error');
            }
        }
    }

    function renderAdvisers(data, { animate = true } = {}) {
        const tbody = document.getElementById('adviserTableBody');
        const mobile = document.getElementById('adviserMobileList');
        if (!tbody || !mobile) return;

        const list = data || [];
        setTabCount('advisersCount', list.length);

        if (!list.length) {
            if (isMobileView()) {
                tbody.innerHTML = '';
                mobile.innerHTML = emptyState('user-cog', 'No advisers found.', 'Use the + button to create the first adviser.');
            } else {
                mobile.innerHTML = '';
                tbody.innerHTML = `<tr data-domino-enter class="reveal"><td colspan="9">${emptyState('user-cog', 'No advisers found.', 'Tap Add to create the first adviser.')}</td></tr>`;
            }
            finishRender('advisersSection', animate);
            return;
        }

        if (isMobileView()) {
            tbody.innerHTML = '';
            mobile.innerHTML = list.map((adviser) => mobileCard({
                photo: userPhoto(adviser.profile_photo, adviser.name, 'w-12 h-12'),
                title: escapeHtml(adviser.name),
                subtitle: escapeHtml(adviser.email),
                badges: `${tonePill(adviser.role === 'head_adviser' ? 'Head Adviser' : 'Adviser', adviser.role === 'head_adviser' ? 'purple' : 'blue')}${statusPill(adviser.status)}`,
                meta: `${metaRow('Username', escapeHtml(adviser.username))}${metaRow('Created', formatShortDate(adviser.created_at))}`,
                actions: CrudMenu({
                    id: String(adviser.id),
                    showView: true,
                    onView: 'viewAdviser',
                    onEdit: 'editAdviser',
                    onDelete: 'deleteAdviser',
                    deleteLabel: adviser.name
                })
            })).join('');
        } else {
            mobile.innerHTML = '';
            tbody.innerHTML = list.map((adviser, index) => `
                <tr class="reveal hover:bg-surface/80 transition-colors" data-domino-enter>
                    <td class="px-5 py-4 text-center text-muted">${index + 1}</td>
                    <td class="px-5 py-4">${userPhoto(adviser.profile_photo, adviser.name, 'w-10 h-10')}</td>
                    <td class="px-5 py-4 font-medium text-ink">${escapeHtml(adviser.name)}</td>
                    <td class="px-5 py-4 text-body">${escapeHtml(adviser.username)}</td>
                    <td class="px-5 py-4 text-body">${escapeHtml(adviser.email)}</td>
                    <td class="px-5 py-4">${tonePill(adviser.role === 'head_adviser' ? 'Head Adviser' : 'Adviser', adviser.role === 'head_adviser' ? 'purple' : 'blue')}</td>
                    <td class="px-5 py-4">${statusPill(adviser.status)}</td>
                    <td class="px-5 py-4 text-body">${formatShortDate(adviser.created_at)}</td>
                    <td class="px-5 py-4 text-center">
                        ${CrudMenu({
                            id: String(adviser.id),
                            showView: true,
                            onView: 'viewAdviser',
                            onEdit: 'editAdviser',
                            onDelete: 'deleteAdviser',
                            deleteLabel: adviser.name
                        })}
                    </td>
                </tr>
            `).join('');
        }

        finishRender('advisersSection', animate);
    }

    document.getElementById('addAdviserBtn').addEventListener('click', () => {
        openManageAdviserModal({
            mode: 'add',
            onSubmit: async (id, data) => {
                if (id) {
                    const oldAdviser = advisers.find(a => a.id === id);
                    await AdviserAPI.updateAdviser(id, data);

                    const fieldsToLog = ['name', 'username', 'email', 'role', 'status'];
                    for (const field of fieldsToLog) {
                        if (oldAdviser && oldAdviser[field] !== data[field]) {
                            try {
                                await logChange({
                                    user_id: adminUser.user_id,
                                    user_type: 'admin',
                                    action: 'update',
                                    table_name: 'advisers',
                                    record_id: id,
                                    field_name: field,
                                    old_value: oldAdviser[field] || 'None',
                                    new_value: data[field] || 'Removed'
                                });
                            } catch (error) {
                                console.error(`Failed to log adviser ${field} change:`, error);
                            }
                        }
                    }

                    if (oldAdviser && oldAdviser.profile_photo !== data.profile_photo) {
                        try {
                            await logChange({
                                user_id: adminUser.user_id,
                                user_type: 'admin',
                                action: 'update',
                                table_name: 'advisers',
                                record_id: id,
                                field_name: 'profile_photo',
                                old_value: oldAdviser.profile_photo ? 'Base64 image data' : 'None',
                                new_value: data.profile_photo ? 'Base64 image data' : 'Removed'
                            });
                        } catch (error) {
                            console.error('Failed to log adviser profile photo change:', error);
                        }
                    }
                } else {
                    const response = await AdviserAPI.createAdviser(data);
                    try {
                        await logChange({
                            user_id: adminUser.user_id,
                            user_type: 'admin',
                            action: 'create',
                            table_name: 'advisers',
                            record_id: response.id,
                            field_name: 'all',
                            old_value: null,
                            new_value: `Adviser: ${data.name}`
                        });
                    } catch (error) {
                        console.error('Failed to log adviser creation:', error);
                    }
                    loadAdvisers(true);
                    return response;
                }
                loadAdvisers(true);
            }
        });
    });

    window.editAdviser = (id) => {
        openManageAdviserModal({
            mode: 'edit',
            adviserId: id,
            onSubmit: async (id, data) => {
                const oldAdviser = advisers.find(a => a.id === id);
                await AdviserAPI.updateAdviser(id, data);

                const fieldsToLog = ['name', 'username', 'email', 'role', 'status'];
                for (const field of fieldsToLog) {
                    if (oldAdviser && oldAdviser[field] !== data[field]) {
                        try {
                            await logChange({
                                user_id: adminUser.user_id,
                                user_type: 'admin',
                                action: 'update',
                                table_name: 'advisers',
                                record_id: id,
                                field_name: field,
                                old_value: oldAdviser[field] || 'None',
                                new_value: data[field] || 'Removed'
                            });
                        } catch (error) {
                            console.error(`Failed to log adviser ${field} change:`, error);
                        }
                    }
                }

                if (oldAdviser && oldAdviser.profile_photo !== data.profile_photo) {
                    try {
                        await logChange({
                            user_id: adminUser.user_id,
                            user_type: 'admin',
                            action: 'update',
                            table_name: 'advisers',
                            record_id: id,
                            field_name: 'profile_photo',
                            old_value: oldAdviser.profile_photo ? 'Base64 image data' : 'None',
                            new_value: data.profile_photo ? 'Base64 image data' : 'Removed'
                        });
                    } catch (error) {
                        console.error('Failed to log adviser profile photo change:', error);
                    }
                }

                loadAdvisers(true);
            }
        });
    };

    window.viewAdviser = async (id) => {
        await openViewAdviserModal(id);
    };

    window.deleteAdviser = (id, deleteLabel) => {
        openConfirmDialog({
            title: 'Confirm Delete',
            message: `Are you sure you want to delete ${deleteLabel || 'this adviser'}?`,
            confirmText: 'Delete',
            cancelText: 'Cancel',
            type: 'danger',
            showReason: true,
            onConfirm: async (reason) => {
                try {
                    const oldAdviser = advisers.find(a => a.id === id);
                    await AdviserAPI.deleteAdviser(id, reason);

                    try {
                        await logChange({
                            user_id: adminUser.user_id,
                            user_type: 'admin',
                            action: 'delete',
                            table_name: 'advisers',
                            record_id: id,
                            field_name: 'all',
                            old_value: `Adviser: ${oldAdviser?.name || 'Unknown'}`,
                            new_value: null
                        });
                    } catch (error) {
                        console.error('Failed to log adviser deletion:', error);
                    }

                    loadAdvisers(true);
                    showToast('Adviser deleted successfully', 'success');
                } catch (error) {
                    console.error('Error deleting adviser:', error);
                    showToast('Failed to delete adviser', 'error');
                }
            }
        });
    };

    document.getElementById('adviserSearch').addEventListener('input', (e) => {
        const searchTerm = e.target.value.toLowerCase();
        const filtered = advisers.filter(adviser =>
            adviser.name.toLowerCase().includes(searchTerm) ||
            adviser.username.toLowerCase().includes(searchTerm) ||
            adviser.email.toLowerCase().includes(searchTerm)
        );
        renderAdvisers(filtered, { animate: false });
    });

    async function loadStudents(forceRefresh = false) {
        if (!forceRefresh) {
            try {
                const cachedData = await CacheService.get('cachedStudents');
                if (cachedData && Array.isArray(cachedData) && cachedData.length > 0) {
                    students = cachedData;
                    renderStudents(students);
                    hasLoadedStudents = true;
                }
            } catch (e) {
                console.error('Error reading cached students:', e);
            }
        }

        try {
            const freshData = await StudentsAPI.getAllStudents();
            if (freshData) {
                students = freshData;
                await CacheService.set('cachedStudents', students);
                renderStudents(students);
                hasLoadedStudents = true;
            }
        } catch (error) {
            console.error('Error loading students:', error);
            if (!hasLoadedStudents) {
                renderFailed('studentTableBody', 'studentMobileList', 8, 'Failed to load students');
                showToast('Failed to load students', 'error');
            }
        }
    }

    function renderStudents(data, { animate = true } = {}) {
        const tbody = document.getElementById('studentTableBody');
        const mobile = document.getElementById('studentMobileList');
        if (!tbody || !mobile) return;

        const list = data || [];
        setTabCount('studentsCount', list.length);

        if (!list.length) {
            if (isMobileView()) {
                tbody.innerHTML = '';
                mobile.innerHTML = emptyState('graduation-cap', 'No students found.', 'Use the + button to create the first student.');
            } else {
                mobile.innerHTML = '';
                tbody.innerHTML = `<tr data-domino-enter class="reveal"><td colspan="8">${emptyState('graduation-cap', 'No students found.', 'Tap Add to create the first student.')}</td></tr>`;
            }
            finishRender('studentsSection', animate);
            return;
        }

        if (isMobileView()) {
            tbody.innerHTML = '';
            mobile.innerHTML = list.map((student) => {
                const fullName = `${student.first_name || ''} ${student.last_name || ''}`.trim();
                return mobileCard({
                    photo: userPhoto(student.profile_photo, fullName, 'w-12 h-12'),
                    title: escapeHtml(fullName),
                    subtitle: escapeHtml(student.student_number),
                    badges: `${tonePill(student.program, 'gray')}${tonePill(student.year_level)}`,
                    meta: `${metaRow('Email', escapeHtml(student.email))}${metaRow('Created', formatShortDate(student.created_at))}`,
                    actions: CrudMenu({
                        id: String(student.id),
                        showView: true,
                        onView: 'viewStudent',
                        onEdit: 'editStudent',
                        onDelete: 'deleteStudent',
                        deleteLabel: fullName
                    })
                });
            }).join('');
        } else {
            mobile.innerHTML = '';
            tbody.innerHTML = list.map((student) => {
                const fullName = `${student.first_name || ''} ${student.last_name || ''}`.trim();
                return `
                <tr class="reveal hover:bg-surface/80 transition-colors" data-domino-enter>
                    <td class="px-5 py-4">${userPhoto(student.profile_photo, fullName, 'w-10 h-10')}</td>
                    <td class="px-5 py-4 font-medium text-ink">${escapeHtml(fullName)}</td>
                    <td class="px-5 py-4 text-body">${escapeHtml(student.student_number)}</td>
                    <td class="px-5 py-4 text-body">${escapeHtml(student.program)}</td>
                    <td class="px-5 py-4">${tonePill(student.year_level)}</td>
                    <td class="px-5 py-4 text-body">${escapeHtml(student.email)}</td>
                    <td class="px-5 py-4 text-body">${formatShortDate(student.created_at)}</td>
                    <td class="px-5 py-4 text-center">
                        ${CrudMenu({
                            id: String(student.id),
                            showView: true,
                            onView: 'viewStudent',
                            onEdit: 'editStudent',
                            onDelete: 'deleteStudent',
                            deleteLabel: fullName
                        })}
                    </td>
                </tr>
                `;
            }).join('');
        }

        finishRender('studentsSection', animate);
    }

    document.getElementById('addStudentBtn').addEventListener('click', () => {
        openManageStudentsModal({
            mode: 'add',
            onSubmit: async (id, data) => {
                if (id) {
                    const oldStudent = students.find(s => s.id === id);
                    await StudentsAPI.updateStudent(id, data);

                    const fieldsToLog = ['first_name', 'last_name', 'student_number', 'email', 'program', 'year_level', 'profile_photo'];
                    for (const field of fieldsToLog) {
                        if (oldStudent && oldStudent[field] !== data[field]) {
                            try {
                                await logChange({
                                    user_id: adminUser.user_id,
                                    user_type: 'admin',
                                    action: 'update',
                                    table_name: 'students',
                                    record_id: id,
                                    field_name: field,
                                    old_value: field === 'profile_photo' ? (oldStudent[field] ? 'Base64 image data' : 'None') : (oldStudent[field] || 'None'),
                                    new_value: field === 'profile_photo' ? (data[field] ? 'Base64 image data' : 'Removed') : (data[field] || 'Removed')
                                });
                            } catch (error) {
                                console.error(`Failed to log student ${field} change:`, error);
                            }
                        }
                    }
                } else {
                    const response = await StudentsAPI.createStudent(data);
                    try {
                        await logChange({
                            user_id: adminUser.user_id,
                            user_type: 'admin',
                            action: 'create',
                            table_name: 'students',
                            record_id: response.id,
                            field_name: 'all',
                            old_value: null,
                            new_value: `Student: ${data.first_name} ${data.last_name}`
                        });
                    } catch (error) {
                        console.error('Failed to log student creation:', error);
                    }
                    await CacheService.remove('cachedStudents');
                    loadStudents(true);
                    return response;
                }
                await CacheService.remove('cachedStudents');
                loadStudents(true);
            }
        });
    });

    window.editStudent = (id) => {
        openManageStudentsModal({
            mode: 'edit',
            studentId: id,
            onSubmit: async (id, data) => {
                const oldStudent = students.find(s => s.id === id);
                await StudentsAPI.updateStudent(id, data);

                const fieldsToLog = ['first_name', 'last_name', 'student_number', 'email', 'program', 'year_level', 'profile_photo'];
                for (const field of fieldsToLog) {
                    if (oldStudent && oldStudent[field] !== data[field]) {
                        try {
                            await logChange({
                                user_id: adminUser.user_id,
                                user_type: 'admin',
                                action: 'update',
                                table_name: 'students',
                                record_id: id,
                                field_name: field,
                                old_value: field === 'profile_photo' ? (oldStudent[field] ? 'Base64 image data' : 'None') : (oldStudent[field] || 'None'),
                                new_value: field === 'profile_photo' ? (data[field] ? 'Base64 image data' : 'Removed') : (data[field] || 'Removed')
                            });
                        } catch (error) {
                            console.error(`Failed to log student ${field} change:`, error);
                        }
                    }
                }

                await CacheService.remove('cachedStudents');
                loadStudents(true);
            }
        });
    };

    window.viewStudent = async (id) => {
        await openViewStudentsModal(id);
    };

    window.deleteStudent = (id, deleteLabel) => {
        openConfirmDialog({
            title: 'Confirm Delete',
            message: `Are you sure you want to delete ${deleteLabel || 'this student'}?`,
            confirmText: 'Delete',
            cancelText: 'Cancel',
            type: 'danger',
            showReason: true,
            onConfirm: async (reason) => {
                try {
                    const oldStudent = students.find(s => s.id === id);
                    await StudentsAPI.deleteStudent(id, reason);

                    try {
                        await logChange({
                            user_id: adminUser.user_id,
                            user_type: 'admin',
                            action: 'delete',
                            table_name: 'students',
                            record_id: id,
                            field_name: 'all',
                            old_value: `Student: ${oldStudent?.first_name} ${oldStudent?.last_name || 'Unknown'}`,
                            new_value: null
                        });
                    } catch (error) {
                        console.error('Failed to log student deletion:', error);
                    }

                    loadStudents(true);
                    showToast('Student deleted successfully', 'success');
                } catch (error) {
                    console.error('Error deleting student:', error);
                    showToast('Failed to delete student', 'error');
                }
            }
        });
    };

    document.getElementById('studentSearch').addEventListener('input', (e) => {
        const searchTerm = e.target.value.toLowerCase();
        const filtered = students.filter(student =>
            `${student.first_name} ${student.last_name}`.toLowerCase().includes(searchTerm) ||
            student.student_number.toLowerCase().includes(searchTerm) ||
            student.email.toLowerCase().includes(searchTerm) ||
            student.program.toLowerCase().includes(searchTerm)
        );
        renderStudents(filtered, { animate: false });
    });

    async function loadRoles(forceRefresh = false) {
        if (!forceRefresh) {
            try {
                const cachedData = await CacheService.get('cachedRoles');
                if (cachedData && Array.isArray(cachedData) && cachedData.length > 0) {
                    roles = cachedData;
                    renderRoles(roles);
                    hasLoadedRoles = true;
                }
            } catch (e) {
                console.error('Error reading cached roles:', e);
            }
        }

        try {
            const freshData = await RolesAPI.getAllRoles();
            if (freshData) {
                roles = freshData;
                await CacheService.set('cachedRoles', roles);
                renderRoles(roles);
                hasLoadedRoles = true;
            }
        } catch (error) {
            console.error('Error loading roles:', error);
            if (!hasLoadedRoles) {
                renderFailed('roleTableBody', 'roleMobileList', 6, 'Failed to load roles');
                showToast('Failed to load roles', 'error');
            }
        }
    }

    function renderRoles(data, { animate = true } = {}) {
        const tbody = document.getElementById('roleTableBody');
        const mobile = document.getElementById('roleMobileList');
        if (!tbody || !mobile) return;

        const list = data || [];
        setTabCount('rolesCount', list.length);

        if (!list.length) {
            if (isMobileView()) {
                tbody.innerHTML = '';
                mobile.innerHTML = emptyState('key-round', 'No roles found.', 'Use the + button to create the first role.');
            } else {
                mobile.innerHTML = '';
                tbody.innerHTML = `<tr data-domino-enter class="reveal"><td colspan="6">${emptyState('key-round', 'No roles found.', 'Tap Add to create the first role.')}</td></tr>`;
            }
            finishRender('rolesSection', animate);
            return;
        }

        if (isMobileView()) {
            tbody.innerHTML = '';
            mobile.innerHTML = list.map((role) => {
                const userCount = role.users ? role.users.length : 0;
                return mobileCard({
                    photo: `<div class="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0"><i data-lucide="key-round" class="w-5 h-5"></i></div>`,
                    title: escapeHtml(role.role_name),
                    subtitle: `${userCount} linked user${userCount !== 1 ? 's' : ''}`,
                    badges: tonePill(`${userCount} user${userCount !== 1 ? 's' : ''}`),
                    meta: `${metaRow('Created', formatShortDate(role.created_at))}${metaRow('Updated', formatShortDate(role.updated_at))}`,
                    actions: CrudMenu({
                        id: String(role.id),
                        showView: true,
                        onView: 'viewRole',
                        onEdit: 'editRole',
                        onDelete: 'deleteRole',
                        deleteLabel: role.role_name
                    })
                });
            }).join('');
        } else {
            mobile.innerHTML = '';
            tbody.innerHTML = list.map((role, index) => {
                const userCount = role.users ? role.users.length : 0;
                return `
                <tr class="reveal hover:bg-surface/80 transition-colors" data-domino-enter>
                    <td class="px-5 py-4 text-center text-muted">${index + 1}</td>
                    <td class="px-5 py-4 font-medium text-ink">${escapeHtml(role.role_name)}</td>
                    <td class="px-5 py-4">${tonePill(`${userCount} user${userCount !== 1 ? 's' : ''}`)}</td>
                    <td class="px-5 py-4 text-body">${formatShortDate(role.created_at)}</td>
                    <td class="px-5 py-4 text-body">${formatShortDate(role.updated_at)}</td>
                    <td class="px-5 py-4 text-center">
                        ${CrudMenu({
                            id: String(role.id),
                            showView: true,
                            onView: 'viewRole',
                            onEdit: 'editRole',
                            onDelete: 'deleteRole',
                            deleteLabel: role.role_name
                        })}
                    </td>
                </tr>
                `;
            }).join('');
        }

        finishRender('rolesSection', animate);
    }

    document.getElementById('addRoleBtn').addEventListener('click', () => {
        openManageRolesModal({
            mode: 'add',
            onSubmit: async (id, data) => {
                if (id) {
                    const oldRole = roles.find(r => r.id === id);
                    await RolesAPI.updateRole(id, data);

                    const fieldsToLog = ['role_name', 'description'];
                    for (const field of fieldsToLog) {
                        if (oldRole && oldRole[field] !== data[field]) {
                            try {
                                await logChange({
                                    user_id: adminUser.user_id,
                                    user_type: 'admin',
                                    action: 'update',
                                    table_name: 'roles',
                                    record_id: id,
                                    field_name: field,
                                    old_value: oldRole[field] || 'None',
                                    new_value: data[field] || 'Removed'
                                });
                            } catch (error) {
                                console.error(`Failed to log role ${field} change:`, error);
                            }
                        }
                    }
                } else {
                    const response = await RolesAPI.createRole(data);
                    try {
                        await logChange({
                            user_id: adminUser.user_id,
                            user_type: 'admin',
                            action: 'create',
                            table_name: 'roles',
                            record_id: response.id,
                            field_name: 'all',
                            old_value: null,
                            new_value: `Role: ${data.role_name}`
                        });
                    } catch (error) {
                        console.error('Failed to log role creation:', error);
                    }
                }
                loadRoles(true);
            }
        });
    });

    window.editRole = (id) => {
        openManageRolesModal({
            mode: 'edit',
            roleId: id,
            onSubmit: async (id, data) => {
                const oldRole = roles.find(r => r.id === id);
                await RolesAPI.updateRole(id, data);

                const fieldsToLog = ['role_name', 'description'];
                for (const field of fieldsToLog) {
                    if (oldRole && oldRole[field] !== data[field]) {
                        try {
                            await logChange({
                                user_id: adminUser.user_id,
                                user_type: 'admin',
                                action: 'update',
                                table_name: 'roles',
                                record_id: id,
                                field_name: field,
                                old_value: oldRole[field] || 'None',
                                new_value: data[field] || 'Removed'
                            });
                        } catch (error) {
                            console.error(`Failed to log role ${field} change:`, error);
                        }
                    }
                }

                loadRoles(true);
            }
        });
    };

    window.viewRole = async (id) => {
        await openViewRolesModal(id);
    };

    window.deleteRole = (id, deleteLabel) => {
        openConfirmDialog({
            title: 'Confirm Delete',
            message: `Are you sure you want to delete ${deleteLabel || 'this role'}?`,
            confirmText: 'Delete',
            cancelText: 'Cancel',
            type: 'danger',
            onConfirm: async () => {
                try {
                    const oldRole = roles.find(r => r.id === id);
                    await RolesAPI.deleteRole(id);

                    try {
                        await logChange({
                            user_id: adminUser.user_id,
                            user_type: 'admin',
                            action: 'delete',
                            table_name: 'roles',
                            record_id: id,
                            field_name: 'all',
                            old_value: `Role: ${oldRole?.role_name || 'Unknown'}`,
                            new_value: null
                        });
                    } catch (error) {
                        console.error('Failed to log role deletion:', error);
                    }

                    loadRoles(true);
                    showToast('Role deleted successfully', 'success');
                } catch (error) {
                    console.error('Error deleting role:', error);
                    showToast('Failed to delete role', 'error');
                }
            }
        });
    };

    document.getElementById('roleSearch').addEventListener('input', (e) => {
        const searchTerm = e.target.value.toLowerCase();
        const filtered = roles.filter(role =>
            role.role_name.toLowerCase().includes(searchTerm)
        );
        renderRoles(filtered, { animate: false });
    });

    function renderFailed(tableId, mobileId, colSpan, message) {
        const tbody = document.getElementById(tableId);
        const mobile = document.getElementById(mobileId);
        if (tbody) {
            tbody.innerHTML = `<tr><td colspan="${colSpan}" class="px-5 py-12 text-center text-danger">${escapeHtml(message)}</td></tr>`;
        }
        if (mobile) {
            mobile.innerHTML = `<div class="rounded-2xl border border-red-100 bg-white p-6 text-center text-sm text-danger">${escapeHtml(message)}</div>`;
        }
    }

    let lastMobileView = isMobileView();
    window.addEventListener('resize', () => {
        const next = isMobileView();
        if (next === lastMobileView) return;
        lastMobileView = next;
        if (hasLoadedAdmins) document.getElementById('adminSearch')?.dispatchEvent(new Event('input'));
        if (hasLoadedAdvisers) document.getElementById('adviserSearch')?.dispatchEvent(new Event('input'));
        if (hasLoadedStudents) document.getElementById('studentSearch')?.dispatchEvent(new Event('input'));
        if (hasLoadedRoles) document.getElementById('roleSearch')?.dispatchEvent(new Event('input'));
    });

    loadAdmins();
    loadAdvisers();
    loadStudents();
    loadRoles();
}

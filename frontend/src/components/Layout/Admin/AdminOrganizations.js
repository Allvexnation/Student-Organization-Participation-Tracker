import { AdminNavbar, initAdminNavbar } from '../../../components/Navbar/AdminNavbar.js';
import { protectAdminRoute } from '../../../middleware/AdminMiddleware.js';
import * as OrganizationsAPI from '../../../api/admin/Organizations/ManageOrganizations.js';
import * as OrgMembershipsAPI from '../../../api/admin/OrgMemberships/ManageOrgMemberships.js';
import { CacheService } from '../../../../cache/CacheService.js';
import { openManageOrgsModal, openViewOrgsModal } from '../../../components/Modal/ManageOrgsModal.js';
import { openManageOrgMemModal, openViewOrgMemModal } from '../../../components/Modal/ManageOrgMemModal.js';
import { openConfirmDialog } from '../../../components/Dialog/ConfirmDialog.js';
import { showToast } from '../../../components/ToastMessage.js';
import { CrudMenu } from '../../../components/CrudMenu.js';
import { skeletonTableRows } from '../../../components/SkeletonLoading.js';
import { logChange } from '../../../api/AuditLogs/AuditLogs.js';
import { getUserId, getUserData } from '../../../utils/jwt.js';
import { initAdminOrganizationsAnimations, animateDominoList } from '../../../provider/Animation/AdminOrganizationsAnimation.js';

const TABS = ['organizations', 'memberships'];
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

function tonePill(label, tone = 'blue') {
    const tones = {
        blue: 'bg-blue-50 text-blue-600 border-blue-100',
        green: 'bg-emerald-50 text-emerald-700 border-emerald-200',
        red: 'bg-red-50 text-red-700 border-red-200',
        gray: 'bg-slate-50 text-slate-600 border-slate-200',
    };
    return `<span class="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium border ${tones[tone] || tones.blue}">${escapeHtml(label)}</span>`;
}

function statusPill(status) {
    const value = String(status || '—');
    const lower = value.toLowerCase();
    const tone = lower === 'active' ? 'green' : lower === 'inactive' ? 'gray' : 'red';
    return tonePill(value, tone);
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
        <div class="org-mobile-card rounded-[1.35rem] border border-line bg-white/90 overflow-hidden">
            <div class="org-mobile-card-band"></div>
            <div class="p-4">
                <div class="flex items-center gap-3">
                    <div class="w-12 h-12 rounded-2xl skeleton-shimmer shrink-0"></div>
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
        </div>
    `).join('');
}

function toolbar({ searchId, addId, placeholder }) {
    return `
        <div class="org-toolbar reveal mb-4 md:mb-5" data-domino-enter>
            <div class="flex items-center gap-2.5">
                <div class="relative flex-1 md:flex-none">
                    <i data-lucide="search" class="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted"></i>
                    <input
                        type="search"
                        id="${searchId}"
                        placeholder="${placeholder}"
                        class="w-full md:w-80 pl-9 pr-3 py-2.5 text-sm border border-line rounded-2xl md:rounded-xl bg-white/95 text-ink placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-blue-600/15 focus:border-blue-600">
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
            class="orgs-tab flex flex-col md:flex-row items-center justify-center gap-1 md:gap-2 rounded-2xl md:rounded-xl px-2 py-3 md:px-4 md:py-2.5 text-[11px] md:text-sm font-semibold transition-colors ${state}">
            <span class="relative">
                <i data-lucide="${icon}" class="w-4 h-4"></i>
                <span id="${countId}" class="md:hidden absolute -top-2 -right-2 min-w-[16px] h-4 px-1 rounded-full bg-yellow text-[9px] font-bold text-blue-600 leading-4 text-center">0</span>
            </span>
            <span>${label}</span>
            <span id="${countId}Desktop" class="hidden md:inline-flex min-w-[1.25rem] h-5 px-1.5 items-center justify-center rounded-full bg-yellow text-[11px] font-bold text-blue-600">0</span>
        </button>
    `;
}

function orgMonogram(code) {
    const text = String(code || 'ORG').slice(0, 3).toUpperCase();
    return `<div class="w-12 h-12 rounded-2xl bg-blue-600 text-white flex items-center justify-center font-semibold text-xs tracking-wide shadow-sm shrink-0">${escapeHtml(text)}</div>`;
}

function metaTile(label, value) {
    return `
        <div class="rounded-xl bg-surface border border-line px-3 py-2.5 min-w-0">
            <div class="text-[10px] uppercase tracking-[0.12em] text-muted">${label}</div>
            <div class="text-xs font-semibold text-ink mt-0.5 truncate">${value}</div>
        </div>
    `;
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

function updateSummary(organizations, memberships) {
    const orgCount = organizations.length;
    const activeCount = organizations.filter((org) => String(org.status || '').toLowerCase() === 'active').length;
    const memCount = memberships.length;
    const setText = (id, value) => {
        const el = document.getElementById(id);
        if (el) el.textContent = String(value);
    };
    setText('orgsStatTotal', orgCount);
    setText('orgsStatActive', activeCount);
    setText('orgsStatMembers', memCount);
}

export function AdminOrganizations() {
    return `
        <div id="admin-orgs-page" data-domino-page class="min-h-screen bg-surface font-sans text-ink pb-28 md:pb-8">
            ${AdminNavbar()}
            <main class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5 sm:py-8">
                <header class="reveal mb-5 sm:mb-7" data-domino-enter>
                    <span class="inline-flex items-center gap-2 rounded-full border border-line bg-white px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-blue-600">
                        <span class="h-1.5 w-1.5 rounded-full bg-yellow"></span>
                        Organization directory
                    </span>
                    <div class="mt-3 min-w-0">
                        <h1 class="text-[1.65rem] sm:text-3xl font-semibold tracking-tight text-ink leading-tight">Manage Organizations</h1>
                        <p class="mt-1.5 max-w-2xl text-sm text-body">Create student organizations, assign advisers, and keep memberships current.</p>
                    </div>
                </header>

                <section class="reveal mb-5 sm:mb-6 grid grid-cols-3 gap-2 sm:gap-3" data-domino-enter>
                    <div class="org-stat-chip rounded-2xl border border-line bg-white p-3 sm:p-4">
                        <p class="text-[10px] sm:text-[11px] uppercase tracking-[0.12em] text-muted">Organizations</p>
                        <p id="orgsStatTotal" class="mt-1 text-lg sm:text-2xl font-semibold text-ink">0</p>
                    </div>
                    <div class="org-stat-chip rounded-2xl border border-line bg-white p-3 sm:p-4">
                        <p class="text-[10px] sm:text-[11px] uppercase tracking-[0.12em] text-muted">Active</p>
                        <p id="orgsStatActive" class="mt-1 text-lg sm:text-2xl font-semibold text-blue-600">0</p>
                    </div>
                    <div class="org-stat-chip rounded-2xl border border-line bg-white p-3 sm:p-4">
                        <p class="text-[10px] sm:text-[11px] uppercase tracking-[0.12em] text-muted">Memberships</p>
                        <p id="orgsStatMembers" class="mt-1 text-lg sm:text-2xl font-semibold text-ink">0</p>
                    </div>
                </section>

                <div class="reveal mb-5 sm:mb-6" data-domino-enter>
                    <nav class="orgs-tab-bar grid grid-cols-2 gap-1 p-1 rounded-2xl border border-line bg-white/90 md:flex md:items-center md:gap-1 md:w-fit" aria-label="Organization views">
                        ${tabButton({ id: 'organizationsTab', tab: 'organizations', icon: 'building-2', label: 'Organizations', countId: 'orgsCount', active: true })}
                        ${tabButton({ id: 'membershipsTab', tab: 'memberships', icon: 'users', label: 'Memberships', countId: 'membershipsCount' })}
                    </nav>
                </div>

                <section id="organizationsSection">
                    ${toolbar({ searchId: 'orgSearch', addId: 'addOrgBtn', placeholder: 'Search organizations...' })}
                    ${desktopTable({
                        bodyId: 'orgTableBody',
                        colSpan: 6,
                        headers: `
                            <th class="px-5 py-3.5">Code</th>
                            <th class="px-5 py-3.5">Name</th>
                            <th class="px-5 py-3.5">Adviser</th>
                            <th class="px-5 py-3.5">Status</th>
                            <th class="px-5 py-3.5">Created</th>
                            <th class="px-5 py-3.5 text-center w-28">Actions</th>
                        `
                    })}
                    <div id="orgMobileList" class="md:hidden org-mobile-stack space-y-3">${skeletonCards()}</div>
                </section>

                <section id="membershipsSection" class="hidden">
                    ${toolbar({ searchId: 'orgMemSearch', addId: 'addOrgMemBtn', placeholder: 'Search memberships...' })}
                    ${desktopTable({
                        bodyId: 'orgMemTableBody',
                        colSpan: 7,
                        headers: `
                            <th class="px-5 py-3.5 w-12 text-center">#</th>
                            <th class="px-5 py-3.5">Student</th>
                            <th class="px-5 py-3.5">Organization</th>
                            <th class="px-5 py-3.5">Position</th>
                            <th class="px-5 py-3.5">Status</th>
                            <th class="px-5 py-3.5">Date Joined</th>
                            <th class="px-5 py-3.5 text-center w-28">Actions</th>
                        `
                    })}
                    <div id="orgMemMobileList" class="md:hidden org-mobile-stack space-y-3">${skeletonCards()}</div>
                </section>
            </main>

            <button
                type="button"
                id="orgsMobileAddBtn"
                class="md:hidden fixed z-30 right-4 bottom-[max(1.25rem,env(safe-area-inset-bottom))] h-14 w-14 rounded-full bg-blue-600 text-white shadow-lift-lg flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-yellow"
                aria-label="Add new">
                <i data-lucide="plus" class="w-6 h-6"></i>
            </button>
        </div>
    `;
}

export async function initAdminOrganizations() {
    protectAdminRoute();
    await initAdminNavbar();
    initAdminOrganizationsAnimations();
    refreshIcons();

    let organizations = [];
    let orgMemberships = [];
    let hasLoadedOrganizations = false;
    let hasLoadedMemberships = false;
    let currentTab = 'organizations';

    const addButtons = {
        organizations: document.getElementById('addOrgBtn'),
        memberships: document.getElementById('addOrgMemBtn'),
    };

    window.switchTab = function(tab) {
        currentTab = tab;
        setTabStyles(tab);
        refreshIcons();

        if (tab === 'organizations' && !hasLoadedOrganizations) loadOrganizations();
        if (tab === 'memberships' && !hasLoadedMemberships) loadOrgMemberships();

        const section = document.getElementById(`${tab}Section`);
        if (section) animateDominoList(section);
    };

    document.getElementById('orgsMobileAddBtn')?.addEventListener('click', () => {
        addButtons[currentTab]?.click();
    });

    async function loadOrganizations(forceRefresh = false) {
        if (!forceRefresh) {
            try {
                const cachedData = await CacheService.get('cachedOrganizations');
                if (cachedData && Array.isArray(cachedData) && cachedData.length > 0) {
                    organizations = cachedData;
                    renderOrganizations(organizations);
                    hasLoadedOrganizations = true;
                    updateSummary(organizations, orgMemberships);
                }
            } catch (e) {
                console.error('Error reading cached organizations:', e);
            }
        }

        try {
            const freshData = await OrganizationsAPI.getAllOrganizations();
            if (freshData) {
                organizations = freshData;
                await CacheService.set('cachedOrganizations', organizations);
                renderOrganizations(organizations);
                hasLoadedOrganizations = true;
                updateSummary(organizations, orgMemberships);
            }
        } catch (error) {
            console.error('Error loading organizations:', error);
            if (!hasLoadedOrganizations) {
                renderFailed('orgTableBody', 'orgMobileList', 6, 'Failed to load organizations');
                showToast('Failed to load organizations', 'error');
            }
        }
    }

    function renderOrganizations(data, { animate = true } = {}) {
        const tbody = document.getElementById('orgTableBody');
        const mobile = document.getElementById('orgMobileList');
        if (!tbody || !mobile) return;

        const list = data || [];
        setTabCount('orgsCount', list.length);

        if (!list.length) {
            if (isMobileView()) {
                tbody.innerHTML = '';
                mobile.innerHTML = emptyState('building-2', 'No organizations found.', 'Use the + button to create the first organization.');
            } else {
                mobile.innerHTML = '';
                tbody.innerHTML = `<tr data-domino-enter class="reveal"><td colspan="6">${emptyState('building-2', 'No organizations found.', 'Click Add New to create the first organization.')}</td></tr>`;
            }
            finishRender('organizationsSection', animate);
            return;
        }

        if (isMobileView()) {
            tbody.innerHTML = '';
            mobile.innerHTML = list.map((org) => `
                <article class="org-mobile-card reveal rounded-[1.35rem] border border-line bg-white overflow-hidden" data-domino-enter>
                    <div class="org-parallax-inner">
                        <div class="org-mobile-card-band"></div>
                        <div class="p-4">
                            <div class="flex items-start gap-3">
                                ${orgMonogram(org.org_code)}
                                <div class="min-w-0 flex-1">
                                    <div class="flex items-start justify-between gap-2">
                                        <div class="min-w-0">
                                            <h3 class="text-sm font-semibold text-ink truncate">${escapeHtml(org.name)}</h3>
                                            <p class="text-[11px] text-muted font-mono mt-0.5">${escapeHtml(org.org_code || '—')}</p>
                                        </div>
                                        ${statusPill(org.status)}
                                    </div>
                                </div>
                            </div>
                            <div class="mt-3.5 grid grid-cols-2 gap-2">
                                ${metaTile('Adviser', escapeHtml(org.adviser || 'N/A'))}
                                ${metaTile('Created', formatShortDate(org.created_at))}
                            </div>
                        </div>
                        <div class="px-3 py-2.5 border-t border-line bg-surface/70 flex justify-end">
                            ${CrudMenu({
                                id: String(org.id),
                                showView: true,
                                onView: 'viewOrg',
                                onEdit: 'editOrg',
                                onDelete: 'deleteOrg',
                                deleteLabel: org.name
                            })}
                        </div>
                    </div>
                </article>
            `).join('');
        } else {
            mobile.innerHTML = '';
            tbody.innerHTML = list.map((org) => `
                <tr class="reveal hover:bg-surface/80 transition-colors" data-domino-enter>
                    <td class="px-5 py-4 font-semibold text-ink font-mono">${escapeHtml(org.org_code)}</td>
                    <td class="px-5 py-4 text-body truncate">${escapeHtml(org.name)}</td>
                    <td class="px-5 py-4 text-body truncate">${escapeHtml(org.adviser || 'N/A')}</td>
                    <td class="px-5 py-4">${statusPill(org.status)}</td>
                    <td class="px-5 py-4 text-body whitespace-nowrap">${formatShortDate(org.created_at)}</td>
                    <td class="px-5 py-4 text-center">
                        ${CrudMenu({
                            id: String(org.id),
                            showView: true,
                            onView: 'viewOrg',
                            onEdit: 'editOrg',
                            onDelete: 'deleteOrg',
                            deleteLabel: org.name
                        })}
                    </td>
                </tr>
            `).join('');
        }

        finishRender('organizationsSection', animate);
    }

    document.getElementById('addOrgBtn').addEventListener('click', () => {
        openManageOrgsModal({
            mode: 'add',
            onSubmit: async (id, data) => {
                if (id) {
                    const oldOrg = organizations.find(o => o.id === id);
                    await OrganizationsAPI.updateOrganization(id, data);
                    const user = getUserData('admin');

                    const fields = ['org_code', 'name', 'description', 'adviser_id', 'status'];
                    for (const field of fields) {
                        if (oldOrg && oldOrg[field] !== data[field]) {
                            let oldValue = oldOrg[field] || null;
                            let newValue = data[field] || null;

                            if (field === 'adviser_id') {
                                oldValue = oldOrg.adviser || oldOrg[field] || 'Unknown';
                                newValue = data.adviser || data[field] || 'Unknown';
                            }

                            await logChange({
                                user_id: getUserId('admin'),
                                user_type: 'admin',
                                user_name: user?.name || user?.email || 'Unknown',
                                action: 'UPDATE',
                                table_name: 'organizations',
                                record_id: id,
                                field_name: field,
                                old_value: oldValue,
                                new_value: newValue
                            });
                        }
                    }
                } else {
                    const result = await OrganizationsAPI.createOrganization(data);
                    const user = getUserData('admin');
                    await logChange({
                        user_id: getUserId('admin'),
                        user_type: 'admin',
                        user_name: user?.name || user?.email || 'Unknown',
                        action: 'CREATE',
                        table_name: 'organizations',
                        record_id: result?.id || null,
                        field_name: 'organization_name',
                        old_value: null,
                        new_value: data.name
                    });
                }
                loadOrganizations(true);
            }
        });
    });

    window.editOrg = (id) => {
        openManageOrgsModal({
            mode: 'edit',
            organizationId: id,
            onSubmit: async (id, data) => {
                const oldOrg = await OrganizationsAPI.getOrganization(id);
                await OrganizationsAPI.updateOrganization(id, data);
                const user = getUserData('admin');

                const fields = ['org_code', 'name', 'description', 'adviser_id', 'status'];
                for (const field of fields) {
                    if (oldOrg[field] !== data[field]) {
                        let oldValue = oldOrg[field] || null;
                        let newValue = data[field] || null;

                        if (field === 'adviser_id') {
                            oldValue = oldOrg.adviser || oldOrg[field] || 'Unknown';
                            newValue = data.adviser || data[field] || 'Unknown';
                        }

                        await logChange({
                            user_id: getUserId('admin'),
                            user_type: 'admin',
                            user_name: user?.name || user?.email || 'Unknown',
                            action: 'UPDATE',
                            table_name: 'organizations',
                            record_id: id,
                            field_name: field,
                            old_value: oldValue,
                            new_value: newValue
                        });
                    }
                }
                loadOrganizations(true);
            }
        });
    };

    window.viewOrg = async (id) => {
        await openViewOrgsModal(id);
    };

    window.deleteOrg = (id, deleteLabel) => {
        openConfirmDialog({
            title: 'Confirm Delete',
            message: `Are you sure you want to delete ${deleteLabel || 'this organization'}?`,
            confirmText: 'Delete',
            cancelText: 'Cancel',
            type: 'danger',
            onConfirm: async () => {
                try {
                    await OrganizationsAPI.deleteOrganization(id);
                    const user = getUserData('admin');
                    await logChange({
                        user_id: getUserId('admin'),
                        user_type: 'admin',
                        user_name: user?.name || user?.email || 'Unknown',
                        action: 'DELETE',
                        table_name: 'organizations',
                        record_id: id,
                        field_name: 'organization_name',
                        old_value: deleteLabel || 'Unknown',
                        new_value: null
                    });
                    loadOrganizations(true);
                    showToast('Organization deleted successfully', 'success');
                } catch (error) {
                    console.error('Error deleting organization:', error);
                    showToast('Failed to delete organization', 'error');
                }
            }
        });
    };

    document.getElementById('orgSearch').addEventListener('input', (e) => {
        const searchTerm = e.target.value.toLowerCase();
        const filtered = organizations.filter((org) =>
            (org.org_code || '').toLowerCase().includes(searchTerm) ||
            (org.name || '').toLowerCase().includes(searchTerm) ||
            (org.adviser || '').toLowerCase().includes(searchTerm) ||
            (org.status || '').toLowerCase().includes(searchTerm)
        );
        renderOrganizations(filtered, { animate: true });
    });

    async function loadOrgMemberships(forceRefresh = false) {
        if (!forceRefresh) {
            try {
                const cachedData = await CacheService.get('cachedOrgMemberships');
                if (cachedData && Array.isArray(cachedData) && cachedData.length > 0) {
                    orgMemberships = cachedData;
                    renderOrgMemberships(orgMemberships);
                    hasLoadedMemberships = true;
                    updateSummary(organizations, orgMemberships);
                }
            } catch (e) {
                console.error('Error reading cached org memberships:', e);
            }
        }

        try {
            const freshData = await OrgMembershipsAPI.getAllOrgMemberships();
            if (freshData) {
                orgMemberships = freshData;
                await CacheService.set('cachedOrgMemberships', orgMemberships);
                renderOrgMemberships(orgMemberships);
                hasLoadedMemberships = true;
                updateSummary(organizations, orgMemberships);
            }
        } catch (error) {
            console.error('Error loading organization memberships:', error);
            if (!hasLoadedMemberships) {
                renderFailed('orgMemTableBody', 'orgMemMobileList', 7, 'Failed to load memberships');
                showToast('Failed to load memberships', 'error');
            }
        }
    }

    function renderOrgMemberships(data, { animate = true } = {}) {
        const tbody = document.getElementById('orgMemTableBody');
        const mobile = document.getElementById('orgMemMobileList');
        if (!tbody || !mobile) return;

        const list = data || [];
        setTabCount('membershipsCount', list.length);

        if (!list.length) {
            if (isMobileView()) {
                tbody.innerHTML = '';
                mobile.innerHTML = emptyState('users', 'No memberships found.', 'Use the + button to create the first membership.');
            } else {
                mobile.innerHTML = '';
                tbody.innerHTML = `<tr data-domino-enter class="reveal"><td colspan="7">${emptyState('users', 'No memberships found.', 'Click Add New to create the first membership.')}</td></tr>`;
            }
            finishRender('membershipsSection', animate);
            return;
        }

        if (isMobileView()) {
            tbody.innerHTML = '';
            mobile.innerHTML = list.map((membership) => {
                const studentName = membership.student_name || 'Unknown';
                const initial = String(studentName).charAt(0).toUpperCase();
                return `
                <article class="org-mobile-card reveal rounded-[1.35rem] border border-line bg-white overflow-hidden" data-domino-enter>
                    <div class="org-parallax-inner">
                        <div class="org-mobile-card-band org-mobile-card-band--mem"></div>
                        <div class="p-4">
                            <div class="flex items-start gap-3">
                                <div class="w-12 h-12 bg-blue-600 text-white rounded-2xl flex items-center justify-center font-semibold text-sm shadow-sm shrink-0">${escapeHtml(initial)}</div>
                                <div class="min-w-0 flex-1">
                                    <div class="flex items-start justify-between gap-2">
                                        <div class="min-w-0">
                                            <h3 class="text-sm font-semibold text-ink truncate">${escapeHtml(studentName)}</h3>
                                            <p class="text-[11px] text-muted truncate mt-0.5">${escapeHtml(membership.organization_name || 'Unknown')}</p>
                                        </div>
                                        ${statusPill(membership.membership_status)}
                                    </div>
                                </div>
                            </div>
                            <div class="mt-3.5 grid grid-cols-2 gap-2">
                                ${metaTile('Position', escapeHtml(membership.role_name || membership.position || 'N/A'))}
                                ${metaTile('Joined', formatShortDate(membership.date_joined))}
                            </div>
                        </div>
                        <div class="px-3 py-2.5 border-t border-line bg-surface/70 flex justify-end">
                            ${CrudMenu({
                                id: String(membership.id),
                                showView: true,
                                onView: 'viewOrgMem',
                                onEdit: 'editOrgMem',
                                onDelete: 'deleteOrgMem',
                                deleteLabel: `${membership.student_name || 'Student'} - ${membership.organization_name || 'Organization'}`
                            })}
                        </div>
                    </div>
                </article>
                `;
            }).join('');
        } else {
            mobile.innerHTML = '';
            tbody.innerHTML = list.map((membership, index) => `
                <tr class="reveal hover:bg-surface/80 transition-colors" data-domino-enter>
                    <td class="px-5 py-4 text-center text-muted">${index + 1}</td>
                    <td class="px-5 py-4 font-semibold text-ink">${escapeHtml(membership.student_name || 'Unknown')}</td>
                    <td class="px-5 py-4 text-body truncate">${escapeHtml(membership.organization_name || 'Unknown')}</td>
                    <td class="px-5 py-4 text-body truncate">${escapeHtml(membership.role_name || 'N/A')}</td>
                    <td class="px-5 py-4">${statusPill(membership.membership_status)}</td>
                    <td class="px-5 py-4 text-body whitespace-nowrap">${formatShortDate(membership.date_joined)}</td>
                    <td class="px-5 py-4 text-center">
                        ${CrudMenu({
                            id: String(membership.id),
                            showView: true,
                            onView: 'viewOrgMem',
                            onEdit: 'editOrgMem',
                            onDelete: 'deleteOrgMem',
                            deleteLabel: `${membership.student_name || 'Student'} - ${membership.organization_name || 'Organization'}`
                        })}
                    </td>
                </tr>
            `).join('');
        }

        finishRender('membershipsSection', animate);
    }

    document.getElementById('addOrgMemBtn').addEventListener('click', () => {
        openManageOrgMemModal({
            mode: 'add',
            onSubmit: async (id, data) => {
                if (id) {
                    const oldMem = await OrgMembershipsAPI.getOrgMembership(id);
                    await OrgMembershipsAPI.updateOrgMembership(id, data);
                    const user = getUserData('admin');

                    const fields = ['student_id', 'organization_id', 'role_id', 'membership_status', 'date_joined'];
                    for (const field of fields) {
                        const oldVal = String(oldMem[field] || '');
                        const newVal = String(data[field] || '');

                        if (oldVal !== newVal) {
                            let oldValue = oldVal;
                            let newValue = newVal;

                            if (field === 'student_id') {
                                oldValue = oldMem.student_name || oldVal || 'Unknown';
                                newValue = data.student_name || newVal || 'Unknown';
                            }
                            if (field === 'organization_id') {
                                oldValue = oldMem.organization_name || oldVal || 'Unknown';
                                newValue = data.organization_name || newVal || 'Unknown';
                            }
                            if (field === 'role_id') {
                                oldValue = oldMem.role_name || oldVal || 'Unknown';
                                newValue = data.role_name || newVal || 'Unknown';
                            }

                            await logChange({
                                user_id: getUserId('admin'),
                                user_type: 'admin',
                                user_name: user?.name || user?.email || 'Unknown',
                                action: 'UPDATE',
                                table_name: 'organization_memberships',
                                record_id: id,
                                field_name: field,
                                old_value: oldValue,
                                new_value: newValue
                            });
                        }
                    }
                } else {
                    const result = await OrgMembershipsAPI.createOrgMembership(data);
                    const user = getUserData('admin');
                    await logChange({
                        user_id: getUserId('admin'),
                        user_type: 'admin',
                        user_name: user?.name || user?.email || 'Unknown',
                        action: 'CREATE',
                        table_name: 'organization_memberships',
                        record_id: result?.id || null,
                        field_name: 'organization_membership',
                        old_value: null,
                        new_value: data.student_name || data.student_id || 'Unknown'
                    });
                }
                loadOrgMemberships(true);
            }
        });
    });

    window.editOrgMem = (id) => {
        openManageOrgMemModal({
            mode: 'edit',
            membershipId: id,
            onSubmit: async (id, data) => {
                const oldMem = await OrgMembershipsAPI.getOrgMembership(id);
                await OrgMembershipsAPI.updateOrgMembership(id, data);
                const user = getUserData('admin');

                const fields = ['student_id', 'organization_id', 'role_id', 'membership_status', 'date_joined'];
                for (const field of fields) {
                    const oldVal = String(oldMem[field] || '');
                    const newVal = String(data[field] || '');

                    if (oldVal !== newVal) {
                        let oldValue = oldVal;
                        let newValue = newVal;

                        if (field === 'student_id') {
                            oldValue = oldMem.student_name || oldVal || 'Unknown';
                            newValue = data.student_name || newVal || 'Unknown';
                        }
                        if (field === 'organization_id') {
                            oldValue = oldMem.organization_name || oldVal || 'Unknown';
                            newValue = data.organization_name || newVal || 'Unknown';
                        }
                        if (field === 'role_id') {
                            oldValue = oldMem.role_name || oldVal || 'Unknown';
                            newValue = data.role_name || newVal || 'Unknown';
                        }

                        await logChange({
                            user_id: getUserId('admin'),
                            user_type: 'admin',
                            user_name: user?.name || user?.email || 'Unknown',
                            action: 'UPDATE',
                            table_name: 'organization_memberships',
                            record_id: id,
                            field_name: field,
                            old_value: oldValue,
                            new_value: newValue
                        });
                    }
                }
                loadOrgMemberships(true);
            }
        });
    };

    window.viewOrgMem = async (id) => {
        await openViewOrgMemModal(id);
    };

    window.deleteOrgMem = (id, deleteLabel) => {
        openConfirmDialog({
            title: 'Confirm Delete',
            message: `Are you sure you want to delete ${deleteLabel || 'this membership'}?`,
            confirmText: 'Delete',
            cancelText: 'Cancel',
            type: 'danger',
            onConfirm: async () => {
                try {
                    await OrgMembershipsAPI.deleteOrgMembership(id);
                    const user = getUserData('admin');
                    await logChange({
                        user_id: getUserId('admin'),
                        user_type: 'admin',
                        user_name: user?.name || user?.email || 'Unknown',
                        action: 'DELETE',
                        table_name: 'organization_memberships',
                        record_id: id,
                        field_name: 'organization_membership',
                        old_value: deleteLabel || 'Unknown',
                        new_value: null
                    });
                    loadOrgMemberships(true);
                    showToast('Membership deleted successfully', 'success');
                } catch (error) {
                    console.error('Error deleting membership:', error);
                    showToast('Failed to delete membership', 'error');
                }
            }
        });
    };

    document.getElementById('orgMemSearch').addEventListener('input', (e) => {
        const searchTerm = e.target.value.toLowerCase();
        const filtered = orgMemberships.filter((membership) =>
            (membership.student_name || '').toLowerCase().includes(searchTerm) ||
            (membership.organization_name || '').toLowerCase().includes(searchTerm) ||
            (membership.role_name || '').toLowerCase().includes(searchTerm) ||
            (membership.position || '').toLowerCase().includes(searchTerm) ||
            (membership.membership_status || '').toLowerCase().includes(searchTerm)
        );
        renderOrgMemberships(filtered, { animate: true });
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
        if (hasLoadedOrganizations) document.getElementById('orgSearch')?.dispatchEvent(new Event('input'));
        if (hasLoadedMemberships) document.getElementById('orgMemSearch')?.dispatchEvent(new Event('input'));
    });

    loadOrganizations();
    loadOrgMemberships();
}

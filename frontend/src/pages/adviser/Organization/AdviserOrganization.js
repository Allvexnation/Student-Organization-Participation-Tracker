import { AdviserNavbar, initAdviserNavbar } from '../../../components/Navbar/AdviserNavbar.js';
import { isAuthenticated, getUserData, getUserId } from '../../../utils/jwt.js';
import { navigate } from '../../../utils/navigation.js';
import * as AdviserOrganizationAPI from '../../../api/adviser/Organization/AdviserOrganization.js';
import { openAdviserOrgMemModal, openEditOrgModal, openSwitchOrgModal } from '../../../components/Modal/Adviser/AdviserOrganizationModal.js';
import { showToast } from '../../../components/ToastMessage.js';
import { CrudMenu } from '../../../components/CrudMenu.js';
import { skeletonTableRows } from '../../../components/SkeletonLoading.js';
import { openConfirmDialog } from '../../../components/Dialog/ConfirmDialog.js';
import { logAdviserChange } from '../../../api/AuditLogs/AdviserAuditLogs.js';
import { initAdviserOrganizationAnimations, animateDominoList } from '../../../provider/Animation/adviser/AdviserOrganizationAnimation.js';

function skeletonMemberCards(count = 4) {
    return Array.from({ length: count }, () => `
        <div class="org-mobile-card rounded-2xl border border-line bg-white/90 p-4" style="backdrop-filter: blur(12px); -webkit-backdrop-filter: blur(12px);">
            <div class="flex items-center gap-3">
                <div class="w-12 h-12 rounded-2xl skeleton-shimmer shrink-0"></div>
                <div class="flex-1 space-y-2 min-w-0">
                    <div class="h-4 w-36 skeleton-shimmer rounded"></div>
                    <div class="h-3 w-24 skeleton-shimmer rounded"></div>
                </div>
                <div class="h-6 w-16 skeleton-shimmer rounded-full"></div>
            </div>
            <div class="mt-4 grid grid-cols-3 gap-2">
                <div class="h-14 skeleton-shimmer rounded-xl"></div>
                <div class="h-14 skeleton-shimmer rounded-xl"></div>
                <div class="h-14 skeleton-shimmer rounded-xl"></div>
            </div>
            <div class="mt-3 h-10 skeleton-shimmer rounded-xl"></div>
        </div>
    `).join('');
}

function skeletonOrgHero() {
    return `
        <div class="flex flex-col xl:flex-row xl:items-start xl:justify-between gap-4">
            <div class="min-w-0 flex-1 animate-pulse space-y-3">
                <div class="flex items-center gap-2">
                    <div class="h-5 w-24 rounded-full bg-white/15"></div>
                    <div class="h-5 w-16 rounded-full bg-white/10"></div>
                </div>
                <div class="h-6 sm:h-7 w-3/5 max-w-xs rounded-lg bg-white/20"></div>
                <div class="h-3.5 w-4/5 max-w-md rounded bg-white/10"></div>
                <div class="flex flex-wrap gap-2 pt-1">
                    <div class="h-3.5 w-28 rounded bg-white/10"></div>
                    <div class="h-3.5 w-32 rounded bg-white/10"></div>
                </div>
            </div>
            <div class="att-stats-grid att-stats-grid--3 w-full xl:w-auto xl:min-w-[280px] att-stats-loading">
                <div class="att-stat-cell">
                    <div class="att-stat-label text-blue-100/80">Members</div>
                    <div class="att-stat-value">0</div>
                </div>
                <div class="att-stat-cell">
                    <div class="att-stat-label text-emerald-200/90">Active</div>
                    <div class="att-stat-value text-emerald-300">0</div>
                </div>
                <div class="att-stat-cell">
                    <div class="att-stat-label text-amber-200/90">Inactive</div>
                    <div class="att-stat-value text-amber-200">0</div>
                </div>
            </div>
        </div>
    `;
}

function emptyBlock(icon, title, subtitle = '') {
    return `
        <div class="py-12 px-4 text-center">
            <span class="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-surface text-muted mb-3">
                <i data-lucide="${icon}" class="w-6 h-6"></i>
            </span>
            <p class="text-sm font-medium text-ink">${title}</p>
            ${subtitle ? `<p class="text-xs text-muted mt-1 max-w-sm mx-auto">${subtitle}</p>` : ''}
        </div>
    `;
}

function statusBadge(status, onDark = false) {
    const value = status || 'Unknown';
    const key = value.toLowerCase();
    const tone = onDark
        ? (key === 'active'
            ? 'bg-emerald-400/15 text-emerald-200 border-emerald-300/30'
            : key === 'inactive'
                ? 'bg-white/10 text-blue-100 border-white/15'
                : 'bg-rose-400/15 text-rose-200 border-rose-300/30')
        : (key === 'active'
            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
            : key === 'inactive'
                ? 'bg-surface text-body border-line'
                : 'bg-rose-50 text-rose-700 border-rose-200');
    return `<span class="inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-semibold border ${tone}">${value}</span>`;
}

let membersListReady = false;

function finishOrgRender(animate = true) {
    if (typeof lucide !== 'undefined') lucide.createIcons();

    const targets = document.querySelectorAll('#membersTableBody .reveal, #membersMobileList .reveal');
    if (!animate || membersListReady) {
        targets.forEach((el) => el.classList.add('in'));
        membersListReady = true;
        return;
    }

    const isMobile = window.matchMedia('(max-width: 767px)').matches;
    const mobileList = document.getElementById('membersMobileList');
    const desktopPanel = document.getElementById('membersDesktopPanel');

    if (isMobile && mobileList) animateDominoList(mobileList);
    else if (!isMobile && desktopPanel) animateDominoList(desktopPanel);

    membersListReady = true;
}

export function AdviserOrganization() {
    return `
        <div id="adviser-org-page" data-domino-page class="min-h-screen bg-surface font-sans text-ink pb-28 md:pb-10">
            ${AdviserNavbar()}
            <main class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5 sm:py-8">
                <header class="reveal mb-5 sm:mb-7" data-domino-enter>
                    <span class="inline-flex items-center gap-2 rounded-full border border-line bg-white px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-blue-600">
                        <span class="h-1.5 w-1.5 rounded-full bg-yellow"></span>
                        Organization desk
                    </span>
                    <div class="mt-3 flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4">
                        <div class="min-w-0">
                            <h1 class="text-[1.65rem] sm:text-3xl font-semibold tracking-tight text-ink leading-tight">Your Organization</h1>
                            <p class="mt-1.5 max-w-2xl text-sm text-body">Review organization details and manage the students assigned to your current org.</p>
                        </div>
                        <div class="hidden md:flex items-center gap-2.5">
                            <button
                                type="button"
                                id="switchOrgBtn"
                                class="inline-flex items-center justify-center gap-2 px-3.5 py-2.5 text-sm font-medium text-ink bg-white border border-line rounded-xl hover:bg-surface focus:outline-none focus:ring-2 focus:ring-blue-600/20 shadow-sm transition">
                                <i data-lucide="refresh-cw" class="w-4 h-4"></i>
                                <span>Switch Organization</span>
                            </button>
                            <button
                                type="button"
                                id="editOrgBtn"
                                class="inline-flex items-center justify-center gap-2 px-3.5 py-2.5 text-sm font-medium text-white bg-blue-600 hover:bg-blue-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-600/30 shadow-sm transition">
                                <i data-lucide="pencil" class="w-4 h-4"></i>
                                <span>Edit Organization</span>
                            </button>
                        </div>
                    </div>
                </header>

                <section id="orgHeroCard" class="reveal mb-5 sm:mb-6" data-domino-enter>
                    <div class="relative overflow-hidden rounded-2xl border border-blue-600/10 text-white shadow-lift" style="background-image: url('public/Overview1.jpg'); background-size: cover; background-position: center;">
                        <div class="absolute inset-0 bg-blue-900/60 pointer-events-none"></div>
                        <div class="relative p-4 sm:p-5">
                            <div id="orgInfoContent">
                                ${skeletonOrgHero()}
                            </div>
                        </div>
                    </div>
                </section>

                <section class="reveal" data-domino-enter>
                    <div class="mb-3 sm:mb-4 flex flex-col gap-3">
                        <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                            <div class="min-w-0">
                                <h3 class="text-sm font-semibold text-ink tracking-tight">Organization Members</h3>
                                <p class="text-xs text-muted mt-0.5">Search, add, and update students in this organization.</p>
                            </div>
                            <div class="flex items-center gap-2.5">
                                <div class="relative flex-1 sm:flex-none">
                                    <i data-lucide="search" class="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted"></i>
                                    <input
                                        type="search"
                                        id="memberSearch"
                                        placeholder="Search members..."
                                        class="w-full sm:w-64 pl-9 pr-3 py-2.5 text-sm border border-line rounded-xl bg-white text-ink placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-blue-600/15 focus:border-blue-600">
                                </div>
                                <button
                                    type="button"
                                    id="addMemberBtn"
                                    class="hidden md:inline-flex items-center justify-center gap-2 px-3.5 py-2.5 text-sm font-medium text-white bg-blue-600 hover:bg-blue-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-600/30 shadow-sm transition">
                                    <i data-lucide="plus" class="w-4 h-4"></i>
                                    <span>Add Member</span>
                                </button>
                            </div>
                        </div>
                        <div id="memberFilterBar" class="md:hidden flex gap-1 p-1 rounded-2xl border border-line bg-white/80 shadow-sm" style="backdrop-filter: blur(12px); -webkit-backdrop-filter: blur(12px);">
                            <button type="button" data-status-filter="all" class="member-filter-btn flex-1 px-3 py-2 text-xs font-semibold rounded-xl border border-navy text-blue-600 bg-white">All</button>
                            <button type="button" data-status-filter="Active" class="member-filter-btn flex-1 px-3 py-2 text-xs font-medium rounded-xl border border-transparent text-muted">Active</button>
                            <button type="button" data-status-filter="Inactive" class="member-filter-btn flex-1 px-3 py-2 text-xs font-medium rounded-xl border border-transparent text-muted">Inactive</button>
                        </div>
                    </div>

                    <div id="membersDesktopPanel" class="hidden md:block">
                        <div class="bg-white border border-line rounded-2xl shadow-sm overflow-hidden">
                            <div class="overflow-x-auto">
                                <table class="w-full text-sm text-left">
                                    <thead>
                                        <tr class="bg-surface border-b border-line text-[11px] font-semibold text-muted uppercase tracking-[0.14em]">
                                            <th class="px-4 py-3.5 w-12 text-center">#</th>
                                            <th class="px-4 py-3.5 min-w-[200px]">Student</th>
                                            <th class="px-4 py-3.5">Student Number</th>
                                            <th class="px-4 py-3.5">Role</th>
                                            <th class="px-4 py-3.5">Status</th>
                                            <th class="px-4 py-3.5">Date Joined</th>
                                            <th class="px-4 py-3.5 text-center w-28">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody id="membersTableBody" class="divide-y divide-line">
                                        ${skeletonTableRows(4, 7, true)}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>

                    <div id="membersMobileList" class="md:hidden space-y-3">
                        ${skeletonMemberCards()}
                    </div>
                </section>
            </main>

            <div class="md:hidden fixed z-30 left-4 right-4 bottom-[max(1.25rem,env(safe-area-inset-bottom))] flex items-center gap-2">
                <button
                    type="button"
                    id="switchOrgBtnMobile"
                    class="flex-1 h-12 rounded-2xl bg-white/95 border border-line text-ink text-sm font-semibold shadow-lift inline-flex items-center justify-center gap-2" style="backdrop-filter: blur(12px); -webkit-backdrop-filter: blur(12px);">
                    <i data-lucide="refresh-cw" class="w-4 h-4"></i>
                    Switch
                </button>
                <button
                    type="button"
                    id="editOrgBtnMobile"
                    class="flex-1 h-12 rounded-2xl bg-white/95 border border-line text-ink text-sm font-semibold shadow-lift inline-flex items-center justify-center gap-2" style="backdrop-filter: blur(12px); -webkit-backdrop-filter: blur(12px);">
                    <i data-lucide="pencil" class="w-4 h-4"></i>
                    Edit
                </button>
                <button
                    type="button"
                    id="addMemberFab"
                    aria-label="Add Member"
                    class="h-14 w-14 shrink-0 rounded-full bg-blue-600 text-white shadow-lift-lg flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-yellow">
                    <i data-lucide="plus" class="w-6 h-6"></i>
                </button>
            </div>
        </div>
    `;
}

export async function initAdviserOrganization() {
    if (!(await isAuthenticated('adviser'))) {
        navigate('/auth/adviser/login');
        return;
    }
    await initAdviserNavbar();
    initAdviserOrganizationAnimations(document.getElementById('adviser-org-page') || document);

    let organization = null;
    let memberships = [];
    let statusFilter = 'all';

    function updateFilterButtons() {
        document.querySelectorAll('.member-filter-btn').forEach((btn) => {
            const active = btn.dataset.statusFilter === statusFilter;
            btn.classList.toggle('border-blue-600', active);
            btn.classList.toggle('text-blue-600', active);
            btn.classList.toggle('font-semibold', active);
            btn.classList.toggle('bg-white', active);
            btn.classList.toggle('border-transparent', !active);
            btn.classList.toggle('text-muted', !active);
            btn.classList.toggle('font-medium', !active);
        });
    }

    function getFilteredMemberships() {
        const searchTerm = (document.getElementById('memberSearch')?.value || '').toLowerCase();
        return memberships.filter((membership) => {
            const matchesSearch =
                (membership.student_name || '').toLowerCase().includes(searchTerm) ||
                (membership.student_number || '').toLowerCase().includes(searchTerm) ||
                (membership.role_name || '').toLowerCase().includes(searchTerm) ||
                (membership.membership_status || '').toLowerCase().includes(searchTerm);
            const matchesStatus =
                statusFilter === 'all' ||
                (membership.membership_status || '').toLowerCase() === statusFilter.toLowerCase();
            return matchesSearch && matchesStatus;
        });
    }

    function memberCounts(data = memberships) {
        const total = data.length;
        const active = data.filter((m) => (m.membership_status || '').toLowerCase() === 'active').length;
        const inactive = total - active;
        return { total, active, inactive };
    }

    function statsGridHtml(counts) {
        return `
            <div class="att-stats-grid att-stats-grid--3 w-full xl:w-auto xl:min-w-[280px]">
                <div class="att-stat-cell">
                    <div class="att-stat-label text-blue-100/80">Members</div>
                    <div class="att-stat-value">${counts.total}</div>
                </div>
                <div class="att-stat-cell">
                    <div class="att-stat-label text-emerald-200/90">Active</div>
                    <div class="att-stat-value text-emerald-300">${counts.active}</div>
                </div>
                <div class="att-stat-cell">
                    <div class="att-stat-label text-amber-200/90">Inactive</div>
                    <div class="att-stat-value text-amber-200">${counts.inactive}</div>
                </div>
            </div>
        `;
    }

    function renderNoOrganization() {
        const orgInfoContent = document.getElementById('orgInfoContent');
        if (orgInfoContent) {
            orgInfoContent.innerHTML = `
                <div class="text-center py-6 sm:py-8">
                    <div class="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center mx-auto mb-3">
                        <i data-lucide="building-2" class="w-6 h-6 text-yellow"></i>
                    </div>
                    <h3 class="text-base font-semibold">No Organization Assigned</h3>
                    <p class="text-xs text-blue-100/80 mt-1.5 max-w-sm mx-auto">You do not have an organization assigned yet. Contact an administrator or switch if another org is available.</p>
                </div>
            `;
        }

        const tbody = document.getElementById('membersTableBody');
        const mobileList = document.getElementById('membersMobileList');
        const block = emptyBlock('building-2', 'No Organization Assigned', 'Cannot display members because no organization is assigned to you.');
        if (tbody) tbody.innerHTML = `<tr data-domino-enter class="reveal"><td colspan="7">${block}</td></tr>`;
        if (mobileList) mobileList.innerHTML = `<article class="org-mobile-card reveal rounded-2xl border border-line bg-white" data-domino-enter>${block}</article>`;
        finishOrgRender();
    }

    function renderOrganizationInfo(org) {
        const orgInfoContent = document.getElementById('orgInfoContent');
        if (!orgInfoContent) return;

        const createdAt = org.created_at ? new Date(org.created_at).toLocaleDateString('en-PH', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
        }) : 'N/A';
        const counts = memberCounts();
        const initial = (org.name || 'O').charAt(0).toUpperCase();

        orgInfoContent.innerHTML = `
            <div class="flex flex-col xl:flex-row xl:items-start xl:justify-between gap-4">
                <div class="min-w-0 flex-1">
                    <div class="flex items-start gap-3">
                        <div class="hidden md:flex w-14 h-14 rounded-2xl bg-white/10 border border-white/15 items-center justify-center text-xl font-semibold text-yellow shrink-0">${initial}</div>
                        <div class="min-w-0">
                            <div class="flex flex-wrap items-center gap-2 mb-2">
                                <span class="inline-flex items-center gap-2 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-white/10 text-yellow border border-white/15">${org.org_code || 'No code'}</span>
                                ${statusBadge(org.status, true)}
                            </div>
                            <h2 class="text-lg sm:text-xl font-semibold tracking-tight break-words text-white drop-shadow-sm">${org.name || 'Unnamed Organization'}</h2>
                            <p class="text-xs sm:text-sm text-blue-100/90 mt-2 leading-relaxed">${org.description || 'No description provided'}</p>
                            <div class="org-hero-mobile-meta mt-3 sm:mt-4 text-xs text-blue-100/90">
                                <div class="hidden md:flex flex-wrap items-center gap-x-3 gap-y-1.5">
                                    <span class="inline-flex items-center gap-1.5"><i data-lucide="calendar" class="w-3.5 h-3.5 text-yellow shrink-0"></i>${createdAt}</span>
                                </div>
                                <div class="md:hidden">
                                    <div class="text-[10px] uppercase tracking-[0.12em] text-blue-100/70">Code</div>
                                    <div class="mt-0.5 font-semibold truncate">${org.org_code || 'N/A'}</div>
                                </div>
                                <div class="md:hidden">
                                    <div class="text-[10px] uppercase tracking-[0.12em] text-blue-100/70">Created</div>
                                    <div class="mt-0.5 font-semibold truncate">${createdAt}</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                ${statsGridHtml(counts)}
            </div>
        `;

        if (typeof lucide !== 'undefined') lucide.createIcons();
    }

    async function loadOrganization(showSkeleton = false) {
        membersListReady = false;

        if (showSkeleton) {
            const orgInfoContent = document.getElementById('orgInfoContent');
            if (orgInfoContent) {
                orgInfoContent.innerHTML = skeletonOrgHero();
            }
            const tbody = document.getElementById('membersTableBody');
            const mobileList = document.getElementById('membersMobileList');
            if (tbody) tbody.innerHTML = skeletonTableRows(4, 7, true);
            if (mobileList) mobileList.innerHTML = skeletonMemberCards();
        }

        try {
            const org = await AdviserOrganizationAPI.getAdviserOrganization().catch(err => {
                console.error('Error fetching organization:', err);
                return null;
            });

            organization = org;
            if (organization) {
                memberships = await fetchMembershipsForOrg(organization.id);
                renderOrganizationInfo(organization);
                renderMemberships(getFilteredMemberships());
            } else {
                memberships = [];
                renderNoOrganization();
            }
        } catch (error) {
            console.error('Error loading organization data:', error);
            renderNoOrganization();
            showToast('No organization found', 'error');
        }
    }

    async function fetchMembershipsForOrg(orgId) {
        if (!orgId) return [];
        try {
            const byOrg = await AdviserOrganizationAPI.getAdviserOrgMembershipsByOrg(orgId);
            return byOrg || [];
        } catch (err) {
            console.error('Error fetching memberships by organization:', err);
            return AdviserOrganizationAPI.getAdviserOrgMemberships().catch(() => []);
        }
    }

    async function loadMemberships() {
        if (!organization) {
            renderNoOrganization();
            return;
        }

        try {
            memberships = await fetchMembershipsForOrg(organization.id);
            renderOrganizationInfo(organization);
            renderMemberships(getFilteredMemberships(), false);
        } catch (error) {
            console.error('Error loading memberships:', error);
            const tbody = document.getElementById('membersTableBody');
            const mobileList = document.getElementById('membersMobileList');
            const block = emptyBlock('alert-circle', 'Failed to load members');
            if (tbody) tbody.innerHTML = `<tr><td colspan="7">${block}</td></tr>`;
            if (mobileList) mobileList.innerHTML = `<article class="org-mobile-card rounded-2xl border border-line bg-white">${block}</article>`;
            showToast('Failed to load members', 'error');
        }
    }

    function renderMemberships(data, animate = true) {
        const tbody = document.getElementById('membersTableBody');
        const mobileList = document.getElementById('membersMobileList');

        if (!tbody || !mobileList) return;

        if (!organization) {
            renderNoOrganization();
            return;
        }

        if (!data || data.length === 0) {
            const hasSearch = Boolean(document.getElementById('memberSearch')?.value);
            const block = emptyBlock(
                hasSearch || statusFilter !== 'all' ? 'search-x' : 'users',
                hasSearch || statusFilter !== 'all' ? 'No matching members' : 'No members found',
                hasSearch || statusFilter !== 'all' ? 'Try a different search or filter.' : 'Tap Add to add students to your organization.'
            );
            tbody.innerHTML = `<tr data-domino-enter class="reveal"><td colspan="7">${block}</td></tr>`;
            mobileList.innerHTML = `<article class="org-mobile-card reveal rounded-2xl border border-line bg-white" data-domino-enter>${block}</article>`;
            finishOrgRender(animate);
            return;
        }

        let rowsHtml = '';
        let cardsHtml = '';

        data.forEach((membership, index) => {
            const studentName = membership.student_name || 'Unknown';
            const initial = studentName.charAt(0).toUpperCase();
            const photo = membership.profile_photo
                ? `<img src="${membership.profile_photo}" alt="${studentName}" class="w-10 h-10 object-cover rounded-xl">`
                : `<div class="w-10 h-10 bg-blue-600/10 text-blue-600 rounded-xl flex items-center justify-center font-bold text-xs">${initial}</div>`;
            const photoMobile = membership.profile_photo
                ? `<img src="${membership.profile_photo}" alt="${studentName}" class="w-12 h-12 object-cover rounded-2xl">`
                : `<div class="w-12 h-12 bg-blue-600 text-white rounded-2xl flex items-center justify-center font-semibold text-sm shadow-sm">${initial}</div>`;
            const joined = membership.date_joined ? new Date(membership.date_joined).toLocaleDateString() : '—';
            const actions = CrudMenu({
                id: String(membership.id),
                showView: false,
                onEdit: 'editMember',
                onDelete: 'deleteMember',
                deleteLabel: `${studentName}`
            });

            rowsHtml += `
                <tr class="reveal hover:bg-surface/80 transition-colors" data-domino-enter>
                    <td class="px-4 py-3.5 text-center text-xs text-muted font-mono">${index + 1}</td>
                    <td class="px-4 py-3.5">
                        <div class="flex items-center gap-2.5">
                            ${photo}
                            <p class="text-sm font-semibold text-ink truncate">${studentName}</p>
                        </div>
                    </td>
                    <td class="px-4 py-3.5 text-body text-sm font-mono">${membership.student_number || 'N/A'}</td>
                    <td class="px-4 py-3.5 text-body text-sm">${membership.role_name || 'N/A'}</td>
                    <td class="px-4 py-3.5">${statusBadge(membership.membership_status)}</td>
                    <td class="px-4 py-3.5 text-body text-sm whitespace-nowrap">${joined}</td>
                    <td class="px-4 py-3.5 text-center">${actions}</td>
                </tr>
            `;

            cardsHtml += `
                <article class="org-mobile-card reveal rounded-2xl border border-line bg-white overflow-hidden" data-domino-enter>
                    <div class="p-4">
                        <div class="flex items-start gap-3">
                            ${photoMobile}
                            <div class="min-w-0 flex-1">
                                <div class="flex items-start justify-between gap-2">
                                    <div class="min-w-0">
                                        <h3 class="text-sm font-semibold text-ink truncate">${studentName}</h3>
                                        <p class="text-[11px] text-muted font-mono mt-0.5">${membership.student_number || 'No ID'}</p>
                                    </div>
                                    ${statusBadge(membership.membership_status)}
                                </div>
                            </div>
                        </div>
                        <div class="mt-3.5 grid grid-cols-2 gap-2">
                            <div class="rounded-xl bg-surface border border-line px-3 py-2.5 min-w-0">
                                <div class="text-[10px] uppercase tracking-[0.12em] text-muted">Role</div>
                                <div class="text-xs font-semibold text-ink mt-0.5 truncate">${membership.role_name || 'N/A'}</div>
                            </div>
                            <div class="rounded-xl bg-surface border border-line px-3 py-2.5 min-w-0">
                                <div class="text-[10px] uppercase tracking-[0.12em] text-muted">Joined</div>
                                <div class="text-xs font-semibold text-ink mt-0.5 truncate">${joined}</div>
                            </div>
                        </div>
                    </div>
                    <div class="px-3 py-2.5 border-t border-line bg-surface/70 flex justify-end">
                        ${actions}
                    </div>
                </article>
            `;
        });

        tbody.innerHTML = rowsHtml;
        mobileList.innerHTML = cardsHtml;
        finishOrgRender(animate);
    }

    async function handleEditOrg() {
        if (!organization) {
            showToast('No organization to edit', 'error');
            return;
        }
        openEditOrgModal(organization, () => loadOrganization(true), async (formData) => {
            const oldOrg = { ...organization };
            await AdviserOrganizationAPI.updateAdviserOrganization(formData);

            const user = getUserData('adviser');
            const adviserId = getUserId('adviser') || user?.id || user?.user_id;
            const userName = user?.name || user?.username || 'Unknown';

            const fields = ['org_code', 'name', 'description', 'status'];
            for (const field of fields) {
                const oldVal = String(oldOrg[field] || '').trim();
                const newVal = String(formData[field] || '').trim();
                if (oldVal !== newVal) {
                    try {
                        await logAdviserChange({
                            user_id: adviserId,
                            user_type: 'adviser',
                            user_name: userName,
                            action: 'UPDATE',
                            table_name: 'organizations',
                            record_id: oldOrg.id,
                            field_name: field,
                            old_value: oldVal || 'None',
                            new_value: newVal || 'None'
                        }, 'adviser');
                    } catch (err) {
                        console.error(`Failed to log organization change for ${field}:`, err);
                    }
                }
            }
        });
    }

    async function handleSwitchOrg() {
        try {
            const organizations = await AdviserOrganizationAPI.getAdviserAllOrganizations();

            if (!organizations || organizations.length === 0) {
                showToast('No organizations available to switch', 'error');
                return;
            }

            if (organizations.length === 1) {
                showToast('Only one organization available', 'info');
                return;
            }

            const currentOrgId = organization ? organization.id : null;

            const orgOptions = organizations.map(org => ({
                id: org.id,
                name: org.name,
                code: org.org_code,
                status: org.status,
                isCurrent: org.id === currentOrgId
            }));

            openSwitchOrgModal(orgOptions, async (selectedOrgId) => {
                try {
                    const oldOrgName = organization ? organization.name : 'None';
                    const newOrg = organizations.find(o => o.id == selectedOrgId);
                    const newOrgName = newOrg ? newOrg.name : String(selectedOrgId);

                    await AdviserOrganizationAPI.setCurrentAdviserOrganization(selectedOrgId);

                    const user = getUserData('adviser');
                    const adviserId = getUserId('adviser') || user?.id || user?.user_id;
                    const userName = user?.name || user?.username || 'Unknown';

                    try {
                        await logAdviserChange({
                            user_id: adviserId,
                            user_type: 'adviser',
                            user_name: userName,
                            action: 'UPDATE',
                            table_name: 'advisers',
                            record_id: adviserId,
                            field_name: 'current_organization_id',
                            old_value: oldOrgName,
                            new_value: newOrgName
                        }, 'adviser');
                    } catch (err) {
                        console.error('Failed to log switch organization:', err);
                    }

                    showToast('Organization switched successfully', 'success');
                    await loadOrganization(true);
                } catch (error) {
                    console.error('Error switching organization:', error);
                    showToast('Failed to switch organization', 'error');
                }
            });
        } catch (error) {
            console.error('Error loading organizations:', error);
            showToast('Failed to load organizations', 'error');
        }
    }

    function handleAddMember() {
        if (!organization) {
            showToast('No organization to add members to', 'error');
            return;
        }
        const existingMemberIds = memberships.map(m => m.student_id);
        openAdviserOrgMemModal({
            mode: 'add',
            organizationId: organization.id,
            existingMemberIds: existingMemberIds,
            onSubmit: async (id, formData) => {
                const res = await AdviserOrganizationAPI.createAdviserOrgMembership(formData);
                const newRecordId = res?.id || null;

                const user = getUserData('adviser');
                const adviserId = getUserId('adviser') || user?.id || user?.user_id;
                const userName = user?.name || user?.username || 'Unknown';

                const studentLabel = formData.student_name || formData.student_id || 'Student';
                const orgLabel = organization.name || 'Organization';

                try {
                    await logAdviserChange({
                        user_id: adviserId,
                        user_type: 'adviser',
                        user_name: userName,
                        action: 'CREATE',
                        table_name: 'organization_memberships',
                        record_id: newRecordId,
                        field_name: 'organization_membership',
                        old_value: null,
                        new_value: `${studentLabel} - ${orgLabel}`
                    }, 'adviser');
                } catch (err) {
                    console.error('Failed to log membership creation:', err);
                }

                loadMemberships(true);
            }
        });
    }

    document.getElementById('editOrgBtn')?.addEventListener('click', handleEditOrg);
    document.getElementById('editOrgBtnMobile')?.addEventListener('click', handleEditOrg);
    document.getElementById('switchOrgBtn')?.addEventListener('click', handleSwitchOrg);
    document.getElementById('switchOrgBtnMobile')?.addEventListener('click', handleSwitchOrg);
    document.getElementById('addMemberBtn')?.addEventListener('click', handleAddMember);
    document.getElementById('addMemberFab')?.addEventListener('click', handleAddMember);

    window.editMember = (id) => {
        const membership = memberships.find(m => m.id == id);
        if (!membership) return;

        const existingMemberIds = memberships.map(m => m.student_id);
        openAdviserOrgMemModal({
            mode: 'edit',
            membership: membership,
            membershipId: id,
            organizationId: organization.id,
            existingMemberIds: existingMemberIds,
            onSubmit: async (id, formData) => {
                const oldMem = { ...membership };
                await AdviserOrganizationAPI.updateAdviserOrgMembership(id, formData);

                const user = getUserData('adviser');
                const adviserId = getUserId('adviser') || user?.id || user?.user_id;
                const userName = user?.name || user?.username || 'Unknown';

                const normalizeDate = (d) => {
                    if (!d) return '';
                    return String(d).split('T')[0].split(' ')[0].trim();
                };

                const changes = [];

                if (formData.role_id !== undefined && String(oldMem.role_id || '').trim() !== String(formData.role_id || '').trim()) {
                    changes.push({
                        field_name: 'role_id',
                        old_value: oldMem.role_name || String(oldMem.role_id || 'None'),
                        new_value: formData.role_name || String(formData.role_id || 'None')
                    });
                }

                if (formData.membership_status !== undefined && String(oldMem.membership_status || '').trim().toLowerCase() !== String(formData.membership_status || '').trim().toLowerCase()) {
                    changes.push({
                        field_name: 'membership_status',
                        old_value: oldMem.membership_status || 'None',
                        new_value: formData.membership_status || 'None'
                    });
                }

                const oldDate = normalizeDate(oldMem.date_joined);
                const newDate = normalizeDate(formData.date_joined);
                if (formData.date_joined !== undefined && oldDate !== newDate) {
                    changes.push({
                        field_name: 'date_joined',
                        old_value: oldDate || 'None',
                        new_value: newDate || 'None'
                    });
                }

                if (formData.student_id !== undefined && String(oldMem.student_id || '').trim() !== String(formData.student_id || '').trim()) {
                    changes.push({
                        field_name: 'student_id',
                        old_value: oldMem.student_name || String(oldMem.student_id || 'None'),
                        new_value: formData.student_name || String(formData.student_id || 'None')
                    });
                }

                for (const change of changes) {
                    try {
                        await logAdviserChange({
                            user_id: adviserId,
                            user_type: 'adviser',
                            user_name: userName,
                            action: 'UPDATE',
                            table_name: 'organization_memberships',
                            record_id: id,
                            field_name: change.field_name,
                            old_value: change.old_value,
                            new_value: change.new_value
                        }, 'adviser');
                    } catch (err) {
                        console.error(`Failed to log member update for ${change.field_name}:`, err);
                    }
                }

                loadMemberships(true);
            }
        });
    };

    window.deleteMember = (id, deleteLabel) => {
        const memToDelete = memberships.find(m => m.id == id);
        openConfirmDialog({
            title: 'Confirm Delete',
            message: `Are you sure you want to remove ${deleteLabel || 'this member'} from the organization?`,
            confirmText: 'Delete',
            cancelText: 'Cancel',
            type: 'danger',
            onConfirm: async () => {
                try {
                    await AdviserOrganizationAPI.deleteAdviserOrgMembership(id);

                    const user = getUserData('adviser');
                    const adviserId = getUserId('adviser') || user?.id || user?.user_id;
                    const userName = user?.name || user?.username || 'Unknown';
                    const orgLabel = organization?.name || 'Organization';
                    const studentLabel = memToDelete?.student_name || deleteLabel || 'Unknown';

                    try {
                        await logAdviserChange({
                            user_id: adviserId,
                            user_type: 'adviser',
                            user_name: userName,
                            action: 'DELETE',
                            table_name: 'organization_memberships',
                            record_id: id,
                            field_name: 'organization_membership',
                            old_value: `${studentLabel} - ${orgLabel}`,
                            new_value: null
                        }, 'adviser');
                    } catch (err) {
                        console.error('Failed to log member deletion:', err);
                    }

                    loadMemberships(true);
                    showToast('Member removed successfully', 'success');
                } catch (error) {
                    console.error('Error deleting member:', error);
                    showToast('Failed to remove member', 'error');
                }
            }
        });
    };

    document.getElementById('memberSearch')?.addEventListener('input', () => {
        renderMemberships(getFilteredMemberships(), false);
    });

    document.getElementById('memberFilterBar')?.addEventListener('click', (e) => {
        const btn = e.target.closest('[data-status-filter]');
        if (!btn) return;
        statusFilter = btn.dataset.statusFilter || 'all';
        updateFilterButtons();
        renderMemberships(getFilteredMemberships(), false);
    });

    window.closeModal = () => {
        const modal = document.getElementById('modal-overlay');
        if (modal) {
            modal.remove();
        }
    };

    const waitForElement = () => {
        if (document.getElementById('orgInfoContent')) {
            loadOrganization();
        } else {
            setTimeout(waitForElement, 50);
        }
    };
    waitForElement();
}

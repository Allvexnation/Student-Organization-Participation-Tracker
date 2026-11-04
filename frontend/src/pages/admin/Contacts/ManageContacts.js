import { AdminNavbar, initAdminNavbar } from '../../../components/Navbar/AdminNavbar.js';
import { protectAdminRoute } from '../../../middleware/AdminMiddleware.js';
import * as ContactsAPI from '../../../api/Contacts/Contacts.js';
import { showToast } from '../../../components/ToastMessage.js';
import { getAllSupportContacts, getSupportContactById, sendSupportContactReply, getAllReports, getReportById, sendReportReply } from '../../../api/Contacts/Contacts.js';
import { skeletonTableRows } from '../../../components/SkeletonLoading.js';
import { initManageContactsAnimations, animateDominoList } from '../../../provider/Animation/ManageContactsAnimation.js';
import { animateModalOpen, animateModalClose, clearModalAnimations } from '../../../provider/ModalAnimation.js';

const TABS = ['appeals', 'support', 'reports'];
const TAB_ACTIVE_CLASSES = ['bg-blue-600', 'text-white', 'shadow-sm'];
const TAB_IDLE_CLASSES = ['text-muted', 'hover:text-ink', 'hover:bg-surface'];

const STATUS_OPTIONS = {
    appeals: [
        { value: 'pending', label: 'Pending' },
        { value: 'under_review', label: 'Under Review' },
        { value: 'resolved', label: 'Resolved' },
    ],
    support: [
        { value: 'pending', label: 'Pending' },
        { value: 'receive', label: 'Receive' },
        { value: 'under_review', label: 'Under Review' },
        { value: 'resolved', label: 'Resolved' },
    ],
    reports: [
        { value: 'pending', label: 'Pending' },
        { value: 'receive', label: 'Receive' },
        { value: 'under_review', label: 'Under Review' },
        { value: 'resolved', label: 'Resolved' },
    ],
};

function escapeHtml(value) {
    return String(value ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}

function refreshIcons() {
    if (typeof lucide !== 'undefined') lucide.createIcons();
}

function isMobileView() {
    return window.matchMedia('(max-width: 767px)').matches;
}

function formatStatus(status) {
    return String(status || 'unknown').replace(/_/g, ' ').replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function formatDate(dateString) {
    if (!dateString) return '—';
    const date = new Date(dateString);
    if (Number.isNaN(date.getTime())) return '—';
    return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    });
}

function formatShortDate(dateString) {
    if (!dateString) return '—';
    const date = new Date(dateString);
    if (Number.isNaN(date.getTime())) return '—';
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function initials(name) {
    const parts = String(name || '').trim().split(/\s+/).filter(Boolean);
    const letters = `${parts[0]?.[0] || ''}${parts[1]?.[0] || ''}`.toUpperCase();
    return letters || '?';
}

function statusTone(status) {
    switch (status) {
        case 'pending': return { pill: 'bg-yellow-50 text-yellow-800 border-yellow-200', avatar: 'bg-yellow-100 text-yellow-800' };
        case 'receive': return { pill: 'bg-violet-50 text-violet-800 border-violet-200', avatar: 'bg-violet-100 text-violet-800' };
        case 'under_review': return { pill: 'bg-blue-50 text-blue-600 border-blue-100', avatar: 'bg-blue-50 text-blue-600' };
        case 'resolved': return { pill: 'bg-emerald-50 text-emerald-700 border-emerald-200', avatar: 'bg-emerald-50 text-emerald-700' };
        default: return { pill: 'bg-slate-50 text-slate-600 border-slate-200', avatar: 'bg-slate-100 text-slate-600' };
    }
}

function statusPill(status) {
    const value = formatStatus(status);
    return `<span class="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium border ${statusTone(status).pill}">${escapeHtml(value)}</span>`;
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
        <div class="contact-mobile-card rounded-2xl border border-line bg-white/90 p-4">
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

function tabButton({ id, tab, icon, label, countId, active = false }) {
    const state = active
        ? 'bg-blue-600 text-white shadow-sm'
        : 'text-muted hover:text-ink hover:bg-surface';
    return `
        <button
            type="button"
            id="${id}"
            data-tab="${tab}"
            class="contacts-tab flex flex-col md:flex-row items-center justify-center gap-1 md:gap-2 rounded-2xl md:rounded-xl px-2 py-3 md:px-4 md:py-2.5 text-[11px] md:text-sm font-semibold transition-colors ${state}">
            <span class="relative">
                <i data-lucide="${icon}" class="w-4 h-4"></i>
                <span id="${countId}" class="md:hidden absolute -top-2 -right-2 min-w-[16px] h-4 px-1 rounded-full bg-yellow text-[9px] font-bold text-blue-600 leading-4 text-center">0</span>
            </span>
            <span>${label}</span>
            <span id="${countId}Desktop" class="hidden md:inline-flex min-w-[1.25rem] h-5 px-1.5 items-center justify-center rounded-full bg-yellow text-[11px] font-bold text-blue-600">0</span>
        </button>
    `;
}

function statusChips(kind, options) {
    return `
        <div class="contacts-chip-row md:hidden flex gap-2 overflow-x-auto pb-1 -mx-1 px-1" data-chip-group="${kind}">
            <button type="button" data-status="" class="contact-status-chip shrink-0 rounded-full border border-blue-600 bg-blue-600 text-white px-3 py-1.5 text-[11px] font-semibold">All</button>
            ${options.map((option) => `
                <button type="button" data-status="${option.value}" class="contact-status-chip shrink-0 rounded-full border border-line bg-white text-body px-3 py-1.5 text-[11px] font-semibold">${option.label}</button>
            `).join('')}
        </div>
    `;
}

function toolbar({ searchId, filterId, placeholder, kind }) {
    const options = STATUS_OPTIONS[kind];
    return `
        <div class="reveal mb-4 md:mb-5" data-domino-enter>
            <div class="flex flex-col gap-2.5">
                <div class="flex items-center gap-2.5">
                    <div class="relative flex-1 md:flex-none">
                        <i data-lucide="search" class="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted"></i>
                        <input
                            type="search"
                            id="${searchId}"
                            placeholder="${placeholder}"
                            class="w-full md:w-80 pl-9 pr-3 py-2.5 text-sm border border-line rounded-xl bg-white text-ink placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-blue-600/15 focus:border-blue-600">
                    </div>
                    <select
                        id="${filterId}"
                        class="hidden md:block px-3 py-2.5 text-sm border border-line rounded-xl bg-white text-ink focus:outline-none focus:ring-2 focus:ring-blue-600/15 focus:border-blue-600">
                        <option value="">All Status</option>
                        ${options.map((option) => `<option value="${option.value}">${option.label}</option>`).join('')}
                    </select>
                </div>
                ${statusChips(kind, options)}
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

function actionButtons(viewFn, replyFn, id) {
    return `
        <div class="flex items-center justify-end gap-1.5">
            <button type="button" onclick="${viewFn}(${id})" class="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition" title="View details">
                <i data-lucide="eye" class="w-4 h-4"></i>
                <span class="hidden lg:inline">View</span>
            </button>
            <button type="button" onclick="${replyFn}(${id})" class="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-lg transition" title="Reply">
                <i data-lucide="mail" class="w-4 h-4"></i>
                <span class="hidden lg:inline">Reply</span>
            </button>
        </div>
    `;
}

function mobileActions(viewFn, replyFn, id) {
    return `
        <div class="grid grid-cols-2 gap-2 px-3 py-3 border-t border-line bg-surface/80">
            <button type="button" onclick="${viewFn}(${id})" class="inline-flex items-center justify-center gap-2 rounded-xl border border-line bg-white px-3 py-2.5 text-xs font-semibold text-ink">
                <i data-lucide="eye" class="w-4 h-4 text-blue-600"></i>
                View
            </button>
            <button type="button" onclick="${replyFn}(${id})" class="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-3 py-2.5 text-xs font-semibold text-white">
                <i data-lucide="send" class="w-4 h-4"></i>
                Reply
            </button>
        </div>
    `;
}

function contactCard({ item, index, extraLabel, extraValue, viewFn, replyFn }) {
    const tone = statusTone(item.status);
    return `
        <article class="contact-mobile-card reveal rounded-2xl border border-line bg-white overflow-hidden" data-domino-enter data-status="${escapeHtml(item.status || '')}">
            <div class="p-4">
                <div class="flex items-start gap-3">
                    <div class="w-12 h-12 rounded-2xl ${tone.avatar} flex items-center justify-center font-semibold text-sm shrink-0">${escapeHtml(initials(item.name))}</div>
                    <div class="min-w-0 flex-1">
                        <div class="flex items-start justify-between gap-2">
                            <div class="min-w-0">
                                <p class="text-[10px] uppercase tracking-[0.14em] text-muted">Ticket ${index + 1}</p>
                                <h3 class="text-sm font-semibold text-ink truncate mt-0.5">${escapeHtml(item.name)}</h3>
                                <p class="text-[11px] text-muted truncate">${escapeHtml(item.email)}</p>
                            </div>
                            ${statusPill(item.status)}
                        </div>
                    </div>
                </div>
                <p class="mt-3 text-sm text-ink font-medium leading-snug">${escapeHtml(item.subject || '—')}</p>
                <div class="mt-3.5 grid grid-cols-2 gap-2">
                    ${metaTile(extraLabel, extraValue)}
                    ${metaTile('Created', formatShortDate(item.created_at))}
                </div>
            </div>
            ${mobileActions(viewFn, replyFn, item.id)}
        </article>
    `;
}

function replyModal({ id, title, formId, hiddenId, statusId, options, messageId, cancelId, submitId, closeId, backdropId }) {
    return `
        <div id="${id}" class="fixed inset-0 z-50 hidden">
            <div class="fixed inset-0 bg-ink/50" data-modal-overlay id="${backdropId}"></div>
            <div class="fixed inset-0 flex items-end md:items-center justify-center p-0 md:p-4">
                <div class="contacts-modal-panel relative bg-white shadow-lift-lg w-full md:max-w-2xl max-h-[90vh] overflow-y-auto rounded-t-3xl md:rounded-2xl" data-modal-panel>
                    <div class="p-5 sm:p-6">
                        <div class="mx-auto mb-4 h-1 w-12 rounded-full bg-line md:hidden"></div>
                        <div class="flex items-center justify-between mb-5">
                            <div>
                                <p class="text-[11px] uppercase tracking-[0.16em] text-muted">Response</p>
                                <h3 class="text-lg font-semibold text-ink">${title}</h3>
                            </div>
                            <button type="button" id="${closeId}" class="h-9 w-9 inline-flex items-center justify-center rounded-xl text-muted hover:bg-surface hover:text-ink">
                                <i data-lucide="x" class="w-5 h-5"></i>
                            </button>
                        </div>
                        <form id="${formId}" class="space-y-4">
                            <input type="hidden" id="${hiddenId}">
                            <div>
                                <label class="block text-sm font-medium text-ink mb-1.5">Status</label>
                                <select id="${statusId}" class="w-full px-3 py-2.5 border border-line rounded-xl bg-white text-ink focus:outline-none focus:ring-2 focus:ring-blue-600/15 focus:border-blue-600">
                                    ${options.map((option) => `<option value="${option.value}">${option.label}</option>`).join('')}
                                </select>
                            </div>
                            <div>
                                <label class="block text-sm font-medium text-ink mb-1.5">Reply Message</label>
                                <textarea
                                    id="${messageId}"
                                    rows="6"
                                    class="w-full px-3 py-2.5 border border-line rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-600/15 focus:border-blue-600"
                                    placeholder="Enter your response to the user..."
                                    required></textarea>
                            </div>
                            <div class="flex flex-col-reverse sm:flex-row justify-end gap-2 sm:gap-3 pt-1">
                                <button type="button" id="${cancelId}" class="px-4 py-2.5 text-sm font-medium text-ink bg-surface hover:bg-line rounded-xl">Cancel</button>
                                <button type="submit" id="${submitId}" class="px-4 py-2.5 text-sm font-medium text-white bg-blue-600 hover:bg-blue-800 rounded-xl">Send Reply</button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    `;
}

function viewModal({ id, title, contentId, closeId, backdropId }) {
    return `
        <div id="${id}" class="fixed inset-0 z-50 hidden">
            <div class="fixed inset-0 bg-ink/50" data-modal-overlay id="${backdropId}"></div>
            <div class="fixed inset-0 flex items-end md:items-center justify-center p-0 md:p-4">
                <div class="contacts-modal-panel relative bg-white shadow-lift-lg w-full md:max-w-3xl max-h-[90vh] overflow-y-auto rounded-t-3xl md:rounded-2xl" data-modal-panel>
                    <div class="p-5 sm:p-6">
                        <div class="mx-auto mb-4 h-1 w-12 rounded-full bg-line md:hidden"></div>
                        <div class="flex items-center justify-between mb-5">
                            <div>
                                <p class="text-[11px] uppercase tracking-[0.16em] text-muted">Details</p>
                                <h3 class="text-lg font-semibold text-ink">${title}</h3>
                            </div>
                            <button type="button" id="${closeId}" class="h-9 w-9 inline-flex items-center justify-center rounded-xl text-muted hover:bg-surface hover:text-ink">
                                <i data-lucide="x" class="w-5 h-5"></i>
                            </button>
                        </div>
                        <div id="${contentId}"></div>
                    </div>
                </div>
            </div>
        </div>
    `;
}

function detailField(label, value) {
    return `
        <div class="rounded-xl border border-line bg-surface px-3.5 py-3 min-w-0">
            <label class="block text-[10px] uppercase tracking-[0.12em] text-muted">${label}</label>
            <p class="text-sm text-ink mt-1 break-words">${value}</p>
        </div>
    `;
}

function emailHistoryBlock(history) {
    if (!history || !history.length) {
        return '<p class="text-muted text-sm">No emails sent yet</p>';
    }
    return `
        <div class="space-y-2 mt-2">
            ${history.map((email) => `
                <div class="bg-surface border border-line p-3 rounded-xl text-sm">
                    <p class="font-medium text-ink">${escapeHtml(email.subject)}</p>
                    <p class="text-muted text-xs mt-0.5">${formatDate(email.sent_at)}</p>
                </div>
            `).join('')}
        </div>
    `;
}

export function ManageContacts() {
    return `
        <div id="admin-contacts-page" data-domino-page class="min-h-screen bg-surface font-sans text-ink pb-28 md:pb-8">
            ${AdminNavbar()}
            <main class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5 sm:py-8">
                <header class="reveal mb-5 sm:mb-7" data-domino-enter>
                    <span class="inline-flex items-center gap-2 rounded-full border border-line bg-white px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-blue-600">
                        <span class="h-1.5 w-1.5 rounded-full bg-yellow"></span>
                        Inbox
                    </span>
                    <div class="mt-3 min-w-0">
                        <h1 class="text-[1.65rem] sm:text-3xl font-semibold tracking-tight text-ink leading-tight">Manage Contacts</h1>
                        <p class="mt-1.5 max-w-2xl text-sm text-body">Review ban appeals, support inquiries, and problem reports, then send a reply from one place.</p>
                    </div>
                </header>

                <section class="reveal mb-5 sm:mb-6 grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3" data-domino-enter>
                    <div class="contact-stat-chip rounded-2xl border border-line bg-white p-3 sm:p-4">
                        <p class="text-[10px] sm:text-[11px] uppercase tracking-[0.12em] text-muted">Inbox</p>
                        <p id="contactsStatTotal" class="mt-1 text-lg sm:text-2xl font-semibold text-ink">0</p>
                    </div>
                    <div class="contact-stat-chip rounded-2xl border border-line bg-white p-3 sm:p-4">
                        <p class="text-[10px] sm:text-[11px] uppercase tracking-[0.12em] text-muted">Pending</p>
                        <p id="contactsStatPending" class="mt-1 text-lg sm:text-2xl font-semibold text-yellow-700">0</p>
                    </div>
                    <div class="contact-stat-chip rounded-2xl border border-line bg-white p-3 sm:p-4">
                        <p class="text-[10px] sm:text-[11px] uppercase tracking-[0.12em] text-muted">In Review</p>
                        <p id="contactsStatReview" class="mt-1 text-lg sm:text-2xl font-semibold text-blue-600">0</p>
                    </div>
                    <div class="contact-stat-chip rounded-2xl border border-line bg-white p-3 sm:p-4">
                        <p class="text-[10px] sm:text-[11px] uppercase tracking-[0.12em] text-muted">Resolved</p>
                        <p id="contactsStatResolved" class="mt-1 text-lg sm:text-2xl font-semibold text-success">0</p>
                    </div>
                </section>

                <div class="reveal mb-5 sm:mb-6" data-domino-enter>
                    <nav class="contacts-tab-bar grid grid-cols-3 gap-1 p-1 rounded-2xl border border-line bg-white/90 md:flex md:items-center md:gap-1 md:w-fit" aria-label="Contact views">
                        ${tabButton({ id: 'appealsTab', tab: 'appeals', icon: 'shield-alert', label: 'Appeals', countId: 'appealsCount', active: true })}
                        ${tabButton({ id: 'supportTab', tab: 'support', icon: 'life-buoy', label: 'Support', countId: 'supportCount' })}
                        ${tabButton({ id: 'reportsTab', tab: 'reports', icon: 'bug', label: 'Reports', countId: 'reportsCount' })}
                    </nav>
                </div>

                <section id="appealsSection">
                    ${toolbar({ searchId: 'appealSearch', filterId: 'appealStatusFilter', placeholder: 'Search appeals...', kind: 'appeals' })}
                    ${desktopTable({
                        bodyId: 'appealsTableBody',
                        colSpan: 8,
                        headers: `
                            <th class="px-5 py-3.5 w-12 text-center">#</th>
                            <th class="px-5 py-3.5">Name</th>
                            <th class="px-5 py-3.5">Email</th>
                            <th class="px-5 py-3.5">Subject</th>
                            <th class="px-5 py-3.5">Status</th>
                            <th class="px-5 py-3.5">Emails</th>
                            <th class="px-5 py-3.5">Created</th>
                            <th class="px-5 py-3.5 text-center w-36">Actions</th>
                        `
                    })}
                    <div id="appealsMobileList" class="md:hidden space-y-3">${skeletonCards()}</div>
                </section>

                <section id="supportSection" class="hidden">
                    ${toolbar({ searchId: 'supportSearch', filterId: 'supportStatusFilter', placeholder: 'Search contacts...', kind: 'support' })}
                    ${desktopTable({
                        bodyId: 'supportTableBody',
                        colSpan: 8,
                        headers: `
                            <th class="px-5 py-3.5 w-12 text-center">#</th>
                            <th class="px-5 py-3.5">Name</th>
                            <th class="px-5 py-3.5">Email</th>
                            <th class="px-5 py-3.5">Subject</th>
                            <th class="px-5 py-3.5">Status</th>
                            <th class="px-5 py-3.5">Emails</th>
                            <th class="px-5 py-3.5">Created</th>
                            <th class="px-5 py-3.5 text-center w-36">Actions</th>
                        `
                    })}
                    <div id="supportMobileList" class="md:hidden space-y-3">${skeletonCards()}</div>
                </section>

                <section id="reportsSection" class="hidden">
                    ${toolbar({ searchId: 'reportSearch', filterId: 'reportStatusFilter', placeholder: 'Search reports...', kind: 'reports' })}
                    ${desktopTable({
                        bodyId: 'reportsTableBody',
                        colSpan: 8,
                        headers: `
                            <th class="px-5 py-3.5 w-12 text-center">#</th>
                            <th class="px-5 py-3.5">Name</th>
                            <th class="px-5 py-3.5">Email</th>
                            <th class="px-5 py-3.5">Category</th>
                            <th class="px-5 py-3.5">Status</th>
                            <th class="px-5 py-3.5">Emails</th>
                            <th class="px-5 py-3.5">Created</th>
                            <th class="px-5 py-3.5 text-center w-36">Actions</th>
                        `
                    })}
                    <div id="reportsMobileList" class="md:hidden space-y-3">${skeletonCards()}</div>
                </section>
            </main>

            ${replyModal({
                id: 'appealReplyModal',
                title: 'Reply to Appeal',
                formId: 'appealReplyForm',
                hiddenId: 'replyAppealId',
                statusId: 'appealReplyStatus',
                options: STATUS_OPTIONS.appeals,
                messageId: 'appealReplyMessage',
                cancelId: 'cancelAppealReply',
                submitId: 'sendAppealReplyBtn',
                closeId: 'closeAppealReplyModal',
                backdropId: 'appealReplyModalBackdrop',
            })}
            ${replyModal({
                id: 'supportReplyModal',
                title: 'Reply to Support Contact',
                formId: 'supportReplyForm',
                hiddenId: 'replySupportId',
                statusId: 'supportReplyStatus',
                options: STATUS_OPTIONS.support,
                messageId: 'supportReplyMessage',
                cancelId: 'cancelSupportReply',
                submitId: 'sendSupportReplyBtn',
                closeId: 'closeSupportReplyModal',
                backdropId: 'supportReplyModalBackdrop',
            })}
            ${replyModal({
                id: 'reportReplyModal',
                title: 'Reply to Problem Report',
                formId: 'reportReplyForm',
                hiddenId: 'replyReportId',
                statusId: 'reportReplyStatus',
                options: STATUS_OPTIONS.reports,
                messageId: 'reportReplyMessage',
                cancelId: 'cancelReportReply',
                submitId: 'sendReportReplyBtn',
                closeId: 'closeReportReplyModal',
                backdropId: 'reportReplyModalBackdrop',
            })}
            ${viewModal({ id: 'viewAppealModal', title: 'Appeal Details', contentId: 'viewAppealContent', closeId: 'closeViewAppealModal', backdropId: 'viewAppealModalBackdrop' })}
            ${viewModal({ id: 'viewSupportModal', title: 'Support Contact Details', contentId: 'viewSupportContent', closeId: 'closeViewSupportModal', backdropId: 'viewSupportModalBackdrop' })}
            ${viewModal({ id: 'viewReportModal', title: 'Problem Report Details', contentId: 'viewReportContent', closeId: 'closeViewReportModal', backdropId: 'viewReportModalBackdrop' })}
        </div>
    `;
}

export async function initManageContacts() {
    protectAdminRoute();
    await initAdminNavbar();
    initManageContactsAnimations();
    refreshIcons();

    let appeals = [];
    let supportContacts = [];
    let reports = [];
    let hasLoadedAppeals = false;
    let hasLoadedSupport = false;
    let hasLoadedReports = false;
    let lastMobileView = isMobileView();

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
        const section = document.getElementById(sectionId);
        if (!section) return;
        if (animate) {
            animateDominoList(section);
            return;
        }
        section.querySelectorAll('.reveal').forEach((el) => el.classList.add('in'));
    }

    function updateSummary() {
        const all = [...appeals, ...supportContacts, ...reports];
        const setText = (id, value) => {
            const el = document.getElementById(id);
            if (el) el.textContent = String(value);
        };
        setText('contactsStatTotal', all.length);
        setText('contactsStatPending', all.filter((item) => item.status === 'pending').length);
        setText('contactsStatReview', all.filter((item) => item.status === 'under_review' || item.status === 'receive').length);
        setText('contactsStatResolved', all.filter((item) => item.status === 'resolved').length);
        setTabCount('appealsCount', appeals.length);
        setTabCount('supportCount', supportContacts.length);
        setTabCount('reportsCount', reports.length);
    }

    function matchesQuery(item, search) {
        if (!search) return true;
        return [item.name, item.email, item.subject]
            .some((value) => String(value || '').toLowerCase().includes(search));
    }

    function filteredList(source, searchId, filterId) {
        const search = document.getElementById(searchId)?.value.toLowerCase().trim() || '';
        const status = document.getElementById(filterId)?.value || '';
        return source.filter((item) => matchesQuery(item, search) && (!status || item.status === status));
    }

    function syncStatusChips(kind, status) {
        document.querySelectorAll(`[data-chip-group="${kind}"] .contact-status-chip`).forEach((chip) => {
            const active = (chip.dataset.status || '') === status;
            chip.classList.toggle('bg-blue-600', active);
            chip.classList.toggle('text-white', active);
            chip.classList.toggle('border-blue-600', active);
            chip.classList.toggle('bg-white', !active);
            chip.classList.toggle('text-body', !active);
            chip.classList.toggle('border-line', !active);
        });
    }

    function applyFilters(kind, { animate = true } = {}) {
        if (kind === 'appeals') renderAppeals(filteredList(appeals, 'appealSearch', 'appealStatusFilter'), animate);
        if (kind === 'support') renderSupportContacts(filteredList(supportContacts, 'supportSearch', 'supportStatusFilter'), animate);
        if (kind === 'reports') renderReports(filteredList(reports, 'reportSearch', 'reportStatusFilter'), animate);
    }

    window.switchTab = function (tab) {
        setTabStyles(tab);
        if (tab === 'appeals') {
            if (!hasLoadedAppeals) loadAppeals();
            else applyFilters('appeals');
        } else if (tab === 'support') {
            if (!hasLoadedSupport) loadSupportContacts();
            else applyFilters('support');
        } else {
            if (!hasLoadedReports) loadReports();
            else applyFilters('reports');
        }
    };

    async function loadAppeals() {
        try {
            const result = await ContactsAPI.getAllAppeals();
            if (result.data) {
                appeals = result.data;
                hasLoadedAppeals = true;
                updateSummary();
                applyFilters('appeals');
            }
        } catch (error) {
            console.error('Error loading appeals:', error);
            renderFailed('appealsTableBody', 'appealsMobileList', 8, 'Failed to load appeals');
            showToast('Failed to load appeals', 'error');
        }
    }

    async function loadSupportContacts() {
        try {
            const result = await getAllSupportContacts();
            if (result.data) {
                supportContacts = result.data;
                hasLoadedSupport = true;
                updateSummary();
                applyFilters('support');
            }
        } catch (error) {
            console.error('Error loading support contacts:', error);
            renderFailed('supportTableBody', 'supportMobileList', 8, 'Failed to load support contacts');
            showToast('Failed to load support contacts', 'error');
        }
    }

    async function loadReports() {
        try {
            const result = await getAllReports();
            if (result.data) {
                reports = result.data;
                hasLoadedReports = true;
                updateSummary();
                applyFilters('reports');
            }
        } catch (error) {
            console.error('Error loading reports:', error);
            renderFailed('reportsTableBody', 'reportsMobileList', 8, 'Failed to load reports');
            showToast('Failed to load reports', 'error');
        }
    }

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

    function renderList({ data, tbodyId, mobileId, sectionId, colSpan, emptyIcon, emptyTitle, emptySubtitle, rowHtml, cardHtml, animate = true }) {
        const tbody = document.getElementById(tbodyId);
        const mobile = document.getElementById(mobileId);
        if (!tbody || !mobile) return;

        const list = data || [];
        if (!list.length) {
            if (isMobileView()) {
                tbody.innerHTML = '';
                mobile.innerHTML = emptyState(emptyIcon, emptyTitle, emptySubtitle);
            } else {
                mobile.innerHTML = '';
                tbody.innerHTML = `<tr data-domino-enter class="reveal"><td colspan="${colSpan}">${emptyState(emptyIcon, emptyTitle, emptySubtitle)}</td></tr>`;
            }
            finishRender(sectionId, animate);
            return;
        }

        if (isMobileView()) {
            tbody.innerHTML = '';
            mobile.innerHTML = list.map(cardHtml).join('');
        } else {
            mobile.innerHTML = '';
            tbody.innerHTML = list.map(rowHtml).join('');
        }
        finishRender(sectionId, animate);
    }

    function renderAppeals(data, animate = true) {
        renderList({
            data,
            tbodyId: 'appealsTableBody',
            mobileId: 'appealsMobileList',
            sectionId: 'appealsSection',
            colSpan: 8,
            emptyIcon: 'shield-alert',
            emptyTitle: 'No appeals found',
            emptySubtitle: 'Ban appeals will appear here when users submit them.',
            rowHtml: (appeal, index) => `
                <tr class="reveal hover:bg-surface/80 transition-colors" data-domino-enter>
                    <td class="px-5 py-4 text-center text-muted">${index + 1}</td>
                    <td class="px-5 py-4 font-medium text-ink">${escapeHtml(appeal.name)}</td>
                    <td class="px-5 py-4 text-body">${escapeHtml(appeal.email)}</td>
                    <td class="px-5 py-4 text-body truncate max-w-xs">${escapeHtml(appeal.subject)}</td>
                    <td class="px-5 py-4">${statusPill(appeal.status)}</td>
                    <td class="px-5 py-4 text-center text-body">${appeal.email_count || 0}</td>
                    <td class="px-5 py-4 text-body whitespace-nowrap">${formatDate(appeal.created_at)}</td>
                    <td class="px-5 py-4">${actionButtons('viewAppeal', 'openAppealReplyModal', appeal.id)}</td>
                </tr>
            `,
            cardHtml: (appeal, index) => contactCard({
                item: appeal,
                index,
                extraLabel: 'Emails',
                extraValue: String(appeal.email_count || 0),
                viewFn: 'viewAppeal',
                replyFn: 'openAppealReplyModal',
            }),
            animate,
        });
    }

    function renderSupportContacts(data, animate = true) {
        renderList({
            data,
            tbodyId: 'supportTableBody',
            mobileId: 'supportMobileList',
            sectionId: 'supportSection',
            colSpan: 8,
            emptyIcon: 'life-buoy',
            emptyTitle: 'No support contacts found',
            emptySubtitle: 'Support inquiries will appear here as they come in.',
            rowHtml: (contact, index) => `
                <tr class="reveal hover:bg-surface/80 transition-colors" data-domino-enter>
                    <td class="px-5 py-4 text-center text-muted">${index + 1}</td>
                    <td class="px-5 py-4 font-medium text-ink">${escapeHtml(contact.name)}</td>
                    <td class="px-5 py-4 text-body">${escapeHtml(contact.email)}</td>
                    <td class="px-5 py-4 text-body truncate max-w-xs">${escapeHtml(contact.subject)}</td>
                    <td class="px-5 py-4">${statusPill(contact.status)}</td>
                    <td class="px-5 py-4 text-center text-body">${contact.email_count || 0}</td>
                    <td class="px-5 py-4 text-body whitespace-nowrap">${formatDate(contact.created_at)}</td>
                    <td class="px-5 py-4">${actionButtons('viewSupport', 'openSupportReplyModal', contact.id)}</td>
                </tr>
            `,
            cardHtml: (contact, index) => contactCard({
                item: contact,
                index,
                extraLabel: 'Emails',
                extraValue: String(contact.email_count || 0),
                viewFn: 'viewSupport',
                replyFn: 'openSupportReplyModal',
            }),
            animate,
        });
    }

    function renderReports(data, animate = true) {
        renderList({
            data,
            tbodyId: 'reportsTableBody',
            mobileId: 'reportsMobileList',
            sectionId: 'reportsSection',
            colSpan: 8,
            emptyIcon: 'bug',
            emptyTitle: 'No reports found',
            emptySubtitle: 'Problem reports will appear here when users file them.',
            rowHtml: (report, index) => `
                <tr class="reveal hover:bg-surface/80 transition-colors" data-domino-enter>
                    <td class="px-5 py-4 text-center text-muted">${index + 1}</td>
                    <td class="px-5 py-4 font-medium text-ink">${escapeHtml(report.name)}</td>
                    <td class="px-5 py-4 text-body">${escapeHtml(report.email)}</td>
                    <td class="px-5 py-4 text-body truncate max-w-xs">${escapeHtml(report.subject)}</td>
                    <td class="px-5 py-4">${statusPill(report.status)}</td>
                    <td class="px-5 py-4 text-center text-body">${report.email_count || 0}</td>
                    <td class="px-5 py-4 text-body whitespace-nowrap">${formatDate(report.created_at)}</td>
                    <td class="px-5 py-4">${actionButtons('viewReport', 'openReportReplyModal', report.id)}</td>
                </tr>
            `,
            cardHtml: (report, index) => contactCard({
                item: report,
                index,
                extraLabel: 'Emails',
                extraValue: String(report.email_count || 0),
                viewFn: 'viewReport',
                replyFn: 'openReportReplyModal',
            }),
            animate,
        });
    }

    async function openModalById(modalId) {
        const modal = document.getElementById(modalId);
        if (!modal) return;
        modal.classList.remove('hidden');
        const overlay = modal.querySelector('[data-modal-overlay]');
        const panel = modal.querySelector('[data-modal-panel]');
        if (overlay && panel) animateModalOpen(overlay, panel, isMobileView() ? 'slide' : 'scale');
        refreshIcons();
    }

    async function closeModalById(modalId) {
        const modal = document.getElementById(modalId);
        if (!modal) return;
        const overlay = modal.querySelector('[data-modal-overlay]');
        const panel = modal.querySelector('[data-modal-panel]');
        if (overlay && panel) {
            await animateModalClose(overlay, panel, isMobileView() ? 'slide' : 'scale');
            clearModalAnimations(overlay, panel);
        }
        modal.classList.add('hidden');
    }

    window.closeModal = closeModalById;

    window.viewAppeal = async function (id) {
        try {
            const result = await ContactsAPI.getAppealById(id);
            if (result.data) {
                const appeal = result.data;
                document.getElementById('viewAppealContent').innerHTML = `
                    <div class="space-y-4">
                        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            ${detailField('Name', escapeHtml(appeal.name))}
                            ${detailField('Email', escapeHtml(appeal.email))}
                            ${detailField('IP Address', escapeHtml(appeal.ip_address))}
                            <div class="rounded-xl border border-line bg-surface px-3.5 py-3">
                                <label class="block text-[10px] uppercase tracking-[0.12em] text-muted">Status</label>
                                <div class="mt-1.5">${statusPill(appeal.status)}</div>
                            </div>
                        </div>
                        ${detailField('Subject', escapeHtml(appeal.subject))}
                        <div>
                            <label class="block text-[10px] uppercase tracking-[0.12em] text-muted mb-1.5">Reason</label>
                            <div class="bg-surface border border-line p-3 rounded-xl">
                                <p class="text-sm text-body whitespace-pre-wrap">${escapeHtml(appeal.reason)}</p>
                            </div>
                        </div>
                        <div>
                            <label class="block text-[10px] uppercase tracking-[0.12em] text-muted mb-1.5">Email History (${appeal.email_history?.length || 0})</label>
                            ${emailHistoryBlock(appeal.email_history)}
                        </div>
                    </div>
                `;
                openModalById('viewAppealModal');
            }
        } catch (error) {
            console.error('Error viewing appeal:', error);
            showToast('Failed to load appeal details', 'error');
        }
    };

    window.viewSupport = async function (id) {
        try {
            const result = await getSupportContactById(id);
            if (result.data) {
                const contact = result.data;
                document.getElementById('viewSupportContent').innerHTML = `
                    <div class="space-y-4">
                        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            ${detailField('Name', escapeHtml(contact.name))}
                            ${detailField('Email', escapeHtml(contact.email))}
                            <div class="rounded-xl border border-line bg-surface px-3.5 py-3">
                                <label class="block text-[10px] uppercase tracking-[0.12em] text-muted">Status</label>
                                <div class="mt-1.5">${statusPill(contact.status)}</div>
                            </div>
                            ${detailField('Created At', formatDate(contact.created_at))}
                        </div>
                        ${detailField('Subject', escapeHtml(contact.subject))}
                        <div>
                            <label class="block text-[10px] uppercase tracking-[0.12em] text-muted mb-1.5">Message</label>
                            <div class="bg-surface border border-line p-3 rounded-xl">
                                <p class="text-sm text-body whitespace-pre-wrap">${escapeHtml(contact.message)}</p>
                            </div>
                        </div>
                        <div>
                            <label class="block text-[10px] uppercase tracking-[0.12em] text-muted mb-1.5">Email History (${contact.email_history?.length || 0})</label>
                            ${emailHistoryBlock(contact.email_history)}
                        </div>
                    </div>
                `;
                openModalById('viewSupportModal');
            }
        } catch (error) {
            console.error('Error viewing support contact:', error);
            showToast('Failed to load support contact details', 'error');
        }
    };

    window.viewReport = async function (id) {
        try {
            const result = await getReportById(id);
            if (result.data) {
                const report = result.data;
                document.getElementById('viewReportContent').innerHTML = `
                    <div class="space-y-4">
                        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            ${detailField('Name', escapeHtml(report.name))}
                            ${detailField('Email', escapeHtml(report.email))}
                            ${detailField('Report ID', escapeHtml(report.report_id))}
                            <div class="rounded-xl border border-line bg-surface px-3.5 py-3">
                                <label class="block text-[10px] uppercase tracking-[0.12em] text-muted">Status</label>
                                <div class="mt-1.5">${statusPill(report.status)}</div>
                            </div>
                        </div>
                        ${detailField('Category', escapeHtml(report.subject))}
                        <div class="rounded-xl border border-line bg-surface px-3.5 py-3">
                            <label class="block text-[10px] uppercase tracking-[0.12em] text-muted">Page Link</label>
                            <a href="${escapeHtml(report.link)}" target="_blank" rel="noopener noreferrer" class="text-sm text-blue-600 hover:underline break-all mt-1 inline-block">${escapeHtml(report.link)}</a>
                        </div>
                        <div>
                            <label class="block text-[10px] uppercase tracking-[0.12em] text-muted mb-1.5">Description</label>
                            <div class="bg-surface border border-line p-3 rounded-xl">
                                <p class="text-sm text-body whitespace-pre-wrap">${escapeHtml(report.description)}</p>
                            </div>
                        </div>
                        ${report.console_log ? `
                        <div>
                            <label class="block text-[10px] uppercase tracking-[0.12em] text-muted mb-1.5">Console Log</label>
                            <div class="bg-ink p-3 rounded-xl">
                                <pre class="text-emerald-400 text-xs whitespace-pre-wrap">${escapeHtml(report.console_log)}</pre>
                            </div>
                        </div>
                        ` : ''}
                        <div>
                            <label class="block text-[10px] uppercase tracking-[0.12em] text-muted mb-1.5">Email History (${report.email_history?.length || 0})</label>
                            ${emailHistoryBlock(report.email_history)}
                        </div>
                    </div>
                `;
                openModalById('viewReportModal');
            }
        } catch (error) {
            console.error('Error viewing report:', error);
            showToast('Failed to load report details', 'error');
        }
    };

    window.openAppealReplyModal = function (id) {
        document.getElementById('replyAppealId').value = id;
        document.getElementById('appealReplyStatus').value = 'under_review';
        document.getElementById('appealReplyMessage').value = '';
        openModalById('appealReplyModal');
    };

    window.openSupportReplyModal = function (id) {
        document.getElementById('replySupportId').value = id;
        document.getElementById('supportReplyStatus').value = 'receive';
        document.getElementById('supportReplyMessage').value = '';
        openModalById('supportReplyModal');
    };

    window.openReportReplyModal = function (id) {
        document.getElementById('replyReportId').value = id;
        document.getElementById('reportReplyStatus').value = 'receive';
        document.getElementById('reportReplyMessage').value = '';
        openModalById('reportReplyModal');
    };

    async function handleReplySubmit({ formId, idField, statusField, messageField, btnId, send, reload, modalId }) {
        document.getElementById(formId).addEventListener('submit', async (event) => {
            event.preventDefault();
            const id = document.getElementById(idField).value;
            const status = document.getElementById(statusField).value;
            const message = document.getElementById(messageField).value;
            const btn = document.getElementById(btnId);
            btn.disabled = true;
            btn.textContent = 'Sending...';
            try {
                const result = await send(id, message, status);
                if (result.message) {
                    showToast(result.message, result.warning ? 'warning' : 'success');
                    await closeModalById(modalId);
                    await reload();
                } else {
                    showToast('Failed to send reply', 'error');
                }
            } catch (error) {
                console.error('Error sending reply:', error);
                showToast('Failed to send reply', 'error');
            } finally {
                btn.disabled = false;
                btn.textContent = 'Send Reply';
            }
        });
    }

    await handleReplySubmit({
        formId: 'appealReplyForm',
        idField: 'replyAppealId',
        statusField: 'appealReplyStatus',
        messageField: 'appealReplyMessage',
        btnId: 'sendAppealReplyBtn',
        send: ContactsAPI.sendReply,
        reload: loadAppeals,
        modalId: 'appealReplyModal',
    });
    await handleReplySubmit({
        formId: 'supportReplyForm',
        idField: 'replySupportId',
        statusField: 'supportReplyStatus',
        messageField: 'supportReplyMessage',
        btnId: 'sendSupportReplyBtn',
        send: sendSupportContactReply,
        reload: loadSupportContacts,
        modalId: 'supportReplyModal',
    });
    await handleReplySubmit({
        formId: 'reportReplyForm',
        idField: 'replyReportId',
        statusField: 'reportReplyStatus',
        messageField: 'reportReplyMessage',
        btnId: 'sendReportReplyBtn',
        send: sendReportReply,
        reload: loadReports,
        modalId: 'reportReplyModal',
    });

    const modalClosers = [
        ['closeAppealReplyModal', 'appealReplyModal'],
        ['appealReplyModalBackdrop', 'appealReplyModal'],
        ['cancelAppealReply', 'appealReplyModal'],
        ['closeViewAppealModal', 'viewAppealModal'],
        ['viewAppealModalBackdrop', 'viewAppealModal'],
        ['closeSupportReplyModal', 'supportReplyModal'],
        ['supportReplyModalBackdrop', 'supportReplyModal'],
        ['cancelSupportReply', 'supportReplyModal'],
        ['closeViewSupportModal', 'viewSupportModal'],
        ['viewSupportModalBackdrop', 'viewSupportModal'],
        ['closeReportReplyModal', 'reportReplyModal'],
        ['reportReplyModalBackdrop', 'reportReplyModal'],
        ['cancelReportReply', 'reportReplyModal'],
        ['closeViewReportModal', 'viewReportModal'],
        ['viewReportModalBackdrop', 'viewReportModal'],
    ];
    modalClosers.forEach(([elementId, modalId]) => {
        document.getElementById(elementId)?.addEventListener('click', () => closeModalById(modalId));
    });

    document.querySelectorAll('.contacts-tab').forEach((button) => {
        button.addEventListener('click', () => window.switchTab(button.dataset.tab));
    });

    document.getElementById('appealSearch').addEventListener('input', () => applyFilters('appeals'));
    document.getElementById('supportSearch').addEventListener('input', () => applyFilters('support'));
    document.getElementById('reportSearch').addEventListener('input', () => applyFilters('reports'));

    document.getElementById('appealStatusFilter').addEventListener('change', (event) => {
        syncStatusChips('appeals', event.target.value);
        applyFilters('appeals');
    });
    document.getElementById('supportStatusFilter').addEventListener('change', (event) => {
        syncStatusChips('support', event.target.value);
        applyFilters('support');
    });
    document.getElementById('reportStatusFilter').addEventListener('change', (event) => {
        syncStatusChips('reports', event.target.value);
        applyFilters('reports');
    });

    document.querySelectorAll('[data-chip-group]').forEach((group) => {
        group.addEventListener('click', (event) => {
            const chip = event.target.closest('.contact-status-chip');
            if (!chip) return;
            const kind = group.dataset.chipGroup;
            const status = chip.dataset.status || '';
            const filterId = kind === 'appeals' ? 'appealStatusFilter' : kind === 'support' ? 'supportStatusFilter' : 'reportStatusFilter';
            const select = document.getElementById(filterId);
            if (select) select.value = status;
            syncStatusChips(kind, status);
            applyFilters(kind);
        });
    });

    window.addEventListener('resize', () => {
        const next = isMobileView();
        if (next === lastMobileView) return;
        lastMobileView = next;
        if (hasLoadedAppeals) applyFilters('appeals', { animate: false });
        if (hasLoadedSupport) applyFilters('support', { animate: false });
        if (hasLoadedReports) applyFilters('reports', { animate: false });
    });

    await loadAppeals();
}

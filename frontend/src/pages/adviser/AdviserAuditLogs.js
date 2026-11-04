import { AdviserNavbar, initAdviserNavbar } from '../../components/Navbar/AdviserNavbar.js';
import { getAllAuditLogs } from '../../api/AuditLogs/AuditLogs.js';
import { getAllAdviserAuditLogs } from '../../api/AuditLogs/AdviserAuditLogs.js';
import { protectAdviserRoute } from '../../middleware/AdviserMiddleware.js';
import { getUserData } from '../../utils/jwt.js';
import { skeletonTableRows } from '../../components/SkeletonLoading.js';
import { initAuditLogsAnimations, animateDominoList } from '../../provider/Animation/AuditLogsAnimation.js';

const TABLE_OPTIONS = `
    <option value="">All</option>
    <option value="advisers">Adviser Profile</option>
    <option value="organizations">Organizations</option>
    <option value="students">Students</option>
    <option value="organization_memberships">Memberships</option>
    <option value="tasks">Tasks</option>
    <option value="events">Events</option>
    <option value="attendance">Attendance</option>
`;

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
        gray: 'bg-slate-50 text-slate-600 border-slate-200',
    };
    return `<span class="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium border ${tones[tone] || tones.blue}">${escapeHtml(label)}</span>`;
}

function getActionTone(action) {
    switch ((action || '').toUpperCase()) {
        case 'CREATE': return 'green';
        case 'UPDATE': return 'blue';
        case 'DELETE': return 'red';
        default: return 'gray';
    }
}

function getActionClass(action) {
    switch ((action || '').toUpperCase()) {
        case 'CREATE': return 'bg-emerald-50 text-emerald-700 border-emerald-200';
        case 'UPDATE': return 'bg-blue-50 text-blue-600 border-blue-100';
        case 'DELETE': return 'bg-red-50 text-red-700 border-red-200';
        default: return 'bg-slate-50 text-slate-600 border-slate-200';
    }
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

function skeletonCards(count = 3) {
    return Array.from({ length: count }, () => `
        <div class="audit-mobile-card rounded-2xl border border-line bg-white/90 p-4">
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

function inputClass() {
    return 'w-full px-3.5 py-2.5 text-sm bg-white border border-line rounded-xl text-ink shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600';
}

function actionChips() {
    const chips = [
        { value: '', label: 'All' },
        { value: 'CREATE', label: 'Create' },
        { value: 'UPDATE', label: 'Update' },
        { value: 'DELETE', label: 'Delete' },
    ];
    return `
        <div class="audit-chip-row md:hidden flex gap-2 overflow-x-auto pb-1 -mx-1 px-1" id="filterActionChips">
            ${chips.map((chip, index) => `
                <button type="button" data-action="${chip.value}" class="audit-action-chip shrink-0 rounded-full border px-3 py-1.5 text-[11px] font-semibold ${index === 0 ? 'border-blue-600 bg-blue-600 text-white' : 'border-line bg-white text-body'}">${chip.label}</button>
            `).join('')}
        </div>
    `;
}

function desktopTable() {
    return `
        <div id="auditLogsDesktopPanel" class="hidden md:block">
            <div class="bg-white border border-line rounded-2xl shadow-sm overflow-hidden">
                <div class="overflow-x-auto">
                    <table class="w-full text-sm text-left min-w-[860px]">
                        <thead>
                            <tr class="bg-surface border-b border-line text-[11px] font-semibold text-muted uppercase tracking-[0.14em]">
                                <th class="px-4 py-3.5">Date/Time</th>
                                <th class="px-4 py-3.5">User</th>
                                <th class="px-4 py-3.5">Action</th>
                                <th class="px-4 py-3.5">Table</th>
                                <th class="px-4 py-3.5">Field</th>
                                <th class="px-4 py-3.5">Changes</th>
                                <th class="px-4 py-3.5">Device</th>
                                <th class="px-4 py-3.5">IP Address</th>
                            </tr>
                        </thead>
                        <tbody id="auditLogsTableBody" class="divide-y divide-line">
                            ${skeletonTableRows(4, 8, false)}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    `;
}

function auditLogsPanel({ title, subtitle, showHeading = true }) {
    return `
        <div class="audit-logs-embed">
            <div class="reveal mb-4 md:mb-5 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3" data-domino-enter>
                ${showHeading ? `
                <div class="min-w-0">
                    <h2 class="text-base sm:text-lg font-semibold text-ink tracking-tight">${title}</h2>
                    <p class="text-xs sm:text-sm text-muted mt-0.5">${subtitle}</p>
                </div>
                ` : '<div class="min-w-0 hidden sm:block"></div>'}
                <button
                    id="refreshLogsBtn"
                    type="button"
                    class="self-start sm:self-auto inline-flex items-center justify-center gap-2 h-11 px-3.5 text-sm font-medium text-white bg-blue-600 hover:bg-blue-800 rounded-xl transition shadow-sm">
                    <i data-lucide="refresh-cw" class="w-4 h-4"></i>
                    <span>Refresh</span>
                </button>
            </div>

            <section class="reveal mb-4 grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3" data-domino-enter>
                <div class="audit-stat-chip rounded-2xl border border-line bg-white p-3 sm:p-4">
                    <p class="text-[10px] sm:text-[11px] uppercase tracking-[0.12em] text-muted">Total</p>
                    <p id="logsStatTotal" class="mt-1 text-lg sm:text-2xl font-semibold text-ink">0</p>
                </div>
                <div class="audit-stat-chip rounded-2xl border border-line bg-white p-3 sm:p-4">
                    <p class="text-[10px] sm:text-[11px] uppercase tracking-[0.12em] text-muted">Created</p>
                    <p id="logsStatCreate" class="mt-1 text-lg sm:text-2xl font-semibold text-emerald-700">0</p>
                </div>
                <div class="audit-stat-chip rounded-2xl border border-line bg-white p-3 sm:p-4">
                    <p class="text-[10px] sm:text-[11px] uppercase tracking-[0.12em] text-muted">Updated</p>
                    <p id="logsStatUpdate" class="mt-1 text-lg sm:text-2xl font-semibold text-blue-600">0</p>
                </div>
                <div class="audit-stat-chip rounded-2xl border border-line bg-white p-3 sm:p-4">
                    <p class="text-[10px] sm:text-[11px] uppercase tracking-[0.12em] text-muted">Deleted</p>
                    <p id="logsStatDelete" class="mt-1 text-lg sm:text-2xl font-semibold text-red-700">0</p>
                </div>
            </section>

            <div class="audit-filter-panel reveal mb-4 rounded-2xl border border-line bg-white p-3.5 sm:p-4" data-domino-enter>
                ${actionChips()}
                <div class="hidden md:grid grid-cols-3 gap-3">
                    <div>
                        <label for="filterAction" class="block text-[11px] font-semibold uppercase tracking-[0.12em] text-muted mb-1.5">Action</label>
                        <select id="filterAction" class="${inputClass()}">
                            <option value="">All</option>
                            <option value="CREATE">Create</option>
                            <option value="UPDATE">Update</option>
                            <option value="DELETE">Delete</option>
                        </select>
                    </div>
                    <div>
                        <label for="filterTable" class="block text-[11px] font-semibold uppercase tracking-[0.12em] text-muted mb-1.5">Table</label>
                        <select id="filterTable" class="${inputClass()}">${TABLE_OPTIONS}</select>
                    </div>
                    <div>
                        <label for="filterDate" class="block text-[11px] font-semibold uppercase tracking-[0.12em] text-muted mb-1.5">Date</label>
                        <input type="date" id="filterDate" class="${inputClass()}">
                    </div>
                </div>
                <div class="md:hidden grid grid-cols-1 gap-3 mt-3">
                    <div>
                        <label for="filterTableMobile" class="block text-[11px] font-semibold uppercase tracking-[0.12em] text-muted mb-1.5">Table</label>
                        <select id="filterTableMobile" class="${inputClass()}">${TABLE_OPTIONS}</select>
                    </div>
                    <div>
                        <label for="filterDateMobile" class="block text-[11px] font-semibold uppercase tracking-[0.12em] text-muted mb-1.5">Date</label>
                        <input type="date" id="filterDateMobile" class="${inputClass()}">
                    </div>
                </div>
            </div>

            ${desktopTable()}
            <div id="auditLogsMobileList" class="md:hidden space-y-3">${skeletonCards()}</div>

            <div class="mt-4 rounded-2xl border border-line bg-white px-4 py-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div class="text-sm text-body">Showing <span id="logsCount" class="font-semibold text-ink">0</span> logs</div>
                <div class="grid grid-cols-2 sm:flex gap-2">
                    <button id="prevPage" class="px-3 py-2.5 sm:py-1.5 text-sm font-medium text-ink bg-white border border-line rounded-xl hover:bg-surface disabled:opacity-50 disabled:cursor-not-allowed" disabled>Previous</button>
                    <button id="nextPage" class="px-3 py-2.5 sm:py-1.5 text-sm font-medium text-ink bg-white border border-line rounded-xl hover:bg-surface disabled:opacity-50 disabled:cursor-not-allowed" disabled>Next</button>
                </div>
            </div>
        </div>
    `;
}

export function AdviserAuditLogsEmbedded() {
    return auditLogsPanel({
        title: 'Recent audit logs',
        subtitle: 'Latest changes in your organization',
    });
}

export function AdviserAuditLogs() {
    return `
        <div id="adviser-audit-logs-page" data-domino-page class="min-h-screen bg-surface font-sans text-ink pb-24 md:pb-10">
            ${AdviserNavbar()}
            <main class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5 sm:py-8">
                <header class="reveal mb-5 sm:mb-7" data-domino-enter>
                    <span class="inline-flex items-center gap-2 rounded-full border border-line bg-white px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-blue-600">
                        <span class="h-1.5 w-1.5 rounded-full bg-yellow"></span>
                        Organization trail
                    </span>
                    <div class="mt-3 min-w-0">
                        <h1 class="text-[1.65rem] sm:text-3xl font-semibold tracking-tight text-ink leading-tight">Audit Logs</h1>
                        <p class="mt-1.5 max-w-2xl text-sm text-body">Review changes made to your organizations, students, events, and attendance.</p>
                    </div>
                </header>
                ${auditLogsPanel({
                    title: 'Recent audit logs',
                    subtitle: 'Latest changes in your organization',
                    showHeading: false,
                })}
            </main>
        </div>
    `;
}

export function initAdviserAuditLogsEmbedded() {
    initAdviserAuditLogs({ embedded: true });
}

export function initAdviserAuditLogs(options = {}) {
    const embedded = options.embedded === true;
    if (!embedded) {
        protectAdviserRoute();
        initAdviserNavbar();
        initAuditLogsAnimations(document.getElementById('adviser-audit-logs-page') || document);
    }

    let currentPage = 0;
    const pageSize = 20;
    let allLogs = [];
    let listReady = false;

    function finishRender(animate = true) {
        refreshIcons();
        const page = document.getElementById('adviser-audit-logs-page');
        const mobileList = document.getElementById('auditLogsMobileList');
        const desktopPanel = document.getElementById('auditLogsDesktopPanel');
        const embed = document.querySelector('.audit-logs-embed');

        if (!animate || listReady) {
            document.querySelectorAll('#auditLogsMobileList .reveal, #auditLogsTableBody .reveal').forEach((el) => el.classList.add('in'));
            listReady = true;
            return;
        }

        if (isMobileView() && mobileList) animateDominoList(mobileList);
        else if (!isMobileView() && desktopPanel) animateDominoList(desktopPanel);
        else if (embed) animateDominoList(embed);
        else if (page) animateDominoList(page);
        listReady = true;
    }

    function pairedValue(desktopId, mobileId) {
        const desktop = document.getElementById(desktopId);
        const mobile = document.getElementById(mobileId);
        return (isMobileView() ? (mobile?.value ?? desktop?.value) : (desktop?.value ?? mobile?.value)) || '';
    }

    function setPairedValue(desktopId, mobileId, value) {
        const desktop = document.getElementById(desktopId);
        const mobile = document.getElementById(mobileId);
        if (desktop) desktop.value = value;
        if (mobile) mobile.value = value;
    }

    function getCurrentFilters() {
        return {
            action: document.getElementById('filterAction')?.value || '',
            table_name: pairedValue('filterTable', 'filterTableMobile'),
            start_date: pairedValue('filterDate', 'filterDateMobile'),
        };
    }

    function syncActionChips(value) {
        document.querySelectorAll('#filterActionChips .audit-action-chip').forEach((chip) => {
            const active = chip.dataset.action === value;
            chip.classList.toggle('border-blue-600', active);
            chip.classList.toggle('bg-blue-600', active);
            chip.classList.toggle('text-white', active);
            chip.classList.toggle('border-line', !active);
            chip.classList.toggle('bg-white', !active);
            chip.classList.toggle('text-body', !active);
        });
    }

    async function loadAdviserAssociations() {
        try {
            const adviserData = getUserData('adviser');
            if (!adviserData || !adviserData.id) {
                console.error('No adviser data found');
            }
        } catch (error) {
            console.error('Error loading adviser associations:', error);
        }
    }

    async function loadAuditLogs(filters = {}) {
        const tbody = document.getElementById('auditLogsTableBody');
        const mobile = document.getElementById('auditLogsMobileList');
        listReady = false;

        if (isMobileView()) {
            if (tbody) tbody.innerHTML = '';
            if (mobile) mobile.innerHTML = skeletonCards();
        } else if (tbody) {
            if (mobile) mobile.innerHTML = '';
            tbody.innerHTML = skeletonTableRows(4, 8, false);
        }

        try {
            const [adminResponse, adviserResponse] = await Promise.all([
                getAllAuditLogs({
                    ...filters,
                    limit: 200
                }, 'adviser').catch(err => {
                    console.error('Admin audit logs fetch error:', err);
                    return { success: false, data: [], total: 0 };
                }),
                getAllAdviserAuditLogs({
                    ...filters,
                    limit: 200
                }, 'adviser').catch(err => {
                    console.error('Adviser audit logs fetch error:', err);
                    return { success: false, data: [], total: 0 };
                })
            ]);

            let combinedLogs = [];

            if (adminResponse && adminResponse.success && Array.isArray(adminResponse.data)) {
                combinedLogs = [...combinedLogs, ...adminResponse.data];
            }

            if (adviserResponse && adviserResponse.success && Array.isArray(adviserResponse.data)) {
                combinedLogs = [...combinedLogs, ...adviserResponse.data];
            }

            combinedLogs.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

            allLogs = combinedLogs;
            const totalLogs = combinedLogs.length;
            const startIndex = currentPage * pageSize;
            const paginatedLogs = combinedLogs.slice(startIndex, startIndex + pageSize);

            renderLogs(paginatedLogs, totalLogs);

            const countEl = document.getElementById('logsCount');
            if (countEl) countEl.textContent = totalLogs;

            const prevBtn = document.getElementById('prevPage');
            const nextBtn = document.getElementById('nextPage');
            if (prevBtn) prevBtn.disabled = currentPage === 0;
            if (nextBtn) nextBtn.disabled = (currentPage + 1) * pageSize >= totalLogs;
        } catch (error) {
            console.error('Failed to load audit logs:', error);
            renderError('Failed to load audit logs. Please try again.');
        }
    }

    function renderError(message) {
        const tbody = document.getElementById('auditLogsTableBody');
        const mobile = document.getElementById('auditLogsMobileList');
        if (isMobileView()) {
            if (tbody) tbody.innerHTML = '';
            if (mobile) mobile.innerHTML = emptyState('circle-alert', message, 'Pull to refresh or try again shortly.');
        } else if (tbody) {
            if (mobile) mobile.innerHTML = '';
            tbody.innerHTML = `<tr data-domino-enter class="reveal"><td colspan="8">${emptyState('circle-alert', message, 'Please try again.')}</td></tr>`;
        }
        finishRender(true);
    }

    function formatTime12Hour(timeStr) {
        if (!timeStr) return '';
        const clean = timeStr.trim();
        if (/AM|PM/i.test(clean)) return clean;
        const parts = clean.split(':');
        if (parts.length >= 2) {
            let hour = parseInt(parts[0], 10);
            const min = parts[1].substring(0, 2);
            if (isNaN(hour)) return clean;
            const ampm = hour >= 12 ? 'PM' : 'AM';
            hour = hour % 12 || 12;
            return `${hour}:${min} ${ampm}`;
        }
        return clean;
    }

    function formatDateReadable(dateStr) {
        if (!dateStr || dateStr === 'None' || dateStr === '-') return dateStr;
        const clean = String(dateStr).trim();
        const match = clean.match(/^(\d{4})-(\d{2})-(\d{2})$/);
        if (match) {
            const year = parseInt(match[1], 10);
            const month = parseInt(match[2], 10) - 1;
            const day = parseInt(match[3], 10);
            const date = new Date(year, month, day);
            if (!isNaN(date.getTime())) {
                return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
            }
        }
        return clean;
    }

    function formatTimeRange(rangeStr) {
        if (!rangeStr) return '';
        const clean = rangeStr.replace(/[()\[\]]/g, '').trim();
        if (clean.includes('-')) {
            const [start, end] = clean.split('-');
            return `${formatTime12Hour(start)} - ${formatTime12Hour(end)}`;
        }
        return formatTime12Hour(clean);
    }

    function formatScheduleString(str) {
        if (!str || str === 'None' || str === '-') return escapeHtml(str);

        const studentBlocks = str.split(/[;|]/).map(s => s.trim()).filter(Boolean);
        if (studentBlocks.length === 0 || !str.includes(':')) {
            return escapeHtml(formatDateReadable(str));
        }

        const formattedStudents = studentBlocks.map(block => {
            const colonIdx = block.indexOf(':');
            if (colonIdx === -1) {
                return `<div>${escapeHtml(block)}</div>`;
            }
            const studentName = block.substring(0, colonIdx).trim();
            const schedPart = block.substring(colonIdx + 1).replace(/[\[\]]/g, '').trim();

            const items = schedPart.split(',').map(item => {
                const trimmed = item.trim();
                const match = trimmed.match(/^(\d{4}-\d{2}-\d{2})[:\s]+(\(?\d{1,2}:\d{2}\s*-\s*\d{1,2}:\d{2}\)?)/);
                if (match) {
                    const dateFormatted = formatDateReadable(match[1]);
                    const timeFormatted = formatTimeRange(match[2]);
                    return `<span class="inline-block bg-white border border-gray-200 rounded px-1.5 py-0.5 text-[11px] font-medium text-gray-700 shadow-2xs">${dateFormatted}: ${timeFormatted}</span>`;
                }
                return `<span class="inline-block bg-white border border-gray-200 rounded px-1.5 py-0.5 text-[11px] text-gray-700">${escapeHtml(trimmed)}</span>`;
            });

            return `
                <div class="mb-1.5 last:mb-0">
                    <div class="font-semibold text-xs text-gray-900">${escapeHtml(studentName)}</div>
                    <div class="flex flex-wrap gap-1 mt-0.5">${items.join('')}</div>
                </div>
            `;
        });

        return formattedStudents.join('');
    }

    function renderChangesCell(log) {
        const action = (log.action || '').toUpperCase();
        if (action === 'CREATE') return tonePill('CREATED', 'green');
        if (action === 'DELETE') return tonePill('DELETED', 'red');

        const field = (log.field_name || '').toLowerCase();
        const isSchedule = field === 'daily_schedules' || (log.old_value && log.old_value.includes(':') && log.old_value.includes('-')) || (log.new_value && log.new_value.includes(':') && log.new_value.includes('-'));
        const isDateField = ['start_date', 'end_date', 'student_start_date', 'student_end_date', 'event_day_start', 'event_day_end', 'date_joined', 'schedule_date'].includes(field);
        const isTimeField = ['event_time_start', 'event_time_end', 'start_time', 'end_time', 'time_in_am', 'time_out_am', 'break_out', 'break_in', 'time_in_pm', 'time_out_pm'].includes(field);

        if (isSchedule && (log.old_value?.includes(';') || log.new_value?.includes(';') || log.old_value?.includes(':') || log.new_value?.includes(':'))) {
            return `
                <div class="space-y-1.5 text-xs max-h-48 overflow-y-auto pr-1">
                    ${log.old_value && log.old_value !== 'None' ? `
                        <div class="bg-red-50/70 border border-red-100 rounded-xl p-2">
                            <span class="text-[10px] font-bold text-red-600 uppercase tracking-wider block mb-1">Previous Schedule</span>
                            <div class="line-through text-red-800/80">${formatScheduleString(log.old_value)}</div>
                        </div>
                    ` : ''}
                    ${log.new_value && log.new_value !== 'None' ? `
                        <div class="bg-emerald-50/70 border border-emerald-100 rounded-xl p-2">
                            <span class="text-[10px] font-bold text-emerald-700 uppercase tracking-wider block mb-1">New Schedule</span>
                            <div class="text-emerald-800">${formatScheduleString(log.new_value)}</div>
                        </div>
                    ` : ''}
                </div>
            `;
        }

        let formattedOld = log.old_value || '-';
        let formattedNew = log.new_value || '-';

        if (isDateField) {
            formattedOld = formatDateReadable(log.old_value);
            formattedNew = formatDateReadable(log.new_value);
        } else if (isTimeField) {
            formattedOld = formatTime12Hour(log.old_value);
            formattedNew = formatTime12Hour(log.new_value);
        }

        return `
            <div class="truncate" title="${escapeHtml(log.old_value || '-')}">
                <span class="text-red-600 line-through text-xs">${escapeHtml(formattedOld)}</span>
            </div>
            <div class="truncate" title="${escapeHtml(log.new_value || '-')}">
                <span class="text-emerald-600 text-xs">${escapeHtml(formattedNew)}</span>
            </div>
        `;
    }

    function updateStats(logs, total) {
        const list = logs || [];
        const source = allLogs.length ? allLogs : list;
        const setText = (id, value) => {
            const el = document.getElementById(id);
            if (el) el.textContent = value;
        };
        setText('logsStatTotal', total);
        setText('logsStatCreate', source.filter((log) => (log.action || '').toUpperCase() === 'CREATE').length);
        setText('logsStatUpdate', source.filter((log) => (log.action || '').toUpperCase() === 'UPDATE').length);
        setText('logsStatDelete', source.filter((log) => (log.action || '').toUpperCase() === 'DELETE').length);
    }

    function getReadableFieldName(fieldName) {
        if (!fieldName) return '-';
        const fieldMap = {
            'organization_id': 'Organization',
            'organization_ids': 'Organizations',
            'organization_name': 'Organization Name',
            'current_organization_id': 'Current Organization',
            'adviser_id': 'Adviser',
            'event_title': 'Event Title',
            'event_category': 'Event Category',
            'event_day_start': 'Event Start Date',
            'event_day_end': 'Event End Date',
            'event_time_start': 'Event Start Time',
            'event_time_end': 'Event End Time',
            'event_id': 'Event',
            'approver_id': 'Approver',
            'approver_name': 'Approver Name',
            'event_registration': 'Event Registration',
            'org_code': 'Organization Code',
            'name': 'Name',
            'description': 'Description',
            'status': 'Status',
            'venue': 'Venue',
            'student_id': 'Student',
            'student_name': 'Student Name',
            'role_id': 'Role',
            'role_name': 'Role Name',
            'membership_status': 'Membership Status',
            'date_joined': 'Date Joined',
            'organization_membership': 'Organization Membership',
            'username': 'Username',
            'email': 'Email',
            'profile_photo': 'Profile Photo',
            'password': 'Password',
            'task': 'Task',
            'tasks': 'Tasks',
            'task_title': 'Task Title',
            'task_description': 'Task Description',
            'start_date': 'Start Date',
            'end_date': 'End Date',
            'student_start_date': 'Student Start Date',
            'student_end_date': 'Student End Date',
            'assigned_students': 'Assigned Students',
            'assigned_student': 'Assigned Student',
            'daily_schedules': 'Daily Schedules',
            'schedule_status': 'Schedule Status',
            'event_task': 'Event Task',
            'attendance': 'Attendance',
            'attendance_record': 'Attendance Record',
            'time_in_am': 'Time In (AM)',
            'time_out_am': 'Time Out (AM)',
            'break_out': 'Break Out',
            'break_in': 'Break In',
            'time_in_pm': 'Time In (PM)',
            'time_out_pm': 'Time Out (PM)',
            'absent_status': 'Absent Status',
            'excuse_status': 'Excuse Status',
            'excuse_reason': 'Excuse Reason',
            'excuse_approval': 'Excuse Approval'
        };

        if (fieldMap[fieldName]) return fieldMap[fieldName];
        return fieldName.replace(/_/g, ' ').replace(/\b\w/g, char => char.toUpperCase());
    }

    function getReadableTableName(tableName) {
        const tableMap = {
            'organizations': 'Organizations',
            'events': 'Events',
            'event_organizations': 'Event Registrations',
            'advisers': 'Advisers',
            'students': 'Students',
            'admins': 'Admins',
            'roles': 'Roles',
            'organization_memberships': 'Organization Memberships',
            'tasks': 'Tasks',
            'member_tasks': 'Tasks',
            'attendance': 'Attendance',
            'attendances': 'Attendance'
        };

        if (tableMap[tableName]) return tableMap[tableName];
        return tableName.replace(/_/g, ' ').replace(/\b\w/g, char => char.toUpperCase());
    }

    function formatDate(dateString) {
        const date = new Date(dateString);
        return date.toLocaleString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    }

    function renderLogs(logs, total = 0) {
        const tbody = document.getElementById('auditLogsTableBody');
        const mobile = document.getElementById('auditLogsMobileList');
        if (!tbody || !mobile) return;

        updateStats(logs, total);

        if (!logs || logs.length === 0) {
            if (isMobileView()) {
                tbody.innerHTML = '';
                mobile.innerHTML = emptyState('file-text', 'No audit logs found for your organizations and students.', 'Activity will appear here as changes are made.');
            } else {
                mobile.innerHTML = '';
                tbody.innerHTML = `<tr data-domino-enter class="reveal"><td colspan="8">${emptyState('file-text', 'No audit logs found for your organizations and students.', 'Activity will appear here as changes are made.')}</td></tr>`;
            }
            finishRender(true);
            return;
        }

        if (isMobileView()) {
            tbody.innerHTML = '';
            mobile.innerHTML = logs.map(log => {
                const isAdmin = log.user_type === 'admin';
                const censoredDevice = isAdmin ? 'Hidden' : (log.device_type || '—');
                const censoredBrowser = isAdmin ? 'Hidden' : (log.browser || '—');
                const censoredOs = isAdmin ? 'Hidden' : (log.os || '—');
                const censoredIp = isAdmin ? 'Hidden' : (log.ip_address || '—');
                const action = (log.action || '').toUpperCase();

                return `
                    <article class="audit-mobile-card reveal rounded-2xl border border-line bg-white overflow-hidden" data-domino-enter data-action="${escapeHtml(action)}">
                        <div class="p-4">
                            <div class="flex items-start justify-between gap-2">
                                <div class="min-w-0">
                                    <p class="text-[10px] uppercase tracking-[0.14em] text-muted">${formatDate(log.created_at)}</p>
                                    <h3 class="text-sm font-semibold text-ink truncate mt-0.5">${escapeHtml(log.user_name || 'Unknown')}</h3>
                                    <p class="text-[11px] text-muted truncate">${escapeHtml(log.user_type || '—')}</p>
                                </div>
                                ${tonePill(log.action || '—', getActionTone(log.action))}
                            </div>
                            <div class="mt-3.5 grid grid-cols-2 gap-2">
                                ${metaTile('Table', escapeHtml(getReadableTableName(log.table_name)))}
                                ${metaTile('Field', escapeHtml(getReadableFieldName(log.field_name) || '—'))}
                                ${metaTile('Device', escapeHtml(censoredDevice))}
                                ${metaTile('IP', escapeHtml(censoredIp))}
                            </div>
                            <div class="mt-3 rounded-xl border border-line bg-surface/80 px-3 py-2.5 text-xs">
                                <div class="text-[10px] uppercase tracking-[0.12em] text-muted mb-1">Changes</div>
                                ${renderChangesCell(log)}
                            </div>
                            <p class="mt-2 text-[11px] text-muted">${escapeHtml(censoredBrowser)} / ${escapeHtml(censoredOs)}</p>
                        </div>
                    </article>
                `;
            }).join('');
        } else {
            mobile.innerHTML = '';
            tbody.innerHTML = logs.map(log => {
                const isAdmin = log.user_type === 'admin';
                const censoredDevice = isAdmin ? 'Hidden' : (log.device_type || '-');
                const censoredBrowser = isAdmin ? 'Hidden' : (log.browser || '-');
                const censoredOs = isAdmin ? 'Hidden' : (log.os || '-');
                const censoredIp = isAdmin ? 'Hidden' : (log.ip_address || '-');

                return `
                    <tr class="reveal hover:bg-surface/80 transition-colors" data-domino-enter>
                        <td class="px-4 py-3 text-sm text-ink whitespace-nowrap">${formatDate(log.created_at)}</td>
                        <td class="px-4 py-3 text-sm text-ink">
                            <div class="font-medium">${escapeHtml(log.user_name || 'Unknown')}</div>
                            <div class="text-xs text-muted">${escapeHtml(log.user_type)}</div>
                        </td>
                        <td class="px-4 py-3">
                            <span class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${getActionClass(log.action)}">${escapeHtml(log.action)}</span>
                        </td>
                        <td class="px-4 py-3 text-sm text-ink font-mono text-xs">${escapeHtml(getReadableTableName(log.table_name))}</td>
                        <td class="px-4 py-3 text-sm text-ink">${escapeHtml(getReadableFieldName(log.field_name) || '-')}</td>
                        <td class="px-4 py-3 text-sm text-ink max-w-sm sm:max-w-md">${renderChangesCell(log)}</td>
                        <td class="px-4 py-3 text-sm text-ink">
                            <div class="text-xs">${escapeHtml(censoredDevice)}</div>
                            <div class="text-xs text-muted">${escapeHtml(censoredBrowser)} / ${escapeHtml(censoredOs)}</div>
                        </td>
                        <td class="px-4 py-3 text-sm text-ink font-mono text-xs">${escapeHtml(censoredIp)}</td>
                    </tr>
                `;
            }).join('');
        }

        finishRender(true);
    }

    document.getElementById('refreshLogsBtn')?.addEventListener('click', () => {
        currentPage = 0;
        loadAdviserAssociations().then(() => loadAuditLogs(getCurrentFilters()));
    });

    document.getElementById('filterAction')?.addEventListener('change', (event) => {
        currentPage = 0;
        syncActionChips(event.target.value);
        loadAuditLogs(getCurrentFilters());
    });

    ['filterTable', 'filterTableMobile', 'filterDate', 'filterDateMobile'].forEach((id) => {
        document.getElementById(id)?.addEventListener('change', (event) => {
            if (id === 'filterTable' || id === 'filterTableMobile') {
                setPairedValue('filterTable', 'filterTableMobile', event.target.value);
            }
            if (id === 'filterDate' || id === 'filterDateMobile') {
                setPairedValue('filterDate', 'filterDateMobile', event.target.value);
            }
            currentPage = 0;
            loadAuditLogs(getCurrentFilters());
        });
    });

    document.getElementById('filterActionChips')?.addEventListener('click', (event) => {
        const chip = event.target.closest('.audit-action-chip');
        if (!chip) return;
        const action = chip.dataset.action || '';
        const select = document.getElementById('filterAction');
        if (select) select.value = action;
        syncActionChips(action);
        currentPage = 0;
        loadAuditLogs(getCurrentFilters());
    });

    document.getElementById('prevPage')?.addEventListener('click', () => {
        if (currentPage > 0) {
            currentPage--;
            loadAuditLogs(getCurrentFilters());
        }
    });

    document.getElementById('nextPage')?.addEventListener('click', () => {
        currentPage++;
        loadAuditLogs(getCurrentFilters());
    });

    refreshIcons();
    loadAdviserAssociations().then(() => loadAuditLogs());
}

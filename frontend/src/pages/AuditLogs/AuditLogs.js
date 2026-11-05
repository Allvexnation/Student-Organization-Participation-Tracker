import { AdminNavbar, initAdminNavbar } from '../../components/Navbar/AdminNavbar.js';
import { getCombinedAuditLogs } from '../../api/AuditLogs/AuditLogs.js';
import { protectAdminRoute } from '../../middleware/AdminMiddleware.js';
import { navigate } from '../../utils/navigation.js';

export function AuditLogsEmbedded() {
    return `
        <div class="bg-white border border-line rounded-2xl shadow-sm overflow-hidden">
            <div class="p-4 sm:p-5 border-b border-line">
                <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
                    <div>
                        <h2 class="text-base sm:text-lg font-semibold text-ink">Recent audit logs</h2>
                        <p class="text-xs sm:text-sm text-muted mt-0.5">Latest changes recorded in the system</p>
                    </div>
                    <button
                        id="refreshLogsBtn"
                        class="self-start sm:self-auto px-3 py-1.5 text-sm font-medium text-white bg-blue-600 hover:bg-blue-800 rounded-lg transition flex items-center gap-2">
                        <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                        <span>Refresh</span>
                    </button>
                </div>
                <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                    <div>
                        <label for="filterUserType" class="block text-xs font-medium text-gray-700 mb-1">User Type</label>
                        <select id="filterUserType" class="w-full px-3 py-2 text-sm border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
                            <option value="">All</option>
                            <option value="admin">Admin</option>
                            <option value="adviser">Adviser</option>
                            <option value="student">Student</option>
                        </select>
                    </div>
                    <div>
                        <label for="filterAction" class="block text-xs font-medium text-gray-700 mb-1">Action</label>
                        <select id="filterAction" class="w-full px-3 py-2 text-sm border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
                            <option value="">All</option>
                            <option value="CREATE">Create</option>
                            <option value="UPDATE">Update</option>
                            <option value="DELETE">Delete</option>
                        </select>
                    </div>
                    <div>
                        <label for="filterTable" class="block text-xs font-medium text-gray-700 mb-1">Table</label>
                        <input type="text" id="filterTable" placeholder="e.g., admins" class="w-full px-3 py-2 text-sm border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
                    </div>
                    <div>
                        <label for="filterDate" class="block text-xs font-medium text-gray-700 mb-1">Date</label>
                        <input type="date" id="filterDate" class="w-full px-3 py-2 text-sm border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
                    </div>
                </div>
            </div>

            <div class="overflow-x-auto -mx-0">
                <table class="w-full min-w-[760px]">
                    <thead class="bg-surface border-b border-line">
                        <tr>
                            <th class="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Date/Time</th>
                            <th class="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">User</th>
                            <th class="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Table</th>
                            <th class="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Field</th>
                            <th class="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Changes</th>
                            <th class="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Device</th>
                            <th class="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">IP Address</th>
                        </tr>
                    </thead>
                    <tbody id="auditLogsTableBody" class="divide-y divide-gray-200">
                        <tr>
                            <td colspan="7" class="px-4 py-8 text-center text-sm text-gray-500">
                                Loading audit logs...
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>

            <div class="px-4 sm:px-5 py-3 border-t border-line flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div class="text-sm text-body">
                    Showing <span id="logsCount">0</span> logs
                </div>
                <div class="flex gap-2">
                    <button id="prevPage" class="px-3 py-1.5 text-sm font-medium text-ink bg-white border border-line rounded-lg hover:bg-surface disabled:opacity-50 disabled:cursor-not-allowed" disabled>
                        Previous
                    </button>
                    <button id="nextPage" class="px-3 py-1.5 text-sm font-medium text-ink bg-white border border-line rounded-lg hover:bg-surface disabled:opacity-50 disabled:cursor-not-allowed" disabled>
                        Next
                    </button>
                </div>
            </div>
        </div>
    `;
}

export function AuditLogs() {
    return `
        <div class="min-h-screen bg-gray-50">
            ${AdminNavbar()}

            <main class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                <div class="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                        <h1 class="text-2xl font-semibold text-gray-900">Audit Logs</h1>
                        <p class="text-sm text-gray-500 mt-1">Track all changes made across the system</p>
                    </div>
                    <div class="flex gap-2">
                        <button
                            id="refreshLogsBtn"
                            class="px-4 py-2 text-sm font-medium text-white bg-blue-900 hover:bg-blue-800 rounded-md transition flex items-center gap-2">
                            <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                            </svg>
                            <span>Refresh</span>
                        </button>
                    </div>
                </div>

                <div class="bg-white border border-gray-200 rounded-lg shadow-sm">
                    <div class="p-4 border-b border-gray-200">
                        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                            <div>
                                <label for="filterUserType" class="block text-xs font-medium text-gray-700 mb-1">User Type</label>
                                <select id="filterUserType" class="w-full px-3 py-2 text-sm border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
                                    <option value="">All</option>
                                    <option value="admin">Admin</option>
                                    <option value="adviser">Adviser</option>
                                    <option value="student">Student</option>
                                </select>
                            </div>
                            <div>
                                <label for="filterAction" class="block text-xs font-medium text-gray-700 mb-1">Action</label>
                                <select id="filterAction" class="w-full px-3 py-2 text-sm border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
                                    <option value="">All</option>
                                    <option value="CREATE">Create</option>
                                    <option value="UPDATE">Update</option>
                                    <option value="DELETE">Delete</option>
                                </select>
                            </div>
                            <div>
                                <label for="filterTable" class="block text-xs font-medium text-gray-700 mb-1">Table</label>
                                <input type="text" id="filterTable" placeholder="e.g., admins" class="w-full px-3 py-2 text-sm border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
                            </div>
                            <div>
                                <label for="filterDate" class="block text-xs font-medium text-gray-700 mb-1">Date</label>
                                <input type="date" id="filterDate" class="w-full px-3 py-2 text-sm border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
                            </div>
                        </div>
                    </div>

                    <div class="overflow-x-auto">
                        <table class="w-full">
                            <thead class="bg-gray-50 border-b border-gray-200">
                                <tr>
                                    <th class="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Date/Time</th>
                                    <th class="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">User</th>
                                    <th class="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Table</th>
                                    <th class="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Field</th>
                                    <th class="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Changes</th>
                                    <th class="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Device</th>
                                    <th class="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">IP Address</th>
                                </tr>
                            </thead>
                            <tbody id="auditLogsTableBody" class="divide-y divide-gray-200">
                                <tr>
                                    <td colspan="7" class="px-4 py-8 text-center text-sm text-gray-500">
                                        Loading audit logs...
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </div>

                    <div class="px-4 py-3 border-t border-gray-200 flex items-center justify-between">
                        <div class="text-sm text-gray-600">
                            Showing <span id="logsCount">0</span> logs
                        </div>
                        <div class="flex gap-2">
                            <button id="prevPage" class="px-3 py-1 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed" disabled>
                                Previous
                            </button>
                            <button id="nextPage" class="px-3 py-1 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed" disabled>
                                Next
                            </button>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    `;
}

export function initAuditLogsEmbedded() {
    let currentPage = 0;
    const pageSize = 20;
    let allLogs = [];

    function setTableMessage(message, isError = false) {
        const tbody = document.getElementById('auditLogsTableBody');
        if (!tbody) return;
        tbody.innerHTML = `
            <tr>
                <td colspan="7" class="px-4 py-8 text-center text-sm ${isError ? 'text-red-600' : 'text-gray-500'}">
                    ${message}
                </td>
            </tr>
        `;
    }

    async function loadAuditLogs(filters = {}) {
        const tbody = document.getElementById('auditLogsTableBody');
        if (!tbody) return;

        try {
            const response = await getCombinedAuditLogs(filters, 'admin');

            if (!document.getElementById('auditLogsTableBody')) return;

            if (response && response.success) {
                allLogs = response.data || [];
                const totalLogs = allLogs.length;
                const startIndex = currentPage * pageSize;
                renderLogs(allLogs.slice(startIndex, startIndex + pageSize));
                const logsCount = document.getElementById('logsCount');
                if (logsCount) logsCount.textContent = totalLogs;

                const prevPage = document.getElementById('prevPage');
                const nextPage = document.getElementById('nextPage');
                if (prevPage) prevPage.disabled = currentPage === 0;
                if (nextPage) nextPage.disabled = (currentPage + 1) * pageSize >= totalLogs;
            } else {
                setTableMessage('Failed to load audit logs. Invalid response from server.', true);
            }
        } catch (error) {
            console.error('Failed to load audit logs:', error);
            setTableMessage('Failed to load audit logs. Please try again.', true);
        }
    }

    function escapeHtml(str) {
        if (!str) return '';
        return String(str)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
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
        if (action === 'CREATE') {
            return `
                <span class="inline-flex items-center px-2 py-0.5 rounded text-xs font-bold bg-green-50 text-green-700 border border-green-200">
                    CREATED
                </span>
            `;
        }
        if (action === 'DELETE') {
            return `
                <span class="inline-flex items-center px-2 py-0.5 rounded text-xs font-bold bg-red-50 text-red-700 border border-red-200">
                    DELETED
                </span>
            `;
        }

        const field = (log.field_name || '').toLowerCase();
        const isSchedule = field === 'daily_schedules' || (log.old_value && log.old_value.includes(':') && log.old_value.includes('-')) || (log.new_value && log.new_value.includes(':') && log.new_value.includes('-'));
        const isDateField = ['start_date', 'end_date', 'student_start_date', 'student_end_date', 'event_day_start', 'event_day_end', 'date_joined'].includes(field);
        const isTimeField = ['event_time_start', 'event_time_end', 'start_time', 'end_time'].includes(field);

        if (isSchedule && (log.old_value?.includes(';') || log.new_value?.includes(';') || log.old_value?.includes(':') || log.new_value?.includes(':'))) {
            return `
                <div class="space-y-1.5 text-xs max-h-48 overflow-y-auto pr-1">
                    ${log.old_value && log.old_value !== 'None' ? `
                        <div class="bg-red-50/70 border border-red-100 rounded p-2">
                            <span class="text-[10px] font-bold text-red-600 uppercase tracking-wider block mb-1">Previous Schedule</span>
                            <div class="line-through text-red-800/80">${formatScheduleString(log.old_value)}</div>
                        </div>
                    ` : ''}
                    ${log.new_value && log.new_value !== 'None' ? `
                        <div class="bg-green-50/70 border border-green-100 rounded p-2">
                            <span class="text-[10px] font-bold text-green-700 uppercase tracking-wider block mb-1">New Schedule</span>
                            <div class="text-green-800">${formatScheduleString(log.new_value)}</div>
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
                <span class="text-green-600 text-xs">${escapeHtml(formattedNew)}</span>
            </div>
        `;
    }

    function renderLogs(logs) {
        const tbody = document.getElementById('auditLogsTableBody');
        if (!tbody) return;

        if (!logs || logs.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="7" class="px-4 py-8 text-center text-sm text-gray-500">
                        No audit logs found.
                    </td>
                </tr>
            `;
            return;
        }

        tbody.innerHTML = logs.map(log => `
            <tr class="hover:bg-gray-50 cursor-pointer audit-log-row" data-log-id="${log.display_id || log.id}">
                <td class="px-4 py-3 text-sm text-gray-900 whitespace-nowrap">
                    ${formatDate(log.created_at)}
                </td>
                <td class="px-4 py-3 text-sm text-gray-900">
                    <div class="font-medium">${escapeHtml(log.user_name || 'Unknown')}</div>
                    <div class="text-xs text-gray-500">${escapeHtml(log.user_type)}</div>
                </td>
                <td class="px-4 py-3 text-sm text-gray-900 font-mono text-xs">
                    ${escapeHtml(getReadableTableName(log.table_name))}
                </td>
                <td class="px-4 py-3 text-sm text-gray-900">
                    ${escapeHtml(getReadableFieldName(log.field_name) || '-')}
                </td>
                <td class="px-4 py-3 text-sm text-gray-900 max-w-sm sm:max-w-md">
                    ${renderChangesCell(log)}
                </td>
                <td class="px-4 py-3 text-sm text-gray-900">
                    <div class="text-xs">${escapeHtml(log.device_type || '-')}</div>
                    <div class="text-xs text-gray-500">${escapeHtml(log.browser || '-')} / ${escapeHtml(log.os || '-')}</div>
                </td>
                <td class="px-4 py-3 text-sm text-gray-900 font-mono text-xs">
                    ${escapeHtml(log.ip_address || '-')}
                </td>
            </tr>
        `).join('');

        tbody.querySelectorAll('.audit-log-row').forEach(row => {
            row.addEventListener('click', () => {
                const logId = row.getAttribute('data-log-id');
                navigate(`/admin/audit-logs?highlight=${logId}`);
            });
        });
    }

    function getReadableFieldName(fieldName) {
        const fieldMap = {
            'organization_id': 'Organization',
            'organization_ids': 'Organizations',
            'organization_name': 'Organization Name',
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

        if (fieldMap[fieldName]) {
            return fieldMap[fieldName];
        }

        return fieldName
            .replace(/_/g, ' ')
            .replace(/\b\w/g, char => char.toUpperCase());
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

        if (tableMap[tableName]) {
            return tableMap[tableName];
        }

        return tableName
            .replace(/_/g, ' ')
            .replace(/\b\w/g, char => char.toUpperCase());
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

    function getCurrentFilters() {
        return {
            user_type: document.getElementById('filterUserType')?.value || '',
            action: document.getElementById('filterAction')?.value || '',
            table_name: document.getElementById('filterTable')?.value || '',
            start_date: document.getElementById('filterDate')?.value || ''
        };
    }

    if (!document.getElementById('auditLogsTableBody')) {
        return;
    }

    document.getElementById('refreshLogsBtn')?.addEventListener('click', () => {
        currentPage = 0;
        loadAuditLogs(getCurrentFilters());
    });

    document.getElementById('filterUserType')?.addEventListener('change', () => {
        currentPage = 0;
        loadAuditLogs(getCurrentFilters());
    });

    document.getElementById('filterAction')?.addEventListener('change', () => {
        currentPage = 0;
        loadAuditLogs(getCurrentFilters());
    });

    document.getElementById('filterTable')?.addEventListener('input', () => {
        currentPage = 0;
        loadAuditLogs(getCurrentFilters());
    });

    document.getElementById('filterDate')?.addEventListener('change', () => {
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

    loadAuditLogs();
}

export function initAuditLogs() {
    protectAdminRoute();
    initAdminNavbar();
    let currentPage = 0;
    const pageSize = 20;
    let allLogs = [];

    const urlParams = new URLSearchParams(window.location.search);
    const highlightLogId = urlParams.get('highlight');

    function setTableMessage(message, isError = false) {
        const tbody = document.getElementById('auditLogsTableBody');
        if (!tbody) return;
        tbody.innerHTML = `
            <tr>
                <td colspan="7" class="px-4 py-8 text-center text-sm ${isError ? 'text-red-600' : 'text-gray-500'}">
                    ${message}
                </td>
            </tr>
        `;
    }

    async function loadAuditLogs(filters = {}) {
        if (!document.getElementById('auditLogsTableBody')) return;

        try {
            const response = await getCombinedAuditLogs(filters, 'admin');

            if (!document.getElementById('auditLogsTableBody')) return;

            if (response && response.success) {
                allLogs = response.data || [];
                const totalLogs = allLogs.length;
                const startIndex = currentPage * pageSize;
                renderLogs(allLogs.slice(startIndex, startIndex + pageSize));
                const logsCount = document.getElementById('logsCount');
                if (logsCount) logsCount.textContent = totalLogs;

                const prevPage = document.getElementById('prevPage');
                const nextPage = document.getElementById('nextPage');
                if (prevPage) prevPage.disabled = currentPage === 0;
                if (nextPage) nextPage.disabled = (currentPage + 1) * pageSize >= totalLogs;

                if (highlightLogId) {
                    highlightLog(highlightLogId);
                }
            } else {
                setTableMessage('Failed to load audit logs. Invalid response from server.', true);
            }
        } catch (error) {
            console.error('Failed to load audit logs:', error);
            setTableMessage('Failed to load audit logs. Please try again.', true);
        }
    }

    function highlightLog(logId) {
        const tbody = document.getElementById('auditLogsTableBody');
        if (!tbody) return;
        const targetRow = tbody.querySelector(`[data-log-id="${logId}"]`)
            || tbody.querySelector(`[data-log-id$="-${logId}"]`);
        if (targetRow) {
            targetRow.classList.add('bg-blue-100', 'border-l-4', 'border-blue-500');
            targetRow.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
    }

    function escapeHtml(str) {
        if (!str) return '';
        return String(str)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
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
        if (action === 'CREATE') {
            return `
                <span class="inline-flex items-center px-2 py-0.5 rounded text-xs font-bold bg-green-50 text-green-700 border border-green-200">
                    CREATED
                </span>
            `;
        }
        if (action === 'DELETE') {
            return `
                <span class="inline-flex items-center px-2 py-0.5 rounded text-xs font-bold bg-red-50 text-red-700 border border-red-200">
                    DELETED
                </span>
            `;
        }

        const field = (log.field_name || '').toLowerCase();
        const isSchedule = field === 'daily_schedules' || (log.old_value && log.old_value.includes(':') && log.old_value.includes('-')) || (log.new_value && log.new_value.includes(':') && log.new_value.includes('-'));
        const isDateField = ['start_date', 'end_date', 'student_start_date', 'student_end_date', 'event_day_start', 'event_day_end', 'date_joined'].includes(field);
        const isTimeField = ['event_time_start', 'event_time_end', 'start_time', 'end_time'].includes(field);

        if (isSchedule && (log.old_value?.includes(';') || log.new_value?.includes(';') || log.old_value?.includes(':') || log.new_value?.includes(':'))) {
            return `
                <div class="space-y-1.5 text-xs max-h-48 overflow-y-auto pr-1">
                    ${log.old_value && log.old_value !== 'None' ? `
                        <div class="bg-red-50/70 border border-red-100 rounded p-2">
                            <span class="text-[10px] font-bold text-red-600 uppercase tracking-wider block mb-1">Previous Schedule</span>
                            <div class="line-through text-red-800/80">${formatScheduleString(log.old_value)}</div>
                        </div>
                    ` : ''}
                    ${log.new_value && log.new_value !== 'None' ? `
                        <div class="bg-green-50/70 border border-green-100 rounded p-2">
                            <span class="text-[10px] font-bold text-green-700 uppercase tracking-wider block mb-1">New Schedule</span>
                            <div class="text-green-800">${formatScheduleString(log.new_value)}</div>
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
                <span class="text-green-600 text-xs">${escapeHtml(formattedNew)}</span>
            </div>
        `;
    }

    function renderLogs(logs) {
        const tbody = document.getElementById('auditLogsTableBody');
        if (!tbody) return;

        if (!logs || logs.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="7" class="px-4 py-8 text-center text-sm text-gray-500">
                        No audit logs found.
                    </td>
                </tr>
            `;
            return;
        }

        tbody.innerHTML = logs.map(log => `
            <tr class="hover:bg-gray-50 cursor-pointer audit-log-row" data-log-id="${log.display_id || log.id}">
                <td class="px-4 py-3 text-sm text-gray-900 whitespace-nowrap">
                    ${formatDate(log.created_at)}
                </td>
                <td class="px-4 py-3 text-sm text-gray-900">
                    <div class="font-medium">${escapeHtml(log.user_name || 'Unknown')}</div>
                    <div class="text-xs text-gray-500">${escapeHtml(log.user_type)}</div>
                </td>
                <td class="px-4 py-3 text-sm text-gray-900 font-mono text-xs">
                    ${escapeHtml(getReadableTableName(log.table_name))}
                </td>
                <td class="px-4 py-3 text-sm text-gray-900">
                    ${escapeHtml(getReadableFieldName(log.field_name) || '-')}
                </td>
                <td class="px-4 py-3 text-sm text-gray-900 max-w-sm sm:max-w-md">
                    ${renderChangesCell(log)}
                </td>
                <td class="px-4 py-3 text-sm text-gray-900">
                    <div class="text-xs">${escapeHtml(log.device_type || '-')}</div>
                    <div class="text-xs text-gray-500">${escapeHtml(log.browser || '-')} / ${escapeHtml(log.os || '-')}</div>
                </td>
                <td class="px-4 py-3 text-sm text-gray-900 font-mono text-xs">
                    ${escapeHtml(log.ip_address || '-')}
                </td>
            </tr>
        `).join('');

        tbody.querySelectorAll('.audit-log-row').forEach(row => {
            row.addEventListener('click', () => {

                tbody.querySelectorAll('.audit-log-row').forEach(r => {
                    r.classList.remove('bg-blue-100', 'border-l-4', 'border-blue-500');
                });

                row.classList.add('bg-blue-100', 'border-l-4', 'border-blue-500');
            });
        });
    }

    function getActionClass(action) {
        switch (action) {
            case 'CREATE':
                return 'bg-green-100 text-green-800';
            case 'UPDATE':
                return 'bg-blue-100 text-blue-800';
            case 'DELETE':
                return 'bg-red-100 text-red-800';
            default:
                return 'bg-gray-100 text-gray-800';
        }
    }

    function getReadableFieldName(fieldName) {
        const fieldMap = {
            'organization_id': 'Organization',
            'organization_ids': 'Organizations',
            'organization_name': 'Organization Name',
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
        
        if (fieldMap[fieldName]) {
            return fieldMap[fieldName];
        }

        return fieldName
            .replace(/_/g, ' ')
            .replace(/\b\w/g, char => char.toUpperCase());
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
        
        if (tableMap[tableName]) {
            return tableMap[tableName];
        }

        return tableName
            .replace(/_/g, ' ')
            .replace(/\b\w/g, char => char.toUpperCase());
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
            start_date: document.getElementById('filterDate').value
        };
    }

    document.getElementById('refreshLogsBtn').addEventListener('click', () => {
        currentPage = 0;
        loadAuditLogs(getCurrentFilters());
    });

    document.getElementById('filterUserType').addEventListener('change', () => {
        currentPage = 0;
        loadAuditLogs(getCurrentFilters());
    });

    document.getElementById('filterAction').addEventListener('change', () => {
        currentPage = 0;
        loadAuditLogs(getCurrentFilters());
    });

    document.getElementById('filterTable').addEventListener('input', () => {
        currentPage = 0;
        loadAuditLogs(getCurrentFilters());
    });

    document.getElementById('filterDate').addEventListener('change', () => {
        currentPage = 0;
        loadAuditLogs(getCurrentFilters());
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

    loadAuditLogs();
}

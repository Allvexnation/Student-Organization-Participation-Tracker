import { getAdviserData } from '../../api/adviser/AdviserAuth/AdviserAuth.js';
import { AdviserNavbar, initAdviserNavbar } from '../../components/Navbar/AdviserNavbar.js';
import { isAuthenticated, getUserRole } from '../../utils/jwt.js';
import { navigate } from '../../utils/navigation.js';
import { getDashboardCounts } from '../../api/adviser/Dashboard/AdviserDashboard.js';
import { AdviserAuditLogsEmbedded, initAdviserAuditLogsEmbedded } from './AdviserAuditLogs.js';
import { DashboardLayout, fillDashboardStats, initDashboardTransition } from '../../components/Layout/Dashboard/Dashboard.js';

export function AdviserDashboard() {
    const adviserData = getAdviserData();
    const displayName = adviserData?.firstName || 'Adviser';

    return DashboardLayout({
        navbar: AdviserNavbar(),
        displayName,
        badge: 'Adviser portal',
        subtitle: 'Track your organizations, events, memberships, and pending requests.',
        extraLabel: 'Organization activity',
        extraHint: 'Logs from you and associated students across shared organizations, tasks, events, and attendance. Logs cannot be deleted.',
        extra: AdviserAuditLogsEmbedded()
    });
}

function getPrimaryCards(stats) {
    return [
        { href: '/adviser/organization', imageKey: 'students', label: 'Total Students', value: stats.totalStudents, valueId: 'total-students', icon: 'users' },
        { href: '/adviser/organization', imageKey: 'organizations', label: 'Organizations', value: stats.totalOrganizations, valueId: 'total-organizations', icon: 'building-2' },
        { href: '/adviser/events', imageKey: 'events', label: 'Active Events', value: stats.activeEvents, valueId: 'active-events', icon: 'calendar' }
    ];
}

function getSecondaryCards(stats) {
    return [
        { href: '/adviser/events', label: 'Event Registrations', value: stats.eventRegistrations, valueId: 'event-registrations', icon: 'clipboard-list' },
        { href: '/adviser/organization', label: 'Org Memberships', value: stats.orgMemberships, valueId: 'org-memberships', icon: 'user-check' },
        { href: '/adviser/organization', label: 'Pending Requests', value: stats.pendingRequests, valueId: 'pending-requests', icon: 'clock' }
    ];
}

export async function initAdviserDashboard() {
    const auth = await isAuthenticated('adviser');
    if (!auth || getUserRole('adviser') !== 'adviser') {
        navigate('/auth/adviser/login');
        return;
    }
    await initAdviserNavbar();
    const finishDashboardEnter = initDashboardTransition();

    try {
        const counts = await getDashboardCounts();
        fillDashboardStats({
            primary: getPrimaryCards(counts),
            secondary: getSecondaryCards(counts)
        });
        initAdviserAuditLogsEmbedded();
    } catch (error) {
        console.error('Error loading dashboard data:', error);
    } finally {
        finishDashboardEnter();
    }
}

import { getAdminData } from '../../api/admin/AdminLogin.js';
import { AdminNavbar, initAdminNavbar } from '../../components/Navbar/AdminNavbar.js';
import { protectAdminRoute } from '../../middleware/AdminMiddleware.js';
import { isAuthenticated, getUserRole } from '../../utils/jwt.js';
import { navigate } from '../../utils/navigation.js';
import { getDashboardCounts } from '../../api/admin/Dashboard/AdminDashboard.js';
import { AuditLogsEmbedded, initAuditLogsEmbedded } from '../AuditLogs/AuditLogs.js';
import { DashboardLayout, fillDashboardStats, initDashboardTransition } from '../../components/Layout/Dashboard/Dashboard.js';

export function AdminDashboard() {
    const adminData = getAdminData();
    const displayName = adminData?.firstName || 'Admin';

    return DashboardLayout({
        navbar: AdminNavbar(),
        displayName,
        badge: 'Admin portal',
        subtitle: 'Monitor students, organizations, events, and recent system activity.',
        extra: AuditLogsEmbedded()
    });
}

function getPrimaryCards(stats) {
    return [
        { href: '/admin/students', imageKey: 'students', label: 'Total Students', value: stats.totalStudents, valueId: 'total-students', icon: 'users' },
        { href: '/admin/organizations', imageKey: 'organizations', label: 'Organizations', value: stats.totalOrganizations, valueId: 'total-organizations', icon: 'building-2' },
        { href: '/admin/events', imageKey: 'events', label: 'Total Events', value: stats.activeEvents, valueId: 'active-events', icon: 'calendar' }
    ];
}

function getSecondaryCards(stats) {
    return [
        { href: '/admin/event-registrations', label: 'Event Registrations', value: stats.eventRegistrations, valueId: 'event-registrations', icon: 'clipboard-list' },
        { href: '/admin/org-memberships', label: 'Org Memberships', value: stats.orgMemberships, valueId: 'org-memberships', icon: 'user-check' },
        { href: '/admin/adviser', label: 'Advisers', value: stats.totalAdvisers, valueId: 'total-advisers', icon: 'user-cog' }
    ];
}

export async function initAdminDashboard() {
    const auth = await isAuthenticated('admin');
    if (!auth || getUserRole('admin') !== 'admin') {
        navigate('/auth/admin/login');
        return;
    }
    protectAdminRoute();
    await initAdminNavbar();
    const finishDashboardEnter = initDashboardTransition();

    try {
        const counts = await getDashboardCounts();
        fillDashboardStats({
            primary: getPrimaryCards(counts),
            secondary: getSecondaryCards(counts)
        });
        initAuditLogsEmbedded();
    } catch (error) {
        console.error('Error loading dashboard data:', error);
    } finally {
        finishDashboardEnter();
    }
}

import { getStudentData } from '../../api/students/StudentAuth/StudentAuth.js';
import { StudentNavbar, initStudentNavbar } from '../../components/Navbar/StudentNavbar.js';
import { isAuthenticated, getUserRole } from '../../utils/jwt.js';
import { navigate } from '../../utils/navigation.js';
import { getStudentProfile } from '../../api/students/StudentProfile.js';
import { getStudentAttendanceEvents } from '../../api/students/Attendance/Attendance.js';
import { StudentAuditLogsEmbedded, initStudentAuditLogsEmbedded } from '../AuditLogs/StudentAuditLogs.js';
import { DashboardLayout, fillDashboardStats, initDashboardTransition } from '../../components/Layout/Dashboard/Dashboard.js';

export function StudentDashboard() {
    const studentData = getStudentData();
    const displayName = studentData?.firstName || 'Student';

    return DashboardLayout({
        navbar: StudentNavbar(),
        displayName,
        badge: 'Student portal',
        subtitle: 'See your organizations, events, tasks, and attendance in one view.',
        extraLabel: 'Organization activity',
        extraHint: 'Logs from you and associated advisers across shared organizations, tasks, events, and attendance. Adviser device and IP details are hidden, and logs cannot be deleted.',
        extra: StudentAuditLogsEmbedded()
    });
}

function getPrimaryCards(stats) {
    return [
        { href: '/student/profile', imageKey: 'organizations', label: 'My Organizations', value: stats.totalOrganizations, valueId: 'total-organizations', icon: 'building-2' },
        { href: '/events', imageKey: 'events', label: 'Registered Events', value: stats.totalEvents, valueId: 'total-events', icon: 'calendar' },
        { href: '/student/tasks', imageKey: 'tasks', label: 'Unfinished Tasks', value: stats.unfinishedTasks, valueId: 'unfinished-tasks', icon: 'clock' }
    ];
}

function getSecondaryCards(stats) {
    return [
        { href: '/events', label: 'Upcoming Events', value: stats.upcomingEvents, valueId: 'upcoming-events', icon: 'calendar-clock' },
        { href: '/student/profile', label: 'Advisers', value: stats.adviserCount, valueId: 'advisers', icon: 'users' },
        { href: '/student/attendance', label: 'Attendance', value: stats.attendance, valueId: 'attendance', icon: 'calendar-check' }
    ];
}

function emptyStats() {
    return {
        totalOrganizations: 0,
        totalEvents: 0,
        unfinishedTasks: 0,
        upcomingEvents: 0,
        adviserCount: 0,
        attendance: 0
    };
}

export async function initStudentDashboard() {
    if (!(await isAuthenticated('student')) || getUserRole('student') !== 'student') {
        navigate('/auth/student/login');
        return;
    }
    await initStudentNavbar();
    const finishDashboardEnter = initDashboardTransition();

    try {
        const studentProfile = await getStudentProfile();
        const attendanceEvents = await getStudentAttendanceEvents();

        const stats = {
            totalOrganizations: studentProfile?.organizations?.length || 0,
            totalEvents: studentProfile?.events?.length || 0,
            unfinishedTasks: studentProfile?.unfinishedTasks || 0,
            upcomingEvents: studentProfile?.upcomingEvents?.length || 0,
            adviserCount: studentProfile?.adviserCount || 0,
            attendance: attendanceEvents?.length || 0
        };

        fillDashboardStats({
            primary: getPrimaryCards(stats),
            secondary: getSecondaryCards(stats)
        });
    } catch (error) {
        console.error('Error loading dashboard data:', error);
        fillDashboardStats({
            primary: getPrimaryCards(emptyStats()),
            secondary: getSecondaryCards(emptyStats())
        });
    } finally {
        initStudentAuditLogsEmbedded();
        finishDashboardEnter();
    }
}

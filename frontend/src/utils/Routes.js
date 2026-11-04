import { HomePage, initHomePage } from '../pages/HomePage.js';
import { AdminLogin, initAdminLogin } from '../pages/admin/AdminLogin.js';
import { AdminForgotPassword, initAdminForgotPassword } from '../pages/admin/AdminForgotPassword.js';
import { AdminDashboard, initAdminDashboard } from '../pages/admin/AdminDashboard.js';
import { AdminProfile, initAdminProfile } from '../pages/admin/AdminProfile.js';
import { AdminSettings, initAdminSettings } from '../components/Layout/Admin/AdminSettings.js';
import { ManageUsers, initManageUsers } from '../components/Layout/Admin/ManageUsers.js';
import { ManageAdviser, initManageAdviser } from '../pages/admin/Adviser/ManageAdviser.js';
import { ManageAdmins, initManageAdmins } from '../pages/admin/Admins/ManageAdmins.js';
import { ManageRoles, initManageRoles } from '../pages/admin/roles/ManageRoles.js';
import { ManageStudents, initManageStudents } from '../pages/admin/Students/ManageStudents.js';
import { AdminOrganizations, initAdminOrganizations } from '../components/Layout/Admin/AdminOrganizations.js';
import { ManageOrganizations, initManageOrganizations } from '../pages/admin/Organizations/ManageOrganizations.js';
import { AdminEvents, initAdminEvents } from '../components/Layout/Admin/AdminEvents.js';
import { ManageEvents, initManageEvents } from '../pages/admin/Events/ManageEvents.js';
import { ManageEventRegist, initManageEventRegist } from '../pages/admin/EventRegistrations/ManageEventRegist.js';
import { ManageOrgMemberships, initManageOrgMemberships } from '../pages/admin/OrgMemeberships/ManageOrgMemberships.js';
import { AuditLogs, initAuditLogs } from '../pages/AuditLogs/AuditLogs.js';
import { ManageBanned, initManageBanned } from '../pages/admin/Banned/ManageBanned.js';
import { ManageWebAnalytics, initManageWebAnalytics } from '../pages/admin/WebAnalytics/ManageWebAnalytics.js';
import { ManageContacts, initManageContacts } from '../pages/admin/Contacts/ManageContacts.js';
import { AdviserLogin, initAdviserLogin } from '../pages/adviser/AdviserLogin.js';
import { AdviserDashboard, initAdviserDashboard } from '../pages/adviser/AdviserDashboard.js';
import { AdviserProfile, initAdviserProfile } from '../pages/adviser/AdviserProfile.js';
import { AdviserOrganization, initAdviserOrganization } from '../pages/adviser/Organization/AdviserOrganization.js';
import { AdviserEvents, initAdviserEvents } from '../pages/adviser/Events/AdviserEvents.js';
import { Attendance, initAttendance } from '../pages/adviser/Attendance/Attendance.js';
import { AdviserAuditLogs, initAdviserAuditLogs } from '../pages/adviser/AdviserAuditLogs.js';
import { AdviserForgotPassword, initAdviserForgotPassword } from '../pages/adviser/AdviserForgotPassword.js';
import { StudentLogin, initStudentLogin } from '../pages/students/StudentLogin.js';
import { StudentForgotPassword, initStudentForgotPassword } from '../pages/students/StudentForgotPassword.js';
import { StudentDashboard, initStudentDashboard } from '../pages/students/StudentDashboard.js';
import { StudentProfile, initStudentProfile } from '../pages/students/StudentProfile.js';
import { EventTask, initEventTask } from '../pages/students/Task/EventTask.js';
import { StudentAttendance, initStudentAttendance } from '../pages/students/Attendance/Attendance.js';
import { StudentAuditLogs, initStudentAuditLogs } from '../pages/AuditLogs/StudentAuditLogs.js';
import { NotFoundPage, initNotFoundPage } from '../pages/404/404.js';
import { isAuthenticated, getUserRole, isSuperAdmin } from './jwt.js';
import { initUpdates, UpdatesPage, initUpdatesPage } from '../pages/web/Updates.js';
import { Banned, initBanned } from '../pages/web/Banned.js';
import { BannedContacts, initBannedContacts } from '../pages/Contacts/BannedContacts.js';
import { ContactSupports, initContactSupports } from '../pages/Contacts/ContactSupports.js';
import { EventsPage, initEventsPage } from '../pages/Events/Events.js';
import { checkBan } from '../api/web/Banned.js';
import { trackPageVisit, updateCurrentUrl } from './WebAnalytics.js';
import { updateSEO } from './seo.js';

export const routes = {
    '/': HomePage,
    '/auth/admin/login': AdminLogin,
    '/auth/admin/forgot-password': AdminForgotPassword,
    '/admin/dashboard': AdminDashboard,
    '/admin/profile': AdminProfile,
    '/admin/settings': AdminSettings,
    '/admin/audit-logs': AdminSettings,
    '/admin/banned': AdminSettings,
    '/admin/analytics': AdminSettings,
    '/audit-logs': AuditLogs,
    '/admin/users': ManageUsers,
    '/admin/adviser': ManageAdviser,
    '/admin/admins': ManageAdmins,
    '/admin/roles': ManageRoles,
    '/admin/students': ManageStudents,
    '/admin/organizations': AdminOrganizations,
    '/admin/events': AdminEvents,
    '/admin/event-registrations': ManageEventRegist,
    '/admin/org-memberships': ManageOrgMemberships,
    '/admin/contacts': ManageContacts,
    '/auth/adviser/login': AdviserLogin,
    '/auth/adviser/forgot-password': AdviserForgotPassword,
    '/adviser/dashboard': AdviserDashboard,
    '/adviser/profile': AdviserProfile,
    '/adviser/organization': AdviserOrganization,
    '/adviser/events': AdviserEvents,
    '/adviser/attendance': Attendance,
    '/adviser/audit-logs': AdviserAuditLogs,
    '/auth/student/login': StudentLogin,
    '/auth/student/forgot-password': StudentForgotPassword,
    '/student/dashboard': StudentDashboard,
    '/student/profile': StudentProfile,
    '/student/tasks': EventTask,
    '/student/attendance': StudentAttendance,
    '/student/audit-logs': StudentAuditLogs,
    '/updates': UpdatesPage,
    '/banned': Banned,
    '/banned-contacts': BannedContacts,
    '/support': ContactSupports,
    '/events': EventsPage,
    '404': NotFoundPage
};

export const initFunctions = {
    '/': initHomePage,
    '/auth/admin/login': initAdminLogin,
    '/auth/admin/forgot-password': initAdminForgotPassword,
    '/admin/dashboard': initAdminDashboard,
    '/admin/profile': initAdminProfile,
    '/admin/settings': initAdminSettings,
    '/admin/audit-logs': initAdminSettings,
    '/admin/banned': initAdminSettings,
    '/admin/analytics': initAdminSettings,
    '/audit-logs': initAuditLogs,
    '/admin/users': initManageUsers,
    '/admin/adviser': initManageAdviser,
    '/admin/admins': initManageAdmins,
    '/admin/roles': initManageRoles,
    '/admin/students': initManageStudents,
    '/admin/organizations': initAdminOrganizations,
    '/admin/events': initAdminEvents,
    '/admin/event-registrations': initManageEventRegist,
    '/admin/org-memberships': initManageOrgMemberships,
    '/admin/contacts': initManageContacts,
    '/auth/adviser/login': initAdviserLogin,
    '/auth/adviser/forgot-password': initAdviserForgotPassword,
    '/adviser/dashboard': initAdviserDashboard,
    '/adviser/profile': initAdviserProfile,
    '/adviser/organization': initAdviserOrganization,
    '/adviser/events': initAdviserEvents,
    '/adviser/attendance': initAttendance,
    '/adviser/audit-logs': initAdviserAuditLogs,
    '/auth/student/login': initStudentLogin,
    '/auth/student/forgot-password': initStudentForgotPassword,
    '/student/dashboard': initStudentDashboard,
    '/student/profile': initStudentProfile,
    '/student/tasks': initEventTask,
    '/student/attendance': initStudentAttendance,
    '/student/audit-logs': initStudentAuditLogs,
    '/updates': initUpdatesPage,
    '/banned': initBanned,
    '/banned-contacts': initBannedContacts,
    '/support': initContactSupports,
    '/events': initEventsPage,
    '404': initNotFoundPage
};

export function getCurrentRoute() {
    return window.location.pathname;
}

export function navigate(path) {
    window.history.pushState({}, '', path);
    updateCurrentUrl();
}

const BAN_CHECK_TTL_MS = 60000;
const BAN_CHECK_CACHE_KEY = 'soptBanCheck';

function readBanCheckCache() {
    try {
        const raw = sessionStorage.getItem(BAN_CHECK_CACHE_KEY);
        if (!raw) return null;
        const cached = JSON.parse(raw);
        if (!cached || Date.now() - cached.at > BAN_CHECK_TTL_MS) return null;
        return cached;
    } catch {
        return null;
    }
}

function writeBanCheckCache(banCheck) {
    sessionStorage.setItem(BAN_CHECK_CACHE_KEY, JSON.stringify({
        at: Date.now(),
        banned: !!banCheck?.banned,
        ban_info: banCheck?.ban_info || null
    }));
}

function buildBanCheckData() {
    const checkData = {};
    const userRole = getUserRole();

    if (userRole && (userRole === 'admin' || userRole === 'adviser' || userRole === 'student')) {
        const userData = JSON.parse(localStorage.getItem(`${userRole}Data`) || '{}');
        if (userData && userData.id) {
            checkData.target_type = userRole;
            checkData.target_id = userData.id;
        }
    }

    return checkData;
}

function applyBanCheckResult(banCheck) {
    if (banCheck?.banned) {
        localStorage.setItem('banInfo', JSON.stringify(banCheck.ban_info));
        return true;
    }

    localStorage.removeItem('banInfo');
    return false;
}

async function refreshBanCheck() {
    const banCheck = await checkBan(buildBanCheckData());
    writeBanCheckCache(banCheck);
    return banCheck;
}

export async function render(root, routes, initFunctions) {
    let route = getCurrentRoute();

    if (route === '/app.js') {
        navigate('/404');
        return;
    }

    if (route !== '/banned' && route !== '404') {
        const cachedBanCheck = readBanCheckCache();

        if (cachedBanCheck?.banned) {
            localStorage.setItem('banInfo', JSON.stringify(cachedBanCheck.ban_info));
            navigate('/banned');
            route = '/banned';
        } else if (!cachedBanCheck) {
            try {
                const banCheck = await refreshBanCheck();
                if (applyBanCheckResult(banCheck)) {
                    navigate('/banned');
                    route = '/banned';
                }
            } catch (error) {
                console.error('Ban check error:', error);
            }
        } else {
            refreshBanCheck().then((banCheck) => {
                if (applyBanCheckResult(banCheck) && getCurrentRoute() !== '/banned') {
                    navigate('/banned');
                    if (window.appNavigate) {
                        window.appNavigate('/banned');
                    }
                }
            }).catch((error) => {
                console.error('Ban check error:', error);
            });
        }
    }

    if (route === '/admin/admins') {
        const authAdmin = await isAuthenticated('admin');
        if (!authAdmin || !isSuperAdmin('admin')) {
            navigate('/404');
            return;
        }
    }

    if (route === '/admin/banned') {
        const authAdmin = await isAuthenticated('admin');
        if (!authAdmin || !isSuperAdmin('admin')) {
            navigate('/404');
            return;
        }
    }

    if (route === '/admin/analytics') {
        const authAdmin = await isAuthenticated('admin');
        if (!authAdmin || !isSuperAdmin('admin')) {
            navigate('/404');
            return;
        }
    }

    const pageComponent = routes[route] || routes['404'];
    const html = pageComponent();

    if (!swapAuthLoginShell(root, html, route)) {
        root.innerHTML = html;
    }

    updateSEO(route);

    const initFunction = initFunctions[route] || initFunctions['404'];
    if (initFunction) {
        initFunction();

        if (route !== '/banned' && route !== '404') {
            initUpdates();
        }
    }

    trackPageVisit(route);
}

function isAuthLoginPath(path) {
    return /^\/auth\/(admin|adviser|student)\/login$/.test(path);
}

function swapAuthLoginShell(root, html, route) {
    if (!isAuthLoginPath(route)) return false;
    if (!root.querySelector('[data-auth-chips]') || !root.querySelector('[data-auth-panel]')) {
        return false;
    }

    const template = document.createElement('template');
    template.innerHTML = html.trim();
    const nextPanel = template.content.querySelector('[data-auth-panel]');
    const currentPanel = root.querySelector('[data-auth-panel]');
    if (!nextPanel || !currentPanel) return false;

    currentPanel.replaceWith(nextPanel);
    return true;
}

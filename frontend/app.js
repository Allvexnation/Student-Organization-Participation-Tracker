import { HomePage, initHomePage } from './src/pages/HomePage.js';
import { AdminLogin, initAdminLogin } from './src/pages/admin/AdminLogin.js';
import { AdminDashboard, initAdminDashboard } from './src/pages/admin/AdminDashboard.js';
import { AdminProfile, initAdminProfile } from './src/pages/admin/AdminProfile.js';
import { ManageAdviser, initManageAdviser } from './src/pages/admin/Adviser/ManageAdviser.js';
import { ManageRoles, initManageRoles } from './src/pages/admin/roles/ManageRoles.js';
import { ManageStudents, initManageStudents } from './src/pages/admin/Students/ManageStudents.js';
import { ManageOrganizations, initManageOrganizations } from './src/pages/admin/Organizations/ManageOrganizations.js';
import { ManageEvents, initManageEvents } from './src/pages/admin/Events/ManageEvents.js';
import { ManageEventRegist, initManageEventRegist } from './src/pages/admin/EventRegistrations/ManageEventRegist.js';
import { ManageOrgMemberships, initManageOrgMemberships } from './src/pages/admin/OrgMemeberships/ManageOrgMemberships.js';
import { AdviserLogin, initAdviserLogin } from './src/pages/adviser/AdviserLogin.js';
import { AdviserDashboard, initAdviserDashboard } from './src/pages/adviser/AdviserDashboard.js';
import { AdviserProfile, initAdviserProfile } from './src/pages/adviser/AdviserProfile.js';
import { AdviserOrganization, initAdviserOrganization } from './src/pages/adviser/Organization/AdviserOrganization.js';
import { AdviserEvents, initAdviserEvents } from './src/pages/adviser/Events/AdviserEvents.js';
import { AdviserForgotPassword, initAdviserForgotPassword } from './src/pages/adviser/AdviserForgotPassword.js';
import { StudentLogin, initStudentLogin } from './src/pages/students/StudentLogin.js';
import { StudentForgotPassword, initStudentForgotPassword } from './src/pages/students/StudentForgotPassword.js';
import { StudentDashboard, initStudentDashboard } from './src/pages/students/StudentDashboard.js';
import { StudentProfile, initStudentProfile } from './src/pages/students/StudentProfile.js';
import { EventTask, initEventTask } from './src/pages/students/Task/EventTask.js';
import { NotFoundPage, initNotFoundPage } from './src/pages/404/404.js';
import { isAuthenticated, getUserRole } from './src/utils/jwt.js';

const link = document.createElement('link');
link.rel = 'stylesheet';
link.href = '/index.css';
document.head.appendChild(link);

export class App {
    constructor(root) {
        this.root = root;
        this.routes = {
            '/': HomePage,
            '/auth/admin/login': AdminLogin,
            '/admin/dashboard': AdminDashboard,
            '/admin/profile': AdminProfile,
            '/admin/adviser': ManageAdviser,
            '/admin/roles': ManageRoles,
            '/admin/students': ManageStudents,
            '/admin/organizations': ManageOrganizations,
            '/admin/events': ManageEvents,
            '/admin/event-registrations': ManageEventRegist,
            '/admin/org-memberships': ManageOrgMemberships,
            '/auth/adviser/login': AdviserLogin,
            '/auth/adviser/forgot-password': AdviserForgotPassword,
            '/adviser/dashboard': AdviserDashboard,
            '/adviser/profile': AdviserProfile,
            '/adviser/organization': AdviserOrganization,
            '/adviser/events': AdviserEvents,
            '/auth/student/login': StudentLogin,
            '/auth/student/forgot-password': StudentForgotPassword,
            '/student/dashboard': StudentDashboard,
            '/student/profile': StudentProfile,
            '/student/tasks': EventTask,
            '404': NotFoundPage
        };
        this.initFunctions = {
            '/': initHomePage,
            '/auth/admin/login': initAdminLogin,
            '/admin/dashboard': initAdminDashboard,
            '/admin/profile': initAdminProfile,
            '/admin/adviser': initManageAdviser,
            '/admin/roles': initManageRoles,
            '/admin/students': initManageStudents,
            '/admin/organizations': initManageOrganizations,
            '/admin/events': initManageEvents,
            '/admin/event-registrations': initManageEventRegist,
            '/admin/org-memberships': initManageOrgMemberships,
            '/auth/adviser/login': initAdviserLogin,
            '/auth/adviser/forgot-password': initAdviserForgotPassword,
            '/adviser/dashboard': initAdviserDashboard,
            '/adviser/profile': initAdviserProfile,
            '/adviser/organization': initAdviserOrganization,
            '/adviser/events': initAdviserEvents,
            '/auth/student/login': initStudentLogin,
            '/auth/student/forgot-password': initStudentForgotPassword,
            '/student/dashboard': initStudentDashboard,
            '/student/profile': initStudentProfile,
            '/student/tasks': initEventTask,
            '404': initNotFoundPage
        };

        window.addEventListener('popstate', () => this.render());

        window.appNavigate = (path) => this.navigate(path);
    }

    getCurrentRoute() {
        return window.location.pathname;
    }

    navigate(path) {
        window.history.pushState({}, '', path);
        this.render();
    }

    async render() {
        let route = this.getCurrentRoute();

        if (route === '/auth/admin/login') {
            const authAdmin = await isAuthenticated('admin');
            if (authAdmin && getUserRole('admin') === 'admin') {
                this.navigate('/admin/dashboard');
                return;
            }
        }

        if (route === '/auth/adviser/login') {
            const authAdviser = await isAuthenticated('adviser');
            if (authAdviser && getUserRole('adviser') === 'adviser') {
                this.navigate('/adviser/dashboard');
                return;
            }
        }

        if (route === '/auth/student/login') {
            const authStudent = await isAuthenticated('student');
            if (authStudent && getUserRole('student') === 'student') {
                this.navigate('/student/dashboard');
                return;
            }
        }

        const pageComponent = this.routes[route] || this.routes['404'];

        this.root.innerHTML = pageComponent();

        const initFunction = this.initFunctions[route] || this.initFunctions['404'];
        if (initFunction) {
            initFunction();
        }
    }
}

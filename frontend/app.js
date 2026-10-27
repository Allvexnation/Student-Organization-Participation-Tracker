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
import { isAuthenticated } from './src/utils/jwt.js';

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
            '/admin/org-memberships': ManageOrgMemberships
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
            '/admin/org-memberships': initManageOrgMemberships
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

    render() {
        let route = this.getCurrentRoute();

        if (route === '/auth/admin/login' && isAuthenticated()) {
            route = '/admin/dashboard';
            this.navigate('/admin/dashboard');
        }

        const pageComponent = this.routes[route] || this.routes['/'];

        this.root.innerHTML = pageComponent();

        const initFunction = this.initFunctions[route] || this.initFunctions['/'];
        if (initFunction) {
            initFunction();
        }
    }
}

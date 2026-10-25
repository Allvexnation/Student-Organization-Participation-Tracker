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
link.href = 'index.css';
document.head.appendChild(link);

export class App {
    constructor(root) {
        this.root = root;
        this.routes = {
            '': HomePage,
            '#admin-login': AdminLogin,
            '#admin-dashboard': AdminDashboard,
            '#edit-admin-profile': AdminProfile,
            '#manage-adviser': ManageAdviser,
            '#manage-roles': ManageRoles,
            '#manage-students': ManageStudents,
            '#manage-organizations': ManageOrganizations,
            '#manage-events': ManageEvents,
            '#manage-event-registrations': ManageEventRegist,
            '#manage-org-memberships': ManageOrgMemberships
        };
        this.initFunctions = {
            '': initHomePage,
            '#admin-login': initAdminLogin,
            '#admin-dashboard': initAdminDashboard,
            '#edit-admin-profile': initAdminProfile,
            '#manage-adviser': initManageAdviser,
            '#manage-roles': initManageRoles,
            '#manage-students': initManageStudents,
            '#manage-organizations': initManageOrganizations,
            '#manage-events': initManageEvents,
            '#manage-event-registrations': initManageEventRegist,
            '#manage-org-memberships': initManageOrgMemberships
        };
        
        window.addEventListener('hashchange', () => this.render());
    }

    getCurrentRoute() {
        return window.location.hash || '';
    }

    render() {
        let route = this.getCurrentRoute();

        if (route === '#admin-login' && isAuthenticated()) {
            route = '#admin-dashboard';
            window.location.hash = '#admin-dashboard';
        }

        const pageComponent = this.routes[route] || this.routes[''];

        this.root.innerHTML = pageComponent();

        const initFunction = this.initFunctions[route] || this.initFunctions[''];
        if (initFunction) {
            initFunction();
        }
    }
}

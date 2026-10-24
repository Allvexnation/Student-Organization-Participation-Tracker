import { HomePage, initHomePage } from './src/pages/HomePage.js';
import { AdminLogin, initAdminLogin } from './src/pages/admin/AdminLogin.js';
import { AdminDashboard, initAdminDashboard } from './src/pages/admin/AdminDashboard.js';
import { AdminProfile, initAdminProfile } from './src/pages/admin/AdminProfile.js';
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
            '#edit-admin-profile': AdminProfile
        };
        this.initFunctions = {
            '': initHomePage,
            '#admin-login': initAdminLogin,
            '#admin-dashboard': initAdminDashboard,
            '#edit-admin-profile': initAdminProfile
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

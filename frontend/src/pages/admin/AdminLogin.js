import { adminLogin, adminLookupAccount } from '../../api/admin/AdminAuth/AdminAuth.js';
import { googleLogin } from '../../api/auth/GoogleAuth.js';
import { AuthLoginLayout, initAuthLogin } from '../../components/Layout/Auth/Login.js';

export function AdminLogin() {
    return AuthLoginLayout({
        formId: 'adminLoginForm',
        forgotPasswordHref: '/auth/admin/forgot-password',
        roleKey: 'administrator',
    });
}

export function initAdminLogin() {
    initAuthLogin({
        formId: 'adminLoginForm',
        role: 'admin',
        roleKey: 'administrator',
        dashboardPath: '/admin/dashboard',
        bodyClass: 'admin-page',
        lookupAccount: adminLookupAccount,
        login: adminLogin,
        googleLogin,
        userKey: 'admin',
    });
}

import { adviserLogin, adviserLookupAccount } from '../../api/adviser/AdviserAuth/AdviserAuth.js';
import { adviserGoogleLogin } from '../../api/auth/GoogleAuth.js';
import { AuthLoginLayout, initAuthLogin } from '../../components/Layout/Auth/Login.js';

export function AdviserLogin() {
    return AuthLoginLayout({
        formId: 'adviserLoginForm',
        forgotPasswordHref: '/auth/adviser/forgot-password',
        roleKey: 'adviser',
    });
}

export function initAdviserLogin() {
    initAuthLogin({
        formId: 'adviserLoginForm',
        role: 'adviser',
        roleKey: 'adviser',
        dashboardPath: '/adviser/dashboard',
        bodyClass: 'adviser-page',
        lookupAccount: adviserLookupAccount,
        login: adviserLogin,
        googleLogin: adviserGoogleLogin,
        userKey: 'adviser',
    });
}

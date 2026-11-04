import { studentLogin, studentLookupAccount } from '../../api/students/StudentAuth/StudentAuth.js';
import { studentGoogleLogin } from '../../api/auth/GoogleAuth.js';
import { AuthLoginLayout, initAuthLogin } from '../../components/Layout/Auth/Login.js';

export function StudentLogin() {
    return AuthLoginLayout({
        formId: 'studentLoginForm',
        forgotPasswordHref: '/auth/student/forgot-password',
        roleKey: 'student',
    });
}

export function initStudentLogin() {
    initAuthLogin({
        formId: 'studentLoginForm',
        role: 'student',
        roleKey: 'student',
        dashboardPath: '/student/dashboard',
        bodyClass: 'student-page',
        lookupAccount: studentLookupAccount,
        login: studentLogin,
        googleLogin: studentGoogleLogin,
        userKey: 'student',
    });
}

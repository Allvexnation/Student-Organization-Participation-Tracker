import { adminForgotPassword, adminVerifyOtp, adminResetPassword } from '../../api/admin/AdminForgotPassword.js';
import { AuthForgotPasswordLayout, initAuthForgotPassword } from '../../components/Layout/Auth/ForgotPassword.js';

export function AdminForgotPassword() {
    return AuthForgotPasswordLayout({
        formId: 'adminForgotPasswordForm',
        loginHref: '/auth/admin/login',
    });
}

export function initAdminForgotPassword() {
    initAuthForgotPassword({
        formId: 'adminForgotPasswordForm',
        bodyClass: 'admin-page',
        sendReset: adminForgotPassword,
        verifyOtp: adminVerifyOtp,
        resetPassword: adminResetPassword,
        userIdKey: 'admin_id',
    });
}

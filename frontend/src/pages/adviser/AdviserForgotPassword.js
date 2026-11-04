import { adviserForgotPassword, adviserVerifyOtp, adviserResetPassword } from '../../api/adviser/AdviserForgotPassword.js';
import { AuthForgotPasswordLayout, initAuthForgotPassword } from '../../components/Layout/Auth/ForgotPassword.js';

export function AdviserForgotPassword() {
    return AuthForgotPasswordLayout({
        formId: 'adviserForgotPasswordForm',
        loginHref: '/auth/adviser/login',
    });
}

export function initAdviserForgotPassword() {
    initAuthForgotPassword({
        formId: 'adviserForgotPasswordForm',
        bodyClass: 'adviser-page',
        sendReset: adviserForgotPassword,
        verifyOtp: adviserVerifyOtp,
        resetPassword: adviserResetPassword,
        userIdKey: 'adviser_id',
    });
}

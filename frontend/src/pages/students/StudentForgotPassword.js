import { studentForgotPassword, studentVerifyOtp, studentResetPassword } from '../../api/students/StudentForgotPassword.js';
import { AuthForgotPasswordLayout, initAuthForgotPassword } from '../../components/Layout/Auth/ForgotPassword.js';

export function StudentForgotPassword() {
    return AuthForgotPasswordLayout({
        formId: 'studentForgotPasswordForm',
        loginHref: '/auth/student/login',
    });
}

export function initStudentForgotPassword() {
    initAuthForgotPassword({
        formId: 'studentForgotPasswordForm',
        bodyClass: 'student-page',
        sendReset: studentForgotPassword,
        verifyOtp: studentVerifyOtp,
        resetPassword: studentResetPassword,
        userIdKey: 'student_id',
    });
}

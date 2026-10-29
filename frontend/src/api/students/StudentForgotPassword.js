import { API_ROUTES } from '../server/api.js';

export async function studentForgotPassword(usernameOrEmail) {
    try {
        const response = await fetch(API_ROUTES.STUDENT.FORGOT_PASSWORD, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ username_or_email: usernameOrEmail })
        });

        const contentType = response.headers.get('content-type');
        if (!contentType || !contentType.includes('application/json')) {
            const text = await response.text();
            console.error('Non-JSON response:', text);
            return { message: 'Server error: Invalid response format' };
        }

        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Forgot password error:', error);
        return { message: 'Network error: Unable to connect to server' };
    }
}

export async function studentVerifyOtp(studentId, otpCode) {
    try {
        const response = await fetch(API_ROUTES.STUDENT.VERIFY_OTP, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ student_id: studentId, otp_code: otpCode })
        });

        const contentType = response.headers.get('content-type');
        if (!contentType || !contentType.includes('application/json')) {
            const text = await response.text();
            console.error('Non-JSON response:', text);
            return { message: 'Server error: Invalid response format' };
        }

        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Verify OTP error:', error);
        return { message: 'Network error: Unable to connect to server' };
    }
}

export async function studentResetPassword(studentId, newPassword) {
    try {
        const response = await fetch(API_ROUTES.STUDENT.RESET_PASSWORD, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ student_id: studentId, new_password: newPassword })
        });

        const contentType = response.headers.get('content-type');
        if (!contentType || !contentType.includes('application/json')) {
            const text = await response.text();
            console.error('Non-JSON response:', text);
            return { message: 'Server error: Invalid response format' };
        }

        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Reset password error:', error);
        return { message: 'Network error: Unable to connect to server' };
    }
}

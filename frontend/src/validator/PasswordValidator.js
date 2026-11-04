
export class PasswordValidator {

    static validate(newPassword, confirmPassword, oldPassword = null) {

        if (!newPassword || newPassword.trim().length === 0) {
            return {
                isValid: false,
                message: 'New password is required'
            };
        }

        if (newPassword.length < 8) {
            return {
                isValid: false,
                message: 'Password must be at least 8 characters'
            };
        }

        if (!confirmPassword || confirmPassword.trim().length === 0) {
            return {
                isValid: false,
                message: 'Please confirm your password'
            };
        }

        if (newPassword !== confirmPassword) {
            return {
                isValid: false,
                message: 'Passwords do not match'
            };
        }

        if (oldPassword && newPassword === oldPassword) {
            return {
                isValid: false,
                message: 'New password must be different from your current password'
            };
        }

        return {
            isValid: true,
            message: null
        };
    }
}

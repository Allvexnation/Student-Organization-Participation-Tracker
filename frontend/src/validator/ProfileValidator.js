
export class ProfileValidator {

    static validate(data, existingUsers = [], userType = 'admin', currentId = null) {

        if (userType === 'student') {
            if (!data.first_name || data.first_name.trim().length === 0) {
                return {
                    isValid: false,
                    message: 'First name is required'
                };
            }
            if (!data.last_name || data.last_name.trim().length === 0) {
                return {
                    isValid: false,
                    message: 'Last name is required'
                };
            }
        } else {
            if (!data.name || data.name.trim().length === 0) {
                return {
                    isValid: false,
                    message: 'Name is required'
                };
            }
        }

        if (!data.username || data.username.trim().length === 0) {
            return {
                isValid: false,
                message: 'Username is required'
            };
        }

        const usernameExists = existingUsers.some(user => {
            if (user.id == currentId) return false;
            return user.username.toLowerCase() === data.username.toLowerCase();
        });

        if (usernameExists) {
            return {
                isValid: false,
                message: 'Username already exists'
            };
        }

        if (!data.email || data.email.trim().length === 0) {
            return {
                isValid: false,
                message: 'Email is required'
            };
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(data.email)) {
            return {
                isValid: false,
                message: 'Invalid email format'
            };
        }

        const emailExists = existingUsers.some(user => {
            if (user.id == currentId) return false;
            return user.email.toLowerCase() === data.email.toLowerCase();
        });

        if (emailExists) {
            return {
                isValid: false,
                message: 'Email already exists'
            };
        }

        if (data.password && data.password.length < 8) {
            return {
                isValid: false,
                message: 'Password must be at least 8 characters'
            };
        }

        if (data.password && !data.old_password) {
            return {
                isValid: false,
                message: 'Please enter your current password to change your password'
            };
        }

        return {
            isValid: true,
            message: null
        };
    }

    static checkExistence(email, username, existingUsers = [], excludeId = null) {
        if (email) {
            const emailExists = existingUsers.some(user => {
                if (excludeId && user.id == excludeId) return false;
                return user.email.toLowerCase() === email.toLowerCase();
            });
            if (emailExists) {
                return { exists: true, field: 'email' };
            }
        }

        if (username) {
            const usernameExists = existingUsers.some(user => {
                if (excludeId && user.id == excludeId) return false;
                return user.username.toLowerCase() === username.toLowerCase();
            });
            if (usernameExists) {
                return { exists: true, field: 'username' };
            }
        }

        return { exists: false, field: null };
    }
}

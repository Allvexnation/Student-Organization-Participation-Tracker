
export class AdminCrudValidator {

    static validate(data, existingAdmins = [], mode = 'add', currentId = null) {
        if (!data.name || data.name.trim().length === 0) {
            return {
                isValid: false,
                message: 'Name is required'
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

        const emailExists = existingAdmins.some(admin => {
            if (mode === 'edit' && admin.id == currentId) {
                return false;
            }
            return admin.email.toLowerCase() === data.email.toLowerCase();
        });

        if (emailExists) {
            return {
                isValid: false,
                message: 'Email already exists'
            };
        }

        if (mode === 'edit' && data.username) {
            if (data.username.trim().length === 0) {
                return {
                    isValid: false,
                    message: 'Username is required'
                };
            }

            const usernameExists = existingAdmins.some(admin => {
                if (admin.id == currentId) {
                    return false; 
                }
                return admin.username.toLowerCase() === data.username.toLowerCase();
            });

            if (usernameExists) {
                return {
                    isValid: false,
                    message: 'Username already exists'
                };
            }
        }

        if (data.password && data.password.length < 8) {
            return {
                isValid: false,
                message: 'Password must be at least 8 characters'
            };
        }

        if (!data.role || (data.role !== 'admin' && data.role !== 'super_admin')) {
            return {
                isValid: false,
                message: 'Invalid role'
            };
        }

        if (!data.status || (data.status !== 'active' && data.status !== 'inactive')) {
            return {
                isValid: false,
                message: 'Invalid status'
            };
        }

        return {
            isValid: true,
            message: null
        };
    }

    static checkExistence(email, username, existingAdmins = [], excludeId = null) {
        if (email) {
            const emailExists = existingAdmins.some(admin => {
                if (excludeId && admin.id == excludeId) return false;
                return admin.email.toLowerCase() === email.toLowerCase();
            });
            if (emailExists) {
                return { exists: true, field: 'email' };
            }
        }

        if (username) {
            const usernameExists = existingAdmins.some(admin => {
                if (excludeId && admin.id == excludeId) return false;
                return admin.username.toLowerCase() === username.toLowerCase();
            });
            if (usernameExists) {
                return { exists: true, field: 'username' };
            }
        }

        return { exists: false, field: null };
    }
}

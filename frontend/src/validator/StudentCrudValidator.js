
export class StudentCrudValidator {

    static validate(data, existingStudents = [], mode = 'add', currentId = null) {

        if (!data.student_number || data.student_number.trim().length === 0) {
            return {
                isValid: false,
                message: 'Student number is required'
            };
        }

        const studentNumberExists = existingStudents.some(student => {
            if (mode === 'edit' && student.id == currentId) {
                return false;
            }
            return student.student_number.toLowerCase() === data.student_number.toLowerCase();
        });

        if (studentNumberExists) {
            return {
                isValid: false,
                message: 'Student number already exists'
            };
        }

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

        if (!data.program || data.program.trim().length === 0) {
            return {
                isValid: false,
                message: 'Program is required'
            };
        }

        if (!data.year_level || data.year_level.trim().length === 0) {
            return {
                isValid: false,
                message: 'Year level is required'
            };
        }

        const validYearLevels = ['1st Year', '2nd Year', '3rd Year', '4th Year', '5th Year'];
        if (!validYearLevels.includes(data.year_level)) {
            return {
                isValid: false,
                message: 'Invalid year level'
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

        const emailExists = existingStudents.some(student => {
            if (mode === 'edit' && student.id == currentId) {
                return false;
            }
            return student.email.toLowerCase() === data.email.toLowerCase();
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

            const usernameExists = existingStudents.some(student => {
                if (student.id == currentId) {
                    return false;
                }
                return student.username.toLowerCase() === data.username.toLowerCase();
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

        return {
            isValid: true,
            message: null
        };
    }

    static checkExistence(studentNumber, email, username, existingStudents = [], excludeId = null) {
        if (studentNumber) {
            const studentNumberExists = existingStudents.some(student => {
                if (excludeId && student.id == excludeId) return false;
                return student.student_number.toLowerCase() === studentNumber.toLowerCase();
            });
            if (studentNumberExists) {
                return { exists: true, field: 'student_number' };
            }
        }

        if (email) {
            const emailExists = existingStudents.some(student => {
                if (excludeId && student.id == excludeId) return false;
                return student.email.toLowerCase() === email.toLowerCase();
            });
            if (emailExists) {
                return { exists: true, field: 'email' };
            }
        }

        if (username) {
            const usernameExists = existingStudents.some(student => {
                if (excludeId && student.id == excludeId) return false;
                return student.username.toLowerCase() === username.toLowerCase();
            });
            if (usernameExists) {
                return { exists: true, field: 'username' };
            }
        }

        return { exists: false, field: null };
    }
}

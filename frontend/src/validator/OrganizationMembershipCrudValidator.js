
export class OrganizationMembershipCrudValidator {

    static validateStudentOrganizationUniqueness(studentId, existingMemberships = [], excludeId = null) {
        if (!studentId || studentId.trim().length === 0) {
            return {
                isValid: false,
                message: 'Student is required'
            };
        }

        const hasMembership = existingMemberships.some(membership => 
            membership.student_id == studentId && 
            membership.id !== excludeId
        );

        if (hasMembership) {
            return {
                isValid: false,
                message: 'Student already has an organization membership. A student can only belong to one organization.'
            };
        }

        return {
            isValid: true,
            message: null
        };
    }

    static validate(data, existingMemberships = [], excludeId = null) {

        if (!data.student_id || data.student_id.trim().length === 0) {
            return {
                isValid: false,
                message: 'Student is required'
            };
        }

        if (!data.organization_id || data.organization_id.trim().length === 0) {
            return {
                isValid: false,
                message: 'Organization is required'
            };
        }

        if (!data.date_joined || data.date_joined.trim().length === 0) {
            return {
                isValid: false,
                message: 'Date joined is required'
            };
        }

        if (!data.role_id || data.role_id.trim().length === 0) {
            return {
                isValid: false,
                message: 'Position/Role is required'
            };
        }

        if (!data.membership_status || data.membership_status.trim().length === 0) {
            return {
                isValid: false,
                message: 'Membership status is required'
            };
        }

        if (!excludeId) {
            const uniquenessValidation = this.validateStudentOrganizationUniqueness(data.student_id, existingMemberships, excludeId);
            if (!uniquenessValidation.isValid) {
                return uniquenessValidation;
            }
        }

        return {
            isValid: true,
            message: null
        };
    }
}

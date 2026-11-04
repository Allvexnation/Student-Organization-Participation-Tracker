
export class OrganizationCrudValidator {

    static validateCodeUniqueness(orgCode, organizations = [], excludeId = null) {
        if (!orgCode || orgCode.trim().length === 0) {
            return {
                isValid: false,
                message: 'Organization code is required'
            };
        }

        const codeExists = organizations.some(org => 
            org.org_code.toLowerCase() === orgCode.toLowerCase() && 
            org.id !== excludeId
        );

        if (codeExists) {
            return {
                isValid: false,
                message: 'Organization code already exists. Please use a different code.'
            };
        }

        return {
            isValid: true,
            message: null
        };
    }

    static validate(data, existingOrganizations = [], excludeId = null) {

        if (!data.org_code || data.org_code.trim().length === 0) {
            return {
                isValid: false,
                message: 'Organization code is required'
            };
        }

        if (!data.name || data.name.trim().length === 0) {
            return {
                isValid: false,
                message: 'Organization name is required'
            };
        }

        if (!data.adviser_id || data.adviser_id.trim().length === 0) {
            return {
                isValid: false,
                message: 'Adviser is required'
            };
        }

        if (!data.status || data.status.trim().length === 0) {
            return {
                isValid: false,
                message: 'Status is required'
            };
        }

        const codeValidation = this.validateCodeUniqueness(data.org_code, existingOrganizations, excludeId);
        if (!codeValidation.isValid) {
            return codeValidation;
        }

        return {
            isValid: true,
            message: null
        };
    }
}

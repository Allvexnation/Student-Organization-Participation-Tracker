
export class OrganizationValidator {

    static isActive(organization) {
        if (!organization || !organization.status) {
            return false;
        }
        const status = organization.status.toLowerCase();
        return status === 'active';
    }

    static isSuspended(organization) {
        if (!organization || !organization.status) {
            return false;
        }
        const status = organization.status.toLowerCase();
        return status === 'suspended' || status === 'inactive';
    }

    static getDisplayName(organization) {
        if (!organization || !organization.name) {
            return 'Unknown';
        }
        
        if (this.isSuspended(organization)) {
            return `${organization.name} (Suspended)`;
        }
        
        return organization.name;
    }

    static validateSelectedOrganizations(organizations, selectedIds) {
        const selectedOrgs = organizations.filter(org => selectedIds.includes(org.id));
        const suspendedOrgs = selectedOrgs.filter(org => this.isSuspended(org));
        
        if (suspendedOrgs.length > 0) {
            const suspendedNames = suspendedOrgs.map(org => org.name).join(', ');
            return {
                isValid: false,
                message: `Cannot select suspended organizations: ${suspendedNames}`
            };
        }
        
        return {
            isValid: true,
            message: null
        };
    }
}


export class MembershipValidator {
  
    static isActive(membership) {
        if (!membership || !membership.membership_status) {
            return false;
        }
        const status = membership.membership_status.toLowerCase();
        return status === 'active';
    }

    static isInactive(membership) {
        if (!membership || !membership.membership_status) {
            return false;
        }
        const status = membership.membership_status.toLowerCase();
        return status === 'inactive' || status === 'resigned';
    }

    static getDisplayName(membership) {
        if (!membership || !membership.student_name) {
            return 'Unknown';
        }
        
        if (this.isInactive(membership)) {
            return `${membership.student_name} (${membership.membership_status})`;
        }
        
        return membership.student_name;
    }

    static filterActive(memberships) {
        if (!memberships || !Array.isArray(memberships)) {
            return [];
        }
        return memberships.filter(membership => this.isActive(membership));
    }
}

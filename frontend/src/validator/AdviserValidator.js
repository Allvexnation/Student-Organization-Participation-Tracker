
export class AdviserValidator {
 
    static isActive(adviser) {
        if (!adviser || !adviser.status) {
            return false;
        }
        const status = adviser.status.toLowerCase();
        return status === 'active';
    }

    static isInactive(adviser) {
        if (!adviser || !adviser.status) {
            return false;
        }
        const status = adviser.status.toLowerCase();
        return status === 'inactive';
    }

    static getDisplayName(adviser) {
        if (!adviser || !adviser.name) {
            return 'Unknown';
        }
        
        if (this.isInactive(adviser)) {
            return `${adviser.name} (Inactive)`;
        }
        
        return adviser.name;
    }

    static validateSelectedAdvisers(advisers, selectedIds) {
        const selectedAdvisers = advisers.filter(adviser => selectedIds.includes(adviser.id));
        const inactiveAdvisers = selectedAdvisers.filter(adviser => this.isInactive(adviser));
        
        if (inactiveAdvisers.length > 0) {
            const inactiveNames = inactiveAdvisers.map(adviser => adviser.name).join(', ');
            return {
                isValid: false,
                message: `Cannot select inactive advisers: ${inactiveNames}`
            };
        }
        
        return {
            isValid: true,
            message: null
        };
    }
}

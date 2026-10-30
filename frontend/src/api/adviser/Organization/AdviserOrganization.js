import { API_ROUTES } from '../../server/api.js';
import { getToken } from '../../../utils/jwt.js';

async function getHeaders() {
    const token = getToken('adviser');
    const headers = {
        'Content-Type': 'application/json'
    };
    if (token && token !== 'null' && token !== 'undefined') {
        headers['Authorization'] = `Bearer ${token}`;
    }
    return headers;
}

export async function getAdviserOrganization() {
    try {
        const response = await fetch(API_ROUTES.ADVISER.ORGANIZATION_GET, {
            method: 'GET',
            headers: await getHeaders()
        });
        
        if (!response.ok) {
            if (response.status === 404) {
                return null;
            }
            throw new Error('Failed to fetch organization');
        }
        
        const data = await response.json();
        return data.organization;
    } catch (error) {
        console.error('Error fetching organization:', error);
        throw error;
    }
}

export async function getAdviserAllOrganizations() {
    try {
        const response = await fetch(API_ROUTES.ADVISER.ORGANIZATIONS_GET_ALL, {
            method: 'GET',
            headers: await getHeaders()
        });
        
        if (!response.ok) {
            throw new Error('Failed to fetch organizations');
        }
        
        const data = await response.json();
        return data.organizations || [];
    } catch (error) {
        console.error('Error fetching organizations:', error);
        throw error;
    }
}

export async function setCurrentAdviserOrganization(organizationId) {
    try {
        const response = await fetch(API_ROUTES.ADVISER.CURRENT_ORGANIZATION_UPDATE, {
            method: 'PUT',
            headers: await getHeaders(),
            body: JSON.stringify({ organization_id: organizationId })
        });
        
        if (!response.ok) {
            throw new Error('Failed to set current organization');
        }
        
        const result = await response.json();
        return result;
    } catch (error) {
        console.error('Error setting current organization:', error);
        throw error;
    }
}

export async function updateAdviserOrganization(data) {
    try {
        const response = await fetch(API_ROUTES.ADVISER.ORGANIZATION_UPDATE, {
            method: 'PUT',
            headers: await getHeaders(),
            body: JSON.stringify(data)
        });
        
        if (!response.ok) {
            throw new Error('Failed to update organization');
        }
        
        const result = await response.json();
        return result;
    } catch (error) {
        console.error('Error updating organization:', error);
        throw error;
    }
}

export async function getAdviserOrgMemberships() {
    try {
        const response = await fetch(API_ROUTES.ADVISER.ORG_MEMBERSHIP_GET_ALL, {
            method: 'GET',
            headers: await getHeaders()
        });
        
        if (!response.ok) {
            throw new Error('Failed to fetch organization memberships');
        }
        
        const data = await response.json();
        return data.organization_memberships || [];
    } catch (error) {
        console.error('Error fetching organization memberships:', error);
        throw error;
    }
}

export async function getAdviserOrgMembership(id) {
    try {
        const response = await fetch(API_ROUTES.ADVISER.ORG_MEMBERSHIP_GET(id), {
            method: 'GET',
            headers: await getHeaders()
        });
        
        if (!response.ok) {
            throw new Error('Failed to fetch organization membership');
        }
        
        const data = await response.json();
        return data.organization_membership;
    } catch (error) {
        console.error('Error fetching organization membership:', error);
        throw error;
    }
}

export async function getAdviserOrgMembershipsByOrg(orgId) {
    try {
        const response = await fetch(API_ROUTES.ADVISER.ORG_MEMBERSHIP_GET_BY_ORG(orgId), {
            method: 'GET',
            headers: await getHeaders()
        });
        
        if (!response.ok) {
            throw new Error('Failed to fetch organization memberships by organization');
        }
        
        const data = await response.json();
        return data.organization_memberships || [];
    } catch (error) {
        console.error('Error fetching organization memberships by organization:', error);
        throw error;
    }
}

export async function createAdviserOrgMembership(data) {
    try {
        const response = await fetch(API_ROUTES.ADVISER.ORG_MEMBERSHIP_CREATE, {
            method: 'POST',
            headers: await getHeaders(),
            body: JSON.stringify(data)
        });
        
        if (!response.ok) {
            throw new Error('Failed to create organization membership');
        }
        
        const result = await response.json();
        return result;
    } catch (error) {
        console.error('Error creating organization membership:', error);
        throw error;
    }
}

export async function updateAdviserOrgMembership(id, data) {
    try {
        const response = await fetch(API_ROUTES.ADVISER.ORG_MEMBERSHIP_UPDATE(id), {
            method: 'PUT',
            headers: await getHeaders(),
            body: JSON.stringify(data)
        });
        
        if (!response.ok) {
            throw new Error('Failed to update organization membership');
        }
        
        const result = await response.json();
        return result;
    } catch (error) {
        console.error('Error updating organization membership:', error);
        throw error;
    }
}

export async function deleteAdviserOrgMembership(id) {
    try {
        const response = await fetch(API_ROUTES.ADVISER.ORG_MEMBERSHIP_DELETE(id), {
            method: 'DELETE',
            headers: await getHeaders()
        });
        
        if (!response.ok) {
            throw new Error('Failed to delete organization membership');
        }
        
        const result = await response.json();
        return result;
    } catch (error) {
        console.error('Error deleting organization membership:', error);
        throw error;
    }
}

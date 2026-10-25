import { API_ROUTES } from '../../server/api.js';
import { getToken } from '../../../utils/jwt.js';

async function getHeaders() {
    const token = getToken();
    return {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
    };
}

export async function getAllOrgMemberships() {
    try {
        const response = await fetch(API_ROUTES.ADMIN.ORG_MEMBERSHIP_GET_ALL, {
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

export async function getOrgMembership(id) {
    try {
        const response = await fetch(API_ROUTES.ADMIN.ORG_MEMBERSHIP_GET(id), {
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

export async function createOrgMembership(data) {
    try {
        const response = await fetch(API_ROUTES.ADMIN.ORG_MEMBERSHIP_CREATE, {
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

export async function updateOrgMembership(id, data) {
    try {
        const response = await fetch(API_ROUTES.ADMIN.ORG_MEMBERSHIP_UPDATE(id), {
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

export async function deleteOrgMembership(id) {
    try {
        const response = await fetch(API_ROUTES.ADMIN.ORG_MEMBERSHIP_DELETE(id), {
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

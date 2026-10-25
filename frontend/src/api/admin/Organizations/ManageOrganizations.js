import { API_ROUTES } from '../../server/api.js';
import { getToken } from '../../../utils/jwt.js';

async function getHeaders() {
    const token = getToken();
    return {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
    };
}

export async function getAllOrganizations() {
    try {
        const response = await fetch(API_ROUTES.ADMIN.ORGANIZATION_GET_ALL, {
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

export async function getOrganization(id) {
    try {
        const response = await fetch(API_ROUTES.ADMIN.ORGANIZATION_GET(id), {
            method: 'GET',
            headers: await getHeaders()
        });
        
        if (!response.ok) {
            throw new Error('Failed to fetch organization');
        }
        
        const data = await response.json();
        return data.organization;
    } catch (error) {
        console.error('Error fetching organization:', error);
        throw error;
    }
}

export async function createOrganization(data) {
    try {
        const response = await fetch(API_ROUTES.ADMIN.ORGANIZATION_CREATE, {
            method: 'POST',
            headers: await getHeaders(),
            body: JSON.stringify(data)
        });
        
        if (!response.ok) {
            throw new Error('Failed to create organization');
        }
        
        const result = await response.json();
        return result;
    } catch (error) {
        console.error('Error creating organization:', error);
        throw error;
    }
}

export async function updateOrganization(id, data) {
    try {
        const response = await fetch(API_ROUTES.ADMIN.ORGANIZATION_UPDATE(id), {
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

export async function deleteOrganization(id) {
    try {
        const response = await fetch(API_ROUTES.ADMIN.ORGANIZATION_DELETE(id), {
            method: 'DELETE',
            headers: await getHeaders()
        });
        
        if (!response.ok) {
            throw new Error('Failed to delete organization');
        }
        
        const result = await response.json();
        return result;
    } catch (error) {
        console.error('Error deleting organization:', error);
        throw error;
    }
}

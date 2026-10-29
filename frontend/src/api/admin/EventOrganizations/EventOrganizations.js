import { API_ROUTES } from '../../server/api.js';
import { getToken } from '../../../utils/jwt.js';

async function getHeaders() {
    const token = getToken();
    return {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
    };
}

export async function getAllEventOrganizations() {
    try {
        const response = await fetch(API_ROUTES.ADMIN.EVENT_ORGANIZATION_GET_ALL, {
            method: 'GET',
            headers: await getHeaders()
        });
        
        if (!response.ok) {
            throw new Error('Failed to fetch event organizations');
        }
        
        const data = await response.json();
        return data.event_organizations || [];
    } catch (error) {
        console.error('Error fetching event organizations:', error);
        throw error;
    }
}

export async function getEventOrganization(id) {
    try {
        const response = await fetch(API_ROUTES.ADMIN.EVENT_ORGANIZATION_GET(id), {
            method: 'GET',
            headers: await getHeaders()
        });
        
        if (!response.ok) {
            throw new Error('Failed to fetch event organization');
        }
        
        const data = await response.json();
        return data.event_organization;
    } catch (error) {
        console.error('Error fetching event organization:', error);
        throw error;
    }
}

export async function createEventOrganization(data) {
    try {
        const response = await fetch(API_ROUTES.ADMIN.EVENT_ORGANIZATION_CREATE, {
            method: 'POST',
            headers: await getHeaders(),
            body: JSON.stringify(data)
        });
        
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Failed to create event organization');
        }
        
        const result = await response.json();
        return result;
    } catch (error) {
        console.error('Error creating event organization:', error);
        throw error;
    }
}

export async function updateEventOrganization(id, data) {
    try {
        const response = await fetch(API_ROUTES.ADMIN.EVENT_ORGANIZATION_UPDATE(id), {
            method: 'PUT',
            headers: await getHeaders(),
            body: JSON.stringify(data)
        });
        
        if (!response.ok) {
            throw new Error('Failed to update event organization');
        }
        
        const result = await response.json();
        return result;
    } catch (error) {
        console.error('Error updating event organization:', error);
        throw error;
    }
}

export async function deleteEventOrganization(id) {
    try {
        const response = await fetch(API_ROUTES.ADMIN.EVENT_ORGANIZATION_DELETE(id), {
            method: 'DELETE',
            headers: await getHeaders()
        });
        
        if (!response.ok) {
            throw new Error('Failed to delete event organization');
        }
        
        const result = await response.json();
        return result;
    } catch (error) {
        console.error('Error deleting event organization:', error);
        throw error;
    }
}

export async function getApprovers() {
    try {
        const response = await fetch(API_ROUTES.ADMIN.EVENT_ORGANIZATION_GET_APPROVERS, {
            method: 'GET',
            headers: await getHeaders()
        });
        
        if (!response.ok) {
            throw new Error('Failed to fetch approvers');
        }
        
        const data = await response.json();
        return data.approvers || [];
    } catch (error) {
        console.error('Error fetching approvers:', error);
        throw error;
    }
}

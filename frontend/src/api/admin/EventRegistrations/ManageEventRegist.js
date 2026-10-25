import { API_ROUTES } from '../../server/api.js';
import { getToken } from '../../../utils/jwt.js';

async function getHeaders() {
    const token = getToken();
    return {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
    };
}

export async function getAllEventRegistrations() {
    try {
        const response = await fetch(API_ROUTES.ADMIN.EVENT_REGISTRATION_GET_ALL, {
            method: 'GET',
            headers: await getHeaders()
        });
        
        if (!response.ok) {
            throw new Error('Failed to fetch event registrations');
        }
        
        const data = await response.json();
        return data.event_registrations || [];
    } catch (error) {
        console.error('Error fetching event registrations:', error);
        throw error;
    }
}

export async function getEventRegistration(id) {
    try {
        const response = await fetch(API_ROUTES.ADMIN.EVENT_REGISTRATION_GET(id), {
            method: 'GET',
            headers: await getHeaders()
        });
        
        if (!response.ok) {
            throw new Error('Failed to fetch event registration');
        }
        
        const data = await response.json();
        return data.event_registration;
    } catch (error) {
        console.error('Error fetching event registration:', error);
        throw error;
    }
}

export async function createEventRegistration(data) {
    try {
        const response = await fetch(API_ROUTES.ADMIN.EVENT_REGISTRATION_CREATE, {
            method: 'POST',
            headers: await getHeaders(),
            body: JSON.stringify(data)
        });
        
        if (!response.ok) {
            throw new Error('Failed to create event registration');
        }
        
        const result = await response.json();
        return result;
    } catch (error) {
        console.error('Error creating event registration:', error);
        throw error;
    }
}

export async function updateEventRegistration(id, data) {
    try {
        const response = await fetch(API_ROUTES.ADMIN.EVENT_REGISTRATION_UPDATE(id), {
            method: 'PUT',
            headers: await getHeaders(),
            body: JSON.stringify(data)
        });
        
        if (!response.ok) {
            throw new Error('Failed to update event registration');
        }
        
        const result = await response.json();
        return result;
    } catch (error) {
        console.error('Error updating event registration:', error);
        throw error;
    }
}

export async function deleteEventRegistration(id) {
    try {
        const response = await fetch(API_ROUTES.ADMIN.EVENT_REGISTRATION_DELETE(id), {
            method: 'DELETE',
            headers: await getHeaders()
        });
        
        if (!response.ok) {
            throw new Error('Failed to delete event registration');
        }
        
        const result = await response.json();
        return result;
    } catch (error) {
        console.error('Error deleting event registration:', error);
        throw error;
    }
}

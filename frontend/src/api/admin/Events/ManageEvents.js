import { API_ROUTES } from '../../server/api.js';
import { getToken } from '../../../utils/jwt.js';

async function getHeaders() {
    const token = getToken();
    return {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
    };
}

export async function getAllEvents() {
    try {
        const response = await fetch(API_ROUTES.ADMIN.EVENT_GET_ALL, {
            method: 'GET',
            headers: await getHeaders()
        });
        
        if (!response.ok) {
            throw new Error('Failed to fetch events');
        }
        
        const data = await response.json();
        return data.events || [];
    } catch (error) {
        console.error('Error fetching events:', error);
        throw error;
    }
}

export async function getEvent(id) {
    try {
        const response = await fetch(API_ROUTES.ADMIN.EVENT_GET(id), {
            method: 'GET',
            headers: await getHeaders()
        });
        
        if (!response.ok) {
            throw new Error('Failed to fetch event');
        }
        
        const data = await response.json();
        return data.event;
    } catch (error) {
        console.error('Error fetching event:', error);
        throw error;
    }
}

export async function createEvent(data) {
    try {
        const response = await fetch(API_ROUTES.ADMIN.EVENT_CREATE, {
            method: 'POST',
            headers: await getHeaders(),
            body: JSON.stringify(data)
        });
        
        if (!response.ok) {
            throw new Error('Failed to create event');
        }
        
        const result = await response.json();
        return result;
    } catch (error) {
        console.error('Error creating event:', error);
        throw error;
    }
}

export async function updateEvent(id, data) {
    try {
        const response = await fetch(API_ROUTES.ADMIN.EVENT_UPDATE(id), {
            method: 'PUT',
            headers: await getHeaders(),
            body: JSON.stringify(data)
        });
        
        if (!response.ok) {
            throw new Error('Failed to update event');
        }
        
        const result = await response.json();
        return result;
    } catch (error) {
        console.error('Error updating event:', error);
        throw error;
    }
}

export async function deleteEvent(id) {
    try {
        const response = await fetch(API_ROUTES.ADMIN.EVENT_DELETE(id), {
            method: 'DELETE',
            headers: await getHeaders()
        });
        
        if (!response.ok) {
            throw new Error('Failed to delete event');
        }
        
        const result = await response.json();
        return result;
    } catch (error) {
        console.error('Error deleting event:', error);
        throw error;
    }
}

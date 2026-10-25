import { API_ROUTES } from '../../server/api.js';
import { getToken } from '../../../utils/jwt.js';

async function getHeaders() {
    const token = getToken();
    return {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
    };
}

export async function getAllAdvisers() {
    try {
        const response = await fetch(API_ROUTES.ADMIN.ADVISER_GET_ALL, {
            method: 'GET',
            headers: await getHeaders()
        });
        
        if (!response.ok) {
            throw new Error('Failed to fetch advisers');
        }
        
        const data = await response.json();
        return data.advisers || [];
    } catch (error) {
        console.error('Error fetching advisers:', error);
        throw error;
    }
}

export async function getAdviser(id) {
    try {
        const response = await fetch(API_ROUTES.ADMIN.ADVISER_GET(id), {
            method: 'GET',
            headers: await getHeaders()
        });
        
        if (!response.ok) {
            throw new Error('Failed to fetch adviser');
        }
        
        const data = await response.json();
        return data.adviser;
    } catch (error) {
        console.error('Error fetching adviser:', error);
        throw error;
    }
}

export async function createAdviser(data) {
    try {
        const response = await fetch(API_ROUTES.ADMIN.ADVISER_CREATE, {
            method: 'POST',
            headers: await getHeaders(),
            body: JSON.stringify(data)
        });
        
        if (!response.ok) {
            throw new Error('Failed to create adviser');
        }
        
        const result = await response.json();
        return result;
    } catch (error) {
        console.error('Error creating adviser:', error);
        throw error;
    }
}

export async function updateAdviser(id, data) {
    try {
        const response = await fetch(API_ROUTES.ADMIN.ADVISER_UPDATE(id), {
            method: 'PUT',
            headers: await getHeaders(),
            body: JSON.stringify(data)
        });
        
        if (!response.ok) {
            throw new Error('Failed to update adviser');
        }
        
        const result = await response.json();
        return result;
    } catch (error) {
        console.error('Error updating adviser:', error);
        throw error;
    }
}

export async function deleteAdviser(id) {
    try {
        const response = await fetch(API_ROUTES.ADMIN.ADVISER_DELETE(id), {
            method: 'DELETE',
            headers: await getHeaders()
        });
        
        if (!response.ok) {
            throw new Error('Failed to delete adviser');
        }
        
        const result = await response.json();
        return result;
    } catch (error) {
        console.error('Error deleting adviser:', error);
        throw error;
    }
}

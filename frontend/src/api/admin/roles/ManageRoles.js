import { API_ROUTES } from '../../server/api.js';
import { getToken } from '../../../utils/jwt.js';

async function getHeaders() {
    const token = getToken();
    return {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
    };
}

export async function getAllRoles() {
    try {
        const response = await fetch(API_ROUTES.ADMIN.ROLE_GET_ALL, {
            method: 'GET',
            headers: await getHeaders()
        });
        
        if (!response.ok) {
            throw new Error('Failed to fetch roles');
        }
        
        const data = await response.json();
        return data.roles || [];
    } catch (error) {
        console.error('Error fetching roles:', error);
        throw error;
    }
}

export async function getRole(id) {
    try {
        const response = await fetch(API_ROUTES.ADMIN.ROLE_GET(id), {
            method: 'GET',
            headers: await getHeaders()
        });
        
        if (!response.ok) {
            throw new Error('Failed to fetch role');
        }
        
        const data = await response.json();
        return data.role;
    } catch (error) {
        console.error('Error fetching role:', error);
        throw error;
    }
}

export async function createRole(data) {
    try {
        const response = await fetch(API_ROUTES.ADMIN.ROLE_CREATE, {
            method: 'POST',
            headers: await getHeaders(),
            body: JSON.stringify(data)
        });
        
        if (!response.ok) {
            throw new Error('Failed to create role');
        }
        
        const result = await response.json();
        return result;
    } catch (error) {
        console.error('Error creating role:', error);
        throw error;
    }
}

export async function updateRole(id, data) {
    try {
        const response = await fetch(API_ROUTES.ADMIN.ROLE_UPDATE(id), {
            method: 'PUT',
            headers: await getHeaders(),
            body: JSON.stringify(data)
        });
        
        if (!response.ok) {
            throw new Error('Failed to update role');
        }
        
        const result = await response.json();
        return result;
    } catch (error) {
        console.error('Error updating role:', error);
        throw error;
    }
}

export async function deleteRole(id) {
    try {
        const response = await fetch(API_ROUTES.ADMIN.ROLE_DELETE(id), {
            method: 'DELETE',
            headers: await getHeaders()
        });
        
        if (!response.ok) {
            throw new Error('Failed to delete role');
        }
        
        const result = await response.json();
        return result;
    } catch (error) {
        console.error('Error deleting role:', error);
        throw error;
    }
}

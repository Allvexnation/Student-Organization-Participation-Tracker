import { API_ROUTES } from '../../server/api.js';
import { getToken } from '../../../utils/jwt.js';

async function getHeaders() {
    const token = getToken('admin');
    return {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
    };
}

export async function getAllAdmins() {
    try {
        const response = await fetch(API_ROUTES.ADMIN.ADMIN_GET_ALL, {
            method: 'GET',
            headers: await getHeaders()
        });
        
        if (!response.ok) {
            throw new Error('Failed to fetch admins');
        }
        
        const data = await response.json();
        return data.admins || [];
    } catch (error) {
        console.error('Error fetching admins:', error);
        throw error;
    }
}

export async function getAdmin(id) {
    try {
        const response = await fetch(API_ROUTES.ADMIN.ADMIN_GET(id), {
            method: 'GET',
            headers: await getHeaders()
        });
        
        if (!response.ok) {
            throw new Error('Failed to fetch admin');
        }
        
        const data = await response.json();
        return data.admin;
    } catch (error) {
        console.error('Error fetching admin:', error);
        throw error;
    }
}

export async function createAdmin(data) {
    try {
        const response = await fetch(API_ROUTES.ADMIN.ADMIN_CREATE, {
            method: 'POST',
            headers: await getHeaders(),
            body: JSON.stringify(data)
        });
        
        if (!response.ok) {
            throw new Error('Failed to create admin');
        }
        
        const result = await response.json();
        return result;
    } catch (error) {
        console.error('Error creating admin:', error);
        throw error;
    }
}

export async function updateAdmin(id, data) {
    try {
        const response = await fetch(API_ROUTES.ADMIN.ADMIN_UPDATE(id), {
            method: 'PUT',
            headers: await getHeaders(),
            body: JSON.stringify(data)
        });
        
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Failed to update admin');
        }
        
        const result = await response.json();
        return result;
    } catch (error) {
        console.error('Error updating admin:', error);
        throw error;
    }
}

export async function deleteAdmin(id, reason) {
    try {
        const response = await fetch(API_ROUTES.ADMIN.ADMIN_DELETE(id), {
            method: 'DELETE',
            headers: await getHeaders(),
            body: JSON.stringify({ reason })
        });
        
        if (!response.ok) {
            throw new Error('Failed to delete admin');
        }
        
        const result = await response.json();
        return result;
    } catch (error) {
        console.error('Error deleting admin:', error);
        throw error;
    }
}

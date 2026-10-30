import { API_ROUTES } from '../server/api.js';
import { getToken } from '../../utils/jwt.js';

export async function getAdminProfile() {
    try {
        const token = getToken('admin');
        
        const response = await fetch(API_ROUTES.ADMIN.PROFILE, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            }
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || 'Failed to fetch profile');
        }

        return data.admin;
    } catch (error) {
        console.error('Get profile error:', error);
        throw error;
    }
}

export async function updateAdminProfile(profileData) {
    try {
        const token = getToken('admin');
        
        const response = await fetch(API_ROUTES.ADMIN.PROFILE, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(profileData)
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || 'Failed to update profile');
        }

        if (data.admin) {
            sessionStorage.setItem('adminData', JSON.stringify(data.admin));
        }

        return data;
    } catch (error) {
        console.error('Update profile error:', error);
        throw error;
    }
}

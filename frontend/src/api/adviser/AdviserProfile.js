import { API_ROUTES } from '../server/api.js';
import { getToken, setUserData } from '../../utils/jwt.js';

export async function getAdviserProfile() {
    try {
        const token = getToken('adviser');
        const headers = {
            'Content-Type': 'application/json'
        };
        if (token && token !== 'null' && token !== 'undefined') {
            headers['Authorization'] = `Bearer ${token}`;
        }
        
        const response = await fetch(API_ROUTES.ADVISER.PROFILE, {
            method: 'GET',
            headers
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || 'Failed to fetch profile');
        }

        return data.adviser;
    } catch (error) {
        console.error('Get profile error:', error);
        throw error;
    }
}

export async function updateAdviserProfile(profileData) {
    try {
        const token = getToken('adviser');
        const headers = {
            'Content-Type': 'application/json'
        };
        if (token && token !== 'null' && token !== 'undefined') {
            headers['Authorization'] = `Bearer ${token}`;
        }
        
        const response = await fetch(API_ROUTES.ADVISER.PROFILE, {
            method: 'PUT',
            headers,
            body: JSON.stringify(profileData)
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || 'Failed to update profile');
        }

        if (data.adviser) {
            setUserData(data.adviser, 'adviser');
        }

        return data;
    } catch (error) {
        console.error('Update profile error:', error);
        throw error;
    }
}

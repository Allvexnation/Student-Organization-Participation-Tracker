import { API_ROUTES } from '../server/api.js';
import { getToken } from '../../utils/jwt.js';

export async function getStudentProfile() {
    try {
        const token = getToken();
        
        const response = await fetch(API_ROUTES.STUDENT.PROFILE, {
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

        return data.student;
    } catch (error) {
        console.error('Get profile error:', error);
        throw error;
    }
}

export async function updateStudentProfile(profileData) {
    try {
        const token = getToken();
        
        const response = await fetch(API_ROUTES.STUDENT.PROFILE, {
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

        if (data.student) {
            localStorage.setItem('studentData', JSON.stringify(data.student));
        }

        return data;
    } catch (error) {
        console.error('Update profile error:', error);
        throw error;
    }
}

import { API_ROUTES } from '../../server/api.js';
import { setToken, removeToken, isAuthenticated as checkAuth } from '../../../utils/jwt.js';

export async function adviserLogin(Email, Password) {
    try {
        const response = await fetch(API_ROUTES.ADVISER.LOGIN, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ username_or_email: Email, password: Password })
        });

        const contentType = response.headers.get('content-type');
        if (!contentType || !contentType.includes('application/json')) {
            const text = await response.text();
            console.error('Non-JSON response:', text);
            return { message: 'Server error: Invalid response format' };
        }

        const data = await response.json();
        
        if (data.token) {
            setToken(data.token, 'adviser');
        }
        
        return data;
    } catch (error) {
        console.error('Login error:', error);
        return { message: 'Network error: Unable to connect to server' };
    }
}

export async function adviserLogout(token) {
    try {
        const response = await fetch(API_ROUTES.ADVISER.LOGOUT, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            }
        });
        
        removeToken('adviser');
        localStorage.removeItem('adviserData');
        localStorage.removeItem('adviserVerified');
        
        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
            return await response.json();
        }
        
        return { message: 'Logout completed' };
    } catch (error) {
        console.error('Logout error:', error);
        removeToken('adviser');
        localStorage.removeItem('adviserData');
        localStorage.removeItem('adviserVerified');
        return { message: 'Logout completed (offline)' };
    }
}

export function getAdviserData() {
    const adviserData = localStorage.getItem('adviserData');
    return adviserData ? JSON.parse(adviserData) : null;
}

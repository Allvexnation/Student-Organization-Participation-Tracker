import { API_ROUTES } from '../../server/api.js';
import { setToken, removeToken, isAuthenticated as checkAuth } from '../../../utils/jwt.js';

export async function studentLogin(Email, Password) {
    try {
        const response = await fetch(API_ROUTES.STUDENT.LOGIN, {
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
            setToken(data.token);
        }
        
        return data;
    } catch (error) {
        console.error('Login error:', error);
        return { message: 'Network error: Unable to connect to server' };
    }
}

export async function studentLogout(token) {
    const response = await fetch(API_ROUTES.STUDENT.LOGOUT, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        }
    });
    removeToken();
    localStorage.removeItem('studentData');
    localStorage.removeItem('studentVerified');
    return response.json();
}

export function getStudentData() {
    const studentData = localStorage.getItem('studentData');
    return studentData ? JSON.parse(studentData) : null;
}

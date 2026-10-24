import { API_ROUTES } from '../../server/api.js';
import { setToken, removeToken, isAuthenticated as checkAuth } from '../../../utils/jwt.js';

export async function adminLogin(Email, Password) {
    const response = await fetch(API_ROUTES.ADMIN.LOGIN, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ username_or_email: Email, password: Password })
    });
    const data = await response.json();
    
    if (data.token) {
        setToken(data.token);
    }
    
    return data;
}

export async function adminLogout(token) {
    const response = await fetch(API_ROUTES.ADMIN.LOGOUT, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        }
    });
    removeToken();
    return response.json();
}

export async function verifyAdminToken(token) {
    const response = await fetch(API_ROUTES.ADMIN.VERIFY, {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${token}`
        }
    });
    return response.json();
}

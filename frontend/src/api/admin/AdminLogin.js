import { API_ROUTES } from '../server/api.js';
import { setToken, removeToken, isAuthenticated as checkAuth } from '../../../src/utils/jwt.js';

export async function adminLogin(usernameOrEmail, password) {
    try {
        const response = await fetch(API_ROUTES.ADMIN.LOGIN, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                username_or_email: usernameOrEmail,
                password: password
            })
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || 'Login failed');
        }

        // Store token using jwt.js
        if (data.token) {
            setToken(data.token);
            localStorage.setItem('adminData', JSON.stringify(data.admin));
        }

        return data;
    } catch (error) {
        console.error('Login error:', error);
        throw error;
    }
}

export function logout() {
    removeToken();
    localStorage.removeItem('adminData');
}

export function isAuthenticated() {
    return checkAuth();
}

export function getAdminData() {
    const adminData = localStorage.getItem('adminData');
    return adminData ? JSON.parse(adminData) : null;
}

export async function verifyAdminExists() {
    try {
        const token = localStorage.getItem('adminToken');
        if (!token) {
            return false;
        }

        const response = await fetch(API_ROUTES.ADMIN.PROFILE, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            }
        });

        if (response.status === 404) {
            logout();
            return false;
        }

        if (!response.ok) {
            return false;
        }

        const data = await response.json();
        
        if (data.admin) {
            const currentAdminData = getAdminData();
            const dbAdminData = data.admin;
            
            const hasChanges = JSON.stringify(currentAdminData) !== JSON.stringify(dbAdminData);
            
            if (hasChanges) {
                localStorage.setItem('adminData', JSON.stringify(dbAdminData));
            }
            
            return true;
        }

        return false;
    } catch (error) {
        console.error('Admin verification error:', error);
        return false;
    }
}

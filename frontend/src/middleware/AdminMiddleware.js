import { getToken, removeToken, isAuthenticated, decodeToken } from '../utils/jwt.js';
import { navigate } from '../utils/navigation.js';
import { showToast } from '../components/ToastMessage.js';

export function protectAdminRoute(redirectPath = '/auth/admin/login') {
    if (!isAuthenticated()) {
        showToast('Please login to access this page', 'error');
        navigate(redirectPath);
        return false;
    }
    return true;
}

export function validateTokenForApi(options = {}) {
    const token = getToken();
    
    if (!token) {
        throw new Error('No authentication token found');
    }

    const decoded = decodeToken(token);
    if (!decoded) {
        removeToken();
        throw new Error('Invalid token');
    }

    const currentTime = Math.floor(Date.now() / 1000);
    if (decoded.exp && decoded.exp < currentTime) {
        removeToken();
        throw new Error('Token has expired');
    }

    return {
        ...options,
        headers: {
            ...options.headers,
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        }
    };
}

export async function authenticatedFetch(url, options = {}) {
    try {
        const validatedOptions = validateTokenForApi(options);
        const response = await fetch(url, validatedOptions);
        
        if (response.status === 401) {
            removeToken();
            showToast('Session expired. Please login again', 'error');
            navigate('/auth/admin/login');
            throw new Error('Unauthorized');
        }
        
        return response;
    } catch (error) {
        if (error.message === 'No authentication token found' || 
            error.message === 'Invalid token' || 
            error.message === 'Token has expired') {
            showToast(error.message, 'error');
            navigate('/auth/admin/login');
        }
        throw error;
    }
}

export function isAdminUser() {
    const token = getToken();
    if (!token) return false;
    
    const decoded = decodeToken(token);
    if (!decoded) return false;
    
    return decoded.role === 'admin' || decoded.is_admin === true;
}

export function withAdminAuth(callback) {
    return function() {
        if (!protectAdminRoute()) {
            return;
        }
        
        if (!isAdminUser()) {
            showToast('Access denied. Admin privileges required', 'error');
            navigate('/auth/admin/login');
            return;
        }
        
        return callback();
    };
}

export function adminLogout() {
    removeToken();
    localStorage.removeItem('adminData');
    showToast('Logged out successfully', 'success');
    navigate('/auth/admin/login');
}

export async function refreshAuthToken(refreshToken) {
    try {
        const response = await fetch('/api/admin/refresh', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ refresh_token: refreshToken })
        });
        
        if (!response.ok) {
            throw new Error('Failed to refresh token');
        }
        
        const data = await response.json();
        setToken(data.token);
        return data;
    } catch (error) {
        removeToken();
        throw error;
    }
}

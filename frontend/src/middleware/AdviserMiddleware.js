import { getToken, removeToken, isAuthenticated, decodeToken } from '../utils/jwt.js';
import { navigate } from '../utils/navigation.js';
import { showToast } from '../components/ToastMessage.js';

export function protectAdviserRoute(redirectPath = '/auth/adviser/login') {
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
            navigate('/auth/adviser/login');
            throw new Error('Unauthorized');
        }
        
        return response;
    } catch (error) {
        if (error.message === 'No authentication token found' || 
            error.message === 'Invalid token' || 
            error.message === 'Token has expired') {
            showToast(error.message, 'error');
            navigate('/auth/adviser/login');
        }
        throw error;
    }
}

export function isAdviserUser() {
    const token = getToken();
    if (!token) return false;
    
    const decoded = decodeToken(token);
    if (!decoded) return false;
    
    return decoded.role === 'adviser';
}

export function withAdviserAuth(callback) {
    return function() {
        if (!protectAdviserRoute()) {
            return;
        }
        
        if (!isAdviserUser()) {
            showToast('Access denied. Adviser privileges required', 'error');
            navigate('/auth/adviser/login');
            return;
        }
        
        return callback();
    };
}

export function adviserLogout() {
    removeToken();
    localStorage.removeItem('adviserData');
    showToast('Logged out successfully', 'success');
    navigate('/auth/adviser/login');
}

export async function refreshAuthToken(refreshToken) {
    try {
        const response = await fetch('/api/adviser/refresh', {
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

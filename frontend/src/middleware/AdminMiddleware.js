import { getToken, removeToken, isAuthenticated, decodeToken, isTokenExpired } from '../utils/jwt.js';
import { navigate } from '../utils/navigation.js';
import { showToast } from '../components/ToastMessage.js';

export function protectAdminRoute(redirectPath = '/auth/admin/login') {
    const token = getToken('admin');
    if (!token) {
        isAuthenticated('admin').then((auth) => {
            if (!auth) {
                showToast('Please login to access this page', 'error');
                navigate(redirectPath);
            }
        });
        return true;
    }

    if (isTokenExpired(token)) {
        removeToken('admin');
        showToast('Session expired. Please login again', 'error');
        navigate(redirectPath);
        return false;
    }

    return true;
}

export async function protectAdminRouteAsync(redirectPath = '/auth/admin/login') {
    const auth = await isAuthenticated('admin');
    if (!auth) {
        showToast('Please login to access this page', 'error');
        navigate(redirectPath);
        return false;
    }
    return true;
}

export function validateTokenForApi(options = {}) {
    const token = getToken('admin');
    
    if (!token) {
        throw new Error('No authentication token found');
    }

    const decoded = decodeToken(token);
    if (!decoded) {
        removeToken('admin');
        throw new Error('Invalid token');
    }

    if (isTokenExpired(token)) {
        removeToken('admin');
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
            removeToken('admin');
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
    const token = getToken('admin');
    if (!token) return false;
    
    const decoded = decodeToken(token);
    if (!decoded) return false;
    
    return decoded.role === 'admin' || decoded.is_admin === true;
}

export function withAdminAuth(callback) {
    return async function() {
        const ok = await protectAdminRouteAsync();
        if (!ok) return;
        
        if (!isAdminUser()) {
            showToast('Access denied. Admin privileges required', 'error');
            navigate('/auth/admin/login');
            return;
        }
        
        return callback();
    };
}

export function adminLogout() {
    removeToken('admin');
    showToast('Logged out successfully', 'success');
    navigate('/auth/admin/login');
}

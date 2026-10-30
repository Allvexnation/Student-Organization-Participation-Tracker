import { getToken, removeToken, isAuthenticated, decodeToken, isTokenExpired } from '../utils/jwt.js';
import { navigate } from '../utils/navigation.js';
import { showToast } from '../components/ToastMessage.js';

export function protectAdviserRoute(redirectPath = '/auth/adviser/login') {
    const token = getToken('adviser');
    if (!token) {
        isAuthenticated('adviser').then((auth) => {
            if (!auth) {
                showToast('Please login to access this page', 'error');
                navigate(redirectPath);
            }
        });
        return true;
    }

    if (isTokenExpired(token)) {
        removeToken('adviser');
        showToast('Session expired. Please login again', 'error');
        navigate(redirectPath);
        return false;
    }

    return true;
}

export async function protectAdviserRouteAsync(redirectPath = '/auth/adviser/login') {
    const auth = await isAuthenticated('adviser');
    if (!auth) {
        showToast('Please login to access this page', 'error');
        navigate(redirectPath);
        return false;
    }
    return true;
}

export function validateTokenForApi(options = {}) {
    const token = getToken('adviser');
    
    if (!token) {
        throw new Error('No authentication token found');
    }

    const decoded = decodeToken(token);
    if (!decoded) {
        removeToken('adviser');
        throw new Error('Invalid token');
    }

    if (isTokenExpired(token)) {
        removeToken('adviser');
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
            removeToken('adviser');
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
    const token = getToken('adviser');
    if (!token) return false;
    
    const decoded = decodeToken(token);
    if (!decoded) return false;
    
    return decoded.role === 'adviser';
}

export function withAdviserAuth(callback) {
    return async function() {
        const ok = await protectAdviserRouteAsync();
        if (!ok) return;
        
        if (!isAdviserUser()) {
            showToast('Access denied. Adviser privileges required', 'error');
            navigate('/auth/adviser/login');
            return;
        }
        
        return callback();
    };
}

export function adviserLogout() {
    removeToken('adviser');
    showToast('Logged out successfully', 'success');
    navigate('/auth/adviser/login');
}

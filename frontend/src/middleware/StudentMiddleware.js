import { getToken, removeToken, isAuthenticated, decodeToken, isTokenExpired } from '../utils/jwt.js';
import { navigate } from '../utils/navigation.js';
import { showToast } from '../components/ToastMessage.js';

export function protectStudentRoute(redirectPath = '/auth/student/login') {
    const token = getToken('student');
    if (!token) {
        isAuthenticated('student').then((auth) => {
            if (!auth) {
                showToast('Please login to access this page', 'error');
                navigate(redirectPath);
            }
        });
        return true;
    }

    if (isTokenExpired(token)) {
        removeToken('student');
        showToast('Session expired. Please login again', 'error');
        navigate(redirectPath);
        return false;
    }

    return true;
}

export async function protectStudentRouteAsync(redirectPath = '/auth/student/login') {
    const auth = await isAuthenticated('student');
    if (!auth) {
        showToast('Please login to access this page', 'error');
        navigate(redirectPath);
        return false;
    }
    return true;
}

export function validateTokenForApi(options = {}) {
    const token = getToken('student');
    
    if (!token) {
        throw new Error('No authentication token found');
    }

    const decoded = decodeToken(token);
    if (!decoded) {
        removeToken('student');
        throw new Error('Invalid token');
    }

    if (isTokenExpired(token)) {
        removeToken('student');
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
            removeToken('student');
            showToast('Session expired. Please login again', 'error');
            navigate('/auth/student/login');
            throw new Error('Unauthorized');
        }
        
        return response;
    } catch (error) {
        if (error.message === 'No authentication token found' || 
            error.message === 'Invalid token' || 
            error.message === 'Token has expired') {
            showToast(error.message, 'error');
            navigate('/auth/student/login');
        }
        throw error;
    }
}

export function isStudentUser() {
    const token = getToken('student');
    if (!token) return false;
    
    const decoded = decodeToken(token);
    if (!decoded) return false;
    
    return decoded.role === 'student';
}

export function withStudentAuth(callback) {
    return async function() {
        const ok = await protectStudentRouteAsync();
        if (!ok) return;
        
        if (!isStudentUser()) {
            showToast('Access denied. Student privileges required', 'error');
            navigate('/auth/student/login');
            return;
        }
        
        return callback();
    };
}

export function studentLogout() {
    removeToken('student');
    showToast('Logged out successfully', 'success');
    navigate('/auth/student/login');
}

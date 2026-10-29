import { navigate } from './navigation.js';
import { API_ROUTES } from '../api/server/api.js';

function getTokenKey(role) {
    const roleKeys = {
        'admin': 'adminToken',
        'adviser': 'adviserToken',
        'student': 'studentToken'
    };
    return roleKeys[role] || 'adminToken';
}

export function getToken(role = 'admin') {
    return localStorage.getItem(getTokenKey(role));
}

export function setToken(token, role = 'admin') {
    localStorage.setItem(getTokenKey(role), token);
}

export function removeToken(role = 'admin') {
    localStorage.removeItem(getTokenKey(role));
}

export function decodeToken(token) {
    try {
        const base64Url = token.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
            return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
        }).join(''));
        return JSON.parse(jsonPayload);
    } catch (e) {
        return null;
    }
}

export function isTokenExpired(token) {
    const decoded = decodeToken(token);
    if (!decoded || !decoded.exp) {
        return true;
    }
    const currentTime = Math.floor(Date.now() / 1000);
    return decoded.exp < currentTime;
}

async function validateTokenWithDatabase(token) {
    try {
        const response = await fetch(API_ROUTES.SESSION.VALIDATE, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        const data = await response.json();
        if (response.ok && data.valid === true) {
            return { valid: true, networkError: false };
        }
        return { valid: false, networkError: false };
    } catch (error) {
        console.error('Token validation error:', error);

        return { valid: false, networkError: true };
    }
}

export async function isAuthenticated(role = 'admin') {
    const token = getToken(role);
    if (!token) {
        return false;
    }

    if (isTokenExpired(token)) {
        removeToken(role);
        return false;
    }

    const { valid, networkError } = await validateTokenWithDatabase(token);

    if (networkError) {
        return true;
    }

    if (!valid) {
        removeToken(role);
        return false;
    }
    
    return true;
}

export async function requireAuth(role = 'admin') {
    const authenticated = await isAuthenticated(role);
    if (!authenticated) {
        const loginPaths = {
            'admin': '/auth/admin/login',
            'adviser': '/auth/adviser/login',
            'student': '/auth/student/login'
        };
        navigate(loginPaths[role] || '/auth/admin/login');
    }
}

export function getUserId(role = 'admin') {
    const token = getToken(role);
    const decoded = decodeToken(token);
    return decoded ? decoded.user_id : null;
}

export function getUserEmail(role = 'admin') {
    const token = getToken(role);
    const decoded = decodeToken(token);
    return decoded ? decoded.email : null;
}

export function getUserRole(role = 'admin') {
    const token = getToken(role);
    const decoded = decodeToken(token);
    return decoded ? decoded.role : null;
}

let networkListenerInitialized = false;

export function initNetworkListener() {
    if (networkListenerInitialized) {
        return;
    }
    
    networkListenerInitialized = true;
    
    window.addEventListener('online', async () => {
        console.log('Network connection restored. Re-validating session...');
 
        const roles = ['admin', 'adviser', 'student'];
        
        for (const role of roles) {
            const token = getToken(role);
            
            if (token && !isTokenExpired(token)) {
                try {
                    const { valid, networkError } = await validateTokenWithDatabase(token);
                    
                    if (!networkError && !valid) {

                        removeToken(role);
                        console.log(`Session invalid for ${role} after re-validation. Logging out...`);

                        const currentPath = window.location.pathname;
                        if (currentPath.includes(`/${role}`)) {
                            navigate(`/auth/${role}/login`);
                        }
                    } else if (!networkError && valid) {
                        console.log(`Session validated successfully for ${role} after network restoration.`);
                    }
                } catch (error) {
                    console.error(`Error re-validating ${role} session after network restoration:`, error);
                }
            }
        }
    });
}

import { navigate } from './navigation.js';
import { API_ROUTES } from '../api/server/api.js';
import {
    setStoredToken,
    getStoredToken,
    removeStoredToken,
    setStoredUser,
    getStoredUser,
    removeStoredUser,
    getTokenKey,
    getUserKey
} from './TokenStore.js';
import { getDeviceInfo, getDeviceFingerprint } from './DeviceInfo.js';

export { getTokenKey, getUserKey };

const validationCache = {
    admin: { token: null, timestamp: 0, valid: false },
    adviser: { token: null, timestamp: 0, valid: false },
    student: { token: null, timestamp: 0, valid: false }
};

const inFlightValidation = {
    admin: null,
    adviser: null,
    student: null
};

const VALIDATION_CACHE_TTL_MS = 30000;

export function getToken(role = 'admin') {
    return getStoredToken(role);
}

export function setToken(token, role = 'admin') {
    setStoredToken(token, role);
    if (validationCache[role]) {
        validationCache[role] = { token: token, timestamp: Date.now(), valid: true };
    }
}

export async function logoutSession(role = 'admin') {
    const token = getToken(role);
    let deviceInfo = {};
    try {
        deviceInfo = await getDeviceInfo();
    } catch (e) { }

    try {
        await fetch(API_ROUTES.SESSION.LOGOUT, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': token ? `Bearer ${token}` : ''
            },
            body: JSON.stringify({
                token: token || '',
                role: role,
                user_type: role,
                device_fingerprint: deviceInfo.device_fingerprint || getDeviceFingerprint() || '',
                ...deviceInfo
            })
        });
    } catch (e) {
        console.warn('Backend logout failed:', e);
    } finally {
        removeToken(role);
    }
}

export function removeToken(role = 'admin') {
    removeStoredToken(role);
    removeStoredUser(role);
    if (validationCache[role]) {
        validationCache[role] = { token: null, timestamp: 0, valid: false };
    }
}

export function getUserData(role = 'admin') {
    return getStoredUser(role);
}

export function setUserData(user, role = 'admin') {
    setStoredUser(user, role);
}

export function decodeToken(token) {
    if (!token || typeof token !== 'string') return null;
    try {
        const parts = token.split('.');
        if (parts.length !== 3) return null;
        const base64Url = parts[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const jsonPayload = decodeURIComponent(atob(base64).split('').map(function (c) {
            return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
        }).join(''));
        return JSON.parse(jsonPayload);
    } catch (e) {
        return null;
    }
}

export function isTokenExpired(token) {
    const decoded = decodeToken(token);
    if (!decoded) {
        return true;
    }

    if (!decoded.exp) {
        return false;
    }
    const currentTime = Math.floor(Date.now() / 1000);
    return decoded.exp < currentTime;
}

export async function restoreSessionFromDevice(role = 'admin') {
    try {
        const deviceInfo = await getDeviceInfo();
        const response = await fetch(API_ROUTES.SESSION.RESTORE, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                role: role,
                user_type: role,
                device_fingerprint: deviceInfo.device_fingerprint || getDeviceFingerprint() || '',
                ...deviceInfo
            })
        });

        if (!response.ok) {
            return null;
        }

        const data = await response.json();
        if (data.valid && data.token) {
            setToken(data.token, role);
            if (data.user) {
                setUserData(data.user, role);
            }
            return data;
        }
        return null;
    } catch (error) {
        console.warn('Session restoration failed:', error);
        return null;
    }
}

export async function validateTokenWithDatabase(token, role = 'admin') {

    if (inFlightValidation[role]) {
        return inFlightValidation[role];
    }

    inFlightValidation[role] = (async () => {
        try {
            const fingerprint = getDeviceFingerprint() || '';
            const url = fingerprint
                ? `${API_ROUTES.SESSION.VALIDATE}?fingerprint=${encodeURIComponent(fingerprint)}`
                : API_ROUTES.SESSION.VALIDATE;

            const headers = {
                'Authorization': `Bearer ${token}`
            };

            const response = await fetch(url, {
                method: 'GET',
                headers: headers
            });

            const data = await response.json();
            if (response.ok && data.valid === true) {
                if (data.user) {
                    setUserData(data.user, role);
                }
                return { valid: true, networkError: false, user: data.user };
            }
            return { valid: false, networkError: false };
        } catch (error) {
            console.error('Token validation error:', error);
            return { valid: false, networkError: true };
        } finally {
            inFlightValidation[role] = null;
        }
    })();

    return inFlightValidation[role];
}

export async function isAuthenticated(role = 'admin') {
    let token = getToken(role);

    if (!token) {
        const restored = await restoreSessionFromDevice(role);
        if (restored && restored.token) {
            token = restored.token;
        } else {
            return false;
        }
    }

    if (isTokenExpired(token)) {
        removeToken(role);
        return false;
    }

    const cache = validationCache[role];
    const now = Date.now();
    if (cache && cache.token === token && cache.valid && (now - cache.timestamp < VALIDATION_CACHE_TTL_MS)) {
        return true;
    }

    const { valid, networkError } = await validateTokenWithDatabase(token, role);

    if (networkError) {

        return true;
    }

    if (!valid) {
        removeToken(role);
        return false;
    }

    if (validationCache[role]) {
        validationCache[role] = { token: token, timestamp: now, valid: true };
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
        const roles = ['admin', 'adviser', 'student'];

        for (const role of roles) {
            const token = getToken(role);

            if (token && !isTokenExpired(token)) {
                try {
                    const { valid, networkError } = await validateTokenWithDatabase(token, role);

                    if (!networkError && !valid) {
                        removeToken(role);
                        const currentPath = window.location.pathname;
                        if (currentPath.includes(`/${role}`)) {
                            navigate(`/auth/${role}/login`);
                        }
                    }
                } catch (error) {
                    console.error(`Error re-validating ${role} session:`, error);
                }
            }
        }
    });
}

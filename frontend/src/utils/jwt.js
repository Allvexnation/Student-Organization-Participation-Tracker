import { navigate } from './navigation.js';

const TOKEN_KEY = 'adminToken';

export function getToken() {
    return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token) {
    localStorage.setItem(TOKEN_KEY, token);
}

export function removeToken() {
    localStorage.removeItem(TOKEN_KEY);
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

export function isAuthenticated() {
    const token = getToken();
    if (!token) {
        return false;
    }
    if (isTokenExpired(token)) {
        removeToken();
        return false;
    }
    return true;
}

export function requireAuth() {
    if (!isAuthenticated()) {
        navigate('/auth/admin/login');
    }
}

export function getUserId() {
    const token = getToken();
    const decoded = decodeToken(token);
    return decoded ? decoded.user_id : null;
}

export function getUserEmail() {
    const token = getToken();
    const decoded = decodeToken(token);
    return decoded ? decoded.email : null;
}

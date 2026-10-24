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

export function isAuthenticated() {
    const token = getToken();
    return token !== null && token !== undefined && token !== '';
}

export function requireAuth() {
    if (!isAuthenticated()) {
        window.location.hash = '#admin-login';
    }
}

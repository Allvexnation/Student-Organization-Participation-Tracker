
const memoryTokens = {
    admin: null,
    adviser: null,
    student: null
};

const memoryUsers = {
    admin: null,
    adviser: null,
    student: null
};

function normalizeRole(role) {
    if (!role) return 'admin';
    const r = String(role).toLowerCase();
    if (r.includes('adviser')) return 'adviser';
    if (r.includes('student')) return 'student';
    return 'admin';
}

export function getTokenKey(role = 'admin') {
    const norm = normalizeRole(role);
    return `${norm}Token`;
}

export function getUserKey(role = 'admin') {
    const norm = normalizeRole(role);
    return `${norm}Data`;
}

function getCookieName(prefix, role = 'admin') {
    const norm = normalizeRole(role);
    return `__sec_${prefix}_${norm}`;
}

function getDeviceKey() {
    try {
        const ua = typeof navigator !== 'undefined' ? navigator.userAgent : 'sopt_ua';
        const lang = typeof navigator !== 'undefined' ? navigator.language : 'en';
        const scr = typeof screen !== 'undefined' ? `${screen.width}x${screen.height}x${screen.colorDepth}` : 'scr';
        const str = `${ua}|${lang}|${scr}`;
        
        let hash = 5381;
        for (let i = 0; i < str.length; i++) {
            hash = ((hash << 5) + hash) + str.charCodeAt(i);
            hash = hash & hash;
        }
        return `sopt_sec_${Math.abs(hash).toString(36)}`;
    } catch (e) {
        return 'sopt_sec_default_fallback_key';
    }
}

function encodeDevice(plainText) {
    if (!plainText) return '';
    try {
        const key = getDeviceKey();
        let encoded = '';
        for (let i = 0; i < plainText.length; i++) {
            encoded += String.fromCharCode(plainText.charCodeAt(i) ^ key.charCodeAt(i % key.length));
        }
        return btoa(unescape(encodeURIComponent(encoded)));
    } catch (e) {
        return btoa(plainText);
    }
}

function decodeDevice(cipherText) {
    if (!cipherText) return '';
    try {
        const key = getDeviceKey();
        const decoded = decodeURIComponent(escape(atob(cipherText)));
        let original = '';
        for (let i = 0; i < decoded.length; i++) {
            original += String.fromCharCode(decoded.charCodeAt(i) ^ key.charCodeAt(i % key.length));
        }
        return original;
    } catch (e) {
        try {
            return atob(cipherText);
        } catch (err) {
            return '';
        }
    }
}

function setSecureCookie(name, value, days = 3650) {
    if (typeof document === 'undefined') return;
    try {
        const d = new Date();
        d.setTime(d.getTime() + (days * 24 * 60 * 60 * 1000));
        const expires = "; expires=" + d.toUTCString();
        const isHttps = typeof window !== 'undefined' && window.location && window.location.protocol === 'https:';
        const secureFlag = isHttps ? '; Secure' : '';
        document.cookie = `${name}=${encodeURIComponent(value || '')}${expires}; path=/; SameSite=Lax${secureFlag}`;
    } catch (e) {
        console.warn('Could not set cookie:', e);
    }
}

function getSecureCookie(name) {
    if (typeof document === 'undefined') return null;
    try {
        const prefix = name + "=";
        const cookies = document.cookie.split(';');
        for (let i = 0; i < cookies.length; i++) {
            let c = cookies[i].trim();
            if (c.indexOf(prefix) === 0) {
                return decodeURIComponent(c.substring(prefix.length, c.length));
            }
        }
        return null;
    } catch (e) {
        return null;
    }
}

function removeSecureCookie(name) {
    if (typeof document === 'undefined') return;
    try {
        document.cookie = `${name}=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT; SameSite=Lax`;
    } catch (e) {}
}

export function setStoredToken(token, role = 'admin') {
    const norm = normalizeRole(role);
    memoryTokens[norm] = token;

    try {
        if (typeof sessionStorage !== 'undefined') {
            sessionStorage.setItem(getTokenKey(norm), token);
        }
    } catch (e) {}

    if (token) {
        const cipher = encodeDevice(token);
        setSecureCookie(getCookieName('tok', norm), cipher, 3650);
    } else {
        removeStoredToken(norm);
    }
}

export function getStoredToken(role = 'admin') {
    const norm = normalizeRole(role);

    if (memoryTokens[norm]) {
        return memoryTokens[norm];
    }

    try {
        if (typeof sessionStorage !== 'undefined') {
            const sessionVal = sessionStorage.getItem(getTokenKey(norm));
            if (sessionVal) {
                memoryTokens[norm] = sessionVal;
                return sessionVal;
            }
        }
    } catch (e) {}

    const cookieVal = getSecureCookie(getCookieName('tok', norm));
    if (cookieVal) {
        const plainToken = decodeDevice(cookieVal);
        if (plainToken) {
            memoryTokens[norm] = plainToken;
            try {
                if (typeof sessionStorage !== 'undefined') {
                    sessionStorage.setItem(getTokenKey(norm), plainToken);
                }
            } catch (e) {}
            return plainToken;
        }
    }

    return null;
}

export function removeStoredToken(role = 'admin') {
    const norm = normalizeRole(role);
    memoryTokens[norm] = null;

    try {
        if (typeof sessionStorage !== 'undefined') {
            sessionStorage.removeItem(getTokenKey(norm));
        }
    } catch (e) {}

    removeSecureCookie(getCookieName('tok', norm));
}

export function setStoredUser(user, role = 'admin') {
    const norm = normalizeRole(role);
    memoryUsers[norm] = user;

    const jsonStr = user ? JSON.stringify(user) : '';

    try {
        if (typeof sessionStorage !== 'undefined') {
            if (jsonStr) {
                sessionStorage.setItem(getUserKey(norm), jsonStr);
            } else {
                sessionStorage.removeItem(getUserKey(norm));
            }
        }
    } catch (e) {}

    if (jsonStr) {
        const cipher = encodeDevice(jsonStr);
        setSecureCookie(getCookieName('usr', norm), cipher, 3650);
    } else {
        removeSecureCookie(getCookieName('usr', norm));
    }
}

export function getStoredUser(role = 'admin') {
    const norm = normalizeRole(role);

    if (memoryUsers[norm]) {
        return memoryUsers[norm];
    }

    try {
        if (typeof sessionStorage !== 'undefined') {
            const sessionVal = sessionStorage.getItem(getUserKey(norm));
            if (sessionVal) {
                const parsed = JSON.parse(sessionVal);
                memoryUsers[norm] = parsed;
                return parsed;
            }
        }
    } catch (e) {}

    const cookieVal = getSecureCookie(getCookieName('usr', norm));
    if (cookieVal) {
        const plainJson = decodeDevice(cookieVal);
        if (plainJson) {
            try {
                const parsed = JSON.parse(plainJson);
                memoryUsers[norm] = parsed;
                if (typeof sessionStorage !== 'undefined') {
                    sessionStorage.setItem(getUserKey(norm), plainJson);
                }
                return parsed;
            } catch (e) {}
        }
    }

    return null;
}

export function removeStoredUser(role = 'admin') {
    const norm = normalizeRole(role);
    memoryUsers[norm] = null;

    try {
        if (typeof sessionStorage !== 'undefined') {
            sessionStorage.removeItem(getUserKey(norm));
        }
    } catch (e) {}

    removeSecureCookie(getCookieName('usr', norm));
}

export function clearAllStoredAuth() {
    ['admin', 'adviser', 'student'].forEach(r => {
        removeStoredToken(r);
        removeStoredUser(r);
    });
}


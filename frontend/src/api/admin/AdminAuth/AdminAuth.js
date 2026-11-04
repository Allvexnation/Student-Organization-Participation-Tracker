import { API_ROUTES } from '../../server/api.js';
import { setToken, removeToken, getToken, isAuthenticated as checkAuth, getUserData, setUserData } from '../../../utils/jwt.js';
import { getDeviceInfo, getDeviceFingerprint } from '../../../utils/DeviceInfo.js';
import { CacheService } from '../../../../cache/CacheService.js';

export async function adminLookupAccount(usernameOrEmail) {
    try {
        const response = await fetch(API_ROUTES.ADMIN.LOOKUP, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ username_or_email: usernameOrEmail })
        });

        const contentType = response.headers.get('content-type');
        if (!contentType || !contentType.includes('application/json')) {
            return { message: 'Server error: Invalid response format' };
        }

        return await response.json();
    } catch (error) {
        console.error('Lookup error:', error);
        return { message: 'Network error: Unable to connect to server' };
    }
}

export async function adminLogin(Email, Password) {
    try {
        const deviceInfo = await getDeviceInfo();
        
        const response = await fetch(API_ROUTES.ADMIN.LOGIN, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ 
                username_or_email: Email, 
                password: Password,
                auth_type: 'password',
                ...deviceInfo
            })
        });

        const contentType = response.headers.get('content-type');
        if (!contentType || !contentType.includes('application/json')) {
            const text = await response.text();
            console.error('Non-JSON response:', text);
            return { message: 'Server error: Invalid response format' };
        }

        const data = await response.json();
        
        if (data.token) {
            setToken(data.token, 'admin');
            if (data.admin) {
                setUserData(data.admin, 'admin');
            }
        }
        
        return data;
    } catch (error) {
        console.error('Login error:', error);
        return { message: 'Network error: Unable to connect to server' };
    }
}

export async function adminLogout(token) {
    try {
        const authToken = token || getToken('admin');
        const fingerprint = getDeviceFingerprint() || '';

        await fetch(API_ROUTES.ADMIN.LOGOUT, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': authToken ? `Bearer ${authToken}` : ''
            },
            body: JSON.stringify({
                token: authToken || '',
                device_fingerprint: fingerprint
            })
        });
    } catch (e) {
        console.error('Logout error:', e);
    } finally {
        removeToken('admin');
        await CacheService.clear();
    }
    return { success: true };
}

export function getAdminData() {
    return getUserData('admin');
}

export async function verifyAdminToken(token) {
    const authToken = token || getToken('admin');
    const response = await fetch(API_ROUTES.ADMIN.VERIFY, {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${authToken}`
        }
    });
    return response.json();
}

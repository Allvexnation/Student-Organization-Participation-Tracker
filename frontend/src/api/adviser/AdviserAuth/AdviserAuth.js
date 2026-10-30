import { API_ROUTES } from '../../server/api.js';
import { setToken, removeToken, getToken, isAuthenticated as checkAuth, getUserData, setUserData } from '../../../utils/jwt.js';
import { getDeviceInfo } from '../../../utils/DeviceInfo.js';

export async function adviserLogin(Email, Password) {
    try {
        const deviceInfo = await getDeviceInfo();
        
        const response = await fetch(API_ROUTES.ADVISER.LOGIN, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ 
                username_or_email: Email, 
                password: Password,
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
            setToken(data.token, 'adviser');
            if (data.adviser) {
                setUserData(data.adviser, 'adviser');
            }
        }
        
        return data;
    } catch (error) {
        console.error('Login error:', error);
        return { message: 'Network error: Unable to connect to server' };
    }
}

export async function adviserLogout(token) {
    try {
        const authToken = token || getToken('adviser');
        let deviceInfo = {};
        try {
            deviceInfo = await getDeviceInfo();
        } catch (e) {}

        await fetch(API_ROUTES.ADVISER.LOGOUT, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': authToken ? `Bearer ${authToken}` : ''
            },
            body: JSON.stringify({
                token: authToken || '',
                device_fingerprint: deviceInfo.device_fingerprint || '',
                ...deviceInfo
            })
        });
    } catch (error) {
        console.error('Logout error:', error);
    } finally {
        removeToken('adviser');
        sessionStorage.removeItem('adviserData');
        sessionStorage.removeItem('adviserVerified');
    }
}

export function getAdviserData() {
    return getUserData('adviser');
}

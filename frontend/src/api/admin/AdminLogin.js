import { API_ROUTES } from '../server/api.js';
import { setToken, removeToken, getToken, isAuthenticated as checkAuth, getUserData, setUserData } from '../../../src/utils/jwt.js';
import { getDeviceInfo } from '../../../src/utils/DeviceInfo.js';

export async function adminLogin(usernameOrEmail, password) {
    try {
        let deviceInfo = {};
        try {
            deviceInfo = await getDeviceInfo();
        } catch (e) {}

        const response = await fetch(API_ROUTES.ADMIN.LOGIN, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                username_or_email: usernameOrEmail,
                password: password,
                ...deviceInfo
            })
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || 'Login failed');
        }

        if (data.token) {
            setToken(data.token, 'admin');
            if (data.admin) {
                setUserData(data.admin, 'admin');
            }
        }

        return data;
    } catch (error) {
        console.error('Login error:', error);
        throw error;
    }
}

export async function logout() {
    try {
        const token = getToken('admin');
        let deviceInfo = {};
        try {
            deviceInfo = await getDeviceInfo();
        } catch (e) {}

        await fetch(API_ROUTES.ADMIN.LOGOUT, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': token ? `Bearer ${token}` : ''
            },
            body: JSON.stringify({
                token: token || '',
                device_fingerprint: deviceInfo.device_fingerprint || '',
                ...deviceInfo
            })
        });
    } catch (error) {
        console.error('Logout error:', error);
    } finally {
        removeToken('admin');
        sessionStorage.removeItem('adminData');
        sessionStorage.removeItem('adminVerified');
        
        localStorage.removeItem('cachedAdvisers');
        localStorage.removeItem('cachedAdvisersTimestamp');
        localStorage.removeItem('cachedStudents');
        localStorage.removeItem('cachedStudentsTimestamp');
        localStorage.removeItem('cachedOrganizations');
        localStorage.removeItem('cachedOrganizationsTimestamp');
        localStorage.removeItem('cachedEvents');
        localStorage.removeItem('cachedEventsTimestamp');
        localStorage.removeItem('cachedRoles');
        localStorage.removeItem('cachedRolesTimestamp');
        localStorage.removeItem('cachedEventRegistrations');
        localStorage.removeItem('cachedEventRegistrationsTimestamp');
        localStorage.removeItem('cachedOrgMemberships');
        localStorage.removeItem('cachedOrgMembershipsTimestamp');
    }
}

export function isAuthenticated() {
    return checkAuth('admin');
}

export function getAdminData() {
    return getUserData('admin');
}

export async function verifyAdminExists() {
    try {
        const token = getToken('admin');
        if (!token) {
            return false;
        }

        const response = await fetch(API_ROUTES.ADMIN.PROFILE, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            }
        });

        if (response.status === 404) {
            await logout();
            return false;
        }

        if (!response.ok) {
            return false;
        }

        const data = await response.json();
        
        if (data.admin) {
            const currentAdminData = getAdminData();
            const dbAdminData = data.admin;
            
            const hasChanges = JSON.stringify(currentAdminData) !== JSON.stringify(dbAdminData);
            
            if (hasChanges) {
                setUserData(dbAdminData, 'admin');
            }
            
            return true;
        }

        return false;
    } catch (error) {
        console.error('Admin verification error:', error);
        return false;
    }
}

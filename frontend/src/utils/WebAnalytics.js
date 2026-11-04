import { getUserRole } from './jwt.js';
import { getDeviceInfo as getAuthDeviceInfo } from './DeviceInfo.js';
import { trackVisitor, updateActiveStatus, updateUrl } from '../api/web/WebAnalytics.js';

let currentAnalyticsId = null;
let heartbeatInterval = null;

export async function getDeviceInfo() {
    const ua = navigator.userAgent;
    let deviceType = 'Desktop';
    let browser = 'Unknown';
    let os = 'Unknown';

    if (/Mobile|Android|iPhone|iPad|iPod/i.test(ua)) {
        deviceType = /iPad/i.test(ua) ? 'Tablet' : 'Mobile';
    }

    if (/Chrome/i.test(ua)) browser = 'Chrome';
    else if (/Firefox/i.test(ua)) browser = 'Firefox';
    else if (/Safari/i.test(ua)) browser = 'Safari';
    else if (/Edge/i.test(ua)) browser = 'Edge';
    else if (/Opera/i.test(ua)) browser = 'Opera';

    if (/Windows/i.test(ua)) os = 'Windows';
    else if (/Mac/i.test(ua)) os = 'MacOS';
    else if (/Linux/i.test(ua)) os = 'Linux';
    else if (/Android/i.test(ua)) os = 'Android';
    else if (/iOS/i.test(ua)) os = 'iOS';

    return {
        device_type: deviceType,
        browser: browser,
        os: os,
        user_agent: ua,
        screen_resolution: `${window.screen.width}x${window.screen.height}`,
        language: navigator.language
    };
}

export async function getIPAddress() {
    try {
        const cachedIp = sessionStorage.getItem('clientIpAddress');
        if (cachedIp) {
            return cachedIp;
        }

        const deviceInfo = await getAuthDeviceInfo();
        return deviceInfo.ip_address || null;
    } catch (error) {
        console.warn('Error getting IP address:', error);
        return null;
    }
}

export async function getLocationInfo() {
    try {
        const deviceInfo = await getAuthDeviceInfo();
        return {
            country: deviceInfo.country || null,
            country_code: null,
            region: null,
            city: deviceInfo.city || null,
            latitude: null,
            longitude: null
        };
    } catch (error) {
        console.warn('Error getting location info:', error);
        return {
            country: null,
            country_code: null,
            region: null,
            city: null,
            latitude: null,
            longitude: null
        };
    }
}

export async function trackPageVisit(route) {
    try {
        if (route === '/banned' || route === '404') return;

        const deviceInfo = await getDeviceInfo();
        const authDeviceInfo = await getAuthDeviceInfo();
        const ipAddress = authDeviceInfo.ip_address || null;
        const locationInfo = {
            country: authDeviceInfo.country || null,
            country_code: null,
            region: null,
            city: authDeviceInfo.city || null,
            latitude: null,
            longitude: null
        };

        const userRole = getUserRole();
        let userId = null;
        let userType = null;

        if (userRole && (userRole === 'admin' || userRole === 'adviser' || userRole === 'student')) {
            const userData = JSON.parse(localStorage.getItem(`${userRole}Data`) || '{}');
            if (userData && userData.id) {
                userId = userData.id;
                userType = userRole;
            }
        }

        const visitorData = {
            route: route,
            ip_address: ipAddress,
            device_type: deviceInfo.device_type,
            browser: deviceInfo.browser,
            os: deviceInfo.os,
            user_agent: deviceInfo.user_agent,
            screen_resolution: deviceInfo.screen_resolution,
            language: deviceInfo.language,
            country: locationInfo.country,
            country_code: locationInfo.country_code,
            region: locationInfo.region,
            city: locationInfo.city,
            latitude: locationInfo.latitude,
            longitude: locationInfo.longitude,
            user_id: userId,
            user_type: userType,
            visited_at: new Date().toISOString(),
            active: 1,
            url: window.location.href
        };

        const result = await trackVisitor(visitorData);

        if (result && result.id) {
            currentAnalyticsId = result.id;
            startHeartbeat();
        }
    } catch (error) {
        console.error('Error tracking page visit:', error);
    }
}

function startHeartbeat() {

    if (heartbeatInterval) {
        clearInterval(heartbeatInterval);
    }

    heartbeatInterval = setInterval(async () => {
        if (currentAnalyticsId) {
            try {
                await updateActiveStatus(currentAnalyticsId, 1);
                await updateUrl(currentAnalyticsId, window.location.href);
            } catch (error) {
                console.error('Error sending heartbeat:', error);
            }
        }
    }, 30000);
}

function stopHeartbeat() {
    if (heartbeatInterval) {
        clearInterval(heartbeatInterval);
        heartbeatInterval = null;
    }

    if (currentAnalyticsId) {
        updateActiveStatus(currentAnalyticsId, 0).catch(error => {
            console.error('Error setting inactive status:', error);
        });
        currentAnalyticsId = null;
    }
}

export async function updateCurrentUrl() {
    if (currentAnalyticsId) {
        try {
            await updateUrl(currentAnalyticsId, window.location.href);
        } catch (error) {
            console.error('Error updating URL:', error);
        }
    }
}

export function getCurrentAnalyticsId() {
    return currentAnalyticsId;
}

window.addEventListener('beforeunload', stopHeartbeat);
window.addEventListener('pagehide', stopHeartbeat);

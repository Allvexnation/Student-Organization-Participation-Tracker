let cachedFingerprint = null;
let cachedLocationData = null;
let locationFetchPromise = null;

export function getDeviceFingerprint() {
    if (!cachedFingerprint) {
        cachedFingerprint = generateDeviceFingerprint();
    }
    return cachedFingerprint;
}

export async function getDeviceInfo() {
    const deviceInfo = {
        ip_address: '',
        user_agent: navigator.userAgent,
        device_type: getDeviceType(),
        device_fingerprint: getDeviceFingerprint(),
        screen_resolution: typeof screen !== 'undefined' ? `${screen.width}x${screen.height}` : '1920x1080',
        browser: getBrowserInfo(),
        os: getOSInfo(),
        country: '',
        city: '',
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
    };

    try {
        const locationData = await getIpAndLocation();
        deviceInfo.ip_address = locationData.ip || '';
        deviceInfo.country = locationData.country || '';
        deviceInfo.city = locationData.city || '';
    } catch (error) {

    }

    return deviceInfo;
}

function getDeviceType() {
    const userAgent = navigator.userAgent;
    if (/tablet|ipad|playbook|silk/i.test(userAgent)) {
        return 'tablet';
    }
    if (/mobile|android|iphone|ipod/i.test(userAgent)) {
        return 'mobile';
    }
    return 'desktop';
}

function generateDeviceFingerprint() {
    try {
        const components = [
            navigator.userAgent || '',
            navigator.language || '',
            typeof screen !== 'undefined' ? screen.colorDepth : '',
            new Date().getTimezoneOffset(),
            typeof window !== 'undefined' && !!window.sessionStorage,
            typeof window !== 'undefined' && !!window.localStorage,
            navigator.hardwareConcurrency || '',
            navigator.deviceMemory || ''
        ];
        
        const str = components.join('|');
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            const char = str.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash;
        }
        
        return Math.abs(hash).toString(16);
    } catch (e) {
        return 'fingerprint_' + Math.random().toString(36).substring(2, 10);
    }
}

function getBrowserInfo() {
    const userAgent = navigator.userAgent;
    let browser = 'Unknown';
    
    if (userAgent.indexOf('Firefox') > -1) {
        browser = 'Firefox';
    } else if (userAgent.indexOf('Chrome') > -1) {
        browser = 'Chrome';
    } else if (userAgent.indexOf('Safari') > -1) {
        browser = 'Safari';
    } else if (userAgent.indexOf('Edge') > -1) {
        browser = 'Edge';
    } else if (userAgent.indexOf('Opera') > -1 || userAgent.indexOf('OPR') > -1) {
        browser = 'Opera';
    }
    
    return browser;
}

function getOSInfo() {
    const userAgent = navigator.userAgent;
    let os = 'Unknown';
    
    if (userAgent.indexOf('Win') > -1) {
        os = 'Windows';
    } else if (userAgent.indexOf('Mac') > -1) {
        os = 'MacOS';
    } else if (userAgent.indexOf('Linux') > -1) {
        os = 'Linux';
    } else if (userAgent.indexOf('Android') > -1) {
        os = 'Android';
    } else if (userAgent.indexOf('iOS') > -1) {
        os = 'iOS';
    }
    
    return os;
}

async function getIpAndLocation() {
    if (cachedLocationData) {
        return cachedLocationData;
    }

    if (locationFetchPromise) {
        return locationFetchPromise;
    }

    locationFetchPromise = (async () => {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 1200); // 1.2s timeout max

        try {
            const response = await fetch('https://ipapi.co/json/', { signal: controller.signal });
            clearTimeout(timeout);
            if (response.ok) {
                const data = await response.json();
                cachedLocationData = {
                    ip: data.ip || '',
                    country: data.country_name || '',
                    city: data.city || ''
                };
                return cachedLocationData;
            }
        } catch (e) {
            clearTimeout(timeout);
        }

        cachedLocationData = { ip: '', country: '', city: '' };
        return cachedLocationData;
    })().finally(() => {
        locationFetchPromise = null;
    });

    return locationFetchPromise;
}

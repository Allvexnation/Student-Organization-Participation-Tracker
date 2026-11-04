let cachedFingerprint = null;
let cachedLocationData = null;
let locationFetchPromise = null;

const LOCATION_CACHE_KEY = 'deviceLocationCache';
const LOCATION_CACHE_TTL_MS = 60 * 60 * 1000;
const RATE_LIMIT_KEY = 'ipGeoRateLimitedUntil';
const RATE_LIMIT_COOLDOWN_MS = 30 * 60 * 1000;

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
        screen_resolution: getScreenResolution(),
        browser: getBrowserInfo(),
        os: getOSInfo(),
        country: '',
        city: '',
        timezone: getTimezone()
    };

    try {
        const locationData = await getIpAndLocation();
        deviceInfo.ip_address = locationData.ip || '';
        deviceInfo.country = locationData.country || '';
        deviceInfo.city = locationData.city || '';
    } catch (error) {
        console.warn('Failed to get location data:', error);
    }

    return deviceInfo;
}

function getDeviceType() {
    const userAgent = navigator.userAgent;
    const platform = navigator.platform || '';

    if (/tablet|ipad|playbook|silk/i.test(userAgent) ||
        (navigator.maxTouchPoints > 1 && /Macintosh/i.test(platform))) {
        return 'tablet';
    }

    if (/mobile|android|iphone|ipod/i.test(userAgent) &&
        !/Windows NT|Macintosh|Linux x86_64/i.test(userAgent)) {
        return 'mobile';
    }

    return 'desktop';
}

function getScreenResolution() {
    try {
        if (typeof screen !== 'undefined' && screen.width && screen.height) {
            return `${screen.width}x${screen.height}`;
        }
        return window.innerWidth && window.innerHeight
            ? `${window.innerWidth}x${window.innerHeight}`
            : '1920x1080';
    } catch (e) {
        return '1920x1080';
    }
}

function getTimezone() {
    try {
        return Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
    } catch (e) {
        return 'UTC';
    }
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

function readPersistedLocation() {
    try {
        const raw = sessionStorage.getItem(LOCATION_CACHE_KEY);
        if (!raw) return null;
        const parsed = JSON.parse(raw);
        if (!parsed?.data || !parsed?.expiresAt || Date.now() > parsed.expiresAt) {
            return null;
        }
        return parsed.data;
    } catch (e) {
        return null;
    }
}

function persistLocation(data) {
    try {
        sessionStorage.setItem(LOCATION_CACHE_KEY, JSON.stringify({
            data,
            expiresAt: Date.now() + LOCATION_CACHE_TTL_MS
        }));
        if (data.ip) {
            sessionStorage.setItem('clientIpAddress', data.ip);
        }
    } catch (e) { }
}

function isGeoRateLimited() {
    try {
        const until = Number(sessionStorage.getItem(RATE_LIMIT_KEY) || 0);
        return until > Date.now();
    } catch (e) {
        return false;
    }
}

function markGeoRateLimited() {
    try {
        sessionStorage.setItem(RATE_LIMIT_KEY, String(Date.now() + RATE_LIMIT_COOLDOWN_MS));
    } catch (e) { }
}

async function fetchJson(url, timeoutMs = 4000) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);
    try {
        const response = await fetch(url, { signal: controller.signal });
        clearTimeout(timeout);
        if (response.status === 429) {
            markGeoRateLimited();
            return null;
        }
        if (!response.ok) {
            return null;
        }
        return await response.json();
    } catch (e) {
        clearTimeout(timeout);
        return null;
    }
}

async function fetchPublicIp() {
    const cachedIp = sessionStorage.getItem('clientIpAddress');
    if (cachedIp) {
        return cachedIp;
    }

    const providers = [
        'https://api.ipify.org?format=json',
        'https://api64.ipify.org?format=json'
    ];

    for (const url of providers) {
        const data = await fetchJson(url, 4000);
        if (data?.ip) {
            try {
                sessionStorage.setItem('clientIpAddress', data.ip);
            } catch (e) { }
            return data.ip;
        }
    }

    return '';
}

async function fetchGeoForIp(ip) {
    if (!ip || isGeoRateLimited()) {
        return { country: '', city: '' };
    }

    const ipapi = await fetchJson(`https://ipapi.co/${ip}/json/`, 4000);
    if (ipapi && !ipapi.error) {
        return {
            country: ipapi.country_name || '',
            city: ipapi.city || ''
        };
    }

    const geojs = await fetchJson('https://get.geojs.io/v1/ip/geo.json', 4000);
    if (geojs) {
        return {
            country: geojs.country || '',
            city: geojs.city || ''
        };
    }

    return { country: '', city: '' };
}

async function getIpAndLocation() {
    if (cachedLocationData) {
        return cachedLocationData;
    }

    const persisted = readPersistedLocation();
    if (persisted) {
        cachedLocationData = persisted;
        return cachedLocationData;
    }

    if (locationFetchPromise) {
        return locationFetchPromise;
    }

    locationFetchPromise = (async () => {
        const ip = await fetchPublicIp();
        const geo = await fetchGeoForIp(ip);
        cachedLocationData = {
            ip: ip || '',
            country: geo.country || '',
            city: geo.city || ''
        };
        persistLocation(cachedLocationData);
        return cachedLocationData;
    })().finally(() => {
        locationFetchPromise = null;
    });

    return locationFetchPromise;
}

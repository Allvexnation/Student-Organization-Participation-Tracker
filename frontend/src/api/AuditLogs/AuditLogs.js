import { API_BASE_URL } from '../server/api.js';
import { getToken } from '../../utils/jwt.js';

function getAuthHeaders(role = 'admin') {
    const token = getToken(role);
    return {
        'Content-Type': 'application/json',
        'Authorization': token ? `Bearer ${token}` : ''
    };
}

export function getDeviceInfo() {
    const userAgent = navigator.userAgent;
    let browser = 'Unknown';
    let os = 'Unknown';
    let deviceType = 'Desktop';
    let deviceBrand = 'Unknown';

    if (userAgent.includes('Firefox')) {
        browser = 'Firefox';
    } else if (userAgent.includes('Chrome')) {
        browser = 'Chrome';
    } else if (userAgent.includes('Safari')) {
        browser = 'Safari';
    } else if (userAgent.includes('Edge')) {
        browser = 'Edge';
    } else if (userAgent.includes('Opera')) {
        browser = 'Opera';
    }

    if (userAgent.includes('Windows')) {
        os = 'Windows';
    } else if (userAgent.includes('Mac')) {
        os = 'MacOS';
    } else if (userAgent.includes('Linux')) {
        os = 'Linux';
    } else if (userAgent.includes('Android')) {
        os = 'Android';
        deviceType = 'Mobile';
    } else if (userAgent.includes('iOS') || userAgent.includes('iPhone') || userAgent.includes('iPad')) {
        os = 'iOS';
        deviceType = 'Mobile';
    }

    if (userAgent.includes('iPhone')) {
        deviceBrand = 'Apple';
    } else if (userAgent.includes('iPad')) {
        deviceBrand = 'Apple';
        deviceType = 'Tablet';
    } else if (userAgent.includes('Samsung')) {
        deviceBrand = 'Samsung';
    } else if (userAgent.includes('Pixel')) {
        deviceBrand = 'Google';
    } else if (userAgent.includes('Xiaomi')) {
        deviceBrand = 'Xiaomi';
    } else if (userAgent.includes('OnePlus')) {
        deviceBrand = 'OnePlus';
    } else if (userAgent.includes('Huawei')) {
        deviceBrand = 'Huawei';
    } else if (userAgent.includes('OPPO')) {
        deviceBrand = 'OPPO';
    } else if (userAgent.includes('Vivo')) {
        deviceBrand = 'Vivo';
    }

    if (userAgent.includes('Tablet') || userAgent.includes('iPad')) {
        deviceType = 'Tablet';
    }

    const screenResolution = `${window.screen.width}x${window.screen.height}`;

    return {
        browser,
        os,
        device_type: deviceType,
        device_brand: deviceBrand,
        user_agent: userAgent,
        screen_resolution: screenResolution
    };
}

export async function logChange(data, role = 'admin') {
    const deviceInfo = getDeviceInfo();

    let ipAddress = 'Unknown';
    try {
        const ipResponse = await fetch('https://api.ipify.org?format=json');
        const ipData = await ipResponse.json();
        ipAddress = ipData.ip;
    } catch (error) {
        console.error('Failed to get IP address:', error);
    }

    const logData = {
        ...data,
        ip_address: ipAddress,
        ...deviceInfo
    };

    const response = await fetch(`${API_BASE_URL}/api/audit-logs/log`, {
        method: 'POST',
        headers: getAuthHeaders(role),
        body: JSON.stringify(logData)
    });

    if (!response.ok) {
        throw new Error('Failed to log change');
    }

    return await response.json();
}

export async function getAllAuditLogs(filters = {}, role = 'admin') {

    const cleanFilters = Object.fromEntries(
        Object.entries(filters).filter(([_, v]) => v !== '' && v !== null && v !== undefined)
    );
    const queryParams = new URLSearchParams(cleanFilters);
    const response = await fetch(`${API_BASE_URL}/api/audit-logs?${queryParams}`, {
        headers: getAuthHeaders(role)
    });
    
    if (!response.ok) {
        throw new Error('Failed to fetch audit logs');
    }
    
    return await response.json();
}

export async function getAuditLogById(id) {
    const response = await fetch(`${API_BASE_URL}/api/audit-logs/${id}`, {
        headers: getAuthHeaders()
    });
    
    if (!response.ok) {
        throw new Error('Failed to fetch audit log');
    }
    
    return await response.json();
}

export async function getAuditLogsByUser(userId, userType, limit = 50) {
    const response = await fetch(`${API_BASE_URL}/api/audit-logs/user/${userId}/${userType}?limit=${limit}`, {
        headers: getAuthHeaders()
    });
    
    if (!response.ok) {
        throw new Error('Failed to fetch audit logs for user');
    }
    
    return await response.json();
}

export async function getAuditLogsByRecord(tableName, recordId, limit = 50) {
    const response = await fetch(`${API_BASE_URL}/api/audit-logs/record/${tableName}/${recordId}?limit=${limit}`, {
        headers: getAuthHeaders()
    });
    
    if (!response.ok) {
        throw new Error('Failed to fetch audit logs for record');
    }
    
    return await response.json();
}

export async function deleteAuditLog(id) {
    const response = await fetch(`${API_BASE_URL}/api/audit-logs/${id}`, {
        method: 'DELETE',
        headers: getAuthHeaders()
    });
    
    if (!response.ok) {
        throw new Error('Failed to delete audit log');
    }
    
    return await response.json();
}

export async function cleanupOldAuditLogs(days = 90) {
    const response = await fetch(`${API_BASE_URL}/api/audit-logs/cleanup?days=${days}`, {
        method: 'DELETE',
        headers: getAuthHeaders()
    });
    
    if (!response.ok) {
        throw new Error('Failed to cleanup old audit logs');
    }
    
    return await response.json();
}

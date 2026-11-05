import { API_BASE_URL } from '../server/api.js';
import { getToken } from '../../utils/jwt.js';

function getAuthHeaders(role = 'student') {
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

export async function logStudentChange(data, role = 'student') {
    const deviceInfo = getDeviceInfo();

    let ipAddress = 'Unknown';
    try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 1200);
        const ipResponse = await fetch('https://api.ipify.org?format=json', { signal: controller.signal });
        clearTimeout(timeoutId);
        if (ipResponse.ok) {
            const ipData = await ipResponse.json();
            ipAddress = ipData.ip || 'Unknown';
        }
    } catch (error) {

    }

    const logData = {
        ...data,
        ip_address: ipAddress,
        ...deviceInfo
    };

    const response = await fetch(`${API_BASE_URL}/api/student-audit-logs/log`, {
        method: 'POST',
        headers: getAuthHeaders(role),
        body: JSON.stringify(logData)
    });

    if (!response.ok) {
        throw new Error('Failed to log student change');
    }

    return await response.json();
}

export async function getAllStudentAuditLogs(filters = {}, role = 'student') {

    const cleanFilters = Object.fromEntries(
        Object.entries(filters).filter(([_, v]) => v !== '' && v !== null && v !== undefined)
    );
    const queryParams = new URLSearchParams(cleanFilters);
    const response = await fetch(`${API_BASE_URL}/api/student-audit-logs?${queryParams}`, {
        headers: getAuthHeaders(role)
    });
    
    if (!response.ok) {
        throw new Error('Failed to fetch student audit logs');
    }
    
    return await response.json();
}

export async function getStudentAuditLogById(id) {
    const response = await fetch(`${API_BASE_URL}/api/student-audit-logs/${id}`, {
        headers: getAuthHeaders()
    });
    
    if (!response.ok) {
        throw new Error('Failed to fetch student audit log');
    }
    
    return await response.json();
}

export async function getStudentAuditLogsByUser(userId, userType, limit = 50) {
    const response = await fetch(`${API_BASE_URL}/api/student-audit-logs/user/${userId}/${userType}?limit=${limit}`, {
        headers: getAuthHeaders()
    });
    
    if (!response.ok) {
        throw new Error('Failed to fetch student audit logs for user');
    }
    
    return await response.json();
}

export async function getStudentAuditLogsByRecord(tableName, recordId, limit = 50) {
    const response = await fetch(`${API_BASE_URL}/api/student-audit-logs/record/${tableName}/${recordId}?limit=${limit}`, {
        headers: getAuthHeaders()
    });
    
    if (!response.ok) {
        throw new Error('Failed to fetch student audit logs for record');
    }
    
    return await response.json();
}

export async function deleteStudentAuditLog(id, role = 'student') {
    const response = await fetch(`${API_BASE_URL}/api/student-audit-logs/${id}`, {
        method: 'DELETE',
        headers: getAuthHeaders(role)
    });
    
    if (!response.ok) {
        throw new Error('Failed to delete student audit log');
    }
    
    return await response.json();
}

export async function cleanupOldStudentAuditLogs(days = 90, role = 'student') {
    const response = await fetch(`${API_BASE_URL}/api/student-audit-logs/cleanup?days=${days}`, {
        method: 'DELETE',
        headers: getAuthHeaders(role)
    });
    
    if (!response.ok) {
        throw new Error('Failed to cleanup old student audit logs');
    }
    
    return await response.json();
}

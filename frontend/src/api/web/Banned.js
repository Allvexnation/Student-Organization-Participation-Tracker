import { getToken } from '../../utils/jwt.js';
import { API_ROUTES } from '../server/api.js';

async function getHeaders() {
    const token = getToken('admin');
    const headers = {
        'Content-Type': 'application/json'
    };
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }
    return headers;
}

export async function createBan(banData) {
    try {
        const headers = await getHeaders();
        const response = await fetch(API_ROUTES.WEB.BAN, {
            method: 'POST',
            headers: headers,
            body: JSON.stringify(banData)
        });
        
        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.message || 'Failed to create ban');
        }
        
        return data;
    } catch (error) {
        console.error('Error creating ban:', error);
        throw error;
    }
}

export async function checkBan(checkData) {
    try {

        if (!checkData.ip_address) {
            const cachedIp = sessionStorage.getItem('clientIpAddress');
            if (cachedIp) {
                checkData.ip_address = cachedIp;
            } else {
                try {
                    const ipResponse = await fetch('https://api.ipify.org?format=json');
                    const ipData = await ipResponse.json();
                    checkData.ip_address = ipData.ip;
                    if (ipData.ip) {
                        sessionStorage.setItem('clientIpAddress', ipData.ip);
                    }
                } catch (ipError) {
                    console.error('Failed to detect IP:', ipError);
                }
            }
        }

        const response = await fetch(API_ROUTES.WEB.BAN_CHECK, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(checkData)
        });
        
        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.message || 'Failed to check ban');
        }
        
        return data;
    } catch (error) {
        console.error('Error checking ban:', error);
        throw error;
    }
}

export async function checkOverallBan(checkData) {
    try {
        const response = await fetch(API_ROUTES.WEB.BAN_CHECK_OVERALL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(checkData)
        });
        
        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.message || 'Failed to check overall ban');
        }
        
        return data;
    } catch (error) {
        console.error('Error checking overall ban:', error);
        throw error;
    }
}

export async function getBanInfo(infoData) {
    try {
        const response = await fetch(API_ROUTES.WEB.BAN_INFO, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(infoData)
        });
        
        const data = await response.json();
        
        if (!response.ok) {

            if (response.status === 404) {
                return { ban: null };
            }
            throw new Error(data.message || 'Failed to get ban info');
        }
        
        return data;
    } catch (error) {
        console.error('Error getting ban info:', error);
        throw error;
    }
}

export async function getSessions() {
    try {
        const headers = await getHeaders();
        const response = await fetch(API_ROUTES.WEB.BAN_SESSIONS, {
            method: 'GET',
            headers: headers
        });
        
        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.message || 'Failed to get sessions');
        }
        
        return data;
    } catch (error) {
        console.error('Error getting sessions:', error);
        throw error;
    }
}

export async function getAllBans() {
    try {
        const headers = await getHeaders();
        const response = await fetch(API_ROUTES.WEB.BAN_ALL, {
            method: 'GET',
            headers: headers
        });
        
        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.message || 'Failed to get all bans');
        }
        
        return data;
    } catch (error) {
        console.error('Error getting all bans:', error);
        throw error;
    }
}

export async function deactivateBan(banId) {
    try {
        const headers = await getHeaders();
        const response = await fetch(API_ROUTES.WEB.BAN_DEACTIVATE(banId), {
            method: 'POST',
            headers: headers
        });
        
        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.message || 'Failed to deactivate ban');
        }
        
        return data;
    } catch (error) {
        console.error('Error deactivating ban:', error);
        throw error;
    }
}

export async function cleanupExpiredBans() {
    try {
        const headers = await getHeaders();
        const response = await fetch(API_ROUTES.WEB.BAN_CLEANUP, {
            method: 'POST',
            headers: headers
        });
        
        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.message || 'Failed to cleanup expired bans');
        }
        
        return data;
    } catch (error) {
        console.error('Error cleaning up expired bans:', error);
        throw error;
    }
}

export async function deleteBan(banId) {
    try {
        const headers = await getHeaders();
        const response = await fetch(API_ROUTES.WEB.BAN_DELETE(banId), {
            method: 'DELETE',
            headers: headers
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || 'Failed to delete ban');
        }

        return data;
    } catch (error) {
        console.error('Error deleting ban:', error);
        throw error;
    }
}

export async function activateBan(banId) {
    try {
        const headers = await getHeaders();
        const response = await fetch(API_ROUTES.WEB.BAN_ACTIVATE(banId), {
            method: 'POST',
            headers: headers
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || 'Failed to activate ban');
        }

        return data;
    } catch (error) {
        console.error('Error activating ban:', error);
        throw error;
    }
}

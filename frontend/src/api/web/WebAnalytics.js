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

export async function trackVisitor(visitorData) {
    try {
        const response = await fetch(API_ROUTES.WEB_ANALYTICS.TRACK, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(visitorData)
        });
        
        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.message || 'Failed to track visitor');
        }
        
        return data;
    } catch (error) {
        console.error('Error tracking visitor:', error);
        throw error;
    }
}

export async function getAllAnalytics() {
    try {
        const headers = await getHeaders();
        const response = await fetch(API_ROUTES.WEB_ANALYTICS.GET_ALL, {
            method: 'GET',
            headers: headers
        });
        
        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.message || 'Failed to get analytics');
        }
        
        return data;
    } catch (error) {
        console.error('Error getting analytics:', error);
        throw error;
    }
}

export async function getAnalyticsById(id) {
    try {
        const headers = await getHeaders();
        const response = await fetch(API_ROUTES.WEB_ANALYTICS.GET(id), {
            method: 'GET',
            headers: headers
        });
        
        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.message || 'Failed to get analytics');
        }
        
        return data;
    } catch (error) {
        console.error('Error getting analytics:', error);
        throw error;
    }
}

export async function getAnalyticsByRoute(route) {
    try {
        const headers = await getHeaders();
        const response = await fetch(API_ROUTES.WEB_ANALYTICS.GET_BY_ROUTE(route), {
            method: 'GET',
            headers: headers
        });
        
        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.message || 'Failed to get analytics by route');
        }
        
        return data;
    } catch (error) {
        console.error('Error getting analytics by route:', error);
        throw error;
    }
}

export async function getAnalyticsByDate(startDate, endDate) {
    try {
        const headers = await getHeaders();
        const response = await fetch(API_ROUTES.WEB_ANALYTICS.GET_BY_DATE(startDate, endDate), {
            method: 'GET',
            headers: headers
        });
        
        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.message || 'Failed to get analytics by date');
        }
        
        return data;
    } catch (error) {
        console.error('Error getting analytics by date:', error);
        throw error;
    }
}

export async function getAnalyticsStats() {
    try {
        const headers = await getHeaders();
        const response = await fetch(API_ROUTES.WEB_ANALYTICS.STATS, {
            method: 'GET',
            headers: headers
        });
        
        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.message || 'Failed to get analytics stats');
        }
        
        return data;
    } catch (error) {
        console.error('Error getting analytics stats:', error);
        throw error;
    }
}

export async function deleteAnalytics(id) {
    try {
        const headers = await getHeaders();
        const response = await fetch(API_ROUTES.WEB_ANALYTICS.DELETE(id), {
            method: 'DELETE',
            headers: headers
        });
        
        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.message || 'Failed to delete analytics');
        }
        
        return data;
    } catch (error) {
        console.error('Error deleting analytics:', error);
        throw error;
    }
}

export async function updateActiveStatus(id, active) {
    try {
        const response = await fetch(API_ROUTES.WEB_ANALYTICS.UPDATE_ACTIVE, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ id, active })
        });
        
        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.message || 'Failed to update active status');
        }
        
        return data;
    } catch (error) {
        console.error('Error updating active status:', error);
        throw error;
    }
}

export async function updateUrl(id, url) {
    try {
        const response = await fetch(API_ROUTES.WEB_ANALYTICS.UPDATE_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ id, url })
        });
        
        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.message || 'Failed to update URL');
        }
        
        return data;
    } catch (error) {
        console.error('Error updating URL:', error);
        throw error;
    }
}

export async function getActiveSessions() {
    try {
        const headers = await getHeaders();
        const response = await fetch(API_ROUTES.WEB_ANALYTICS.GET_ACTIVE_SESSIONS, {
            method: 'GET',
            headers: headers
        });
        
        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.message || 'Failed to get active sessions');
        }
        
        return data;
    } catch (error) {
        console.error('Error getting active sessions:', error);
        throw error;
    }
}

import { API_ROUTES } from '../../server/api.js';
import { getToken } from '../../../utils/jwt.js';

async function getHeaders() {
    const token = getToken('adviser');
    return {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
    };
}

export async function getDashboardCounts() {
    try {
        const response = await fetch(API_ROUTES.ADVISER.DASHBOARD_COUNTS, {
            method: 'GET',
            headers: await getHeaders()
        });

        if (!response.ok) {
            throw new Error('Failed to fetch dashboard counts');
        }

        const data = await response.json();
        return {
            totalStudents: data.totalStudents || 0,
            totalOrganizations: data.totalOrganizations || 0,
            activeEvents: data.activeEvents || 0,
            eventRegistrations: data.eventRegistrations || 0,
            orgMemberships: data.orgMemberships || 0,
            pendingRequests: data.pendingRequests || 0
        };
    } catch (error) {
        console.error('Error fetching dashboard counts:', error);
        return {
            totalStudents: 0,
            totalOrganizations: 0,
            activeEvents: 0,
            eventRegistrations: 0,
            orgMemberships: 0,
            pendingRequests: 0
        };
    }
}

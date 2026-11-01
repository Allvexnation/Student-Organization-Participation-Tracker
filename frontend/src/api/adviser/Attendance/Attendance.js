import { API_ROUTES } from '../../server/api.js';
import { getToken } from '../../../utils/jwt.js';

async function getHeaders() {
    const token = getToken('adviser');
    const headers = {
        'Content-Type': 'application/json'
    };
    if (token && token !== 'null' && token !== 'undefined') {
        headers['Authorization'] = `Bearer ${token}`;
    }
    return headers;
}

export async function getAttendanceEvents() {
    try {
        const response = await fetch(API_ROUTES.ADVISER.ATTENDANCE_EVENTS, {
            method: 'GET',
            headers: await getHeaders()
        });

        if (!response.ok) {
            throw new Error('Failed to fetch events for attendance');
        }

        const data = await response.json();
        return data.events || [];
    } catch (error) {
        console.error('Error fetching attendance events:', error);
        throw error;
    }
}

export async function getAttendanceByEvent(eventId, date = null) {
    try {
        let url = API_ROUTES.ADVISER.ATTENDANCE_BY_EVENT(eventId);
        if (date) {
            url += `?date=${encodeURIComponent(date)}`;
        }
        const response = await fetch(url, {
            method: 'GET',
            headers: await getHeaders()
        });

        if (!response.ok) {
            throw new Error('Failed to fetch attendance for event');
        }

        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Error fetching attendance by event:', error);
        throw error;
    }
}

export async function logAttendanceTime(payload) {
    try {
        const response = await fetch(API_ROUTES.ADVISER.ATTENDANCE_LOG, {
            method: 'POST',
            headers: await getHeaders(),
            body: JSON.stringify(payload)
        });

        const data = await response.json();
        if (!response.ok) {
            throw new Error(data.message || 'Failed to log attendance');
        }

        return data;
    } catch (error) {
        console.error('Error logging attendance time:', error);
        throw error;
    }
}

export async function editStudentSession(payload) {
    try {
        const response = await fetch(API_ROUTES.ADVISER.ATTENDANCE_EDIT_SESSION, {
            method: 'POST',
            headers: await getHeaders(),
            body: JSON.stringify(payload)
        });

        const data = await response.json();
        if (!response.ok) {
            throw new Error(data.message || 'Failed to update student session');
        }

        return data;
    } catch (error) {
        console.error('Error updating student session:', error);
        throw error;
    }
}

export async function handleExcuseApproval(payload) {
    try {
        const response = await fetch(API_ROUTES.ADVISER.ATTENDANCE_APPROVE_EXCUSE, {
            method: 'POST',
            headers: await getHeaders(),
            body: JSON.stringify(payload)
        });

        const data = await response.json();
        if (!response.ok) {
            throw new Error(data.message || 'Failed to process excuse approval');
        }

        return data;
    } catch (error) {
        console.error('Error processing excuse approval:', error);
        throw error;
    }
}

export async function markAttendanceAbsent(payload) {
    try {
        const response = await fetch(API_ROUTES.ADVISER.ATTENDANCE_ABSENT, {
            method: 'POST',
            headers: await getHeaders(),
            body: JSON.stringify(payload)
        });

        const data = await response.json();
        if (!response.ok) {
            throw new Error(data.message || 'Failed to mark attendance as absent');
        }

        return data;
    } catch (error) {
        console.error('Error marking attendance absent:', error);
        throw error;
    }
}

export async function markAttendanceExcused(payload) {
    try {
        const response = await fetch(API_ROUTES.ADVISER.ATTENDANCE_EXCUSE, {
            method: 'POST',
            headers: await getHeaders(),
            body: JSON.stringify(payload)
        });

        const data = await response.json();
        if (!response.ok) {
            throw new Error(data.message || 'Failed to mark attendance as excused');
        }

        return data;
    } catch (error) {
        console.error('Error marking attendance excused:', error);
        throw error;
    }
}

export async function resetAttendanceDay(payload) {
    try {
        const response = await fetch(API_ROUTES.ADVISER.ATTENDANCE_RESET, {
            method: 'POST',
            headers: await getHeaders(),
            body: JSON.stringify(payload)
        });

        const data = await response.json();
        if (!response.ok) {
            throw new Error(data.message || 'Failed to reset attendance');
        }

        return data;
    } catch (error) {
        console.error('Error resetting attendance day:', error);
        throw error;
    }
}

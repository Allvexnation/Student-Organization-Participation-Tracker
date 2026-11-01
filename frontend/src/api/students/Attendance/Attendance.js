import { API_ROUTES } from '../../server/api.js';
import { getToken } from '../../../utils/jwt.js';

async function getHeaders() {
    const token = getToken('student');
    const headers = {
        'Content-Type': 'application/json'
    };
    if (token && token !== 'null' && token !== 'undefined') {
        headers['Authorization'] = `Bearer ${token}`;
    }
    return headers;
}

export async function getStudentAttendanceEvents() {
    try {
        const response = await fetch(API_ROUTES.STUDENT.ATTENDANCE_EVENTS, {
            method: 'GET',
            headers: await getHeaders()
        });

        if (!response.ok) {
            throw new Error('Failed to fetch events for attendance');
        }

        const data = await response.json();
        return data.events || [];
    } catch (error) {
        console.error('Error fetching student attendance events:', error);
        throw error;
    }
}

export async function getStudentAttendanceByEvent(eventId) {
    try {
        const response = await fetch(API_ROUTES.STUDENT.ATTENDANCE_BY_EVENT(eventId), {
            method: 'GET',
            headers: await getHeaders()
        });

        if (!response.ok) {
            throw new Error('Failed to fetch attendance for event');
        }

        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Error fetching student attendance by event:', error);
        throw error;
    }
}

export async function logStudentAttendanceTime(payload) {
    try {
        const response = await fetch(API_ROUTES.STUDENT.ATTENDANCE_LOG, {
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
        console.error('Error logging student attendance time:', error);
        throw error;
    }
}

export async function submitStudentExcuse(payload) {
    try {
        const response = await fetch(API_ROUTES.STUDENT.ATTENDANCE_EXCUSE, {
            method: 'POST',
            headers: await getHeaders(),
            body: JSON.stringify(payload)
        });

        const data = await response.json();
        if (!response.ok) {
            throw new Error(data.message || 'Failed to submit excuse request');
        }

        return data;
    } catch (error) {
        console.error('Error submitting student excuse:', error);
        throw error;
    }
}


import { API_ROUTES } from '../../server/api.js';
import { getToken } from '../../../utils/jwt.js';

async function getHeaders() {
    const token = getToken('student');
    return {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
    };
}

export async function getStudentTasks() {
    try {
        const response = await fetch(API_ROUTES.STUDENT.TASKS_GET_ALL, {
            method: 'GET',
            headers: await getHeaders()
        });
        
        if (!response.ok) {
            throw new Error('Failed to fetch tasks');
        }
        
        const data = await response.json();
        return data.tasks || [];
    } catch (error) {
        console.error('Error fetching tasks:', error);
        throw error;
    }
}

export async function getTask(id) {
    try {
        const response = await fetch(API_ROUTES.STUDENT.TASKS_GET(id), {
            method: 'GET',
            headers: await getHeaders()
        });
        
        if (!response.ok) {
            throw new Error('Failed to fetch task');
        }
        
        const data = await response.json();
        return data.task;
    } catch (error) {
        console.error('Error fetching task:', error);
        throw error;
    }
}

export async function updateTaskStatus(id, status) {
    try {
        const response = await fetch(API_ROUTES.STUDENT.TASKS_UPDATE_STATUS(id), {
            method: 'PATCH',
            headers: await getHeaders(),
            body: JSON.stringify({ status })
        });
        
        if (!response.ok) {
            throw new Error('Failed to update task status');
        }
        
        const result = await response.json();
        return result;
    } catch (error) {
        console.error('Error updating task status:', error);
        throw error;
    }
}

export async function updateScheduleStatus(scheduleId, status) {
    try {
        const response = await fetch(API_ROUTES.STUDENT.SCHEDULE_UPDATE_STATUS(scheduleId), {
            method: 'PATCH',
            headers: await getHeaders(),
            body: JSON.stringify({ status })
        });
        
        if (!response.ok) {
            throw new Error('Failed to update schedule status');
        }
        
        const result = await response.json();
        return result;
    } catch (error) {
        console.error('Error updating schedule status:', error);
        throw error;
    }
}

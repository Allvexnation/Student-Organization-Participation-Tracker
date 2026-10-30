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

export async function getAdviserTasks() {
    try {
        const response = await fetch(API_ROUTES.ADVISER.TASKS_GET_ALL, {
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

export async function getTasksByOrganization(orgId) {
    try {
        const response = await fetch(API_ROUTES.ADVISER.TASKS_GET_BY_ORG(orgId), {
            method: 'GET',
            headers: await getHeaders()
        });
        
        if (!response.ok) {
            throw new Error('Failed to fetch tasks by organization');
        }
        
        const data = await response.json();
        return data.tasks || [];
    } catch (error) {
        console.error('Error fetching tasks by organization:', error);
        throw error;
    }
}

export async function getTasksByEvent(eventId) {
    try {
        const response = await fetch(API_ROUTES.ADVISER.TASKS_GET_BY_EVENT(eventId), {
            method: 'GET',
            headers: await getHeaders()
        });
        
        if (!response.ok) {
            throw new Error('Failed to fetch tasks by event');
        }
        
        const data = await response.json();
        return data.tasks || [];
    } catch (error) {
        console.error('Error fetching tasks by event:', error);
        throw error;
    }
}

export async function getRegisteredEvents() {
    try {
        const response = await fetch(API_ROUTES.ADVISER.REGISTERED_EVENTS, {
            method: 'GET',
            headers: await getHeaders()
        });
        
        if (!response.ok) {
            throw new Error('Failed to fetch registered events');
        }
        
        const data = await response.json();
        return data.events || [];
    } catch (error) {
        console.error('Error fetching registered events:', error);
        throw error;
    }
}

export async function getOrganizationsByEvent(eventId) {
    try {
        const response = await fetch(API_ROUTES.ADVISER.ORGANIZATIONS_BY_EVENT(eventId), {
            method: 'GET',
            headers: await getHeaders()
        });
        
        if (!response.ok) {
            throw new Error('Failed to fetch organizations by event');
        }
        
        const data = await response.json();
        return data.organizations || [];
    } catch (error) {
        console.error('Error fetching organizations by event:', error);
        throw error;
    }
}

export async function getTask(id) {
    try {
        const response = await fetch(API_ROUTES.ADVISER.TASKS_GET(id), {
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

export async function createTask(data) {
    try {
        const response = await fetch(API_ROUTES.ADVISER.TASKS_CREATE, {
            method: 'POST',
            headers: await getHeaders(),
            body: JSON.stringify(data)
        });
        
        if (!response.ok) {
            throw new Error('Failed to create task');
        }
        
        const result = await response.json();
        return result;
    } catch (error) {
        console.error('Error creating task:', error);
        throw error;
    }
}

export async function updateTask(id, data) {
    try {
        const response = await fetch(API_ROUTES.ADVISER.TASKS_UPDATE(id), {
            method: 'PUT',
            headers: await getHeaders(),
            body: JSON.stringify(data)
        });
        
        if (!response.ok) {
            throw new Error('Failed to update task');
        }
        
        const result = await response.json();
        return result;
    } catch (error) {
        console.error('Error updating task:', error);
        throw error;
    }
}

export async function updateTaskStatus(id, status) {
    try {
        const response = await fetch(API_ROUTES.ADVISER.TASKS_UPDATE_STATUS(id), {
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

export async function deleteTask(id) {
    try {
        const response = await fetch(API_ROUTES.ADVISER.TASKS_DELETE(id), {
            method: 'DELETE',
            headers: await getHeaders()
        });
        
        if (!response.ok) {
            throw new Error('Failed to delete task');
        }
        
        const result = await response.json();
        return result;
    } catch (error) {
        console.error('Error deleting task:', error);
        throw error;
    }
}

export async function syncTaskGroup(data) {
    try {
        const response = await fetch(API_ROUTES.ADVISER.TASKS_GROUP, {
            method: 'POST',
            headers: await getHeaders(),
            body: JSON.stringify(data)
        });
        
        if (!response.ok) {
            const err = await response.json().catch(() => ({}));
            throw new Error(err.message || 'Failed to sync task group');
        }
        
        const result = await response.json();
        return result;
    } catch (error) {
        console.error('Error syncing task group:', error);
        throw error;
    }
}

export async function deleteTaskGroup(taskIds) {
    try {
        const response = await fetch(API_ROUTES.ADVISER.TASKS_GROUP, {
            method: 'DELETE',
            headers: await getHeaders(),
            body: JSON.stringify({ task_ids: taskIds })
        });
        
        if (!response.ok) {
            const err = await response.json().catch(() => ({}));
            throw new Error(err.message || 'Failed to delete task group');
        }
        
        const result = await response.json();
        return result;
    } catch (error) {
        console.error('Error deleting task group:', error);
        throw error;
    }
}

export async function updateScheduleStatus(scheduleId, status) {
    try {
        const response = await fetch(API_ROUTES.ADVISER.SCHEDULE_UPDATE_STATUS(scheduleId), {
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

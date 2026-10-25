import { API_ROUTES } from '../../server/api.js';
import { getToken } from '../../../utils/jwt.js';

async function getHeaders() {
    const token = getToken();
    return {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
    };
}

export async function getAllStudents() {
    try {
        const response = await fetch(API_ROUTES.ADMIN.STUDENT_GET_ALL, {
            method: 'GET',
            headers: await getHeaders()
        });
        
        if (!response.ok) {
            throw new Error('Failed to fetch students');
        }
        
        const data = await response.json();
        return data.students || [];
    } catch (error) {
        console.error('Error fetching students:', error);
        throw error;
    }
}

export async function getStudent(id) {
    try {
        const response = await fetch(API_ROUTES.ADMIN.STUDENT_GET(id), {
            method: 'GET',
            headers: await getHeaders()
        });
        
        if (!response.ok) {
            throw new Error('Failed to fetch student');
        }
        
        const data = await response.json();
        return data.student;
    } catch (error) {
        console.error('Error fetching student:', error);
        throw error;
    }
}

export async function createStudent(data) {
    try {
        const response = await fetch(API_ROUTES.ADMIN.STUDENT_CREATE, {
            method: 'POST',
            headers: await getHeaders(),
            body: JSON.stringify(data)
        });
        
        if (!response.ok) {
            throw new Error('Failed to create student');
        }
        
        const result = await response.json();
        return result;
    } catch (error) {
        console.error('Error creating student:', error);
        throw error;
    }
}

export async function updateStudent(id, data) {
    try {
        const response = await fetch(API_ROUTES.ADMIN.STUDENT_UPDATE(id), {
            method: 'PUT',
            headers: await getHeaders(),
            body: JSON.stringify(data)
        });
        
        if (!response.ok) {
            throw new Error('Failed to update student');
        }
        
        const result = await response.json();
        return result;
    } catch (error) {
        console.error('Error updating student:', error);
        throw error;
    }
}

export async function deleteStudent(id) {
    try {
        const response = await fetch(API_ROUTES.ADMIN.STUDENT_DELETE(id), {
            method: 'DELETE',
            headers: await getHeaders()
        });
        
        if (!response.ok) {
            throw new Error('Failed to delete student');
        }
        
        const result = await response.json();
        return result;
    } catch (error) {
        console.error('Error deleting student:', error);
        throw error;
    }
}

import { API_ROUTES } from '../server/api.js';

export function getAssetDownloadUrl(filename) {
    if (!filename) return '#';
    return API_ROUTES.WEB.UPDATES_DOWNLOAD(filename);
}

export async function getActiveUpdates() {
    try {
        const response = await fetch(API_ROUTES.WEB.UPDATES_ACTIVE);
        if (!response.ok) {
            throw new Error('Failed to fetch updates');
        }
        const data = await response.json();
        return data.updates || [];
    } catch (error) {
        console.error('Error fetching updates:', error);
        return [];
    }
}

export async function getAllUpdates() {
    try {
        const response = await fetch(API_ROUTES.WEB.UPDATES);
        if (!response.ok) {
            throw new Error('Failed to fetch all updates');
        }
        const data = await response.json();
        return data.updates || [];
    } catch (error) {
        console.error('Error fetching all updates:', error);
        return [];
    }
}

export async function getUpdateById(id) {
    try {
        const response = await fetch(API_ROUTES.WEB.UPDATES_GET(id));
        if (!response.ok) {
            throw new Error('Failed to fetch update');
        }
        const data = await response.json();
        return data.update || null;
    } catch (error) {
        console.error('Error fetching update:', error);
        return null;
    }
}

export async function createUpdate(updateData) {
    try {
        const response = await fetch(API_ROUTES.WEB.UPDATES_CREATE, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(updateData),
        });
        if (!response.ok) {
            throw new Error('Failed to create update');
        }
        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Error creating update:', error);
        throw error;
    }
}

export async function updateUpdate(id, updateData) {
    try {
        const response = await fetch(API_ROUTES.WEB.UPDATES_UPDATE(id), {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(updateData),
        });
        if (!response.ok) {
            throw new Error('Failed to update update');
        }
        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Error updating update:', error);
        throw error;
    }
}

export async function deleteUpdate(id) {
    try {
        const response = await fetch(API_ROUTES.WEB.UPDATES_DELETE(id), {
            method: 'DELETE',
        });
        if (!response.ok) {
            throw new Error('Failed to delete update');
        }
        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Error deleting update:', error);
        throw error;
    }
}

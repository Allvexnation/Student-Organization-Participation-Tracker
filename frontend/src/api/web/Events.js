import { API_ROUTES } from '../server/api.js';

export async function getPublicEvents() {
    const response = await fetch(API_ROUTES.WEB.EVENTS, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json'
        }
    });

    const data = await response.json();

    if (!response.ok) {
        throw new Error(data.message || 'Failed to load events');
    }

    return Array.isArray(data.events) ? data.events : [];
}

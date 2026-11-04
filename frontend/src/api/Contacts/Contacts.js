import { API_ROUTES } from '../server/api.js';

export async function submitAppeal(data) {
    try {
        const response = await fetch(API_ROUTES.CONTACTS.SUBMIT_APPEAL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        });

        const result = await response.json();
        return result;
    } catch (error) {
        console.error('Error submitting appeal:', error);
        return { error: error.message };
    }
}

export async function getAllAppeals() {
    try {
        const response = await fetch(API_ROUTES.CONTACTS.GET_ALL, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            }
        });

        const result = await response.json();
        return result;
    } catch (error) {
        console.error('Error getting appeals:', error);
        return { error: error.message };
    }
}

export async function getAppealById(id) {
    try {
        const response = await fetch(API_ROUTES.CONTACTS.GET(id), {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            }
        });

        const result = await response.json();
        return result;
    } catch (error) {
        console.error('Error getting appeal:', error);
        return { error: error.message };
    }
}

export async function updateAppealStatus(id, status) {
    try {
        const response = await fetch(API_ROUTES.CONTACTS.UPDATE_STATUS, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ id, status })
        });

        const result = await response.json();
        return result;
    } catch (error) {
        console.error('Error updating status:', error);
        return { error: error.message };
    }
}

export async function sendReply(id, replyMessage, status) {
    try {
        const response = await fetch(API_ROUTES.CONTACTS.SEND_REPLY, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ id, reply_message: replyMessage, status })
        });

        const result = await response.json();
        return result;
    } catch (error) {
        console.error('Error sending reply:', error);
        return { error: error.message };
    }
}

export async function getAllSupportContacts() {
    try {
        const response = await fetch(API_ROUTES.CONTACTS.GET_ALL_SUPPORT, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            }
        });

        const result = await response.json();
        return result;
    } catch (error) {
        console.error('Error getting support contacts:', error);
        return { error: error.message };
    }
}

export async function getSupportContactById(id) {
    try {
        const response = await fetch(API_ROUTES.CONTACTS.GET_SUPPORT(id), {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            }
        });

        const result = await response.json();
        return result;
    } catch (error) {
        console.error('Error getting support contact:', error);
        return { error: error.message };
    }
}

export async function updateSupportContactStatus(id, status) {
    try {
        const response = await fetch(API_ROUTES.CONTACTS.UPDATE_SUPPORT_STATUS, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ id, status })
        });

        const result = await response.json();
        return result;
    } catch (error) {
        console.error('Error updating support contact status:', error);
        return { error: error.message };
    }
}

export async function sendSupportContactReply(id, replyMessage, status) {
    try {
        const response = await fetch(API_ROUTES.CONTACTS.SEND_SUPPORT_REPLY, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ id, reply_message: replyMessage, status })
        });

        const result = await response.json();
        return result;
    } catch (error) {
        console.error('Error sending support contact reply:', error);
        return { error: error.message };
    }
}

export async function getAllReports() {
    try {
        const response = await fetch(API_ROUTES.CONTACTS.GET_ALL_REPORTS, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            }
        });

        const result = await response.json();
        return result;
    } catch (error) {
        console.error('Error getting reports:', error);
        return { error: error.message };
    }
}

export async function getReportById(id) {
    try {
        const response = await fetch(API_ROUTES.CONTACTS.GET_REPORT(id), {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            }
        });

        const result = await response.json();
        return result;
    } catch (error) {
        console.error('Error getting report:', error);
        return { error: error.message };
    }
}

export async function updateReportStatus(id, status) {
    try {
        const response = await fetch(API_ROUTES.CONTACTS.UPDATE_REPORT_STATUS, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ id, status })
        });

        const result = await response.json();
        return result;
    } catch (error) {
        console.error('Error updating report status:', error);
        return { error: error.message };
    }
}

export async function sendReportReply(id, replyMessage, status) {
    try {
        const response = await fetch(API_ROUTES.CONTACTS.SEND_REPORT_REPLY, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ id, reply_message: replyMessage, status })
        });

        const result = await response.json();
        return result;
    } catch (error) {
        console.error('Error sending report reply:', error);
        return { error: error.message };
    }
}

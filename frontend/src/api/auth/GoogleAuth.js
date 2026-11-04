import { API_ROUTES } from '../server/api.js';

export async function googleLogin(idToken, deviceInfo) {
    try {
        const response = await fetch(API_ROUTES.OAUTH.GOOGLE_LOGIN, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                id_token: idToken,
                auth_type: 'google',
                ...deviceInfo
            })
        });

        const data = await response.json();

        if (response.ok) {
            return {
                success: true,
                token: data.token,
                admin: data.admin
            };
        } else {
            return {
                success: false,
                message: data.message || 'Google login failed'
            };
        }
    } catch (error) {
        console.error('Google login error:', error);
        return {
            success: false,
            message: 'Network error during Google login'
        };
    }
}

export async function adviserGoogleLogin(idToken, deviceInfo) {
    try {
        const response = await fetch(API_ROUTES.OAUTH.ADVISER_GOOGLE_LOGIN, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                id_token: idToken,
                auth_type: 'google',
                ...deviceInfo
            })
        });

        const data = await response.json();

        if (response.ok) {
            return {
                success: true,
                token: data.token,
                adviser: data.adviser
            };
        } else {
            return {
                success: false,
                message: data.message || 'Google login failed'
            };
        }
    } catch (error) {
        console.error('Adviser Google login error:', error);
        return {
            success: false,
            message: 'Network error during Google login'
        };
    }
}

export async function studentGoogleLogin(idToken, deviceInfo) {
    try {
        const response = await fetch(API_ROUTES.OAUTH.STUDENT_GOOGLE_LOGIN, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                id_token: idToken,
                auth_type: 'google',
                ...deviceInfo
            })
        });

        const data = await response.json();

        if (response.ok) {
            return {
                success: true,
                token: data.token,
                student: data.student
            };
        } else {
            return {
                success: false,
                message: data.message || 'Google login failed'
            };
        }
    } catch (error) {
        console.error('Student Google login error:', error);
        return {
            success: false,
            message: 'Network error during Google login'
        };
    }
}

export async function loadGoogleOAuth() {
    try {
        const response = await fetch(API_ROUTES.OAUTH.GOOGLE_CONFIG);
        const data = await response.json();

        if (data.client_id && data.enabled) {
            window.GOOGLE_CLIENT_ID = data.client_id;

            const googleScript = document.createElement('script');
            googleScript.src = data.gsi_script_url;
            googleScript.async = true;
            googleScript.defer = true;
            document.head.appendChild(googleScript);
        }
    } catch (error) {
        console.error('Failed to load Google OAuth config:', error);
    }
}

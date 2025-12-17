import axios from 'axios';

const api = axios.create({
    headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
    },
    // CSRF Token is handled automatically by Laravel/Axios defaults usually, but we ensure it here if needed
    withCredentials: true
});

// Interceptor for responses (Error Handling Global)
api.interceptors.response.use(
    (response) => response,
    (error) => {
        const { response } = error;

        if (response) {
            // Handle different error codes
            if (response.status === 401) {
                // Redirect to login or dispatch auth action
                window.location.href = '/login';
            }
            if (response.status === 403) {
                console.error("Access Denied: You don't have permission.");
            }
            if (response.status === 419) {
                // CSRF Token Mismatch
                console.error("Session Expired. Refreshing...");
                window.location.reload();
            }
        }

        return Promise.reject(error);
    }
);

export default api;

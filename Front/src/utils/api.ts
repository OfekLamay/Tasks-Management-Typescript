export const apiFetch = async (endpoint: string, options: RequestInit = {}) => {
    const defaultHeaders = {
        'Content-Type': 'application/json',
    };

    const headers = {
        ...defaultHeaders,
        ...options.headers,
    };

    try {
        const response = await fetch(endpoint, {
            ...options,
            headers,
            credentials: 'include',
        });

        return response;
    } catch (error) {
        console.error(`API Error in ${endpoint}:`, error);
        throw error;
    }
};
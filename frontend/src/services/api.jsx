// src/services/api.jsx
import axios from 'axios';

const API_URL = 'http://localhost:8000';

// Create an Axios instance
const apiClient = axios.create({
  baseURL: API_URL,
});

// Interceptor to add the auth token to every request
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// --- AUTHENTICATION ---

export const login = async (username, password) => {
  // FastAPI's OAuth2PasswordRequestForm expects data in 'application/x-www-form-urlencoded' format.
  // We can create this using URLSearchParams.
  const params = new URLSearchParams();
  params.append('username', username);
  params.append('password', password);

  try {
    const response = await apiClient.post('/api/login', params, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    });
    // The response.data should be { access_token: "...", token_type: "bearer" }
    return response.data;
  } catch (error) {
    console.error("Login service failed:", error);
    throw error;
  }
};

export const register = async (username, password) => {
  return await apiClient.post('/api/register', { username, password });
};

// --- PERSON/CASE MANAGEMENT ---
export const registerPerson = async (formData) => {
  // formData should be a FormData object
  return await apiClient.post('/api/person/register', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
};

export const searchByPhoto = async (formData) => {
  try {
    const response = await apiClient.post('/api/person/search', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });

    // --- THIS IS THE FIX ---
    // Check if the response data is a string. If so, parse it as JSON.
    let data = response.data;
    if (typeof data === 'string') {
      try {
        data = JSON.parse(data);
      } catch (e) {
        console.error("Failed to parse response string as JSON:", e);
        // If parsing fails, throw an error to be caught by the page component
        throw new Error("Response was a string that could not be parsed as JSON.");
      }
    }
    // --- END OF THE FIX ---

    // Now, 'data' is guaranteed to be a JavaScript object.
    return data;
    
  } catch (error) {
    // Re-throw the error so the component can handle it
    console.error("Error in searchByPhoto service:", error);
    throw error;
  }
};

export const getMyCases = async () => {
  try {
    const response = await apiClient.get('/api/person/my-cases');
    return response.data; // Should return { cases: [...] }
  } catch (error) {
    console.error("Error fetching user cases:", error);
    throw error;
  }
};

// Add these inside frontend/src/services/api.jsx

export const markAsFound = async (personId) => {
  return await apiClient.post(`/api/person/${personId}/mark-found`);
};

export const getFoundCases = async () => {
  const response = await apiClient.get('/api/person/found-cases');
  return response.data; // Should return { cases: [...] }
};

// Add this inside frontend/src/services/api.jsx

export const getAllActiveCases = async () => {
  const response = await apiClient.get('/api/person/all-active-cases');
  return response.data; // Should return { cases: [...] }
};

export const getNotifications = async () => {
  const response = await apiClient.get('/api/notifications');
  return response.data;
};

export const markNotificationAsRead = async (notificationId) => {
  return await apiClient.post(`/api/notifications/${notificationId}/read`);
};
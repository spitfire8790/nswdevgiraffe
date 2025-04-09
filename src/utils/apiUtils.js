/**
 * Utility functions for API requests
 */

// Determine if we're in development or production
const isDevelopment = process.env.NODE_ENV === 'development';

// Get the base URL for API requests
const getApiBaseUrl = () => {
  return isDevelopment 
    ? 'http://localhost:5000/api'  // Development proxy server
    : '/api';                      // Production Vercel serverless function
};

/**
 * Makes a proxied API request
 * @param {string} url - The target URL to proxy to
 * @param {Object} options - Request options (method, headers, body)
 * @returns {Promise<Object>} - The API response
 */
export const makeProxyRequest = async (url, options = {}) => {
  const apiUrl = `${getApiBaseUrl()}/proxy`;
  
  try {
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        url,
        method: options.method || 'GET',
        headers: options.headers || {},
        body: options.body || undefined,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`API request failed: ${response.status} - ${errorText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error making proxy request:', error);
    throw error;
  }
};

/**
 * Health check function
 * @returns {Promise<Object>} - The health check response
 */
export const checkApiHealth = async () => {
  try {
    const response = await fetch(`${getApiBaseUrl()}/health`);
    return await response.json();
  } catch (error) {
    console.error('Health check failed:', error);
    return { status: 'error', error: error.message };
  }
}; 
// Cloudflare Worker script with streaming implementation

// Define maximum timeout for fetching from target API (20 seconds)
const FETCH_TIMEOUT_MS = 20000;

// CORS headers for cross-origin requests
const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Accept',
  'Access-Control-Max-Age': '86400', // 24 hours
};

// Listen for incoming fetch events
addEventListener('fetch', event => {
  // Handle OPTIONS requests for CORS preflight
  if (event.request.method === 'OPTIONS') {
    event.respondWith(handleOptions(event.request));
    return;
  }
  
  // Handle the actual request
  event.respondWith(handleRequest(event.request));
});

// Handle CORS preflight OPTIONS requests
function handleOptions(request) {
  return new Response(null, {
    status: 204,
    headers: CORS_HEADERS
  });
}

// Main request handler
async function handleRequest(request) {
  // Only allow POST requests
  if (request.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: {
        'Content-Type': 'application/json',
        ...CORS_HEADERS
      }
    });
  }

  try {
    // Parse the incoming request JSON
    const payload = await request.json();
    const { url, method, headers } = payload;
    
    if (!url) {
      return new Response(JSON.stringify({ error: 'Missing required URL parameter' }), {
        status: 400,
        headers: {
          'Content-Type': 'application/json',
          ...CORS_HEADERS
        }
      });
    }

    // Create a timeout controller for the fetch
    const timeoutController = new AbortController();
    const timeoutId = setTimeout(() => {
      timeoutController.abort();
      console.log(`Request timed out after ${FETCH_TIMEOUT_MS}ms`);
    }, FETCH_TIMEOUT_MS);

    try {
      // Create the request to the target API
      const targetRequest = new Request(url, {
        method: method || 'GET',
        headers: headers || {},
      });
      
      console.log(`Proxying request to: ${url}`);
      console.log(`Page size: ${headers?.PageSize || 'unspecified'}, Page number: ${headers?.PageNumber || 'unspecified'}`);

      // Make the request to the target API with timeout
      const response = await fetch(targetRequest, {
        signal: timeoutController.signal,
        cf: { 
          cacheTtl: 300, // Cache successful responses for 5 minutes
          cacheEverything: true
        }
      });
      
      // Clear the timeout as we got a response
      clearTimeout(timeoutId);
      
      // Check if the response was successful
      if (!response.ok) {
        const errorBody = await response.text();
        console.error(`Target API error: ${response.status} ${response.statusText}`);
        console.error(`Response body (truncated): ${errorBody.substring(0, 200)}`);
        
        return new Response(JSON.stringify({
          error: 'Target API error',
          status: response.status,
          statusText: response.statusText,
          body: errorBody.substring(0, 500) // Limit error body size
        }), {
          status: response.status,
          headers: {
            'Content-Type': 'application/json',
            ...CORS_HEADERS
          }
        });
      }

      // Stream the response back
      const { readable, writable } = new TransformStream();
      
      // Start the piping process as a separate task
      response.body.pipeTo(writable).catch(err => {
        console.error('Error streaming response:', err);
      });
      
      // Return the readable stream immediately
      return new Response(readable, {
        status: response.status,
        statusText: response.statusText,
        headers: {
          'Content-Type': 'application/json',
          ...CORS_HEADERS
        }
      });
    } catch (fetchError) {
      // Clear the timeout if there was an error
      clearTimeout(timeoutId);
      
      if (fetchError.name === 'AbortError') {
        console.error(`Request timed out after ${FETCH_TIMEOUT_MS}ms`);
        return new Response(JSON.stringify({ 
          error: 'Request timed out',
          timeout: FETCH_TIMEOUT_MS
        }), {
          status: 504, // Gateway Timeout
          headers: {
            'Content-Type': 'application/json',
            ...CORS_HEADERS
          }
        });
      }
      
      console.error('Fetch error:', fetchError);
      
      return new Response(JSON.stringify({ 
        error: 'Error fetching data from target API',
        message: fetchError.message
      }), {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          ...CORS_HEADERS
        }
      });
    }
  } catch (error) {
    console.error('Request processing error:', error);
    
    return new Response(JSON.stringify({ 
      error: 'Error processing request',
      message: error.message
    }), {
      status: 400,
      headers: {
        'Content-Type': 'application/json',
        ...CORS_HEADERS
      }
    });
  }
} 
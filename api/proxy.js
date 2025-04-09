import fetch from 'node-fetch';

export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  // Handle preflight OPTIONS request
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { url, method, headers, body } = req.body;
    
    console.log(`Proxying request to: ${url}`);
    
    const response = await fetch(url, {
      method: method || 'GET',
      headers: headers,
      body: body ? JSON.stringify(body) : undefined
    });
    
    if (!response.ok) {
      console.error(`API error: ${response.status} ${response.statusText}`);
      return res.status(response.status).json({
        error: `API responded with status ${response.status}`,
        details: await response.text()
      });
    }
    
    const data = await response.json();
    return res.status(200).json(data);
  } catch (error) {
    console.error('Proxy server error:', error);
    return res.status(500).json({
      error: 'Proxy server error',
      message: error.message
    });
  }
} 
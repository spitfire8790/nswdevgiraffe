import express from 'express';
import cors from 'cors';
import fetch from 'node-fetch';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';
import * as dotenv from 'dotenv';
import https from 'https';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables from .env file
dotenv.config();

const app = express();
const PORT = process.env.PROXY_PORT || 5000;

app.use(cors());
app.use(express.json());

// Proxy endpoint for NSW Planning Portal API
app.post('/api/proxy', async (req, res) => {
  try {
    const { url, method, headers, body } = req.body;
    
    console.log(`Proxying request to: ${url}`);
    console.log('Headers:', headers);
    
    // Create HTTPS agent that ignores SSL certificate errors
    const httpsAgent = new https.Agent({
      rejectUnauthorized: false // This bypasses SSL certificate validation
    });
    
    const response = await fetch(url, {
      method: method || 'GET',
      headers: headers,
      body: body ? JSON.stringify(body) : undefined,
      agent: url.startsWith('https') ? httpsAgent : undefined // Only use for HTTPS requests
    });
    
    if (!response.ok) {
      console.error(`API error: ${response.status} ${response.statusText}`);
      return res.status(response.status).send({
        error: `API responded with status ${response.status}`,
        details: await response.text()
      });
    }
    
    const data = await response.json();
    res.json(data);
  } catch (error) {
    console.error('Proxy server error:', error);
    res.status(500).send({
      error: 'Proxy server error',
      message: error.message
    });
  }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.status(200).send({ status: 'OK', timestamp: new Date() });
});

app.listen(PORT, () => {
  console.log(`Proxy server running on port ${PORT}`);
});

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('Shutting down proxy server...');
  process.exit(0);
});

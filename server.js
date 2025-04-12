import express from 'express';
import cors from 'cors';
import fetch from 'node-fetch';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';
import * as dotenv from 'dotenv';
import https from 'https';
import { GoogleGenAI } from '@google/genai';

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

// Gemini API initialization endpoint
app.get('/api/gemini/initialize', (req, res) => {
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    
    if (!apiKey) {
      return res.status(500).json({ 
        success: false, 
        message: 'GEMINI_API_KEY is not defined in environment variables' 
      });
    }
    
    // Just check if we can initialize the client
    const genAI = new GoogleGenAI({ apiKey });
    
    res.status(200).json({
      success: true,
      message: 'Gemini API client initialized successfully'
    });
  } catch (error) {
    console.error('Error initializing Gemini API:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to initialize Gemini API client',
      error: error.message
    });
  }
});

// Gemini API generate endpoint
app.post('/api/gemini/generate', async (req, res) => {
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    
    if (!apiKey) {
      return res.status(500).json({ 
        success: false, 
        message: 'GEMINI_API_KEY is not defined in environment variables' 
      });
    }
    
    const { prompt, history = [] } = req.body;
    
    if (!prompt) {
      return res.status(400).json({
        success: false,
        message: 'Prompt is required'
      });
    }
    
    // Initialize the Gemini API client
    const genAI = new GoogleGenAI({ apiKey });
    
    // Format history for the new API
    const formattedHistory = history.map(msg => ({
      role: msg.role,
      parts: [{ text: msg.parts[0].text }]
    }));
    
    // Use the chat functionality with the new API
    if (history && history.length > 0) {
      // If we have history, use it
      try {
        const result = await genAI.models.generateContent({
          model: "gemini-2.0-flash",
          contents: prompt
        });
        
        console.log('API Response:', JSON.stringify(result).substring(0, 200));
        
        // Check different potential response formats
        let text;
        if (result && result.response && typeof result.response.text === 'function') {
          text = result.response.text();
        } else if (result && result.text && typeof result.text === 'function') {
          text = result.text();
        } else if (result && result.candidates && result.candidates[0]) {
          text = result.candidates[0].content.parts[0].text;
        } else if (typeof result === 'string') {
          text = result;
        } else {
          console.log('Unexpected response format:', result);
          throw new Error('Unexpected response format from Gemini API');
        }
        
        res.status(200).json({
          success: true,
          text: text
        });
      } catch (error) {
        console.error('History chat error:', error);
        throw error;
      }
    } else {
      // If no history, use a simple generateContent call
      try {
        const result = await genAI.models.generateContent({
          model: "gemini-2.0-flash",
          contents: prompt
        });
        
        console.log('API Response:', JSON.stringify(result).substring(0, 200));
        
        // Check different potential response formats
        let text;
        if (result && result.response && typeof result.response.text === 'function') {
          text = result.response.text();
        } else if (result && result.text && typeof result.text === 'function') {
          text = result.text();
        } else if (result && result.candidates && result.candidates[0]) {
          text = result.candidates[0].content.parts[0].text;
        } else if (typeof result === 'string') {
          text = result;
        } else {
          console.log('Unexpected response format:', result);
          throw new Error('Unexpected response format from Gemini API');
        }
        
        res.status(200).json({
          success: true,
          text: text
        });
      } catch (error) {
        console.error('Simple generate error:', error);
        throw error;
      }
    }
  } catch (error) {
    console.error('Error generating response from Gemini API:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate response',
      error: error.message
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

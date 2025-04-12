import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';

dotenv.config();

// Get API key from environment variable
const apiKey = process.env.GEMINI_API_KEY;

if (!apiKey) {
  console.error('GEMINI_API_KEY is not defined in environment variables');
}

/**
 * Initialize the Google Generative AI client
 */
export const initializeGemini = () => {
  try {
    const genAI = new GoogleGenAI({ apiKey });
    return genAI;
  } catch (error) {
    console.error('Error initializing Gemini API:', error);
    throw error;
  }
};

/**
 * Handler for /api/gemini/initialize
 */
export const handleInitialize = async (req, res) => {
  try {
    // Just check if we can initialize the client
    initializeGemini();
    
    res.status(200).json({
      success: true,
      message: 'Gemini API client initialized successfully',
    });
  } catch (error) {
    console.error('Error initializing Gemini API:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to initialize Gemini API client',
      error: error.message
    });
  }
};

/**
 * Handler for /api/gemini/generate
 */
export const handleGenerate = async (req, res) => {
  try {
    const { prompt, history = [] } = req.body;
    
    if (!prompt) {
      return res.status(400).json({
        success: false,
        message: 'Prompt is required'
      });
    }
    
    // Initialize the Gemini API client
    const genAI = initializeGemini();
    
    // Log detailed information about the prompt
    console.log('=== GEMINI API REQUEST ===');
    console.log('Prompt preview:', prompt.substring(0, 150) + '...');
    
    // Extract and log key parts of the prompt for debugging
    const addressMatch = prompt.match(/Property:\s*([^\n•]+)/);
    const locationMatch = prompt.match(/Location:\s*([^\n•]+)/);
    const developmentMatch = prompt.match(/Development:\s*([^\n•]+)/);
    
    console.log('Address:', addressMatch ? addressMatch[1].trim() : 'Not found in prompt');
    console.log('Location:', locationMatch ? locationMatch[1].trim() : 'Not found in prompt');
    console.log('Development:', developmentMatch ? developmentMatch[1].trim() : 'Not found in prompt');
    console.log('========================');
    
    // Create model and generate content using the models API
    const result = await genAI.models.generateContent({
      model: "gemini-2.0-flash",
      contents: prompt,
      generationConfig: {
        temperature: 0.7,
        topP: 0.8,
        topK: 40,
        maxOutputTokens: 8192
      },
      tools: [{
        googleSearch: {
          enable: true
        }
      }]
    });
    
    const text = result.response.text();
    
    // Log a preview of the response
    console.log('=== GEMINI API RESPONSE ===');
    console.log('Response preview:', text.substring(0, 150) + '...');
    console.log('===========================');
    
    res.status(200).json({
      success: true,
      text: text
    });
  } catch (error) {
    console.error('Error generating response from Gemini API:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate response',
      error: error.message
    });
  }
};

/**
 * Main handler for all Gemini API routes
 */
export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  // Handle OPTIONS request (preflight)
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  // Route handlers
  const { pathname } = new URL(req.url, `http://${req.headers.host}`);
  
  if (pathname.endsWith('/initialize')) {
    if (req.method === 'GET') {
      return handleInitialize(req, res);
    }
  } else if (pathname.endsWith('/generate')) {
    if (req.method === 'POST') {
      return handleGenerate(req, res);
    }
  }
  
  // If no route matches
  return res.status(404).json({
    success: false,
    message: 'API endpoint not found'
  });
} 
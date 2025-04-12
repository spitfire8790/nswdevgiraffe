import { GoogleGenAI } from '@google/genai';

/**
 * Service to handle interactions with Google's Gemini API
 */
class GeminiService {
  constructor() {
    this.baseHistory = [];
    this.conversationContext = null;
  }

  /**
   * Initialize the Gemini API client
   * We use a proxy to protect the API key
   */
  async initialize() {
    try {
      // Make a call to the backend to get a configured client
      // This approach protects the API key
      const response = await fetch('/api/gemini/initialize', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to initialize Gemini API');
      }

      this.isInitialized = true;
      return true;
    } catch (error) {
      console.error('Error initializing Gemini API:', error);
      throw error;
    }
  }

  /**
   * Generate a response from the Gemini API based on DA data and user query
   * @param {string} prompt - The formatted prompt to send to the API
   * @param {array} messageHistory - Previous messages in the conversation 
   * @returns {object} - The API response with generated text
   */
  async generateResponse(prompt, messageHistory = []) {
    if (!this.isInitialized) {
      await this.initialize();
    }

    try {
      // Log the prompt for debugging
      console.log('Sending prompt to Gemini API:', prompt.substring(0, 150) + '...');
      
      // Combine message history with current query
      const history = [...messageHistory];
      
      // Send the request to our backend proxy
      const response = await fetch('/api/gemini/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt,
          history: history,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('API Error Response:', errorText);
        throw new Error(`Failed to generate response from Gemini API: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      
      // Log a preview of the response for debugging
      if (data.text) {
        console.log('Received response from Gemini API:', data.text.substring(0, 150) + '...');
      }
      
      return data;
    } catch (error) {
      console.error('Error generating response from Gemini API:', error);
      throw error;
    }
  }

  /**
   * Create a structured prompt with DA data to send to Gemini API
   * @param {string} userQuery - The user's query
   * @param {object} daData - Development application data
   * @returns {string} - A structured prompt
   */
  createStructuredPrompt(userQuery, daData) {
    if (!daData) {
      return userQuery;
    }

    // Extract relevant information from DA data
    const {
      PropertyAddress,
      LotNumber,
      SectionNumber,
      DPNumber,
      LGA,
      Suburb,
      Postcode,
      DevelopmentType,
      ApplicationStatus
    } = daData;

    // Generate address variations
    const addressVariations = this.generateAddressVariations(PropertyAddress, Suburb, Postcode);
    
    // Generate lot reference variations
    const lotRefs = this.generateLotReferences(LotNumber, SectionNumber, DPNumber);

    // Create a structured prompt
    const structuredPrompt = `
      User Query: ${userQuery}
      
      Property Information:
      - Address: ${PropertyAddress}
      - Address Variations: ${addressVariations.join(', ')}
      - Lot References: ${lotRefs.join(', ')}
      - LGA: ${LGA}
      - Suburb: ${Suburb}
      - Postcode: ${Postcode}
      - Development Type: ${DevelopmentType}
      - Application Status: ${ApplicationStatus}
      
      Search for any additional information related to this development application or property. 
      Identify any positive aspects or concerns. Categorize information into: 
      Environmental, Zoning & Planning, Community Feedback, Infrastructure & Services, or Historical Significance.
      
      Provide a summary with reference links and indicate sentiment (positive, neutral, negative) for each finding.
    `;

    return structuredPrompt;
  }

  /**
   * Generate variations of the property address for more comprehensive search
   * @param {string} address - The property address
   * @param {string} suburb - The suburb
   * @param {string} postcode - The postcode
   * @returns {array} - Array of address variations
   */
  generateAddressVariations(address, suburb, postcode) {
    if (!address) return [];
    
    const variations = [];

    // Original address
    variations.push(address);

    // Without postcode
    if (postcode && address.includes(postcode)) {
      variations.push(address.replace(postcode, '').trim());
    }

    // With different capitalizations
    variations.push(address.toUpperCase());
    variations.push(address.toLowerCase());

    // Without suburb if included in address
    if (suburb && address.includes(suburb)) {
      variations.push(address.replace(suburb, '').trim());
    }

    // Only street number and name
    const streetMatch = address.match(/^([0-9]+[A-Za-z]?\s+[^,]+)/);
    if (streetMatch) {
      variations.push(streetMatch[0]);
    }

    return [...new Set(variations)]; // Remove duplicates
  }

  /**
   * Generate lot references for property search
   * @param {string} lotNumber - The lot number
   * @param {string} sectionNumber - The section number
   * @param {string} dpNumber - The DP number
   * @returns {array} - Array of lot reference strings
   */
  generateLotReferences(lotNumber, sectionNumber, dpNumber) {
    const references = [];

    if (lotNumber && dpNumber) {
      // Standard format: Lot X DP YYYY
      references.push(`Lot ${lotNumber} DP ${dpNumber}`);
      
      // Alternative format with slash
      references.push(`Lot ${lotNumber}/${dpNumber}`);
      
      // With section if available
      if (sectionNumber) {
        references.push(`Lot ${lotNumber} Sec ${sectionNumber} DP ${dpNumber}`);
      }
    }

    return references;
  }
}

// Create a singleton instance
const geminiService = new GeminiService();
export default geminiService; 
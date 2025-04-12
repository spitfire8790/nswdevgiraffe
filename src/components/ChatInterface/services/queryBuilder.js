/**
 * Service to build structured queries for the Gemini API based on development application data
 */
class QueryBuilder {
  /**
   * Build a structured query for searching additional information
   * @param {string} userQuery - The user's input query
   * @param {object} daData - Development application data
   * @returns {string} - A structured query for the Gemini API
   */
  buildQuery(userQuery, daData) {
    if (!daData) {
      return userQuery;
    }

    // Extract location information from the Location array
    const location = daData.Location && daData.Location.length > 0 ? daData.Location[0] : null;
    
    // Extract property address
    const propertyAddress = location ? (
      location.FullAddress || 
      `${location.StreetNumber1 || ''} ${location.StreetName || ''} ${location.StreetType || ''}`
    ).trim() : null;
    
    // Extract suburb and postcode
    const suburb = location ? location.Suburb : null;
    const postcode = location ? location.Postcode : null;
    
    // Extract lot information
    let lotNumber = null;
    let dpNumber = null;
    
    if (location && location.Lot && location.Lot.length > 0) {
      lotNumber = location.Lot[0].Lot;
      dpNumber = location.Lot[0].Plan;
    }
    
    // Extract development type
    let developmentType = "Unknown";
    if (daData.DevelopmentType && Array.isArray(daData.DevelopmentType) && daData.DevelopmentType.length > 0) {
      developmentType = daData.DevelopmentType.map(dt => dt.DevelopmentType).join(", ");
    }
    
    // Generate address variations
    const addressVariations = this.generateAddressVariations(propertyAddress, suburb, postcode);
    
    // Generate lot reference variations
    const lotRefs = this.generateLotReferences(lotNumber, null, dpNumber);

    // Create search terms array
    const searchTerms = [
      propertyAddress,
      ...addressVariations,
      ...lotRefs,
      suburb,
      suburb && postcode ? `${suburb} ${postcode}` : null,
      daData.LGA ? `${daData.LGA} Council` : null,
      developmentType
    ].filter(Boolean); // Remove null/undefined values

    // Remove duplicates
    const uniqueSearchTerms = [...new Set(searchTerms)];

    // Create the structured query
    let structuredQuery = userQuery || "Find public information about this property";

    // Add search context to help Gemini
    structuredQuery += `\n\nSearch Context:
• Property: ${propertyAddress || "Unknown address"}
• Search Terms: ${uniqueSearchTerms.join(", ")}
• Location: ${suburb || ""} ${postcode || ""}, ${daData.LGA || ""}
• Development: ${developmentType || "Unknown type"}
• Status: ${daData.ApplicationStatus || "Unknown status"}
• Application Type: ${daData.ApplicationType || ""}
• Description: ${daData.Description || ""}
• Value: ${daData.CostOfDevelopment ? `$${daData.CostOfDevelopment.toLocaleString()}` : "Unknown"}
• New Dwellings: ${daData.NumberOfNewDwellings || "0"}
• Date: ${daData.LodgementDate || ""}

Please search for public information about this property and development application. Focus on:
1. Environmental factors (flooding, bushfire, contamination)
2. Zoning and planning concerns or advantages
3. Community feedback (objections, support)
4. Infrastructure and services
5. Historical significance

For each finding, indicate the sentiment (positive/neutral/negative) and categorize the information. Provide reference links where available.`;

    return structuredQuery;
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

  /**
   * Parse response to identify reference links
   * @param {string} response - The API response text
   * @returns {array} - Array of reference links
   */
  extractReferenceLinks(response) {
    if (!response) return [];
    
    // Extract URLs using regex
    const urlRegex = /https?:\/\/[^\s)]+/g;
    const extractedUrls = response.match(urlRegex) || [];
    
    // Remove duplicate URLs
    const uniqueUrls = [...new Set(extractedUrls)];
    
    // Format each URL with its source name if possible
    return uniqueUrls.map(url => {
      // Try to extract a domain/source name
      let sourceName = '';
      try {
        const urlObj = new URL(url);
        sourceName = urlObj.hostname.replace('www.', '');
      } catch (e) {
        // Use raw URL if parsing fails
        sourceName = url.split('/')[2] || '';
      }
      
      return {
        url,
        sourceName
      };
    });
  }
}

// Create a singleton instance
const queryBuilder = new QueryBuilder();
export default queryBuilder; 
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

    // Create council document references if available
    let councilDocumentURL = "";
    if (daData.LGA === "RYDE" && daData.CouncilReference) {
      councilDocumentURL = `https://cmweb.ryde.nsw.gov.au/KapishWebGrid/default.aspx?s=DATracker&containerex=${daData.CouncilReference}/0010`;
    }

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
${councilDocumentURL ? `• Council Documents URL: ${councilDocumentURL}` : ""}
• CouncilReference: ${daData.CouncilReference || "Unknown"}
• LGA: ${daData.LGA || "Unknown"}

You have access to web browsing capabilities. Use them to search for detailed information about this property and development application. Please:

1. Perform Google searches using the property address and relevant search terms
2. If a Council Documents URL is provided, visit it to access official DA documents 
3. Research specific environmental factors relevant to this property (flooding, bushfire, contamination risks)
4. Find zoning information and planning regulations that apply to this property
5. Look for community feedback, objections, or support for this development
6. Research infrastructure and services information relevant to this location
7. Check for any historical significance of the property or area

Provide specific, factual information rather than general statements. For each finding:
- Indicate the sentiment (positive/neutral/negative)
- Categorize the information (Environmental, Planning, Community, Infrastructure, Historical)
- Include reference links to your sources
- If you use the Council Documents URL, mention which specific documents you accessed

DO NOT state that you cannot browse the web or access external documents. Use your web browsing capabilities to find the information requested.`;

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
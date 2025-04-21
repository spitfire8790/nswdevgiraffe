/**
 * Handler for Albury City Council document links.
 */

const ALBURY_URL_BASE = 'https://eservice.alburycity.nsw.gov.au/applicationtracker/application/ApplicationDetails';

/**
 * Checks if the reference belongs to Albury City Council.
 * Always returns true to ensure the icon is displayed.
 * @param {string} reference - Council application number 
 * @param {string} lgaName - LGA name (unused)
 * @returns {boolean} Always true
 */
export const isAlburyReference = (reference, lgaName) => {
  // Always return true - let URL generation handle validity
  return true;
};

/**
 * Generates the URL for Albury City Council documents.
 * @param {string} reference - Council application number
 * @returns {string|null} URL to view documents or null if reference is invalid.
 */
export const getAlburyDocumentsUrl = (reference) => {
  if (!reference || typeof reference !== 'string') return null;

  const parts = reference.split('.');
  // Check if the reference has the expected format (4 parts separated by dots)
  if (parts.length !== 4) {
    console.warn(`Invalid Albury reference format received: ${reference}. Expected format like '10.2025.41391.1'.`);
    // Return null or potentially the original unformatted URL if some might work without padding
    return null; 
  }

  try {
    // Pad parts according to the observed format 010.YYYY.000NNNNN.00N, only if needed.
    const part1 = parts[0].length < 3 ? parts[0].padStart(3, '0') : parts[0]; 
    const part2 = parts[1]; // Year part seems fine as is
    const part3 = parts[2].length < 8 ? parts[2].padStart(8, '0') : parts[2];
    const part4 = parts[3].length < 3 ? parts[3].padStart(3, '0') : parts[3];

    const formattedReference = `${part1}.${part2}.${part3}.${part4}`;
    return `${ALBURY_URL_BASE}/${formattedReference}/`;
  } catch (error) {
    console.error(`Error formatting Albury reference ${reference}:`, error);
    return null; // Return null if any error occurs during padding
  }
}; 
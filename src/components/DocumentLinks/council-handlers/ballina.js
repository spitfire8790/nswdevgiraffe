/**
 * Handler for Ballina Shire Council document links.
 */

const BALLINA_URL_BASE = 'https://da.ballina.nsw.gov.au/application/ApplicationDetails';

/**
 * Generates the URL for Ballina Shire Council documents.
 * @param {string} reference - Council application number (format: YYYY/NNN/N or similar)
 * @returns {string|null} URL to view documents or null if reference is invalid.
 */
export const getBallinaDocumentsUrl = (reference) => {
  if (!reference || typeof reference !== 'string') return null;

  // Handle different possible formats
  // Could be "2022/721/1" or "2022.721.1" or similar
  let parts;
  if (reference.includes('/')) {
    parts = reference.split('/');
  } else if (reference.includes('.')) {
    parts = reference.split('.');
  } else {
    console.warn(`Invalid Ballina reference format received: ${reference}. Expected format like 'YYYY/NNN/N'.`);
    return null;
  }

  // Check if the reference has the expected format (3 parts)
  if (parts.length !== 3) {
    console.warn(`Invalid Ballina reference format received: ${reference}. Expected format like 'YYYY/NNN/N'.`);
    return null;
  }

  try {
    // Format: 010.YYYY.00000NNN.00N
    const part1 = '010'; // Fixed value for Ballina
    const part2 = parts[0]; // Year
    const part3 = parts[1].padStart(8, '0'); // Application number padded to 8 digits
    const part4 = parts[2].padStart(3, '0'); // Suffix padded to 3 digits

    const formattedReference = `${part1}.${part2}.${part3}.${part4}`;
    return `${BALLINA_URL_BASE}/${formattedReference}/`;
  } catch (error) {
    console.error(`Error formatting Ballina reference ${reference}:`, error);
    return null; // Return null if any error occurs during formatting
  }
}; 
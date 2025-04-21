/**
 * Handler for Ryde Council document links
 * Formats the council reference number into a valid URL
 */

// Detect if a council reference number is from Ryde council
export const isRydeReference = (reference, lgaName) => {
  // Always return true to ensure the icon is displayed
  return true;
};

/**
 * Formats a Ryde council reference number into the format required for the URL
 * Example: LDA2021/0138 -> LDA2021%2f00138%2f0010
 * Note: The trailing /0010 part seems to be required but may vary
 */
export const formatRydeReference = (reference) => {
  if (!reference) return null;
  
  // Extract the base parts (e.g., LDA2021 and 0138)
  const parts = reference.split('/');
  if (parts.length !== 2) return reference;
  
  const prefix = parts[0]; // e.g., LDA2021
  let number = parts[1];   // e.g., 0138
  
  // Format the number with leading zeros if needed (assuming 5 digits total)
  if (number.length < 5) {
    number = number.padStart(5, '0');
  }
  
  // Format as prefix/number/0010 - the last part appears to be standard for Ryde
  return `${prefix}%2f${number}%2f0010`;
};

/**
 * Creates a URL to view Ryde council documents
 * @param {string} reference - Council application number
 * @returns {string} URL to view documents
 */
export const getRydeDocumentsUrl = (reference) => {
  if (!reference) return null;
  
  const formattedRef = formatRydeReference(reference);
  
  // Construct the URL without instanceid
  // Using a URL that doesn't require an instanceid
  return `https://cmweb.ryde.nsw.gov.au/KapishWebGrid/default.aspx?s=DATracker&containerex=${formattedRef}`;
}; 
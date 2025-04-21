/**
 * Index file for council-specific document link handlers
 * Add new council handlers here and in the getDocumentsUrl function
 */

import { getRydeDocumentsUrl } from './ryde';
import { getAlburyDocumentsUrl } from './albury';
import { getBallinaDocumentsUrl } from './ballina';
import { lgaMapping } from '../../../utils/councilLgaMapping';

/**
 * Determines which council handler to use based on the selected LGA name.
 * @param {string} reference - Council application number
 * @param {string} councilName - Council name (value from API/dropdown)
 * @returns {string|null} URL to view documents or null if no handler available
 */
export const getDocumentsUrl = (reference, councilName) => {
  if (!reference || !councilName) return null;
  const lgaCode = lgaMapping[councilName];
  if (!lgaCode) return null;
  switch (lgaCode) {
    case 'ALBURY CITY':
      return getAlburyDocumentsUrl(reference);
    case 'RYDE':
      return getRydeDocumentsUrl(reference);
    case 'BALLINA':
      return getBallinaDocumentsUrl(reference);
    default:
      return null;
  }
};

// Export URL generators for direct use if needed
export {
  getRydeDocumentsUrl,
  getAlburyDocumentsUrl,
  getBallinaDocumentsUrl
}; 
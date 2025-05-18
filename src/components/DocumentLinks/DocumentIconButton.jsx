import React from 'react';
import { FileText } from 'lucide-react';
import { getDocumentsUrl } from './council-handlers';
import { lgaMapping } from '../../utils/councilLgaMapping';

/**
 * Document icon button that opens council documents in a new tab
 * or displays a modal with document links
 */
const DocumentIconButton = ({ reference, lgaName, onShowModal }) => {
  // Only show the document icon if we have a reference and a handler is available for this council
  if (!reference || !lgaName) return null;

  // Check if we have a handler for this council by trying to get a URL
  const hasHandler = !!getDocumentsUrl(reference, lgaName);
  if (!hasHandler) return null;

  const handleClick = (e) => {
    // Stop event propagation to prevent parent click handlers from firing
    e.stopPropagation();

    // Get the documents URL
    const documentsUrl = getDocumentsUrl(reference, lgaName);
    if (!documentsUrl) {
      console.warn(`No documents URL for reference ${reference} and LGA ${lgaName}`);
      return;
    }

    // Check if it's Albury
    const lgaCode = lgaMapping[lgaName];
    if (lgaCode === 'ALBURY CITY' || lgaCode === 'BALLINA') {
      // For Albury and Ballina, open directly in a new tab
      window.open(documentsUrl, '_blank', 'noopener,noreferrer');
    } else if (onShowModal) {
      // For other councils, show the modal
      onShowModal(documentsUrl, reference);
    }
  };

  return (
    <button
      onClick={handleClick}
      className="text-blue-600 hover:text-blue-800 transition-colors focus:outline-none"
      title="View Council Documents"
    >
      <FileText size={16} />
    </button>
  );
};

export default DocumentIconButton; 
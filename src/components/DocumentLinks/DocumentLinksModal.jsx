import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';

/**
 * Modal component to display council document links
 * Uses an iframe to load the council's document page
 */
const DocumentLinksModal = ({ isOpen, onClose, documentUrl, referenceNumber }) => {
  const [loading, setLoading] = useState(true);

  // Handle escape key to close modal
  useEffect(() => {
    const handleEscKey = (event) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscKey);
    }

    return () => {
      document.removeEventListener('keydown', handleEscKey);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;
  console.log('DocumentLinksModal opening with URL:', documentUrl);

  const handleIframeLoad = () => {
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-[60%] flex flex-col h-[80vh] relative">
        {/* Modal header */}
        <div className="flex justify-between items-center p-4 border-b">
          <h2 className="text-lg font-semibold">Council Documents - {referenceNumber}</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 focus:outline-none"
            aria-label="Close"
          >
            <X size={20} />
          </button>
        </div>

        {/* Loading indicator */}
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-75 z-10">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        )}

        {/* Modal content - iframe to load council website */}
        <div className="flex-1 overflow-hidden p-4">
          <iframe
            src={documentUrl}
            title="Council Documents"
            className="w-full h-full border-0"
            onLoad={handleIframeLoad}
            sandbox="allow-same-origin allow-scripts allow-popups allow-forms allow-popups-to-escape-sandbox allow-downloads"
          />
        </div>

        {/* Modal footer */}
        <div className="p-4 border-t flex justify-between items-center">
          <p className="text-sm text-gray-500">
            Document viewer for {referenceNumber}
          </p>
          <a
            href={documentUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 hover:text-blue-800 text-sm"
          >
            Open in new tab
          </a>
        </div>
      </div>
    </div>
  );
};

export default DocumentLinksModal; 
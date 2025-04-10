import React from 'react';
import { FileDown, Layers } from 'lucide-react';
import { track } from '@vercel/analytics';

const ActionButtons = ({ 
  handleCreateGeoJSONLayer, 
  handleGenerateCSV, 
  isGeneratingLayer,
  developmentData, 
  processedFeatures, 
  totalFeatures,
  hasLoadedData
}) => {
  if (!hasLoadedData) return null;
  
  // Wrapped handlers to track button clicks
  const handleCreateLayerWithTracking = () => {
    track('Create_Layer', {
      recordCount: developmentData.length,
      timestamp: new Date().toISOString()
    });
    handleCreateGeoJSONLayer();
  };
  
  const handleDownloadCSVWithTracking = () => {
    track('Download_CSV', {
      recordCount: developmentData.length,
      timestamp: new Date().toISOString()
    });
    handleGenerateCSV();
  };
  
  return (
    <div className="flex items-center gap-2">
      <button
        onClick={handleCreateLayerWithTracking}
        disabled={isGeneratingLayer || !developmentData.length}
        className={`flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium 
          ${isGeneratingLayer || !developmentData.length 
            ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
            : 'bg-indigo-600 text-white hover:bg-indigo-700'}`}
      >
        {isGeneratingLayer ? (
          <>
            <div className="animate-spin h-3 w-3 border-2 border-white border-t-transparent rounded-full" />
            {totalFeatures > 0 && (
              <span className="text-xs">
                {processedFeatures}/{totalFeatures}
              </span>
            )}
          </>
        ) : (
          <>
            <Layers size={14} />
            <span>Create Layer</span>
          </>
        )}
      </button>
      
      <button
        onClick={handleDownloadCSVWithTracking}
        disabled={!developmentData.length}
        className={`flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium 
          ${!developmentData.length 
            ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
            : 'bg-green-600 text-white hover:bg-green-700'}`}
      >
        <FileDown size={14} />
        <span>Download CSV</span>
      </button>
    </div>
  );
};

export default ActionButtons; 
import React from 'react';
import { FileDown, Layers, MessageSquare } from 'lucide-react';

const ActionButtons = ({ 
  handleCreateGeoJSONLayer, 
  handleGenerateCSV, 
  toggleChat,
  isChatOpen,
  isGeneratingLayer,
  developmentData, 
  processedFeatures, 
  totalFeatures,
  hasLoadedData,
  selectedDA
}) => {
  if (!hasLoadedData) return null;
  
  return (
    <div className="flex items-center gap-2">
      <button
        onClick={handleCreateGeoJSONLayer}
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
        onClick={handleGenerateCSV}
        disabled={!developmentData.length}
        className={`flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium 
          ${!developmentData.length 
            ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
            : 'bg-green-600 text-white hover:bg-green-700'}`}
      >
        <FileDown size={14} />
        <span>Download CSV</span>
      </button>
      
      {/* AI Chat button */}
      <button
        onClick={toggleChat}
        disabled={!developmentData.length || !selectedDA}
        className={`flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium 
          ${!developmentData.length || !selectedDA
            ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
            : isChatOpen
              ? 'bg-purple-700 text-white hover:bg-purple-800' 
              : 'bg-purple-600 text-white hover:bg-purple-700'}`}
        title={!selectedDA ? "Select a development application first" : "Ask AI about this development application"}
      >
        <MessageSquare size={14} />
        <span>{isChatOpen ? 'Close Chat' : 'Ask AI'}</span>
      </button>
    </div>
  );
};

export default ActionButtons; 
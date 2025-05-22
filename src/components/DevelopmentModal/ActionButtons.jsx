import React from 'react';
import { FileDown, Layers, MapPin, FileJson } from 'lucide-react';
import AddParcelLayerButton from './AddParcelLayerButton';

/**
 * ActionButtons renders the main action buttons for the DA modal, including Create Layer, Download CSV/JSON, and Add Parcel Layer.
 * @param {Object} props
 * @param {function} props.handleCreateGeoJSONLayer - Handler for creating the DA layer
 * @param {function} props.handleGenerateCSV - Handler for CSV download
 * @param {function} props.handleGenerateJSON - Handler for JSON download
 * @param {boolean} props.isGeneratingLayer - Loading state for Create Layer
 * @param {Array} props.developmentData - DA data for the layer
 * @param {number} props.processedFeatures - Progress for Create Layer
 * @param {number} props.totalFeatures - Progress for Create Layer
 * @param {boolean} props.hasLoadedData - Whether data is loaded
 * @param {Object} props.parcelLayerProps - Props for AddParcelLayerButton (see AddParcelLayerButton)
 * @param {Object} props.parcelBatchProgress - Progress for parcel layer batch completion
 */
const ActionButtons = ({ 
  handleCreateGeoJSONLayer, 
  handleGenerateCSV, 
  handleGenerateJSON,
  isGeneratingLayer,
  developmentData, 
  processedFeatures, 
  totalFeatures,
  hasLoadedData,
  parcelLayerProps,
  parcelBatchProgress
}) => {
  if (!hasLoadedData) return null;
  
  return (
    <div className="flex flex-col items-start gap-2">
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
        {/* Add Parcel Layer Button */}
        <AddParcelLayerButton {...parcelLayerProps} />
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

        <button
          onClick={handleGenerateJSON}
          disabled={!developmentData.length}
          className={`flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium 
            ${!developmentData.length 
              ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
              : 'bg-blue-600 text-white hover:bg-blue-700'}`}
        >
          <FileDown size={14} />
          <span>Download JSON</span>
        </button>
      </div>
      {/* Parcel Layer Progress Bar */}
      {parcelBatchProgress && parcelBatchProgress.total > 0 && (
        <div className="w-full mt-1">
          <div className="flex items-center gap-2 text-xs text-gray-700">
            <span>Parcel Layer: Batch {parcelBatchProgress.current} of {parcelBatchProgress.total}</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
            <div
              className="bg-blue-500 h-2 rounded-full"
              style={{
                width: parcelBatchProgress.total
                  ? `${(parcelBatchProgress.current / parcelBatchProgress.total) * 100}%`
                  : '0%',
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default ActionButtons; 
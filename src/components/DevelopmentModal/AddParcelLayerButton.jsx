import React, { useState } from 'react';
import ReactDOM from 'react-dom';
import { createParcelLayer } from './parcelLayerUtils';
import { Layers, Settings } from 'lucide-react';
import Tippy from '@tippyjs/react';
import 'tippy.js/dist/tippy.css';
import 'tippy.js/animations/shift-away.css';
import { developmentCategories } from './developmentTypes';

// Custom tooltip style
const tooltipClass = 'custom-tippy-parcel';

// Add custom tooltip styles
const style = document.createElement('style');
style.innerHTML = `
.custom-tippy-parcel[data-theme~='light'] {
  font-family: 'Segoe UI', 'Arial', sans-serif;
  font-size: 0.85rem;
  border-radius: 10px !important;
  padding: 14px 18px !important;
  background: #fff !important;
  color: #222 !important;
  box-shadow: 0 4px 16px rgba(60,60,90,0.13), 0 1.5px 4px rgba(0,0,0,0.07);
  line-height: 1.6;
  letter-spacing: 0.01em;
  border: 2.5px solid #2563eb !important; /* Blue border, slightly thicker for clarity */
  max-width: 350px !important;
  word-break: break-word;
  white-space: pre-line;
  overflow-wrap: break-word;
  z-index: 2147483647 !important; /* Ensure tooltip is above all other UI, including LGA selector */
}

/* Also boost z-index for tippy-box in case theme class is not enough */
.tippy-box {
  z-index: 2147483647 !important;
}
`;
if (typeof window !== 'undefined' && !document.getElementById('custom-tippy-parcel-style')) {
  style.id = 'custom-tippy-parcel-style';
  document.head.appendChild(style);
}

function getInitialHeights() {
  if (typeof window !== 'undefined') {
    const stored = localStorage.getItem('floorHeightsByCategory');
    if (stored) return JSON.parse(stored);
  }
  // Default: 3 for all
  return Object.fromEntries(Object.keys(developmentCategories).map(cat => [cat, 3]));
}

function saveHeightsToStorage(heights) {
  if (typeof window !== 'undefined') {
    localStorage.setItem('floorHeightsByCategory', JSON.stringify(heights));
  }
}

function FloorHeightModal({ isOpen, onClose, heights, setHeights }) {
  if (!isOpen) return null;
  // Sort categories alphabetically
  const sortedCategories = Object.keys(developmentCategories).sort((a, b) => a.localeCompare(b));
  const modalContent = (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black bg-opacity-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-lg flex flex-col max-h-[90vh] relative z-[9999]">
        <div className="flex justify-between items-center p-4 border-b">
          <h2 className="text-lg font-semibold">Configure Floor to Floor Heights</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 focus:outline-none"
            aria-label="Close"
          >
            <span className="sr-only">Close</span>
            <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>
        <form className="flex-1 overflow-y-auto p-8 space-y-3" onSubmit={e => { e.preventDefault(); onClose(); }}>
          {sortedCategories.map(cat => (
            <div key={cat} className="flex items-center gap-3">
              <span className="w-7 h-7 flex items-center justify-center bg-gray-100 rounded-full">
                {React.createElement(developmentCategories[cat].icon, { size: 18, color: developmentCategories[cat].color })}
              </span>
              <span className="flex-1 text-sm font-medium">{cat}</span>
              <input
                type="number"
                min={1}
                step={0.1}
                className="w-20 border rounded px-2 py-1 text-sm"
                value={heights[cat]}
                onChange={e => {
                  const v = parseFloat(e.target.value);
                  setHeights(h => ({ ...h, [cat]: isNaN(v) ? '' : v }));
                }}
                aria-label={`Floor height for ${cat}`}
              />
              <span className="text-xs text-gray-500 ml-1">m</span>
            </div>
          ))}
        </form>
        <div className="p-4 border-t flex justify-end gap-2">
          <button
            type="button"
            className="px-3 py-1 rounded bg-gray-100 text-gray-700 hover:bg-gray-200 text-sm"
            onClick={onClose}
          >Cancel</button>
          <button
            type="button"
            className="px-3 py-1 rounded bg-indigo-600 text-white hover:bg-indigo-700 text-sm"
            onClick={() => { saveHeightsToStorage(heights); onClose(); }}
          >Save</button>
        </div>
      </div>
    </div>
  );
  return ReactDOM.createPortal(modalContent, document.body);
}

/**
 * Button to add a parcel layer for the current DAs.
 * Sits next to the 'Create Layer' button in the UI.
 * @param {Object} props
 * @param {Array} props.applications - Array of DA objects
 * @param {Array} props.selectedFeatures - Array of selected map features (for LGA)
 * @param {Function} props.setParcelLayer - Setter for the new layer name
 * @param {Function} props.setError - Setter for error messages
 * @param {Function} props.setTotalFeatures - Setter for total features (progress)
 * @param {Function} props.setProcessedFeatures - Setter for processed features (progress)
 */
export default function AddParcelLayerButton({
  applications,
  selectedFeatures,
  setParcelLayer,
  setError,
  setTotalFeatures,
  setProcessedFeatures
}) {
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [floorHeights, setFloorHeights] = useState(getInitialHeights());

  const handleAddParcelLayer = async () => {
    setLoading(true);
    setError && setError('');
    try {
      await createParcelLayer({
        applications,
        selectedFeatures,
        setParcelLayer,
        setError,
        setTotalFeatures,
        setProcessedFeatures,
        floorHeightsByCategory: floorHeights
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center gap-2">
      <Tippy
        trigger="mouseenter focus"
        interactive={true}
        hideOnClick={true}
        delay={[100, 200]}
        appendTo={typeof window !== 'undefined' ? () => document.body : undefined}
        content={<span style={{ whiteSpace: 'pre-line' }}>
          This may take a few minutes.
          {'\n'}
          Parcel geometry is fetched from the NSW Department of Customer Service (Spatial Services) <a href="https://maps.six.nsw.gov.au/arcgis/rest/services/public/NSW_Cadastre/Mapserver/9" target="_blank" rel="noopener noreferrer" style={{ color: '#2563eb', textDecoration: 'underline', fontWeight: 500 }}>ArcGIS REST Server</a>.
          {'\n\n'}
          Where lots are not provided in the DA data, the point coordinate is used with this Server to fetch associated parcel geometry.
          {'\n\n'}
          Estimated Height is calculated as Storeys × [category floor height] (default 3 metres per storey, configurable).
        </span>}
        animation="shift-away"
        theme="light"
        className={tooltipClass}
        arrow={true}
        maxWidth={350}
      >
        <button
          type="button"
          className="flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium bg-indigo-600 text-white hover:bg-indigo-700"
          onClick={handleAddParcelLayer}
          disabled={loading}
        >
          {loading ? (
            <>
              <div className="animate-spin h-3 w-3 border-2 border-white border-t-transparent rounded-full" />
              <span>Adding Parcel Layer...</span>
            </>
          ) : (
            <>
              <Layers size={18} />
              <span>Add Parcel Layer</span>
            </>
          )}
        </button>
      </Tippy>
      <Tippy content="Configure floor to floor heights" delay={[100, 50]}>
        <button
          type="button"
          className="p-1 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-700 border border-gray-300"
          style={{ lineHeight: 0 }}
          onClick={() => setModalOpen(true)}
          aria-label="Configure floor to floor heights"
        >
          <Settings size={18} />
        </button>
      </Tippy>
      <FloorHeightModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        heights={floorHeights}
        setHeights={setFloorHeights}
      />
    </div>
  );
} 
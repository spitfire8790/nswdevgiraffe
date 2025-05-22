import React, { useState } from 'react';
import { createParcelLayer } from './parcelLayerUtils';
import { Layers } from 'lucide-react';
import Tippy from '@tippyjs/react';
import 'tippy.js/dist/tippy.css';
import 'tippy.js/animations/shift-away.css';

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
}
`;
if (typeof window !== 'undefined' && !document.getElementById('custom-tippy-parcel-style')) {
  style.id = 'custom-tippy-parcel-style';
  document.head.appendChild(style);
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
        setProcessedFeatures
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Tippy
      content={<span style={{ whiteSpace: 'pre-line' }}>
        This may take a few minutes.
        {'\n'}
        Parcel geometry is fetched from the NSW Department of Customer Service (Spatial Services) <a href="https://maps.six.nsw.gov.au/arcgis/rest/services/public/NSW_Cadastre/Mapserver/9" target="_blank" rel="noopener noreferrer" style={{ color: '#2563eb', textDecoration: 'underline', fontWeight: 500 }}>ArcGIS REST Server</a>.
        {'\n\n'}
        Where lots are not provided in the DA data, the point coordinate is used with this Server to fetch associated parcel geometry.
        {'\n\n'}
        Estimated Height is calculated as Storeys × 3m (assuming 3 metres per storey).
      </span>}
      animation="shift-away"
      theme="light"
      className={tooltipClass}
      arrow={true}
      maxWidth={350}
      delay={[100, 50]}
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
  );
} 
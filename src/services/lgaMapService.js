/**
 * Service to handle map operations related to LGA boundaries and temporary DA layers
 */
import { fetchLgaBoundary } from './arcgisService';
// Import mapLayerUtils directly for consistency if needed within createTempDaLayer
import { getTransformedDevelopmentType, isResidentialType, deduplicateApplications } from '../components/DevelopmentModal/mapLayerUtils'; 
import { rpc } from '@gi-nx/iframe-sdk';

// Constant for the temporary layer name
const LGA_BOUNDARY_LAYER = 'lga-boundary-layer';
const DA_TEMP_LAYER = 'da-temp-layer';


// Constants for application status colors - simplified to all blue with white stroke
const STATUS_COLORS = {
  'Lodged': '#0000FF',       // Blue
  'Under Assessment': '#0000FF', // Blue
  'On Exhibition': '#0000FF',    // Blue
  'Determined': '#0000FF',   // Blue
  'Withdrawn': '#0000FF',    // Blue
  'Approved': '#0000FF',     // Blue
  'Refused': '#0000FF',      // Blue
  'default': '#0000FF'       // Blue
};

/**
 * Displays an LGA boundary on the map
 * @param {Object} rpc - The RPC object from @gi-nx/iframe-sdk
 * @param {string} lgaName - The name of the Local Government Area
 * @returns {Promise<void>}
 */
export const displayLgaBoundary = async (rpc, lgaName) => {
  try {
    // Start fetching the LGA boundary right away
    const geojsonPromise = fetchLgaBoundary(lgaName);
    
    // In parallel, remove any existing LGA boundary layer
    removeLgaBoundaryLayer(rpc);
    
    // Await the GeoJSON data
    const geojson = await geojsonPromise;
    
    if (!geojson || !geojson.features || geojson.features.length === 0) {
      console.warn(`No boundary found for LGA: ${lgaName}`);
      return;
    }
    
    console.log(`LGA boundary for ${lgaName} fetched:`, {
      featureCount: geojson.features.length,
      firstFeatureType: geojson.features[0]?.geometry?.type,
      coordinateSample: geojson.features[0]?.geometry?.coordinates?.[0]?.[0] || 'No coordinates'
    });
    
    // Create a style for the LGA boundary with improved styling
    const style = {
      id: LGA_BOUNDARY_LAYER,
      type: 'fill',
      source: {
        type: 'geojson',
        data: geojson
      },
      paint: {
        'fill-color': 'rgba(66, 135, 245, 0.15)',   // Light blue fill
        'fill-outline-color': 'rgba(46, 100, 199, 1)', // Darker blue outline
        'fill-opacity': 0.8
      }
    };
    
    // Add a second layer for the outline to make it more prominent
    const outlineStyle = {
      id: `${LGA_BOUNDARY_LAYER}-outline`,
      type: 'line',
      source: {
        type: 'geojson',
        data: geojson
      },
      paint: {
        'line-color': 'rgba(46, 100, 199, 1)',  // Darker blue
        'line-width': 2,
        'line-opacity': 0.9
      }
    };
    
    // Add temporary layers and prepare for flyTo in parallel
    const feature = geojson.features[0];
    let bounds = null;
    
    if (feature && feature.geometry) {
      bounds = getBoundingBox(feature);
    }
    
    // Add temporary layers using rpc.invoke and don't wait for them to complete
    // before calculating the bounds
    const addLayersPromise = Promise.all([
      rpc.invoke('addTempLayer', [LGA_BOUNDARY_LAYER, style, null, true, 0.8]),
      rpc.invoke('addTempLayer', [`${LGA_BOUNDARY_LAYER}-outline`, outlineStyle, null, true, 1.0])
    ]);
    
    // If we have bounds, fly to them immediately without waiting for layers to be added
    if (bounds) {
      flyToLgaBoundary(rpc, feature);
    }
    
    // Ensure layers are added (but we've already started the flyTo)
    await addLayersPromise;
    console.log(`Added temp layers for LGA: ${lgaName}`);
    
  } catch (error) {
    console.error('Error displaying LGA boundary:', error);
    throw error;
  }
};

/**
 * Removes the LGA boundary layer from the map
 * @param {Object} rpc - The RPC object from @gi-nx/iframe-sdk
 */
export const removeLgaBoundaryLayer = (rpc) => {
  try {
    // Remove both the fill and outline layers
    rpc.invoke('removeTempLayer', [LGA_BOUNDARY_LAYER]);
    rpc.invoke('removeTempLayer', [`${LGA_BOUNDARY_LAYER}-outline`]);
  } catch (error) {
    console.error('Error removing LGA boundary layer:', error);
  }
};

/**
 * Flies to the LGA boundary on the map
 * @param {Object} rpc - The RPC object from @gi-nx/iframe-sdk
 * @param {Object} feature - GeoJSON feature of the LGA boundary
 * @private
 */
const flyToLgaBoundary = (rpc, feature) => {
  try {
    // Use the pre-calculated bounds if they exist
    const bounds = feature.cachedBounds || getBoundingBox(feature);
    
    if (!bounds) {
      console.warn('Unable to calculate bounds for flyTo');
      return;
    }
    
    // Add a buffer of approximately 10% to the bounds
    // We'll calculate this directly in the boundsWithBuffer array to avoid extra object creation
    const bufferX = (bounds.xMax - bounds.xMin) * 0.1;
    const bufferY = (bounds.yMax - bounds.yMin) * 0.1;
    
    // Create LngLatBoundsLike object with buffer
    const boundsWithBuffer = [
      [bounds.xMin - bufferX, bounds.yMin - bufferY], // Southwest corner
      [bounds.xMax + bufferX, bounds.yMax + bufferY]  // Northeast corner
    ];
    
    // Set up minimal options for fitBounds - only what's needed
    const options = { 
      padding: 50,
      duration: 1200  // Slightly faster animation
    };
    
    // Call fitBounds without logging to reduce overhead
    rpc.invoke('fitBounds', [boundsWithBuffer, options])
      .catch(error => console.error('Error in fitBounds call:', error));
    
  } catch (error) {
    console.error('Error flying to LGA boundary:', error);
  }
};

/**
 * Calculates the bounding box for a GeoJSON feature
 * @param {Object} feature - GeoJSON feature
 * @returns {Object|null} Bounding box with xMin, yMin, xMax, yMax or null if invalid
 * @private
 */
const getBoundingBox = (feature) => {
  if (!feature || !feature.geometry || !feature.geometry.coordinates) {
    console.warn('Invalid feature for bounding box calculation');
    return null;
  }
  
  console.log('Calculating bounds for feature type:', feature.geometry.type);
  
  let coords = feature.geometry.coordinates;
  
  // Handle different geometry types
  if (feature.geometry.type === 'Polygon') {
    coords = coords[0]; // First ring of the polygon
    console.log('Using coordinates from first polygon ring, count:', coords.length);
  } else if (feature.geometry.type === 'MultiPolygon') {
    // Flatten all coordinates
    coords = coords.flat(2);
    console.log('Flattened MultiPolygon coordinates, count:', coords.length);
  }
  
  if (!coords.length) {
    console.warn('No coordinates found in feature');
    return null;
  }
  
  // Initialize bounds with the first coordinate
  let bounds = {
    xMin: coords[0][0],
    yMin: coords[0][1],
    xMax: coords[0][0],
    yMax: coords[0][1]
  };
  
  console.log('Initial bounds from first coordinate:', bounds);
  
  // Calculate the bounds from all coordinates
  coords.forEach(coord => {
    bounds.xMin = Math.min(bounds.xMin, coord[0]);
    bounds.yMin = Math.min(bounds.yMin, coord[1]);
    bounds.xMax = Math.max(bounds.xMax, coord[0]);
    bounds.yMax = Math.max(bounds.yMax, coord[1]);
  });
  
  console.log('Final calculated bounds:', bounds);
  return bounds;
};

/**
 * Creates a temporary GeoJSON layer for Development Application data.
 * This function now directly takes the data to display, without internal filtering.
 * @param {Object} rpc - The RPC object from @gi-nx/iframe-sdk
 * @param {Array} developmentData - Array of development application data to display
 * @returns {Promise<void>}
 */
export const createTempDaLayer = async (rpc, developmentData) => {
  try {
    // First, remove any existing DA temp layer before adding the new one
    removeTempDaLayer(rpc);
    
    if (!developmentData || developmentData.length === 0) {
      // Changed from warn to log, as empty filtered data is expected
      console.log('No development data provided to display in temp layer.'); 
      return;
    }
    
    // Deduplicate development data before creating the layer
    const dedupedData = deduplicateApplications(developmentData);
    console.log(`Temp layer deduplication removed ${developmentData.length - dedupedData.length} duplicate entries`);
    
    // Convert development data to GeoJSON features
    const features = dedupedData
      .filter(app => {
        // ... existing filter for valid location ...
        if (!app.Location || !app.Location.length || !app.Location[0]) return false;
        const location = app.Location[0];
        return location.X && location.Y && !isNaN(location.X) && !isNaN(location.Y);
      })
      .map(app => {
        // ... existing feature creation logic ...
        try {
          const location = app.Location[0];
          const x = parseFloat(location.X);
          const y = parseFloat(location.Y);
          
          // Get status and color - now always blue
          const status = app.ApplicationStatus || 'Unknown';
          const color = STATUS_COLORS[status] || STATUS_COLORS.default;
          
          // Check if residential
          const transformedDevType = getTransformedDevelopmentType(app.DevelopmentType || []);
          const isResidential = app.DevelopmentType?.some(type => 
            isResidentialType(type.DevelopmentType)
          ) || false;
          
          return {
            type: 'Feature',
            geometry: {
              type: 'Point',
              coordinates: [x, y]
            },
            properties: {
              id: app.ApplicationId,
              title: app.DevelopmentDescription || 'Unknown',
              status: status,
              color: color,
              outlineColor: '#ffffff', // Always white stroke
              fillColor: color,
              isResidential: isResidential,
              lodgedDate: app.LodgementDate,
              description: app.DevelopmentDescription || 'No description available',
              developmentType: transformedDevType,
              "Clean Development Type": transformedDevType,
              "Detailed Development Type": app.DevelopmentType ? app.DevelopmentType.map(dt => dt.DevelopmentType).join('; ') : '',
              PAN: app.PlanningPortalApplicationNumber || '',
              "Council Reference": app.CouncilApplicationNumber || '',
              "Lodgement Date": app.LodgementDate || '',
              "Determination Date": app.DeterminationDate || '',
              Cost: app.CostOfDevelopment || 0,
              Dwellings: app.NumberOfNewDwellings || 0,
              Storeys: app.NumberOfStoreys || 0,
              Status: app.ApplicationStatus || '',
              "EPI Variation": app.EPIVariationProposedFlag || '',
              Subdivision: app.SubdivisionProposedFlag || '',
              Address: app.Location?.[0]?.FullAddress || '',
              Lots: app.Location?.[0]?.Lot ? app.Location[0].Lot.map(lot => 
                `${lot.Lot}//${lot.PlanLabel}`).join('; ') : '',
              Category: app.Category || 'Miscellaneous and Administrative' // Ensure Category is added if needed elsewhere
            }
          };
        } catch (error) {
          console.error('Error creating feature from application:', app?.ApplicationId, error); // Log App ID
          return null;
        }
      })
      .filter(feature => feature !== null);
      
    if (features.length === 0) {
      // Changed from warn to log
      console.log('No valid features created to display in temp DA layer.');
      return;
    }
    
    const featureCollection = {
      type: 'FeatureCollection',
      features
    };

    // Diagnostic check: Ensure the object is serializable
    try {
      JSON.stringify(featureCollection); 
      // console.log(`Feature collection with ${features.length} features appears serializable.`); // Optional log
    } catch (stringifyError) {
      console.error('CRITICAL ERROR: The generated featureCollection cannot be serialized to JSON!', stringifyError);
      console.error('Problematic Feature Collection:', featureCollection); // Log the object structure
      // Attempt to find non-serializable feature properties (can be slow for large data)
      features.forEach((f, index) => {
        try { 
          JSON.stringify(f); 
        } catch (featureStringifyError) { 
          console.error(`Feature at index ${index} is not serializable:`, f, featureStringifyError); 
        }
      });
      return; // Stop before calling rpc.invoke
    }

    console.log(`Creating temp DA layer with ${features.length} features`);

    // Create a style for the DA points - all blue with white stroke
    const style = {
      id: DA_TEMP_LAYER,
      type: 'circle',
      source: {
        type: 'geojson',
        data: featureCollection
      },
      paint: {
        "circle-radius": ["case", ["get", "isResidential"], 3, 3],
        "circle-color": "#0000FF", // All blue
        "circle-stroke-width": 1,
        "circle-stroke-color": "#ffffff" // White stroke
      }
    };
    
    // Add the temporary layer
    await rpc.invoke('addTempLayer', [DA_TEMP_LAYER, style, null, true, 1.0]);
    console.log(`Added temporary DA layer: ${DA_TEMP_LAYER} with ${features.length} applications`);
    
  } catch (error) {
    console.error('Error creating temporary DA layer:', error);
  }
};

/**
 * Removes the temporary DA layer from the map
 * @param {Object} rpc - The RPC object from @gi-nx/iframe-sdk
 */
export const removeTempDaLayer = (rpc) => {
  try {
    // Added logging for clarity
    console.log(`Attempting to remove temporary DA layer: ${DA_TEMP_LAYER}`);
    rpc.invoke('removeTempLayer', [DA_TEMP_LAYER]);
  } catch (error) {
    // Log error but don't crash the app
    console.error('Error removing temporary DA layer:', error); 
  }
};

/**
 * Removes all temporary layers from the map - useful during app refresh
 * @param {Object} rpc - The RPC object from @gi-nx/iframe-sdk
 */
export const removeAllTempLayers = (rpc) => {
  try {
    console.log('Removing all temporary layers during app refresh');
    // Remove DA layer
    removeTempDaLayer(rpc);
    // Remove LGA boundary layers
    removeLgaBoundaryLayer(rpc);
  } catch (error) {
    console.error('Error removing all temporary layers:', error);
  }
}; 


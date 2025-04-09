import { developmentCategories, getDevelopmentCategory } from '../DevelopmentModal/developmentTypes';
import { rpc } from '@gi-nx/iframe-sdk';

/**
 * Creates a style configuration for development applications layer using categories
 * @returns {Object} - Complete style configuration object for Giraffe SDK
 */
export const createDevelopmentLayerStyle = () => {
  // Extract colors from development categories for use in expressions
  const categoryColors = Object.entries(developmentCategories).reduce((acc, [category, config]) => {
    acc[category] = config.color;
    return acc;
  }, {});

  // Create a Mapbox compatible match expression for category colors
  const categoryColorExpression = [
    'match',
    ['get', 'Category'],
    ...Object.entries(categoryColors).flatMap(([category, color]) => [category, color]),
    '#666666' // Default color if no match
  ];

  // Create expressions for circle radius based on number of dwellings
  const circleRadiusExpression = [
    'case',
    ['>=', ['get', 'Dwellings'], 20], 12,
    ['>=', ['get', 'Dwellings'], 10], 10,
    ['>=', ['get', 'Dwellings'], 5], 8,
    6
  ];

  // Define complete LensableStyle with both LensableDataStyle and LensableDisplayStyle properties
  return {
    // LensableDataStyle properties
    columnDef: {
      // Define all property types for filtering and data operations
      Category: { type: 'string' },
      "Clean Development Type": { type: 'string' },
      "Council Reference": { type: 'string' },
      Status: { type: 'string' },
      Cost: { type: 'number' },
      Dwellings: { type: 'number' },
      Storeys: { type: 'number' },
      "Lodgement Date": { type: 'string' },
      "Determination Date": { type: 'string' },
      Address: { type: 'string' },
      "EPI Variation": { type: 'string' },
      Subdivision: { type: 'string' }
    },
    // Define primary keys for table and filtering UI
    columnKeys: [
      'Category', 
      'Clean Development Type', 
      'Status', 
      'Cost', 
      'Dwellings',
      'Lodgement Date'
    ],
    // Enable filtering
    filter: {
      // Start with no filters applied
      all: []
    },
    // Sort by most recent lodgement date
    sortBy: [{ field: 'Lodgement Date', ascending: false }],
    
    // LensableDisplayStyle properties
    mainLayer: 'circle',
    showLabels: true,  // Enable labels for larger developments
    primaryLabelMaxChars: 30, // Limit label length
    fillOpacity: 0.9,
    circleRadius: 8,  // Default radius, will be overridden by expression
    
    // Properties to display in tooltips and info panels
    displayKeys: [
      'Clean Development Type',
      'Council Reference',
      'Status',
      'Cost',
      'Dwellings',
      'Storeys',
      'Lodgement Date',
      'Determination Date',
      'Address'
    ],
    
    // Enable color palette by category for legend
    showPalette: 'Category',
    
    // Main color uses the category color expression
    mainColor: categoryColorExpression,
    
    // Enable table view for data exploration
    showTable: true,
    
    // Define column widths for better table appearance
    tableColumnWidths: {
      'Category': 150,
      'Clean Development Type': 180,
      'Status': 120,
      'Cost': 100,
      'Dwellings': 100,
      'Address': 250
    },
    
    // Text styling
    textColor: '#000000',
    textHaloColor: '#FFFFFF',
    
    // Override the circle layer with custom styling
    overrideCircle: {
      paint: {
        'circle-radius': circleRadiusExpression,
        'circle-color': categoryColorExpression,
        'circle-stroke-width': 2,
        'circle-stroke-color': '#000000',
        'circle-opacity': 0.85
      }
    },
    
    // Override label styling
    overrideLabel: {
      layout: {
        'text-field': ['get', 'Clean Development Type'],
        'text-size': 12,
        'text-offset': [0, 1.5],
        'text-anchor': 'top',
        'text-allow-overlap': false,
        'text-ignore-placement': false,
        'visibility': 'visible'
      },
      paint: {
        'text-color': '#000000',
        'text-halo-color': '#FFFFFF',
        'text-halo-width': 2
      }
    }
  };
};

/**
 * Checks if a layer exists in the Giraffe SDK
 * @param {string} layerName - The name of the layer to check
 * @returns {Promise<boolean>} - Whether the layer exists
 */
const checkLayerExists = async (layerName) => {
  try {
    console.log(`[CHECK] Checking if layer "${layerName}" exists...`);
    // This is a common pattern in Giraffe SDK to get layers
    const layers = await rpc.invoke('getLayers', []);
    console.log(`[CHECK] Found ${layers.length} layers total`);
    
    // Log the first few layers to see what's there
    if (layers.length > 0) {
      console.log(`[CHECK] Available layers:`, 
        layers.slice(0, 5).map(layer => layer.id || layer.name));
    }
    
    // Check if our layer exists
    const layerExists = layers.some(layer => 
      layer.name === layerName || layer.id === layerName || 
      layer.id === `GIRTMP-${layerName}`);
    
    console.log(`[CHECK] Layer "${layerName}" ${layerExists ? 'exists' : 'does not exist'}`);
    return layerExists;
  } catch (error) {
    console.error(`[CHECK ERROR] Error checking layer existence:`, error);
    return false;
  }
};

/**
 * Attempts to apply a style to a layer, trying different name variations
 * @param {string} layerName - The original layer name
 * @param {Object} style - The style to apply
 * @returns {Promise<boolean>} - Whether styling succeeded with any variation
 */
const tryApplyStyleWithVariants = async (layerName, style) => {
  const variants = [
    layerName,                  // Original name
    `GIRTMP-${layerName}`,      // With GIRTMP prefix
    layerName.replace(/\s+/g, '-'),  // With spaces replaced by hyphens
    layerName.replace(/^DA - /, '') // Without the DA - prefix
  ];
  
  console.log(`[VARIANTS] Will try ${variants.length} layer name variants`);
  
  for (let i = 0; i < variants.length; i++) {
    const variant = variants[i];
    try {
      console.log(`[VARIANTS] Attempt ${i+1}/${variants.length}: "${variant}"`);
      await rpc.invoke('updateLayerStyle', [variant, style]);
      console.log(`[VARIANTS] Success with variant: "${variant}"`);
      return true;
    } catch (error) {
      console.warn(`[VARIANTS] Failed with variant "${variant}":`, error.message);
    }
  }
  
  console.error('[VARIANTS] All variants failed');
  return false;
};

/**
 * Applies category-based styling to a development application layer
 * @param {string} layerName - The name of the layer to style
 * @returns {Promise<boolean>} - Success status
 */
export const applyDevelopmentCategoryStyling = async (layerName) => {
  if (!layerName) {
    console.warn('No layer name provided for styling');
    return false;
  }

  try {
    console.log(`[STYLING] Starting style application for layer: "${layerName}"`);
    
    // Check if layer exists before styling
    const exists = await checkLayerExists(layerName);
    if (!exists) {
      console.warn(`[STYLING] Cannot style layer "${layerName}" - it doesn't exist`);
      // Try with alternative naming pattern
      console.log(`[STYLING] Attempting to check with alternative naming pattern...`);
      const alternateExists = await checkLayerExists(`GIRTMP-${layerName}`);
      if (alternateExists) {
        console.log(`[STYLING] Found layer with prefix: "GIRTMP-${layerName}"`);
        // Will continue with original name as updateLayerStyle may handle this internally
      }
    }
    
    // Get the style configuration
    console.log(`[STYLING] Generating style configuration...`);
    const lensableStyle = createDevelopmentLayerStyle();
    console.log(`[STYLING] Style configuration created with properties:`, 
      Object.keys(lensableStyle).join(', '));
    console.log(`[STYLING] Main layer type: ${lensableStyle.mainLayer}, Show labels: ${lensableStyle.showLabels}`);
    
    // Log more details about the style
    if (lensableStyle.overrideCircle) {
      console.log(`[STYLING] Circle paint properties:`, 
        Object.keys(lensableStyle.overrideCircle.paint).join(', '));
    }

    // Apply the style using the Giraffe SDK - try multiple variants
    console.log(`[STYLING] Will try multiple layer name variants for styling`);
    const startTime = Date.now();
    const result = await tryApplyStyleWithVariants(layerName, lensableStyle);
    const duration = Date.now() - startTime;
    
    if (result) {
      console.log(`[STYLING] Successfully applied style in ${duration}ms`);
      return true;
    } else {
      console.error(`[STYLING] Failed to apply style after trying all variants`);
      return false;
    }
  } catch (error) {
    console.error(`[STYLING ERROR] Failed to apply styling to layer "${layerName}":`, error);
    console.error(`[STYLING ERROR] Error name: ${error.name}, Message: ${error.message}`);
    if (error.stack) {
      console.error(`[STYLING ERROR] Stack trace:`, error.stack);
    }
    
    // Try to log more information about the RPC call
    console.log(`[STYLING DEBUG] Layer name type: ${typeof layerName}`);
    console.log(`[STYLING DEBUG] Available RPC methods:`, 
      Object.keys(rpc).filter(k => typeof rpc[k] === 'function').join(', '));
      
    return false;
  }
};

/**
 * Processes development applications to add category information
 * @param {Array} applications - Raw development applications
 * @returns {Array} - Applications with added category property
 */
export const categorizeApplications = (applications) => {
  if (!applications || !Array.isArray(applications)) {
    return [];
  }
  
  return applications.map(app => {
    // Copy the application to avoid mutating the original
    const appCopy = { ...app };
    
    // Get the development type
    const devType = app.DevelopmentType?.[0]?.DevelopmentType || 'Unknown';
    
    // Use the getDevelopmentCategory function to properly categorize
    const category = getDevelopmentCategory(devType);
    
    // Add the category to the application properties
    appCopy.Category = category;
    
    return appCopy;
  });
};

// Export the development categories for reference
export { developmentCategories }; 
import { rpc } from '@gi-nx/iframe-sdk';
import * as turf from '@turf/turf';
import { validateGeoJSON } from '../../utils/mapUtils';
import { formatCurrency } from '../../utils/formatters';
import { typeMap } from './developmentTypes';
import { RESIDENTIAL_TYPES } from './residentialTypes';

// Constants for application status colors
const STATUS_COLORS = {
  'Lodged': '#FFA500',      // Orange
  'Under Assessment': '#0000FF', // Blue
  'On Exhibition': '#800080',    // Purple
  'Determined': '#008000',   // Green
  'Withdrawn': '#FF0000',    // Red
  'default': '#666666'       // Grey
};

/**
 * Normalizes an address string for comparison
 * Handles spacing differences, abbreviations, etc.
 * @param {string} address - The address to normalize
 * @returns {string} Normalized address
 */
const normalizeAddress = (address) => {
  if (!address) return '';
  
  // Convert to lowercase
  let normalized = address.toLowerCase();
  
  // Replace common street type abbreviations
  const streetTypes = {
    ' st ': ' street ',
    ' st': ' street',
    ' rd ': ' road ',
    ' rd': ' road',
    ' ave ': ' avenue ',
    ' ave': ' avenue',
    ' ln ': ' lane ',
    ' ln': ' lane',
    ' dr ': ' drive ',
    ' dr': ' drive',
    ' pl ': ' place ',
    ' pl': ' place',
    ' hwy ': ' highway ',
    ' hwy': ' highway',
    ' blvd ': ' boulevard ',
    ' blvd': ' boulevard'
  };
  
  // Apply street type replacements
  Object.entries(streetTypes).forEach(([abbr, full]) => {
    normalized = normalized.replace(new RegExp(abbr, 'g'), full);
  });
  
  // Remove punctuation and extra spaces
  normalized = normalized.replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, " ");
  normalized = normalized.replace(/\s+/g, " ").trim();
  
  // Remove unit/suite numbers (like 1/123 or Unit 5, 123)
  normalized = normalized.replace(/^(?:unit|suite|flat|apt|apartment)\s+\d+[,\s]+/i, "");
  normalized = normalized.replace(/^\d+\/+/i, "");
  
  // Consolidate numbers with hyphens (e.g., "13 - 17" to "13-17")
  normalized = normalized.replace(/(\d+)\s*-\s*(\d+)/g, "$1-$2");
  
  return normalized;
};

/**
 * Deduplicates development applications based on address and similarity criteria
 * Keeps only the most recent application when duplicates are found
 * @param {Array} applications - Array of development applications
 * @returns {Array} Deduplicated array of applications
 */
export const deduplicateApplications = (applications) => {
  if (!applications || !Array.isArray(applications) || applications.length === 0) {
    return [];
  }

  // Group applications by normalized address
  const groupedByAddress = {};
  
  applications.forEach(app => {
    const rawAddress = app.Location?.[0]?.FullAddress;
    if (!rawAddress) return; // Skip if no address
    
    // Normalize the address to handle variations
    const normalizedAddress = normalizeAddress(rawAddress);
    if (!normalizedAddress) return; // Skip if normalization resulted in empty string
    
    if (!groupedByAddress[normalizedAddress]) {
      groupedByAddress[normalizedAddress] = [];
    }
    groupedByAddress[normalizedAddress].push(app);
  });
  
  // Process each address group to find and remove duplicates
  const deduplicated = [];
  
  Object.values(groupedByAddress).forEach(addressGroup => {
    // If only one application at this address, keep it
    if (addressGroup.length === 1) {
      deduplicated.push(addressGroup[0]);
      return;
    }
    
    // Sort by lodgement date (newest first)
    addressGroup.sort((a, b) => {
      const dateA = a.LodgementDate ? new Date(a.LodgementDate) : new Date(0);
      const dateB = b.LodgementDate ? new Date(b.LodgementDate) : new Date(0);
      return dateB - dateA;
    });
    
    // Create groups of duplicates based on type, value, or dwellings
    const duplicateGroups = [];
    const processed = new Set();
    
    for (let i = 0; i < addressGroup.length; i++) {
      if (processed.has(i)) continue;
      
      const app = addressGroup[i];
      const appType = getTransformedDevelopmentType(app.DevelopmentType);
      const appValue = app.CostOfDevelopment;
      const appDwellings = app.NumberOfNewDwellings;
      
      const currentGroup = [i];
      processed.add(i);
      
      // Find all duplicates for this app
      for (let j = i + 1; j < addressGroup.length; j++) {
        if (processed.has(j)) continue;
        
        const otherApp = addressGroup[j];
        const otherType = getTransformedDevelopmentType(otherApp.DevelopmentType);
        const otherValue = otherApp.CostOfDevelopment;
        const otherDwellings = otherApp.NumberOfNewDwellings;
        
        // Check if this is a duplicate based on our criteria
        if (
          (appType === otherType && appType !== 'Unknown') || 
          (appValue === otherValue && appValue !== 0 && appValue !== null && appValue !== undefined) ||
          (appDwellings === otherDwellings && appDwellings !== 0 && appDwellings !== null && appDwellings !== undefined)
        ) {
          currentGroup.push(j);
          processed.add(j);
        }
      }
      
      duplicateGroups.push(currentGroup);
    }
    
    // Keep only the first (newest) application from each duplicate group
    duplicateGroups.forEach(group => {
      deduplicated.push(addressGroup[group[0]]);
    });
  });
  
  return deduplicated;
};

// Helper function to check if a development type is residential
export const isResidentialType = (type) => {
  return RESIDENTIAL_TYPES.has(type);
};

/**
 * Transforms development types into a standardized form
 */
export const getTransformedDevelopmentType = (developmentTypes) => {
  if (!developmentTypes || developmentTypes.length === 0) {
    return 'Unknown';
  }
  
  // Find the first valid development type
  const firstType = developmentTypes.find(t => t.DevelopmentType);
  
  if (!firstType) {
    return 'Unknown';
  }
  
  const rawType = firstType.DevelopmentType;
  
  // Use the typeMap to transform the development type
  if (typeMap.has(rawType)) {
    const mappedType = typeMap.get(rawType);
    // Return the newtype if it's not an empty string
    if (mappedType.newtype) {
      return mappedType.newtype;
    }
    // If it's a secondary structure, mark it as such
    if (mappedType.secondary) {
      // Return type with indication it's a secondary structure
      return `${rawType} (secondary)`;
    }
  }
  
  // If no mapping is found, return the original type
  return rawType;
};

/**
 * Creates a GeoJSON layer from development applications and adds it to the map
 */
export const createDevelopmentLayer = async (
  applications,
  selectedFeatures,
  setDevelopmentLayer,
  setError,
  setTotalFeatures,
  setProcessedFeatures
) => {
  // Safety check first
  if (!applications || !Array.isArray(applications) || applications.length === 0) {
    console.warn('No applications to display on map');
    setError('No applications to display on map.');
    return null;
  }

  console.log(`Processing ${applications.length} applications for map display`);
  
  // Reset processed features count
  if (setProcessedFeatures) {
    setProcessedFeatures(0);
  }
  
  // Deduplicate applications before creating the layer
  const dedupedApplications = deduplicateApplications(applications);
  console.log(`Deduplication removed ${applications.length - dedupedApplications.length} duplicate entries`);
  
  // Categorize applications - simplified version without lensConfig dependency
  const categorizedApplications = dedupedApplications.map(app => {
    // Copy the application to avoid mutating the original
    return { ...app, Category: 'Miscellaneous and Administrative' };
  });
  
  // Create GeoJSON features with careful error handling
  let processed = 0;
  const featuresWithCoordinates = categorizedApplications
    .filter(app => {
      const hasLocation = app?.Location?.[0]?.X && app?.Location?.[0]?.Y;
      if (!hasLocation) {
        console.log('Filtering out application without location data');
      }
      return hasLocation;
    })
    .map(app => {
      try {
        // Parse coordinates safely
        const x = parseFloat(app.Location[0].X);
        const y = parseFloat(app.Location[0].Y);
        
        if (isNaN(x) || isNaN(y)) {
          console.warn('Invalid coordinates:', app.Location[0]);
          return null;
        }
        
        // Update processed count and notify
        processed++;
        if (setProcessedFeatures && processed % 10 === 0) {
          setProcessedFeatures(processed);
        }
        
        const coordinates = [x, y];
        const status = app.ApplicationStatus || 'Unknown';

        // Note: We're keeping fillColor & color properties for compatibility,
        // but they won't be used since we're now using fixed blue styling
        const color = STATUS_COLORS[status] || STATUS_COLORS.default;
        
        // Check if this is a residential development
        const devType = app.DevelopmentType?.[0]?.DevelopmentType || 'Unknown';
        const transformedDevType = getTransformedDevelopmentType(app.DevelopmentType || []);
        const isResidential = app.DevelopmentType?.some(type => 
          isResidentialType(type.DevelopmentType)
        ) || false;
        
        // Return valid feature with properties
        return {
          type: 'Feature',
          properties: {
            id: app.ApplicationId,
            title: app.DevelopmentDescription || 'Unknown',
            status: status,
            color: color,
            outlineColor: isResidential ? '#000000' : '#666666',
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
            Category: app.Category || 'Miscellaneous and Administrative'
          },
          geometry: {
            type: 'Point',
            coordinates: coordinates
          }
        };
      } catch (error) {
        console.error('Error creating feature from application:', error);
        return null;
      }
    })
    .filter(feature => feature !== null);

  // Check if we have any valid features
  if (!featuresWithCoordinates || featuresWithCoordinates.length === 0) {
    console.warn('No valid features created from applications');
    setError('No valid development applications with location data found');
    return null;
  }
  
  // Set the total features for progress tracking
  setTotalFeatures(featuresWithCoordinates.length);
  
  try {
    // Get council name for layer ID - check all possible paths
    let councilName = 'Unknown';
    if (selectedFeatures && selectedFeatures.length > 0) {
      councilName = selectedFeatures[0]?.properties?.copiedFrom?.site_suitability__LGA || 
                   selectedFeatures[0]?.properties?.site_suitability__LGA || 
                   'Unknown';
      console.log('Using LGA name for layer:', councilName);
    }
    
    // Format current date in the "2 April 2025" format
    const currentDate = new Date();
    const day = currentDate.getDate();
    const month = currentDate.toLocaleString('en-US', { month: 'long' });
    const year = currentDate.getFullYear();
    const formattedDate = `${day} ${month} ${year}`;
    
    // Create the formatted layer name (this is what we'll use consistently)
    const layerName = `DA - ${councilName} - ${formattedDate}`;
    console.log('[LAYER] Creating layer with name:', layerName);
    
    // Store the layer name in state for later reference
    setDevelopmentLayer(layerName);
    
    // Create the feature collection with explicit initialization and deep copy to ensure valid structure
    const featureCollection = JSON.parse(JSON.stringify({
      type: 'FeatureCollection',
      features: featuresWithCoordinates
    }));
    
    console.log(`Creating GeoJSON layer with ${featuresWithCoordinates.length} development application points`);
    
    // Define layer style for points - use blue circles styling with different sizes based on isResidential
    const layerStyle = {
      type: "circle",
      paint: {
        "circle-radius": ["case", ["get", "isResidential"], 8, 6],
        "circle-color": "#0000FF", // Blue circle color
        "circle-stroke-width": ["case", ["get", "isResidential"], 3, 2],
        "circle-stroke-color": "#000000" // Black outline
      }
    };
    
    // Use the validateGeoJSON function to check if the feature collection is valid
    if (!validateGeoJSON(featureCollection, true)) {
      console.error('Feature collection failed validation');
      setError('Error creating GeoJSON layer: Feature collection validation failed');
      return null;
    }
    
    try {
      // Create a fresh copy of the collection to avoid reference issues
      const cleanFeatureCollection = {
        type: 'FeatureCollection',
        features: featureCollection.features.map(f => ({
          type: 'Feature',
          geometry: {
            type: f.geometry.type,
            coordinates: JSON.parse(JSON.stringify(f.geometry.coordinates))
          },
          properties: {...f.properties}
        }))
      };
      
      // Create a simplified feature collection to avoid serialization issues
      const simplifiedFeatureCollection = {
        type: 'FeatureCollection',
        features: cleanFeatureCollection.features
          .filter(f => {
            // Filter out any features with invalid coordinates
            if (!f || !f.geometry || !Array.isArray(f.geometry.coordinates) || 
                f.geometry.coordinates.length < 2 ||
                typeof f.geometry.coordinates[0] !== 'number' || 
                typeof f.geometry.coordinates[1] !== 'number' ||
                isNaN(f.geometry.coordinates[0]) || 
                isNaN(f.geometry.coordinates[1])) {
              console.warn('Filtering out feature with invalid coordinates:', f);
              return false;
            }
            return true;
          })
          .map(f => ({
            type: 'Feature',
            geometry: {
              type: 'Point',
              coordinates: [
                parseFloat(f.geometry.coordinates[0]),
                parseFloat(f.geometry.coordinates[1])
              ]
            },
            properties: {
              Address: f.properties.Address || '',
              status: f.properties.status || '',
              isResidential: !!f.properties.isResidential,
              "Clean Development Type": f.properties["Clean Development Type"] || f.properties.developmentType || 'Unknown',
              "Detailed Development Type": f.properties["Detailed Development Type"] || '',
              PAN: f.properties.PAN || '',
              "Council Reference": f.properties["Council Reference"] || '',
              "Lodgement Date": f.properties["Lodgement Date"] || '',
              "Determination Date": f.properties["Determination Date"] || '',
              Cost: f.properties.Cost || 0,
              Dwellings: f.properties.Dwellings || 0,
              Storeys: f.properties.Storeys || 0,
              Status: f.properties.Status || '',
              "EPI Variation": f.properties["EPI Variation"] || '',
              Subdivision: f.properties.Subdivision || '',

              Lots: f.properties.Lots || '',
              Category: f.properties.Category || 'Miscellaneous and Administrative'
            }
          }))
      };
      
      // Check if we have features after filtering
      if (!simplifiedFeatureCollection.features || simplifiedFeatureCollection.features.length === 0) {
        console.error('No valid features after filtering');
        setError('Error creating GeoJSON layer: No valid features after filtering');
        return null;
      }
      
      // Now invoke the RPC method with the clean object - createGeoJSONLayer returns void
      try {
        console.log(`[LAYER] Calling createGeoJSONLayer with ${simplifiedFeatureCollection.features.length} features`);
        console.log(`[LAYER] Layer name: "${layerName}"`);
        console.log(`[LAYER] First few feature properties:`, 
          simplifiedFeatureCollection.features.slice(0, 2).map(f => 
            Object.keys(f.properties).slice(0, 5).reduce((obj, key) => {
              obj[key] = f.properties[key];
              return obj;
            }, {})
          ));
        
        const startTime = Date.now();
        await rpc.invoke('createGeoJSONLayer', [
          layerName,  // Use the consistent layer name
          simplifiedFeatureCollection,
          {
            description: `Development Applications in ${councilName} - ${formattedDate}`,
            style: layerStyle
          }
        ]);
        const duration = Date.now() - startTime;
        
        console.log(`[LAYER] createGeoJSONLayer completed in ${duration}ms`);
        console.log(`[LAYER] GeoJSON layer created with name: "${layerName}"`);
        
        // Update final processed count to match total
        if (setProcessedFeatures) {
          setProcessedFeatures(featuresWithCoordinates.length);
        }
        
        return layerName;
      } catch (error) {
        console.error('Error creating GeoJSON layer:', error);
        setError(`Error creating GeoJSON layer: ${error.message}`);
        return null;
      }
    } catch (error) {
      console.error('Error creating GeoJSON layer:', error);
      setError(`Error creating GeoJSON layer: ${error.message}`);
      return null;
    }
  } catch (error) {
    console.error('Error creating development layer:', error);
    setError(`Error creating development layer: ${error.message}`);
    return null;
  }
};

/**
 * Removes a development layer from the map
 */
export const removeDevelopmentLayer = async (layerId) => {
  if (!layerId) return false;
  
  try {
    console.log(`Removing development layer: ${layerId}`);
    const result = await rpc.invoke('removeLayer', [layerId]);
    return true;
  } catch (error) {
    console.error('Error removing development layer:', error);
    return false;
  }
}; 
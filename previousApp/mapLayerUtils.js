import { rpc } from '@gi-nx/iframe-sdk';
import * as turf from '@turf/turf';
import { validateGeoJSON } from '../utils/mapUtils';
import { formatCurrency } from '../utils/formatters';
import { typeMap } from './developmentTypes';

// Constants for application status colors
const STATUS_COLORS = {
  'Lodged': '#FFA500',      // Orange
  'Under Assessment': '#0000FF', // Blue
  'On Exhibition': '#800080',    // Purple
  'Determined': '#008000',   // Green
  'Withdrawn': '#FF0000',    // Red
  'default': '#666666'       // Grey
};

// Define residential development types
const RESIDENTIAL_TYPES = new Set([
  'Dwelling',
  'Dwelling house',
  'Secondary dwelling',
  'Dual occupancy',
  'Dual occupancy (attached)',
  'Dual occupancy (detached)',
  'Residential flat building',
  'Multi-dwelling housing',
  'Multi-dwelling housing (terraces)',
  'Semi-attached dwelling',
  'Attached dwelling',
  'Semi-detached dwelling',
  'Shop top housing',
  'Boarding house',
  'Seniors housing',
  'Group homes',
  'Group home',
  'Group home (permanent)',
  'Group home (transitional)',
  'Build-to-rent',
  'Co-living',
  'Co-living housing',
  'Manufactured home',
  'Moveable dwelling',
  "Rural worker's dwelling",
  'Independent living units',
  'Manor house',
  'Medium Density Housing',
  'Non-standard Housing',
  'Residential Accommodation',
  'Manor houses'
]);

// Helper function to check if a development type is residential
const isResidentialType = (type) => {
  return RESIDENTIAL_TYPES.has(type);
};

/**
 * Creates a GeoJSON layer from development applications and adds it to the map
 * @param {Array} applications - Array of development application objects
 * @param {Object} selectedFeatures - Selected features from the map
 * @param {Function} setDevelopmentLayer - State setter for development layer ID
 * @param {Function} setError - State setter for error messages
 * @param {Function} setTotalFeatures - State setter for total features count
 * @returns {Promise<string|null>} - Layer ID if successful, null if failed
 */
export const createDevelopmentLayer = async (
  applications,
  selectedFeatures,
  setDevelopmentLayer,
  setError,
  setTotalFeatures
) => {
  // Safety check first
  if (!applications || !Array.isArray(applications) || applications.length === 0) {
    console.warn('No applications to display on map');
    setError('No applications to display on map.');
    return null;
  }

  console.log(`Processing ${applications.length} applications for map display`);
  
  // Create GeoJSON features with careful error handling
  const featuresWithCoordinates = applications
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
        
        const coordinates = [x, y];
        const status = app.ApplicationStatus || 'Unknown';
        const color = STATUS_COLORS[status] || STATUS_COLORS.default;
        
        // Check if this is a residential development
        const devType = app.DevelopmentType?.[0]?.DevelopmentType || 'Unknown';
        const transformedDevType = getTransformedDevelopmentType(app.DevelopmentType || []);
        const isResidential = app.DevelopmentType?.some(type => 
          isResidentialType(type.DevelopmentType)
        ) || false;
        
        // Return valid feature
        return {
          type: 'Feature',
          properties: {
            id: app.ApplicationId,
            title: app.DevelopmentDescription || 'Unknown',
            address: app.Location?.[0]?.FullAddress || 'Unknown location',
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
              `${lot.Lot}//${lot.PlanLabel}`).join('; ') : ''
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
    // Get council name for layer ID
    const councilName = selectedFeatures?.[0]?.properties?.copiedFrom?.site_suitability__LGA || 'Unknown';
    
    // Format current date in the "2 April 2025" format
    const currentDate = new Date();
    const day = currentDate.getDate();
    const month = currentDate.toLocaleString('en-US', { month: 'long' });
    const year = currentDate.getFullYear();
    const formattedDate = `${day} ${month} ${year}`;
    
    // Use a timestamp to create a unique layer identifier
    const timestamp = new Date().getTime();
    const layerId = `DA-${councilName.replace(/\s+/g, '-')}-${formattedDate.replace(/\s+/g, '-')}`;
    setDevelopmentLayer(layerId);
    
    // Create the feature collection with explicit initialization and deep copy to ensure valid structure
    const featureCollection = JSON.parse(JSON.stringify({
      type: 'FeatureCollection',
      features: featuresWithCoordinates
    }));
    
    console.log(`Creating GeoJSON layer with ${featuresWithCoordinates.length} development application points`);
    
    // Define layer style for points
    const layerStyle = {
      type: "circle",
      paint: {
        "circle-radius": ["case", ["get", "isResidential"], 8, 6],
        "circle-color": ["get", "fillColor"],
        "circle-stroke-width": ["case", ["get", "isResidential"], 3, 2],
        "circle-stroke-color": ["get", "outlineColor"]
      }
    };
    
    // Use the validateGeoJSON function to check if the feature collection is valid
    if (!validateGeoJSON(featureCollection, true)) {
      console.error('Feature collection failed validation');
      setError('Error creating GeoJSON layer: Feature collection validation failed');
      
      // Try to create a minimal valid feature collection
      const minimalFeatureCollection = {
        type: 'FeatureCollection',
        features: [{
          type: 'Feature',
          geometry: {
            type: 'Point',
            coordinates: [151.2093, -33.8688] // Sydney coordinates as fallback
          },
          properties: {
            name: 'Minimal Valid Point',
            fillColor: '#ff0000',
            outlineColor: '#000000',
            isResidential: true
          }
        }]
      };
      
      console.log('Using minimal valid feature collection instead');
      
      if (validateGeoJSON(minimalFeatureCollection, true)) {
        console.log('Minimal feature collection is valid, using that instead');
        
        // Create a direct, simple object to avoid any reference or serialization issues
        const response = await rpc.invoke('createGeoJSONLayer', [
          `DA - ${councilName} - ${formattedDate} (Minimal)`,
          {
            "type": "FeatureCollection",
            "features": [{
              "type": "Feature",
              "geometry": {
                "type": "Point",
                "coordinates": [151.2093, -33.8688]
              },
              "properties": {
                "name": "Minimal Point",
                "fillColor": "#ff0000",
                "outlineColor": "#000000"
              }
            }]
          },
          {
            description: "Minimal valid feature collection",
            style: {
              "type": "circle",
              "paint": {
                "circle-radius": 8,
                "circle-color": "#ff0000",
                "circle-stroke-width": 2,
                "circle-stroke-color": "#000000"
              }
            }
          }
        ]);
        
        console.log('Minimal layer created successfully with ID:', response);
        setDevelopmentLayer(response);
        setError('Warning: Using minimal layer due to validation failure. No applications displayed.');
        return response;
      }
      
      return null;
    }
    
    // Logging that validation passed
    console.log('GeoJSON validation passed successfully');
    
    // Ensure rpc is initialized
    if (!rpc || typeof rpc.invoke !== 'function') {
      console.error('RPC not initialized or invoke method not available');
      setError('Error creating GeoJSON layer: RPC not initialized');
      return null;
    }
    
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
    
    // Additional validation to ensure we have a valid feature collection
    if (!cleanFeatureCollection || !Array.isArray(cleanFeatureCollection.features) || cleanFeatureCollection.features.length === 0) {
      console.error('Invalid feature collection created:', cleanFeatureCollection);
      setError('Error creating GeoJSON layer: Invalid feature collection structure');
      return null;
    }
    
    // Log the exact object being passed to the SDK
    console.log('Calling createGeoJSONLayer with feature collection:', 
      JSON.stringify(cleanFeatureCollection).substring(0, 200) + '...');
    
    // Update to use createGeoJSONLayer instead of addTempLayerGeoJSON
    const layerMeta = {
      description: `Development Applications in ${councilName} - ${formattedDate}`,
      style: {
        type: "circle",
        paint: {
          "circle-radius": ["case", ["get", "isResidential"], 8, 6],
          "circle-color": ["get", "fillColor"],
          "circle-stroke-width": ["case", ["get", "isResidential"], 3, 2],
          "circle-stroke-color": ["get", "outlineColor"]
        }
      }
    };
    
    try {
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
              id: f.properties.id || '',
              title: f.properties.title || '',
              address: f.properties.address || '',
              status: f.properties.status || '',
              color: f.properties.color || '#666666',
              outlineColor: f.properties.outlineColor || '#666666',
              fillColor: f.properties.fillColor || '#666666',
              isResidential: !!f.properties.isResidential,
              developmentType: f.properties.developmentType || 'Unknown',
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
              Address: f.properties.Address || '',
              Lots: f.properties.Lots || ''
            }
          }))
      };
      
      // Check if we have features after filtering
      if (!simplifiedFeatureCollection.features || simplifiedFeatureCollection.features.length === 0) {
        console.error('No valid features after filtering');
        setError('Error creating GeoJSON layer: No valid features after filtering');
        return null;
      }
      
      // Convert to a JSON string and then parse back to ensure clean object
      const jsonString = JSON.stringify(simplifiedFeatureCollection);
      const cleanObject = JSON.parse(jsonString);
      
      // Add validation to ensure we have a valid object with features before calling RPC
      if (!cleanObject || !cleanObject.type || !Array.isArray(cleanObject.features)) {
        console.error('Invalid GeoJSON object after parsing:', cleanObject);
        setError('Error creating GeoJSON layer: Invalid or malformed GeoJSON object');
        return null;
      }

      // Log the exact object structure right before RPC call
      console.log('Final GeoJSON object structure:', 
        JSON.stringify({
          type: cleanObject.type,
          featuresCount: cleanObject.features.length
        }));
      
      // Now invoke the RPC method with the clean object
      const newLayerId = await rpc.invoke('createGeoJSONLayer', [
        `DA - ${councilName} - ${formattedDate}`,
        cleanObject,
        layerMeta
      ]);
      
      console.log('Successfully created GeoJSON development layer with ID:', newLayerId);
      setDevelopmentLayer(newLayerId);
      
      // Zoom to the features
      if (featuresWithCoordinates.length > 0) {
        try {
          const bounds = turf.bbox(featureCollection);
          
          // Validate bounds before using
          if (bounds && bounds.length === 4 && !bounds.some(coord => isNaN(coord))) {
            await rpc.invoke('fitBounds', 
              [
                [bounds[0], bounds[1]], // southwest corner [lng, lat]
                [bounds[2], bounds[3]]  // northeast corner [lng, lat]
              ],
              { top: 50, bottom: 50, left: 50, right: 50 }
            );
          } else {
            console.error('Invalid bounds calculated:', bounds);
          }
        } catch (error) {
          console.error('Error navigating map view:', error);
        }
      }
      
      return newLayerId;
    } catch (error) {
      console.error('Error adding development layer to map:', error);
      setError(`Error adding development layer to map: ${error.message}`);
      return null;
    }
  } catch (error) {
    console.error('Error adding development layer to map:', error);
    setError(`Error adding development layer to map: ${error.message}`);
    return null;
  }
};

/**
 * Filters and transforms development types according to the mapping in developmentTypes.js
 * Removes secondary development types and normalizes similar types
 * @param {Array} developmentTypes - Array of development type objects from API
 * @returns {string} - Transformed development type string
 */
export const getTransformedDevelopmentType = (developmentTypes) => {
  if (!developmentTypes || !Array.isArray(developmentTypes) || developmentTypes.length === 0) {
    return 'Not specified';
  }

  // Filter out secondary types and get normalized types
  const primaryTypes = developmentTypes
    .map(type => {
      const devType = type.DevelopmentType || '';
      const mapping = typeMap.get(devType);
      
      // If not in our mapping, just return as is
      if (!mapping) return { 
        type: devType, 
        isSecondary: false, 
        sortOrder: 1
      };
      
      return {
        type: mapping.newtype || devType,
        isSecondary: mapping.secondary === true,
        sortOrder: mapping.secondary ? 2 : 1  // Primary types first
      };
    })
    .filter(typeInfo => typeInfo.type && typeInfo.type.trim() !== '') // Remove empty types
    .sort((a, b) => a.sortOrder - b.sortOrder); // Sort primary first, then secondary

  // If we have any primary types, only return those
  const filteredTypes = primaryTypes.filter(typeInfo => !typeInfo.isSecondary);
  
  // If we have primary types, use those, otherwise use all types
  const typesToDisplay = filteredTypes.length > 0 ? filteredTypes : primaryTypes;
  
  // Extract just the type names and deduplicate
  const typeNames = [...new Set(typesToDisplay.map(typeInfo => typeInfo.type))];
  
  return typeNames.join(', ');
};

/**
 * Removes a development layer from the map
 * @param {string} developmentLayer - ID of the layer to remove
 * @returns {Promise<boolean>} - Success status
 */
export const removeDevelopmentLayer = async (developmentLayer) => {
  try {
    if (!developmentLayer) return false;
    
    console.log(`Removing development layer: ${developmentLayer}`);
    
    // Ensure rpc is initialized
    if (!rpc || typeof rpc.invoke !== 'function') {
      console.error('RPC not initialized or invoke method not available');
      return false;
    }
    
    await rpc.invoke('deleteLayer', developmentLayer);
    console.log(`Successfully removed development layer: ${developmentLayer}`);
    return true;
  } catch (error) {
    console.error(`Error removing development layer ${developmentLayer}:`, error);
    return false;
  }
}; 
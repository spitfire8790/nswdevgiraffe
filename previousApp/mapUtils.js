import { rpc } from '@gi-nx/iframe-sdk';

/**
 * Creates a drawing feature from a GeoJSON feature
 * @param {Object} selectedFeature - GeoJSON feature to convert to drawing
 * @param {Function} setNotification - Function to set notification state
 * @param {Function} setIsDrawing - Function to update drawing state
 * @returns {Promise<Object>} Result from the drawing operation
 */
export const createDrawingFromFeature = async (selectedFeature, setNotification, setIsDrawing) => {
  try {
    setIsDrawing(true);
    
    if (!selectedFeature) {
      setNotification({
        type: 'error',
        message: 'No developable area selected. Please select an area first.'
      });
      setIsDrawing(false);
      return null;
    }
    
    // Create a name for the drawing layer
    const drawingName = `Developable-Area-${Date.now()}`;
    
    // Add layerId to the properties
    const featureWithLayerId = {
      ...selectedFeature,
      properties: {
        ...selectedFeature.properties,
        layerId: drawingName,
        name: drawingName,
        description: 'Created from feasibility calculation',
        fillColor: '#00ff00',
        fillOpacity: 0.5,
        outlineColor: '#00aa00'
      }
    };
    
    // Truncate coordinates to 7 decimal places to avoid precision issues
    const truncatedFeature = {
      ...featureWithLayerId,
      geometry: {
        ...featureWithLayerId.geometry,
        coordinates: Array.isArray(featureWithLayerId.geometry.coordinates[0][0])
          ? featureWithLayerId.geometry.coordinates.map(ring => 
              ring.map(coord => [
                parseFloat(coord[0].toFixed(7)), 
                parseFloat(coord[1].toFixed(7))
              ])
            )
          : [featureWithLayerId.geometry.coordinates.map(coord => [
              parseFloat(coord[0].toFixed(7)), 
              parseFloat(coord[1].toFixed(7))
            ])]
      }
    };
    
    // Check to make sure serialized feature isn't too large
    const featureString = JSON.stringify(truncatedFeature);
    if (featureString.length >= 15000) {
      setNotification({
        type: 'error',
        message: 'Feature is too large to create as a drawing. Please select a smaller area.'
      });
      setIsDrawing(false);
      return null;
    }
    
    // Create the drawing feature using createRawSections
    const result = await rpc.invoke('createRawSections', [[truncatedFeature]]);
    
    setNotification({
      type: 'success',
      message: 'Drawing feature created successfully!'
    });
    
    return result;
  } catch (error) {
    console.error("Error creating drawing feature:", error);
    setNotification({
      type: 'error',
      message: 'Error creating drawing feature. Please try again.'
    });
    return null;
  } finally {
    setIsDrawing(false);
  }
};

/**
 * Creates a drawing feature with custom styling options
 * @param {Object} selectedFeature - GeoJSON feature to convert to drawing
 * @param {Object} styleOptions - Options for styling the feature
 * @param {Function} setNotification - Function to set notification state
 * @param {Function} setIsDrawing - Function to update drawing state
 * @returns {Promise<Object>} Result from the drawing operation
 */
export const createStyledDrawingFromFeature = async (
  selectedFeature, 
  styleOptions = {
    fillColor: '#00ff00',
    fillOpacity: 0.5,
    outlineColor: '#00aa00',
    namePrefix: 'Developable-Area',
    includeTimestamp: false
  },
  setNotification, 
  setIsDrawing
) => {
  try {
    setIsDrawing(true);
    
    if (!selectedFeature) {
      setNotification({
        type: 'error',
        message: 'No feature selected. Please select an area first.'
      });
      setIsDrawing(false);
      return null;
    }
    
    // Validate the feature has proper geometry
    if (!selectedFeature.geometry || !selectedFeature.geometry.coordinates) {
      setNotification({
        type: 'error',
        message: 'Invalid feature geometry. Missing coordinates.'
      });
      setIsDrawing(false);
      return null;
    }
    
    // Create a name for the drawing layer
    // Only append timestamp if includeTimestamp is true
    const drawingName = styleOptions.includeTimestamp 
      ? `${styleOptions.namePrefix || 'Drawing'}-${Date.now()}` 
      : `${styleOptions.namePrefix || 'Drawing'}`;
    
    // Add layerId and other required properties to the feature
    const featureWithLayerId = {
      ...selectedFeature,
      properties: {
        ...selectedFeature.properties,
        layerId: drawingName,
        name: drawingName,
        description: styleOptions.description || 'Created from application',
        fillColor: styleOptions.fillColor || '#00ff00',
        fillOpacity: styleOptions.fillOpacity || 0.5,
        outlineColor: styleOptions.outlineColor || '#00aa00',
        height: selectedFeature.properties?.height || 0,
        shiny: selectedFeature.properties?.shiny || true,
        // Add group property for later filtering if provided
        ...(styleOptions.group && { group: styleOptions.group })
      }
    };
    
    // Ensure the feature geometry type is properly set
    if (!featureWithLayerId.geometry.type) {
      // Default to Polygon if not specified
      featureWithLayerId.geometry.type = 'Polygon';
    }
    
    // Make sure coordinates are in the right format
    // Polygon coordinates should be an array of arrays of coordinates
    let processedCoordinates;
    
    if (featureWithLayerId.geometry.type === 'Polygon') {
      // Check if coordinates are properly structured for a Polygon
      if (!Array.isArray(featureWithLayerId.geometry.coordinates)) {
        setNotification({
          type: 'error',
          message: 'Invalid polygon coordinates. Expected array of coordinate arrays.'
        });
        setIsDrawing(false);
        return null;
      }
      
      // If first element is not an array, wrap it in an array
      if (!Array.isArray(featureWithLayerId.geometry.coordinates[0])) {
        processedCoordinates = [featureWithLayerId.geometry.coordinates];
      }
      // If first element is an array but second element is not, we have flat list of coordinates
      else if (featureWithLayerId.geometry.coordinates.length > 0 && 
               !Array.isArray(featureWithLayerId.geometry.coordinates[0][0])) {
        processedCoordinates = [featureWithLayerId.geometry.coordinates];
      } 
      // Coordinates are already properly structured
      else {
        processedCoordinates = featureWithLayerId.geometry.coordinates;
      }
      
      // Ensure polygon is closed (first point equals last point)
      for (let i = 0; i < processedCoordinates.length; i++) {
        const ring = processedCoordinates[i];
        if (ring.length > 0) {
          // If not closed, close it
          if (ring[0][0] !== ring[ring.length - 1][0] || ring[0][1] !== ring[ring.length - 1][1]) {
            ring.push([...ring[0]]);
          }
        }
      }
    } else {
      // For other geometry types, just use the original coordinates
      processedCoordinates = featureWithLayerId.geometry.coordinates;
    }
    
    // Truncate coordinates to 7 decimal places to avoid precision issues
    const truncatedCoordinates = Array.isArray(processedCoordinates[0][0])
      ? processedCoordinates.map(ring => 
          ring.map(coord => [
            parseFloat(coord[0].toFixed(7)), 
            parseFloat(coord[1].toFixed(7))
          ])
        )
      : [processedCoordinates.map(coord => [
          parseFloat(coord[0].toFixed(7)), 
          parseFloat(coord[1].toFixed(7))
        ])];
    
    const truncatedFeature = {
      ...featureWithLayerId,
      geometry: {
        ...featureWithLayerId.geometry,
        coordinates: truncatedCoordinates
      }
    };
    
    // Check to make sure serialized feature isn't too large
    const featureString = JSON.stringify(truncatedFeature);
    console.log(`Feature string length: ${featureString.length} bytes`);
    
    if (featureString.length >= 15000) {
      setNotification({
        type: 'error',
        message: 'Feature is too large to create as a drawing. Please select a smaller area.'
      });
      setIsDrawing(false);
      return null;
    }
    
    console.log('Creating drawing with feature:', truncatedFeature);
    
    // Use a direct feature object approach that works with Giraffe
    const featureForGiraffe = {
      type: "Feature",
      properties: {
        name: drawingName,
        description: truncatedFeature.properties.description,
        layerId: drawingName,
        fillColor: truncatedFeature.properties.fillColor,
        fillOpacity: truncatedFeature.properties.fillOpacity,
        outlineColor: truncatedFeature.properties.outlineColor,
        height: truncatedFeature.properties.height || 0,
        shiny: truncatedFeature.properties.shiny || true,
        is3D: truncatedFeature.properties.is3D || false,
        extrude: truncatedFeature.properties.extrude || false,
        extrudeHeight: truncatedFeature.properties.extrudeHeight || truncatedFeature.properties.height || 0,
        // Include custom groupTag in the name if needed for filtering later
        ...(truncatedFeature.properties.group && { 
          name: `${drawingName}-${truncatedFeature.properties.group}` 
        }),
        // Include any additional custom properties
        ...truncatedFeature.properties
      },
      geometry: {
        type: "Polygon",
        coordinates: truncatedFeature.geometry.coordinates
      }
    };
    
    console.log('Sending feature to Giraffe:', featureForGiraffe);
    
    // Try both approaches to ensure compatibility with the SDK
    let result;
    
    try {
      // First try direct createRawSections call
      result = await rpc.invoke('createRawSections', [[featureForGiraffe]]);
      console.log('Created drawing using createRawSections:', result);
    } catch (rpcError) {
      console.error('Failed with createRawSections, trying alternative method:', rpcError);
      
      // Try the legacy createDrawing approach as fallback
      try {
        result = await rpc.invoke('createDrawing', {
          features: [featureForGiraffe]
        });
        console.log('Created drawing using createDrawing:', result);
      } catch (legacyError) {
        console.error('Failed with legacy method too:', legacyError);
        throw new Error(`Failed to create drawing: ${legacyError.message}`);
      }
    }
    
    setNotification({
      type: 'success',
      message: 'Drawing feature created successfully!'
    });
    
    return result;
  } catch (error) {
    console.error("Error creating drawing feature:", error);
    setNotification({
      type: 'error',
      message: `Error creating drawing feature: ${error.message}`
    });
    return null;
  } finally {
    setIsDrawing(false);
  }
};

/**
 * Validates a GeoJSON object to ensure it conforms to the GeoJSON specification.
 * 
 * @param {Object} geojson - The GeoJSON object to validate
 * @param {boolean} [logErrors=false] - Whether to log validation errors to console
 * @returns {boolean} True if the GeoJSON is valid, false otherwise
 */
export const validateGeoJSON = (geojson, logErrors = false) => {
  const logError = (message) => {
    if (logErrors) {
      console.error(`GeoJSON validation error: ${message}`, geojson);
    }
    return false;
  };

  // Check if geojson is defined and is an object
  if (!geojson || typeof geojson !== 'object') {
    return logError('GeoJSON is undefined or not an object');
  }

  // For FeatureCollection
  if (geojson.type === 'FeatureCollection') {
    // Must have features property as an array
    if (!geojson.features) {
      return logError('FeatureCollection missing features property');
    }
    
    if (!Array.isArray(geojson.features)) {
      return logError('FeatureCollection features property is not an array');
    }
    
    // Validate each feature in the collection
    for (let i = 0; i < geojson.features.length; i++) {
      const feature = geojson.features[i];
      
      // Each feature must be valid
      if (!validateGeoJSONFeature(feature, logErrors)) {
        return logError(`Invalid feature at index ${i}`);
      }
    }
    
    return true;
  }
  
  // For Feature
  if (geojson.type === 'Feature') {
    return validateGeoJSONFeature(geojson, logErrors);
  }
  
  // For direct geometry objects
  if (['Point', 'LineString', 'Polygon', 'MultiPoint', 'MultiLineString', 'MultiPolygon', 'GeometryCollection'].includes(geojson.type)) {
    return validateGeoJSONGeometry(geojson, logErrors);
  }
  
  return logError(`Invalid GeoJSON type: ${geojson.type}`);
};

/**
 * Validates a GeoJSON Feature object.
 * 
 * @param {Object} feature - The Feature object to validate
 * @param {boolean} [logErrors=false] - Whether to log validation errors to console
 * @returns {boolean} True if the Feature is valid, false otherwise
 */
const validateGeoJSONFeature = (feature, logErrors = false) => {
  const logError = (message) => {
    if (logErrors) {
      console.error(`Feature validation error: ${message}`, feature);
    }
    return false;
  };

  // Check if feature is defined and is an object
  if (!feature || typeof feature !== 'object') {
    return logError('Feature is undefined or not an object');
  }
  
  // Must be of type Feature
  if (feature.type !== 'Feature') {
    return logError(`Invalid feature type: ${feature.type}`);
  }
  
  // Must have geometry property
  if (!feature.geometry) {
    return logError('Feature missing geometry property');
  }
  
  // Geometry must be valid
  if (!validateGeoJSONGeometry(feature.geometry, logErrors)) {
    return logError('Feature has invalid geometry');
  }
  
  // Must have properties as an object (or null)
  if (feature.properties !== undefined && feature.properties !== null && typeof feature.properties !== 'object') {
    return logError('Feature properties must be an object or null');
  }
  
  return true;
};

/**
 * Validates a GeoJSON Geometry object.
 * 
 * @param {Object} geometry - The Geometry object to validate
 * @param {boolean} [logErrors=false] - Whether to log validation errors to console
 * @returns {boolean} True if the Geometry is valid, false otherwise
 */
const validateGeoJSONGeometry = (geometry, logErrors = false) => {
  const logError = (message) => {
    if (logErrors) {
      console.error(`Geometry validation error: ${message}`, geometry);
    }
    return false;
  };

  // Check if geometry is defined and is an object
  if (!geometry || typeof geometry !== 'object') {
    return logError('Geometry is undefined or not an object');
  }
  
  // Must have a valid type
  const validTypes = ['Point', 'LineString', 'Polygon', 'MultiPoint', 'MultiLineString', 'MultiPolygon', 'GeometryCollection'];
  if (!validTypes.includes(geometry.type)) {
    return logError(`Invalid geometry type: ${geometry.type}`);
  }
  
  // GeometryCollection requires geometries array
  if (geometry.type === 'GeometryCollection') {
    if (!Array.isArray(geometry.geometries)) {
      return logError('GeometryCollection missing geometries array property');
    }
    
    for (let i = 0; i < geometry.geometries.length; i++) {
      if (!validateGeoJSONGeometry(geometry.geometries[i], logErrors)) {
        return logError(`Invalid geometry at index ${i} in GeometryCollection`);
      }
    }
    
    return true;
  }
  
  // All other geometry types require coordinates
  if (!geometry.coordinates) {
    return logError(`${geometry.type} missing coordinates property`);
  }
  
  // Coordinates validation depends on the geometry type
  switch (geometry.type) {
    case 'Point':
      // Point coordinates must be an array of numbers with length >= 2
      if (!Array.isArray(geometry.coordinates) || geometry.coordinates.length < 2) {
        return logError('Point coordinates must be an array of at least 2 numbers');
      }
      if (!geometry.coordinates.every(coord => typeof coord === 'number' && !isNaN(coord))) {
        return logError('Point coordinates must all be numbers');
      }
      break;
      
    case 'LineString':
    case 'MultiPoint':
      // Must be an array of positions (arrays of numbers)
      if (!Array.isArray(geometry.coordinates) || geometry.coordinates.length < 2) {
        return logError(`${geometry.type} coordinates must be an array with at least 2 positions`);
      }
      if (!geometry.coordinates.every(pos => 
        Array.isArray(pos) && pos.length >= 2 && pos.every(coord => typeof coord === 'number' && !isNaN(coord))
      )) {
        return logError(`${geometry.type} coordinates must be arrays of numbers`);
      }
      break;
      
    case 'Polygon':
    case 'MultiLineString':
      // Must be an array of LineStrings
      if (!Array.isArray(geometry.coordinates) || geometry.coordinates.length < 1) {
        return logError(`${geometry.type} coordinates must be an array with at least 1 LineString`);
      }
      if (!geometry.coordinates.every(line => 
        Array.isArray(line) && line.length >= 2 && 
        line.every(pos => Array.isArray(pos) && pos.length >= 2 && pos.every(coord => typeof coord === 'number' && !isNaN(coord)))
      )) {
        return logError(`${geometry.type} coordinates invalid structure`);
      }
      break;
      
    case 'MultiPolygon':
      // Must be an array of Polygons
      if (!Array.isArray(geometry.coordinates) || geometry.coordinates.length < 1) {
        return logError('MultiPolygon coordinates must be an array with at least 1 Polygon');
      }
      if (!geometry.coordinates.every(polygon => 
        Array.isArray(polygon) && polygon.length >= 1 && 
        polygon.every(line => 
          Array.isArray(line) && line.length >= 4 && // Polygon rings must have at least 4 positions (to close)
          line.every(pos => Array.isArray(pos) && pos.length >= 2 && pos.every(coord => typeof coord === 'number' && !isNaN(coord)))
        )
      )) {
        return logError('MultiPolygon coordinates invalid structure');
      }
      break;
      
    default:
      return logError(`Unknown geometry type: ${geometry.type}`);
  }
  
  return true;
}; 
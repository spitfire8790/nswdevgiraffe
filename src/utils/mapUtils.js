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
  
  // Properties should be an object if defined
  if (feature.properties !== undefined && (feature.properties === null || typeof feature.properties !== 'object')) {
    return logError('Feature properties is not an object');
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
  
  // Must have type property
  if (!geometry.type) {
    return logError('Geometry missing type property');
  }
  
  // Type must be valid
  const validTypes = ['Point', 'LineString', 'Polygon', 'MultiPoint', 'MultiLineString', 'MultiPolygon', 'GeometryCollection'];
  if (!validTypes.includes(geometry.type)) {
    return logError(`Invalid geometry type: ${geometry.type}`);
  }
  
  // For GeometryCollection
  if (geometry.type === 'GeometryCollection') {
    if (!geometry.geometries) {
      return logError('GeometryCollection missing geometries property');
    }
    
    if (!Array.isArray(geometry.geometries)) {
      return logError('GeometryCollection geometries property is not an array');
    }
    
    // Validate each geometry in the collection
    for (let i = 0; i < geometry.geometries.length; i++) {
      if (!validateGeoJSONGeometry(geometry.geometries[i], logErrors)) {
        return logError(`Invalid geometry at index ${i}`);
      }
    }
    
    return true;
  }
  
  // For all other geometry types
  if (!geometry.coordinates) {
    return logError('Geometry missing coordinates property');
  }
  
  // Check coordinates based on geometry type
  switch (geometry.type) {
    case 'Point':
      if (!Array.isArray(geometry.coordinates) || geometry.coordinates.length < 2) {
        return logError('Point coordinates must be an array of at least 2 numbers');
      }
      break;
      
    case 'LineString':
      if (!Array.isArray(geometry.coordinates) || geometry.coordinates.length < 2) {
        return logError('LineString coordinates must be an array of at least 2 positions');
      }
      break;
      
    case 'Polygon':
      if (!Array.isArray(geometry.coordinates) || geometry.coordinates.length < 1) {
        return logError('Polygon coordinates must be an array of linear rings');
      }
      break;
      
    case 'MultiPoint':
      if (!Array.isArray(geometry.coordinates)) {
        return logError('MultiPoint coordinates must be an array of positions');
      }
      break;
      
    case 'MultiLineString':
      if (!Array.isArray(geometry.coordinates)) {
        return logError('MultiLineString coordinates must be an array of line string coordinate arrays');
      }
      break;
      
    case 'MultiPolygon':
      if (!Array.isArray(geometry.coordinates)) {
        return logError('MultiPolygon coordinates must be an array of polygon coordinate arrays');
      }
      break;
  }
  
  return true;
}; 
/**
 * Service to interact with ArcGIS REST APIs
 */

const LGA_MAPSERVER_URL = 'https://maps.six.nsw.gov.au/arcgis/rest/services/public/NSW_Administrative_Boundaries/MapServer/1';

// Cache for LGA boundaries to avoid duplicate fetches
const lgaBoundaryCache = new Map();

/**
 * Converts a Web Mercator (EPSG:3857) coordinate to WGS84 (EPSG:4326)
 * @param {number} x - The x coordinate in Web Mercator
 * @param {number} y - The y coordinate in Web Mercator
 * @returns {Array} [longitude, latitude] in WGS84
 */
const webMercatorToWgs84 = (x, y) => {
  // Constants for conversion
  const EARTH_RADIUS = 6378137.0; // Earth's radius in meters
  const EPSILON = 1.0e-14;
  
  // Convert x coordinate
  const longitude = (x / EARTH_RADIUS) * (180 / Math.PI);
  
  // Convert y coordinate
  let latitude = (y / EARTH_RADIUS) * (180 / Math.PI);
  latitude = (Math.PI / 2) - 2 * Math.atan(Math.exp(-latitude * Math.PI / 180));
  latitude = latitude * 180 / Math.PI;
  
  return [longitude, latitude];
};

/**
 * Processes GeoJSON to convert coordinates from Web Mercator to WGS84
 * @param {Object} geojson - The GeoJSON to process
 * @returns {Object} The processed GeoJSON with coordinates in WGS84
 */
const processGeoJson = (geojson) => {
  if (!geojson || !geojson.features || !geojson.features.length) {
    return geojson;
  }
  
  // Clone the GeoJSON to avoid modifying the original
  const processedGeoJson = JSON.parse(JSON.stringify(geojson));
  
  // Process each feature
  processedGeoJson.features.forEach(feature => {
    if (!feature.geometry || !feature.geometry.coordinates) return;
    
    if (feature.geometry.type === 'Polygon') {
      feature.geometry.coordinates.forEach((ring, ringIndex) => {
        feature.geometry.coordinates[ringIndex] = ring.map(coord => 
          webMercatorToWgs84(coord[0], coord[1])
        );
      });
    } else if (feature.geometry.type === 'MultiPolygon') {
      feature.geometry.coordinates.forEach((polygon, polygonIndex) => {
        polygon.forEach((ring, ringIndex) => {
          feature.geometry.coordinates[polygonIndex][ringIndex] = ring.map(coord => 
            webMercatorToWgs84(coord[0], coord[1])
          );
        });
      });
    }
  });
  
  return processedGeoJson;
};

/**
 * Fetches LGA boundary as GeoJSON based on LGA name
 * @param {string} lgaName - The name of the Local Government Area
 * @returns {Promise<Object>} GeoJSON feature representing the LGA boundary
 */
export const fetchLgaBoundary = async (lgaName) => {
  try {
    // Check cache first
    if (lgaBoundaryCache.has(lgaName)) {
      console.log(`Using cached boundary data for LGA: ${lgaName}`);
      return lgaBoundaryCache.get(lgaName);
    }
    
    // Build query URL with parameters
    const url = new URL(`${LGA_MAPSERVER_URL}/query`);
    const params = {
      where: `lganame='${lgaName}'`,
      outFields: 'lganame,councilname',  // Limit fields to only what's needed
      returnGeometry: true,
      f: 'geojson'
    };
    
    Object.keys(params).forEach(key => url.searchParams.append(key, params[key]));
    
    console.time('fetchLgaBoundary');
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch LGA boundary: ${response.statusText}`);
    }
    
    const data = await response.json();
    console.timeEnd('fetchLgaBoundary');
    
    // If no features found, try with councilname as fallback
    if (!data.features || data.features.length === 0) {
      const fallbackUrl = new URL(`${LGA_MAPSERVER_URL}/query`);
      const fallbackParams = {
        where: `councilname='${lgaName}'`,
        outFields: 'lganame,councilname',  // Limit fields to only what's needed
        returnGeometry: true,
        f: 'geojson'
      };
      
      Object.keys(fallbackParams).forEach(key => fallbackUrl.searchParams.append(key, fallbackParams[key]));
      
      console.time('fetchLgaBoundaryFallback');
      const fallbackResponse = await fetch(fallbackUrl);
      
      if (!fallbackResponse.ok) {
        throw new Error(`Failed to fetch LGA boundary using councilname: ${fallbackResponse.statusText}`);
      }
      
      const fallbackData = await fallbackResponse.json();
      console.timeEnd('fetchLgaBoundaryFallback');
      
      // Cache and return the fallback data
      lgaBoundaryCache.set(lgaName, fallbackData);
      return fallbackData;
    }
    
    // Cache and return the data
    lgaBoundaryCache.set(lgaName, data);
    return data;
  } catch (error) {
    console.error('Error fetching LGA boundary:', error);
    throw error;
  }
}; 
/**
 * Utilities for interacting with ArcGIS services
 */

/**
 * Queries the LGA (Local Government Area) name from a set of coordinates
 * @param {number} longitude - Longitude in WGS84 format
 * @param {number} latitude - Latitude in WGS84 format
 * @returns {Promise<string|null>} The LGA name or null if not found
 */
export const queryLgaFromCoordinates = async (longitude, latitude) => {
  try {
    // Convert from WGS84 (EPSG:4326) to Web Mercator (EPSG:3857/102100)
    // The ArcGIS REST service uses Web Mercator
    // Simple conversion formula (approximate)
    const x = longitude * 20037508.34 / 180;
    const y = Math.log(Math.tan((90 + latitude) * Math.PI / 360)) / (Math.PI / 180);
    const mercatorY = y * 20037508.34 / 180;
    
    // Construct the query URL for the ArcGIS REST service
    const serviceUrl = 'https://maps.six.nsw.gov.au/arcgis/rest/services/public/NSW_Administrative_Boundaries/MapServer/1/query';
    const params = new URLSearchParams({
      geometry: `${x},${mercatorY}`,
      geometryType: 'esriGeometryPoint',
      inSR: '102100',
      outSR: '102100',
      spatialRel: 'esriSpatialRelIntersects',
      outFields: 'lganame,councilname',
      returnGeometry: 'false',
      f: 'json'
    });
    
    // Use a proxy service to avoid CORS issues
    const proxyUrl = process.env.NODE_ENV === 'development' 
      ? 'http://localhost:3000/api/proxy'
      : 'https://proxy-server.jameswilliamstrutt.workers.dev';
    
    const response = await fetch(proxyUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        url: `${serviceUrl}?${params.toString()}`,
        method: 'GET'
      })
    });
    
    if (!response.ok) {
      throw new Error(`ArcGIS REST service responded with status: ${response.status}`);
    }
    
    const data = await response.json();
    
    if (data.error) {
      throw new Error(`ArcGIS REST service error: ${data.error.message || JSON.stringify(data.error)}`);
    }
    
    if (!data.features || data.features.length === 0) {
      console.log('No LGA found at these coordinates');
      return null;
    }
    
    // Return the LGA name from the first feature
    return data.features[0].attributes.lganame;
  } catch (error) {
    console.error('Error querying LGA from coordinates:', error);
    return null;
  }
};

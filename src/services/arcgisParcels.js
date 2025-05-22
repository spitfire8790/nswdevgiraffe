/**
 * Service to query the ArcGIS REST endpoint for parcel polygons by lotidstring.
 * @module arcgisParcels
 */

/**
 * Fetches parcel polygons from the ArcGIS REST endpoint for the given lotidstrings.
 * Uses POST requests to avoid URL length limits. Batch size is 1000 (endpoint MaxRecordCount).
 * Adds detailed logging for each batch sent and completed.
 * @param {string[]} lotIdStrings - Array of lotidstrings (e.g., ['1//DP120096', ...])
 * @param {function} onBatchComplete - Callback function to be called after each batch completes
 * @returns {Promise<Object>} GeoJSON FeatureCollection of matching polygons
 */
export async function fetchParcelsByLotIdStrings(lotIdStrings, onBatchComplete) {
  if (!Array.isArray(lotIdStrings) || lotIdStrings.length === 0) {
    console.log('[ArcGIS] No lotIdStrings provided.');
    return { type: 'FeatureCollection', features: [] };
  }

  // ArcGIS endpoint details
  const endpoint = 'https://maps.six.nsw.gov.au/arcgis/rest/services/public/NSW_Cadastre/Mapserver/9/query';
  const maxBatchSize = 100;
  // Helper to escape single quotes for SQL
  const escape = s => s.replace(/'/g, "''");

  const totalBatches = Math.ceil(lotIdStrings.length / maxBatchSize);
  console.log(`[ArcGIS] Fetching parcels for ${lotIdStrings.length} lots in ${totalBatches} batch(es).`);

  // Build all batch requests
  const batchPromises = [];
  for (let i = 0; i < lotIdStrings.length; i += maxBatchSize) {
    const batch = lotIdStrings.slice(i, i + maxBatchSize);
    const where = batch.map(lot => `lotidstring='${escape(lot.trim())}'`).join(' OR ');
    const params = new URLSearchParams({
      where,
      outFields: '*',
      f: 'geojson',
      returnGeometry: 'true',
      spatialRel: 'esriSpatialRelIntersects',
    });
    const url = endpoint;
    const batchNum = Math.floor(i / maxBatchSize) + 1;
    console.log(`[ArcGIS] Sending batch ${batchNum}/${totalBatches} (${batch.length} lots)`);
    batchPromises.push(
      fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: params.toString(),
      })
        .then(response => {
          if (!response.ok) {
            console.error(`[ArcGIS] Batch ${batchNum} failed: ${response.status}`);
            return null;
          }
          return response.json();
        })
        .then(geojson => {
          console.log(`[ArcGIS] Batch ${batchNum} complete`);
          if (onBatchComplete) onBatchComplete(batchNum, totalBatches);
          return geojson;
        })
        .catch(err => {
          console.error(`[ArcGIS] Error in batch ${batchNum}:`, err);
          if (onBatchComplete) onBatchComplete(batchNum, totalBatches);
          return null;
        })
    );
  }

  // Await all batches in parallel
  const results = await Promise.all(batchPromises);
  const features = results.flatMap(geojson => geojson?.features || []);

  console.log(`[ArcGIS] All batches complete. Total features: ${features.length}`);
  return { type: 'FeatureCollection', features };
}

/**
 * Fetches a parcel polygon from the ArcGIS REST endpoint that intersects the given point (EPSG:4326).
 * @param {number} x - Longitude
 * @param {number} y - Latitude
 * @returns {Promise<Object|null>} The first intersecting parcel feature, or null if none found
 */
export async function fetchParcelByPoint(x, y) {
  const endpoint = 'https://maps.six.nsw.gov.au/arcgis/rest/services/public/NSW_Cadastre/Mapserver/9/query';
  const params = new URLSearchParams({
    geometry: `${x},${y}`,
    geometryType: 'esriGeometryPoint',
    spatialRel: 'esriSpatialRelIntersects',
    outFields: '*',
    returnGeometry: 'true',
    f: 'geojson',
    inSR: '4326',
  });
  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: params.toString(),
    });
    if (!response.ok) return null;
    const geojson = await response.json();
    return geojson.features && geojson.features.length > 0 ? geojson.features[0] : null;
  } catch (err) {
    console.error('[ArcGIS] Error fetching parcel by point:', err);
    return null;
  }
} 
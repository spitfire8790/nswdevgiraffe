/**
 * Service to query the ArcGIS REST endpoint for parcel polygons by lotidstring.
 * @module arcgisParcels
 */

/**
 * Fetches parcel polygons from the ArcGIS REST endpoint for the given lotidstrings.
 * Uses POST requests to avoid URL length limits. Optimised for performance with limited concurrency.
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

  // Log input data for debugging
  console.log(`[ArcGIS] Input lotIdStrings (first 10):`, lotIdStrings.slice(0, 10));
  console.log(`[ArcGIS] Total unique lot ID strings:`, lotIdStrings.length);

  // Validate lot ID strings
  const invalidLots = lotIdStrings.filter(lot => !lot || typeof lot !== 'string' || lot.trim() === '');
  if (invalidLots.length > 0) {
    console.warn(`[ArcGIS] Found ${invalidLots.length} invalid lot ID strings:`, invalidLots.slice(0, 5));
  }

  // ArcGIS endpoint details - optimised for performance
  const endpoint = 'https://maps.six.nsw.gov.au/arcgis/rest/services/public/NSW_Cadastre/Mapserver/9/query';
  const maxBatchSize = 75; // Increased for better performance
  const maxRetries = 2;
  const delayBetweenBatches = 100; // Reduced delay
  const maxConcurrentBatches = 3; // Limited concurrency to avoid overwhelming server
  
  // Helper to escape single quotes for SQL
  const escape = s => s.replace(/'/g, "''");
  
  // Helper to add delay
  const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

  const totalBatches = Math.ceil(lotIdStrings.length / maxBatchSize);
  console.log(`[ArcGIS] Fetching parcels for ${lotIdStrings.length} lots in ${totalBatches} batch(es) with max batch size ${maxBatchSize}.`);
  console.log(`[ArcGIS] Using ${delayBetweenBatches}ms delay, max ${maxConcurrentBatches} concurrent batches, and up to ${maxRetries} retries per batch.`);

  // Function to make a single batch request with retries
  async function makeBatchRequest(batch, batchNum, attempt = 1) {
    const cleanBatch = batch.filter(lot => lot && typeof lot === 'string' && lot.trim() !== '');
    
    if (cleanBatch.length === 0) {
      console.warn(`[ArcGIS] Batch ${batchNum} has no valid lot ID strings, skipping.`);
      return { batchNum, error: false, geojson: { features: [] } };
    }

    const where = cleanBatch.map(lot => `lotidstring='${escape(lot.trim())}'`).join(' OR ');
    const params = new URLSearchParams({
      where,
      outFields: '*',
      f: 'geojson',
      returnGeometry: 'true',
      spatialRel: 'esriSpatialRelIntersects',
    });
    
    console.log(`[ArcGIS] Batch ${batchNum}/${totalBatches} (attempt ${attempt}): ${cleanBatch.length} lots, ${params.toString().length} bytes`);
    
    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: params.toString(),
      });
      
      console.log(`[ArcGIS] Batch ${batchNum} (attempt ${attempt}) response: ${response.status}`);
      
      if (!response.ok) {
        // Try to get error details from response body for 500 errors
        let errorDetails = '';
        if (response.status >= 500) {
          try {
            const errorText = await response.text();
            errorDetails = errorText.substring(0, 200);
            console.error(`[ArcGIS] Batch ${batchNum} (attempt ${attempt}) server error:`, errorDetails);
          } catch (bodyErr) {
            console.error(`[ArcGIS] Batch ${batchNum} (attempt ${attempt}) couldn't read error response`);
          }
        }
        
        // Retry logic for server errors
        if (attempt < maxRetries && response.status >= 500) {
          const retryDelay = delayBetweenBatches * attempt; // Increasing delay
          console.warn(`[ArcGIS] Batch ${batchNum} failed with ${response.status}, retrying in ${retryDelay}ms`);
          await delay(retryDelay);
          return await makeBatchRequest(batch, batchNum, attempt + 1);
        }
        
        console.error(`[ArcGIS] Batch ${batchNum} failed after ${attempt} attempt(s): ${response.status}`);
        return { batchNum, error: true, status: response.status, errorDetails, attempt };
      }
      
      const geojson = await response.json();
      console.log(`[ArcGIS] Batch ${batchNum} (attempt ${attempt}) successful - ${geojson?.features?.length || 0} features`);
      
      return { batchNum, geojson, error: false, attempt };
      
    } catch (err) {
      console.error(`[ArcGIS] Network error in batch ${batchNum} (attempt ${attempt}):`, err.message);
      
      // Retry for network errors
      if (attempt < maxRetries) {
        const retryDelay = delayBetweenBatches * attempt;
        console.warn(`[ArcGIS] Batch ${batchNum} network error, retrying in ${retryDelay}ms`);
        await delay(retryDelay);
        return await makeBatchRequest(batch, batchNum, attempt + 1);
      }
      
      console.error(`[ArcGIS] Batch ${batchNum} failed after ${attempt} network attempts`);
      return { batchNum, error: true, networkError: true, errorMessage: err.message, attempt };
    }
  }

  // Process batches with limited concurrency
  const results = [];
  const batches = [];
  
  // Create all batch definitions
  for (let i = 0; i < lotIdStrings.length; i += maxBatchSize) {
    const batch = lotIdStrings.slice(i, i + maxBatchSize);
    const batchNum = Math.floor(i / maxBatchSize) + 1;
    batches.push({ batch, batchNum });
  }

  console.log(`[ArcGIS] Processing ${batches.length} batches with max ${maxConcurrentBatches} concurrent requests...`);

  // Process batches in chunks to limit concurrency
  for (let i = 0; i < batches.length; i += maxConcurrentBatches) {
    const currentChunk = batches.slice(i, i + maxConcurrentBatches);
    
    // Process current chunk in parallel
    const chunkPromises = currentChunk.map(({ batch, batchNum }) => 
      makeBatchRequest(batch, batchNum)
    );
    
    const chunkResults = await Promise.all(chunkPromises);
    results.push(...chunkResults);
    
    // Update progress and log results
    chunkResults.forEach(result => {
      if (result.error) {
        console.error(`[ArcGIS] Batch ${result.batchNum} completed with error`);
      } else {
        console.log(`[ArcGIS] Batch ${result.batchNum} completed successfully`);
      }
      
      if (onBatchComplete) onBatchComplete(result.batchNum, totalBatches);
    });
    
    // Add delay before next chunk (except for the last one)
    if (i + maxConcurrentBatches < batches.length) {
      await delay(delayBetweenBatches);
    }
  }
  
  // Analyse results
  const successfulBatches = results.filter(r => r && !r.error);
  const failedBatches = results.filter(r => r && r.error);
  const features = results.flatMap(result => result?.geojson?.features || []);

  console.log(`[ArcGIS] Batch processing complete:`);
  console.log(`  - Successful batches: ${successfulBatches.length}/${results.length}`);
  console.log(`  - Failed batches: ${failedBatches.length}/${results.length}`);
  console.log(`  - Total features retrieved: ${features.length}`);
  
  if (failedBatches.length > 0) {
    console.warn(`[ArcGIS] Failed batches:`, failedBatches.map(b => `Batch ${b.batchNum} (${b.status || 'network error'})`));
  }

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
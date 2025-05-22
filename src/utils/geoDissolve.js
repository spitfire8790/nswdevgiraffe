import * as turf from '@turf/turf';

/**
 * Dissolves (unions) adjacent polygons in a GeoJSON FeatureCollection into a single polygon feature.
 * @param {Object} featureCollection - GeoJSON FeatureCollection of polygons
 * @returns {Object|null} A single dissolved polygon feature, or null if no features
 */
export function dissolvePolygons(featureCollection) {
  if (!featureCollection || !Array.isArray(featureCollection.features) || featureCollection.features.length === 0) {
    return null;
  }
  if (featureCollection.features.length === 1) {
    return featureCollection.features[0];
  }
  // Use turf.union iteratively
  let dissolved = featureCollection.features[0];
  for (let i = 1; i < featureCollection.features.length; i++) {
    try {
      dissolved = turf.union(dissolved, featureCollection.features[i]);
    } catch (err) {
      console.error('Error dissolving polygons:', err);
    }
  }
  return dissolved;
} 
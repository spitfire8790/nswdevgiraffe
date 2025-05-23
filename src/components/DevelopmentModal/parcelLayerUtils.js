import { fetchParcelsByLotIdStrings, fetchParcelByPoint } from '../../services/arcgisParcels';
import { dissolvePolygons } from '../../utils/geoDissolve';
import { rpc } from '@gi-nx/iframe-sdk';
import { validateGeoJSON } from '../../utils/mapUtils';
import { RESIDENTIAL_TYPES } from './residentialTypes';
import { getTransformedDevelopmentType } from './mapLayerUtils';
import { getDevelopmentCategory } from './developmentTypes';

/**
 * Orchestrates the creation of a parcel layer for DAs by querying ArcGIS for lot polygons and adding them to the map.
 * Falls back to DA points if no polygons are found.
 * @param {Object} params
 * @param {Array} params.applications - Array of DA objects
 * @param {Array} params.selectedFeatures - Array of selected map features (for LGA)
 * @param {Function} params.setParcelLayer - Setter for the new layer name
 * @param {Function} params.setError - Setter for error messages
 * @param {Function} params.setTotalFeatures - Setter for total features (progress)
 * @param {Function} params.setProcessedFeatures - Setter for processed features (progress)
 * @param {Function} params.setParcelBatchProgress - Setter for parcel batch progress
 * @param {Object} params.floorHeightsByCategory - Object containing floor heights for each category
 * @returns {Promise<string|null>} The layer name if successful, or null
 */
export async function createParcelLayer({ applications, selectedFeatures, setParcelLayer, setError, setTotalFeatures, setProcessedFeatures, setParcelBatchProgress, floorHeightsByCategory = {} }) {
  console.log('[Parcel Layer] Starting parcel layer creation process');
  console.log(`[Parcel Layer] Input applications count: ${applications?.length || 0}`);
  
  if (!applications || !Array.isArray(applications) || applications.length === 0) {
    console.error('[Parcel Layer] No applications provided or empty array');
    setError('No applications to display parcels for.');
    return null;
  }

  // Log application structure for debugging
  console.log('[Parcel Layer] Sample application structure (first app):', {
    ApplicationId: applications[0]?.ApplicationId,
    Location: applications[0]?.Location,
    LotCount: applications[0]?.Location?.[0]?.Lot?.length || 0,
    hasValidLocation: !!(applications[0]?.Location?.[0]?.Lot?.length > 0)
  });

  // 1. Extract all unique lotidstrings and build a map from lotidstring to primary DA
  console.log('[Parcel Layer] Step 1: Extracting lot ID strings from applications');
  const lotToPrimaryDA = {};
  let totalLotsProcessed = 0;
  let applicationsWithLots = 0;
  let applicationsWithoutLots = 0;

  applications.forEach((app, index) => {
    const lots = app.Location?.[0]?.Lot || [];
    if (lots.length === 0) {
      applicationsWithoutLots++;
      console.warn(`[Parcel Layer] Application ${app.ApplicationId || index} has no lots`);
    } else {
      applicationsWithLots++;
    }
    
    lots.forEach(lot => {
      totalLotsProcessed++;
      const lotidstring = `${lot.Lot}//${lot.PlanLabel}`;
      
      // Validate lot data
      if (!lot.Lot || !lot.PlanLabel) {
        console.warn(`[Parcel Layer] Invalid lot data in application ${app.ApplicationId}:`, lot);
        return;
      }
      
      if (!lotToPrimaryDA[lotidstring]) {
        lotToPrimaryDA[lotidstring] = app;
      } else {
        console.log(`[Parcel Layer] Duplicate lot ID string found: ${lotidstring} (already assigned to ${lotToPrimaryDA[lotidstring].ApplicationId})`);
      }
    });
  });

  console.log(`[Parcel Layer] Lot extraction summary:`);
  console.log(`  - Applications with lots: ${applicationsWithLots}`);
  console.log(`  - Applications without lots: ${applicationsWithoutLots}`);
  console.log(`  - Total lots processed: ${totalLotsProcessed}`);
  console.log(`  - Unique lot ID strings: ${Object.keys(lotToPrimaryDA).length}`);

  const lotIdStrings = Array.from(new Set(Object.keys(lotToPrimaryDA)));
  
  // Log sample lot ID strings for validation
  console.log(`[Parcel Layer] Sample lot ID strings (first 10):`, lotIdStrings.slice(0, 10));
  
  // Validate lot ID string format
  const invalidLotIds = lotIdStrings.filter(lotId => {
    const parts = lotId.split('//');
    return parts.length !== 2 || !parts[0] || !parts[1];
  });
  
  if (invalidLotIds.length > 0) {
    console.warn(`[Parcel Layer] Found ${invalidLotIds.length} invalid lot ID string formats:`, invalidLotIds.slice(0, 5));
  }

  if (lotIdStrings.length === 0) {
    console.error('[Parcel Layer] No valid lot references found in applications');
    setError('No lot references found in applications.');
    return null;
  }

  setTotalFeatures(lotIdStrings.length);
  if (setProcessedFeatures) setProcessedFeatures(0);

  // 2. Query ArcGIS for all polygons by lotidstring
  console.log('[Parcel Layer] Step 2: Querying ArcGIS for parcel polygons');
  console.log(`[Parcel Layer] About to call fetchParcelsByLotIdStrings with ${lotIdStrings.length} lot ID strings`);
  
  let featureCollection;
  try {
    featureCollection = await fetchParcelsByLotIdStrings(lotIdStrings, setParcelBatchProgress ? (current, total) => setParcelBatchProgress({ current, total }) : undefined);
    console.log(`[Parcel Layer] ArcGIS query completed. Received ${featureCollection?.features?.length || 0} features`);
    if (setProcessedFeatures) setProcessedFeatures(lotIdStrings.length);
  } catch (err) {
    console.error('[Parcel Layer] Error during ArcGIS fetch:', err);
    console.error('[Parcel Layer] Error details:', {
      message: err.message,
      stack: err.stack,
      lotIdStringCount: lotIdStrings.length
    });
    setError('Error fetching parcel polygons.');
    return null;
  }

  console.log('[Parcel Layer] Step 3: Processing parcel features and attaching DA properties');
  
  // 3. Attach DA properties to each polygon feature (lotidstring match)
  const foundLotidstrings = new Set(featureCollection.features.map(f => f.properties?.lotidstring));
  console.log(`[Parcel Layer] Found polygons for ${foundLotidstrings.size} unique lot ID strings out of ${lotIdStrings.length} requested`);
  
  let featuresWithDAProps = featureCollection.features.map(feature => {
    const lotidstring = feature.properties?.lotidstring;
    const da = lotToPrimaryDA[lotidstring];
    return {
      ...feature,
      properties: da ? {
        id: da.ApplicationId,
        status: da.ApplicationStatus || 'Unknown',
        isResidential: da.DevelopmentType?.some(type =>
          (type && type.DevelopmentType && RESIDENTIAL_TYPES.has(type.DevelopmentType))
        ) || false,
        lodgedDate: da.LodgementDate,
        developmentType: da.DevelopmentType ? getTransformedDevelopmentType(da.DevelopmentType) : 'Unknown',
        "Clean Development Type": da.DevelopmentType ? getTransformedDevelopmentType(da.DevelopmentType) : 'Unknown',
        "Detailed Development Type": da.DevelopmentType ? da.DevelopmentType.map(dt => dt.DevelopmentType).join('; ') : '',
        PAN: da.PlanningPortalApplicationNumber || '',
        "Council Reference": da.CouncilApplicationNumber || '',
        "Lodgement Date": da.LodgementDate || '',
        "Determination Date": da.DeterminationDate || '',
        Cost: da.CostOfDevelopment || 0,
        Dwellings: da.NumberOfNewDwellings || 0,
        Storeys: da.NumberOfStoreys || 0,
        Status: da.ApplicationStatus || '',
        "EPI Variation": da.EPIVariationProposedFlag || '',
        Subdivision: da.SubdivisionProposedFlag || '',
        Address: da.Location?.[0]?.FullAddress || '',
        Lots: da.Location?.[0]?.Lot ? da.Location[0].Lot.map(lot => `${lot.Lot}//${lot.PlanLabel}`).join('; ') : '',
        Category: (() => {
          if (da.Category) return da.Category;
          const devTypeObj = da.DevelopmentType && da.DevelopmentType.length > 0 ? da.DevelopmentType[0] : null;
          const devType = devTypeObj && devTypeObj.DevelopmentType ? devTypeObj.DevelopmentType : null;
          return devType ? getDevelopmentCategory(devType) : 'Miscellaneous and Administrative';
        })(),
        "Estimated Height": (() => {
          const category = (da.Category) ? da.Category : (da.DevelopmentType && da.DevelopmentType.length > 0 && da.DevelopmentType[0].DevelopmentType ? getDevelopmentCategory(da.DevelopmentType[0].DevelopmentType) : 'Miscellaneous and Administrative');
          const floorHeight = floorHeightsByCategory[category] || 3;
          return (da.NumberOfStoreys && !isNaN(da.NumberOfStoreys)) ? da.NumberOfStoreys * floorHeight : 0;
        })()
      } : feature.properties
    };
  });

  // 4. For any DA with no matching lot polygon, try spatial query by point
  const missingLotDAs = applications.filter(app => {
    const lots = app.Location?.[0]?.Lot || [];
    if (lots.length === 0) return true; // No lots, always fallback
    return lots.some(lot => !foundLotidstrings.has(`${lot.Lot}//${lot.PlanLabel}`));
  });
  
  console.log(`[Parcel Layer] Step 4: Spatial fallback processing`);
  console.log(`[Parcel Layer] Applications requiring spatial fallback: ${missingLotDAs.length}`);
  
  for (const da of missingLotDAs) {
    const x = parseFloat(da.Location?.[0]?.X);
    const y = parseFloat(da.Location?.[0]?.Y);
    if (!isNaN(x) && !isNaN(y)) {
      console.log(`[Parcel Fallback] Querying by point for DA ${da.ApplicationId} at (${x}, ${y})`);
      const parcelFeature = await fetchParcelByPoint(x, y);
      if (parcelFeature) {
        console.log(`[Parcel Fallback] Found parcel for DA ${da.ApplicationId}`);
        featuresWithDAProps.push({
          ...parcelFeature,
          properties: {
            id: da.ApplicationId,
            status: da.ApplicationStatus || 'Unknown',
            isResidential: da.DevelopmentType?.some(type =>
              (type && type.DevelopmentType && RESIDENTIAL_TYPES.has(type.DevelopmentType))
            ) || false,
            lodgedDate: da.LodgementDate,
            description: da.DevelopmentDescription || 'No description available',
            developmentType: da.DevelopmentType ? getTransformedDevelopmentType(da.DevelopmentType) : 'Unknown',
            "Clean Development Type": da.DevelopmentType ? getTransformedDevelopmentType(da.DevelopmentType) : 'Unknown',
            "Detailed Development Type": da.DevelopmentType ? da.DevelopmentType.map(dt => dt.DevelopmentType).join('; ') : '',
            PAN: da.PlanningPortalApplicationNumber || '',
            "Council Reference": da.CouncilApplicationNumber || '',
            "Lodgement Date": da.LodgementDate || '',
            "Determination Date": da.DeterminationDate || '',
            Cost: da.CostOfDevelopment || 0,
            Dwellings: da.NumberOfNewDwellings || 0,
            Storeys: da.NumberOfStoreys || 0,
            Status: da.ApplicationStatus || '',
            "EPI Variation": da.EPIVariationProposedFlag || '',
            Subdivision: da.SubdivisionProposedFlag || '',
            Address: da.Location?.[0]?.FullAddress || '',
            Lots: da.Location?.[0]?.Lot ? da.Location[0].Lot.map(lot => `${lot.Lot}//${lot.PlanLabel}`).join('; ') : '',
            Category: (() => {
              if (da.Category) return da.Category;
              const devTypeObj = da.DevelopmentType && da.DevelopmentType.length > 0 ? da.DevelopmentType[0] : null;
              const devType = devTypeObj && devTypeObj.DevelopmentType ? devTypeObj.DevelopmentType : null;
              return devType ? getDevelopmentCategory(devType) : 'Miscellaneous and Administrative';
            })(),
            "Estimated Height": (() => {
              const category = (da.Category) ? da.Category : (da.DevelopmentType && da.DevelopmentType.length > 0 && da.DevelopmentType[0].DevelopmentType ? getDevelopmentCategory(da.DevelopmentType[0].DevelopmentType) : 'Miscellaneous and Administrative');
              const floorHeight = floorHeightsByCategory[category] || 3;
              return (da.NumberOfStoreys && !isNaN(da.NumberOfStoreys)) ? da.NumberOfStoreys * floorHeight : 0;
            })()
          }
        });
      } else {
        console.warn(`[Parcel Fallback] No parcel found for DA ${da.ApplicationId} at (${x}, ${y})`);
      }
    } else {
      console.warn(`[Parcel Fallback] Invalid coordinates for DA ${da.ApplicationId}: X=${da.Location?.[0]?.X}, Y=${da.Location?.[0]?.Y}`);
    }
  }

  console.log(`[Parcel Layer] Step 5: Grouping and dissolving features by PAN`);
  
  // 5. Group features by PAN and dissolve polygons per PAN
  const panToFeatures = {};
  for (const feature of featuresWithDAProps) {
    const pan = feature.properties.PAN || feature.properties['PAN'] || '';
    if (!panToFeatures[pan]) panToFeatures[pan] = [];
    panToFeatures[pan].push(feature);
  }

  console.log(`[Parcel Layer] PAN grouping summary:`);
  console.log(`  - Unique PANs: ${Object.keys(panToFeatures).length}`);
  console.log(`  - PANs with multiple features: ${Object.entries(panToFeatures).filter(([pan, features]) => features.length > 1).length}`);

  const finalFeatures = [];
  for (const [pan, features] of Object.entries(panToFeatures)) {
    let geometry;
    if (features.length === 1) {
      geometry = features[0].geometry;
    } else {
      console.log(`[Parcel Dissolve] Dissolving ${features.length} polygons for PAN ${pan}`);
      const dissolved = dissolvePolygons({ type: 'FeatureCollection', features });
      geometry = dissolved.geometry;
    }
    // Assign category and colours
    const category = features[0].properties.Category || 'Unknown';
    const { fillColour, outlineColour } = CATEGORY_COLORS[category] || CATEGORY_COLORS['Unknown'];
    finalFeatures.push({
      type: 'Feature',
      geometry,
      properties: {
        ...features[0].properties,
        fillColour,
        outlineColour
      }
    });
  }

  console.log(`[Parcel Layer] Final feature processing summary:`);
  console.log(`  - Final features created: ${finalFeatures.length}`);
  console.log(`  - Categories represented:`, [...new Set(finalFeatures.map(f => f.properties.Category))]);

  // 6. Fallback to DA points if no polygons
  if (!finalFeatures.length) {
    console.error('[Parcel Layer] No final features created - falling back to DA points');
    setError('No parcel polygons found. Falling back to DA points.');
    return null;
  }

  console.log('[Parcel Layer] Step 6: Creating map layer');
  
  // 7. Add a single layer named DA - PARCELS - {LGA} - {DATE}
  let councilName = 'Unknown';
  if (selectedFeatures && selectedFeatures.length > 0) {
    councilName = selectedFeatures[0]?.properties?.copiedFrom?.site_suitability__LGA ||
                 selectedFeatures[0]?.properties?.site_suitability__LGA ||
                 'Unknown';
  }
  const currentDate = new Date();
  const day = currentDate.getDate();
  const month = currentDate.toLocaleString('en-GB', { month: 'long' });
  const year = currentDate.getFullYear();
  const formattedDate = `${day} ${month} ${year}`;
  const layerName = `DA - PARCELS - ${councilName} - ${formattedDate}`;
  
  console.log(`[Parcel Layer] Creating layer: ${layerName}`);
  setParcelLayer(layerName);

  // Prepare GeoJSON FeatureCollection for the layer
  const layerFeatureCollection = {
    type: 'FeatureCollection',
    features: finalFeatures
  };

  // Validate
  if (!validateGeoJSON(layerFeatureCollection, true)) {
    console.error('[Parcel Layer] GeoJSON validation failed');
    setError('Error creating parcel layer: Feature collection validation failed');
    return null;
  }

  console.log('[Parcel Layer] GeoJSON validation passed');

  // Style: bold outline, semi-transparent fill
  const layerStyle = {
    type: 'fill',
    paint: {
      'fill-color': ['get', 'fillColour'], // Use property
      'fill-opacity': 0.3,
      'fill-outline-color': ['get', 'outlineColour'] // Use property
    }
  };

  try {
    console.log('[Parcel Layer] Adding layer to map via RPC');
    await rpc.invoke('createGeoJSONLayer', [
      layerName,
      layerFeatureCollection,
      {
        description: `DA Parcel Boundaries in ${councilName} - ${formattedDate}`,
        style: layerStyle
      }
    ]);
    console.log(`[Parcel Layer] Successfully created layer: ${layerName}`);
    if (setProcessedFeatures) setProcessedFeatures(lotIdStrings.length);
    return layerName;
  } catch (err) {
    console.error('[Parcel Layer] Error adding layer to map:', err);
    setError('Error adding parcel layer to map.');
    return null;
  }
}

// Add Lucide-inspired category colour palette
const CATEGORY_COLORS = {
  'Residential Types': { fillColour: '#FF483B', outlineColour: '#C13A2E' },
  'Alterations and Modifications': { fillColour: '#9333ea', outlineColour: '#6D28D9' },
  'Commercial and Business': { fillColour: '#04aae5', outlineColour: '#0377a8' },
  'Food and Beverage': { fillColour: '#ea580c', outlineColour: '#b45309' },
  'Education and Childcare': { fillColour: '#16a34a', outlineColour: '#166534' },
  'Health and Medical': { fillColour: '#ef4444', outlineColour: '#991b1b' },
  'Recreation and Entertainment': { fillColour: '#4daf4a', outlineColour: '#166534' },
  'Tourism and Accommodation': { fillColour: '#f59e0b', outlineColour: '#b45309' },
  'Industrial and Warehousing': { fillColour: '#64748b', outlineColour: '#374151' },
  'Transport and Vehicle Related': { fillColour: '#0891b2', outlineColour: '#0e7490' },
  'Marine and Water Related': { fillColour: '#0ea5e9', outlineColour: '#0369a1' },
  'Infrastructure and Utilities': { fillColour: '#475569', outlineColour: '#1e293b' },
  'Subdivision and Land Development': { fillColour: '#330000', outlineColour: '#7c2d12' },
  'Mixed Use and Other Development Types': { fillColour: '#7c3aed', outlineColour: '#4c1d95' },
  'Home Business and Occupation': { fillColour: '#0d9488', outlineColour: '#134e4a' },
  'Secondary Structures and Modifications': { fillColour: '#737373', outlineColour: '#525252' },
  'Miscellaneous and Administrative': { fillColour: '#525252', outlineColour: '#262626' },
  'Agriculture': { fillColour: '#166534', outlineColour: '#065f46' },
  'Mining and Resource Extraction': { fillColour: '#78350f', outlineColour: '#92400e' },
  'Other': { fillColour: '#CCCCCC', outlineColour: '#888888' },
  'Unknown': { fillColour: '#CCCCCC', outlineColour: '#888888' }
}; 
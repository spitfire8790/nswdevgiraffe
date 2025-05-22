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
 * @returns {Promise<string|null>} The layer name if successful, or null
 */
export async function createParcelLayer({ applications, selectedFeatures, setParcelLayer, setError, setTotalFeatures, setProcessedFeatures, setParcelBatchProgress }) {
  if (!applications || !Array.isArray(applications) || applications.length === 0) {
    setError('No applications to display parcels for.');
    return null;
  }

  // 1. Extract all unique lotidstrings and build a map from lotidstring to primary DA
  const lotToPrimaryDA = {};
  applications.forEach(app => {
    (app.Location?.[0]?.Lot || []).forEach(lot => {
      const lotidstring = `${lot.Lot}//${lot.PlanLabel}`;
      if (!lotToPrimaryDA[lotidstring]) {
        lotToPrimaryDA[lotidstring] = app;
      }
    });
  });
  const lotIdStrings = Array.from(new Set(Object.keys(lotToPrimaryDA)));

  if (lotIdStrings.length === 0) {
    setError('No lot references found in applications.');
    return null;
  }

  setTotalFeatures(lotIdStrings.length);
  if (setProcessedFeatures) setProcessedFeatures(0);

  // 2. Query ArcGIS for all polygons by lotidstring
  let featureCollection;
  try {
    featureCollection = await fetchParcelsByLotIdStrings(lotIdStrings, setParcelBatchProgress ? (current, total) => setParcelBatchProgress({ current, total }) : undefined);
    if (setProcessedFeatures) setProcessedFeatures(lotIdStrings.length);
  } catch (err) {
    setError('Error fetching parcel polygons.');
    return null;
  }

  // 3. Attach DA properties to each polygon feature (lotidstring match)
  const foundLotidstrings = new Set(featureCollection.features.map(f => f.properties?.lotidstring));
  let featuresWithDAProps = featureCollection.features.map(feature => {
    const lotidstring = feature.properties?.lotidstring;
    const da = lotToPrimaryDA[lotidstring];
    return {
      ...feature,
      properties: da ? {
        id: da.ApplicationId,
        title: da.DevelopmentDescription || 'Unknown',
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
        "Estimated Height": (da.NumberOfStoreys && !isNaN(da.NumberOfStoreys)) ? da.NumberOfStoreys * 3 : 0
      } : feature.properties
    };
  });

  // 4. For any DA with no matching lot polygon, try spatial query by point
  const missingLotDAs = applications.filter(app => {
    const lots = app.Location?.[0]?.Lot || [];
    if (lots.length === 0) return true; // No lots, always fallback
    return lots.some(lot => !foundLotidstrings.has(`${lot.Lot}//${lot.PlanLabel}`));
  });
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
            title: da.DevelopmentDescription || 'Unknown',
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
            "Estimated Height": (da.NumberOfStoreys && !isNaN(da.NumberOfStoreys)) ? da.NumberOfStoreys * 3 : 0
          }
        });
      } else {
        console.warn(`[Parcel Fallback] No parcel found for DA ${da.ApplicationId} at (${x}, ${y})`);
      }
    } else {
      console.warn(`[Parcel Fallback] Invalid coordinates for DA ${da.ApplicationId}`);
    }
  }

  // 5. Group features by PAN and dissolve polygons per PAN
  const panToFeatures = {};
  for (const feature of featuresWithDAProps) {
    const pan = feature.properties.PAN || feature.properties['PAN'] || '';
    if (!panToFeatures[pan]) panToFeatures[pan] = [];
    panToFeatures[pan].push(feature);
  }

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

  // 6. Fallback to DA points if no polygons
  if (!finalFeatures.length) {
    setError('No parcel polygons found. Falling back to DA points.');
    return null;
  }

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
  setParcelLayer(layerName);

  // Prepare GeoJSON FeatureCollection for the layer
  const layerFeatureCollection = {
    type: 'FeatureCollection',
    features: finalFeatures
  };

  // Validate
  if (!validateGeoJSON(layerFeatureCollection, true)) {
    setError('Error creating parcel layer: Feature collection validation failed');
    return null;
  }

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
    await rpc.invoke('createGeoJSONLayer', [
      layerName,
      layerFeatureCollection,
      {
        description: `DA Parcel Boundaries in ${councilName} - ${formattedDate}`,
        style: layerStyle
      }
    ]);
    if (setProcessedFeatures) setProcessedFeatures(lotIdStrings.length);
    return layerName;
  } catch (err) {
    setError('Error adding parcel layer to map.');
    return null;
  }
}

// Add Lucide-inspired category colour palette
const CATEGORY_COLORS = {
  'Residential Types': { fillColour: '#4F8A8B', outlineColour: '#16697A' },
  'Alterations and Modifications': { fillColour: '#9333ea', outlineColour: '#6D28D9' },
  'Commercial and Business': { fillColour: '#F9C846', outlineColour: '#F98404' },
  'Food and Beverage': { fillColour: '#ea580c', outlineColour: '#b45309' },
  'Education and Childcare': { fillColour: '#16a34a', outlineColour: '#166534' },
  'Health and Medical': { fillColour: '#ef4444', outlineColour: '#991b1b' },
  'Recreation and Entertainment': { fillColour: '#4daf4a', outlineColour: '#166534' },
  'Tourism and Accommodation': { fillColour: '#f59e0b', outlineColour: '#b45309' },
  'Industrial and Warehousing': { fillColour: '#A28089', outlineColour: '#624763' },
  'Transport and Vehicle Related': { fillColour: '#0891b2', outlineColour: '#0e7490' },
  'Marine and Water Related': { fillColour: '#0ea5e9', outlineColour: '#0369a1' },
  'Infrastructure and Utilities': { fillColour: '#B2B1B9', outlineColour: '#6E7B8B' },
  'Subdivision and Land Development': { fillColour: '#330000', outlineColour: '#7c2d12' },
  'Mixed Use and Other Development Types': { fillColour: '#43BCCD', outlineColour: '#1B4965' },
  'Home Business and Occupation': { fillColour: '#0d9488', outlineColour: '#134e4a' },
  'Secondary Structures and Modifications': { fillColour: '#737373', outlineColour: '#525252' },
  'Miscellaneous and Administrative': { fillColour: '#B8B8FF', outlineColour: '#5F5F9F' },
  'Agriculture': { fillColour: '#166534', outlineColour: '#065f46' },
  'Mining and Resource Extraction': { fillColour: '#78350f', outlineColour: '#92400e' },
  'Other': { fillColour: '#CCCCCC', outlineColour: '#888888' },
  'Unknown': { fillColour: '#CCCCCC', outlineColour: '#888888' }
}; 
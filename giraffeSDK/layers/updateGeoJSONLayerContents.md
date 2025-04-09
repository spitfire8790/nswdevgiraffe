# Function updateGeoJSONLayerContents

updateGeoJSONLayerContents(layerName, fc): Promise<any>
Utility wrapper this uploads the geojson fc then calls patchLayer if layerName exists, otherwise createLayer then addProjectLayer.

Parameters
    layerName: string
    fc: FeatureCollection<Geometry, {
    [name: string]: any;
    }>
    Returns Promise<any>
    
Defined in libs/layer-api/src/ut
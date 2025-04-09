# Function createGeoJSONLayer

createGeoJSONLayer(layerName, fc, layerMeta?): Promise<void>

Parameters
    layerName: string
    fc: FeatureCollection<Geometry, {
    [name: string]: any;
    }>
    <Optional> layerMeta: LayerConfigOptions

Returns Promise<void>

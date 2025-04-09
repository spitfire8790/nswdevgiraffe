# Function getLayerContents

getLayerContents(layerName, applyLensFilter?, bounds?, zoomIn?, tilesIn?): Promise<FeatureCollection>
get the layer contents filtered by lens and extent of the provided bounds - all {z}/{x}/{y} tiles at zoomIn that intersect with bounds are used

Parameters
layerName: string
applyLensFilter: boolean = false
<Optional> bounds: FeatureCollection<Geometry, {
[name: string]: any;
}>
<Optional> zoomIn: number
<Optional> tilesIn: Tile[]

Returns Promise<FeatureCollection>

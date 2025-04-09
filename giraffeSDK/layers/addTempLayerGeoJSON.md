# Function addTempLayerGeoJSON

addTempLayerGeoJSON(name, fc, style?, lens?): string
add a temporary (exists only for the current session/client) layer with GeoJSON data source

Parameters
    name: string
    fc: FeatureCollection<Geometry, {
    [name: string]: any;
    }>
    style: Partial<MapboxStyleLayer> = {}
    <Optional> lens: GiraffeLensableStyle

Returns string
# Function getTiles

getTiles(fc, zoom?, radius?): FeatureCollection<Geometry, Feature["properties"] & Tile["properties"]>
get the tile bounding boxes at a given zoom level covering the provided fc, used to start a GIS pipeline eg query or join per tile

Parameters
    fc: FeatureCollection<Geometry, {
        [name: string]: any;
    }>
    zoom: number = 15
    radius: number = 0
    
Returns FeatureCollection<Geometry, Feature["properties"] & Tile["properties"]>
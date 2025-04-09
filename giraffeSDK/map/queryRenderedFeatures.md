# Function queryRenderedFeatures

Refer [Mapbox](https://docs.mapbox.com/mapbox-gl-js/api/map/#map#queryrenderedfeatures)

queryRenderedFeatures(lngLat, options?, pixBuffer?): (Feature<Geometry, {
    [name: string]: any;
}> & {
    layerId?: string;
})[]

Parameters
    lngLat: LngLatLike
    is a LngLatLike object

<Optional> options: {
    filter?: any[];
    layers?: string[];
} & {
    [key: string]: any;
}
are the options for the mapbox queryRenderedFeatures

pixBuffer: number = 20
is a number of pixels around the coordinate to query

Returns (Feature<Geometry, {
    [name: string]: any;
}> & {
    layerId?: string;
})[]

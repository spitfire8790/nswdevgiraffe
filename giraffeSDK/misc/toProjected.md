# Function toProjected

toProjected(fc, origin): Feature<Geometry, {
    [name: string]: any;
}> | {
    features: Feature<Geometry, {
        [name: string]: any;
    }>[];
    type: string;
}
Parameters
fc: FeatureCollection<Geometry, {
    [name: string]: any;
}> | Feature<Geometry, {
    [name: string]: any;
}>
origin: [number, number]
Returns Feature<Geometry, {
    [name: string]: any;
}> | {
    features: Feature<Geometry, {
        [name: string]: any;
    }>[];
    type: string;
}
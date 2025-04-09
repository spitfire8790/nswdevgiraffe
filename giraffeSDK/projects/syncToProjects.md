# Function syncToProjects

syncToProjects(fc, id): Promise<number[]>
Syncs features in a FeatureCollection to projects.

Parameters
fc: FeatureCollection<Geometry, {
    [name: string]: any;
}>
id: ((f: Feature<Geometry, {
    [name: string]: any;
}>) => string)
(f): string
Parameters
f: Feature<Geometry, {
    [name: string]: any;
}>
Returns string
Returns Promise<number[]>
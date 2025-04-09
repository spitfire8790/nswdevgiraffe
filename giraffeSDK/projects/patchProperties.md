# Function patchProperties

patchProperties(projects, newProps): Promise<void[]>

Parameters
    projects: FeatureCollection<Geometry, {
        [name: string]: any;
    }>
    newProps: ((f: Feature<Geometry, {
        [name: string]: any;
    }>) => Record<string, string | number | boolean>)
    (f): Record<string, string | number | boolean>

Parameters
    f: Feature<Geometry, {
        [name: string]: any;
    }>
    
Returns Record<string, string | number | boolean>
Returns Promise<void[]>
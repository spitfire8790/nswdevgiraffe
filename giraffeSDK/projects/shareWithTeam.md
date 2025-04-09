# Function shareWithTeam

shareWithTeam(teamName, projects): Promise<{
    data: any;
    status: number;
}[]>

Parameters
teamName: string
projects: FeatureCollection<Geometry, {
    [name: string]: any;
}>
Returns Promise<{
    data: any;
    status: number;
}[]>
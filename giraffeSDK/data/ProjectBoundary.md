# Type Alias ProjectBoundary

ProjectBoundary: {
    geometry: {
        coordinates: GeoCoordinate[][] | Position[][];
        type: "Polygon";
    };
    properties: {
        acronymFloorSpaceRatio?: string;
        acronymGross?: string;
        acronymNet?: string;
        acronymSaleable?: string;
        color?: string;
        created_at?: string;
        crs?: string;
        currencySymbol?: string;
        defaultBoundary?: boolean;
        description?: string;
        grid?: Grid;
        id: string;
        name: string;
        org_id?: number;
        org_name?: string;
        siteArea?: number;
        units?: ProjectUnits;
    } & Record<string, any>;
    type: "Feature";
}
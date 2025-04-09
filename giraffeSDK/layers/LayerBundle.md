# Type Alias LayerBundle

LayerBundle: ({
    style: MapboxStyleLayer | MapboxStyleLayer[];
    vector_source: never | null;
    vector_style: never | null;
} | {
    style: never | null;
    vector_source: GiSourceData;
    vector_style: GiraffeLensableStyle;
}) & LayerConfigOptions


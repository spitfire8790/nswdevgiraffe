# Interface LensableDataStyle

interface LensableDataStyle {
    aggregateBy?: string;
    columnDef?: Record<string, LensTypedProperty>;
    columnKeys?: string[];
    filter?: AdvancedFeatureFilter;
    filterMode?: FilterMode;
    promoteId?: string;
    sortBy?: SortBy[];
    sortDescending?: boolean;
    sourceLayer?: string;
}

## Properties (all optional)

### aggregateBy
aggregateBy?: string

### columnDef 
columnDef?: Record<string, LensTypedProperty>

### columnKeys
columnKeys?: string[]
opt-in to show specific columns.

### filter
filter?: AdvancedFeatureFilter

### filterMode
filterMode?: FilterMode

### promoteId
promoteId?: string

### sortBy
sortBy?: SortBy[]

### sourceLayer
sourceLayer?: string

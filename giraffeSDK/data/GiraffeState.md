# Class GiraffeState

## Constructors

### constructor

new GiraffeState(): GiraffeState
Returns GiraffeState

## Properties

### attr

attr: GiraffeStateAttr = {}

### listeners 

listeners: Record<string, any> = {}

## Methods

### addListener

addListener(keys, listener): string

Parameters
    keys: GiraffeStateEventKey[]
    listener: ((key: GiraffeStateEventKey, event: MessageEvent<any>) => void)
    (key, event): void

Parameters
    key: GiraffeStateEventKey
    event: MessageEvent<any>
    Returns void
    Returns string

### get

get(key): FeatureCollection<Geometry, {
    [name: string]: any;
}>
Parameters
    key: "selected"
    Returns FeatureCollection<Geometry, {
    [name: string]: any;
    }>

get(key): MapView
Parameters
    key: "mapView"
    eturns MapView

get(key): MapContent
Parameters
    key: "mapContent"
    Returns MapContent

get(key): FeatureCollection<{
    coordinates: GeoCoordinate[][] | Position[][];
    type: "Polygon";
}, {
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
} & Record<string, any>>

Parameters
    key: "projects"
    Returns FeatureCollection<{
        coordinates: GeoCoordinate[][] | Position[][];
        type: "Polygon";
    }, {
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
    } & Record<string, any>>

get(key): FeatureCollection<PointGeometry | LineStringGeometry | PolygonGeometry, PreStackedLineStringProps | StackedPointProps | StackedPolygonProps>
Parameters
    key: "bakedSections"
    Returns FeatureCollection<PointGeometry | LineStringGeometry | PolygonGeometry, PreStackedLineStringProps | StackedPointProps | StackedPolygonProps>

get(key): ProjectLayer[]
Parameters
    key: "projectLayers"
    Returns ProjectLayer[]

get(key): FeatureCollection<
    | PointGeometry
    | LineStringGeometry
    | MultiPointGeometry
    | PolygonGeometry
    | MultiLineStringGeometry
    | MultiPolygonGeometry, RawFeatureProps>

get(key): Project
Parameters
    key: "project"
    Returns Project

get(key): GeoCoordinate
Parameters
    key: "projectOrigin"
    Returns GeoCoordinate

get(key): {
    1?: GiraffeProjectApp;
} & Record<string, OtherProjectApp<Record<string, any>, Record<string, any>>>

Parameters
    key: "projectAppsByAppID"
    Returns {
        1?: GiraffeProjectApp;
    } & Record<string, OtherProjectApp<Record<string, any>, Record<string, any>>>

get(key): LayerTree
Parameters
    key: "layerTree"
    Returns LayerTree

get(key): GiraffeProjectApp | OtherProjectApp<Record<string, any>, Record<string, any>>
Parameters
    key: "selectedProjectApp"
    Returns GiraffeProjectApp | OtherProjectApp<Record<string, any>, Record<string, any>>

get(key): Vista[]
Parameters
    key: "vistas"
    Returns Vista[]

get(key): any
Parameters
    key: GiraffeStateEventKey
    Returns any

### listen

listen(): void
Returns void

### removeAllListeners

removeAllListeners(): void
Returns void

### removeListener

removeListener(listenerKey): void
Parameters
listenerKey: any

### set

set(key, value, event): void
Parameters
    key: any
    value: any
    event: any
Returns void

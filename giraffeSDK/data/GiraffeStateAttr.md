# Interface GiraffeStateAttr

interface GiraffeStateAttr {
bakedSections?: Record<string, StackedSection[]>;
closingSignal?: boolean;
contextMenuClick?: {
label: string;
lat: number;
lng: number;
};
layerTree?: LayerTree;
mapContent?: MapContent;
mapHoverCoords?: [number, number];
mapView?: MapView;
project?: Project;
projectAppsByAppID?: {
1?: GiraffeProjectApp;
} & Record<string, OtherProjectApp<Record<string, any>, Record<string, any>>>;
projectLayers?: ProjectLayer[];
projectOrigin?: GeoCoordinate;
projects?: Record<string, Project>;
rawSections?: Record<string, RawSection>;
selected?: (RawSection | Lensable)[];
selectedProjectApp?: GiraffeProjectApp | OtherProjectApp<Record<string, any>, Record<string, any>>;
uiLayout?: {
controlled: any;
derived: any;
windowDimensions: {
height: number;
width: number;
};
};
userEvent?: {
lngLat: [number, number];
menuItem: string;
type: "contextmenu";
};
vistas?: Vista[];
}

## Properties

### bakedSections (optional)

bakedSections?: Record<string, StackedSection[]>

### closingSignal (optional)

closingSignal?: boolean

### contextMenuClick (optional)

contextMenuClick?: {
label: string;
lat: number;
lng: number;
}

### layerTree (optional)

layerTree?: LayerTree

### mapContent (optional)

mapContent?: MapContent

### mapHoverCoords (optional)

mapHoverCoords?: [number, number]

### mapView (optional)

mapView?: MapView

### project (optional)

project?: Project

### projectAppsByAppID (optional)

projectAppsByAppID?: {
1?: GiraffeProjectApp;
} & Record<string, OtherProjectApp<Record<string, any>, Record<string, any>>>

### projectOrigin (optional)

projectOrigin?: GeoCoordinate

### projects (optional)

projects?: Record<string, Project>

### rawSections (optional)

rawSections?: Record<string, RawSection>

### selected (optional)

selected?: (RawSection | Lensable)[]

### selectedProjectApp (optional)

selectedProjectApp?: GiraffeProjectApp | OtherProjectApp<Record<string, any>, Record<string, any>>

### uiLayout (optional)

uiLayout?: {
controlled: any;
derived: any;
windowDimensions: {
height: number;
width: number;
};
}

### userEvent (optional)

userEvent?: {
lngLat: [number, number];
menuItem: string;
type: "contextmenu";
}

### vistas (optional)

vistas?: Vista[]

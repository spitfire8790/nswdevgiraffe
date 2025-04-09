# Interface LensableDisplayStyle

interface LensableDisplayStyle {
    baseHeightKey?: string;
    circleRadius?: number;
    cluster?: boolean;
    clusterColor?: string;
    displayKeys?: string[];
    fillOpacity?: number;
    heightKey?: string;
    heightScale?: number;
    iconColor?: ColorPaletteOrFixed;
    iconHaloColor?: ColorPaletteOrFixed;
    iconImage?: string;
    iconSize?: number;
    lineColor?: ColorPaletteOrFixed;
    lineDimension?: "meters" | "pixels";
    lineWidth?: number;
    mainColor?: ColorPaletteOrFixed;
    mainLayer?:
        | "model"
        | "fill"
        | "fill-extrusion"
        | "circle"
        | "icon"
        | "giraffe-baked";
    overrideCircle?: Pick<CircleLayerSpecification, "paint">;
    overrideFill?: Pick<FillLayerSpecification, "paint">;
    overrideFillExtrusion?: Pick<FillExtrusionLayerSpecification, "paint" | "layout">;
    overrideIcon?: Pick<SymbolLayerSpecification, "paint" | "layout">;
    overrideLabel?: Pick<SymbolLayerSpecification, "paint" | "layout">;
    overrideLine?: Pick<LineLayerSpecification, "paint" | "layout">;
    overrideModel?: Pick<ModelLayerSpecification, "paint" | "layout">;
    primaryLabelMaxChars?: number;
    props?: PropToProp[];
    showLabels?: boolean;
    showLines?: boolean;
    showPalette?: LensPaletteKey;
    showTable?: boolean;
    showValuesOnly?: boolean;
    tableColumnWidths?: Record<string, number>;
    textColor?: ColorPaletteOrFixed;
    textHaloColor?: ColorPaletteOrFixed;
}

## Properties (all optional)

### baseHeightKey
baseHeightKey?: string

### circleRadius
circleRadius?: number

### cluster
cluster?: boolean

### clusterColor
clusterColor?: string

### displayKeys
displayKeys?: string[]
Keys to use for labels on map

### fillOpacity
fillOpacity?: number

### heightKey
heightKey?: string

### heightScale 
heightScale?: number

### iconColor
iconColor?: ColorPaletteOrFixed

### iconHaloColor
iconHaloColor?: ColorPaletteOrFixed

### iconImage
iconImage?: string

### iconSize
iconSize?: number

### lineColor
lineColor?: ColorPaletteOrFixed

### lineDimension
lineDimension?: "meters" | "pixels"

### lineWidth
lineWidth?: number

### mainColor
mainColor?: ColorPaletteOrFixed

### mainLayer
mainLayer?:
    | "model"
    | "fill"
    | "fill-extrusion"
    | "circle"
    | "icon"
    | "giraffe-baked"

### overrideCircle
overrideCircle?: Pick<CircleLayerSpecification, "paint">
paint properties documented at [Mapbox](https://docs.mapbox.com/style-spec/reference/layers/#circle) 

### overrideFill
overrideFill?: Pick<FillLayerSpecification, "paint">
paint properties documented at [Mapbox](https://docs.mapbox.com/style-spec/reference/layers/#fill)

### overrideFillExtrusion
overrideFillExtrusion?: Pick<FillExtrusionLayerSpecification, "paint" | "layout">
paint documented at [Mapbox](https://docs.mapbox.com/style-spec/reference/layers/#fill-extrusion)

### overrideIcon
overrideIcon?: Pick<SymbolLayerSpecification, "paint" | "layout">
paint and layout properties documented at [Mapbox](https://docs.mapbox.com/style-spec/reference/layers/#symbol)

### overrideLabel
overrideLabel?: Pick<SymbolLayerSpecification, "paint" | "layout">
paint and layout properties documented at [Mapbox](https://docs.mapbox.com/style-spec/reference/layers/#symbol)

### overrideLine
overrideLine?: Pick<LineLayerSpecification, "paint" | "layout">
paint and layout properties documented at [Mapbox] (https://docs.mapbox.com/style-spec/reference/layers/#line)

### overrideModel
overrideModel?: Pick<ModelLayerSpecification, "paint" | "layout">
paint properties documented at [Mapbox](https://docs.mapbox.com/style-spec/reference/layers/#model)

### primaryLabelMaxChars
primaryLabelMaxChars?: number

### props
props?: PropToProp[]

### showLabels
showLabels?: boolean

### showLines
showLines?: boolean

### showPalette
showPalette?: LensPaletteKey

### showTable
showTable?: boolean

### showValuesOnly
showValuesOnly?: boolean

### tableColumnWidths
tableColumnWidths?: Record<string, number>

### textColor
textColor?: ColorPaletteOrFixed

### textHaloColor
textHaloColor?: ColorPaletteOrFixed

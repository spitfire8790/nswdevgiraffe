# Interface NumericalPalette

interface NumericalPalette {
    domain?: [number, number];
    fallbackColor: string;
    paletteId:
        | "Blues"
        | "Greens"
        | "Greys"
        | "Oranges"
        | "Purples"
        | "Reds"
        | "BuGn"
        | "BuPu"
        | "GnBu"
        | "OrRd"
        | "PuBuGn"
        | "PuBu"
        | "PuRd"
        | "RdPu"
        | "YlGnBu"
        | "YlGn"
        | "YlOrBr"
        | "YlOrRd"
        | "Cividis"
        | "Viridis"
        | "Inferno"
        | "Magma"
        | "Plasma"
        | "Warm"
        | "Cool"
        | "CubehelixDefault"
        | "Turbo"
        | "BrBG"
        | "PRGn"
        | "PiYG"
        | "PuOr"
        | "RdBu"
        | "RdGy"
        | "RdYlBu"
        | "RdYlGn"
        | "Spectral"
        | "Rainbow"
        | "Sinebow";
    paletteMap: {
        color: string;
        value: number;
    }[];
    propertyKey: string;
    scaleFunc: "scaleLinear";
}

## Properties

### fallbackColor
fallbackColor: string

### paletteId
paletteId:
    | "Blues"
    | "Greens"
    | "Greys"
    | "Oranges"
    | "Purples"
    | "Reds"
    | "BuGn"
    | "BuPu"
    | "GnBu"
    | "OrRd"
    | "PuBuGn"
    | "PuBu"
    | "PuRd"
    | "RdPu"
    | "YlGnBu"
    | "YlGn"
    | "YlOrBr"
    | "YlOrRd"
    | "Cividis"
    | "Viridis"
    | "Inferno"
    | "Magma"
    | "Plasma"
    | "Warm"
    | "Cool"
    | "CubehelixDefault"
    | "Turbo"
    | "BrBG"
    | "PRGn"
    | "PiYG"
    | "PuOr"
    | "RdBu"
    | "RdGy"
    | "RdYlBu"
    | "RdYlGn"
    | "Spectral"
    | "Rainbow"
    | "Sinebow"

### paletteMap
paletteMap: {
    color: string;
    value: number;
}[]

### propertyKey
propertyKey: string

### scaleFunc
scaleFunc

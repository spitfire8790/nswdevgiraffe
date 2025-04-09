# Interface CategoricalPallete

interface CategoricalPalette {
    fallbackColor: string;
    ignoreCase?: boolean;
    paletteId:
        | "Category10"
        | "Accent"
        | "Dark2"
        | "Paired"
        | "Pastel1"
        | "Pastel2"
        | "Set1"
        | "Set2"
        | "Set3"
        | "Tableau10"
        | "css";
    paletteMap: {
        color: string;
        value: string;
    }[];
    propertyKey: string;
    scaleFunc: "scaleOrdinal";
}

## Properties

### fallbackColor
fallbackColor: string

### ignoreCase
ignoreCase?: boolean

### palleteId
paletteId:
    | "Category10"
    | "Accent"
    | "Dark2"
    | "Paired"
    | "Pastel1"
    | "Pastel2"
    | "Set1"
    | "Set2"
    | "Set3"
    | "Tableau10"
    | "css"

### paletteMap
paletteMap: {
    color: string;
    value: string;
}[]

### propertyKey
propertyKey: string

### scaleFunc
scaleFunc
# Interface ProjectLayer

interface ProjectLayer {
    group: string;
    id: string;
    layer: string;
    layer_full: Layer<MapboxStyleLayer | MapboxStyleLayer[]>;
    opacity: number;
    order?: number;
    project: string;
}

## Properties

### group
group: string

### id
id: string

### layer
layer: string

### layer_full
layer_full: Layer<MapboxStyleLayer | MapboxStyleLayer[]>

### opacity
opacity: number

### order
order?: number

### project
project: string
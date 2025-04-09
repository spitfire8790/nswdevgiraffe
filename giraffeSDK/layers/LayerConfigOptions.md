# Interface LayerConfigOptions

interface LayerConfigOptions {
    boundary?: {
        geojson: string;
        wkid: number;
    };
    credentials?: {
        password?: string;
        token?: string;
        username?: string;
    };
    data_date?: string;
    default_group: string;
    description: string;
    layer_type: Omit<GiraffeLayerType, SceneServer>;
    meta: Record<any, any>;
    name: string;
    org_id: string;
    protected?: boolean;
    public?: boolean;
    tags?: string[];
}

## Properties

### boundary
boundary?: {
    geojson: string;
    wkid: number;
}

### credentials
credentials?: {
    password?: string;
    token?: string;
    username?: string;
}

### data_date
data_date?: string

### default_group
default_group: string

### layer_type
layer_type: Omit<GiraffeLayerType, SceneServer>

### meta
meta: Record<any, any>

### org_id
org_id: string

### protected
protected?: boolean

### public
public?: boolean

### tags
tags?: string[]


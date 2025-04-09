# Interface GiraffeProjectApp

interface GiraffeProjectApp {
    app: string;
    appName: string;
    city?: Record<string, any>;
    featureCategories: GiraffeFeatureCategories;
    id: string;
    mapStyle?: Record<string, any> | Record<string, any>[];
    opacity?: any;
    private?: {
        iframe?: boolean;
        logo: string;
        url: string;
    } & Record<string, any>;
    project: ProjectId;
    public: GiraffePublic;
    readMe?: any;
    version?: string;
}

Hierarchy
    OtherProjectApp
    GiraffeProjectApp

## Properties

### app
app: string
Inherited from OtherProjectApp.app

### appName
appName: string
Inherited from OtherProjectApp.appName

### featureCategories
featureCategories: GiraffeFeatureCategories
Overrides OtherProjectApp.featureCategories

### id
id: string
Inherited from OtherProjectApp.id

### mapStyle
mapStyle?: Record<string, any> | Record<string, any>[]
Inherited from OtherProjectApp.mapStyle

### private
private?: {
    iframe?: boolean;
    logo: string;
    url: string;
} & Record<string, any>
Inherited from OtherProjectApp.private

### project
project: ProjectId
Inherited from OtherProjectApp.project

### public
public: GiraffePublic
Overrides OtherProjectApp.public

### version
version?: string
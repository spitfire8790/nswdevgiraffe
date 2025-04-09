# Interface TreeData<TreeItemD>

interface TreeData<TreeItemD> {
    items: {
        root: TreeGroupItem<never>;
    } & Record<string, TreeItemD | TreeGroupItem<never>>;
    rootId: string;
}

## Properties

### items
items: {
    root: TreeGroupItem<never>;
} & Record<string, TreeItemD | TreeGroupItem<never>>

### rootId
rootId: string
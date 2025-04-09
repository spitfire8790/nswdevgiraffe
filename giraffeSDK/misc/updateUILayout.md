# Function updateUiLayout

updateUiLayout(layout): void
Parameters
layout: Partial<Pick<{
    activeOverlay: GiraffeOverLays;
    commandBarOpen: boolean;
    contentLibraryWidth: number;
    dendroEditorOpen: boolean;
    drawingLayerNameBeingEdited: string;
    drawMenuOpen: string;
    dropZoneDisabled: boolean;
    editLayerSettingsId: string;
    geoCoderOpen: boolean;
    layerGroupNameBeingEdited: string;
    leftBarOpen: boolean;
    leftBarOpenWidth: number;
    leftBarTab: LeftBarContent;
    lensTableHeight: number;
    lensTableMode: TableDisplayMode;
    manageLayerSettingsId: string;
    newProjectSplashOpen: boolean;
    nodesEditorWidth: number;
    projectSettingsTab:
        | "other"
        | "workspace"
        | "system"
        | "attachments";
    rightBarContent: RightBarContent | RightBarContentConfig;
    rightBarOpen: boolean;
    rightBarOpenWidth: number;
    secondLeftBar: "usage" | "node" | "contentLibrary";
    showBottomBar: boolean;
    usageEditorWidth: number;
},
    | "leftBarOpenWidth"
    | "rightBarOpenWidth"
    | "leftBarOpen"
    | "rightBarOpen"
    | "lensTableHeight">> & {
    bottomBarIframe?: {
        height: number;
        url: string;
    };
}
Returns void
# Function addTempLayer

addTempLayer(layerName, style?, lens?, hideInTree?, opacity?): string

add (or update the style of) a temporary (exists only for the current session/client) layer with a tiled source NB the source cannot be updated once the layer has been added, but the style can. To update the source, remove the layer and re-add it.

Parameters
    layerName: string
    <Optional> style: MapboxStyleLayer
    <Optional> lens: GiraffeLensableStyle
    hideInTree: boolean = false
    <Optional> opacity: number

Returns string
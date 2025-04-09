# Function getSourceLayerDetails

getSourceLayerDetails(term): {
    source: string;
    sourceLayer: string;
    url: string;
}

get layer info to pass to getVectorLayerContents from a layer in the base style eg roads

Parameters
    term: string
    Returns {
        source: string;
        sourceLayer: string;
        url: string;
    }
    source: string
    sourceLayer: string
    url: string
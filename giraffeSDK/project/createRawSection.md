# Function createRawSection

createRawSection(feature): void
create a Point, LineString or Polygon geometry that will be saved on Giraffe and that users can edit. NB. rate limited - do not call this unless there is a corresponding user action

Parameters
    feature: Feature<Polygon | Point | LineString, Record<string, any> & {
        id?: never;
    }>
    
Returns void
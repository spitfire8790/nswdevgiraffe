# Function getAnalyticsResult

getAnalyticsResult(): Promise<{
    allGroupKeys: Set<GroupKey>;
    calcError: string;
    grouped: any;
    groupKeys: Set<GroupKey>;
    isNoData: boolean;
    orphans: Set<string>;
    rows: SolvedMeasure[];
    sectionsSplitByLandUse: SectionsSplitByLandUse;
    siteData: SiteAreaData;
}>
Returns Promise<{
    allGroupKeys: Set<GroupKey>;
    calcError: string;
    grouped: any;
    groupKeys: Set<GroupKey>;
    isNoData: boolean;
    orphans: Set<string>;
    rows: SolvedMeasure[];
    sectionsSplitByLandUse: SectionsSplitByLandUse;
    siteData: SiteAreaData;
}>
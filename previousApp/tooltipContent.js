/**
 * Tooltip content for the Development Modal component
 * Contains explanatory text about data processing and sources
 */

export const tooltipContent = {
    // Explanation of deduplication logic
    deduplicationInfo: {
      title: "About This Data",
      content: `
        This view automatically removes duplicate development applications to improve accuracy.
        
        When multiple applications have the same address, development type and value but different dates, 
        only the most recent one is displayed. This prevents double-counting of the same development and provides a cleaner view of development activity.
        
        Development types have been standardised and categorised to improve analysis. Similar types are grouped together (e.g., "Dwelling house" and "Dwelling" are combined into Dwelling).
        
        Full details are retained and can be viewed in the Development Type column in the table by hovering over a development type.
        
        This data includes development applications from 1 January 2020 onwards.
      `,
      source: `Data sourced from the NSW Government's Development Application API`,
      sourceLink: "https://www.planningportal.nsw.gov.au/opendata/dataset/online-da-data-api"
    },
    
    // For potential future tooltips
    dataQualityInfo: {
      title: "Data Quality Information",
      content: `
        This data represents Development Applications (DAs) lodged through the NSW Planning Portal.
        
        Note that the NSW Government mandated all councils to use the Planning Portal 
        from July 1, 2021. Some applications prior to that date may be missing.
        
        The data is updated daily but there may be a short delay between when applications 
        are submitted and when they appear in this view.
        
        This data includes development applications from January 1, 2020 onwards.
      `,
      source: `Data sourced from the NSW Government's Development Application API`,
      sourceLink: "https://www.planningportal.nsw.gov.au/opendata/dataset/online-da-data-api"
    }
  };
  
  export default tooltipContent; 
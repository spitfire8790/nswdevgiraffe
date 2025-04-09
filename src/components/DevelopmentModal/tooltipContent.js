/**
 * Tooltip content for the Development Modal component
 * Contains explanatory text about data processing and sources
 */

export const tooltipContent = {
  // Explanation of deduplication logic
  deduplicationInfo: {
    title: "About this App",
    content: `    
        This application provides live access to the NSW Government's Development Application API.

    Summary charts are responsive to filters applied including development type, date ranges, cost ranges, dwelling yields and more.

    Data includes development applications lodged from 1 January 2020 onwards.

    Note that the underlying data is updated daily but there may be a short delay between when applications 
    are submitted and when they appear in this view.

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
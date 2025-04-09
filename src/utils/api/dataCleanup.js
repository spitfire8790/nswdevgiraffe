/**
 * Utilities for cleaning and processing development application data
 */

/**
 * Removes duplicate development applications
 * @param {Array} applications - Array of development applications to deduplicate
 * @returns {Array} Deduplicated array of development applications
 */
export const deduplicateDAs = (applications) => {
  if (!applications || applications.length === 0) return [];
  
  // Create a map to store the most recent version of each application by PAN
  const uniqueApplications = new Map();
  
  // First, organize applications by their address to detect duplicates and modifications
  const addressGroups = new Map();
  
  // Process applications to group by address
  applications.forEach(app => {
    const address = app.Location?.[0]?.FullAddress || '';
    if (!address) return;
    
    if (!addressGroups.has(address)) {
      addressGroups.set(address, [app]);
    } else {
      addressGroups.get(address).push(app);
    }
  });
  
  // Process each application
  applications.forEach(app => {
    const pan = app.PlanningPortalApplicationNumber;
    
    // Primary deduplication: Use PAN if available
    if (pan) {
      if (!uniqueApplications.has(pan)) {
        uniqueApplications.set(pan, app);
      } else {
        // If we have a duplicate PAN, keep the most recent version based on DateLastUpdated
        const existingApp = uniqueApplications.get(pan);
        const existingDate = existingApp.DateLastUpdated ? new Date(existingApp.DateLastUpdated) : new Date(0);
        const newDate = app.DateLastUpdated ? new Date(app.DateLastUpdated) : new Date(0);
        
        if (newDate > existingDate) {
          uniqueApplications.set(pan, app);
        }
      }
      return;
    }
    
    // Secondary deduplication for apps without PAN: handle address-based grouping
    const address = app.Location?.[0]?.FullAddress || '';
    
    if (!address) return;
    
    // Get all applications for this address
    const addressApps = addressGroups.get(address);
    
    // If there's only one application for this address, use it
    if (addressApps.length === 1) {
      const key = `${address}`;
      uniqueApplications.set(key, app);
      return;
    }
    
    // If there are multiple applications for this address, we need a smart deduplication strategy
    // Create a composite key using address and cost (ignoring applicationType)
    const compositeKey = `${address}_${app.CostOfDevelopment || 0}`;
    
    if (!uniqueApplications.has(compositeKey)) {
      uniqueApplications.set(compositeKey, app);
    } else {
      // For modifications, prefer to keep the original DA unless the MOD is more recent
      const existingApp = uniqueApplications.get(compositeKey);
      
      // Check if either is a modification
      const isExistingMod = existingApp.ApplicationType === 'MOD';
      const isNewMod = app.ApplicationType === 'MOD';
      
      // If existing is DA and new is MOD, generally prefer the MOD as it's an update
      if (!isExistingMod && isNewMod) {
        uniqueApplications.set(compositeKey, app);
        return;
      }
      
      // If both are DA or both are MOD, compare by lodgement date
      const existingDate = existingApp.LodgementDate ? new Date(existingApp.LodgementDate) : new Date(0);
      const newDate = app.LodgementDate ? new Date(app.LodgementDate) : new Date(0);
      
      if (newDate > existingDate) {
        uniqueApplications.set(compositeKey, app);
      }
    }
  });
  
  // Convert the map values back to an array
  return Array.from(uniqueApplications.values());
};

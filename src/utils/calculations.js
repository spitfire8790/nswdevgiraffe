/**
 * Utility functions for various calculations related to development applications
 */

/**
 * Calculates summary statistics for development applications
 * 
 * @param {Array} applications - List of development applications
 * @returns {Object} Object containing summary statistics
 */
export const calculateSummaryStats = (applications, isResidentialType, getTransformedDevelopmentType) => {
  const byStatus = {};
  const byType = {};
  const byResidentialType = {};
  let totalValue = 0;
  let totalDwellings = 0;

  applications.forEach(app => {
    // Count by status
    const status = app.ApplicationStatus || 'Unknown';
    byStatus[status] = (byStatus[status] || 0) + 1;
    
    // Count by development type using transformed type
    if (app.DevelopmentType && Array.isArray(app.DevelopmentType)) {
      const transformedType = getTransformedDevelopmentType(app.DevelopmentType);
      byType[transformedType] = (byType[transformedType] || 0) + 1;
      
      // Also track residential types separately
      if (app.DevelopmentType.some(type => isResidentialType(type.DevelopmentType))) {
        byResidentialType[transformedType] = (byResidentialType[transformedType] || 0) + 1;
      }
    }
    
    // Sum total development value
    if (app.CostOfDevelopment) {
      totalValue += app.CostOfDevelopment;
    }

    // Sum total dwellings
    if (app.NumberOfNewDwellings) {
      totalDwellings += Number(app.NumberOfNewDwellings);
    }
  });

  return {
    totalApplications: applications.length,
    byStatus,
    byType,
    byResidentialType,
    totalValue,
    totalDwellings
  };
}; 
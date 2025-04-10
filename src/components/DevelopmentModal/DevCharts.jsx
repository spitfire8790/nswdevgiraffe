import React, { useState } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell, Sector, LineChart, Line, AreaChart, Area
} from 'recharts';
import { BarChart as BarChartIcon, PieChart as PieChartIcon } from 'lucide-react';
import { formatCurrency } from '../../utils/formatters';

const DevCharts = ({
  getFilteredApplications,
  formatNumber,
  summaryData,
  devTypesData,
  isResidentialType,
  isInResidentialTypesCategory,
  getTransformedDevelopmentType
}) => {
  // State for chart tabs
  const [activeChartTab, setActiveChartTab] = useState('Development Values by Type');

  return (
    <div className="mt-4">
      {/* Chart Tabs */}
      <div className="mb-2 border-b">
        <div className="flex flex-wrap -mb-px">
          {['Development Values by Type', 'Residential Dwellings by Type', 'Applications over Time', 'Median Cost per Dwelling'].map((tabName) => (
            <button
              key={tabName}
              onClick={() => setActiveChartTab(tabName)}
              className={`py-2 px-4 text-sm font-medium border-b-2 transition-colors ${
                activeChartTab === tabName
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {tabName}
            </button>
          ))}
        </div>
      </div>
      
      {/* Chart Content */}
      <div className="bg-white p-4 rounded-lg border shadow-sm">
        {/* Development Values by Type */}
        {activeChartTab === 'Development Values by Type' && (
          <>
            <h3 className="text-sm font-medium text-gray-700 mb-2 flex items-center">
              <BarChartIcon className="w-4 h-4 mr-1 text-blue-500" />
              Development Values by Type
            </h3>
            <div className="h-80">
              {getFilteredApplications().length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={(() => {
                      // Calculate total value by type
                      const valueByType = {};
                      getFilteredApplications().forEach(app => {
                        if (app.DevelopmentType && Array.isArray(app.DevelopmentType) && app.CostOfDevelopment) {
                          const typeName = getTransformedDevelopmentType(app.DevelopmentType);
                          if (!valueByType[typeName]) {
                            valueByType[typeName] = 0;
                          }
                          valueByType[typeName] += app.CostOfDevelopment;
                        }
                      });
                      
                      // Convert to array and sort by value
                      return Object.entries(valueByType)
                        .map(([type, value]) => ({
                          type: type.length > 20 ? type.substring(0, 18) + '...' : type,
                          value,
                          fullType: type // For tooltip
                        }))
                        .sort((a, b) => b.value - a.value)
                        .slice(0, 12); // Increased limit for wider chart
                    })()}
                    margin={{ top: 20, right: 30, left: 40, bottom: 60 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="type" 
                      angle={-45} 
                      textAnchor="end" 
                      height={60}
                      tick={{ fontSize: 12 }}
                    />
                    <YAxis 
                      tickFormatter={(value) => {
                        if (value >= 1000000000) {
                          return `$${Math.floor(value / 1000000000).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",")}B`;
                        } else if (value >= 1000000) {
                          return `$${Math.floor(value / 1000000).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",")}M`;
                        } else {
                          return `$${Math.floor(value / 1000).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",")}K`;
                        }
                      }}
                      tick={{ fontSize: 10 }}
                    />
                    <Tooltip 
                      formatter={(value) => [formatCurrency(value), 'Value']}
                      labelFormatter={(label, data) => data[0]?.payload?.fullType || label}
                      contentStyle={{ 
                        backgroundColor: 'white', 
                        borderRadius: '8px',
                        border: '1px solid #e5e7eb',
                        padding: '8px'
                      }}
                    />
                    <Bar 
                      dataKey="value" 
                      fill="#0088FE" 
                      name="Total Value"
                      radius={[4, 4, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-gray-500">
                  <p>No development value data available</p>
                </div>
              )}
            </div>
          </>
        )}
        
        {/* Residential Dwellings by Type */}
        {activeChartTab === 'Residential Dwellings by Type' && (
          <>
            <h3 className="text-sm font-medium text-gray-700 mb-2 flex items-center">
              <BarChartIcon className="w-4 h-4 mr-1 text-blue-500" />
              Residential Dwellings by Type
            </h3>
            <div className="h-80">
              {Object.keys(summaryData.byResidentialType).length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={(() => {
                      // Group data by residential categories and "other"
                      const categorizedData = {};
                      let otherCount = 0;
                      
                      // Process each residential type
                      Object.entries(summaryData.byResidentialType).forEach(([type, count]) => {
                        // Use the helper function to check if this type is in the 'Residential Types' category
                        if (isInResidentialTypesCategory(type)) {
                          // Keep residential category types as explicit entries
                          categorizedData[type] = count;
                        } else {
                          // Add to "other" category - these are dwelling types that aren't
                          // in the 'Residential Types' category in developmentTypes.js
                          // but are still considered residential (in RESIDENTIAL_TYPES set)
                          otherCount += count;
                        }
                      });
                      
                      // Add the "other" category if it has any values
                      if (otherCount > 0) {
                        categorizedData['Other'] = otherCount;
                      }
                      
                      // Convert to array and sort by count
                      return Object.entries(categorizedData)
                        .map(([type, count]) => ({
                          type: type.length > 25 ? type.substring(0, 23) + '...' : type,
                          count,
                          fullType: type // For tooltip
                        }))
                        .sort((a, b) => b.count - a.count)
                        .slice(0, 15); // Increased limit for wider chart
                    })()}
                    margin={{ top: 5, right: 30, left: 40, bottom: 60 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="type" 
                      angle={-45} 
                      textAnchor="end" 
                      height={60}
                      tick={{ fontSize: 10 }}
                    />
                    <YAxis 
                      tick={{ fontSize: 10 }}
                      allowDecimals={false}
                      tickFormatter={(value) => value.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",")}
                    />
                    <Tooltip 
                      formatter={(value) => [`${value} dwellings`, 'Count']}
                      labelFormatter={(label, data) => data[0]?.payload?.fullType || label}
                      contentStyle={{ 
                        backgroundColor: 'white', 
                        borderRadius: '8px',
                        border: '1px solid #e5e7eb',
                        padding: '8px'
                      }}
                    />
                    <Bar 
                      dataKey="count" 
                      fill="#0088FE" 
                      name="Dwelling Count"
                      radius={[4, 4, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-gray-500">
                  <p>No residential dwelling data available</p>
                </div>
              )}
            </div>
          </>
        )}
        
        {/* Dwellings over Time */}
        {activeChartTab === 'Applications over Time' && (
          <>
            <h3 className="text-sm font-medium text-gray-700 mb-2 flex items-center">
              <BarChartIcon className="w-4 h-4 mr-1 text-blue-500" />
              Dwellings over Time by Type
            </h3>
            <div className="h-80">
              {getFilteredApplications().length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart
                    data={(() => {
                      // Get dwelling types for residential applications
                      // We'll use the same categories as the "Residential Dwellings by Type" chart
                      const dwellingTypes = {};
                      // First collect all residential types from applications with dwellings
                      getFilteredApplications().forEach(app => {
                        if (app.DevelopmentType && Array.isArray(app.DevelopmentType) && 
                            app.NumberOfNewDwellings && app.NumberOfNewDwellings > 0) {
                          // Check if it's residential
                          const isResidential = app.DevelopmentType.some(type => 
                            isResidentialType(type.DevelopmentType)
                          );
                          
                          if (isResidential) {
                            const transformedType = getTransformedDevelopmentType(app.DevelopmentType);
                            // Check if this type belongs to the "Residential Types" category
                            if (isInResidentialTypesCategory(transformedType)) {
                              dwellingTypes[transformedType] = true;
                            } else {
                              dwellingTypes['Other'] = true;
                            }
                          }
                        }
                      });
                      
                      // If we don't have any residential types, add some default ones
                      if (Object.keys(dwellingTypes).length === 0) {
                        // Get the types from the Residential Types category
                        const residentialCategory = devTypesData.find(cat => cat.category === 'Residential Types');
                        if (residentialCategory) {
                          residentialCategory.types.forEach(type => {
                            dwellingTypes[type.newtype || type.oldtype] = true;
                          });
                        }
                        dwellingTypes['Other'] = true;
                      }
                      
                      // Get all dates from the filtered data and sort them
                      const dates = [...new Set(getFilteredApplications()
                        .filter(app => app.LodgementDate && app.NumberOfNewDwellings && app.NumberOfNewDwellings > 0)
                        .map(app => app.LodgementDate.substring(0, 7))) // YYYY-MM format
                      ].sort();
                      
                      // Initialize data structure for each date
                      const timeData = dates.map(date => {
                        const dataPoint = { date };
                        Object.keys(dwellingTypes).forEach(type => {
                          dataPoint[type] = 0;
                        });
                        return dataPoint;
                      });
                      
                      // Fill in the cumulative counts
                      timeData.forEach((dataPoint, i) => {
                        // For each date, sum the dwellings by type up to this point in time
                        const appsUpToThisDate = getFilteredApplications().filter(app => 
                          app.LodgementDate && 
                          app.LodgementDate.substring(0, 7) <= dataPoint.date &&
                          app.NumberOfNewDwellings && 
                          app.NumberOfNewDwellings > 0
                        );
                        
                        // Group dwellings by type
                        appsUpToThisDate.forEach(app => {
                          if (app.DevelopmentType && Array.isArray(app.DevelopmentType)) {
                            const isResidential = app.DevelopmentType.some(type => 
                              isResidentialType(type.DevelopmentType)
                            );
                            
                            if (isResidential) {
                              const transformedType = getTransformedDevelopmentType(app.DevelopmentType);
                              const dwellingCount = app.NumberOfNewDwellings;
                              
                              // Check if it belongs to Residential Types category
                              if (isInResidentialTypesCategory(transformedType)) {
                                dataPoint[transformedType] = (dataPoint[transformedType] || 0) + dwellingCount;
                              } else {
                                dataPoint['Other'] = (dataPoint['Other'] || 0) + dwellingCount;
                              }
                            }
                          }
                        });
                        
                        // Add previous month's counts to make it cumulative
                        if (i > 0) {
                          Object.keys(dwellingTypes).forEach(type => {
                            dataPoint[type] += timeData[i-1][type] || 0;
                          });
                        }
                      });
                      
                      // Format dates for display
                      return timeData.map(item => ({
                        ...item,
                        displayDate: new Date(item.date + '-01').toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
                      }));
                    })()}
                    margin={{ top: 20, right: 30, left: 40, bottom: 60 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="displayDate" 
                      angle={-45} 
                      textAnchor="end" 
                      height={60}
                      tick={{ fontSize: 10 }}
                    />
                    <YAxis 
                      tickFormatter={(value) => value.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",")}
                      tick={{ fontSize: 10 }}
                    />
                    <Tooltip 
                      formatter={(value, name) => [`${value} dwellings`, name]}
                      contentStyle={{ 
                        backgroundColor: 'white', 
                        borderRadius: '8px',
                        border: '1px solid #e5e7eb',
                        padding: '8px'
                      }}
                    />
                    <Legend />
                    {Object.keys((() => {
                      // Get dwelling types for residential applications
                      const dwellingTypes = {};
                      // First collect all residential types from applications with dwellings
                      getFilteredApplications().forEach(app => {
                        if (app.DevelopmentType && Array.isArray(app.DevelopmentType) && 
                            app.NumberOfNewDwellings && app.NumberOfNewDwellings > 0) {
                          // Check if it's residential
                          const isResidential = app.DevelopmentType.some(type => 
                            isResidentialType(type.DevelopmentType)
                          );
                          
                          if (isResidential) {
                            const transformedType = getTransformedDevelopmentType(app.DevelopmentType);
                            // Check if this type belongs to the "Residential Types" category
                            if (isInResidentialTypesCategory(transformedType)) {
                              dwellingTypes[transformedType] = true;
                            } else {
                              dwellingTypes['Other'] = true;
                            }
                          }
                        }
                      });
                      
                      // If we don't have any residential types, add some default ones
                      if (Object.keys(dwellingTypes).length === 0) {
                        // Get the types from the Residential Types category
                        const residentialCategory = devTypesData.find(cat => cat.category === 'Residential Types');
                        if (residentialCategory) {
                          residentialCategory.types.forEach(type => {
                            dwellingTypes[type.newtype || type.oldtype] = true;
                          });
                        }
                        dwellingTypes['Other'] = true;
                      }
                      
                      return dwellingTypes;
                    })()).map((type, index) => (
                      <Area 
                        key={type}
                        type="monotone"
                        dataKey={type}
                        stackId="1"
                        fill={type === 'Secondary dwelling' ? '#FF69B4' : ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'][index % 6]}
                        stroke={type === 'Secondary dwelling' ? '#FF69B4' : ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'][index % 6]}
                      />
                    ))}
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-gray-500">
                  <p>No application timeline data available</p>
                </div>
              )}
            </div>
          </>
        )}
        
        {/* Median Cost per Dwelling */}
        {activeChartTab === 'Median Cost per Dwelling' && (
          <>
            <h3 className="text-sm font-medium text-gray-700 mb-2 flex items-center">
              <BarChartIcon className="w-4 h-4 mr-1 text-blue-500" />
              Median Cost per Dwelling
            </h3>
            <div className="h-80">
              {getFilteredApplications().length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={(() => {
                      // Calculate median cost per dwelling by type
                      const dwellingCosts = {};
                      
                      // First collect all costs per dwelling for each type
                      getFilteredApplications().forEach(app => {
                        if (app.DevelopmentType && Array.isArray(app.DevelopmentType) && 
                            app.CostOfDevelopment && app.NumberOfNewDwellings > 0) {
                          const typeName = getTransformedDevelopmentType(app.DevelopmentType);
                          
                          // Only include residential types
                          const isResidential = app.DevelopmentType.some(type => 
                            isResidentialType(type.DevelopmentType)
                          );
                          
                          if (isResidential) {
                            if (!dwellingCosts[typeName]) {
                              dwellingCosts[typeName] = [];
                            }
                            const costPerDwelling = app.CostOfDevelopment / app.NumberOfNewDwellings;
                            dwellingCosts[typeName].push(costPerDwelling);
                          }
                        }
                      });
                      
                      // Calculate median for each type
                      const medianCostByType = {};
                      Object.entries(dwellingCosts).forEach(([type, costs]) => {
                        if (costs.length > 0) {
                          costs.sort((a, b) => a - b);
                          const mid = Math.floor(costs.length / 2);
                          const median = costs.length % 2 === 0
                            ? (costs[mid - 1] + costs[mid]) / 2
                            : costs[mid];
                          medianCostByType[type] = median;
                        }
                      });
                      
                      // Convert to array and sort by median cost
                      return Object.entries(medianCostByType)
                        .map(([type, medianCost]) => ({
                          type: type.length > 20 ? type.substring(0, 18) + '...' : type,
                          medianCost,
                          fullType: type // For tooltip
                        }))
                        .sort((a, b) => b.medianCost - a.medianCost)
                        .slice(0, 12); // Limit to top 12
                    })()}
                    margin={{ top: 5, right: 30, left: 40, bottom: 60 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="type" 
                      angle={-45} 
                      textAnchor="end" 
                      height={60}
                      tick={{ fontSize: 12 }}
                    />
                    <YAxis 
                      tickFormatter={(value) => {
                        if (value >= 1000000) {
                          return `$${(value / 1000000).toFixed(1)}M`;
                        } else if (value >= 1000) {
                          return `$${(value / 1000).toFixed(0)}K`;
                        } else {
                          return `$${value.toFixed(0)}`;
                        }
                      }}
                      tick={{ fontSize: 10 }}
                    />
                    <Tooltip 
                      formatter={(value) => [formatCurrency(value), 'Median Cost/Dwelling']}
                      labelFormatter={(label, data) => data[0]?.payload?.fullType || label}
                      contentStyle={{ 
                        backgroundColor: 'white', 
                        borderRadius: '8px',
                        border: '1px solid #e5e7eb',
                        padding: '8px'
                      }}
                    />
                    <Bar 
                      dataKey="medianCost" 
                      fill="#0088FE" 
                      name="Median Cost per Dwelling"
                      radius={[4, 4, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-gray-500">
                  <p>No residential cost data available</p>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default DevCharts; 
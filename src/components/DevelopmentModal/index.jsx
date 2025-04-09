import React, { useState, useEffect, useMemo } from 'react';
import { 
  X, 
  FileSpreadsheet,
  Construction,
  Loader2,
  Info,
  CheckCircle2,
  Building,
  ArrowUpDown,
  MapPin,
  Home,
  CalendarDays,
  Clock,
  DollarSign,
  Tag,
  Users,
  PieChart as PieChartIcon,
  BarChart as BarChartIcon,
  Filter,
  XCircle,
  ChevronDown,
  FileText,
  Search,
  RefreshCw,
  Crosshair,
  Globe
} from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell, Sector
} from 'recharts';
import { motion, AnimatePresence } from 'framer-motion';
import { rpc } from '@gi-nx/iframe-sdk';
import { lgaMapping } from '../../utils/councilLgaMapping';
import * as turf from '@turf/turf';
import { formatCurrency, formatDate } from '../../utils/formatters';
import { createDevelopmentLayer, removeDevelopmentLayer, getTransformedDevelopmentType } from './mapLayerUtils';
import { developmentCategories, getDevelopmentCategory } from './developmentTypes';
import InfoTooltip from './InfoTooltip';
import Autocomplete from '../Autocomplete';
import { getCouncilFromLga, getAllLgas } from '../../utils/councilLgaMapping';
import AnimatedDevLogo from '../../animatedLogo';
import { tooltipContent } from './tooltipContent';

// Define residential development types
const RESIDENTIAL_TYPES = new Set([
  'Dwelling',
  'Dwelling house',
  'Secondary dwelling',
  'Dual occupancy',
  'Dual occupancy (attached)',
  'Dual occupancy (detached)',
  'Residential flat building',
  'Multi-dwelling housing',
  'Multi-dwelling housing (terraces)',
  'Semi-attached dwelling',
  'Attached dwelling',
  'Semi-detached dwelling',
  'Shop top housing',
  'Boarding house',
  'Seniors housing',
  'Group homes',
  'Group home',
  'Group home (permanent)',
  'Group home (transitional)',
  'Build-to-rent',
  'Co-living',
  'Co-living housing',
  'Manufactured home',
  'Moveable dwelling',
  "Rural worker's dwelling",
  'Independent living units',
  'Manor house',
  'Medium Density Housing',
  'Non-standard Housing',
  'Residential Accommodation',
  'Manor houses'
]);

// Constants for application status colors
const STATUS_COLORS = {
  'Lodged': '#FFA500',      // Orange
  'Under Assessment': '#0000FF', // Blue
  'On Exhibition': '#800080',    // Purple
  'Determined': '#008000',   // Green
  'Withdrawn': '#FF0000',    // Red
  'default': '#666666'       // Grey
};

// New InfoModal component for deduplication information
const InfoModal = ({ isOpen, onClose }) => {
  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[80vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold">Data Processing Information</h2>
            <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
              <X className="w-5 h-5" />
            </button>
          </div>
          
          <div className="prose">
            <h3>Deduplication Process</h3>
            <p>
              Development applications are automatically deduplicated to prevent multiple entries for the same development appearing in the table.
            </p>
            
            <h4>How Deduplication Works:</h4>
            <ol>
              <li>Applications with the same Planning Portal Application Number (PAN) are grouped, keeping only the most recent version.</li>
              <li>Applications without a PAN are grouped by address and cost.</li>
              <li>When multiple application types exist for the same development (e.g., DA and MOD):
                <ul>
                  <li>Modification applications (MOD) are preferred over original applications (DA) when they're more recent</li>
                  <li>Applications are further sorted by lodgement date to show the most up-to-date information</li>
                </ul>
              </li>
            </ol>
            
            <h4>Why This Matters:</h4>
            <p>
              This approach ensures you see only the most relevant version of each development application, 
              reducing clutter and providing a clearer picture of development activity in the area.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

const DevelopmentModal = ({ isOpen, onClose, selectedFeatures, fullscreen = false }) => {
  const [developmentData, setDevelopmentData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [featureProperties, setFeatureProperties] = useState(null);
  const [activeTab, setActiveTab] = useState("all");
  const [developmentLayer, setDevelopmentLayer] = useState(null);
  const [summaryData, setSummaryData] = useState({
    totalApplications: 0,
    byStatus: {},
    byType: {},
    byResidentialType: {},
    totalValue: 0,
    totalDwellings: 0
  });
  const [totalFeatures, setTotalFeatures] = useState(0);
  const [hasLoadedData, setHasLoadedData] = useState(false);
  const [fetchDate, setFetchDate] = useState(null);
  
  // New state for LGA selector
  const [selectedLga, setSelectedLga] = useState('');
  const [validationError, setValidationError] = useState('');
  const [isChangingLga, setIsChangingLga] = useState(false);
  
  // New state for auto-detection
  const [isDetectingLga, setIsDetectingLga] = useState(false);
  const [autoDetectError, setAutoDetectError] = useState(null);
  
  // Filter states
  const [filters, setFilters] = useState({
    developmentType: null,
    status: null,
    developmentCategory: null,
    applicationType: null,
    value: { operator: null, value1: null, value2: null },
    dwellings: { operator: null, value1: null, value2: null },
    lodgedDate: { operator: null, date1: null, date2: null }
  });
  const [activeFilterCard, setActiveFilterCard] = useState(null);
  
  // Count active filters
  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (filters.developmentType) count++;
    if (filters.status) count++;
    if (filters.developmentCategory) count++;
    if (filters.applicationType) count++;
    if (filters.value.operator) count++;
    if (filters.dwellings.operator) count++;
    if (filters.lodgedDate.operator) count++;
    return count;
  }, [filters]);

  // Function to fetch development application data
  const fetchDevelopmentData = async (lgaNameToFetch) => {
    try {
      setLoading(true);
      setError(null);
      setFetchDate(new Date());
      
      let lgaToUse = lgaNameToFetch;
      
      // If lgaNameToFetch is provided, use it directly
      // Otherwise try to get it from the selected features
      if (!lgaToUse && selectedFeatures && selectedFeatures.length > 0) {
        const primaryFeature = selectedFeatures[0];
        setFeatureProperties(primaryFeature?.properties?.copiedFrom || {});
        
        // Get LGA name from properties
        lgaToUse = primaryFeature?.properties?.copiedFrom?.site_suitability__LGA;
      }
      
      // Set the selected LGA in the state
      if (lgaToUse) {
        setSelectedLga(lgaToUse);
      }
      
      if (lgaToUse) {
        // Find the council name from the mapping
        const councilName = getCouncilFromLga(lgaToUse);
        
        if (councilName) {
          console.log('Fetching DAs for council:', councilName);
          const daFeatures = await fetchAllDAs(councilName);
          
          // De-duplicate DAs based on address and value
          const dedupedDaFeatures = deduplicateDAs(daFeatures);
          console.log(`De-duplicated ${daFeatures.length - dedupedDaFeatures.length} entries`);
          
          // Create turf polygon for property boundary if selected features has geometry
          let propertyPolygon;
          if (selectedFeatures && selectedFeatures.length > 0) {
            try {
              const primaryFeature = selectedFeatures[0];
              if (primaryFeature.geometry?.coordinates && primaryFeature.geometry?.coordinates.length > 0) {
                propertyPolygon = turf.polygon(primaryFeature.geometry.coordinates);
              }
            } catch (error) {
              console.error('Error creating turf polygon:', error);
            }
          }
          
          // Filter DAs to only those within property boundaries if we have a valid polygon
          let dasToDisplay = dedupedDaFeatures;
          if (propertyPolygon) {
            const dasWithinBoundary = dedupedDaFeatures.filter(da => {
              if (da.Location?.[0]?.X && da.Location?.[0]?.Y) {
                try {
                  const point = turf.point([parseFloat(da.Location[0].X), parseFloat(da.Location[0].Y)]);
                  return turf.booleanPointInPolygon(point, propertyPolygon);
                } catch (error) {
                  console.error('Error checking if point is in polygon:', error);
                  return false;
                }
              }
              return false;
            });
            
            // Only use filtered DAs if we found some, otherwise use all DAs from the LGA
            if (dasWithinBoundary.length > 0) {
              dasToDisplay = dasWithinBoundary;
            }
          }
          
          console.log('Found DAs:', {
            total: daFeatures.length,
            deduplicated: dedupedDaFeatures.length,
            displayed: dasToDisplay.length
          });
          
          setDevelopmentData(dasToDisplay);
          
          // Calculate summary statistics
          const summaryData = calculateSummaryStats(dasToDisplay);
          setSummaryData(summaryData);
          setHasLoadedData(true);
          
          // Remove old development layer if exists
          if (developmentLayer) {
            await removeDevelopmentLayer(developmentLayer);
            setDevelopmentLayer(null);
          }
        } else {
          setError(`Could not find council name mapping for LGA: ${lgaToUse}`);
        }
      } else {
        // Don't set an error on initial load when no LGA is selected yet
        if (hasLoadedData) {
          setError('No LGA information found for selected property');
        }
      }
    } catch (err) {
      console.error('Error fetching development data:', err);
      setError('Failed to load development applications');
    } finally {
      setLoading(false);
      setIsChangingLga(false);
    }
  };

  // Handle changing the LGA selection
  const handleChangeLga = () => {
    if (!selectedLga.trim()) {
      setValidationError('Please enter an LGA name');
      return;
    }
    
    // Validate the LGA exists in our mapping
    const councilName = getCouncilFromLga(selectedLga);
    if (!councilName) {
      setValidationError(`Could not find council name mapping for LGA: ${selectedLga}`);
      return;
    }
    
    // Clear validation errors and reset data state
    setValidationError('');
    setIsChangingLga(true);
    
    // Only reset data if we're changing to a different LGA
    if (hasLoadedData) {
      setSummaryData({
        totalApplications: 0,
        byStatus: {},
        byType: {},
        byResidentialType: {},
        totalValue: 0,
        totalDwellings: 0
      });
    }
    
    // Create a mock feature with the selected LGA
    const mockFeature = {
      type: 'Feature',
      properties: {
        copiedFrom: {
          site_suitability__LGA: selectedLga
        }
      },
      geometry: {
        type: 'Polygon',
        coordinates: [[
          [151.20, -33.88],
          [151.25, -33.88],
          [151.25, -33.85],
          [151.20, -33.85],
          [151.20, -33.88]
        ]]
      }
    };
    
    // Set the feature properties for display
    setFeatureProperties({
      site_suitability__LGA: selectedLga
    });
    
    // Reset flags to trigger data fetch
    setHasLoadedData(false);
    
    // Fetch data for the new LGA
    fetchDevelopmentData(selectedLga);
  };

  // Function to deduplicate development applications
  const deduplicateDAs = (applications) => {
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

  // Only fetch data when modal is first opened
  useEffect(() => {
    if (isOpen && !hasLoadedData && selectedFeatures && selectedFeatures.length > 0 && selectedFeatures[0]?.properties?.copiedFrom?.site_suitability__LGA) {
        fetchDevelopmentData();
    }
    
    // Cleanup function to remove layers when modal is closed
    return () => {
        // Remove all development layers on close
        if (developmentLayer) {
            removeDevelopmentLayer(developmentLayer);
        }
    };
  }, [isOpen, selectedFeatures, hasLoadedData]);

  // Helper function to fetch all DA pages
  async function fetchAllDAs(councilName) {
    const allDAs = [];
    let pageNumber = 1;
    const pageSize = 2000; // Increased page size for faster retrieval
    
    try {
      console.log(`Fetching DAs for council: ${councilName}`);
      
      const API_BASE_URL = process.env.NODE_ENV === 'development' 
        ? 'http://localhost:3000'
        : 'https://proxy-server.jameswilliamstrutt.workers.dev';

      // Format the filters object according to the API requirements
      const apiFilters = {
        CouncilName: [councilName],
        // Removed CostOfDevelopmentFrom filter as requested
        LodgementDateFrom: '2020-01-01' // Fixed date as requested
      };

      console.log('Using API filters:', apiFilters);

      const requestBody = {
        url: 'https://api.apps1.nsw.gov.au/eplanning/data/v0/OnlineDA',
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'PageSize': pageSize.toString(),
          'PageNumber': pageNumber.toString(),
          'filters': JSON.stringify({ filters: apiFilters })
        }
      };

      console.log('Sending API request to fetch DAs');
      
      try {
        const response = await fetch(`${API_BASE_URL}${process.env.NODE_ENV === 'development' ? '/api/proxy' : ''}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          },
          body: JSON.stringify(requestBody)
        });

        if (!response.ok) {
          const errorText = await response.text();
          console.error('Non-OK response from API:', {
            status: response.status,
            statusText: response.statusText,
            errorText: errorText.substring(0, 200) // Limit error text length to avoid console spam
          });
          
          throw new Error(`API responded with ${response.status}: ${response.statusText}`);
        }

        const data = await response.json();
        console.log('Received API response:', {
          totalRecords: data.TotalRecords || 0,
          totalPages: data.TotalPages || 0,
          applicationCount: data.Application?.length || 0
        });
        
        // Log a sample response to see the structure
        if (data?.Application?.length > 0) {
          console.log('Sample Development Application:', JSON.stringify(data.Application[0], null, 2));
          
          // Log some key properties for the first few applications
          const sampleCount = Math.min(3, data.Application.length);
          console.log(`Sample ${sampleCount} Development Applications:`, 
            data.Application.slice(0, sampleCount).map(app => ({
              address: app.Location?.[0]?.FullAddress,
              status: app.ApplicationStatus,
              cost: app.CostOfDevelopment,
              lodgementDate: app.LodgementDate,
              description: app.DevelopmentDescription,
              type: app.DevelopmentType?.[0]?.DevelopmentType || 'N/A',
              coords: app.Location?.[0] ? [app.Location[0].X, app.Location[0].Y] : null
            }))
          );
        }

        if (!data || !data.Application) {
          console.error('Invalid response format:', data);
          throw new Error('Invalid response format from DA API');
        }

        // Add all applications from this page
        allDAs.push(...data.Application);

        // Fetch all pages as requested (no cap)
        const maxPages = data.TotalPages || 1;
        
        if (maxPages > 1) {
          console.log(`Fetching ${maxPages - 1} additional pages...`);
          
          // Use sequential fetching instead of Promise.all to prevent rate limiting
          for (let page = 2; page <= maxPages; page++) {
            console.log(`Fetching page ${page}/${maxPages}...`);
            
            try {
              const pageResponse = await fetch(`${API_BASE_URL}${process.env.NODE_ENV === 'development' ? '/api/proxy' : ''}`, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  'Accept': 'application/json'
                },
                body: JSON.stringify({
                  url: 'https://api.apps1.nsw.gov.au/eplanning/data/v0/OnlineDA',
                  method: 'GET',
                  headers: {
                    'Accept': 'application/json',
                    'PageSize': pageSize.toString(),
                    'PageNumber': page.toString(),
                    'filters': JSON.stringify({ filters: apiFilters })
                  }
                })
              });
              
              if (!pageResponse.ok) {
                console.warn(`Failed to fetch page ${page}, continuing with data we have`);
                continue;
              }
              
              const pageData = await pageResponse.json();
              
              if (pageData?.Application) {
                allDAs.push(...pageData.Application);
                console.log(`Added ${pageData.Application.length} applications from page ${page}`);
              }
              
              // Minimal delay between requests while still avoiding rate limiting
              await new Promise(resolve => setTimeout(resolve, 50));
              
            } catch (pageError) {
              console.warn(`Error fetching page ${page}, skipping:`, pageError);
              // Continue with the data we have
            }
          }
        }
      } catch (fetchError) {
        console.error('Error during API fetch:', fetchError);
        throw fetchError;
      }

      console.log(`Successfully fetched ${allDAs.length} DAs`);
      return allDAs;
    } catch (error) {
      console.error('Error fetching DAs:', error);
      throw error; // Re-throw so the UI can show error state
    }
  }

  // Helper function to check if a development type is residential
  const isResidentialType = (type) => {
    return RESIDENTIAL_TYPES.has(type);
  };

  // Helper function to calculate summary statistics for the development applications
  const calculateSummaryStats = (applications) => {
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

  // Function to remove all development application layers from the map
  const removeAllDevelopmentLayers = async () => {
    try {
      console.log('Removing all development application layers');
      
      // Remove the main development layer if we have its ID
      if (developmentLayer) {
        await removeDevelopmentLayer(developmentLayer);
      }
      
      setDevelopmentLayer(null);
    } catch (error) {
      console.error('Error removing development layers:', error);
    }
  };

  // Function to get abbreviated application type
  const getAbbreviatedAppType = (type) => {
    if (!type) return '';
    
    if (type.toLowerCase().includes('development application')) return 'DA';
    if (type.toLowerCase().includes('modification')) return 'MOD';
    if (type.toLowerCase().includes('review')) return 'REV';
    
    // First letter of each word as fallback
    return type.split(' ').map(word => word[0]).join('');
  };

  // Filter development applications based on all active filters
  const getFilteredApplications = () => {
    // Start with applications filtered by the active tab if needed
    let filtered = activeTab === 'all' ? developmentData : developmentData.filter(app => app.ApplicationStatus === activeTab);
    
    // Apply development type filter
    if (filters.developmentType) {
      filtered = filtered.filter(app => {
        const transformedType = getTransformedDevelopmentType(app.DevelopmentType || []);
        return transformedType === filters.developmentType;
      });
    }
    
    // Apply development category filter
    if (filters.developmentCategory) {
      filtered = filtered.filter(app => {
        if (!app.DevelopmentType || !Array.isArray(app.DevelopmentType)) return false;
        
        // First get the transformed type
        const transformedType = getTransformedDevelopmentType(app.DevelopmentType);
        
        // Then check if its category matches the filter
        const category = getDevelopmentCategory(transformedType.split(',')[0].trim());
        return category === filters.developmentCategory;
      });
    }
    
    // Apply application type filter
    if (filters.applicationType) {
      filtered = filtered.filter(app => 
        app.ApplicationType && app.ApplicationType.toLowerCase().includes(filters.applicationType.toLowerCase())
      );
    }
    
    // Apply status filter
    if (filters.status) {
      filtered = filtered.filter(app => app.ApplicationStatus === filters.status);
    }
    
    // Apply value filter
    if (filters.value.operator) {
      filtered = filtered.filter(app => {
        const value = app.CostOfDevelopment || 0;
        switch (filters.value.operator) {
          case 'lessThan':
            return value < filters.value.value1;
          case 'greaterThan':
            return value > filters.value.value1;
          case 'between':
            return value >= filters.value.value1 && value <= filters.value.value2;
          default:
            return true;
        }
      });
    }
    
    // Apply dwellings filter
    if (filters.dwellings.operator) {
      filtered = filtered.filter(app => {
        const dwellings = Number(app.NumberOfNewDwellings) || 0;
        switch (filters.dwellings.operator) {
          case 'lessThan':
            return dwellings < filters.dwellings.value1;
          case 'greaterThan':
            return dwellings > filters.dwellings.value1;
          case 'between':
            return dwellings >= filters.dwellings.value1 && dwellings <= filters.dwellings.value2;
          default:
            return true;
        }
      });
    }
    
    // Apply lodged date filter
    if (filters.lodgedDate.operator) {
      filtered = filtered.filter(app => {
        if (!app.LodgementDate) return false;
        
        const lodgedDate = new Date(app.LodgementDate);
        const date1 = filters.lodgedDate.date1 ? new Date(filters.lodgedDate.date1) : null;
        const date2 = filters.lodgedDate.date2 ? new Date(filters.lodgedDate.date2) : null;
        
        switch (filters.lodgedDate.operator) {
          case 'before':
            return date1 && lodgedDate < date1;
          case 'after':
            return date1 && lodgedDate > date1;
          case 'between':
            return date1 && date2 && lodgedDate >= date1 && lodgedDate <= date2;
          default:
            return true;
        }
      });
    }
    
    return filtered;
  };
  
  // Apply filters to all data including summary stats
  useEffect(() => {
    if (developmentData.length > 0) {
      const filteredData = getFilteredApplications();
      const newSummaryData = calculateSummaryStats(filteredData);
      setSummaryData(newSummaryData);
    }
  }, [filters, activeTab, developmentData]);
  
  // Handle filter changes
  const setFilter = (filterType, value) => {
    setFilters(prev => ({
      ...prev,
      [filterType]: value
    }));
  };
  
  // Reset a specific filter
  const resetFilter = (filterType) => {
    if (filterType === 'value' || filterType === 'dwellings' || filterType === 'lodgedDate') {
      setFilters(prev => ({
        ...prev,
        [filterType]: { operator: null, value1: null, value2: null }
      }));
    } else {
      setFilters(prev => ({
        ...prev,
        [filterType]: null
      }));
    }
  };
  
  // Reset all filters
  const resetAllFilters = () => {
    setFilters({
      developmentType: null,
      status: null,
      value: { operator: null, value1: null, value2: null },
      dwellings: { operator: null, value1: null, value2: null },
      lodgedDate: { operator: null, date1: null, date2: null }
    });
  };
  
  // Toggle filter card
  const toggleFilterCard = (cardName) => {
    setActiveFilterCard(activeFilterCard === cardName ? null : cardName);
  };

  // Format date as requested "7 April 2025"
  const formatDateLong = (date) => {
    if (!date) return 'Unknown';
    
    // Convert to Date object if it's a string
    const dateObj = date instanceof Date ? date : new Date(date);
    if (isNaN(dateObj)) return 'Unknown';
    
    const day = dateObj.getDate();
    const month = dateObj.toLocaleString('en-US', { month: 'long' });
    const year = dateObj.getFullYear();
    
    return `${day} ${month} ${year}`;
  };
  
  // Format date as requested "2 Jan 24" for table display
  const formatDateShort = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    if (isNaN(date)) return dateString;
    
    const day = date.getDate();
    const month = date.toLocaleString('en-US', { month: 'short' });
    const year = date.getFullYear().toString().substring(2);
    
    return `${day} ${month} ${year}`;
  };
  
  // Format cost as requested: $#.#M if >= $1M, otherwise $###K
  const formatCostShort = (cost) => {
    if (!cost || isNaN(cost)) return '$0';
    
    if (cost >= 1000000) {
      return `$${(cost / 1000000).toFixed(1)}M`;
    } else {
      return `$${Math.round(cost / 1000).toFixed(0)}K`;
    }
  };
  
  // Get development type description with truncation
  const getDevelopmentType = (application) => {
    if (!application.DevelopmentType || !Array.isArray(application.DevelopmentType)) {
      return 'Not specified';
    }
    
    const typeText = getTransformedDevelopmentType(application.DevelopmentType);
    const maxLength = 15;
    const displayText = typeText.length > maxLength ? typeText.substring(0, maxLength) + '...' : typeText;
    
    // Get category based on the transformed type, not just the first raw type
    // Extract the primary type from the transformed text (before any comma)
    const primaryTransformedType = typeText.split(',')[0].trim();
    
    // Get category for the primary transformed type
    const category = getDevelopmentCategory(primaryTransformedType);
    const categoryData = developmentCategories[category] || { icon: FileSpreadsheet, color: '#666666' };
    const IconComponent = categoryData.icon;
    
    return (
      <div className="flex items-center gap-1">
        <IconComponent size={16} color={categoryData.color} />
        <span>{displayText}</span>
      </div>
    );
  };
  
  // Fly to a specific point on the map
  const flyToPoint = (x, y) => {
    if (!x || !y || isNaN(x) || isNaN(y)) return;
    
    try {
      rpc.invoke('flyTo', {
        center: [parseFloat(x), parseFloat(y)],
        zoom: 18,
        pitch: 0,
        bearing: 0,
        speed: 1.2,
        curve: 1.5
      }).catch(err => console.error('Error during flyTo:', err));
    } catch (error) {
      console.error('Could not execute flyTo:', error);
    }
  };
  
  // Sorting state
  const [sortField, setSortField] = useState('LodgementDate');
  const [sortDirection, setSortDirection] = useState('desc'); // 'asc' or 'desc'
  
  // Toggle sorting when a column header is clicked
  const toggleSort = (field) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc'); // Default to descending when changing fields
    }
  };
  
  // Get sorted applications based on sort field and direction
  const getSortedFilteredApplications = () => {
    const filtered = getFilteredApplications();
    
    return [...filtered].sort((a, b) => {
      let valueA, valueB;
      
      // Extract values based on sortField
      switch (sortField) {
        case 'address':
          valueA = a.Location?.[0]?.FullAddress || '';
          valueB = b.Location?.[0]?.FullAddress || '';
          break;
        case 'type':
          valueA = getTransformedDevelopmentType(a.DevelopmentType || []);
          valueB = getTransformedDevelopmentType(b.DevelopmentType || []);
          break;
        case 'status':
          valueA = a.ApplicationStatus || '';
          valueB = b.ApplicationStatus || '';
          break;
        case 'cost':
          valueA = a.CostOfDevelopment || 0;
          valueB = b.CostOfDevelopment || 0;
          break;
        case 'dwellings':
          valueA = a.NumberOfNewDwellings || 0;
          valueB = b.NumberOfNewDwellings || 0;
          break;
        case 'LodgementDate':
          valueA = a.LodgementDate ? new Date(a.LodgementDate) : new Date(0);
          valueB = b.LodgementDate ? new Date(b.LodgementDate) : new Date(0);
          break;
        case 'DeterminationDate':
          valueA = a.DeterminationDate ? new Date(a.DeterminationDate) : new Date(0);
          valueB = b.DeterminationDate ? new Date(b.DeterminationDate) : new Date(0);
          break;
        case 'description':
          valueA = a.DevelopmentDescription || '';
          valueB = b.DevelopmentDescription || '';
          break;
        case 'applicant':
          valueA = a.Applicant || '';
          valueB = b.Applicant || '';
          break;
        default:
          return 0;
      }
      
      // Compare values
      let comparison;
      if (typeof valueA === 'string' && typeof valueB === 'string') {
        comparison = valueA.localeCompare(valueB);
      } else {
        comparison = valueA > valueB ? 1 : valueA < valueB ? -1 : 0;
      }
      
      // Apply sort direction
      return sortDirection === 'asc' ? comparison : -comparison;
    });
  };

  // Handle creating GeoJSON layer
  const handleCreateGeoJSONLayer = () => {
    createDevelopmentLayer(
      developmentData,
      selectedFeatures,
      setDevelopmentLayer,
      setError,
      setTotalFeatures
    );
  };

  // Format numbers with commas
  const formatNumber = (num) => {
    if (num === null || num === undefined || isNaN(num)) return '0';
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  };
  
  // Format currency in short format: $#.#B for billions, $#.#M for millions, else $K
  const formatCurrencyShort = (value) => {
    if (!value || isNaN(value)) return '$0';
    
    if (value >= 1000000000) {
      return `$${(value / 1000000000).toFixed(1)}B`;
    } else if (value >= 1000000) {
      return `$${(value / 1000000).toFixed(1)}M`;
    } else {
      return `$${Math.round(value / 1000)}K`;
    }
  };

  // Function to get the current map bounds and calculate the centroid
  const detectCurrentLga = async () => {
    try {
      setIsDetectingLga(true);
      setAutoDetectError(null);
      
      console.log('Attempting to get map bounds...');
      
      // Try to get the current map bounds using the Giraffe SDK
      let boundsFeature = null;
      try {
        boundsFeature = await rpc.invoke('getMapBounds');
      } catch (error) {
        console.error('Error with getMapBounds:', error);
        console.log('Note: getMapBounds function not available in this environment');
        throw new Error('Map bounds detection is not available in this environment');
      }
      
      if (!boundsFeature || !boundsFeature.geometry) {
        throw new Error('Could not get map bounds');
      }
      
      // Calculate the centroid of the bounds
      const centroid = turf.centroid(boundsFeature);
      
      if (!centroid || !centroid.geometry || !centroid.geometry.coordinates) {
        throw new Error('Could not calculate map centroid');
      }
      
      // Extract coordinates [longitude, latitude]
      const [longitude, latitude] = centroid.geometry.coordinates;
      
      console.log('Map centroid coordinates:', { longitude, latitude });
      
      // Query the NSW Administrative Boundaries service to identify the LGA
      const lga = await queryLgaFromCoordinates(longitude, latitude);
      
      if (lga) {
        console.log('Detected LGA:', lga);
        setSelectedLga(lga);
        
        // Create a mock feature with the detected LGA
        const mockFeature = {
          type: 'Feature',
          properties: {
            copiedFrom: {
              site_suitability__LGA: lga
            }
          },
          geometry: {
            type: 'Polygon',
            coordinates: [[
              [longitude - 0.025, latitude - 0.025],
              [longitude + 0.025, latitude - 0.025],
              [longitude + 0.025, latitude + 0.025],
              [longitude - 0.025, latitude + 0.025],
              [longitude - 0.025, latitude - 0.025]
            ]]
          }
        };
        
        // Set feature properties and fetch data
        setFeatureProperties({
          site_suitability__LGA: lga
        });
        
        // Reset data state
        setHasLoadedData(false);
        
        // Fetch the data
        fetchDevelopmentData(lga);
      } else {
        throw new Error('Could not detect LGA at the current location');
      }
    } catch (error) {
      console.error('Error detecting LGA:', error);
      setAutoDetectError(error.message);
    } finally {
      setIsDetectingLga(false);
    }
  };

  // Detect LGA on initial load - don't auto-detect since SDK functions aren't available
  useEffect(() => {
    // Starting with an empty state is better than attempting auto-detection 
    // with functions that aren't available
    if (isOpen && selectedFeatures && selectedFeatures.length > 0 && 
        selectedFeatures[0]?.properties?.copiedFrom?.site_suitability__LGA && !hasLoadedData) {
      // Only fetch if we have a selected feature with LGA info
      fetchDevelopmentData();
    }
  }, [isOpen, selectedFeatures, hasLoadedData]);

  // Function to query the NSW Administrative Boundaries service
  const queryLgaFromCoordinates = async (longitude, latitude) => {
    try {
      // Convert from WGS84 (EPSG:4326) to Web Mercator (EPSG:3857/102100)
      // The ArcGIS REST service uses Web Mercator
      // Simple conversion formula (approximate)
      const x = longitude * 20037508.34 / 180;
      const y = Math.log(Math.tan((90 + latitude) * Math.PI / 360)) / (Math.PI / 180);
      const mercatorY = y * 20037508.34 / 180;
      
      // Construct the query URL for the ArcGIS REST service
      const serviceUrl = 'https://maps.six.nsw.gov.au/arcgis/rest/services/public/NSW_Administrative_Boundaries/MapServer/1/query';
      const params = new URLSearchParams({
        geometry: `${x},${mercatorY}`,
        geometryType: 'esriGeometryPoint',
        inSR: '102100',
        outSR: '102100',
        spatialRel: 'esriSpatialRelIntersects',
        outFields: 'lganame,councilname',
        returnGeometry: 'false',
        f: 'json'
      });
      
      // Use a proxy service to avoid CORS issues
      const proxyUrl = process.env.NODE_ENV === 'development' 
        ? 'http://localhost:3000/api/proxy'
        : 'https://proxy-server.jameswilliamstrutt.workers.dev';
      
      const response = await fetch(proxyUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          url: `${serviceUrl}?${params.toString()}`,
          method: 'GET'
        })
      });
      
      if (!response.ok) {
        throw new Error(`ArcGIS REST service responded with status: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.error) {
        throw new Error(`ArcGIS REST service error: ${data.error.message || JSON.stringify(data.error)}`);
      }
      
      if (!data.features || data.features.length === 0) {
        console.log('No LGA found at these coordinates');
        return null;
      }
      
      // Return the LGA name from the first feature
      return data.features[0].attributes.lganame;
    } catch (error) {
      console.error('Error querying LGA from coordinates:', error);
      return null;
    }
  };

  // State for project details
  const [projectDetails, setProjectDetails] = useState(null);
  const [isFetchingProjectDetails, setIsFetchingProjectDetails] = useState(false);

  // Function to fetch project details using the SDK
  const fetchProjectDetails = async () => {
    try {
      setIsFetchingProjectDetails(true);
      console.log('Attempting to fetch project details...');
      
      // Call the SDK function using rpc
      // Note: This function may not be available in all environments
      const details = await rpc.invoke('fetchProjectDetails');
      
      // Log the complete response to see the structure
      console.log('Project details raw response:', details);
      
      // Log specific parts of the response if they exist
      if (details) {
        console.log('Project details structure:', {
          keys: Object.keys(details),
          hasGeometry: !!details.geometry,
          hasBounds: !!(details.bounds || details.extent),
          hasProperties: !!details.properties,
          hasMetadata: !!details.metadata
        });
        
        // Log bounds/extent if available
        if (details.bounds) {
          console.log('Project bounds:', details.bounds);
        } else if (details.extent) {
          console.log('Project extent:', details.extent);
        }
        
        // Log geometry if available
        if (details.geometry) {
          console.log('Project geometry type:', details.geometry.type);
          console.log('Project geometry coordinates structure:', 
            Array.isArray(details.geometry.coordinates) ? 
              `Array with ${details.geometry.coordinates.length} elements` : 
              'Not an array'
          );
        }
        
        // Log properties if available
        if (details.properties) {
          console.log('Project properties:', details.properties);
          
          // Check for LGA information in properties
          const lgaProps = Object.entries(details.properties)
            .filter(([key, value]) => 
              key.toLowerCase().includes('lga') || 
              (typeof value === 'string' && value.toLowerCase().includes('lga'))
            );
          
          if (lgaProps.length > 0) {
            console.log('Potential LGA properties found:', lgaProps);
          }
        }
      }
      
      // Store the project details in state
      setProjectDetails(details);
      
      return details;
    } catch (error) {
      console.error('Error fetching project details:', error);
      console.log('Note: fetchProjectDetails may not be available in this environment.');
      return null;
    } finally {
      setIsFetchingProjectDetails(false);
    }
  };

  // Get LGA options for dropdown
  const [lgaOptions, setLgaOptions] = useState([]);
  
  // Load LGA options on component mount
  useEffect(() => {
    // Use the same getAllLgas function that the Autocomplete component uses
    const formattedLgaOptions = getAllLgas();
    setLgaOptions(formattedLgaOptions);
  }, []);

  const [showInfoModal, setShowInfoModal] = useState(false);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className={`${fullscreen ? 'fixed inset-0 z-50' : 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50'}`}>
          <motion.div 
            initial={{ opacity: 0, scale: fullscreen ? 1 : 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: fullscreen ? 1 : 0.95 }}
            className={`bg-white ${fullscreen ? 'w-full h-full' : 'rounded-lg shadow-xl w-full max-w-6xl h-[90vh]'} flex flex-col`}
          >
            <div className="flex items-center justify-between p-4 border-b">
              <div className="flex flex-col">
                <div className="flex items-center">
                  <div className="mr-4">
                    <AnimatedDevLogo />
                  </div>
                  <h2 className="text-xl font-semibold">Development Applications</h2>
                </div>
                {!loading && !error && featureProperties && (
                  <p className="text-sm text-gray-500 mt-1 ml-8">
                    Data as of: {fetchDate ? formatDateLong(fetchDate) : 'Unknown'}
                  </p>
                )}
              </div>
              <button
                onClick={onClose}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* LGA Selector */}
            <div className="px-4 py-3 bg-gray-50 border-b flex items-center">
              <div className="flex-1 flex items-center gap-3 flex-wrap">
                <div className="text-sm font-medium text-gray-700">LGA:</div>
                <div className="relative flex-1 max-w-md">
                  <div className="relative">
                    <Autocomplete
                      value={selectedLga}
                      onChange={(value) => {
                        setSelectedLga(value);
                        setValidationError(''); // Clear error when selection changes
                      }}
                      placeholder="Search or select an LGA..."
                    />
                    <div className="absolute inset-y-0 right-0 flex items-center pr-2">
                      <button
                        type="button"
                        className="text-gray-400 hover:text-gray-600 focus:outline-none"
                        onClick={() => setActiveFilterCard(activeFilterCard === 'lgaDropdown' ? null : 'lgaDropdown')}
                        aria-label="Open LGA dropdown"
                      >
                        <ChevronDown className="h-5 w-5" />
                      </button>
                    </div>
                    
                    {/* Custom dropdown menu that matches Autocomplete styling */}
                    {activeFilterCard === 'lgaDropdown' && (
                      <div className="absolute z-10 mt-1 w-full bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-auto">
                        <div className="py-1">
                          {lgaOptions.map(option => (
                            <div
                              key={option.value}
                              className={`px-4 py-2 text-sm hover:bg-blue-50 cursor-pointer ${selectedLga === option.value ? 'bg-blue-50 text-blue-700' : 'text-gray-700'}`}
                              onClick={() => {
                                setSelectedLga(option.value);
                                setValidationError('');
                                setActiveFilterCard(null);
                              }}
                            >
                              {option.display}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
                <button
                  onClick={handleChangeLga}
                  disabled={loading || isChangingLga}
                  className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5"
                >
                  {isChangingLga ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <RefreshCw className="w-4 h-4" />
                  )}
                  <span>{hasLoadedData ? 'Change LGA' : 'View Data'}</span>
                </button>
                
                {(validationError || autoDetectError) && (
                  <div className="text-red-600 text-sm ml-2">
                    {validationError || autoDetectError}
                  </div>
                )}
              </div>
            </div>

            {/* Loading state */}
            {loading ? (
              <div className="flex-1 flex items-center justify-center">
                <div className="text-center">
                  <Loader2 className="w-10 h-10 mb-4 mx-auto animate-spin text-blue-600" />
                  <p className="text-gray-600">Loading development applications...</p>
                </div>
              </div>
            ) : error && hasLoadedData ? (
              <div className="flex-1 flex items-center justify-center">
                <div className="text-center max-w-md mx-auto p-6 bg-red-50 rounded-lg">
                  <div className="text-red-600 mb-2">
                    <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-semibold text-red-800 mb-2">Error Loading Data</h3>
                  <p className="text-red-700">{error}</p>
                </div>
              </div>
            ) : !hasLoadedData ? (
              <div className="flex-1 flex items-center justify-center bg-gradient-to-b from-white to-gray-50">
                <div className="w-full max-w-3xl mx-auto px-6 py-12">
                  <div className="text-center mb-8">
                    <h2 className="text-2xl font-bold text-gray-900 mb-3">NSW Development Applications</h2>
                    <p className="text-gray-600 max-w-lg mx-auto">
                      Access and analyse development applications across New South Wales. Select a Local Government Area to begin.
                    </p>
                  </div>
                  
                  <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm mb-8">
                    <h3 className="text-lg font-semibold text-gray-800 mb-3">{tooltipContent.deduplicationInfo.title}</h3>
                    <div className="text-sm text-gray-600 whitespace-pre-line">
                      {tooltipContent.deduplicationInfo.content}
                    </div>
                    <div className="mt-3 text-xs text-gray-500">
                      {tooltipContent.deduplicationInfo.source} - <a href={tooltipContent.deduplicationInfo.sourceLink} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">View source</a>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-200 flex flex-col items-center">
                      <Globe className="w-10 h-10 text-blue-600 mb-3" />
                      <h3 className="text-base font-semibold text-gray-800">NSW Planning Portal</h3>
                    </div>
                    
                    <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-200 flex flex-col items-center">
                      <CalendarDays className="w-10 h-10 text-blue-600 mb-3" />
                      <h3 className="text-base font-semibold text-gray-800">Live Data</h3>
                    </div>
                    
                    <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-200 flex flex-col items-center">
                      <BarChartIcon className="w-10 h-10 text-blue-600 mb-3" />
                      <h3 className="text-base font-semibold text-gray-800">Advanced Analytics</h3>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex-1 overflow-hidden flex flex-col">
                {/* Global filters */}
                <div className="p-4 bg-white border-b">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-sm font-medium text-gray-700 flex items-center">
                      <Filter className="w-4 h-4 mr-1.5 text-blue-500" />
                      Filters
                      {activeFilterCount > 0 && (
                        <span className="ml-2 px-2 py-0.5 bg-blue-100 text-blue-800 text-xs rounded-full">
                          {activeFilterCount}
                        </span>
                      )}
                    </h3>
                    {activeFilterCount > 0 && (
                      <button 
                        onClick={resetAllFilters}
                        className="text-xs text-blue-600 hover:text-blue-800 flex items-center"
                      >
                        <XCircle className="w-3.5 h-3.5 mr-1" />
                        Clear all filters
                      </button>
                    )}
                  </div>
                  
                  <div className="flex flex-wrap gap-2">
                    {/* Development Category Filter */}
                    <div className="relative">
                      <div 
                        onClick={() => toggleFilterCard('developmentCategory')}
                        className={`flex items-center gap-1.5 px-3 py-2 rounded-md border cursor-pointer text-sm ${filters.developmentCategory ? 'bg-blue-50 border-blue-200' : 'bg-gray-50 hover:bg-gray-100 border-gray-200'}`}
                      >
                        <FileText className="w-4 h-4 text-gray-600" />
                        {filters.developmentCategory ? (
                          <span className="max-w-[130px] truncate">{filters.developmentCategory}</span>
                        ) : (
                          <span>Development Category</span>
                        )}
                        <ChevronDown className="w-4 h-4 ml-1 text-gray-400" />
                        
                        {filters.developmentCategory && (
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              resetFilter('developmentCategory');
                            }}
                            className="ml-1 text-gray-400 hover:text-gray-600"
                          >
                            <XCircle className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                      
                      {activeFilterCard === 'developmentCategory' && (
                        <div className="absolute z-10 mt-1 bg-white border border-gray-200 rounded-md shadow-lg p-3 w-80 left-0">
                          <h4 className="font-medium text-sm mb-2">Select Development Category</h4>
                          <div className="space-y-1 max-h-80 overflow-y-auto">
                            {Object.keys(developmentCategories).length > 0 ? (
                              Object.keys(developmentCategories)
                                .sort((a, b) => a.localeCompare(b))
                                .map(category => {
                                  const IconComponent = developmentCategories[category].icon;
                                  const color = developmentCategories[category].color;
                                  return (
                                    <div 
                                      key={category}
                                      onClick={() => {
                                        setFilter('developmentCategory', category);
                                        setActiveFilterCard(null);
                                      }}
                                      className={`flex items-center justify-between px-3 py-2 text-sm rounded cursor-pointer ${filters.developmentCategory === category ? 'bg-blue-100' : 'hover:bg-gray-100'}`}
                                    >
                                      <div className="flex items-center gap-2">
                                        <IconComponent size={16} color={color} />
                                        <span className="truncate">{category}</span>
                                      </div>
                                    </div>
                                  );
                                })
                            ) : (
                              <div className="text-gray-500 text-sm">No categories available</div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                    
                    {/* Development Type Filter */}
                    <div className="relative">
                      <div 
                        onClick={() => toggleFilterCard('developmentType')}
                        className={`flex items-center gap-1.5 px-3 py-2 rounded-md border cursor-pointer text-sm ${filters.developmentType ? 'bg-blue-50 border-blue-200' : 'bg-gray-50 hover:bg-gray-100 border-gray-200'}`}
                      >
                        <Building className="w-4 h-4 text-gray-600" />
                        {filters.developmentType ? (
                          <span className="max-w-[130px] truncate">{filters.developmentType}</span>
                        ) : (
                          <span>Development Type</span>
                        )}
                        <ChevronDown className="w-4 h-4 ml-1 text-gray-400" />
                        
                        {filters.developmentType && (
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              resetFilter('developmentType');
                            }}
                            className="ml-1 text-gray-400 hover:text-gray-600"
                          >
                            <XCircle className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                      
                      {activeFilterCard === 'developmentType' && (
                        <div className="absolute z-10 mt-1 bg-white border border-gray-200 rounded-md shadow-lg p-3 w-64 max-h-80 overflow-y-auto left-0">
                          <h4 className="font-medium text-sm mb-2">Select Development Type</h4>
                          <div className="space-y-1 max-h-64 overflow-y-auto">
                            {Object.keys(summaryData.byType).length > 0 ? (
                              Object.keys(summaryData.byType)
                                .sort((a, b) => a.localeCompare(b))
                                .map(type => (
                                  <div 
                                    key={type}
                                    onClick={() => {
                                      setFilter('developmentType', type);
                                      setActiveFilterCard(null);
                                    }}
                                    className={`flex items-center justify-between px-3 py-2 text-sm rounded cursor-pointer ${filters.developmentType === type ? 'bg-blue-100' : 'hover:bg-gray-100'}`}
                                  >
                                    <span className="truncate">{type}</span>
                                    <span className="text-gray-500 text-xs">{summaryData.byType[type]}</span>
                                  </div>
                                ))
                            ) : (
                              <div className="text-gray-500 text-sm">No data available</div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                    
                    {/* Status Filter */}
                    <div className="relative">
                      <div 
                        onClick={() => toggleFilterCard('status')}
                        className={`flex items-center gap-1.5 px-3 py-2 rounded-md border cursor-pointer text-sm ${filters.status ? 'bg-blue-50 border-blue-200' : 'bg-gray-50 hover:bg-gray-100 border-gray-200'}`}
                      >
                        <Tag className="w-4 h-4 text-gray-600" />
                        {filters.status ? (
                          <span className="max-w-[130px] truncate">{filters.status}</span>
                        ) : (
                          <span>Status</span>
                        )}
                        <ChevronDown className="w-4 h-4 ml-1 text-gray-400" />
                        
                        {filters.status && (
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              resetFilter('status');
                            }}
                            className="ml-1 text-gray-400 hover:text-gray-600"
                          >
                            <XCircle className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                      
                      {activeFilterCard === 'status' && (
                        <div className="absolute z-10 mt-1 bg-white border border-gray-200 rounded-md shadow-lg p-3 w-64 left-0">
                          <h4 className="font-medium text-sm mb-2">Select Status</h4>
                          <div className="space-y-1 max-h-64 overflow-y-auto">
                            {Object.keys(summaryData.byStatus).length > 0 ? (
                              Object.keys(summaryData.byStatus)
                                .sort((a, b) => a.localeCompare(b))
                                .map(status => (
                                  <div 
                                    key={status}
                                    onClick={() => {
                                      setFilter('status', status);
                                      setActiveFilterCard(null);
                                    }}
                                    className={`flex items-center justify-between px-3 py-2 text-sm rounded cursor-pointer ${filters.status === status ? 'bg-blue-100' : 'hover:bg-gray-100'}`}
                                  >
                                    <span>{status}</span>
                                    <span className="text-gray-500 text-xs">{summaryData.byStatus[status]}</span>
                                  </div>
                                ))
                            ) : (
                              <div className="text-gray-500 text-sm">No data available</div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                    
                    {/* Add Application Type Filter */}
                    <div className="relative">
                      <div 
                        onClick={() => toggleFilterCard('applicationType')}
                        className={`flex items-center gap-1.5 px-3 py-2 rounded-md border cursor-pointer text-sm ${filters.applicationType ? 'bg-blue-50 border-blue-200' : 'bg-gray-50 hover:bg-gray-100 border-gray-200'}`}
                      >
                        <FileText className="w-4 h-4 text-gray-600" />
                        {filters.applicationType ? (
                          <span className="max-w-[130px] truncate">{filters.applicationType}</span>
                        ) : (
                          <span>Type</span>
                        )}
                        <ChevronDown className="w-4 h-4 ml-1 text-gray-400" />
                        
                        {filters.applicationType && (
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              resetFilter('applicationType');
                            }}
                            className="ml-1 text-gray-400 hover:text-gray-600"
                          >
                            <XCircle className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                      
                      {activeFilterCard === 'applicationType' && (
                        <div className="absolute z-10 mt-1 bg-white border border-gray-200 rounded-md shadow-lg p-3 w-64 left-0">
                          <h4 className="font-medium text-sm mb-2">Select Application Type</h4>
                          <div className="space-y-1 max-h-64 overflow-y-auto">
                            {[
                              'Development application',
                              'Modification application',
                              'Review of determination'
                            ].map(type => (
                              <div 
                                key={type}
                                onClick={() => {
                                  setFilter('applicationType', type);
                                  setActiveFilterCard(null);
                                }}
                                className={`flex items-center justify-between px-3 py-2 text-sm rounded cursor-pointer ${filters.applicationType === type ? 'bg-blue-100' : 'hover:bg-gray-100'}`}
                              >
                                <span>{type}</span>
                                <span className="text-xs font-medium bg-gray-100 px-1.5 py-0.5 rounded">
                                  {getAbbreviatedAppType(type)}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                    
                    {/* Value Filter */}
                    <div className="relative">
                      <div 
                        onClick={() => toggleFilterCard('value')}
                        className={`flex items-center gap-1.5 px-3 py-2 rounded-md border cursor-pointer text-sm ${filters.value.operator ? 'bg-blue-50 border-blue-200' : 'bg-gray-50 hover:bg-gray-100 border-gray-200'}`}
                      >
                        <DollarSign className="w-4 h-4 text-gray-600" />
                        {filters.value.operator ? (
                          <span className="max-w-[130px] truncate">
                            {filters.value.operator === 'lessThan' && `< $${formatNumber(filters.value.value1)}`}
                            {filters.value.operator === 'greaterThan' && `> $${formatNumber(filters.value.value1)}`}
                            {filters.value.operator === 'between' && `$${formatNumber(filters.value.value1)} - $${formatNumber(filters.value.value2)}`}
                          </span>
                        ) : (
                          <span>Value</span>
                        )}
                        <ChevronDown className="w-4 h-4 ml-1 text-gray-400" />
                        
                        {filters.value.operator && (
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              resetFilter('value');
                            }}
                            className="ml-1 text-gray-400 hover:text-gray-600"
                          >
                            <XCircle className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                      
                      {activeFilterCard === 'value' && (
                        <div className="absolute z-10 mt-1 bg-white border border-gray-200 rounded-md shadow-lg p-3 w-64 left-0">
                          <h4 className="font-medium text-sm mb-2">Filter by Value</h4>
                          
                          <div className="space-y-3">
                            <div>
                              <select 
                                className="w-full p-2 border border-gray-300 rounded text-sm"
                                value={filters.value.operator || ''}
                                onChange={(e) => {
                                  const newOperator = e.target.value || null;
                                  setFilter('value', { 
                                    ...filters.value, 
                                    operator: newOperator
                                  });
                                }}
                              >
                                <option value="">Select operator</option>
                                <option value="lessThan">Less than</option>
                                <option value="greaterThan">Greater than</option>
                                <option value="between">Between</option>
                              </select>
                            </div>
                            
                            {filters.value.operator && (
                              <div className="flex gap-2">
                                <div className="flex-1">
                                  <label className="block text-xs text-gray-500 mb-1">
                                    {filters.value.operator === 'between' ? 'Min Value ($)' : 'Value ($)'}
                                  </label>
                                  <input
                                    type="number"
                                    className="w-full p-2 border border-gray-300 rounded text-sm"
                                    value={filters.value.value1 || ''}
                                    onChange={(e) => {
                                      const newValue = e.target.value ? parseInt(e.target.value) : null;
                                      setFilter('value', { 
                                        ...filters.value, 
                                        value1: newValue 
                                      });
                                    }}
                                    placeholder="0"
                                  />
                                </div>
                                
                                {filters.value.operator === 'between' && (
                                  <div className="flex-1">
                                    <label className="block text-xs text-gray-500 mb-1">
                                      Max Value ($)
                                    </label>
                                    <input
                                      type="number"
                                      className="w-full p-2 border border-gray-300 rounded text-sm"
                                      value={filters.value.value2 || ''}
                                      onChange={(e) => {
                                        const newValue = e.target.value ? parseInt(e.target.value) : null;
                                        setFilter('value', { 
                                          ...filters.value, 
                                          value2: newValue 
                                        });
                                      }}
                                      placeholder="0"
                                    />
                                  </div>
                                )}
                              </div>
                            )}
                            
                            <div className="pt-2 flex justify-end">
                              <button
                                onClick={() => setActiveFilterCard(null)}
                                className="px-3 py-1.5 bg-blue-500 text-white rounded text-sm hover:bg-blue-600"
                                disabled={!filters.value.operator || !filters.value.value1 || (filters.value.operator === 'between' && !filters.value.value2)}
                              >
                                Apply
                              </button>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                    
                    {/* Dwellings Filter */}
                    <div className="relative">
                      <div 
                        onClick={() => toggleFilterCard('dwellings')}
                        className={`flex items-center gap-1.5 px-3 py-2 rounded-md border cursor-pointer text-sm ${filters.dwellings.operator ? 'bg-blue-50 border-blue-200' : 'bg-gray-50 hover:bg-gray-100 border-gray-200'}`}
                      >
                        <Home className="w-4 h-4 text-gray-600" />
                        {filters.dwellings.operator ? (
                          <span className="max-w-[130px] truncate">
                            {filters.dwellings.operator === 'lessThan' && `< ${filters.dwellings.value1}`}
                            {filters.dwellings.operator === 'greaterThan' && `> ${filters.dwellings.value1}`}
                            {filters.dwellings.operator === 'between' && `${filters.dwellings.value1} - ${filters.dwellings.value2}`}
                          </span>
                        ) : (
                          <span>Dwellings</span>
                        )}
                        <ChevronDown className="w-4 h-4 ml-1 text-gray-400" />
                        
                        {filters.dwellings.operator && (
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              resetFilter('dwellings');
                            }}
                            className="ml-1 text-gray-400 hover:text-gray-600"
                          >
                            <XCircle className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                      
                      {activeFilterCard === 'dwellings' && (
                        <div className="absolute z-10 mt-1 bg-white border border-gray-200 rounded-md shadow-lg p-3 w-64 left-0">
                          <h4 className="font-medium text-sm mb-2">Filter by Dwellings</h4>
                          
                          <div className="space-y-3">
                            <div>
                              <select 
                                className="w-full p-2 border border-gray-300 rounded text-sm"
                                value={filters.dwellings.operator || ''}
                                onChange={(e) => {
                                  const newOperator = e.target.value || null;
                                  setFilter('dwellings', { 
                                    ...filters.dwellings, 
                                    operator: newOperator
                                  });
                                }}
                              >
                                <option value="">Select operator</option>
                                <option value="lessThan">Less than</option>
                                <option value="greaterThan">Greater than</option>
                                <option value="between">Between</option>
                              </select>
                            </div>
                            
                            {filters.dwellings.operator && (
                              <div className="flex gap-2">
                                <div className="flex-1">
                                  <label className="block text-xs text-gray-500 mb-1">
                                    {filters.dwellings.operator === 'between' ? 'Min Dwellings' : 'Dwellings'}
                                  </label>
                                  <input
                                    type="number"
                                    className="w-full p-2 border border-gray-300 rounded text-sm"
                                    value={filters.dwellings.value1 || ''}
                                    onChange={(e) => {
                                      const newValue = e.target.value ? parseInt(e.target.value) : null;
                                      setFilter('dwellings', { 
                                        ...filters.dwellings, 
                                        value1: newValue 
                                      });
                                    }}
                                    placeholder="0"
                                  />
                                </div>
                                
                                {filters.dwellings.operator === 'between' && (
                                  <div className="flex-1">
                                    <label className="block text-xs text-gray-500 mb-1">
                                      Max Dwellings
                                    </label>
                                    <input
                                      type="number"
                                      className="w-full p-2 border border-gray-300 rounded text-sm"
                                      value={filters.dwellings.value2 || ''}
                                      onChange={(e) => {
                                        const newValue = e.target.value ? parseInt(e.target.value) : null;
                                        setFilter('dwellings', { 
                                          ...filters.dwellings, 
                                          value2: newValue 
                                        });
                                      }}
                                      placeholder="0"
                                    />
                                  </div>
                                )}
                              </div>
                            )}
                            
                            <div className="pt-2 flex justify-end">
                              <button
                                onClick={() => setActiveFilterCard(null)}
                                className="px-3 py-1.5 bg-blue-500 text-white rounded text-sm hover:bg-blue-600"
                                disabled={!filters.dwellings.operator || !filters.dwellings.value1 || (filters.dwellings.operator === 'between' && !filters.dwellings.value2)}
                              >
                                Apply
                              </button>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                    
                    {/* Lodged Date Filter */}
                    <div className="relative">
                      <div 
                        onClick={() => toggleFilterCard('lodgedDate')}
                        className={`flex items-center gap-1.5 px-3 py-2 rounded-md border cursor-pointer text-sm ${filters.lodgedDate.operator ? 'bg-blue-50 border-blue-200' : 'bg-gray-50 hover:bg-gray-100 border-gray-200'}`}
                      >
                        <CalendarDays className="w-4 h-4 text-gray-600" />
                        {filters.lodgedDate.operator ? (
                          <span className="max-w-[130px] truncate">
                            {filters.lodgedDate.operator === 'before' && `Before ${formatDateShort(filters.lodgedDate.date1)}`}
                            {filters.lodgedDate.operator === 'after' && `After ${formatDateShort(filters.lodgedDate.date1)}`}
                            {filters.lodgedDate.operator === 'between' && `${formatDateShort(filters.lodgedDate.date1)} - ${formatDateShort(filters.lodgedDate.date2)}`}
                          </span>
                        ) : (
                          <span>Lodged Date</span>
                        )}
                        <ChevronDown className="w-4 h-4 ml-1 text-gray-400" />
                        
                        {filters.lodgedDate.operator && (
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              resetFilter('lodgedDate');
                            }}
                            className="ml-1 text-gray-400 hover:text-gray-600"
                          >
                            <XCircle className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                      
                      {activeFilterCard === 'lodgedDate' && (
                        <div className="absolute z-10 mt-1 bg-white border border-gray-200 rounded-md shadow-lg p-3 w-64 left-0">
                          <h4 className="font-medium text-sm mb-2">Filter by Lodged Date</h4>
                          
                          <div className="space-y-3">
                            <div>
                              <select 
                                className="w-full p-2 border border-gray-300 rounded text-sm"
                                value={filters.lodgedDate.operator || ''}
                                onChange={(e) => {
                                  const newOperator = e.target.value || null;
                                  setFilter('lodgedDate', { 
                                    ...filters.lodgedDate, 
                                    operator: newOperator
                                  });
                                }}
                              >
                                <option value="">Select operator</option>
                                <option value="before">Before</option>
                                <option value="after">After</option>
                                <option value="between">Between</option>
                              </select>
                            </div>
                            
                            {filters.lodgedDate.operator && (
                              <div className="flex gap-2">
                                <div className="flex-1">
                                  <label className="block text-xs text-gray-500 mb-1">
                                    {filters.lodgedDate.operator === 'before' ? 'Before Date' : 
                                     filters.lodgedDate.operator === 'after' ? 'After Date' : 'Start Date'}
                                  </label>
                                  <input
                                    type="date"
                                    className="w-full p-2 border border-gray-300 rounded text-sm"
                                    value={filters.lodgedDate.date1 || ''}
                                    onChange={(e) => {
                                      setFilter('lodgedDate', { 
                                        ...filters.lodgedDate, 
                                        date1: e.target.value 
                                      });
                                    }}
                                  />
                                </div>
                                
                                {filters.lodgedDate.operator === 'between' && (
                                  <div className="flex-1">
                                    <label className="block text-xs text-gray-500 mb-1">
                                      End Date
                                    </label>
                                    <input
                                      type="date"
                                      className="w-full p-2 border border-gray-300 rounded text-sm"
                                      value={filters.lodgedDate.date2 || ''}
                                      onChange={(e) => {
                                        setFilter('lodgedDate', { 
                                          ...filters.lodgedDate, 
                                          date2: e.target.value 
                                        });
                                      }}
                                    />
                                  </div>
                                )}
                              </div>
                            )}
                            
                            <div className="pt-2 flex justify-end">
                              <button
                                onClick={() => setActiveFilterCard(null)}
                                className="px-3 py-1.5 bg-blue-500 text-white rounded text-sm hover:bg-blue-600"
                                disabled={!filters.lodgedDate.operator || !filters.lodgedDate.date1 || (filters.lodgedDate.operator === 'between' && !filters.lodgedDate.date2)}
                              >
                                Apply
                              </button>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Summary Statistics */}
                <div className="p-4 bg-gray-50 border-b">
                  {/* Key Statistics Row */}
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div key="total-apps" className="bg-white p-4 rounded-lg border shadow-sm">
                      <h3 className="text-sm font-medium text-gray-500 mb-1">Total Applications</h3>
                      <p className="text-2xl font-bold">{formatNumber(summaryData.totalApplications)}</p>
                    </div>
                    <div key="total-value" className="bg-white p-4 rounded-lg border shadow-sm">
                      <h3 className="text-sm font-medium text-gray-500 mb-1">Total Value</h3>
                      <p className="text-2xl font-bold">{formatCurrencyShort(summaryData.totalValue)}</p>
                    </div>
                    <div key="total-dwellings" className="bg-white p-4 rounded-lg border shadow-sm">
                      <h3 className="text-sm font-medium text-gray-500 mb-1">Total Dwellings</h3>
                      <p className="text-2xl font-bold">{formatNumber(summaryData.totalDwellings || 0)}</p>
                    </div>
                    <div key="determined" className="bg-white p-4 rounded-lg border shadow-sm">
                      <h3 className="text-sm font-medium text-gray-500 mb-1">Determined</h3>
                      <p className="text-2xl font-bold">{formatNumber(summaryData.byStatus['Determined'] || 0)}</p>
                    </div>
                  </div>
                  
                  {/* Charts Section */}
                  <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Residential Dwelling Types Bar Chart (changed from Pie Chart) */}
                    <div className="bg-white p-4 rounded-lg border shadow-sm">
                      <h3 className="text-sm font-medium text-gray-700 mb-2 flex items-center">
                        <BarChartIcon className="w-4 h-4 mr-1 text-blue-500" />
                        Residential Dwellings by Type
                      </h3>
                      <div className="h-64">
                        {Object.keys(summaryData.byResidentialType).length > 0 ? (
                          <ResponsiveContainer width="100%" height="100%">
                            <BarChart
                              data={(() => {
                                // Convert residential types to array and sort by count
                                return Object.entries(summaryData.byResidentialType)
                                  .map(([type, count]) => ({
                                    type: type.length > 18 ? type.substring(0, 16) + '...' : type,
                                    count,
                                    fullType: type // For tooltip
                                  }))
                                  .sort((a, b) => b.count - a.count)
                                  .slice(0, 10); // Limit to top 10 for readability
                              })()}
                              margin={{ top: 5, right: 30, left: 20, bottom: 60 }}
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
                    </div>
                    
                    {/* Development Value Chart */}
                    <div className="bg-white p-4 rounded-lg border shadow-sm">
                      <h3 className="text-sm font-medium text-gray-700 mb-2 flex items-center">
                        <BarChartIcon className="w-4 h-4 mr-1 text-blue-500" />
                        Development Values by Type
                      </h3>
                      <div className="h-64">
                        {developmentData.length > 0 ? (
                          <ResponsiveContainer width="100%" height="100%">
                            <BarChart
                              data={(() => {
                                // Calculate total value by type
                                const valueByType = {};
                                developmentData.forEach(app => {
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
                                    type: type.length > 15 ? type.substring(0, 13) + '...' : type,
                                    value,
                                    fullType: type // For tooltip
                                  }))
                                  .sort((a, b) => b.value - a.value)
                                  .slice(0, 8); // Limit to top 8 for readability
                              })()}
                              margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
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
                    </div>
                  </div>
                  
                  {/* Layer controls */}
                  <div className="mt-4 flex justify-end space-x-4 border-t pt-4">
                    {/* Info button hidden temporarily
                    <button
                      onClick={() => setShowInfoModal(true)}
                      className="px-3 py-1.5 bg-gray-50 text-gray-600 rounded-lg hover:bg-gray-100 transition-colors flex items-center gap-1 text-sm"
                    >
                      <Info className="w-4 h-4" />
                      <span>Info</span>
                    </button>
                    */}
                    
                    <button
                      onClick={handleCreateGeoJSONLayer}
                      className="px-3 py-1.5 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors flex items-center gap-1 text-sm"
                      disabled={!developmentData.length || developmentLayer}
                    >
                      <MapPin className="w-4 h-4" />
                      <span>Generate Layer</span>
                    </button>
                  </div>
                </div>

                {/* Table View */}
                <div className="flex-1 relative">
                  <div className="absolute inset-0 overflow-auto">
                    <table className="min-w-full divide-y divide-gray-200 table-fixed" style={{ maxWidth: '1000px', tableLayout: 'fixed' }}>
                      <thead className="bg-gray-50">
                        <tr>
                          <th 
                            className="sticky top-0 px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 w-48 bg-gray-50 z-10 shadow-sm"
                            onClick={() => toggleSort('address')}
                          >
                            <div className="flex items-center space-x-1">
                              <MapPin className="w-4 h-4 text-gray-400" />
                              <span>Address</span>
                              {sortField === 'address' && (
                                <ArrowUpDown className={`w-3.5 h-3.5 ${sortDirection === 'asc' ? 'text-blue-500' : 'text-blue-500 rotate-180'}`} />
                              )}
                            </div>
                          </th>
                          <th 
                            className="sticky top-0 px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 w-36 bg-gray-50 z-10 shadow-sm"
                            onClick={() => toggleSort('type')}
                          >
                            <div className="flex items-center space-x-1">
                              <Building className="w-4 h-4 text-gray-400" />
                              <span>Development Type</span>
                              {sortField === 'type' && (
                                <ArrowUpDown className={`w-3.5 h-3.5 ${sortDirection === 'asc' ? 'text-blue-500' : 'text-blue-500 rotate-180'}`} />
                              )}
                            </div>
                          </th>
                          <th 
                            className="sticky top-0 px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 w-28 bg-gray-50 z-10 shadow-sm"
                            onClick={() => toggleSort('status')}
                          >
                            <div className="flex items-center space-x-1">
                              <Tag className="w-4 h-4 text-gray-400" />
                              <span>Status</span>
                              {sortField === 'status' && (
                                <ArrowUpDown className={`w-3.5 h-3.5 ${sortDirection === 'asc' ? 'text-blue-500' : 'text-blue-500 rotate-180'}`} />
                              )}
                            </div>
                          </th>
                          <th 
                            className="sticky top-0 px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 w-28 bg-gray-50 z-10 shadow-sm"
                            onClick={() => toggleSort('applicationType')}
                          >
                            <div className="flex items-center space-x-1">
                              <FileText className="w-4 h-4 text-gray-400" />
                              <span>Type</span>
                              {sortField === 'applicationType' && (
                                <ArrowUpDown className={`w-3.5 h-3.5 ${sortDirection === 'asc' ? 'text-blue-500' : 'text-blue-500 rotate-180'}`} />
                              )}
                            </div>
                          </th>
                          <th 
                            className="group px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 w-20 bg-gray-50 sticky top-0 z-10 shadow-sm"
                            onClick={() => toggleSort('cost')}
                          >
                            <div className="flex items-center space-x-1">
                              <DollarSign className="w-4 h-4 text-gray-400" />
                              <span>Value</span>
                              {sortField === 'cost' && (
                                <ArrowUpDown className={`w-3.5 h-3.5 ${sortDirection === 'asc' ? 'text-blue-500' : 'text-blue-500 rotate-180'}`} />
                              )}
                            </div>
                          </th>
                          <th 
                            className="group px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 w-24 bg-gray-50 sticky top-0 z-10 shadow-sm"
                            onClick={() => toggleSort('dwellings')}
                          >
                            <div className="flex items-center space-x-1">
                              <Home className="w-4 h-4 text-gray-400" />
                              <span>Dwellings</span>
                              {sortField === 'dwellings' && (
                                <ArrowUpDown className={`w-3.5 h-3.5 ${sortDirection === 'asc' ? 'text-blue-500' : 'text-blue-500 rotate-180'}`} />
                              )}
                            </div>
                          </th>
                          <th 
                            className="group px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 w-24 bg-gray-50 sticky top-0 z-10 shadow-sm"
                            onClick={() => toggleSort('LodgementDate')}
                          >
                            <div className="flex items-center space-x-1">
                              <Clock className="w-4 h-4 text-gray-400" />
                              <span>Lodged</span>
                              {sortField === 'LodgementDate' && (
                                <ArrowUpDown className={`w-3.5 h-3.5 ${sortDirection === 'asc' ? 'text-blue-500' : 'text-blue-500 rotate-180'}`} />
                              )}
                            </div>
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {getSortedFilteredApplications().map((application) => (
                          <tr 
                            key={application.ApplicationId}
                            onClick={() => application.Location?.[0]?.X && application.Location?.[0]?.Y && 
                              flyToPoint(application.Location[0].X, application.Location[0].Y)
                            }
                            className="cursor-pointer hover:bg-blue-50 transition-colors"
                          >
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-normal text-gray-700">
                              <div className="truncate max-w-[250px]" title={application.Location?.[0]?.FullAddress}>
                                {application.Location?.[0]?.FullAddress}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              <div className="flex items-center relative group">
                                {getDevelopmentType(application)}
                                {application.DevelopmentType && application.DevelopmentType.length > 1 && (
                                  <div className="absolute left-0 transform -translate-y-2 bottom-full bg-black text-white text-xs rounded-md p-4 opacity-0 group-hover:opacity-100 transition-opacity z-10 w-55 shadow-xl pointer-events-none">
                                    <p className="font-semibold mb-2">Detailed Types:</p>
                                    <ul className="list-disc pl-2 pr-2">
                                      {application.DevelopmentType.map((type, i) => (
                                        <li key={i} className="mb-2">
                                          <span className="inline-block w-full break-words whitespace-normal">{type.DevelopmentType}</span>
                                        </li>
                                      ))}
                                    </ul>
                                  </div>
                                )}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{application.ApplicationStatus}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{getAbbreviatedAppType(application.ApplicationType)}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{formatCostShort(application.CostOfDevelopment)}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{application.NumberOfNewDwellings || 0}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              <div className="flex items-center">
                                <span className="whitespace-nowrap">
                                  {formatDateShort(application.LodgementDate)}
                                </span>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}
          </motion.div>
        </div>
      )}
      
      {/* Info modal hidden temporarily
      <InfoModal isOpen={showInfoModal} onClose={() => setShowInfoModal(false)} />
      */}
    </AnimatePresence>
  );
};

export default DevelopmentModal; 
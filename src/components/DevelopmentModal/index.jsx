import React, { useState, useEffect, useMemo } from 'react';
import { saveAs } from 'file-saver';
import { 
  FileSpreadsheet,
  Loader2,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { rpc } from '@gi-nx/iframe-sdk';
import { createDevelopmentLayer, removeDevelopmentLayer, getTransformedDevelopmentType } from './mapLayerUtils';
import { developmentCategories, getDevelopmentCategory, devTypesData } from './developmentTypes';
import { RESIDENTIAL_TYPES } from './residentialTypes';
import AnimatedDevLogo from '../../animatedLogo';
import { tooltipContent } from './tooltipContent';
import { fetchAllDAs } from '../../utils/api/fetchDAs';
import { deduplicateDAs } from '../../utils/api/dataCleanup';
import { calculateSummaryStats } from '../../utils/calculations';
import { formatDateLong, formatDateShort, formatCostShort } from '../../utils/formatters';
import { getCouncilFromLga, getAllLgas } from '../../utils/councilLgaMapping';

// Import the new subcomponents
import LGASelector from './LGASelector';
import FilterBar from './FilterBar';
import SummaryStats from './SummaryStats';
import DevCharts from './DevCharts';
import DevelopmentTable from './DevelopmentTable';
import ActionButtons from './ActionButtons';
import { 
  displayLgaBoundary, 
  removeLgaBoundaryLayer,
  createTempDaLayer,
  removeTempDaLayer
} from '../../services/lgaMapService';
import { track } from '@vercel/analytics'

const DevelopmentModal = ({ isOpen, onClose, selectedFeatures, fullscreen = false }) => {
  const [developmentData, setDevelopmentData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [featureProperties, setFeatureProperties] = useState(null);
  const [activeTab, setActiveTab] = useState("all");
  const [developmentLayer, setDevelopmentLayer] = useState(null);
  const [isGeneratingLayer, setIsGeneratingLayer] = useState(false);
  const [summaryData, setSummaryData] = useState({
    totalApplications: 0,
    byStatus: {},
    byType: {},
    byResidentialType: {},
    totalValue: 0,
    totalDwellings: 0
  });
  const [totalFeatures, setTotalFeatures] = useState(0);
  const [processedFeatures, setProcessedFeatures] = useState(0);
  const [hasLoadedData, setHasLoadedData] = useState(false);
  const [fetchDate, setFetchDate] = useState(null);
  
  // State for tracking loading progress
  const [loadingProgress, setLoadingProgress] = useState({
    currentPage: 0,
    totalPages: 0,
    loadedDAs: 0,
    totalDAs: 0
  });
  
  // State for LGA selector
  const [selectedLga, setSelectedLga] = useState('');
  const [validationError, setValidationError] = useState('');
  const [isChangingLga, setIsChangingLga] = useState(false);
  
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
      
      const lgaToUse = lgaNameToFetch; // Use the passed LGA name directly
      
      // Set the selected LGA in the state
      if (lgaToUse) {
        setSelectedLga(lgaToUse);
      }
      
      if (lgaToUse) {
        // Find the council name from the mapping
        const councilName = getCouncilFromLga(lgaToUse);
        
        if (councilName) {
          console.log('Fetching DAs for council:', councilName);
          const daFeatures = await fetchAllDAs(councilName, setLoadingProgress);
          
          // De-duplicate DAs based on address and value
          const dedupedDaFeatures = deduplicateDAs(daFeatures);
          console.log(`De-duplicated ${daFeatures.length - dedupedDaFeatures.length} entries`);
          
          // We are no longer filtering by feature geometry
          const dasToDisplay = dedupedDaFeatures;
          
          console.log('Found DAs:', {
            total: daFeatures.length,
            deduplicated: dedupedDaFeatures.length,
            displayed: dasToDisplay.length
          });
          
          setDevelopmentData(dasToDisplay);
          
          // Calculate summary statistics
          const summaryData = calculateSummaryStats(dasToDisplay, isResidentialType, getTransformedDevelopmentType);
          setSummaryData(summaryData);
          setHasLoadedData(true);
          
          // Only remove permanent development layer if it exists
          // We don't remove temporary layers here as they should persist until user changes LGA
          if (developmentLayer) {
            await removeDevelopmentLayer(developmentLayer);
            setDevelopmentLayer(null);
          }
          
          // Create temporary DA layer to show the data on the map
          try {
            await createTempDaLayer(rpc, dasToDisplay);
            console.log('Successfully created temporary DA layer');
          } catch (layerError) {
            console.error('Error creating temporary DA layer:', layerError);
            // Continue even if layer creation fails
          }
          
        } else {
          setError(`Could not find council name mapping for LGA: ${lgaToUse}`);
        }
      } else {
        // Don't set an error on initial load when no LGA is selected yet
        if (hasLoadedData) {
          setError('No LGA information found'); // Updated error message
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

  // Effect for initial loading based on selectedFeatures and modal open state
  useEffect(() => {
    // Check if we need to initialize with selected features when the modal first opens
    if (isOpen && selectedFeatures && selectedFeatures.length > 0 && !hasLoadedData) {
      const feature = selectedFeatures[0];
      
      // Check if the feature has LGA information
      if (feature.properties?.site_suitability__LGA) {
        const initialLga = feature.properties.site_suitability__LGA;
        console.log(`Initializing with LGA from selected feature: ${initialLga}`);
        
        // Set the LGA but don't remove layers since there are none yet
        setSelectedLga(initialLga);
        setFeatureProperties({
          site_suitability__LGA: initialLga
        });
        
        // Display the LGA boundary and fetch data
        (async () => {
          try {
            // Ensure RPC is available before calling
            if (rpc) {
              await displayLgaBoundary(rpc, initialLga);
              fetchDevelopmentData(initialLga); // fetchDevelopmentData will add the temp DA layer
            } else {
               console.warn("RPC not available during initial LGA display setup.");
            }
          } catch (error) {
            console.error('Error during initial LGA display:', error);
          }
        })();
      }
    } // End initial load check
    
    // Cleanup function: ONLY remove permanent layer if it exists. 
    // DO NOT remove temporary layers here.
    return () => {
      try {
        // Remove permanent development layer (if created) on close
        if (developmentLayer) {
          console.log("Modal closed: Removing permanent development layer.");
          removeDevelopmentLayer(developmentLayer); 
          // Assuming setDevelopmentLayer(null) happens elsewhere or isn't strictly needed here
        }
        
        // DO NOT REMOVE LGA BOUNDARY ON CLOSE
        // removeLgaBoundaryLayer(rpc); // REMOVED

        // DO NOT REMOVE TEMP DA LAYER ON CLOSE
        // removeTempDaLayer(rpc); // REMOVED

      } catch (error) {
        console.error('Error during modal cleanup (permanent layer only):', error);
      }
    };
  // Dependencies: isOpen triggers open/close. selectedFeatures for initial load.
  // rpc is needed for cleanup/initial display. hasLoadedData prevents re-init.
  // fetchDevelopmentData needed for initial load call.
  }, [isOpen, selectedFeatures, hasLoadedData, rpc, fetchDevelopmentData]); // Adjusted dependencies

  // Handle changing the LGA selection (ensure this still removes old layers)
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
      
      // Remove previous LGA boundary layer when changing LGA - THIS IS CORRECT
      try {
        if (rpc) { // Check if rpc is available
           removeLgaBoundaryLayer(rpc);
           console.log('LGA Change: Successfully removed previous LGA boundary layer');
        }
      } catch (error) {
        console.error('LGA Change: Error removing previous LGA boundary:', error);
      }
      
      // Remove previous temporary DA layer - THIS IS CORRECT
      try {
        if (rpc) { // Check if rpc is available
           removeTempDaLayer(rpc);
           console.log('LGA Change: Successfully removed previous temporary DA layer');
        }
      } catch (error) {
        console.error('LGA Change: Error removing temporary DA layer:', error);
      }
    }
    
    // Set the feature properties for display 
    setFeatureProperties({
      site_suitability__LGA: selectedLga
    });
    
    // Immediately display LGA boundary and fly to it
    (async () => {
      try {
        if (rpc) { // Check if rpc is available
           await displayLgaBoundary(rpc, selectedLga); // Add new boundary
           console.log(`LGA Change: Successfully displayed new boundary for LGA: ${selectedLga}`);
        }
      } catch (error) {
        console.error('LGA Change: Error displaying new LGA boundary immediately:', error);
      }
    })();
    
    // Reset flags to trigger data fetch
    setHasLoadedData(false);
    
    // Fetch data for the new LGA (this will add the new temp DA layer)
    fetchDevelopmentData(selectedLga); 
  };

  // Helper function to check if a development type is residential based on the RESIDENTIAL_TYPES set
  const isResidentialType = React.useCallback((type) => {
    return RESIDENTIAL_TYPES.has(type);
  }, []);
  
  // Helper function to check if a development type belongs to the "Residential Types" category in developmentTypes.js
  const isInResidentialTypesCategory = (typeName) => {
    return devTypesData.find(
      category => category.category === 'Residential Types' && 
      category.types.some(t => t.newtype === typeName || t.oldtype === typeName)
    ) !== undefined;
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

  // Filter development applications based on all active filters
  const getFilteredApplications = React.useCallback(() => {
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
  }, [developmentData, activeTab, filters]);
  
  // Apply filters to all data including summary stats and update map layer
  useEffect(() => {
    // Ensure rpc object is available
    if (!rpc) {
      console.warn("RPC object not available in useEffect filter handler.");
      return; 
    }

    if (developmentData.length > 0) {
      const filteredData = getFilteredApplications();
      const newSummaryData = calculateSummaryStats(filteredData, isResidentialType, getTransformedDevelopmentType);
      setSummaryData(newSummaryData);

      // Update the temporary map layer with the filtered data
      console.log(`Updating temp DA layer with ${filteredData.length} filtered applications.`);
      createTempDaLayer(rpc, filteredData)
        .catch(err => console.error("Error updating temp DA layer on filter change:", err)); 
      // No need to await if UI updates can happen slightly before map does

    } else {
       // If there's no base data (e.g., initial load, after LGA change), 
       // ensure the temp layer is cleared. createTempDaLayer handles empty data.
       console.log("Clearing temp DA layer as base data is empty.");
       createTempDaLayer(rpc, [])
         .catch(err => console.error("Error clearing temp DA layer:", err));
    }
    // Make sure rpc is included in dependency array if it might change, 
    // although it's likely stable. Add developmentData as it triggers re-filtering.
  }, [filters, activeTab, developmentData, rpc, getFilteredApplications, isResidentialType, getTransformedDevelopmentType]); // Added dependencies

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
      developmentCategory: null,
      applicationType: null,
      value: { operator: null, value1: null, value2: null },
      dwellings: { operator: null, value1: null, value2: null },
      lodgedDate: { operator: null, date1: null, date2: null }
    });
  };
  
  // Toggle filter card
  const toggleFilterCard = (cardName) => {
    setActiveFilterCard(activeFilterCard === cardName ? null : cardName);
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
  const handleCreateGeoJSONLayer = async () => {
    // Set loading state
    setIsGeneratingLayer(true);
    setProcessedFeatures(0);
    
    try {
      // Always use a mock feature based on selectedLga, as selectedFeatures is no longer relevant for this
      const mockFeature = {
        type: 'Feature',
        properties: {
          // Use the currently selected LGA directly
          copiedFrom: {
            site_suitability__LGA: selectedLga
          }
        }
      };
      
      // Note: This creates a permanent layer, but we don't remove the temporary layers
      // as they should persist until the user changes LGA or closes the modal
      await createDevelopmentLayer(
        developmentData,
        [mockFeature], // Pass the mock feature based on selected LGA
        setDevelopmentLayer,
        setError,
        setTotalFeatures,
        setProcessedFeatures
      );
    } catch (error) {
      console.error('Error generating layer:', error);
      setError(`Error generating layer: ${error.message}`);
    } finally {
      // Clear loading state
      setIsGeneratingLayer(false);
    }
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
  
  // Handle generating and downloading CSV
  const handleGenerateCSV = () => {
    try {
      // Get council name directly from the selected LGA state
      const councilName = selectedLga || 'Unknown';
      
      // Format current date in the "2 April 2025" format for filename consistency with the layer
      const currentDate = new Date();
      const day = currentDate.getDate();
      const month = currentDate.toLocaleString('en-US', { month: 'long' });
      const year = currentDate.getFullYear();
      const formattedDate = `${day} ${month} ${year}`;
      
      // Create the formatted filename (same as layer name)
      const filename = `DA - ${councilName} - ${formattedDate}.csv`;
      
      // Get filtered applications (same as what would be shown on the map)
      const filteredApps = getFilteredApplications();
      
      // Define CSV headers - using the same structure as the layer properties
      const headers = [
        'Address',
        'Status',
        'Clean Development Type',
        'Detailed Development Type',
        'PAN',
        'Council Reference',
        'Lodgement Date',
        'Determination Date',
        'Cost',
        'Dwellings',
        'Storeys',
        'EPI Variation',
        'Subdivision',
        'Lots',
        'Category'
      ];
      
      // Create CSV content
      let csvContent = headers.join(',') + '\n';
      
      // Add each application as a row in the CSV
      filteredApps.forEach(app => {
        // Process the detailed development type
        const detailedDevType = app.DevelopmentType ? 
          app.DevelopmentType.map(dt => dt.DevelopmentType).join('; ') : '';
        
        // Process address with proper CSV escaping
        const address = app.Location?.[0]?.FullAddress ? 
          `"${app.Location[0].FullAddress.replace(/"/g, '""')}"` : '';
        
        // Process lots from location if available
        const lots = app.Location?.[0]?.Lot ? 
          app.Location[0].Lot.map(lot => `${lot.Lot}//${lot.PlanLabel}`).join('; ') : '';
        
        // Get transformed development type
        const transformedType = getTransformedDevelopmentType(app.DevelopmentType || []);
        
        // Get category based on the transformed type
        const primaryTransformedType = transformedType.split(',')[0].trim();
        const category = getDevelopmentCategory(primaryTransformedType);
        
        // Create CSV row with proper escaping for all fields
        const row = [
          address,
          `"${(app.ApplicationStatus || '').replace(/"/g, '""')}"`,
          `"${transformedType.replace(/"/g, '""')}"`,
          `"${detailedDevType.replace(/"/g, '""')}"`,
          `"${(app.PlanningPortalApplicationNumber || '').replace(/"/g, '""')}"`,
          `"${(app.CouncilApplicationNumber || '').replace(/"/g, '""')}"`,
          `"${(app.LodgementDate || '').replace(/"/g, '""')}"`,
          `"${(app.DeterminationDate || '').replace(/"/g, '""')}"`,
          app.CostOfDevelopment || 0,
          app.NumberOfNewDwellings || 0,
          app.NumberOfStoreys || 0,
          `"${(app.EPIVariationProposedFlag || '').replace(/"/g, '""')}"`,
          `"${(app.SubdivisionProposedFlag || '').replace(/"/g, '""')}"`,
          `"${lots.replace(/"/g, '""')}"`,
          `"${category.replace(/"/g, '""')}"`
        ].join(',');
        
        csvContent += row + '\n';
      });
      
      // Create a Blob with the CSV content
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8' });
      
      // Use file-saver to download the file
      saveAs(blob, filename);
      
      console.log(`CSV exported successfully: ${filename}`);
    } catch (error) {
      console.error('Error generating CSV:', error);
      setError(`Error generating CSV: ${error.message}`);
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

  // Add a cleanup effect specifically for page refresh/unload
  useEffect(() => {
    // Handler for page refresh or unload
    const handleBeforeUnload = () => {
      try {
        if (rpc) {
          // Remove all temporary layers when page is refreshed
          console.log("Page refresh detected: Cleaning up map layers");
          removeLgaBoundaryLayer(rpc);
          removeTempDaLayer(rpc);
        }
      } catch (error) {
        console.error('Error during page refresh cleanup:', error);
      }
    };

    // Add event listener for page refresh/unload
    window.addEventListener('beforeunload', handleBeforeUnload);
    
    // Cleanup event listener on component unmount
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [rpc]); // Only depends on rpc which should be stable

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
            {/* Fixed header with logo and title */}
            <div className="flex items-center justify-between p-4 border-b sticky top-0 bg-white z-10">
              <div className="flex items-center">
                <div className="mr-4">
                  <AnimatedDevLogo />
                </div>
                <div>
                  <h2 className="text-xl font-semibold">Development Applications</h2>
                  {!loading && !error && featureProperties && (
                    <p className="text-sm text-gray-500">
                      Data as of: {fetchDate ? formatDateLong(fetchDate) : 'Unknown'}
                    </p>
                  )}
                </div>
              </div>
              {/* Action Buttons in header */}
              <ActionButtons 
                handleCreateGeoJSONLayer={handleCreateGeoJSONLayer}
                handleGenerateCSV={handleGenerateCSV}
                isGeneratingLayer={isGeneratingLayer}
                developmentData={developmentData}
                processedFeatures={processedFeatures}
                totalFeatures={totalFeatures}
                hasLoadedData={hasLoadedData}
              />
            </div>

            {/* LGA Selector Component */}
            <LGASelector 
              selectedLga={selectedLga}
              setSelectedLga={setSelectedLga}
              validationError={validationError}
              setValidationError={setValidationError}
              loading={loading}
              isChangingLga={isChangingLga}
              handleChangeLga={handleChangeLga}
              hasLoadedData={hasLoadedData}
              lgaOptions={lgaOptions}
              activeFilterCard={activeFilterCard}
              setActiveFilterCard={setActiveFilterCard}
            />

            {/* Scrollable content area */}
            <div className="flex-1 overflow-auto">
            {/* Loading state */}
            {loading ? (
              <div className="flex items-center justify-center py-20">
                <div className="text-center">
                  <Loader2 className="w-10 h-10 mb-4 mx-auto animate-spin text-blue-600" />
                  <p className="text-gray-600 mb-2">Loading development applications...</p>
                  {loadingProgress.totalPages > 0 && (
                    <div className="text-sm text-gray-500">
                      <div className="mb-1">Page {loadingProgress.currentPage} of {loadingProgress.totalPages}</div>
                      <div className="w-64 h-2 bg-gray-200 rounded-full mx-auto mb-1">
                        <div 
                          className="h-2 bg-blue-500 rounded-full" 
                          style={{ width: `${(loadingProgress.currentPage / loadingProgress.totalPages) * 100}%` }}
                        />
                      </div>
                      <div>
                        {loadingProgress.totalDAs > 0 
                          ? `Loaded ${formatNumber(loadingProgress.loadedDAs)} of ${formatNumber(loadingProgress.totalDAs)} DAs`
                          : `Loaded ${formatNumber(loadingProgress.loadedDAs)} DAs`}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ) : error && hasLoadedData ? (
              <div className="flex items-center justify-center py-20">
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
              <div className="flex items-center justify-center py-20 bg-gradient-to-b from-white to-gray-50">
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
                </div>
              </div>
            ) : (
              <div className="flex flex-col">
                {/* FilterBar Component */}
                <FilterBar 
                  filters={filters}
                  summaryData={summaryData}
                  activeFilterCard={activeFilterCard}
                  toggleFilterCard={toggleFilterCard}
                  setFilter={setFilter}
                  resetFilter={resetFilter}
                  resetAllFilters={resetAllFilters}
                  activeFilterCount={activeFilterCount}
                  formatNumber={formatNumber}
                  formatDateShort={formatDateShort}
                />

                {/* SummaryStats Component */}
                <SummaryStats 
                  summaryData={summaryData}
                  formatNumber={formatNumber}
                  formatCurrencyShort={formatCurrencyShort}
                />
                
                {/* DevCharts Component */}
                <DevCharts 
                  getFilteredApplications={getFilteredApplications}
                  formatNumber={formatNumber}
                  summaryData={summaryData}
                  devTypesData={devTypesData}
                  isResidentialType={isResidentialType}
                  isInResidentialTypesCategory={isInResidentialTypesCategory}
                  getTransformedDevelopmentType={getTransformedDevelopmentType}
                />

                {/* DevelopmentTable Component */}
                <DevelopmentTable 
                  getSortedFilteredApplications={getSortedFilteredApplications}
                  toggleSort={toggleSort}
                  sortField={sortField}
                  sortDirection={sortDirection}
                  flyToPoint={flyToPoint}
                  getDevelopmentType={getDevelopmentType}
                />
              </div>
            )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default DevelopmentModal;

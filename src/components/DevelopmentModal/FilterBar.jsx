import React, { useState, useRef, useEffect } from 'react';
import { 
  Filter, 
  XCircle, 
  ChevronDown, 
  FileText, 
  Building, 
  Tag, 
  DollarSign, 
  Home, 
  CalendarDays 
} from 'lucide-react';
import { StatusIcon } from './statusIcons';
import { getAbbreviatedAppType } from '../../utils/formatters';
import { developmentCategories } from './developmentTypes';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';

const FilterBar = ({
  filters,
  summaryData,
  activeFilterCard,
  toggleFilterCard,
  setFilter,
  resetFilter,
  resetAllFilters,
  activeFilterCount,
  formatNumber,
  formatDateShort
}) => {
  // Local state for filters that need to be applied with a button
  const [valueFilter, setValueFilter] = useState({ ...filters.value });
  const [dwellingsFilter, setDwellingsFilter] = useState({ ...filters.dwellings });
  const [lodgedDateFilter, setLodgedDateFilter] = useState({ ...filters.lodgedDate });
  
  // Refs to detect position and handle popup positioning
  const filterRefs = useRef({});
  
  // Update local state when filters change
  useEffect(() => {
    setValueFilter({ ...filters.value });
    setDwellingsFilter({ ...filters.dwellings });
    setLodgedDateFilter({ ...filters.lodgedDate });
  }, [filters]);
  
  // Function to check if a popup would overflow and determine its position
  const getPopupPosition = (filterName) => {
    if (!filterRefs.current[filterName]) return {};
    
    const rect = filterRefs.current[filterName].getBoundingClientRect();
    const viewportWidth = window.innerWidth;
    const popupWidth = 280; // Estimated popup width
    
    // If filter button is too close to the right edge
    if (rect.right + popupWidth > viewportWidth) {
      return { right: 0, left: 'auto' };
    }
    
    return { left: 0, right: 'auto' };
  };
  
  // Function to handle applying value filter
  const applyValueFilter = () => {
    setFilter('value', valueFilter);
    toggleFilterCard(null);
  };
  
  // Function to handle applying dwellings filter
  const applyDwellingsFilter = () => {
    setFilter('dwellings', dwellingsFilter);
    toggleFilterCard(null);
  };
  
  // Function to handle applying lodged date filter
  const applyLodgedDateFilter = () => {
    setFilter('lodgedDate', lodgedDateFilter);
    toggleFilterCard(null);
  };
  
  // Helper function to convert string date to Date object
  const parseDate = (dateString) => {
    return dateString ? new Date(dateString) : null;
  };
  
  // Helper function to format Date object to string (YYYY-MM-DD)
  const formatDateForFilter = (date) => {
    if (!date) return '';
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  return (
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
        <div className="relative" ref={el => filterRefs.current['developmentCategory'] = el}>
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
            <div className="absolute z-10 mt-1 bg-white border border-gray-200 rounded-md shadow-lg p-3 w-80 max-h-80 overflow-y-auto" style={getPopupPosition('developmentCategory')}>
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
                            toggleFilterCard(null);
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
        <div className="relative" ref={el => filterRefs.current['developmentType'] = el}>
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
            <div className="absolute z-10 mt-1 bg-white border border-gray-200 rounded-md shadow-lg p-3 w-64 max-h-80 overflow-y-auto" style={getPopupPosition('developmentType')}>
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
                          toggleFilterCard(null);
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
        <div className="relative" ref={el => filterRefs.current['status'] = el}>
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
            <div className="absolute z-10 mt-1 bg-white border border-gray-200 rounded-md shadow-lg p-3 w-64" style={getPopupPosition('status')}>
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
                          toggleFilterCard(null);
                        }}
                        className={`flex items-center justify-between px-3 py-2 text-sm rounded cursor-pointer ${filters.status === status ? 'bg-blue-100' : 'hover:bg-gray-100'}`}
                      >
                        <div className="flex items-center gap-2">
                          <StatusIcon status={status} size={14} />
                          <span>{status}</span>
                        </div>
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
        
        {/* Application Type Filter */}
        <div className="relative" ref={el => filterRefs.current['applicationType'] = el}>
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
            <div className="absolute z-10 mt-1 bg-white border border-gray-200 rounded-md shadow-lg p-3 w-64" style={getPopupPosition('applicationType')}>
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
                      toggleFilterCard(null);
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
        <div className="relative" ref={el => filterRefs.current['value'] = el}>
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
            <div className="absolute z-10 mt-1 bg-white border border-gray-200 rounded-md shadow-lg p-3 w-64" style={getPopupPosition('value')}>
              <h4 className="font-medium text-sm mb-2">Filter by Value</h4>
              
              <div className="space-y-3">
                <div>
                  <select 
                    className="w-full p-2 border border-gray-300 rounded text-sm"
                    value={valueFilter.operator || ''}
                    onChange={(e) => {
                      const newOperator = e.target.value || null;
                      setValueFilter({ 
                        ...valueFilter, 
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
                
                {valueFilter.operator && (
                  <div className="flex gap-2">
                    <div className="flex-1">
                      <label className="block text-xs text-gray-500 mb-1">
                        {valueFilter.operator === 'between' ? 'Min Value ($)' : 'Value ($)'}
                      </label>
                      <input
                        type="number"
                        className="w-full p-2 border border-gray-300 rounded text-sm"
                        value={valueFilter.value1 || ''}
                        onChange={(e) => {
                          const newValue = e.target.value ? parseInt(e.target.value) : null;
                          setValueFilter({ 
                            ...valueFilter, 
                            value1: newValue 
                          });
                        }}
                        placeholder="0"
                      />
                    </div>
                    
                    {valueFilter.operator === 'between' && (
                      <div className="flex-1">
                        <label className="block text-xs text-gray-500 mb-1">
                          Max Value ($)
                        </label>
                        <input
                          type="number"
                          className="w-full p-2 border border-gray-300 rounded text-sm"
                          value={valueFilter.value2 || ''}
                          onChange={(e) => {
                            const newValue = e.target.value ? parseInt(e.target.value) : null;
                            setValueFilter({ 
                              ...valueFilter, 
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
                    onClick={applyValueFilter}
                    className="px-3 py-1.5 bg-blue-500 text-white rounded text-sm hover:bg-blue-600"
                    disabled={!valueFilter.operator || !valueFilter.value1 || (valueFilter.operator === 'between' && !valueFilter.value2)}
                  >
                    Apply
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
        
        {/* Dwellings Filter */}
        <div className="relative" ref={el => filterRefs.current['dwellings'] = el}>
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
            <div className="absolute z-10 mt-1 bg-white border border-gray-200 rounded-md shadow-lg p-3 w-64" style={getPopupPosition('dwellings')}>
              <h4 className="font-medium text-sm mb-2">Filter by Dwellings</h4>
              
              <div className="space-y-3">
                <div>
                  <select 
                    className="w-full p-2 border border-gray-300 rounded text-sm"
                    value={dwellingsFilter.operator || ''}
                    onChange={(e) => {
                      const newOperator = e.target.value || null;
                      setDwellingsFilter({ 
                        ...dwellingsFilter, 
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
                
                {dwellingsFilter.operator && (
                  <div className="flex gap-2">
                    <div className="flex-1">
                      <label className="block text-xs text-gray-500 mb-1">
                        {dwellingsFilter.operator === 'between' ? 'Min Dwellings' : 'Dwellings'}
                      </label>
                      <input
                        type="number"
                        className="w-full p-2 border border-gray-300 rounded text-sm"
                        value={dwellingsFilter.value1 || ''}
                        onChange={(e) => {
                          const newValue = e.target.value ? parseInt(e.target.value) : null;
                          setDwellingsFilter({ 
                            ...dwellingsFilter, 
                            value1: newValue 
                          });
                        }}
                        placeholder="0"
                      />
                    </div>
                    
                    {dwellingsFilter.operator === 'between' && (
                      <div className="flex-1">
                        <label className="block text-xs text-gray-500 mb-1">
                          Max Dwellings
                        </label>
                        <input
                          type="number"
                          className="w-full p-2 border border-gray-300 rounded text-sm"
                          value={dwellingsFilter.value2 || ''}
                          onChange={(e) => {
                            const newValue = e.target.value ? parseInt(e.target.value) : null;
                            setDwellingsFilter({ 
                              ...dwellingsFilter, 
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
                    onClick={applyDwellingsFilter}
                    className="px-3 py-1.5 bg-blue-500 text-white rounded text-sm hover:bg-blue-600"
                    disabled={!dwellingsFilter.operator || !dwellingsFilter.value1 || (dwellingsFilter.operator === 'between' && !dwellingsFilter.value2)}
                  >
                    Apply
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
        
        {/* Lodged Date Filter */}
        <div className="relative" ref={el => filterRefs.current['lodgedDate'] = el}>
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
            <div className="absolute z-10 mt-1 bg-white border border-gray-200 rounded-md shadow-lg p-3 w-[280px]" style={getPopupPosition('lodgedDate')}>
              <h4 className="font-medium text-sm mb-2">Filter by Lodged Date</h4>
              
              <div className="space-y-3">
                <div>
                  <select 
                    className="w-full p-2 border border-gray-300 rounded text-sm"
                    value={lodgedDateFilter.operator || ''}
                    onChange={(e) => {
                      const newOperator = e.target.value || null;
                      setLodgedDateFilter({ 
                        ...lodgedDateFilter, 
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
                
                {lodgedDateFilter.operator && (
                  <div className="flex flex-col gap-3">
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">
                        {lodgedDateFilter.operator === 'before' ? 'Before Date' : 
                         lodgedDateFilter.operator === 'after' ? 'After Date' : 'Start Date'}
                      </label>
                      <DatePicker
                        selected={parseDate(lodgedDateFilter.date1)}
                        onChange={(date) => {
                          setLodgedDateFilter({
                            ...lodgedDateFilter,
                            date1: formatDateForFilter(date)
                          });
                        }}
                        className="w-full p-2 border border-gray-300 rounded text-sm"
                        dateFormat="dd/MM/yyyy"
                        placeholderText="Select a date"
                      />
                    </div>
                    
                    {lodgedDateFilter.operator === 'between' && (
                      <div>
                        <label className="block text-xs text-gray-500 mb-1">
                          End Date
                        </label>
                        <DatePicker
                          selected={parseDate(lodgedDateFilter.date2)}
                          onChange={(date) => {
                            setLodgedDateFilter({
                              ...lodgedDateFilter,
                              date2: formatDateForFilter(date)
                            });
                          }}
                          className="w-full p-2 border border-gray-300 rounded text-sm"
                          dateFormat="dd/MM/yyyy"
                          placeholderText="Select a date"
                          minDate={parseDate(lodgedDateFilter.date1)}
                        />
                      </div>
                    )}
                  </div>
                )}
                
                <div className="pt-2 flex justify-end">
                  <button
                    onClick={applyLodgedDateFilter}
                    className="px-3 py-1.5 bg-blue-500 text-white rounded text-sm hover:bg-blue-600"
                    disabled={!lodgedDateFilter.operator || !lodgedDateFilter.date1 || (lodgedDateFilter.operator === 'between' && !lodgedDateFilter.date2)}
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
  );
};

export default FilterBar; 
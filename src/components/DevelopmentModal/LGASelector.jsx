import React from 'react';
import { RefreshCw, Loader2, ChevronDown } from 'lucide-react';
import Autocomplete from '../Autocomplete';
import { getCouncilFromLga } from '../../utils/councilLgaMapping';

const LGASelector = ({
  selectedLga,
  setSelectedLga,
  validationError,
  setValidationError,
  loading,
  isChangingLga,
  handleChangeLga,
  hasLoadedData,
  lgaOptions,
  activeFilterCard,
  setActiveFilterCard
}) => {
  // Track whether the Autocomplete dropdown is open
  const [isAutocompleteOpen, setIsAutocompleteOpen] = React.useState(false);

  // Handle when dropdown needs to be opened by chevron
  const handleDropdownToggle = () => {
    // If autocomplete dropdown is open, we don't want to also open the custom dropdown
    if (isAutocompleteOpen) {
      setIsAutocompleteOpen(false);
      return;
    }
    
    setActiveFilterCard(activeFilterCard === 'lgaDropdown' ? null : 'lgaDropdown');
  };

  return (
    <div className="px-4 py-3 bg-gray-50 border-b flex items-center sticky top-[73px] z-10">
      <div className="flex-1 flex items-center gap-3 flex-wrap">
        <div className="text-sm font-medium text-gray-700">LGA:</div>
        <div className="relative flex-1">
          <div className="relative">
            <Autocomplete
              value={selectedLga}
              onChange={(value) => {
                setSelectedLga(value);
                setValidationError(''); // Clear error when selection changes
              }}
              placeholder="Search or select an LGA..."
              onDropdownStateChange={(isOpen) => {
                setIsAutocompleteOpen(isOpen);
                // If autocomplete opens, close the custom dropdown
                if (isOpen && activeFilterCard === 'lgaDropdown') {
                  setActiveFilterCard(null);
                }
              }}
            />
            <div className="absolute inset-y-0 right-0 flex items-center pr-2">
              <button
                type="button"
                className="text-gray-400 hover:text-gray-600 focus:outline-none"
                onClick={handleDropdownToggle}
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
        
        {/* Only display validationError */}
        {validationError && (
          <div className="text-red-600 text-sm ml-2">
            {validationError}
          </div>
        )}
      </div>
    </div>
  );
};

export default LGASelector; 
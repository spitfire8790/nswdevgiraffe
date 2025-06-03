import React, { useState, useRef, useEffect } from 'react';
import { getAllLgas, formatLgaName } from '../utils/councilLgaMapping';

// Get all LGAs with display and value properties
const autocompleteOptions = getAllLgas();

const Autocomplete = ({ value, onChange, placeholder, onDropdownStateChange }) => {
  const [inputValue, setInputValue] = useState('');
  const [filteredOptions, setFilteredOptions] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const inputRef = useRef(null);
  const dropdownRef = useRef(null);

  // Initialize input value from props
  useEffect(() => {
    if (value) {
      // Find the display value for the current value
      const option = autocompleteOptions.find(opt => opt.value === value);
      setInputValue(option ? option.display : formatLgaName(value));
    } else {
      setInputValue('');
    }
  }, [value]);

  // Handle input change
  const handleInputChange = (e) => {
    const input = e.target.value;
    setInputValue(input);
    
    // Filter options based on input
    if (input.trim() === '') {
      setFilteredOptions([]);
    } else {
      const filtered = autocompleteOptions.filter(option => 
        option.display.toLowerCase().includes(input.toLowerCase()) ||
        option.council.toLowerCase().includes(input.toLowerCase())
      );
      setFilteredOptions(filtered);
    }
    
    setIsOpen(true);
    if (onDropdownStateChange) onDropdownStateChange(true);
    setHighlightedIndex(-1);
  };

  // Handle option selection
  const handleSelectOption = (option) => {
    setInputValue(option.display);
    onChange(option.value); // Pass the original value to parent
    setIsOpen(false);
    if (onDropdownStateChange) onDropdownStateChange(false);
    setFilteredOptions([]);
  };

  // Handle keyboard navigation
  const handleKeyDown = (e) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlightedIndex(prev => 
        prev < filteredOptions.length - 1 ? prev + 1 : prev
      );
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightedIndex(prev => prev > 0 ? prev - 1 : 0);
    } else if (e.key === 'Enter' && highlightedIndex >= 0) {
      e.preventDefault();
      handleSelectOption(filteredOptions[highlightedIndex]);
    } else if (e.key === 'Escape') {
      setIsOpen(false);
      if (onDropdownStateChange) onDropdownStateChange(false);
    }
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (
        dropdownRef.current && 
        !dropdownRef.current.contains(e.target) && 
        !inputRef.current.contains(e.target)
      ) {
        setIsOpen(false);
        if (onDropdownStateChange) onDropdownStateChange(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onDropdownStateChange]);

  // Scroll to highlighted option
  useEffect(() => {
    if (highlightedIndex >= 0 && dropdownRef.current) {
      const highlightedEl = dropdownRef.current.children[highlightedIndex];
      if (highlightedEl) {
        highlightedEl.scrollIntoView({ block: 'nearest' });
      }
    }
  }, [highlightedIndex]);

  return (
    <div className="relative w-full">
      <input
        ref={inputRef}
        type="text"
        value={inputValue}
        onChange={handleInputChange}
        onKeyDown={handleKeyDown}
        onFocus={() => {
          if (inputValue) {
            setIsOpen(true);
            if (onDropdownStateChange) onDropdownStateChange(true);
          }
        }}
        placeholder={placeholder}
        className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-700"
        aria-label="LGA name"
        aria-autocomplete="list"
        aria-expanded={isOpen}
        aria-activedescendant={highlightedIndex >= 0 ? `option-${highlightedIndex}` : undefined}
      />
      
      {isOpen && filteredOptions.length > 0 && (
        <ul 
          ref={dropdownRef}
          className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto"
          role="listbox"
        >
          {filteredOptions.map((option, index) => (
            <li
              key={option.value}
              id={`option-${index}`}
              onClick={() => handleSelectOption(option)}
              className={`px-4 py-2 cursor-pointer hover:bg-blue-50 ${
                index === highlightedIndex ? 'bg-blue-100' : ''
              }`}
              role="option"
              aria-selected={index === highlightedIndex}
            >
              <div className="flex flex-col">
                <div className="font-medium text-gray-800">{option.display}</div>
                <div className="text-xs text-gray-500">{option.council}</div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default Autocomplete; 
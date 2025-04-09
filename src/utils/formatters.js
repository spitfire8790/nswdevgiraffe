/**
 * Formats a numeric value as currency (Australian dollars).
 * 
 * @param {number} value - The numeric value to format
 * @param {boolean} showCents - Whether to show cents (default: false)
 * @returns {string} Formatted currency string
 */
export const formatCurrency = (value, showCents = false) => {
  if (value === undefined || value === null) return 'N/A';
  
  try {
    const formatter = new Intl.NumberFormat('en-AU', {
      style: 'currency',
      currency: 'AUD',
      minimumFractionDigits: showCents ? 2 : 0,
      maximumFractionDigits: showCents ? 2 : 0
    });
    
    return formatter.format(value);
  } catch (error) {
    console.error('Error formatting currency:', error);
    return `$${value.toLocaleString()}`;
  }
};

/**
 * Formats a date string in Australian date format (DD/MM/YYYY).
 * 
 * @param {string} dateString - The date string to format
 * @param {boolean} includeTime - Whether to include time (default: false)
 * @returns {string} Formatted date string
 */
export const formatDate = (dateString, includeTime = false) => {
  if (!dateString) return 'N/A';
  
  try {
    const date = new Date(dateString);
    
    if (isNaN(date.getTime())) {
      return dateString; // Return original if invalid
    }
    
    if (includeTime) {
      return date.toLocaleString('en-AU', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } else {
      return date.toLocaleDateString('en-AU', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      });
    }
  } catch (error) {
    console.error('Error formatting date:', error);
    return dateString;
  }
};

/**
 * Formats a number with thousand separators.
 * 
 * @param {number} value - The numeric value to format
 * @param {number} decimals - Number of decimal places (default: 0)
 * @returns {string} Formatted number
 */
export const formatNumber = (value, decimals = 0) => {
  if (value === undefined || value === null) return 'N/A';
  
  try {
    return value.toLocaleString('en-AU', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals
    });
  } catch (error) {
    console.error('Error formatting number:', error);
    return value.toString();
  }
};

/**
 * Formats a value as a percentage.
 * 
 * @param {number} value - The decimal value to format as percentage (e.g., 0.25 for 25%)
 * @param {number} decimals - Number of decimal places (default: 0)
 * @returns {string} Formatted percentage
 */
export const formatPercentage = (value, decimals = 0) => {
  if (value === undefined || value === null) return 'N/A';
  
  try {
    return new Intl.NumberFormat('en-AU', {
      style: 'percent',
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals
    }).format(value);
  } catch (error) {
    console.error('Error formatting percentage:', error);
    return `${(value * 100).toFixed(decimals)}%`;
  }
};

/**
 * Formats a value as an area in square meters with appropriate unit conversion.
 * 
 * @param {number} value - The area in square meters
 * @param {boolean} includeUnit - Whether to include the unit (default: true)
 * @returns {string} Formatted area
 */
export const formatArea = (value, includeUnit = true) => {
  if (value === undefined || value === null) return 'N/A';
  
  try {
    const valueNumber = Number(value);
    
    if (isNaN(valueNumber)) {
      return value.toString();
    }
    
    let formattedValue;
    let unit = 'm²';
    
    if (valueNumber >= 10000) {
      // Convert to hectares for large areas
      formattedValue = (valueNumber / 10000).toLocaleString('en-AU', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      });
      unit = 'ha';
    } else {
      formattedValue = valueNumber.toLocaleString('en-AU', {
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
      });
    }
    
    return includeUnit ? `${formattedValue} ${unit}` : formattedValue;
  } catch (error) {
    console.error('Error formatting area:', error);
    return value.toString();
  }
}; 
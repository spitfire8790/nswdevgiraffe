import React from 'react';
import { CheckCircle2, XCircle, Loader2 } from 'lucide-react';

// Status categories with their corresponding statuses
export const STATUS_CATEGORIES = {
  // Completed/approved statuses
  completed: ['Determined', 'Operational consent issued', 'Deferred Commencement'],
  
  // Rejected/canceled statuses
  rejected: ['Cancelled', 'Withdrawn', 'Operational consent declined'],
  
  // All other statuses are considered in progress
};

/**
 * Determines which category a status belongs to
 * @param {string} status - The status text
 * @returns {string} - The category: 'completed', 'rejected', or 'inProgress'
 */
export const getStatusCategory = (status) => {
  if (STATUS_CATEGORIES.completed.includes(status)) return 'completed';
  if (STATUS_CATEGORIES.rejected.includes(status)) return 'rejected';
  return 'inProgress';
};

/**
 * Returns the appropriate status icon component based on status category
 * @param {string} status - The status text
 * @param {number} size - Icon size in pixels
 * @returns {JSX.Element} - The icon component
 */
export const StatusIcon = ({ status, size = 16 }) => {
  const category = getStatusCategory(status);
  
  switch (category) {
    case 'completed':
      return <CheckCircle2 size={size} className="text-green-500" />;
    case 'rejected':
      return <XCircle size={size} className="text-red-500" />;
    case 'inProgress':
    default:
      return <Loader2 size={size} className="text-blue-500 animate-spin" />;
  }
};

/**
 * Returns both an icon and full text status with hover capability
 * @param {string} status - The status text 
 * @param {number} size - Icon size in pixels
 * @returns {JSX.Element} - The icon with hover text component
 */
export const StatusIconWithText = ({ status, size = 16 }) => {
  return (
    <div className="relative flex items-center group">
      <StatusIcon status={status} size={size} />
      <span className="invisible absolute bottom-full left-1/2 transform -translate-x-1/2 -translate-y-1 
            bg-gray-800 text-white text-xs rounded px-2 py-1 group-hover:visible whitespace-nowrap z-10">
        {status}
      </span>
    </div>
  );
};

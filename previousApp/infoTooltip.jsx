import React, { useState } from 'react';
import { Info } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { tooltipContent } from './tooltipContent';

/**
 * Animated info tooltip component for displaying explanatory information
 * @param {Object} props - Component props
 * @param {string} props.type - Type of tooltip to display (e.g., 'deduplicationInfo')
 * @param {string} props.position - Position of tooltip (default 'right')
 * @param {number} props.size - Size of the info icon (default 16)
 * @param {string} props.className - Additional CSS classes
 */
const InfoTooltip = ({ 
  type = 'deduplicationInfo',
  position = 'right', 
  size = 16,
  className = ''
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const content = tooltipContent[type] || tooltipContent.deduplicationInfo;
  
  // Determine tooltip position styles
  const getPositionStyles = () => {
    switch (position) {
      case 'top':
        return 'bottom-full left-1/2 transform -translate-x-1/2 mb-2';
      case 'bottom':
        return 'top-full left-1/2 transform -translate-x-1/2 mt-2';
      case 'left':
        return 'right-full top-0 mr-2';
      case 'right':
      default:
        return 'left-full top-0 ml-2';
    }
  };
  
  return (
    <div 
      className={`relative inline-flex ${className}`}
      onMouseEnter={() => setIsOpen(true)}
      onMouseLeave={() => setIsOpen(false)}
      onClick={() => setIsOpen(!isOpen)}
    >
      <motion.div
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
        className="cursor-help text-blue-500 hover:text-blue-600"
      >
        <Info size={size} />
      </motion.div>
      
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.85 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.85 }}
            transition={{ duration: 0.2 }}
            className={`absolute z-50 ${getPositionStyles()} bg-white p-4 rounded-lg shadow-xl border border-gray-200 w-96`}
          >
            <div className="mb-2 font-semibold text-gray-800">{content.title}</div>
            <div className="text-sm text-gray-600 whitespace-pre-line mb-3">{content.content}</div>
            <div className="text-xs text-gray-500 pt-2 border-t border-gray-200">
              {content.source} 
              <a 
                href={content.sourceLink} 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-blue-500 hover:underline ml-1"
              >
                (Learn more)
              </a>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default InfoTooltip; 
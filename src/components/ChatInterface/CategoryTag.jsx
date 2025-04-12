import React from 'react';

/**
 * Component to display a category tag with icon
 */
const CategoryTag = ({ category, score, color, icon }) => {
  // Create styles based on category
  const tagStyle = {
    backgroundColor: color ? `${color}20` : '#f0f0f0', // Light version of the color with opacity
    color: color || '#666',
    borderColor: color ? `${color}40` : '#ddd' // Slightly darker version for border
  };
  
  // Format score if provided
  const formattedScore = score !== undefined ? score.toFixed(1) : '';
  
  // Icon mapping - default material icons if none provided
  const getIconElement = () => {
    // If using material icons
    return (
      <span className="material-icons-round text-xs mr-1" style={{ color }}>
        {icon || 'label'}
      </span>
    );
  };
  
  return (
    <div 
      className="inline-flex items-center text-xs px-2 py-1 rounded-full border"
      style={tagStyle}
    >
      {getIconElement()}
      <span className="truncate max-w-[100px]">{category}</span>
      {formattedScore && (
        <span className="ml-1 font-semibold">({formattedScore})</span>
      )}
    </div>
  );
};

export default CategoryTag; 
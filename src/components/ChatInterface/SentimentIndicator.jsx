import React from 'react';

/**
 * Component to visually display sentiment analysis results
 */
const SentimentIndicator = ({ sentiment, score }) => {
  // Define colors and icons based on sentiment
  const getIndicatorProps = () => {
    switch (sentiment) {
      case 'very positive':
        return {
          color: '#4CAF50', // Green
          bgColor: 'bg-green-100',
          textColor: 'text-green-800',
          icon: '👍👍',
          label: 'Very Positive'
        };
      case 'positive':
        return {
          color: '#8BC34A', // Light Green
          bgColor: 'bg-green-50',
          textColor: 'text-green-700',
          icon: '👍',
          label: 'Positive'
        };
      case 'neutral':
        return {
          color: '#9E9E9E', // Gray
          bgColor: 'bg-gray-100',
          textColor: 'text-gray-700',
          icon: '🤝',
          label: 'Neutral'
        };
      case 'negative':
        return {
          color: '#FF9800', // Orange
          bgColor: 'bg-orange-100',
          textColor: 'text-orange-700',
          icon: '👎',
          label: 'Concerning'
        };
      case 'very negative':
        return {
          color: '#F44336', // Red
          bgColor: 'bg-red-100',
          textColor: 'text-red-700',
          icon: '👎👎',
          label: 'Very Concerning'
        };
      default:
        return {
          color: '#9E9E9E', // Gray
          bgColor: 'bg-gray-100',
          textColor: 'text-gray-700',
          icon: '🤝',
          label: 'Neutral'
        };
    }
  };

  const { bgColor, textColor, icon, label } = getIndicatorProps();
  
  // Format the score for display
  const formattedScore = Math.abs(score).toFixed(1);
  const scoreLabel = score > 0 
    ? `+${formattedScore}` 
    : score < 0 
      ? `-${formattedScore}` 
      : '0.0';

  return (
    <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs ${bgColor} ${textColor}`}>
      <span className="mr-1">{icon}</span>
      <span>{label}</span>
      <span className="ml-1 font-semibold">({scoreLabel})</span>
    </div>
  );
};

export default SentimentIndicator; 
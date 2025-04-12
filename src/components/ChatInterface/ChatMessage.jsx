import React from 'react';
import SentimentIndicator from './SentimentIndicator';
import CategoryTag from './CategoryTag';

/**
 * Component to display an individual chat message
 */
const ChatMessage = ({ 
  message, 
  type, 
  sentimentAnalysis, 
  categories,
  referenceLinks 
}) => {
  const isUser = type === 'user';
  
  return (
    <div 
      className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-4`}
    >
      <div 
        className={`max-w-[80%] rounded-lg p-3 ${
          isUser 
            ? 'bg-blue-500 text-white rounded-br-none' 
            : 'bg-gray-100 text-gray-800 rounded-bl-none'
        }`}
      >
        {/* Message content */}
        <div className="whitespace-pre-wrap break-words">
          {message}
        </div>
        
        {/* Only show sentiment, categories and references for AI responses */}
        {!isUser && sentimentAnalysis && (
          <div className="mt-2">
            <SentimentIndicator 
              sentiment={sentimentAnalysis.category} 
              score={sentimentAnalysis.score} 
            />
          </div>
        )}
        
        {/* Category tags */}
        {!isUser && categories && Object.keys(categories).length > 0 && (
          <div className="flex flex-wrap gap-1 mt-2">
            {Object.keys(categories).map(category => (
              <CategoryTag 
                key={category} 
                category={category} 
                score={categories[category].score}
                color={categories[category].color}
                icon={categories[category].icon}
              />
            ))}
          </div>
        )}
        
        {/* Reference links */}
        {!isUser && referenceLinks && referenceLinks.length > 0 && (
          <div className="mt-3 pt-2 border-t border-gray-200">
            <div className="text-xs text-gray-600 font-semibold mb-1">
              References:
            </div>
            <div className="flex flex-col gap-1">
              {referenceLinks.map((link, index) => (
                <a 
                  key={index}
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-blue-600 hover:underline truncate"
                >
                  {link.sourceName || link.url}
                </a>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatMessage; 
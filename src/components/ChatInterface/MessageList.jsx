import React, { useEffect, useRef } from 'react';
import ChatMessage from './ChatMessage';

/**
 * Component to display the conversation history
 */
const MessageList = ({ messages }) => {
  const messagesEndRef = useRef(null);
  
  // Auto-scroll to the bottom when messages change
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);
  
  // If no messages, show a welcome message
  if (!messages || messages.length === 0) {
    return (
      <div className="flex flex-col h-full justify-center items-center text-center p-6 text-gray-500">
        <div className="mb-4">
          <svg 
            xmlns="http://www.w3.org/2000/svg" 
            width="48" 
            height="48" 
            viewBox="0 0 24 24" 
            fill="none" 
            stroke="currentColor" 
            strokeWidth="1" 
            strokeLinecap="round" 
            strokeLinejoin="round"
          >
            <circle cx="12" cy="12" r="10" />
            <path d="M8 12h8" />
            <path d="M12 8v8" />
          </svg>
        </div>
        <p className="text-lg font-medium mb-2">
          Property Information Assistant
        </p>
        <p className="text-sm max-w-md">
          Ask questions about this property or development application to get additional information from public sources.
        </p>
      </div>
    );
  }
  
  return (
    <div className="flex flex-col p-4 overflow-y-auto h-full">
      {messages.map((msg, index) => (
        <ChatMessage
          key={index}
          message={msg.text}
          type={msg.type}
          sentimentAnalysis={msg.sentimentAnalysis}
          categories={msg.categories}
          referenceLinks={msg.referenceLinks}
        />
      ))}
      <div ref={messagesEndRef} />
    </div>
  );
};

export default MessageList; 
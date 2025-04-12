import React, { useState } from 'react';
import { Send } from 'lucide-react';

/**
 * Component for user input in the chat interface
 */
const MessageInput = ({ onSendMessage, isLoading }) => {
  const [message, setMessage] = useState('');
  
  // Handle submit when the user sends a message
  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (message.trim() && !isLoading) {
      onSendMessage(message);
      setMessage('');
    }
  };
  
  return (
    <form 
      onSubmit={handleSubmit}
      className="flex items-end gap-2 mt-2"
    >
      <div className="flex-grow relative">
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Ask about this property..."
          className="w-full p-3 pr-10 border border-gray-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          rows={1}
          disabled={isLoading}
          onKeyDown={(e) => {
            // Submit on Enter (without Shift)
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              handleSubmit(e);
            }
          }}
        />
        <div className="text-xs text-gray-500 mt-1 ml-2">
          Press Enter to send, Shift+Enter for new line
        </div>
      </div>
      
      <button
        type="submit"
        disabled={!message.trim() || isLoading}
        className={`p-3 rounded-lg ${
          !message.trim() || isLoading
            ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
            : 'bg-blue-500 text-white hover:bg-blue-600'
        }`}
        aria-label="Send message"
      >
        {isLoading ? (
          <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
        ) : (
          <Send size={20} />
        )}
      </button>
    </form>
  );
};

export default MessageInput; 
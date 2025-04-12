import React, { useState, useEffect } from 'react';
import { Loader2, X, MessageSquare, Minimize2, Maximize2 } from 'lucide-react';
import MessageList from './MessageList';
import MessageInput from './MessageInput';
import ExportButton from './ExportButton';
import geminiService from './services/geminiService';
import queryBuilder from './services/queryBuilder';
import sentimentAnalyzer from './services/sentimentAnalyzer';
import categoryTagger from './services/categoryTagger';

/**
 * Main chat interface component that integrates all chat services and components
 */
const ChatInterface = ({ daData, isOpen, onClose }) => {
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const [error, setError] = useState(null);
  const [isMinimized, setIsMinimized] = useState(false);
  
  // Initialize the Gemini API on component mount
  useEffect(() => {
    const initializeChat = async () => {
      try {
        await geminiService.initialize();
        setIsInitialized(true);
      } catch (err) {
        console.error('Failed to initialize chat service:', err);
        setError('Failed to initialize chat service. Please try again later.');
      }
    };
    
    initializeChat();
  }, []);
  
  // Handle sending a message
  const handleSendMessage = async (userMessage) => {
    if (!userMessage.trim() || isLoading) return;
    
    try {
      setIsLoading(true);
      
      // Add user message to the chat
      const userMsg = {
        text: userMessage,
        type: 'user',
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, userMsg]);
      
      // Create conversation history in the format Gemini expects
      const history = messages
        .filter(msg => msg.type !== 'error') // Exclude error messages
        .map(msg => ({
          role: msg.type === 'user' ? 'user' : 'model',
          parts: [{ text: msg.text }]
        }));
      
      // Generate AI response
      const response = await geminiService.generateResponse(
        queryBuilder.buildQuery(userMessage, daData),
        history
      );
      
      if (!response || !response.text) {
        throw new Error('Empty response from AI service');
      }
      
      // Extract reference links
      const referenceLinks = queryBuilder.extractReferenceLinks(response.text);
      
      // Analyze sentiment
      const sentimentAnalysis = sentimentAnalyzer.analyzeText(response.text);
      
      // Tag categories
      const categories = categoryTagger.tagCategories(response.text);
      
      // Add AI response to the chat
      const aiMsg = {
        text: response.text,
        type: 'ai',
        timestamp: new Date(),
        sentimentAnalysis,
        categories,
        referenceLinks
      };
      
      setMessages(prev => [...prev, aiMsg]);
      
    } catch (err) {
      console.error('Error sending message:', err);
      
      // Add error message
      setMessages(prev => [
        ...prev,
        {
          text: 'Sorry, there was an error processing your request. Please try again.',
          type: 'error',
          timestamp: new Date()
        }
      ]);
      
    } finally {
      setIsLoading(false);
    }
  };
  
  // If not open, don't render
  if (!isOpen) {
    return null;
  }
  
  return (
    <div className={`fixed bottom-4 right-4 z-50 transition-all duration-300 ${
      isMinimized 
        ? 'w-auto h-auto' 
        : 'w-[400px] h-[500px] max-h-[80vh]'
    }`}>
      {/* Minimized state - just show icon */}
      {isMinimized ? (
        <button
          onClick={() => setIsMinimized(false)}
          className="flex items-center justify-center w-12 h-12 bg-blue-500 text-white rounded-full shadow-lg hover:bg-blue-600"
          aria-label="Open chat"
        >
          <MessageSquare size={24} />
        </button>
      ) : (
        /* Full chat interface */
        <div className="flex flex-col w-full h-full bg-white rounded-lg shadow-xl border border-gray-200 overflow-hidden">
          {/* Chat header */}
          <div className="flex items-center justify-between p-3 border-b border-gray-200 bg-blue-500 text-white">
            <div className="flex items-center">
              <MessageSquare size={20} className="mr-2" />
              <h3 className="font-medium">Property Information Assistant</h3>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsMinimized(true)}
                className="p-1 rounded-full hover:bg-blue-600"
                aria-label="Minimize chat"
              >
                <Minimize2 size={16} />
              </button>
              <button
                onClick={onClose}
                className="p-1 rounded-full hover:bg-blue-600"
                aria-label="Close chat"
              >
                <X size={16} />
              </button>
            </div>
          </div>
          
          {/* Export button */}
          <div className="px-3 py-1 border-b border-gray-200 bg-gray-50">
            <ExportButton 
              messages={messages} 
              daData={daData} 
              disabled={isLoading || messages.length === 0} 
            />
          </div>
          
          {/* Chat messages - make sure this area is scrollable */}
          <div className="flex-grow overflow-y-auto relative">
            {error ? (
              <div className="flex flex-col h-full justify-center items-center p-6 text-center text-red-500">
                <p>{error}</p>
                <button
                  onClick={() => geminiService.initialize().then(() => setError(null)).catch(err => console.error(err))}
                  className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                >
                  Retry
                </button>
              </div>
            ) : !isInitialized ? (
              <div className="flex flex-col h-full justify-center items-center p-6">
                <Loader2 size={40} className="text-blue-500 animate-spin mb-4" />
                <p className="text-gray-500">Initializing chat...</p>
              </div>
            ) : (
              <MessageList messages={messages} />
            )}
          </div>
          
          {/* Input area */}
          <div className="p-3 border-t border-gray-200 bg-gray-50">
            <MessageInput 
              onSendMessage={handleSendMessage} 
              isLoading={isLoading} 
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default ChatInterface; 
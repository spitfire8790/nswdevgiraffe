import React, { useState } from 'react';
import { Download, FileText, Loader2 } from 'lucide-react';
import { saveAs } from 'file-saver';

/**
 * Component to handle exporting chat conversation data
 */
const ExportButton = ({ messages, daData, disabled }) => {
  const [exporting, setExporting] = useState(false);
  
  // Format messages for export
  const formatMessagesForExport = () => {
    let formattedContent = '';
    
    // Add property information header
    if (daData) {
      // Function to safely extract development type
      const extractDevelopmentType = (devTypes) => {
        if (!devTypes || !Array.isArray(devTypes) || devTypes.length === 0) return 'N/A';
        return devTypes.map(dt => dt.DevelopmentType).join(', ');
      };

      // Extract address information from the Location array
      const location = daData.Location && daData.Location.length > 0 ? daData.Location[0] : null;
      const address = location ? (
        location.FullAddress || 
        `${location.StreetNumber1 || ''} ${location.StreetName || ''} ${location.StreetType || ''}`
      ).trim() : 'N/A';
      
      const suburb = location ? location.Suburb || 'N/A' : 'N/A';
      const postcode = location ? location.Postcode || 'N/A' : 'N/A';
      
      formattedContent += `# Property Information\n\n`;
      formattedContent += `- Address: ${address}\n`;
      formattedContent += `- Suburb: ${suburb}\n`;
      formattedContent += `- Postcode: ${postcode}\n`;
      formattedContent += `- LGA: ${daData.LGA || 'N/A'}\n`;
      formattedContent += `- Development Type: ${extractDevelopmentType(daData.DevelopmentType)}\n`;
      formattedContent += `- Application Status: ${daData.ApplicationStatus || 'N/A'}\n`;
      
      // Handle lot information
      if (location && location.Lot && location.Lot.length > 0) {
        const lots = location.Lot.map(lot => `Lot ${lot.Lot} ${lot.PlanLabel || ''}`).join(', ');
        formattedContent += `- Lot Reference: ${lots}\n`;
      } else if (daData.LotNumber) {
        formattedContent += `- Lot Reference: Lot ${daData.LotNumber} DP ${daData.DPNumber || ''}\n`;
      }
      
      formattedContent += `- Cost of Development: $${daData.CostOfDevelopment?.toLocaleString() || 'N/A'}\n\n`;
    }
    
    // Add conversation
    formattedContent += `# Conversation History\n\n`;
    
    messages.forEach((msg, index) => {
      const role = msg.type === 'user' ? 'User' : 'AI Assistant';
      formattedContent += `## ${role} (${new Date(msg.timestamp).toLocaleString()})\n\n`;
      formattedContent += `${msg.text}\n\n`;
      
      // Add sentiment analysis if available
      if (msg.sentimentAnalysis) {
        formattedContent += `**Sentiment:** ${msg.sentimentAnalysis.category} (${msg.sentimentAnalysis.score})\n\n`;
      }
      
      // Add categories if available
      if (msg.categories && Object.keys(msg.categories).length > 0) {
        formattedContent += `**Categories:**\n`;
        Object.keys(msg.categories).forEach(category => {
          formattedContent += `- ${category} (${msg.categories[category].score})\n`;
        });
        formattedContent += '\n';
      }
      
      // Add reference links if available
      if (msg.referenceLinks && msg.referenceLinks.length > 0) {
        formattedContent += `**References:**\n`;
        msg.referenceLinks.forEach(link => {
          formattedContent += `- [${link.sourceName || link.url}](${link.url})\n`;
        });
        formattedContent += '\n';
      }
      
      formattedContent += `---\n\n`;
    });
    
    // Add footer
    formattedContent += `\nExported on ${new Date().toLocaleString()}\n`;
    
    return formattedContent;
  };
  
  // Export conversation as markdown
  const exportAsMarkdown = async () => {
    try {
      setExporting(true);
      
      const content = formatMessagesForExport();
      const blob = new Blob([content], { type: 'text/markdown;charset=utf-8' });
      
      // Create a filename with current date
      const date = new Date().toISOString().split('T')[0];
      
      // Extract address for filename
      const location = daData?.Location && daData.Location.length > 0 ? daData.Location[0] : null;
      const address = location ? 
        (location.FullAddress || 
        `${location.StreetNumber1 || ''}_${location.StreetName || ''}`).replace(/[^a-zA-Z0-9]/g, '_').substring(0, 30) 
        : 'property';
      
      const filename = `property_info_${address}_${date}.md`;
      
      saveAs(blob, filename);
    } catch (error) {
      console.error('Error exporting conversation:', error);
    } finally {
      setExporting(false);
    }
  };
  
  return (
    <button
      onClick={exportAsMarkdown}
      disabled={disabled || exporting || !messages.length}
      className={`flex items-center gap-1 px-2 py-1 rounded text-xs ${
        disabled || exporting || !messages.length
          ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
      }`}
      title="Export conversation"
    >
      {exporting ? (
        <>
          <Loader2 size={14} className="animate-spin" />
          <span>Exporting...</span>
        </>
      ) : (
        <>
          <Download size={14} />
          <span>Export</span>
        </>
      )}
    </button>
  );
};

export default ExportButton; 
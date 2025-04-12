/**
 * Service to analyze and score the sentiment of AI responses
 */
class SentimentAnalyzer {
  /**
   * Analyze text and return sentiment score and category
   * @param {string} text - The text to analyze
   * @returns {object} - Sentiment analysis result
   */
  analyzeText(text) {
    if (!text) return { score: 0, category: 'neutral', keywords: [] };

    // Define positive and negative keyword dictionaries with weights
    const positiveKeywords = {
      'approval': 2,
      'approved': 2,
      'positive': 1.5,
      'support': 1.5,
      'compliant': 1,
      'complies': 1,
      'compliance': 1,
      'successful': 1.5,
      'success': 1.5,
      'favorable': 1,
      'favourable': 1,
      'benefit': 1.5,
      'benefits': 1.5,
      'opportunity': 1.5,
      'opportunities': 1.5,
      'advantage': 1,
      'advantages': 1,
      'improved': 1,
      'improvement': 1,
      'enhancing': 1,
      'enhance': 1,
      'valuable': 1,
      'recommended': 1,
      'safe': 1,
      'desirable': 1,
      'increase': 0.5,
      'progress': 0.5,
      'sustainable': 1,
      'efficient': 1,
      'good': 0.5,
      'great': 1,
      'excellent': 1.5
    };

    const negativeKeywords = {
      'rejected': 2,
      'rejection': 2,
      'denied': 2,
      'denial': 2,
      'refused': 2,
      'refusal': 2,
      'negative': 1.5,
      'oppose': 1.5,
      'opposition': 1.5,
      'non-compliant': 1.5,
      'violation': 1.5,
      'violations': 1.5,
      'fails': 1,
      'failed': 1,
      'failure': 1,
      'concern': 1,
      'concerns': 1,
      'concerning': 1,
      'issue': 0.5,
      'issues': 0.5,
      'problem': 1,
      'problems': 1,
      'risk': 1,
      'risks': 1,
      'hazard': 1.5,
      'hazards': 1.5,
      'dangerous': 1.5,
      'contaminated': 1.5,
      'contamination': 1.5,
      'pollution': 1,
      'polluted': 1,
      'objection': 1.5,
      'objections': 1.5,
      'opposed': 1.5,
      'protest': 1.5,
      'protests': 1.5,
      'difficult': 0.5,
      'challenge': 0.5,
      'challenges': 0.5,
      'delay': 0.5,
      'delays': 0.5,
      'complaint': 1,
      'complaints': 1,
      'harm': 1.5,
      'harmful': 1.5,
      'damage': 1,
      'damages': 1,
      'prohibited': 1.5,
      'prohibition': 1.5,
      'restriction': 1,
      'restricted': 1,
      'limitation': 0.5,
      'limited': 0.5,
      'unfortunate': 0.5,
      'sadly': 0.5,
      'bad': 1,
      'worse': 1.5,
      'worst': 2
    };

    let sentimentScore = 0;
    const foundKeywords = {
      positive: [],
      negative: []
    };

    // Analyze text for positive keywords
    Object.keys(positiveKeywords).forEach(keyword => {
      const regex = new RegExp(`\\b${keyword}\\b`, 'gi');
      const matches = text.match(regex);
      
      if (matches) {
        const weight = positiveKeywords[keyword];
        sentimentScore += matches.length * weight;
        foundKeywords.positive.push({
          word: keyword,
          count: matches.length,
          weight
        });
      }
    });

    // Analyze text for negative keywords
    Object.keys(negativeKeywords).forEach(keyword => {
      const regex = new RegExp(`\\b${keyword}\\b`, 'gi');
      const matches = text.match(regex);
      
      if (matches) {
        const weight = negativeKeywords[keyword];
        sentimentScore -= matches.length * weight;
        foundKeywords.negative.push({
          word: keyword,
          count: matches.length,
          weight
        });
      }
    });

    // Categorize the sentiment
    let category;
    if (sentimentScore > 3) {
      category = 'very positive';
    } else if (sentimentScore > 1) {
      category = 'positive';
    } else if (sentimentScore < -3) {
      category = 'very negative';
    } else if (sentimentScore < -1) {
      category = 'negative';
    } else {
      category = 'neutral';
    }

    return {
      score: sentimentScore,
      category,
      keywords: {
        positive: foundKeywords.positive.sort((a, b) => (b.count * b.weight) - (a.count * a.weight)),
        negative: foundKeywords.negative.sort((a, b) => (b.count * b.weight) - (a.count * a.weight))
      }
    };
  }

  /**
   * Get visual indicators based on sentiment analysis
   * @param {object} sentimentResult - The sentiment analysis result
   * @returns {object} - Visual indicator data
   */
  getVisualIndicators(sentimentResult) {
    const { category, score } = sentimentResult;
    
    // Color indicators
    let color;
    switch (category) {
      case 'very positive':
        color = '#4CAF50'; // Green
        break;
      case 'positive':
        color = '#8BC34A'; // Light Green
        break;
      case 'neutral':
        color = '#9E9E9E'; // Gray
        break;
      case 'negative':
        color = '#FF9800'; // Orange
        break;
      case 'very negative':
        color = '#F44336'; // Red
        break;
      default:
        color = '#9E9E9E'; // Gray
    }
    
    // Icon indicators
    let icon;
    switch (category) {
      case 'very positive':
        icon = 'thumb_up_double';
        break;
      case 'positive':
        icon = 'thumb_up';
        break;
      case 'neutral':
        icon = 'thumbs_up_down';
        break;
      case 'negative':
        icon = 'thumb_down';
        break;
      case 'very negative':
        icon = 'thumb_down_double';
        break;
      default:
        icon = 'thumbs_up_down';
    }
    
    return {
      color,
      icon,
      category,
      score
    };
  }
}

// Create a singleton instance
const sentimentAnalyzer = new SentimentAnalyzer();
export default sentimentAnalyzer; 
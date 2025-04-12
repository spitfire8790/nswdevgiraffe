/**
 * Service to automatically tag and categorize content in AI responses
 */
class CategoryTagger {
  constructor() {
    // Define category keywords and their weights
    this.categories = {
      'Environmental': {
        keywords: {
          'flood': 2,
          'flooding': 2,
          'bushfire': 2,
          'fire': 1.5,
          'hazard': 1.5,
          'contamination': 2,
          'contaminated': 2,
          'pollution': 1.5,
          'polluted': 1.5,
          'ecological': 1.5,
          'ecology': 1.5,
          'habitat': 1.5,
          'species': 1,
          'wildlife': 1.5,
          'conservation': 1.5,
          'protected': 1,
          'wetland': 1.5,
          'waterway': 1.5,
          'creek': 1,
          'river': 1,
          'runoff': 1,
          'drainage': 1,
          'erosion': 1.5,
          'sustainable': 1,
          'sustainability': 1,
          'green space': 1.5,
          'trees': 1,
          'vegetation': 1.5,
          'biodiversity': 1.5,
          'climate': 1,
          'emissions': 1.5,
          'waste': 1,
          'sewage': 1.5,
          'environmental impact': 2
        },
        icon: 'park',
        color: '#4CAF50' // Green
      },
      'Zoning & Planning': {
        keywords: {
          'zoning': 2,
          'zone': 1.5,
          'rezoning': 2,
          'planning': 1.5,
          'permit': 1.5,
          'approval': 1.5,
          'regulation': 1,
          'compliance': 1.5,
          'compliant': 1.5,
          'non-compliant': 1.5,
          'code': 1,
          'ordinance': 1.5,
          'bylaw': 1.5,
          'variance': 1.5,
          'height limit': 1.5,
          'setback': 1,
          'floor area ratio': 1.5,
          'FAR': 1,
          'density': 1,
          'land use': 2,
          'masterplan': 1.5,
          'master plan': 1.5,
          'development control': 1.5,
          'building code': 1.5,
          'overlay': 1,
          'restriction': 1,
          'easement': 1.5,
          'covenant': 1.5,
          'heritage': 1.5,
          'lot size': 1,
          'frontage': 1,
          'subdivision': 1.5
        },
        icon: 'map',
        color: '#2196F3' // Blue
      },
      'Community Feedback': {
        keywords: {
          'community': 1.5,
          'feedback': 1.5,
          'public': 1,
          'resident': 1.5,
          'residents': 1.5,
          'neighbor': 1.5,
          'neighbour': 1.5,
          'neighbors': 1.5,
          'neighbours': 1.5,
          'consultation': 1.5,
          'meeting': 1,
          'hearing': 1.5,
          'submission': 1.5,
          'submissions': 1.5,
          'objection': 2,
          'objections': 2,
          'support': 1.5,
          'supported': 1.5,
          'oppose': 1.5,
          'opposed': 1.5,
          'concern': 1.5,
          'concerns': 1.5,
          'petition': 2,
          'protest': 1.5,
          'community group': 1.5,
          'stakeholder': 1.5,
          'stakeholders': 1.5,
          'public opinion': 1.5,
          'public interest': 1.5,
          'letters': 1,
          'feedback': 1.5,
          'comments': 1
        },
        icon: 'groups',
        color: '#FF9800' // Orange
      },
      'Infrastructure & Services': {
        keywords: {
          'infrastructure': 2,
          'transport': 1.5,
          'transportation': 1.5,
          'road': 1,
          'traffic': 1.5,
          'congestion': 1.5,
          'parking': 1.5,
          'public transport': 1.5,
          'transit': 1.5,
          'bus': 1,
          'train': 1,
          'railway': 1,
          'utility': 1.5,
          'utilities': 1.5,
          'water supply': 1.5,
          'sewerage': 1.5,
          'electricity': 1,
          'power': 1,
          'gas': 1,
          'telecommunications': 1.5,
          'internet': 1,
          'broadband': 1,
          'school': 1.5,
          'hospital': 1.5,
          'medical': 1,
          'amenity': 1.5,
          'amenities': 1.5,
          'service': 1,
          'services': 1,
          'capacity': 1,
          'access': 1.5,
          'accessibility': 1.5
        },
        icon: 'engineering',
        color: '#673AB7' // Deep Purple
      },
      'Historical Significance': {
        keywords: {
          'historic': 2,
          'historical': 2,
          'heritage': 2,
          'listed': 1.5,
          'preservation': 1.5,
          'preserve': 1.5,
          'artifact': 1.5,
          'artefact': 1.5,
          'archaeological': 2,
          'archaeology': 2,
          'cultural': 1.5,
          'indigenous': 1.5,
          'aboriginal': 1.5,
          'significant site': 1.5,
          'landmark': 1.5,
          'monument': 1.5,
          'memorial': 1.5,
          'century': 1,
          'ancient': 1.5,
          'traditional': 1,
          'legacy': 1,
          'history': 1.5,
          'vintage': 1,
          'colonial': 1.5,
          'architecture': 1,
          'restoration': 1.5,
          'conserve': 1.5,
          'conservation': 1.5
        },
        icon: 'history_edu',
        color: '#795548' // Brown
      }
    };
  }

  /**
   * Analyze text and tag it with relevant categories
   * @param {string} text - The text to analyze
   * @returns {object} - Categories with scores and keywords found
   */
  tagCategories(text) {
    if (!text) return {};
    
    const results = {};
    
    // Check each category
    Object.keys(this.categories).forEach(category => {
      const categoryData = this.categories[category];
      let score = 0;
      const foundKeywords = [];
      
      // Check for matching keywords in this category
      Object.keys(categoryData.keywords).forEach(keyword => {
        const regex = new RegExp(`\\b${keyword}\\b`, 'gi');
        const matches = text.match(regex);
        
        if (matches) {
          const weight = categoryData.keywords[keyword];
          const matchScore = matches.length * weight;
          score += matchScore;
          
          foundKeywords.push({
            keyword,
            count: matches.length,
            weight,
            score: matchScore
          });
        }
      });
      
      // Only include categories with matching keywords
      if (score > 0) {
        results[category] = {
          score,
          foundKeywords: foundKeywords.sort((a, b) => b.score - a.score),
          icon: categoryData.icon,
          color: categoryData.color
        };
      }
    });
    
    return results;
  }

  /**
   * Get dominant category from analysis results
   * @param {object} categoryResults - Results from tagCategories()
   * @returns {string|null} - The dominant category or null if none
   */
  getDominantCategory(categoryResults) {
    if (!categoryResults || Object.keys(categoryResults).length === 0) {
      return null;
    }
    
    let highestScore = 0;
    let dominantCategory = null;
    
    Object.keys(categoryResults).forEach(category => {
      if (categoryResults[category].score > highestScore) {
        highestScore = categoryResults[category].score;
        dominantCategory = category;
      }
    });
    
    return dominantCategory;
  }

  /**
   * Get icon for a specific category
   * @param {string} category - The category name
   * @returns {string} - The icon name
   */
  getCategoryIcon(category) {
    return this.categories[category]?.icon || 'label';
  }

  /**
   * Get color for a specific category
   * @param {string} category - The category name
   * @returns {string} - The color hex code
   */
  getCategoryColor(category) {
    return this.categories[category]?.color || '#9E9E9E';
  }
}

// Create a singleton instance
const categoryTagger = new CategoryTagger();
export default categoryTagger; 
import {
  Home,
  Wrench,
  Building2,
  UtensilsCrossed,
  GraduationCap,
  Stethoscope,
  Bike,
  Hotel,
  Factory,
  Car,
  Anchor,
  Settings,
  Map as MapIcon,
  Building,
  Briefcase,
  Hammer,
  FileText,
  Tractor,
  Shovel
} from "lucide-react";

// Define the development categories with their icons and colors
export const developmentCategories = {
  'Residential Types': { icon: Home, color: '#FF483B' },
  'Alterations and Modifications': { icon: Wrench, color: '#9333ea' },
  'Commercial and Business': { icon: Building2, color: '#04aae5' },
  'Food and Beverage': { icon: UtensilsCrossed, color: '#ea580c' },
  'Education and Childcare': { icon: GraduationCap, color: '#16a34a' },
  'Health and Medical': { icon: Stethoscope, color: '#ef4444' },
  'Recreation and Entertainment': { icon: Bike, color: '#4daf4a' },
  'Tourism and Accommodation': { icon: Hotel, color: '#f59e0b' },
  'Industrial and Warehousing': { icon: Factory, color: '#64748b' },
  'Transport and Vehicle Related': { icon: Car, color: '#0891b2' },
  'Marine and Water Related': { icon: Anchor, color: '#0ea5e9' },
  'Infrastructure and Utilities': { icon: Settings, color: '#475569' },
  'Subdivision and Land Development': { icon: MapIcon, color: '#330000' },
  'Mixed Use and Other Development Types': { icon: Building, color: '#7c3aed' },
  'Home Business and Occupation': { icon: Briefcase, color: '#0d9488' },
  'Secondary Structures and Modifications': { icon: Hammer, color: '#737373' },
  'Miscellaneous and Administrative': { icon: FileText, color: '#525252' },
  'Agriculture': { icon: Tractor, color: '#166534' },
  'Mining and Resource Extraction': { icon: Shovel, color: '#78350f' }
};

// Development types data - organized by category
export const devTypesData = [
  {
    category: 'Residential Types',
    types: [
      { oldtype: 'Dwelling', newtype: 'Dwelling', secondary: '' },
      { oldtype: 'Boarding house', newtype: 'Boarding house', secondary: '' },
      { oldtype: 'Attached dwelling', newtype: '', secondary: '' },
      { oldtype: 'Dwelling house', newtype: 'Dwelling', secondary: '' },
      { oldtype: 'Co-living', newtype: '', secondary: 'X'},
      { oldtype: 'Secondary dwelling', newtype: '', secondary: 'X' },
      { oldtype: 'Dual occupancy', newtype: 'Dual occupancy', secondary: '' },
      { oldtype: 'Non-standard Housing', newtype: '', secondary: 'X' }, 
      { oldtype: 'Residential flat building', newtype: 'Apartments', secondary: '' },
      { oldtype: 'Multi-dwelling housing', newtype: 'Multi-dwelling housing', secondary: '' },
      { oldtype: 'Seniors housing', newtype: '', secondary: '' },
      { oldtype: 'Semi-attached dwelling', newtype: '', secondary: '' },
      { oldtype: 'Shop top housing', newtype: 'Shop top housing', secondary: '' }
    ]
  },
  {
    category: 'Commercial and Business',
    types: [
      { oldtype: 'Commercial development', newtype: 'Commercial', secondary: '' },
      { oldtype: 'Business premises', newtype: 'Commercial', secondary: '' },
      { oldtype: 'Registered club', newtype: '', secondary: '' },
      { oldtype: 'Office premises', newtype: 'Office', secondary: '' },
      { oldtype: 'Retail premises', newtype: 'Retail', secondary: '' },
      { oldtype: 'Shop', newtype: 'Shop', secondary: '' },
      { oldtype: 'Office Premises', newtype: 'Office', secondary: '' }
    ]
  },
  {
    category: 'Food and Beverage',
    types: [
      { oldtype: 'Restaurant or cafe', newtype: 'Food and beverage', secondary: '' },
      { oldtype: 'Food and drink premises', newtype: 'Food and beverage', secondary: '' },
      { oldtype: 'Small bar', newtype: '', secondary: '' },
      { oldtype: 'Pub', newtype: '', secondary: '' },
      { oldtype: 'Take-away food and drink premises', newtype: 'Take-away food and drink', secondary: 'X' },
      { oldtype: 'Take-away food and drink', newtype: 'Take-away food and drink', secondary: 'X' },
      { oldtype: 'Take away food and drink', newtype: 'Take-away food and drink', secondary: 'X' },
      { oldtype: 'Artisan food and drink industry', newtype: 'Artisan food and drink', secondary: '' },
      { oldtype: 'Artisinal food and drink', newtype: 'Artisan food and drink', secondary: '' }
    ]
  },
  {
    category: 'Education and Childcare',
    types: [
      { oldtype: 'Educational establishment', newtype: 'Educational establishment', secondary: '' },
      { oldtype: 'School', newtype: 'School', secondary: '' },
      { oldtype: 'Centre based childcare', newtype: 'Childcare', secondary: '' }
    ]
  },
  {
    category: 'Health and Medical',
    types: [
      { oldtype: 'Health services facility', newtype: 'Health services', secondary: '' },
      { oldtype: 'Medical centre', newtype: 'Medical centre', secondary: '' },
      { oldtype: 'Hospital', newtype: 'Hospital', secondary: '' },
      { oldtype: 'Residential care facility', newtype: '', secondary: '' },
      { oldtype: 'Health services facilities', newtype: '', secondary: '' }
    ]
  },
  {
    category: 'Recreation and Entertainment',
    types: [
      { oldtype: 'Recreation facility (indoor)', newtype: 'Recreation facility (indoor)', secondary: '' },
      { oldtype: 'Recreation facility (outdoor)', newtype: 'Recreation facility (outdoor)', secondary: '' },
      { oldtype: 'Recreational Uses', newtype: '', secondary: '' }
    ]
  },
  {
    category: 'Tourism and Accommodation',
    types: [
      { oldtype: 'Hotel or motel accommodation', newtype: 'Hotel', secondary: '' }
    ]
  },
  {
    category: 'Industrial and Warehousing',
    types: [
      { oldtype: 'Industrial development', newtype: 'Industrial', secondary: '' },
      { oldtype: 'Warehouse or distribution centre', newtype: 'Warehouse or distribution centre', secondary: '' }
    ]
  },
  {
    category: 'Transport and Vehicle Related',
    types: [
      { oldtype: 'Car park', newtype: 'Car park', secondary: '' }
    ]
  },
  {
    category: 'Subdivision and Land Development',
    types: [
      { oldtype: 'Subdivision of land', newtype: 'Subdivision', secondary: 'X' }
    ]
  },
  {
    category: 'Mixed Use and Other Development Types',
    types: [
      { oldtype: 'Mixed use development', newtype: 'Mixed use', secondary: '' }
    ]
  }
];

/**
 * Gets the development category for a given development type
 */
export const getDevelopmentCategory = (developmentType) => {
  if (!developmentType) return 'Miscellaneous and Administrative';
  
  const categoryEntry = devTypesData.find(category => 
    category.types.some(type => 
      type.oldtype === developmentType || type.newtype === developmentType
    )
  );
  
  return categoryEntry ? categoryEntry.category : 'Miscellaneous and Administrative';
};

// Create type mapping
export const typeMap = new Map(
  devTypesData.flatMap(category => 
    category.types.map(row => [
      row.oldtype, 
      { 
        newtype: row.newtype || row.oldtype,
        secondary: row.secondary === 'X',
        category: category.category
      }
    ])
  )
); 
# Development Modal - Standalone App Plan

## Overview

This document outlines the plan for creating a standalone application from the existing DevelopmentModal component.

## Required Components and Files

### Core Components

- **index.jsx** - Main DevelopmentModal component (1729 lines)
- **mapLayerUtils.js** - Utilities for map layer creation and management (512 lines)
- **developmentTypes.js** - Development type definitions and categories (509 lines)
- **tooltipContent.js** - Tooltip content definitions (45 lines)
- **InfoTooltip.jsx** - Info tooltip component (82 lines)

### Required Utilities

- **formatters.js** - Utility functions for formatting dates, currency, etc.
- **councilLgaMapping.js** - Mapping of council names to LGA names
- **mapUtils.js** - Utilities for map operations (particularly validateGeoJSON)

### External Dependencies

- **React** - Core framework
- **react-dom** - For rendering React components
- **framer-motion** - For animations
- **@gi-nx/iframe-sdk** - For map interactions
- **@turf/turf** - For geospatial operations
- **recharts** - For charts and visualizations
- **lucide-react** - For icons

## Project Structure

```
development-modal-app/
├── public/
│   ├── index.html
│   └── favicon.ico
├── src/
│   ├── components/
│   │   ├── DevelopmentModal/
│   │   │   ├── index.jsx
│   │   │   ├── mapLayerUtils.js
│   │   │   ├── developmentTypes.js
│   │   │   ├── tooltipContent.js
│   │   │   └── InfoTooltip.jsx
│   │   └── // Other components if needed
│   ├── utils/
│   │   ├── formatters.js
│   │   ├── mapUtils.js
│   │   └── councilLgaMapping.js
│   ├── App.jsx
│   ├── index.jsx
│   └── styles.css
├── package.json
├── README.md
└── // Other config files (e.g., .gitignore, vite.config.js, etc.)
```

## Implementation Steps

1. **Initialize Project**

   - Create a new project using a modern React framework (Next.js or Vite)
   - Set up the folder structure

2. **Copy Core Components**

   - Copy the main DevelopmentModal component files
   - Refactor as needed to work as a standalone app

3. **Copy Required Utilities**

   - Copy the formatters.js, mapUtils.js, and councilLgaMapping.js files
   - Ensure all utility functions are available in the new project

4. **Install Dependencies**

   - Install all required npm packages
   - Ensure compatibility between different packages

5. **Create App Shell**

   - Create an App component that will render the DevelopmentModal
   - Add any necessary routing or state management

6. **API Integration**

   - Set up the proxy server for accessing the NSW Planning Portal API
   - Ensure proper error handling for API requests

7. **Map Integration**

   - Integrate with the GI-NX iframe SDK for map operations
   - Ensure proper initialization and error handling

8. **Styling and UI Enhancements**

   - Apply consistent styling across the application
   - Add any necessary responsive design elements

9. **Testing**

   - Test key functionality (data fetching, map operations, filtering)
   - Ensure the standalone app works correctly in different environments

10. **Documentation**
    - Create a README.md file with setup and usage instructions
    - Document API endpoints and required environment variables

## Package.json Dependencies

```json
{
  "dependencies": {
    "@gi-nx/iframe-sdk": "^x.x.x",
    "@turf/turf": "^6.5.0",
    "framer-motion": "^10.x.x",
    "lucide-react": "^0.x.x",
    "react": "^18.x.x",
    "react-dom": "^18.x.x",
    "recharts": "^2.x.x"
  },
  "devDependencies": {
    "@types/react": "^18.x.x",
    "@types/react-dom": "^18.x.x",
    "@vitejs/plugin-react": "^4.0.0",
    "autoprefixer": "^10.x.x",
    "postcss": "^8.x.x",
    "tailwindcss": "^3.x.x",
    "vite": "^4.x.x"
  }
}
```

## Considerations and Challenges

1. **Data Source**

   - The app relies on the NSW Planning Portal API
   - A proxy server may be needed to handle CORS and API authentication

2. **Map Integration**

   - The component relies on the GI-NX iframe SDK for map operations
   - Consider alternative mapping libraries if needed (e.g., Mapbox, Leaflet)

3. **State Management**

   - The current implementation uses React's state hooks
   - Consider using a state management library if the app grows more complex

4. **Performance**

   - The component handles large datasets and creates map layers
   - Optimize for performance, especially when dealing with many development applications

5. **Authentication**
   - Determine if authentication is needed for API access
   - Implement authentication if required

## Next Steps

1. Create basic project structure
2. Copy core files maintaining the same folder structure
3. Set up necessary dependencies
4. Implement a simple standalone version
5. Test core functionality
6. Enhance UI/UX as needed

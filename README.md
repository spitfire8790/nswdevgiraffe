# Development Applications Viewer

An application for tracking development applications across NSW.

## Deployment to Vercel

### Prerequisites

- Node.js 18 or later
- npm or yarn
- A [Vercel](https://vercel.com) account

### Deployment Steps

1. **Install Vercel CLI (optional but recommended):**

```bash
npm install -g vercel
```

2. **Deploy to Vercel:**

Option 1: Using Vercel CLI:

```bash
# Login to Vercel
vercel login

# Deploy
vercel
```

Option 2: Using Vercel Dashboard:

- Push your code to a Git repository (GitHub, GitLab, or Bitbucket)
- Import the project in the [Vercel Dashboard](https://vercel.com/new)
- Follow the on-screen instructions

3. **Environment Variables:**

Make sure to set these environment variables in the Vercel dashboard:

- Any API keys required by your application
- Any other environment-specific configuration

## Development

```bash
# Install dependencies
npm install

# Run the development server
npm run dev
```

## Features

- Display development applications on a map
- Filter by development type
- View detailed information about each application
- Integrated with Vercel Analytics for usage metrics

## Overview

This application provides a dedicated interface for exploring development applications in NSW local government areas. It allows users to view, filter, and analyze development applications data obtained from the NSW Planning Portal.

## Features

- View development applications for NSW LGAs
- Filter by development type, status, and other criteria
- Visualize developments on a map using the GI-NX iframe SDK
- View statistics and charts about development activity
- Export development data for further analysis

## Installation

1. Clone the repository
2. Install dependencies:

```
npm install
```

## Getting Started

### Running the application

The application requires both a frontend server and a proxy server for API requests. You can start both using:

#### Option 1: Use the start script

```
./start.bat
```

#### Option 2: Start servers separately

In one terminal:

```
npm run proxy
```

In another terminal:

```
npm run dev
```

The application will be available at [http://localhost:3000](http://localhost:3000).

### Using the application

1. Enter an LGA name (Local Government Area) in the search field (e.g., "SYDNEY" or "PARRAMATTA")
2. Click "View Development Applications" to fetch and display data
3. Explore the development applications through the various views and filters
4. Use the "Add to Map" button to visualize the applications on a map

## Technical Details

### Dependencies

- React 18+
- Vite
- @gi-nx/iframe-sdk for map integration
- @turf/turf for geospatial operations
- framer-motion for animations
- recharts for data visualization
- lucide-react for icons
- express for the proxy server

### Environment Variables

None required for basic operation, but the API endpoints can be configured in `server.js` if needed.

### API Proxy

The application includes a proxy server to handle requests to the NSW Planning Portal API, which helps avoid CORS issues and provides a unified interface for API requests.

## Development

This project was created following the plan outlined in `docs/DevelopmentModalApp.md`.

## Troubleshooting

- **API Errors**: Ensure the proxy server is running. Check the console for error messages.
- **Map Integration Issues**: Verify that the GI-NX iframe SDK is properly connected.
- **Data Not Loading**: Check that the entered LGA name is valid and matches the NSW government naming conventions.

## License

This project is privately licensed and not for redistribution.

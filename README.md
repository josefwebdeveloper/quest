# Worker Flights Application

A lightweight Angular application for displaying and managing worker flight information. The application provides an intuitive interface for viewing flights associated with workers.

## Prerequisites

- Node.js (v16.x or later)
- npm (v7.x or later)
- Angular CLI (`npm install -g @angular/cli`)

## Installation

1. Clone this repository
   ```bash
   git clone <repository-url>
   cd quest
   ```

2. Install dependencies
   ```bash
   npm install
   ```

## Running the Application

### Development Server

Run the development server with:

```bash
ng serve
```

Navigate to `http://localhost:4200/` in your browser. The application will automatically reload if you change any of the source files.

For mobile testing, you can make the server accessible on your local network:

```bash
ng serve --host 0.0.0.0
```

### Running with API proxy

The application uses a proxy configuration to avoid CORS issues:

```bash
ng serve --proxy-config proxy.conf.json
```

This proxy configuration routes API requests through the Angular development server, avoiding CORS restrictions without requiring backend changes. For production deployment, ensure either proper CORS headers are set on the API server or maintain a similar proxy configuration on the production server.

## Building for Production

Build the project for production:

```bash
ng build --configuration production
```

The build artifacts will be stored in the `dist/` directory.

## Project Features

### Core Functionality
- Worker selection with automatic selection of the first flight in the list
- Flight information table with sortable columns:
  - Flight Number
  - Origin
  - Origin Date
  - Destination
  - Destination Date
- Detailed flight information panel showing:
  - Flight duration
  - Plane model information
  - Origin/destination cities and gates
  - Flight status

### Technical Features
- Built with Angular and Material UI components for a responsive design
- Implemented 60-second interval refresh for real-time flight data updates
- Smart UI optimization that prevents unnecessary re-rendering when API responses contain unchanged data
- Efficient data handling with caching to reduce API calls
- Flight filtering and sorting capabilities
- Responsive layout for desktop and mobile devices

## Project Structure

- `src/app/components/` - Application components
  - `workers-list/` - Worker selection component
  - `flights-table/` - Flight information table
  - `flight-details/` - Detailed flight information panel
- `src/app/shared/` - Shared services, models, and utilities
  - `services/` - API and utility services
  - `models/` - Type definitions
  - `pipes/` - Custom data transformation pipes
- `src/app/pages/` - Page-level components
- `public/assets/` - Static assets and styles

## Performance Optimizations

- Change detection strategy is set to OnPush for better performance
- Smart data fetching with caching mechanism to reduce API calls
- Differential updating to prevent UI re-rendering when flight data hasn't changed
- Automatic refresh on a 60-second interval with checks to prevent redundant UI updates

## Deployment

To deploy the application, copy the contents of the `dist/` directory to your web server of choice after building for production.

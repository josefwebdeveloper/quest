# Worker Flights Application

A lightweight Angular application for displaying and managing worker flight information.

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

## Building for Production

Build the project for production:

```bash
ng build --configuration production
```

The build artifacts will be stored in the `dist/` directory.

## Project Features

- Worker management and selection
- Flight information display with sorting and filtering
- Responsive design for desktop and mobile views
- Real-time data updates via an API

## Project Structure

- `src/app/components/` - Application components
- `src/app/shared/` - Shared services, models, and utilities
- `src/app/pages/` - Page-level components
- `public/assets/` - Static assets and styles

## Deployment

To deploy the application, copy the contents of the `dist/` directory to your web server of choice after building for production.

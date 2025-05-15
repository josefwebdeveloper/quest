# Quest

This project was generated using [Angular CLI](https://github.com/angular/angular-cli) version 19.2.11.

## Development server

To start a local development server, run:

```bash
ng serve
```

Once the server is running, open your browser and navigate to `http://localhost:4200/`. The application will automatically reload whenever you modify any of the source files.

## CORS Handling

### Local Development

During local development, the application uses Angular's built-in proxy configuration to handle CORS issues. This is configured in `src/proxy.conf.json` and enabled in `angular.json`.

To run with the proxy enabled:

```bash
ng serve
```

This will route all API requests through the development server, bypassing CORS restrictions.

### Vercel Deployment

When deployed to Vercel, the application uses a combination of approaches to handle CORS issues:

1. **Vercel Rewrites**: Configured in `vercel.json`, this approach forwards API requests to the original endpoint.

```json
{
  "rewrites": [
    {
      "source": "/api/:path*",
      "destination": "http://128.24.65.53:3000/:path*"
    }
  ]
}
```

2. **Serverless Functions**: Located in the `/api` folder, these Node.js functions serve as proxies for API requests.

3. **CORS Headers**: Custom headers are added to responses to allow cross-origin requests.

```json
{
  "headers": [
    {
      "source": "/api/(.*)",
      "headers": [
        { "key": "Access-Control-Allow-Origin", "value": "*" },
        // Other CORS headers...
      ]
    }
  ]
}
```

4. **Angular Routing Support**: The configuration includes a fallback to ensure Angular routing works correctly.

```json
{
  "rewrites": [
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ]
}
```

## Code scaffolding

Angular CLI includes powerful code scaffolding tools. To generate a new component, run:

```bash
ng generate component component-name
```

For a complete list of available schematics (such as `components`, `directives`, or `pipes`), run:

```bash
ng generate --help
```

## Building

To build the project run:

```bash
ng build
```

This will compile your project and store the build artifacts in the `dist/` directory. By default, the production build optimizes your application for performance and speed.

## Running unit tests

To execute unit tests with the [Karma](https://karma-runner.github.io) test runner, use the following command:

```bash
ng test
```

## Running end-to-end tests

For end-to-end (e2e) testing, run:

```bash
ng e2e
```

Angular CLI does not come with an end-to-end testing framework by default. You can choose one that suits your needs.

## Additional Resources

For more information on using the Angular CLI, including detailed command references, visit the [Angular CLI Overview and Command Reference](https://angular.dev/tools/cli) page.

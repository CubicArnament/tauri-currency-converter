# Tauri Currency Converter (React Version)

This is a currency converter application built with Tauri, React, TypeScript, and Rust. The application provides precise currency conversion using Rust's `rust_decimal` crate for accurate financial calculations.

## Features

- Real-time currency conversion with precise decimal calculations
- Support for major global and CIS currencies
- Local caching for improved performance
- Dark/light theme support
- Responsive design for all device sizes
- Built with type safety in mind using TypeScript

## Tech Stack

- **Frontend**: React with TypeScript
- **Styling**: SCSS with modern CSS features
- **Backend**: Rust with Tauri
- **Precision**: `rust_decimal` crate for accurate financial calculations
- **Build Tool**: Vite

## Architecture

The application follows a clean architecture pattern:

- **UI Layer**: React components in `src/components/`
- **API Layer**: Safe wrappers for Tauri API calls in `src/lib/rust-api.ts`
- **Type Definitions**: Strict TypeScript types in `src/lib/types.ts`
- **Business Logic**: Rust backend in `src-tauri/src/lib.rs`

## Key Features

1. **Precise Calculations**: Uses Rust's `rust_decimal` for financial-grade precision
2. **Caching**: Both in-memory and localStorage caching to reduce API calls
3. **Debounced Input**: Smooth user experience with optimized API calls
4. **Theme Support**: User preference for light/dark mode
5. **Type Safety**: Strict TypeScript typing throughout the application

## Getting Started

1. Install dependencies: `npm install`
2. Run in development: `npm run tauri:dev`
3. Build for production: `npm run tauri:build`

## Project Structure

```
src/
├── components/          # React components
├── lib/                # API wrappers and type definitions
├── styles/             # SCSS stylesheets
├── App.tsx             # Main React component
├── main.tsx            # React entry point
└── app.html            # HTML template
```

## Conversion Flow

1. User enters amount and selects currencies
2. Application checks local cache first
3. If not cached, calls Rust backend via Tauri
4. Rust fetches exchange rates from API and calculates result
5. Result is returned as precise decimal string
6. Result is cached and displayed to user

## Security

- All currency calculations happen in Rust for safety
- Strict type checking on all data transfers
- CSP disabled for development (as per Tauri defaults)

## Notes

- The application was migrated from SvelteKit to React while preserving all functionality
- All original features and performance optimizations have been maintained
- The SCSS styles provide a modern, responsive UI with theme support
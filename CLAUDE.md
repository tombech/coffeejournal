# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a Coffee Journal application that allows users to track coffee products, batches, and brewing sessions. The application consists of a Flask backend API and React frontend with comprehensive lookup management for brewing equipment and methods.

## Architecture

### Backend (Flask)
- **Entry Point**: `src/coffeejournal/wsgi.py` - WSGI application entry point
- **App Factory**: `src/coffeejournal/__init__.py` - Flask application factory pattern with JSON storage setup
- **Repositories**: `src/coffeejournal/repositories/` - Repository pattern for data persistence
  - `base.py` - Abstract base classes for repository pattern
  - `json_repository.py` - JSON file-based repository implementations
  - `factory.py` - Repository factory for managing instances
- **API Routes**: `src/coffeejournal/main.py` - REST API endpoints with Blueprint pattern
- **Data Storage**: JSON files in `test_data/` directory by default

### Frontend (React)
- **Entry Point**: `src/coffeejournal/frontend/src/App.js` - Main React app with routing
- **Components**: `src/coffeejournal/frontend/src/components/` - React components for forms, lists, and details
- **Lookup Management**: `src/coffeejournal/frontend/src/components/lookup/` - Settings management for lookup tables
- **Build System**: Create React App (CRA) with standard scripts and proxy to backend

### Data Model Structure
- **CoffeeBeanProduct**: Core product entity with roasters, bean types, countries/regions, and decaf methods
- **CoffeeBatch**: Specific batches of coffee with roast dates, amounts, and pricing
- **BrewSession**: Individual brewing sessions with detailed parameters, equipment, and comprehensive rating system
- **Lookup Tables**: Roaster, BeanType, Country, BrewMethod, Recipe, DecafMethod, Grinder, Filter, Kettle, Scale (auto-created via `get_or_create` helper)

### JSON Storage Structure
Each entity type is stored in separate JSON files:
- `test_data/roasters.json` - Roaster lookup table
- `test_data/bean_types.json` - Bean type lookup table  
- `test_data/countries.json` - Country/region lookup table
- `test_data/brew_methods.json` - Brew method lookup table
- `test_data/recipes.json` - Recipe lookup table
- `test_data/decaf_methods.json` - Decaffeination method lookup table
- `test_data/grinders.json` - Coffee grinder lookup table
- `test_data/filters.json` - Filter type lookup table
- `test_data/kettles.json` - Kettle lookup table
- `test_data/scales.json` - Scale lookup table
- `test_data/products.json` - Coffee products
- `test_data/batches.json` - Coffee batches
- `test_data/brew_sessions.json` - Brewing sessions

### Configuration
The data directory can be configured via environment variable:
```bash
# Use default test_data directory
PYTHONPATH=src uv run python3 -m coffeejournal.wsgi

# Use custom data directory
DATA_DIR=/path/to/custom/data PYTHONPATH=src uv run python3 -m coffeejournal.wsgi
```

## Development Commands

### Backend (Python)
```bash
# Install dependencies (uses uv)
uv sync

# Run development server
PYTHONPATH=src uv run python3 -m coffeejournal.wsgi

# Alternative: Run from project root
uv run python3 -m coffeejournal.wsgi
```

### Frontend (React)
```bash
# Navigate to frontend directory
cd src/coffeejournal/frontend

# Install dependencies
npm install

# Start development server (port 3000)
npm start

# Build for production
npm run build

# Run tests
npm test
```

## API Architecture

The Flask backend uses Blueprint patterns with all API routes prefixed with `/api`. Key endpoints:

- **Products**: `/api/products` - CRUD operations for coffee products with lookup integration
- **Batches**: `/api/batches` and `/api/products/{id}/batches` - Batch management with price per cup calculations
- **Brew Sessions**: `/api/brew_sessions` and `/api/batches/{id}/brew_sessions` - Comprehensive brewing session tracking
- **Core Lookups**: `/api/roasters`, `/api/bean_types`, `/api/countries`, `/api/brew_methods`, `/api/recipes`
- **Equipment Lookups**: `/api/grinders`, `/api/filters`, `/api/kettles`, `/api/scales`, `/api/decaf_methods`
- **Usage Tracking**: Each lookup endpoint includes `/usage` and `/update_references` sub-endpoints for safe deletion and data integrity

## Data Storage

Uses JSON files for data persistence with a repository pattern. Data files are stored in `test_data/` directory by default (configurable via `DATA_DIR` environment variable). The repository pattern includes:

- **Repository Pattern**: Abstract base classes (`BaseRepository`, `LookupRepository`) define interface
- **JSON Implementation**: Thread-safe JSON file operations with auto-incrementing IDs
- **Factory Pattern**: `RepositoryFactory` manages repository instances
- **Get-or-Create**: Lookup repositories include `get_or_create` functionality for reference data

This design allows easy migration to databases later while providing flexibility during development.

## Frontend Structure

React app using React Router for navigation. Components are organized by functionality:
- **Core Components**: ProductList/ProductDetail/ProductForm, BrewSessionList/BrewSessionForm/BrewSessionCard
- **Batch Management**: BatchForm for individual coffee batches 
- **Settings Management**: Comprehensive Settings page with navigation to lookup managers
- **Lookup Managers**: Individual managers for each lookup type (roasters, bean types, countries, brew methods, recipes, grinders, filters, kettles, scales, decaf methods)
- **UI Components**: Toast notifications, StarRating, DateInput/DateTimeInput, MultiSelect, DeleteConfirmationModal
- **Navigation**: Home page and Settings page with organized lookup management
- Uses standard CRA structure with React Router and proxy configuration for backend API

## Key Development Notes

- Backend uses Flask-CORS for cross-origin requests from React dev server
- Frontend proxy configuration in package.json directs API calls to backend (Flask: 5000, React: 3000)
- Repository pattern abstracts storage implementation from business logic
- Calculated properties (`brew_ratio`, `price_per_cup`) are computed in API routes
- All datetime fields use ISO format for API communication
- JSON storage is thread-safe with file locking for concurrent access
- Comprehensive lookup system with usage tracking and safe deletion
- Equipment tracking includes grinders, filters, kettles, and scales for detailed brew session records
- Settings page provides centralized management for all lookup tables
- Easy to switch storage backends by implementing new repository classes

## Commit Guidelines

- Never include self promotion in commit messages!!
- Always keep commit messages short and to the point
- Do not enumerate number of tests added
- For small changes always use single line commit messages

## Testing

```bash
# Run all tests
uv run pytest tests/ -v

# Run specific test file
uv run pytest tests/test_repositories.py -v
uv run pytest tests/test_api_endpoints.py -v
```

Tests include:
- Repository pattern unit tests
- API endpoint integration tests
- Lookup usage and reference management tests
- Brew session lookup integration tests
- Error handling and validation tests
- Calculated property tests
- Test data integration tests

## Test Data

The application includes comprehensive sample test data with:
- **Roasters**: Blue Bottle, Intelligentsia, Stumptown, Counter Culture, La Colombe
- **Bean Types**: Arabica, Robusta, Liberica, Excelsa
- **Countries/Regions**: 10+ coffee-producing regions
- **Brew Methods**: V60, Chemex, French Press, AeroPress, Espresso, etc.
- **Equipment**: Grinders (3 types), Kettles, Scales (3 types), Filters
- **Decaf Methods**: Swiss water method and other decaffeination processes
- **Recipes**: 5 different brewing recipes
- **Products**: 5 coffee products with realistic details including decaf options
- **Batches**: 6 batches with purchase dates, roast dates, and pricing
- **Brew Sessions**: 6 detailed brewing sessions with comprehensive rating system and equipment tracking

To regenerate test data:
```bash
uv run python3 create_test_data.py
```

## Docker Support

The project includes Docker configuration in the `docker/` directory for containerized deployment with separate backend and frontend containers, nginx reverse proxy, and volume mounting for data persistence.
```
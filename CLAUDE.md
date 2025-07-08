# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a Coffee Journal application that allows users to track coffee products, batches, and brewing sessions. The application consists of a Flask backend API and React frontend.

## Architecture

### Backend (Flask)
- **Entry Point**: `src/coffeejournal/wsgi.py` - WSGI application entry point
- **App Factory**: `src/coffeejournal/__init__.py` - Flask application factory pattern with JSON storage setup
- **Repositories**: `src/coffeejournal/repositories/` - Repository pattern for data persistence
  - `base.py` - Abstract base classes for repository pattern
  - `json_repository.py` - JSON file-based repository implementations
  - `factory.py` - Repository factory for managing instances
- **API Routes**: `src/coffeejournal/main.py` - REST API endpoints with Blueprint pattern
- **Data Storage**: JSON files in `instance/data/` directory

### Frontend (React)
- **Entry Point**: `src/coffeejournal/frontend/src/App.js` - Main React app with routing
- **Components**: `src/coffeejournal/frontend/src/components/` - React components for forms, lists, and details
- **Build System**: Create React App (CRA) with standard scripts

### Data Model Structure
- **CoffeeBeanProduct**: Core product entity linked to roasters, bean types, countries/regions
- **CoffeeBatch**: Specific batches of coffee with roast dates and amounts
- **BrewSession**: Individual brewing sessions with parameters and ratings
- **Lookup Tables**: Roaster, BeanType, Country, BrewMethod, Recipe (auto-created via `get_or_create` helper)

### JSON Storage Structure
Each entity type is stored in separate JSON files:
- `test_data/roasters.json` - Roaster lookup table
- `test_data/bean_types.json` - Bean type lookup table
- `test_data/countries.json` - Country/region lookup table
- `test_data/brew_methods.json` - Brew method lookup table
- `test_data/recipes.json` - Recipe lookup table
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

- **Products**: `/api/products` - CRUD operations for coffee products
- **Batches**: `/api/batches` and `/api/products/{id}/batches` - Batch management
- **Brew Sessions**: `/api/brew_sessions` - Brewing session tracking
- **Lookups**: `/api/roasters`, `/api/bean_types`, `/api/countries`, `/api/brew_methods`, `/api/recipes`

## Data Storage

Uses JSON files for data persistence with a repository pattern. Data files are stored in `test_data/` directory by default (configurable via `DATA_DIR` environment variable). The repository pattern includes:

- **Repository Pattern**: Abstract base classes (`BaseRepository`, `LookupRepository`) define interface
- **JSON Implementation**: Thread-safe JSON file operations with auto-incrementing IDs
- **Factory Pattern**: `RepositoryFactory` manages repository instances
- **Get-or-Create**: Lookup repositories include `get_or_create` functionality for reference data

This design allows easy migration to databases later while providing flexibility during development.

## Frontend Structure

React app using React Router for navigation. Components are organized by functionality:
- **ProductList/ProductDetail/ProductForm**: Product management
- **BrewSessionList/BrewSessionForm/BrewSessionCard**: Brewing session management
- Uses standard CRA structure with testing setup

## Key Development Notes

- Backend uses Flask-CORS for cross-origin requests from React dev server
- Frontend expects backend API at different port (Flask default: 5000, React: 3000)
- Repository pattern abstracts storage implementation from business logic
- Calculated properties (`brew_ratio`, `price_per_cup`) are computed in API routes
- All datetime fields use ISO format for API communication
- JSON storage is thread-safe with file locking for concurrent access
- Easy to switch storage backends by implementing new repository classes

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
- Error handling and validation tests
- Calculated property tests
- Test data integration tests

## Test Data

The application includes sample test data with:
- 5 roasters (Blue Bottle, Intelligentsia, Stumptown, Counter Culture, La Colombe)
- 4 bean types (Arabica, Robusta, Liberica, Excelsa)
- 10 countries/regions
- 8 brew methods (V60, Chemex, French Press, etc.)
- 5 recipes
- 5 coffee products with realistic details
- 6 batches with purchase and roast dates
- 6 brew sessions with tasting notes

To regenerate test data:
```bash
python3 create_test_data.py
```
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import Home from './components/Home';
import ProductList from './components/ProductList';
import ProductDetail from './components/ProductDetail';
import ProductForm from './components/ProductForm';
import BrewSessionList from './components/BrewSessionList';
import Settings from './components/Settings';
import BrewMethodManager from './components/lookup/BrewMethodManager';
import RecipeManager from './components/lookup/RecipeManager';
import BeanTypeManager from './components/lookup/BeanTypeManager';
import RoasterManager from './components/lookup/RoasterManager';
import CountryManager from './components/lookup/CountryManager';
import GrinderManager from './components/lookup/GrinderManager';
import FilterManager from './components/lookup/FilterManager';
import KettleManager from './components/lookup/KettleManager';
import ScaleManager from './components/lookup/ScaleManager';
import DecafMethodManager from './components/lookup/DecafMethodManager';
import { ToastProvider } from './components/Toast';
import './App.css'; // Import the CSS file

function App() {
  return (
    <ToastProvider>
      <Router>
        <div className="App">
          <header className="App-header">
            <h1>My Coffee Journal</h1>
            <nav>
              <ul>
                <li><Link to="/">Home</Link></li>
                <li><Link to="/brew-sessions">All brews</Link></li>
                <li><Link to="/settings">Settings</Link></li>
              </ul>
            </nav>
          </header>

          <main className="App-main" data-testid="app-main">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/products" element={<ProductList />} />
              <Route path="/products/new" element={<ProductForm />} />
              <Route path="/products/edit/:id" element={<ProductForm />} /> {/* For editing existing product */}
              <Route path="/products/:id" element={<ProductDetail />} />
              <Route path="/brew-sessions" element={<BrewSessionList />} />
              <Route path="/settings" element={<Settings />} />
              <Route path="/settings/brew-methods" element={<BrewMethodManager />} />
              <Route path="/settings/recipes" element={<RecipeManager />} />
              <Route path="/settings/bean-types" element={<BeanTypeManager />} />
              <Route path="/settings/roasters" element={<RoasterManager />} />
              <Route path="/settings/countries" element={<CountryManager />} />
              <Route path="/settings/grinders" element={<GrinderManager />} />
              <Route path="/settings/filters" element={<FilterManager />} />
              <Route path="/settings/kettles" element={<KettleManager />} />
              <Route path="/settings/scales" element={<ScaleManager />} />
              <Route path="/settings/decaf-methods" element={<DecafMethodManager />} />
            </Routes>
          </main>
        </div>
      </Router>
    </ToastProvider>
  );
}

export default App;
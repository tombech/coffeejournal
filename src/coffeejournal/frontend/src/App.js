import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import ProductList from './components/ProductList';
import ProductDetail from './components/ProductDetail';
import ProductForm from './components/ProductForm';
import BrewSessionList from './components/BrewSessionList';
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
                <li><Link to="/products">Products</Link></li>
                <li><Link to="/brew-sessions">Brews</Link></li>
              </ul>
            </nav>
          </header>

          <main className="App-main">
            <Routes>
              <Route path="/" element={<h2>Welcome to your Coffee Journal!</h2>} />
              <Route path="/products" element={<ProductList />} />
              <Route path="/products/new" element={<ProductForm />} />
              <Route path="/products/edit/:id" element={<ProductForm />} /> {/* For editing existing product */}
              <Route path="/products/:id" element={<ProductDetail />} />
              <Route path="/brew-sessions" element={<BrewSessionList />} />
            </Routes>
          </main>
        </div>
      </Router>
    </ToastProvider>
  );
}

export default App;
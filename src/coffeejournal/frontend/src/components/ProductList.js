import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useToast } from './Toast';
import { API_BASE_URL } from '../config';

function ProductList() {
  const { addToast } = useToast();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${API_BASE_URL}/products`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      setProducts(data);
    } catch (err) {
      setError("Failed to fetch products: " + err.message);
      console.error("Error fetching products:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this coffee product and all its associated batches and brew sessions?")) {
      try {
        const response = await fetch(`${API_BASE_URL}/products/${id}`, {
          method: 'DELETE',
        });
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        setProducts(products.filter(product => product.id !== id)); // Remove from UI
        addToast("Product deleted successfully!", 'success');
      } catch (err) {
        setError("Failed to delete product: " + err.message);
        console.error("Error deleting product:", err);
      }
    }
  };

  // Group products by roaster
  const groupedProducts = useMemo(() => {
    const groups = {};
    products.forEach(product => {
      const roaster = product.roaster || 'Unknown Roaster';
      if (!groups[roaster]) {
        groups[roaster] = [];
      }
      groups[roaster].push(product);
    });
    return groups;
  }, [products]);

  if (loading) return <p className="loading-message">Loading products...</p>;
  if (error) return <p className="error-message">{error}</p>;

  return (
    <div>
      <div style={{ marginBottom: '15px', display: 'flex', alignItems: 'center', gap: '10px' }}>
        <h2 style={{ margin: 0, marginRight: 'auto' }}>Products</h2>
        <Link 
          to="/products/new" 
          style={{ 
            padding: '6px 8px', 
            border: 'none', 
            background: 'none', 
            cursor: 'pointer', 
            fontSize: '16px',
            textDecoration: 'none'
          }}
          title="New Product"
        >
          ➕
        </Link>
      </div>

      {products.length === 0 ? (
        <p>No coffee products registered yet.</p>
      ) : (
        Object.entries(groupedProducts).map(([roaster, roasterProducts]) => (
          <div key={roaster} style={{ marginBottom: '25px' }}>
            <h3 style={{ 
              margin: '0 0 10px 0', 
              color: '#6d4c41', 
              borderBottom: '2px solid #6d4c41', 
              paddingBottom: '5px',
              fontSize: '1.2rem'
            }}>
              {roaster} ({roasterProducts.length})
            </h3>
            <div className="list-container">
              {roasterProducts.map(product => (
                <div key={product.id} className="product-card">
                  {product.image_url && (
                    <img 
                      src={product.image_url} 
                      alt={product.bean_type} 
                      className="product-image"
                    />
                  )}
                  <div className="product-content">
                    <h4 style={{ margin: '0 0 8px 0', color: '#333' }}>{product.bean_type}</h4>
                    <p style={{ margin: '0 0 6px 0', fontSize: '14px', color: '#666' }}>
                      <strong>Origin:</strong> {product.country}{product.region ? ` (${product.region})` : ''}
                    </p>
                    {product.description && (
                      <p style={{ margin: '0 0 8px 0', fontSize: '13px', lineHeight: '1.3' }}>
                        {product.description}
                      </p>
                    )}
                    {product.url && (
                      <p style={{ margin: '0 0 8px 0' }}>
                        <a href={product.url} target="_blank" rel="noopener noreferrer" style={{ fontSize: '13px' }}>
                          Product Page
                        </a>
                      </p>
                    )}
                    <div className="actions" style={{ marginTop: '8px' }}>
                      <Link 
                        to={`/products/${product.id}`} 
                        style={{ 
                          padding: '4px 6px', 
                          border: 'none', 
                          background: 'none', 
                          cursor: 'pointer', 
                          fontSize: '14px',
                          textDecoration: 'none',
                          marginRight: '5px'
                        }}
                        title="View Details"
                      >
                        👁️
                      </Link>
                      <Link 
                        to={`/products/edit/${product.id}`} 
                        style={{ 
                          padding: '4px 6px', 
                          border: 'none', 
                          background: 'none', 
                          cursor: 'pointer', 
                          fontSize: '14px',
                          textDecoration: 'none',
                          marginRight: '5px'
                        }}
                        title="Edit"
                      >
                        ✏️
                      </Link>
                      <button 
                        onClick={() => handleDelete(product.id)}
                        style={{ 
                          padding: '4px 6px', 
                          border: 'none', 
                          background: 'none', 
                          cursor: 'pointer', 
                          fontSize: '14px'
                        }}
                        title="Delete"
                      >
                        🗑️
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))
      )}
    </div>
  );
}

export default ProductList;
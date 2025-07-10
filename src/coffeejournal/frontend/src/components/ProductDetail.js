import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import BatchForm from './BatchForm';
import { useToast } from './Toast';
import { API_BASE_URL } from '../config';
import StarRating from './StarRating';

function ProductDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToast } = useToast();
  const [product, setProduct] = useState(null);
  const [batches, setBatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showBatchForm, setShowBatchForm] = useState(false);
  const [editingBatch, setEditingBatch] = useState(null);

  useEffect(() => {
    fetchProductDetails();
    fetchBatches();
  }, [id]);

  const fetchProductDetails = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/products/${id}`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      console.log('Product data received:', data);
      setProduct(data);
    } catch (err) {
      setError("Failed to fetch product details: " + err.message);
      console.error("Error fetching product details:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchBatches = async () => {
    console.log('DEBUG: fetchBatches called');
    try {
      // Add cache-busting timestamp
      const timestamp = new Date().getTime();
      const response = await fetch(`${API_BASE_URL}/products/${id}/batches?t=${timestamp}`, {
        headers: {
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        }
      });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      console.log('DEBUG: fetchBatches received data:', data);
      setBatches(data);
    } catch (err) {
      setError("Failed to fetch batches: " + err.message);
      console.error("Error fetching batches:", err);
    }
  };


  const handleBatchSubmitted = () => {
    console.log('DEBUG: handleBatchSubmitted called');
    setShowBatchForm(false);
    setEditingBatch(null);
    fetchBatches(); // Refresh batches list
  };

  const handleCancelBatchForm = () => {
    setShowBatchForm(false);
    setEditingBatch(null);
  };

  const handleDeleteProduct = async () => {
    if (window.confirm("Are you sure you want to delete this product and all its batches?")) {
      try {
        const response = await fetch(`${API_BASE_URL}/products/${id}`, {
          method: 'DELETE',
        });
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        addToast("Product deleted successfully!", 'success');
        navigate('/products'); // Redirect to products list
      } catch (err) {
        setError("Failed to delete product: " + err.message);
        console.error("Error deleting product:", err);
      }
    }
  };

  const handleDeleteBatch = async (batchId) => {
    if (window.confirm("Are you sure you want to delete this batch?")) {
      try {
        const response = await fetch(`${API_BASE_URL}/batches/${batchId}`, {
          method: 'DELETE',
        });
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        addToast("Batch deleted successfully!", 'success');
        fetchBatches(); // Refresh batches list
      } catch (err) {
        setError("Failed to delete batch: " + err.message);
        console.error("Error deleting batch:", err);
      }
    }
  };

  const handleEditBatch = (batch) => {
    setEditingBatch(batch);
    setShowBatchForm(false); // Close add form if open
  };



  // Norwegian date formatting
  const formatDateNorwegian = (dateString) => {
    const date = new Date(dateString);
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear().toString().slice(-2);
    return `${day}.${month}.${year}`;
  };

  // Roast degree visualization
  const getRoastVisualization = (roastType) => {
    if (!roastType) return '☕☕☕☕☕'; // Default light outline
    
    const normalizedValue = Math.max(1, Math.min(10, roastType)); // Clamp between 1-10
    const filledBeans = Math.ceil(normalizedValue / 2); // Each bean represents 2 levels
    const darkBeans = Math.floor(normalizedValue / 2); // How many should be dark
    
    let visualization = '';
    for (let i = 0; i < 5; i++) {
      if (i < darkBeans) {
        visualization += '🫘'; // Dark roasted bean
      } else if (i < filledBeans) {
        visualization += '🤎'; // Medium/light roasted bean
      } else {
        visualization += '☕'; // Bean outline
      }
    }
    return visualization;
  };

  console.log('Render state:', { loading, error, product });
  
  if (loading) return <p className="loading-message">Loading product details...</p>;
  if (error) return <p className="error-message">{error}</p>;
  if (!product) return <p>Product not found.</p>;

  return (
    <div>
      <div style={{ marginBottom: '15px', display: 'flex', alignItems: 'center', gap: '10px' }}>
        <h2 style={{ margin: 0, marginRight: 'auto' }}>{product.product_name}</h2>
        <Link 
          to={`/products/edit/${product.id}`}
          style={{ 
            padding: '6px 8px', 
            border: 'none', 
            background: 'none', 
            cursor: 'pointer', 
            fontSize: '16px',
            textDecoration: 'none',
            marginRight: '5px'
          }}
          title="Edit Product"
        >
          ✏️
        </Link>
        <button 
          onClick={() => handleDeleteProduct()}
          style={{ 
            padding: '6px 8px', 
            border: 'none', 
            background: 'none', 
            cursor: 'pointer', 
            fontSize: '16px'
          }}
          title="Delete Product"
        >
          🗑️
        </button>
      </div>

      {/* Product Details */}
      <div style={{ marginBottom: '20px', padding: '15px', backgroundColor: '#f8f9fa', borderRadius: '8px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'auto 1fr', gap: '8px 15px', alignItems: 'start' }}>
          <strong>Roaster:</strong>
          <span>{product.roaster || '-'}</span>
          
          <strong>Bean Type:</strong>
          <span>{Array.isArray(product.bean_type) ? product.bean_type.join(', ') : (product.bean_type || '-')}</span>
          
          <strong>Country:</strong>
          <span>{product.country || '-'}</span>
          
          <strong>Region:</strong>
          <span>{Array.isArray(product.region) ? product.region.join(', ') : (product.region || '-')}</span>
          
          <strong>Bean Process:</strong>
          <span>{product.bean_process || '-'}</span>
          
          <strong>Product Name:</strong>
          <span>{product.product_name || '-'}</span>
          
          <strong>Roast Type:</strong>
          <span>{product.roast_type ? `${getRoastVisualization(product.roast_type)} (${product.roast_type})` : '-'}</span>
          
          <strong>Decaffeinated:</strong>
          <span>
            {product.decaf ? (
              <span style={{ color: '#1976d2', fontWeight: 'bold' }}>
                Yes {product.decaf_method && `(${product.decaf_method})`}
              </span>
            ) : 'No'}
          </span>
          
          <strong>Rating:</strong>
          <span>
            {product.rating ? (
              <StarRating rating={product.rating} readOnly={true} maxRating={5} />
            ) : '-'}
          </span>
          
          <strong>Description:</strong>
          <span>{product.description || '-'}</span>
          
          <strong>Notes:</strong>
          <span style={{ whiteSpace: 'pre-wrap' }}>{product.notes || '-'}</span>
          
          <strong>Product URL:</strong>
          <span>
            {product.url ? (
              <a href={product.url} target="_blank" rel="noopener noreferrer">{product.url}</a>
            ) : '-'}
          </span>
          
          <strong>Image:</strong>
          <span>
            {product.image_url ? (
              <img src={product.image_url} alt={Array.isArray(product.bean_type) ? product.bean_type.join(', ') : (product.bean_type || 'Coffee')} style={{ maxWidth: '200px', borderRadius: '8px' }} />
            ) : '-'}
          </span>
        </div>
      </div>

      <div className="detail-section">
        <div style={{ marginBottom: '15px', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <h3 style={{ margin: 0, marginRight: 'auto' }}>Batches for this Product</h3>
          <button 
            onClick={() => setShowBatchForm(!showBatchForm)}
            style={{ 
              padding: '6px 8px', 
              border: 'none', 
              background: 'none', 
              cursor: 'pointer', 
              fontSize: '16px' 
            }}
            title={showBatchForm ? 'Cancel' : 'Add New Batch'}
          >
            {showBatchForm ? '❌' : '➕'}
          </button>
        </div>
        {batches.length === 0 ? (
          <p>No batches registered for this product.</p>
        ) : (
          <div className="batch-list">
            {batches.map(batch => (
              <div key={batch.id} style={{ 
                marginBottom: '20px', 
                padding: '15px', 
                border: '1px solid #ddd', 
                borderRadius: '8px', 
                backgroundColor: '#fafafa' 
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                  <h4 style={{ margin: 0 }}>Batch #{batch.id}</h4>
                  <div>
                    <button 
                      onClick={() => handleEditBatch(batch)}
                      style={{ 
                        padding: '4px 6px', 
                        border: 'none', 
                        background: 'none', 
                        cursor: 'pointer', 
                        fontSize: '14px',
                        marginRight: '5px'
                      }}
                      title="Edit Batch"
                    >
                      ✏️
                    </button>
                    <button 
                      onClick={() => handleDeleteBatch(batch.id)}
                      style={{ 
                        padding: '4px 6px', 
                        border: 'none', 
                        background: 'none', 
                        cursor: 'pointer', 
                        fontSize: '14px'
                      }}
                      title="Delete Batch"
                    >
                      🗑️
                    </button>
                  </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'auto 1fr', gap: '8px 15px', alignItems: 'start' }}>
                  <strong>Roast Date:</strong>
                  <span>{batch.roast_date ? formatDateNorwegian(batch.roast_date) : 'Unknown'}</span>
                  
                  <strong>Purchase Date:</strong>
                  <span>{batch.purchase_date ? formatDateNorwegian(batch.purchase_date) : '-'}</span>
                  
                  <strong>Amount:</strong>
                  <span>{batch.amount_grams ? `${batch.amount_grams}g` : '-'}</span>
                  
                  <strong>Price:</strong>
                  <span>{batch.price != null && !isNaN(batch.price) ? `${Number(batch.price).toFixed(2)} kr` : '-'}</span>
                  
                  <strong>Price per Cup:</strong>
                  <span>{batch.price_per_cup != null && !isNaN(batch.price_per_cup) ? `${Number(batch.price_per_cup).toFixed(2)} kr` : '-'}</span>
                  
                  <strong>Seller:</strong>
                  <span>{batch.seller || '-'}</span>
                  
                  <strong>Rating:</strong>
                  <span>
                    {batch.rating ? (
                      <StarRating rating={batch.rating} readOnly={true} maxRating={5} />
                    ) : '-'}
                  </span>
                  
                  <strong>Notes:</strong>
                  <span>{batch.notes || '-'}</span>
                </div>
              </div>
            ))}
          </div>
        )}
        {showBatchForm && (
          <BatchForm 
            productId={id}
            onBatchSubmitted={handleBatchSubmitted}
            onCancel={handleCancelBatchForm}
          />
        )}
        
        {editingBatch && (
          <BatchForm 
            productId={id}
            initialData={editingBatch}
            onBatchSubmitted={handleBatchSubmitted}
            onCancel={handleCancelBatchForm}
          />
        )}
      </div>


    </div>
  );
}

export default ProductDetail;
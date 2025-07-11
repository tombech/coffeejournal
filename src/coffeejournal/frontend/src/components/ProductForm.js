import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useToast } from './Toast';
import { API_BASE_URL } from '../config';
import StarRating from './StarRating';
import HeadlessAutocomplete from './HeadlessAutocomplete';
import HeadlessMultiAutocomplete from './HeadlessMultiAutocomplete';

function ProductForm() {
  const { id } = useParams(); // Get ID from URL for edit mode
  const navigate = useNavigate();
  const { addToast } = useToast();
  const [formData, setFormData] = useState({
    roaster: { id: null, name: '', isNew: false },
    bean_type: [],
    country: { id: null, name: '', isNew: false },
    region: [],
    product_name: '',
    roast_type: '',
    description: '',
    url: '',
    image_url: '',
    decaf: false,
    decaf_method: { id: null, name: '', isNew: false },
    rating: '',
    bean_process: '',
    notes: ''
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isEditMode, setIsEditMode] = useState(false);

  useEffect(() => {
    // If ID exists, fetch product data for editing
    if (id) {
      setIsEditMode(true);
      fetchProduct();
    } else {
      setLoading(false); // No product to load, so stop loading
    }
  }, [id]);

  const fetchProduct = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/products/${id}`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      // Convert lookup objects to the expected format
      setFormData({
        roaster: data.roaster ? { id: data.roaster.id, name: data.roaster.name, isNew: false } : { id: null, name: '', isNew: false },
        bean_type: data.bean_type?.map(bt => ({ id: bt.id, name: bt.name, isNew: false })) || [],
        country: data.country ? { id: data.country.id, name: data.country.name, isNew: false } : { id: null, name: '', isNew: false },
        region: data.region?.map(r => ({ id: r.id, name: r.name, isNew: false })) || [],
        product_name: data.product_name || '',
        roast_type: data.roast_type || '',
        description: data.description || '',
        url: data.url || '',
        image_url: data.image_url || '',
        decaf: data.decaf || false,
        decaf_method: data.decaf_method ? { id: data.decaf_method.id, name: data.decaf_method.name, isNew: false } : { id: null, name: '', isNew: false },
        rating: data.rating || '',
        bean_process: data.bean_process || '',
        notes: data.notes || ''
      });
    } catch (err) {
      setError("Failed to fetch product for editing: " + err.message);
      console.error("Error fetching product:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({ 
      ...prev, 
      [name]: type === 'checkbox' ? checked : value 
    }));
  };

  const handleRatingChange = (rating) => {
    setFormData((prev) => ({ ...prev, rating: rating }));
  };


  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const method = isEditMode ? 'PUT' : 'POST';
    const url = isEditMode ? `${API_BASE_URL}/products/${id}` : `${API_BASE_URL}/products`;

    // Transform form data for submission
    const submitData = {
      // Handle roaster
      roaster_id: formData.roaster.id,
      roaster_name: formData.roaster.name,
      
      // Handle bean types (multiple)
      bean_type_id: formData.bean_type.map(bt => bt.id).filter(id => id !== null),
      bean_type_name: formData.bean_type.map(bt => bt.name).filter(name => name),
      
      // Handle country
      country_id: formData.country.id,
      country_name: formData.country.name,
      
      // Handle regions (multiple)
      region_id: formData.region.map(r => r.id).filter(id => id !== null),
      region_name: formData.region.map(r => r.name).filter(name => name),
      
      // Handle decaf method
      decaf_method_id: formData.decaf_method.id,
      decaf_method_name: formData.decaf_method.name,
      
      // Include all other fields as-is
      product_name: formData.product_name,
      roast_type: formData.roast_type,
      description: formData.description,
      url: formData.url,
      image_url: formData.image_url,
      decaf: formData.decaf,
      rating: formData.rating,
      bean_process: formData.bean_process,
      notes: formData.notes
    };

    try {
      const response = await fetch(url, {
        method: method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(submitData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`HTTP error! status: ${response.status} - ${errorData.message || 'Unknown error'}`);
      }

      const result = await response.json();
      addToast(`Product ${isEditMode ? 'updated' : 'created'} successfully!`, 'success');
      
      // Redirect to product detail page for new products, or back to list for edits
      if (!isEditMode && result.id) {
        navigate(`/products/${result.id}`);
      } else {
        navigate('/products');
      }
    } catch (err) {
      setError(`Failed to ${isEditMode ? 'update' : 'create'} product: ` + err.message);
      console.error("Error submitting product:", err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <p className="loading-message">Loading form...</p>;
  if (error) return <p className="error-message">{error}</p>;

  return (
    <div>
      <h2>{isEditMode ? 'Edit Coffee Product' : 'Add New Coffee Product'}</h2>
      <form onSubmit={handleSubmit}>
        <label>
          Roaster *:
          <HeadlessAutocomplete
            lookupType="roasters"
            value={formData.roaster}
            onChange={(value) => setFormData(prev => ({ ...prev, roaster: value }))}
            placeholder="Start typing to search roasters..."
            required
          />
        </label>
        <label>
          Bean Type:
          <HeadlessMultiAutocomplete
            lookupType="bean_types"
            value={formData.bean_type}
            onChange={(value) => setFormData(prev => ({ ...prev, bean_type: value }))}
            placeholder="Start typing to search bean types..."
          />
        </label>
        <label>
          Country:
          <HeadlessAutocomplete
            lookupType="countries"
            value={formData.country}
            onChange={(value) => setFormData(prev => ({ ...prev, country: value }))}
            placeholder="Start typing to search countries..."
          />
        </label>
        <label>
          Region:
          <HeadlessMultiAutocomplete
            lookupType="countries"
            value={formData.region}
            onChange={(value) => setFormData(prev => ({ ...prev, region: value }))}
            placeholder="Start typing to search regions..."
          />
        </label>
        <label>
          Bean Process:
          <input
            type="text"
            name="bean_process"
            value={formData.bean_process}
            onChange={handleChange}
            placeholder="e.g., Washed, Natural, Honey"
          />
        </label>
        <label>
          Product Name: (optional custom name)
          <input
            type="text"
            name="product_name"
            value={formData.product_name}
            onChange={handleChange}
            placeholder="e.g., My favorite morning blend"
          />
        </label>
        <label>
          Roast Type: (1-10 scale, 1=light, 10=dark)
          <input
            type="number"
            name="roast_type"
            value={formData.roast_type}
            onChange={handleChange}
            min="1"
            max="10"
            placeholder="1-10"
          />
        </label>
        <label>
          Description:
          <textarea name="description" value={formData.description} onChange={handleChange} rows="4"></textarea>
        </label>
        <label>
          Product URL:
          <input type="url" name="url" value={formData.url} onChange={handleChange} />
        </label>
        <label>
          Image URL:
          <input type="url" name="image_url" value={formData.image_url} onChange={handleChange} />
        </label>
        
        <label>
          <input
            type="checkbox"
            name="decaf"
            checked={formData.decaf}
            onChange={handleChange}
          />
          Decaffeinated
        </label>
        
        {formData.decaf && (
          <label>
            Decaf Method:
            <HeadlessAutocomplete
              lookupType="decaf_methods"
              value={formData.decaf_method}
              onChange={(value) => setFormData(prev => ({ ...prev, decaf_method: value }))}
              placeholder="Start typing to search decaf methods..."
            />
          </label>
        )}
        
        <label>
          Rating:
          <div style={{ marginTop: '8px' }}>
            <StarRating
              rating={formData.rating}
              onRatingChange={handleRatingChange}
              maxRating={5}
              size="xlarge"
            />
          </div>
        </label>
        <label>
          Notes:
          <textarea
            name="notes"
            value={formData.notes}
            onChange={handleChange}
            rows="3"
            placeholder="Any additional notes about this product..."
          />
        </label>
        <button 
          type="submit" 
          disabled={loading}
          style={{ 
            padding: '10px 15px', 
            border: 'none', 
            background: 'none', 
            cursor: loading ? 'default' : 'pointer', 
            fontSize: '20px',
            opacity: loading ? 0.5 : 1
          }}
          title={loading ? 'Saving...' : (isEditMode ? 'Update Product' : 'Add Product')}
        >
          {loading ? '⏳' : (isEditMode ? '💾' : '➕')}
        </button>
      </form>
    </div>
  );
}

export default ProductForm;
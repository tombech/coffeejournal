import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useToast } from './Toast';
import { API_BASE_URL } from '../config';
import StarRating from './StarRating';
import MultiSelect from './MultiSelect';

function ProductForm() {
  const { id } = useParams(); // Get ID from URL for edit mode
  const navigate = useNavigate();
  const { addToast } = useToast();
  const [formData, setFormData] = useState({
    roaster: '',
    bean_type: [],
    country: '',
    region: [],
    product_name: '',
    roast_type: '',
    description: '',
    url: '',
    image_url: '',
    decaf: false,
    decaf_method: '',
    rating: '',
    bean_process: '',
    notes: ''
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isEditMode, setIsEditMode] = useState(false);

  // State for dynamic dropdown options
  const [roasters, setRoasters] = useState([]);
  const [beanTypes, setBeanTypes] = useState([]);
  const [countries, setCountries] = useState([]);
  const [decafMethods, setDecafMethods] = useState([]);

  useEffect(() => {
    // Fetch all lookup data when component mounts
    const fetchLookupData = async () => {
      try {
        const [roastersRes, beanTypesRes, countriesRes, decafMethodsRes] = await Promise.all([
          fetch(`${API_BASE_URL}/roasters`),
          fetch(`${API_BASE_URL}/bean_types`),
          fetch(`${API_BASE_URL}/countries`),
          fetch(`${API_BASE_URL}/decaf_methods`),
        ]);

        setRoasters(await roastersRes.json());
        setBeanTypes(await beanTypesRes.json());
        setCountries(await countriesRes.json());
        setDecafMethods(await decafMethodsRes.json());
      } catch (err) {
        console.error("Error fetching lookup data:", err);
        setError("Failed to load lookup data.");
      }
    };

    fetchLookupData();

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
      // Convert single values to arrays for multi-select fields and ensure all fields have values
      setFormData({
        roaster: data.roaster || '',
        bean_type: Array.isArray(data.bean_type) ? data.bean_type : (data.bean_type ? [data.bean_type] : []),
        country: data.country || '',
        region: Array.isArray(data.region) ? data.region : (data.region ? [data.region] : []),
        product_name: data.product_name || '',
        roast_type: data.roast_type || '',
        description: data.description || '',
        url: data.url || '',
        image_url: data.image_url || '',
        decaf: data.decaf || false,
        decaf_method: data.decaf_method || '',
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

  const handleMultiSelectChange = (name, values) => {
    setFormData((prev) => ({ ...prev, [name]: values }));
  };

  // Handle mobile datalist issues
  const handleMobileDatalistFocus = (e) => {
    // On mobile, temporarily remove the list attribute to prevent sticky dropdown
    if (/Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)) {
      e.target.removeAttribute('list');
    }
  };

  const handleMobileDatalistBlur = (e) => {
    // Restore the list attribute after blur
    if (/Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)) {
      const listId = e.target.getAttribute('data-list');
      if (listId) {
        e.target.setAttribute('list', listId);
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const method = isEditMode ? 'PUT' : 'POST';
    const url = isEditMode ? `${API_BASE_URL}/products/${id}` : `${API_BASE_URL}/products`;

    try {
      const response = await fetch(url, {
        method: method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
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
          Roaster:
          <input
            type="text"
            name="roaster"
            value={formData.roaster}
            onChange={handleChange}
            list="roastersOptions"
            data-list="roastersOptions"
            onFocus={handleMobileDatalistFocus}
            onBlur={handleMobileDatalistBlur}
            required
          />
          <datalist id="roastersOptions">
            {roasters.map((r) => (
              <option key={r.id} value={r.name} />
            ))}
          </datalist>
        </label>
        <label>
          Bean Type:
          <MultiSelect
            name="bean_type"
            values={formData.bean_type}
            onChange={handleMultiSelectChange}
            options={beanTypes}
            placeholder="Add bean types..."
          />
        </label>
        <label>
          Country:
          <input
            type="text"
            name="country"
            value={formData.country}
            onChange={handleChange}
            list="countriesOptions"
            data-list="countriesOptions"
            onFocus={handleMobileDatalistFocus}
            onBlur={handleMobileDatalistBlur}
          />
          <datalist id="countriesOptions">
            {countries.map((c) => (
              <option key={c.id} value={c.name} />
            ))}
          </datalist>
        </label>
        <label>
          Region: (if different from country or more specific)
          <MultiSelect
            name="region"
            values={formData.region}
            onChange={handleMultiSelectChange}
            options={countries}
            placeholder="Add regions..."
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
            <input
              type="text"
              name="decaf_method"
              value={formData.decaf_method}
              onChange={handleChange}
              list="decafMethodsOptions"
              data-list="decafMethodsOptions"
              onFocus={handleMobileDatalistFocus}
              onBlur={handleMobileDatalistBlur}
            />
            <datalist id="decafMethodsOptions">
              {decafMethods.map((dm) => (
                <option key={dm.id} value={dm.name} />
              ))}
            </datalist>
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
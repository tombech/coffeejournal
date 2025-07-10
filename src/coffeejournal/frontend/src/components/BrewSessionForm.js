import React, { useState, useEffect } from 'react';
import { useToast } from './Toast';
import { API_BASE_URL } from '../config';
import DateTimeInput from './DateTimeInput';
import TimeInput from './TimeInput';

function BrewSessionForm({ product_batch_id = null, onSessionSubmitted, initialData = null }) {
  const { addToast } = useToast();
  const [formData, setFormData] = useState({
    product_batch_id: product_batch_id,
    product_id: '',
    brew_method: '',
    recipe: '',
    grinder: '',
    grinder_setting: '',
    filter: '',
    kettle: '',
    scale: '',
    amount_coffee_grams: '',
    amount_water_grams: '',
    brew_temperature_c: '',
    // brew_ratio: '', // <-- REMOVED
    bloom_time_seconds: '',
    brew_time_seconds: '',
    sweetness: '',
    acidity: '',
    bitterness: '',
    body: '',
    aroma: '',
    flavor_profile_match: '',
    score: '',
    notes: '',
    timestamp: new Date().toISOString(), // Default to now
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isEditMode, setIsEditMode] = useState(false);

  // State for dynamic dropdown options
  const [brewMethods, setBrewMethods] = useState([]);
  const [recipes, setRecipes] = useState([]);
  const [grinders, setGrinders] = useState([]);
  const [filters, setFilters] = useState([]);
  const [kettles, setKettles] = useState([]);
  const [scales, setScales] = useState([]);
  const [products, setProducts] = useState([]);
  const [batches, setBatches] = useState([]);

  useEffect(() => {
    const fetchLookupData = async () => {
      try {
        const [brewMethodsRes, recipesRes, grindersRes, filtersRes, kettlesRes, scalesRes, productsRes] = await Promise.all([
          fetch(`${API_BASE_URL}/brew_methods`),
          fetch(`${API_BASE_URL}/recipes`),
          fetch(`${API_BASE_URL}/grinders`),
          fetch(`${API_BASE_URL}/filters`),
          fetch(`${API_BASE_URL}/kettles`),
          fetch(`${API_BASE_URL}/scales`),
          fetch(`${API_BASE_URL}/products`),
        ]);
        setBrewMethods(await brewMethodsRes.json());
        setRecipes(await recipesRes.json());
        setGrinders(await grindersRes.json());
        setFilters(await filtersRes.json());
        setKettles(await kettlesRes.json());
        setScales(await scalesRes.json());
        setProducts(await productsRes.json());
      } catch (err) {
        console.error("Error fetching lookup data:", err);
        setError("Failed to load lookup data.");
      }
    };

    fetchLookupData();

    if (initialData) {
      setIsEditMode(true);
      setFormData({
        ...initialData,
        brew_method: initialData.brew_method || '',
        recipe: initialData.recipe || '',
        filter: initialData.filter || '',
        kettle: initialData.kettle || '',
        scale: initialData.scale || '',
        timestamp: initialData.timestamp || new Date().toISOString(),
      });
      // If editing, fetch batches for the selected product
      if (initialData.product_id) {
        fetchBatchesForProduct(initialData.product_id);
      }
    } else {
      setIsEditMode(false);
      setFormData(prev => ({
        ...prev,
        product_batch_id: product_batch_id,
        timestamp: new Date().toISOString(), // Set to now for new entries
      }));
    }
  }, [product_batch_id, initialData]);

  // Fetch batches when product is selected
  const fetchBatchesForProduct = async (productId) => {
    try {
      const response = await fetch(`${API_BASE_URL}/products/${productId}/batches`);
      if (response.ok) {
        const batchData = await response.json();
        setBatches(batchData);
      }
    } catch (err) {
      console.error("Error fetching batches:", err);
    }
  };

  // Norwegian date formatting
  const formatDateNorwegian = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear().toString().slice(-2);
    return `${day}.${month}.${year}`;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    
    // If product is selected, fetch its batches
    if (name === 'product_id' && value) {
      fetchBatchesForProduct(value);
      setFormData((prev) => ({ ...prev, product_batch_id: '' })); // Reset batch selection
    }
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

    // Validate that batch is selected
    if (!formData.product_batch_id && !isEditMode) {
      setError('Please select a batch');
      setLoading(false);
      return;
    }

    const method = isEditMode ? 'PUT' : 'POST';
    const url = isEditMode 
      ? `${API_BASE_URL}/brew_sessions/${initialData.id}` 
      : `${API_BASE_URL}/batches/${formData.product_batch_id}/brew_sessions`;

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

      addToast(`Brew session ${isEditMode ? 'updated' : 'created'} successfully!`, 'success');
      if (onSessionSubmitted) {
        onSessionSubmitted();
      }
    } catch (err) {
      setError(`Failed to ${isEditMode ? 'update' : 'create'} brew session: ` + err.message);
      console.error("Error submitting brew session:", err);
    } finally {
      setLoading(false);
    }
  };

  if (error) return <p className="error-message">{error}</p>;

  return (
    <form onSubmit={handleSubmit}>
      <h4>{isEditMode ? 'Edit Brew Session' : 'Add New Brew Session'}</h4>
      <label>
        Timestamp:
        <DateTimeInput
          name="timestamp"
          value={formData.timestamp}
          onChange={handleChange}
          required
        />
      </label>
      
      {/* Product and Batch selection - show if not tied to a specific batch OR if editing */}
      {(!product_batch_id || isEditMode) && (
        <>
          <label>
            Product:
            <select
              name="product_id"
              value={formData.product_id}
              onChange={handleChange}
              required
            >
              <option value="">Select a product</option>
              {products.map((product) => (
                <option key={product.id} value={product.id}>
                  {product.roaster} - {product.product_name}
                </option>
              ))}
            </select>
          </label>
          
          <label>
            Batch:
            <select
              name="product_batch_id"
              value={formData.product_batch_id}
              onChange={handleChange}
              required
              disabled={!formData.product_id}
            >
              <option value="">Select a batch</option>
              {batches.map((batch) => (
                <option key={batch.id} value={batch.id}>
                  Roast Date: {formatDateNorwegian(batch.roast_date)} ({batch.amount_grams}g)
                </option>
              ))}
            </select>
          </label>
        </>
      )}
      
      <label>
        Brew Method:
        <input
          type="text"
          name="brew_method"
          value={formData.brew_method}
          onChange={handleChange}
          list="brewMethodsOptions"
          data-list="brewMethodsOptions"
          onFocus={handleMobileDatalistFocus}
          onBlur={handleMobileDatalistBlur}
          required
        />
        <datalist id="brewMethodsOptions">
          {brewMethods.map((bm) => (
            <option key={bm.id} value={bm.name} />
          ))}
        </datalist>
      </label>
      <label>
        Recipe:
        <input
          type="text"
          name="recipe"
          value={formData.recipe}
          onChange={handleChange}
          list="recipesOptions"
          data-list="recipesOptions"
          onFocus={handleMobileDatalistFocus}
          onBlur={handleMobileDatalistBlur}
        />
        <datalist id="recipesOptions">
          {recipes.map((r) => (
            <option key={r.id} value={r.name} />
          ))}
        </datalist>
      </label>
      <label>
        Grinder:
        <input
          type="text"
          name="grinder"
          value={formData.grinder}
          onChange={handleChange}
          list="grindersOptions"
          data-list="grindersOptions"
          onFocus={handleMobileDatalistFocus}
          onBlur={handleMobileDatalistBlur}
        />
        <datalist id="grindersOptions">
          {grinders.map((g) => (
            <option key={g.id} value={g.name} />
          ))}
        </datalist>
      </label>
      <label>
        Grinder Setting:
        <input type="text" name="grinder_setting" value={formData.grinder_setting} onChange={handleChange} />
      </label>
      <label>
        Filter:
        <input
          type="text"
          name="filter"
          value={formData.filter}
          onChange={handleChange}
          list="filtersOptions"
          data-list="filtersOptions"
          onFocus={handleMobileDatalistFocus}
          onBlur={handleMobileDatalistBlur}
        />
        <datalist id="filtersOptions">
          {filters.map((f) => (
            <option key={f.id} value={f.name} />
          ))}
        </datalist>
      </label>
      <label>
        Kettle:
        <input
          type="text"
          name="kettle"
          value={formData.kettle}
          onChange={handleChange}
          list="kettlesOptions"
          data-list="kettlesOptions"
          onFocus={handleMobileDatalistFocus}
          onBlur={handleMobileDatalistBlur}
        />
        <datalist id="kettlesOptions">
          {kettles.map((k) => (
            <option key={k.id} value={k.name} />
          ))}
        </datalist>
      </label>
      <label>
        Scale:
        <input
          type="text"
          name="scale"
          value={formData.scale}
          onChange={handleChange}
          list="scalesOptions"
          data-list="scalesOptions"
          onFocus={handleMobileDatalistFocus}
          onBlur={handleMobileDatalistBlur}
        />
        <datalist id="scalesOptions">
          {scales.map((s) => (
            <option key={s.id} value={s.name} />
          ))}
        </datalist>
      </label>
      <label>
        Coffee Amount (grams):
        <input type="number" name="amount_coffee_grams" value={formData.amount_coffee_grams} onChange={handleChange} step="0.1" required />
      </label>
      <label>
        Water Amount (grams):
        <input type="number" name="amount_water_grams" value={formData.amount_water_grams} onChange={handleChange} step="0.1" required />
      </label>
      <label>
        Brew Temperature (C):
        <input type="number" name="brew_temperature_c" value={formData.brew_temperature_c} onChange={handleChange} step="0.1" />
      </label>
      {/* --- REMOVED brew_ratio input --- */}
      <label>
        Bloom Time:
        <TimeInput 
          name="bloom_time_seconds" 
          value={formData.bloom_time_seconds} 
          onChange={handleChange} 
          placeholder="e.g., 30 or 0:30"
        />
      </label>
      <label>
        Brew Time:
        <TimeInput 
          name="brew_time_seconds" 
          value={formData.brew_time_seconds} 
          onChange={handleChange} 
          placeholder="e.g., 150 or 2:30"
        />
      </label>

      {/* Flavor Scores */}
      <h4>Flavor Scores (1-10)</h4>
      <label>Sweetness: <input type="number" name="sweetness" value={formData.sweetness} onChange={handleChange} min="1" max="10" /></label>
      <label>Acidity: <input type="number" name="acidity" value={formData.acidity} onChange={handleChange} min="1" max="10" /></label>
      <label>Bitterness: <input type="number" name="bitterness" value={formData.bitterness} onChange={handleChange} min="1" max="10" /></label>
      <label>Body: <input type="number" name="body" value={formData.body} onChange={handleChange} min="1" max="10" /></label>
      <label>Aroma: <input type="number" name="aroma" value={formData.aroma} onChange={handleChange} min="1" max="10" /></label>
      <label>Flavor Profile Match: <input type="number" name="flavor_profile_match" value={formData.flavor_profile_match} onChange={handleChange} min="1" max="10" /></label>

      <h4>Overall Score (1-10)</h4>
      <label>Score: <input type="number" name="score" value={formData.score} onChange={handleChange} min="1" max="10" /></label>

      <label>
        Notes:
        <textarea name="notes" value={formData.notes} onChange={handleChange} rows="4"></textarea>
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
        title={loading ? 'Saving...' : (isEditMode ? 'Update Session' : 'Log Session')}
      >
        {loading ? '⏳' : (isEditMode ? '💾' : '📝')}
      </button>
    </form>
  );
}

export default BrewSessionForm;
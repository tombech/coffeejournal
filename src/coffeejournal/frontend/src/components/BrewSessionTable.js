import React, { useState, useMemo } from 'react';
import { API_BASE_URL } from '../config';

function BrewSessionTable({ sessions, onDelete, onDuplicate, onEdit, onRefresh, showNewForm, setShowNewForm, setEditingSession }) {
  
  // Function to get short name for lookup items
  const getShortName = (fullName) => {
    if (!fullName) return '';
    
    // Predefined short names for common items
    const shortNameMap = {
      'V60': 'V60',
      'Chemex': 'Cmx',
      'French Press': 'FP',
      'AeroPress': 'AP',
      'Espresso': 'Esp',
      'Pour Over': 'PO',
      'Cold Brew': 'CB',
      'Moka Pot': 'MP',
      'Paper Filter': 'Paper',
      'Metal Filter': 'Metal',
      'Hario V60 Paper Filter': 'V60P',
      'Cafec T90': 'T90',
      'Swiss water method': 'Swiss',
      'Wilfa Uniform Evo': 'Wilfa',
      'Digital Scale': 'Dig',
      'Acaia Pearl': 'Pearl',
      'Hario V60 Scale': 'V60S'
    };
    
    // Return predefined short name if exists
    if (shortNameMap[fullName]) {
      return shortNameMap[fullName];
    }
    
    // Generate short name from full name
    const words = fullName.split(' ');
    if (words.length === 1) {
      return words[0].length > 6 ? words[0].substring(0, 6) : words[0];
    } else if (words.length === 2) {
      return words.map(w => w.charAt(0)).join('') + words[1].substring(1, 3);
    } else {
      return words.map(w => w.charAt(0)).join('').substring(0, 4);
    }
  };
  const [sortColumn, setSortColumn] = useState('timestamp');
  const [sortDirection, setSortDirection] = useState('desc'); // newest first by default
  const [filters, setFilters] = useState({
    roaster: '',
    bean_type: '',
    brew_method: '',
    recipe: '',
    filter: '',
    sweetness: '',
    acidity: '',
    bitterness: '',
    body: '',
    aroma: ''
  });
  
  // Function to check if a product is decaf
  const isDecafProduct = (session) => {
    return session.product_details?.decaf === true;
  };
  
  // Function to create header with icon and hover text
  const createIconHeader = (icon, title, column, onClick) => (
    <span 
      style={{ cursor: 'pointer', userSelect: 'none', display: 'flex', alignItems: 'center', gap: '2px' }}
      title={title}
      onClick={onClick}
    >
      {icon}{getSortIcon(column)}
    </span>
  );

  // Get unique values for filter dropdowns
  const uniqueValues = useMemo(() => {
    const values = {
      roasters: [...new Set(sessions.map(s => s.product_details?.roaster).filter(Boolean))],
      bean_types: [...new Set(sessions.map(s => {
        const beanType = s.product_details?.bean_type;
        return Array.isArray(beanType) ? beanType : (beanType ? [beanType] : []);
      }).flat().filter(Boolean))],
      brew_methods: [...new Set(sessions.map(s => s.brew_method).filter(Boolean))],
      recipes: [...new Set(sessions.map(s => s.recipe).filter(Boolean))],
      filters: [...new Set(sessions.map(s => s.filter).filter(Boolean))]
    };
    return values;
  }, [sessions]);

  // Filter and sort sessions
  const filteredAndSortedSessions = useMemo(() => {
    let filtered = sessions.filter(session => {
      return (
        (!filters.roaster || session.product_details?.roaster?.toLowerCase().includes(filters.roaster.toLowerCase())) &&
        (!filters.bean_type || (
          Array.isArray(session.product_details?.bean_type) 
            ? session.product_details.bean_type.some(bt => bt.toLowerCase().includes(filters.bean_type.toLowerCase()))
            : session.product_details?.bean_type?.toLowerCase().includes(filters.bean_type.toLowerCase())
        )) &&
        (!filters.brew_method || session.brew_method?.toLowerCase().includes(filters.brew_method.toLowerCase())) &&
        (!filters.recipe || session.recipe?.toLowerCase().includes(filters.recipe.toLowerCase())) &&
        (!filters.filter || session.filter?.toLowerCase().includes(filters.filter.toLowerCase())) &&
        (!filters.sweetness || (session.sweetness && session.sweetness.toString() === filters.sweetness)) &&
        (!filters.acidity || (session.acidity && session.acidity.toString() === filters.acidity)) &&
        (!filters.bitterness || (session.bitterness && session.bitterness.toString() === filters.bitterness)) &&
        (!filters.body || (session.body && session.body.toString() === filters.body)) &&
        (!filters.aroma || (session.aroma && session.aroma.toString() === filters.aroma))
      );
    });

    // Sort the filtered results
    return filtered.sort((a, b) => {
      let aVal = a[sortColumn];
      let bVal = b[sortColumn];

      // Handle special cases
      if (sortColumn === 'bean_type') {
        aVal = Array.isArray(a.product_details?.bean_type) 
          ? a.product_details.bean_type.join(', ') 
          : (a.product_details?.bean_type || '');
        bVal = Array.isArray(b.product_details?.bean_type) 
          ? b.product_details.bean_type.join(', ') 
          : (b.product_details?.bean_type || '');
      } else if (sortColumn === 'product_name') {
        aVal = a.product_details?.product_name || '';
        bVal = b.product_details?.product_name || '';
      } else if (sortColumn === 'timestamp') {
        aVal = new Date(a.timestamp);
        bVal = new Date(b.timestamp);
      }

      // Handle null/undefined values
      if (aVal == null && bVal == null) return 0;
      if (aVal == null) return sortDirection === 'asc' ? -1 : 1;
      if (bVal == null) return sortDirection === 'asc' ? 1 : -1;

      // Compare values
      if (aVal < bVal) return sortDirection === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });
  }, [sessions, filters, sortColumn, sortDirection]);

  const handleSort = (column) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(column);
      setSortDirection('asc');
    }
  };

  const handleFilterChange = (column, value) => {
    setFilters(prev => ({ ...prev, [column]: value }));
  };

  const clearFilters = () => {
    setFilters({
      roaster: '',
      bean_type: '',
      brew_method: '',
      recipe: '',
      sweetness: '',
      acidity: '',
      bitterness: '',
      body: '',
      aroma: ''
    });
  };

  const getSortIcon = (column) => {
    if (sortColumn !== column) return ' ↕️';
    return sortDirection === 'asc' ? ' ↑' : ' ↓';
  };

  const formatDateNorwegian = (dateString) => {
    const date = new Date(dateString);
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear().toString().slice(-2);
    return `${day}.${month}.${year}`;
  };

  const formatTimeOnly = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('nb-NO', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const formatDateTime = (dateString) => {
    return new Date(dateString).toLocaleString('nb-NO');
  };

  const formatSecondsToMinSec = (seconds) => {
    if (!seconds) return '-';
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    if (minutes > 0) {
      return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
    }
    return `${seconds}s`;
  };

  return (
    <div className="brew-session-table-container">
      {/* Filter Controls */}
      <div className="filter-controls" style={{ marginBottom: '15px', padding: '8px', backgroundColor: '#f5f5f5', borderRadius: '5px' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', alignItems: 'center' }}>
          <select value={filters.roaster} onChange={(e) => handleFilterChange('roaster', e.target.value)}>
            <option value="">All Roasters</option>
            {uniqueValues.roasters.map(roaster => (
              <option key={roaster} value={roaster}>{roaster}</option>
            ))}
          </select>
          
          <select value={filters.bean_type} onChange={(e) => handleFilterChange('bean_type', e.target.value)}>
            <option value="">All Bean Types</option>
            {uniqueValues.bean_types.map(type => (
              <option key={type} value={type}>{type}</option>
            ))}
          </select>
          
          <select value={filters.brew_method} onChange={(e) => handleFilterChange('brew_method', e.target.value)}>
            <option value="">All Brew Methods</option>
            {uniqueValues.brew_methods.map(method => (
              <option key={method} value={method}>{method}</option>
            ))}
          </select>
          
          <select value={filters.recipe} onChange={(e) => handleFilterChange('recipe', e.target.value)}>
            <option value="">All Recipes</option>
            {uniqueValues.recipes.map(recipe => (
              <option key={recipe} value={recipe}>{recipe}</option>
            ))}
          </select>
          
          <select value={filters.filter} onChange={(e) => handleFilterChange('filter', e.target.value)}>
            <option value="">All Filters</option>
            {uniqueValues.filters.map(filter => (
              <option key={filter} value={filter}>{filter}</option>
            ))}
          </select>
          
          <button 
            onClick={clearFilters} 
            style={{ padding: '6px 8px', border: 'none', background: 'none', cursor: 'pointer', fontSize: '14px' }}
            title="Clear Filters"
          >
            🗑️
          </button>
          
          <button 
            onClick={() => {
              setShowNewForm(!showNewForm);
              setEditingSession(null);
            }}
            style={{ padding: '6px 8px', border: 'none', background: 'none', cursor: 'pointer', fontSize: '14px' }}
            title={showNewForm ? 'Cancel' : 'New Brew Session'}
          >
            {showNewForm ? '❌' : '➕'}
          </button>
        </div>
      </div>

      {/* Table */}
      <div>
        <table style={{ borderCollapse: 'collapse', fontSize: '12px', whiteSpace: 'nowrap' }}>
          <thead>
            <tr style={{ backgroundColor: '#e9ecef' }}>
              <th style={{ padding: '4px', border: '1px solid #ddd', width: '110px', fontSize: '12px', textAlign: 'left' }}>Actions</th>
              <th style={{ padding: '4px', border: '1px solid #ddd', fontSize: '12px', whiteSpace: 'nowrap', textAlign: 'left' }}>
                {createIconHeader('🫘', 'Product', 'product_name', () => handleSort('product_name'))}
              </th>
              <th style={{ padding: '4px', border: '1px solid #ddd', fontSize: '12px', whiteSpace: 'nowrap', textAlign: 'left' }}>
                {createIconHeader('📅', 'Date', 'timestamp', () => handleSort('timestamp'))}
              </th>
              <th style={{ padding: '4px', border: '1px solid #ddd', fontSize: '12px', whiteSpace: 'nowrap', textAlign: 'left' }}>
                {createIconHeader('☕', 'Method', 'brew_method', () => handleSort('brew_method'))}
              </th>
              <th style={{ padding: '4px', border: '1px solid #ddd', fontSize: '12px', whiteSpace: 'nowrap', textAlign: 'left' }}>
                {createIconHeader('📋', 'Recipe', 'recipe', () => handleSort('recipe'))}
              </th>
              <th style={{ padding: '4px', border: '1px solid #ddd', fontSize: '12px', whiteSpace: 'nowrap', textAlign: 'left' }}>
                {createIconHeader('📄', 'Filter', 'filter', () => handleSort('filter'))}
              </th>
              <th style={{ padding: '4px', border: '1px solid #ddd', fontSize: '12px', whiteSpace: 'nowrap', textAlign: 'left' }}>
                {createIconHeader('🫘', 'Coffee (g)', 'amount_coffee_grams', () => handleSort('amount_coffee_grams'))}
              </th>
              <th style={{ padding: '4px', border: '1px solid #ddd', fontSize: '12px', whiteSpace: 'nowrap', textAlign: 'left' }}>
                {createIconHeader('💧', 'Water (g)', 'amount_water_grams', () => handleSort('amount_water_grams'))}
              </th>
              <th style={{ padding: '4px', border: '1px solid #ddd', fontSize: '12px', whiteSpace: 'nowrap', textAlign: 'left' }}>
                {createIconHeader('⚖️', 'Ratio', 'brew_ratio', () => handleSort('brew_ratio'))}
              </th>
              <th style={{ padding: '4px', border: '1px solid #ddd', fontSize: '12px', whiteSpace: 'nowrap', textAlign: 'left' }}>
                {createIconHeader('🌡️', 'Temperature (°C)', 'brew_temperature_c', () => handleSort('brew_temperature_c'))}
              </th>
              <th style={{ padding: '4px', border: '1px solid #ddd', fontSize: '12px', whiteSpace: 'nowrap', textAlign: 'left' }}>
                {createIconHeader('🌸', 'Bloom Time', 'bloom_time_seconds', () => handleSort('bloom_time_seconds'))}
              </th>
              <th style={{ padding: '4px', border: '1px solid #ddd', fontSize: '12px', whiteSpace: 'nowrap', textAlign: 'left' }}>
                {createIconHeader('⏱️', 'Brew Time', 'brew_time_seconds', () => handleSort('brew_time_seconds'))}
              </th>
              <th style={{ padding: '4px', border: '1px solid #ddd', fontSize: '12px', whiteSpace: 'nowrap', textAlign: 'left' }}>
                {createIconHeader('🍯', 'Sweetness', 'sweetness', () => handleSort('sweetness'))}
              </th>
              <th style={{ padding: '4px', border: '1px solid #ddd', fontSize: '12px', whiteSpace: 'nowrap', textAlign: 'left' }}>
                {createIconHeader('🍋', 'Acidity', 'acidity', () => handleSort('acidity'))}
              </th>
              <th style={{ padding: '4px', border: '1px solid #ddd', fontSize: '12px', whiteSpace: 'nowrap', textAlign: 'left' }}>
                {createIconHeader('☕', 'Bitterness', 'bitterness', () => handleSort('bitterness'))}
              </th>
              <th style={{ padding: '4px', border: '1px solid #ddd', fontSize: '12px', whiteSpace: 'nowrap', textAlign: 'left' }}>
                {createIconHeader('💪', 'Body', 'body', () => handleSort('body'))}
              </th>
              <th style={{ padding: '4px', border: '1px solid #ddd', fontSize: '12px', whiteSpace: 'nowrap', textAlign: 'left' }}>
                {createIconHeader('👃', 'Aroma', 'aroma', () => handleSort('aroma'))}
              </th>
              <th style={{ padding: '4px', border: '1px solid #ddd', fontSize: '12px', whiteSpace: 'nowrap', textAlign: 'left' }}>
                {createIconHeader('⚙️', 'Grinder', 'grinder', () => handleSort('grinder'))}
              </th>
              <th style={{ padding: '4px', border: '1px solid #ddd', fontSize: '12px', whiteSpace: 'nowrap', textAlign: 'left' }} title="Grinder Setting">
                🔧
              </th>
              <th style={{ padding: '4px', border: '1px solid #ddd', fontSize: '12px', whiteSpace: 'nowrap', textAlign: 'left' }}>
                {createIconHeader('⭐', 'Score', 'score', () => handleSort('score'))}
              </th>
              <th style={{ padding: '4px', border: '1px solid #ddd', fontSize: '12px', whiteSpace: 'nowrap', textAlign: 'left' }} title="Notes">
                📝
              </th>
            </tr>
          </thead>
          <tbody>
            {filteredAndSortedSessions.map(session => (
              <tr key={session.id} style={{ '&:hover': { backgroundColor: '#f8f9fa' } }}>
                <td style={{ padding: '2px', border: '1px solid #ddd', textAlign: 'center', fontSize: '11px', width: '110px', whiteSpace: 'nowrap' }}>
                  <button 
                    onClick={() => onEdit(session)}
                    title="Edit"
                    style={{ padding: '2px 4px', margin: '0 1px', border: 'none', background: 'none', cursor: 'pointer', fontSize: '12px' }}
                  >
                    ✏️
                  </button>
                  <button 
                    onClick={() => onDuplicate(session.id)}
                    title="Duplicate"
                    style={{ padding: '2px 4px', margin: '0 1px', border: 'none', background: 'none', cursor: 'pointer', fontSize: '12px' }}
                  >
                    📋
                  </button>
                  <button 
                    onClick={() => onDelete(session.id)}
                    title="Delete"
                    style={{ padding: '2px 4px', margin: '0 1px', border: 'none', background: 'none', cursor: 'pointer', fontSize: '12px' }}
                  >
                    🗑️
                  </button>
                </td>
                <td 
                  style={{ 
                    padding: '4px', 
                    border: '1px solid #ddd', 
                    fontSize: '12px', 
                    cursor: 'help',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    maxWidth: '200px',
                    verticalAlign: 'top'
                  }}
                  title={`${session.product_details?.product_name || 'Unknown'}\n\nBean Type: ${Array.isArray(session.product_details?.bean_type) ? session.product_details.bean_type.join(', ') : (session.product_details?.bean_type || 'Unknown')}\nRoaster: ${session.product_details?.roaster || 'Unknown'}\nRoast Date: ${session.product_details?.roast_date ? formatDateNorwegian(session.product_details.roast_date) : 'Unknown'}${isDecafProduct(session) ? '\n\n⚠️ DECAF PRODUCT' : ''}`}
                >
                  {session.product_details?.product_name || '-'}
                  {isDecafProduct(session) && <span style={{ marginLeft: '4px', color: '#ff6b35' }} title="Decaf Product">D</span>}
                </td>
                <td 
                  style={{ padding: '4px', border: '1px solid #ddd', fontSize: '12px', cursor: 'help', verticalAlign: 'top' }}
                  title={`Full date/time: ${formatDateTime(session.timestamp)}`}
                >
                  {formatDateNorwegian(session.timestamp)}
                </td>
                <td style={{ padding: '4px', border: '1px solid #ddd', fontSize: '12px', verticalAlign: 'top', whiteSpace: 'nowrap' }} title={session.brew_method}>
                  {session.brew_method ? getShortName(session.brew_method) : '-'}
                </td>
                <td style={{ padding: '4px', border: '1px solid #ddd', fontSize: '12px', verticalAlign: 'top', whiteSpace: 'nowrap' }} title={session.recipe}>
                  {session.recipe ? getShortName(session.recipe) : '-'}
                </td>
                <td style={{ padding: '4px', border: '1px solid #ddd', fontSize: '12px', verticalAlign: 'top', whiteSpace: 'nowrap' }} title={session.filter}>
                  {session.filter ? getShortName(session.filter) : '-'}
                </td>
                <td style={{ padding: '4px', border: '1px solid #ddd', fontSize: '12px', textAlign: 'center', verticalAlign: 'top', whiteSpace: 'nowrap' }}>
                  {session.amount_coffee_grams ? `${session.amount_coffee_grams}g` : '-'}
                </td>
                <td style={{ padding: '4px', border: '1px solid #ddd', fontSize: '12px', textAlign: 'center', verticalAlign: 'top', whiteSpace: 'nowrap' }}>
                  {session.amount_water_grams ? `${session.amount_water_grams}g` : '-'}
                </td>
                <td style={{ padding: '4px', border: '1px solid #ddd', fontSize: '12px', textAlign: 'center', verticalAlign: 'top', whiteSpace: 'nowrap' }}>{session.brew_ratio || '-'}</td>
                <td style={{ padding: '4px', border: '1px solid #ddd', fontSize: '12px', textAlign: 'center', verticalAlign: 'top', whiteSpace: 'nowrap' }}>
                  {session.brew_temperature_c ? `${session.brew_temperature_c}°C` : '-'}
                </td>
                <td style={{ padding: '4px', border: '1px solid #ddd', fontSize: '12px', textAlign: 'center', verticalAlign: 'top', whiteSpace: 'nowrap' }}>
                  {formatSecondsToMinSec(session.bloom_time_seconds)}
                </td>
                <td style={{ padding: '4px', border: '1px solid #ddd', fontSize: '12px', textAlign: 'center', verticalAlign: 'top', whiteSpace: 'nowrap' }}>
                  {formatSecondsToMinSec(session.brew_time_seconds)}
                </td>
                <td style={{ padding: '4px', border: '1px solid #ddd', fontSize: '12px', textAlign: 'center', verticalAlign: 'top', whiteSpace: 'nowrap' }}>{session.sweetness || '-'}</td>
                <td style={{ padding: '4px', border: '1px solid #ddd', fontSize: '12px', textAlign: 'center', verticalAlign: 'top', whiteSpace: 'nowrap' }}>{session.acidity || '-'}</td>
                <td style={{ padding: '4px', border: '1px solid #ddd', fontSize: '12px', textAlign: 'center', verticalAlign: 'top', whiteSpace: 'nowrap' }}>{session.bitterness || '-'}</td>
                <td style={{ padding: '4px', border: '1px solid #ddd', fontSize: '12px', textAlign: 'center', verticalAlign: 'top', whiteSpace: 'nowrap' }}>{session.body || '-'}</td>
                <td style={{ padding: '4px', border: '1px solid #ddd', fontSize: '12px', textAlign: 'center', verticalAlign: 'top', whiteSpace: 'nowrap' }}>{session.aroma || '-'}</td>
                <td style={{ padding: '4px', border: '1px solid #ddd', fontSize: '12px', verticalAlign: 'top', whiteSpace: 'nowrap' }} title={session.grinder}>
                  {session.grinder ? getShortName(session.grinder) : '-'}
                </td>
                <td style={{ padding: '4px', border: '1px solid #ddd', fontSize: '12px', verticalAlign: 'top', whiteSpace: 'nowrap' }}>{session.grinder_setting || '-'}</td>
                <td style={{ padding: '4px', border: '1px solid #ddd', fontSize: '12px', textAlign: 'center', verticalAlign: 'top', whiteSpace: 'nowrap' }}>{session.score || '-'}</td>
                <td 
                  style={{ 
                    padding: '4px', 
                    border: '1px solid #ddd', 
                    fontSize: '12px', 
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    maxWidth: '600px',
                    verticalAlign: 'top'
                  }} 
                  title={session.notes}
                >
                  {session.notes || '-'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      {filteredAndSortedSessions.length === 0 && (
        <p style={{ textAlign: 'center', marginTop: '20px', color: '#666' }}>
          No brew sessions match your current filters.
        </p>
      )}
      
      <p style={{ marginTop: '10px', color: '#666', fontSize: '12px' }}>
        Showing {filteredAndSortedSessions.length} of {sessions.length} sessions
      </p>
    </div>
  );
}

export default BrewSessionTable;
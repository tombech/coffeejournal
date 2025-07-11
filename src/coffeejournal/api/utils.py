"""
Shared utilities for the Coffee Journal API.

This module contains common functions used across multiple API endpoints,
including validation, data enrichment, and calculation utilities.
"""

from datetime import datetime
from ..repositories.factory import get_repository_factory


def validate_lookup_data(data, item_type="item"):
    """Validate lookup item data."""
    if not data:
        return f"No data provided", 400
    if 'name' not in data:
        return f"Name is required", 400
    if not data['name'] or not data['name'].strip():
        return f"Name cannot be empty", 400
    
    # Validate optional URL fields
    url_fields = ['url', 'image_url']
    for field in url_fields:
        if field in data and data[field]:
            url = data[field].strip()
            if url and not (url.startswith('http://') or url.startswith('https://')):
                return f"{field} must be a valid HTTP or HTTPS URL", 400
    
    # Validate short_form if provided
    if 'short_form' in data and data['short_form']:
        short_form = data['short_form'].strip()
        if len(short_form) > 20:  # Reasonable limit for short form
            return "short_form must be 20 characters or less", 400
    
    return None, None


def calculate_brew_ratio(coffee_grams, water_grams):
    """Calculate brew ratio."""
    if coffee_grams and water_grams:
        try:
            coffee_float = float(coffee_grams)
            water_float = float(water_grams)
            if coffee_float > 0:
                ratio = water_float / coffee_float
                return f"1:{ratio:.1f}"
        except (ValueError, TypeError, ZeroDivisionError):
            return None
    return None


def calculate_price_per_cup(price, amount_grams):
    """Calculate price per cup based on batch price and amount."""
    if price and amount_grams:
        try:
            price_float = float(price)
            amount_float = float(amount_grams)
            if amount_float > 0:
                cups_per_batch = amount_float / 18.0  # 18g per cup
                if cups_per_batch > 0:
                    return round(price_float / cups_per_batch, 2)
        except (ValueError, TypeError, ZeroDivisionError):
            pass
    return None


def safe_int(value, default=None):
    """Safely convert value to int."""
    if value is None or value == '':
        return default
    try:
        return int(value)
    except (ValueError, TypeError):
        return default


def safe_float(value, default=None):
    """Safely convert value to float."""
    if value is None or value == '':
        return default
    try:
        return float(value)
    except (ValueError, TypeError):
        return default


def validate_tasting_score(score, field_name):
    """Validate that a tasting score is within the 1-10 range."""
    if score is None:
        return None, None
    
    if not isinstance(score, int) or score < 1 or score > 10:
        return None, f"{field_name} must be an integer between 1 and 10"
    
    return score, None


def enrich_product_with_lookups(product, factory):
    """Enrich product with lookup objects instead of just names."""
    if not product:
        return product
    
    # Get repositories
    roaster_repo = factory.get_roaster_repository()
    bean_type_repo = factory.get_bean_type_repository()
    country_repo = factory.get_country_repository()
    decaf_method_repo = factory.get_decaf_method_repository()
    
    # Enrich roaster
    if product.get('roaster_id'):
        roaster = roaster_repo.find_by_id(product['roaster_id'])
        product['roaster'] = roaster if roaster else None
    else:
        product['roaster'] = None
    
    # Enrich bean types (multiple)
    if product.get('bean_type_id'):
        bean_type_ids = product['bean_type_id'] if isinstance(product['bean_type_id'], list) else [product['bean_type_id']]
        bean_types = []
        for bt_id in bean_type_ids:
            bt = bean_type_repo.find_by_id(bt_id)
            if bt:
                bean_types.append(bt)
        product['bean_type'] = bean_types if bean_types else None
    else:
        product['bean_type'] = None
    
    # Enrich country
    if product.get('country_id'):
        country = country_repo.find_by_id(product['country_id'])
        product['country'] = country if country else None
    else:
        product['country'] = None
    
    # Enrich regions (multiple)
    if product.get('region_id'):
        region_ids = product['region_id'] if isinstance(product['region_id'], list) else [product['region_id']]
        regions = []
        for r_id in region_ids:
            # Regions are stored in the countries table
            region = country_repo.find_by_id(r_id)
            if region:
                regions.append(region)
        product['region'] = regions if regions else None
    else:
        product['region'] = None
    
    # Enrich decaf method
    if product.get('decaf_method_id'):
        decaf_method = decaf_method_repo.find_by_id(product['decaf_method_id'])
        product['decaf_method'] = decaf_method if decaf_method else None
    else:
        product['decaf_method'] = None
    
    return product


def resolve_lookup_field(data, field_name, repository, allow_multiple=False):
    """
    Resolve lookup field from either ID or name submission.
    
    Args:
        data: Request data containing lookup info
        field_name: Base field name (e.g., 'roaster', 'bean_type')
        repository: Repository to use for lookup operations
        allow_multiple: If True, handle arrays of lookups
    
    Returns:
        dict: Contains resolved 'name', 'id', and optionally 'names'/'ids' for multiple
    """
    id_field = f"{field_name}_id"
    name_field = f"{field_name}_name" if f"{field_name}_name" in data else field_name
    
    if allow_multiple:
        # Handle multiple values (like bean_type)
        ids = data.get(id_field, [])
        names = data.get(name_field, [])
        
        resolved_items = []
        resolved_ids = []
        resolved_names = []
        
        # Process IDs first
        if ids:
            for lookup_id in ids:
                if lookup_id:  # Skip null/empty IDs
                    item = repository.find_by_id(lookup_id)
                    if item:
                        resolved_items.append(item)
                        resolved_ids.append(item['id'])
                        resolved_names.append(item['name'])
        
        # Process names (for new items or when ID is null)
        if names:
            for name in names:
                if name and not any(item['name'] == name for item in resolved_items):
                    item = repository.get_or_create(name)
                    resolved_items.append(item)
                    resolved_ids.append(item['id'])
                    resolved_names.append(item['name'])
        
        return {
            'items': resolved_items,
            'ids': resolved_ids,
            'names': resolved_names
        }
    else:
        # Handle single value
        lookup_id = data.get(id_field)
        lookup_name = data.get(name_field)
        
        if lookup_id:
            # Use existing item by ID
            item = repository.find_by_id(lookup_id)
            if item:
                return {
                    'item': item,
                    'id': item['id'],
                    'name': item['name']
                }
        
        if lookup_name:
            # Create or get item by name
            item = repository.get_or_create(lookup_name)
            return {
                'item': item,
                'id': item['id'],
                'name': item['name']
            }
        
        return {
            'item': None,
            'id': None,
            'name': None
        }


def enrich_brew_session_with_lookups(session, factory):
    """Enrich brew session with lookup objects."""
    if not session:
        return session
    
    # Get repositories
    brew_method_repo = factory.get_brew_method_repository()
    recipe_repo = factory.get_recipe_repository()
    grinder_repo = factory.get_grinder_repository()
    filter_repo = factory.get_filter_repository()
    kettle_repo = factory.get_kettle_repository()
    scale_repo = factory.get_scale_repository()
    
    # Enrich equipment lookups
    if session.get('brew_method_id'):
        brew_method = brew_method_repo.find_by_id(session['brew_method_id'])
        session['brew_method'] = brew_method if brew_method else None
    else:
        session['brew_method'] = None
        
    if session.get('recipe_id'):
        recipe = recipe_repo.find_by_id(session['recipe_id'])
        session['recipe'] = recipe if recipe else None
    else:
        session['recipe'] = None
        
    if session.get('grinder_id'):
        grinder = grinder_repo.find_by_id(session['grinder_id'])
        session['grinder'] = grinder if grinder else None
    else:
        session['grinder'] = None
        
    if session.get('filter_id'):
        filter_item = filter_repo.find_by_id(session['filter_id'])
        session['filter'] = filter_item if filter_item else None
    else:
        session['filter'] = None
        
    if session.get('kettle_id'):
        kettle = kettle_repo.find_by_id(session['kettle_id'])
        session['kettle'] = kettle if kettle else None
    else:
        session['kettle'] = None
        
    if session.get('scale_id'):
        scale = scale_repo.find_by_id(session['scale_id'])
        session['scale'] = scale if scale else None
    else:
        session['scale'] = None
    
    return session
from flask import Blueprint, jsonify, request
from datetime import datetime
from .repositories.factory import get_repository_factory


api = Blueprint('api', __name__, url_prefix='/api')


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
    """Calculate price per cup based on 18g coffee per cup."""
    if price is not None and amount_grams is not None:
        try:
            price_float = float(price)
            amount_float = float(amount_grams)
            if amount_float > 0:
                cups_per_batch = amount_float / 18.0
                return round(price_float / cups_per_batch, 2)
        except (ValueError, TypeError, ZeroDivisionError):
            return None
    return None


# --- Lookup Endpoints ---
@api.route('/roasters', methods=['GET'])
def get_roasters():
    """Get all roasters."""
    factory = get_repository_factory()
    roasters = factory.get_roaster_repository().find_all()
    return jsonify(roasters)


@api.route('/bean_types', methods=['GET'])
def get_bean_types():
    """Get all bean types."""
    factory = get_repository_factory()
    bean_types = factory.get_bean_type_repository().find_all()
    return jsonify(bean_types)


@api.route('/countries', methods=['GET'])
def get_countries():
    """Get all countries."""
    factory = get_repository_factory()
    countries = factory.get_country_repository().find_all()
    return jsonify(countries)


@api.route('/brew_methods', methods=['GET'])
def get_brew_methods():
    """Get all brew methods."""
    factory = get_repository_factory()
    brew_methods = factory.get_brew_method_repository().find_all()
    return jsonify(brew_methods)


@api.route('/recipes', methods=['GET'])
def get_recipes():
    """Get all recipes."""
    factory = get_repository_factory()
    recipes = factory.get_recipe_repository().find_all()
    return jsonify(recipes)

@api.route('/grinders', methods=['GET'])
def get_grinders():
    """Get all grinders."""
    factory = get_repository_factory()
    grinders = factory.get_grinder_repository().find_all()
    return jsonify(grinders)

@api.route('/decaf_methods', methods=['GET'])
def get_decaf_methods():
    """Get all decaffeination methods."""
    factory = get_repository_factory()
    decaf_methods = factory.get_decaf_method_repository().find_all()
    return jsonify(decaf_methods)


# --- Product Endpoints ---
@api.route('/products', methods=['GET'])
def get_products():
    """Get all products with optional filtering."""
    factory = get_repository_factory()
    product_repo = factory.get_product_repository()
    
    # Get filter parameters
    filters = {}
    if request.args.get('roaster'):
        filters['roaster'] = request.args.get('roaster')
    if request.args.get('bean_type'):
        filters['bean_type'] = request.args.get('bean_type')
    if request.args.get('country'):
        filters['country'] = request.args.get('country')
    
    if filters:
        products = product_repo.find_by_filters(filters)
    else:
        products = product_repo.find_all()
    
    return jsonify(products)


@api.route('/products/<int:product_id>', methods=['GET'])
def get_product(product_id):
    """Get a specific product."""
    factory = get_repository_factory()
    product = factory.get_product_repository().find_by_id(product_id)
    
    if not product:
        return jsonify({'error': 'Product not found'}), 404
    
    return jsonify(product)


@api.route('/products', methods=['POST'])
def create_product():
    """Create a new product."""
    factory = get_repository_factory()
    data = request.json
    
    # Get or create related entities
    roaster_repo = factory.get_roaster_repository()
    bean_type_repo = factory.get_bean_type_repository()
    country_repo = factory.get_country_repository()
    
    # Handle roaster (required)
    if not data.get('roaster'):
        return jsonify({'error': 'Roaster is required'}), 400
    
    roaster = roaster_repo.get_or_create(data['roaster'])
    
    # Handle optional fields
    bean_type = None
    if data.get('bean_type'):
        bean_type = bean_type_repo.get_or_create(data['bean_type'])
    
    country = None
    if data.get('country'):
        country = country_repo.get_or_create(data['country'])
    
    region = None
    if data.get('region'):
        region = country_repo.get_or_create(data['region'])
    
    # Handle decaf method if product is decaf
    decaf_method = None
    if data.get('decaf') and data.get('decaf_method'):
        decaf_method_repo = factory.get_decaf_method_repository()
        decaf_method = decaf_method_repo.get_or_create(data['decaf_method'])
    
    # Create product
    product_data = {
        'roaster': roaster['name'],
        'roaster_id': roaster['id'],
        'bean_type': bean_type['name'] if bean_type else None,
        'bean_type_id': bean_type['id'] if bean_type else None,
        'country': country['name'] if country else None,
        'country_id': country['id'] if country else None,
        'region': region['name'] if region else None,
        'region_id': region['id'] if region else None,
        'product_name': data.get('product_name'),
        'roast_type': data.get('roast_type'),
        'description': data.get('description'),
        'url': data.get('url'),
        'image_url': data.get('image_url'),
        'decaf': data.get('decaf', False),
        'decaf_method': decaf_method['name'] if decaf_method else None,
        'decaf_method_id': decaf_method['id'] if decaf_method else None,
        'rating': data.get('rating')
    }
    
    product = factory.get_product_repository().create(product_data)
    return jsonify(product), 201


@api.route('/products/<int:product_id>', methods=['PUT'])
def update_product(product_id):
    """Update a product."""
    factory = get_repository_factory()
    data = request.json
    
    # Check if product exists
    product_repo = factory.get_product_repository()
    existing_product = product_repo.find_by_id(product_id)
    if not existing_product:
        return jsonify({'error': 'Product not found'}), 404
    
    # Get or create related entities
    roaster_repo = factory.get_roaster_repository()
    bean_type_repo = factory.get_bean_type_repository()
    country_repo = factory.get_country_repository()
    
    # Handle roaster (required)
    if not data.get('roaster'):
        return jsonify({'error': 'Roaster is required'}), 400
    
    roaster = roaster_repo.get_or_create(data['roaster'])
    
    # Handle optional fields
    bean_type = None
    if data.get('bean_type'):
        bean_type = bean_type_repo.get_or_create(data['bean_type'])
    
    country = None
    if data.get('country'):
        country = country_repo.get_or_create(data['country'])
    
    region = None
    if data.get('region'):
        region = country_repo.get_or_create(data['region'])
    
    # Handle decaf method if product is decaf
    decaf_method = None
    if data.get('decaf') and data.get('decaf_method'):
        decaf_method_repo = factory.get_decaf_method_repository()
        decaf_method = decaf_method_repo.get_or_create(data['decaf_method'])
    
    # Update product
    product_data = {
        'roaster': roaster['name'],
        'roaster_id': roaster['id'],
        'bean_type': bean_type['name'] if bean_type else None,
        'bean_type_id': bean_type['id'] if bean_type else None,
        'country': country['name'] if country else None,
        'country_id': country['id'] if country else None,
        'region': region['name'] if region else None,
        'region_id': region['id'] if region else None,
        'product_name': data.get('product_name'),
        'roast_type': data.get('roast_type'),
        'description': data.get('description'),
        'url': data.get('url'),
        'image_url': data.get('image_url'),
        'decaf': data.get('decaf', False),
        'decaf_method': decaf_method['name'] if decaf_method else None,
        'decaf_method_id': decaf_method['id'] if decaf_method else None,
        'rating': data.get('rating')
    }
    
    product = product_repo.update(product_id, product_data)
    return jsonify(product)


@api.route('/products/<int:product_id>', methods=['DELETE'])
def delete_product(product_id):
    """Delete a product and all related batches and brew sessions."""
    factory = get_repository_factory()
    
    # Check if product exists
    product_repo = factory.get_product_repository()
    product = product_repo.find_by_id(product_id)
    if not product:
        return jsonify({'error': 'Product not found'}), 404
    
    # Delete related brew sessions and batches
    batch_repo = factory.get_batch_repository()
    brew_session_repo = factory.get_brew_session_repository()
    
    brew_session_repo.delete_by_product(product_id)
    batch_repo.delete_by_product(product_id)
    
    # Delete product
    product_repo.delete(product_id)
    
    return '', 204


# --- Batch Endpoints ---
@api.route('/products/<int:product_id>/batches', methods=['GET', 'POST'])
def handle_product_batches(product_id):
    """Get all batches for a specific product or create a new batch."""
    factory = get_repository_factory()
    
    # Check if product exists
    product_repo = factory.get_product_repository()
    product = product_repo.find_by_id(product_id)
    if not product:
        return jsonify({'error': 'Product not found'}), 404
    
    if request.method == 'GET':
        batches = factory.get_batch_repository().find_by_product(product_id)
        
        # Enrich with product information and calculate price per cup
        for batch in batches:
            batch['product_name'] = f"{product.get('roaster', 'N/A')} - {product.get('bean_type', 'N/A')}"
            batch['price_per_cup'] = calculate_price_per_cup(batch.get('price'), batch.get('amount_grams'))
        
        return jsonify(batches)
    
    elif request.method == 'POST':
        """Create a new batch for the specified product."""
        data = request.get_json()
        if not data:
            return jsonify({'error': 'No data provided'}), 400
        
        # Extract fields from request
        batch_data = {
            'product_id': product_id,  # Use product_id from URL
            'roast_date': data.get('roast_date'),
            'purchase_date': data.get('purchase_date'),
            'amount_grams': data.get('amount_grams'),
            'price': data.get('price'),
            'seller': data.get('seller'),
            'notes': data.get('notes'),
            'rating': data.get('rating')
        }
        
        batch_repo = factory.get_batch_repository()
        batch = batch_repo.create(batch_data)
        
        # Enrich with product information and calculate price per cup
        batch['product_name'] = f"{product.get('roaster', 'N/A')} - {product.get('bean_type', 'N/A')}"
        batch['price_per_cup'] = calculate_price_per_cup(batch.get('price'), batch.get('amount_grams'))
        
        return jsonify(batch), 201


@api.route('/batches/<int:batch_id>', methods=['GET'])
def get_batch(batch_id):
    """Get a specific batch."""
    factory = get_repository_factory()
    batch = factory.get_batch_repository().find_by_id(batch_id)
    
    if not batch:
        return jsonify({'error': 'Batch not found'}), 404
    
    # Enrich with product information
    product = factory.get_product_repository().find_by_id(batch['product_id'])
    if product:
        batch['product_name'] = f"{product.get('roaster', 'N/A')} - {product.get('bean_type', 'N/A')}"
    else:
        batch['product_name'] = "N/A Product"
    
    batch['price_per_cup'] = calculate_price_per_cup(batch.get('price'), batch.get('amount_grams'))
    
    return jsonify(batch)



@api.route('/batches/<int:batch_id>', methods=['PUT'])
def update_batch(batch_id):
    """Update a batch."""
    factory = get_repository_factory()
    data = request.json
    
    # Check if batch exists
    batch_repo = factory.get_batch_repository()
    existing_batch = batch_repo.find_by_id(batch_id)
    if not existing_batch:
        return jsonify({'error': 'Batch not found'}), 404
    
    # Validate product exists if changing it
    product_id = data.get('product_id', existing_batch['product_id'])
    product = factory.get_product_repository().find_by_id(product_id)
    if not product:
        return jsonify({'error': 'Product not found'}), 404
    
    # Update batch
    batch_data = {
        'product_id': product_id,
        'roast_date': data.get('roast_date'),
        'purchase_date': data.get('purchase_date'),
        'amount_grams': data.get('amount_grams'),
        'price': data.get('price'),
        'seller': data.get('seller'),
        'notes': data.get('notes'),
        'rating': data.get('rating')
    }
    
    batch = batch_repo.update(batch_id, batch_data)
    
    # Add enriched data
    batch['product_name'] = f"{product.get('roaster', 'N/A')} - {product.get('bean_type', 'N/A')}"
    batch['price_per_cup'] = calculate_price_per_cup(batch.get('price'), batch.get('amount_grams'))
    
    return jsonify(batch)


@api.route('/batches/<int:batch_id>', methods=['DELETE'])
def delete_batch(batch_id):
    """Delete a batch and all related brew sessions."""
    factory = get_repository_factory()
    
    # Check if batch exists
    batch_repo = factory.get_batch_repository()
    batch = batch_repo.find_by_id(batch_id)
    if not batch:
        return jsonify({'error': 'Batch not found'}), 404
    
    # Delete related brew sessions
    factory.get_brew_session_repository().delete_by_batch(batch_id)
    
    # Delete batch
    batch_repo.delete(batch_id)
    
    return '', 204


# --- Nested Brew Session Endpoints ---
@api.route('/batches/<int:batch_id>/brew_sessions', methods=['GET', 'POST'])
def handle_batch_brew_sessions(batch_id):
    """Get all brew sessions for a batch or create a new brew session."""
    factory = get_repository_factory()
    
    # Check if batch exists
    batch_repo = factory.get_batch_repository()
    batch = batch_repo.find_by_id(batch_id)
    if not batch:
        return jsonify({'error': 'Batch not found'}), 404
    
    if request.method == 'GET':
        sessions = factory.get_brew_session_repository().find_by_batch(batch_id)
        
        # Get repositories for enrichment
        product_repo = factory.get_product_repository()
        brew_method_repo = factory.get_brew_method_repository()
        recipe_repo = factory.get_recipe_repository()
        
        # Enrich with product and batch information
        for session in sessions:
            # Get product info for enrichment
            product = product_repo.find_by_id(batch.get('product_id'))
            if product:
                session['product_name'] = f"{product.get('roaster', 'N/A')} - {product.get('bean_type', 'N/A')}"
            
            # Add brew method and recipe names
            if session.get('brew_method_id'):
                method = brew_method_repo.find_by_id(session['brew_method_id'])
                session['brew_method'] = method['name'] if method else None
            
            if session.get('recipe_id'):
                recipe = recipe_repo.find_by_id(session['recipe_id'])
                session['recipe'] = recipe['name'] if recipe else None
            
            if session.get('grinder_id'):
                grinder = grinder_repo.find_by_id(session['grinder_id'])
                session['grinder'] = grinder['name'] if grinder else None
            
            # Calculate brew ratio
            session['brew_ratio'] = calculate_brew_ratio(session.get('amount_coffee_grams'), session.get('amount_water_grams'))
        
        return jsonify(sessions)
    
    elif request.method == 'POST':
        """Create a new brew session for the specified batch."""
        data = request.get_json()
        if not data:
            return jsonify({'error': 'No data provided'}), 400
        
        # Get or create brew method, recipe, and grinder
        brew_method_repo = factory.get_brew_method_repository()
        recipe_repo = factory.get_recipe_repository()
        grinder_repo = factory.get_grinder_repository()
        
        brew_method = None
        if data.get('brew_method'):
            brew_method = brew_method_repo.get_or_create(data['brew_method'])
        
        recipe = None
        if data.get('recipe'):
            recipe = recipe_repo.get_or_create(data['recipe'])
        
        grinder = None
        if data.get('grinder'):
            grinder = grinder_repo.get_or_create(data['grinder'])
        
        # Extract fields from request
        session_data = {
            'timestamp': data.get('timestamp', datetime.utcnow().isoformat()),
            'product_batch_id': batch_id,  # Use batch_id from URL
            'product_id': batch.get('product_id'),  # Get product_id from batch
            'recipe_id': recipe['id'] if recipe else data.get('recipe_id'),
            'brew_method_id': brew_method['id'] if brew_method else data.get('brew_method_id'),
            'grinder_id': grinder['id'] if grinder else data.get('grinder_id'),
            'grinder_setting': data.get('grinder_setting'),
            'amount_coffee_grams': data.get('amount_coffee_grams'),
            'amount_water_grams': data.get('amount_water_grams'),
            'brew_temperature_c': data.get('brew_temperature_c'),
            'bloom_time_seconds': data.get('bloom_time_seconds'),
            'brew_time_seconds': data.get('brew_time_seconds'),
            'sweetness': data.get('sweetness'),
            'acidity': data.get('acidity'),
            'bitterness': data.get('bitterness'),
            'body': data.get('body'),
            'aroma': data.get('aroma'),
            'flavor_profile_match': data.get('flavor_profile_match'),
            'score': data.get('score'),
            'notes': data.get('notes')
        }
        
        session_repo = factory.get_brew_session_repository()
        session = session_repo.create(session_data)
        
        # Enrich with product information
        product_repo = factory.get_product_repository()
        product = product_repo.find_by_id(batch.get('product_id'))
        if product:
            session['product_name'] = f"{product.get('roaster', 'N/A')} - {product.get('bean_type', 'N/A')}"
        
        # Add brew method, recipe, and grinder names
        if brew_method:
            session['brew_method'] = brew_method['name']
        elif session.get('brew_method_id'):
            method = brew_method_repo.find_by_id(session['brew_method_id'])
            session['brew_method'] = method['name'] if method else None
        
        if recipe:
            session['recipe'] = recipe['name']
        elif session.get('recipe_id'):
            rec = recipe_repo.find_by_id(session['recipe_id'])
            session['recipe'] = rec['name'] if rec else None
        
        if grinder:
            session['grinder'] = grinder['name']
        elif session.get('grinder_id'):
            grind = grinder_repo.find_by_id(session['grinder_id'])
            session['grinder'] = grind['name'] if grind else None
        
        # Calculate brew ratio
        session['brew_ratio'] = calculate_brew_ratio(session.get('amount_coffee_grams'), session.get('amount_water_grams'))
        
        return jsonify(session), 201


# --- Brew Session Endpoints ---

# Convenience endpoint to get all brew sessions (for listing views)
@api.route('/brew_sessions', methods=['GET'])
def get_all_brew_sessions():
    """Get all brew sessions from all batches."""
    factory = get_repository_factory()
    sessions = factory.get_brew_session_repository().find_all()
    
    # Enrich with product information and calculate brew ratio
    product_repo = factory.get_product_repository()
    batch_repo = factory.get_batch_repository()
    brew_method_repo = factory.get_brew_method_repository()
    recipe_repo = factory.get_recipe_repository()
    grinder_repo = factory.get_grinder_repository()
    
    for session in sessions:
        # Get product and batch info for enrichment
        product = product_repo.find_by_id(session.get('product_id'))
        batch = batch_repo.find_by_id(session.get('product_batch_id'))
        
        if product:
            session['product_name'] = f"{product.get('roaster', 'N/A')} - {product.get('bean_type', 'N/A')}"
            session['product_details'] = {
                'roaster': product.get('roaster'),
                'bean_type': product.get('bean_type'),
                'product_name': product.get('product_name'),
                'roast_date': batch.get('roast_date') if batch else None,
                'roast_type': product.get('roast_type')
            }
        else:
            session['product_details'] = {}
        
        # Add brew method and recipe names
        if session.get('brew_method_id'):
            method = brew_method_repo.find_by_id(session['brew_method_id'])
            session['brew_method'] = method['name'] if method else None
        
        if session.get('recipe_id'):
            recipe = recipe_repo.find_by_id(session['recipe_id'])
            session['recipe'] = recipe['name'] if recipe else None
        
        if session.get('grinder_id'):
            grinder = grinder_repo.find_by_id(session['grinder_id'])
            session['grinder'] = grinder['name'] if grinder else None
        
        # Calculate brew ratio using consistent field names
        session['brew_ratio'] = calculate_brew_ratio(session.get('amount_coffee_grams'), session.get('amount_water_grams'))
    
    return jsonify(sessions)


@api.route('/brew_sessions/<int:session_id>', methods=['GET'])
def get_brew_session(session_id):
    """Get a specific brew session."""
    factory = get_repository_factory()
    session = factory.get_brew_session_repository().find_by_id(session_id)
    
    if not session:
        return jsonify({'error': 'Brew session not found'}), 404
    
    # Enrich with product and batch information
    product_repo = factory.get_product_repository()
    batch_repo = factory.get_batch_repository()
    brew_method_repo = factory.get_brew_method_repository()
    recipe_repo = factory.get_recipe_repository()
    
    # Calculate brew ratio
    session['brew_ratio'] = calculate_brew_ratio(
        session.get('amount_coffee_grams'),
        session.get('amount_water_grams')
    )
    
    # Get product details
    product = product_repo.find_by_id(session['product_id'])
    batch = batch_repo.find_by_id(session['product_batch_id'])
    
    if product:
        session['product_details'] = {
            'roaster': product.get('roaster'),
            'bean_type': product.get('bean_type'),
            'roast_date': batch.get('roast_date') if batch else None,
            'roast_type': product.get('roast_type')
        }
    else:
        session['product_details'] = {}
    
    # Add brew method, recipe, and grinder names
    if session.get('brew_method_id'):
        brew_method = brew_method_repo.find_by_id(session['brew_method_id'])
        session['brew_method'] = brew_method['name'] if brew_method else None
    
    if session.get('recipe_id'):
        recipe = recipe_repo.find_by_id(session['recipe_id'])
        session['recipe'] = recipe['name'] if recipe else None
    
    if session.get('grinder_id'):
        grinder_repo = factory.get_grinder_repository()
        grinder = grinder_repo.find_by_id(session['grinder_id'])
        session['grinder'] = grinder['name'] if grinder else None
    
    return jsonify(session)




@api.route('/brew_sessions/<int:session_id>', methods=['PUT'])
def update_brew_session(session_id):
    """Update a brew session."""
    factory = get_repository_factory()
    data = request.json
    
    # Check if session exists
    session_repo = factory.get_brew_session_repository()
    existing_session = session_repo.find_by_id(session_id)
    if not existing_session:
        return jsonify({'error': 'Brew session not found'}), 404
    
    # Validate product and batch if changing them
    product_batch_id = data.get('product_batch_id', existing_session['product_batch_id'])
    product_id = data.get('product_id', existing_session['product_id'])
    
    product = factory.get_product_repository().find_by_id(product_id)
    if not product:
        return jsonify({'error': 'Product not found'}), 404
    
    batch = factory.get_batch_repository().find_by_id(product_batch_id)
    if not batch:
        return jsonify({'error': 'Batch not found'}), 404
    
    # Get or create brew method, recipe, and grinder
    brew_method_repo = factory.get_brew_method_repository()
    recipe_repo = factory.get_recipe_repository()
    grinder_repo = factory.get_grinder_repository()
    
    brew_method = None
    if data.get('brew_method'):
        brew_method = brew_method_repo.get_or_create(data['brew_method'])
    
    recipe = None
    if data.get('recipe'):
        recipe = recipe_repo.get_or_create(data['recipe'])
    
    grinder = None
    if data.get('grinder'):
        grinder = grinder_repo.get_or_create(data['grinder'])
    
    # Update brew session
    session_data = {
        'timestamp': data.get('timestamp', existing_session['timestamp']),
        'product_batch_id': product_batch_id,
        'product_id': product_id,
        'brew_method_id': brew_method['id'] if brew_method else None,
        'recipe_id': recipe['id'] if recipe else None,
        'grinder_id': grinder['id'] if grinder else None,
        'grinder_setting': data.get('grinder_setting'),
        'amount_coffee_grams': data.get('amount_coffee_grams'),
        'amount_water_grams': data.get('amount_water_grams'),
        'brew_temperature_c': data.get('brew_temperature_c'),
        'bloom_time_seconds': data.get('bloom_time_seconds'),
        'brew_time_seconds': data.get('brew_time_seconds'),
        'sweetness': data.get('sweetness'),
        'acidity': data.get('acidity'),
        'bitterness': data.get('bitterness'),
        'body': data.get('body'),
        'aroma': data.get('aroma'),
        'flavor_profile_match': data.get('flavor_profile_match'),
        'score': data.get('score'),
        'notes': data.get('notes')
    }
    
    session = session_repo.update(session_id, session_data)
    
    # Add enriched data
    session['brew_ratio'] = calculate_brew_ratio(
        session.get('amount_coffee_grams'),
        session.get('amount_water_grams')
    )
    session['brew_method'] = brew_method['name'] if brew_method else None
    session['recipe'] = recipe['name'] if recipe else None
    if grinder:
        session['grinder'] = grinder['name']
    elif session.get('grinder_id'):
        grinder_lookup = grinder_repo.find_by_id(session['grinder_id'])
        session['grinder'] = grinder_lookup['name'] if grinder_lookup else None
    session['product_details'] = {
        'roaster': product.get('roaster'),
        'bean_type': product.get('bean_type'),
        'product_name': product.get('product_name'),
        'roast_date': batch.get('roast_date'),
        'roast_type': product.get('roast_type')
    }
    
    return jsonify(session)


@api.route('/brew_sessions/<int:session_id>', methods=['DELETE'])
def delete_brew_session(session_id):
    """Delete a brew session."""
    factory = get_repository_factory()
    
    # Check if session exists
    session_repo = factory.get_brew_session_repository()
    session = session_repo.find_by_id(session_id)
    if not session:
        return jsonify({'error': 'Brew session not found'}), 404
    
    # Delete session
    session_repo.delete(session_id)
    
    return '', 204
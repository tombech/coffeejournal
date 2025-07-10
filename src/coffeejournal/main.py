from flask import Blueprint, jsonify, request
from datetime import datetime
from .repositories.factory import get_repository_factory


def validate_lookup_data(data, item_type="item"):
    """Validate lookup item data."""
    if not data:
        return f"No data provided", 400
    if 'name' not in data:
        return f"Name is required", 400
    if not data['name'] or not data['name'].strip():
        return f"Name cannot be empty", 400
    return None, None


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


def safe_float(value):
    """Safely convert a value to float, returning None if conversion fails."""
    if value is None or value == '':
        return None
    try:
        return float(value)
    except (ValueError, TypeError):
        return None


def safe_int(value):
    """Safely convert a value to int, returning None if conversion fails."""
    if value is None or value == '':
        return None
    try:
        return int(value)
    except (ValueError, TypeError):
        return None


def validate_tasting_score(score, field_name):
    """Validate that a tasting score is within the 1-10 range."""
    if score is None:
        return None, None
    
    if not isinstance(score, int) or score < 1 or score > 10:
        return None, f"{field_name} must be an integer between 1 and 10"
    
    return score, None


# --- Lookup Endpoints ---

# Roasters
@api.route('/roasters', methods=['GET'])
def get_roasters():
    """Get all roasters."""
    factory = get_repository_factory()
    roasters = factory.get_roaster_repository().find_all()
    return jsonify(roasters)

@api.route('/roasters/<int:roaster_id>', methods=['GET'])
def get_roaster(roaster_id):
    """Get a specific roaster."""
    try:
        factory = get_repository_factory()
        roaster = factory.get_roaster_repository().find_by_id(roaster_id)
        if not roaster:
            return jsonify({'error': 'Roaster not found'}), 404
        return jsonify(roaster)
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@api.route('/roasters', methods=['POST'])
def create_roaster():
    """Create a new roaster."""
    try:
        data = request.get_json()
        error_msg, status_code = validate_lookup_data(data, "roaster")
        if error_msg:
            return jsonify({'error': error_msg}), status_code
        
        factory = get_repository_factory()
        roaster = factory.get_roaster_repository().create(data)
        return jsonify(roaster), 201
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@api.route('/roasters/<int:roaster_id>', methods=['PUT'])
def update_roaster(roaster_id):
    """Update an existing roaster."""
    try:
        data = request.get_json()
        if not data:
            return jsonify({'error': 'No data provided'}), 400
        
        factory = get_repository_factory()
        roaster = factory.get_roaster_repository().update(roaster_id, data)
        if not roaster:
            return jsonify({'error': 'Roaster not found'}), 404
        return jsonify(roaster)
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@api.route('/roasters/<int:roaster_id>', methods=['DELETE'])
def delete_roaster(roaster_id):
    """Delete a roaster."""
    try:
        factory = get_repository_factory()
        success = factory.get_roaster_repository().delete(roaster_id)
        if not success:
            return jsonify({'error': 'Roaster not found'}), 404
        return '', 204
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@api.route('/roasters/<int:roaster_id>/usage', methods=['GET'])
def check_roaster_usage(roaster_id):
    """Check if roaster is in use by products."""
    try:
        factory = get_repository_factory()
        roaster = factory.get_roaster_repository().find_by_id(roaster_id)
        if not roaster:
            return jsonify({'error': 'Roaster not found'}), 404
        
        products = factory.get_product_repository().find_all()
        usage_count = sum(1 for p in products if p.get('roaster') == roaster['name'])
        
        return jsonify({
            'in_use': usage_count > 0,
            'usage_count': usage_count,
            'usage_type': 'products'
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@api.route('/roasters/<int:roaster_id>/update_references', methods=['POST'])
def update_roaster_references(roaster_id):
    """Update or remove roaster references in products."""
    try:
        data = request.get_json()
        action = data.get('action')
        replacement_id = data.get('replacement_id')
        
        factory = get_repository_factory()
        roaster = factory.get_roaster_repository().find_by_id(roaster_id)
        if not roaster:
            return jsonify({'error': 'Roaster not found'}), 404
        
        products = factory.get_product_repository().find_all()
        updated_count = 0
        
        for product in products:
            if product.get('roaster') == roaster['name']:
                if action == 'remove':
                    product['roaster'] = ''
                elif action == 'replace' and replacement_id:
                    replacement = factory.get_roaster_repository().find_by_id(replacement_id)
                    if replacement:
                        product['roaster'] = replacement['name']
                
                factory.get_product_repository().update(product['id'], product)
                updated_count += 1
        
        return jsonify({'updated_count': updated_count})
    except Exception as e:
        return jsonify({'error': str(e)}), 500


# Bean Types
@api.route('/bean_types', methods=['GET'])
def get_bean_types():
    """Get all bean types."""
    factory = get_repository_factory()
    bean_types = factory.get_bean_type_repository().find_all()
    return jsonify(bean_types)

@api.route('/bean_types/<int:bean_type_id>', methods=['GET'])
def get_bean_type(bean_type_id):
    """Get a specific bean type."""
    try:
        factory = get_repository_factory()
        bean_type = factory.get_bean_type_repository().find_by_id(bean_type_id)
        if not bean_type:
            return jsonify({'error': 'Bean type not found'}), 404
        return jsonify(bean_type)
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@api.route('/bean_types', methods=['POST'])
def create_bean_type():
    """Create a new bean type."""
    try:
        data = request.get_json()
        error_msg, status_code = validate_lookup_data(data, "bean type")
        if error_msg:
            return jsonify({'error': error_msg}), status_code
        
        factory = get_repository_factory()
        bean_type = factory.get_bean_type_repository().create(data)
        return jsonify(bean_type), 201
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@api.route('/bean_types/<int:bean_type_id>', methods=['PUT'])
def update_bean_type(bean_type_id):
    """Update an existing bean type."""
    try:
        data = request.get_json()
        if not data:
            return jsonify({'error': 'No data provided'}), 400
        
        factory = get_repository_factory()
        bean_type = factory.get_bean_type_repository().update(bean_type_id, data)
        if not bean_type:
            return jsonify({'error': 'Bean type not found'}), 404
        return jsonify(bean_type)
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@api.route('/bean_types/<int:bean_type_id>', methods=['DELETE'])
def delete_bean_type(bean_type_id):
    """Delete a bean type."""
    try:
        factory = get_repository_factory()
        success = factory.get_bean_type_repository().delete(bean_type_id)
        if not success:
            return jsonify({'error': 'Bean type not found'}), 404
        return '', 204
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@api.route('/bean_types/<int:bean_type_id>/usage', methods=['GET'])
def check_bean_type_usage(bean_type_id):
    """Check if bean type is in use by products."""
    try:
        factory = get_repository_factory()
        bean_type = factory.get_bean_type_repository().find_by_id(bean_type_id)
        if not bean_type:
            return jsonify({'error': 'Bean type not found'}), 404
        
        products = factory.get_product_repository().find_all()
        usage_count = 0
        
        for product in products:
            bean_types = product.get('bean_type', [])
            # Handle both array and single value cases
            if isinstance(bean_types, list):
                if bean_type['name'] in bean_types:
                    usage_count += 1
            elif bean_types == bean_type['name']:
                usage_count += 1
        
        return jsonify({
            'in_use': usage_count > 0,
            'usage_count': usage_count,
            'usage_type': 'products'
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@api.route('/bean_types/<int:bean_type_id>/update_references', methods=['POST'])
def update_bean_type_references(bean_type_id):
    """Update or remove bean type references in products."""
    try:
        data = request.get_json()
        action = data.get('action')
        replacement_id = data.get('replacement_id')
        
        factory = get_repository_factory()
        bean_type = factory.get_bean_type_repository().find_by_id(bean_type_id)
        if not bean_type:
            return jsonify({'error': 'Bean type not found'}), 404
        
        products = factory.get_product_repository().find_all()
        updated_count = 0
        
        for product in products:
            bean_types = product.get('bean_type', [])
            updated = False
            
            # Handle both array and single value cases
            if isinstance(bean_types, list):
                if bean_type['name'] in bean_types:
                    if action == 'remove':
                        product['bean_type'] = [bt for bt in bean_types if bt != bean_type['name']]
                        updated = True
                    elif action == 'replace' and replacement_id:
                        replacement = factory.get_bean_type_repository().find_by_id(replacement_id)
                        if replacement:
                            product['bean_type'] = [replacement['name'] if bt == bean_type['name'] else bt for bt in bean_types]
                            updated = True
            elif bean_types == bean_type['name']:
                if action == 'remove':
                    product['bean_type'] = []
                    updated = True
                elif action == 'replace' and replacement_id:
                    replacement = factory.get_bean_type_repository().find_by_id(replacement_id)
                    if replacement:
                        product['bean_type'] = [replacement['name']]
                        updated = True
            
            if updated:
                factory.get_product_repository().update(product['id'], product)
                updated_count += 1
        
        return jsonify({'updated_count': updated_count})
    except Exception as e:
        return jsonify({'error': str(e)}), 500


# Countries
@api.route('/countries', methods=['GET'])
def get_countries():
    """Get all countries."""
    factory = get_repository_factory()
    countries = factory.get_country_repository().find_all()
    return jsonify(countries)

@api.route('/countries/<int:country_id>', methods=['GET'])
def get_country(country_id):
    """Get a specific country."""
    try:
        factory = get_repository_factory()
        country = factory.get_country_repository().find_by_id(country_id)
        if not country:
            return jsonify({'error': 'Country not found'}), 404
        return jsonify(country)
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@api.route('/countries', methods=['POST'])
def create_country():
    """Create a new country."""
    try:
        data = request.get_json()
        error_msg, status_code = validate_lookup_data(data)
        if error_msg:
            return jsonify({'error': error_msg}), status_code
        factory = get_repository_factory()
        country = factory.get_country_repository().create(data)
        return jsonify(country), 201
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@api.route('/countries/<int:country_id>', methods=['PUT'])
def update_country(country_id):
    """Update an existing country."""
    try:
        data = request.get_json()
        if not data:
            return jsonify({'error': 'No data provided'}), 400
        factory = get_repository_factory()
        country = factory.get_country_repository().update(country_id, data)
        if not country:
            return jsonify({'error': 'Country not found'}), 404
        return jsonify(country)
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@api.route('/countries/<int:country_id>', methods=['DELETE'])
def delete_country(country_id):
    """Delete a country."""
    try:
        factory = get_repository_factory()
        success = factory.get_country_repository().delete(country_id)
        if not success:
            return jsonify({'error': 'Country not found'}), 404
        return '', 204
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@api.route('/countries/<int:country_id>/usage', methods=['GET'])
def check_country_usage(country_id):
    """Check if country is in use by products."""
    try:
        factory = get_repository_factory()
        country = factory.get_country_repository().find_by_id(country_id)
        if not country:
            return jsonify({'error': 'Country not found'}), 404
        
        products = factory.get_product_repository().find_all()
        usage_count = 0
        
        for product in products:
            countries = product.get('country', [])
            # Handle both array and single value cases
            if isinstance(countries, list):
                if country['name'] in countries:
                    usage_count += 1
            elif countries == country['name']:
                usage_count += 1
        
        return jsonify({
            'in_use': usage_count > 0,
            'usage_count': usage_count,
            'usage_type': 'products'
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@api.route('/countries/<int:country_id>/update_references', methods=['POST'])
def update_country_references(country_id):
    """Update or remove country references in products."""
    try:
        data = request.get_json()
        action = data.get('action')
        replacement_id = data.get('replacement_id')
        
        factory = get_repository_factory()
        country = factory.get_country_repository().find_by_id(country_id)
        if not country:
            return jsonify({'error': 'Country not found'}), 404
        
        products = factory.get_product_repository().find_all()
        updated_count = 0
        
        for product in products:
            countries = product.get('country', [])
            updated = False
            
            # Handle both array and single value cases
            if isinstance(countries, list):
                if country['name'] in countries:
                    if action == 'remove':
                        product['country'] = [c for c in countries if c != country['name']]
                        updated = True
                    elif action == 'replace' and replacement_id:
                        replacement = factory.get_country_repository().find_by_id(replacement_id)
                        if replacement:
                            product['country'] = [replacement['name'] if c == country['name'] else c for c in countries]
                            updated = True
            elif countries == country['name']:
                if action == 'remove':
                    product['country'] = []
                    updated = True
                elif action == 'replace' and replacement_id:
                    replacement = factory.get_country_repository().find_by_id(replacement_id)
                    if replacement:
                        product['country'] = [replacement['name']]
                        updated = True
            
            if updated:
                factory.get_product_repository().update(product['id'], product)
                updated_count += 1
        
        return jsonify({'updated_count': updated_count})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# Brew Methods
@api.route('/brew_methods', methods=['GET'])
def get_brew_methods():
    """Get all brew methods."""
    factory = get_repository_factory()
    brew_methods = factory.get_brew_method_repository().find_all()
    return jsonify(brew_methods)

@api.route('/brew_methods/<int:brew_method_id>', methods=['GET'])
def get_brew_method(brew_method_id):
    """Get a specific brew method."""
    try:
        factory = get_repository_factory()
        brew_method = factory.get_brew_method_repository().find_by_id(brew_method_id)
        if not brew_method:
            return jsonify({'error': 'Brew method not found'}), 404
        return jsonify(brew_method)
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@api.route('/brew_methods', methods=['POST'])
def create_brew_method():
    """Create a new brew method."""
    try:
        data = request.get_json()
        error_msg, status_code = validate_lookup_data(data)
        if error_msg:
            return jsonify({'error': error_msg}), status_code
        factory = get_repository_factory()
        brew_method = factory.get_brew_method_repository().create(data)
        return jsonify(brew_method), 201
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@api.route('/brew_methods/<int:brew_method_id>', methods=['PUT'])
def update_brew_method(brew_method_id):
    """Update an existing brew method."""
    try:
        data = request.get_json()
        if not data:
            return jsonify({'error': 'No data provided'}), 400
        factory = get_repository_factory()
        brew_method = factory.get_brew_method_repository().update(brew_method_id, data)
        if not brew_method:
            return jsonify({'error': 'Brew method not found'}), 404
        return jsonify(brew_method)
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@api.route('/brew_methods/<int:brew_method_id>', methods=['DELETE'])
def delete_brew_method(brew_method_id):
    """Delete a brew method."""
    try:
        factory = get_repository_factory()
        success = factory.get_brew_method_repository().delete(brew_method_id)
        if not success:
            return jsonify({'error': 'Brew method not found'}), 404
        return '', 204
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@api.route('/brew_methods/<int:brew_method_id>/usage', methods=['GET'])
def check_brew_method_usage(brew_method_id):
    """Check if brew method is in use by brew sessions."""
    try:
        factory = get_repository_factory()
        brew_method = factory.get_brew_method_repository().find_by_id(brew_method_id)
        if not brew_method:
            return jsonify({'error': 'Brew method not found'}), 404
        
        sessions = factory.get_brew_session_repository().find_all()
        usage_count = sum(1 for s in sessions if s.get('brew_method_id') == brew_method_id)
        
        return jsonify({
            'in_use': usage_count > 0,
            'usage_count': usage_count,
            'usage_type': 'brew_sessions'
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@api.route('/brew_methods/<int:brew_method_id>/update_references', methods=['POST'])
def update_brew_method_references(brew_method_id):
    """Update or remove brew method references in brew sessions."""
    try:
        data = request.get_json()
        action = data.get('action')  # 'remove' or 'replace'
        replacement_id = data.get('replacement_id')
        
        factory = get_repository_factory()
        brew_method = factory.get_brew_method_repository().find_by_id(brew_method_id)
        if not brew_method:
            return jsonify({'error': 'Brew method not found'}), 404
        
        sessions = factory.get_brew_session_repository().find_all()
        updated_count = 0
        
        for session in sessions:
            if session.get('brew_method_id') == brew_method_id:
                if action == 'remove':
                    session['brew_method_id'] = None
                elif action == 'replace' and replacement_id:
                    session['brew_method_id'] = replacement_id
                
                factory.get_brew_session_repository().update(session['id'], session)
                updated_count += 1
        
        return jsonify({'updated_count': updated_count})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# Recipes
@api.route('/recipes', methods=['GET'])
def get_recipes():
    """Get all recipes."""
    factory = get_repository_factory()
    recipes = factory.get_recipe_repository().find_all()
    return jsonify(recipes)

@api.route('/recipes/<int:recipe_id>', methods=['GET'])
def get_recipe(recipe_id):
    """Get a specific recipe."""
    try:
        factory = get_repository_factory()
        recipe = factory.get_recipe_repository().find_by_id(recipe_id)
        if not recipe:
            return jsonify({'error': 'Recipe not found'}), 404
        return jsonify(recipe)
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@api.route('/recipes', methods=['POST'])
def create_recipe():
    """Create a new recipe."""
    try:
        data = request.get_json()
        error_msg, status_code = validate_lookup_data(data)
        if error_msg:
            return jsonify({'error': error_msg}), status_code
        factory = get_repository_factory()
        recipe = factory.get_recipe_repository().create(data)
        return jsonify(recipe), 201
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@api.route('/recipes/<int:recipe_id>', methods=['PUT'])
def update_recipe(recipe_id):
    """Update an existing recipe."""
    try:
        data = request.get_json()
        if not data:
            return jsonify({'error': 'No data provided'}), 400
        factory = get_repository_factory()
        recipe = factory.get_recipe_repository().update(recipe_id, data)
        if not recipe:
            return jsonify({'error': 'Recipe not found'}), 404
        return jsonify(recipe)
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@api.route('/recipes/<int:recipe_id>', methods=['DELETE'])
def delete_recipe(recipe_id):
    """Delete a recipe."""
    try:
        factory = get_repository_factory()
        success = factory.get_recipe_repository().delete(recipe_id)
        if not success:
            return jsonify({'error': 'Recipe not found'}), 404
        return '', 204
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@api.route('/recipes/<int:recipe_id>/usage', methods=['GET'])
def check_recipe_usage(recipe_id):
    """Check if recipe is in use by brew sessions."""
    try:
        factory = get_repository_factory()
        recipe = factory.get_recipe_repository().find_by_id(recipe_id)
        if not recipe:
            return jsonify({'error': 'Recipe not found'}), 404
        
        sessions = factory.get_brew_session_repository().find_all()
        usage_count = sum(1 for s in sessions if s.get('recipe_id') == recipe_id)
        
        return jsonify({
            'in_use': usage_count > 0,
            'usage_count': usage_count,
            'usage_type': 'brew_sessions'
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@api.route('/recipes/<int:recipe_id>/update_references', methods=['POST'])
def update_recipe_references(recipe_id):
    """Update or remove recipe references in brew sessions."""
    try:
        data = request.get_json()
        action = data.get('action')  # 'remove' or 'replace'
        replacement_id = data.get('replacement_id')
        
        factory = get_repository_factory()
        recipe = factory.get_recipe_repository().find_by_id(recipe_id)
        if not recipe:
            return jsonify({'error': 'Recipe not found'}), 404
        
        sessions = factory.get_brew_session_repository().find_all()
        updated_count = 0
        
        for session in sessions:
            if session.get('recipe_id') == recipe_id:
                if action == 'remove':
                    session['recipe_id'] = None
                elif action == 'replace' and replacement_id:
                    session['recipe_id'] = replacement_id
                
                factory.get_brew_session_repository().update(session['id'], session)
                updated_count += 1
        
        return jsonify({'updated_count': updated_count})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# Decaf Methods
@api.route('/decaf_methods', methods=['GET'])
def get_decaf_methods():
    """Get all decaf methods."""
    factory = get_repository_factory()
    decaf_methods = factory.get_decaf_method_repository().find_all()
    return jsonify(decaf_methods)

@api.route('/decaf_methods/<int:decaf_method_id>', methods=['GET'])
def get_decaf_method(decaf_method_id):
    """Get a specific decaf method."""
    try:
        factory = get_repository_factory()
        decaf_method = factory.get_decaf_method_repository().find_by_id(decaf_method_id)
        if not decaf_method:
            return jsonify({'error': 'Decaf method not found'}), 404
        return jsonify(decaf_method)
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@api.route('/decaf_methods', methods=['POST'])
def create_decaf_method():
    """Create a new decaf method."""
    try:
        data = request.get_json()
        error_msg, status_code = validate_lookup_data(data)
        if error_msg:
            return jsonify({'error': error_msg}), status_code
        factory = get_repository_factory()
        decaf_method = factory.get_decaf_method_repository().create(data)
        return jsonify(decaf_method), 201
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@api.route('/decaf_methods/<int:decaf_method_id>', methods=['PUT'])
def update_decaf_method(decaf_method_id):
    """Update an existing decaf method."""
    try:
        data = request.get_json()
        if not data:
            return jsonify({'error': 'No data provided'}), 400
        factory = get_repository_factory()
        decaf_method = factory.get_decaf_method_repository().update(decaf_method_id, data)
        if not decaf_method:
            return jsonify({'error': 'Decaf method not found'}), 404
        return jsonify(decaf_method)
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@api.route('/decaf_methods/<int:decaf_method_id>', methods=['DELETE'])
def delete_decaf_method(decaf_method_id):
    """Delete a decaf method."""
    try:
        factory = get_repository_factory()
        success = factory.get_decaf_method_repository().delete(decaf_method_id)
        if not success:
            return jsonify({'error': 'Decaf method not found'}), 404
        return '', 204
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@api.route('/decaf_methods/<int:decaf_method_id>/usage', methods=['GET'])
def check_decaf_method_usage(decaf_method_id):
    """Check if decaf method is in use by products."""
    try:
        factory = get_repository_factory()
        decaf_method = factory.get_decaf_method_repository().find_by_id(decaf_method_id)
        if not decaf_method:
            return jsonify({'error': 'Decaf method not found'}), 404
        
        products = factory.get_product_repository().find_all()
        usage_count = sum(1 for p in products if p.get('decaf_method') == decaf_method['name'])
        
        return jsonify({
            'in_use': usage_count > 0,
            'usage_count': usage_count,
            'usage_type': 'products'
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@api.route('/decaf_methods/<int:decaf_method_id>/update_references', methods=['POST'])
def update_decaf_method_references(decaf_method_id):
    """Update or remove decaf method references in products."""
    try:
        data = request.get_json()
        action = data.get('action')
        replacement_id = data.get('replacement_id')
        
        factory = get_repository_factory()
        decaf_method = factory.get_decaf_method_repository().find_by_id(decaf_method_id)
        if not decaf_method:
            return jsonify({'error': 'Decaf method not found'}), 404
        
        products = factory.get_product_repository().find_all()
        updated_count = 0
        
        for product in products:
            if product.get('decaf_method') == decaf_method['name']:
                if action == 'remove':
                    product['decaf_method'] = ''
                elif action == 'replace' and replacement_id:
                    replacement = factory.get_decaf_method_repository().find_by_id(replacement_id)
                    if replacement:
                        product['decaf_method'] = replacement['name']
                
                factory.get_product_repository().update(product['id'], product)
                updated_count += 1
        
        return jsonify({'updated_count': updated_count})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# Grinders
@api.route('/grinders', methods=['GET'])
def get_grinders():
    """Get all grinders."""
    factory = get_repository_factory()
    grinders = factory.get_grinder_repository().find_all()
    return jsonify(grinders)

@api.route('/grinders/<int:grinder_id>', methods=['GET'])
def get_grinder(grinder_id):
    """Get a specific grinder."""
    try:
        factory = get_repository_factory()
        grinder = factory.get_grinder_repository().find_by_id(grinder_id)
        if not grinder:
            return jsonify({'error': 'Grinder not found'}), 404
        return jsonify(grinder)
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@api.route('/grinders', methods=['POST'])
def create_grinder():
    """Create a new grinder."""
    try:
        data = request.get_json()
        error_msg, status_code = validate_lookup_data(data)
        if error_msg:
            return jsonify({'error': error_msg}), status_code
        factory = get_repository_factory()
        grinder = factory.get_grinder_repository().create(data)
        return jsonify(grinder), 201
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@api.route('/grinders/<int:grinder_id>', methods=['PUT'])
def update_grinder(grinder_id):
    """Update an existing grinder."""
    try:
        data = request.get_json()
        if not data:
            return jsonify({'error': 'No data provided'}), 400
        factory = get_repository_factory()
        grinder = factory.get_grinder_repository().update(grinder_id, data)
        if not grinder:
            return jsonify({'error': 'Grinder not found'}), 404
        return jsonify(grinder)
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@api.route('/grinders/<int:grinder_id>', methods=['DELETE'])
def delete_grinder(grinder_id):
    """Delete a grinder."""
    try:
        factory = get_repository_factory()
        success = factory.get_grinder_repository().delete(grinder_id)
        if not success:
            return jsonify({'error': 'Grinder not found'}), 404
        return '', 204
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@api.route('/grinders/<int:grinder_id>/usage', methods=['GET'])
def check_grinder_usage(grinder_id):
    """Check if grinder is in use by brew sessions."""
    try:
        factory = get_repository_factory()
        grinder = factory.get_grinder_repository().find_by_id(grinder_id)
        if not grinder:
            return jsonify({'error': 'Grinder not found'}), 404
        
        sessions = factory.get_brew_session_repository().find_all()
        usage_count = sum(1 for s in sessions if s.get('grinder_id') == grinder_id)
        
        return jsonify({
            'in_use': usage_count > 0,
            'usage_count': usage_count,
            'usage_type': 'brew_sessions'
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@api.route('/grinders/<int:grinder_id>/update_references', methods=['POST'])
def update_grinder_references(grinder_id):
    """Update or remove grinder references in brew sessions."""
    try:
        data = request.get_json()
        action = data.get('action')
        replacement_id = data.get('replacement_id')
        
        factory = get_repository_factory()
        grinder = factory.get_grinder_repository().find_by_id(grinder_id)
        if not grinder:
            return jsonify({'error': 'Grinder not found'}), 404
        
        sessions = factory.get_brew_session_repository().find_all()
        updated_count = 0
        
        for session in sessions:
            if session.get('grinder_id') == grinder_id:
                if action == 'remove':
                    session['grinder_id'] = None
                elif action == 'replace' and replacement_id:
                    session['grinder_id'] = replacement_id
                
                factory.get_brew_session_repository().update(session['id'], session)
                updated_count += 1
        
        return jsonify({'updated_count': updated_count})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# Filters
@api.route('/filters', methods=['GET'])
def get_filters():
    """Get all filters."""
    factory = get_repository_factory()
    filters = factory.get_filter_repository().find_all()
    return jsonify(filters)

@api.route('/filters/<int:filter_id>', methods=['GET'])
def get_filter(filter_id):
    """Get a specific filter."""
    try:
        factory = get_repository_factory()
        filter_item = factory.get_filter_repository().find_by_id(filter_id)
        if not filter_item:
            return jsonify({'error': 'Filter not found'}), 404
        return jsonify(filter_item)
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@api.route('/filters', methods=['POST'])
def create_filter():
    """Create a new filter."""
    try:
        data = request.get_json()
        error_msg, status_code = validate_lookup_data(data)
        if error_msg:
            return jsonify({'error': error_msg}), status_code
        factory = get_repository_factory()
        filter_item = factory.get_filter_repository().create(data)
        return jsonify(filter_item), 201
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@api.route('/filters/<int:filter_id>', methods=['PUT'])
def update_filter(filter_id):
    """Update an existing filter."""
    try:
        data = request.get_json()
        if not data:
            return jsonify({'error': 'No data provided'}), 400
        factory = get_repository_factory()
        filter_item = factory.get_filter_repository().update(filter_id, data)
        if not filter_item:
            return jsonify({'error': 'Filter not found'}), 404
        return jsonify(filter_item)
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@api.route('/filters/<int:filter_id>', methods=['DELETE'])
def delete_filter(filter_id):
    """Delete a filter."""
    try:
        factory = get_repository_factory()
        success = factory.get_filter_repository().delete(filter_id)
        if not success:
            return jsonify({'error': 'Filter not found'}), 404
        return '', 204
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@api.route('/filters/<int:filter_id>/usage', methods=['GET'])
def check_filter_usage(filter_id):
    """Check if filter is in use by brew sessions."""
    try:
        factory = get_repository_factory()
        filter_item = factory.get_filter_repository().find_by_id(filter_id)
        if not filter_item:
            return jsonify({'error': 'Filter not found'}), 404
        
        sessions = factory.get_brew_session_repository().find_all()
        usage_count = sum(1 for s in sessions if s.get('filter_id') == filter_id)
        
        return jsonify({
            'in_use': usage_count > 0,
            'usage_count': usage_count,
            'usage_type': 'brew_sessions'
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@api.route('/filters/<int:filter_id>/update_references', methods=['POST'])
def update_filter_references(filter_id):
    """Update or remove filter references in brew sessions."""
    try:
        data = request.get_json()
        action = data.get('action')
        replacement_id = data.get('replacement_id')
        
        factory = get_repository_factory()
        filter_item = factory.get_filter_repository().find_by_id(filter_id)
        if not filter_item:
            return jsonify({'error': 'Filter not found'}), 404
        
        sessions = factory.get_brew_session_repository().find_all()
        updated_count = 0
        
        for session in sessions:
            if session.get('filter_id') == filter_id:
                if action == 'remove':
                    session['filter_id'] = None
                elif action == 'replace' and replacement_id:
                    session['filter_id'] = replacement_id
                
                factory.get_brew_session_repository().update(session['id'], session)
                updated_count += 1
        
        return jsonify({'updated_count': updated_count})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# Kettles
@api.route('/kettles', methods=['GET'])
def get_kettles():
    """Get all kettles."""
    factory = get_repository_factory()
    kettles = factory.get_kettle_repository().find_all()
    return jsonify(kettles)

@api.route('/kettles/<int:kettle_id>', methods=['GET'])
def get_kettle(kettle_id):
    """Get a specific kettle."""
    try:
        factory = get_repository_factory()
        kettle = factory.get_kettle_repository().find_by_id(kettle_id)
        if not kettle:
            return jsonify({'error': 'Kettle not found'}), 404
        return jsonify(kettle)
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@api.route('/kettles', methods=['POST'])
def create_kettle():
    """Create a new kettle."""
    try:
        data = request.get_json()
        error_msg, status_code = validate_lookup_data(data)
        if error_msg:
            return jsonify({'error': error_msg}), status_code
        factory = get_repository_factory()
        kettle = factory.get_kettle_repository().create(data)
        return jsonify(kettle), 201
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@api.route('/kettles/<int:kettle_id>', methods=['PUT'])
def update_kettle(kettle_id):
    """Update an existing kettle."""
    try:
        data = request.get_json()
        if not data:
            return jsonify({'error': 'No data provided'}), 400
        factory = get_repository_factory()
        kettle = factory.get_kettle_repository().update(kettle_id, data)
        if not kettle:
            return jsonify({'error': 'Kettle not found'}), 404
        return jsonify(kettle)
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@api.route('/kettles/<int:kettle_id>', methods=['DELETE'])
def delete_kettle(kettle_id):
    """Delete a kettle."""
    try:
        factory = get_repository_factory()
        success = factory.get_kettle_repository().delete(kettle_id)
        if not success:
            return jsonify({'error': 'Kettle not found'}), 404
        return '', 204
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@api.route('/kettles/<int:kettle_id>/usage', methods=['GET'])
def check_kettle_usage(kettle_id):
    """Check if kettle is in use by brew sessions."""
    try:
        factory = get_repository_factory()
        kettle = factory.get_kettle_repository().find_by_id(kettle_id)
        if not kettle:
            return jsonify({'error': 'Kettle not found'}), 404
        
        sessions = factory.get_brew_session_repository().find_all()
        usage_count = sum(1 for s in sessions if s.get('kettle_id') == kettle_id)
        
        return jsonify({
            'in_use': usage_count > 0,
            'usage_count': usage_count,
            'usage_type': 'brew_sessions'
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@api.route('/kettles/<int:kettle_id>/update_references', methods=['POST'])
def update_kettle_references(kettle_id):
    """Update or remove kettle references in brew sessions."""
    try:
        data = request.get_json()
        action = data.get('action')
        replacement_id = data.get('replacement_id')
        
        factory = get_repository_factory()
        kettle = factory.get_kettle_repository().find_by_id(kettle_id)
        if not kettle:
            return jsonify({'error': 'Kettle not found'}), 404
        
        sessions = factory.get_brew_session_repository().find_all()
        updated_count = 0
        
        for session in sessions:
            if session.get('kettle_id') == kettle_id:
                if action == 'remove':
                    session['kettle_id'] = None
                elif action == 'replace' and replacement_id:
                    session['kettle_id'] = replacement_id
                
                factory.get_brew_session_repository().update(session['id'], session)
                updated_count += 1
        
        return jsonify({'updated_count': updated_count})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# Scales
@api.route('/scales', methods=['GET'])
def get_scales():
    """Get all scales."""
    factory = get_repository_factory()
    scales = factory.get_scale_repository().find_all()
    return jsonify(scales)

@api.route('/scales/<int:scale_id>', methods=['GET'])
def get_scale(scale_id):
    """Get a specific scale."""
    try:
        factory = get_repository_factory()
        scale = factory.get_scale_repository().find_by_id(scale_id)
        if not scale:
            return jsonify({'error': 'Scale not found'}), 404
        return jsonify(scale)
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@api.route('/scales', methods=['POST'])
def create_scale():
    """Create a new scale."""
    try:
        data = request.get_json()
        error_msg, status_code = validate_lookup_data(data)
        if error_msg:
            return jsonify({'error': error_msg}), status_code
        factory = get_repository_factory()
        scale = factory.get_scale_repository().create(data)
        return jsonify(scale), 201
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@api.route('/scales/<int:scale_id>', methods=['PUT'])
def update_scale(scale_id):
    """Update an existing scale."""
    try:
        data = request.get_json()
        if not data:
            return jsonify({'error': 'No data provided'}), 400
        factory = get_repository_factory()
        scale = factory.get_scale_repository().update(scale_id, data)
        if not scale:
            return jsonify({'error': 'Scale not found'}), 404
        return jsonify(scale)
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@api.route('/scales/<int:scale_id>', methods=['DELETE'])
def delete_scale(scale_id):
    """Delete a scale."""
    try:
        factory = get_repository_factory()
        success = factory.get_scale_repository().delete(scale_id)
        if not success:
            return jsonify({'error': 'Scale not found'}), 404
        return '', 204
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@api.route('/scales/<int:scale_id>/usage', methods=['GET'])
def check_scale_usage(scale_id):
    """Check if scale is in use by brew sessions."""
    try:
        factory = get_repository_factory()
        scale = factory.get_scale_repository().find_by_id(scale_id)
        if not scale:
            return jsonify({'error': 'Scale not found'}), 404
        
        sessions = factory.get_brew_session_repository().find_all()
        usage_count = sum(1 for s in sessions if s.get('scale_id') == scale_id)
        
        return jsonify({
            'in_use': usage_count > 0,
            'usage_count': usage_count,
            'usage_type': 'brew_sessions'
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@api.route('/scales/<int:scale_id>/update_references', methods=['POST'])
def update_scale_references(scale_id):
    """Update or remove scale references in brew sessions."""
    try:
        data = request.get_json()
        action = data.get('action')
        replacement_id = data.get('replacement_id')
        
        factory = get_repository_factory()
        scale = factory.get_scale_repository().find_by_id(scale_id)
        if not scale:
            return jsonify({'error': 'Scale not found'}), 404
        
        sessions = factory.get_brew_session_repository().find_all()
        updated_count = 0
        
        for session in sessions:
            if session.get('scale_id') == scale_id:
                if action == 'remove':
                    session['scale_id'] = None
                elif action == 'replace' and replacement_id:
                    session['scale_id'] = replacement_id
                
                factory.get_brew_session_repository().update(session['id'], session)
                updated_count += 1
        
        return jsonify({'updated_count': updated_count})
    except Exception as e:
        return jsonify({'error': str(e)}), 500


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
    # Bean types (now an array)
    bean_types = []
    bean_type_ids = []
    if data.get('bean_type'):
        bean_type_list = data['bean_type'] if isinstance(data['bean_type'], list) else [data['bean_type']]
        for bt_name in bean_type_list:
            if bt_name:
                bt = bean_type_repo.get_or_create(bt_name)
                bean_types.append(bt['name'])
                bean_type_ids.append(bt['id'])
    
    country = None
    if data.get('country'):
        country = country_repo.get_or_create(data['country'])
    
    # Regions (now an array)
    regions = []
    region_ids = []
    if data.get('region'):
        region_list = data['region'] if isinstance(data['region'], list) else [data['region']]
        for r_name in region_list:
            if r_name:
                r = country_repo.get_or_create(r_name)
                regions.append(r['name'])
                region_ids.append(r['id'])
    
    # Handle decaf method if product is decaf
    decaf_method = None
    if data.get('decaf') and data.get('decaf_method'):
        decaf_method_repo = factory.get_decaf_method_repository()
        decaf_method = decaf_method_repo.get_or_create(data['decaf_method'])
    
    # Create product
    product_data = {
        'roaster': roaster['name'],
        'roaster_id': roaster['id'],
        'bean_type': bean_types,
        'bean_type_id': bean_type_ids,
        'country': country['name'] if country else None,
        'country_id': country['id'] if country else None,
        'region': regions,
        'region_id': region_ids,
        'product_name': data.get('product_name'),
        'roast_type': safe_int(data.get('roast_type')),
        'description': data.get('description'),
        'url': data.get('url'),
        'image_url': data.get('image_url'),
        'decaf': data.get('decaf', False),
        'decaf_method': decaf_method['name'] if decaf_method else None,
        'decaf_method_id': decaf_method['id'] if decaf_method else None,
        'rating': safe_int(data.get('rating')),
        'bean_process': data.get('bean_process'),
        'notes': data.get('notes')
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
    # Bean types (now an array)
    bean_types = []
    bean_type_ids = []
    if data.get('bean_type'):
        bean_type_list = data['bean_type'] if isinstance(data['bean_type'], list) else [data['bean_type']]
        for bt_name in bean_type_list:
            if bt_name:
                bt = bean_type_repo.get_or_create(bt_name)
                bean_types.append(bt['name'])
                bean_type_ids.append(bt['id'])
    
    country = None
    if data.get('country'):
        country = country_repo.get_or_create(data['country'])
    
    # Regions (now an array)
    regions = []
    region_ids = []
    if data.get('region'):
        region_list = data['region'] if isinstance(data['region'], list) else [data['region']]
        for r_name in region_list:
            if r_name:
                r = country_repo.get_or_create(r_name)
                regions.append(r['name'])
                region_ids.append(r['id'])
    
    # Handle decaf method if product is decaf
    decaf_method = None
    if data.get('decaf') and data.get('decaf_method'):
        decaf_method_repo = factory.get_decaf_method_repository()
        decaf_method = decaf_method_repo.get_or_create(data['decaf_method'])
    
    # Update product
    product_data = {
        'roaster': roaster['name'],
        'roaster_id': roaster['id'],
        'bean_type': bean_types,
        'bean_type_id': bean_type_ids,
        'country': country['name'] if country else None,
        'country_id': country['id'] if country else None,
        'region': regions,
        'region_id': region_ids,
        'product_name': data.get('product_name'),
        'roast_type': safe_int(data.get('roast_type')),
        'description': data.get('description'),
        'url': data.get('url'),
        'image_url': data.get('image_url'),
        'decaf': data.get('decaf', False),
        'decaf_method': decaf_method['name'] if decaf_method else None,
        'decaf_method_id': decaf_method['id'] if decaf_method else None,
        'rating': safe_int(data.get('rating')),
        'bean_process': data.get('bean_process'),
        'notes': data.get('notes')
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
            'amount_grams': safe_float(data.get('amount_grams')),
            'price': safe_float(data.get('price')),
            'seller': data.get('seller'),
            'notes': data.get('notes'),
            'rating': safe_int(data.get('rating'))
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
        'amount_grams': safe_float(data.get('amount_grams')),
        'price': safe_float(data.get('price')),
        'seller': data.get('seller'),
        'notes': data.get('notes'),
        'rating': safe_int(data.get('rating'))
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
            
            # Add brew method, recipe, grinder, filter, kettle, and scale names
            if session.get('brew_method_id'):
                method = brew_method_repo.find_by_id(session['brew_method_id'])
                session['brew_method'] = method['name'] if method else None
            
            if session.get('recipe_id'):
                recipe = recipe_repo.find_by_id(session['recipe_id'])
                session['recipe'] = recipe['name'] if recipe else None
            
            if session.get('grinder_id'):
                grinder = grinder_repo.find_by_id(session['grinder_id'])
                session['grinder'] = grinder['name'] if grinder else None
            
            if session.get('filter_id'):
                filter_repo = factory.get_filter_repository()
                filter_lookup = filter_repo.find_by_id(session['filter_id'])
                session['filter'] = filter_lookup['name'] if filter_lookup else None
            
            if session.get('kettle_id'):
                kettle_repo = factory.get_kettle_repository()
                kettle_lookup = kettle_repo.find_by_id(session['kettle_id'])
                session['kettle'] = kettle_lookup['name'] if kettle_lookup else None
            
            if session.get('scale_id'):
                scale_repo = factory.get_scale_repository()
                scale_lookup = scale_repo.find_by_id(session['scale_id'])
                session['scale'] = scale_lookup['name'] if scale_lookup else None
            
            # Calculate brew ratio
            session['brew_ratio'] = calculate_brew_ratio(session.get('amount_coffee_grams'), session.get('amount_water_grams'))
        
        return jsonify(sessions)
    
    elif request.method == 'POST':
        """Create a new brew session for the specified batch."""
        data = request.get_json()
        if not data:
            return jsonify({'error': 'No data provided'}), 400
        
        # Get or create brew method, recipe, grinder, filter, kettle, and scale
        brew_method_repo = factory.get_brew_method_repository()
        recipe_repo = factory.get_recipe_repository()
        grinder_repo = factory.get_grinder_repository()
        filter_repo = factory.get_filter_repository()
        kettle_repo = factory.get_kettle_repository()
        scale_repo = factory.get_scale_repository()
        
        brew_method = None
        if data.get('brew_method'):
            brew_method = brew_method_repo.get_or_create(data['brew_method'])
        
        recipe = None
        if data.get('recipe'):
            recipe = recipe_repo.get_or_create(data['recipe'])
        
        grinder = None
        if data.get('grinder'):
            grinder = grinder_repo.get_or_create(data['grinder'])
        
        filter_type = None
        if data.get('filter'):
            filter_type = filter_repo.get_or_create(data['filter'])
        
        kettle = None
        if data.get('kettle'):
            kettle = kettle_repo.get_or_create(data['kettle'])
        
        scale = None
        if data.get('scale'):
            scale = scale_repo.get_or_create(data['scale'])
        
        # Extract and validate fields from request
        # Convert numeric fields with type safety
        amount_coffee_grams = safe_float(data.get('amount_coffee_grams'))
        amount_water_grams = safe_float(data.get('amount_water_grams'))
        brew_temperature_c = safe_int(data.get('brew_temperature_c'))
        bloom_time_seconds = safe_int(data.get('bloom_time_seconds'))
        brew_time_seconds = safe_int(data.get('brew_time_seconds'))
        score = safe_float(data.get('score'))
        
        # Validate tasting scores (1-10 range)
        sweetness = safe_int(data.get('sweetness'))
        acidity = safe_int(data.get('acidity'))
        bitterness = safe_int(data.get('bitterness'))
        body = safe_int(data.get('body'))
        aroma = safe_int(data.get('aroma'))
        flavor_profile_match = safe_int(data.get('flavor_profile_match'))
        
        # Validate tasting scores are in range
        validation_errors = []
        for field_name, field_value in [
            ('sweetness', sweetness),
            ('acidity', acidity),
            ('bitterness', bitterness),
            ('body', body),
            ('aroma', aroma),
            ('flavor_profile_match', flavor_profile_match)
        ]:
            if field_value is not None and (field_value < 1 or field_value > 10):
                validation_errors.append(f"{field_name} must be between 1 and 10")
        
        # Validate overall score is in range (can be float)
        if score is not None and (score < 1.0 or score > 10.0):
            validation_errors.append("score must be between 1.0 and 10.0")
        
        if validation_errors:
            return jsonify({'error': '; '.join(validation_errors)}), 400
        
        session_data = {
            'timestamp': data.get('timestamp', datetime.utcnow().isoformat()),
            'product_batch_id': batch_id,  # Use batch_id from URL
            'product_id': batch.get('product_id'),  # Get product_id from batch
            'recipe_id': recipe['id'] if recipe else data.get('recipe_id'),
            'brew_method_id': brew_method['id'] if brew_method else data.get('brew_method_id'),
            'grinder_id': grinder['id'] if grinder else data.get('grinder_id'),
            'grinder_setting': data.get('grinder_setting'),
            'filter_id': filter_type['id'] if filter_type else data.get('filter_id'),
            'kettle_id': kettle['id'] if kettle else data.get('kettle_id'),
            'scale_id': scale['id'] if scale else data.get('scale_id'),
            'amount_coffee_grams': amount_coffee_grams,
            'amount_water_grams': amount_water_grams,
            'brew_temperature_c': brew_temperature_c,
            'bloom_time_seconds': bloom_time_seconds,
            'brew_time_seconds': brew_time_seconds,
            'sweetness': sweetness,
            'acidity': acidity,
            'bitterness': bitterness,
            'body': body,
            'aroma': aroma,
            'flavor_profile_match': flavor_profile_match,
            'score': score,
            'notes': data.get('notes')
        }
        
        session_repo = factory.get_brew_session_repository()
        session = session_repo.create(session_data)
        
        # Enrich with product information
        product_repo = factory.get_product_repository()
        product = product_repo.find_by_id(batch.get('product_id'))
        if product:
            session['product_name'] = f"{product.get('roaster', 'N/A')} - {product.get('bean_type', 'N/A')}"
        
        # Add brew method, recipe, grinder, filter, kettle, and scale names
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
        
        if filter_type:
            session['filter'] = filter_type['name']
        elif session.get('filter_id'):
            filt = filter_repo.find_by_id(session['filter_id'])
            session['filter'] = filt['name'] if filt else None
        
        if kettle:
            session['kettle'] = kettle['name']
        elif session.get('kettle_id'):
            kett = kettle_repo.find_by_id(session['kettle_id'])
            session['kettle'] = kett['name'] if kett else None
        
        if scale:
            session['scale'] = scale['name']
        elif session.get('scale_id'):
            sc = scale_repo.find_by_id(session['scale_id'])
            session['scale'] = sc['name'] if sc else None
        
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
    filter_repo = factory.get_filter_repository()
    kettle_repo = factory.get_kettle_repository()
    scale_repo = factory.get_scale_repository()
    
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
                'roast_type': product.get('roast_type'),
                'decaf': product.get('decaf', False)
            }
        else:
            session['product_details'] = {}
        
        # Add brew method, recipe, grinder, filter, kettle, and scale names
        if session.get('brew_method_id'):
            method = brew_method_repo.find_by_id(session['brew_method_id'])
            session['brew_method'] = method['name'] if method else None
        
        if session.get('recipe_id'):
            recipe = recipe_repo.find_by_id(session['recipe_id'])
            session['recipe'] = recipe['name'] if recipe else None
        
        if session.get('grinder_id'):
            grinder = grinder_repo.find_by_id(session['grinder_id'])
            session['grinder'] = grinder['name'] if grinder else None
        
        if session.get('filter_id'):
            filter_lookup = filter_repo.find_by_id(session['filter_id'])
            session['filter'] = filter_lookup['name'] if filter_lookup else None
        
        if session.get('kettle_id'):
            kettle_lookup = kettle_repo.find_by_id(session['kettle_id'])
            session['kettle'] = kettle_lookup['name'] if kettle_lookup else None
        
        if session.get('scale_id'):
            scale_lookup = scale_repo.find_by_id(session['scale_id'])
            session['scale'] = scale_lookup['name'] if scale_lookup else None
        
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
            'roast_type': product.get('roast_type'),
            'decaf': product.get('decaf', False)
        }
    else:
        session['product_details'] = {}
    
    # Add brew method, recipe, grinder, filter, kettle, and scale names
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
    
    if session.get('filter_id'):
        filter_repo = factory.get_filter_repository()
        filter_lookup = filter_repo.find_by_id(session['filter_id'])
        session['filter'] = filter_lookup['name'] if filter_lookup else None
    
    if session.get('kettle_id'):
        kettle_repo = factory.get_kettle_repository()
        kettle_lookup = kettle_repo.find_by_id(session['kettle_id'])
        session['kettle'] = kettle_lookup['name'] if kettle_lookup else None
    
    if session.get('scale_id'):
        scale_repo = factory.get_scale_repository()
        scale_lookup = scale_repo.find_by_id(session['scale_id'])
        session['scale'] = scale_lookup['name'] if scale_lookup else None
    
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
    
    # Get or create brew method, recipe, grinder, filter, kettle, and scale
    brew_method_repo = factory.get_brew_method_repository()
    recipe_repo = factory.get_recipe_repository()
    grinder_repo = factory.get_grinder_repository()
    filter_repo = factory.get_filter_repository()
    kettle_repo = factory.get_kettle_repository()
    scale_repo = factory.get_scale_repository()
    
    brew_method = None
    if data.get('brew_method'):
        brew_method = brew_method_repo.get_or_create(data['brew_method'])
    
    recipe = None
    if data.get('recipe'):
        recipe = recipe_repo.get_or_create(data['recipe'])
    
    grinder = None
    if data.get('grinder'):
        grinder = grinder_repo.get_or_create(data['grinder'])
    
    filter_type = None
    if data.get('filter'):
        filter_type = filter_repo.get_or_create(data['filter'])
    
    kettle = None
    if data.get('kettle'):
        kettle = kettle_repo.get_or_create(data['kettle'])
    
    scale = None
    if data.get('scale'):
        scale = scale_repo.get_or_create(data['scale'])
    
    # Extract and validate fields from request
    # Convert numeric fields with type safety
    amount_coffee_grams = safe_float(data.get('amount_coffee_grams'))
    amount_water_grams = safe_float(data.get('amount_water_grams'))
    brew_temperature_c = safe_int(data.get('brew_temperature_c'))
    bloom_time_seconds = safe_int(data.get('bloom_time_seconds'))
    brew_time_seconds = safe_int(data.get('brew_time_seconds'))
    score = safe_float(data.get('score'))
    
    # Validate tasting scores (1-10 range)
    sweetness = safe_int(data.get('sweetness'))
    acidity = safe_int(data.get('acidity'))
    bitterness = safe_int(data.get('bitterness'))
    body = safe_int(data.get('body'))
    aroma = safe_int(data.get('aroma'))
    flavor_profile_match = safe_int(data.get('flavor_profile_match'))
    
    # Validate tasting scores are in range
    validation_errors = []
    for field_name, field_value in [
        ('sweetness', sweetness),
        ('acidity', acidity),
        ('bitterness', bitterness),
        ('body', body),
        ('aroma', aroma),
        ('flavor_profile_match', flavor_profile_match)
    ]:
        if field_value is not None and (field_value < 1 or field_value > 10):
            validation_errors.append(f"{field_name} must be between 1 and 10")
    
    # Validate overall score is in range (can be float)
    if score is not None and (score < 1.0 or score > 10.0):
        validation_errors.append("score must be between 1.0 and 10.0")
    
    if validation_errors:
        return jsonify({'error': '; '.join(validation_errors)}), 400
    
    # Update brew session
    session_data = {
        'timestamp': data.get('timestamp', existing_session['timestamp']),
        'product_batch_id': product_batch_id,
        'product_id': product_id,
        'brew_method_id': brew_method['id'] if brew_method else None,
        'recipe_id': recipe['id'] if recipe else None,
        'grinder_id': grinder['id'] if grinder else None,
        'grinder_setting': data.get('grinder_setting'),
        'filter_id': filter_type['id'] if filter_type else None,
        'kettle_id': kettle['id'] if kettle else None,
        'scale_id': scale['id'] if scale else None,
        'amount_coffee_grams': amount_coffee_grams,
        'amount_water_grams': amount_water_grams,
        'brew_temperature_c': brew_temperature_c,
        'bloom_time_seconds': bloom_time_seconds,
        'brew_time_seconds': brew_time_seconds,
        'sweetness': sweetness,
        'acidity': acidity,
        'bitterness': bitterness,
        'body': body,
        'aroma': aroma,
        'flavor_profile_match': flavor_profile_match,
        'score': score,
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
    
    if filter_type:
        session['filter'] = filter_type['name']
    elif session.get('filter_id'):
        filter_lookup = filter_repo.find_by_id(session['filter_id'])
        session['filter'] = filter_lookup['name'] if filter_lookup else None
    
    if kettle:
        session['kettle'] = kettle['name']
    elif session.get('kettle_id'):
        kettle_lookup = kettle_repo.find_by_id(session['kettle_id'])
        session['kettle'] = kettle_lookup['name'] if kettle_lookup else None
    
    if scale:
        session['scale'] = scale['name']
    elif session.get('scale_id'):
        scale_lookup = scale_repo.find_by_id(session['scale_id'])
        session['scale'] = scale_lookup['name'] if scale_lookup else None
    session['product_details'] = {
        'roaster': product.get('roaster'),
        'bean_type': product.get('bean_type'),
        'product_name': product.get('product_name'),
        'roast_date': batch.get('roast_date'),
        'roast_type': product.get('roast_type'),
        'decaf': product.get('decaf', False)
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
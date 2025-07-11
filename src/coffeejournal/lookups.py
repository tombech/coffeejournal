from flask import Blueprint, jsonify, request
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


lookups = Blueprint('lookups', __name__, url_prefix='/api')


# --- Lookup Endpoints ---

# Roasters
@lookups.route('/roasters', methods=['GET'])
def get_roasters():
    """Get all roasters."""
    factory = get_repository_factory()
    roasters = factory.get_roaster_repository().find_all()
    return jsonify(roasters)

@lookups.route('/roasters/search', methods=['GET'])
def search_roasters():
    """Search roasters by name."""
    query = request.args.get('q', '').strip()
    if not query:
        return jsonify([])
    
    factory = get_repository_factory()
    results = factory.get_roaster_repository().search(query)
    return jsonify(results)

@lookups.route('/roasters/<int:roaster_id>', methods=['GET'])
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

@lookups.route('/roasters', methods=['POST'])
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

@lookups.route('/roasters/<int:roaster_id>', methods=['PUT'])
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

@lookups.route('/roasters/<int:roaster_id>', methods=['DELETE'])
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

@lookups.route('/roasters/<int:roaster_id>/usage', methods=['GET'])
def check_roaster_usage(roaster_id):
    """Check if roaster is in use by products."""
    try:
        factory = get_repository_factory()
        roaster = factory.get_roaster_repository().find_by_id(roaster_id)
        if not roaster:
            return jsonify({'error': 'Roaster not found'}), 404
        
        products = factory.get_product_repository().find_all()
        usage_count = sum(1 for p in products if p.get('roaster_id') == roaster_id)
        
        return jsonify({
            'in_use': usage_count > 0,
            'usage_count': usage_count,
            'usage_type': 'products'
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@lookups.route('/roasters/<int:roaster_id>/update_references', methods=['POST'])
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
            if product.get('roaster_id') == roaster_id:
                if action == 'remove':
                    product['roaster_id'] = None
                elif action == 'replace' and replacement_id:
                    product['roaster_id'] = replacement_id
                
                factory.get_product_repository().update(product['id'], product)
                updated_count += 1
        
        return jsonify({'updated_count': updated_count})
    except Exception as e:
        return jsonify({'error': str(e)}), 500


# Bean Types
@lookups.route('/bean_types', methods=['GET'])
def get_bean_types():
    """Get all bean types."""
    factory = get_repository_factory()
    bean_types = factory.get_bean_type_repository().find_all()
    return jsonify(bean_types)

@lookups.route('/bean_types/search', methods=['GET'])
def search_bean_types():
    """Search bean types by name."""
    query = request.args.get('q', '').strip()
    if not query:
        return jsonify([])
    
    factory = get_repository_factory()
    results = factory.get_bean_type_repository().search(query)
    return jsonify(results)

@lookups.route('/bean_types/<int:bean_type_id>', methods=['GET'])
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

@lookups.route('/bean_types', methods=['POST'])
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

@lookups.route('/bean_types/<int:bean_type_id>', methods=['PUT'])
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

@lookups.route('/bean_types/<int:bean_type_id>', methods=['DELETE'])
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

@lookups.route('/bean_types/<int:bean_type_id>/usage', methods=['GET'])
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
            bean_type_ids = product.get('bean_type_id', [])
            # Handle both array and single value cases
            if isinstance(bean_type_ids, list):
                if bean_type_id in bean_type_ids:
                    usage_count += 1
            elif bean_type_ids == bean_type_id:
                usage_count += 1
        
        return jsonify({
            'in_use': usage_count > 0,
            'usage_count': usage_count,
            'usage_type': 'products'
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@lookups.route('/bean_types/<int:bean_type_id>/update_references', methods=['POST'])
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
            bean_type_ids = product.get('bean_type_id', [])
            updated = False
            
            # Handle both array and single value cases
            if isinstance(bean_type_ids, list):
                if bean_type_id in bean_type_ids:
                    if action == 'remove':
                        product['bean_type_id'] = [bt_id for bt_id in bean_type_ids if bt_id != bean_type_id]
                        updated = True
                    elif action == 'replace' and replacement_id:
                        product['bean_type_id'] = [replacement_id if bt_id == bean_type_id else bt_id for bt_id in bean_type_ids]
                        updated = True
            elif bean_type_ids == bean_type_id:
                if action == 'remove':
                    product['bean_type_id'] = []
                    updated = True
                elif action == 'replace' and replacement_id:
                    product['bean_type_id'] = [replacement_id]
                    updated = True
            
            if updated:
                factory.get_product_repository().update(product['id'], product)
                updated_count += 1
        
        return jsonify({'updated_count': updated_count})
    except Exception as e:
        return jsonify({'error': str(e)}), 500


# Countries
@lookups.route('/countries', methods=['GET'])
def get_countries():
    """Get all countries."""
    factory = get_repository_factory()
    countries = factory.get_country_repository().find_all()
    return jsonify(countries)

@lookups.route('/countries/search', methods=['GET'])
def search_countries():
    """Search countries by name."""
    query = request.args.get('q', '').strip()
    if not query:
        return jsonify([])
    
    factory = get_repository_factory()
    results = factory.get_country_repository().search(query)
    return jsonify(results)

@lookups.route('/countries/<int:country_id>', methods=['GET'])
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

@lookups.route('/countries', methods=['POST'])
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

@lookups.route('/countries/<int:country_id>', methods=['PUT'])
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

@lookups.route('/countries/<int:country_id>', methods=['DELETE'])
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

@lookups.route('/countries/<int:country_id>/usage', methods=['GET'])
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

@lookups.route('/countries/<int:country_id>/update_references', methods=['POST'])
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
@lookups.route('/brew_methods', methods=['GET'])
def get_brew_methods():
    """Get all brew methods."""
    factory = get_repository_factory()
    brew_methods = factory.get_brew_method_repository().find_all()
    return jsonify(brew_methods)

@lookups.route('/brew_methods/search', methods=['GET'])
def search_brew_methods():
    """Search brew methods by name or short_form."""
    query = request.args.get('q', '').strip()
    if not query:
        return jsonify([])
    
    factory = get_repository_factory()
    results = factory.get_brew_method_repository().search(query)
    return jsonify(results)

@lookups.route('/brew_methods/<int:brew_method_id>', methods=['GET'])
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

@lookups.route('/brew_methods', methods=['POST'])
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

@lookups.route('/brew_methods/<int:brew_method_id>', methods=['PUT'])
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

@lookups.route('/brew_methods/<int:brew_method_id>', methods=['DELETE'])
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

@lookups.route('/brew_methods/<int:brew_method_id>/usage', methods=['GET'])
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

@lookups.route('/brew_methods/<int:brew_method_id>/update_references', methods=['POST'])
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
@lookups.route('/recipes', methods=['GET'])
def get_recipes():
    """Get all recipes."""
    factory = get_repository_factory()
    recipes = factory.get_recipe_repository().find_all()
    return jsonify(recipes)

@lookups.route('/recipes/search', methods=['GET'])
def search_recipes():
    """Search recipes by name."""
    query = request.args.get('q', '').strip()
    if not query:
        return jsonify([])
    
    factory = get_repository_factory()
    results = factory.get_recipe_repository().search(query)
    return jsonify(results)

@lookups.route('/recipes/<int:recipe_id>', methods=['GET'])
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

@lookups.route('/recipes', methods=['POST'])
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

@lookups.route('/recipes/<int:recipe_id>', methods=['PUT'])
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

@lookups.route('/recipes/<int:recipe_id>', methods=['DELETE'])
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

@lookups.route('/recipes/<int:recipe_id>/usage', methods=['GET'])
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

@lookups.route('/recipes/<int:recipe_id>/update_references', methods=['POST'])
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
@lookups.route('/decaf_methods', methods=['GET'])
def get_decaf_methods():
    """Get all decaf methods."""
    factory = get_repository_factory()
    decaf_methods = factory.get_decaf_method_repository().find_all()
    return jsonify(decaf_methods)

@lookups.route('/decaf_methods/search', methods=['GET'])
def search_decaf_methods():
    """Search decaf methods by name."""
    query = request.args.get('q', '').strip()
    if not query:
        return jsonify([])
    
    factory = get_repository_factory()
    results = factory.get_decaf_method_repository().search(query)
    return jsonify(results)

@lookups.route('/decaf_methods/<int:decaf_method_id>', methods=['GET'])
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

@lookups.route('/decaf_methods', methods=['POST'])
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

@lookups.route('/decaf_methods/<int:decaf_method_id>', methods=['PUT'])
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

@lookups.route('/decaf_methods/<int:decaf_method_id>', methods=['DELETE'])
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

@lookups.route('/decaf_methods/<int:decaf_method_id>/usage', methods=['GET'])
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

@lookups.route('/decaf_methods/<int:decaf_method_id>/update_references', methods=['POST'])
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
@lookups.route('/grinders', methods=['GET'])
def get_grinders():
    """Get all grinders."""
    factory = get_repository_factory()
    grinders = factory.get_grinder_repository().find_all()
    return jsonify(grinders)

@lookups.route('/grinders/search', methods=['GET'])
def search_grinders():
    """Search grinders by name or short_form."""
    query = request.args.get('q', '').strip()
    if not query:
        return jsonify([])
    
    factory = get_repository_factory()
    results = factory.get_grinder_repository().search(query)
    return jsonify(results)

@lookups.route('/grinders/<int:grinder_id>', methods=['GET'])
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

@lookups.route('/grinders', methods=['POST'])
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

@lookups.route('/grinders/<int:grinder_id>', methods=['PUT'])
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

@lookups.route('/grinders/<int:grinder_id>', methods=['DELETE'])
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

@lookups.route('/grinders/<int:grinder_id>/usage', methods=['GET'])
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

@lookups.route('/grinders/<int:grinder_id>/update_references', methods=['POST'])
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
@lookups.route('/filters', methods=['GET'])
def get_filters():
    """Get all filters."""
    factory = get_repository_factory()
    filters = factory.get_filter_repository().find_all()
    return jsonify(filters)

@lookups.route('/filters/search', methods=['GET'])
def search_filters():
    """Search filters by name."""
    query = request.args.get('q', '').strip()
    if not query:
        return jsonify([])
    
    factory = get_repository_factory()
    results = factory.get_filter_repository().search(query)
    return jsonify(results)

@lookups.route('/filters/<int:filter_id>', methods=['GET'])
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

@lookups.route('/filters', methods=['POST'])
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

@lookups.route('/filters/<int:filter_id>', methods=['PUT'])
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

@lookups.route('/filters/<int:filter_id>', methods=['DELETE'])
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

@lookups.route('/filters/<int:filter_id>/usage', methods=['GET'])
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

@lookups.route('/filters/<int:filter_id>/update_references', methods=['POST'])
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
@lookups.route('/kettles', methods=['GET'])
def get_kettles():
    """Get all kettles."""
    factory = get_repository_factory()
    kettles = factory.get_kettle_repository().find_all()
    return jsonify(kettles)

@lookups.route('/kettles/search', methods=['GET'])
def search_kettles():
    """Search kettles by name."""
    query = request.args.get('q', '').strip()
    if not query:
        return jsonify([])
    
    factory = get_repository_factory()
    results = factory.get_kettle_repository().search(query)
    return jsonify(results)

@lookups.route('/kettles/<int:kettle_id>', methods=['GET'])
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

@lookups.route('/kettles', methods=['POST'])
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

@lookups.route('/kettles/<int:kettle_id>', methods=['PUT'])
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

@lookups.route('/kettles/<int:kettle_id>', methods=['DELETE'])
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

@lookups.route('/kettles/<int:kettle_id>/usage', methods=['GET'])
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

@lookups.route('/kettles/<int:kettle_id>/update_references', methods=['POST'])
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
@lookups.route('/scales', methods=['GET'])
def get_scales():
    """Get all scales."""
    factory = get_repository_factory()
    scales = factory.get_scale_repository().find_all()
    return jsonify(scales)

@lookups.route('/scales/search', methods=['GET'])
def search_scales():
    """Search scales by name."""
    query = request.args.get('q', '').strip()
    if not query:
        return jsonify([])
    
    factory = get_repository_factory()
    results = factory.get_scale_repository().search(query)
    return jsonify(results)

@lookups.route('/scales/<int:scale_id>', methods=['GET'])
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

@lookups.route('/scales', methods=['POST'])
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

@lookups.route('/scales/<int:scale_id>', methods=['PUT'])
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

@lookups.route('/scales/<int:scale_id>', methods=['DELETE'])
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

@lookups.route('/scales/<int:scale_id>/usage', methods=['GET'])
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

@lookups.route('/scales/<int:scale_id>/update_references', methods=['POST'])
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
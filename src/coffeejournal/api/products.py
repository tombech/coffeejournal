"""
Product API endpoints for the Coffee Journal application.

This module contains all endpoints related to coffee products:
- GET /products - List all products with optional filtering
- POST /products - Create a new product
- GET /products/{id} - Get a specific product
- PUT /products/{id} - Update a product
- DELETE /products/{id} - Delete a product
- GET /products/{id}/batches - Get batches for a product
- POST /products/{id}/batches - Create a new batch for a product
"""

from flask import Blueprint, jsonify, request
from ..repositories.factory import get_repository_factory
from .utils import (
    enrich_product_with_lookups, 
    resolve_lookup_field, 
    safe_int, 
    safe_float,
    calculate_price_per_cup
)

products_bp = Blueprint('products', __name__)


@products_bp.route('/products', methods=['GET'])
def get_products():
    """Get all products with optional filtering."""
    factory = get_repository_factory()
    product_repo = factory.get_product_repository()
    
    # Get all products first
    products = product_repo.find_all()
    
    # Enrich all products with lookup objects
    enriched_products = []
    for product in products:
        enriched_product = enrich_product_with_lookups(product.copy(), factory)
        enriched_products.append(enriched_product)
    
    # Apply filters to enriched products
    filters = {}
    if request.args.get('roaster'):
        filters['roaster'] = request.args.get('roaster')
    if request.args.get('bean_type'):
        filters['bean_type'] = request.args.get('bean_type')
    if request.args.get('country'):
        filters['country'] = request.args.get('country')
    
    if filters:
        filtered_products = enriched_products
        
        if 'roaster' in filters:
            filtered_products = [p for p in filtered_products 
                               if p.get('roaster') and p['roaster'].get('name') == filters['roaster']]
        
        if 'bean_type' in filters:
            filtered_products = [p for p in filtered_products 
                               if p.get('bean_type') and 
                               any(bt.get('name') == filters['bean_type'] for bt in p['bean_type'])]
        
        if 'country' in filters:
            filtered_products = [p for p in filtered_products 
                               if p.get('country') and p['country'].get('name') == filters['country']]
        
        return jsonify(filtered_products)
    
    return jsonify(enriched_products)


@products_bp.route('/products/<int:product_id>', methods=['GET'])
def get_product(product_id):
    """Get a specific product."""
    factory = get_repository_factory()
    product = factory.get_product_repository().find_by_id(product_id)
    
    if not product:
        return jsonify({'error': 'Product not found'}), 404
    
    # Enrich product with lookup objects
    enriched_product = enrich_product_with_lookups(product.copy(), factory)
    
    return jsonify(enriched_product)


@products_bp.route('/products', methods=['POST'])
def create_product():
    """Create a new product."""
    factory = get_repository_factory()
    data = request.json
    
    # Validate required fields
    if not data.get('roaster') and not data.get('roaster_id') and not data.get('roaster_name'):
        return jsonify({'error': 'Roaster is required'}), 400
    
    # Resolve lookup fields using new helper
    roaster_result = resolve_lookup_field(data, 'roaster', factory.get_roaster_repository())
    if not roaster_result['item']:
        return jsonify({'error': 'Invalid roaster'}), 400
    
    bean_type_result = resolve_lookup_field(data, 'bean_type', factory.get_bean_type_repository(), allow_multiple=True)
    country_result = resolve_lookup_field(data, 'country', factory.get_country_repository())
    region_result = resolve_lookup_field(data, 'region', factory.get_country_repository(), allow_multiple=True)
    
    # Handle decaf method
    decaf_method_result = {'item': None, 'id': None, 'name': None}
    if data.get('decaf') and (data.get('decaf_method') or data.get('decaf_method_id')):
        decaf_method_result = resolve_lookup_field(data, 'decaf_method', factory.get_decaf_method_repository())
    
    # Create product data
    product_data = {
        'roaster': roaster_result['name'],
        'roaster_id': roaster_result['id'],
        'bean_type': bean_type_result['names'],
        'bean_type_id': bean_type_result['ids'],
        'country': country_result['name'],
        'country_id': country_result['id'],
        'region': region_result['names'],
        'region_id': region_result['ids'],
        'product_name': data.get('product_name'),
        'roast_type': safe_int(data.get('roast_type')),
        'description': data.get('description'),
        'url': data.get('url'),
        'image_url': data.get('image_url'),
        'decaf': data.get('decaf', False),
        'decaf_method': decaf_method_result['name'],
        'decaf_method_id': decaf_method_result['id'],
        'rating': safe_int(data.get('rating')),
        'bean_process': data.get('bean_process'),
        'notes': data.get('notes')
    }
    
    product = factory.get_product_repository().create(product_data)
    enriched_product = enrich_product_with_lookups(product, factory)
    return jsonify(enriched_product), 201


@products_bp.route('/products/<int:product_id>', methods=['PUT'])
def update_product(product_id):
    """Update a product."""
    factory = get_repository_factory()
    data = request.json
    
    # Check if product exists
    product_repo = factory.get_product_repository()
    existing_product = product_repo.find_by_id(product_id)
    if not existing_product:
        return jsonify({'error': 'Product not found'}), 404
    
    # Validate required fields
    if not data.get('roaster') and not data.get('roaster_id') and not data.get('roaster_name'):
        return jsonify({'error': 'Roaster is required'}), 400
    
    # Resolve lookup fields using new helper
    roaster_result = resolve_lookup_field(data, 'roaster', factory.get_roaster_repository())
    if not roaster_result['item']:
        return jsonify({'error': 'Invalid roaster'}), 400
    
    bean_type_result = resolve_lookup_field(data, 'bean_type', factory.get_bean_type_repository(), allow_multiple=True)
    country_result = resolve_lookup_field(data, 'country', factory.get_country_repository())
    region_result = resolve_lookup_field(data, 'region', factory.get_country_repository(), allow_multiple=True)
    
    # Handle decaf method
    decaf_method_result = {'item': None, 'id': None, 'name': None}
    if data.get('decaf') and (data.get('decaf_method') or data.get('decaf_method_id')):
        decaf_method_result = resolve_lookup_field(data, 'decaf_method', factory.get_decaf_method_repository())
    
    # Update product data
    product_data = {
        'roaster': roaster_result['name'],
        'roaster_id': roaster_result['id'],
        'bean_type': bean_type_result['names'],
        'bean_type_id': bean_type_result['ids'],
        'country': country_result['name'],
        'country_id': country_result['id'],
        'region': region_result['names'],
        'region_id': region_result['ids'],
        'product_name': data.get('product_name'),
        'roast_type': safe_int(data.get('roast_type')),
        'description': data.get('description'),
        'url': data.get('url'),
        'image_url': data.get('image_url'),
        'decaf': data.get('decaf', False),
        'decaf_method': decaf_method_result['name'],
        'decaf_method_id': decaf_method_result['id'],
        'rating': safe_int(data.get('rating')),
        'bean_process': data.get('bean_process'),
        'notes': data.get('notes')
    }
    
    product = product_repo.update(product_id, product_data)
    enriched_product = enrich_product_with_lookups(product, factory)
    return jsonify(enriched_product)


@products_bp.route('/products/<int:product_id>', methods=['DELETE'])
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


@products_bp.route('/products/<int:product_id>/batches', methods=['GET', 'POST'])
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
        enriched_product = enrich_product_with_lookups(product, factory)
        for batch in batches:
            roaster_name = enriched_product.get('roaster', {}).get('name', 'N/A') if enriched_product.get('roaster') else 'N/A'
            bean_type_names = ', '.join([bt.get('name', 'N/A') for bt in enriched_product.get('bean_type', [])]) if enriched_product.get('bean_type') else 'N/A'
            batch['product_name'] = f"{roaster_name} - {bean_type_names}"
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
            'rating': safe_int(data.get('rating')),
            'is_active': data.get('is_active', True)  # Default to active
        }
        
        batch_repo = factory.get_batch_repository()
        batch = batch_repo.create(batch_data)
        
        # Enrich with product information and calculate price per cup
        enriched_product = enrich_product_with_lookups(product, factory)
        roaster_name = enriched_product.get('roaster', {}).get('name', 'N/A') if enriched_product.get('roaster') else 'N/A'
        bean_type_names = ', '.join([bt.get('name', 'N/A') for bt in enriched_product.get('bean_type', [])]) if enriched_product.get('bean_type') else 'N/A'
        batch['product_name'] = f"{roaster_name} - {bean_type_names}"
        batch['price_per_cup'] = calculate_price_per_cup(batch.get('price'), batch.get('amount_grams'))
        
        return jsonify(batch), 201
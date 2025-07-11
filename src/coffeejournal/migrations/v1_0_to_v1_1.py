"""
Example migration from version 1.0 to 1.1.

This is a template showing how future migrations would be implemented.
"""

import json
import os
from . import get_migration_manager

def migrate_1_0_to_1_1(data_dir: str):
    """
    Example migration from version 1.0 to 1.1.
    
    This is a template for future migrations. For example, if we wanted to:
    - Add a new field to products
    - Rename a field in brew_sessions  
    - Add a new lookup table
    """
    
    # Example: Add 'origin_story' field to all products
    products_file = os.path.join(data_dir, 'products.json')
    if os.path.exists(products_file):
        with open(products_file, 'r') as f:
            products = json.load(f)
        
        # Add new field with default value
        for product in products:
            if 'origin_story' not in product:
                product['origin_story'] = ""
        
        with open(products_file, 'w') as f:
            json.dump(products, f, indent=2)
    
    # Example: Create new lookup table for processing_methods
    processing_methods_file = os.path.join(data_dir, 'processing_methods.json')
    if not os.path.exists(processing_methods_file):
        default_processing_methods = [
            {"id": 1, "name": "Washed"},
            {"id": 2, "name": "Natural"},
            {"id": 3, "name": "Honey"},
            {"id": 4, "name": "Semi-washed"}
        ]
        
        with open(processing_methods_file, 'w') as f:
            json.dump(default_processing_methods, f, indent=2)
    
    print("Migration 1.0 -> 1.1 completed")

# Register the migration
migration_manager = get_migration_manager("")  # Will be set properly when used
migration_manager.register_migration("1.0", "1.1")(migrate_1_0_to_1_1)
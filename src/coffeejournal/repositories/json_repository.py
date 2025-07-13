import json
import os
from typing import List, Optional, Dict, Any
from datetime import datetime, date, timezone
from pathlib import Path
import threading
from .base import BaseRepository, LookupRepository


class JSONEncoder(json.JSONEncoder):
    """Custom JSON encoder for datetime and date objects."""
    def default(self, obj):
        if isinstance(obj, (datetime, date)):
            return obj.isoformat()
        return super().default(obj)


class JSONRepositoryBase(BaseRepository):
    """Base class for JSON file-based repository implementation."""
    
    def __init__(self, data_dir: str, filename: str):
        self.data_dir = Path(data_dir)
        self.data_dir.mkdir(exist_ok=True)
        self.filepath = self.data_dir / filename
        self._lock = threading.Lock()
        self._ensure_file_exists()
    
    def _ensure_file_exists(self):
        """Create file with empty list if it doesn't exist."""
        if not self.filepath.exists():
            with open(self.filepath, 'w') as f:
                json.dump([], f)
    
    def _read_data(self) -> List[Dict[str, Any]]:
        """Read data from JSON file."""
        with self._lock:
            with open(self.filepath, 'r') as f:
                return json.load(f)
    
    def _write_data(self, data: List[Dict[str, Any]]):
        """Write data to JSON file."""
        with self._lock:
            with open(self.filepath, 'w') as f:
                json.dump(data, f, indent=2, cls=JSONEncoder)
    
    def _get_next_id(self, data: List[Dict[str, Any]]) -> int:
        """Get next available ID."""
        if not data:
            return 1
        return max(item['id'] for item in data) + 1
    
    def find_all(self) -> List[Dict[str, Any]]:
        """Get all entities."""
        return self._read_data()
    
    def find_by_id(self, id: int) -> Optional[Dict[str, Any]]:
        """Get entity by ID."""
        data = self._read_data()
        for item in data:
            if item['id'] == id:
                return item
        return None
    
    def create(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """Create new entity."""
        all_data = self._read_data()
        new_item = data.copy()
        new_item['id'] = self._get_next_id(all_data)
        
        # Add audit timestamps
        now = datetime.now(timezone.utc).isoformat()
        new_item['created_at'] = now
        new_item['updated_at'] = now
        
        all_data.append(new_item)
        self._write_data(all_data)
        return new_item
    
    def update(self, id: int, data: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """Update existing entity."""
        all_data = self._read_data()
        for i, item in enumerate(all_data):
            if item['id'] == id:
                updated_item = data.copy()
                updated_item['id'] = id
                
                # Preserve created_at, update updated_at
                updated_item['created_at'] = item.get('created_at', datetime.now(timezone.utc).isoformat())
                updated_item['updated_at'] = datetime.now(timezone.utc).isoformat()
                
                all_data[i] = updated_item
                self._write_data(all_data)
                return updated_item
        return None
    
    def delete(self, id: int) -> bool:
        """Delete entity by ID."""
        all_data = self._read_data()
        original_len = len(all_data)
        all_data = [item for item in all_data if item['id'] != id]
        if len(all_data) < original_len:
            self._write_data(all_data)
            return True
        return False


class JSONLookupRepository(JSONRepositoryBase, LookupRepository):
    """JSON repository for lookup tables."""
    
    def find_by_name(self, name: str) -> Optional[Dict[str, Any]]:
        """Find entity by name (case-insensitive, whitespace-trimmed)."""
        if not name:
            return None
        normalized_name = name.strip().lower()
        data = self._read_data()
        for item in data:
            if item.get('name') and item['name'].strip().lower() == normalized_name:
                return item
        return None
    
    def find_by_short_form(self, short_form: str) -> Optional[Dict[str, Any]]:
        """Find entity by short_form."""
        if not short_form:  # Skip empty strings and None
            return None
        data = self._read_data()
        for item in data:
            if item.get('short_form') == short_form:
                return item
        return None
    
    def find_by_name_or_short_form(self, identifier: str) -> Optional[Dict[str, Any]]:
        """Find entity by name or short_form."""
        # Try name first
        result = self.find_by_name(identifier)
        if result:
            return result
        # Then try short_form
        return self.find_by_short_form(identifier)
    
    def get_or_create(self, name: str, **kwargs) -> Dict[str, Any]:
        """Get existing entity by name or create new one."""
        existing = self.find_by_name(name)
        if existing:
            return existing
        data = {'name': name}
        data.update(kwargs)
        return self.create(data)
    
    def get_or_create_by_identifier(self, identifier: str, **kwargs) -> Dict[str, Any]:
        """Get existing entity by name or short_form, or create new one."""
        # First try to find by name or short_form
        existing = self.find_by_name_or_short_form(identifier)
        if existing:
            return existing
        
        # If not found, create new one with the identifier as name
        data = {'name': identifier}
        data.update(kwargs)
        return self.create(data)
    
    def search(self, query: str) -> List[Dict[str, Any]]:
        """Search entities by substring match on name and short_form (if available)."""
        if not query:
            return []
        
        query_lower = query.lower()
        results = []
        
        for entity in self.find_all():
            # Check name field
            if entity.get('name') and query_lower in entity['name'].lower():
                results.append(entity)
                continue
            
            # Check short_form field if it exists
            if entity.get('short_form') and query_lower in entity['short_form'].lower():
                results.append(entity)
        
        return results
    
    def find_default(self) -> Optional[Dict[str, Any]]:
        """Find the default item (is_default=True)."""
        data = self._read_data()
        for item in data:
            if item.get('is_default') is True:
                return item
        return None
    
    def set_default(self, item_id: int) -> Dict[str, Any]:
        """Set an item as default, clearing any existing default."""
        all_data = self._read_data()
        updated_item = None
        
        # First pass: clear all existing defaults and find the item to set as default
        for item in all_data:
            if item['id'] == item_id:
                item['is_default'] = True
                updated_item = item
            elif item.get('is_default') is True:
                item['is_default'] = False
        
        if updated_item is None:
            raise ValueError(f"Item with id {item_id} not found")
        
        # Write back the changes
        self._write_data(all_data)
        return updated_item
    
    def clear_default(self, item_id: int) -> Dict[str, Any]:
        """Clear the default flag from an item."""
        all_data = self._read_data()
        updated_item = None
        
        for item in all_data:
            if item['id'] == item_id:
                item['is_default'] = False
                updated_item = item
                break
        
        if updated_item is None:
            raise ValueError(f"Item with id {item_id} not found")
        
        # Write back the changes
        self._write_data(all_data)
        return updated_item
    
    def get_smart_default(self, factory=None) -> Optional[Dict[str, Any]]:
        """Get smart default based on usage frequency and recency."""
        # First check if there's a manually set default
        manual_default = self.find_default()
        if manual_default:
            return manual_default
        
        # If no manual default, calculate smart default
        return self._calculate_smart_default(factory)
    
    def _calculate_smart_default(self, factory=None) -> Optional[Dict[str, Any]]:
        """Calculate smart default based on usage patterns."""
        # This is the base implementation - subclasses should override for specific logic
        items = self.find_all()
        if not items:
            return None
        
        # If only one item, return it
        if len(items) == 1:
            return items[0]
        
        # Default fallback: return the first item
        return items[0]


class RoasterRepository(JSONLookupRepository):
    """Repository for Roaster entities."""
    def __init__(self, data_dir: str):
        super().__init__(data_dir, 'roasters.json')
    
    def _calculate_smart_default(self, factory=None) -> Optional[Dict[str, Any]]:
        """Calculate smart default based on product usage patterns."""
        if factory is None:
            from .factory import get_repository_factory
            factory = get_repository_factory()
        
        roasters = self.find_all()
        if not roasters:
            return None
        
        if len(roasters) == 1:
            return roasters[0]
        
        # Get all products to calculate roaster usage
        products = factory.get_product_repository().find_all()
        
        # Calculate frequency and recency scores
        from datetime import datetime, timezone
        now = datetime.now(timezone.utc)
        roaster_scores = {}
        
        for roaster in roasters:
            roaster_id = roaster['id']
            roaster_products = [p for p in products if p.get('roaster_id') == roaster_id]
            
            frequency_score = len(roaster_products)
            recency_score = 0
            
            # Calculate recency score based on most recent product created_at
            for product in roaster_products:
                if 'created_at' in product:
                    try:
                        created_at = datetime.fromisoformat(product['created_at'].replace('Z', '+00:00'))
                        days_ago = (now - created_at).days
                        # Higher score for more recent items (max 30 days = score 1.0)
                        recency_score = max(recency_score, max(0, 1.0 - (days_ago / 30.0)))
                    except:
                        pass
            
            # Combined score: 70% frequency, 30% recency
            combined_score = (frequency_score * 0.7) + (recency_score * 0.3)
            roaster_scores[roaster_id] = combined_score
        
        # Return the roaster with highest score
        if roaster_scores:
            best_roaster_id = max(roaster_scores.keys(), key=lambda x: roaster_scores[x])
            return next(r for r in roasters if r['id'] == best_roaster_id)
        
        # Fallback to first roaster
        return roasters[0]


class BeanTypeRepository(JSONLookupRepository):
    """Repository for BeanType entities."""
    def __init__(self, data_dir: str):
        super().__init__(data_dir, 'bean_types.json')


class CountryRepository(JSONLookupRepository):
    """Repository for Country entities."""
    def __init__(self, data_dir: str):
        super().__init__(data_dir, 'countries.json')


class BrewMethodRepository(JSONLookupRepository):
    """Repository for BrewMethod entities."""
    def __init__(self, data_dir: str):
        super().__init__(data_dir, 'brew_methods.json')


class RecipeRepository(JSONLookupRepository):
    """Repository for Recipe entities."""
    def __init__(self, data_dir: str):
        super().__init__(data_dir, 'recipes.json')


class ProductRepository(JSONRepositoryBase):
    """Repository for CoffeeBeanProduct entities."""
    def __init__(self, data_dir: str):
        super().__init__(data_dir, 'products.json')
    
    def find_by_filters(self, filters: Dict[str, Any]) -> List[Dict[str, Any]]:
        """Find products matching filters."""
        products = self.find_all()
        filtered = products
        
        # Note: These filters expect string values but the data stores IDs.
        # For now, this method is not fully compatible with the ID-based structure.
        # Filtering should be done at the API level after enrichment.
        if 'roaster' in filters:
            # Legacy: look for roaster name in deprecated 'roaster' field
            filtered = [p for p in filtered if p.get('roaster') == filters['roaster']]
        if 'bean_type' in filters:
            # Legacy: look for bean_type name in deprecated 'bean_type' field
            filtered = [p for p in filtered if filters['bean_type'] in p.get('bean_type', [])]
        if 'country' in filters:
            # Legacy: look for country name in deprecated 'country' field
            filtered = [p for p in filtered if p.get('country') == filters['country']]
        
        return filtered


class BatchRepository(JSONRepositoryBase):
    """Repository for CoffeeBatch entities."""
    def __init__(self, data_dir: str):
        super().__init__(data_dir, 'batches.json')
    
    def find_by_product(self, product_id: int) -> List[Dict[str, Any]]:
        """Find all batches for a product."""
        batches = self.find_all()
        return [b for b in batches if b.get('product_id') == product_id]
    
    def delete_by_product(self, product_id: int) -> int:
        """Delete all batches for a product."""
        all_data = self._read_data()
        original_len = len(all_data)
        all_data = [item for item in all_data if item.get('product_id') != product_id]
        deleted_count = original_len - len(all_data)
        if deleted_count > 0:
            self._write_data(all_data)
        return deleted_count


class BrewSessionRepository(JSONRepositoryBase):
    """Repository for BrewSession entities."""
    def __init__(self, data_dir: str):
        super().__init__(data_dir, 'brew_sessions.json')
    
    def find_by_product(self, product_id: int) -> List[Dict[str, Any]]:
        """Find all brew sessions for a product."""
        sessions = self.find_all()
        return [s for s in sessions if s.get('product_id') == product_id]
    
    def find_by_batch(self, batch_id: int) -> List[Dict[str, Any]]:
        """Find all brew sessions for a batch."""
        sessions = self.find_all()
        return [s for s in sessions if s.get('product_batch_id') == batch_id]
    
    def delete_by_product(self, product_id: int) -> int:
        """Delete all brew sessions for a product."""
        all_data = self._read_data()
        original_len = len(all_data)
        all_data = [item for item in all_data if item.get('product_id') != product_id]
        deleted_count = original_len - len(all_data)
        if deleted_count > 0:
            self._write_data(all_data)
        return deleted_count
    
    def delete_by_batch(self, batch_id: int) -> int:
        """Delete all brew sessions for a batch."""
        all_data = self._read_data()
        original_len = len(all_data)
        all_data = [item for item in all_data if item.get('product_batch_id') != batch_id]
        deleted_count = original_len - len(all_data)
        if deleted_count > 0:
            self._write_data(all_data)
        return deleted_count


class GrinderRepository(JSONLookupRepository):
    """Repository for Grinder entities."""
    def __init__(self, data_dir: str):
        super().__init__(data_dir, 'grinders.json')
    
    def get_usage_stats(self, grinder_id: int, factory=None) -> Dict[str, Any]:
        """Get usage statistics for a grinder."""
        if factory is None:
            from .factory import get_repository_factory
            factory = get_repository_factory()
        
        # Get all brew sessions that used this grinder
        brew_sessions = factory.get_brew_session_repository().find_all()
        grinder_sessions = [s for s in brew_sessions if s.get('grinder_id') == grinder_id]
        
        total_grams_ground = 0
        total_brews = len(grinder_sessions)
        
        for session in grinder_sessions:
            coffee_amount = session.get('amount_coffee_grams', 0)
            if coffee_amount:
                total_grams_ground += coffee_amount
        
        # Get grinder details to add manual offset
        grinder = self.find_by_id(grinder_id)
        manual_offset = grinder.get('manually_ground_grams', 0) if grinder else 0
        
        total_with_offset = total_grams_ground + manual_offset
        
        return {
            'total_brews': total_brews,
            'total_grams_ground': total_grams_ground,
            'manually_ground_grams': manual_offset,
            'total_grams_with_manual': total_with_offset,
            'total_kilos': round(total_with_offset / 1000, 2) if total_with_offset >= 1000 else 0
        }
    
    def _calculate_smart_default(self, factory=None) -> Optional[Dict[str, Any]]:
        """Calculate smart default based on brew session usage patterns."""
        if factory is None:
            from .factory import get_repository_factory
            factory = get_repository_factory()
        
        grinders = self.find_all()
        if not grinders:
            return None
        
        if len(grinders) == 1:
            return grinders[0]
        
        # Get all brew sessions to calculate grinder usage
        sessions = factory.get_brew_session_repository().find_all()
        
        # Calculate frequency and recency scores
        from datetime import datetime, timezone
        now = datetime.now(timezone.utc)
        grinder_scores = {}
        
        for grinder in grinders:
            grinder_id = grinder['id']
            grinder_sessions = [s for s in sessions if s.get('grinder_id') == grinder_id]
            
            frequency_score = len(grinder_sessions)
            recency_score = 0
            
            # Calculate recency score based on most recent session
            for session in grinder_sessions:
                if 'created_at' in session:
                    try:
                        created_at = datetime.fromisoformat(session['created_at'].replace('Z', '+00:00'))
                        days_ago = (now - created_at).days
                        # Higher score for more recent items (max 7 days = score 1.0)
                        recency_score = max(recency_score, max(0, 1.0 - (days_ago / 7.0)))
                    except:
                        pass
            
            # Combined score: 60% frequency, 40% recency (recency more important for equipment)
            combined_score = (frequency_score * 0.6) + (recency_score * 0.4)
            grinder_scores[grinder_id] = combined_score
        
        # Return the grinder with highest score
        if grinder_scores and max(grinder_scores.values()) > 0:
            best_grinder_id = max(grinder_scores.keys(), key=lambda x: grinder_scores[x])
            return next(g for g in grinders if g['id'] == best_grinder_id)
        
        # Fallback to first grinder
        return grinders[0]


class DecafMethodRepository(JSONLookupRepository):
    """Repository for DecafMethod entities."""
    def __init__(self, data_dir: str):
        super().__init__(data_dir, 'decaf_methods.json')


class FilterRepository(JSONLookupRepository):
    """Repository for Filter entities."""
    def __init__(self, data_dir: str):
        super().__init__(data_dir, 'filters.json')


class KettleRepository(JSONLookupRepository):
    """Repository for Kettle entities."""
    def __init__(self, data_dir: str):
        super().__init__(data_dir, 'kettles.json')


class ScaleRepository(JSONLookupRepository):
    """Repository for Scale entities."""
    def __init__(self, data_dir: str):
        super().__init__(data_dir, 'scales.json')
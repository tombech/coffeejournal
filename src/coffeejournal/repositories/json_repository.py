import json
import os
from typing import List, Optional, Dict, Any
from datetime import datetime, date
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
        """Find entity by name."""
        data = self._read_data()
        for item in data:
            if item.get('name') == name:
                return item
        return None
    
    def get_or_create(self, name: str, **kwargs) -> Dict[str, Any]:
        """Get existing entity by name or create new one."""
        existing = self.find_by_name(name)
        if existing:
            return existing
        data = {'name': name}
        data.update(kwargs)
        return self.create(data)


class RoasterRepository(JSONLookupRepository):
    """Repository for Roaster entities."""
    def __init__(self, data_dir: str):
        super().__init__(data_dir, 'roasters.json')


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
        
        if 'roaster' in filters:
            filtered = [p for p in filtered if p.get('roaster') == filters['roaster']]
        if 'bean_type' in filters:
            filtered = [p for p in filtered if p.get('bean_type') == filters['bean_type']]
        if 'country' in filters:
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
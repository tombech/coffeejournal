import os
from typing import Dict, Any
from .json_repository import (
    RoasterRepository, BeanTypeRepository, CountryRepository,
    BrewMethodRepository, RecipeRepository, ProductRepository,
    BatchRepository, BrewSessionRepository, GrinderRepository,
    DecafMethodRepository, FilterRepository, KettleRepository,
    ScaleRepository
)


class RepositoryFactory:
    """Factory for creating repository instances."""
    
    def __init__(self, storage_type: str = 'json', **kwargs):
        self.storage_type = storage_type
        self.config = kwargs
        self._repositories = {}
    
    def _get_data_dir(self) -> str:
        """Get data directory path."""
        return self.config.get('data_dir', 'data')
    
    def get_roaster_repository(self) -> RoasterRepository:
        """Get or create roaster repository."""
        if 'roaster' not in self._repositories:
            if self.storage_type == 'json':
                self._repositories['roaster'] = RoasterRepository(self._get_data_dir())
            else:
                raise NotImplementedError(f"Storage type {self.storage_type} not implemented")
        return self._repositories['roaster']
    
    def get_bean_type_repository(self) -> BeanTypeRepository:
        """Get or create bean type repository."""
        if 'bean_type' not in self._repositories:
            if self.storage_type == 'json':
                self._repositories['bean_type'] = BeanTypeRepository(self._get_data_dir())
            else:
                raise NotImplementedError(f"Storage type {self.storage_type} not implemented")
        return self._repositories['bean_type']
    
    def get_country_repository(self) -> CountryRepository:
        """Get or create country repository."""
        if 'country' not in self._repositories:
            if self.storage_type == 'json':
                self._repositories['country'] = CountryRepository(self._get_data_dir())
            else:
                raise NotImplementedError(f"Storage type {self.storage_type} not implemented")
        return self._repositories['country']
    
    def get_brew_method_repository(self) -> BrewMethodRepository:
        """Get or create brew method repository."""
        if 'brew_method' not in self._repositories:
            if self.storage_type == 'json':
                self._repositories['brew_method'] = BrewMethodRepository(self._get_data_dir())
            else:
                raise NotImplementedError(f"Storage type {self.storage_type} not implemented")
        return self._repositories['brew_method']
    
    def get_recipe_repository(self) -> RecipeRepository:
        """Get or create recipe repository."""
        if 'recipe' not in self._repositories:
            if self.storage_type == 'json':
                self._repositories['recipe'] = RecipeRepository(self._get_data_dir())
            else:
                raise NotImplementedError(f"Storage type {self.storage_type} not implemented")
        return self._repositories['recipe']
    
    def get_product_repository(self) -> ProductRepository:
        """Get or create product repository."""
        if 'product' not in self._repositories:
            if self.storage_type == 'json':
                self._repositories['product'] = ProductRepository(self._get_data_dir())
            else:
                raise NotImplementedError(f"Storage type {self.storage_type} not implemented")
        return self._repositories['product']
    
    def get_batch_repository(self) -> BatchRepository:
        """Get or create batch repository."""
        if 'batch' not in self._repositories:
            if self.storage_type == 'json':
                self._repositories['batch'] = BatchRepository(self._get_data_dir())
            else:
                raise NotImplementedError(f"Storage type {self.storage_type} not implemented")
        return self._repositories['batch']
    
    def get_brew_session_repository(self) -> BrewSessionRepository:
        """Get or create brew session repository."""
        if 'brew_session' not in self._repositories:
            if self.storage_type == 'json':
                self._repositories['brew_session'] = BrewSessionRepository(self._get_data_dir())
            else:
                raise NotImplementedError(f"Storage type {self.storage_type} not implemented")
        return self._repositories['brew_session']
    
    def get_grinder_repository(self) -> GrinderRepository:
        """Get or create grinder repository."""
        if 'grinder' not in self._repositories:
            if self.storage_type == 'json':
                self._repositories['grinder'] = GrinderRepository(self._get_data_dir())
            else:
                raise NotImplementedError(f"Storage type {self.storage_type} not implemented")
        return self._repositories['grinder']
    
    def get_decaf_method_repository(self) -> DecafMethodRepository:
        """Get or create decaf method repository."""
        if 'decaf_method' not in self._repositories:
            if self.storage_type == 'json':
                self._repositories['decaf_method'] = DecafMethodRepository(self._get_data_dir())
            else:
                raise NotImplementedError(f"Storage type {self.storage_type} not implemented")
        return self._repositories['decaf_method']
    
    def get_filter_repository(self) -> FilterRepository:
        """Get or create filter repository."""
        if 'filter' not in self._repositories:
            if self.storage_type == 'json':
                self._repositories['filter'] = FilterRepository(self._get_data_dir())
            else:
                raise NotImplementedError(f"Storage type {self.storage_type} not implemented")
        return self._repositories['filter']
    
    def get_kettle_repository(self) -> KettleRepository:
        """Get or create kettle repository."""
        if 'kettle' not in self._repositories:
            if self.storage_type == 'json':
                self._repositories['kettle'] = KettleRepository(self._get_data_dir())
            else:
                raise NotImplementedError(f"Storage type {self.storage_type} not implemented")
        return self._repositories['kettle']
    
    def get_scale_repository(self) -> ScaleRepository:
        """Get or create scale repository."""
        if 'scale' not in self._repositories:
            if self.storage_type == 'json':
                self._repositories['scale'] = ScaleRepository(self._get_data_dir())
            else:
                raise NotImplementedError(f"Storage type {self.storage_type} not implemented")
        return self._repositories['scale']


# Global factory instance
_factory = None


def get_repository_factory() -> RepositoryFactory:
    """Get the global repository factory instance."""
    global _factory
    if _factory is None:
        _factory = RepositoryFactory()
    return _factory


def init_repository_factory(storage_type: str = 'json', **kwargs):
    """Initialize the global repository factory."""
    global _factory
    _factory = RepositoryFactory(storage_type, **kwargs)